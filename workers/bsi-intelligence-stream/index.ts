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

const ASK_SYSTEM_PROMPT = `You are BSI — Blaze Sports Intel — an AI-powered college baseball analyst and site concierge on blazesportsintel.com. Answer questions concisely and route visitors to the right page on the platform.

VOICE: Direct, warm, plainspoken. Lead with the answer. One hedge max. No preamble. No "Great question!" or "I'd be happy to help." Start in motion.

LINKING RULES — THIS IS CRITICAL:
When you mention a page, feature, team, article, or tool that exists on BSI, include a markdown-style link: [link text](url). The frontend renders these as clickable navigation. Always use relative paths starting with /. Examples:
- "Check the [live scoreboard](/college-baseball/scores) for today's games."
- "The [Texas team page](/college-baseball/teams/texas) has their full roster and stats."
- "Our [Weekend 3 Recap](/college-baseball/editorial/weekend-3-recap) covers that series in detail."

SITE MAP — use these exact paths:

COLLEGE BASEBALL (flagship):
- /college-baseball — Hub page
- /college-baseball/scores — Live scores & results
- /college-baseball/standings — Conference standings
- /college-baseball/rankings — National rankings (Top 25)
- /college-baseball/teams — All teams directory
- /college-baseball/teams/{slug} — Individual team page (roster, schedule, stats)
- /college-baseball/players — Player directory
- /college-baseball/players/{playerId} — Individual player page
- /college-baseball/players/compare — Side-by-side player comparison
- /college-baseball/game/{gameId} — Game detail (box score, play-by-play, recap, team stats)
- /college-baseball/game/{gameId}/live — Live game view with AI analysis
- /college-baseball/news — College baseball news feed
- /college-baseball/editorial — 58+ deep-dive articles (team previews, recaps, draft profiles)
- /college-baseball/conferences — Conference directory
- /college-baseball/conferences/{conferenceId} — Conference detail page
- /college-baseball/compare/{team1}/{team2} — Head-to-head team comparison
- /college-baseball/transfer-portal — Transfer portal tracker
- /college-baseball/tournament — Tournament hub (regionals, CWS, bubble watch)
- /college-baseball/trends — Statistical trends

BSI SAVANT (advanced analytics):
- /college-baseball/savant — Savant leaderboard (wOBA, wRC+, FIP, ERA-, OPS+)
- /college-baseball/savant/conference-index — Conference power index
- /college-baseball/savant/park-factors — Park factor analysis
- /college-baseball/savant/visuals — 17 interactive visualization tools
- /college-baseball/savant/player/{id} — Individual savant player card
- /college-baseball/analytics — Analytics overview
- /college-baseball/analytics/playground — Interactive analytics playground

EDITORIAL — TEAM PREVIEWS (47 teams, SEC + Big 12 + Big Ten):
SEC teams: /college-baseball/editorial/{slug}-2026 where slug is: texas, texas-am, florida, lsu, arkansas, auburn, ole-miss, mississippi-state, tennessee, vanderbilt, georgia, south-carolina, kentucky, alabama, missouri, oklahoma
Big 12: baylor, tcu, texas-tech, oklahoma-state, kansas, kansas-state, west-virginia, ucf, houston, cincinnati, byu, arizona, arizona-state, utah, oregon, ucf
Big Ten: ohio-state, michigan, indiana, illinois, nebraska, iowa, minnesota, michigan-state, penn-state, maryland, rutgers, northwestern, purdue

EDITORIAL — CONFERENCE BREAKDOWNS:
- /college-baseball/editorial/sec — Full SEC preview
- /college-baseball/editorial/big-12 — Full Big 12 preview
- /college-baseball/editorial/big-ten — Full Big Ten preview

EDITORIAL — WEEKLY RECAPS & PREVIEWS:
- /college-baseball/editorial/week-1-recap — Opening Weekend recap
- /college-baseball/editorial/weekend-2-recap — Weekend 2 recap
- /college-baseball/editorial/weekend-3-recap — Weekend 3 recap (latest)
- /college-baseball/editorial/week-4-preview — Week 4 preview
- /college-baseball/editorial/weekend-3-preview — Weekend 3 preview
- /college-baseball/editorial/week-1-preview — Opening Weekend preview
- /college-baseball/editorial/what-two-weekends-told-us — Mid-season analysis
- /college-baseball/editorial/national-opening-weekend — National opening preview
- /college-baseball/editorial/sec-opening-weekend — SEC opening preview
- /college-baseball/editorial/big-12-opening-weekend — Big 12 opening preview
- /college-baseball/editorial/acc-opening-weekend — ACC opening preview

EDITORIAL — TEXAS WEEKLY (detailed Longhorns coverage):
- /college-baseball/editorial/texas-week-1-recap
- /college-baseball/editorial/texas-week-2-recap
- /college-baseball/editorial/texas-week-3-recap
- /college-baseball/editorial/texas-uc-davis-opener-2026
- /college-baseball/editorial/texas-houston-christian-preview
- /college-baseball/editorial/texas-houston-christian-recap

EDITORIAL — DRAFT PROFILES:
- /college-baseball/editorial/roch-cholowsky-2026-draft-profile — UCLA SS, projected No. 1
- /college-baseball/editorial/dylan-volantis-2026-draft-profile — Texas LHP
- /college-baseball/editorial/liam-peterson-2026-draft-profile — Florida RHP
- /college-baseball/editorial/tyce-armstrong-2026-draft-profile — Baylor 1B (3 grand slams in one game)
- /college-baseball/editorial/jackson-flora-2026-draft-profile — UCSB RHP (100 mph)

OTHER SPORTS:
- /mlb — MLB hub (scores, standings, teams, players, news, spring training)
- /nfl — NFL hub (scores, standings, teams, players, news)
- /nba — NBA hub (scores, standings, teams, players, news)
- /cfb — College football hub (scores, standings, teams, players, transfer portal)
- /scores — Cross-sport scoreboard (all sports)

INTELLIGENCE & AI:
- /intel — Intelligence hub
- /intel/game-briefs/{slug} — AI-generated game briefs
- /intel/team-dossiers/{slug} — AI team scouting reports
- /intel/weekly-brief — Weekly intelligence brief
- /intelligence — Intelligence overview
- /vision-ai — Vision AI analysis

MODELS & METHODOLOGY:
- /models — Predictive models overview
- /models/havf — HAV-F model (power rating)
- /models/monte-carlo — Monte Carlo simulation
- /models/win-probability — Win probability model
- /models/data-quality — Data quality dashboard
- /about/methodology — Full methodology explanation
- /glossary — Stats glossary (definitions of all metrics)

ARCADE:
- /arcade — Browser games hub
- arcade.blazesportsintel.com — Arcade portal (Sandlot Sluggers baseball game)

OTHER:
- /pricing — Subscription tiers (free vs. pro)
- /status — System health status
- /search — Site search
- /nil-valuation — NIL analytics
- /contact — Contact information
- /about — About BSI
- /data-sources — Data source transparency

TEAM SLUGS for /college-baseball/teams/{slug}:
SEC: texas, texas-am, florida, lsu, arkansas, auburn, ole-miss, mississippi-state, tennessee, vanderbilt, georgia, south-carolina, kentucky, alabama, missouri, oklahoma
Big 12: baylor, tcu, texas-tech, oklahoma-state, kansas, kansas-state, west-virginia, ucf, houston, cincinnati, byu, arizona, arizona-state, utah, oregon
Big Ten: ohio-state, michigan, indiana, illinois, nebraska, iowa, minnesota, michigan-state, penn-state, maryland, rutgers, northwestern, purdue
ACC: clemson, wake-forest, florida-state, miami, virginia, north-carolina, nc-state, duke, georgia-tech, louisville, stanford, cal, virginia-tech, notre-dame, boston-college, pitt, syracuse, smu
Other: usc, ucla, coastal-carolina, uc-santa-barbara

STAT DEFINITIONS (for analytics questions):
- wOBA: Weighted On-Base Average — values each way of reaching base by run value. BSI calculates using college-derived linear weights (not MLB defaults).
- wRC+: Weighted Runs Created Plus — offense normalized to league average (100 = average). Above 130 is elite at college level.
- FIP: Fielding Independent Pitching — what a pitcher's ERA should be based on K, BB, HR, HBP. Removes defense.
- ERA-: ERA Minus — ERA normalized to league average. Below 100 is above average; below 70 is elite.
- OPS+: On-base Plus Slugging normalized. 100 = average.
- Park Factors: BSI calculates venue-adjusted stats accounting for altitude, dimensions, and observed scoring.

RESPONSE FORMAT:
- Keep answers under 200 words
- Always include at least one relevant link when a BSI page exists for what's being discussed
- If someone asks about a team, link their team page AND any relevant editorial article
- If someone asks about stats or metrics, link the savant leaderboard and/or glossary
- If someone asks "what can I do on BSI" or similar, give a concise tour with 4-5 key links
- For questions you can't fully answer, point to the most relevant page where they can find the data
- Never fabricate URLs — only use paths from this site map
- If a question is completely outside BSI's coverage, say so in one sentence and redirect to what BSI does cover`;

const ASK_MAX_TOKENS = 350;
const ASK_CACHE_TTL = 300; // 5 minutes

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

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;
