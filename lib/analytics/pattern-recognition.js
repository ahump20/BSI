/**
 * Blaze Sports Intel - Pattern Recognition Engine
 *
 * Advanced pattern recognition algorithms for identifying trends, tendencies,
 * and predictable behaviors in coaching decisions, umpire calls, player
 * performance, and team strategies.
 *
 * Uses statistical analysis, machine learning techniques, and domain-specific
 * heuristics to detect actionable patterns in historical sports data.
 */

/**
 * Detect coaching patterns from historical decision data
 *
 * @param {Array} decisions - Array of coaching decisions from decision-analyzer
 * @param {Object} options - Analysis options
 * @returns {Object} Detected coaching patterns
 */
export function detectCoachingPatterns(decisions, options = {}) {
  const patterns = {
    sequential: detectSequentialPatterns(decisions),
    situational: detectSituationalPatterns(decisions),
    risk_profile: analyzeRiskProfile(decisions),
    predictability: calculatePredictability(decisions),
    tendencies: identifyTendencies(decisions),
    adaptation: detectAdaptation(decisions),
    meta: {
      decisions_analyzed: decisions.length,
      confidence: calculateConfidence(decisions.length),
    },
  };

  return patterns;
}

/**
 * Detect sequential patterns (play calling sequences)
 */
function detectSequentialPatterns(decisions) {
  const sequences = [];
  const minSequenceLength = 3;
  const minOccurrences = 2;

  // Extract decision sequences (e.g., run-run-pass)
  for (let i = 0; i < decisions.length - minSequenceLength + 1; i++) {
    const sequence = decisions
      .slice(i, i + minSequenceLength)
      .map((d) => d.decision_type || d.action)
      .join('→');

    const existing = sequences.find((s) => s.pattern === sequence);
    if (existing) {
      existing.occurrences++;
      existing.indices.push(i);
    } else {
      sequences.push({
        pattern: sequence,
        occurrences: 1,
        indices: [i],
        length: minSequenceLength,
      });
    }
  }

  // Filter to significant patterns
  const significant = sequences
    .filter((s) => s.occurrences >= minOccurrences)
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 10);

  return {
    patterns: significant,
    most_common: significant[0] || null,
    diversity_score: calculateDiversityScore(sequences),
  };
}

/**
 * Detect situational patterns (down/distance tendencies)
 */
function detectSituationalPatterns(decisions) {
  const situations = {};

  for (const decision of decisions) {
    // Create situation key (e.g., "3rd_and_5", "red_zone", "two_minute")
    const situationKeys = [];

    if (decision.down && decision.distance) {
      situationKeys.push(`${decision.down}th_and_${decision.distance}`);
    }

    if (decision.field_position) {
      if (decision.field_position <= 20) situationKeys.push('red_zone');
      if (decision.field_position >= 80) situationKeys.push('deep_own_territory');
    }

    if (decision.quarter === 4 && decision.time_remaining < 120) {
      situationKeys.push('two_minute_drill');
    }

    if (decision.score_differential) {
      if (Math.abs(decision.score_differential) <= 7) {
        situationKeys.push('one_score_game');
      }
    }

    // Record decision for each situation
    for (const key of situationKeys) {
      if (!situations[key]) {
        situations[key] = {
          total: 0,
          decisions: {},
          outcomes: { success: 0, failure: 0 },
        };
      }

      situations[key].total++;

      const action = decision.decision_type || decision.action;
      if (!situations[key].decisions[action]) {
        situations[key].decisions[action] = 0;
      }
      situations[key].decisions[action]++;

      // Track outcomes if available
      if (decision.outcome === 'success') situations[key].outcomes.success++;
      if (decision.outcome === 'failure') situations[key].outcomes.failure++;
    }
  }

  // Calculate tendencies for each situation
  const tendencies = {};
  for (const situation in situations) {
    const data = situations[situation];
    const mostCommon = Object.entries(data.decisions).sort((a, b) => b[1] - a[1])[0];

    if (mostCommon && data.total >= 3) {
      const [action, count] = mostCommon;
      const percentage = (count / data.total) * 100;

      if (percentage > 60) {
        tendencies[situation] = {
          action,
          percentage: Math.round(percentage),
          occurrences: count,
          total: data.total,
          predictable: percentage > 75,
          success_rate:
            data.outcomes.success + data.outcomes.failure > 0
              ? Math.round(
                  (data.outcomes.success / (data.outcomes.success + data.outcomes.failure)) * 100
                )
              : null,
        };
      }
    }
  }

  return {
    situations: tendencies,
    exploitable: Object.values(tendencies).filter((t) => t.predictable),
    high_success: Object.entries(tendencies)
      .filter(([_, t]) => t.success_rate && t.success_rate > 70)
      .map(([situation, tendency]) => ({ situation, ...tendency })),
  };
}

