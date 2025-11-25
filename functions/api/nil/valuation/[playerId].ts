/**
 * NIL Valuation API - GET /api/nil/valuation/:playerId
 * Full FMNV (Fair Market Name Value) breakdown for a specific player
 *
 * FMNV Formula:
 * - Performance Index = 0.4 * positionScore + 0.3 * efficiencyScore + 0.3 * productionScore
 * - Exposure Index = 0.35 * tvGames + 0.25 * conferenceRank + 0.4 * teamRanking
 * - Influence Index = 0.5 * log(followers) + 0.5 * engagementRate
 * - FMNV = baseValue * (1 + performanceMultiplier) * (1 + exposureMultiplier) * (1 + influenceMultiplier)
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

interface TeamContext {
  teamId: string;
  teamName: string;
  conference: string;
  conferenceRank: number;
  teamRanking: number;
  totalRosterValue: number;
  avgPlayerValue: number;
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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

const CACHE_TTL_SECONDS = 3600; // 1 hour

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

function calculatePerformanceIndex(metrics: PositionMetrics): number {
  return (
    0.4 * metrics.positionScore + 0.3 * metrics.efficiencyScore + 0.3 * metrics.productionScore
  );
}

function calculateExposureIndex(
  tvGames: number,
  conferenceRank: number,
  teamRanking: number
): number {
  const tvNormalized = Math.min(tvGames / 15, 1);
  const confNormalized = Math.max(0, 1 - (conferenceRank - 1) / 16);
  const teamNormalized = Math.max(0, 1 - (teamRanking - 1) / 130);
  return 0.35 * tvNormalized + 0.25 * confNormalized + 0.4 * teamNormalized;
}

function calculateInfluenceIndex(followers: number, engagementRate: number): number {
  const followersNormalized = followers > 0 ? Math.log10(followers) / 7 : 0;
  const engagementNormalized = Math.min(engagementRate / 10, 1);
  return 0.5 * followersNormalized + 0.5 * engagementNormalized;
}

function calculateFMNV(
  player: Player,
  metrics: PositionMetrics,
  teamContext: Partial<TeamContext>
): PlayerValuation {
  const positionBase = POSITION_BASE_VALUES[player.position] || 500000;
  const starMultiplier = STAR_MULTIPLIERS[player.stars] || 0.5;
  const baseValue = positionBase * starMultiplier;

  const performanceIndex = calculatePerformanceIndex(metrics);
  const exposureIndex = calculateExposureIndex(
    player.tvGames || 0,
    teamContext.conferenceRank || 10,
    teamContext.teamRanking || 50
  );
  const influenceIndex = calculateInfluenceIndex(
    player.socialFollowers || 0,
    player.engagementRate || 0
  );

  const performanceMultiplier = performanceIndex * 0.5;
  const exposureMultiplier = exposureIndex * 0.5;
  const influenceMultiplier = influenceIndex * 0.5;
  const conferenceMultiplier = CONFERENCE_MULTIPLIERS[player.conference] || 1.0;

  const fmnv = Math.round(
    baseValue *
      (1 + performanceMultiplier) *
      (1 + exposureMultiplier) *
      (1 + influenceMultiplier) *
      conferenceMultiplier
  );

  let confidence = 0.5;
  if (player.socialFollowers > 0) confidence += 0.15;
  if (player.tvGames > 0) confidence += 0.15;
  if (metrics.productionScore > 0) confidence += 0.2;

  const now = new Date();
  const validUntil = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000);

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

async function checkRateLimit(kv: KVNamespace, clientIP: string): Promise<{ allowed: boolean }> {
  const key = `rate_limit:nil:${clientIP}`;
  const now = Date.now();

  try {
    const stored = (await kv.get(key, 'json')) as { requests: number[] } | null;
    let requests = stored?.requests || [];
    requests = requests.filter((ts: number) => ts > now - 60000);

    if (requests.length >= 100) return { allowed: false };

    requests.push(now);
    await kv.put(key, JSON.stringify({ requests }), { expirationTtl: 120 });
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const requestId = generateRequestId();
  const kv = env.NIL_CACHE || env.KV;
  const db = env.NIL_DB || env.DB;
  const playerId = params.playerId as string;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (!playerId) {
    return new Response(JSON.stringify({ success: false, error: 'Player ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimit = await checkRateLimit(kv, clientIP);

  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, 'Retry-After': '60' },
    });
  }

  const cacheKey = `cache:nil:valuation:${playerId}`;

  try {
    // Check cache
    const cached = (await kv.get(cacheKey, 'json')) as {
      player: Player;
      valuation: PlayerValuation;
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
            cacheExpiry: cached.valuation.validUntil,
            source: 'BlazeSportsIntel NIL API',
            requestId,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, 'X-Cache': 'HIT' },
        }
      );
    }

    // Get player
    const player = await db
      .prepare('SELECT * FROM nil_players WHERE id = ?')
      .bind(playerId)
      .first<Player>();
    if (!player) {
      return new Response(JSON.stringify({ success: false, error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // Get metrics
    const metricsResult = await db
      .prepare(
        'SELECT position_score, efficiency_score, production_score FROM nil_player_metrics WHERE player_id = ?'
      )
      .bind(playerId)
      .first<{ position_score: number; efficiency_score: number; production_score: number }>();

    const metrics: PositionMetrics = {
      positionScore: metricsResult?.position_score || 0.5,
      efficiencyScore: metricsResult?.efficiency_score || 0.5,
      productionScore: metricsResult?.production_score || 0.5,
    };

    // Get team context
    const teamContext = await db
      .prepare('SELECT * FROM nil_teams WHERE team_name = ?')
      .bind(player.team)
      .first<TeamContext>();

    // Calculate valuation
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
          factors: metrics,
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
          multiplier: CONFERENCE_MULTIPLIERS[player.conference] || 1.0,
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
    await kv.put(cacheKey, JSON.stringify({ player, valuation }), {
      expirationTtl: CACHE_TTL_SECONDS,
    });

    return new Response(
      JSON.stringify({
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
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, 'X-Cache': 'MISS' },
      }
    );
  } catch (error) {
    console.error('Valuation API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to calculate valuation',
        meta: { timestamp: getCurrentTimestamp(), timezone: 'America/Chicago', requestId },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
};
