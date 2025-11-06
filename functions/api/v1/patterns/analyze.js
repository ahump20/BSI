/**
 * Blaze Sports Intel - Pattern Analysis API
 *
 * Provides advanced pattern recognition for coaching decisions,
 * umpire calls, and player performance using statistical analysis,
 * entropy calculations, and domain-specific heuristics.
 *
 * Endpoints:
 * - GET /api/v1/patterns/analyze?type=coaching&teamId=123&sport=NFL
 * - GET /api/v1/patterns/analyze?type=umpire&umpire=Joe+West&sport=MLB
 * - GET /api/v1/patterns/analyze?type=player&playerId=456&sport=MLB
 */

import {
  detectCoachingPatterns,
  detectUmpirePatterns,
  detectPlayerPatterns
} from '../../../../lib/analytics/pattern-recognition';
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
  const type = url.searchParams.get('type') || 'coaching';
  const sport = url.searchParams.get('sport') || 'NFL';
  const season = url.searchParams.get('season') || new Date().getFullYear().toString();
  const teamId = url.searchParams.get('teamId');
  const team = url.searchParams.get('team');
  const umpire = url.searchParams.get('umpire');
  const playerId = url.searchParams.get('playerId');
  const player = url.searchParams.get('player');

  try {
    let patterns;

    switch (type.toLowerCase()) {
      case 'coaching':
        patterns = await analyzeCoachingPatterns(env, teamId || team, sport, parseInt(season));
        break;

      case 'umpire':
        patterns = await analyzeUmpirePatterns(env, umpire, sport, parseInt(season));
        break;

      case 'player':
        patterns = await analyzePlayerPatterns(env, playerId || player, sport, parseInt(season));
        break;

      default:
        return new Response(JSON.stringify({
          error: 'Invalid pattern type',
          supported_types: ['coaching', 'umpire', 'player']
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }

    return new Response(JSON.stringify(patterns), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, s-maxage=600'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to analyze patterns',
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
 * Analyze coaching patterns from decision data
 */
async function analyzeCoachingPatterns(env, identifier, sport, season) {
  // In production, fetch real coaching decision data from D1
  // For now, generate demo data
  const decisions = generateDemoCoachingDecisions();

  const patterns = detectCoachingPatterns(decisions, {
    min_pattern_length: 3,
    min_occurrences: 2,
    confidence_threshold: 0.7
  });

  return {
    type: 'coaching',
    sport: sport,
    season: season,
    team: identifier || 'Demo Team',
    patterns: [
      {
        type: 'sequential',
        description: 'Runs draw play after two incomplete passes (3 times)',
        exploitable: true,
        confidence: 0.85
      },
      {
        type: 'situational',
        description: 'Always punts on 4th and long in opponent territory',
        exploitable: true,
        confidence: 0.92
      },
      {
        type: 'time_dependent',
        description: 'Becomes more conservative in 4th quarter with lead',
        exploitable: false,
        confidence: 0.78
      }
    ],
    sequential: patterns.sequential,
    situational: patterns.situational,
    risk_profile: patterns.risk_profile,
    predictability: patterns.predictability,
    tendencies: patterns.tendencies,
    adaptation: patterns.adaptation,
    exploitable: [
      {
        situation: 'Third and long (7+ yards)',
        type: 'pass',
        action: 'pass',
        percentage: 88,
        predictability: 92,
        sample_size: 25
      },
      {
        situation: 'Red zone first down',
        type: 'run',
        action: 'run',
        percentage: 72,
        predictability: 78,
        sample_size: 18
      },
      {
        situation: 'Two-minute drill',
        type: 'pass',
        action: 'sideline pass',
        percentage: 65,
        predictability: 71,
        sample_size: 12
      }
    ],
    meta: {
      decisions_analyzed: decisions.length,
      data_source: 'Demo Data',
      last_updated: new Date().toISOString(),
      timezone: 'America/Chicago'
    }
  };
}

/**
 * Analyze umpire patterns from scorecard data
 */
async function analyzeUmpirePatterns(env, umpire, sport, season) {
  // In production, fetch real umpire scorecard data from D1
  // For now, generate demo data
  const scorecards = generateDemoUmpireScorecards();

  const patterns = detectUmpirePatterns(scorecards, {
    min_games: 5,
    bias_threshold: 3.0,
    consistency_threshold: 85
  });

  return {
    type: 'umpire',
    sport: sport,
    season: season,
    umpire: umpire || 'Demo Umpire',
    patterns: [
      {
        type: 'zone_expansion',
        description: 'Consistently expands low-outside zone by 3-5%',
        exploitable: true,
        confidence: 0.88
      },
      {
        type: 'bias',
        description: 'Slight home team favor in high-leverage situations',
        exploitable: false,
        confidence: 0.72
      },
      {
        type: 'consistency',
        description: 'Accuracy declines in late innings (85% → 81%)',
        exploitable: true,
        confidence: 0.81
      }
    ],
    bias: patterns.bias,
    zone_preferences: patterns.zone_preferences,
    consistency: patterns.consistency,
    game_flow: patterns.game_flow,
    high_leverage: {
      accuracy: 82.5,
      deviation_from_normal: -5.2,
      pattern: 'contracts_zone'
    },
    exploitable: [
      {
        zone: 'low_outside',
        tendency: 'expanded',
        deviation: 4.5,
        confidence: 0.88
      },
      {
        zone: 'high_inside',
        tendency: 'contracted',
        deviation: -3.2,
        confidence: 0.79
      }
    ],
    meta: {
      games_analyzed: scorecards.length,
      data_source: 'Demo Data',
      last_updated: new Date().toISOString(),
      timezone: 'America/Chicago'
    }
  };
}

/**
 * Analyze player patterns from performance data
 */
async function analyzePlayerPatterns(env, identifier, sport, season) {
  // In production, fetch real player performance data from D1
  // For now, generate demo data
  const performances = generateDemoPlayerPerformances();

  const patterns = detectPlayerPatterns(performances, {
    min_games: 10,
    streak_threshold: 3,
    split_threshold: 0.15
  });

  return {
    type: 'player',
    sport: sport,
    season: season,
    player: identifier || 'Demo Player',
    patterns: [
      {
        type: 'hot_streak',
        description: 'Currently on 7-game hitting streak (.385 avg)',
        exploitable: false,
        confidence: 1.0
      },
      {
        type: 'matchup',
        description: 'Struggles vs left-handed pitchers (.220 avg)',
        exploitable: true,
        confidence: 0.91
      },
      {
        type: 'situational',
        description: 'RISP performance: .312 avg (league avg .267)',
        exploitable: false,
        confidence: 0.85
      }
    ],
    streaks: patterns.streaks,
    situational: patterns.situational,
    matchups: patterns.matchups,
    time_patterns: patterns.time_patterns,
    exploitable: [
      {
        situation: 'vs LHP',
        metric: 'batting_average',
        value: 0.220,
        league_avg: 0.265,
        deviation: -17.0,
        sample_size: 45
      },
      {
        situation: 'night_games',
        metric: 'ops',
        value: 0.685,
        league_avg: 0.750,
        deviation: -8.7,
        sample_size: 38
      }
    ],
    meta: {
      games_analyzed: performances.length,
      data_source: 'Demo Data',
      last_updated: new Date().toISOString(),
      timezone: 'America/Chicago'
    }
  };
}

/**
 * Generate demo coaching decisions for testing
 */
function generateDemoCoachingDecisions() {
  return [
    { decision_type: 'run_play', quarter: 1, down: 1, distance: 10, yard_line: 35 },
    { decision_type: 'pass_play', quarter: 1, down: 2, distance: 8, yard_line: 37 },
    { decision_type: 'pass_play', quarter: 1, down: 3, distance: 6, yard_line: 39 },
    { decision_type: 'punt', quarter: 1, down: 4, distance: 4, yard_line: 41 },
    { decision_type: 'run_play', quarter: 2, down: 1, distance: 10, yard_line: 50 },
    { decision_type: 'run_play', quarter: 2, down: 2, distance: 6, yard_line: 54 },
    { decision_type: 'pass_play', quarter: 2, down: 3, distance: 2, yard_line: 58 },
    { decision_type: 'go_for_it', quarter: 2, down: 4, distance: 1, yard_line: 59 },
    { decision_type: 'run_play', quarter: 3, down: 1, distance: 10, yard_line: 25 },
    { decision_type: 'pass_play', quarter: 3, down: 2, distance: 7, yard_line: 28 },
    { decision_type: 'pass_play', quarter: 3, down: 3, distance: 4, yard_line: 31 },
    { decision_type: 'field_goal', quarter: 3, down: 4, distance: 2, yard_line: 33 },
    { decision_type: 'pass_play', quarter: 4, down: 1, distance: 10, yard_line: 42 },
    { decision_type: 'run_play', quarter: 4, down: 2, distance: 3, yard_line: 49 },
    { decision_type: 'run_play', quarter: 4, down: 3, distance: 1, yard_line: 51 },
    { decision_type: 'punt', quarter: 4, down: 4, distance: 8, yard_line: 44 }
  ];
}

/**
 * Generate demo umpire scorecards for testing
 */
function generateDemoUmpireScorecards() {
  return Array.from({ length: 10 }, (_, i) => ({
    game_id: `demo_game_${i}`,
    summary: {
      accuracy: 88 + Math.random() * 6,
      consistency_score: 85 + Math.random() * 10
    },
    favor: {
      home_favor_score: 50 + Math.random() * 10 - 5,
      away_favor_score: 50 + Math.random() * 10 - 5
    },
    consistency: {
      score: 85 + Math.random() * 10,
      trend: i < 5 ? 'improving' : 'consistent'
    }
  }));
}

/**
 * Generate demo player performances for testing
 */
function generateDemoPlayerPerformances() {
  return Array.from({ length: 30 }, (_, i) => ({
    game_id: `demo_game_${i}`,
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    at_bats: 4,
    hits: Math.floor(Math.random() * 3),
    home_runs: Math.random() > 0.9 ? 1 : 0,
    rbi: Math.floor(Math.random() * 3),
    is_home: Math.random() > 0.5,
    opponent_hand: Math.random() > 0.7 ? 'L' : 'R',
    day_night: Math.random() > 0.6 ? 'night' : 'day'
  }));
}
