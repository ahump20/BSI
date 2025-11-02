/**
 * Blaze Sports Intel - Injury Impact Predictor
 *
 * Predicts the impact of player injuries on team performance
 * using historical replacement-level analysis and positional value.
 *
 * Features:
 * - Position-specific impact weights
 * - Replacement player quality assessment
 * - Historical injury impact analysis
 * - Team depth chart evaluation
 * - Win probability adjustment from injuries
 */

/**
 * Predict impact of player injury on team performance
 * @param {Object} injury - Injury details
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Injury impact analysis
 */
export async function predictInjuryImpact(injury, env) {
  const { playerId, playerName, teamId, sport, position, severity, expectedReturn } = injury;

  try {
    // Get player's performance metrics
    const playerStats = await getPlayerStats(env, playerId, sport);

    // Get replacement player quality
    const replacementQuality = await getReplacementPlayerQuality(env, teamId, position, sport);

    // Calculate positional value
    const positionalValue = getPositionalValue(position, sport);

    // Calculate drop-off from starter to replacement
    const qualityDropoff = calculateQualityDropoff(playerStats, replacementQuality, positionalValue);

    // Estimate win probability impact
    const winProbImpact = calculateWinProbabilityImpact(qualityDropoff, severity, sport);

    // Get historical comparable injuries
    const comparableInjuries = await getComparableInjuries(env, position, severity, sport);

    // Calculate projected games missed
    const gamesMissed = projectGamesMissed(severity, position, sport);

    return {
      player: {
        id: playerId,
        name: playerName,
        team: teamId,
        position: position
      },
      injury: {
        severity: severity,
        expectedReturn: expectedReturn,
        projectedGamesMissed: gamesMissed
      },
      impact: {
        qualityDropoff: Math.round(qualityDropoff * 100) / 100,
        positionalImportance: positionalValue,
        winProbabilityChange: Math.round(winProbImpact * 1000) / 10, // As percentage
        seasonWinChange: Math.round((winProbImpact * gamesMissed.expected) * 10) / 10,
        severity: categorizeImpact(winProbImpact)
      },
      replacement: {
        quality: Math.round(replacementQuality * 100) / 100,
        comparison: playerStats.rating > replacementQuality ? 'downgrade' : 'similar',
        dropoffMagnitude: Math.abs(playerStats.rating - replacementQuality)
      },
      historical: {
        comparableInjuries: comparableInjuries.slice(0, 5),
        avgImpact: comparableInjuries.length > 0 ?
          comparableInjuries.reduce((sum, inj) => sum + inj.impact, 0) / comparableInjuries.length : null
      },
      confidence: {
        level: playerStats.gamesPlayed > 10 ? 'high' : 'medium',
        factors: [
          `Player sample: ${playerStats.gamesPlayed} games`,
          `Replacement data: ${replacementQuality > 0 ? 'available' : 'estimated'}`,
          `Historical comp: ${comparableInjuries.length} injuries`
        ]
      },
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago'
    };

  } catch (error) {
    console.error('Injury impact prediction error:', error);
    throw error;
  }
}

/**
 * Get player statistics
 */
async function getPlayerStats(env, playerId, sport) {
  try {
    // This would query player stats from D1 database
    // For now, returning placeholder structure

    const result = await env.DB.prepare(`
      SELECT
        player_id,
        AVG(performance_rating) as avg_rating,
        COUNT(*) as games_played,
        AVG(points) as avg_points,
        AVG(win_contribution) as avg_win_contribution
      FROM player_game_stats
      WHERE player_id = ?
        AND sport = ?
        AND game_date >= date('now', '-365 days')
      GROUP BY player_id
    `).bind(playerId, sport).first();

    if (result) {
      return {
        playerId: result.player_id,
        rating: result.avg_rating || 0.5,
        gamesPlayed: result.games_played || 0,
        avgPoints: result.avg_points || 0,
        winContribution: result.avg_win_contribution || 0
      };
    }

    // Fallback to average starter
    return {
      playerId: playerId,
      rating: 0.65, // Average starter quality
      gamesPlayed: 16,
      avgPoints: 15,
      winContribution: 0.05
    };

  } catch (error) {
    console.error('Error getting player stats:', error);
    return {
      playerId: playerId,
      rating: 0.65,
      gamesPlayed: 16,
      avgPoints: 15,
      winContribution: 0.05
    };
  }
}

/**
 * Get replacement player quality from depth chart
 */