/**
 * Analyze risk profile (aggressive vs conservative)
 */
function analyzeRiskProfile(decisions) {
  let aggressiveDecisions = 0;
  let conservativeDecisions = 0;
  let totalRiskScore = 0;

  for (const decision of decisions) {
    const risk = calculateDecisionRisk(decision);
    totalRiskScore += risk;

    if (risk > 0.6) aggressiveDecisions++;
    if (risk < 0.4) conservativeDecisions++;
  }

  const avgRisk = decisions.length > 0 ? totalRiskScore / decisions.length : 0.5;

  let profile;
  if (avgRisk > 0.65) profile = 'aggressive';
  else if (avgRisk < 0.45) profile = 'conservative';
  else profile = 'balanced';

  return {
    profile,
    risk_score: Math.round(avgRisk * 100),
    aggressive_decisions: aggressiveDecisions,
    conservative_decisions: conservativeDecisions,
    risk_distribution: {
      high_risk: Math.round((aggressiveDecisions / decisions.length) * 100),
      medium_risk: Math.round(
        ((decisions.length - aggressiveDecisions - conservativeDecisions) / decisions.length) * 100
      ),
      low_risk: Math.round((conservativeDecisions / decisions.length) * 100),
    },
  };
}

/**
 * Calculate decision risk level (0 = conservative, 1 = aggressive)
 */
function calculateDecisionRisk(decision) {
  let risk = 0.5; // Default neutral

  if (decision.decision_type === 'go_for_it' || decision.action === 'go_for_it') {
    risk = 0.8; // Going for it on 4th down is aggressive
  } else if (decision.decision_type === 'punt' || decision.action === 'punt') {
    risk = 0.2; // Punting is conservative
  } else if (decision.decision_type === 'field_goal' || decision.action === 'field_goal') {
    risk = 0.4; // Field goal is moderately conservative
  } else if (decision.decision_type === 'two_point' || decision.action === 'two_point') {
    risk = 0.9; // Two-point conversion is highly aggressive
  }

  // Adjust based on game situation
  if (decision.score_differential && Math.abs(decision.score_differential) <= 7) {
    risk += 0.1; // More aggressive in close games
  }

  if (decision.quarter === 4 && decision.time_remaining < 300) {
    risk += 0.15; // More aggressive late in game
  }

  return Math.min(1, Math.max(0, risk));
}

/**
 * Calculate overall predictability score
 */
function calculatePredictability(decisions) {
  if (decisions.length < 10) {
    return {
      score: 0,
      confidence: 'low',
      reasoning: 'Insufficient data for predictability analysis',
    };
  }

  // Calculate entropy (diversity) of decisions
  const decisionCounts = {};
  for (const decision of decisions) {
    const action = decision.decision_type || decision.action || 'unknown';
    decisionCounts[action] = (decisionCounts[action] || 0) + 1;
  }

  const probabilities = Object.values(decisionCounts).map((count) => count / decisions.length);
  const entropy = -probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0);
  const maxEntropy = Math.log2(Object.keys(decisionCounts).length);
  const normalizedEntropy = entropy / maxEntropy;

  // Lower entropy = more predictable
  const predictabilityScore = Math.round((1 - normalizedEntropy) * 100);

  let assessment;
  if (predictabilityScore > 75) assessment = 'highly_predictable';
  else if (predictabilityScore > 60) assessment = 'predictable';
  else if (predictabilityScore > 40) assessment = 'somewhat_unpredictable';
  else assessment = 'unpredictable';

  return {
    score: predictabilityScore,
    entropy: Math.round(normalizedEntropy * 100),
    assessment,
    confidence: decisions.length > 30 ? 'high' : 'medium',
    most_common_decision: Object.entries(decisionCounts).sort((a, b) => b[1] - a[1])[0]?.[0],
  };
}

