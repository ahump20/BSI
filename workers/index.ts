/**
 * Blaze Sports Intel — Hybrid Workers Router
 *
 * This is the apex Worker that sits in front of blazesportsintel.com.
 * It handles:
 *   1. Dynamic API routes (/api/*)       — processed directly by this Worker
 *   2. College baseball data (/api/college-baseball/*) — proxied to Highlightly
 *   3. Game assets (/api/games/assets/*) — served from R2
 *   4. WebSocket connections (/ws)        — real-time leaderboard & scores
 *   5. Static assets & pages (everything else) — proxied to Cloudflare Pages
 *
 * The Pages project ("blazesportsintel") serves the Next.js static export.
 */

import {
  HighlightlyApiClient,
  createHighlightlyClient,
} from '../lib/api-clients/highlightly-api';
import type {
  HighlightlyApiResponse,
  HighlightlyMatch,
  HighlightlyPaginatedResponse,
  HighlightlyStandings,
  HighlightlyTeamDetail,
  HighlightlyPlayer,
  HighlightlyPlayerStats,
  HighlightlyBoxScore,
} from '../lib/api-clients/highlightly-api';
import { NcaaApiClient, createNcaaClient } from '../lib/api-clients/ncaa-api';
import { Tank01ApiClient, createTank01Client } from '../lib/api-clients/tank01-api';
import type { Tank01Response } from '../lib/api-clients/tank01-api';
import {
  computeBattingAdvanced,
  computePitchingAdvanced,
  aggregateTeamBatting,
  aggregateTeamPitching,
  compareBatters,
  comparePitchers,
  type BattingAdvanced,
  type PitchingAdvanced,
  type TeamAnalytics,
} from '../lib/analytics/sabermetrics';
import { parseTank01Batting, parseTank01Pitching, parseRoster } from '../lib/analytics/tank01-parser';

export interface Env {
  KV: KVNamespace;
  CACHE: DurableObjectNamespace;
  PORTAL_POLLER: DurableObjectNamespace;
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  ENVIRONMENT: string;
  API_VERSION: string;
  PAGES_ORIGIN: string;
  RAPIDAPI_KEY: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROD_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
  'https://blazecraft.app',
  'https://www.blazecraft.app',
]);

const DEV_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:8787',
]);

function corsOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin') ?? '';
  if (PROD_ORIGINS.has(origin)) return origin;
  if (env.ENVIRONMENT !== 'production' && DEV_ORIGINS.has(origin)) return origin;
  return '';
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': corsOrigin(request, env),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Request-scoped CORS headers. Set at the top of fetch() via requestScopedJson().
 * Using a module-level var is safe here because Workers execute fetch() to completion
 * before processing the next request on the same isolate — but we reset it per-request
 * to avoid stale references.
 */
let _activeRequest: Request | null = null;
let _activeEnv: Env | null = null;

function activeCorsHeaders(): Record<string, string> {
  return (_activeRequest && _activeEnv) ? corsHeaders(_activeRequest, _activeEnv) : {};
}

/** Standard security headers applied to all API responses */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS, ...activeCorsHeaders(), ...extra },
  });
}

/** HTTP cache durations by data category (seconds) */
const HTTP_CACHE: Record<string, number> = {
  scores: 30,
  standings: 300,
  rankings: 300,
  team: 600,
  player: 600,
  game: 30,
  trending: 120,
  schedule: 3600,
  news: 120,
};

function cachedJson(data: unknown, status: number, maxAge: number, extra: Record<string, string> = {}): Response {
  return json(data, status, { 'Cache-Control': `public, max-age=${maxAge}`, ...extra });
}

function matchRoute(
  pathname: string,
  pattern: string
): { params: Record<string, string> } | null {
  const pp = pattern.split('/');
  const sp = pathname.split('/');
  if (pp.length !== sp.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = sp[i];
    else if (pp[i] !== sp[i]) return null;
  }
  return { params };
}

/** Match routes with a wildcard suffix like /api/games/assets/:path+ */
function matchWildcardRoute(
  pathname: string,
  prefix: string
): string | null {
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  return rest || null;
}

// ---------------------------------------------------------------------------
// Rate limiting (simple KV-based sliding window)
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // max POST requests per IP per minute

async function checkRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = `rl:${ip}:${Math.floor(Date.now() / (RATE_LIMIT_WINDOW * 1000))}`;
  const count = parseInt((await kv.get(key)) || '0', 10);
  if (count >= RATE_LIMIT_MAX_REQUESTS) return false;
  await kv.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW * 2 });
  return true;
}

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

// ---------------------------------------------------------------------------
// KV Cache helpers
// ---------------------------------------------------------------------------

/** Cache TTLs in seconds by data type */
const CACHE_TTL: Record<string, number> = {
  scores: 60,       // KV minimum is 60s
  standings: 1800,  // 30 min
  rankings: 1800,
  teams: 86400,     // 24 hr
  players: 86400,
  games: 60,
  schedule: 300,    // 5 min
  trending: 300,
};

async function kvGet<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key, 'text');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function kvPut(kv: KVNamespace, key: string, data: unknown, ttl: number): Promise<void> {
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
}

// ---------------------------------------------------------------------------
// Error logging
// ---------------------------------------------------------------------------

async function logError(kv: KVNamespace, error: string, context: string): Promise<void> {
  try {
    const key = `errors:${Date.now()}`;
    await kv.put(
      key,
      JSON.stringify({ error, context, timestamp: new Date().toISOString() }),
      { expirationTtl: 86400 * 7 } // 7 days
    );
  } catch {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// Highlightly data headers
// ---------------------------------------------------------------------------

function dataHeaders(lastUpdated: string): Record<string, string> {
  return {
    'X-Last-Updated': lastUpdated,
    'X-Data-Source': 'highlightly',
  };
}

// ---------------------------------------------------------------------------
// Existing API route handlers
// ---------------------------------------------------------------------------

function handleHealth(env: Env): Response {
  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION ?? '1.0.0',
    environment: env.ENVIRONMENT ?? 'production',
    mode: 'hybrid-worker',
  });
}

/**
 * /api/kpi — Team sabermetric KPIs for a given MLB team.
 * Query: ?team=NYY (default: NYY)
 * Returns: team-level OPS, wOBA, ERA, FIP, WHIP, K/9 from the roster.
 */
