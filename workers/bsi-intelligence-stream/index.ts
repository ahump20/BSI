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
  BSI_KEYS: KVNamespace;
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

interface TeamStats {
  batting: { wrcPlus: number; obp: number; slg: number };
  pitching: { fip: number; eraMinus: number; kPct: number; bbPct: number };
}

interface MatchupRequest {
  homeTeam: string;
  awayTeam: string;
  gameId?: string;
  gameTime?: string;
  sport: Sport;
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

interface MatchupCard {
  keyEdge: string;
  offense: {
    home: { teamName: string; wrcPlus: number; obp: number; slg: number };
    away: { teamName: string; wrcPlus: number; obp: number; slg: number };
  };
  pitching: {
    home: { teamName: string; fip: number; eraMinus: number; kPct: number; bbPct: number };
    away: { teamName: string; fip: number; eraMinus: number; kPct: number; bbPct: number };
  };
  prediction: {
    favoriteTeam: string;
    winProbability: number;
    predictedTotal: number;
  };
  fullAnalysis: string;
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

const MATCHUP_SYSTEM_PROMPT = `You are BSI — Blaze Sports Intel analytics engine. You produce structured matchup analysis as valid JSON only.

You MUST respond with ONLY a valid JSON object. No prose, markdown, code fences, or explanation outside the JSON.

Required JSON schema:
{
  "keyEdge": "string — single sentence identifying the decisive competitive advantage",
  "offense": {
    "home": { "teamName": "string", "wrcPlus": number, "obp": number, "slg": number },
    "away": { "teamName": "string", "wrcPlus": number, "obp": number, "slg": number }
  },
  "pitching": {
    "home": { "teamName": "string", "fip": number, "eraMinus": number, "kPct": number, "bbPct": number },
    "away": { "teamName": "string", "fip": number, "eraMinus": number, "kPct": number, "bbPct": number }
  },
  "prediction": {
    "favoriteTeam": "string — exactly one of the two team names",
    "winProbability": number,
    "predictedTotal": number
  },
  "fullAnalysis": "string — 400-550 token prose analysis"
}

Rules:
- keyEdge must name a specific team and reason, not it's a toss-up
- fullAnalysis leads with the claim, no throat-clearing, no headers or bullets
- If stats are absent, reason from what you know about these programs and conference context
- winProbability range: 51 (near coin flip) to 75 (heavy favorite)
- predictedTotal is total combined runs, use one decimal place`;

const MATCHUP_CACHE_TTL = 6 * 3600; // 6 hours

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

const ASK_SYSTEM_PROMPT = `You are BSI — Blaze Sports Intel — a site concierge and sports analytics assistant on blazesportsintel.com. You answer questions AND route visitors to the right page.

CORE BEHAVIOR:
- Answer the question directly in 2-4 sentences. Start with the claim, not throat-clearing.
- When your answer relates to a BSI page, feature, team, or tool, embed navigation links using this exact syntax: [[link text|/path]]. Example: "Check the full leaderboard on [[BSI Savant|/college-baseball/savant]]."
- ALWAYS include at least one [[link]] per response. If you're discussing a team, link to their page. If a stat, link to Savant. If scores, link to scores. The visitor should never have to search for where to go next.
- Be concise but helpful. 150-250 words max.

BSI SITE MAP — use these paths in your [[links]]:

SPORTS HUBS:
- /college-baseball — D1 college baseball hub (BSI flagship)
- /college-baseball/scores — live college baseball scores
- /college-baseball/standings — conference standings
- /college-baseball/rankings — D1 national rankings
- /college-baseball/teams — browse all 300+ D1 teams
- /college-baseball/teams/{slug} — individual team page (slug is lowercase-hyphenated, e.g. "texas-longhorns", "vanderbilt-commodores", "lsu-tigers", "ole-miss-rebels")
- /college-baseball/savant — BSI Savant: park-adjusted wOBA, wRC+, FIP, OPS+, ERA- leaderboards
- /college-baseball/editorial — weekly recaps, previews, analysis articles
- /college-baseball/news — latest college baseball news
- /college-baseball/players — player search
- /college-baseball/transfer-portal — NCAA transfer portal tracker
- /college-baseball/tournament — tournament bracket/projections
- /mlb — MLB hub
- /nfl — NFL hub
- /nba — NBA hub
- /cfb — College football hub
- /scores — cross-sport live scoreboard (all sports)
- /wbc — World Baseball Classic 2026 (active March 5-17)

TOOLS & FEATURES:
- /college-baseball/savant — BSI Savant: the only free park-adjusted sabermetrics platform for D1 baseball
- /intel — AI-powered game briefs and team intelligence dossiers
- /college-baseball/compare — head-to-head team comparison tool
- /college-baseball/trends — statistical trend analysis
- /search — site-wide search

OTHER:
- /about — about BSI
- /pricing — subscription tiers (most features are free)
- /arcade — BSI Arcade (browser games)
- /status — system status

STAT EXPLAINERS (use when asked about metrics):
- wOBA = weighted on-base average, weights each way of reaching base by run value. BSI park-adjusts it.
- wRC+ = weighted runs created plus, normalized to 100 (league average). 120 = 20% above average.
- FIP = fielding independent pitching — isolates what the pitcher controls (K, BB, HR, HBP).
- OPS+ = on-base + slugging, park-adjusted and normalized to 100.
- ERA- = ERA minus, park-adjusted and normalized to 100. Lower is better (80 = 20% better than average).

TEAM SLUG RULES:
When mentioning a specific team, link to their page. Common slugs: texas-longhorns, vanderbilt-commodores, lsu-tigers, florida-gators, tennessee-volunteers, ole-miss-rebels, arkansas-razorbacks, texas-am-aggies, oregon-state-beavers, stanford-cardinal, wake-forest-demon-deacons, virginia-cavaliers, clemson-tigers, florida-state-seminoles, miami-hurricanes, louisville-cardinals, east-carolina-pirates, dallas-baptist-patriots.

VOICE:
- Direct. Warm without soft. No hype, no filler.
- If you don't know something specific, say so in one clause and point the visitor to where they can find it on the site.
- When a question is about live scores, say "check [[Live Scores|/scores]] for the latest" rather than guessing scores.
- Cover all five sports (college baseball, MLB, NFL, NBA, college football) — but college baseball is the flagship.`;

const ASK_MAX_TOKENS = 400;
const ASK_CACHE_TTL = 300; // 5 minutes

/** Resolve tier from API key in BSI_KEYS KV. Returns 'free' if missing/invalid. */
async function resolveTier(url: URL, headers: Headers, env: Env): Promise<string> {
  const keyValue = headers.get('X-BSI-Key') ?? url.searchParams.get('key') ?? '';
  if (!keyValue || !env.BSI_KEYS) return 'free';
  try {
    const raw = await env.BSI_KEYS.get(`key:${keyValue}`);
    if (!raw) return 'free';
    const data = JSON.parse(raw) as { tier?: string; expires?: number };
    if (data.expires && data.expires < Date.now()) return 'free';
    return data.tier || 'free';
  } catch {
    return 'free';
  }
}

function buildMatchupPrompt(req: MatchupRequest): string {
  const lines: string[] = [
    `Analyze this ${req.sport} matchup:`,
    `${req.awayTeam} (away) vs ${req.homeTeam} (home)${req.gameTime ? ` — ${req.gameTime}` : ''}`,
    '',
  ];

  if (req.homeStats) {
    lines.push(`${req.homeTeam} season stats:`);
    lines.push(`  Offense: wRC+ ${req.homeStats.batting.wrcPlus}, OBP ${req.homeStats.batting.obp.toFixed(3)}, SLG ${req.homeStats.batting.slg.toFixed(3)}`);
    lines.push(`  Pitching: FIP ${req.homeStats.pitching.fip.toFixed(2)}, ERA- ${req.homeStats.pitching.eraMinus}, K% ${req.homeStats.pitching.kPct.toFixed(1)}, BB% ${req.homeStats.pitching.bbPct.toFixed(1)}`);
    lines.push('');
  }

  if (req.awayStats) {
    lines.push(`${req.awayTeam} season stats:`);
    lines.push(`  Offense: wRC+ ${req.awayStats.batting.wrcPlus}, OBP ${req.awayStats.batting.obp.toFixed(3)}, SLG ${req.awayStats.batting.slg.toFixed(3)}`);
    lines.push(`  Pitching: FIP ${req.awayStats.pitching.fip.toFixed(2)}, ERA- ${req.awayStats.pitching.eraMinus}, K% ${req.awayStats.pitching.kPct.toFixed(1)}, BB% ${req.awayStats.pitching.bbPct.toFixed(1)}`);
    lines.push('');
  }

  if (!req.homeStats && !req.awayStats) {
    lines.push('No team stats provided. Reason from what you know about these programs and their conference context.');
    lines.push('');
  }

  lines.push('Return the matchup analysis JSON now.');
  return lines.join('\n');
}

async function streamFromAnthropic(
  apiKey: string,
  userMessage: string,
  maxTokens: number,
  systemPrompt: string = SYSTEM_PROMPT
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
      system: systemPrompt,
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
  allowHeaders: ['Content-Type', 'Authorization', 'X-BSI-Key'],
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

/**
 * POST /api/intelligence/ask
 *
 * Body: { question: string }
 * Response: SSE stream — general college baseball questions from homepage
 *
 * Cached for 5 min. No game context needed.
 */
app.post('/ask', async (c) => {
  const body = await c.req.json<{ question: string }>().catch(() => null);

  if (!body?.question || body.question.trim().length < 3) {
    return c.json({ error: 'question is required (min 3 chars)' }, 400);
  }

  const question = body.question.trim().slice(0, 300); // Cap input length
  const cacheKey = `ai:ask:${question.slice(0, 48).replace(/\s+/g, '-').toLowerCase()}`;

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

  // ── Stream from Anthropic ──
  let anthropicStream: ReadableStream<Uint8Array>;
  try {
    anthropicStream = await streamFromAnthropic(
      c.env.ANTHROPIC_API_KEY,
      question,
      ASK_MAX_TOKENS,
      ASK_SYSTEM_PROMPT
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: msg }, 502);
  }

  // ── Transform + cache ──
  const transformStream = buildTransformStream(async (fullText: string) => {
    if (fullText.length > 10) {
      await c.env.BSI_AI_CACHE.put(cacheKey, fullText, { expirationTtl: ASK_CACHE_TTL });
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

/**
 * POST /api/intelligence/v1/matchup
 *
 * Body: MatchupRequest — Response: MatchupCard JSON
 * Pro tier required. KV cached 6h.
 */
app.post('/v1/matchup', async (c) => {
  const url = new URL(c.req.url);
  const tier = await resolveTier(url, new Headers(Object.fromEntries(c.req.raw.headers)), c.env);
  if (tier !== 'pro') {
    return c.json({ error: 'Pro tier required', upgrade: '/pricing' }, 403);
  }

  const body = await c.req.json<MatchupRequest>().catch(() => null);
  if (!body?.homeTeam || !body?.awayTeam || !body?.sport) {
    return c.json({ error: 'homeTeam, awayTeam, and sport are required' }, 400);
  }

  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `matchup:${body.sport}:${body.homeTeam}:${body.awayTeam}:${body.gameId ?? today}`;
  const cached = await c.env.BSI_AI_CACHE.get(cacheKey, 'text');
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-BSI-Cache': 'HIT' },
    });
  }

  const userMessage = buildMatchupPrompt(body);
  let aiResponse: Response;
  try {
    aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': c.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        thinking: { type: 'adaptive' },
        output_config: { format: { type: 'json_object' } },
        system: MATCHUP_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: `AI service unreachable: ${msg}` }, 502);
  }

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    return c.json({ error: `AI service error ${aiResponse.status}`, detail: errText.slice(0, 200) }, 502);
  }

  const data = await aiResponse.json() as { content: Array<{ type: string; text: string }> };
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock?.text) {
    return c.json({ error: 'No text response from AI' }, 502);
  }

  const rawJson = textBlock.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  let card: MatchupCard;
  try {
    card = JSON.parse(rawJson) as MatchupCard;
  } catch {
    return c.json({ error: 'AI returned malformed JSON', raw: rawJson.slice(0, 500) }, 502);
  }

  await c.env.BSI_AI_CACHE.put(cacheKey, JSON.stringify(card), { expirationTtl: MATCHUP_CACHE_TTL });

  return new Response(JSON.stringify(card), {
    headers: {
      'Content-Type': 'application/json',
      'X-BSI-Cache': 'MISS',
      'X-BSI-Model': 'claude-opus-4-6',
    },
  });
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;
