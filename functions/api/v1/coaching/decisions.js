/**
 * Blaze Sports Intel - Coaching Decisions API
 *
 * Provides coaching decision analysis with Expected Value calculations,
 * risk profiling, and pattern detection for game-level and season-level data.
 *
 * Endpoints:
 * - GET /api/v1/coaching/decisions?gameId=123&sport=NFL
 * - GET /api/v1/coaching/decisions?teamId=456&sport=NFL&season=2025
 */

import { analyzeGameDecisions, analyzeSeasonDecisions } from '../../../../lib/coaching/decision-analyzer';
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
  const teamId = url.searchParams.get('teamId');
  const team = url.searchParams.get('team');
  const sport = url.searchParams.get('sport') || 'NFL';
  const season = url.searchParams.get('season') || new Date().getFullYear().toString();

  try {
    let analysis;

    // Game-level analysis
    if (gameId) {
      analysis = await analyzeGameDecisions(env, gameId, sport);
    }
    // Season-level analysis
    else if (teamId || team) {
      const identifier = teamId || team;
      analysis = await analyzeSeasonDecisions(env, identifier, sport, parseInt(season));
    }
    // Default: demo data
    else {
      analysis = generateDemoAnalysis(sport);
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to analyze coaching decisions',
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Generate demo coaching analysis for testing
 */
function generateDemoAnalysis(sport) {
  const isFootball = sport === 'NFL' || sport === 'NCAA_FOOTBALL';

  return {
    sport: sport,
    type: 'demo',
    summary: {
      total_decisions: 24,
      optimal_decisions: 16,
      suboptimal_decisions: 8,
      decision_quality_score: 67
    },
    decisions: {
      fourth_down: isFootball ? generateDemoFourthDown() : [],
      two_point: isFootball ? generateDemoTwoPoint() : [],
      timeout: generateDemoTimeouts(),
      play_calling: generateDemoPlayCalling()
    },
    risk_profile: {
      profile: 'balanced',
      risk_score: 55,
      aggressive_decisions: 8,
      conservative_decisions: 10,
      balanced_decisions: 6,
      risk_distribution: {
        high_risk: 33,
        medium_risk: 42,
        low_risk: 25
      }
    },
    predictability: {
      score: 62,
      entropy: 68,
      assessment: 'moderately_predictable',
      confidence: 'medium',
      most_common_decision: 'run_play'
    },
    situational: {
      red_zone: {
        attempts: 12,
        success_rate: 58,
        optimal_rate: 67
      },
      two_minute: {
        attempts: 8,
        success_rate: 75,
        optimal_rate: 88
      },
      fourth_quarter: {
        attempts: 15,
        success_rate: 67,
        optimal_rate: 73
      }
    },
    meta: {
      data_source: 'Demo Data',
      last_updated: new Date().toISOString(),
      timezone: 'America/Chicago'
    }
  };
}

function generateDemoFourthDown() {
  return [
    {
      quarter: 2,
      time_remaining: 185,
      yard_line: 42,
      distance: 3,
      score_differential: -7,
      actual_decision: 'punt',
      recommended_decision: 'go_for_it',
      expected_value: {
        go_for_it: 1.8,
        field_goal: -0.5,
        punt: 0.3
      },
      is_optimal: false,
      confidence: 'high',
      reasoning: 'Expected value favors going for it with 50% conversion probability'
    },
    {
      quarter: 4,
      time_remaining: 420,
      yard_line: 28,
      distance: 1,
      score_differential: 3,
      actual_decision: 'go_for_it',
      recommended_decision: 'go_for_it',
      expected_value: {
        go_for_it: 2.3,
        field_goal: 2.85,
        punt: -1.2
      },
      is_optimal: true,
      confidence: 'high',
      reasoning: 'High conversion probability (65%) justifies aggressive decision'
    },
    {
      quarter: 3,
      time_remaining: 605,
      yard_line: 35,
      distance: 8,
      score_differential: 0,
      actual_decision: 'punt',
      recommended_decision: 'punt',
      expected_value: {
        go_for_it: 0.5,
        field_goal: 1.5,
        punt: 0.8
      },
      is_optimal: true,
      confidence: 'medium',
      reasoning: 'Punt maximizes expected points given field position'
    }
  ];
}

function generateDemoTwoPoint() {
  return [
    {
      quarter: 4,
      time_remaining: 120,
      score_differential: -7,
      actual_decision: 'two_point_attempt',
      recommended_decision: 'two_point_attempt',
      conversion_probability: 0.47,
      is_optimal: true,
      reasoning: 'Down 7 late, need 2-point to tie with potential FG'
    },
    {
      quarter: 2,
      time_remaining: 450,
      score_differential: 6,
      actual_decision: 'extra_point',
      recommended_decision: 'extra_point',
      conversion_probability: 0.94,
      is_optimal: true,
      reasoning: 'Standard situation, take the point'
    }
  ];
}

function generateDemoTimeouts() {
  return [
    {
      quarter: 2,
      time_remaining: 35,
      situation: 'clock_management',
      actual_decision: 'timeout',
      recommended_decision: 'timeout',
      is_optimal: true
    },
    {
      quarter: 4,
      time_remaining: 180,
      situation: 'defensive_adjustment',
      actual_decision: 'timeout',
      recommended_decision: 'save_timeout',
      is_optimal: false
    }
  ];
}

function generateDemoPlayCalling() {
  return {
    total_plays: 68,
    run_plays: 32,
    pass_plays: 36,
    run_pass_ratio: 0.89,
    situational: {
      first_down: { run: 18, pass: 15 },
      second_down: { run: 8, pass: 12 },
      third_down: { run: 3, pass: 12 },
      red_zone: { run: 15, pass: 8 },
      two_minute: { run: 2, pass: 10 }
    },
    tendencies: [
      {
        situation: 'First and 10',
        action: 'run',
        frequency: 0.55,
        predictability: 0.62
      },
      {
        situation: 'Third and long',
        action: 'pass',
        frequency: 0.80,
        predictability: 0.85
      },
      {
        situation: 'Red zone',
        action: 'run',
        frequency: 0.65,
        predictability: 0.71
      }
    ],
    predictability_score: 68
  };
}
