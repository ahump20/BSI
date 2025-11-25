/**
 * NIL Opportunity Cost API - GET /api/nil/opportunity-cost/:playerId/:teamId
 * Calculate team-specific value and opportunity cost for a player
 *
 * Returns:
 * - Base FMNV (without team context)
 * - Team-specific FMNV (with team context)
 * - Opportunity cost (difference)
 * - Fit analysis factors
 * - Recommendation
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
  stars: number;
  socialFollowers: number;
  engagementRate: number;
  tvGames: number;
}

interface PositionMetrics {
  positionScore: number;
  efficiencyScore: number;
  productionScore: number;
}

interface TeamContext {
  id: string;
  teamName: string;
  conference: string;
  conferenceRank: number;
  teamRanking: number;
  totalRosterValue: number;
  avgPlayerValue: number;
  positionNeeds: Record<string, number>;
}

interface PlayerValuation {
  playerId: string;
  baseValue: number;
  fmnv: number;
  confidence: number;
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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

const CACHE_TTL_SECONDS = 1800; // 30 minutes

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

function calculateFMNV(
  player: Player,
  metrics: PositionMetrics,
  teamContext: Partial<TeamContext>
): PlayerValuation {
  const positionBase = POSITION_BASE_VALUES[player.position] || 500000;
  const starMultiplier = STAR_MULTIPLIERS[player.stars] || 0.5;
  const baseValue = positionBase * starMultiplier;

  // Performance Index
  const performanceIndex =
    0.4 * metrics.positionScore + 0.3 * metrics.efficiencyScore + 0.3 * metrics.productionScore;

  // Exposure Index
  const tvNormalized = Math.min((player.tvGames || 0) / 15, 1);
  const confNormalized = Math.max(0, 1 - ((teamContext.conferenceRank || 10) - 1) / 16);
  const teamNormalized = Math.max(0, 1 - ((teamContext.teamRanking || 50) - 1) / 130);
  const exposureIndex = 0.35 * tvNormalized + 0.25 * confNormalized + 0.4 * teamNormalized;

  // Influence Index
  const followersNormalized =
    player.socialFollowers > 0 ? Math.log10(player.socialFollowers) / 7 : 0;
  const engagementNormalized = Math.min((player.engagementRate || 0) / 10, 1);
  const influenceIndex = 0.5 * followersNormalized + 0.5 * engagementNormalized;

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

  return { playerId: player.id, baseValue, fmnv, confidence: Math.min(confidence, 1) };
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
  const teamId = params.teamId as string;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (!playerId || !teamId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Player ID and Team ID required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }

  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimit = await checkRateLimit(kv, clientIP);

  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, 'Retry-After': '60' },
    });
  }

  const cacheKey = `cache:nil:opportunity:${playerId}:${teamId}`;

  try {
    // Check cache
    const cached = (await kv.get(cacheKey, 'json')) as OpportunityCostResult | null;
    if (cached) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...cached,
            formatted: {
              baseValue: `$${cached.baseValue.toLocaleString()}`,
              teamSpecificValue: `$${cached.teamSpecificValue.toLocaleString()}`,
              opportunityCost: `${cached.opportunityCost >= 0 ? '+' : ''}$${cached.opportunityCost.toLocaleString()}`,
              opportunityCostPercent: `${cached.opportunityCost >= 0 ? '+' : ''}${((cached.opportunityCost / cached.baseValue) * 100).toFixed(1)}%`,
            },
          },
          meta: {
            timestamp: getCurrentTimestamp(),
            timezone: 'America/Chicago',
            cached: true,
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

    // Get team
    const teamContext = await db
      .prepare('SELECT * FROM nil_teams WHERE id = ? OR team_name LIKE ?')
      .bind(teamId, `%${teamId}%`)
      .first<TeamContext>();
    if (!teamContext) {
      return new Response(JSON.stringify({ success: false, error: 'Team not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // Get player metrics
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

    // Calculate base FMNV (without team context)
    const baseValuation = calculateFMNV(player, metrics, {});

    // Calculate team-specific FMNV
    const teamValuation = calculateFMNV(player, metrics, teamContext);

    // Calculate fit factors
    const positionNeedRaw = teamContext.positionNeeds?.[player.position] || 0;
    const positionNeed = Math.min(positionNeedRaw / 5, 1);
    const schemeMatch = 0.7; // Default medium-high
    const conferenceBoost =
      player.conference === teamContext.conference
        ? 0.1
        : (CONFERENCE_MULTIPLIERS[teamContext.conference] || 1.0) >= 1.1
          ? 0.05
          : 0;
    const marketMultiplier = CONFERENCE_MULTIPLIERS[teamContext.conference] || 1.0;

    // Calculate team-specific value
    const teamSpecificValue = Math.round(
      teamValuation.fmnv * (1 + positionNeed * 0.2) * (1 + conferenceBoost)
    );

    const opportunityCost = teamSpecificValue - baseValuation.fmnv;

    // Generate recommendation
    let recommendation: string;
    if (opportunityCost > baseValuation.fmnv * 0.2) {
      recommendation = `Strong fit: ${player.name} would provide exceptional value for ${teamContext.teamName}. Consider prioritizing this acquisition.`;
    } else if (opportunityCost > 0) {
      recommendation = `Good fit: ${player.name} aligns well with ${teamContext.teamName}'s needs and offers above-market value.`;
    } else if (opportunityCost > -baseValuation.fmnv * 0.1) {
      recommendation = `Neutral fit: ${player.name} offers standard value for ${teamContext.teamName}. Proceed if price is competitive.`;
    } else {
      recommendation = `Suboptimal fit: Consider other options for ${teamContext.teamName}'s specific needs. Better value may exist elsewhere.`;
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
        positionNeed,
        schemeMatch,
        conferenceBoost,
        marketMultiplier,
      },
      recommendation,
    };

    // Cache result
    await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL_SECONDS });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...result,
          formatted: {
            baseValue: `$${baseValuation.fmnv.toLocaleString()}`,
            teamSpecificValue: `$${teamSpecificValue.toLocaleString()}`,
            opportunityCost: `${opportunityCost >= 0 ? '+' : ''}$${opportunityCost.toLocaleString()}`,
            opportunityCostPercent: `${opportunityCost >= 0 ? '+' : ''}${((opportunityCost / baseValuation.fmnv) * 100).toFixed(1)}%`,
          },
          fitAnalysisExplained: {
            positionNeed: `Team needs ${positionNeedRaw} more ${player.position}(s) - ${positionNeed >= 0.6 ? 'High' : positionNeed >= 0.3 ? 'Medium' : 'Low'} priority`,
            schemeMatch: `${(schemeMatch * 100).toFixed(0)}% scheme compatibility estimate`,
            conferenceBoost:
              conferenceBoost > 0
                ? `+${(conferenceBoost * 100).toFixed(0)}% conference alignment bonus`
                : 'No conference bonus',
            marketMultiplier: `${teamContext.conference} market factor: ${marketMultiplier}x`,
          },
        },
        meta: {
          timestamp: getCurrentTimestamp(),
          timezone: 'America/Chicago',
          cached: false,
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
    console.error('Opportunity cost error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to calculate opportunity cost',
        meta: { timestamp: getCurrentTimestamp(), timezone: 'America/Chicago', requestId },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
};
