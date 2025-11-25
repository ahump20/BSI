/**
 * Blaze Sports Intel - Contest Scoring Algorithms
 *
 * Scoring logic for different contest types:
 * - prediction: Score based on correct winners and score accuracy
 * - bracket: Tournament bracket scoring with increasing points per round
 * - props: Prop bet style scoring with confidence multipliers
 * - survivor: Survival-based scoring with weekly bonuses
 * - confidence: Confidence pool scoring with point rankings
 */

/**
 * Score a contest entry based on contest type and actual results
 *
 * @param {Object} entry - Contest entry with user's picks
 * @param {Object} contest - Contest configuration
 * @param {Array} results - Actual game results
 * @returns {Object} Scoring breakdown with total points
 */
export async function scoreContestEntry(entry, contest, results) {
  const scoringConfig = contest.scoring_config || {};

  switch (contest.contest_type) {
    case 'prediction':
      return scorePredictionEntry(entry, results, scoringConfig);

    case 'bracket':
      return scoreBracketEntry(entry, results, scoringConfig);

    case 'props':
      return scorePropsEntry(entry, results, scoringConfig);

    case 'survivor':
      return scoreSurvivorEntry(entry, results, scoringConfig);

    case 'confidence':
      return scoreConfidenceEntry(entry, results, scoringConfig);

    default:
      throw new Error(`Unknown contest type: ${contest.contest_type}`);
  }
}

/**
 * Score prediction contest entry
 * Points for correct winner + bonus for exact/close score
 */
function scorePredictionEntry(entry, results, config) {
  const picks = JSON.parse(entry.picks || '{}');
  let totalPoints = 0;
  const breakdown = [];

  const pointsCorrectWinner = config.correct_winner || 10;
  const pointsCorrectScore = config.correct_score || 5;
  const pointsCloseScore = config.close_score_bonus || 2;

  for (const [gameId, pick] of Object.entries(picks)) {
    const result = results.find((r) => r.game_id === gameId);
    if (!result || result.status !== 'final') continue;

    let gamePoints = 0;
    const reasons = [];

    // Check if winner prediction correct
    const predictedWinner = pick.predicted_winner;
    const actualWinner =
      result.home_score > result.away_score ? result.home_team_id : result.away_team_id;

    if (predictedWinner === actualWinner) {
      gamePoints += pointsCorrectWinner;
      reasons.push(`Correct winner (+${pointsCorrectWinner})`);

      // Check score prediction accuracy
      if (pick.predicted_home_score && pick.predicted_away_score) {
        const predictedHome = parseInt(pick.predicted_home_score);
        const predictedAway = parseInt(pick.predicted_away_score);
        const actualHome = result.home_score;
        const actualAway = result.away_score;

        // Exact score match
        if (predictedHome === actualHome && predictedAway === actualAway) {
          gamePoints += pointsCorrectScore;
          reasons.push(`Exact score (+${pointsCorrectScore})`);
        }
        // Close score (within 3 points for each team)
        else if (
          Math.abs(predictedHome - actualHome) <= 3 &&
          Math.abs(predictedAway - actualAway) <= 3
        ) {
          gamePoints += pointsCloseScore;
          reasons.push(`Close score (+${pointsCloseScore})`);
        }
      }
    }

    if (gamePoints > 0) {
      breakdown.push({
        game_id: gameId,
        points: gamePoints,
        reasons,
      });
      totalPoints += gamePoints;
    }
  }

  return {
    total_points: totalPoints,
    games_scored: breakdown.length,
    breakdown,
  };
}

/**
 * Score bracket contest entry
 * Increasing points per round (10, 20, 40, 80, 160, 320)
 */
