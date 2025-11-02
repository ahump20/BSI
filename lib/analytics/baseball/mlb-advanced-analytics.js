/**
 * MLB Advanced Analytics Engine
 * Calculates Pythagorean expectation, luck factor, strength of schedule, and playoff probabilities
 * Based on Bill James formulas and sabermetric principles
 */

class MLBAdvancedAnalytics {
  /**
   * Pythagorean exponent for baseball (Bill James, 1980)
   */
  static PYTHAG_EXPONENT = 1.83;

  /**
   * Calculate Pythagorean expected wins using Bill James formula
   * @param {number} runsScored - Total runs scored by team
   * @param {number} runsAllowed - Total runs allowed by team
   * @param {number} gamesPlayed - Number of games played
   * @returns {number} Expected wins based on run differential
   */
  static calculatePythagoreanWins(runsScored, runsAllowed, gamesPlayed) {
    if (!runsScored || !runsAllowed || runsScored + runsAllowed === 0) {
      return 0;
    }

    const exp = this.PYTHAG_EXPONENT;
    const pythagWinPct =
      Math.pow(runsScored, exp) /
      (Math.pow(runsScored, exp) + Math.pow(runsAllowed, exp));

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
   * Calculate run differential metrics
   */
  static calculateRunDifferential(runsScored, runsAllowed, gamesPlayed) {
    const totalDiff = runsScored - runsAllowed;
    const perGameDiff = gamesPlayed > 0 ? totalDiff / gamesPlayed : 0;

    let color = '#94a3b8'; // neutral gray
    if (perGameDiff > 1.0) color = '#10b981'; // strong positive (green)
    else if (perGameDiff > 0.3) color = '#22c55e'; // moderate positive
    else if (perGameDiff < -1.0) color = '#ef4444'; // strong negative (red)
    else if (perGameDiff < -0.3) color = '#f87171'; // moderate negative

    return {
      totalDifferential: totalDiff,
      perGameDifferential: perGameDiff,
      color,
      interpretation:
        perGameDiff > 1.0 ? 'Elite run differential' :
        perGameDiff > 0.3 ? 'Strong run differential' :
        perGameDiff < -1.0 ? 'Poor run differential' :
        perGameDiff < -0.3 ? 'Below average run differential' :
        'Average run differential'
    };
  }

  /**
   * Calculate strength of schedule (simplified division-based proxy)
   * Higher = harder schedule
   */
  static calculateStrengthOfSchedule(team, allTeams) {
    // Simplified: Use division average winning percentage as proxy
    const divisionTeams = allTeams.filter(t =>
      t.division === team.division && t.id !== team.id
    );

    if (divisionTeams.length === 0) return 50; // neutral

    const avgWinPct = divisionTeams.reduce((sum, t) =>
      sum + (t.percentage || 0), 0
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
   * Estimate playoff probability (simplified Bayesian approach)
   * Based on current wins, Pythagorean expectation, and remaining games
   */
  static calculatePlayoffProbability(team, gamesRemaining) {
    const totalGames = team.gamesPlayed + gamesRemaining;
    const currentWinPct = team.wins / team.gamesPlayed;

    // Use Pythagorean as "true talent" estimate
    const runsScored = team.stats?.runsScored || 0;
    const runsAllowed = team.stats?.runsAllowed || 0;
    const pythagWins = this.calculatePythagoreanWins(runsScored, runsAllowed, team.gamesPlayed);
    const pythagWinPct = pythagWins / team.gamesPlayed;

    // Blend current record with Pythagorean (60% current, 40% pythag)
    const projectedWinPct = (currentWinPct * 0.6) + (pythagWinPct * 0.4);

    // Project final win total
    const projectedFinalWins = team.wins + (projectedWinPct * gamesRemaining);

    // Simplified playoff cutoff (~90 wins for Wild Card, ~95 for Division)
    const wildCardCutoff = 90;
    const divisionCutoff = 95;

    let playoffProb = 0;
    if (projectedFinalWins >= divisionCutoff) {
      playoffProb = 85 + (projectedFinalWins - divisionCutoff) * 3;
    } else if (projectedFinalWins >= wildCardCutoff) {
      playoffProb = 50 + (projectedFinalWins - wildCardCutoff) * 7;
    } else if (projectedFinalWins >= 85) {
      playoffProb = (projectedFinalWins - 85) * 10;
    }

    return {
      playoffProbability: Math.min(99, Math.max(1, playoffProb)),
      projectedFinalWins: Math.round(projectedFinalWins),
      projectedWinPct
    };
  }

  /**
   * Generate comprehensive analytics for a single team
   */
  static generateTeamAnalytics(team, allTeams, gamesRemaining = 0) {
    const runsScored = team.stats?.runsScored || team.runsScored || 0;
    const runsAllowed = team.stats?.runsAllowed || team.runsAllowed || 0;
    const gamesPlayed = team.gamesPlayed || (team.wins + team.losses);

    // Pythagorean expectation
    const expectedWins = this.calculatePythagoreanWins(runsScored, runsAllowed, gamesPlayed);
    const luckFactor = this.calculateLuckFactor(team.wins, expectedWins);

    // Color code luck factor
    let luckColor = '#94a3b8';
    if (luckFactor > 2) luckColor = '#10b981'; // Very lucky (green)
    else if (luckFactor > 0.5) luckColor = '#22c55e'; // Lucky
    else if (luckFactor < -2) luckColor = '#ef4444'; // Very unlucky (red)
    else if (luckFactor < -0.5) luckColor = '#f87171'; // Unlucky

    // Interpretations
    let luckInterpretation = 'Performance matches expectations';
    if (luckFactor > 3) luckInterpretation = 'Significantly overperforming - regression likely';
    else if (luckFactor > 1.5) luckInterpretation = 'Overperforming - some regression expected';
    else if (luckFactor < -3) luckInterpretation = 'Significantly underperforming - improvement likely';
    else if (luckFactor < -1.5) luckInterpretation = 'Underperforming - better results expected';

    return {
      team: {
        id: team.id,
        name: team.name,
        division: team.division
      },
      record: {
        wins: team.wins,
        losses: team.losses,
        winningPercentage: team.percentage || (team.wins / gamesPlayed)
      },
      pythagorean: {
        expectedWins,
        expectedWinPct: expectedWins / gamesPlayed,
        luckFactor,
        luckColor,
        interpretation: luckInterpretation
      },
      runDifferential: this.calculateRunDifferential(runsScored, runsAllowed, gamesPlayed),
      strengthOfSchedule: this.calculateStrengthOfSchedule(team, allTeams),
      playoffProbability: gamesRemaining > 0 ?
        this.calculatePlayoffProbability(team, gamesRemaining) : null,
      dataQuality: {
        hasRunData: runsScored > 0 && runsAllowed > 0,
        gamesPlayed,
        dataSource: 'MLB Stats API + Bill James Pythagorean Formula (1980)'
      }
    };
  }

  /**
   * Generate league-wide advanced analytics
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
    const leagueTotalRuns = teams.reduce((sum, t) =>
      sum + (t.stats?.runsScored || t.runsScored || 0), 0
    );
    const leagueTotalGames = teams.reduce((sum, t) =>
      sum + (t.gamesPlayed || 0), 0
    );
    const leagueAvgRunsPerGame = leagueTotalGames > 0 ?
      leagueTotalRuns / leagueTotalGames : 0;

    return {
      teams: teamAnalytics,
      leagueSummary: {
        averageRunsPerGame: leagueAvgRunsPerGame,
        totalTeams: teams.length,
        season: '2025',
        methodology: 'Bill James Pythagorean Expectation (1.83 exponent)',
        citations: [
          'James, Bill (1980). "The Bill James Baseball Abstract"',
          'Baseball Prospectus - Pythagorean Expectation',
          'FiveThirtyEight - MLB Predictions Methodology'
        ]
      }
    };
  }
}

// Export for ES6 modules
export default MLBAdvancedAnalytics;

// Also make available globally for non-module usage
if (typeof window !== 'undefined') {
  window.MLBAdvancedAnalytics = MLBAdvancedAnalytics;
}
