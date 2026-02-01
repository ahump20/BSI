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

const ALLOWED_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
  'http://localhost:3000',
  'http://localhost:8787',
]);

function corsOrigin(request: Request): string {
  const origin = request.headers.get('Origin') ?? '';
  return ALLOWED_ORIGINS.has(origin) ? origin : '';
}

function corsHeaders(request: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': corsOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/** Active request reference — set at the top of fetch() so helpers can derive CORS origin. */
let _activeRequest: Request | null = null;

function activeCorsHeaders(): Record<string, string> {
  return _activeRequest ? corsHeaders(_activeRequest) : {};
}

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...activeCorsHeaders(), ...extra },
  });
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
// KV Cache helpers
// ---------------------------------------------------------------------------

/** Cache TTLs in seconds by data type */
const CACHE_TTL: Record<string, number> = {
  scores: 30,
  standings: 1800, // 30 min
  rankings: 1800,
  teams: 86400, // 24 hr
  players: 86400,
  games: 60,
  schedule: 300, // 5 min
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

function handleKPI(): Response {
  return json({
    predictionsToday: Math.floor(Math.random() * 10000) + 5000,
    activeClients: Math.floor(Math.random() * 100) + 50,
    avgResponseSec: Math.random() * 2 + 0.5,
    alertsProcessed: Math.floor(Math.random() * 1000) + 500,
    timestamp: new Date().toISOString(),
  });
}

function handleAccuracy(): Response {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return json({
    labels,
    values: labels.map(() => Math.random() * 10 + 85),
    metadata: { unit: 'Accuracy (%)', description: 'Model accuracy over time' },
  });
}

function handleAlertBuckets(): Response {
  const labels = ['Critical', 'High', 'Medium', 'Low'];
  return json({
    labels,
    counts: labels.map(() => Math.floor(Math.random() * 50)),
    severities: ['critical', 'high', 'medium', 'low'],
  });
}

function handleTeams(league: string): Response {
  const teams: Record<string, Array<{ id: string; name: string; league: string; stats: object }>> =
    {
      MLB: [
        { id: 'stl-cardinals', name: 'St. Louis Cardinals', league: 'MLB', stats: { wins: 83, losses: 79, rating: 0.512 } },
        { id: 'nyy-yankees', name: 'New York Yankees', league: 'MLB', stats: { wins: 94, losses: 68, rating: 0.58 } },
        { id: 'lad-dodgers', name: 'Los Angeles Dodgers', league: 'MLB', stats: { wins: 98, losses: 64, rating: 0.605 } },
      ],
      NFL: [
        { id: 'ten-titans', name: 'Tennessee Titans', league: 'NFL', stats: { wins: 6, losses: 11, rating: 0.353 } },
        { id: 'kc-chiefs', name: 'Kansas City Chiefs', league: 'NFL', stats: { wins: 11, losses: 6, rating: 0.647 } },
        { id: 'buf-bills', name: 'Buffalo Bills', league: 'NFL', stats: { wins: 13, losses: 4, rating: 0.765 } },
      ],
      NBA: [
        { id: 'mem-grizzlies', name: 'Memphis Grizzlies', league: 'NBA', stats: { wins: 51, losses: 31, rating: 0.622 } },
        { id: 'gs-warriors', name: 'Golden State Warriors', league: 'NBA', stats: { wins: 44, losses: 38, rating: 0.537 } },
        { id: 'lal-lakers', name: 'Los Angeles Lakers', league: 'NBA', stats: { wins: 47, losses: 35, rating: 0.573 } },
      ],
      NCAA: [
        { id: 'tex-longhorns', name: 'Texas Longhorns', league: 'NCAA', stats: { wins: 12, losses: 2, rating: 0.857 } },
        { id: 'ala-crimson', name: 'Alabama Crimson Tide', league: 'NCAA', stats: { wins: 12, losses: 2, rating: 0.857 } },
        { id: 'osu-buckeyes', name: 'Ohio State Buckeyes', league: 'NCAA', stats: { wins: 11, losses: 2, rating: 0.846 } },
      ],
    };
  return json(teams[league.toUpperCase()] ?? []);
}

function generateLeaderboard() {
  const players = [
    { name: 'Austin H.', score: 2847, avatar: '🏆' },
    { name: 'Sarah M.', score: 2654, avatar: '⚡' },
    { name: 'Mike R.', score: 2498, avatar: '🔥' },
    { name: 'Jessica L.', score: 2376, avatar: '💎' },
    { name: 'David K.', score: 2234, avatar: '🚀' },
    { name: 'Emily C.', score: 2198, avatar: '⭐' },
    { name: 'Chris W.', score: 2087, avatar: '🎯' },
    { name: 'Amanda T.', score: 1976, avatar: '✨' },
  ];
  return players.map((p) => ({
    ...p,
    score: p.score + Math.floor(Math.random() * 100 - 50),
  }));
}

function handleLeaderboard(): Response {
  return json(generateLeaderboard());
}

function handleLeaderboardSimulate(): Response {
  const board = generateLeaderboard()
    .map((p) => ({ ...p, score: p.score + Math.floor(Math.random() * 200) }))
    .sort((a, b) => b.score - a.score);
  return json(board);
}

function handleYearlyTrend(): Response {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return json({
    labels: months,
    values: months.map((_, i) => 70 + Math.sin(i / 2) * 10 + Math.random() * 5),
    metadata: { unit: 'Performance Score', description: 'Yearly performance trend' },
  });
}

function handleReadiness(): Response {
  return json({
    physical: Math.floor(Math.random() * 10) + 90,
    mental: Math.floor(Math.random() * 8) + 92,
    tactical: Math.floor(Math.random() * 7) + 93,
    cohesion: Math.floor(Math.random() * 5) + 95,
  });
}

async function handleLead(request: Request, env: Env): Promise<Response> {
  try {
    const lead = (await request.json()) as {
      name: string;
      email: string;
      organization?: string;
      sport?: string;
      message?: string;
      source?: string;
    };

    if (!lead.name || !lead.email) {
      return json({ error: 'Name and email are required' }, 400);
    }

    if (env.KV) {
      const key = `lead:${Date.now()}:${lead.email}`;
      await env.KV.put(key, JSON.stringify(lead), {
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    if (env.DB) {
      try {
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
    return json(cached, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  try {
    const client = getClient(env);
    const result = await client.getMatches('NCAA', date);

    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.scores);
    }

    return json(result.data ?? empty, result.success ? 200 : 200, {
      ...dataHeaders(result.timestamp),
      'X-Cache': 'MISS',
    });
  } catch {
    return json(empty, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'ERROR' });
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
    return json(cached, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  const client = getClient(env);
  const result = await client.getStandings(conference);

  if (result.success && result.data) {
    await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.standings);
  }

  return json(result.data ?? [], result.success ? 200 : 502, {
    ...dataHeaders(result.timestamp),
    'X-Cache': 'MISS',
  });
}

async function handleCollegeBaseballRankings(env: Env): Promise<Response> {
  const cacheKey = 'cb:rankings';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return json(cached, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  try {
    const client = getClient(env);
    const result = await client.getRankings();

    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.rankings);
    }

    return json(result.data ?? [], result.success ? 200 : 200, {
      ...dataHeaders(result.timestamp),
      'X-Cache': 'MISS',
    });
  } catch {
    return json([], 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'ERROR' });
  }
}

async function handleCollegeBaseballTeam(
  teamId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:team:${teamId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return json(cached, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  try {
    const client = getClient(env);
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

    return json(payload, 200, {
      ...dataHeaders(teamResult.timestamp),
      'X-Cache': 'MISS',
    });
  } catch {
    return json({ team: null, roster: [] }, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'ERROR' });
  }
}

async function handleCollegeBaseballPlayer(
  playerId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:player:${playerId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return json(cached, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  try {
    const client = getClient(env);
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

    return json(payload, 200, {
      ...dataHeaders(playerResult.timestamp),
      'X-Cache': 'MISS',
    });
  } catch {
    return json({ player: null, statistics: null }, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'ERROR' });
  }
}

async function handleCollegeBaseballGame(
  gameId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:game:${gameId}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return json(cached, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  const client = getClient(env);
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

  return json(payload, matchResult.success ? 200 : 502, {
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
    return json(cached, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  const client = getClient(env);
  const result = await client.getSchedule(date, range);

  if (result.success && result.data) {
    await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.schedule);
  }

  return json(result.data ?? { data: [], totalCount: 0 }, result.success ? 200 : 502, {
    ...dataHeaders(result.timestamp),
    'X-Cache': 'MISS',
  });
}

async function handleCollegeBaseballTrending(env: Env): Promise<Response> {
  const cacheKey = 'cb:trending';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return json(cached, 200, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  // Trending is computed from recent scores — fetch today's games and derive
  const client = getClient(env);
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

  return json(payload, 200, { ...dataHeaders(result.timestamp), 'X-Cache': 'MISS' });
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
    return new Response('Asset not found', { status: 404, headers: activeCorsHeaders() });
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
  const results: Array<{ type: string; id: string; name: string; url: string }> = [];

  // Scan KV for matching team/player entries
  const teamList = await env.KV.list({ prefix: 'cb:team:' });
  for (const key of teamList.keys) {
    const data = await kvGet<{ team: { name: string; id: number } }>(env.KV, key.name);
    if (data?.team?.name?.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'team',
        id: String(data.team.id),
        name: data.team.name,
        url: `/college-baseball/teams/${data.team.id}`,
      });
    }
    if (results.length >= 10) break;
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

  // KV check
  try {
    await env.KV.put('health:check', 'ok', { expirationTtl: 60 });
    const val = await env.KV.get('health:check');
    checks.kv = { status: val === 'ok' ? 'healthy' : 'degraded' };
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

  // Highlightly check
  if (env.RAPIDAPI_KEY) {
    try {
      const client = getClient(env);
      const health = await client.healthCheck();
      checks.highlightly = {
        status: health.healthy ? 'healthy' : 'unhealthy',
        latency_ms: health.latency_ms,
        rateLimitRemaining: health.rateLimitRemaining,
      };
    } catch (e) {
      checks.highlightly = {
        status: 'unhealthy',
        error: e instanceof Error ? e.message : 'Unknown',
      };
    }
  } else {
    checks.highlightly = { status: 'unconfigured', error: 'RAPIDAPI_KEY not set' };
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
        JSON.stringify({ type: 'leaderboard-update', players: generateLeaderboard() })
      );
    } else {
      clearInterval(interval);
    }
  }, 5000);

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

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    _activeRequest = request;
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    try {
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

      const teamMatch = matchRoute(pathname, '/api/college-baseball/teams/:teamId');
      if (teamMatch) return handleCollegeBaseballTeam(teamMatch.params.teamId, env);

      const playerMatch = matchRoute(pathname, '/api/college-baseball/players/:playerId');
      if (playerMatch) return handleCollegeBaseballPlayer(playerMatch.params.playerId, env);

      const gameMatch = matchRoute(pathname, '/api/college-baseball/games/:gameId');
      if (gameMatch) return handleCollegeBaseballGame(gameMatch.params.gameId, env);

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
      if (pathname === '/api/kpi' || pathname === '/kpi') return handleKPI();
      if (pathname === '/api/analytics/accuracy' || pathname === '/analytics/accuracy')
        return handleAccuracy();
      if (pathname === '/api/alerts/buckets' || pathname === '/alerts/buckets')
        return handleAlertBuckets();
      if (pathname === '/api/analytics/yearly-trend' || pathname === '/analytics/yearly-trend')
        return handleYearlyTrend();
      if (pathname === '/api/readiness' || pathname === '/readiness') return handleReadiness();
      if (
        pathname === '/api/multiplayer/leaderboard/simulate' ||
        pathname === '/multiplayer/leaderboard/simulate'
      )
        return handleLeaderboardSimulate();
      if (pathname === '/api/multiplayer/leaderboard' || pathname === '/multiplayer/leaderboard')
        return handleLeaderboard();

      const teamsMatch =
        matchRoute(pathname, '/api/teams/:league') || matchRoute(pathname, '/teams/:league');
      if (teamsMatch) return handleTeams(teamsMatch.params.league);

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
      const message = err instanceof Error ? err.message : 'Internal server error';
      await logError(env.KV, message, pathname);
      return json({ error: message }, 500);
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
      // Portal data polling logic
      // When a real data source is available, this fetches and upserts to KV
      // For now, record the poll attempt
      const now = new Date().toISOString();
      await this.state.storage.put('lastPoll', now);

      // Re-arm for next poll in 30 seconds
      await this.state.storage.setAlarm(Date.now() + 30_000);
    } catch {
      // Re-arm even on failure to maintain polling cadence
      await this.state.storage.setAlarm(Date.now() + 30_000);
    }
  }
}