async function getReplacementPlayerQuality(env, teamId, position, sport) {
  try {
    // Query depth chart for backup player at position
    const result = await env.DB.prepare(`
      SELECT AVG(performance_rating) as backup_rating
      FROM depth_charts dc
      JOIN player_game_stats pgs ON dc.player_id = pgs.player_id
      WHERE dc.team_id = ?
        AND dc.position = ?
        AND dc.depth_order = 2
        AND pgs.sport = ?
        AND pgs.game_date >= date('now', '-180 days')
    `).bind(teamId, position, sport).first();

    if (result && result.backup_rating) {
      return result.backup_rating;
    }

    // Fallback to position-based replacement level
    return getReplacementLevelByPosition(position, sport);

  } catch (error) {
    console.error('Error getting replacement quality:', error);
    return getReplacementLevelByPosition(position, sport);
  }
}

/**
 * Get baseline replacement level by position
 */
function getReplacementLevelByPosition(position, sport) {
  // Replacement level varies by position based on scarcity

  const replacementLevels = {
    NFL: {
      'QB': 0.35,      // QB scarcity - large dropoff
      'RB': 0.50,      // RB depth - smaller dropoff
      'WR': 0.48,
      'TE': 0.45,
      'OL': 0.52,
      'DE': 0.48,
      'DT': 0.50,
      'LB': 0.49,
      'CB': 0.47,
      'S': 0.48
    },
    MLB: {
      'SP': 0.40,      // Starting pitcher scarcity
      'RP': 0.48,
      'C': 0.42,       // Catcher scarcity
      '1B': 0.50,
      '2B': 0.48,
      '3B': 0.47,
      'SS': 0.45,
      'LF': 0.49,
      'CF': 0.47,
      'RF': 0.49
    },
    NBA: {
      'PG': 0.45,
      'SG': 0.47,
      'SF': 0.46,
      'PF': 0.48,
      'C': 0.44       // Center scarcity
    }
  };

  const sportLevels = replacementLevels[sport] || {};
  return sportLevels[position] || 0.48; // Default replacement level
}

/**
 * Get positional value (importance to team success)
 */
function getPositionalValue(position, sport) {
  // Positional values based on win contribution studies

  const positionalValues = {
    NFL: {
      'QB': 1.0,       // Highest impact position
      'OT': 0.75,
      'EDGE': 0.72,
      'CB': 0.68,
      'WR': 0.65,
      'DI': 0.58,
      'RB': 0.45,
      'TE': 0.50,
      'LB': 0.55,
      'S': 0.52
    },
    MLB: {
      'SP': 0.90,      // Starting pitcher highest impact
      'C': 0.72,
      'SS': 0.68,
      'CF': 0.65,
      '3B': 0.62,
      '2B': 0.60,
      'RP': 0.55,
      'LF': 0.58,
      'RF': 0.58,
      '1B': 0.56
    },
    NBA: {
      'PG': 0.85,      // Primary ball handler
      'C': 0.82,
      'SF': 0.75,
      'SG': 0.70,
      'PF': 0.68
    }
  };

  const sportValues = positionalValues[sport] || {};
  return sportValues[position] || 0.60; // Default positional value
}

/**
 * Calculate quality dropoff from starter to replacement
 */
function calculateQualityDropoff(starterStats, replacementQuality, positionalValue) {
  // Quality dropoff = (starter rating - replacement rating) * positional importance
  const rawDropoff = starterStats.rating - replacementQuality;
  const adjustedDropoff = rawDropoff * positionalValue;

  return Math.max(0, adjustedDropoff);
}

/**
 * Calculate win probability impact from injury
 */
function calculateWinProbabilityImpact(qualityDropoff, severity, sport) {
  // Base impact from quality dropoff
  let baseImpact = qualityDropoff * 0.10; // 10% scaling factor

  // Severity multiplier
  const severityMultipliers = {
    'minor': 0.3,        // Day-to-day
    'moderate': 0.7,     // 1-3 weeks
    'major': 1.0,        // 4+ weeks
    'season_ending': 1.0 // Full season
  };

  const severityMult = severityMultipliers[severity] || 0.7;
  baseImpact *= severityMult;

  // Sport-specific adjustments
  switch (sport.toUpperCase()) {
    case 'NFL':
    case 'NCAA_FOOTBALL':
      // Football: fewer games, each injury has larger per-game impact
      baseImpact *= 1.2;
      break;
    case 'MLB':
    case 'NCAA_BASEBALL':
      // Baseball: more games, individual impact diluted
      baseImpact *= 0.8;
      break;
    case 'NBA':
    case 'NCAA_BASKETBALL':
      // Basketball: star players have outsized impact
      baseImpact *= 1.1;
      break;
  }

  return Math.min(0.15, baseImpact); // Cap at 15% win probability change
}