/**
 * Identify specific coaching tendencies
 */
function identifyTendencies(decisions) {
  const tendencies = [];

  // Fourth down aggression
  const fourthDownDecisions = decisions.filter((d) => d.down === 4);
  if (fourthDownDecisions.length >= 5) {
    const goForItCount = fourthDownDecisions.filter(
      (d) => d.decision_type === 'go_for_it' || d.action === 'go_for_it'
    ).length;
    const goForItRate = (goForItCount / fourthDownDecisions.length) * 100;

    if (goForItRate > 50) {
      tendencies.push({
        type: 'fourth_down_aggression',
        description: 'Goes for it on 4th down more often than league average',
        rate: Math.round(goForItRate),
        sample_size: fourthDownDecisions.length,
        exploitable: goForItRate > 70,
      });
    }
  }

  // Two-point conversion tendency
  const twoPointAttempts = decisions.filter(
    (d) => d.decision_type === 'two_point' || d.action === 'two_point'
  );
  if (twoPointAttempts.length > 0) {
    tendencies.push({
      type: 'two_point_frequency',
      description: 'Attempts two-point conversions',
      attempts: twoPointAttempts.length,
      sample_size: decisions.length,
      exploitable: false,
    });
  }

  // Play action patterns
  const playActions = decisions.map((d) => d.play_type).filter(Boolean);
  if (playActions.length >= 20) {
    const runCount = playActions.filter((p) => p === 'run').length;
    const passCount = playActions.filter((p) => p === 'pass').length;
    const runPassRatio = runCount / passCount;

    if (runPassRatio > 1.5) {
      tendencies.push({
        type: 'run_heavy',
        description: 'Run-heavy offensive scheme',
        ratio: Math.round(runPassRatio * 100) / 100,
        sample_size: playActions.length,
        exploitable: true,
      });
    } else if (runPassRatio < 0.67) {
      tendencies.push({
        type: 'pass_heavy',
        description: 'Pass-heavy offensive scheme',
        ratio: Math.round(runPassRatio * 100) / 100,
        sample_size: playActions.length,
        exploitable: true,
      });
    }
  }

  return tendencies;
}

/**
 * Detect adaptation patterns (changes in behavior over time)
 */
function detectAdaptation(decisions) {
  if (decisions.length < 20) {
    return {
      detected: false,
      reasoning: 'Insufficient data for adaptation analysis',
    };
  }

  // Split into first half and second half
  const midpoint = Math.floor(decisions.length / 2);
  const firstHalf = decisions.slice(0, midpoint);
  const secondHalf = decisions.slice(midpoint);

  const firstHalfRisk = analyzeRiskProfile(firstHalf);
  const secondHalfRisk = analyzeRiskProfile(secondHalf);

  const riskChange = secondHalfRisk.risk_score - firstHalfRisk.risk_score;

  const adaptation = {
    detected: Math.abs(riskChange) > 10,
    direction: riskChange > 0 ? 'more_aggressive' : 'more_conservative',
    magnitude: Math.abs(riskChange),
    first_half: firstHalfRisk.profile,
    second_half: secondHalfRisk.profile,
  };

  if (adaptation.detected) {
    adaptation.description =
      riskChange > 0
        ? 'Becomes more aggressive as game progresses'
        : 'Becomes more conservative as game progresses';
  }

  return adaptation;
}

/**
 * Calculate confidence level based on sample size
 */