async function handleKPI(url: URL, env: Env): Promise<Response> {
  const teamAbv = url.searchParams.get('team') || 'NYY';
  const cacheKey = `analytics:kpi:${teamAbv}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return json(cached, 200, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getMLBTeamRoster(teamAbv, true);

  if (!result.success || !result.data) {
    return json({ error: 'Unable to fetch roster', team: teamAbv }, 502);
  }

  const roster = Array.isArray(result.data.body) ? result.data.body : [];
  const { batters, pitchers } = parseRoster(roster as unknown as Record<string, unknown>[]);
  const battingAdvanced = batters.map(computeBattingAdvanced);
  const pitchingAdvanced = pitchers.map(computePitchingAdvanced);
  const teamBatting = aggregateTeamBatting(battingAdvanced);
  const teamPitching = aggregateTeamPitching(pitchingAdvanced);

  const hasStats = batters.length > 0 || pitchers.length > 0;
  const payload = {
    team: teamAbv,
    batting: teamBatting,
    pitching: teamPitching,
    rosterSize: { batters: batters.length, pitchers: pitchers.length },
    ...(hasStats ? {} : { notice: 'No season stats available — MLB season may not be active' }),
    timestamp: new Date().toISOString(),
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return json(payload, 200, { 'X-Cache': 'MISS' });
}

/**
 * /api/analytics/accuracy — Player comparison: batting advanced metrics for two players.
 * Query: ?p1=playerID1&p2=playerID2
 * Returns: side-by-side sabermetric comparison with advantage indicators.
 */
async function handleAccuracy(url: URL, env: Env): Promise<Response> {
  const p1Id = url.searchParams.get('p1');
  const p2Id = url.searchParams.get('p2');

  if (!p1Id || !p2Id) {
    return json({
      error: 'Provide ?p1=playerID&p2=playerID for player comparison',
      example: '/api/analytics/accuracy?p1=660271&p2=545361',
    }, 400);
  }

  const cacheKey = `analytics:compare:${p1Id}:${p2Id}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return json(cached, 200, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const [r1, r2] = await Promise.all([
    client.getMLBPlayer(p1Id),
    client.getMLBPlayer(p2Id),
  ]);

  if (!r1.success || !r1.data || !r2.success || !r2.data) {
    return json({ error: 'Unable to fetch one or both players' }, 502);
  }

  const raw1 = r1.data.body as unknown as Record<string, unknown>;
  const raw2 = r2.data.body as unknown as Record<string, unknown>;

  const bat1 = parseTank01Batting(raw1);
  const bat2 = parseTank01Batting(raw2);
  const pit1 = parseTank01Pitching(raw1);
  const pit2 = parseTank01Pitching(raw2);

  let comparison: unknown;
  if (bat1 && bat2) {
    comparison = compareBatters(computeBattingAdvanced(bat1), computeBattingAdvanced(bat2));
  } else if (pit1 && pit2) {
    comparison = comparePitchers(computePitchingAdvanced(pit1), computePitchingAdvanced(pit2));
  } else {
    return json({ error: 'Players must both be batters or both be pitchers for comparison' }, 400);
  }

  const payload = { comparison, timestamp: new Date().toISOString() };
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return json(payload, 200, { 'X-Cache': 'MISS' });
}

/**
 * /api/alerts/buckets — Team roster sabermetric tiers.
 * Buckets players into Elite / Above Avg / Average / Below Avg by OPS (batters) or FIP (pitchers).
 * Query: ?team=NYY&type=batting|pitching
 */
async function handleAlertBuckets(url: URL, env: Env): Promise<Response> {
  const teamAbv = url.searchParams.get('team') || 'NYY';
  const statType = url.searchParams.get('type') || 'batting';
  const cacheKey = `analytics:buckets:${teamAbv}:${statType}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return json(cached, 200, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getMLBTeamRoster(teamAbv, true);

  if (!result.success || !result.data) {
    return json({ error: 'Unable to fetch roster' }, 502);
  }

  const roster = Array.isArray(result.data.body) ? result.data.body : [];
  const { batters, pitchers } = parseRoster(roster as unknown as Record<string, unknown>[]);

  let payload: unknown;

  if (statType === 'pitching') {
    const advanced = pitchers.map(computePitchingAdvanced);
    const buckets = {
      elite: advanced.filter(p => p.fip < 3.0),
      aboveAvg: advanced.filter(p => p.fip >= 3.0 && p.fip < 3.75),
      average: advanced.filter(p => p.fip >= 3.75 && p.fip < 4.5),
      belowAvg: advanced.filter(p => p.fip >= 4.5),
    };
    payload = {
      team: teamAbv, type: 'pitching', metric: 'FIP',
      labels: ['Elite (<3.00)', 'Above Avg (3.00-3.75)', 'Average (3.75-4.50)', 'Below Avg (4.50+)'],
      counts: [buckets.elite.length, buckets.aboveAvg.length, buckets.average.length, buckets.belowAvg.length],
      buckets,
      timestamp: new Date().toISOString(),
    };
  } else {
    const advanced = batters.map(computeBattingAdvanced);
    const buckets = {
      elite: advanced.filter(b => b.ops >= 0.900),
      aboveAvg: advanced.filter(b => b.ops >= 0.750 && b.ops < 0.900),
      average: advanced.filter(b => b.ops >= 0.650 && b.ops < 0.750),
      belowAvg: advanced.filter(b => b.ops < 0.650),
    };
    payload = {
      team: teamAbv, type: 'batting', metric: 'OPS',
      labels: ['Elite (.900+)', 'Above Avg (.750-.900)', 'Average (.650-.750)', 'Below Avg (<.650)'],
      counts: [buckets.elite.length, buckets.aboveAvg.length, buckets.average.length, buckets.belowAvg.length],
      buckets,
      timestamp: new Date().toISOString(),
    };
  }

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return json(payload, 200, { 'X-Cache': 'MISS' });
}

/**
 * /api/teams/:league — Pull real standings data for the requested league.
 * Falls back to cached data. MLB uses Tank01 standings with win/loss;
 * NFL/NBA also from Tank01; NCAA from Highlightly.
 */
async function handleTeams(league: string, env: Env): Promise<Response> {
  const key = league.toUpperCase();
  const cacheKey = `teams:list:${key}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return json(cached, 200, { 'X-Cache': 'HIT' });

  try {
    if (key === 'MLB') {
      const client = getProClient(env);
      const result = await client.getMLBStandings();
      if (result.success && result.data) {
        const teams = (Array.isArray(result.data.body) ? result.data.body : []).map((t: Record<string, unknown>) => ({
          id: t.teamAbv ?? t.teamID,
          name: t.teamName ?? t.teamCity,
          league: 'MLB',
          stats: {
            wins: parseInt(String(t.wins ?? 0)),
            losses: parseInt(String(t.losses ?? 0)),
            winPct: parseFloat(String(t.winPercentage ?? '0')),
            division: t.division,
            conference: t.conference,
            gamesBack: t.gamesBack,
            streak: t.streak,
          },
        }));
        await kvPut(env.KV, cacheKey, teams, CACHE_TTL.standings);
        return json(teams, 200, { 'X-Cache': 'MISS' });
      }
    } else if (key === 'NFL') {
      const client = getProClient(env);
      const result = await client.getNFLStandings();
      if (result.success && result.data) {
        const teams = (Array.isArray(result.data.body) ? result.data.body : []).map((t: Record<string, unknown>) => ({
          id: t.teamAbv ?? t.teamID,
          name: t.teamName,
          league: 'NFL',
          stats: {
            wins: parseInt(String(t.wins ?? 0)),
            losses: parseInt(String(t.losses ?? 0)),
            ties: parseInt(String(t.ties ?? 0)),
            division: t.division,
            conference: t.conference,
            pointsFor: parseInt(String(t.pointsFor ?? 0)),
            pointsAgainst: parseInt(String(t.pointsAgainst ?? 0)),
          },
        }));
        await kvPut(env.KV, cacheKey, teams, CACHE_TTL.standings);
        return json(teams, 200, { 'X-Cache': 'MISS' });
      }
    } else if (key === 'NBA') {
      const client = getProClient(env);
      const result = await client.getNBAStandings();
      if (result.success && result.data) {
        const teams = (Array.isArray(result.data.body) ? result.data.body : []).map((t: Record<string, unknown>) => ({
          id: t.teamAbv ?? t.teamID,
          name: t.teamName,
          league: 'NBA',
          stats: {
            wins: parseInt(String(t.wins ?? 0)),
            losses: parseInt(String(t.losses ?? 0)),
            division: t.division,
            conference: t.conference,
            gamesBack: t.gamesBack,
            streak: t.streak,
          },
        }));
        await kvPut(env.KV, cacheKey, teams, CACHE_TTL.standings);
        return json(teams, 200, { 'X-Cache': 'MISS' });
      }
    }
  } catch {
    // Fall through to empty response
  }

  return json([], 200);
}

/**
 * /api/multiplayer/leaderboard — Read top scores from D1.
 * Query: ?game=blitz&limit=25 (default: all games, top 25)
 */
async function handleLeaderboard(url: URL, env: Env): Promise<Response> {
  const gameId = url.searchParams.get('game');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);

  try {
    let stmt;
    if (gameId) {
      stmt = env.DB.prepare(
        'SELECT player_name as name, score, avatar, game_id, updated_at FROM leaderboard WHERE game_id = ? ORDER BY score DESC LIMIT ?'
      ).bind(gameId, limit);
    } else {
      stmt = env.DB.prepare(
        'SELECT player_name as name, score, avatar, game_id, updated_at FROM leaderboard ORDER BY score DESC LIMIT ?'
      ).bind(limit);
    }

    const { results } = await stmt.all();
    return json(results ?? []);
  } catch (err) {
    // Table might not exist yet — return empty gracefully
    const msg = err instanceof Error ? err.message : 'D1 error';
    if (msg.includes('no such table')) {
      return json([]);
    }
    return json({ error: msg }, 500);
  }
}

/**
 * POST /api/multiplayer/leaderboard — Submit a score.
 * Body: { name: string, score: number, game: string, avatar?: string }
 */
