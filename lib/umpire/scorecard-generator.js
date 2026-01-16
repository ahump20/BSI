/**
 * Blaze Sports Intel - Umpire Scorecard Generator
 *
 * Analyzes umpire ball/strike calls from play-by-play data to generate
 * comprehensive performance scorecards including accuracy, consistency,
 * zone tendencies, and favor metrics.
 *
 * Supports MLB and college baseball umpire analysis.
 */

import { retrievePBPData } from '../historical/pbp-storage.js';

/**
 * Generate umpire scorecard for a single game
 *
 * @param {Object} env - Cloudflare environment bindings
 * @param {string} gameId - Game ID
 * @param {string} sport - Sport type (MLB, NCAA_BASEBALL)
 * @returns {Object} Game-level umpire scorecard
 */
export async function generateGameScorecard(env, gameId, sport) {
  const pbpData = await retrievePBPData(env, gameId);

  if (!pbpData || !pbpData.data) {
    throw new Error(`No play-by-play data found for game ${gameId}`);
  }

  const plays = pbpData.data.plays || [];
  const umpire = extractUmpireInfo(pbpData.data);

  const pitches = extractPitches(plays);
  const calls = analyzeCalls(pitches);
  const zones = analyzeZones(pitches);
  const favor = analyzeFavor(pitches, pbpData.data);
  const consistency = analyzeConsistency(pitches);

  return {
    game_id: gameId,
    sport,
    umpire,
    summary: {
      total_pitches: pitches.length,
      called_strikes: calls.called_strikes,
      called_balls: calls.called_balls,
      accuracy: calls.accuracy,
      favor_home: favor.home_favor,
      favor_away: favor.away_favor,
      consistency_score: consistency.score,
    },
    zones,
    calls,
    favor,
    consistency,
    meta: {
      generated_at: new Date().toISOString(),
    },
  };
}

/**
 * Generate career umpire scorecard aggregating multiple games
 *
 * @param {Object} env - Cloudflare environment bindings
 * @param {string} umpireName - Umpire's name
 * @param {string} sport - Sport type
 * @param {number} season - Season year
 * @returns {Object} Career umpire scorecard
 */
export async function generateCareerScorecard(env, umpireName, sport, season) {
  // Get all games umpired by this person in the season
  const games = await env.DB.prepare(
    `
    SELECT game_id, game_date, home_team_name, away_team_name
    FROM historical_games
    WHERE sport = ?
      AND season = ?
      AND status = 'final'
      AND umpire_home_plate = ?
    ORDER BY game_date DESC
  `
  )
    .bind(sport, season, umpireName)
    .all();

  const careerAnalysis = {
    umpire: umpireName,
    sport,
    season,
    games_analyzed: games.results?.length || 0,
    aggregate: {
      total_pitches: 0,
      total_calls: 0,
      avg_accuracy: 0,
      avg_consistency: 0,
      favor_metrics: {
        avg_home_favor: 0,
        avg_away_favor: 0,
        bias_detected: false,
      },
    },
    zone_tendencies: {},
    games: [],
  };

  const gameAnalyses = [];

  for (const game of games.results || []) {
    try {
      const gameScorecard = await generateGameScorecard(env, game.game_id, sport);
      gameAnalyses.push(gameScorecard);
    } catch (error) {
      console.error(`Failed to analyze game ${game.game_id}:`, error);
    }
  }

  // Aggregate metrics across all games
  careerAnalysis.aggregate = aggregateGameMetrics(gameAnalyses);
  careerAnalysis.zone_tendencies = aggregateZoneTendencies(gameAnalyses);
  careerAnalysis.games = gameAnalyses.slice(0, 10); // Include 10 most recent

  return careerAnalysis;
}

/**
 * Extract umpire information from play-by-play data
 */