function calculateConfidence(sampleSize) {
  if (sampleSize < 10) return 'very_low';
  if (sampleSize < 20) return 'low';
  if (sampleSize < 40) return 'medium';
  if (sampleSize < 80) return 'high';
  return 'very_high';
}

/**
 * Calculate diversity score (how varied are the decisions)
 */
function calculateDiversityScore(sequences) {
  if (sequences.length === 0) return 0;

  const uniquePatterns = new Set(sequences.map((s) => s.pattern)).size;
  const totalPatterns = sequences.length;

  return Math.round((uniquePatterns / totalPatterns) * 100);
}

/**
 * Detect umpire patterns from scorecard data
 *
 * @param {Array} scorecards - Array of umpire scorecards
 * @param {Object} options - Analysis options
 * @returns {Object} Detected umpire patterns
 */
export function detectUmpirePatterns(scorecards, options = {}) {
  if (!scorecards || scorecards.length === 0) {
    return {
      patterns: [],
      meta: { scorecards_analyzed: 0, confidence: 'none' },
    };
  }

  const patterns = {
    bias: detectBiasPatterns(scorecards),
    zone_preferences: detectZonePreferences(scorecards),
    consistency_trends: detectConsistencyTrends(scorecards),
    game_flow: detectGameFlowPatterns(scorecards),
    meta: {
      scorecards_analyzed: scorecards.length,
      confidence: calculateConfidence(scorecards.length),
    },
  };

  return patterns;
}

/**
 * Detect bias patterns (home/away favoritism)
 */
function detectBiasPatterns(scorecards) {
  let totalHomeFavor = 0;
  let totalAwayFavor = 0;
  let gamesWithHomeBias = 0;
  let gamesWithAwayBias = 0;

  for (const scorecard of scorecards) {
    const favor = scorecard.favor || scorecard.summary?.favor_home;

    if (favor) {
      if (typeof favor === 'object') {
        totalHomeFavor += favor.home_favor_score || 0;
        totalAwayFavor += favor.away_favor_score || 0;

        if (favor.home_favor) gamesWithHomeBias++;
        if (favor.away_favor) gamesWithAwayBias++;
      }
    }
  }

  const avgHomeFavor = totalHomeFavor / scorecards.length;
  const avgAwayFavor = totalAwayFavor / scorecards.length;
  const favorDifferential = avgHomeFavor - avgAwayFavor;

  const biasDetected = Math.abs(favorDifferential) > 3;
  const homeRateRate = (gamesWithHomeBias / scorecards.length) * 100;
  const awayFavorRate = (gamesWithAwayBias / scorecards.length) * 100;

  return {
    bias_detected: biasDetected,
    direction: favorDifferential > 0 ? 'home' : 'away',
    magnitude: Math.abs(Math.round(favorDifferential * 10) / 10),
    avg_home_favor: Math.round(avgHomeFavor * 10) / 10,
    avg_away_favor: Math.round(avgAwayFavor * 10) / 10,
    home_bias_rate: Math.round(homeRateRate),
    away_bias_rate: Math.round(awayFavorRate),
    consistency: Math.abs(homeRateRate - awayFavorRate) < 10 ? 'inconsistent' : 'consistent',
  };
}

/**
 * Detect zone preference patterns
 */