async function handleLeaderboardSubmit(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { name?: string; score?: number; game?: string; avatar?: string };

  if (!body.name || typeof body.score !== 'number' || !body.game) {
    return json({ error: 'name, score (number), and game are required' }, 400);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO leaderboard (player_name, game_id, score, avatar, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(player_name, game_id) DO UPDATE SET
         score = MAX(leaderboard.score, excluded.score),
         avatar = excluded.avatar,
         updated_at = datetime('now')`
    ).bind(body.name, body.game, body.score, body.avatar || '🎮').run();

    return json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    return json({ error: msg }, 500);
  }
}

/**
 * /api/analytics/yearly-trend — Full roster advanced stat leaders for a team.
 * Query: ?team=NYY
 * Returns: top batters by wOBA and top pitchers by FIP for the roster.
 */
async function handleYearlyTrend(url: URL, env: Env): Promise<Response> {
  const teamAbv = url.searchParams.get('team') || 'NYY';
  const cacheKey = `analytics:leaders:${teamAbv}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return json(cached, 200, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getMLBTeamRoster(teamAbv, true);

  if (!result.success || !result.data) {
    return json({ error: 'Unable to fetch roster' }, 502);
  }

  const roster = Array.isArray(result.data.body) ? result.data.body : [];
  const { batters, pitchers } = parseRoster(roster as unknown as Record<string, unknown>[]);

  const battingLeaders = batters
    .map(computeBattingAdvanced)
    .filter(b => b.pa >= 50)
    .sort((a, b) => b.woba - a.woba)
    .slice(0, 10);

  const pitchingLeaders = pitchers
    .map(computePitchingAdvanced)
    .filter(p => p.ip >= 20)
    .sort((a, b) => a.fip - b.fip)
    .slice(0, 10);

  const payload = {
    team: teamAbv,
    battingLeaders,
    pitchingLeaders,
    metadata: {
      battingMetric: 'wOBA (weighted on-base average)',
      pitchingMetric: 'FIP (fielding independent pitching)',
      minPA: 50,
      minIP: 20,
    },
    timestamp: new Date().toISOString(),
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return json(payload, 200, { 'X-Cache': 'MISS' });
}

/**
 * /api/readiness — Team power rankings based on composite sabermetric score.
 * Query: ?teams=NYY,LAD,HOU,ATL (comma-separated, default top teams)
 * Returns: composite score per team from batting (OPS, wOBA) and pitching (FIP, K/9).
 */
async function handleReadiness(url: URL, env: Env): Promise<Response> {
  const teamsParam = url.searchParams.get('teams') || 'NYY,LAD,HOU,ATL';
  const teamList = teamsParam.split(',').map(t => t.trim().toUpperCase()).slice(0, 8);
  const cacheKey = `analytics:readiness:${teamList.join(',')}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return json(cached, 200, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const rankings: Array<{ team: string; composite: number; batting: ReturnType<typeof aggregateTeamBatting>; pitching: ReturnType<typeof aggregateTeamPitching> }> = [];

  for (const teamAbv of teamList) {
    try {
      const result = await client.getMLBTeamRoster(teamAbv, true);
      if (!result.success || !result.data) continue;

      const roster = Array.isArray(result.data.body) ? result.data.body : [];
      const { batters, pitchers } = parseRoster(roster as unknown as Record<string, unknown>[]);
      const batting = aggregateTeamBatting(batters.map(computeBattingAdvanced));
      const pitching = aggregateTeamPitching(pitchers.map(computePitchingAdvanced));

      // Composite: normalize OPS (0-1.2 range), wOBA (0-0.5), invert FIP (lower=better)
      const composite = Math.round(
        (batting.avgOps / 1.2) * 30 +
        (batting.avgWoba / 0.5) * 30 +
        (1 - pitching.avgFip / 6) * 25 +
        (pitching.avgKPer9 / 15) * 15
      );

      rankings.push({ team: teamAbv, composite, batting, pitching });
    } catch {
      // Skip failed teams
    }
  }

  rankings.sort((a, b) => b.composite - a.composite);

  const payload = {
    rankings,
    metadata: {
      formula: '30% OPS + 30% wOBA + 25% inverse-FIP + 15% K/9',
      scale: '0-100',
    },
    timestamp: new Date().toISOString(),
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return json(payload, 200, { 'X-Cache': 'MISS' });
}

/** 90-day TTL for lead data — aligns with privacy policy retention period */
const LEAD_TTL_SECONDS = 90 * 24 * 60 * 60;

async function handleLead(request: Request, env: Env): Promise<Response> {
  try {
    const lead = (await request.json()) as {
      name: string;
      email: string;
      organization?: string;
      sport?: string;
      message?: string;
      source?: string;
      consent?: boolean;
    };

    if (!lead.name || !lead.email) {
      return json({ error: 'Name and email are required' }, 400);
    }

    if (!isValidEmail(lead.email)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    if (lead.name.length > 200 || (lead.message && lead.message.length > 5000)) {
      return json({ error: 'Input exceeds maximum length' }, 400);
    }

    if (lead.consent !== true) {
      return json({ error: 'Consent to privacy policy is required' }, 400);
    }

    // Rate limit POST endpoints
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.KV && !(await checkRateLimit(env.KV, clientIP))) {
      return json({ error: 'Too many requests. Please try again later.' }, 429);
    }

    const consentedAt = new Date().toISOString();

    if (env.KV) {
      const key = `lead:${Date.now()}:${lead.email}`;
      await env.KV.put(key, JSON.stringify({ ...lead, consentedAt }), {
        expirationTtl: LEAD_TTL_SECONDS,
        metadata: { timestamp: consentedAt },
      });
    }

    if (env.DB) {
      try {
        // NOTE: Run migration to add consented_at column:
        //   ALTER TABLE leads ADD COLUMN consented_at TEXT;
        await env.DB
          .prepare(
            `INSERT INTO leads (name, email, organization, sport, message, source, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
          )
          .bind(
            lead.name,
            lead.email,
            lead.organization ?? null,
            lead.sport ?? null,
            lead.message ?? null,
            lead.source ?? 'API'
          )
          .run();
      } catch {
        // KV is the primary store; D1 failure is non-fatal
      }
    }

    return json({
      success: true,
      message: 'Lead captured successfully',
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    });
  } catch {
    return json({ error: 'Failed to process lead' }, 500);
  }
}

// ---------------------------------------------------------------------------
// College Baseball API handlers (Highlightly proxy with KV cache)
// ---------------------------------------------------------------------------

/** NCAA API client for college baseball — replaces Highlightly (no API key needed) */
function getCollegeClient(): NcaaApiClient {
  return createNcaaClient();
}

/** Tank01 client for MLB/NFL/NBA pro sports */
function getProClient(env: Env): Tank01ApiClient {
  return createTank01Client(env.RAPIDAPI_KEY);
}

/** @deprecated — Highlightly client kept for fallback only */
function getClient(env: Env): HighlightlyApiClient {
  return createHighlightlyClient(env.RAPIDAPI_KEY);
}

async function handleCollegeBaseballScores(
  url: URL,
  env: Env
): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const cacheKey = `cb:scores:${date || 'today'}`;
  const empty = { data: [], totalCount: 0 };

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.scores, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  try {
    const client = getCollegeClient();
    const result = await client.getMatches('NCAA', date);

    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.scores);
    }

    return cachedJson(result.data ?? empty, result.success ? 200 : 502, HTTP_CACHE.scores, {
      ...dataHeaders(result.timestamp),
      'X-Cache': 'MISS',
    });
  } catch {
    return json(empty, 502, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'ERROR' });
  }
}

async function handleCollegeBaseballStandings(
  url: URL,
  env: Env
): Promise<Response> {
  const conference = url.searchParams.get('conference') || 'NCAA';
  const cacheKey = `cb:standings:${conference}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.standings, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  const client = getCollegeClient();
  const result = await client.getStandings(conference);

  if (result.success && result.data) {
    await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.standings);
  }

  return cachedJson(result.data ?? [], result.success ? 200 : 502, HTTP_CACHE.standings, {
    ...dataHeaders(result.timestamp),
    'X-Cache': 'MISS',
  });
}

async function handleCollegeBaseballRankings(env: Env): Promise<Response> {
  const cacheKey = 'cb:rankings';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.rankings, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  try {
    const client = getCollegeClient();
    const result = await client.getRankings();

    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.rankings);
    }

    return cachedJson(result.data ?? [], result.success ? 200 : 502, HTTP_CACHE.rankings, {
      ...dataHeaders(result.timestamp),
      'X-Cache': 'MISS',
    });
  } catch {
    return json([], 502, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'ERROR' });
  }
}

async function handleCollegeBaseballTeam(
  teamId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:team:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.team, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  try {
    const client = getCollegeClient();
    const [teamResult, playersResult] = await Promise.all([
      client.getTeam(parseInt(teamId, 10)),
      client.getTeamPlayers(parseInt(teamId, 10)),
    ]);

    const payload = {
      team: teamResult.data ?? null,
      roster: playersResult.data?.data ?? [],
    };

    if (teamResult.success) {
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
    }

    return cachedJson(payload, 200, HTTP_CACHE.team, {
      ...dataHeaders(teamResult.timestamp),
      'X-Cache': 'MISS',
    });
  } catch {
    return json({ team: null, roster: [] }, 502, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'ERROR' });
  }
}

async function handleCollegeBaseballPlayer(
  playerId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.player, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  try {
    const client = getCollegeClient();
    const [playerResult, statsResult] = await Promise.all([
      client.getPlayer(parseInt(playerId, 10)),
      client.getPlayerStatistics(parseInt(playerId, 10)),
    ]);

    const payload = {
      player: playerResult.data ?? null,
      statistics: statsResult.data ?? null,
    };

    if (playerResult.success) {
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    }

    return cachedJson(payload, 200, HTTP_CACHE.player, {
      ...dataHeaders(playerResult.timestamp),
      'X-Cache': 'MISS',
    });
  } catch {
    return json({ player: null, statistics: null }, 502, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'ERROR' });
  }
}

async function handleCollegeBaseballGame(
  gameId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.game, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  const client = getCollegeClient();
  const [matchResult, boxResult] = await Promise.all([
    client.getMatch(parseInt(gameId, 10)),
    client.getBoxScore(parseInt(gameId, 10)),
  ]);

  const payload = {
    match: matchResult.data ?? null,
    boxScore: boxResult.data ?? null,
  };

  if (matchResult.success) {
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
  }

  return cachedJson(payload, matchResult.success ? 200 : 502, HTTP_CACHE.game, {
    ...dataHeaders(matchResult.timestamp),
    'X-Cache': 'MISS',
  });
}

async function handleCollegeBaseballSchedule(
  url: URL,
  env: Env
): Promise<Response> {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const range = url.searchParams.get('range') || 'week';
  const cacheKey = `cb:schedule:${date}:${range}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.schedule, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  const client = getCollegeClient();
  const result = await client.getSchedule(date, range);

  if (result.success && result.data) {
    await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.schedule);
  }

  return cachedJson(result.data ?? { data: [], totalCount: 0 }, result.success ? 200 : 502, HTTP_CACHE.schedule, {
    ...dataHeaders(result.timestamp),
    'X-Cache': 'MISS',
  });
}