function extractUmpireInfo(gameData) {
  return {
    name: gameData.officials?.home_plate || gameData.umpire_home_plate || 'Unknown',
    crew: {
      home_plate: gameData.officials?.home_plate,
      first_base: gameData.officials?.first_base,
      second_base: gameData.officials?.second_base,
      third_base: gameData.officials?.third_base,
    },
  };
}

/**
 * Extract all pitches with call data from plays
 */
function extractPitches(plays) {
  const pitches = [];

  for (const play of plays) {
    if (!play.pitches || !Array.isArray(play.pitches)) continue;

    for (const pitch of play.pitches) {
      // Only analyze called balls and strikes (not swings, foul balls, etc.)
      if (pitch.call === 'called_strike' || pitch.call === 'ball') {
        pitches.push({
          call: pitch.call,
          location_x: pitch.location?.x,
          location_z: pitch.location?.z,
          pitch_type: pitch.type,
          velocity: pitch.velocity,
          count: pitch.count,
          pitcher_hand: play.pitcher?.throws,
          batter_hand: play.batter?.bats,
          inning: play.inning,
          team_batting: play.team_batting,
          outs: play.outs,
        });
      }
    }
  }

  return pitches;
}

/**
 * Analyze call accuracy based on expected strike zone
 */
function analyzeCalls(pitches) {
  let called_strikes = 0;
  let called_balls = 0;
  let correct_strike_calls = 0;
  let correct_ball_calls = 0;
  let missed_strikes = 0;
  let missed_balls = 0;

  for (const pitch of pitches) {
    const inZone = isInStrikeZone(pitch.location_x, pitch.location_z);
    const calledStrike = pitch.call === 'called_strike';

    if (calledStrike) {
      called_strikes++;
      if (inZone) {
        correct_strike_calls++;
      } else {
        missed_balls++; // Called strike but was actually ball
      }
    } else {
      called_balls++;
      if (!inZone) {
        correct_ball_calls++;
      } else {
        missed_strikes++; // Called ball but was actually strike
      }
    }
  }

  const total_calls = called_strikes + called_balls;
  const correct_calls = correct_strike_calls + correct_ball_calls;
  const accuracy = total_calls > 0 ? (correct_calls / total_calls) * 100 : 0;

  return {
    total_calls,
    called_strikes,
    called_balls,
    correct_calls,
    correct_strike_calls,
    correct_ball_calls,
    missed_strikes,
    missed_balls,
    accuracy: Math.round(accuracy * 10) / 10,
    strike_call_accuracy:
      called_strikes > 0 ? Math.round((correct_strike_calls / called_strikes) * 1000) / 10 : 0,
    ball_call_accuracy:
      called_balls > 0 ? Math.round((correct_ball_calls / called_balls) * 1000) / 10 : 0,
  };
}

/**
 * Analyze umpire's zone tendencies using heat map
 */
