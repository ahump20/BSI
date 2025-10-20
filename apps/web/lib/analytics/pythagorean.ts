/**
 * Blaze Sports Intel - Pythagorean Win Expectancy Engine
 * Advanced statistical analysis for sports performance prediction
 *
 * Based on Bill James's Pythagorean expectation formula
 * with sport-specific exponents for accuracy
 */

export interface TeamStats {
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  sport: 'football' | 'baseball' | 'basketball' | 'hockey';
}

export interface PythagoreanResult {
  expectedWins: number;
  expectedLosses: number;
  expectedWinPct: number;
  actualWinPct: number;
  luckFactor: number;
  pythagWins: number;
  overperforming: boolean;
}

export interface SeasonProjection {
  currentRecord: { wins: number; losses: number };
  projectedFinalRecord: { wins: number; losses: number };
  remainingGames: number;
  projectedWinPct: number;
  confidence: number;
  playoffProbability?: number;
}

/**
 * Sport-specific Pythagorean exponents
 * Derived from empirical analysis and regression
 */
const PYTHAGOREAN_EXPONENTS = {
  football: 2.37,      // NFL/College Football
  baseball: 1.83,      // MLB/College Baseball
  basketball: 13.91,   // NBA/College Basketball
  hockey: 2.0,         // NHL/College Hockey
} as const;

export class PythagoreanAnalyzer {
  /**
   * Calculate expected wins using Pythagorean expectation
   */
  static calculateExpectedWins(stats: TeamStats): number {
    const exponent = PYTHAGOREAN_EXPONENTS[stats.sport];
    const { pointsFor, pointsAgainst, gamesPlayed } = stats;

    if (pointsFor === 0 && pointsAgainst === 0) {
      return 0;
    }

    // Pythagorean formula: (PF^exp) / (PF^exp + PA^exp)
    const winExpectancy =
      Math.pow(pointsFor, exponent) /
      (Math.pow(pointsFor, exponent) + Math.pow(pointsAgainst, exponent));

    return winExpectancy * gamesPlayed;
  }

  /**
   * Calculate complete Pythagorean analysis
   */
  static analyze(stats: TeamStats): PythagoreanResult {
    const expectedWins = this.calculateExpectedWins(stats);
    const expectedLosses = stats.gamesPlayed - expectedWins;
    const expectedWinPct = expectedWins / stats.gamesPlayed;
    const actualWinPct = stats.wins / stats.gamesPlayed;
    const luckFactor = stats.wins - expectedWins;

    return {
      expectedWins: Math.round(expectedWins * 10) / 10,
      expectedLosses: Math.round(expectedLosses * 10) / 10,
      expectedWinPct: Math.round(expectedWinPct * 1000) / 1000,
      actualWinPct: Math.round(actualWinPct * 1000) / 1000,
      luckFactor: Math.round(luckFactor * 10) / 10,
      pythagWins: Math.round(expectedWins),
      overperforming: luckFactor > 0,
    };
  }

  /**
   * Project final season record
   */
  static projectSeason(
    currentStats: TeamStats,
    totalGames: number
  ): SeasonProjection {
    const analysis = this.analyze(currentStats);
    const remainingGames = totalGames - currentStats.gamesPlayed;
    const expectedWinPct = analysis.expectedWinPct;

    // Project remaining games using expected win percentage
    const projectedRemainingWins = expectedWinPct * remainingGames;
    const projectedFinalWins = currentStats.wins + projectedRemainingWins;
    const projectedFinalLosses = totalGames - projectedFinalWins;

    // Confidence decreases with fewer games played
    const confidence = Math.min(95, 50 + (currentStats.gamesPlayed / totalGames) * 45);

    return {
      currentRecord: {
        wins: currentStats.wins,
        losses: currentStats.losses,
      },
      projectedFinalRecord: {
        wins: Math.round(projectedFinalWins),
        losses: Math.round(projectedFinalLosses),
      },
      remainingGames,
      projectedWinPct: Math.round(expectedWinPct * 1000) / 1000,
      confidence: Math.round(confidence),
    };
  }

  /**
   * Calculate strength of schedule adjustment
   */
  static adjustForStrengthOfSchedule(
    baseExpectedWins: number,
    opponentAvgWinPct: number
  ): number {
    // Adjust based on opponent strength
    // Stronger schedule (>0.500) increases expected wins
    // Weaker schedule (<0.500) decreases expected wins
    const adjustment = (opponentAvgWinPct - 0.500) * 2;
    return baseExpectedWins * (1 + adjustment);
  }

