/**
 * Blaze Sports Intel - Coaching Decision Analyzer
 *
 * Analyzes coaching decisions from play-by-play data including:
 * - 4th down decisions (go for it, punt, field goal)
 * - 2-point conversion attempts
 * - Clock management (timeouts, hurry-up)
 * - Challenge decisions
 * - Play calling patterns
 *
 * Provides win probability impact analysis and recommendations
 */

import { retrievePBPData } from '../historical/pbp-storage.js';

/**
 * Analyze all coaching decisions from a game
 *
 * @param {Object} env - Cloudflare environment
 * @param {string} gameId - Game identifier
 * @param {string} sport - Sport type (NFL, NCAA_FOOTBALL)
 * @returns {Promise<Object>} Coaching analysis
 */
export async function analyzeGameDecisions(env, gameId, sport) {
  try {
    // Retrieve PBP data from R2
    const pbpData = await retrievePBPData(env, gameId);

    if (!pbpData || !pbpData.data) {
      throw new Error(`No play-by-play data available for game ${gameId}`);
    }

    const analysis = {
      game_id: gameId,
      sport,
      decisions: {
        fourth_down: [],
        two_point: [],
        timeout: [],
        challenge: [],
        play_calling: {},
      },
      summary: {
        total_decisions: 0,
        optimal_decisions: 0,
        suboptimal_decisions: 0,
        decision_quality_score: 0,
      },
      coaches: {},
      meta: {
        analyzed_at: new Date().toISOString(),
      },
    };

    if (sport === 'NFL' || sport === 'NCAA_FOOTBALL') {
      analysis.decisions.fourth_down = analyzeFourthDownDecisions(pbpData.data);
      analysis.decisions.two_point = analyzeTwoPointConversions(pbpData.data);
      analysis.decisions.timeout = analyzeTimeoutUsage(pbpData.data);
      analysis.decisions.play_calling = analyzePlayCalling(pbpData.data);
    }

    // Calculate summary metrics
    analysis.summary = calculateDecisionSummary(analysis.decisions);

    return analysis;
  } catch (error) {
    console.error(`Coaching decision analysis error for ${gameId}:`, error);
    throw error;
  }
}

/**
 * Analyze 4th down decisions
 */
function analyzeFourthDownDecisions(pbpData) {
  const decisions = [];
  const plays = pbpData.plays || [];

  for (const play of plays) {
    if (play.down !== 4) continue;

    const decision = {
      play_id: play.play_id,
      quarter: play.quarter,
      time_remaining: play.time_remaining,
      yard_line: play.yard_line,
      distance: play.distance,
      score_differential: play.score_differential,
      decision: classifyFourthDownDecision(play),
      success: play.success,
      yards_gained: play.yards_gained,
      win_probability_before: play.win_probability_before || 0,
      win_probability_after: play.win_probability_after || 0,
      wp_delta: (play.win_probability_after || 0) - (play.win_probability_before || 0),
    };

    // Calculate expected points and win probability impact
    decision.expected_value = calculateFourthDownEV(decision);
    decision.recommendation = getFourthDownRecommendation(decision);
    decision.optimal = isOptimalDecision(decision);

    decisions.push(decision);
  }

  return decisions;
}

/**
 * Classify 4th down decision type
 */
function classifyFourthDownDecision(play) {
  const playType = play.play_type?.toLowerCase() || '';

  if (playType.includes('punt')) {
    return 'punt';
  } else if (playType.includes('field goal') || playType.includes('fg')) {
    return 'field_goal';
  } else {
    return 'go_for_it';
  }
}

/**
 * Calculate expected value for 4th down decision
 *
 * Based on:
 * - Field position
 * - Distance to go
 * - Score differential
 * - Time remaining
 * - Historical success rates
 */