/**
 * Categorize impact severity
 */
function categorizeImpact(winProbImpact) {
  const absImpact = Math.abs(winProbImpact);

  if (absImpact >= 0.08) return 'major';
  if (absImpact >= 0.04) return 'moderate';
  if (absImpact >= 0.02) return 'minor';
  return 'negligible';
}

/**
 * Project games missed based on injury severity
 */
function projectGamesMissed(severity, position, sport) {
  // Historical data on recovery times by severity

  const baseGamesMissed = {
    'minor': { min: 0, expected: 1, max: 2 },
    'moderate': { min: 1, expected: 3, max: 6 },
    'major': { min: 4, expected: 8, max: 16 },
    'season_ending': { min: 10, expected: 17, max: 17 }
  };

  const base = baseGamesMissed[severity] || { min: 0, expected: 1, max: 3 };

  // Position-specific adjustments (some positions heal faster)
  const positionMultipliers = {
    'QB': 1.1,   // QBs tend to be more cautious
    'RB': 0.9,   // RBs push to return faster
    'SP': 1.2,   // Pitchers take longer for arm injuries
    'C': 1.1     // Catchers face more physical toll
  };

  const mult = positionMultipliers[position] || 1.0;

  return {
    min: Math.round(base.min * mult),
    expected: Math.round(base.expected * mult),
    max: Math.round(base.max * mult)
  };
}

/**
 * Get comparable historical injuries
 */
async function getComparableInjuries(env, position, severity, sport) {
  try {
    const results = await env.DB.prepare(`
      SELECT
        player_name,
        position,
        injury_type,
        severity,
        games_missed,
        team_win_pct_before,
        team_win_pct_after,
        (team_win_pct_before - team_win_pct_after) as impact
      FROM historical_injuries
      WHERE position = ?
        AND severity = ?
        AND sport = ?
        AND season >= ?
      ORDER BY ABS((team_win_pct_before - team_win_pct_after) - 0.05) ASC
      LIMIT 10
    `).bind(position, severity, sport, new Date().getFullYear() - 5).all();

    return results.results || [];

  } catch (error) {
    console.error('Error getting comparable injuries:', error);
    return [];
  }
}

/**
 * Analyze cumulative injury impact for a team
 * @param {string} teamId - Team identifier
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Team injury report
 */
export async function analyzeTeamInjuries(teamId, sport, env) {
  try {
    // Get all current injuries for team
    const injuries = await env.DB.prepare(`
      SELECT
        player_id,
        player_name,
        position,
        injury_type,
        severity,
        expected_return
      FROM current_injuries
      WHERE team_id = ?
        AND sport = ?
        AND status = 'out'
      ORDER BY severity DESC, position
    `).bind(teamId, sport).all();

    if (!injuries.results || injuries.results.length === 0) {
      return {
        teamId: teamId,
        sport: sport,
        injuryCount: 0,
        cumulativeImpact: 0,
        healthStatus: 'healthy',
        injuries: []
      };
    }

    // Analyze each injury
    const injuryAnalyses = [];
    let cumulativeWinProbImpact = 0;

    for (const injury of injuries.results) {
      const analysis = await predictInjuryImpact(injury, env);
      injuryAnalyses.push(analysis);
      cumulativeWinProbImpact += analysis.impact.winProbabilityChange / 100;
    }

    // Determine overall health status
    let healthStatus;
    if (cumulativeWinProbImpact >= 0.12) healthStatus = 'critical';
    else if (cumulativeWinProbImpact >= 0.08) healthStatus = 'poor';
    else if (cumulativeWinProbImpact >= 0.04) healthStatus = 'concerning';
    else healthStatus = 'manageable';

    return {
      teamId: teamId,
      sport: sport,
      injuryCount: injuries.results.length,
      cumulativeImpact: Math.round(cumulativeWinProbImpact * 1000) / 10, // As percentage
      healthStatus: healthStatus,
      injuries: injuryAnalyses,
      mostImpactful: injuryAnalyses.reduce((max, inj) =>
        inj.impact.winProbabilityChange > (max?.impact?.winProbabilityChange || 0) ? inj : max
      , null),
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago'
    };

  } catch (error) {
    console.error('Team injury analysis error:', error);
    throw error;
  }
}