function detectZonePreferences(scorecards) {
  const aggregateZones = {};

  for (const scorecard of scorecards) {
    const zones = scorecard.zones?.zones || scorecard.zone_tendencies;

    if (zones) {
      for (const zone in zones) {
        if (!aggregateZones[zone]) {
          aggregateZones[zone] = {
            total_pitches: 0,
            total_strikes: 0,
            deviations: [],
          };
        }

        const zoneData = zones[zone];
        aggregateZones[zone].total_pitches += zoneData.total || 0;
        aggregateZones[zone].total_strikes += zoneData.called_strikes || 0;

        if (zoneData.deviation !== undefined) {
          aggregateZones[zone].deviations.push(zoneData.deviation);
        }
      }
    }
  }

  // Calculate average strike rates and consistent deviations
  const preferences = {};
  for (const zone in aggregateZones) {
    const data = aggregateZones[zone];
    const strikeRate = data.total_pitches > 0 ? (data.total_strikes / data.total_pitches) * 100 : 0;

    const avgDeviation =
      data.deviations.length > 0
        ? data.deviations.reduce((sum, d) => sum + d, 0) / data.deviations.length
        : 0;

    if (Math.abs(avgDeviation) > 5 && data.total_pitches > 20) {
      preferences[zone] = {
        strike_rate: Math.round(strikeRate * 10) / 10,
        avg_deviation: Math.round(avgDeviation * 10) / 10,
        direction: avgDeviation > 0 ? 'expands' : 'contracts',
        sample_size: data.total_pitches,
        consistent: data.deviations.every((d) => Math.sign(d) === Math.sign(avgDeviation)),
      };
    }
  }

  return {
    preferences,
    expanded_zones: Object.entries(preferences)
      .filter(([_, p]) => p.direction === 'expands')
      .map(([zone, pref]) => ({ zone, ...pref }))
      .sort((a, b) => b.avg_deviation - a.avg_deviation),
    contracted_zones: Object.entries(preferences)
      .filter(([_, p]) => p.direction === 'contracts')
      .map(([zone, pref]) => ({ zone, ...pref }))
      .sort((a, b) => a.avg_deviation - b.avg_deviation),
  };
}

/**
 * Detect consistency trends over time
 */