function calculateFourthDownEV(decision) {
  const { yard_line, distance, score_differential, quarter } = decision;

  // Simplified EV calculation
  // In production, use comprehensive win probability models

  let goForItEV = 0;
  let fieldGoalEV = 0;
  let puntEV = 0;

  // Go for it expected value
  const conversionProbability = getConversionProbability(distance);
  const successEP = yard_line < 50 ? 3.5 : 2.5; // Expected points on success
  const failureEP = yard_line < 20 ? -2.0 : -0.5; // Expected points on failure
  goForItEV = conversionProbability * successEP + (1 - conversionProbability) * failureEP;

  // Field goal expected value (if in range)
  if (yard_line <= 35) {
    const fgProbability = getFieldGoalProbability(yard_line);
    fieldGoalEV = fgProbability * 3.0;
  }

  // Punt expected value
  const avgPuntNet = 40;
  const opponentFieldPosition = Math.min(100, yard_line + avgPuntNet);
  puntEV = getFieldPositionValue(opponentFieldPosition) * -1;

  // Adjust for game situation
  if (quarter === 4 && Math.abs(score_differential) <= 7) {
    // More aggressive in close 4th quarter games
    goForItEV *= 1.2;
  }

  return {
    go_for_it: Math.round(goForItEV * 100) / 100,
    field_goal: Math.round(fieldGoalEV * 100) / 100,
    punt: Math.round(puntEV * 100) / 100,
    best_option: getBestOption({ goForItEV, fieldGoalEV, puntEV }),
  };
}

/**
 * Get conversion probability based on distance
 */
function getConversionProbability(distance) {
  // Historical NFL 4th down conversion rates by distance
  if (distance === 1) return 0.65;
  if (distance === 2) return 0.55;
  if (distance <= 3) return 0.5;
  if (distance <= 5) return 0.45;
  if (distance <= 7) return 0.4;
  if (distance <= 10) return 0.35;
  return 0.25;
}

/**
 * Get field goal probability based on distance
 */
function getFieldGoalProbability(yardLine) {
  const distance = yardLine + 17; // Add end zone + holder position

  if (distance <= 30) return 0.95;
  if (distance <= 35) return 0.9;
  if (distance <= 40) return 0.85;
  if (distance <= 45) return 0.75;
  if (distance <= 50) return 0.65;
  return 0.5;
}

/**
 * Get field position value in expected points
 */
function getFieldPositionValue(yardLine) {
  // Expected points by field position
  // Values based on NFL analytics
  if (yardLine <= 10) return -1.5;
  if (yardLine <= 20) return -0.5;
  if (yardLine <= 30) return 0.5;
  if (yardLine <= 40) return 1.0;
  if (yardLine <= 50) return 1.5;
  if (yardLine <= 60) return 2.0;
  if (yardLine <= 70) return 2.5;
  if (yardLine <= 80) return 3.0;
  if (yardLine <= 90) return 3.5;
  return 4.0;
}

/**
 * Get best option from EV analysis
 */
function getBestOption(evs) {
  if (evs.goForItEV > evs.fieldGoalEV && evs.goForItEV > evs.puntEV) {
    return 'go_for_it';
  } else if (evs.fieldGoalEV > evs.puntEV) {
    return 'field_goal';
  }
  return 'punt';
}

/**
 * Get recommendation for 4th down decision
 */
function getFourthDownRecommendation(decision) {
  const bestOption = decision.expected_value.best_option;

  return {
    action: bestOption,
    confidence: calculateConfidence(decision.expected_value),
    reasoning: generateReasoning(decision, bestOption),
  };
}

/**
 * Calculate confidence level in recommendation
 */
function calculateConfidence(ev) {
  const values = [ev.go_for_it, ev.field_goal, ev.punt];
  const max = Math.max(...values);
  const secondMax = Math.max(...values.filter((v) => v !== max));

  const difference = max - secondMax;

  if (difference >= 1.0) return 'high';
  if (difference >= 0.5) return 'medium';
  return 'low';
}

/**
 * Generate reasoning for recommendation
 */
