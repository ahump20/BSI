/**
 * Blaze Sports Intel - Monte Carlo Simulation Engine
 *
 * Statistical simulation engine for SEC Football, NFL, and MLB
 * Based on historical performance data and Pythagorean expectation models
 *
 * @author Austin Humphrey - Blaze Intelligence
 * @version 1.0.0
 */

export interface TeamStats {
  teamId: string;
  teamName: string;
  sport: 'SEC' | 'NFL' | 'MLB';
  wins: number;
  losses: number;
  ties?: number;
  pointsFor: number;
  pointsAgainst: number;
  homeWinPct?: number;
  awayWinPct?: number;
  recentForm?: number[]; // Last 5 games: 1 = win, 0 = loss
  strengthOfSchedule?: number;
  injuryImpact?: number; // 0-1 scale, 1 = no injuries
}

export interface SimulationResult {
  teamId: string;
  teamName: string;
  sport: 'SEC' | 'NFL' | 'MLB';
  simulations: number;
  projectedWins: number;
  projectedLosses: number;
  winDistribution: number[]; // Index = number of wins, value = probability
  playoffProbability: number;
  divisionWinProbability: number;
  championshipProbability: number;
  confidenceInterval: {
    lower: number; // 5th percentile wins
    median: number; // 50th percentile wins
    upper: number; // 95th percentile wins
  };
  metadata: {
    timestamp: string;
    pythagoreanExpectation: number;
    averageWinProbability: number;
    standardDeviation: number;
  };
}

export interface Schedule {
  opponent: string;
  location: 'home' | 'away' | 'neutral';
  opponentStrength: number; // 0-1 scale
  completed: boolean;
}

/**
 * Monte Carlo Simulation Engine
 *
 * Uses Pythagorean expectation, strength of schedule, home field advantage,
 * recent form, and injury impact to simulate season outcomes
 */
export class MonteCarloSimulationEngine {
  private readonly SIMULATIONS = 10000;
  private readonly SPORT_EXPONENTS = {
    SEC: 2.37,   // College Football
    NFL: 2.37,   // Professional Football
    MLB: 1.83    // Baseball
  };

  private readonly HOME_ADVANTAGE = {
    SEC: 0.08,   // 8% boost for home games
    NFL: 0.06,   // 6% boost for home games
    MLB: 0.04    // 4% boost for home games
  };

  /**
   * Calculate Pythagorean Win Expectation
   * Based on points scored vs points allowed
   */
  private calculatePythagoreanExpectation(
    pointsFor: number,
    pointsAgainst: number,
    sport: 'SEC' | 'NFL' | 'MLB'
  ): number {
    const exponent = this.SPORT_EXPONENTS[sport];

    if (pointsFor === 0 && pointsAgainst === 0) return 0.5;

    const numerator = Math.pow(pointsFor, exponent);
    const denominator = numerator + Math.pow(pointsAgainst, exponent);

    return numerator / denominator;
  }

  /**
   * Calculate Recent Form Factor
   * More weight to recent games
   */
  private calculateFormFactor(recentForm?: number[]): number {
    if (!recentForm || recentForm.length === 0) return 1.0;

    // Weighted average: most recent game gets more weight
    let totalWeight = 0;
    let weightedSum = 0;

    recentForm.forEach((result, index) => {
      const weight = Math.pow(1.5, index); // Exponential weighting
      weightedSum += result * weight;
      totalWeight += weight;
    });

    const formPct = weightedSum / totalWeight;

    // Convert to multiplier: 0.90 to 1.10
    return 0.90 + (formPct * 0.20);
  }

  /**
   * Calculate Win Probability for a Single Game
   *
   * Factors:
   * - Base Pythagorean expectation
   * - Opponent strength
   * - Home field advantage
   * - Recent form
   * - Injury impact
   */
  private calculateGameWinProbability(
    teamStats: TeamStats,
    opponent: Schedule
  ): number {
    // Base win probability from Pythagorean expectation
    const baseProbability = this.calculatePythagoreanExpectation(
      teamStats.pointsFor,
      teamStats.pointsAgainst,
      teamStats.sport
    );

    // Adjust for opponent strength
    const opponentAdjustment = (1 - opponent.opponentStrength) * 0.3;
    let winProbability = baseProbability + opponentAdjustment;

    // Home field advantage
    if (opponent.location === 'home') {
      winProbability += this.HOME_ADVANTAGE[teamStats.sport];
    } else if (opponent.location === 'away') {
      winProbability -= this.HOME_ADVANTAGE[teamStats.sport];
    }

    // Recent form factor
    const formFactor = this.calculateFormFactor(teamStats.recentForm);
    winProbability *= formFactor;

    // Injury impact
    if (teamStats.injuryImpact !== undefined) {
      winProbability *= teamStats.injuryImpact;
    }

    // Strength of schedule adjustment
    if (teamStats.strengthOfSchedule !== undefined) {
      const sosAdjustment = (0.5 - teamStats.strengthOfSchedule) * 0.1;
      winProbability += sosAdjustment;
    }

    // Clamp between 0.05 and 0.95 (no guarantees in sports)
    return Math.max(0.05, Math.min(0.95, winProbability));
  }

  /**
   * Simulate a Single Season
   */
  private simulateSeason(
    teamStats: TeamStats,
    schedule: Schedule[]
  ): number {
    let wins = teamStats.wins; // Start with current wins

    // Only simulate remaining games
    const remainingGames = schedule.filter(game => !game.completed);

    remainingGames.forEach(game => {
      const winProbability = this.calculateGameWinProbability(teamStats, game);
      const randomValue = Math.random();

      if (randomValue < winProbability) {
        wins++;
      }
    });

    return wins;
  }

