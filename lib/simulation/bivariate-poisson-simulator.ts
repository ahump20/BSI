import { SimulationResults, SimulationScoreEntry, SimulationTeamInput } from './types';

interface BivariateTallies {
  homeWins: number;
  awayWins: number;
  draws: number;
  scoreDistribution: Map<string, number>;
  outcomes: number[];
}

export class BivariatePoissonSimulator {
  private readonly recentForm = new Map<string, number[]>();

  async simulateGame(
    homeTeam: SimulationTeamInput,
    awayTeam: SimulationTeamInput,
    iterations = 10000,
    correlation = 0.1
  ): Promise<SimulationResults> {
    this.registerTeam(homeTeam);
    this.registerTeam(awayTeam);

    const lambdaHome = this.calculateLambda(homeTeam, awayTeam, true);
    const lambdaAway = this.calculateLambda(awayTeam, homeTeam, false);

    const tallies: BivariateTallies = {
      homeWins: 0,
      awayWins: 0,
      draws: 0,
      scoreDistribution: new Map<string, number>(),
      outcomes: [],
    };

    for (let i = 0; i < iterations; i += 1) {
      const { homeScore, awayScore } = this.simulateCorrelatedScores(
        lambdaHome,
        lambdaAway,
        correlation
      );

      this.updateTallies(tallies, homeScore, awayScore);
    }

    return this.calculateResults(tallies, iterations);
  }

  simulateCorrelatedScores(
    lambdaHome: number,
    lambdaAway: number,
    rho = 0.1
  ): { homeScore: number; awayScore: number } {
    const lambdaShared = Math.max(0, Math.min(lambdaHome, lambdaAway) * rho);

    const x1 = this.poissonSample(Math.max(lambdaHome - lambdaShared, 0.0001));
    const x2 = this.poissonSample(Math.max(lambdaAway - lambdaShared, 0.0001));
    const x3 = this.poissonSample(lambdaShared);

    return {
      homeScore: x1 + x3,
      awayScore: x2 + x3,
    };
  }

  private registerTeam(team: SimulationTeamInput): void {
    if (Array.isArray(team.recentForm)) {
      this.recentForm.set(team.id, team.recentForm);
    }
  }

  private calculateLambda(
    team: SimulationTeamInput,
    opponent: SimulationTeamInput,
    isHome: boolean
  ): number {
    const base = isHome ? 1.15 : 0.95;
    const attack = typeof team.attackStrength === 'number' ? team.attackStrength : 1.0;
    const defense = typeof opponent.defenseStrength === 'number' ? opponent.defenseStrength : 1.0;
    const form = this.getRecentForm(team.id);
    const offensiveEPA = typeof team.offensiveEPA === 'number' ? team.offensiveEPA : 0;
    const defensiveEPA = typeof opponent.defensiveEPA === 'number' ? opponent.defensiveEPA : 0;

    const lambda = base * Math.exp(
      0.35 * attack -
        0.25 * defense +
        0.25 * form +
        0.18 * offensiveEPA -
        0.12 * defensiveEPA
    );

    return Math.max(0.05, lambda);
  }

  private getRecentForm(teamId: string): number {
    const history = this.recentForm.get(teamId) ?? [];
    if (history.length === 0) {
      return 0;
    }

    let weighted = 0;
    let weightSum = 0;
    const start = Math.max(0, history.length - 5);

    for (let idx = start; idx < history.length; idx += 1) {
      const weight = Math.exp(-0.3 * (history.length - 1 - idx));
      weighted += history[idx] * weight;
      weightSum += weight;
    }

    return weightSum > 0 ? weighted / weightSum : 0;
  }

  private poissonSample(lambda: number): number {
    const threshold = Math.exp(-lambda);
    let product = 1;
    let count = 0;

    while (product > threshold) {
      count += 1;
      product *= Math.random();
    }

    return Math.max(0, count - 1);
  }

  private updateTallies(tallies: BivariateTallies, homeScore: number, awayScore: number): void {
    const key = `${homeScore}-${awayScore}`;
    tallies.scoreDistribution.set(key, (tallies.scoreDistribution.get(key) ?? 0) + 1);

    if (homeScore > awayScore) {
      tallies.homeWins += 1;
      tallies.outcomes.push(1);
    } else if (awayScore > homeScore) {
      tallies.awayWins += 1;
      tallies.outcomes.push(0);
    } else {
      tallies.draws += 1;
      tallies.outcomes.push(0);
    }
  }

  private calculateResults(tallies: BivariateTallies, iterations: number): SimulationResults {
    const homeWinProbability = tallies.homeWins / iterations;
    const awayWinProbability = tallies.awayWins / iterations;
    const drawProbability = tallies.draws / iterations;

    const entries = this.toScoreEntries(tallies.scoreDistribution, iterations);
    const expectedValue = this.calculateExpectedGoals(entries);
    const mostLikelyScores = entries.slice(0, 5);

    const rawCounts: Record<string, number> = {};
    tallies.scoreDistribution.forEach((value, key) => {
      rawCounts[key] = value;
    });

    return {
      iterations,
      homeWinProbability,
      awayWinProbability,
      drawProbability,
      expectedValue,
      mostLikelyScores,
      scoreDistribution: entries,
      outcomes: tallies.outcomes,
      rawCounts,
      model: 'BivariatePoisson',
    };
  }

  private toScoreEntries(
    distribution: Map<string, number>,
    iterations: number
  ): SimulationScoreEntry[] {
    return Array.from(distribution.entries())
      .map(([score, count]) => ({
        score,
        count,
        probability: count / iterations,
      }))
      .sort((a, b) => b.probability - a.probability);
  }

  private calculateExpectedGoals(entries: SimulationScoreEntry[]): { home: number; away: number } {
    let homeGoals = 0;
    let awayGoals = 0;
    let simulations = 0;

    entries.forEach(({ score, count }) => {
      const [home, away] = score.split('-').map((value) => Number.parseInt(value, 10));
      homeGoals += home * count;
      awayGoals += away * count;
      simulations += count;
    });

    if (simulations === 0) {
      return { home: 0, away: 0 };
    }

    return {
      home: homeGoals / simulations,
      away: awayGoals / simulations,
    };
  }
}
