// Subscriber-tier intelligence endpoint.
// Auth-gated: requires valid bsi-session cookie or Authorization: Bearer token.
// Injects sport-specific context into the AI prompt before streaming.

interface Env {
  ANTHROPIC_API_KEY: string;
  JWT_SECRET?: string;
  BSI_PROD_CACHE?: KVNamespace;
  BSI_SPORTRADAR_CACHE?: KVNamespace;
  SPORTSDATAIO_API_KEY?: string;
}

interface RequestBody {
  sport: 'college-baseball' | 'mlb' | 'nfl' | 'cfb' | 'nba' | 'cbb';
  question: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SYSTEM_PROMPT = `You are BSI — Blaze Sports Intel's AI analyst. You have access to current live data injected below. Fuse that data with your analytical instincts: old-school scouting + sabermetrics. Be direct, specific, and analytical. No fluff. Cite the data you're given when it's relevant. Name programs, players, and metrics by name. When you disagree with mainstream takes, say so and say why. Max 500 words.`;

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getSessionToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null;
  }
  return getCookieValue(request.headers.get('Cookie'), 'bsi-session');
}

function decodeBase64Url(value: string): string | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return atob(padded);
  } catch {
    return null;
  }
}

async function verifySubscriberToken(token: string, jwtSecret?: string): Promise<boolean> {
  if (!jwtSecret) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [headerPart, payloadPart, signaturePart] = parts;

  const headerRaw = decodeBase64Url(headerPart);
  const payloadRaw = decodeBase64Url(payloadPart);
  const signatureRaw = decodeBase64Url(signaturePart);
  if (!headerRaw || !payloadRaw || !signatureRaw) return false;

  let payload: { exp?: number; tier?: string };
  try {
    payload = JSON.parse(payloadRaw) as { exp?: number; tier?: string };
  } catch {
    return false;
  }

  if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  if (payload.tier && !['pro', 'enterprise', 'subscriber'].includes(payload.tier)) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(signatureRaw, (c) => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(`${headerPart}.${payloadPart}`));
}

// ─── Context assembly ─────────────────────────────────────────────────────────

type Sport = RequestBody['sport'];

interface SportContext {
  data: string;
  fetchMs: number;
  source: string;
}

async function assembleSportContext(sport: Sport, env: Env): Promise<SportContext> {
  const fetchStart = Date.now();
  const lines: string[] = [];
  let source = 'cache';

  try {
    // Try KV cache first (fast path)
    if (env.BSI_SPORTRADAR_CACHE) {
      const cachedStandings = await env.BSI_SPORTRADAR_CACHE.get(`standings:${sport}`);
      if (cachedStandings) {
        lines.push(`=== Current Standings ===\n${cachedStandings}`);
        source = 'kv';
      }
    }

    if (env.BSI_PROD_CACHE) {
      // Transfer portal data for college sports
      if (sport === 'college-baseball' || sport === 'cfb' || sport === 'cbb') {
        const portal = await env.BSI_PROD_CACHE.get(`portal:${sport}:recent`);
        if (portal) lines.push(`=== Recent Transfer Portal Activity ===\n${portal}`);
      }

      // News ticker
      const news = await env.BSI_PROD_CACHE.get(`news:${sport}:latest`);
      if (news) lines.push(`=== Latest News ===\n${news}`);

      // Team stats
      const stats = await env.BSI_PROD_CACHE.get(`stats:${sport}:leaders`);
      if (stats) lines.push(`=== Statistical Leaders ===\n${stats}`);
    }
  } catch (err) {
    console.error('Context fetch error:', err);
    // Fail open — proceed without context rather than blocking the response
  }

  const fetchMs = Date.now() - fetchStart;

  if (lines.length === 0) {
    return {
      data: `[No live ${sport} data currently cached. Respond from your training knowledge and note this limitation.]`,
      fetchMs,
      source: 'none',
    };
  }

  // Cap at ~8,000 chars (~2,000 tokens) to stay well within context limits
  const raw = lines.join('\n\n');
  return {
    data: raw.length > 8_000 ? raw.slice(0, 8_000) + '\n[...truncated]' : raw,
    fetchMs,
    source,
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Auth gate
  const token = getSessionToken(context.request);
  const hasValidToken = token ? await verifySubscriberToken(token, context.env.JWT_SECRET) : false;
  if (!hasValidToken) {
    return new Response(
      JSON.stringify({ error: 'subscription_required', redirect: '/pricing' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
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

  const { sport, question } = body;
  if (!sport || !question?.trim()) {
    return new Response(JSON.stringify({ error: 'sport and question are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Assemble sport context with 2s timeout
  const contextResult = await Promise.race([
    assembleSportContext(sport, context.env),
    new Promise<SportContext>((resolve) =>
      setTimeout(
        () =>
          resolve({
            data: '[Live data fetch timed out — responding from training knowledge.]',
            fetchMs: 2000,
            source: 'timeout',
          }),
        2000
      )
    ),
  ]);

  const contextAsOf = new Date().toISOString();
  const userMessage = `${question.trim()}\n\n${contextResult.data}`;

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return new Response(JSON.stringify({ error: `Upstream error ${anthropicRes.status}`, details: err }), {
      status: anthropicRes.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

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
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }

      await writer.write(encoder.encode(`data: [DONE]\n\n`));
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
      'X-BSI-Cache': 'MISS',
      'X-BSI-Data-Fetch-Ms': String(contextResult.fetchMs),
      'X-BSI-Context-As-Of': contextAsOf,
      'X-BSI-Data-Source': contextResult.source,
      ...CORS_HEADERS,
    },
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS, 'Access-Control-Max-Age': '86400' },
  });
};
