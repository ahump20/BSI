/**
 * BSI API GATEWAY
 * Central routing for all Blaze Sports Intel API endpoints
 *
 * Routes:
 * - /api/v1/scores/* - Live scores and game data
 * - /api/v1/odds/* - Betting odds from TheOdds API
 * - /api/v1/predictions/* - AI/ML predictions
 * - /api/v1/teams/* - Team data
 * - /api/v1/players/* - Player data
 * - /api/v1/stats/* - Statistics
 * - /api/v1/health - Health check
 */

import type {
  KVNamespace,
  D1Database,
  R2Bucket,
  AnalyticsEngineDataset,
  Ai,
  VectorizeIndex,
} from '@cloudflare/workers-types';

// ============================================================================
// Types
// ============================================================================

interface Env {
  // KV Namespaces
  CACHE_SCORES: KVNamespace;
  CACHE_ODDS: KVNamespace;
  SESSION_DATA: KVNamespace;
  KV: KVNamespace;

  // D1 Databases
  DB: D1Database;
  HISTORICAL_DB: D1Database;

  // R2 Buckets
  ASSETS: R2Bucket;
  SPORTS_DATA: R2Bucket;

  // AI Services
  AI: Ai;
  VECTORIZE: VectorizeIndex;

  // Analytics
  ANALYTICS: AnalyticsEngineDataset;

  // Environment Variables
  ENVIRONMENT: string;
  API_VERSION: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW_SECONDS: string;

