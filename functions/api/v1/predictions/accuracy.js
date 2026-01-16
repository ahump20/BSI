/**
 * Blaze Sports Intel - Prediction Accuracy API
 *
 * Provides endpoints for model performance tracking and analysis.
 *
 * Endpoints:
 * - POST /api/v1/predictions/accuracy/record?gameId=123
 * - POST /api/v1/predictions/accuracy/outcome?gameId=123
 * - GET /api/v1/predictions/accuracy/metrics?sport=NFL
 * - GET /api/v1/predictions/accuracy/calibration?sport=NFL
 * - GET /api/v1/predictions/accuracy/trend?sport=NFL&days=30
 * - GET /api/v1/predictions/accuracy/comparison
 * - GET /api/v1/predictions/accuracy/dashboard?sport=NFL
 */

import {
  recordPrediction,
  updateActualOutcome,
  getAccuracyMetrics,
  analyzeCalibration,
  getAccuracyTrend,
  compareModelPerformance,
  getPerformanceDashboard,
} from '../../../../lib/ml/prediction-accuracy-tracker.js';
import { rateLimit, rateLimitError, corsHeaders } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const url = new URL(request.url);
  const action = url.pathname.split('/').pop(); // 'record', 'outcome', 'metrics', 'calibration', 'trend', 'comparison', 'dashboard'
  const gameId = url.searchParams.get('gameId');
  const sport = url.searchParams.get('sport');

  try {
    let result;

    switch (action) {
      case 'record':
        // Record a prediction before game completes
        if (!gameId) {
          throw new Error('gameId required to record prediction');
        }
        if (request.method !== 'POST') {
          throw new Error('POST method required to record prediction');
        }

        const predictionData = await request.json();
        result = await recordPrediction(gameId, predictionData, env);
        break;

      case 'outcome':
        // Update with actual game outcome
        if (!gameId) {
          throw new Error('gameId required to update outcome');
        }
        if (request.method !== 'POST') {
          throw new Error('POST method required to update outcome');
        }

        const outcomeData = await request.json();
        result = await updateActualOutcome(gameId, outcomeData, env);
        break;

      case 'metrics':
        // Get accuracy metrics
        const filters = {
          sport: sport || null,
          startDate: url.searchParams.get('startDate') || null,
          endDate: url.searchParams.get('endDate') || null,
          confidence: url.searchParams.get('confidence') || null,
        };

        result = await getAccuracyMetrics(env, filters);
        break;

      case 'calibration':
        // Analyze calibration
        result = await analyzeCalibration(env, sport);
        break;

      case 'trend':
        // Get accuracy trend
        const days = parseInt(url.searchParams.get('days') || '30');
        result = await getAccuracyTrend(env, sport, days);
        break;

      case 'comparison':
        // Compare model performance across sports
        result = await compareModelPerformance(env);
        break;

      case 'dashboard':
        // Get complete performance dashboard
        result = await getPerformanceDashboard(env, sport);
        break;

      default:
        throw new Error(
          `Unknown action: ${action}. Valid actions: record, outcome, metrics, calibration, trend, comparison, dashboard`
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control':
          action === 'record' || action === 'outcome'
            ? 'no-cache, no-store, must-revalidate'
            : 'public, max-age=300, s-maxage=600', // 5-10 min cache for analytics
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to process accuracy request',
        message: error.message,
        action,
      }),
      {
        status: error.message.includes('required') ? 400 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Automated prediction recording workflow
 *
 * Add to wrangler.toml for automated tracking:
 *
 * [triggers]
 * crons = ["0 * * * *"]  # Hourly
 *
 * export default {
 *   async scheduled(event, env, ctx) {
 *     // Get all games that recently completed
 *     const completedGames = await getRecentlyCompletedGames(env);
 *
 *     // Update outcomes for predictions
 *     for (const game of completedGames) {
 *       try {
 *         await updateActualOutcome(game.game_id, {
 *           homeScore: game.home_score,
 *           awayScore: game.away_score
 *         }, env);
 *       } catch (error) {
 *         console.error(`Failed to update outcome for game ${game.game_id}:`, error);
 *       }
 *     }
 *   }
 * };
 *
 * async function getRecentlyCompletedGames(env) {
 *   const results = await env.DB.prepare(`
 *     SELECT game_id, home_score, away_score
 *     FROM historical_games
 *     WHERE status = 'final'
 *       AND updated_at >= datetime('now', '-1 hour')
 *   `).all();
 *
 *   return results.results;
 * }
 */

/**
 * Example usage for recording predictions:
 *
 * // When making a prediction
 * const prediction = await calculateWinProbability(gameState, env);
 *
 * // Record it for accuracy tracking
 * await fetch('/api/v1/predictions/accuracy/record?gameId=12345', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     sport: 'NFL',
 *     homeTeam: 'KC',
 *     awayTeam: 'BUF',
 *     homeWinProbability: 0.68,
 *     awayWinProbability: 0.32,
 *     confidence: { level: 'high' },
 *     gameState: { quarter: 4, timeRemaining: 180 }
 *   })
 * });
 *
 * // When game completes
 * await fetch('/api/v1/predictions/accuracy/outcome?gameId=12345', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     homeScore: 28,
 *     awayScore: 24
 *   })
 * });
 */