function detectConsistencyTrends(scorecards) {
  if (scorecards.length < 5) {
    return {
      trend: 'insufficient_data',
      reasoning: 'Need at least 5 games for trend analysis',
    };
  }

  const consistencyScores = scorecards
    .map((s) => s.consistency?.score || s.summary?.consistency_score)
    .filter((score) => score !== undefined);

  if (consistencyScores.length < 5) {
    return {
      trend: 'insufficient_data',
      reasoning: 'Not enough consistency scores available',
    };
  }

  // Calculate trend using linear regression
  const n = consistencyScores.length;
  const xMean = (n - 1) / 2;
  const yMean = consistencyScores.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (consistencyScores[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }

  const slope = numerator / denominator;
  const avgConsistency = yMean;

  let trend;
  if (slope > 2) trend = 'improving';
  else if (slope < -2) trend = 'declining';
  else trend = 'stable';

  return {
    trend,
    slope: Math.round(slope * 100) / 100,
    avg_consistency: Math.round(avgConsistency * 10) / 10,
    recent_consistency: Math.round(consistencyScores[n - 1] * 10) / 10,
    change: Math.round((consistencyScores[n - 1] - consistencyScores[0]) * 10) / 10,
  };
}

/**
 * Detect game flow patterns (early/late game differences)
 */
function detectGameFlowPatterns(scorecards) {
  const earlyGameMetrics = [];
  const lateGameMetrics = [];

  for (const scorecard of scorecards) {
    const consistency = scorecard.consistency;

    if (consistency && consistency.by_period) {
      earlyGameMetrics.push(consistency.by_period.first_third);
      lateGameMetrics.push(consistency.by_period.third_third);
    }
  }

  if (earlyGameMetrics.length === 0) {
    return {
      pattern: 'insufficient_data',
      reasoning: 'No game flow data available',
    };
  }

  const avgEarly = earlyGameMetrics.reduce((sum, x) => sum + x, 0) / earlyGameMetrics.length;
  const avgLate = lateGameMetrics.reduce((sum, x) => sum + x, 0) / lateGameMetrics.length;
  const difference = avgLate - avgEarly;

  let pattern;
  if (difference > 3) pattern = 'improves_late';
  else if (difference < -3) pattern = 'declines_late';
  else pattern = 'consistent_throughout';

  return {
    pattern,
    avg_early_accuracy: Math.round(avgEarly * 10) / 10,
    avg_late_accuracy: Math.round(avgLate * 10) / 10,
    difference: Math.round(difference * 10) / 10,
    description: getGameFlowDescription(pattern),
  };
}

/**
 * Get human-readable game flow description
 */
function getGameFlowDescription(pattern) {
  const descriptions = {
    improves_late: 'Umpire becomes more accurate as game progresses',
    declines_late: 'Umpire accuracy declines in later innings',
    consistent_throughout: 'Umpire maintains consistent accuracy throughout game',
  };

  return descriptions[pattern] || 'Unknown pattern';
}

/**
 * Detect player performance patterns
 *
 * @param {Array} performances - Array of player performance data
 * @param {Object} options - Analysis options
 * @returns {Object} Detected performance patterns
 */
export function detectPlayerPatterns(performances, options = {}) {
  if (!performances || performances.length === 0) {
    return {
      patterns: [],
      meta: { performances_analyzed: 0, confidence: 'none' },
    };
  }

  const patterns = {
    streaks: detectStreaks(performances),
    situational: detectSituationalPerformance(performances),
    matchup_advantages: detectMatchupAdvantages(performances),
    time_of_day: detectTimeOfDayPatterns(performances),
    meta: {
      performances_analyzed: performances.length,
      confidence: calculateConfidence(performances.length),
    },
  };

  return patterns;
}

/**
 * Detect hot/cold streaks
 */
function detectStreaks(performances) {
  const streaks = [];
  let currentStreak = {
    type: null,
    length: 0,
    start_index: 0,
    performances: [],
  };

  for (let i = 0; i < performances.length; i++) {
    const perf = performances[i];
    const isGood = isGoodPerformance(perf);

    if (currentStreak.type === null) {
      // Start new streak
      currentStreak.type = isGood ? 'hot' : 'cold';
      currentStreak.length = 1;
      currentStreak.start_index = i;
      currentStreak.performances = [perf];
    } else if (
      (currentStreak.type === 'hot' && isGood) ||
      (currentStreak.type === 'cold' && !isGood)
    ) {
      // Continue streak
      currentStreak.length++;
      currentStreak.performances.push(perf);
    } else {
      // Streak broken - save if significant
      if (currentStreak.length >= 3) {
        streaks.push({ ...currentStreak });
      }

      // Start new streak
      currentStreak = {
        type: isGood ? 'hot' : 'cold',
        length: 1,
        start_index: i,
        performances: [perf],
      };
    }
  }

  // Add final streak if significant
  if (currentStreak.length >= 3) {
    streaks.push(currentStreak);
  }

  return {
    streaks,
    longest_hot:
      streaks.filter((s) => s.type === 'hot').sort((a, b) => b.length - a.length)[0] || null,
    longest_cold:
      streaks.filter((s) => s.type === 'cold').sort((a, b) => b.length - a.length)[0] || null,
    current_streak: currentStreak.length >= 2 ? currentStreak : null,
  };
}

/**
 * Determine if performance is "good" (above threshold)
 */
function isGoodPerformance(perf) {
  // Sport-specific thresholds
  if (perf.sport === 'MLB' || perf.sport === 'NCAA_BASEBALL') {
    if (perf.batting_average !== undefined) {
      return perf.batting_average > 0.25;
    }
    if (perf.era !== undefined) {
      return perf.era < 4.0;
    }
  }

  if (perf.sport === 'NFL' || perf.sport === 'NCAA_FOOTBALL') {
    if (perf.passer_rating !== undefined) {
      return perf.passer_rating > 90;
    }
    if (perf.yards_per_carry !== undefined) {
      return perf.yards_per_carry > 4.0;
    }
  }

  // Default: use binary outcome if available
  return perf.outcome === 'win' || perf.success === true;
}

/**
 * Detect situational performance differences
 */
function detectSituationalPerformance(performances) {
  const situations = {
    home: { performances: [], avg_score: 0 },
    away: { performances: [], avg_score: 0 },
    day: { performances: [], avg_score: 0 },
    night: { performances: [], avg_score: 0 },
    vs_good: { performances: [], avg_score: 0 },
    vs_bad: { performances: [], avg_score: 0 },
  };

  for (const perf of performances) {
    // Home/Away
    if (perf.location === 'home') situations.home.performances.push(perf);
    if (perf.location === 'away') situations.away.performances.push(perf);

    // Day/Night
    if (perf.time_of_day === 'day') situations.day.performances.push(perf);
    if (perf.time_of_day === 'night') situations.night.performances.push(perf);

    // Opponent quality
    if (perf.opponent_win_pct && perf.opponent_win_pct > 0.55) {
      situations.vs_good.performances.push(perf);
    } else if (perf.opponent_win_pct && perf.opponent_win_pct < 0.45) {
      situations.vs_bad.performances.push(perf);
    }
  }

  // Calculate averages
  for (const situation in situations) {
    const perfs = situations[situation].performances;
    if (perfs.length > 0) {
      const scores = perfs.map((p) => getPerformanceScore(p));
      situations[situation].avg_score = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      situations[situation].sample_size = perfs.length;
    }
  }

  return situations;
}

/**
 * Get numeric performance score
 */
function getPerformanceScore(perf) {
  // Sport-specific scoring
  if (perf.batting_average !== undefined) return perf.batting_average * 100;
  if (perf.era !== undefined) return Math.max(0, 10 - perf.era);
  if (perf.passer_rating !== undefined) return perf.passer_rating;
  if (perf.yards_per_carry !== undefined) return perf.yards_per_carry * 10;

  // Default binary
  return perf.outcome === 'win' || perf.success ? 1 : 0;
}

/**
 * Detect matchup advantages (performs better against certain types)
 */
function detectMatchupAdvantages(performances) {
  const matchups = {};

  for (const perf of performances) {
    if (!perf.opponent) continue;

    const key = perf.opponent;
    if (!matchups[key]) {
      matchups[key] = {
        games: 0,
        total_score: 0,
        wins: 0,
        losses: 0,
      };
    }

    matchups[key].games++;
    matchups[key].total_score += getPerformanceScore(perf);

    if (perf.outcome === 'win') matchups[key].wins++;
    if (perf.outcome === 'loss') matchups[key].losses++;
  }

  // Calculate averages and identify strong/weak matchups
  const advantages = [];
  const disadvantages = [];

  for (const opponent in matchups) {
    const data = matchups[opponent];
    if (data.games < 3) continue; // Need sample size

    data.avg_score = data.total_score / data.games;
    data.win_pct = data.wins / (data.wins + data.losses);

    if (data.win_pct > 0.65) {
      advantages.push({ opponent, ...data });
    } else if (data.win_pct < 0.35) {
      disadvantages.push({ opponent, ...data });
    }
  }

  return {
    advantages: advantages.sort((a, b) => b.win_pct - a.win_pct),
    disadvantages: disadvantages.sort((a, b) => a.win_pct - b.win_pct),
    total_matchups: Object.keys(matchups).length,
  };
}

/**
 * Detect time-of-day performance patterns
 */
function detectTimeOfDayPatterns(performances) {
  const dayGames = performances.filter((p) => p.time_of_day === 'day');
  const nightGames = performances.filter((p) => p.time_of_day === 'night');

  if (dayGames.length < 3 || nightGames.length < 3) {
    return {
      pattern: 'insufficient_data',
      reasoning: 'Need at least 3 games in each time period',
    };
  }

  const dayAvg = dayGames.reduce((sum, p) => sum + getPerformanceScore(p), 0) / dayGames.length;
  const nightAvg =
    nightGames.reduce((sum, p) => sum + getPerformanceScore(p), 0) / nightGames.length;

  const difference = dayAvg - nightAvg;

  let pattern;
  if (Math.abs(difference) < 5) pattern = 'no_preference';
  else if (difference > 0) pattern = 'day_player';
  else pattern = 'night_player';

  return {
    pattern,
    day_avg: Math.round(dayAvg * 10) / 10,
    night_avg: Math.round(nightAvg * 10) / 10,
    difference: Math.round(difference * 10) / 10,
    day_games: dayGames.length,
    night_games: nightGames.length,
  };
}
