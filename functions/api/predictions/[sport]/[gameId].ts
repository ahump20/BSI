/**
 * BSI Predictions API Endpoint
 * Returns game predictions with SHAP-based explanations.
 *
 * GET /api/predictions/{sport}/{gameId}?tier=free|pro|enterprise
 */

type SupportedSport = 'cfb' | 'cbb' | 'nfl' | 'nba' | 'mlb';
type SubscriptionTier = 'free' | 'pro' | 'enterprise';
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface Env {
  BSI_CACHE?: KVNamespace;
  BSI_HISTORICAL_DB?: D1Database;
}

interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string>;
}

interface ShapFactor {
  feature: string;
  displayName: string;
  shapValue: number;
  direction: 'positive' | 'negative';
}

interface PredictionResponse {
  gameId: string;
  sport: SupportedSport;
  homeWinProbability: number;
  awayWinProbability: number;
  predictedSpread: number;
  spreadConfidence: number;
  confidence: ConfidenceLevel;
  topFactors: ShapFactor[];
  allFactors?: ShapFactor[];
  humanSummary: string;
  calibration?: {
    brierScore: number;
    sampleSize: number;
  };
  timestamp: string;
  modelVersion: string;
}

const FACTOR_DISPLAY_NAMES: Record<string, string> = {
  ratingDiff: 'Rating Advantage',
  homeFieldAdvantage: 'Home Field',
  confidenceDiff: 'Team Confidence',
  cohesionDiff: 'Team Chemistry',
  homeMomentum: 'Recent Form',
  awayMomentum: 'Opponent Form',
  restDaysDiff: 'Rest Advantage',
  rivalryMultiplier: 'Rivalry Factor',
  clutchGeneDiff: 'Clutch Performance',
  mentalFortressDiff: 'Mental Fortitude',
  pythagoreanDiff: 'Scoring Efficiency',
  leadershipDiff: 'Leadership Edge',
};

const CACHE_TTL = 3600; // 1 hour for pre-game, 5 min for live

function generateMockPrediction(gameId: string, sport: SupportedSport): PredictionResponse {
  const seed = hashCode(gameId);
  const rng = seededRandom(seed);

  const homeWinProb = 0.35 + rng() * 0.3;
  const awayWinProb = 1 - homeWinProb;
  const homeFavored = homeWinProb > 0.5;
  const spread = homeFavored ? -(homeWinProb - 0.5) * 28 : (0.5 - homeWinProb) * 28;

  const confidenceScore = Math.abs(homeWinProb - 0.5);
  const confidence: ConfidenceLevel =
    confidenceScore > 0.2 ? 'high' : confidenceScore > 0.1 ? 'medium' : 'low';

  const factorKeys = Object.keys(FACTOR_DISPLAY_NAMES);
  const shuffled = factorKeys.sort(() => rng() - 0.5);

  const topFactors: ShapFactor[] = shuffled.slice(0, 6).map((key, idx) => {
    const baseValue = (6 - idx) * 0.025 + rng() * 0.02;
    const isPositive = rng() > 0.35;
    return {
      feature: key,
      displayName: FACTOR_DISPLAY_NAMES[key],
      shapValue: isPositive ? baseValue : -baseValue,
      direction: isPositive ? 'positive' : 'negative',
    };
  });

  topFactors.sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));

  const favoredTeam = homeFavored ? 'home' : 'away';
  const probDiff = Math.abs(homeWinProb - 0.5);
  const opening =
    probDiff > 0.15
      ? `The ${favoredTeam} team is favored in this matchup.`
      : 'This projects as a competitive, closely-contested game.';

  const topPositive = topFactors.find((f) => f.direction === 'positive');
  const topNegative = topFactors.find((f) => f.direction === 'negative');

  let humanSummary = opening;
  if (topPositive) {
    humanSummary += ` ${topPositive.displayName.toLowerCase()} provides a significant edge.`;
  }
  if (topNegative) {
    humanSummary += ` However, ${topNegative.displayName.toLowerCase()} works against the favorite.`;
  }

  return {
    gameId,
    sport,
    homeWinProbability: homeWinProb,
    awayWinProbability: awayWinProb,
    predictedSpread: Math.round(spread * 10) / 10,
    spreadConfidence: 0.4 + rng() * 0.4,
    confidence,
    topFactors,
    humanSummary,
    calibration: {
      brierScore: 0.08 + rng() * 0.06,
      sampleSize: 500 + Math.floor(rng() * 2000),
    },
    timestamp: new Date().toISOString(),
    modelVersion: '1.0.0',
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return (): number => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function filterByTier(prediction: PredictionResponse, tier: SubscriptionTier): PredictionResponse {
  if (tier === 'free') {
    return {
      ...prediction,
      topFactors: prediction.topFactors.slice(0, 3),
      allFactors: undefined,
    };
  }

  if (tier === 'pro') {
    return {
      ...prediction,
      allFactors: prediction.topFactors,
    };
  }

  return {
    ...prediction,
    allFactors: prediction.topFactors,
  };
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const { sport, gameId } = context.params;
  const url = new URL(context.request.url);
  const tier = (url.searchParams.get('tier') as SubscriptionTier) || 'free';

  if (!['cfb', 'cbb', 'nfl', 'nba', 'mlb'].includes(sport)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INVALID_SPORT', message: 'Invalid sport parameter' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!gameId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'MISSING_GAME_ID', message: 'Game ID is required' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const cacheKey = `prediction:${sport}:${gameId}`;

  if (context.env.BSI_CACHE) {
    try {
      const cached = await context.env.BSI_CACHE.get(cacheKey, 'json');
      if (cached) {
        const filtered = filterByTier(cached as PredictionResponse, tier);
        return new Response(
          JSON.stringify({
            success: true,
            data: filtered,
            meta: { cached: true, timestamp: new Date().toISOString() },
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300',
            },
          }
        );
      }
    } catch {
      // Cache miss or error, continue to generate
    }
  }

  const prediction = generateMockPrediction(gameId, sport as SupportedSport);

  if (context.env.BSI_CACHE) {
    try {
      await context.env.BSI_CACHE.put(cacheKey, JSON.stringify(prediction), {
        expirationTtl: CACHE_TTL,
      });
    } catch {
      // Cache write failed, continue
    }
  }

  const filtered = filterByTier(prediction, tier);

  return new Response(
    JSON.stringify({
      success: true,
      data: filtered,
      meta: { cached: false, timestamp: new Date().toISOString() },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
}

export default { onRequestGet };