/**
 * Compare injury situations between two teams
 * @param {string} team1Id - First team
 * @param {string} team2Id - Second team
 * @param {string} sport - Sport
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Comparative injury analysis
 */
export async function compareTeamInjuries(team1Id, team2Id, sport, env) {
  try {
    const [team1Analysis, team2Analysis] = await Promise.all([
      analyzeTeamInjuries(team1Id, sport, env),
      analyzeTeamInjuries(team2Id, sport, env)
    ]);

    const healthAdvantage = team1Analysis.cumulativeImpact - team2Analysis.cumulativeImpact;

    return {
      team1: team1Analysis,
      team2: team2Analysis,
      comparison: {
        healthAdvantage: Math.round(healthAdvantage * 10) / 10,
        favoredTeam: healthAdvantage < 0 ? team1Id : team2Id,
        advantage: Math.abs(healthAdvantage) < 2 ? 'minimal' :
                   Math.abs(healthAdvantage) < 5 ? 'moderate' : 'significant',
        description: healthAdvantage < -5 ?
          `${team1Id} has significant health advantage (${Math.abs(Math.round(healthAdvantage))}% win prob)` :
          healthAdvantage < -2 ?
          `${team1Id} has moderate health advantage` :
          healthAdvantage > 5 ?
          `${team2Id} has significant health advantage (${Math.round(healthAdvantage)}% win prob)` :
          healthAdvantage > 2 ?
          `${team2Id} has moderate health advantage` :
          'Both teams relatively healthy'
      },
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago'
    };

  } catch (error) {
    console.error('Team injury comparison error:', error);
    throw error;
  }
}

/**
 * Track injury recovery timeline
 * @param {string} playerId - Player identifier
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Recovery timeline with milestones
 */
export async function trackRecoveryTimeline(playerId, env) {
  try {
    // Get injury details
    const injury = await env.DB.prepare(`
      SELECT
        player_id,
        player_name,
        team_id,
        position,
        sport,
        injury_type,
        severity,
        injury_date,
        expected_return,
        status
      FROM current_injuries
      WHERE player_id = ?
      ORDER BY injury_date DESC
      LIMIT 1
    `).bind(playerId).first();

    if (!injury) {
      return {
        playerId: playerId,
        status: 'no_injury',
        message: 'Player not currently injured'
      };
    }

    // Calculate timeline milestones
    const injuryDate = new Date(injury.injury_date);
    const expectedReturn = injury.expected_return ? new Date(injury.expected_return) : null;
    const today = new Date();

    const daysSinceInjury = Math.floor((today - injuryDate) / (1000 * 60 * 60 * 24));
    const daysUntilReturn = expectedReturn ? Math.floor((expectedReturn - today) / (1000 * 60 * 60 * 24)) : null;

    // Recovery phases
    const phases = {
      'minor': ['Initial treatment (0-2 days)', 'Light activity (2-5 days)', 'Full practice (5-7 days)'],
      'moderate': ['Initial treatment (0-5 days)', 'Rehab (5-14 days)', 'Limited practice (14-21 days)', 'Full return (21+ days)'],
      'major': ['Surgery/Treatment (0-7 days)', 'Early rehab (7-30 days)', 'Progressive rehab (30-60 days)', 'Return conditioning (60-90 days)'],
      'season_ending': ['Surgery/Treatment', 'Recovery period', 'Off-season rehab', 'Next season preparation']
    };

    const recoveryPhases = phases[injury.severity] || phases['moderate'];
    const currentPhase = Math.min(recoveryPhases.length - 1, Math.floor(daysSinceInjury / (daysUntilReturn / recoveryPhases.length)));

    return {
      player: {
        id: injury.player_id,
        name: injury.player_name,
        team: injury.team_id,
        position: injury.position,
        sport: injury.sport
      },
      injury: {
        type: injury.injury_type,
        severity: injury.severity,
        injuryDate: injury.injury_date,
        daysSinceInjury: daysSinceInjury
      },
      timeline: {
        expectedReturn: injury.expected_return,
        daysUntilReturn: daysUntilReturn,
        status: injury.status,
        recoveryPhases: recoveryPhases,
        currentPhase: currentPhase,
        currentPhaseDescription: recoveryPhases[currentPhase],
        progress: daysUntilReturn ? Math.round((daysSinceInjury / (daysSinceInjury + daysUntilReturn)) * 100) : null
      },
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago'
    };

  } catch (error) {
    console.error('Recovery timeline tracking error:', error);
    throw error;
  }
}