function generateReasoning(decision, recommendation) {
  const reasons = [];

  if (recommendation === 'go_for_it') {
    if (decision.distance <= 2) {
      reasons.push('Short distance increases conversion probability');
    }
    if (decision.yard_line < 40) {
      reasons.push('Good field position maximizes expected points on success');
    }
    if (decision.quarter === 4 && Math.abs(decision.score_differential) <= 7) {
      reasons.push('Close game in 4th quarter justifies aggressive decision');
    }
  } else if (recommendation === 'field_goal') {
    reasons.push('High field goal probability from this distance');
    if (decision.score_differential < 0) {
      reasons.push('Points needed to close deficit');
    }
  } else if (recommendation === 'punt') {
    if (decision.distance > 5) {
      reasons.push('Long distance reduces conversion probability');
    }
    if (decision.yard_line > 50) {
      reasons.push('Poor field position limits upside of going for it');
    }
    reasons.push('Punting maintains field position advantage');
  }

  return reasons;
}

/**
 * Determine if decision was optimal
 */
function isOptimalDecision(decision) {
  return decision.decision === decision.expected_value.best_option;
}

/**
 * Analyze 2-point conversion attempts
 */
function analyzeTwoPointConversions(pbpData) {
  const decisions = [];
  const plays = pbpData.plays || [];

  for (const play of plays) {
    if (!isTwoPointAttempt(play)) continue;

    const decision = {
      play_id: play.play_id,
      quarter: play.quarter,
      time_remaining: play.time_remaining,
      score_differential: play.score_differential,
      success: play.success,
      win_probability_before: play.win_probability_before || 0,
      win_probability_after: play.win_probability_after || 0,
      wp_delta: (play.win_probability_after || 0) - (play.win_probability_before || 0),
    };

    // Analyze if 2-point attempt was correct decision
    decision.optimal = isOptimalTwoPointDecision(decision);
    decision.recommendation = getTwoPointRecommendation(decision);

    decisions.push(decision);
  }

  return decisions;
}

/**
 * Check if play is a 2-point conversion attempt
 */
function isTwoPointAttempt(play) {
  const playType = play.play_type?.toLowerCase() || '';
  return playType.includes('two point') || playType.includes('2pt');
}

/**
 * Determine if 2-point attempt was optimal
 */
function isOptimalTwoPointDecision(decision) {
  const { score_differential, quarter, time_remaining } = decision;

  // Late game situations where 2-point is clearly correct
  if (quarter === 4 && time_remaining < 300) {
    // Less than 5 minutes
    // Down 14 -> go for 2 on first TD
    if (score_differential === -8) return true;
    // Down 8 -> go for 2 to tie
    if (score_differential === -2) return true;
    // Up 7 -> go for 2 to go up 9 (two-score game)
    if (score_differential === 7) return true;
  }

  // Default to kick (2-point conversion rate ~47%, need >50% EV to justify)
  return false;
}

/**
 * Get recommendation for 2-point attempt
 */
function getTwoPointRecommendation(decision) {
  const {
    score_differential: _score_differential,
    quarter: _quarter,
    time_remaining: _time_remaining,
  } = decision;

  if (isOptimalTwoPointDecision(decision)) {
    return {
      action: 'go_for_two',
      confidence: 'high',
      reasoning: ['Game situation strongly favors 2-point attempt'],
    };
  }

  return {
    action: 'kick_extra_point',
    confidence: 'medium',
    reasoning: ['Standard situation favors higher-probability extra point'],
  };
}

/**
 * Analyze timeout usage
 */
function analyzeTimeoutUsage(pbpData) {
  const timeouts = [];
  const plays = pbpData.plays || [];

  for (const play of plays) {
    if (!play.timeout_called) continue;

    const timeout = {
      play_id: play.play_id,
      quarter: play.quarter,
      time_remaining: play.time_remaining,
      team: play.timeout_team,
      reason: classifyTimeoutReason(play),
      timeouts_remaining: play.timeouts_remaining,
      optimal: isOptimalTimeout(play),
    };

    timeouts.push(timeout);
  }

  return timeouts;
}

