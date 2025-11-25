/**
 * NIL Valuation API - Production Worker
 * BlazeSportsIntel.com
 *
 * Comprehensive NIL (Name, Image, Likeness) valuation API with:
 * - Fair Market Name Value (FMNV) calculations
 * - Player search and filtering
 * - Roster optimization engine
 * - Team-specific opportunity cost analysis
 *
 * Data Sources: On3 NIL Valuations, internal analytics
 * Timezone: America/Chicago
 */

import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Env {
  NIL_DB: D1Database;
  NIL_CACHE: KVNamespace;
  NIL_ARCHIVE: R2Bucket;
  KV: KVNamespace; // Fallback to existing KV binding
  DB: D1Database; // Fallback to existing DB binding
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

interface PlayerValuation {
  playerId: string;
  baseValue: number;
  performanceIndex: number;
  exposureIndex: number;
  influenceIndex: number;
  performanceMultiplier: number;
  exposureMultiplier: number;
  influenceMultiplier: number;
  fmnv: number;
  confidence: number;
  calculatedAt: string;
  validUntil: string;
}

interface PositionMetrics {
  positionScore: number;
  efficiencyScore: number;
  productionScore: number;
}

interface TeamContext {
  teamId: string;
  teamName: string;
  conference: string;
  conferenceRank: number;
  teamRanking: number;
  totalRosterValue: number;
  avgPlayerValue: number;
  positionNeeds: Record<string, number>;
  budgetRemaining: number;
}

interface OptimizerRequest {
  budget: number;
  positionNeeds: Record<string, number>;
  teamId?: string;
  minStars?: number;
  maxPlayers?: number;
  conferencePreference?: string[];
}

interface OptimizerResult {
  recommendations: PlayerRecommendation[];
  totalCost: number;
  budgetRemaining: number;
  coverageScore: number;
  valueScore: number;
}

interface PlayerRecommendation {
  player: Player;
  valuation: PlayerValuation;
  fitScore: number;
  priorityReason: string;
}

interface OpportunityCostResult {
  playerId: string;
  teamId: string;
  playerName: string;
  teamName: string;
  baseValue: number;
  teamSpecificValue: number;
  opportunityCost: number;
  fitAnalysis: {
    positionNeed: number;
    schemeMatch: number;
    conferenceBoost: number;
    marketMultiplier: number;
  };
  recommendation: string;
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
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    timezone: string;
    cached: boolean;
    cacheExpiry?: string;
    source: string;
    requestId: string;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

const CACHE_TTL = {
  PLAYER_LIST: 300, // 5 minutes
  VALUATION: 3600, // 1 hour
  TEAM_CONTEXT: 1800, // 30 minutes
  OPTIMIZER: 600, // 10 minutes
};

const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 100,
  WINDOW_MS: 60000,
};

// Position base values (2025-26 market reality)
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

const CONFERENCE_RANK_MULTIPLIERS: Record<string, number> = {
  SEC: 1.25,
  'Big Ten': 1.2,
  'Big 12': 1.1,
  ACC: 1.05,
  'Pac-12': 1.0, // Historical
  AAC: 0.85,
  'Mountain West': 0.8,
  'Sun Belt': 0.75,
  MAC: 0.7,
  'C-USA': 0.7,
  Independent: 0.9,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

function createResponse<T>(
  data: APIResponse<T>,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...additionalHeaders,
    },
  });
}

function createErrorResponse(message: string, status: number, requestId: string): Response {
  return createResponse<null>(
    {
      success: false,
      error: message,
      meta: {
        timestamp: getCurrentTimestamp(),
        timezone: 'America/Chicago',
        cached: false,
        source: 'BlazeSportsIntel NIL API',
        requestId,
      },
    },
    status
  );
}

// ============================================================================
// RATE LIMITING
// ============================================================================