function analyzeZones(pitches) {
  // Divide strike zone into 9 regions (3x3 grid)
  const zones = {
    high_inside: { called_strikes: 0, called_balls: 0, total: 0 },
    high_middle: { called_strikes: 0, called_balls: 0, total: 0 },
    high_outside: { called_strikes: 0, called_balls: 0, total: 0 },
    middle_inside: { called_strikes: 0, called_balls: 0, total: 0 },
    middle_middle: { called_strikes: 0, called_balls: 0, total: 0 },
    middle_outside: { called_strikes: 0, called_balls: 0, total: 0 },
    low_inside: { called_strikes: 0, called_balls: 0, total: 0 },
    low_middle: { called_strikes: 0, called_balls: 0, total: 0 },
    low_outside: { called_strikes: 0, called_balls: 0, total: 0 },
    chase_high: { called_strikes: 0, called_balls: 0, total: 0 },
    chase_low: { called_strikes: 0, called_balls: 0, total: 0 },
    chase_inside: { called_strikes: 0, called_balls: 0, total: 0 },
    chase_outside: { called_strikes: 0, called_balls: 0, total: 0 },
  };

  for (const pitch of pitches) {
    const zone = classifyZone(pitch.location_x, pitch.location_z);

    if (zones[zone]) {
      zones[zone].total++;
      if (pitch.call === 'called_strike') {
        zones[zone].called_strikes++;
      } else {
        zones[zone].called_balls++;
      }
    }
  }

  // Calculate strike rate for each zone
  for (const zone in zones) {
    const data = zones[zone];
    data.strike_rate =
      data.total > 0 ? Math.round((data.called_strikes / data.total) * 1000) / 10 : 0;
  }

  // Identify favorable and unfavorable zones
  const favorable = [];
  const unfavorable = [];

  for (const zone in zones) {
    const data = zones[zone];
    const expectedRate = getExpectedStrikeRate(zone);
    const deviation = data.strike_rate - expectedRate;

    if (Math.abs(deviation) > 10 && data.total >= 5) {
      if (deviation > 0) {
        favorable.push({ zone, strike_rate: data.strike_rate, deviation });
      } else {
        unfavorable.push({ zone, strike_rate: data.strike_rate, deviation });
      }
    }
  }

  return {
    zones,
    favorable_zones: favorable.sort((a, b) => b.deviation - a.deviation),
    unfavorable_zones: unfavorable.sort((a, b) => a.deviation - b.deviation),
    high_zone_bias: calculateHighZoneBias(zones),
    low_zone_bias: calculateLowZoneBias(zones),
    outside_zone_bias: calculateOutsideZoneBias(zones),
  };
}

/**
 * Analyze favor towards home/away teams
 */
function analyzeFavor(pitches, gameData) {
  const homePitches = pitches.filter((p) => p.team_batting === 'away'); // Home pitching
  const awayPitches = pitches.filter((p) => p.team_batting === 'home'); // Away pitching

  const homeMetrics = calculateFavorMetrics(homePitches);
  const awayMetrics = calculateFavorMetrics(awayPitches);

  const favorDiff = homeMetrics.favorable_calls - awayMetrics.favorable_calls;

  return {
    home_team: gameData.home_team_name,
    away_team: gameData.away_team_name,
    home_favorable_calls: homeMetrics.favorable_calls,
    home_unfavorable_calls: homeMetrics.unfavorable_calls,
    home_favor_score: homeMetrics.favor_score,
    away_favorable_calls: awayMetrics.favorable_calls,
    away_unfavorable_calls: awayMetrics.unfavorable_calls,
    away_favor_score: awayMetrics.favor_score,
    favor_differential: Math.round(favorDiff * 10) / 10,
    home_favor: favorDiff > 0,
    away_favor: favorDiff < 0,
    bias_detected: Math.abs(favorDiff) > 5,
    neutrality_score: Math.max(0, 100 - Math.abs(favorDiff * 2)),
  };
}

/**
 * Calculate favor metrics for a set of pitches
 */
function calculateFavorMetrics(pitches) {
  let favorable_calls = 0;
  let unfavorable_calls = 0;

  for (const pitch of pitches) {
    const inZone = isInStrikeZone(pitch.location_x, pitch.location_z);
    const calledStrike = pitch.call === 'called_strike';

    // Favorable: Called strike on borderline/outside pitch (benefits pitcher)
    // Favorable: Called ball on borderline/inside pitch (benefits batter)
    // Unfavorable: opposite of above

    if (calledStrike && !inZone) {
      // Called strike on ball - favorable to pitcher
      favorable_calls++;
    } else if (!calledStrike && inZone) {
      // Called ball on strike - favorable to batter
      unfavorable_calls++;
    }
  }

  const net_favor = favorable_calls - unfavorable_calls;
  const favor_score = pitches.length > 0 ? (net_favor / pitches.length) * 100 : 0;

  return {
    favorable_calls,
    unfavorable_calls,
    favor_score: Math.round(favor_score * 10) / 10,
  };
}

/**
 * Analyze call consistency throughout the game
 */