/**
 * Classify timeout reason
 */
function classifyTimeoutReason(play) {
  // Analyze context to determine likely reason
  if (play.quarter === 4 && play.time_remaining < 120) {
    return 'clock_management';
  }
  if (play.quarter <= 2 && play.time_remaining < 120) {
    return 'end_of_half';
  }
  return 'avoid_penalty'; // Likely to avoid delay of game
}

/**
 * Determine if timeout usage was optimal
 */
function isOptimalTimeout(play) {
  // Simplified analysis
  // Timeouts are valuable - should be used strategically

  const { quarter, time_remaining, timeouts_remaining } = play;

  // Using timeout in first half with <2min is generally good
  if (quarter <= 2 && time_remaining < 120 && timeouts_remaining >= 1) {
    return true;
  }

  // Late game timeout usage
  if (quarter === 4 && time_remaining < 300) {
    return true;
  }

  // Early game timeout to avoid penalty
  if (quarter <= 2 && time_remaining > 300) {
    return false; // Could have taken penalty instead
  }

  return true; // Default to optimal
}

/**
 * Analyze play calling patterns
 */
function analyzePlayCalling(pbpData) {
  const plays = pbpData.plays || [];

  const analysis = {
    total_plays: plays.length,
    run_plays: 0,
    pass_plays: 0,
    run_pass_ratio: 0,
    situational: {
      first_down: { run: 0, pass: 0 },
      second_down: { run: 0, pass: 0 },
      third_down: { run: 0, pass: 0 },
      red_zone: { run: 0, pass: 0 },
      two_minute: { run: 0, pass: 0 },
    },
    tendencies: [],
    predictability_score: 0,
  };

  for (const play of plays) {
    const playType = classifyPlayType(play);

    if (playType === 'run') analysis.run_plays++;
    if (playType === 'pass') analysis.pass_plays++;

    // Situational analysis
    if (play.down === 1) {
      analysis.situational.first_down[playType]++;
    } else if (play.down === 2) {
      analysis.situational.second_down[playType]++;
    } else if (play.down === 3) {
      analysis.situational.third_down[playType]++;
    }

    // Red zone
    if (play.yard_line <= 20) {
      analysis.situational.red_zone[playType]++;
    }

    // Two-minute drill
    if (play.time_remaining < 120 && (play.quarter === 2 || play.quarter === 4)) {
      analysis.situational.two_minute[playType]++;
    }
  }

  // Calculate metrics
  analysis.run_pass_ratio =
    analysis.pass_plays > 0
      ? Math.round((analysis.run_plays / analysis.pass_plays) * 100) / 100
      : 0;

  // Identify tendencies
  analysis.tendencies = identifyPlayCallingTendencies(analysis.situational);

  // Calculate predictability score (0-100, higher = more predictable)
  analysis.predictability_score = calculatePredictability(analysis.situational);

  return analysis;
}

/**
 * Classify play type
 */
function classifyPlayType(play) {
  const playType = play.play_type?.toLowerCase() || '';

  if (playType.includes('run') || playType.includes('rush')) {
    return 'run';
  } else if (playType.includes('pass') || playType.includes('sack')) {
    return 'pass';
  }

  return 'other';
}

/**
 * Identify play calling tendencies
 */