  /**
   * Calculate Playoff Probability
   *
   * Based on simulated win totals and historical playoff thresholds
   */
  private calculatePlayoffProbability(
    winDistribution: number[],
    sport: 'SEC' | 'NFL' | 'MLB',
    totalGames: number
  ): number {
    // Historical playoff win thresholds
    const PLAYOFF_THRESHOLDS = {
      SEC: totalGames * 0.75,  // ~75% win rate for SEC Championship consideration
      NFL: totalGames * 0.5625, // 9+ wins typically makes playoffs (9/16 = 0.5625)
      MLB: totalGames * 0.525   // ~85 wins for playoffs (85/162 = 0.525)
    };

    const threshold = PLAYOFF_THRESHOLDS[sport];
    let playoffCount = 0;

    winDistribution.forEach((probability, wins) => {
      if (wins >= threshold) {
        playoffCount += probability;
      }
    });

    return playoffCount;
  }

  /**
   * Calculate Division Win Probability
   * Assumes team needs to be in top 20% of win total
   */
  private calculateDivisionWinProbability(
    winDistribution: number[],
    totalGames: number
  ): number {
    const divisionThreshold = totalGames * 0.65; // Need 65%+ win rate
    let divisionWinCount = 0;

    winDistribution.forEach((probability, wins) => {
      if (wins >= divisionThreshold) {
        divisionWinCount += probability;
      }
    });

    return divisionWinCount;
  }

  /**
   * Calculate Championship Probability
   * Much higher threshold - elite teams only
   */
  private calculateChampionshipProbability(
    winDistribution: number[],
    sport: 'SEC' | 'NFL' | 'MLB',
    totalGames: number
  ): number {
    const CHAMPIONSHIP_THRESHOLDS = {
      SEC: totalGames * 0.85,  // 85%+ win rate
      NFL: totalGames * 0.75,  // 12+ wins
      MLB: totalGames * 0.60   // 97+ wins
    };

    const threshold = CHAMPIONSHIP_THRESHOLDS[sport];
    let championshipCount = 0;

    winDistribution.forEach((probability, wins) => {
      if (wins >= threshold) {
        championshipCount += probability;
      }
    });

    return championshipCount;
  }

  /**
   * Run Monte Carlo Simulation
   *
   * @param teamStats Current team statistics
   * @param schedule Remaining schedule
   * @param simulations Number of simulations to run (default 10,000)
   * @returns Simulation results with probabilities
   */
  public simulate(
    teamStats: TeamStats,
    schedule: Schedule[],
    simulations: number = this.SIMULATIONS
  ): SimulationResult {
    const totalGames = teamStats.wins + teamStats.losses +
                       schedule.filter(g => !g.completed).length;

    // Initialize win distribution array
    const winCounts: number[] = new Array(totalGames + 1).fill(0);
    let totalWins = 0;
    const allWins: number[] = [];

    // Run simulations
    for (let i = 0; i < simulations; i++) {
      const seasonWins = this.simulateSeason(teamStats, schedule);
      winCounts[seasonWins]++;
      totalWins += seasonWins;
      allWins.push(seasonWins);
    }

    // Convert counts to probabilities
    const winDistribution = winCounts.map(count => count / simulations);

    // Calculate statistics
    const projectedWins = totalWins / simulations;
    const projectedLosses = totalGames - projectedWins;

    // Sort for percentile calculations
    allWins.sort((a, b) => a - b);
    const percentile = (p: number) => {
      const index = Math.floor(simulations * p);
      return allWins[index];
    };

    // Calculate standard deviation
    const variance = allWins.reduce((sum, wins) => {
      return sum + Math.pow(wins - projectedWins, 2);
    }, 0) / simulations;
    const standardDeviation = Math.sqrt(variance);

    // Calculate probabilities
    const playoffProbability = this.calculatePlayoffProbability(
      winDistribution,
      teamStats.sport,
      totalGames
    );

    const divisionWinProbability = this.calculateDivisionWinProbability(
      winDistribution,
      totalGames
    );

    const championshipProbability = this.calculateChampionshipProbability(
      winDistribution,
      teamStats.sport,
      totalGames
    );

    const pythagoreanExpectation = this.calculatePythagoreanExpectation(
      teamStats.pointsFor,
      teamStats.pointsAgainst,
      teamStats.sport
    );

    return {
      teamId: teamStats.teamId,
      teamName: teamStats.teamName,
      sport: teamStats.sport,
      simulations,
      projectedWins: Math.round(projectedWins * 10) / 10,
      projectedLosses: Math.round(projectedLosses * 10) / 10,
      winDistribution,
      playoffProbability: Math.round(playoffProbability * 1000) / 10,
      divisionWinProbability: Math.round(divisionWinProbability * 1000) / 10,
      championshipProbability: Math.round(championshipProbability * 1000) / 10,
      confidenceInterval: {
        lower: percentile(0.05),
        median: percentile(0.50),
        upper: percentile(0.95)
      },
      metadata: {
        timestamp: new Date().toISOString(),
        pythagoreanExpectation: Math.round(pythagoreanExpectation * 1000) / 10,
        averageWinProbability: Math.round(pythagoreanExpectation * 100 * 10) / 10,
        standardDeviation: Math.round(standardDeviation * 100) / 100
      }
    };
  }

  /**
   * Batch simulate multiple teams
   */
  public batchSimulate(
    teams: TeamStats[],
    schedules: Map<string, Schedule[]>,
    simulations: number = this.SIMULATIONS
  ): SimulationResult[] {
    return teams.map(team => {
      const schedule = schedules.get(team.teamId) || [];
      return this.simulate(team, schedule, simulations);
    });
  }
}

/**
 * Export singleton instance
 */
export const monteCarloEngine = new MonteCarloSimulationEngine();