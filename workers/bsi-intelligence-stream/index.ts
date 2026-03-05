/**
 * bsi-intelligence-stream
 *
 * Streams claude-sonnet-4-6 sports analysis via Server-Sent Events.
 * KV cache layer prevents redundant AI calls for identical game states.
 * Routes to blazesportsintel.com frontend over CORS.
 *
 * Deploy: wrangler deploy --config workers/bsi-intelligence-stream/wrangler.toml
 * Worker name: bsi-intelligence-stream
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Env {
  BSI_AI_CACHE: KVNamespace;
  ANTHROPIC_API_KEY: string;
}

type Sport = 'college-baseball' | 'mlb' | 'ncaa-football' | 'nfl';
type AnalysisType = 'live' | 'postgame' | 'pregame' | 'stat';

interface GameContext {
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  score?: string;
  inning?: string;        // e.g. "T7", "B3"
  outs?: number;
  pitcher?: string;
  pitchCount?: number;
  recentPlays?: string;   // Last 3 plays, comma-separated
  gameId?: string;
}

interface StreamRequest {
  question: string;
  context?: GameContext;
  analysisType?: AnalysisType;
}

interface AnthropicStreamChunk {
  type: string;
  delta?: { type: string; text: string };
  usage?: { input_tokens: number; output_tokens: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-6';

const MAX_TOKENS: Record<AnalysisType, number> = {
  live:      200,
  stat:      80,
  postgame:  350,
  pregame:   550,
};

const CACHE_TTL: Record<AnalysisType, number> = {
  live:     20,
  stat:     120,
  postgame: 3600,
  pregame:  21600,
};

const ANTHROPIC_STREAM_URL = 'https://api.anthropic.com/v1/messages';

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are BSI — Blaze Sports Intel — a sports analytics voice that covers MLB, college baseball, NCAA football, and NFL with equal depth. You are read by fans who already know the sport and want the layer underneath: sequencing logic, situational patterns, what the number means vs. what it implies.

CORE RULES:

1. LEAD WITH THE CLAIM. First sentence is the analysis. Never begin with "In this game…", "Looking at the data…", or any throat-clearing. Start in motion.

2. STREAM-AWARE STRUCTURE. Put the most valuable content first. If a user disconnects at 40% through, they should have 80% of the value.

3. DENSITY OVER VOLUME. 120 sharp words beats 300 padded words. Every sentence must add a fact, draw a connection, or push the argument forward.

4. ONE HEDGE MAXIMUM. If uncertain, say so once and commit. Do not stack qualifiers.

5. SPECIFICITY OVER ABSTRACTION. Name the player, the pitch type, the count, the inning. Ground every claim.

6. NO FORMATTING THEATER. Prose default. No headers or bullets unless explicitly requested.

7. SPORT VOICE CALIBRATION:
   - College baseball: Pitch sequencing, bullpen depth, conference context. This sport is underanalyzed — that gap is the point.
   - MLB: Assume Statcast literacy. Lead with xwOBA, exit velocity, spin axis when relevant.
   - NCAA football: EPA and success rate over yards. Scheme tendencies, not just results.
   - NFL: Down-and-distance tendencies, coverage shells, DVOA context.

8. BSI EDITORIAL VOICE: Direct. Warm without soft. Plainspoken without simple. Do not tell the user how to feel. Give them the material and let it land.

9. WHEN DATA IS ABSENT: Say so in one clause and work from what you know. Never fabricate numbers.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildContextPrefix(ctx: GameContext): string {
  const lines: string[] = [
    `[CONTEXT]`,
    `Sport: ${ctx.sport}`,
    `Game: ${ctx.homeTeam} vs ${ctx.awayTeam}${ctx.score ? ` — ${ctx.score}` : ''}`,
  ];

  if (ctx.inning) lines.push(`Inning: ${ctx.inning}${ctx.outs !== undefined ? `, ${ctx.outs} out(s)` : ''}`);
  if (ctx.pitcher) lines.push(`Pitcher: ${ctx.pitcher}${ctx.pitchCount ? ` (${ctx.pitchCount} pitches)` : ''}`);
  if (ctx.recentPlays) lines.push(`Recent: ${ctx.recentPlays}`);

  lines.push(`[END CONTEXT]`);
  return lines.join('\n');
}

function buildCacheKey(question: string, ctx: GameContext | undefined, type: AnalysisType): string {
  const base = ctx
    ? `ai:${ctx.sport}:${ctx.gameId ?? 'unknown'}:${type}:${ctx.score ?? ''}:${ctx.inning ?? ''}`
    : `ai:general:${type}`;

  // Short hash of the question to differentiate queries on same game
  const qHash = question.slice(0, 32).replace(/\s+/g, '-').toLowerCase();
  return `${base}:${qHash}`;
}

async function streamFromAnthropic(
  apiKey: string,
  userMessage: string,
  maxTokens: number
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(ANTHROPIC_STREAM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  if (!response.body) throw new Error('No response body from Anthropic');

  return response.body;
}

// Transform Anthropic SSE → BSI SSE, collecting full text for caching
function buildTransformStream(
  onComplete: (fullText: string) => void
): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed: AnthropicStreamChunk = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const text = parsed.delta.text;
            fullText += text;
            // Forward as BSI SSE event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
          if (parsed.type === 'message_stop') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            onComplete(fullText);
          }
        } catch {
          // Malformed chunk — skip silently
        }
      }
    },
    flush(controller) {
      // Drain remaining buffer
      if (buffer.trim()) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      }
      onComplete(fullText);
    },
  });
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>().basePath('/api/intelligence');

app.use('/*', cors({
  origin: ['https://blazesportsintel.com', 'https://www.blazesportsintel.com'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/health', (c) =>
  c.json({ status: 'ok', model: MODEL, timestamp: new Date().toISOString() })
);

/**
 * POST /api/v1/analyze
 *
 * Body: StreamRequest
 * Response: SSE stream of { text: string } events, terminated by { done: true }
 *
 * Cache hit returns full cached text as a single SSE event + done.
 */
app.post('/v1/analyze', async (c) => {
  const body = await c.req.json<StreamRequest>().catch(() => null);

  if (!body?.question) {
    return c.json({ error: 'question is required' }, 400);
  }

  const analysisType: AnalysisType = body.analysisType ?? 'live';
  const cacheKey = buildCacheKey(body.question, body.context, analysisType);
  const maxTokens = MAX_TOKENS[analysisType];

  // ── Cache check ──
  const cached = await c.env.BSI_AI_CACHE.get(cacheKey, 'text');
  if (cached) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: cached, cached: true })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-BSI-Cache': 'HIT',
      },
    });
  }

  // ── Build user message ──
  const userMessage = body.context
    ? `${buildContextPrefix(body.context)}\n\n${body.question}`
    : body.question;

  // ── Stream from Anthropic ──
  let anthropicStream: ReadableStream<Uint8Array>;
  try {
    anthropicStream = await streamFromAnthropic(c.env.ANTHROPIC_API_KEY, userMessage, maxTokens);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: msg }, 502);
  }

  // ── Transform + cache on complete ──
  const ttl = CACHE_TTL[analysisType];
  const transformStream = buildTransformStream(async (fullText: string) => {
    if (fullText.length > 10) {
      await c.env.BSI_AI_CACHE.put(cacheKey, fullText, { expirationTtl: ttl });
    }
  });

  const outputStream = anthropicStream.pipeThrough(transformStream);

  return new Response(outputStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-BSI-Cache': 'MISS',
      'X-BSI-Model': MODEL,
    },
  });
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;