function identifyPlayCallingTendencies(situational) {
  const tendencies = [];

  // First down tendencies
  const firstDownRun = situational.first_down.run;
  const firstDownPass = situational.first_down.pass;
  const firstDownTotal = firstDownRun + firstDownPass;

  if (firstDownTotal > 0) {
    const runPct = (firstDownRun / firstDownTotal) * 100;
    if (runPct > 65) {
      tendencies.push({
        situation: 'first_down',
        tendency: 'run_heavy',
        percentage: Math.round(runPct),
        exploitable: true,
      });
    } else if (runPct < 35) {
      tendencies.push({
        situation: 'first_down',
        tendency: 'pass_heavy',
        percentage: Math.round(100 - runPct),
        exploitable: true,
      });
    }
  }

  // Third down tendencies
  const thirdDownRun = situational.third_down.run;
  const thirdDownPass = situational.third_down.pass;
  const thirdDownTotal = thirdDownRun + thirdDownPass;

  if (thirdDownTotal > 0) {
    const passPct = (thirdDownPass / thirdDownTotal) * 100;
    if (passPct > 80) {
      tendencies.push({
        situation: 'third_down',
        tendency: 'predictable_pass',
        percentage: Math.round(passPct),
        exploitable: true,
      });
    }
  }

  // Red zone tendencies
  const redZoneRun = situational.red_zone.run;
  const redZonePass = situational.red_zone.pass;
  const redZoneTotal = redZoneRun + redZonePass;

  if (redZoneTotal > 0) {
    const runPct = (redZoneRun / redZoneTotal) * 100;
    if (runPct > 70) {
      tendencies.push({
        situation: 'red_zone',
        tendency: 'run_heavy',
        percentage: Math.round(runPct),
        exploitable: true,
      });
    }
  }

  return tendencies;
}

/**
 * Calculate play calling predictability
 */
function calculatePredictability(situational) {
  let totalDeviation = 0;
  let situations = 0;

  // Ideal is 50/50 run/pass in most situations
  const ideal = 50;

  for (const situation in situational) {
    const { run, pass } = situational[situation];
    const total = run + pass;

    if (total > 0) {
      const runPct = (run / total) * 100;
      const deviation = Math.abs(runPct - ideal);
      totalDeviation += deviation;
      situations++;
    }
  }

  if (situations === 0) return 0;

  // Average deviation from 50/50, normalized to 0-100 scale
  const avgDeviation = totalDeviation / situations;
  return Math.round(avgDeviation * 2); // Scale to 0-100
}

/**
 * Calculate decision summary metrics
 */
function calculateDecisionSummary(decisions) {
  let totalDecisions = 0;
  let optimalDecisions = 0;

  // Count 4th down decisions
  for (const decision of decisions.fourth_down) {
    totalDecisions++;
    if (decision.optimal) optimalDecisions++;
  }

  // Count 2-point decisions
  for (const decision of decisions.two_point) {
    totalDecisions++;
    if (decision.optimal) optimalDecisions++;
  }

  const suboptimalDecisions = totalDecisions - optimalDecisions;
  const qualityScore =
    totalDecisions > 0 ? Math.round((optimalDecisions / totalDecisions) * 100) : 0;

  return {
    total_decisions: totalDecisions,
    optimal_decisions: optimalDecisions,
    suboptimal_decisions: suboptimalDecisions,
    decision_quality_score: qualityScore,
  };
}

/**
 * Analyze coaching decisions across multiple games (season analysis)
 */
export async function analyzeSeasonDecisions(env, teamId, sport, season) {
  try {
    // Get all games for team in season
    const games = await env.DB.prepare(
      `
      SELECT game_id FROM historical_games
      WHERE (home_team_id = ? OR away_team_id = ?)
        AND sport = ?
        AND season = ?
        AND status = 'final'
      ORDER BY game_date DESC
    `
    )
      .bind(teamId, teamId, sport, season)
      .all();

    const seasonAnalysis = {
      team_id: teamId,
      sport,
      season,
      games_analyzed: games.results.length,
      aggregate: {
        fourth_down: {
          total_attempts: 0,
          go_for_it: 0,
          field_goal: 0,
          punt: 0,
          conversion_rate: 0,
          optimal_rate: 0,
        },
        two_point: {
          total_attempts: 0,
          success_rate: 0,
          optimal_rate: 0,
        },
        play_calling: {
          avg_predictability: 0,
          run_pass_ratio: 0,
        },
        decision_quality_score: 0,
      },
      games: [],
    };

    // Analyze each game
    for (const game of games.results) {
      const gameAnalysis = await analyzeGameDecisions(env, game.game_id, sport);
      seasonAnalysis.games.push(gameAnalysis);

      // Aggregate stats
      seasonAnalysis.aggregate.fourth_down.total_attempts +=
        gameAnalysis.decisions.fourth_down.length;
      seasonAnalysis.aggregate.two_point.total_attempts += gameAnalysis.decisions.two_point.length;
    }

    // Calculate aggregate metrics
    seasonAnalysis.aggregate = calculateAggregateMetrics(seasonAnalysis.games);

    return seasonAnalysis;
  } catch (error) {
    console.error(`Season decision analysis error:`, error);
    throw error;
  }
}

