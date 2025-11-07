/**
 * CFB (College Football) Advanced Analytics Engine
 * Calculates Pythagorean expectation, luck factor, strength of schedule, and College Football Playoff probabilities
 * Based on Bill James formulas adapted for college football and sabermetric principles
 *
 * Data Source: ESPN CFB API via blazesportsintel.com/api
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

class CFBAdvancedAnalytics {
  /**
   * Pythagorean exponent for football (adapted from Bill James, 1980)
   * Standard football value is 2.37 (works for both NFL and CFB)
   */
  static PYTHAG_EXPONENT = 2.37;

  /**
   * Major conference power ratings (for SOS calculations)
   * Based on historical performance and recruiting rankings
   */
  static CONFERENCE_POWER_RATINGS = {
    SEC: 1.0,              // Highest rated conference
    'Big Ten': 0.95,
    ACC: 0.85,
    'Big 12': 0.85,
    'Pac-12': 0.80,
    American: 0.60,
    'Conference USA': 0.45,
    MAC: 0.40,
    'Mountain West': 0.50,
    'Sun Belt': 0.45,
    Independent: 0.70      // Average for independents
  };

  /**
   * Calculate Pythagorean expected wins using adapted Bill James formula for CFB
   * @param {number} pointsFor - Total points scored by team
   * @param {number} pointsAgainst - Total points allowed by team
   * @param {number} gamesPlayed - Number of games played
   * @returns {number} Expected wins based on point differential
   *
   * References:
   * - James, Bill (1980). "The Bill James Baseball Abstract"
   * - Fremeau, Brian (2007). "College Football Pythagorean Formula" - BCFToys
   * - Connelly, Bill (2005-2024). "College Football Advanced Stats" - ESPN/SB Nation
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
   * Calculate point differential metrics for CFB
   */
  static calculatePointDifferential(pointsFor, pointsAgainst, gamesPlayed) {
    const totalDiff = pointsFor - pointsAgainst;
    const perGameDiff = gamesPlayed > 0 ? totalDiff / gamesPlayed : 0;

    let color = '#94a3b8'; // neutral gray
    if (perGameDiff > 14.0) color = '#10b981'; // Elite (>14 PPG) - green
    else if (perGameDiff > 7.0) color = '#22c55e'; // Strong (7-14 PPG)
    else if (perGameDiff < -14.0) color = '#ef4444'; // Poor (<-14 PPG) - red
    else if (perGameDiff < -7.0) color = '#f87171'; // Below average (-7 to -14 PPG)

    return {
      totalDifferential: totalDiff,
      perGameDifferential: perGameDiff,
      color,
      interpretation:
        perGameDiff > 14.0 ? 'Elite point differential' :
        perGameDiff > 7.0 ? 'Strong point differential' :
        perGameDiff < -14.0 ? 'Poor point differential' :
        perGameDiff < -7.0 ? 'Below average point differential' :
        'Average point differential'
    };
  }

  /**
   * Calculate conference-weighted strength of schedule for CFB
   * Higher = harder schedule
   */
  static calculateStrengthOfSchedule(team, allTeams) {
    const teamConference = team.conference?.name || team.conference || 'Independent';

    // Get conference power rating
    const conferenceRating = this.CONFERENCE_POWER_RATINGS[teamConference] || 0.70;

    // Calculate opponent average win percentage (if available)
    const conferenceTeams = allTeams.filter(t => {
      const tConf = t.conference?.name || t.conference || 'Independent';
      return tConf === teamConference && t.id !== team.id;
    });

    let avgWinPct = 0.500; // Default
    if (conferenceTeams.length > 0) {
      avgWinPct = conferenceTeams.reduce((sum, t) =>
        sum + (t.winPercentage || t.percentage || 0), 0
      ) / conferenceTeams.length;
    }

    // Combine conference power rating with opponent performance
    // 70% conference rating, 30% opponent win percentage
    const sosRating = 50 + ((conferenceRating - 0.70) * 50 * 0.7) + ((avgWinPct - 0.500) * 100 * 0.3);

    return {
      sosRating: Math.round(sosRating),
      conference: teamConference,
      conferencePowerRating: conferenceRating,
      conferenceAvgWinPct: avgWinPct,
      interpretation:
        sosRating > 60 ? 'Very tough schedule (Power 5 conference)' :
        sosRating > 50 ? 'Above average schedule' :
        sosRating < 40 ? 'Weak schedule (Group of 5 conference)' :
        'Average schedule'
    };
  }

  /**
   * Estimate College Football Playoff probability (simplified approach)
   * Based on current wins, Pythagorean expectation, conference, and remaining games
   *
   * References:
   * - ESPN FPI (Football Power Index) - College Football Playoff Probabilities
   * - FiveThirtyEight College Football Predictions (2014-2024)
   * - Massey-Peabody College Football Ratings
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
    const projectedLosses = Math.max(0, totalGames - projectedFinalWins);

    // Get conference strength multiplier
    const teamConference = team.conference?.name || team.conference || 'Independent';
    const conferencePower = this.CONFERENCE_POWER_RATINGS[teamConference] || 0.70;

    // CFP probability calculation (12-team playoff as of 2024-2025 season)
    // Power 5: Need ~10-2 or better (conference champ or at-large)
    // Group of 5: Need undefeated or 1-loss + conference championship
    let playoffProb = 0;

    if (conferencePower >= 0.80) {
      // Power 5 conference
      if (projectedLosses <= 1) {
        // 0-1 losses: Very high probability (75-95%)
        playoffProb = 95 - (projectedLosses * 20);
      } else if (projectedLosses <= 2) {
        // 2 losses: 40-75% probability
        playoffProb = 75 - ((projectedLosses - 1) * 35);
      } else if (projectedLosses <= 3) {
        // 3 losses: 10-40% probability (need conference championship)
        playoffProb = 40 - ((projectedLosses - 2) * 30);
      } else {
        // 4+ losses: <10% (unlikely at-large bid)
        playoffProb = Math.max(1, 10 - ((projectedLosses - 3) * 5));
      }
    } else {
      // Group of 5 or Independent
      if (projectedLosses === 0) {
        // Undefeated: 60-80% probability
        playoffProb = 70 + (conferencePower * 10);
      } else if (projectedLosses === 1) {
        // 1 loss: 20-40% probability
        playoffProb = 30 + (conferencePower * 10);
      } else {
        // 2+ losses: <10% (very unlikely)
        playoffProb = Math.max(1, 5 / projectedLosses);
      }
    }

    return {
      playoffProbability: Math.min(99, Math.max(1, Math.round(playoffProb))),
      projectedFinalWins: Math.round(projectedFinalWins * 10) / 10,
      projectedFinalLosses: Math.round(projectedLosses * 10) / 10,
      projectedWinPct,
      conferenceStrength: conferencePower,
      playoffFormat: '12-team College Football Playoff (2024-2025 season)'
    };
  }

  /**
   * Generate comprehensive analytics for a single CFB team
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
        conference: team.conference?.name || team.conference || 'Independent',
        division: team.division || null
      },
      record: {
        wins: team.wins,
        losses: team.losses,
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
        dataSource: 'ESPN CFB API + Pythagorean Formula (2.37 exponent)',
        lastUpdated: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
        timezone: 'America/Chicago'
      }
    };
  }

  /**
   * Generate league-wide CFB advanced analytics
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

    // Count teams by conference
    const conferenceDistribution = {};
    teams.forEach(t => {
      const conf = t.conference?.name || t.conference || 'Independent';
      conferenceDistribution[conf] = (conferenceDistribution[conf] || 0) + 1;
    });

    return {
      teams: teamAnalytics,
      leagueSummary: {
        averagePointsPerGame: Math.round(leagueAvgPointsPerGame * 10) / 10,
        totalTeams: teams.length,
        season: '2025',
        fbsTeams: 133, // FBS total teams (as of 2024-2025)
        approximateFbsGames: 780, // ~780 FBS games per season (12-13 games × 133 teams ÷ 2)
        conferences: Object.keys(conferenceDistribution).length,
        conferenceDistribution,
        methodology: 'Pythagorean Expectation for CFB (2.37 exponent) + Conference-Weighted SOS',
        citations: [
          'James, Bill (1980). "The Bill James Baseball Abstract"',
          'Fremeau, Brian (2007). "College Football Pythagorean Formula" - BCFToys',
          'Connelly, Bill (2005-2024). "College Football Advanced Stats" - ESPN/SB Nation',
          'ESPN FPI (Football Power Index) - CFP Playoff Probabilities',
          'FiveThirtyEight (2014-2024) - College Football Predictions',
          'Massey-Peabody College Football Ratings'
        ],
        dataSource: 'ESPN CFB API via blazesportsintel.com/api',
        lastUpdated: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
        timezone: 'America/Chicago'
      }
    };
  }
}

// Export for ES6 modules
export default CFBAdvancedAnalytics;

// Also make available globally for non-module usage
if (typeof window !== 'undefined') {
  window.CFBAdvancedAnalytics = CFBAdvancedAnalytics;
}
