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
import {
  SportsDataIOClient,
  transformSDIOMLBScores,
  transformSDIOMLBStandings,
  transformSDIONFLScores,
  transformSDIONFLStandings,
  transformSDIONBAScores,
  transformSDIONBAStandings,
  transformSDIOCFBScores,
  transformSDIOCFBStandings,
  transformSDIOTeams,
  transformSDIONews,
  transformSDIOMLBBoxScore,
  transformSDIOPlayers,
  transformSDIOPlayer,
} from '../lib/api-clients/sportsdataio-api';
import { fetchWithFallback } from '../lib/api-clients/data-fetcher';

export interface Env {
  KV: KVNamespace;
  CACHE: DurableObjectNamespace;
  PORTAL_POLLER: DurableObjectNamespace;
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  ENVIRONMENT: string;
  API_VERSION: string;
  PAGES_ORIGIN: string;
  SPORTS_DATA_IO_API_KEY?: string;
  RAPIDAPI_KEY?: string;
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

/** Only BSI-owned Pages projects — not the entire .pages.dev namespace */
const ALLOWED_PAGES_DOMAINS = ['blazesportsintel.pages.dev', 'blazecraft.pages.dev'];

function corsOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin') ?? '';
  if (PROD_ORIGINS.has(origin)) return origin;
  if (ALLOWED_PAGES_DOMAINS.some(d => origin === `https://${d}` || origin.endsWith(`.${d}`))) return origin;
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
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.posthog.com https://us.i.posthog.com https://api.stripe.com",
    "frame-src 'self' https://*.cloudflarestream.com https://js.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
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

function dataHeaders(lastUpdated: string, source = 'highlightly'): Record<string, string> {
  return {
    'X-Last-Updated': lastUpdated,
    'X-Data-Source': source,
  };
}

/** Get SportsDataIO client if API key is configured, otherwise null */
function getSDIOClient(env: Env): SportsDataIOClient | null {
  if (!env.SPORTS_DATA_IO_API_KEY) return null;
  return new SportsDataIOClient(env.SPORTS_DATA_IO_API_KEY);
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
    const result = teams.map((t) => ({
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

/** Highlightly client for college baseball — primary source when RAPIDAPI_KEY is set */
function getHighlightlyClient(env: Env): HighlightlyApiClient | null {
  if (!env.RAPIDAPI_KEY) return null;
  return createHighlightlyClient(env.RAPIDAPI_KEY);
}

async function handleCollegeBaseballScores(
  url: URL,
  env: Env
): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const cacheKey = `cb:scores:${date || 'today'}`;
  const empty = { data: [], totalCount: 0 };
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.scores, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Try Highlightly first if key is available
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getMatches('NCAA', date);
      if (result.success && result.data) {
        await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.scores);
        return cachedJson(result.data, 200, HTTP_CACHE.scores, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Highlightly failed — fall through to NCAA
    }
  }

  // NCAA fallback
  try {
    const client = getCollegeClient();
    const result = await client.getMatches('NCAA', date);

    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.scores);
    }

    return cachedJson(result.data ?? empty, result.success ? 200 : 502, HTTP_CACHE.scores, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json(empty, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

async function handleCollegeBaseballStandings(
  url: URL,
  env: Env
): Promise<Response> {
  const conference = url.searchParams.get('conference') || 'NCAA';
  const cacheKey = `cb:standings:v2:${conference}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.standings, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  const wrap = (data: unknown[], source: string, ts: string) => ({
    success: true,
    data,
    conference,
    timestamp: ts,
    meta: { dataSource: source, lastUpdated: ts, sport: 'college-baseball' },
  });

  // Try Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getStandings(conference);
      if (result.success && result.data) {
        const payload = wrap(Array.isArray(result.data) ? result.data : [], 'highlightly', result.timestamp);
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
        return cachedJson(payload, 200, HTTP_CACHE.standings, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Fall through to NCAA
    }
  }

  const client = getCollegeClient();
  const result = await client.getStandings(conference);
  const data = Array.isArray(result.data) ? result.data : [];
  const payload = wrap(data, 'ncaa', result.timestamp);

  if (result.success) {
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  }

  return cachedJson(payload, result.success ? 200 : 502, HTTP_CACHE.standings, {
    ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
  });
}

async function handleCollegeBaseballRankings(env: Env): Promise<Response> {
  const cacheKey = 'cb:rankings:v2';
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.rankings, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Try Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getRankings();
      if (result.success && result.data) {
        const payload = { rankings: result.data, meta: { dataSource: 'highlightly', lastUpdated: result.timestamp, sport: 'college-baseball' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
        return cachedJson(payload, 200, HTTP_CACHE.rankings, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Fall through to ESPN
    }
  }

  // ESPN college baseball rankings — returns { rankings: [{ name, ranks: [...] }] }
  try {
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(espnUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const raw = (await res.json()) as Record<string, unknown>;
      const rankings = (raw.rankings as unknown[]) || [];
      const payload = {
        rankings,
        timestamp: now,
        meta: { dataSource: 'espn', lastUpdated: now, sport: 'college-baseball' },
      };
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
      return cachedJson(payload, 200, HTTP_CACHE.rankings, {
        ...dataHeaders(now, 'espn'), 'X-Cache': 'MISS',
      });
    }
  } catch {
    // Fall through to ncaa-api client
  }

  // Final fallback: ncaa-api client (returns raw array)
  try {
    const client = getCollegeClient();
    const result = await client.getRankings();
    const rankings = Array.isArray(result.data) ? result.data : [];
    const payload = {
      rankings,
      timestamp: result.timestamp,
      meta: { dataSource: 'ncaa', lastUpdated: result.timestamp, sport: 'college-baseball' },
    };

    if (result.success) {
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
    }

    return cachedJson(payload, result.success ? 200 : 502, HTTP_CACHE.rankings, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json({ rankings: [], meta: { dataSource: 'error', lastUpdated: now, sport: 'college-baseball' } }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

// ---------------------------------------------------------------------------
// Team Detail Transform — Highlightly → Team interface
// ---------------------------------------------------------------------------

function transformHighlightlyTeam(
  team: HighlightlyTeamDetail,
  players: HighlightlyPlayer[]
): Record<string, unknown> {
  return {
    id: String(team.id),
    name: team.name,
    abbreviation: team.shortName ?? '',
    mascot: '',
    conference: team.conference?.name ?? '',
    division: 'D1',
    logo: team.logo,
    location: { city: '', state: '', stadium: undefined, capacity: undefined },
    colors: team.primaryColor ? { primary: team.primaryColor, secondary: team.secondaryColor ?? '' } : undefined,
    roster: players.map((p) => ({
      id: String(p.id),
      name: p.name,
      number: p.jerseyNumber ?? '',
      position: p.position ?? '',
      year: '',
      stats: p.statistics?.batting
        ? { avg: p.statistics.batting.battingAverage, hr: p.statistics.batting.homeRuns, rbi: p.statistics.batting.rbi }
        : p.statistics?.pitching
          ? { era: p.statistics.pitching.era, wins: p.statistics.pitching.wins, so: p.statistics.pitching.strikeouts }
          : undefined,
    })),
  };
}

function transformEspnTeam(
  raw: Record<string, unknown>,
  athletes: unknown[]
): Record<string, unknown> {
  const team = (raw.team ?? raw) as Record<string, unknown>;
  const loc = team.location as Record<string, unknown> | undefined;
  const logos = (team.logos as Array<Record<string, unknown>>) ?? [];
  const colors = (team.color as string) ?? undefined;
  const altColor = (team.alternateColor as string) ?? undefined;
  const record = (team.record as Record<string, unknown>) ?? {};
  const items = (record.items as Array<Record<string, unknown>>) ?? [];
  const overall = items.find((it) => (it.type as string) === 'total') ?? items[0];
  const overallStats = (overall?.stats as Array<Record<string, unknown>>) ?? [];

  const getStat = (name: string): number => {
    const s = overallStats.find((st) => st.name === name || st.abbreviation === name);
    return Number(s?.value ?? 0);
  };

  return {
    id: String(team.id ?? ''),
    name: (team.displayName as string) ?? (team.name as string) ?? '',
    abbreviation: (team.abbreviation as string) ?? '',
    mascot: (team.nickname as string) ?? '',
    conference: ((team.groups as Record<string, unknown>)?.name as string) ?? '',
    division: 'D1',
    logo: logos[0]?.href as string | undefined,
    location: {
      city: (loc?.city as string) ?? '',
      state: (loc?.state as string) ?? '',
      stadium: (team.venue as Record<string, unknown>)?.fullName as string | undefined,
      capacity: (team.venue as Record<string, unknown>)?.capacity as number | undefined,
    },
    colors: colors ? { primary: `#${colors}`, secondary: altColor ? `#${altColor}` : '' } : undefined,
    stats: overall ? {
      wins: getStat('wins'),
      losses: getStat('losses'),
      confWins: 0,
      confLosses: 0,
      rpi: 0,
      streak: undefined,
      runsScored: 0,
      runsAllowed: 0,
      battingAvg: 0,
      era: 0,
    } : undefined,
    roster: (athletes as Record<string, unknown>[]).map((a) => {
      const items2 = (a.items ?? a.athletes ?? [a]) as Record<string, unknown>[];
      return items2.map((p) => ({
        id: String(p.id ?? ''),
        name: (p.displayName as string) ?? (p.fullName as string) ?? '',
        number: String(p.jersey ?? ''),
        position: ((p.position as Record<string, unknown>)?.abbreviation as string) ?? '',
        year: (p.experience as Record<string, unknown>)?.displayValue as string ?? '',
      }));
    }).flat(),
  };
}

async function handleCollegeBaseballTeam(
  teamId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:team:${teamId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.team, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const [teamResult, playersResult] = await Promise.all([
        hlClient.getTeam(parseInt(teamId, 10)),
        hlClient.getTeamPlayers(parseInt(teamId, 10)),
      ]);

      if (teamResult.success && teamResult.data) {
        const team = transformHighlightlyTeam(
          teamResult.data,
          playersResult.success ? (playersResult.data?.data ?? []) : []
        );
        const payload = { team, meta: { dataSource: 'highlightly', lastUpdated: teamResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
        return cachedJson(payload, 200, HTTP_CACHE.team, {
          ...dataHeaders(teamResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Fall through to ESPN
    }
  }

  // ESPN/NCAA fallback
  try {
    const client = getCollegeClient();
    const [teamResult, playersResult] = await Promise.all([
      client.getTeam(parseInt(teamId, 10)),
      client.getTeamPlayers(parseInt(teamId, 10)),
    ]);

    if (teamResult.success && teamResult.data) {
      const team = transformEspnTeam(
        teamResult.data as Record<string, unknown>,
        playersResult.data?.data ?? []
      );
      const payload = { team, meta: { dataSource: 'espn', lastUpdated: teamResult.timestamp, timezone: 'America/Chicago' } };
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
      return cachedJson(payload, 200, HTTP_CACHE.team, {
        ...dataHeaders(teamResult.timestamp, 'espn'), 'X-Cache': 'MISS',
      });
    }

    return json({ team: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  } catch {
    return json({ team: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

// ---------------------------------------------------------------------------
// Player Detail Transform — Highlightly → PlayerData interface
// ---------------------------------------------------------------------------

function transformHighlightlyPlayer(
  player: HighlightlyPlayer,
  stats: HighlightlyPlayerStats | null
): Record<string, unknown> {
  return {
    player: {
      id: player.id,
      name: player.name,
      firstName: player.firstName,
      lastName: player.lastName,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      height: player.height,
      weight: player.weight,
      dateOfBirth: player.dateOfBirth,
      team: player.team
        ? { id: player.team.id, name: player.team.name, shortName: player.team.shortName, conference: player.team.conference ? { name: player.team.conference.name } : undefined }
        : undefined,
    },
    statistics: stats
      ? {
          batting: stats.batting
            ? {
                games: stats.batting.games, atBats: stats.batting.atBats, runs: stats.batting.runs,
                hits: stats.batting.hits, doubles: stats.batting.doubles, triples: stats.batting.triples,
                homeRuns: stats.batting.homeRuns, rbi: stats.batting.rbi, walks: stats.batting.walks,
                strikeouts: stats.batting.strikeouts, stolenBases: stats.batting.stolenBases,
                battingAverage: stats.batting.battingAverage, onBasePercentage: stats.batting.onBasePercentage,
                sluggingPercentage: stats.batting.sluggingPercentage, ops: stats.batting.ops,
              }
            : undefined,
          pitching: stats.pitching
            ? {
                games: stats.pitching.games, gamesStarted: stats.pitching.gamesStarted,
                wins: stats.pitching.wins, losses: stats.pitching.losses, saves: stats.pitching.saves,
                inningsPitched: stats.pitching.inningsPitched, hits: stats.pitching.hits,
                earnedRuns: stats.pitching.earnedRuns, walks: stats.pitching.walks,
                strikeouts: stats.pitching.strikeouts, era: stats.pitching.era, whip: stats.pitching.whip,
              }
            : undefined,
        }
      : null,
  };
}

function transformEspnPlayer(
  raw: Record<string, unknown>,
  overview: Record<string, unknown> | null
): Record<string, unknown> {
  const athlete = (raw.athlete ?? raw) as Record<string, unknown>;
  const pos = athlete.position as Record<string, unknown> | undefined;
  const team = athlete.team as Record<string, unknown> | undefined;
  const groups = team?.groups as Record<string, unknown> | undefined;

  const player: Record<string, unknown> = {
    id: Number(athlete.id ?? 0),
    name: (athlete.displayName as string) ?? (athlete.fullName as string) ?? '',
    firstName: athlete.firstName as string | undefined,
    lastName: athlete.lastName as string | undefined,
    position: (pos?.abbreviation as string) ?? (pos?.name as string),
    jerseyNumber: String(athlete.jersey ?? ''),
    height: (athlete.displayHeight as string) ?? undefined,
    weight: athlete.weight != null ? Number(athlete.weight) : undefined,
    dateOfBirth: (athlete.dateOfBirth as string) ?? undefined,
    team: team
      ? {
          id: Number(team.id ?? 0),
          name: (team.displayName as string) ?? (team.name as string) ?? '',
          shortName: (team.abbreviation as string) ?? undefined,
          conference: groups ? { name: (groups.name as string) ?? '' } : undefined,
        }
      : undefined,
  };

  // Extract statistics from overview endpoint
  let statistics: Record<string, unknown> | null = null;
  if (overview) {
    const categories = (overview.splitCategories ?? overview.categories ?? overview.statistics) as Record<string, unknown>[] | undefined;
    if (categories && Array.isArray(categories)) {
      const battingCat = categories.find((c) =>
        ((c.name as string) ?? '').toLowerCase().includes('batting') || ((c.displayName as string) ?? '').toLowerCase().includes('batting')
      );
      const pitchingCat = categories.find((c) =>
        ((c.name as string) ?? '').toLowerCase().includes('pitching') || ((c.displayName as string) ?? '').toLowerCase().includes('pitching')
      );

      const extractStats = (cat: Record<string, unknown> | undefined): Record<string, number> => {
        if (!cat) return {};
        const splits = (cat.splits as Record<string, unknown>[]) ?? [];
        const season = splits[0]; // First split is usually the current season
        if (!season) return {};
        const statNames = (cat.labels as string[]) ?? (cat.names as string[]) ?? [];
        const statValues = (season.stats as (string | number)[]) ?? [];
        const map: Record<string, number> = {};
        statNames.forEach((name, i) => { map[name.toLowerCase()] = Number(statValues[i] ?? 0); });
        return map;
      };

      const bs = extractStats(battingCat);
      if (Object.keys(bs).length > 0) {
        statistics = statistics ?? {};
        (statistics as Record<string, unknown>).batting = {
          games: bs.gp ?? bs.g ?? 0, atBats: bs.ab ?? 0, runs: bs.r ?? 0,
          hits: bs.h ?? 0, doubles: bs['2b'] ?? 0, triples: bs['3b'] ?? 0,
          homeRuns: bs.hr ?? 0, rbi: bs.rbi ?? 0, walks: bs.bb ?? 0,
          strikeouts: bs.so ?? bs.k ?? 0, stolenBases: bs.sb ?? 0,
          battingAverage: bs.avg ?? bs.ba ?? 0, onBasePercentage: bs.obp ?? 0,
          sluggingPercentage: bs.slg ?? 0, ops: bs.ops ?? 0,
        };
      }

      const ps = extractStats(pitchingCat);
      if (Object.keys(ps).length > 0) {
        statistics = statistics ?? {};
        (statistics as Record<string, unknown>).pitching = {
          games: ps.gp ?? ps.g ?? 0, gamesStarted: ps.gs ?? 0,
          wins: ps.w ?? 0, losses: ps.l ?? 0, saves: ps.sv ?? ps.s ?? 0,
          inningsPitched: ps.ip ?? 0, hits: ps.h ?? 0, earnedRuns: ps.er ?? 0,
          walks: ps.bb ?? 0, strikeouts: ps.so ?? ps.k ?? 0,
          era: ps.era ?? 0, whip: ps.whip ?? 0,
        };
      }
    }
  }

  return { player, statistics };
}

async function handleCollegeBaseballPlayer(
  playerId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:player:${playerId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.player, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const [playerResult, statsResult] = await Promise.all([
        hlClient.getPlayer(parseInt(playerId, 10)),
        hlClient.getPlayerStatistics(parseInt(playerId, 10)),
      ]);

      if (playerResult.success && playerResult.data) {
        const payload = transformHighlightlyPlayer(
          playerResult.data,
          statsResult.success ? (statsResult.data ?? null) : null
        );
        const wrapped = { ...payload, meta: { dataSource: 'highlightly', lastUpdated: playerResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, wrapped, CACHE_TTL.players);
        return cachedJson(wrapped, 200, HTTP_CACHE.player, {
          ...dataHeaders(playerResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Fall through to ESPN
    }
  }

  // ESPN/NCAA fallback
  try {
    const client = getCollegeClient();
    const [playerResult, statsResult] = await Promise.all([
      client.getPlayer(parseInt(playerId, 10)),
      client.getPlayerStatistics(parseInt(playerId, 10)),
    ]);

    if (playerResult.success && playerResult.data) {
      const payload = transformEspnPlayer(
        playerResult.data as Record<string, unknown>,
        statsResult.success ? (statsResult.data as Record<string, unknown> | null) : null
      );
      const wrapped = { ...payload, meta: { dataSource: 'espn', lastUpdated: playerResult.timestamp, timezone: 'America/Chicago' } };
      await kvPut(env.KV, cacheKey, wrapped, CACHE_TTL.players);
      return cachedJson(wrapped, 200, HTTP_CACHE.player, {
        ...dataHeaders(playerResult.timestamp, 'espn'), 'X-Cache': 'MISS',
      });
    }

    return json({ player: null, statistics: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  } catch {
    return json({ player: null, statistics: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

// ---------------------------------------------------------------------------
// Game Detail Transform — Highlightly → CollegeGameData
// ---------------------------------------------------------------------------

function transformHighlightlyGame(
  match: HighlightlyMatch,
  box: HighlightlyBoxScore | null
): Record<string, unknown> {
  const statusType = match.status?.type ?? 'notstarted';
  const isLive = statusType === 'inprogress';
  const isFinal = statusType === 'finished';

  const formatRecord = (r?: { wins: number; losses: number }) =>
    r ? `${r.wins}-${r.losses}` : undefined;

  const game: Record<string, unknown> = {
    id: String(match.id),
    date: new Date(match.startTimestamp * 1000).toISOString(),
    status: {
      state: statusType === 'inprogress' ? 'in' : statusType === 'finished' ? 'post' : 'pre',
      detailedState: match.status?.description ?? statusType,
      inning: match.currentInning,
      inningState: match.currentInningHalf,
      isLive,
      isFinal,
    },
    teams: {
      away: {
        name: match.awayTeam?.name ?? 'Away',
        abbreviation: match.awayTeam?.shortName ?? '',
        score: match.awayScore ?? 0,
        isWinner: isFinal && (match.awayScore ?? 0) > (match.homeScore ?? 0),
        record: formatRecord(match.awayTeam?.record),
        conference: match.awayTeam?.conference?.name,
        ranking: match.awayTeam?.ranking,
      },
      home: {
        name: match.homeTeam?.name ?? 'Home',
        abbreviation: match.homeTeam?.shortName ?? '',
        score: match.homeScore ?? 0,
        isWinner: isFinal && (match.homeScore ?? 0) > (match.awayScore ?? 0),
        record: formatRecord(match.homeTeam?.record),
        conference: match.homeTeam?.conference?.name,
        ranking: match.homeTeam?.ranking,
      },
    },
    venue: match.venue
      ? { name: match.venue.name, city: match.venue.city, state: match.venue.state }
      : { name: 'TBD' },
  };

  // Linescore from box or match innings
  const innings = box?.linescores ?? match.innings ?? [];
  if (innings.length > 0) {
    game.linescore = {
      innings: innings.map((inn) => ({
        away: 'awayRuns' in inn ? inn.awayRuns : 0,
        home: 'homeRuns' in inn ? inn.homeRuns : 0,
      })),
      totals: {
        away: { runs: match.awayScore ?? 0, hits: box?.away?.hits ?? 0, errors: box?.away?.errors ?? 0 },
        home: { runs: match.homeScore ?? 0, hits: box?.home?.hits ?? 0, errors: box?.home?.errors ?? 0 },
      },
    };
  }

  // Box score batting/pitching lines
  if (box) {
    game.boxscore = {
      away: {
        batting: (box.away?.batting ?? []).map((b) => ({
          player: { id: String(b.player?.id ?? ''), name: b.player?.name ?? '', position: b.position ?? '' },
          ab: b.atBats ?? 0, r: b.runs ?? 0, h: b.hits ?? 0, rbi: b.rbi ?? 0,
          bb: b.walks ?? 0, so: b.strikeouts ?? 0, avg: b.average != null ? b.average.toFixed(3) : '.000',
        })),
        pitching: (box.away?.pitching ?? []).map((p) => ({
          player: { id: String(p.player?.id ?? ''), name: p.player?.name ?? '' },
          decision: p.decision ?? undefined,
          ip: String(p.inningsPitched ?? 0), h: p.hits ?? 0, r: p.runs ?? 0,
          er: p.earnedRuns ?? 0, bb: p.walks ?? 0, so: p.strikeouts ?? 0,
          pitches: p.pitchCount, strikes: p.strikes,
          era: p.era != null ? p.era.toFixed(2) : '0.00',
        })),
      },
      home: {
        batting: (box.home?.batting ?? []).map((b) => ({
          player: { id: String(b.player?.id ?? ''), name: b.player?.name ?? '', position: b.position ?? '' },
          ab: b.atBats ?? 0, r: b.runs ?? 0, h: b.hits ?? 0, rbi: b.rbi ?? 0,
          bb: b.walks ?? 0, so: b.strikeouts ?? 0, avg: b.average != null ? b.average.toFixed(3) : '.000',
        })),
        pitching: (box.home?.pitching ?? []).map((p) => ({
          player: { id: String(p.player?.id ?? ''), name: p.player?.name ?? '' },
          decision: p.decision ?? undefined,
          ip: String(p.inningsPitched ?? 0), h: p.hits ?? 0, r: p.runs ?? 0,
          er: p.earnedRuns ?? 0, bb: p.walks ?? 0, so: p.strikeouts ?? 0,
          pitches: p.pitchCount, strikes: p.strikes,
          era: p.era != null ? p.era.toFixed(2) : '0.00',
        })),
      },
    };
  }

  // Plays
  if (box?.plays && box.plays.length > 0) {
    game.plays = box.plays.map((p, i) => ({
      id: `${p.inning}-${p.half}-${i}`,
      inning: p.inning,
      halfInning: p.half,
      description: p.description,
      result: p.description,
      isScoring: i > 0 && (p.homeScore + p.awayScore) > ((box.plays![i - 1]?.homeScore ?? 0) + (box.plays![i - 1]?.awayScore ?? 0)),
      runsScored: i > 0
        ? (p.homeScore + p.awayScore) - ((box.plays![i - 1]?.homeScore ?? 0) + (box.plays![i - 1]?.awayScore ?? 0))
        : 0,
      scoreAfter: { away: p.awayScore, home: p.homeScore },
    }));
  }

  return game;
}

// ---------------------------------------------------------------------------
// Game Detail Transform — ESPN Summary → CollegeGameData
// ---------------------------------------------------------------------------

function transformEspnGameSummary(summary: Record<string, unknown>): Record<string, unknown> | null {
  const header = summary.header as Record<string, unknown> | undefined;
  const competitions = (header?.competitions as Record<string, unknown>[]) ?? [];
  const comp = competitions[0];
  if (!comp) return null;

  const competitors = (comp.competitors as Record<string, unknown>[]) ?? [];
  const homeSide = competitors.find((c) => c.homeAway === 'home') as Record<string, unknown> | undefined;
  const awaySide = competitors.find((c) => c.homeAway === 'away') as Record<string, unknown> | undefined;

  const homeTeam = (homeSide?.team as Record<string, unknown>) ?? {};
  const awayTeam = (awaySide?.team as Record<string, unknown>) ?? {};
  const homeScore = Number(homeSide?.score ?? 0);
  const awayScore = Number(awaySide?.score ?? 0);

  const statusObj = (comp.status as Record<string, unknown>) ?? {};
  const statusType = (statusObj.type as Record<string, unknown>) ?? {};
  const state = (statusType.state as string) ?? 'pre';
  const isFinal = state === 'post';
  const isLive = state === 'in';

  const homeLinescores = (homeSide?.linescores as Array<Record<string, unknown>>) ?? [];
  const awayLinescores = (awaySide?.linescores as Array<Record<string, unknown>>) ?? [];

  const game: Record<string, unknown> = {
    id: String(header?.id ?? comp.id ?? ''),
    date: (header?.gameNote as string) ?? (comp.date as string) ?? '',
    status: {
      state,
      detailedState: (statusType.detail as string) ?? (statusType.shortDetail as string) ?? state,
      inning: statusObj.period != null ? Number(statusObj.period) : undefined,
      inningState: undefined,
      isLive,
      isFinal,
    },
    teams: {
      away: {
        name: (awayTeam.displayName as string) ?? (awayTeam.name as string) ?? 'Away',
        abbreviation: (awayTeam.abbreviation as string) ?? '',
        score: awayScore,
        isWinner: isFinal && awayScore > homeScore,
        record: (awaySide?.record as Array<Record<string, unknown>>)?.[0]?.summary as string | undefined,
        conference: undefined,
        ranking: awaySide?.rank != null ? Number(awaySide.rank) : undefined,
      },
      home: {
        name: (homeTeam.displayName as string) ?? (homeTeam.name as string) ?? 'Home',
        abbreviation: (homeTeam.abbreviation as string) ?? '',
        score: homeScore,
        isWinner: isFinal && homeScore > awayScore,
        record: (homeSide?.record as Array<Record<string, unknown>>)?.[0]?.summary as string | undefined,
        conference: undefined,
        ranking: homeSide?.rank != null ? Number(homeSide.rank) : undefined,
      },
    },
    venue: { name: 'TBD' },
  };

  // Extract venue from gameInfo
  const gameInfo = summary.gameInfo as Record<string, unknown> | undefined;
  const venue = gameInfo?.venue as Record<string, unknown> | undefined;
  if (venue) {
    const addr = venue.address as Record<string, unknown> | undefined;
    game.venue = { name: venue.fullName ?? venue.shortName ?? 'TBD', city: addr?.city, state: addr?.state };
  }

  // Linescore from competitor linescores
  if (homeLinescores.length > 0 || awayLinescores.length > 0) {
    const count = Math.max(homeLinescores.length, awayLinescores.length);
    game.linescore = {
      innings: Array.from({ length: count }, (_, i) => ({
        away: Number(awayLinescores[i]?.value ?? 0),
        home: Number(homeLinescores[i]?.value ?? 0),
      })),
      totals: {
        away: { runs: awayScore, hits: 0, errors: 0 },
        home: { runs: homeScore, hits: 0, errors: 0 },
      },
    };
  }

  // Box score from ESPN summary format
  const espnBox = summary.boxscore as Record<string, unknown> | undefined;
  if (espnBox) {
    const players = (espnBox.players as Record<string, unknown>[]) ?? [];
    const awayBox = players.find((p) => (p.team as Record<string, unknown>)?.id === String(awayTeam.id));
    const homeBox = players.find((p) => (p.team as Record<string, unknown>)?.id === String(homeTeam.id));

    const extractBattingLines = (teamBox: Record<string, unknown> | undefined) => {
      const stats = (teamBox?.statistics as Record<string, unknown>[]) ?? [];
      const batting = stats.find((s) => (s.name as string) === 'batting' || (s.type as string) === 'batting');
      const athletes = (batting?.athletes as Record<string, unknown>[]) ?? [];
      return athletes.map((a) => {
        const athlete = a.athlete as Record<string, unknown> | undefined;
        const st = (a.stats as string[]) ?? [];
        return {
          player: { id: String(athlete?.id ?? ''), name: (athlete?.displayName as string) ?? '', position: (athlete?.position as Record<string, unknown>)?.abbreviation ?? '' },
          ab: Number(st[0] ?? 0), r: Number(st[1] ?? 0), h: Number(st[2] ?? 0), rbi: Number(st[3] ?? 0),
          bb: Number(st[4] ?? 0), so: Number(st[5] ?? 0), avg: st[6] ?? '.000',
        };
      });
    };

    const extractPitchingLines = (teamBox: Record<string, unknown> | undefined) => {
      const stats = (teamBox?.statistics as Record<string, unknown>[]) ?? [];
      const pitching = stats.find((s) => (s.name as string) === 'pitching' || (s.type as string) === 'pitching');
      const athletes = (pitching?.athletes as Record<string, unknown>[]) ?? [];
      return athletes.map((a) => {
        const athlete = a.athlete as Record<string, unknown> | undefined;
        const st = (a.stats as string[]) ?? [];
        return {
          player: { id: String(athlete?.id ?? ''), name: (athlete?.displayName as string) ?? '' },
          ip: st[0] ?? '0', h: Number(st[1] ?? 0), r: Number(st[2] ?? 0),
          er: Number(st[3] ?? 0), bb: Number(st[4] ?? 0), so: Number(st[5] ?? 0),
          era: st[6] ?? '0.00',
        };
      });
    };

    game.boxscore = {
      away: { batting: extractBattingLines(awayBox), pitching: extractPitchingLines(awayBox) },
      home: { batting: extractBattingLines(homeBox), pitching: extractPitchingLines(homeBox) },
    };
  }

  // Plays
  const drivesArr = (summary.drives as Record<string, unknown> | undefined)?.previous as Record<string, unknown>[] | undefined;
  const playsArr = (summary.plays as Record<string, unknown>[]) ?? [];
  const sourcePlays = playsArr.length > 0 ? playsArr : (drivesArr ?? []);
  if (sourcePlays.length > 0) {
    game.plays = sourcePlays.slice(0, 200).map((p, i) => ({
      id: String(p.id ?? `play-${i}`),
      inning: Number(p.period ?? 1),
      halfInning: (p.halfInning as string) ?? ((p.homeAway as string) === 'home' ? 'bottom' : 'top'),
      description: (p.text as string) ?? (p.description as string) ?? '',
      result: (p.type as Record<string, unknown>)?.text as string ?? (p.text as string) ?? '',
      isScoring: Boolean(p.scoringPlay),
      runsScored: Number(p.scoreValue ?? 0),
      scoreAfter: { away: Number((p.awayScore as number) ?? 0), home: Number((p.homeScore as number) ?? 0) },
    }));
  }

  return game;
}

async function handleCollegeBaseballGame(
  gameId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:game:${gameId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.game, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Highlightly first (if API key is set)
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const [matchResult, boxResult] = await Promise.all([
        hlClient.getMatch(parseInt(gameId, 10)),
        hlClient.getBoxScore(parseInt(gameId, 10)),
      ]);

      if (matchResult.success && matchResult.data) {
        const game = transformHighlightlyGame(
          matchResult.data,
          boxResult.success ? (boxResult.data ?? null) : null
        );
        const payload = { game, meta: { dataSource: 'highlightly', lastUpdated: matchResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(matchResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Highlightly failed — fall through to NCAA/ESPN
    }
  }

  // NCAA/ESPN fallback
  try {
    const client = getCollegeClient();
    const matchResult = await client.getMatch(parseInt(gameId, 10));

    if (matchResult.success && matchResult.data) {
      const summary = matchResult.data as Record<string, unknown>;
      const game = transformEspnGameSummary(summary);

      if (game) {
        const payload = { game, meta: { dataSource: 'espn', lastUpdated: matchResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(matchResult.timestamp, 'espn'), 'X-Cache': 'MISS',
        });
      }
    }

    return json(
      { game: null, meta: { dataSource: 'error', lastUpdated: now, timezone: 'America/Chicago' } },
      502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' }
    );
  } catch {
    return json(
      { game: null, meta: { dataSource: 'error', lastUpdated: now, timezone: 'America/Chicago' } },
      502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' }
    );
  }
}

async function handleCollegeBaseballSchedule(
  url: URL,
  env: Env
): Promise<Response> {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const range = url.searchParams.get('range') || 'week';
  const conference = url.searchParams.get('conference') || '';
  const cacheKey = `cb:schedule:${date}:${range}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.schedule, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  const client = getCollegeClient();
  const result = await client.getSchedule(date, range);

  if (!result.success || !result.data) {
    return cachedJson(
      { success: false, data: [], message: 'Failed to fetch schedule', timestamp: result.timestamp },
      502, HTTP_CACHE.schedule, { ...dataHeaders(result.timestamp), 'X-Cache': 'MISS' }
    );
  }

  const rawEvents = (result.data.data || []) as Record<string, unknown>[];

  // Transform ESPN events into the Game shape the scores page expects
  let games = rawEvents.map((e: Record<string, unknown>) => {
    const status = e.status as Record<string, unknown> || {};
    const state = (status.state as string || '').toLowerCase();
    const homeTeam = e.homeTeam as Record<string, unknown> || {};
    const awayTeam = e.awayTeam as Record<string, unknown> || {};
    const venue = e.venue as Record<string, unknown> | undefined;

    // Map ESPN state to frontend status
    let gameStatus: string;
    if (state === 'in' || state === 'live') gameStatus = 'live';
    else if (state === 'post' || (status.type as string || '').includes('FINAL')) gameStatus = 'final';
    else if ((status.type as string || '').includes('POSTPONED')) gameStatus = 'postponed';
    else if ((status.type as string || '').includes('CANCELED')) gameStatus = 'canceled';
    else gameStatus = 'scheduled';

    // Parse time from date field
    const dateStr = (e.date as string) || '';
    let time = '';
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        time = d.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' });
      } catch { /* ignore */ }
    }

    // Extract inning for live games
    const period = status.period as number | undefined;

    return {
      id: String(e.id || ''),
      date: dateStr,
      time,
      status: gameStatus,
      inning: gameStatus === 'live' ? period : undefined,
      homeTeam: {
        id: String(homeTeam.id || ''),
        name: (homeTeam.name || '') as string,
        shortName: (homeTeam.abbreviation || '') as string,
        conference: '',
        score: gameStatus !== 'scheduled' ? Number(e.homeScore ?? 0) : null,
        record: { wins: 0, losses: 0 },
      },
      awayTeam: {
        id: String(awayTeam.id || ''),
        name: (awayTeam.name || '') as string,
        shortName: (awayTeam.abbreviation || '') as string,
        conference: '',
        score: gameStatus !== 'scheduled' ? Number(e.awayScore ?? 0) : null,
        record: { wins: 0, losses: 0 },
      },
      venue: venue ? (venue.fullName || venue.name || '') as string : '',
      situation: (status.detail as string) || '',
    };
  });

  // Filter by conference if specified
  if (conference) {
    const confLower = conference.toLowerCase();
    games = games.filter((g) =>
      g.homeTeam.conference.toLowerCase().includes(confLower) ||
      g.awayTeam.conference.toLowerCase().includes(confLower) ||
      g.homeTeam.name.toLowerCase().includes(confLower) ||
      g.awayTeam.name.toLowerCase().includes(confLower)
    );
  }

  const payload = {
    success: true,
    data: games,
    live: games.some((g) => g.status === 'live'),
    timestamp: result.timestamp,
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.schedule);
  return cachedJson(payload, 200, HTTP_CACHE.schedule, {
    ...dataHeaders(result.timestamp), 'X-Cache': 'MISS',
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
// College Baseball News handler (ESPN college-baseball/news)
// ---------------------------------------------------------------------------

async function handleCollegeBaseballNews(env: Env): Promise<Response> {
  const cacheKey = 'cb:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.news, { ...dataHeaders(new Date().toISOString(), 'cache'), 'X-Cache': 'HIT' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return json({ articles: [], meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' } }, 502);
    }

    const raw = (await res.json()) as Record<string, unknown>;
    const rawArticles = (raw?.articles || []) as Record<string, unknown>[];

    const articles = rawArticles.map((a: Record<string, unknown>, i: number) => {
      const links = a.links as Record<string, unknown> | undefined;
      const web = links?.web as Record<string, unknown> | undefined;
      const cats = (a.categories || []) as Record<string, unknown>[];
      const primaryCat = cats[0];
      const catType = (primaryCat?.type as string) || '';

      // Map ESPN category types to frontend categories
      let category: string = 'general';
      if (catType === 'athlete' || catType === 'player') category = 'recruiting';
      else if (catType === 'team') category = 'game';
      else if (catType === 'topic') {
        const desc = ((primaryCat?.description as string) || '').toLowerCase();
        if (desc.includes('rank')) category = 'rankings';
        else if (desc.includes('transfer') || desc.includes('portal')) category = 'transfer';
        else if (desc.includes('recruit')) category = 'recruiting';
        else category = 'analysis';
      }

      // Extract team/conference from categories if available
      const teamCat = cats.find((c) => c.type === 'team');
      const team = (teamCat?.description as string) || undefined;

      return {
        id: String(a.dataSourceIdentifier || `espn-cbb-${i}`),
        title: (a.headline || a.title || '') as string,
        summary: (a.description || '') as string,
        source: 'ESPN',
        url: (web?.href || a.link || '') as string,
        publishedAt: (a.published || '') as string,
        category,
        team,
      };
    });

    const payload = {
      articles,
      meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min cache
    return cachedJson(payload, 200, HTTP_CACHE.news, { ...dataHeaders(new Date().toISOString(), 'espn'), 'X-Cache': 'MISS' });
  } catch {
    return json({ articles: [], meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' } }, 502);
  }
}

// ---------------------------------------------------------------------------
// College Baseball Players list handler
// ---------------------------------------------------------------------------

async function handleCollegeBaseballPlayersList(url: URL, env: Env): Promise<Response> {
  const team = url.searchParams.get('team') || '';
  const search = url.searchParams.get('search') || '';
  const position = url.searchParams.get('position') || '';
  const classYear = url.searchParams.get('class') || '';
  const draftOnly = url.searchParams.get('draft') === 'true';
  const cacheKey = `cb:players:list:${team || 'all'}`;

  // Try cache for the base team roster (filter client-side params in memory)
  let roster: Record<string, unknown>[] | null = null;

  const cached = await kvGet<Record<string, unknown>[]>(env.KV, cacheKey);
  if (cached) {
    roster = cached;
  } else {
    // Fetch roster from ESPN via NCAA client
    // If a specific team is requested, fetch that team's roster
    // Otherwise, fetch a set of notable programs for the browsing experience
    const client = getCollegeClient();

    if (team) {
      // Search for team ID by name — use ESPN teams endpoint
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const teamsRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=400`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (teamsRes.ok) {
          const teamsData = (await teamsRes.json()) as Record<string, unknown>;
          const teamsList = ((teamsData.sports as Record<string, unknown>[])?.[0]?.leagues as Record<string, unknown>[])?.[0]?.teams as Record<string, unknown>[] || [];
          const matched = teamsList.find((t) => {
            const tObj = (t.team || t) as Record<string, unknown>;
            const name = (tObj.displayName || tObj.name || '') as string;
            return name.toLowerCase().includes(team.toLowerCase());
          });

          if (matched) {
            const tObj = (matched.team || matched) as Record<string, unknown>;
            const teamId = parseInt(tObj.id as string, 10);
            const teamName = (tObj.displayName || tObj.name || '') as string;
            const result = await client.getTeamPlayers(teamId);
            if (result.success && result.data) {
              roster = (result.data.data || []) as Record<string, unknown>[];
              for (const p of roster) {
                p._teamName = teamName;
              }
            }
          }
        }
      } catch {
        // Fall through
      }
    }

    if (!roster) {
      // Default: fetch top programs' rosters for a browsable list
      const topTeams = [
        { id: 126, name: 'Texas Longhorns', conf: 'SEC' },
        { id: 85, name: 'LSU Tigers', conf: 'SEC' },
        { id: 123, name: 'Texas A&M Aggies', conf: 'SEC' },
        { id: 58, name: 'Arkansas Razorbacks', conf: 'SEC' },
        { id: 75, name: 'Florida Gators', conf: 'SEC' },
        { id: 120, name: 'Vanderbilt Commodores', conf: 'SEC' },
        { id: 199, name: 'Tennessee Volunteers', conf: 'SEC' },
        { id: 92, name: 'Ole Miss Rebels', conf: 'SEC' },
      ];
      const results = await Promise.allSettled(
        topTeams.map((t) => client.getTeamPlayers(t.id))
      );

      roster = [];
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value.success && r.value.data) {
          const players = (r.value.data.data || []) as Record<string, unknown>[];
          // Attach team context since ESPN roster doesn't embed it per-athlete
          for (const p of players) {
            p._teamName = topTeams[i].name;
            p._teamConf = topTeams[i].conf;
          }
          roster.push(...players);
        }
      }
    }

    // Cache the roster for 1 hour
    if (roster.length > 0) {
      await kvPut(env.KV, cacheKey, roster, CACHE_TTL.players);
    }
  }

  // Apply filters in memory
  let filtered = roster || [];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((p) => {
      const name = ((p.displayName || p.fullName || p.name || '') as string).toLowerCase();
      const hometown = ((p.birthPlace as Record<string, unknown>)?.city as string || '').toLowerCase();
      return name.includes(q) || hometown.includes(q);
    });
  }

  if (position) {
    filtered = filtered.filter((p) => {
      const pos = ((p.position as Record<string, unknown>)?.abbreviation as string || '').toUpperCase();
      if (position === 'IF') return ['1B', '2B', '3B', 'SS', 'IF'].includes(pos);
      if (position === 'OF') return ['LF', 'CF', 'RF', 'OF'].includes(pos);
      return pos === position.toUpperCase();
    });
  }

  if (classYear) {
    filtered = filtered.filter((p) => {
      const exp = ((p.experience as Record<string, unknown>)?.abbreviation as string || '').toLowerCase();
      return exp.startsWith(classYear.toLowerCase());
    });
  }

  // Transform to frontend Player shape
  const players = filtered.map((p) => {
    const pos = p.position as Record<string, unknown> | undefined;
    const exp = p.experience as Record<string, unknown> | undefined;
    const team_ = p.team as Record<string, unknown> | undefined;
    const birthPlace = p.birthPlace as Record<string, unknown> | undefined;

    // ESPN returns bats/throws as objects {type, abbreviation, displayValue} or strings
    const batsRaw = p.bats;
    const throwsRaw = p.throws;
    const batsStr = typeof batsRaw === 'string' ? batsRaw
      : (batsRaw as Record<string, unknown>)?.abbreviation as string || '';
    const throwsStr = typeof throwsRaw === 'string' ? throwsRaw
      : (throwsRaw as Record<string, unknown>)?.abbreviation as string || '';

    return {
      id: String(p.id || ''),
      name: (p.displayName || p.fullName || '') as string,
      team: (team_?.displayName || p._teamName || '') as string,
      jersey: (p.jersey || '') as string,
      position: (pos?.abbreviation || pos?.name || '') as string,
      classYear: (exp?.displayValue || exp?.abbreviation || '') as string,
      conference: (team_?.conference || p._teamConf || '') as string,
      bio: {
        height: (p.displayHeight || '') as string,
        weight: Number(p.weight || 0),
        bats: batsStr,
        throws: throwsStr,
        hometown: birthPlace ? `${birthPlace.city || ''}${birthPlace.state ? `, ${birthPlace.state}` : ''}` : '',
      },
    };
  });

  const payload = {
    players,
    meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
  };

  return cachedJson(payload, 200, HTTP_CACHE.player, { ...dataHeaders(new Date().toISOString(), 'espn'), 'X-Cache': roster === cached ? 'HIT' : 'MISS' });
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
  const date = url.searchParams.get('date') || undefined;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const cacheKey = `mlb:scores:${dateKey}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOMLBScores(await sdio.getMLBScores(date)),
      async () => transformScoreboard(await getScoreboard('mlb', toDateString(date))),
      cacheKey, env.KV, CACHE_TTL.scores,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.scores, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('mlb', toDateString(date));
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

async function handleMLBStandings(env: Env): Promise<Response> {
  const cacheKey = 'mlb:standings';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOMLBStandings(await sdio.getMLBStandings()),
      async () => transformStandings(await getStandings('mlb'), 'mlb'),
      cacheKey, env.KV, CACHE_TTL.standings,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.standings, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('mlb');
  const payload = transformStandings(raw, 'mlb');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

async function handleMLBGame(gameId: string, env: Env): Promise<Response> {
  const cacheKey = `mlb:game:${gameId}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    const numId = parseInt(gameId, 10);
    if (!isNaN(numId)) {
      const result = await fetchWithFallback(
        async () => transformSDIOMLBBoxScore(await sdio.getMLBBoxScore(numId)),
        async () => transformGameSummary(await getGameSummary('mlb', gameId)),
        cacheKey, env.KV, CACHE_TTL.games,
      );
      return cachedJson(result.data, 200, HTTP_CACHE.game, {
        'X-Cache': result.cached ? 'HIT' : 'MISS',
        'X-Data-Source': result.source,
      });
    }
  }

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
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOTeams(await sdio.getMLBTeams()),
      async () => transformTeams(await espnGetTeams('mlb')),
      cacheKey, env.KV, CACHE_TTL.teams,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.team, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('mlb');
  const payload = transformTeams(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleMLBNews(env: Env): Promise<Response> {
  const cacheKey = 'mlb:news';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONews(await sdio.getMLBNews()),
      async () => transformNews(await getNews('mlb')),
      cacheKey, env.KV, CACHE_TTL.trending,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.news, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('mlb');
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

// --- NFL (ESPN) ---

async function handleNFLScores(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const cacheKey = `nfl:scores:${dateKey}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONFLScores(await sdio.getNFLScoresByDate(date)),
      async () => transformScoreboard(await getScoreboard('nfl', toDateString(date))),
      cacheKey, env.KV, CACHE_TTL.scores,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.scores, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('nfl', toDateString(date));
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

async function handleNFLStandings(env: Env): Promise<Response> {
  const cacheKey = 'nfl:standings';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONFLStandings(await sdio.getNFLStandings()),
      async () => transformStandings(await getStandings('nfl'), 'nfl'),
      cacheKey, env.KV, CACHE_TTL.standings,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.standings, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

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
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOTeams(await sdio.getNFLTeams()),
      async () => transformTeams(await espnGetTeams('nfl')),
      cacheKey, env.KV, CACHE_TTL.teams,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.team, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('nfl');
  const payload = transformTeams(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleNFLNews(env: Env): Promise<Response> {
  const cacheKey = 'nfl:news';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONews(await sdio.getNFLNews()),
      async () => transformNews(await getNews('nfl')),
      cacheKey, env.KV, CACHE_TTL.trending,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.news, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('nfl');
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

// --- NBA (ESPN) ---

async function handleNBAScores(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const cacheKey = `nba:scores:${dateKey}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONBAScores(await sdio.getNBAScores(date)),
      async () => transformScoreboard(await getScoreboard('nba', toDateString(date))),
      cacheKey, env.KV, CACHE_TTL.scores,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.scores, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('nba', toDateString(date));
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

async function handleNBAStandings(env: Env): Promise<Response> {
  const cacheKey = 'nba:standings';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONBAStandings(await sdio.getNBAStandings()),
      async () => transformStandings(await getStandings('nba'), 'nba'),
      cacheKey, env.KV, CACHE_TTL.standings,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.standings, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

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
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOTeams(await sdio.getNBATeams()),
      async () => transformTeams(await espnGetTeams('nba')),
      cacheKey, env.KV, CACHE_TTL.teams,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.team, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  const raw = await espnGetTeams('nba');
  const payload = transformTeams(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
  return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
}

async function handleNBANews(env: Env): Promise<Response> {
  const cacheKey = 'nba:news';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIONews(await sdio.getNBANews()),
      async () => transformNews(await getNews('nba')),
      cacheKey, env.KV, CACHE_TTL.trending,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.news, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.news, { 'X-Cache': 'HIT' });

  const raw = await getNews('nba');
  const payload = transformNews(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);
  return cachedJson(payload, 200, HTTP_CACHE.news, { 'X-Cache': 'MISS' });
}

// --- CFB (ESPN) ---

async function handleCFBScores(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const dateKey = date?.replace(/-/g, '') || 'today';
  const cacheKey = `cfb:scores:${dateKey}`;
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => {
        const week = parseInt(url.searchParams.get('week') || '1', 10);
        return transformSDIOCFBScores(await sdio.getCFBScores(undefined, week));
      },
      async () => transformScoreboard(await getScoreboard('cfb', toDateString(date))),
      cacheKey, env.KV, CACHE_TTL.scores,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.scores, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, { 'X-Cache': 'HIT' });

  const raw = await getScoreboard('cfb', toDateString(date));
  const payload = transformScoreboard(raw);
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
  return cachedJson(payload, 200, HTTP_CACHE.scores, { 'X-Cache': 'MISS' });
}

async function handleCFBStandings(env: Env): Promise<Response> {
  const cacheKey = 'cfb:standings';
  const sdio = getSDIOClient(env);

  if (sdio) {
    const result = await fetchWithFallback(
      async () => transformSDIOCFBStandings(await sdio.getCFBStandings()),
      async () => transformStandings(await getStandings('cfb'), 'cfb'),
      cacheKey, env.KV, CACHE_TTL.standings,
    );
    return cachedJson(result.data, 200, HTTP_CACHE.standings, {
      'X-Cache': result.cached ? 'HIT' : 'MISS',
      'X-Data-Source': result.source,
    });
  }

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  const raw = await getStandings('cfb');
  const payload = transformStandings(raw, 'cfb');
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
}

async function handleCFBNews(env: Env): Promise<Response> {
  const cacheKey = 'cfb:news';
  const sdio = getSDIOClient(env);

  // CFB news is not available from SDIO — use ESPN directly
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
      const data = JSON.parse(raw) as Record<string, unknown>;
      const entries = (data.entries ?? []) as unknown[];
      return cachedJson({
        entries,
        totalEntries: entries.length,
        lastUpdated: data.lastUpdated ?? null,
        meta: { dataSource: 'portal-sync', lastUpdated: (data.lastUpdated as string) ?? new Date().toISOString(), timezone: 'America/Chicago' },
      }, 200, HTTP_CACHE.trending);
    } catch {
      // Corrupt KV entry — fall through
    }
  }
  return json({
    entries: [], totalEntries: 0, lastUpdated: null,
    meta: { dataSource: 'none', lastUpdated: new Date().toISOString(), timezone: 'America/Chicago' },
    message: 'No portal data available yet',
  }, 200);
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

      // ----- Auth stubs (backend not yet implemented) -----
      if (pathname === '/api/auth/login' || pathname === '/api/auth/signup') {
        return json({ error: 'Authentication is not yet available.' }, 501);
      }

      // ----- Health / status -----
      if (pathname === '/api/health' || pathname === '/health') return handleHealth(env);
      if (pathname === '/api/admin/health') return handleAdminHealth(env);

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
      if (pathname === '/api/college-baseball/news') {
        return handleCollegeBaseballNews(env);
      }
      if (pathname === '/api/college-baseball/players') {
        return handleCollegeBaseballPlayersList(url, env);
      }

      // CFB Transfer Portal
      if (pathname === '/api/cfb/transfer-portal') {
        return handleCFBTransferPortal(env);
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

      // Singular form — what the frontend actually fetches
      const gameSingularMatch = matchRoute(pathname, '/api/college-baseball/game/:gameId');
      if (gameSingularMatch) return handleCollegeBaseballGame(gameSingularMatch.params.gameId, env);

      // Plural form — kept for backward compat (MCP tools, external consumers)
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

      // TODO: Wire to a real data source when available (NCAA API, scraper, etc.)
      // When a source is available, fetch here and write to KV:
      //   await this.env.KV.put('portal:cfb:entries', JSON.stringify({entries, lastUpdated: now}), {expirationTtl: 86400});

      // No re-arm: alarm runs once per /start request until a real data source is wired.
      // Call /start again to trigger another poll.
    } catch (err) {
      console.error('[PortalPoller] alarm error:', err instanceof Error ? err.message : err);
    }
  }
}
