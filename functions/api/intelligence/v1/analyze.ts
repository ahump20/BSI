interface Env {
  ANTHROPIC_API_KEY: string;
  BSI_PROD_CACHE?: KVNamespace;
}

interface RequestBody {
  question: string;
  analysisType?: 'pregame' | 'live' | 'postgame' | 'general';
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `You are BSI — Blaze Sports Intel's AI analyst. You cover what mainstream sports media overlooks: athletes, programs, and markets outside the East and West Coast spotlight. Your analysis fuses old-school scouting instinct with sabermetrics and data. Be direct, specific, and analytical. No fluff. No filler. Name programs, players, and metrics by name. When you disagree with mainstream takes, say so and say why. Max 400 words.`;

// Simple in-memory rate limit map — resets on worker cold start
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // per minute per IP
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const ip =
    context.request.headers.get('CF-Connecting-IP') ??
    context.request.headers.get('X-Forwarded-For') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limited — try again in 60s' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Service not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  let body: RequestBody;
  try {
    body = (await context.request.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const { question, analysisType = 'general' } = body;
  if (!question?.trim()) {
    return new Response(JSON.stringify({ error: 'question is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Cache check (KV, 5min TTL for identical questions)
  const cacheKey = `intel:v1:${analysisType}:${question.slice(0, 200)}`;
  let cacheStatus = 'MISS';
  if (context.env.BSI_PROD_CACHE) {
    const cached = await context.env.BSI_PROD_CACHE.get(cacheKey);
    if (cached) {
      const { TransformStream } = globalThis as unknown as { TransformStream: typeof globalThis.TransformStream };
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      // Replay cached response as SSE
      void (async () => {
        const words = cached.split(' ');
        for (const word of words) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`));
        }
        await writer.write(encoder.encode(`data: [DONE]\n\n`));
        await writer.close();
      })();
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-BSI-Cache': 'HIT',
          ...CORS_HEADERS,
        },
      });
    }
  }

  // Stream from Anthropic
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'interleaved-thinking-2025-05-14',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question.trim() }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return new Response(JSON.stringify({ error: `Upstream error ${anthropicRes.status}`, details: err }), {
      status: anthropicRes.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Pipe Anthropic SSE → BSI SSE, accumulating for cache write
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let accumulated = '';

  void (async () => {
    try {
      const reader = anthropicRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as {
              type: string;
              delta?: { type: string; text?: string };
            };
            if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta' &&
              parsed.delta.text
            ) {
              accumulated += parsed.delta.text;
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }

      await writer.write(encoder.encode(`data: [DONE]\n\n`));

      // Write to cache (fire-and-forget)
      if (context.env.BSI_PROD_CACHE && accumulated) {
        void context.env.BSI_PROD_CACHE.put(cacheKey, accumulated, { expirationTtl: 300 });
      }
    } catch (err) {
      console.error('Stream error:', err);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-BSI-Cache': cacheStatus,
      ...CORS_HEADERS,
    },
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
};