function scoreBracketEntry(entry, results, config) {
  const picks = JSON.parse(entry.picks || '{}');
  let totalPoints = 0;
  const breakdown = [];

  // Round points (doubling each round)
  const roundPoints = {
    1: config.round_1 || 10,
    2: config.round_2 || 20,
    3: config.round_3 || 40,
    4: config.round_4 || 80,
    5: config.round_5 || 160,
    6: config.round_6 || 320,
  };

  for (const [matchupId, pick] of Object.entries(picks)) {
    const result = results.find((r) => r.game_id === matchupId);
    if (!result || result.status !== 'final') continue;

    const round = result.round || 1;
    const pointsForRound = roundPoints[round] || 10;

    // Check if prediction correct
    const predictedWinner = pick.predicted_winner;
    const actualWinner =
      result.home_score > result.away_score ? result.home_team_id : result.away_team_id;

    if (predictedWinner === actualWinner) {
      breakdown.push({
        matchup_id: matchupId,
        round,
        points: pointsForRound,
        reason: `Round ${round} correct pick`,
      });
      totalPoints += pointsForRound;
    }
  }

  // Bonus for correct champion
  if (picks.champion && results.champion) {
    if (picks.champion === results.champion) {
      const championBonus = config.champion || 640;
      breakdown.push({
        matchup_id: 'champion',
        round: 'final',
        points: championBonus,
        reason: 'Correct champion prediction',
      });
      totalPoints += championBonus;
    }
  }

  return {
    total_points: totalPoints,
    games_scored: breakdown.length,
    breakdown,
  };
}

/**
 * Score props contest entry
 * Points per correct prop with confidence multiplier
 */
function scorePropsEntry(entry, results, config) {
  const picks = JSON.parse(entry.picks || '{}');
  let totalPoints = 0;
  const breakdown = [];

  const basePoints = config.correct_prop || 10;
  const useConfidence = config.confidence_multiplier || false;

  for (const [propId, pick] of Object.entries(picks)) {
    const result = results.find((r) => r.prop_id === propId);
    if (!result || !result.settled) continue;

    let propPoints = basePoints;

    // Check if prediction correct
    if (pick.prediction === result.outcome) {
      // Apply confidence multiplier if enabled
      if (useConfidence && pick.confidence) {
        const confidenceLevel = parseInt(pick.confidence);
        propPoints = basePoints * confidenceLevel;
      }

      breakdown.push({
        prop_id: propId,
        points: propPoints,
        reason: useConfidence ? `Correct (confidence ${pick.confidence}x)` : 'Correct prediction',
      });

      totalPoints += propPoints;
    }
  }

  return {
    total_points: totalPoints,
    props_scored: breakdown.length,
    breakdown,
  };
}

/**
 * Score survivor contest entry
 * Points for each week survived + elimination penalty
 */
function scoreSurvivorEntry(entry, results, config) {
  const picks = JSON.parse(entry.picks || '{}');
  let totalPoints = 0;
  const breakdown = [];

  const weeklyBonus = config.weekly_bonus || 10;
  const survivalBonus = config.survival_bonus || 100;
  const eliminationPenalty = config.early_elimination_penalty || -50;

  let eliminated = false;
  let eliminatedWeek = null;
  let weeksAlive = 0;

  // Process picks in week order
  const sortedWeeks = Object.keys(picks).sort((a, b) => parseInt(a) - parseInt(b));

  for (const week of sortedWeeks) {
    const pick = picks[week];
    const result = results.find((r) => r.game_id === pick.game_id);

    if (!result || result.status !== 'final') continue;

    const pickedTeam = pick.team_id;
    const actualWinner =
      result.home_score > result.away_score ? result.home_team_id : result.away_team_id;

    if (pickedTeam === actualWinner) {
      // Survived this week
      weeksAlive++;
      const weekPoints = weeklyBonus;

      breakdown.push({
        week,
        points: weekPoints,
        reason: `Survived week ${week}`,
      });

      totalPoints += weekPoints;
    } else {
      // Eliminated
      eliminated = true;
      eliminatedWeek = week;

      breakdown.push({
        week,
        points: eliminationPenalty,
        reason: `Eliminated in week ${week}`,
      });

      totalPoints += eliminationPenalty;
      break;
    }
  }

  // Add survival bonus if still alive
  if (!eliminated) {
    breakdown.push({
      week: 'final',
      points: survivalBonus,
      reason: 'Survived entire contest',
    });
    totalPoints += survivalBonus;
  }

  return {
    total_points: totalPoints,
    weeks_survived: weeksAlive,
    eliminated,
    eliminated_week: eliminatedWeek,
    breakdown,
  };
}

/**
 * Score confidence contest entry
 * Points = confidence level for each correct pick
 */
