/**
 * BSI Prediction API Worker
 *
 * Cloudflare Worker exposing the prediction engine via REST API.
 * Supports single game predictions, batch predictions, and season projections.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

import {
  BsiPredictionEngine,
  CalibrationEngine,
  type CloudflareEnv,
  type SupportedSport,
  type TeamState,
  type GameContext,
  type SubscriptionTier,
  type GameResult,
} from '../../lib/prediction';

import {
  AuthMiddleware,
  type UserPayload,
  type ApiKeyPayload,
} from '../../lib/security/auth';

import {
  RateLimiter,
  RATE_LIMIT_TIERS,
} from '../../lib/security/rate-limiter';

// ============================================================================
// Types
// ============================================================================

interface RequestContext {
  env: CloudflareEnv;
  request: Request;
  url: URL;
  tier: SubscriptionTier;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: {
    timestamp: string;
    processingTimeMs: number;
    modelVersion: string;
    tier: SubscriptionTier;
  };
}

// ============================================================================
// Worker Entry Point
// ============================================================================

export default {
  async fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);

    // Security headers (restrictive CORS + CSP + security headers)
    const securityHeaders = {
      'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID, X-User-Tier',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.blazesportsintel.com https://blazesportsintel.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    };

    // Alias for backwards compatibility
    const corsHeaders = securityHeaders;

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Rate limiting - check before processing request
    const rateLimitResult = await RateLimiter.check(request, env);
    if (!rateLimitResult.allowed) {
      return RateLimiter.createRateLimitResponse(rateLimitResult);
    }

    // Extract and validate tier from auth header
    const tier = await extractAndValidateTier(request, env);

    const context: RequestContext = {
      env,
      request,
      url,
      tier,
    };

    try {
      const response = await routeRequest(context);
      const processingTime = Date.now() - startTime;

      return new Response(
        JSON.stringify({
          ...response,
          meta: {
            timestamp: new Date().toISOString(),
            processingTimeMs: processingTime,
            modelVersion: env.MODEL_VERSION ?? '1.0.0',
            tier,
          },
        }),
        {
          status: response.success ? 200 : 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: errorMessage,
          },
          meta: {
            timestamp: new Date().toISOString(),
            processingTimeMs: processingTime,
            modelVersion: env.MODEL_VERSION ?? '1.0.0',
            tier,
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};

// ============================================================================
// Router
// ============================================================================

async function routeRequest(ctx: RequestContext): Promise<ApiResponse> {
  const { url, request } = ctx;
  // Normalize path - routes from api.blazesportsintel.com strip /api prefix
  const rawPath = url.pathname;
  const path = rawPath.startsWith('/api') ? rawPath : `/api${rawPath}`;
  const method = request.method;

  // Health check
  if ((path === '/api/v1/health' || rawPath === '/v1/health') && method === 'GET') {
    return handleHealth(ctx);
  }

  // Single game prediction
  if (path.match(/^\/api\/v1\/predict\/game\/[\w-]+$/) && method === 'GET') {
    const gameId = path.split('/').pop()!;
    return handleGamePrediction(ctx, gameId);
  }

  // Batch predictions
  if (path === '/api/v1/predict/batch' && method === 'POST') {
    return handleBatchPrediction(ctx);
  }

  // Season projection
  if (path.match(/^\/api\/v1\/predict\/team\/[\w-]+\/season$/) && method === 'GET') {
    const segments = path.split('/');
    const teamId = segments[segments.length - 2];
    return handleSeasonProjection(ctx, teamId);
  }

  // Prediction explanation
  if (path.match(/^\/api\/v1\/explain\/[\w-]+$/) && method === 'GET') {
    const predictionId = path.split('/').pop()!;
    return handleExplanation(ctx, predictionId);
  }

  // Calibration metrics
  if (path.match(/^\/api\/v1\/calibration\/\w+$/) && method === 'GET') {
    const sport = path.split('/').pop() as SupportedSport;
    return handleCalibration(ctx, sport);
  }

  // Game complete webhook (for state updates)
  if (path === '/api/v1/webhook/game-complete' && method === 'POST') {
    return handleGameComplete(ctx);
  }

  // Team state
  if (path.match(/^\/api\/v1\/state\/team\/[\w-]+$/) && method === 'GET') {
    const teamId = path.split('/').pop()!;
    return handleTeamState(ctx, teamId);
  }

  // 404
  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${method} ${rawPath} not found`,
    },
  };
}

// ============================================================================
// Handlers
// ============================================================================

async function handleHealth(ctx: RequestContext): Promise<ApiResponse> {
  return {
    success: true,
    data: {
      status: 'healthy',
      service: 'bsi-prediction-api',
      version: ctx.env.MODEL_VERSION ?? '1.0.0',
    },
  };
}

async function handleGamePrediction(
  ctx: RequestContext,
  gameId: string
): Promise<ApiResponse> {
  const { env, url, tier } = ctx;

  // Parse query params
  const sport = url.searchParams.get('sport') as SupportedSport ?? 'cfb';

  // In production, would fetch team data from D1/API
  // For now, use mock data or require POST with team data
  const homeTeam = await fetchTeamState(env, url.searchParams.get('homeTeamId') ?? '', sport);
  const awayTeam = await fetchTeamState(env, url.searchParams.get('awayTeamId') ?? '', sport);

  if (!homeTeam || !awayTeam) {
    return {
      success: false,
      error: {
        code: 'MISSING_TEAM_DATA',
        message: 'homeTeamId and awayTeamId are required query parameters',
      },
    };
  }

  const context: GameContext = {
    gameId,
    sport,
    season: parseInt(url.searchParams.get('season') ?? '2025'),
    week: parseInt(url.searchParams.get('week') ?? '1'),
    date: url.searchParams.get('date') ?? new Date().toISOString(),
    location: (url.searchParams.get('location') as 'home' | 'away' | 'neutral') ?? 'home',
    isRivalry: url.searchParams.get('rivalry') === 'true',
    isPlayoff: url.searchParams.get('playoff') === 'true',
    isConference: url.searchParams.get('conference') !== 'false',
    restDays: {
      home: parseInt(url.searchParams.get('homeRest') ?? '7'),
      away: parseInt(url.searchParams.get('awayRest') ?? '7'),
    },
  };

  const engine = new BsiPredictionEngine(env);
  const prediction = await engine.predictGame(homeTeam, awayTeam, context, { tier });

  return {
    success: true,
    data: prediction,
  };
}

async function handleBatchPrediction(ctx: RequestContext): Promise<ApiResponse> {
  const { env, request, tier } = ctx;

  const body = await request.json() as {
    games: Array<{
      gameId: string;
      sport: SupportedSport;
      homeTeamId: string;
      awayTeamId: string;
      date?: string;
      location?: 'home' | 'away' | 'neutral';
      isRivalry?: boolean;
      isPlayoff?: boolean;
    }>;
  };

  if (!body.games || body.games.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'games array is required',
      },
    };
  }

  if (body.games.length > 50) {
    return {
      success: false,
      error: {
        code: 'TOO_MANY_GAMES',
        message: 'Maximum 50 games per batch request',
      },
    };
  }

  const engine = new BsiPredictionEngine(env);
  const games: Array<{
    homeTeam: TeamState;
    awayTeam: TeamState;
    context: GameContext;
  }> = [];

  for (const game of body.games) {
    const homeTeam = await fetchTeamState(env, game.homeTeamId, game.sport);
    const awayTeam = await fetchTeamState(env, game.awayTeamId, game.sport);

    if (!homeTeam || !awayTeam) continue;

    games.push({
      homeTeam,
      awayTeam,
      context: {
        gameId: game.gameId,
        sport: game.sport,
        season: 2025,
        week: 1,
        date: game.date ?? new Date().toISOString(),
        location: game.location ?? 'home',
        isRivalry: game.isRivalry ?? false,
        isPlayoff: game.isPlayoff ?? false,
        isConference: true,
        restDays: { home: 7, away: 7 },
      },
    });
  }

  const predictions = await engine.predictBatch(games, tier);

  return {
    success: true,
    data: {
      predictions,
      requestedCount: body.games.length,
      predictedCount: predictions.length,
    },
  };
}

async function handleSeasonProjection(
  ctx: RequestContext,
  teamId: string
): Promise<ApiResponse> {
  const { env, url } = ctx;

  const sport = url.searchParams.get('sport') as SupportedSport ?? 'cfb';
  const season = parseInt(url.searchParams.get('season') ?? '2025');

  const team = await fetchTeamState(env, teamId, sport);

  if (!team) {
    return {
      success: false,
      error: {
        code: 'TEAM_NOT_FOUND',
        message: `Team ${teamId} not found`,
      },
    };
  }

  // Would need to fetch schedule and opponents from D1
  // Returning stub for now
  return {
    success: true,
    data: {
      message: 'Season projection endpoint - requires schedule data',
      teamId,
      sport,
      season,
    },
  };
}

async function handleExplanation(
  ctx: RequestContext,
  predictionId: string
): Promise<ApiResponse> {
  const { env, tier } = ctx;

  if (tier === 'free') {
    return {
      success: false,
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Detailed explanations require Pro or Enterprise subscription',
      },
    };
  }

  // Fetch prediction from D1
  const query = `
    SELECT * FROM prediction_forecasts
    WHERE game_id = ?
    ORDER BY forecast_timestamp DESC
    LIMIT 1
  `;

  const result = await env.BSI_HISTORICAL_DB.prepare(query).bind(predictionId).first();

  if (!result) {
    return {
      success: false,
      error: {
        code: 'PREDICTION_NOT_FOUND',
        message: `Prediction ${predictionId} not found`,
      },
    };
  }

  return {
    success: true,
    data: {
      gameId: result.game_id,
      topFactors: JSON.parse(result.top_factors_json as string ?? '[]'),
      shapSummary: tier === 'enterprise'
        ? JSON.parse(result.shap_summary_json as string ?? '[]')
        : [],
      humanSummary: result.human_summary,
    },
  };
}

async function handleCalibration(
  ctx: RequestContext,
  sport: SupportedSport
): Promise<ApiResponse> {
  const { env } = ctx;

  const calibrationEngine = new CalibrationEngine(env);
  const calibration = await calibrationEngine.getLatestCalibration(
    sport,
    env.MODEL_VERSION ?? '1.0.0'
  );

  if (!calibration) {
    return {
      success: true,
      data: {
        sport,
        message: 'No calibration data available yet',
      },
    };
  }

  const health = calibrationEngine.generateHealthReport(calibration);

  return {
    success: true,
    data: {
      calibration,
      health,
    },
  };
}

async function handleGameComplete(ctx: RequestContext): Promise<ApiResponse> {
  const { env, request } = ctx;

  const body = await request.json() as {
    gameId: string;
    sport: SupportedSport;
    season: number;
    gameNumber: number;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    expectedMargin?: number;
    homeWinProbabilityPre?: number;
    isPlayoff?: boolean;
    isRivalry?: boolean;
  };

  const engine = new BsiPredictionEngine(env);

  const result: GameResult = body.homeScore > body.awayScore ? 'W' : 'L';
  const margin = body.homeScore - body.awayScore;
  const expectedMargin = body.expectedMargin ?? 0;
  const winProbPre = body.homeWinProbabilityPre ?? 0.5;

  // Update home team state
  await engine.updateTeamStateAfterGame(
    body.homeTeamId,
    body.sport,
    body.season,
    {
      result,
      margin,
      wasUpset: result === 'W' ? margin < -7 : margin > 7,
      expectedMargin,
      opponentStrength: 0.5,
      opponentId: body.awayTeamId,
      gameNumber: body.gameNumber,
      winProbabilityPre: winProbPre,
      isPlayoff: body.isPlayoff ?? false,
      isRivalry: body.isRivalry ?? false,
    }
  );

  // Update away team state (opposite result)
  await engine.updateTeamStateAfterGame(
    body.awayTeamId,
    body.sport,
    body.season,
    {
      result: result === 'W' ? 'L' : 'W',
      margin: -margin,
      wasUpset: result === 'L' ? margin < -7 : margin > 7,
      expectedMargin: -expectedMargin,
      opponentStrength: 0.5,
      opponentId: body.homeTeamId,
      gameNumber: body.gameNumber,
      winProbabilityPre: 1 - winProbPre,
      isPlayoff: body.isPlayoff ?? false,
      isRivalry: body.isRivalry ?? false,
    }
  );

  return {
    success: true,
    data: {
      message: 'Team states updated successfully',
      gameId: body.gameId,
    },
  };
}

async function handleTeamState(
  ctx: RequestContext,
  teamId: string
): Promise<ApiResponse> {
  const { env, url } = ctx;

  const sport = url.searchParams.get('sport') as SupportedSport ?? 'cfb';
  const season = parseInt(url.searchParams.get('season') ?? '2025');

  const engine = new BsiPredictionEngine(env);
  const state = await engine.getTeamState(teamId, sport, season);

  if (!state) {
    return {
      success: false,
      error: {
        code: 'STATE_NOT_FOUND',
        message: `No state found for team ${teamId}`,
      },
    };
  }

  return {
    success: true,
    data: state,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract and validate subscription tier from authenticated request
 *
 * Uses proper JWT/API key validation instead of spoofable string matching.
 * Maps authenticated user roles to subscription tiers:
 * - ADMIN, ANALYST → enterprise
 * - USER, API → pro
 * - READONLY or unauthenticated → free
 */