async function handleCollegeBaseballTrending(env: Env): Promise<Response> {
  const cacheKey = 'cb:trending';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.trending, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  // Trending is computed from recent scores — fetch today's games and derive
  const client = getCollegeClient();
  const result = await client.getMatches('NCAA');

  if (!result.success || !result.data) {
    return json({ trendingPlayers: [], topGames: [] }, 502, dataHeaders(result.timestamp));
  }

  const games = result.data.data || [];

  // Top games: highest combined score, closest margin
  const finishedGames = games
    .filter((g: HighlightlyMatch) => g.status?.type === 'finished')
    .sort((a: HighlightlyMatch, b: HighlightlyMatch) => {
      const marginA = Math.abs(a.homeScore - a.awayScore);
      const marginB = Math.abs(b.homeScore - b.awayScore);
      return marginA - marginB;
    });

  const topGames = finishedGames.slice(0, 5).map((g: HighlightlyMatch) => ({
    id: g.id,
    homeTeam: g.homeTeam?.name,
    awayTeam: g.awayTeam?.name,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    margin: Math.abs(g.homeScore - g.awayScore),
  }));

  const payload = { trendingPlayers: [], topGames };
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);

  return cachedJson(payload, 200, HTTP_CACHE.trending, { ...dataHeaders(result.timestamp), 'X-Cache': 'MISS' });
}

// ---------------------------------------------------------------------------
// CFB Transfer Portal API handler
// ---------------------------------------------------------------------------

async function handleCFBTransferPortal(env: Env): Promise<Response> {
  const raw = await env.KV.get('portal:cfb:entries', 'text');
  if (raw) {
    try {
      const data = JSON.parse(raw);
      return cachedJson(data, 200, HTTP_CACHE.trending);
    } catch {
      // Corrupt KV entry — fall through
    }
  }
  return json({ entries: [], lastUpdated: null, message: 'No portal data available yet' }, 200);
}

// ---------------------------------------------------------------------------
// Pro Sports API handlers (Tank01)
// ---------------------------------------------------------------------------

/** Helper: format date as YYYYMMDD for Tank01 */
function toTank01Date(dateStr?: string | null): string {
  if (!dateStr) {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
  // Accept YYYY-MM-DD → YYYYMMDD
  return dateStr.replace(/-/g, '');
}

/** Wrap Tank01 response in a consistent envelope for the frontend */
function tank01Json<T>(result: Tank01Response<{ body: T }>, fallback: T): Response {
  if (result.success && result.data) {
    return json({
      ...result.data.body,
      meta: { lastUpdated: result.timestamp, dataSource: result.source },
    });
  }
  return json({ ...fallback, meta: { error: result.error, dataSource: result.source } }, 502);
}

/** Safe wrapper for Tank01 handlers — catches crashes and returns 502 JSON instead of 1101 */
async function safeTank01<T>(
  handler: () => Promise<Response>,
  fallbackKey: string,
  fallbackValue: unknown,
  env: Env,
): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Tank01 error';
    await logError(env.KV, msg, `tank01:${fallbackKey}`);
    return json(
      { [fallbackKey]: fallbackValue, meta: { error: msg, dataSource: 'tank01' } },
      502,
    );
  }
}

// --- MLB ---

