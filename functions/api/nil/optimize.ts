/**
 * NIL Roster Optimizer API - POST /api/nil/optimize
 * AI-powered roster optimization based on budget, position needs, and team context
 *
 * Request Body:
 * {
 *   "budget": 5000000,
 *   "positionNeeds": { "QB": 1, "WR": 2, "DB": 1 },
 *   "teamId": "texas",
 *   "minStars": 3,
 *   "maxPlayers": 10,
 *   "conferencePreference": ["SEC", "Big Ten"]
 * }
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

interface OptimizerRequest {
  budget: number;
  positionNeeds: Record<string, number>;
  teamId?: string;
  minStars?: number;
  maxPlayers?: number;
  conferencePreference?: string[];
}

interface PlayerRecommendation {
  player: Player;
  valuation: PlayerValuation;
  fitScore: number;
  priorityReason: string;
  estimatedCost: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

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

  const now = new Date();
  const validUntil = new Date(now.getTime() + 3600000);

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

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const requestId = generateRequestId();
  const kv = env.NIL_CACHE || env.KV;
  const db = env.NIL_DB || env.DB;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
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

  let body: OptimizerRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const {
    budget,
    positionNeeds,
    teamId,
    minStars = 3,
    maxPlayers = 10,
    conferencePreference,
  } = body;

  // Validation
  if (!budget || budget <= 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'Budget must be a positive number' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }

  if (!positionNeeds || Object.keys(positionNeeds).length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'positionNeeds must specify at least one position' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }

  try {
    // Get team context if provided
    let teamContext: TeamContext | null = null;
    if (teamId) {
      teamContext = await db
        .prepare('SELECT * FROM nil_teams WHERE id = ? OR team_name LIKE ?')
        .bind(teamId, `%${teamId}%`)
        .first<TeamContext>();
    }

    const recommendations: PlayerRecommendation[] = [];
    let remainingBudget = budget;

    // Process each position need
    for (const [position, count] of Object.entries(positionNeeds)) {
      if (count <= 0) continue;

      // Build query for this position
      let query = 'SELECT * FROM nil_players WHERE position = ? AND stars >= ?';
      const bindings: unknown[] = [position.toUpperCase(), minStars];

      if (conferencePreference && conferencePreference.length > 0) {
        const placeholders = conferencePreference.map(() => '?').join(', ');
        query += ` AND conference IN (${placeholders})`;
        bindings.push(...conferencePreference);
      }

      query += ' ORDER BY stars DESC LIMIT 20';

      const playersResult = await db
        .prepare(query)
        .bind(...bindings)
        .all<Player>();
      const players = playersResult.results || [];

      // Calculate value and fit for each candidate
      const candidates = await Promise.all(
        players.map(async (player) => {
          // Get metrics
          const metricsResult = await db
            .prepare(
              'SELECT position_score, efficiency_score, production_score FROM nil_player_metrics WHERE player_id = ?'
            )
            .bind(player.id)
            .first<{
              position_score: number;
              efficiency_score: number;
              production_score: number;
            }>();

          const metrics: PositionMetrics = {
            positionScore: metricsResult?.position_score || 0.5,
            efficiencyScore: metricsResult?.efficiency_score || 0.5,
            productionScore: metricsResult?.production_score || 0.5,
          };

          const valuation = calculateFMNV(player, metrics, teamContext || {});

          // Calculate fit score
          let fitScore = 0.5;
          if (conferencePreference?.includes(player.conference)) fitScore += 0.2;
          if (teamContext?.positionNeeds?.[position]) {
            fitScore += 0.3 * Math.min(teamContext.positionNeeds[position] / 5, 1);
          }
          if (player.stars >= 4) fitScore += 0.1;
          fitScore = Math.min(fitScore, 1);

          const estimatedCost = Math.round(valuation.fmnv * 0.8); // 80% of FMNV

          return { player, valuation, fitScore, estimatedCost };
        })
      );

      // Sort by value efficiency
      candidates.sort(
        (a, b) =>
          (b.fitScore * b.valuation.fmnv) / b.estimatedCost -
          (a.fitScore * a.valuation.fmnv) / a.estimatedCost
      );

      // Select best candidates within budget
      let selected = 0;
      for (const candidate of candidates) {
        if (selected >= count) break;
        if (recommendations.length >= maxPlayers) break;
        if (candidate.estimatedCost > remainingBudget) continue;

        recommendations.push({
          player: candidate.player,
          valuation: candidate.valuation,
          fitScore: candidate.fitScore,
          estimatedCost: candidate.estimatedCost,
          priorityReason:
            candidate.fitScore >= 0.7
              ? 'High fit for team needs'
              : candidate.player.stars >= 4
                ? 'Elite talent available'
                : 'Value opportunity',
        });
        remainingBudget -= candidate.estimatedCost;
        selected++;
      }
    }

    // Calculate summary metrics
    const totalCost = budget - remainingBudget;
    const totalValue = recommendations.reduce((sum, r) => sum + r.valuation.fmnv, 0);
    const positionsNeeded = Object.keys(positionNeeds).length;
    const positionsFilled = new Set(recommendations.map((r) => r.player.position)).size;
    const coverageScore = positionsFilled / positionsNeeded;
    const valueScore = totalCost > 0 ? totalValue / totalCost : 0;

    const result = {
      recommendations: recommendations.map((r) => ({
        player: {
          id: r.player.id,
          name: r.player.name,
          position: r.player.position,
          team: r.player.team,
          conference: r.player.conference,
          stars: r.player.stars,
        },
        valuation: {
          fmnv: r.valuation.fmnv,
          fmnvFormatted: `$${r.valuation.fmnv.toLocaleString()}`,
          confidence: r.valuation.confidence,
        },
        fitScore: r.fitScore,
        estimatedCost: r.estimatedCost,
        estimatedCostFormatted: `$${r.estimatedCost.toLocaleString()}`,
        priorityReason: r.priorityReason,
      })),
      summary: {
        playersRecommended: recommendations.length,
        totalInvestment: totalCost,
        totalInvestmentFormatted: `$${totalCost.toLocaleString()}`,
        projectedValue: totalValue,
        projectedValueFormatted: `$${totalValue.toLocaleString()}`,
        budgetRemaining: remainingBudget,
        budgetRemainingFormatted: `$${remainingBudget.toLocaleString()}`,
        budgetUtilization: `${((totalCost / budget) * 100).toFixed(1)}%`,
        coverageScore: `${(coverageScore * 100).toFixed(0)}%`,
        valueMultiple: `${valueScore.toFixed(2)}x`,
      },
      positionBreakdown: Object.entries(positionNeeds).map(([pos, needed]) => ({
        position: pos,
        needed,
        filled: recommendations.filter((r) => r.player.position === pos).length,
        spent: recommendations
          .filter((r) => r.player.position === pos)
          .reduce((sum, r) => sum + r.estimatedCost, 0),
      })),
    };

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
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  } catch (error) {
    console.error('Optimizer error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Optimization failed',
        meta: { timestamp: getCurrentTimestamp(), timezone: 'America/Chicago', requestId },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
};