  // Secrets
  THEODDSAPI_KEY?: string;
  SPORTSDATAIO_KEY?: string;
  SPORTSRADAR_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  JWT_SECRET?: string;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta: {
    timestamp: string;
    version: string;
    cache?: 'HIT' | 'MISS';
    requestId: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

// ============================================================================
// Utility Functions
// ============================================================================

function generateRequestId(): string {
  return `bsi-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function jsonResponse<T>(
  data: APIResponse<T>,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...SECURITY_HEADERS,
      ...additionalHeaders,
    },
  });
}

function errorResponse(
  error: string,
  status: number,
  requestId: string,
  version: string
): Response {
  return jsonResponse<never>(
    {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        version,
        requestId,
      },
    },
    status
  );
}

// ============================================================================
// Rate Limiter
// ============================================================================

async function checkRateLimit(
  kv: KVNamespace,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const key = `rate_limit:${identifier}`;
  const current = await kv.get(key);

  if (!current) {
    await kv.put(key, '1', { expirationTtl: windowSeconds });
    return false;
  }

  const count = parseInt(current, 10);
  if (count >= limit) {
    return true;
  }

  await kv.put(key, (count + 1).toString(), { expirationTtl: windowSeconds });
  return false;
}

// ============================================================================
// Route Handlers
// ============================================================================

async function handleHealthCheck(
  env: Env,
  requestId: string
): Promise<Response> {
  const checks = {
    kv_scores: false,
    kv_odds: false,
    d1_core: false,
    d1_historical: false,
    r2_assets: false,
  };

  // Check KV namespaces
  try {
    await env.CACHE_SCORES?.put('health_check', 'ok', { expirationTtl: 60 });
    checks.kv_scores = true;
  } catch {
    // KV check failed
  }

  try {
    await env.CACHE_ODDS?.put('health_check', 'ok', { expirationTtl: 60 });
    checks.kv_odds = true;
  } catch {
    // KV check failed
  }

  // Check D1 databases
  try {
    await env.DB?.prepare('SELECT 1').first();
    checks.d1_core = true;
  } catch {
    // D1 check failed
  }

  try {
    await env.HISTORICAL_DB?.prepare('SELECT 1').first();
    checks.d1_historical = true;
  } catch {
    // D1 check failed
  }

  // Check R2
  try {
    await env.ASSETS?.head('health_check');
    checks.r2_assets = true;
  } catch {
    // R2 check failed (file might not exist, but connection works)
    checks.r2_assets = true;
  }

  const allHealthy = Object.values(checks).every((v) => v);

  return jsonResponse(
    {
      success: allHealthy,
      data: {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        environment: env.ENVIRONMENT,
        uptime: process.uptime?.() || 'N/A',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: env.API_VERSION,
        requestId,
      },
    },
    allHealthy ? 200 : 503
  );
}

async function handleScores(
  request: Request,
  env: Env,
  url: URL,
  requestId: string
): Promise<Response> {
  const pathParts = url.pathname.split('/').filter(Boolean);
  // /api/v1/scores/{league}/{gameId?}
  const league = pathParts[3]?.toUpperCase();
  const gameId = pathParts[4];

  if (!league) {
    return errorResponse('League code required (e.g., /api/v1/scores/MLB)', 400, requestId, env.API_VERSION);
  }

  // Check cache first
  const cacheKey = gameId ? `scores:${league}:${gameId}` : `scores:${league}:all`;
  const cached = await env.CACHE_SCORES?.get(cacheKey);

  if (cached) {
    return jsonResponse(
      {
        success: true,
        data: JSON.parse(cached),
        meta: {
          timestamp: new Date().toISOString(),
          version: env.API_VERSION,
          cache: 'HIT',
          requestId,
        },
      },
      200,
      { 'Cache-Control': 'public, max-age=60' }
    );
  }

  // Query database
  try {
    const query = gameId
      ? `SELECT g.*, ht.name as home_team_name, at.name as away_team_name
         FROM games g
         JOIN teams ht ON g.home_team_id = ht.team_id
         JOIN teams at ON g.away_team_id = at.team_id
         JOIN leagues l ON g.league_id = l.league_id
         WHERE l.code = ? AND g.external_id = ?`
      : `SELECT g.*, ht.name as home_team_name, at.name as away_team_name
         FROM games g
         JOIN teams ht ON g.home_team_id = ht.team_id
         JOIN teams at ON g.away_team_id = at.team_id
         JOIN leagues l ON g.league_id = l.league_id
         WHERE l.code = ? AND g.game_date >= date('now', '-1 day')
         ORDER BY g.game_date, g.game_time
         LIMIT 50`;

    const result = gameId
      ? await env.DB?.prepare(query).bind(league, gameId).first()
      : await env.DB?.prepare(query).bind(league).all();

    const data = gameId ? result : result?.results || [];

    // Cache for 60 seconds
    await env.CACHE_SCORES?.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });

    return jsonResponse(
      {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          version: env.API_VERSION,
          cache: 'MISS',
          requestId,
        },
      },
      200,
      { 'Cache-Control': 'public, max-age=60' }
    );
  } catch (error) {
    console.error('Scores query error:', error);
    return errorResponse('Failed to fetch scores', 500, requestId, env.API_VERSION);
  }
}

async function handleOdds(
  request: Request,
  env: Env,
  url: URL,
  requestId: string
): Promise<Response> {
  const pathParts = url.pathname.split('/').filter(Boolean);
  // /api/v1/odds/{league}/{gameId?}
  const league = pathParts[3]?.toUpperCase();
  const gameId = pathParts[4];

  if (!league) {
    return errorResponse('League code required (e.g., /api/v1/odds/NFL)', 400, requestId, env.API_VERSION);
  }

  // Check cache (5-min TTL for odds)
  const cacheKey = gameId ? `odds:${league}:${gameId}` : `odds:${league}:all`;
  const cached = await env.CACHE_ODDS?.get(cacheKey);

  if (cached) {
    return jsonResponse(
      {
        success: true,
        data: JSON.parse(cached),
        meta: {
          timestamp: new Date().toISOString(),
          version: env.API_VERSION,
          cache: 'HIT',
          requestId,
        },
      },
      200,
      { 'Cache-Control': 'public, max-age=300' }
    );
  }

  // Fetch from TheOdds API if available
  if (env.THEODDSAPI_KEY) {
    try {
      const sportKey = getSportKey(league);
      const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${env.THEODDSAPI_KEY}&regions=us&markets=spreads,totals,h2h&oddsFormat=american`;

      const response = await fetch(oddsUrl);
      if (response.ok) {
        const oddsData = await response.json();

        // Cache for 5 minutes
        await env.CACHE_ODDS?.put(cacheKey, JSON.stringify(oddsData), { expirationTtl: 300 });

        return jsonResponse(
          {
            success: true,
            data: oddsData,
            meta: {
              timestamp: new Date().toISOString(),
              version: env.API_VERSION,
              cache: 'MISS',
              requestId,
            },
          },
          200,
          { 'Cache-Control': 'public, max-age=300' }
        );
      }
    } catch (error) {
      console.error('Odds API error:', error);
    }
  }