async function checkRateLimit(
  kv: KVNamespace,
  clientIP: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `rate_limit:nil:${clientIP}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;

  try {
    const stored = (await kv.get(key, 'json')) as { requests: number[] } | null;
    let requests = stored?.requests || [];

    // Filter out requests outside the current window
    requests = requests.filter((ts: number) => ts > windowStart);

    if (requests.length >= RATE_LIMIT.REQUESTS_PER_MINUTE) {
      const oldestRequest = Math.min(...requests);
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestRequest + RATE_LIMIT.WINDOW_MS,
      };
    }

    // Add current request
    requests.push(now);

    // Store updated requests (TTL: 2 minutes to clean up)
    await kv.put(key, JSON.stringify({ requests }), {
      expirationTtl: 120,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT.REQUESTS_PER_MINUTE - requests.length,
      resetAt: now + RATE_LIMIT.WINDOW_MS,
    };
  } catch (error) {
    // On KV error, allow the request but log
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: 50, resetAt: now + RATE_LIMIT.WINDOW_MS };
  }
}

// ============================================================================
// FMNV CALCULATION ENGINE
// ============================================================================

/**
 * Calculate Performance Index
 * Performance Index = 0.4 * positionScore + 0.3 * efficiencyScore + 0.3 * productionScore
 */
function calculatePerformanceIndex(metrics: PositionMetrics): number {
  const { positionScore, efficiencyScore, productionScore } = metrics;
  return 0.4 * positionScore + 0.3 * efficiencyScore + 0.3 * productionScore;
}

/**
 * Calculate Exposure Index
 * Exposure Index = 0.35 * tvGames + 0.25 * conferenceRank + 0.4 * teamRanking
 */
function calculateExposureIndex(
  tvGames: number,
  conferenceRank: number,
  teamRanking: number
): number {
  // Normalize values to 0-1 scale
  const tvNormalized = Math.min(tvGames / 15, 1); // Max 15 TV games
  const confNormalized = Math.max(0, 1 - (conferenceRank - 1) / 16); // Lower rank = better
  const teamNormalized = Math.max(0, 1 - (teamRanking - 1) / 130); // Lower rank = better

  return 0.35 * tvNormalized + 0.25 * confNormalized + 0.4 * teamNormalized;
}

/**
 * Calculate Influence Index
 * Influence Index = 0.5 * log(followers) + 0.5 * engagementRate
 */
function calculateInfluenceIndex(followers: number, engagementRate: number): number {
  // Normalize log of followers (max around 7 for 10M followers)
  const followersNormalized = followers > 0 ? Math.log10(followers) / 7 : 0;
  // Engagement rate already 0-1 (or percentage)
  const engagementNormalized = Math.min(engagementRate / 10, 1); // Cap at 10%

  return 0.5 * followersNormalized + 0.5 * engagementNormalized;
}

/**
 * Calculate Fair Market Name Value (FMNV)
 * FMNV = baseValue * (1 + performanceMultiplier) * (1 + exposureMultiplier) * (1 + influenceMultiplier)
 */
function calculateFMNV(
  player: Player,
  positionMetrics: PositionMetrics,
  teamContext: Partial<TeamContext>
): PlayerValuation {
  // Base value from position and star rating
  const positionBase = POSITION_BASE_VALUES[player.position] || 500000;
  const starMultiplier = STAR_MULTIPLIERS[player.stars] || 0.5;
  const baseValue = positionBase * starMultiplier;

  // Calculate indices
  const performanceIndex = calculatePerformanceIndex(positionMetrics);
  const exposureIndex = calculateExposureIndex(
    player.tvGames || 0,
    teamContext.conferenceRank || 10,
    teamContext.teamRanking || 50
  );
  const influenceIndex = calculateInfluenceIndex(
    player.socialFollowers || 0,
    player.engagementRate || 0
  );

  // Convert indices to multipliers (scale 0-0.5 for reasonable range)
  const performanceMultiplier = performanceIndex * 0.5;
  const exposureMultiplier = exposureIndex * 0.5;
  const influenceMultiplier = influenceIndex * 0.5;

  // Conference boost
  const conferenceMultiplier = CONFERENCE_RANK_MULTIPLIERS[player.conference] || 1.0;

  // Calculate final FMNV
  const fmnv = Math.round(
    baseValue *
      (1 + performanceMultiplier) *
      (1 + exposureMultiplier) *
      (1 + influenceMultiplier) *
      conferenceMultiplier
  );

  // Confidence score based on data completeness
  let confidence = 0.5; // Base confidence
  if (player.socialFollowers > 0) confidence += 0.15;
  if (player.tvGames > 0) confidence += 0.15;
  if (positionMetrics.productionScore > 0) confidence += 0.2;

  const now = new Date();
  const validUntil = new Date(now.getTime() + CACHE_TTL.VALUATION * 1000);

  return {
    playerId: player.id,
    baseValue,
    performanceIndex,
    exposureIndex,
    influenceIndex,
    performanceMultiplier,
    exposureMultiplier,
    influenceMultiplier,
    fmnv,
    confidence: Math.min(confidence, 1),
    calculatedAt: getCurrentTimestamp(),
    validUntil: validUntil.toISOString(),
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function getPlayersFromDB(
  db: D1Database,
  params: PlayerSearchParams
): Promise<{ players: Player[]; total: number }> {
  const {
    position,
    team,
    conference,
    minValue,
    maxValue,
    minStars,
    maxStars,
    state,
    limit = 50,
    offset = 0,
    sortBy = 'stars',
    sortOrder = 'desc',
  } = params;

  // Build WHERE clause
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (position) {
    conditions.push('position = ?');
    bindings.push(position.toUpperCase());
  }
  if (team) {
    conditions.push('team LIKE ?');
    bindings.push(`%${team}%`);
  }
  if (conference) {
    conditions.push('conference = ?');
    bindings.push(conference);
  }
  if (minStars) {
    conditions.push('stars >= ?');
    bindings.push(minStars);
  }
  if (maxStars) {
    conditions.push('stars <= ?');
    bindings.push(maxStars);
  }
  if (state) {
    conditions.push('state = ?');
    bindings.push(state.toUpperCase());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Validate sort column to prevent SQL injection
  const validSortColumns = ['stars', 'name', 'position', 'team', 'conference'];
  const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'stars';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Count query
  const countQuery = `SELECT COUNT(*) as total FROM nil_players ${whereClause}`;
  const countResult = await db
    .prepare(countQuery)
    .bind(...bindings)
    .first<{ total: number }>();
  const total = countResult?.total || 0;

  // Data query
  const dataQuery = `
    SELECT * FROM nil_players
    ${whereClause}
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT ? OFFSET ?
  `;

  const dataResult = await db
    .prepare(dataQuery)
    .bind(...bindings, limit, offset)
    .all<Player>();

  return {
    players: dataResult.results || [],
    total,
  };
}

async function getPlayerById(db: D1Database, playerId: string): Promise<Player | null> {
  const result = await db
    .prepare('SELECT * FROM nil_players WHERE id = ?')
    .bind(playerId)
    .first<Player>();

  return result || null;
}

async function getPlayerMetrics(db: D1Database, playerId: string): Promise<PositionMetrics> {
  const result = await db
    .prepare(
      'SELECT position_score, efficiency_score, production_score FROM nil_player_metrics WHERE player_id = ?'
    )
    .bind(playerId)
    .first<{
      position_score: number;
      efficiency_score: number;
      production_score: number;
    }>();

  return {
    positionScore: result?.position_score || 0.5,
    efficiencyScore: result?.efficiency_score || 0.5,
    productionScore: result?.production_score || 0.5,
  };
}

async function getTeamContext(db: D1Database, teamId: string): Promise<TeamContext | null> {
  const result = await db
    .prepare('SELECT * FROM nil_teams WHERE id = ?')
    .bind(teamId)
    .first<TeamContext>();

  return result || null;
}

// ============================================================================
// CACHING
// ============================================================================

async function getCached<T>(
  kv: KVNamespace,
  key: string
): Promise<{ data: T; hit: boolean } | null> {
  try {
    const cached = (await kv.get(key, 'json')) as T | null;
    if (cached) {
      return { data: cached, hit: true };
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

async function setCache<T>(
  kv: KVNamespace,
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  try {
    await kv.put(key, JSON.stringify(data), {
      expirationTtl: ttlSeconds,
    });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/nil/players - List/search players with filters
 */
async function handleGetPlayers(request: Request, env: Env, requestId: string): Promise<Response> {
  const url = new URL(request.url);
  const db = env.NIL_DB || env.DB;
  const kv = env.NIL_CACHE || env.KV;

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

  // Generate cache key from params
  const cacheKey = `cache:nil:players:${JSON.stringify(params)}`;

  // Check cache
  const cached = await getCached<{ players: Player[]; total: number }>(kv, cacheKey);
  if (cached) {
    return createResponse<{ players: Player[]; total: number }>(
      {
        success: true,
        data: cached.data,
        meta: {
          timestamp: getCurrentTimestamp(),
          timezone: 'America/Chicago',
          cached: true,
          source: 'BlazeSportsIntel NIL API',
          requestId,
        },
        pagination: {
          total: cached.data.total,
          limit: params.limit!,
          offset: params.offset!,
          hasMore: params.offset! + params.limit! < cached.data.total,
        },
      },
      200,
      { 'X-Cache': 'HIT' }
    );
  }

  try {
    const { players, total } = await getPlayersFromDB(db, params);

    // Calculate FMNV for each player
    const playersWithValuation = await Promise.all(
      players.map(async (player) => {
        const metrics = await getPlayerMetrics(db, player.id);
        const valuation = calculateFMNV(player, metrics, {});
        return {
          ...player,
          fmnv: valuation.fmnv,
          fmnvFormatted: `$${valuation.fmnv.toLocaleString()}`,
        };
      })
    );

    // Filter by value range if specified
    let filteredPlayers = playersWithValuation;
    if (params.minValue || params.maxValue) {
      filteredPlayers = playersWithValuation.filter((p) => {
        if (params.minValue && p.fmnv < params.minValue) return false;
        if (params.maxValue && p.fmnv > params.maxValue) return false;
        return true;
      });
    }

    const result = { players: filteredPlayers, total };

    // Cache result
    await setCache(kv, cacheKey, result, CACHE_TTL.PLAYER_LIST);

    return createResponse<typeof result>(
      {
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
          total,
          limit: params.limit!,
          offset: params.offset!,
          hasMore: params.offset! + params.limit! < total,
        },
      },
      200,
      { 'X-Cache': 'MISS' }
    );
  } catch (error) {
    console.error('Database error:', error);
    return createErrorResponse('Failed to fetch players', 500, requestId);
  }
}

/**
 * GET /api/nil/valuation/:playerId - Get full FMNV breakdown for a player
 */
async function handleGetValuation(
  request: Request,
  env: Env,
  playerId: string,
  requestId: string
): Promise<Response> {
  const db = env.NIL_DB || env.DB;
  const kv = env.NIL_CACHE || env.KV;

  // Check cache
  const cacheKey = `cache:nil:valuation:${playerId}`;
  const cached = await getCached<{
    player: Player;
    valuation: PlayerValuation;
  }>(kv, cacheKey);
  if (cached) {
    return createResponse(
      {
        success: true,
        data: cached.data,
        meta: {
          timestamp: getCurrentTimestamp(),
          timezone: 'America/Chicago',
          cached: true,
          cacheExpiry: cached.data.valuation.validUntil,
          source: 'BlazeSportsIntel NIL API',
          requestId,
        },
      },
      200,
      { 'X-Cache': 'HIT' }
    );
  }

  try {
    const player = await getPlayerById(db, playerId);
    if (!player) {
      return createErrorResponse('Player not found', 404, requestId);
    }

    const metrics = await getPlayerMetrics(db, playerId);
    const teamContext = player.team ? await getTeamContext(db, player.team) : null;
    const valuation = calculateFMNV(player, metrics, teamContext || {});

    const result = {
      player,
      valuation,
      breakdown: {
        baseValue: {
          amount: valuation.baseValue,
          formatted: `$${valuation.baseValue.toLocaleString()}`,
          factors: {
            position: player.position,
            positionBaseValue: POSITION_BASE_VALUES[player.position] || 500000,
            starRating: player.stars,
            starMultiplier: STAR_MULTIPLIERS[player.stars] || 0.5,
          },
        },
        performanceAdjustment: {
          index: valuation.performanceIndex,
          multiplier: valuation.performanceMultiplier,
          contribution: Math.round(valuation.baseValue * valuation.performanceMultiplier),
          factors: {
            positionScore: metrics.positionScore,
            efficiencyScore: metrics.efficiencyScore,
            productionScore: metrics.productionScore,
          },
        },
        exposureAdjustment: {
          index: valuation.exposureIndex,
          multiplier: valuation.exposureMultiplier,
          contribution: Math.round(valuation.baseValue * valuation.exposureMultiplier),
          factors: {
            tvGames: player.tvGames || 0,
            conferenceRank: teamContext?.conferenceRank || 'N/A',
            teamRanking: teamContext?.teamRanking || 'N/A',
          },
        },
        influenceAdjustment: {
          index: valuation.influenceIndex,
          multiplier: valuation.influenceMultiplier,
          contribution: Math.round(valuation.baseValue * valuation.influenceMultiplier),
          factors: {
            socialFollowers: player.socialFollowers || 0,
            engagementRate: player.engagementRate || 0,
          },
        },
        conferenceBoost: {
          conference: player.conference,
          multiplier: CONFERENCE_RANK_MULTIPLIERS[player.conference] || 1.0,
        },
        finalValue: {
          fmnv: valuation.fmnv,
          formatted: `$${valuation.fmnv.toLocaleString()}`,
          confidence: valuation.confidence,
          confidenceLabel:
            valuation.confidence >= 0.8 ? 'High' : valuation.confidence >= 0.5 ? 'Medium' : 'Low',
        },
      },
      comparisons: {
        positionAverage: POSITION_BASE_VALUES[player.position] || 500000,
        percentileEstimate: Math.min(99, Math.round((valuation.fmnv / 10000000) * 100)),
        tier:
          valuation.fmnv >= 5000000
            ? 'Elite'
            : valuation.fmnv >= 2000000
              ? 'Premium'
              : valuation.fmnv >= 1000000
                ? 'Above Average'
                : valuation.fmnv >= 500000
                  ? 'Average'
                  : 'Developing',
      },
    };

    // Cache result
    await setCache(kv, cacheKey, { player, valuation }, CACHE_TTL.VALUATION);

    return createResponse(
      {
        success: true,
        data: result,
        meta: {
          timestamp: getCurrentTimestamp(),
          timezone: 'America/Chicago',
          cached: false,
          cacheExpiry: valuation.validUntil,
          source: 'BlazeSportsIntel NIL API',
          requestId,
        },
      },
      200,
      { 'X-Cache': 'MISS' }
    );
  } catch (error) {
    console.error('Valuation error:', error);
    return createErrorResponse('Failed to calculate valuation', 500, requestId);
  }
}

/**
 * POST /api/nil/optimize - Roster optimizer endpoint
 */
async function handleOptimize(request: Request, env: Env, requestId: string): Promise<Response> {
  const db = env.NIL_DB || env.DB;

  let body: OptimizerRequest;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse('Invalid JSON body', 400, requestId);
  }

  const {
    budget,
    positionNeeds,
    teamId,
    minStars = 3,
    maxPlayers = 10,
    conferencePreference,
  } = body;

  if (!budget || budget <= 0) {
    return createErrorResponse('Budget must be a positive number', 400, requestId);
  }

  if (!positionNeeds || Object.keys(positionNeeds).length === 0) {
    return createErrorResponse('positionNeeds must specify at least one position', 400, requestId);
  }

  try {
    // Get team context if provided
    let teamContext: TeamContext | null = null;
    if (teamId) {
      teamContext = await getTeamContext(db, teamId);
    }

    const recommendations: PlayerRecommendation[] = [];
    let remainingBudget = budget;

    // Process each position need
    for (const [position, count] of Object.entries(positionNeeds)) {
      if (count <= 0) continue;

      // Fetch candidates for this position
      const { players } = await getPlayersFromDB(db, {
        position,
        minStars,
        limit: 20,
        sortBy: 'stars',
        sortOrder: 'desc',
      });

      // Calculate value and fit for each candidate
      const candidates = await Promise.all(
        players.map(async (player) => {
          const metrics = await getPlayerMetrics(db, player.id);
          const valuation = calculateFMNV(player, metrics, teamContext || {});

          // Calculate fit score
          let fitScore = 0.5; // Base fit
          if (conferencePreference?.includes(player.conference)) {
            fitScore += 0.2;
          }
          if (teamContext?.positionNeeds?.[position]) {
            fitScore += 0.3 * Math.min(teamContext.positionNeeds[position] / 5, 1);
          }
          fitScore = Math.min(fitScore, 1);

          return {
            player,
            valuation,
            fitScore,
            valuePerDollar: valuation.fmnv / Math.max(valuation.fmnv * 0.8, 100000),
          };
        })
      );

      // Sort by value efficiency (fit-adjusted)
      candidates.sort((a, b) => b.fitScore * b.valuePerDollar - a.fitScore * a.valuePerDollar);

      // Select best candidates within budget
      let selected = 0;
      for (const candidate of candidates) {
        if (selected >= count) break;
        if (recommendations.length >= maxPlayers) break;

        const cost = Math.round(candidate.valuation.fmnv * 0.8); // Assume 80% of FMNV as cost
        if (cost <= remainingBudget) {
          recommendations.push({
            player: candidate.player,
            valuation: candidate.valuation,
            fitScore: candidate.fitScore,
            priorityReason:
              candidate.fitScore >= 0.7
                ? 'High fit for team needs'
                : candidate.player.stars >= 4
                  ? 'Elite talent available'
                  : 'Value opportunity',
          });
          remainingBudget -= cost;
          selected++;
        }
      }
    }

    // Calculate coverage score
    const positionsNeeded = Object.keys(positionNeeds).length;
    const positionsFilled = new Set(recommendations.map((r) => r.player.position)).size;
    const coverageScore = positionsFilled / positionsNeeded;

    // Calculate value score
    const totalValue = recommendations.reduce((sum, r) => sum + r.valuation.fmnv, 0);
    const totalCost = budget - remainingBudget;
    const valueScore = totalCost > 0 ? totalValue / totalCost : 0;

    const result: OptimizerResult = {
      recommendations,
      totalCost,
      budgetRemaining: remainingBudget,
      coverageScore,
      valueScore,
    };

    return createResponse(
      {
        success: true,
        data: {
          ...result,
          summary: {
            playersRecommended: recommendations.length,
            totalInvestment: `$${totalCost.toLocaleString()}`,
            projectedValue: `$${totalValue.toLocaleString()}`,
            budgetUtilization: `${((totalCost / budget) * 100).toFixed(1)}%`,
            coverageScore: `${(coverageScore * 100).toFixed(0)}%`,
            valueMultiple: `${valueScore.toFixed(2)}x`,
          },
        },
        meta: {
          timestamp: getCurrentTimestamp(),
          timezone: 'America/Chicago',
          cached: false,
          source: 'BlazeSportsIntel NIL API',
          requestId,
        },
      },
      200
    );
  } catch (error) {
    console.error('Optimizer error:', error);
    return createErrorResponse('Optimization failed', 500, requestId);
  }
}

/**
 * GET /api/nil/opportunity-cost/:playerId/:teamId - Calculate team-specific value
 */
async function handleOpportunityCost(
  request: Request,
  env: Env,
  playerId: string,
  teamId: string,
  requestId: string
): Promise<Response> {
  const db = env.NIL_DB || env.DB;
  const kv = env.NIL_CACHE || env.KV;

  // Check cache
  const cacheKey = `cache:nil:opportunity:${playerId}:${teamId}`;
  const cached = await getCached<OpportunityCostResult>(kv, cacheKey);
  if (cached) {
    return createResponse(
      {
        success: true,
        data: cached.data,
        meta: {
          timestamp: getCurrentTimestamp(),
          timezone: 'America/Chicago',
          cached: true,
          source: 'BlazeSportsIntel NIL API',
          requestId,
        },
      },
      200,
      { 'X-Cache': 'HIT' }
    );
  }

  try {
    const player = await getPlayerById(db, playerId);
    if (!player) {
      return createErrorResponse('Player not found', 404, requestId);
    }

    const teamContext = await getTeamContext(db, teamId);
    if (!teamContext) {
      return createErrorResponse('Team not found', 404, requestId);
    }

    const metrics = await getPlayerMetrics(db, playerId);

    // Calculate base FMNV (without team context)
    const baseValuation = calculateFMNV(player, metrics, {});

    // Calculate team-specific FMNV (with team context)
    const teamValuation = calculateFMNV(player, metrics, teamContext);

    // Calculate fit factors
    const positionNeed = teamContext.positionNeeds?.[player.position] || 0;
    const positionNeedScore = Math.min(positionNeed / 5, 1);

    // Scheme match (simplified - would need more data in production)
    const schemeMatch = 0.7; // Default medium-high match

    // Conference boost
    const conferenceBoost =
      player.conference === teamContext.conference
        ? 0.1
        : CONFERENCE_RANK_MULTIPLIERS[teamContext.conference] >= 1.1
          ? 0.05
          : 0;

    // Market multiplier based on team location
    const marketMultiplier = CONFERENCE_RANK_MULTIPLIERS[teamContext.conference] || 1.0;

    // Calculate team-specific value with all factors
    const teamSpecificValue = Math.round(
      teamValuation.fmnv * (1 + positionNeedScore * 0.2) * (1 + conferenceBoost)
    );

    // Opportunity cost = difference between team-specific and base value
    const opportunityCost = teamSpecificValue - baseValuation.fmnv;

    // Generate recommendation
    let recommendation: string;
    if (opportunityCost > baseValuation.fmnv * 0.2) {
      recommendation = `Strong fit: ${player.name} would provide exceptional value for ${teamContext.teamName}`;
    } else if (opportunityCost > 0) {
      recommendation = `Good fit: ${player.name} aligns well with ${teamContext.teamName}'s needs`;
    } else if (opportunityCost > -baseValuation.fmnv * 0.1) {
      recommendation = `Neutral fit: ${player.name} offers standard value for ${teamContext.teamName}`;
    } else {
      recommendation = `Suboptimal fit: Consider other options for ${teamContext.teamName}'s specific needs`;
    }

    const result: OpportunityCostResult = {
      playerId,
      teamId,
      playerName: player.name,
      teamName: teamContext.teamName,
      baseValue: baseValuation.fmnv,
      teamSpecificValue,
      opportunityCost,
      fitAnalysis: {
        positionNeed: positionNeedScore,
        schemeMatch,
        conferenceBoost,
        marketMultiplier,
      },
      recommendation,
    };

    // Cache result
    await setCache(kv, cacheKey, result, CACHE_TTL.TEAM_CONTEXT);

    return createResponse(
      {
        success: true,
        data: {
          ...result,
          formatted: {
            baseValue: `$${baseValuation.fmnv.toLocaleString()}`,
            teamSpecificValue: `$${teamSpecificValue.toLocaleString()}`,
            opportunityCost: `${opportunityCost >= 0 ? '+' : ''}$${opportunityCost.toLocaleString()}`,
            opportunityCostPercent: `${opportunityCost >= 0 ? '+' : ''}${((opportunityCost / baseValuation.fmnv) * 100).toFixed(1)}%`,
          },
        },
        meta: {
          timestamp: getCurrentTimestamp(),
          timezone: 'America/Chicago',
          cached: false,
          source: 'BlazeSportsIntel NIL API',
          requestId,
        },
      },
      200,
      { 'X-Cache': 'MISS' }
    );
  } catch (error) {
    console.error('Opportunity cost error:', error);
    return createErrorResponse('Failed to calculate opportunity cost', 500, requestId);
  }
}