async function handleMLBScores(url: URL, env: Env): Promise<Response> {
  const date = toTank01Date(url.searchParams.get('date'));
  const cacheKey = `mlb:scores:${date}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getMLBScores(date);

  if (result.success && result.data) {
    const body = result.data.body;
    const games = Array.isArray(body) ? body : [];
    const payload = { games, meta: { lastUpdated: result.timestamp, dataSource: 'tank01-mlb' } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
  }
  return json({ games: [], meta: { error: result.error } }, 502);
}

async function handleMLBStandings(env: Env): Promise<Response> {
  const cacheKey = 'mlb:standings';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getMLBStandings();

  if (result.success && result.data) {
    const payload = { standings: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  }
  return json({ standings: [], meta: { error: result.error } }, 502);
}

async function handleMLBGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getMLBBoxScore(gameId);

  if (result.success && result.data) {
    const payload = { boxScore: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
    return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
  }
  return json({ boxScore: null, meta: { error: result.error } }, 502);
}

async function handleMLBPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getMLBPlayer(playerId);

  if (result.success && result.data) {
    const payload = { player: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
  }
  return json({ player: null, meta: { error: result.error } }, 502);
}

async function handleMLBTeam(teamAbv: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:team:${teamAbv}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const [rosterResult, scheduleResult] = await Promise.all([
    client.getMLBTeamRoster(teamAbv, true),
    client.getMLBTeamSchedule(teamAbv),
  ]);

  const payload = {
    roster: rosterResult.success && rosterResult.data ? rosterResult.data.body : [],
    schedule: scheduleResult.success && scheduleResult.data ? scheduleResult.data.body : [],
    meta: { lastUpdated: new Date().toISOString() },
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleMLBNews(env: Env): Promise<Response> {
  const cacheKey = 'mlb:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getMLBNews();

  if (result.success && result.data) {
    const payload = { articles: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
    return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
  }
  return json({ articles: [], meta: { error: result.error } }, 502);
}

// --- NFL ---

async function handleNFLScores(url: URL, env: Env): Promise<Response> {
  const week = url.searchParams.get('week') || '1';
  const season = url.searchParams.get('season') || undefined;
  const cacheKey = `nfl:scores:${season || 'current'}:${week}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNFLScores(week, season);

  if (result.success && result.data) {
    const body = result.data.body;
    const games = Array.isArray(body) ? body : [];
    const payload = { games, meta: { lastUpdated: result.timestamp, dataSource: 'tank01-nfl' } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
  }
  return json({ games: [], meta: { error: result.error } }, 502);
}

async function handleNFLStandings(env: Env): Promise<Response> {
  const cacheKey = 'nfl:standings';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNFLStandings();

  if (result.success && result.data) {
    const payload = { standings: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  }
  return json({ standings: [], meta: { error: result.error } }, 502);
}

async function handleNFLGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `nfl:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNFLBoxScore(gameId);

  if (result.success && result.data) {
    const payload = { boxScore: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
    return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
  }
  return json({ boxScore: null, meta: { error: result.error } }, 502);
}

async function handleNFLPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `nfl:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNFLPlayer(playerId);

  if (result.success && result.data) {
    const payload = { player: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
  }
  return json({ player: null, meta: { error: result.error } }, 502);
}

async function handleNFLTeam(teamAbv: string, env: Env): Promise<Response> {
  const cacheKey = `nfl:team:${teamAbv}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const [rosterResult, scheduleResult] = await Promise.all([
    client.getNFLTeamRoster(teamAbv),
    client.getNFLTeamSchedule(teamAbv),
  ]);

  const payload = {
    roster: rosterResult.success && rosterResult.data ? rosterResult.data.body : [],
    schedule: scheduleResult.success && scheduleResult.data ? scheduleResult.data.body : [],
    meta: { lastUpdated: new Date().toISOString() },
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleNFLNews(env: Env): Promise<Response> {
  const cacheKey = 'nfl:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNFLNews();

  if (result.success && result.data) {
    const payload = { articles: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
    return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
  }
  return json({ articles: [], meta: { error: result.error } }, 502);
}

// --- NBA ---

async function handleNBAScores(url: URL, env: Env): Promise<Response> {
  const date = toTank01Date(url.searchParams.get('date'));
  const cacheKey = `nba:scores:${date}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNBAScores(date);

  if (result.success && result.data) {
    const body = result.data.body;
    const games = Array.isArray(body) ? body : [];
    const payload = { games, meta: { lastUpdated: result.timestamp, dataSource: 'tank01-nba' } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
    return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
  }
  return json({ games: [], meta: { error: result.error } }, 502);
}

async function handleNBAStandings(env: Env): Promise<Response> {
  const cacheKey = 'nba:standings';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNBAStandings();

  if (result.success && result.data) {
    const payload = { standings: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  }
  return json({ standings: [], meta: { error: result.error } }, 502);
}

async function handleNBAGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNBABoxScore(gameId);

  if (result.success && result.data) {
    const payload = { boxScore: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
    return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
  }
  return json({ boxScore: null, meta: { error: result.error } }, 502);
}

async function handleNBAPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNBAPlayer(playerId);

  if (result.success && result.data) {
    const payload = { player: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
  }
  return json({ player: null, meta: { error: result.error } }, 502);
}

async function handleNBATeam(teamAbv: string, env: Env): Promise<Response> {
  const cacheKey = `nba:team:${teamAbv}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const [rosterResult, scheduleResult] = await Promise.all([
    client.getNBATeamRoster(teamAbv),
    client.getNBATeamSchedule(teamAbv),
  ]);

  const payload = {
    roster: rosterResult.success && rosterResult.data ? rosterResult.data.body : [],
    schedule: scheduleResult.success && scheduleResult.data ? scheduleResult.data.body : [],
    meta: { lastUpdated: new Date().toISOString() },
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleNBANews(env: Env): Promise<Response> {
  const cacheKey = 'nba:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const client = getProClient(env);
  const result = await client.getNBANews();

  if (result.success && result.data) {
    const payload = { articles: result.data.body, meta: { lastUpdated: result.timestamp } };
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
    return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
  }
  return json({ articles: [], meta: { error: result.error } }, 502);
}

// ---------------------------------------------------------------------------
// R2 Game Asset handler
// ---------------------------------------------------------------------------

async function handleGameAsset(
  assetPath: string,
  env: Env
): Promise<Response> {
  const object = await env.ASSETS_BUCKET.get(assetPath);

  if (!object) {
    return json({ error: 'Asset not found' }, 404);
  }

  const headers: Record<string, string> = {
    ...activeCorsHeaders(),
    'Cache-Control': 'public, max-age=86400, immutable',
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
  };

  if (object.httpMetadata?.contentEncoding) {
    headers['Content-Encoding'] = object.httpMetadata.contentEncoding;
  }

  return new Response(object.body, { headers });
}

// ---------------------------------------------------------------------------
// Search handler
// ---------------------------------------------------------------------------

async function handleSearch(url: URL, env: Env): Promise<Response> {
  const query = url.searchParams.get('q')?.trim();
  if (!query || query.length < 2) {
    return json({ results: [], message: 'Query must be at least 2 characters' }, 400);
  }

  const lowerQuery = query.toLowerCase();
  const results: Array<{ type: string; id: string; name: string; url: string; sport?: string }> = [];

  // Static pro-sport team index — instant match, no API calls
  const PRO_TEAMS: Array<{ name: string; abv: string; sport: 'mlb' | 'nfl' | 'nba'; slug: string }> = [
    // MLB (30 teams)
    { name: 'Arizona Diamondbacks', abv: 'ARI', sport: 'mlb', slug: 'ari' },
    { name: 'Atlanta Braves', abv: 'ATL', sport: 'mlb', slug: 'atl' },
    { name: 'Baltimore Orioles', abv: 'BAL', sport: 'mlb', slug: 'bal' },
    { name: 'Boston Red Sox', abv: 'BOS', sport: 'mlb', slug: 'bos' },
    { name: 'Chicago Cubs', abv: 'CHC', sport: 'mlb', slug: 'chc' },
    { name: 'Chicago White Sox', abv: 'CWS', sport: 'mlb', slug: 'cws' },
    { name: 'Cincinnati Reds', abv: 'CIN', sport: 'mlb', slug: 'cin' },
    { name: 'Cleveland Guardians', abv: 'CLE', sport: 'mlb', slug: 'cle' },
    { name: 'Colorado Rockies', abv: 'COL', sport: 'mlb', slug: 'col' },
    { name: 'Detroit Tigers', abv: 'DET', sport: 'mlb', slug: 'det' },
    { name: 'Houston Astros', abv: 'HOU', sport: 'mlb', slug: 'hou' },
    { name: 'Kansas City Royals', abv: 'KC', sport: 'mlb', slug: 'kc' },
    { name: 'Los Angeles Angels', abv: 'LAA', sport: 'mlb', slug: 'laa' },
    { name: 'Los Angeles Dodgers', abv: 'LAD', sport: 'mlb', slug: 'lad' },
    { name: 'Miami Marlins', abv: 'MIA', sport: 'mlb', slug: 'mia' },
    { name: 'Milwaukee Brewers', abv: 'MIL', sport: 'mlb', slug: 'mil' },
    { name: 'Minnesota Twins', abv: 'MIN', sport: 'mlb', slug: 'min' },
    { name: 'New York Mets', abv: 'NYM', sport: 'mlb', slug: 'nym' },
    { name: 'New York Yankees', abv: 'NYY', sport: 'mlb', slug: 'nyy' },
    { name: 'Oakland Athletics', abv: 'OAK', sport: 'mlb', slug: 'oak' },
    { name: 'Philadelphia Phillies', abv: 'PHI', sport: 'mlb', slug: 'phi' },
    { name: 'Pittsburgh Pirates', abv: 'PIT', sport: 'mlb', slug: 'pit' },
    { name: 'San Diego Padres', abv: 'SD', sport: 'mlb', slug: 'sd' },
    { name: 'San Francisco Giants', abv: 'SF', sport: 'mlb', slug: 'sf' },
    { name: 'Seattle Mariners', abv: 'SEA', sport: 'mlb', slug: 'sea' },
    { name: 'St. Louis Cardinals', abv: 'STL', sport: 'mlb', slug: 'stl' },
    { name: 'Tampa Bay Rays', abv: 'TB', sport: 'mlb', slug: 'tb' },
    { name: 'Texas Rangers', abv: 'TEX', sport: 'mlb', slug: 'tex' },
    { name: 'Toronto Blue Jays', abv: 'TOR', sport: 'mlb', slug: 'tor' },
    { name: 'Washington Nationals', abv: 'WSH', sport: 'mlb', slug: 'wsh' },
    // NFL (32 teams)
    { name: 'Arizona Cardinals', abv: 'ARI', sport: 'nfl', slug: 'cardinals' },
    { name: 'Atlanta Falcons', abv: 'ATL', sport: 'nfl', slug: 'falcons' },
    { name: 'Baltimore Ravens', abv: 'BAL', sport: 'nfl', slug: 'ravens' },
    { name: 'Buffalo Bills', abv: 'BUF', sport: 'nfl', slug: 'bills' },
    { name: 'Carolina Panthers', abv: 'CAR', sport: 'nfl', slug: 'panthers' },
    { name: 'Chicago Bears', abv: 'CHI', sport: 'nfl', slug: 'bears' },
    { name: 'Cincinnati Bengals', abv: 'CIN', sport: 'nfl', slug: 'bengals' },
    { name: 'Cleveland Browns', abv: 'CLE', sport: 'nfl', slug: 'browns' },
    { name: 'Dallas Cowboys', abv: 'DAL', sport: 'nfl', slug: 'cowboys' },
    { name: 'Denver Broncos', abv: 'DEN', sport: 'nfl', slug: 'broncos' },
    { name: 'Detroit Lions', abv: 'DET', sport: 'nfl', slug: 'lions' },
    { name: 'Green Bay Packers', abv: 'GB', sport: 'nfl', slug: 'packers' },
    { name: 'Houston Texans', abv: 'HOU', sport: 'nfl', slug: 'texans' },
    { name: 'Indianapolis Colts', abv: 'IND', sport: 'nfl', slug: 'colts' },
    { name: 'Jacksonville Jaguars', abv: 'JAX', sport: 'nfl', slug: 'jaguars' },
    { name: 'Kansas City Chiefs', abv: 'KC', sport: 'nfl', slug: 'chiefs' },
    { name: 'Las Vegas Raiders', abv: 'LV', sport: 'nfl', slug: 'raiders' },
    { name: 'Los Angeles Chargers', abv: 'LAC', sport: 'nfl', slug: 'chargers' },
    { name: 'Los Angeles Rams', abv: 'LAR', sport: 'nfl', slug: 'rams' },
    { name: 'Miami Dolphins', abv: 'MIA', sport: 'nfl', slug: 'dolphins' },
    { name: 'Minnesota Vikings', abv: 'MIN', sport: 'nfl', slug: 'vikings' },
    { name: 'New England Patriots', abv: 'NE', sport: 'nfl', slug: 'patriots' },
    { name: 'New Orleans Saints', abv: 'NO', sport: 'nfl', slug: 'saints' },
    { name: 'New York Giants', abv: 'NYG', sport: 'nfl', slug: 'giants' },
    { name: 'New York Jets', abv: 'NYJ', sport: 'nfl', slug: 'jets' },
    { name: 'Philadelphia Eagles', abv: 'PHI', sport: 'nfl', slug: 'eagles' },
    { name: 'Pittsburgh Steelers', abv: 'PIT', sport: 'nfl', slug: 'steelers' },
    { name: 'San Francisco 49ers', abv: 'SF', sport: 'nfl', slug: '49ers' },
    { name: 'Seattle Seahawks', abv: 'SEA', sport: 'nfl', slug: 'seahawks' },
    { name: 'Tampa Bay Buccaneers', abv: 'TB', sport: 'nfl', slug: 'buccaneers' },
    { name: 'Tennessee Titans', abv: 'TEN', sport: 'nfl', slug: 'titans' },
    { name: 'Washington Commanders', abv: 'WAS', sport: 'nfl', slug: 'commanders' },
    // NBA (30 teams)
    { name: 'Atlanta Hawks', abv: 'ATL', sport: 'nba', slug: 'atl' },
    { name: 'Boston Celtics', abv: 'BOS', sport: 'nba', slug: 'bos' },
    { name: 'Brooklyn Nets', abv: 'BKN', sport: 'nba', slug: 'bkn' },
    { name: 'Charlotte Hornets', abv: 'CHA', sport: 'nba', slug: 'cha' },
    { name: 'Chicago Bulls', abv: 'CHI', sport: 'nba', slug: 'chi' },
    { name: 'Cleveland Cavaliers', abv: 'CLE', sport: 'nba', slug: 'cle' },
    { name: 'Dallas Mavericks', abv: 'DAL', sport: 'nba', slug: 'dal' },
    { name: 'Denver Nuggets', abv: 'DEN', sport: 'nba', slug: 'den' },
    { name: 'Detroit Pistons', abv: 'DET', sport: 'nba', slug: 'det' },
    { name: 'Golden State Warriors', abv: 'GS', sport: 'nba', slug: 'gs' },
    { name: 'Houston Rockets', abv: 'HOU', sport: 'nba', slug: 'hou' },
    { name: 'Indiana Pacers', abv: 'IND', sport: 'nba', slug: 'ind' },
    { name: 'LA Clippers', abv: 'LAC', sport: 'nba', slug: 'lac' },
    { name: 'Los Angeles Lakers', abv: 'LAL', sport: 'nba', slug: 'lal' },
    { name: 'Memphis Grizzlies', abv: 'MEM', sport: 'nba', slug: 'mem' },
    { name: 'Miami Heat', abv: 'MIA', sport: 'nba', slug: 'mia' },
    { name: 'Milwaukee Bucks', abv: 'MIL', sport: 'nba', slug: 'mil' },
    { name: 'Minnesota Timberwolves', abv: 'MIN', sport: 'nba', slug: 'min' },
    { name: 'New Orleans Pelicans', abv: 'NOP', sport: 'nba', slug: 'nop' },
    { name: 'New York Knicks', abv: 'NYK', sport: 'nba', slug: 'nyk' },
    { name: 'Oklahoma City Thunder', abv: 'OKC', sport: 'nba', slug: 'okc' },
    { name: 'Orlando Magic', abv: 'ORL', sport: 'nba', slug: 'orl' },
    { name: 'Philadelphia 76ers', abv: 'PHI', sport: 'nba', slug: 'phi' },
    { name: 'Phoenix Suns', abv: 'PHX', sport: 'nba', slug: 'phx' },
    { name: 'Portland Trail Blazers', abv: 'POR', sport: 'nba', slug: 'por' },
    { name: 'Sacramento Kings', abv: 'SAC', sport: 'nba', slug: 'sac' },
    { name: 'San Antonio Spurs', abv: 'SA', sport: 'nba', slug: 'sa' },
    { name: 'Toronto Raptors', abv: 'TOR', sport: 'nba', slug: 'tor' },
    { name: 'Utah Jazz', abv: 'UTA', sport: 'nba', slug: 'uta' },
    { name: 'Washington Wizards', abv: 'WAS', sport: 'nba', slug: 'was' },
  ];

  // Match pro teams by name or abbreviation
  for (const team of PRO_TEAMS) {
    if (
      team.name.toLowerCase().includes(lowerQuery) ||
      team.abv.toLowerCase() === lowerQuery
    ) {
      results.push({
        type: 'team',
        id: team.slug,
        name: team.name,
        url: `/${team.sport}/teams/${team.slug}`,
        sport: team.sport.toUpperCase(),
      });
    }
    if (results.length >= 20) break;
  }

  // College baseball teams from KV (existing behavior)
  if (results.length < 20) {
    const teamList = await env.KV.list({ prefix: 'cb:team:', limit: 50 });
    for (const key of teamList.keys) {
      const data = await kvGet<{ team: { name: string; id: number } }>(env.KV, key.name);
      if (data?.team?.name?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'team',
          id: String(data.team.id),
          name: data.team.name,
          url: `/college-baseball/teams/${data.team.id}`,
          sport: 'College Baseball',
        });
      }
      if (results.length >= 20) break;
    }
  }

  // Sport pages (hubs)
  const SPORT_PAGES = [
    { name: 'MLB Baseball', url: '/mlb' },
    { name: 'NFL Football', url: '/nfl' },
    { name: 'NBA Basketball', url: '/nba' },
    { name: 'College Football', url: '/cfb' },
    { name: 'College Baseball', url: '/college-baseball' },
    { name: 'Arcade Games', url: '/arcade' },
    { name: 'Dashboard', url: '/dashboard' },
  ];
  for (const page of SPORT_PAGES) {
    if (page.name.toLowerCase().includes(lowerQuery)) {
      results.push({ type: 'page', id: page.url, name: page.name, url: page.url });
    }
  }

  return json({ results, query });
}

// ---------------------------------------------------------------------------
// Feedback handler
// ---------------------------------------------------------------------------

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as {
      rating?: number;
      category?: string;
      text?: string;
      page?: string;
    };

    if (!body.text) {
      return json({ error: 'Feedback text is required' }, 400);
    }

    if (body.text.length > 5000) {
      return json({ error: 'Feedback text exceeds maximum length' }, 400);
    }

    // Rate limit feedback submissions
    const fbIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.KV && !(await checkRateLimit(env.KV, fbIP))) {
      return json({ error: 'Too many requests. Please try again later.' }, 429);
    }

    if (env.DB) {
      try {
        await env.DB
          .prepare(
            `INSERT INTO feedback (rating, category, text, page, created_at)
             VALUES (?, ?, ?, ?, datetime('now'))`
          )
          .bind(body.rating ?? null, body.category ?? null, body.text, body.page ?? null)
          .run();
      } catch {
        // D1 table may not exist yet; fall through to KV
      }
    }

    const key = `feedback:${Date.now()}`;
    await env.KV.put(key, JSON.stringify({ ...body, timestamp: new Date().toISOString() }), {
      expirationTtl: 86400 * 90, // 90 days
    });

    return json({ success: true, message: 'Feedback received' });
  } catch {
    return json({ error: 'Failed to process feedback' }, 500);
  }
}

// ---------------------------------------------------------------------------
// Admin health handler
// ---------------------------------------------------------------------------

async function handleAdminHealth(env: Env): Promise<Response> {
  const checks: Record<string, unknown> = {};

  // KV check (read-only — avoids write cost on every health poll)
  try {
    await env.KV.get('health:check');
    checks.kv = { status: 'healthy' };
  } catch (e) {
    checks.kv = { status: 'unhealthy', error: e instanceof Error ? e.message : 'Unknown' };
  }

  // D1 check
  try {
    const result = await env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>();
    checks.d1 = { status: result?.ok === 1 ? 'healthy' : 'degraded' };
  } catch (e) {
    checks.d1 = { status: 'unhealthy', error: e instanceof Error ? e.message : 'Unknown' };
  }

  // NCAA API check (college baseball)
  try {
    const ncaaClient = getCollegeClient();
    const ncaaHealth = await ncaaClient.healthCheck();
    checks.ncaa = {
      status: ncaaHealth.healthy ? 'healthy' : 'unhealthy',
      latency_ms: ncaaHealth.latency_ms,
    };
  } catch (e) {
    checks.ncaa = {
      status: 'unhealthy',
      error: e instanceof Error ? e.message : 'Unknown',
    };
  }

  // Tank01 check (pro sports — check each sport independently)
  if (env.RAPIDAPI_KEY) {
    const proClient = getProClient(env);
    for (const sport of ['mlb', 'nfl', 'nba'] as const) {
      try {
        const proHealth = await proClient.healthCheck(sport);
        checks[`tank01_${sport}`] = {
          status: proHealth.healthy ? 'healthy' : 'unhealthy',
          latency_ms: proHealth.latency_ms,
          ...(proHealth.error ? { error: proHealth.error } : {}),
        };
      } catch (e) {
        checks[`tank01_${sport}`] = {
          status: 'unhealthy',
          error: e instanceof Error ? e.message : 'Unknown',
        };
      }
    }
  } else {
    checks.tank01 = { status: 'unconfigured', error: 'RAPIDAPI_KEY not set' };
  }

  // Error count (last 24h)
  try {
    const errorList = await env.KV.list({ prefix: 'errors:' });
    checks.recentErrors = errorList.keys.length;
  } catch {
    checks.recentErrors = -1;
  }

  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks,
  });
}

// ---------------------------------------------------------------------------
// WebSocket handler
// ---------------------------------------------------------------------------

function handleWebSocket(): Response {
  const [client, server] = Object.values(new WebSocketPair());
  server.accept();

  const interval = setInterval(() => {
    if (server.readyState === WebSocket.OPEN) {
      server.send(
        JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })
      );
    } else {
      clearInterval(interval);
    }
  }, 5000);

  server.addEventListener('close', () => clearInterval(interval));
  server.addEventListener('error', () => clearInterval(interval));

  server.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data as string);
      if (data.type === 'ping') server.send(JSON.stringify({ type: 'pong' }));
    } catch {
      /* ignore malformed messages */
    }
  });

  return new Response(null, { status: 101, webSocket: client });
}

// ---------------------------------------------------------------------------
// Static asset proxy — forward non-API requests to Pages
// ---------------------------------------------------------------------------

async function proxyToPages(request: Request, env: Env): Promise<Response> {
  const origin = env.PAGES_ORIGIN || 'https://blazesportsintel.pages.dev';
  const url = new URL(request.url);
  const pagesUrl = `${origin}${url.pathname}${url.search}`;

  const pagesResponse = await fetch(pagesUrl, {
    method: request.method,
    headers: request.headers,
    redirect: 'follow',
  });

  const response = new Response(pagesResponse.body, pagesResponse);

  // Apply security headers to all proxied responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

// ---------------------------------------------------------------------------
// MCP Protocol handler (JSON-RPC 2.0 over HTTP)
// ---------------------------------------------------------------------------

const MCP_SERVER_INFO = {
  name: 'bsi-sports',
  version: '1.0.0',
};

const MCP_TOOLS = [
  {
    name: 'bsi_college_baseball_scores',
    description: 'Get live and recent college baseball scores. Optionally filter by date (YYYY-MM-DD).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (default: today)' },
      },
    },
  },
  {
    name: 'bsi_college_baseball_standings',
    description: 'Get college baseball standings, optionally filtered by conference.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        conference: { type: 'string', description: 'Conference name (default: NCAA)' },
      },
    },
  },
  {
    name: 'bsi_college_baseball_rankings',
    description: 'Get current college baseball rankings (top 25).',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'bsi_college_baseball_team',
    description: 'Get team details and roster by team ID.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        team_id: { type: 'string', description: 'Numeric team ID' },
      },
      required: ['team_id'],
    },
  },
  {
    name: 'bsi_college_baseball_game',
    description: 'Get game details and box score by game ID.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        game_id: { type: 'string', description: 'Numeric game ID' },
      },
      required: ['game_id'],
    },
  },
  {
    name: 'bsi_college_baseball_player',
    description: 'Get player info and statistics by player ID.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        player_id: { type: 'string', description: 'Numeric player ID' },
      },
      required: ['player_id'],
    },
  },
  {
    name: 'bsi_college_baseball_schedule',
    description: 'Get the college baseball schedule for a date range.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Start date YYYY-MM-DD (default: today)' },
        range: { type: 'string', description: '"day" or "week" (default: week)' },
      },
    },
  },
  {
    name: 'bsi_mlb_scores',
    description: 'Get MLB scores for a given date.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (default: today)' },
      },
    },
  },
  {
    name: 'bsi_mlb_standings',
    description: 'Get current MLB standings.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'bsi_nfl_scores',
    description: 'Get NFL scores by week.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        week: { type: 'string', description: 'Week number (default: 1)' },
        season: { type: 'string', description: 'Season year (default: current)' },
      },
    },
  },
  {
    name: 'bsi_nfl_standings',
    description: 'Get current NFL standings.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'bsi_nba_scores',
    description: 'Get NBA scores for a given date.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (default: today)' },
      },
    },
  },
  {
    name: 'bsi_nba_standings',
    description: 'Get current NBA standings.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
];

function mcpCorsHeaders(): Record<string, string> {
  // MCP uses the same origin-restricted CORS as the rest of the API
  return {
    ...activeCorsHeaders(),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function mcpJsonRpc(id: unknown, result: unknown): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, result }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS,
        ...mcpCorsHeaders(),
      },
    }
  );
}

function mcpError(id: unknown, code: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }),
    {
      status: 200, // JSON-RPC errors still use 200
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS,
        ...mcpCorsHeaders(),
      },
    }
  );
}

/** Extract JSON body from an internal Response object */
async function responseToJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { error: 'Failed to parse upstream response' };
  }
}

async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  // CORS preflight for MCP
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: mcpCorsHeaders() });
  }

  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> };
  try {
    body = await request.json() as typeof body;
  } catch {
    return mcpError(null, -32700, 'Parse error');
  }

  const { id, method, params } = body;

  if (method === 'initialize') {
    return mcpJsonRpc(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: MCP_SERVER_INFO,
    });
  }

  if (method === 'tools/list') {
    return mcpJsonRpc(id, { tools: MCP_TOOLS });
  }

  if (method === 'tools/call') {
    const toolName = (params as Record<string, unknown>)?.name as string;
    const args = ((params as Record<string, unknown>)?.arguments ?? {}) as Record<string, string>;

    // Build a synthetic URL for handlers that need query params
    const base = new URL(request.url);

    let result: unknown;

    try {
      switch (toolName) {
        case 'bsi_college_baseball_scores': {
          const u = new URL(`${base.origin}/api/college-baseball/scores`);
          if (args.date) u.searchParams.set('date', args.date);
          result = await responseToJson(await handleCollegeBaseballScores(u, env));
          break;
        }
        case 'bsi_college_baseball_standings': {
          const u = new URL(`${base.origin}/api/college-baseball/standings`);
          if (args.conference) u.searchParams.set('conference', args.conference);
          result = await responseToJson(await handleCollegeBaseballStandings(u, env));
          break;
        }
        case 'bsi_college_baseball_rankings':
          result = await responseToJson(await handleCollegeBaseballRankings(env));
          break;
        case 'bsi_college_baseball_team':
          result = await responseToJson(await handleCollegeBaseballTeam(args.team_id, env));
          break;
        case 'bsi_college_baseball_game':
          result = await responseToJson(await handleCollegeBaseballGame(args.game_id, env));
          break;
        case 'bsi_college_baseball_player':
          result = await responseToJson(await handleCollegeBaseballPlayer(args.player_id, env));
          break;
        case 'bsi_college_baseball_schedule': {
          const u = new URL(`${base.origin}/api/college-baseball/schedule`);
          if (args.date) u.searchParams.set('date', args.date);
          if (args.range) u.searchParams.set('range', args.range);
          result = await responseToJson(await handleCollegeBaseballSchedule(u, env));
          break;
        }
        case 'bsi_mlb_scores': {
          const u = new URL(`${base.origin}/api/mlb/scores`);
          if (args.date) u.searchParams.set('date', args.date);
          result = await responseToJson(await handleMLBScores(u, env));
          break;
        }
        case 'bsi_mlb_standings':
          result = await responseToJson(await handleMLBStandings(env));
          break;
        case 'bsi_nfl_scores': {
          const u = new URL(`${base.origin}/api/nfl/scores`);
          if (args.week) u.searchParams.set('week', args.week);
          if (args.season) u.searchParams.set('season', args.season);
          result = await responseToJson(await handleNFLScores(u, env));
          break;
        }
        case 'bsi_nfl_standings':
          result = await responseToJson(await handleNFLStandings(env));
          break;
        case 'bsi_nba_scores': {
          const u = new URL(`${base.origin}/api/nba/scores`);
          if (args.date) u.searchParams.set('date', args.date);
          result = await responseToJson(await handleNBAScores(u, env));
          break;
        }
        case 'bsi_nba_standings':
          result = await responseToJson(await handleNBAStandings(env));
          break;
        default:
          return mcpError(id, -32602, `Unknown tool: ${toolName}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tool execution failed';
      return mcpJsonRpc(id, {
        content: [{ type: 'text', text: JSON.stringify({ error: msg }) }],
        isError: true,
      });
    }

    return mcpJsonRpc(id, {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    });
  }

  return mcpError(id, -32601, `Method not found: ${method}`);
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Simple per-IP rate limiter (sliding window, per Worker isolate)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 120; // requests per window per IP
const _rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    _rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// Periodic cleanup to prevent memory growth (runs every 500 requests)
let _rateLimitCleanupCounter = 0;
function maybeCleanupRateLimit() {
  if (++_rateLimitCleanupCounter < 500) return;
  _rateLimitCleanupCounter = 0;
  const now = Date.now();
  for (const [key, val] of _rateLimitMap) {
    if (now > val.resetAt) _rateLimitMap.delete(key);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    _activeRequest = request;
    _activeEnv = env;
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    // Rate limit API routes
    if (pathname.startsWith('/api/')) {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      maybeCleanupRateLimit();
      if (!checkRateLimit(ip)) {
        return json({ error: 'Rate limit exceeded. Try again shortly.' }, 429);
      }
    }

    try {
      // ----- MCP Protocol -----
      if (pathname === '/mcp') return handleMcpRequest(request, env);

      // ----- Health / status -----
      if (pathname === '/api/health' || pathname === '/health') return handleHealth(env);
      if (pathname === '/api/admin/health') return handleAdminHealth(env);

      // ----- College Baseball data routes (Highlightly proxy) -----
      if (pathname === '/api/college-baseball/scores') {
        return handleCollegeBaseballScores(url, env);
      }
      if (pathname === '/api/college-baseball/standings') {
        return handleCollegeBaseballStandings(url, env);
      }
      if (pathname === '/api/college-baseball/rankings') {
        return handleCollegeBaseballRankings(env);
      }
      if (pathname === '/api/college-baseball/schedule') {
        return handleCollegeBaseballSchedule(url, env);
      }
      if (pathname === '/api/college-baseball/trending') {
        return handleCollegeBaseballTrending(env);
      }

      // CFB Transfer Portal
      if (pathname === '/api/cfb/transfer-portal') {
        return handleCFBTransferPortal(env);
      }

      const teamMatch = matchRoute(pathname, '/api/college-baseball/teams/:teamId');
      if (teamMatch) return handleCollegeBaseballTeam(teamMatch.params.teamId, env);

      const playerMatch = matchRoute(pathname, '/api/college-baseball/players/:playerId');
      if (playerMatch) return handleCollegeBaseballPlayer(playerMatch.params.playerId, env);

      const gameMatch = matchRoute(pathname, '/api/college-baseball/games/:gameId');
      if (gameMatch) return handleCollegeBaseballGame(gameMatch.params.gameId, env);

      // ----- MLB data routes (Tank01) -----
      if (pathname === '/api/mlb/scores')
        return safeTank01(() => handleMLBScores(url, env), 'games', [], env);
      if (pathname === '/api/mlb/standings')
        return safeTank01(() => handleMLBStandings(env), 'standings', [], env);
      if (pathname === '/api/mlb/news')
        return safeTank01(() => handleMLBNews(env), 'articles', [], env);

      const mlbGameMatch = matchRoute(pathname, '/api/mlb/game/:gameId');
      if (mlbGameMatch)
        return safeTank01(() => handleMLBGame(mlbGameMatch.params.gameId, env), 'boxScore', null, env);

      const mlbPlayerMatch = matchRoute(pathname, '/api/mlb/players/:playerId');
      if (mlbPlayerMatch)
        return safeTank01(() => handleMLBPlayer(mlbPlayerMatch.params.playerId, env), 'player', null, env);

      const mlbTeamMatch = matchRoute(pathname, '/api/mlb/teams/:teamId');
      if (mlbTeamMatch)
        return safeTank01(() => handleMLBTeam(mlbTeamMatch.params.teamId, env), 'team', null, env);

      // ----- NFL data routes (Tank01) -----
      if (pathname === '/api/nfl/scores')
        return safeTank01(() => handleNFLScores(url, env), 'games', [], env);
      if (pathname === '/api/nfl/standings')
        return safeTank01(() => handleNFLStandings(env), 'standings', [], env);
      if (pathname === '/api/nfl/news')
        return safeTank01(() => handleNFLNews(env), 'articles', [], env);

      const nflGameMatch = matchRoute(pathname, '/api/nfl/game/:gameId');
      if (nflGameMatch)
        return safeTank01(() => handleNFLGame(nflGameMatch.params.gameId, env), 'boxScore', null, env);

      const nflPlayerMatch = matchRoute(pathname, '/api/nfl/players/:playerId');
      if (nflPlayerMatch)
        return safeTank01(() => handleNFLPlayer(nflPlayerMatch.params.playerId, env), 'player', null, env);

      const nflTeamMatch = matchRoute(pathname, '/api/nfl/teams/:teamId');
      if (nflTeamMatch)
        return safeTank01(() => handleNFLTeam(nflTeamMatch.params.teamId, env), 'team', null, env);

      // ----- NBA data routes (Tank01) -----
      if (pathname === '/api/nba/scores' || pathname === '/api/nba/scoreboard') {
        return safeTank01(() => handleNBAScores(url, env), 'games', [], env);
      }
      if (pathname === '/api/nba/standings')
        return safeTank01(() => handleNBAStandings(env), 'standings', [], env);
      if (pathname === '/api/nba/news')
        return safeTank01(() => handleNBANews(env), 'articles', [], env);

      const nbaGameMatch = matchRoute(pathname, '/api/nba/game/:gameId');
      if (nbaGameMatch)
        return safeTank01(() => handleNBAGame(nbaGameMatch.params.gameId, env), 'boxScore', null, env);

      const nbaPlayerMatch = matchRoute(pathname, '/api/nba/players/:playerId');
      if (nbaPlayerMatch)
        return safeTank01(() => handleNBAPlayer(nbaPlayerMatch.params.playerId, env), 'player', null, env);

      const nbaTeamMatch = matchRoute(pathname, '/api/nba/teams/:teamId');
      if (nbaTeamMatch)
        return safeTank01(() => handleNBATeam(nbaTeamMatch.params.teamId, env), 'team', null, env);

      // ----- R2 Game assets -----
      const assetPath = matchWildcardRoute(pathname, '/api/games/assets/');
      if (assetPath) return handleGameAsset(assetPath, env);

      // ----- Search -----
      if (pathname === '/api/search') return handleSearch(url, env);

      // ----- Feedback -----
      if (request.method === 'POST' && pathname === '/api/feedback') {
        return handleFeedback(request, env);
      }

      // ----- Existing API endpoints -----
      if (pathname === '/api/kpi' || pathname === '/kpi')
        return safeTank01(() => handleKPI(url, env), 'error', 'KPI fetch failed', env);
      if (pathname === '/api/analytics/accuracy' || pathname === '/analytics/accuracy')
        return safeTank01(() => handleAccuracy(url, env), 'error', 'Comparison fetch failed', env);
      if (pathname === '/api/alerts/buckets' || pathname === '/alerts/buckets')
        return safeTank01(() => handleAlertBuckets(url, env), 'error', 'Buckets fetch failed', env);
      if (pathname === '/api/analytics/yearly-trend' || pathname === '/analytics/yearly-trend')
        return safeTank01(() => handleYearlyTrend(url, env), 'error', 'Leaders fetch failed', env);
      if (pathname === '/api/readiness' || pathname === '/readiness')
        return safeTank01(() => handleReadiness(url, env), 'error', 'Readiness fetch failed', env);
      if (
        pathname === '/api/multiplayer/leaderboard' ||
        pathname === '/multiplayer/leaderboard'
      ) {
        if (request.method === 'POST') return handleLeaderboardSubmit(request, env);
        return handleLeaderboard(url, env);
      }

      const teamsMatch =
        matchRoute(pathname, '/api/teams/:league') || matchRoute(pathname, '/teams/:league');
      if (teamsMatch)
        return safeTank01(() => handleTeams(teamsMatch.params.league, env), 'teams', [], env);

      // Lead capture (POST)
      if (
        request.method === 'POST' &&
        (pathname === '/api/lead' || pathname === '/api/leads')
      ) {
        return handleLead(request, env);
      }

      // WebSocket
      if (pathname === '/ws') {
        if (request.headers.get('Upgrade') !== 'websocket') {
          return json({ error: 'Expected websocket upgrade' }, 400);
        }
        return handleWebSocket();
      }

      // Redirect
      if (pathname === '/coverage') {
        return Response.redirect(url.origin + '/analytics', 301);
      }

      // ----- Everything else → proxy to Pages -----
      return await proxyToPages(request, env);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Internal server error';
      await logError(env.KV, detail, pathname);
      // Don't leak internal error details to clients in production
      const publicMessage = env.ENVIRONMENT === 'production' ? 'Internal server error' : detail;
      return json({ error: publicMessage }, 500);
    }
  },
};

// ---------------------------------------------------------------------------
// Durable Object — CacheObject
// ---------------------------------------------------------------------------

export class CacheObject {
  private state: DurableObjectState;
  private cache: Map<string, { data: unknown; expires: number }>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.cache = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (request.method === 'GET' && key) {
      const cached = this.cache.get(key);
      if (cached && cached.expires > Date.now()) {
        return new Response(JSON.stringify(cached.data));
      }
      return new Response('null');
    }

    if (request.method === 'PUT' && key) {
      const ttl = parseInt(url.searchParams.get('ttl') || '60000');
      const data = await request.json();
      this.cache.set(key, { data, expires: Date.now() + ttl });
      return new Response('OK');
    }

    return new Response('Method not allowed', { status: 405 });
  }
}

// ---------------------------------------------------------------------------
// Durable Object — PortalPoller
// Polls transfer portal data source every 30s via alarm, upserts to KV
// ---------------------------------------------------------------------------

export class PortalPoller {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/start') {
      // Set alarm to fire in 30 seconds
      const currentAlarm = await this.state.storage.getAlarm();
      if (!currentAlarm) {
        await this.state.storage.setAlarm(Date.now() + 30_000);
      }
      return new Response('PortalPoller started');
    }

    if (url.pathname === '/stop') {
      await this.state.storage.deleteAlarm();
      return new Response('PortalPoller stopped');
    }

    if (url.pathname === '/status') {
      const alarm = await this.state.storage.getAlarm();
      const lastPoll = await this.state.storage.get<string>('lastPoll');
      return new Response(
        JSON.stringify({ alarmSet: !!alarm, lastPoll: lastPoll || 'never' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not found', { status: 404 });
  }

  async alarm(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await this.state.storage.put('lastPoll', now);

      // Fetch transfer portal data
      // TODO: Wire to a real data source when available (NCAA API, scraper, etc.)
      // For now, the alarm keeps running so the DO stays warm and /status reports lastPoll.
      // When a source is available, fetch here and write to KV:
      //   await this.env.KV.put('portal:cfb:entries', JSON.stringify({entries, lastUpdated: now}), {expirationTtl: 86400});

      // Re-arm: 5 min cadence (portal data doesn't change every 30s)
      await this.state.storage.setAlarm(Date.now() + 300_000);
    } catch (err) {
      console.error('[PortalPoller] alarm error:', err instanceof Error ? err.message : err);
      // Re-arm even on failure
      await this.state.storage.setAlarm(Date.now() + 300_000);
    }
  }
}