  /**
   * Calculate playoff probability using Pythagorean expectation
   */
  static calculatePlayoffProbability(
    currentStats: TeamStats,
    totalGames: number,
    playoffThreshold: number
  ): number {
    const projection = this.projectSeason(currentStats, totalGames);
    const projectedWins = projection.projectedFinalRecord.wins;

    // Simple logistic model for playoff probability
    const winsAboveThreshold = projectedWins - playoffThreshold;
    const probability = 1 / (1 + Math.exp(-winsAboveThreshold));

    return Math.round(probability * 1000) / 10; // Return as percentage
  }

  /**
   * Compare two teams using Pythagorean ratings
   */
  static compareTeams(team1: TeamStats, team2: TeamStats): {
    team1WinProbability: number;
    team2WinProbability: number;
    favorite: 'team1' | 'team2' | 'tossup';
  } {
    const team1Analysis = this.analyze(team1);
    const team2Analysis = this.analyze(team2);

    const team1Rating = team1Analysis.expectedWinPct;
    const team2Rating = team2Analysis.expectedWinPct;

    // Log5 method for win probability
    const team1WinProb = (team1Rating - team1Rating * team2Rating) /
      (team1Rating + team2Rating - 2 * team1Rating * team2Rating);

    const team1WinProbability = Math.round(team1WinProb * 1000) / 10;
    const team2WinProbability = Math.round((1 - team1WinProb) * 1000) / 10;

    let favorite: 'team1' | 'team2' | 'tossup' = 'tossup';
    if (team1WinProbability > 55) favorite = 'team1';
    else if (team2WinProbability > 55) favorite = 'team2';

    return {
      team1WinProbability,
      team2WinProbability,
      favorite,
    };
  }

  /**
   * Calculate run differential rating (for baseball)
   */
  static calculateRunDifferentialRating(
    runsScored: number,
    runsAllowed: number,
    gamesPlayed: number
  ): number {
    const runDiffPerGame = (runsScored - runsAllowed) / gamesPlayed;

    // Empirical formula: Each +1 run differential ≈ 10 points of OPS
    const rating = 50 + (runDiffPerGame * 10);

    return Math.max(0, Math.min(100, Math.round(rating * 10) / 10));
  }

  /**
   * Calculate point differential rating (for football/basketball)
   */
  static calculatePointDifferentialRating(
    pointsFor: number,
    pointsAgainst: number,
    gamesPlayed: number,
    sport: 'football' | 'basketball'
  ): number {
    const pointDiffPerGame = (pointsFor - pointsAgainst) / gamesPlayed;

    // Sport-specific scaling
    const scale = sport === 'football' ? 2 : 0.5;
    const rating = 50 + (pointDiffPerGame * scale);

    return Math.max(0, Math.min(100, Math.round(rating * 10) / 10));
  }

  /**
   * Calculate momentum factor (recent performance weight)
   */
  static calculateMomentum(recentGames: Array<{ won: boolean }>): number {
    if (recentGames.length === 0) return 0;

    // Weight recent games more heavily
    let momentum = 0;
    recentGames.forEach((game, index) => {
      const weight = (index + 1) / recentGames.length;
      momentum += game.won ? weight : -weight;
    });

    return Math.round(momentum * 100) / 100;
  }

  /**
   * Generate comprehensive team rating
   */
  static generateComprehensiveRating(stats: TeamStats, recentGames?: Array<{ won: boolean }>): {
    pythagoreanRating: number;
    differentialRating: number;
    momentumRating: number;
    compositeRating: number;
  } {
    const pythagAnalysis = this.analyze(stats);
    const pythagoreanRating = Math.round(pythagAnalysis.expectedWinPct * 100);

    const differentialRating = stats.sport === 'baseball'
      ? this.calculateRunDifferentialRating(stats.pointsFor, stats.pointsAgainst, stats.gamesPlayed)
      : this.calculatePointDifferentialRating(stats.pointsFor, stats.pointsAgainst, stats.gamesPlayed, stats.sport);

    const momentumRating = recentGames ? this.calculateMomentum(recentGames) : 0;

    // Composite: 50% Pythagorean, 30% Differential, 20% Momentum
    const compositeRating = Math.round(
      (pythagoreanRating * 0.5 + differentialRating * 0.3 + (50 + momentumRating * 20) * 0.2)
    );

    return {
      pythagoreanRating,
      differentialRating,
      momentumRating,
      compositeRating,
    };
  }
}

// Export helper function for quick analysis
export function analyzePythagorean(stats: TeamStats): PythagoreanResult {
  return PythagoreanAnalyzer.analyze(stats);
}

export function projectSeasonRecord(
  stats: TeamStats,
  totalGames: number
): SeasonProjection {
  return PythagoreanAnalyzer.projectSeason(stats, totalGames);
}