/**
 * Blaze Sports Intel - Umpire Scorecard API
 *
 * Provides comprehensive umpire performance analysis for baseball games,
 * including strike zone accuracy, bias detection, consistency metrics,
 * and career-level aggregations.
 *
 * Endpoints:
 * - GET /api/v1/umpire/scorecard?gameId=123&sport=MLB
 * - GET /api/v1/umpire/scorecard?umpire=Joe+West&sport=MLB&season=2025
 */

import { generateGameScorecard, generateCareerScorecard } from '../../../../lib/umpire/scorecard-generator';
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
  const gameId = url.searchParams.get('gameId');
  const umpire = url.searchParams.get('umpire');
  const sport = url.searchParams.get('sport') || 'MLB';
  const season = url.searchParams.get('season') || new Date().getFullYear().toString();

  // Only support baseball sports
  if (sport !== 'MLB' && sport !== 'NCAA_BASEBALL') {
    return new Response(JSON.stringify({
      error: 'Umpire scorecards are only available for baseball sports',
      supported_sports: ['MLB', 'NCAA_BASEBALL']
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    let scorecard;

    // Game-level scorecard
    if (gameId) {
      scorecard = await generateGameScorecard(env, gameId, sport);
    }
    // Career-level scorecard
    else if (umpire) {
      scorecard = await generateCareerScorecard(env, umpire, sport, parseInt(season));
    }
    // Default: demo data
    else {
      scorecard = generateDemoScorecard(sport);
    }

    return new Response(JSON.stringify(scorecard), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, s-maxage=600'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to generate umpire scorecard',
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
 * Generate demo umpire scorecard for testing
 */
function generateDemoScorecard(sport) {
  return {
    sport,
    type: 'demo',
    game_id: 'demo_game',
    umpire: {
      name: 'Demo Umpire',
      id: 'demo_001',
      position: 'home_plate'
    },
    summary: {
      total_pitches: 287,
      called_strikes: 94,
      called_balls: 193,
      accuracy: 91.3,
      favor_home: 2.4,
      favor_away: -2.4,
      consistency_score: 88
    },
    calls: {
      total_calls: 287,
      called_strikes: 94,
      called_balls: 193,
      correct_calls: 262,
      missed_strikes: 12,
      missed_balls: 13,
      accuracy: 91.3
    },
    zones: {
      zones: {
        high_inside: {
          total_pitches: 18,
          called_strikes: 14,
          expected_strikes: 13.5,
          strike_rate: 77.8,
          deviation: 2.8
        },
        high_middle: {
          total_pitches: 22,
          called_strikes: 19,
          expected_strikes: 18.7,
          strike_rate: 86.4,
          deviation: 1.4
        },
        high_outside: {
          total_pitches: 20,
          called_strikes: 15,
          expected_strikes: 15.0,
          strike_rate: 75.0,
          deviation: 0.0
        },
        middle_inside: {
          total_pitches: 32,
          called_strikes: 28,
          expected_strikes: 27.2,
          strike_rate: 87.5,
          deviation: 2.5
        },
        middle_middle: {
          total_pitches: 45,
          called_strikes: 43,
          expected_strikes: 42.8,
          strike_rate: 95.6,
          deviation: 0.4
        },
        middle_outside: {
          total_pitches: 35,
          called_strikes: 30,
          expected_strikes: 29.8,
          strike_rate: 85.7,
          deviation: 0.6
        },
        low_inside: {
          total_pitches: 28,
          called_strikes: 20,
          expected_strikes: 21.0,
          strike_rate: 71.4,
          deviation: -3.6
        },
        low_middle: {
          total_pitches: 40,
          called_strikes: 35,
          expected_strikes: 34.0,
          strike_rate: 87.5,
          deviation: 2.5
        },
        low_outside: {
          total_pitches: 30,
          called_strikes: 22,
          expected_strikes: 22.5,
          strike_rate: 73.3,
          deviation: -1.7
        }
      },
      favorable_zones: [
        {
          zone: 'high_inside',
          deviation: 2.8,
          direction: 'expanded'
        },
        {
          zone: 'middle_inside',
          deviation: 2.5,
          direction: 'expanded'
        },
        {
          zone: 'low_middle',
          deviation: 2.5,
          direction: 'expanded'
        }
      ],
      unfavorable_zones: [
        {
          zone: 'low_inside',
          deviation: -3.6,
          direction: 'contracted'
        },
        {
          zone: 'low_outside',
          deviation: -1.7,
          direction: 'contracted'
        }
      ],
      chase_zones: {
        chase_high: {
          total_pitches: 12,
          called_strikes: 1,
          strike_rate: 8.3
        },
        chase_low: {
          total_pitches: 15,
          called_strikes: 2,
          strike_rate: 13.3
        },
        chase_inside: {
          total_pitches: 18,
          called_strikes: 3,
          strike_rate: 16.7
        },
        chase_outside: {
          total_pitches: 22,
          called_strikes: 4,
          strike_rate: 18.2
        }
      }
    },
    favor: {
      home_team: 'Demo Home Team',
      away_team: 'Demo Away Team',
      home_favorable_calls: 52,
      away_favorable_calls: 42,
      home_unfavorable_calls: 38,
      away_unfavorable_calls: 48,
      favor_differential: 2.4,
      home_favor_score: 52,
      away_favor_score: 42,
      bias_detected: false,
      neutrality_score: 95.2
    },
    consistency: {
      score: 88,
      variance: 4.2,
      trend: 'consistent',
      by_period: {
        first_third: 89.5,
        second_third: 88.2,
        third_third: 86.8
      },
      by_count: {
        '0-0': 90.5,
        '1-0': 89.2,
        '0-1': 91.0,
        '2-0': 87.5,
        '0-2': 88.8,
        '3-0': 85.0,
        '3-2': 86.5
      }
    },
    high_leverage: {
      total_pitches: 45,
      accuracy: 84.4,
      missed_strikes: 4,
      missed_balls: 3
    },
    game_impact: {
      runs_affected: 1.2,
      win_probability_swing: 3.5,
      critical_missed_calls: 2
    },
    meta: {
      data_source: 'Demo Data',
      last_updated: new Date().toISOString(),
      timezone: 'America/Chicago',
      game_date: new Date().toISOString().split('T')[0],
      venue: 'Demo Stadium'
    }
  };
}
