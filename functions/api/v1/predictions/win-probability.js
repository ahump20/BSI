/**
 * Blaze Sports Intel - Win Probability API
 *
 * Provides real-time win probability calculations and trends
 * for live and historical games.
 *
 * Endpoints:
 * - GET /api/v1/predictions/win-probability?gameId=123&sport=NFL
 * - GET /api/v1/predictions/win-probability/trend?gameId=123
 */

import { calculateWinProbability, calculateWinProbabilityTrend } from '../../../../lib/ml/win-probability-model.js';

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
  const gameId = url.searchParams.get('gameId');
  const sport = url.searchParams.get('sport') || 'NFL';
  const mode = url.searchParams.get('mode') || 'current'; // 'current' or 'trend'

  try {
    let result;

    if (mode === 'trend' && gameId) {
      // Get win probability trend over game
      result = await calculateWinProbabilityTrend(gameId, env);
    } else if (gameId) {
      // Get current win probability from live game state
      const gameState = await fetchGameState(env, gameId, sport);
      result = await calculateWinProbability(gameState, env);
    } else {
      // Demo data
      result = generateDemoWinProbability(sport);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30, s-maxage=60' // Short cache for live data
      }
    });

  } catch (error) {
    console.error('Win probability API error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to calculate win probability',
      message: error.message
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
 * Fetch current game state from database
 */
async function fetchGameState(env, gameId, sport) {
  try {
    // Query current game state from D1 database
    const game = await env.DB.prepare(`
      SELECT
        game_id,
        sport,
        home_team_id,
        away_team_id,
        period,
        time_remaining,
        home_score,
        away_score,
        possession_team,
        down,
        distance,
        yard_line,
        inning,
        is_top_half,
        outs,
        runners_on,
        quarter,
        status
      FROM historical_games
      WHERE game_id = ? AND sport = ?
    `).bind(gameId, sport).first();

    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    // Map database fields to game state format
    const gameState = {
      sport: game.sport,
      homeTeam: game.home_team_id,
      awayTeam: game.away_team_id,
      homeScore: game.home_score || 0,
      awayScore: game.away_score || 0,
      status: game.status
    };

    // Sport-specific fields
    switch (sport.toUpperCase()) {
      case 'NFL':
      case 'NCAA_FOOTBALL':
        gameState.quarter = game.quarter || game.period || 1;
        gameState.timeRemaining = game.time_remaining || 900;
        gameState.possession = game.possession_team;
        gameState.down = game.down;
        gameState.distance = game.distance;
        gameState.yardLine = game.yard_line;
        break;

      case 'MLB':
      case 'NCAA_BASEBALL':
        gameState.inning = game.inning || game.period || 1;
        gameState.isTopHalf = game.is_top_half !== undefined ? game.is_top_half : true;
        gameState.outs = game.outs || 0;
        gameState.runnersOn = game.runners_on ? JSON.parse(game.runners_on) : [];
        break;

      case 'NBA':
      case 'NCAA_BASKETBALL':
        gameState.quarter = game.quarter || game.period || 1;
        gameState.timeRemaining = game.time_remaining || 600;
        gameState.possession = game.possession_team;
        break;
    }

    return gameState;

  } catch (error) {
    console.error('Error fetching game state:', error);
    throw error;
  }
}

/**
 * Generate demo win probability data
 */
function generateDemoWinProbability(sport) {
  const demoGameState = {
    'NFL': {
      sport: 'NFL',
      homeTeam: 'KC',
      awayTeam: 'BUF',
      quarter: 4,
      timeRemaining: 180, // 3:00 left
      homeScore: 24,
      awayScore: 21,
      possession: 'home',
      down: 1,
      distance: 10,
      yardLine: 45
    },
    'MLB': {
      sport: 'MLB',
      homeTeam: 'STL',
      awayTeam: 'CHC',
      inning: 9,
      isTopHalf: false,
      homeScore: 4,
      awayScore: 3,
      outs: 2,
      runnersOn: ['2B']
    },
    'NBA': {
      sport: 'NBA',
      homeTeam: 'LAL',
      awayTeam: 'GSW',
      quarter: 4,
      timeRemaining: 120, // 2:00 left
      homeScore: 108,
      awayScore: 105,
      possession: 'away'
    }
  };

  const gameState = demoGameState[sport] || demoGameState['NFL'];

  // Return realistic demo probabilities
  return {
    sport: gameState.sport,
    homeTeam: gameState.homeTeam,
    awayTeam: gameState.awayTeam,
    homeWinProbability: 0.72,
    awayWinProbability: 0.28,
    confidence: {
      level: 'high',
      interval: {
        lower: 0.65,
        upper: 0.79
      },
      standardError: 0.07
    },
    factors: {
      scoreDifferential: {
        value: gameState.homeScore - gameState.awayScore,
        impact: 0.18,
        description: `${gameState.homeScore - gameState.awayScore} point lead`
      },
      timeRemaining: {
        value: gameState.timeRemaining || (gameState.inning ? 9 - gameState.inning : 180),
        impact: -0.05,
        description: sport === 'MLB' ? `Bottom ${gameState.inning}` : `${Math.floor(gameState.timeRemaining / 60)}:${String(gameState.timeRemaining % 60).padStart(2, '0')} remaining`
      },
      possession: {
        value: gameState.possession === 'home' ? 1 : -1,
        impact: 0.03,
        description: `${gameState.possession} possession`
      },
      teamStrength: {
        homePower: 0.62,
        awayPower: 0.58,
        impact: 0.06
      }
    },
    keyMoments: [
      {
        type: 'critical_period',
        description: 'Final minutes - every play critical',
        winProbSwing: 'high',
        currentProb: 0.72
      }
    ],
    disclaimer: 'Demo data for testing purposes',
    lastUpdated: new Date().toISOString(),
    timezone: 'America/Chicago'
  };
}
