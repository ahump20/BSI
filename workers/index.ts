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
import {
  getScoreboard,
  getStandings,
  getTeams as espnGetTeams,
  getTeamDetail,
  getTeamRoster,
  getGameSummary,
  getAthlete,
  getNews,
  getLeaders,
  getTeamSchedule,
  transformStandings,
  transformScoreboard,
  transformTeams,
  transformTeamDetail,
  transformAthlete,
  transformNews,
  transformGameSummary,
  type ESPNSport,
} from '../lib/api-clients/espn-api';

export interface Env {
  KV: KVNamespace;
  CACHE: DurableObjectNamespace;
  PORTAL_POLLER: DurableObjectNamespace;
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  ENVIRONMENT: string;
  API_VERSION: string;
  PAGES_ORIGIN: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROD_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
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
 * /api/kpi — Team sabermetric KPIs (temporarily unavailable during data source migration).
 */
async function handleKPI(url: URL, _env: Env): Promise<Response> {
  const teamAbv = url.searchParams.get('team') || 'NYY';
  return json({
    team: teamAbv,
    notice: 'Sabermetric analytics temporarily unavailable — data source migration in progress',
    timestamp: new Date().toISOString(),
  });
}

/**
 * /api/analytics/accuracy — Player comparison (temporarily unavailable during data source migration).
 */
async function handleAccuracy(url: URL, _env: Env): Promise<Response> {
  return json({
    notice: 'Player comparison analytics temporarily unavailable — data source migration in progress',
    timestamp: new Date().toISOString(),
  });
}

/**
 * /api/alerts/buckets — Sabermetric tiers (temporarily unavailable during data source migration).
 */
async function handleAlertBuckets(url: URL, _env: Env): Promise<Response> {
  const teamAbv = url.searchParams.get('team') || 'NYY';
  return json({
    team: teamAbv,
    notice: 'Sabermetric tiers temporarily unavailable — data source migration in progress',
    timestamp: new Date().toISOString(),
  });
}

/**
 * /api/teams/:league — Pull team list from ESPN for the requested league.
 */
async function handleTeams(league: string, env: Env): Promise<Response> {
  const key = league.toUpperCase();
  const sportMap: Record<string, ESPNSport> = { MLB: 'mlb', NFL: 'nfl', NBA: 'nba' };
  const sport = sportMap[key];

  if (!sport) return json([], 200);

  const cacheKey = `teams:list:${key}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return json(cached, 200, { 'X-Cache': 'HIT' });

  try {
    const raw = await espnGetTeams(sport);
    const { teams } = transformTeams(raw);
    const result = teams.map((t: any) => ({
      id: t.id,
      name: t.name,
      league: key,
      abbreviation: t.abbreviation,
      logos: t.logos,
      color: t.color,
    }));
    await kvPut(env.KV, cacheKey, result, CACHE_TTL.standings);
    return json(result, 200, { 'X-Cache': 'MISS' });
  } catch {
    return json([], 200);
  }
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
 * /api/analytics/yearly-trend — Roster stat leaders (temporarily unavailable during data source migration).
 */
async function handleYearlyTrend(url: URL, _env: Env): Promise<Response> {
  const teamAbv = url.searchParams.get('team') || 'NYY';
  return json({
    team: teamAbv,
    notice: 'Roster analytics temporarily unavailable — data source migration in progress',
    timestamp: new Date().toISOString(),
  });
}

/**
 * /api/readiness — Power rankings (temporarily unavailable during data source migration).
 */
async function handleReadiness(url: URL, _env: Env): Promise<Response> {
  return json({
    notice: 'Power rankings temporarily unavailable — data source migration in progress',
    timestamp: new Date().toISOString(),
  });
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

/** @deprecated — Highlightly client kept for fallback only */
function getClient(_env: Env): HighlightlyApiClient {
  return createHighlightlyClient('');
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
// Pro Sports API handlers (ESPN)
// ---------------------------------------------------------------------------

/** Safe wrapper for ESPN handlers — catches crashes and returns 502 JSON */
async function safeESPN(
  handler: () => Promise<Response>,
  fallbackKey: string,
  fallbackValue: unknown,
  env: Env,
): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown ESPN error';
    await logError(env.KV, msg, `espn:${fallbackKey}`);
    return json(
      { [fallbackKey]: fallbackValue, meta: { error: msg, dataSource: 'espn' } },
      502,
    );
  }
}

/** Helper: format date as YYYYMMDD */
function toDateString(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  return dateStr.replace(/-/g, '');
}

// --- MLB (ESPN) ---

async function handleMLBScores(url: URL, env: Env): Promise<Response> {
  const date = toDateString(url.searchParams.get('date'));
  const cacheKey = `mlb:scores:${date || 'today'}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('mlb', date);
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

async function handleMLBStandings(env: Env): Promise<Response> {
  const cacheKey = 'mlb:standings';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('mlb');
  const payload = transformStandings(raw, 'mlb');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

async function handleMLBGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const raw = await getGameSummary('mlb', gameId);
  const payload = transformGameSummary(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
  return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
}

async function handleMLBPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const raw = await getAthlete('mlb', playerId);
  const payload = transformAthlete(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
  return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
}

async function handleMLBTeam(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:team:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const [teamRaw, rosterRaw] = await Promise.all([
    getTeamDetail('mlb', teamId),
    getTeamRoster('mlb', teamId),
  ]);

  const payload = transformTeamDetail(teamRaw, rosterRaw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleMLBTeamsList(env: Env): Promise<Response> {
  const cacheKey = 'mlb:teams:list';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('mlb');
  const payload = transformTeams(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleMLBNews(env: Env): Promise<Response> {
  const cacheKey = 'mlb:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('mlb');
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

// --- NFL (ESPN) ---

async function handleNFLScores(url: URL, env: Env): Promise<Response> {
  const date = toDateString(url.searchParams.get('date'));
  const cacheKey = `nfl:scores:${date || 'today'}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('nfl', date);
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

async function handleNFLStandings(env: Env): Promise<Response> {
  const cacheKey = 'nfl:standings';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('nfl');
  const payload = transformStandings(raw, 'nfl');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

async function handleNFLGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `nfl:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const raw = await getGameSummary('nfl', gameId);
  const payload = transformGameSummary(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
  return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
}

async function handleNFLPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `nfl:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const raw = await getAthlete('nfl', playerId);
  const payload = transformAthlete(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
  return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
}

async function handleNFLTeam(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `nfl:team:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const [teamRaw, rosterRaw] = await Promise.all([
    getTeamDetail('nfl', teamId),
    getTeamRoster('nfl', teamId),
  ]);

  const payload = transformTeamDetail(teamRaw, rosterRaw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleNFLTeamsList(env: Env): Promise<Response> {
  const cacheKey = 'nfl:teams:list';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('nfl');
  const payload = transformTeams(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleNFLNews(env: Env): Promise<Response> {
  const cacheKey = 'nfl:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('nfl');
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

// --- NBA (ESPN) ---

async function handleNBAScores(url: URL, env: Env): Promise<Response> {
  const date = toDateString(url.searchParams.get('date'));
  const cacheKey = `nba:scores:${date || 'today'}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('nba', date);
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

async function handleNBAStandings(env: Env): Promise<Response> {
  const cacheKey = 'nba:standings';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('nba');
  const payload = transformStandings(raw, 'nba');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

async function handleNBAGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.game, { 'X-Cache': 'HIT' });

  const raw = await getGameSummary('nba', gameId);
  const payload = transformGameSummary(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
  return cachedJson(payload, 200, HTTP_CACHE.game, { 'X-Cache': 'MISS' });
}

async function handleNBAPlayer(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const raw = await getAthlete('nba', playerId);
  const payload = transformAthlete(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
  return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
}

async function handleNBATeam(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:team:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const [teamRaw, rosterRaw] = await Promise.all([
    getTeamDetail('nba', teamId),
    getTeamRoster('nba', teamId),
  ]);

  const payload = transformTeamDetail(teamRaw, rosterRaw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleNBATeamsList(env: Env): Promise<Response> {
  const cacheKey = 'nba:teams:list';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('nba');
  const payload = transformTeams(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleNBANews(env: Env): Promise<Response> {
  const cacheKey = 'nba:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('nba');
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

// --- CFB (ESPN) ---

async function handleCFBScores(url: URL, env: Env): Promise<Response> {
  const date = toDateString(url.searchParams.get('date'));
  const cacheKey = `cfb:scores:${date || 'today'}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('cfb', date);
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

async function handleCFBStandings(env: Env): Promise<Response> {
  const cacheKey = 'cfb:standings';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('cfb');
  const payload = transformStandings(raw, 'cfb');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

async function handleCFBNews(env: Env): Promise<Response> {
  const cacheKey = 'cfb:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('cfb');
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

// --- CFB Articles (from D1) ---

async function handleCFBArticle(slug: string, env: Env): Promise<Response> {
  const cacheKey = `cfb:article:${slug}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  try {
    const row = await env.DB.prepare(
      `SELECT * FROM articles WHERE slug = ? AND sport = 'college-football' LIMIT 1`
    ).bind(slug).first();

    if (!row) {
      return json({ error: 'Article not found' }, 404);
    }

    const payload = {
      article: row,
      meta: { source: 'BSI D1', timezone: 'America/Chicago' },
    };
    await kvPut(env.KV, cacheKey, payload, 900);
    return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
  } catch {
    return json({ error: 'Article not found' }, 404);
  }
}

async function handleCFBArticlesList(url: URL, env: Env): Promise<Response> {
  const type = url.searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
  const cacheKey = `cfb:articles:${type}:${limit}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  try {
    const whereClause = type !== 'all'
      ? `WHERE sport = 'college-football' AND article_type = ?`
      : `WHERE sport = 'college-football'`;
    const bindings = type !== 'all' ? [type, limit] : [limit];

    const { results } = await env.DB.prepare(
      `SELECT id, article_type, title, slug, summary, home_team_name, away_team_name,
              game_date, conference, published_at
       FROM articles ${whereClause}
       ORDER BY published_at DESC LIMIT ?`
    ).bind(...bindings).all();

    const payload = { articles: results || [], meta: { source: 'BSI D1' } };
    await kvPut(env.KV, cacheKey, payload, 300);
    return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
  } catch {
    return json({ articles: [], meta: { source: 'BSI D1' } }, 200);
  }
}

// --- NBA team detail with schedule ---

async function handleNBATeamFull(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `nba:team-full:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const [teamRaw, rosterRaw, scheduleRaw] = await Promise.all([
    getTeamDetail('nba', teamId),
    getTeamRoster('nba', teamId),
    getTeamSchedule('nba', teamId),
  ]);

  const { team, roster } = transformTeamDetail(teamRaw, rosterRaw);

  // Extract schedule events
  const events = (scheduleRaw as any)?.events || [];
  const schedule = events.map((e: any) => ({
    id: e.id,
    date: e.date,
    name: e.name || '',
    shortName: e.shortName || '',
    competitions: e.competitions?.map((c: any) => ({
      competitors: c.competitors?.map((comp: any) => ({
        id: comp.id,
        homeAway: comp.homeAway,
        team: {
          id: comp.team?.id,
          displayName: comp.team?.displayName || '',
          abbreviation: comp.team?.abbreviation || '',
          logo: comp.team?.logo || comp.team?.logos?.[0]?.href || '',
        },
        score: comp.score?.displayValue || comp.score,
        winner: comp.winner,
      })) || [],
      status: c.status || {},
    })) || [],
  }));

  const payload = {
    timestamp: new Date().toISOString(),
    team: {
      ...team,
      record: {
        overall: team.record || '',
        wins: 0,
        losses: 0,
        winPercent: 0,
        home: '-',
        away: '-',
      },
    },
    roster,
    schedule,
    meta: {
      dataSource: 'espn',
      lastUpdated: new Date().toISOString(),
      season: '2024-25',
    },
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

// --- NFL Players/Leaders ---

async function handleNFLPlayers(url: URL, env: Env): Promise<Response> {
  const teamId = url.searchParams.get('teamId');

  if (teamId) {
    // Single team roster
    const cacheKey = `nfl:roster:${teamId}`;
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

    const [teamRaw, rosterRaw] = await Promise.all([
      getTeamDetail('nfl', teamId),
      getTeamRoster('nfl', teamId),
    ]);

    const { team, roster } = transformTeamDetail(teamRaw, rosterRaw);
    const payload = {
      timestamp: new Date().toISOString(),
      team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: team.logos?.[0]?.href },
      players: roster.map((p: any) => ({
        ...p,
        team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: team.logos?.[0]?.href },
      })),
      meta: { dataSource: 'espn', lastUpdated: new Date().toISOString(), totalPlayers: roster.length },
    };

    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
    return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
  }

  // All players — aggregate a few popular teams
  const cacheKey = 'nfl:players:all';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });

  const popularTeamIds = ['12', '6', '21', '8', '34', '25', '2', '33']; // KC, DAL, PHI, DET, HOU, SF, BUF, BAL
  const allPlayers: any[] = [];

  const results = await Promise.allSettled(
    popularTeamIds.map(async (id) => {
      const [teamRaw, rosterRaw] = await Promise.all([
        getTeamDetail('nfl', id),
        getTeamRoster('nfl', id),
      ]);
      return transformTeamDetail(teamRaw, rosterRaw);
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { team, roster } = result.value;
      for (const p of roster) {
        allPlayers.push({
          ...p,
          team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: team.logos?.[0]?.href },
        });
      }
    }
  }

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 500);
  const payload = {
    timestamp: new Date().toISOString(),
    players: allPlayers.slice(0, limit),
    meta: { dataSource: 'espn', lastUpdated: new Date().toISOString(), totalPlayers: allPlayers.length },
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
  return cachedJson(payload, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
}

async function handleNFLLeaders(env: Env): Promise<Response> {
  const cacheKey = 'nfl:leaders';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getLeaders('nfl') as any;

  const categories = (raw?.leaders || []).map((cat: any) => ({
    name: cat.name || cat.displayName || '',
    abbreviation: cat.abbreviation || '',
    leaders: (cat.leaders || []).slice(0, 10).map((leader: any) => ({
      name: leader.athlete?.displayName || '',
      id: leader.athlete?.id,
      team: leader.athlete?.team?.abbreviation || '',
      teamId: leader.athlete?.team?.id,
      headshot: leader.athlete?.headshot?.href || '',
      value: leader.displayValue || leader.value || '',
      stat: cat.abbreviation || cat.name || '',
    })),
  }));

  const payload = {
    categories,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

// --- College Baseball Transfer Portal ---

async function handleCollegeBaseballTransferPortal(env: Env): Promise<Response> {
  const raw = await env.KV.get('portal:college-baseball:entries', 'text');
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

  // ESPN check (pro sports — lightweight scoreboard ping)
  for (const sport of ['mlb', 'nfl', 'nba'] as const) {
    const startMs = Date.now();
    try {
      await getScoreboard(sport);
      checks[`espn_${sport}`] = {
        status: 'healthy',
        latency_ms: Date.now() - startMs,
      };
    } catch (e) {
      checks[`espn_${sport}`] = {
        status: 'unhealthy',
        latency_ms: Date.now() - startMs,
        error: e instanceof Error ? e.message : 'Unknown',
      };
    }
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
// ESPN News Proxy (CORS bypass + KV cache)
// ---------------------------------------------------------------------------

const ESPN_NEWS_ENDPOINTS: Record<string, string> = {
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
  cfb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
  ncaafb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
  cbb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news',
  'college-baseball': 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
};

async function handleESPNNews(sport: string, env: Env): Promise<Response> {
  const endpoint = ESPN_NEWS_ENDPOINTS[sport];
  if (!endpoint) {
    return json({ error: `Unknown sport: ${sport}` }, 400);
  }

  const cacheKey = `espn-news:${sport}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });
  }

  try {
    const res = await fetch(endpoint, {
      headers: { 'User-Agent': 'BlazeSportsIntel/1.0' },
    });

    if (!res.ok) {
      return json({ error: 'Failed to fetch news from ESPN', articles: [] }, 502);
    }

    const data = await res.json() as { articles?: unknown[] };
    const articles = (data.articles || []).map((a: unknown) => {
      const article = a as Record<string, unknown>;
      return {
        id: article.id || article.dataSourceIdentifier,
        headline: article.headline,
        description: article.description,
        link: (article.links as Record<string, unknown>)?.web?.href || '',
        published: article.published,
        source: 'ESPN',
        sport,
        images: article.images,
      };
    });

    const payload = { articles, lastUpdated: new Date().toISOString() };
    await kvPut(env.KV, cacheKey, payload, 900); // 15 min TTL
    return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
  } catch {
    return json({ error: 'ESPN news fetch failed', articles: [] }, 502);
  }
}

// ---------------------------------------------------------------------------
// CV Intelligence API Handlers
// ---------------------------------------------------------------------------

function cvApiResponse<T>(data: T, source: string, cacheHit: boolean): object {
  return {
    data,
    meta: {
      source,
      fetched_at: new Date().toISOString(),
      timezone: 'America/Chicago',
      cache_hit: cacheHit,
    },
  };
}

async function handleCVPitcherMechanics(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `cv:pitcher:${playerId}:latest`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'cv-cache', true), 200, 300, { 'X-Cache': 'HIT' });
  }

  try {
    const result = await env.DB.prepare(
      `SELECT * FROM pitcher_biomechanics WHERE player_id = ? ORDER BY game_date DESC LIMIT 1`
    ).bind(playerId).first();

    if (!result) {
      return json(cvApiResponse(null, 'cv-d1', false), 404);
    }

    await kvPut(env.KV, cacheKey, result, 300);
    return cachedJson(cvApiResponse(result, 'cv-d1', false), 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: 'Failed to fetch pitcher mechanics' }, 500);
  }
}

async function handleCVPitcherHistory(playerId: string, url: URL, env: Env): Promise<Response> {
  const range = url.searchParams.get('range') || '30d';
  const days = parseInt(range.replace('d', ''), 10) || 30;
  const cacheKey = `cv:pitcher:${playerId}:history:${days}d`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'cv-cache', true), 200, 3600, { 'X-Cache': 'HIT' });
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const { results } = await env.DB.prepare(
      `SELECT * FROM pitcher_biomechanics WHERE player_id = ? AND game_date >= ? ORDER BY game_date ASC`
    ).bind(playerId, cutoffStr).all();

    await kvPut(env.KV, cacheKey, results, 3600);
    return cachedJson(cvApiResponse(results, 'cv-d1', false), 200, 3600, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: 'Failed to fetch pitcher history' }, 500);
  }
}

async function handleCVInjuryAlerts(url: URL, env: Env): Promise<Response> {
  const sport = url.searchParams.get('sport') || 'mlb';
  const threshold = parseInt(url.searchParams.get('threshold') || '70', 10);
  const clampedThreshold = Math.max(0, Math.min(100, threshold));

  try {
    const league = sport === 'college-baseball' ? 'college-baseball' : 'mlb';
    const { results } = await env.DB.prepare(
      `SELECT * FROM pitcher_biomechanics WHERE league = ? AND fatigue_score >= ? ORDER BY fatigue_score DESC LIMIT 25`
    ).bind(league, clampedThreshold).all();

    return cachedJson(cvApiResponse(results, 'cv-d1', false), 200, 60);
  } catch (err) {
    return json({ error: 'Failed to fetch injury alerts' }, 500);
  }
}

async function handleCVAdoption(url: URL, env: Env): Promise<Response> {
  const sport = url.searchParams.get('sport');
  const cacheKey = `cv:adoption:${sport || 'all'}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'cv-cache', true), 200, 86400, { 'X-Cache': 'HIT' });
  }

  try {
    const query = sport
      ? `SELECT * FROM cv_adoption_tracker WHERE sport = ? ORDER BY verified_date DESC`
      : `SELECT * FROM cv_adoption_tracker ORDER BY sport, verified_date DESC`;
    const stmt = sport ? env.DB.prepare(query).bind(sport) : env.DB.prepare(query);
    const { results } = await stmt.all();

    await kvPut(env.KV, cacheKey, results, 86400);
    return cachedJson(cvApiResponse(results, 'cv-d1', false), 200, 86400, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: 'Failed to fetch CV adoption data' }, 500);
  }
}

// ---------------------------------------------------------------------------
// Model Health API (D1-backed accuracy tracking)
// ---------------------------------------------------------------------------

async function handleModelHealth(env: Env): Promise<Response> {
  const cacheKey = 'model-health:all';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, 600, { 'X-Cache': 'HIT' });
  }

  try {
    const result = await env.DB
      .prepare(
        `SELECT week, accuracy, sport, created_at as recordedAt
         FROM model_health
         ORDER BY created_at DESC
         LIMIT 12`
      )
      .all();

    const weeks = result.results || [];
    const payload = { weeks, lastUpdated: new Date().toISOString() };
    await kvPut(env.KV, cacheKey, payload, 600);
    return cachedJson(payload, 200, 600, { 'X-Cache': 'MISS' });
  } catch {
    // Return placeholder if table doesn't exist yet
    const placeholder = {
      weeks: [
        { week: 'W1', accuracy: 0.72, sport: 'all', recordedAt: new Date().toISOString() },
        { week: 'W2', accuracy: 0.74, sport: 'all', recordedAt: new Date().toISOString() },
        { week: 'W3', accuracy: 0.71, sport: 'all', recordedAt: new Date().toISOString() },
        { week: 'W4', accuracy: 0.76, sport: 'all', recordedAt: new Date().toISOString() },
      ],
      lastUpdated: new Date().toISOString(),
      note: 'Using placeholder data - model_health table not yet initialized',
    };
    return json(placeholder, 200);
  }
}

// ---------------------------------------------------------------------------
// Prediction Tracking
// ---------------------------------------------------------------------------

interface PredictionPayload {
  gameId: string;
  sport: string;
  predictedWinner: string;
  confidence: number;
  spread?: number;
  overUnder?: number;
}

async function handlePredictionSubmit(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as PredictionPayload;
    const { gameId, sport, predictedWinner, confidence, spread, overUnder } = body;

    if (!gameId || !sport || !predictedWinner) {
      return json({ error: 'Missing required fields: gameId, sport, predictedWinner' }, 400);
    }

    await env.DB
      .prepare(
        `INSERT INTO predictions (game_id, sport, predicted_winner, confidence, spread, over_under, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(gameId, sport, predictedWinner, confidence || 0, spread || null, overUnder || null)
      .run();

    return json({ success: true, gameId });
  } catch {
    return json({ error: 'Failed to record prediction' }, 500);
  }
}

async function handlePredictionAccuracy(env: Env): Promise<Response> {
  const cacheKey = 'predictions:accuracy';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
  }

  try {
    const result = await env.DB
      .prepare(
        `SELECT
           p.sport,
           COUNT(*) as total,
           SUM(CASE WHEN p.predicted_winner = o.actual_winner THEN 1 ELSE 0 END) as correct
         FROM predictions p
         INNER JOIN outcomes o ON p.game_id = o.game_id
         GROUP BY p.sport`
      )
      .all();

    const bySport: Record<string, { total: number; correct: number; accuracy: number }> = {};
    let totalAll = 0;
    let correctAll = 0;

    for (const row of result.results || []) {
      const r = row as { sport: string; total: number; correct: number };
      bySport[r.sport] = {
        total: r.total,
        correct: r.correct,
        accuracy: r.total > 0 ? r.correct / r.total : 0,
      };
      totalAll += r.total;
      correctAll += r.correct;
    }

    const payload = {
      overall: {
        total: totalAll,
        correct: correctAll,
        accuracy: totalAll > 0 ? correctAll / totalAll : 0,
      },
      bySport,
      lastUpdated: new Date().toISOString(),
    };

    await kvPut(env.KV, cacheKey, payload, 300);
    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch {
    return json({
      overall: { total: 0, correct: 0, accuracy: 0 },
      bySport: {},
      note: 'Predictions table not yet initialized or no data available',
    }, 200);
  }
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

/**
 * Proxy API requests to Pages Functions (canonical SportsDataIO handlers).
 * Optional `rewritePathname` supports legacy alias migration without redirect loops.
 */
async function proxyApiToPages(
  request: Request,
  env: Env,
  rewritePathname?: string,
): Promise<Response> {
  const origin = env.PAGES_ORIGIN || 'https://blazesportsintel.pages.dev';
  const requestUrl = new URL(request.url);
  const pathname = rewritePathname || requestUrl.pathname;
  const pagesUrl = `${origin}${pathname}${requestUrl.search}`;

  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: request.headers,
    redirect: 'follow',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = request.body;
  }

  const upstream = await fetch(pagesUrl, init);
  const response = new Response(upstream.body, upstream);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  response.headers.set('X-BSI-API-Proxy', 'pages-functions');
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
// Intel News Proxy — CORS-safe ESPN news with KV caching
// ---------------------------------------------------------------------------

/** ESPN news URL map — mirrors the frontend ESPN_NEWS_MAP */
const INTEL_ESPN_NEWS: Record<string, string> = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
  ncaafb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
  cbb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news',
  d1bb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
};

async function handleIntelNews(url: URL, env: Env): Promise<Response> {
  const sportParam = url.searchParams.get('sport') || 'all';

  // Determine which sports to fetch news for
  const sportsToFetch = sportParam === 'all'
    ? Object.keys(INTEL_ESPN_NEWS)
    : sportParam.split(',').filter((s) => s in INTEL_ESPN_NEWS);

  if (sportsToFetch.length === 0) {
    return json({ articles: [], error: 'Invalid sport parameter' }, 400);
  }

  const results: Array<{ sport: string; data: Record<string, unknown> }> = [];

  for (const sport of sportsToFetch) {
    const cacheKey = `intel:news:${sport}`;

    // Check KV cache first
    const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
    if (cached) {
      results.push({ sport, data: cached });
      continue;
    }

    // Fetch from ESPN
    try {
      const espnUrl = INTEL_ESPN_NEWS[sport];
      if (!espnUrl) continue;

      const res = await fetch(espnUrl, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        // Cache in KV for 2 minutes
        await kvPut(env.KV, cacheKey, data, 120);
        results.push({ sport, data });
      } else {
        results.push({ sport, data: { articles: [] } });
      }
    } catch {
      results.push({ sport, data: { articles: [] } });
    }
  }

  return cachedJson(results, 200, HTTP_CACHE.news);
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

function checkInMemoryRateLimit(ip: string): boolean {
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
      if (!checkInMemoryRateLimit(ip)) {
        return json({ error: 'Rate limit exceeded. Try again shortly.' }, 429);
      }
    }

    try {
      // ----- MCP Protocol -----
      if (pathname === '/mcp') return handleMcpRequest(request, env);

      // ----- Health / status -----
      if (pathname === '/api/health' || pathname === '/health') return handleHealth(env);
      if (pathname === '/api/admin/health') return handleAdminHealth(env);

      // ----- News ticker (inline handler, no separate worker needed) -----
      if (pathname === '/api/news/ticker') {
        return json({
          items: [
            { id: '1', text: 'College Baseball scores updated live every 30 seconds' },
            { id: '2', text: 'MLB, NFL, and NBA coverage now available' },
            { id: '3', text: 'Real-time analytics powered by official data sources' },
          ],
        });
      }

      // ----- Agent health (system status check) -----
      if (pathname === '/api/agent-health') {
        return json({ active: true, status: 'operational', timestamp: new Date().toISOString() });
      }

      // ----- Intel news proxy (ESPN → Worker → client, CORS-safe + KV cached) -----
      if (pathname === '/api/intel/news') {
        return handleIntelNews(url, env);
      }

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

      // ----- Canonical SportsDataIO API routes (proxied to Pages Functions) -----
      // Legacy aliases are rewritten to canonical handlers to avoid split-brain behavior.
      if (pathname === '/api/mlb-standings') {
        return proxyApiToPages(request, env, '/api/mlb/standings');
      }
      if (pathname === '/api/nfl-standings') {
        return proxyApiToPages(request, env, '/api/nfl/standings');
      }
      if (pathname === '/api/nba-standings') {
        return proxyApiToPages(request, env, '/api/nba/standings');
      }
      if (pathname === '/api/ncaa-standings') {
        return proxyApiToPages(request, env, '/api/cfb/standings');
      }
      if (pathname.startsWith('/api/ncaa/') && url.searchParams.get('sport') === 'football') {
        const suffix = pathname.replace('/api/ncaa/', '');
        const mapped =
          suffix === 'scores'
            ? 'scores'
            : suffix === 'scoreboard'
              ? 'scoreboard'
              : suffix === 'rankings' || suffix === 'standings'
                ? 'standings'
                : suffix;
        return proxyApiToPages(request, env, `/api/cfb/${mapped}`);
      }

      if (pathname.startsWith('/api/cfb-espn/')) {
        return proxyApiToPages(request, env, pathname.replace('/api/cfb-espn', '/api/cfb'));
      }
      if (pathname.startsWith('/api/football/')) {
        return proxyApiToPages(request, env, pathname.replace('/api/football', '/api/cfb'));
      }
      if (pathname.startsWith('/api/basketball/')) {
        return proxyApiToPages(request, env, pathname.replace('/api/basketball', '/api/cbb'));
      }

      // Proxy non-ESPN sport routes and legacy aliases to Pages Functions.
      // NFL, NBA, MLB, CFB, CBB have ESPN handlers below — do NOT proxy those.
      if (
        pathname === '/api/golf' ||
        pathname.startsWith('/api/golf/') ||
        pathname === '/api/grid' ||
        pathname.startsWith('/api/grid/') ||
        pathname === '/api/live' ||
        pathname.startsWith('/api/live/') ||
        pathname === '/api/live-scores' ||
        pathname === '/api/live-games' ||
        pathname === '/api/sports-data-real' ||
        pathname === '/api/sports-data-real-nfl' ||
        pathname === '/api/sports-data-real-nba' ||
        pathname === '/api/sports-data-real-mlb'
      ) {
        return proxyApiToPages(request, env);
      }

      // ----- CFB data routes (ESPN) -----
      if (pathname === '/api/ncaa/scores' && url.searchParams.get('sport') === 'football') {
        return safeESPN(() => handleCFBScores(url, env), 'games', [], env);
      }
      if (pathname === '/api/ncaa/standings' && url.searchParams.get('sport') === 'football') {
        return safeESPN(() => handleCFBStandings(env), 'standings', [], env);
      }
      if (pathname === '/api/cfb/scores') {
        return safeESPN(() => handleCFBScores(url, env), 'games', [], env);
      }
      if (pathname === '/api/cfb/standings') {
        return safeESPN(() => handleCFBStandings(env), 'standings', [], env);
      }
      if (pathname === '/api/cfb/news') {
        return safeESPN(() => handleCFBNews(env), 'articles', [], env);
      }

      // CFB Articles (D1)
      if (pathname === '/api/college-football/articles') {
        return handleCFBArticlesList(url, env);
      }
      const cfbArticleMatch = matchRoute(pathname, '/api/college-football/articles/:slug');
      if (cfbArticleMatch) return handleCFBArticle(cfbArticleMatch.params.slug, env);

      // College Baseball Transfer Portal
      if (pathname === '/api/college-baseball/transfer-portal') {
        return handleCollegeBaseballTransferPortal(env);
      }

      const teamMatch = matchRoute(pathname, '/api/college-baseball/teams/:teamId');
      if (teamMatch) return handleCollegeBaseballTeam(teamMatch.params.teamId, env);

      const playerMatch = matchRoute(pathname, '/api/college-baseball/players/:playerId');
      if (playerMatch) return handleCollegeBaseballPlayer(playerMatch.params.playerId, env);

      const gameMatch = matchRoute(pathname, '/api/college-baseball/games/:gameId');
      if (gameMatch) return handleCollegeBaseballGame(gameMatch.params.gameId, env);

      // ----- MLB data routes (ESPN) -----
      if (pathname === '/api/mlb/scores')
        return safeESPN(() => handleMLBScores(url, env), 'games', [], env);
      if (pathname === '/api/mlb/standings')
        return safeESPN(() => handleMLBStandings(env), 'standings', [], env);
      if (pathname === '/api/mlb/news')
        return safeESPN(() => handleMLBNews(env), 'articles', [], env);
      if (pathname === '/api/mlb/teams')
        return safeESPN(() => handleMLBTeamsList(env), 'teams', [], env);

      const mlbGameMatch = matchRoute(pathname, '/api/mlb/game/:gameId');
      if (mlbGameMatch)
        return safeESPN(() => handleMLBGame(mlbGameMatch.params.gameId, env), 'game', null, env);

      const mlbPlayerMatch = matchRoute(pathname, '/api/mlb/players/:playerId');
      if (mlbPlayerMatch)
        return safeESPN(() => handleMLBPlayer(mlbPlayerMatch.params.playerId, env), 'player', null, env);

      const mlbTeamMatch = matchRoute(pathname, '/api/mlb/teams/:teamId');
      if (mlbTeamMatch)
        return safeESPN(() => handleMLBTeam(mlbTeamMatch.params.teamId, env), 'team', null, env);

      // ----- NFL data routes (ESPN) -----
      if (pathname === '/api/nfl/scores')
        return safeESPN(() => handleNFLScores(url, env), 'games', [], env);
      if (pathname === '/api/nfl/standings')
        return safeESPN(() => handleNFLStandings(env), 'standings', [], env);
      if (pathname === '/api/nfl/news')
        return safeESPN(() => handleNFLNews(env), 'articles', [], env);
      if (pathname === '/api/nfl/teams')
        return safeESPN(() => handleNFLTeamsList(env), 'teams', [], env);
      if (pathname === '/api/nfl/players')
        return safeESPN(() => handleNFLPlayers(url, env), 'players', [], env);
      if (pathname === '/api/nfl/leaders')
        return safeESPN(() => handleNFLLeaders(env), 'categories', [], env);

      const nflGameMatch = matchRoute(pathname, '/api/nfl/game/:gameId');
      if (nflGameMatch)
        return safeESPN(() => handleNFLGame(nflGameMatch.params.gameId, env), 'game', null, env);

      const nflPlayerMatch = matchRoute(pathname, '/api/nfl/players/:playerId');
      if (nflPlayerMatch)
        return safeESPN(() => handleNFLPlayer(nflPlayerMatch.params.playerId, env), 'player', null, env);

      const nflTeamMatch = matchRoute(pathname, '/api/nfl/teams/:teamId');
      if (nflTeamMatch)
        return safeESPN(() => handleNFLTeam(nflTeamMatch.params.teamId, env), 'team', null, env);

      // ----- NBA data routes (ESPN) -----
      if (pathname === '/api/nba/scores' || pathname === '/api/nba/scoreboard') {
        return safeESPN(() => handleNBAScores(url, env), 'games', [], env);
      }
      if (pathname === '/api/nba/standings')
        return safeESPN(() => handleNBAStandings(env), 'standings', [], env);
      if (pathname === '/api/nba/news')
        return safeESPN(() => handleNBANews(env), 'articles', [], env);
      if (pathname === '/api/nba/teams')
        return safeESPN(() => handleNBATeamsList(env), 'teams', [], env);

      const nbaGameMatch = matchRoute(pathname, '/api/nba/game/:gameId');
      if (nbaGameMatch)
        return safeESPN(() => handleNBAGame(nbaGameMatch.params.gameId, env), 'game', null, env);

      const nbaPlayerMatch = matchRoute(pathname, '/api/nba/players/:playerId');
      if (nbaPlayerMatch)
        return safeESPN(() => handleNBAPlayer(nbaPlayerMatch.params.playerId, env), 'player', null, env);

      const nbaTeamMatch = matchRoute(pathname, '/api/nba/teams/:teamId');
      if (nbaTeamMatch)
        return safeESPN(() => handleNBATeamFull(nbaTeamMatch.params.teamId, env), 'team', null, env);

      // ----- R2 Game assets -----
      const assetPath = matchWildcardRoute(pathname, '/api/games/assets/');
      if (assetPath) return handleGameAsset(assetPath, env);

      // ----- CV Intelligence Routes -----
      const cvPitcherMatch = matchRoute(pathname, '/api/cv/pitcher/:playerId/mechanics');
      if (cvPitcherMatch) return handleCVPitcherMechanics(cvPitcherMatch.params.playerId, env);

      const cvPitcherHistoryMatch = matchRoute(pathname, '/api/cv/pitcher/:playerId/mechanics/history');
      if (cvPitcherHistoryMatch) return handleCVPitcherHistory(cvPitcherHistoryMatch.params.playerId, url, env);

      if (pathname === '/api/cv/alerts/injury-risk') return handleCVInjuryAlerts(url, env);

      if (pathname === '/api/cv/adoption') return handleCVAdoption(url, env);

      // ----- Search -----
      if (pathname === '/api/search') return handleSearch(url, env);

      // ----- ESPN News proxy -----
      const newsMatch = matchRoute(pathname, '/api/news/:sport');
      if (newsMatch) return handleESPNNews(newsMatch.params.sport, env);

      // ----- Model Health -----
      if (pathname === '/api/model-health') return handleModelHealth(env);

      // ----- Predictions -----
      if (request.method === 'POST' && pathname === '/api/predictions') {
        return handlePredictionSubmit(request, env);
      }
      if (pathname === '/api/predictions/accuracy') {
        return handlePredictionAccuracy(env);
      }

      // ----- Feedback -----
      if (request.method === 'POST' && pathname === '/api/feedback') {
        return handleFeedback(request, env);
      }

      // ----- Existing API endpoints -----
      if (pathname === '/api/kpi' || pathname === '/kpi')
        return handleKPI(url, env);
      if (pathname === '/api/analytics/accuracy' || pathname === '/analytics/accuracy')
        return handleAccuracy(url, env);
      if (pathname === '/api/alerts/buckets' || pathname === '/alerts/buckets')
        return handleAlertBuckets(url, env);
      if (pathname === '/api/analytics/yearly-trend' || pathname === '/analytics/yearly-trend')
        return handleYearlyTrend(url, env);
      if (pathname === '/api/readiness' || pathname === '/readiness')
        return handleReadiness(url, env);
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
        return safeESPN(() => handleTeams(teamsMatch.params.league, env), 'teams', [], env);

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