async function extractAndValidateTier(
  request: Request,
  env: CloudflareEnv
): Promise<SubscriptionTier> {
  const authHeader = request.headers.get('Authorization');

  // No auth header = free tier (anonymous access)
  if (!authHeader) {
    return 'free';
  }

  try {
    // Initialize auth middleware and validate token
    const auth = new AuthMiddleware(env);
    await auth.init();
    const result = await auth.authenticate(request);

    // Authentication failed = free tier
    if (!result.authenticated || !result.user) {
      return 'free';
    }

    // Map user role to subscription tier
    const user = result.user;
    const role = user.role;

    // Admin and Analyst roles get enterprise access
    if (role === 'admin' || role === 'analyst') {
      return 'enterprise';
    }

    // Standard user and API roles get pro access
    if (role === 'user' || role === 'api') {
      return 'pro';
    }

    // Readonly and any other role = free tier
    return 'free';
  } catch (error) {
    // Auth errors default to free tier (fail-safe)
    console.error('Auth validation error:', error);
    return 'free';
  }
}

async function fetchTeamState(
  env: CloudflareEnv,
  teamId: string,
  sport: SupportedSport
): Promise<TeamState | null> {
  if (!teamId) return null;

  // Try to fetch from D1
  const query = `
    SELECT * FROM team_psychological_state
    WHERE team_id = ? AND sport = ?
    ORDER BY game_number DESC
    LIMIT 1
  `;

  const result = await env.BSI_HISTORICAL_DB.prepare(query)
    .bind(teamId, sport)
    .first();

  if (result) {
    return {
      teamId: result.team_id as string,
      teamName: teamId, // Would need lookup
      sport: result.sport as SupportedSport,
      season: result.season as number,
      gameNumber: result.game_number as number,
      confidence: result.confidence as number,
      focus: result.focus as number,
      cohesion: result.cohesion as number,
      leadershipInfluence: result.leadership_influence as number,
      rating: 1500, // Default Elo
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pythagoreanExpectation: 0.5,
      recentForm: [],
      streakType: null,
      streakLength: 0,
      injuryImpact: 1,
      fatigueIndex: 1,
      strengthOfSchedule: 0.5,
      updatedAt: result.updated_at as string,
      modelVersion: result.model_version as string,
    };
  }

  // Return default state
  return {
    teamId,
    teamName: teamId,
    sport,
    season: 2025,
    gameNumber: 0,
    confidence: 0.5,
    focus: 0.5,
    cohesion: 0.5,
    leadershipInfluence: 0.5,
    rating: 1500,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pythagoreanExpectation: 0.5,
    recentForm: [],
    streakType: null,
    streakLength: 0,
    injuryImpact: 1,
    fatigueIndex: 1,
    strengthOfSchedule: 0.5,
    updatedAt: new Date().toISOString(),
    modelVersion: '1.0.0',
  };
}
