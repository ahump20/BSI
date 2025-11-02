/**
 * Blaze Sports Intel - Betting Lines API
 *
 * Analyzes betting lines for value opportunities
 * using model predictions vs market odds.
 *
 * Endpoints:
 * - GET /api/v1/predictions/betting-lines?gameId=123&sport=NFL
 * - GET /api/v1/predictions/betting-lines/movement?gameId=123
 * - GET /api/v1/predictions/betting-lines/clv?gameId=123&betType=moneyline&side=home&odds=-150
 *
 * DISCLAIMER: For educational and analytical purposes only.
 */

import { analyzeBettingLines, trackLineMovement, calculateClosingLineValue } from '../../../../lib/ml/betting-line-analyzer.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'analysis'; // 'analysis', 'movement', 'clv'
  const gameId = url.searchParams.get('gameId');
  const sport = url.searchParams.get('sport') || 'NFL';

  try {
    let result;

    switch (mode) {
      case 'movement':
        // Get line movement history
        if (!gameId) {
          throw new Error('gameId required for line movement tracking');
        }
        result = await trackLineMovement(gameId, env);
        break;

      case 'clv':
        // Calculate closing line value
        if (!gameId) {
          throw new Error('gameId required for CLV calculation');
        }
        const betDetails = {
          betType: url.searchParams.get('betType') || 'moneyline',
          side: url.searchParams.get('side') || 'home',
          odds: parseInt(url.searchParams.get('odds') || '-110')
        };
        result = await calculateClosingLineValue(gameId, betDetails, env);
        break;

      case 'analysis':
      default:
        // Analyze current betting lines
        if (gameId) {
          const gameState = await fetchGameState(env, gameId, sport);
          const bettingLines = await fetchBettingLines(env, gameId);
          result = await analyzeBettingLines(gameState, bettingLines, env);
        } else {
          result = generateDemoLineAnalysis(sport);
        }
        break;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-maxage=120' // 1-2 min cache for betting lines
      }
    });

  } catch (error) {
    console.error('Betting lines API error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to analyze betting lines',
      message: error.message,
      disclaimer: 'For educational and analytical purposes only. Not financial advice.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Fetch game state
 */
async function fetchGameState(env, gameId, sport) {
  try {
    const game = await env.DB.prepare(`
      SELECT
        game_id, sport, home_team_id, away_team_id,
        period, time_remaining, home_score, away_score,
        possession_team, down, distance, yard_line,
        inning, is_top_half, outs, runners_on,
        quarter, status
      FROM historical_games
      WHERE game_id = ? AND sport = ?
    `).bind(gameId, sport).first();

    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    return {
      sport: game.sport,
      homeTeam: game.home_team_id,
      awayTeam: game.away_team_id,
      period: game.period || game.quarter || game.inning || 1,
      timeRemaining: game.time_remaining,
      homeScore: game.home_score || 0,
      awayScore: game.away_score || 0,
      possession: game.possession_team,
      down: game.down,
      distance: game.distance,
      yardLine: game.yard_line,
      inning: game.inning,
      isTopHalf: game.is_top_half,
      outs: game.outs,
      runnersOn: game.runners_on ? JSON.parse(game.runners_on) : [],
      quarter: game.quarter,
      status: game.status
    };

  } catch (error) {
    console.error('Error fetching game state:', error);
    throw error;
  }
}

/**
 * Fetch betting lines from KV storage
 */
async function fetchBettingLines(env, gameId) {
  try {
    const linesKey = `lines:${gameId}`;
    const lines = await env.SPORTS_DATA_KV.get(linesKey, 'json');

    if (!lines) {
      // Return default lines structure if not found
      return {
        moneyline: { home: -150, away: 130 },
        spread: { line: -3.5, homeOdds: -110, awayOdds: -110 },
        total: { line: 47.5, overOdds: -110, underOdds: -110 }
      };
    }

    // Return most recent lines
    return {
      moneyline: lines.moneyline[lines.moneyline.length - 1],
      spread: lines.spread[lines.spread.length - 1],
      total: lines.total[lines.total.length - 1]
    };

  } catch (error) {
    console.error('Error fetching betting lines:', error);
    // Return default lines on error
    return {
      moneyline: { home: -150, away: 130 },
      spread: { line: -3.5, homeOdds: -110, awayOdds: -110 },
      total: { line: 47.5, overOdds: -110, underOdds: -110 }
    };
  }
}

/**
 * Generate demo line analysis
 */
function generateDemoLineAnalysis(sport) {
  return {
    sport: sport,
    homeTeam: 'KC',
    awayTeam: 'BUF',
    modelProbability: {
      home: 0.58,
      away: 0.42,
      confidence: 'medium'
    },
    marketLines: {
      moneyline: { home: -150, away: 130 },
      spread: { line: -3.5, homeOdds: -110, awayOdds: -110 },
      total: { line: 47.5, overOdds: -110, underOdds: -110 }
    },
    analysis: {
      moneyline: {
        available: true,
        type: 'moneyline',
        vig: 2.38,
        home: {
          odds: -150,
          impliedProbability: 0.60,
          fairProbability: 0.59,
          modelProbability: 0.58,
          edge: -0.01,
          hasValue: false,
          kellyCriterion: 0,
          recommendation: 'pass'
        },
        away: {
          odds: 130,
          impliedProbability: 0.43,
          fairProbability: 0.41,
          modelProbability: 0.42,
          edge: 0.01,
          hasValue: false,
          kellyCriterion: 0,
          recommendation: 'pass'
        },
        bestSide: 'away',
        maxEdge: 0.01
      },
      spread: {
        available: true,
        type: 'spread',
        line: -3.5,
        home: {
          line: -3.5,
          odds: -110,
          impliedProbability: 0.52,
          modelProbability: 0.56,
          edge: 0.04,
          hasValue: false,
          recommendation: 'pass'
        },
        away: {
          line: 3.5,
          odds: -110,
          impliedProbability: 0.52,
          modelProbability: 0.44,
          edge: -0.08,
          hasValue: false,
          recommendation: 'pass'
        },
        bestSide: 'home',
        maxEdge: 0.04
      },
      total: {
        available: true,
        type: 'total',
        line: 47.5,
        projectedTotal: 49.2,
        over: {
          line: 47.5,
          odds: -110,
          impliedProbability: 0.52,
          edge: 1.7,
          hasValue: false,
          recommendation: 'pass'
        },
        under: {
          line: 47.5,
          odds: -110,
          impliedProbability: 0.52,
          edge: -1.7,
          hasValue: false,
          recommendation: 'pass'
        },
        bestSide: 'over',
        maxEdge: 1.7
      }
    },
    bestOpportunity: {
      found: false,
      message: 'No value opportunities identified'
    },
    disclaimer: 'For educational and analytical purposes only. Not financial advice. Demo data.',
    lastUpdated: new Date().toISOString(),
    timezone: 'America/Chicago'
  };
}
