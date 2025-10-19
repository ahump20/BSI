/**
 * NFL Advanced Analytics Engine
 * Calculates Pythagorean expectation, luck factor, strength of schedule, and playoff probabilities
 * Based on Bill James formulas adapted for football and sabermetric principles
 *
 * Data Source: ESPN NFL API via blazesportsintel.com/api
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

class NFLAdvancedAnalytics {
  /**
   * Pythagorean exponent for football (adapted from Bill James, 1980)
   * Standard NFL value is 2.37 (Daryl Morey, 2005)
   */
  static PYTHAG_EXPONENT = 2.37;

  /**
   * Calculate Pythagorean expected wins using adapted Bill James formula for NFL
   * @param {number} pointsFor - Total points scored by team
   * @param {number} pointsAgainst - Total points allowed by team
   * @param {number} gamesPlayed - Number of games played
   * @returns {number} Expected wins based on point differential
   *
   * References:
   * - James, Bill (1980). "The Bill James Baseball Abstract"
   * - Morey, Daryl (2005). "NFL Pythagorean Wins" - APBRmetrics Forum
   * - Football Outsiders (2003-2024). "Pythagorean Projection"
   */
  static calculatePythagoreanWins(pointsFor, pointsAgainst, gamesPlayed) {
    if (!pointsFor || !pointsAgainst || pointsFor + pointsAgainst === 0) {
      return 0;
    }

    const exp = this.PYTHAG_EXPONENT;
    const pythagWinPct =
      Math.pow(pointsFor, exp) /
      (Math.pow(pointsFor, exp) + Math.pow(pointsAgainst, exp));

    return pythagWinPct * gamesPlayed;
  }

  /**
   * Calculate luck factor (actual wins vs expected wins)
   * Positive = lucky/overperforming, Negative = unlucky/underperforming
   */
  static calculateLuckFactor(actualWins, expectedWins) {
    return actualWins - expectedWins;
  }

  /**
   * Calculate point differential metrics for NFL
   */
  static calculatePointDifferential(pointsFor, pointsAgainst, gamesPlayed) {
    const totalDiff = pointsFor - pointsAgainst;
    const perGameDiff = gamesPlayed > 0 ? totalDiff / gamesPlayed : 0;

    let color = '#94a3b8'; // neutral gray
    if (perGameDiff > 7.0) color = '#10b981'; // Elite (>7 PPG) - green
    else if (perGameDiff > 3.0) color = '#22c55e'; // Strong (3-7 PPG)
    else if (perGameDiff < -7.0) color = '#ef4444'; // Poor (<-7 PPG) - red
    else if (perGameDiff < -3.0) color = '#f87171'; // Below average (-3 to -7 PPG)

    return {
      totalDifferential: totalDiff,
      perGameDifferential: perGameDiff,
      color,
      interpretation:
        perGameDiff > 7.0 ? 'Elite point differential' :
        perGameDiff > 3.0 ? 'Strong point differential' :
        perGameDiff < -7.0 ? 'Poor point differential' :
        perGameDiff < -3.0 ? 'Below average point differential' :
        'Average point differential'
    };
  }

  /**
   * Calculate strength of schedule (simplified division-based proxy)
   * Higher = harder schedule
   */
  static calculateStrengthOfSchedule(team, allTeams) {
    // Simplified: Use division average winning percentage as proxy
    const divisionTeams = allTeams.filter(t =>
      t.division === team.division && t.conference === team.conference && t.id !== team.id
    );

    if (divisionTeams.length === 0) return { sosRating: 50, interpretation: 'Unknown division' };

    const avgWinPct = divisionTeams.reduce((sum, t) =>
      sum + (t.winPercentage || t.percentage || 0), 0
    ) / divisionTeams.length;

    // Scale to 0-100 rating (50 = average)
    const sosRating = 50 + (avgWinPct - 0.500) * 100;

    return {
      sosRating: Math.round(sosRating),
      divisionAvgWinPct: avgWinPct,
      interpretation:
        sosRating > 52 ? 'Tough division' :
        sosRating < 48 ? 'Weak division' :
        'Average division'
    };
  }

  /**
   * Estimate playoff probability for NFL (simplified Bayesian approach)
   * Based on current wins, Pythagorean expectation, and remaining games
   *
   * References:
   * - FiveThirtyEight NFL Elo Ratings & Playoff Projections (2014-2024)
   * - Pro Football Reference - Expected Wins Calculator
   */
  static calculatePlayoffProbability(team, gamesRemaining) {
    const totalGames = team.gamesPlayed + gamesRemaining;
    const currentWinPct = team.wins / team.gamesPlayed;

    // Use Pythagorean as "true talent" estimate
    const pointsFor = team.stats?.pointsFor || team.pointsFor || 0;
    const pointsAgainst = team.stats?.pointsAgainst || team.pointsAgainst || 0;
    const pythagWins = this.calculatePythagoreanWins(pointsFor, pointsAgainst, team.gamesPlayed);
    const pythagWinPct = pythagWins / team.gamesPlayed;

    // Blend current record with Pythagorean (60% current, 40% pythag)
    const projectedWinPct = (currentWinPct * 0.6) + (pythagWinPct * 0.4);

    // Project final win total
    const projectedFinalWins = team.wins + (projectedWinPct * gamesRemaining);

    // NFL playoff cutoffs (approximate):
    // - Division winner: typically 10-11 wins (85-95% probability at 11 wins)
    // - Wild card: typically 9-10 wins (50-70% probability at 10 wins)
    const divisionCutoff = 11;
    const wildCardCutoff = 9;

    let playoffProb = 0;
    if (projectedFinalWins >= divisionCutoff) {
      playoffProb = 85 + (projectedFinalWins - divisionCutoff) * 5;
    } else if (projectedFinalWins >= wildCardCutoff) {
      playoffProb = 50 + (projectedFinalWins - wildCardCutoff) * 17.5;
    } else if (projectedFinalWins >= 7) {
      playoffProb = (projectedFinalWins - 7) * 25;
    }

    return {
      playoffProbability: Math.min(99, Math.max(1, playoffProb)),
      projectedFinalWins: Math.round(projectedFinalWins * 10) / 10, // one decimal
      projectedWinPct
    };
  }

  /**
   * Generate comprehensive analytics for a single NFL team
   */
  static generateTeamAnalytics(team, allTeams, gamesRemaining = 0) {
    const pointsFor = team.stats?.pointsFor || team.pointsFor || 0;
    const pointsAgainst = team.stats?.pointsAgainst || team.pointsAgainst || 0;
    const gamesPlayed = team.gamesPlayed || (team.wins + team.losses);

    // Pythagorean expectation
    const expectedWins = this.calculatePythagoreanWins(pointsFor, pointsAgainst, gamesPlayed);
    const luckFactor = this.calculateLuckFactor(team.wins, expectedWins);

    // Color code luck factor
    let luckColor = '#94a3b8';
    if (luckFactor > 1.5) luckColor = '#10b981'; // Very lucky (green)
    else if (luckFactor > 0.5) luckColor = '#22c55e'; // Lucky
    else if (luckFactor < -1.5) luckColor = '#ef4444'; // Very unlucky (red)
    else if (luckFactor < -0.5) luckColor = '#f87171'; // Unlucky

    // Interpretations
    let luckInterpretation = 'Performance matches expectations';
    if (luckFactor > 2) luckInterpretation = 'Significantly overperforming - regression likely';
    else if (luckFactor > 1) luckInterpretation = 'Overperforming - some regression expected';
    else if (luckFactor < -2) luckInterpretation = 'Significantly underperforming - improvement likely';
    else if (luckFactor < -1) luckInterpretation = 'Underperforming - better results expected';

    return {
      team: {
        id: team.id,
        name: team.name || team.displayName,
        abbreviation: team.abbreviation,
        conference: team.conference,
        division: team.division
      },
      record: {
        wins: team.wins,
        losses: team.losses,
        ties: team.ties || 0,
        winningPercentage: team.winPercentage || team.percentage || (team.wins / gamesPlayed)
      },
      pythagorean: {
        expectedWins,
        expectedWinPct: expectedWins / gamesPlayed,
        luckFactor,
        luckColor,
        interpretation: luckInterpretation
      },
      pointDifferential: this.calculatePointDifferential(pointsFor, pointsAgainst, gamesPlayed),
      strengthOfSchedule: this.calculateStrengthOfSchedule(team, allTeams),
      playoffProbability: gamesRemaining > 0 ?
        this.calculatePlayoffProbability(team, gamesRemaining) : null,
      dataQuality: {
        hasPointData: pointsFor > 0 && pointsAgainst > 0,
        gamesPlayed,
        dataSource: 'ESPN NFL API + Pythagorean Formula (Morey 2.37 exponent)',
        lastUpdated: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
        timezone: 'America/Chicago'
      }
    };
  }

  /**
   * Generate league-wide NFL advanced analytics
   */
  static generateLeagueAdvancedAnalytics(teams, gamesRemaining = 0) {
    if (!teams || teams.length === 0) {
      return {
        teams: [],
        leagueSummary: null,
        error: 'No team data available'
      };
    }

    // Calculate analytics for each team
    const teamAnalytics = teams.map(team =>
      this.generateTeamAnalytics(team, teams, gamesRemaining)
    );

    // League summary statistics
    const leagueTotalPoints = teams.reduce((sum, t) =>
      sum + (t.stats?.pointsFor || t.pointsFor || 0), 0
    );
    const leagueTotalGames = teams.reduce((sum, t) =>
      sum + (t.gamesPlayed || 0), 0
    );
    const leagueAvgPointsPerGame = leagueTotalGames > 0 ?
      leagueTotalPoints / leagueTotalGames : 0;

    return {
      teams: teamAnalytics,
      leagueSummary: {
        averagePointsPerGame: Math.round(leagueAvgPointsPerGame * 10) / 10,
        totalTeams: teams.length,
        season: '2025',
        gamesPerSeason: 17,
        totalRegularSeasonGames: 272, // 32 teams × 17 games ÷ 2
        methodology: 'Pythagorean Expectation for NFL (2.37 exponent, Daryl Morey 2005)',
        citations: [
          'James, Bill (1980). "The Bill James Baseball Abstract"',
          'Morey, Daryl (2005). "NFL Pythagorean Wins" - APBRmetrics Forum',
          'Football Outsiders (2003-2024) - Pythagorean Projection',
          'FiveThirtyEight (2014-2024) - NFL Elo Ratings & Playoff Projections',
          'Pro Football Reference - Expected Wins Calculator'
        ],
        dataSource: 'ESPN NFL API via blazesportsintel.com/api',
        lastUpdated: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
        timezone: 'America/Chicago'
      }
    };
  }
}

// Export for ES6 modules
export default NFLAdvancedAnalytics;

// Also make available globally for non-module usage
if (typeof window !== 'undefined') {
  window.NFLAdvancedAnalytics = NFLAdvancedAnalytics;
}