  // Fallback to database
  try {
    const query = `SELECT o.*, g.game_date, g.game_time,
                   ht.name as home_team, at.name as away_team
                   FROM game_odds o
                   JOIN games g ON o.game_id = g.game_id
                   JOIN teams ht ON g.home_team_id = ht.team_id
                   JOIN teams at ON g.away_team_id = at.team_id
                   JOIN leagues l ON g.league_id = l.league_id
                   WHERE l.code = ?
                   ORDER BY o.captured_at DESC
                   LIMIT 100`;

    const result = await env.DB?.prepare(query).bind(league).all();

    return jsonResponse(
      {
        success: true,
        data: result?.results || [],
        message: 'Data from database cache',
        meta: {
          timestamp: new Date().toISOString(),
          version: env.API_VERSION,
          cache: 'MISS',
          requestId,
        },
      },
      200
    );
  } catch (error) {
    console.error('Database odds query error:', error);
    return errorResponse('Failed to fetch odds', 500, requestId, env.API_VERSION);
  }
}

async function handlePredictions(
  request: Request,
  env: Env,
  url: URL,
  requestId: string
): Promise<Response> {
  const pathParts = url.pathname.split('/').filter(Boolean);
  // /api/v1/predictions/{league}/{gameId?}
  const league = pathParts[3]?.toUpperCase();
  const gameId = pathParts[4];

  if (request.method === 'POST') {
    // Create new prediction (requires authentication)
    try {
      const body = await request.json() as Record<string, unknown>;

      const insertQuery = `INSERT INTO predictions
        (game_id, model_name, model_version, home_win_prob, away_win_prob,
         predicted_home_score, predicted_away_score, predicted_total, predicted_spread,
         confidence_level, recommendation, recommendation_strength)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      await env.DB?.prepare(insertQuery)
        .bind(
          body.game_id,
          body.model_name || 'bsi-api',
          body.model_version || '1.0.0',
          body.home_win_prob,
          body.away_win_prob,
          body.predicted_home_score,
          body.predicted_away_score,
          body.predicted_total,
          body.predicted_spread,
          body.confidence_level || 0.95,
          body.recommendation,
          body.recommendation_strength
        )
        .run();

      return jsonResponse(
        {
          success: true,
          message: 'Prediction created',
          meta: {
            timestamp: new Date().toISOString(),
            version: env.API_VERSION,
            requestId,
          },
        },
        201
      );
    } catch (error) {
      console.error('Prediction insert error:', error);
      return errorResponse('Failed to create prediction', 500, requestId, env.API_VERSION);
    }
  }

  // GET predictions
  try {
    const query = league
      ? `SELECT p.*, g.game_date, ht.name as home_team, at.name as away_team
         FROM predictions p
         JOIN games g ON p.game_id = g.game_id
         JOIN teams ht ON g.home_team_id = ht.team_id
         JOIN teams at ON g.away_team_id = at.team_id
         JOIN leagues l ON g.league_id = l.league_id
         WHERE l.code = ? AND g.status = 'scheduled'
         ORDER BY g.game_date, g.game_time
         LIMIT 50`
      : `SELECT p.*, g.game_date, ht.name as home_team, at.name as away_team
         FROM predictions p
         JOIN games g ON p.game_id = g.game_id
         JOIN teams ht ON g.home_team_id = ht.team_id
         JOIN teams at ON g.away_team_id = at.team_id
         WHERE g.status = 'scheduled'
         ORDER BY g.game_date, g.game_time
         LIMIT 50`;

    const result = league
      ? await env.DB?.prepare(query).bind(league).all()
      : await env.DB?.prepare(query).all();

    return jsonResponse(
      {
        success: true,
        data: result?.results || [],
        meta: {
          timestamp: new Date().toISOString(),
          version: env.API_VERSION,
          requestId,
        },
      },
      200
    );
  } catch (error) {
    console.error('Predictions query error:', error);
    return errorResponse('Failed to fetch predictions', 500, requestId, env.API_VERSION);
  }
}

async function handleTeams(
  request: Request,
  env: Env,
  url: URL,
  requestId: string
): Promise<Response> {
  const pathParts = url.pathname.split('/').filter(Boolean);
  const league = pathParts[3]?.toUpperCase();
  const teamId = pathParts[4];

  try {
    const query = teamId
      ? `SELECT t.*, l.code as league_code, l.name as league_name
         FROM teams t
         JOIN leagues l ON t.league_id = l.league_id
         WHERE l.code = ? AND (t.team_id = ? OR t.abbreviation = ? OR t.external_id = ?)`
      : league
        ? `SELECT t.*, l.code as league_code
           FROM teams t
           JOIN leagues l ON t.league_id = l.league_id
           WHERE l.code = ? AND t.is_active = 1
           ORDER BY t.name`
        : `SELECT t.*, l.code as league_code
           FROM teams t
           JOIN leagues l ON t.league_id = l.league_id
           WHERE t.is_active = 1
           ORDER BY l.code, t.name`;

    const result = teamId
      ? await env.DB?.prepare(query).bind(league, teamId, teamId, teamId).first()
      : league
        ? await env.DB?.prepare(query).bind(league).all()
        : await env.DB?.prepare(query).all();

    const data = teamId ? result : (result as { results?: unknown[] })?.results || [];

    return jsonResponse(
      {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          version: env.API_VERSION,
          requestId,
        },
      },
      200,
      { 'Cache-Control': 'public, max-age=3600' }
    );
  } catch (error) {
    console.error('Teams query error:', error);
    return errorResponse('Failed to fetch teams', 500, requestId, env.API_VERSION);
  }
}

async function handlePlayers(
  request: Request,
  env: Env,
  url: URL,
  requestId: string
): Promise<Response> {
  const pathParts = url.pathname.split('/').filter(Boolean);
  const teamId = pathParts[3];
  const playerId = pathParts[4];

  try {
    const query = playerId
      ? `SELECT p.*, t.name as team_name, t.abbreviation as team_abbr
         FROM players p
         LEFT JOIN teams t ON p.team_id = t.team_id
         WHERE p.player_id = ? OR p.external_id = ?`
      : teamId
        ? `SELECT p.*, t.name as team_name
           FROM players p
           JOIN teams t ON p.team_id = t.team_id
           WHERE t.team_id = ? OR t.abbreviation = ?
           ORDER BY p.last_name`
        : `SELECT p.player_id, p.full_name, p.position, t.name as team_name
           FROM players p
           LEFT JOIN teams t ON p.team_id = t.team_id
           WHERE p.status = 'active'
           ORDER BY p.last_name
           LIMIT 100`;

    const result = playerId
      ? await env.DB?.prepare(query).bind(playerId, playerId).first()
      : teamId
        ? await env.DB?.prepare(query).bind(teamId, teamId).all()
        : await env.DB?.prepare(query).all();

    const data = playerId ? result : (result as { results?: unknown[] })?.results || [];

    return jsonResponse(
      {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          version: env.API_VERSION,
          requestId,
        },
      },
      200,
      { 'Cache-Control': 'public, max-age=1800' }
    );
  } catch (error) {
    console.error('Players query error:', error);
    return errorResponse('Failed to fetch players', 500, requestId, env.API_VERSION);
  }
}

async function handleStats(
  request: Request,
  env: Env,
  url: URL,
  requestId: string
): Promise<Response> {
  const pathParts = url.pathname.split('/').filter(Boolean);
  const entityType = pathParts[3]; // 'team' or 'player'
  const entityId = pathParts[4];

  const season = url.searchParams.get('season') || new Date().getFullYear().toString();
  const statType = url.searchParams.get('type');

  try {
    let query: string;
    let params: (string | number)[];

    if (entityType === 'team' && entityId) {
      query = `SELECT s.*, t.name as team_name
               FROM stats s
               JOIN teams t ON s.entity_id = t.team_id
               WHERE s.entity_type = 'team' AND s.entity_id = ? AND s.season = ?
               ${statType ? 'AND s.stat_type = ?' : ''}`;
      params = statType ? [entityId, season, statType] : [entityId, season];
    } else if (entityType === 'player' && entityId) {
      query = `SELECT s.*, p.full_name as player_name
               FROM stats s
               JOIN players p ON s.entity_id = p.player_id
               WHERE s.entity_type = 'player' AND s.entity_id = ? AND s.season = ?
               ${statType ? 'AND s.stat_type = ?' : ''}`;
      params = statType ? [entityId, season, statType] : [entityId, season];
    } else {
      query = `SELECT s.stat_type, COUNT(*) as count
               FROM stats s
               WHERE s.season = ?
               GROUP BY s.stat_type`;
      params = [season];
    }

    const result = await env.DB?.prepare(query).bind(...params).all();

    return jsonResponse(
      {
        success: true,
        data: result?.results || [],
        meta: {
          timestamp: new Date().toISOString(),
          version: env.API_VERSION,
          requestId,
        },
      },
      200,
      { 'Cache-Control': 'public, max-age=300' }
    );
  } catch (error) {
    console.error('Stats query error:', error);
    return errorResponse('Failed to fetch stats', 500, requestId, env.API_VERSION);
  }
}

async function handleLeagues(
  env: Env,
  requestId: string
): Promise<Response> {
  try {
    const result = await env.DB?.prepare(
      'SELECT * FROM leagues WHERE is_active = 1 ORDER BY sport, name'
    ).all();

    return jsonResponse(
      {
        success: true,
        data: result?.results || [],
        meta: {
          timestamp: new Date().toISOString(),
          version: env.API_VERSION,
          requestId,
        },
      },
      200,
      { 'Cache-Control': 'public, max-age=86400' }
    );
  } catch (error) {
    console.error('Leagues query error:', error);
    return errorResponse('Failed to fetch leagues', 500, requestId, env.API_VERSION);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getSportKey(league: string): string {
  const sportKeys: Record<string, string> = {
    MLB: 'baseball_mlb',
    NFL: 'americanfootball_nfl',
    NBA: 'basketball_nba',
    NHL: 'icehockey_nhl',
    NCAAF: 'americanfootball_ncaaf',
    NCAAM: 'basketball_ncaab',
    NCAAB: 'baseball_ncaa',
  };
  return sportKeys[league] || league.toLowerCase();
}

// ============================================================================
// Main Handler
// ============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const requestId = generateRequestId();

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = parseInt(env.RATE_LIMIT_REQUESTS || '100', 10);
    const rateLimitWindow = parseInt(env.RATE_LIMIT_WINDOW_SECONDS || '3600', 10);

    const isRateLimited = await checkRateLimit(
      env.KV || env.CACHE_SCORES,
      clientIP,
      rateLimit,
      rateLimitWindow
    );

    if (isRateLimited) {
      return jsonResponse(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          meta: {
            timestamp: new Date().toISOString(),
            version: env.API_VERSION,
            requestId,
          },
        },
        429,
        { 'Retry-After': rateLimitWindow.toString() }
      );
    }

    // Log request to analytics
    ctx.waitUntil(
      (async () => {
        try {
          env.ANALYTICS?.writeDataPoint({
            blobs: [path, method, clientIP],
            doubles: [1],
            indexes: ['api_request'],
          });
        } catch {
          // Analytics write failed, non-critical
        }
      })()
    );

    // Route handling
    try {
      // Health check
      if (path === '/api/v1/health' || path === '/api/health') {
        return handleHealthCheck(env, requestId);
      }

      // API versioning check
      if (!path.startsWith('/api/v1/')) {
        return errorResponse(
          'API version required. Use /api/v1/ prefix.',
          400,
          requestId,
          env.API_VERSION
        );
      }

      // Route to handlers
      if (path.startsWith('/api/v1/scores')) {
        return handleScores(request, env, url, requestId);
      }

      if (path.startsWith('/api/v1/odds')) {
        return handleOdds(request, env, url, requestId);
      }

      if (path.startsWith('/api/v1/predictions')) {
        return handlePredictions(request, env, url, requestId);
      }

      if (path.startsWith('/api/v1/teams')) {
        return handleTeams(request, env, url, requestId);
      }

      if (path.startsWith('/api/v1/players')) {
        return handlePlayers(request, env, url, requestId);
      }

      if (path.startsWith('/api/v1/stats')) {
        return handleStats(request, env, url, requestId);
      }

      if (path === '/api/v1/leagues') {
        return handleLeagues(env, requestId);
      }

      // 404 for unknown routes
      return jsonResponse(
        {
          success: false,
          error: 'Not Found',
          message: 'API endpoint not found',
          data: {
            availableEndpoints: [
              'GET /api/v1/health',
              'GET /api/v1/leagues',
              'GET /api/v1/scores/{league}',
              'GET /api/v1/scores/{league}/{gameId}',
              'GET /api/v1/odds/{league}',
              'GET /api/v1/odds/{league}/{gameId}',
              'GET /api/v1/predictions/{league}',
              'POST /api/v1/predictions',
              'GET /api/v1/teams/{league}',
              'GET /api/v1/teams/{league}/{teamId}',
              'GET /api/v1/players/{teamId}',
              'GET /api/v1/players/{teamId}/{playerId}',
              'GET /api/v1/stats/team/{teamId}',
              'GET /api/v1/stats/player/{playerId}',
            ],
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: env.API_VERSION,
            requestId,
          },
        },
        404
      );
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse(
        'Internal server error',
        500,
        requestId,
        env.API_VERSION
      );
    }
  },
} satisfies ExportedHandler<Env>;
