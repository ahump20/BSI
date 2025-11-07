/**
 * Blaze Sports Intel - Contest Leaderboard Generator
 *
 * Generates ranked leaderboards for contests with:
 * - Point totals
 * - Rank tracking (current rank, change from previous)
 * - Tiebreaker resolution
 * - Prize distribution calculation
 * - Performance statistics
 */

import { scoreContestEntry, calculateTiebreakerScore } from './scorer.js';

/**
 * Generate leaderboard for a contest
 *
 * @param {Object} contest - Contest configuration
 * @param {Array} entries - Contest entries
 * @param {Array} results - Actual game results
 * @param {Object} options - Generation options (includeStats, maxResults, etc.)
 * @returns {Object} Leaderboard with ranked entries
 */
export async function generateLeaderboard(contest, entries, results, options = {}) {
  const {
    includeStats = true,
    maxResults = 100,
    currentUserId = null
  } = options;

  // Score all entries
  const scoredEntries = [];

  for (const entry of entries) {
    try {
      const scoring = await scoreContestEntry(entry, contest, results);
      const tiebreakerScore = calculateTiebreakerScore(entry, contest, results);

      scoredEntries.push({
        entry_id: entry.entry_id,
        user_id: entry.user_id,
        user_name: entry.user_name || 'Anonymous',
        total_points: scoring.total_points,
        tiebreaker_score: tiebreakerScore,
        scoring_breakdown: scoring.breakdown,
        performance_stats: includeStats ? calculatePerformanceStats(scoring, contest) : null,
        entry_timestamp: entry.created_at
      });

    } catch (error) {
      console.error(`Failed to score entry ${entry.entry_id}:`, error);
    }
  }

  // Sort by points (desc) then tiebreaker (desc)
  scoredEntries.sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }
    return b.tiebreaker_score - a.tiebreaker_score;
  });

  // Assign ranks (handle ties)
  let currentRank = 1;
  let previousPoints = null;
  let previousTiebreaker = null;
  let sameRankCount = 0;

  for (let i = 0; i < scoredEntries.length; i++) {
    const entry = scoredEntries[i];

    // Check if this entry has same score as previous
    if (previousPoints === entry.total_points && previousTiebreaker === entry.tiebreaker_score) {
      entry.rank = currentRank;
      entry.tied = true;
      sameRankCount++;
    } else {
      currentRank += sameRankCount;
      entry.rank = currentRank;
      entry.tied = false;
      sameRankCount = 1;
    }

    // Highlight current user's entry
    if (currentUserId && entry.user_id === currentUserId) {
      entry.is_current_user = true;
    }

    previousPoints = entry.total_points;
    previousTiebreaker = entry.tiebreaker_score;
  }

  // Calculate prize distribution
  const prizeDistribution = calculatePrizeDistribution(contest, scoredEntries);

  // Apply prize amounts to entries
  for (const entry of scoredEntries) {
    const prize = prizeDistribution.find(p => p.entry_id === entry.entry_id);
    if (prize) {
      entry.prize_amount = prize.amount;
      entry.prize_description = prize.description;
    }
  }

  // Limit results
  const topEntries = scoredEntries.slice(0, maxResults);

  // Generate leaderboard statistics
  const stats = generateLeaderboardStats(scoredEntries, contest, results);

  // Find current user's position (if not in top results)
  let currentUserEntry = null;
  if (currentUserId) {
    currentUserEntry = scoredEntries.find(e => e.user_id === currentUserId);
    if (currentUserEntry && currentUserEntry.rank > maxResults) {
      // Include current user's entry even if outside top results
      topEntries.push({
        ...currentUserEntry,
        is_outside_top: true
      });
    }
  }

  return {
    contest_id: contest.contest_id,
    contest_title: contest.title,
    leaderboard: topEntries,
    stats,
    prize_distribution: prizeDistribution.slice(0, 10), // Top 10 prizes
    meta: {
      total_entries: entries.length,
      scored_entries: scoredEntries.length,
      max_possible_points: calculateMaxPossiblePoints(contest, results),
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Calculate performance statistics for an entry
 */
function calculatePerformanceStats(scoring, contest) {
  const stats = {
    correct_picks: 0,
    total_picks: 0,
    accuracy: 0,
    best_pick_points: 0,
    worst_pick_points: 0
  };

  if (!scoring.breakdown || scoring.breakdown.length === 0) {
    return stats;
  }

  stats.correct_picks = scoring.breakdown.filter(b => b.points > 0).length;
  stats.total_picks = scoring.breakdown.length;
  stats.accuracy = stats.total_picks > 0 ? (stats.correct_picks / stats.total_picks) : 0;

  const points = scoring.breakdown.map(b => b.points);
  stats.best_pick_points = Math.max(...points);
  stats.worst_pick_points = Math.min(...points);

  return stats;
}

/**
 * Calculate prize distribution based on contest config and entry count
 */
function calculatePrizeDistribution(contest, scoredEntries) {
  const prizeDistribution = [];

  const totalPrizePool = contest.prize_pool || 0;
  const distributionConfig = contest.prize_distribution || {};

  // Convert percentage distribution to dollar amounts
  const sortedRanks = Object.keys(distributionConfig).map(r => parseInt(r)).sort((a, b) => a - b);

  for (const rank of sortedRanks) {
    const percentage = distributionConfig[rank.toString()];
    const amount = totalPrizePool * percentage;

    // Find entries with this rank (handle ties)
    const entriesAtRank = scoredEntries.filter(e => e.rank === rank);

    if (entriesAtRank.length > 0) {
      // Split prize among tied entries
      const amountPerEntry = amount / entriesAtRank.length;

      for (const entry of entriesAtRank) {
        prizeDistribution.push({
          entry_id: entry.entry_id,
          user_id: entry.user_id,
          rank,
          amount: amountPerEntry,
          description: entriesAtRank.length > 1
            ? `Tied ${rank}${getOrdinalSuffix(rank)} place (split)`
            : `${rank}${getOrdinalSuffix(rank)} place`
        });
      }
    }
  }

  return prizeDistribution;
}

/**
 * Generate overall leaderboard statistics
 */
function generateLeaderboardStats(scoredEntries, contest, results) {
  if (scoredEntries.length === 0) {
    return {
      average_points: 0,
      median_points: 0,
      high_score: 0,
      low_score: 0,
      perfect_entries: 0,
      completion_rate: 0
    };
  }

  const points = scoredEntries.map(e => e.total_points).sort((a, b) => b - a);

  const stats = {
    average_points: points.reduce((sum, p) => sum + p, 0) / points.length,
    median_points: points[Math.floor(points.length / 2)],
    high_score: points[0],
    low_score: points[points.length - 1],
    perfect_entries: 0,
    completion_rate: 0
  };

  // Calculate max possible points
  const maxPossible = calculateMaxPossiblePoints(contest, results);

  // Count perfect entries (100% of max possible)
  stats.perfect_entries = points.filter(p => p === maxPossible).length;

  // Calculate completion rate (entries with at least one pick scored)
  const completedEntries = scoredEntries.filter(e => e.total_points > 0).length;
  stats.completion_rate = scoredEntries.length > 0
    ? (completedEntries / scoredEntries.length)
    : 0;

  return stats;
}

/**
 * Calculate maximum possible points for a contest
 */
function calculateMaxPossiblePoints(contest, results) {
  const config = contest.scoring_config || {};

  switch (contest.contest_type) {
    case 'prediction': {
      const completedGames = results.filter(r => r.status === 'final').length;
      const maxPerGame = config.max_points_per_game || 15;
      return completedGames * maxPerGame;
    }

    case 'bracket': {
      // Sum of all round points
      return (config.round_1 || 10) * 32 +
             (config.round_2 || 20) * 16 +
             (config.round_3 || 40) * 8 +
             (config.round_4 || 80) * 4 +
             (config.round_5 || 160) * 2 +
             (config.round_6 || 320) * 1;
    }

    case 'props': {
      const settledProps = results.filter(r => r.settled).length;
      const maxConfidence = config.max_confidence || 5;
      const basePoints = config.correct_prop || 10;
      return settledProps * basePoints * maxConfidence;
    }

    case 'survivor': {
      const totalWeeks = Math.max(...results.map(r => r.week || 1));
      return (config.weekly_bonus || 10) * totalWeeks + (config.survival_bonus || 100);
    }

    case 'confidence': {
      const completedGames = results.filter(r => r.status === 'final').length;
      // Sum of 1+2+3+...+n = n*(n+1)/2
      return (completedGames * (completedGames + 1)) / 2;
    }

    default:
      return 0;
  }
}

/**
 * Get ordinal suffix for rank (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(rank) {
  const lastDigit = rank % 10;
  const lastTwoDigits = rank % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }

  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Get rank movement indicator
 * (For showing change from previous leaderboard update)
 */
export function calculateRankMovement(currentLeaderboard, previousLeaderboard) {
  const movements = [];

  for (const currentEntry of currentLeaderboard) {
    const previousEntry = previousLeaderboard.find(e => e.entry_id === currentEntry.entry_id);

    if (!previousEntry) {
      movements.push({
        entry_id: currentEntry.entry_id,
        movement: 'new',
        rank_change: 0,
        points_gained: currentEntry.total_points
      });
    } else {
      const rankChange = previousEntry.rank - currentEntry.rank;
      const pointsGained = currentEntry.total_points - previousEntry.total_points;

      movements.push({
        entry_id: currentEntry.entry_id,
        movement: rankChange > 0 ? 'up' : rankChange < 0 ? 'down' : 'same',
        rank_change: Math.abs(rankChange),
        points_gained: pointsGained
      });
    }
  }

  return movements;
}

/**
 * Generate leaderboard snapshot for historical tracking
 */
export function createLeaderboardSnapshot(leaderboard, timestamp = null) {
  return {
    snapshot_id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contest_id: leaderboard.contest_id,
    timestamp: timestamp || new Date().toISOString(),
    entries: leaderboard.leaderboard.map(entry => ({
      entry_id: entry.entry_id,
      rank: entry.rank,
      total_points: entry.total_points,
      tiebreaker_score: entry.tiebreaker_score
    })),
    stats: leaderboard.stats
  };
}