// ============================================================================
// MAIN REQUEST HANDLER
// ============================================================================

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const requestId = generateRequestId();
  const kv = env.NIL_CACHE || env.KV;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // Get client IP for rate limiting
  const clientIP =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0] ||
    'unknown';

  // Check rate limit
  const rateLimit = await checkRateLimit(kv, clientIP);
  if (!rateLimit.allowed) {
    return createResponse<null>(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        meta: {
          timestamp: getCurrentTimestamp(),
          timezone: 'America/Chicago',
          cached: false,
          source: 'BlazeSportsIntel NIL API',
          requestId,
        },
      },
      429,
      {
        'X-RateLimit-Limit': RATE_LIMIT.REQUESTS_PER_MINUTE.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
      }
    );
  }

  // Parse route
  const pathParts = url.pathname.replace('/api/nil/', '').split('/').filter(Boolean);
  const route = pathParts[0] || '';

  try {
    // Route handling
    switch (route) {
      case 'players':
        if (request.method !== 'GET') {
          return createErrorResponse('Method not allowed', 405, requestId);
        }
        return handleGetPlayers(request, env, requestId);

      case 'valuation':
        if (request.method !== 'GET') {
          return createErrorResponse('Method not allowed', 405, requestId);
        }
        const playerId = pathParts[1];
        if (!playerId) {
          return createErrorResponse('Player ID required', 400, requestId);
        }
        return handleGetValuation(request, env, playerId, requestId);

      case 'optimize':
        if (request.method !== 'POST') {
          return createErrorResponse('Method not allowed', 405, requestId);
        }
        return handleOptimize(request, env, requestId);

      case 'opportunity-cost':
        if (request.method !== 'GET') {
          return createErrorResponse('Method not allowed', 405, requestId);
        }
        const oppPlayerId = pathParts[1];
        const teamId = pathParts[2];
        if (!oppPlayerId || !teamId) {
          return createErrorResponse('Player ID and Team ID required', 400, requestId);
        }
        return handleOpportunityCost(request, env, oppPlayerId, teamId, requestId);

      default:
        // API documentation/health check
        return createResponse(
          {
            success: true,
            data: {
              name: 'BlazeSportsIntel NIL Valuation API',
              version: '1.0.0',
              endpoints: {
                'GET /api/nil/players':
                  'List/search players with filters (position, team, conference, value range)',
                'GET /api/nil/valuation/:playerId': 'Get full FMNV breakdown for a player',
                'POST /api/nil/optimize':
                  'Roster optimizer (accepts budget, position needs, team context)',
                'GET /api/nil/opportunity-cost/:playerId/:teamId': 'Calculate team-specific value',
              },
              documentation: 'https://blazesportsintel.com/docs/api/nil',
              rateLimit: {
                limit: RATE_LIMIT.REQUESTS_PER_MINUTE,
                window: '1 minute',
                remaining: rateLimit.remaining,
              },
            },
            meta: {
              timestamp: getCurrentTimestamp(),
              timezone: 'America/Chicago',
              cached: false,
              source: 'BlazeSportsIntel NIL API',
              requestId,
            },
          },
          200,
          {
            'X-RateLimit-Limit': RATE_LIMIT.REQUESTS_PER_MINUTE.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          }
        );
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return createErrorResponse('Internal server error', 500, requestId);
  }
};