function analyzeConsistency(pitches) {
  // Split game into thirds to check consistency
  const third = Math.floor(pitches.length / 3);
  const firstThird = pitches.slice(0, third);
  const secondThird = pitches.slice(third, third * 2);
  const thirdThird = pitches.slice(third * 2);

  const firstAccuracy = calculateAccuracy(firstThird);
  const secondAccuracy = calculateAccuracy(secondThird);
  const thirdAccuracy = calculateAccuracy(thirdThird);

  const avgAccuracy = (firstAccuracy + secondAccuracy + thirdAccuracy) / 3;
  const variance = Math.sqrt(
    (Math.pow(firstAccuracy - avgAccuracy, 2) +
      Math.pow(secondAccuracy - avgAccuracy, 2) +
      Math.pow(thirdAccuracy - avgAccuracy, 2)) /
      3
  );

  // Consistency score: 100 = perfect consistency, 0 = highly variable
  const consistencyScore = Math.max(0, 100 - variance * 2);

  return {
    score: Math.round(consistencyScore * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    by_period: {
      first_third: Math.round(firstAccuracy * 10) / 10,
      second_third: Math.round(secondAccuracy * 10) / 10,
      third_third: Math.round(thirdAccuracy * 10) / 10,
    },
    trend: getTrend(firstAccuracy, secondAccuracy, thirdAccuracy),
  };
}

/**
 * Calculate accuracy for a subset of pitches
 */
function calculateAccuracy(pitches) {
  if (pitches.length === 0) return 0;

  let correct = 0;
  for (const pitch of pitches) {
    const inZone = isInStrikeZone(pitch.location_x, pitch.location_z);
    const calledStrike = pitch.call === 'called_strike';

    if ((inZone && calledStrike) || (!inZone && !calledStrike)) {
      correct++;
    }
  }

  return (correct / pitches.length) * 100;
}

/**
 * Determine if pitch is in the strike zone
 * Strike zone: approximately 17 inches wide, from hollow of knee to midpoint of torso
 * x: horizontal position (feet, negative = inside to RHH, positive = outside to RHH)
 * z: vertical position (feet, 1.5 = knees, 3.5 = letters)
 */
function isInStrikeZone(x, z) {
  if (x === undefined || z === undefined) return false;

  const PLATE_WIDTH = 17 / 12; // 17 inches in feet
  const ZONE_LOW = 1.5;
  const ZONE_HIGH = 3.5;

  // Check if pitch is within horizontal and vertical boundaries
  return Math.abs(x) <= PLATE_WIDTH / 2 && z >= ZONE_LOW && z <= ZONE_HIGH;
}

/**
 * Classify pitch location into zones
 */
function classifyZone(x, z) {
  if (x === undefined || z === undefined) return 'unknown';

  const INNER_THIRD = -0.47; // -17/36 feet
  const OUTER_THIRD = 0.47;
  const LOW_THIRD = 2.17; // 1.5 + (3.5-1.5)/3
  const HIGH_THIRD = 2.83;

  // Vertical classification
  let vertical;
  if (z < 1.5) vertical = 'chase_low';
  else if (z < LOW_THIRD) vertical = 'low';
  else if (z < HIGH_THIRD) vertical = 'middle';
  else if (z < 3.5) vertical = 'high';
  else vertical = 'chase_high';

  // Horizontal classification
  let horizontal;
  if (Math.abs(x) > 0.71) {
    // Outside strike zone
    if (x < 0) horizontal = 'chase_inside';
    else horizontal = 'chase_outside';
  } else if (x < INNER_THIRD) {
    horizontal = 'inside';
  } else if (x < OUTER_THIRD) {
    horizontal = 'middle';
  } else {
    horizontal = 'outside';
  }

  // Combine for zone name
  if (vertical.startsWith('chase') || horizontal.startsWith('chase')) {
    if (vertical.startsWith('chase')) return vertical;
    return horizontal;
  }

  return `${vertical}_${horizontal}`;
}

/**
 * Get expected strike rate for a zone
 */
function getExpectedStrikeRate(zone) {
  const expectedRates = {
    high_inside: 75,
    high_middle: 85,
    high_outside: 75,
    middle_inside: 85,
    middle_middle: 95,
    middle_outside: 85,
    low_inside: 75,
    low_middle: 85,
    low_outside: 75,
    chase_high: 15,
    chase_low: 10,
    chase_inside: 20,
    chase_outside: 20,
  };

  return expectedRates[zone] || 50;
}

/**
 * Calculate high zone bias
 */
function calculateHighZoneBias(zones) {
  const highZones = ['high_inside', 'high_middle', 'high_outside', 'chase_high'];
  let totalPitches = 0;
  let totalStrikes = 0;

  for (const zone of highZones) {
    totalPitches += zones[zone].total;
    totalStrikes += zones[zone].called_strikes;
  }

  const actualRate = totalPitches > 0 ? (totalStrikes / totalPitches) * 100 : 0;
  const expectedRate = 62.5; // Average of high zone expected rates

  return {
    bias: Math.round((actualRate - expectedRate) * 10) / 10,
    direction: actualRate > expectedRate ? 'expands' : 'contracts',
    significant: Math.abs(actualRate - expectedRate) > 5,
  };
}

/**
 * Calculate low zone bias
 */
function calculateLowZoneBias(zones) {
  const lowZones = ['low_inside', 'low_middle', 'low_outside', 'chase_low'];
  let totalPitches = 0;
  let totalStrikes = 0;

  for (const zone of lowZones) {
    totalPitches += zones[zone].total;
    totalStrikes += zones[zone].called_strikes;
  }

  const actualRate = totalPitches > 0 ? (totalStrikes / totalPitches) * 100 : 0;
  const expectedRate = 58.75; // Average of low zone expected rates

  return {
    bias: Math.round((actualRate - expectedRate) * 10) / 10,
    direction: actualRate > expectedRate ? 'expands' : 'contracts',
    significant: Math.abs(actualRate - expectedRate) > 5,
  };
}

/**
 * Calculate outside zone bias
 */
function calculateOutsideZoneBias(zones) {
  const outsideZones = ['high_outside', 'middle_outside', 'low_outside', 'chase_outside'];
  let totalPitches = 0;
  let totalStrikes = 0;

  for (const zone of outsideZones) {
    totalPitches += zones[zone].total;
    totalStrikes += zones[zone].called_strikes;
  }

  const actualRate = totalPitches > 0 ? (totalStrikes / totalPitches) * 100 : 0;
  const expectedRate = 53.75; // Average of outside zone expected rates

  return {
    bias: Math.round((actualRate - expectedRate) * 10) / 10,
    direction: actualRate > expectedRate ? 'expands' : 'contracts',
    significant: Math.abs(actualRate - expectedRate) > 5,
  };
}

/**
 * Determine accuracy trend across game periods
 */
function getTrend(first, second, third) {
  if (third > second && second > first) return 'improving';
  if (third < second && second < first) return 'declining';
  if (Math.abs(third - first) < 2) return 'consistent';
  return 'variable';
}

/**
 * Aggregate metrics across multiple games
 */
function aggregateGameMetrics(gameAnalyses) {
  if (gameAnalyses.length === 0) return {};

  let totalPitches = 0;
  let totalCalls = 0;
  let totalCorrect = 0;
  let sumAccuracy = 0;
  let sumConsistency = 0;
  let sumHomeFavor = 0;
  let sumAwayFavor = 0;

  for (const game of gameAnalyses) {
    totalPitches += game.summary.total_pitches;
    totalCalls += game.calls.total_calls;
    totalCorrect += game.calls.correct_calls;
    sumAccuracy += game.summary.accuracy;
    sumConsistency += game.summary.consistency_score;
    sumHomeFavor += game.favor.home_favor_score;
    sumAwayFavor += game.favor.away_favor_score;
  }

  const gameCount = gameAnalyses.length;
  const avgHomeFavor = sumHomeFavor / gameCount;
  const avgAwayFavor = sumAwayFavor / gameCount;
  const biasDetected = Math.abs(avgHomeFavor - avgAwayFavor) > 3;

  return {
    total_pitches: totalPitches,
    total_calls: totalCalls,
    total_correct: totalCorrect,
    avg_accuracy: Math.round((sumAccuracy / gameCount) * 10) / 10,
    avg_consistency: Math.round((sumConsistency / gameCount) * 10) / 10,
    favor_metrics: {
      avg_home_favor: Math.round(avgHomeFavor * 10) / 10,
      avg_away_favor: Math.round(avgAwayFavor * 10) / 10,
      favor_differential: Math.round((avgHomeFavor - avgAwayFavor) * 10) / 10,
      bias_detected: biasDetected,
    },
  };
}

/**
 * Aggregate zone tendencies across multiple games
 */
function aggregateZoneTendencies(gameAnalyses) {
  const aggregateZones = {
    high_inside: { total: 0, called_strikes: 0 },
    high_middle: { total: 0, called_strikes: 0 },
    high_outside: { total: 0, called_strikes: 0 },
    middle_inside: { total: 0, called_strikes: 0 },
    middle_middle: { total: 0, called_strikes: 0 },
    middle_outside: { total: 0, called_strikes: 0 },
    low_inside: { total: 0, called_strikes: 0 },
    low_middle: { total: 0, called_strikes: 0 },
    low_outside: { total: 0, called_strikes: 0 },
    chase_high: { total: 0, called_strikes: 0 },
    chase_low: { total: 0, called_strikes: 0 },
    chase_inside: { total: 0, called_strikes: 0 },
    chase_outside: { total: 0, called_strikes: 0 },
  };

  for (const game of gameAnalyses) {
    const zones = game.zones.zones;

    for (const zone in zones) {
      if (aggregateZones[zone]) {
        aggregateZones[zone].total += zones[zone].total;
        aggregateZones[zone].called_strikes += zones[zone].called_strikes;
      }
    }
  }

  // Calculate aggregate strike rates
  for (const zone in aggregateZones) {
    const data = aggregateZones[zone];
    data.strike_rate =
      data.total > 0 ? Math.round((data.called_strikes / data.total) * 1000) / 10 : 0;
    data.deviation = data.strike_rate - getExpectedStrikeRate(zone);
  }

  return aggregateZones;
}

/**
 * Generate visual strike zone heat map data
 * Returns grid data suitable for visualization
 */
export function generateStrikeZoneHeatMap(scorecard) {
  const zones = scorecard.zones.zones;

  // 3x3 grid for main strike zone
  const grid = [
    [
      { zone: 'high_inside', rate: zones.high_inside.strike_rate },
      { zone: 'high_middle', rate: zones.high_middle.strike_rate },
      { zone: 'high_outside', rate: zones.high_outside.strike_rate },
    ],
    [
      { zone: 'middle_inside', rate: zones.middle_inside.strike_rate },
      { zone: 'middle_middle', rate: zones.middle_middle.strike_rate },
      { zone: 'middle_outside', rate: zones.middle_outside.strike_rate },
    ],
    [
      { zone: 'low_inside', rate: zones.low_inside.strike_rate },
      { zone: 'low_middle', rate: zones.low_middle.strike_rate },
      { zone: 'low_outside', rate: zones.low_outside.strike_rate },
    ],
  ];

  const chase = {
    high: zones.chase_high.strike_rate,
    low: zones.chase_low.strike_rate,
    inside: zones.chase_inside.strike_rate,
    outside: zones.chase_outside.strike_rate,
  };

  return {
    grid,
    chase,
    legend: {
      min_rate: 0,
      max_rate: 100,
      color_scale: 'red-yellow-green',
    },
  };
}