function scoreConfidenceEntry(entry, results, config) {
  const picks = JSON.parse(entry.picks || '{}');
  let totalPoints = 0;
  const breakdown = [];

  for (const [gameId, pick] of Object.entries(picks)) {
    const result = results.find((r) => r.game_id === gameId);
    if (!result || result.status !== 'final') continue;

    // Check if prediction correct
    const predictedWinner = pick.predicted_winner;
    const actualWinner =
      result.home_score > result.away_score ? result.home_team_id : result.away_team_id;

    if (predictedWinner === actualWinner) {
      const confidencePoints = parseInt(pick.confidence || 1);

      breakdown.push({
        game_id: gameId,
        points: confidencePoints,
        reason: `Correct (confidence ${confidencePoints})`,
      });

      totalPoints += confidencePoints;
    }
  }

  return {
    total_points: totalPoints,
    correct_picks: breakdown.length,
    breakdown,
  };
}

/**
 * Calculate tiebreaker score for entries with same points
 *
 * @param {Object} entry - Contest entry
 * @param {Object} contest - Contest configuration
 * @param {Array} results - Actual results
 * @returns {number} Tiebreaker score (higher = better)
 */
export function calculateTiebreakerScore(entry, contest, results) {
  const rules = contest.rules || {};
  const tiebreakerType = rules.tiebreaker;

  switch (tiebreakerType) {
    case 'total_points_scored':
      return calculateTotalPointsTiebreaker(entry, results);

    case 'champion_seed_sum':
      return calculateChampionSeedTiebreaker(entry, results);

    case 'entry_timestamp':
      return calculateEntryTimeTiebreaker(entry);

    case 'perfect_weeks':
      return calculatePerfectWeeksTiebreaker(entry, results);

    default:
      return 0;
  }
}

/**
 * Total points scored tiebreaker
 * (Closest to actual total points in all games)
 */
function calculateTotalPointsTiebreaker(entry, results) {
  const picks = JSON.parse(entry.picks || '{}');

  let predictedTotal = 0;
  let actualTotal = 0;

  for (const result of results) {
    if (result.status !== 'final') continue;

    actualTotal += result.home_score + result.away_score;

    const pick = picks[result.game_id];
    if (pick && pick.predicted_home_score && pick.predicted_away_score) {
      predictedTotal += parseInt(pick.predicted_home_score) + parseInt(pick.predicted_away_score);
    }
  }

  // Return inverse of difference (lower difference = higher score)
  const difference = Math.abs(predictedTotal - actualTotal);
  return 10000 - difference;
}

/**
 * Champion seed sum tiebreaker
 * (Lower seed sum of final four picks = better)
 */
function calculateChampionSeedTiebreaker(entry, results) {
  const picks = JSON.parse(entry.picks || '{}');

  let seedSum = 0;

  // Get seeds of final four teams picked
  if (picks.final_four) {
    for (const teamId of picks.final_four) {
      const teamSeed = results.seeds?.[teamId] || 16;
      seedSum += teamSeed;
    }
  }

  // Return inverse (lower seed sum = higher score)
  return 100 - seedSum;
}

/**
 * Entry timestamp tiebreaker
 * (Earlier entry = better)
 */
function calculateEntryTimeTiebreaker(entry) {
  const timestamp = new Date(entry.created_at).getTime();
  // Return inverse (earlier = higher score)
  return Number.MAX_SAFE_INTEGER - timestamp;
}

/**
 * Perfect weeks tiebreaker
 * (More weeks with all correct picks = better)
 */
function calculatePerfectWeeksTiebreaker(entry, results) {
  const picks = JSON.parse(entry.picks || '{}');

  // Group results by week
  const resultsByWeek = {};
  for (const result of results) {
    if (result.status !== 'final') continue;
    const week = result.week || 1;
    if (!resultsByWeek[week]) resultsByWeek[week] = [];
    resultsByWeek[week].push(result);
  }

  let perfectWeeks = 0;

  for (const [week, weekResults] of Object.entries(resultsByWeek)) {
    let allCorrect = true;

    for (const result of weekResults) {
      const pick = picks[result.game_id];
      if (!pick) {
        allCorrect = false;
        break;
      }

      const predictedWinner = pick.predicted_winner;
      const actualWinner =
        result.home_score > result.away_score ? result.home_team_id : result.away_team_id;

      if (predictedWinner !== actualWinner) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      perfectWeeks++;
    }
  }

  return perfectWeeks;
}