/**
 * Calculate aggregate metrics across all games
 */
function calculateAggregateMetrics(games) {
  const aggregate = {
    fourth_down: {
      total_attempts: 0,
      go_for_it: 0,
      field_goal: 0,
      punt: 0,
      successes: 0,
      conversion_rate: 0,
      optimal_decisions: 0,
      optimal_rate: 0,
    },
    two_point: {
      total_attempts: 0,
      successes: 0,
      success_rate: 0,
      optimal_decisions: 0,
      optimal_rate: 0,
    },
    play_calling: {
      total_predictability: 0,
      games_analyzed: 0,
      avg_predictability: 0,
      total_run_pass: 0,
      run_pass_ratio: 0,
    },
    decision_quality_score: 0,
  };

  for (const game of games) {
    // 4th down
    for (const decision of game.decisions.fourth_down) {
      aggregate.fourth_down.total_attempts++;

      if (decision.decision === 'go_for_it') aggregate.fourth_down.go_for_it++;
      if (decision.decision === 'field_goal') aggregate.fourth_down.field_goal++;
      if (decision.decision === 'punt') aggregate.fourth_down.punt++;
      if (decision.success) aggregate.fourth_down.successes++;
      if (decision.optimal) aggregate.fourth_down.optimal_decisions++;
    }

    // 2-point
    for (const decision of game.decisions.two_point) {
      aggregate.two_point.total_attempts++;
      if (decision.success) aggregate.two_point.successes++;
      if (decision.optimal) aggregate.two_point.optimal_decisions++;
    }

    // Play calling
    if (game.decisions.play_calling.predictability_score) {
      aggregate.play_calling.total_predictability +=
        game.decisions.play_calling.predictability_score;
      aggregate.play_calling.games_analyzed++;
    }
  }

  // Calculate rates
  if (aggregate.fourth_down.total_attempts > 0) {
    aggregate.fourth_down.conversion_rate = Math.round(
      (aggregate.fourth_down.successes / aggregate.fourth_down.total_attempts) * 100
    );
    aggregate.fourth_down.optimal_rate = Math.round(
      (aggregate.fourth_down.optimal_decisions / aggregate.fourth_down.total_attempts) * 100
    );
  }

  if (aggregate.two_point.total_attempts > 0) {
    aggregate.two_point.success_rate = Math.round(
      (aggregate.two_point.successes / aggregate.two_point.total_attempts) * 100
    );
    aggregate.two_point.optimal_rate = Math.round(
      (aggregate.two_point.optimal_decisions / aggregate.two_point.total_attempts) * 100
    );
  }

  if (aggregate.play_calling.games_analyzed > 0) {
    aggregate.play_calling.avg_predictability = Math.round(
      aggregate.play_calling.total_predictability / aggregate.play_calling.games_analyzed
    );
  }

  // Overall decision quality
  const totalDecisions = aggregate.fourth_down.total_attempts + aggregate.two_point.total_attempts;
  const optimalDecisions =
    aggregate.fourth_down.optimal_decisions + aggregate.two_point.optimal_decisions;

  aggregate.decision_quality_score =
    totalDecisions > 0 ? Math.round((optimalDecisions / totalDecisions) * 100) : 0;

  return aggregate;
}
