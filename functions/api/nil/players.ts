/**
 * NIL Players API - GET /api/nil/players
 * List and search players with comprehensive filtering
 *
 * Query Parameters:
 * - position: Filter by position (QB, WR, RB, etc.)
 * - team: Filter by team name (partial match)
 * - conference: Filter by conference (SEC, Big Ten, etc.)
 * - minValue / maxValue: Filter by FMNV range
 * - minStars / maxStars: Filter by recruit star rating
 * - state: Filter by home state
 * - limit: Results per page (max 100, default 50)
 * - offset: Pagination offset
 * - sortBy: Sort field (stars, name, position, team, conference)
 * - sortOrder: asc or desc
 */

import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  NIL_DB: D1Database;
  NIL_CACHE: KVNamespace;
  KV: KVNamespace;
  DB: D1Database;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  conference: string;
  class: string;
  heightInches: number;
  weightLbs: number;
  hometown: string;
  state: string;
  stars: number;
  socialFollowers: number;
  engagementRate: number;
  tvGames: number;
  createdAt: string;
  updatedAt: string;
}

interface PositionMetrics {
  positionScore: number;
  efficiencyScore: number;
  productionScore: number;
}

interface PlayerSearchParams {
  position?: string;
  team?: string;
  conference?: string;
  minValue?: number;
  maxValue?: number;
  minStars?: number;
  maxStars?: number;
  state?: string;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

const CACHE_TTL_SECONDS = 300; // 5 minutes

const POSITION_BASE_VALUES: Record<string, number> = {
  QB: 2500000,
  WR: 1500000,
  RB: 600000,
  TE: 500000,
  OL: 800000,
  OT: 850000,
  OG: 750000,
  C: 700000,
  DL: 1200000,
  DE: 1300000,
  DT: 1100000,
  LB: 700000,
  ILB: 650000,
  OLB: 750000,
  DB: 900000,
  CB: 950000,
  S: 1000000,
  FS: 950000,
  SS: 900000,
  K: 100000,
  P: 100000,
  LS: 50000,
};

const STAR_MULTIPLIERS: Record<number, number> = {
  5: 3.0,
  4: 1.5,
  3: 0.7,
  2: 0.3,
  1: 0.1,
};

const CONFERENCE_MULTIPLIERS: Record<string, number> = {
  SEC: 1.25,
  'Big Ten': 1.2,
  'Big 12': 1.1,
  ACC: 1.05,
  AAC: 0.85,
  'Mountain West': 0.8,
  'Sun Belt': 0.75,
  MAC: 0.7,
};

function generateRequestId(): string {
  return `nil-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getCurrentTimestamp(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .replace(/(\d+)\/(\d+)\/(\d+),?\s*/, '$3-$1-$2T')
    .replace(/\s/g, '');
}

function calculateFMNV(player: Player, metrics: PositionMetrics): number {
  const positionBase = POSITION_BASE_VALUES[player.position] || 500000;
  const starMultiplier = STAR_MULTIPLIERS[player.stars] || 0.5;
  const baseValue = positionBase * starMultiplier;

  // Performance Index
  const performanceIndex =
    0.4 * metrics.positionScore + 0.3 * metrics.efficiencyScore + 0.3 * metrics.productionScore;

  // Exposure Index (simplified without team context)
  const tvNormalized = Math.min((player.tvGames || 0) / 15, 1);
  const exposureIndex = 0.35 * tvNormalized + 0.25 * 0.5 + 0.4 * 0.5;

  // Influence Index
  const followersNormalized =
    player.socialFollowers > 0 ? Math.log10(player.socialFollowers) / 7 : 0;
  const engagementNormalized = Math.min((player.engagementRate || 0) / 10, 1);
  const influenceIndex = 0.5 * followersNormalized + 0.5 * engagementNormalized;

  const performanceMultiplier = performanceIndex * 0.5;
  const exposureMultiplier = exposureIndex * 0.5;
  const influenceMultiplier = influenceIndex * 0.5;
  const conferenceMultiplier = CONFERENCE_MULTIPLIERS[player.conference] || 1.0;

  return Math.round(
    baseValue *
      (1 + performanceMultiplier) *
      (1 + exposureMultiplier) *
      (1 + influenceMultiplier) *
      conferenceMultiplier
  );
}

async function checkRateLimit(
  kv: KVNamespace,
  clientIP: string
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:nil:${clientIP}`;
  const now = Date.now();
  const windowMs = 60000;

  try {
    const stored = (await kv.get(key, 'json')) as { requests: number[] } | null;
    let requests = stored?.requests || [];
    requests = requests.filter((ts: number) => ts > now - windowMs);

    if (requests.length >= 100) {
      return { allowed: false, remaining: 0 };
    }

    requests.push(now);
    await kv.put(key, JSON.stringify({ requests }), { expirationTtl: 120 });
    return { allowed: true, remaining: 100 - requests.length };
  } catch {
    return { allowed: true, remaining: 50 };
  }
}

async function getPlayersFromDB(
  db: D1Database,
  params: PlayerSearchParams
): Promise<{ players: Player[]; total: number }> {
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (params.position) {
    conditions.push('position = ?');
    bindings.push(params.position.toUpperCase());
  }
  if (params.team) {
    conditions.push('team LIKE ?');
    bindings.push(`%${params.team}%`);
  }
  if (params.conference) {
    conditions.push('conference = ?');
    bindings.push(params.conference);
  }
  if (params.minStars) {
    conditions.push('stars >= ?');
    bindings.push(params.minStars);
  }
  if (params.maxStars) {
    conditions.push('stars <= ?');
    bindings.push(params.maxStars);
  }
  if (params.state) {
    conditions.push('state = ?');
    bindings.push(params.state.toUpperCase());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const validSortColumns = ['stars', 'name', 'position', 'team', 'conference'];
  const safeSortBy = validSortColumns.includes(params.sortBy) ? params.sortBy : 'stars';
  const safeSortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM nil_players ${whereClause}`)
    .bind(...bindings)
    .first<{ total: number }>();
  const total = countResult?.total || 0;

  const dataResult = await db
    .prepare(
      `
    SELECT * FROM nil_players ${whereClause}
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT ? OFFSET ?
  `
    )
    .bind(...bindings, params.limit, params.offset)
    .all<Player>();

  return { players: dataResult.results || [], total };
}

async function getPlayerMetrics(db: D1Database, playerId: string): Promise<PositionMetrics> {
  const result = await db
    .prepare(
      'SELECT position_score, efficiency_score, production_score FROM nil_player_metrics WHERE player_id = ?'
    )
    .bind(playerId)
    .first<{ position_score: number; efficiency_score: number; production_score: number }>();

  return {
    positionScore: result?.position_score || 0.5,
    efficiencyScore: result?.efficiency_score || 0.5,
    productionScore: result?.production_score || 0.5,
  };
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const requestId = generateRequestId();
  const kv = env.NIL_CACHE || env.KV;
  const db = env.NIL_DB || env.DB;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimit = await checkRateLimit(kv, clientIP);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        meta: { timestamp: getCurrentTimestamp(), timezone: 'America/Chicago', requestId },
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, 'Retry-After': '60' },
      }
    );
  }

  const url = new URL(request.url);
  const params: PlayerSearchParams = {
    position: url.searchParams.get('position') || undefined,
    team: url.searchParams.get('team') || undefined,
    conference: url.searchParams.get('conference') || undefined,
    minValue: url.searchParams.get('minValue')
      ? parseInt(url.searchParams.get('minValue')!)
      : undefined,
    maxValue: url.searchParams.get('maxValue')
      ? parseInt(url.searchParams.get('maxValue')!)
      : undefined,
    minStars: url.searchParams.get('minStars')
      ? parseInt(url.searchParams.get('minStars')!)
      : undefined,
    maxStars: url.searchParams.get('maxStars')
      ? parseInt(url.searchParams.get('maxStars')!)
      : undefined,
    state: url.searchParams.get('state') || undefined,
    limit: Math.min(parseInt(url.searchParams.get('limit') || '50'), 100),
    offset: parseInt(url.searchParams.get('offset') || '0'),
    sortBy: url.searchParams.get('sortBy') || 'stars',
    sortOrder: (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };

  const cacheKey = `cache:nil:players:${JSON.stringify(params)}`;

  try {
    // Check cache
    const cached = (await kv.get(cacheKey, 'json')) as {
      players: (Player & { fmnv: number })[];
      total: number;
    } | null;
    if (cached) {
      return new Response(
        JSON.stringify({
          success: true,
          data: cached,
          meta: {
            timestamp: getCurrentTimestamp(),
            timezone: 'America/Chicago',
            cached: true,
            source: 'BlazeSportsIntel NIL API',
            requestId,
          },
          pagination: {
            total: cached.total,
            limit: params.limit,
            offset: params.offset,
            hasMore: params.offset + params.limit < cached.total,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, 'X-Cache': 'HIT' },
        }
      );
    }

    const { players, total } = await getPlayersFromDB(db, params);

    // Calculate FMNV for each player
    const playersWithValuation = await Promise.all(
      players.map(async (player) => {
        const metrics = await getPlayerMetrics(db, player.id);
        const fmnv = calculateFMNV(player, metrics);
        return { ...player, fmnv, fmnvFormatted: `$${fmnv.toLocaleString()}` };
      })
    );

    // Filter by value range
    let filteredPlayers = playersWithValuation;
    if (params.minValue || params.maxValue) {
      filteredPlayers = playersWithValuation.filter((p) => {
        if (params.minValue && p.fmnv < params.minValue) return false;
        if (params.maxValue && p.fmnv > params.maxValue) return false;
        return true;
      });
    }

    const result = { players: filteredPlayers, total: filteredPlayers.length };

    // Cache result
    await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL_SECONDS });

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        meta: {
          timestamp: getCurrentTimestamp(),
          timezone: 'America/Chicago',
          cached: false,
          source: 'BlazeSportsIntel NIL API',
          requestId,
        },
        pagination: {
          total: result.total,
          limit: params.limit,
          offset: params.offset,
          hasMore: params.offset + params.limit < result.total,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, 'X-Cache': 'MISS' },
      }
    );
  } catch (error) {
    console.error('Players API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch players',
        meta: { timestamp: getCurrentTimestamp(), timezone: 'America/Chicago', requestId },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
};
