/**
 * Unified Game Intel API
 *
 * Single endpoint returning comprehensive game intelligence:
 * - Prediction for the game
 * - Sentiment for both teams
 * - Relevant insights
 * - Portal moves affecting either team
 *
 * @author Austin Humphrey - Blaze Sports Intel
 */

import type { CloudflareEnv, SupportedSport } from '@/lib/prediction/types';
import type { GameIntelResponse, UnifiedInsight, PortalMove } from '@/lib/types/insight';
import { createPredictionInsight, createSentimentInsight, sortInsights } from '@/lib/types/insight';

interface Env extends CloudflareEnv {
  BSI_HISTORICAL_DB: D1Database;
  BSI_PREDICTION_CACHE: KVNamespace;
  FANBASE_DB?: D1Database;
  BSI_FANBASE_CACHE?: KVNamespace;
}

/**
 * GET /api/v1/intel/[gameId]
 *
 * Query params:
 * - sport: SupportedSport (required)
 * - homeTeamId: string (optional, used for sentiment if provided)
 * - awayTeamId: string (optional, used for sentiment if provided)
 */
export const onRequestGet: PagesFunction<Env, 'gameId'> = async (context) => {
  const { params, request, env } = context;
  const gameId = params.gameId;

  const url = new URL(request.url);
  const sport = url.searchParams.get('sport') as SupportedSport | null;
  const homeTeamId = url.searchParams.get('homeTeamId');
  const awayTeamId = url.searchParams.get('awayTeamId');

  if (!sport) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'MISSING_PARAM', message: 'sport parameter is required' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const startTime = Date.now();

    // Fetch data in parallel
    const [prediction, homeSentiment, awaySentiment, portalMoves] = await Promise.all([
      fetchPrediction(env, gameId),
      homeTeamId ? fetchSentiment(env, homeTeamId) : null,
      awayTeamId ? fetchSentiment(env, awayTeamId) : null,
      homeTeamId && awayTeamId ? fetchPortalMoves(env, homeTeamId, awayTeamId) : [],
    ]);

    // Generate insights
    const insights: UnifiedInsight[] = [];

    // Add prediction insight if we have prediction data
    if (prediction) {
      insights.push(
        createPredictionInsight({
          gameId,
          sport,
          homeTeamName: prediction.homeTeamName || 'Home',
          awayTeamName: prediction.awayTeamName || 'Away',
          homeWinProb: prediction.homeWinProbability,
          topFactor: prediction.topFactors?.[0],
          confidenceLevel: prediction.confidence,
        })
      );
    }

    // Add sentiment insights
    if (homeSentiment && homeTeamId) {
      insights.push(
        createSentimentInsight({
          teamId: homeTeamId,
          teamName: homeSentiment.teamName || 'Home',
          sport,
          sentiment: homeSentiment.overall,
          trend: homeSentiment.trend as 'rising' | 'stable' | 'falling',
          volatility: homeSentiment.volatility,
        })
      );
    }

    if (awaySentiment && awayTeamId) {
      insights.push(
        createSentimentInsight({
          teamId: awayTeamId,
          teamName: awaySentiment.teamName || 'Away',
          sport,
          sentiment: awaySentiment.overall,
          trend: awaySentiment.trend as 'rising' | 'stable' | 'falling',
          volatility: awaySentiment.volatility,
        })
      );
    }

    // Sort insights by priority
    const sortedInsights = sortInsights(insights);

    // Build response
    const response: GameIntelResponse = {
      gameId,
      sport,
      prediction: prediction
        ? {
            homeWinProbability: prediction.homeWinProbability,
            awayWinProbability: prediction.awayWinProbability,
            predictedSpread: prediction.predictedSpread,
            predictedTotal: prediction.predictedTotal,
            confidence: prediction.confidence,
            topFactors: prediction.topFactors || [],
            humanSummary: prediction.humanSummary || '',
          }
        : undefined,
      homeSentiment: homeSentiment
        ? {
            overall: homeSentiment.overall,
            optimism: homeSentiment.optimism,
            trend: homeSentiment.trend as 'rising' | 'stable' | 'falling',
            volatility: homeSentiment.volatility,
          }
        : undefined,
      awaySentiment: awaySentiment
        ? {
            overall: awaySentiment.overall,
            optimism: awaySentiment.optimism,
            trend: awaySentiment.trend as 'rising' | 'stable' | 'falling',
            volatility: awaySentiment.volatility,
          }
        : undefined,
      insights: sortedInsights,
      portalMoves,
      fetchedAt: new Date().toISOString(),
      cacheHit: false,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        meta: {
          processingTimeMs: Date.now() - startTime,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Intel API error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// Data Fetchers
// ============================================================================

interface PredictionData {
  homeWinProbability: number;
  awayWinProbability: number;
  predictedSpread: number;
  predictedTotal: number;
  confidence: 'high' | 'medium' | 'low';
  topFactors?: string[];
  humanSummary?: string;
  homeTeamName?: string;
  awayTeamName?: string;
}

async function fetchPrediction(env: Env, gameId: string): Promise<PredictionData | null> {
  // Check KV cache first
  const cacheKey = `pred:${gameId}`;
  const cached = await env.BSI_PREDICTION_CACHE?.get(cacheKey, 'json');
  if (cached) {
    return cached as PredictionData;
  }

  // Query D1
  if (!env.BSI_HISTORICAL_DB) return null;

  const result = await env.BSI_HISTORICAL_DB.prepare(
    `SELECT home_win_probability, away_win_probability,
              predicted_spread, predicted_total,
              top_factors_json, human_summary
       FROM prediction_forecasts
       WHERE game_id = ?
       ORDER BY forecast_timestamp DESC
       LIMIT 1`
  )
    .bind(gameId)
    .first<{
      home_win_probability: number;
      away_win_probability: number;
      predicted_spread: number;
      predicted_total: number;
      top_factors_json: string | null;
      human_summary: string | null;
    }>();

  if (!result) return null;

  const confidence: 'high' | 'medium' | 'low' =
    result.home_win_probability > 0.7 || result.home_win_probability < 0.3
      ? 'high'
      : result.home_win_probability > 0.6 || result.home_win_probability < 0.4
        ? 'medium'
        : 'low';

  const data: PredictionData = {
    homeWinProbability: result.home_win_probability,
    awayWinProbability: result.away_win_probability,
    predictedSpread: result.predicted_spread,
    predictedTotal: result.predicted_total,
    confidence,
    topFactors: result.top_factors_json
      ? JSON.parse(result.top_factors_json).map((f: { displayName?: string }) => f.displayName || f)
      : undefined,
    humanSummary: result.human_summary ?? undefined,
  };

  // Cache for 1 hour
  await env.BSI_PREDICTION_CACHE?.put(cacheKey, JSON.stringify(data), { expirationTtl: 3600 });

  return data;
}

interface SentimentData {
  overall: number;
  optimism: number;
  trend: string;
  volatility: number;
  teamName?: string;
}

async function fetchSentiment(env: Env, teamId: string): Promise<SentimentData | null> {
  // Check KV cache
  const cacheKey = `sentiment:${teamId}`;
  const cached = await env.BSI_FANBASE_CACHE?.get(cacheKey, 'json');
  if (cached) {
    return cached as SentimentData;
  }

  // Query D1
  if (!env.FANBASE_DB) return null;

  const result = await env.FANBASE_DB.prepare(
    `SELECT short_name, sentiment_overall, sentiment_optimism, sentiment_volatility
       FROM fanbase_profiles
       WHERE id = ?`
  )
    .bind(teamId)
    .first<{
      short_name: string;
      sentiment_overall: number;
      sentiment_optimism: number;
      sentiment_volatility: number;
    }>();

  if (!result) return null;

  // Calculate trend from recent snapshots
  const snapshots = await env.FANBASE_DB.prepare(
    `SELECT sentiment_overall, timestamp
       FROM sentiment_snapshots
       WHERE fanbase_id = ?
       ORDER BY timestamp DESC
       LIMIT 5`
  )
    .bind(teamId)
    .all<{ sentiment_overall: number; timestamp: string }>();

  let trend: 'rising' | 'stable' | 'falling' = 'stable';
  if (snapshots.results && snapshots.results.length >= 2) {
    const delta =
      snapshots.results[0].sentiment_overall -
      snapshots.results[snapshots.results.length - 1].sentiment_overall;
    if (delta > 0.05) trend = 'rising';
    else if (delta < -0.05) trend = 'falling';
  }

  const data: SentimentData = {
    overall: result.sentiment_overall,
    optimism: result.sentiment_optimism,
    trend,
    volatility: result.sentiment_volatility,
    teamName: result.short_name,
  };

  // Cache for 5 minutes
  await env.BSI_FANBASE_CACHE?.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 });

  return data;
}

async function fetchPortalMoves(
  env: Env,
  homeTeamId: string,
  awayTeamId: string
): Promise<PortalMove[]> {
  if (!env.FANBASE_DB) return [];

  // Query recent portal events affecting either team
  const result = await env.FANBASE_DB.prepare(
    `SELECT se.fanbase_id, se.event_type, se.player_name, se.position,
              se.from_school, se.to_school, se.timestamp
       FROM sentiment_events se
       WHERE se.fanbase_id IN (?, ?)
         AND se.event_type IN ('transfer_portal_gain', 'transfer_portal_loss')
         AND se.timestamp > datetime('now', '-30 days')
       ORDER BY se.timestamp DESC
       LIMIT 10`
  )
    .bind(homeTeamId, awayTeamId)
    .all<{
      fanbase_id: string;
      event_type: string;
      player_name: string;
      position: string;
      from_school: string | null;
      to_school: string | null;
      timestamp: string;
    }>();

  if (!result.results) return [];

  return result.results.map((row) => ({
    playerName: row.player_name,
    position: row.position,
    fromSchool: row.from_school || 'Unknown',
    toSchool: row.to_school,
    moveDate: row.timestamp,
    affectedTeam: row.fanbase_id === homeTeamId ? 'home' : 'away',
    moveType: row.event_type === 'transfer_portal_gain' ? 'gain' : 'loss',
    impactRating: 0.5, // Would calculate based on player rating
  }));
}
