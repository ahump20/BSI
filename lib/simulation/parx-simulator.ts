import { SimulationResults, SimulationScoreEntry, SimulationTeamInput } from './types';

interface SimulationTallies {
  homeWins: number;
  awayWins: number;
  draws: number;
  scoreDistribution: Map<string, number>;
  outcomes: number[];
}

export class PARXSimulator {
  private readonly attackStrengths = new Map<string, number>();
  private readonly defenseStrengths = new Map<string, number>();
  private readonly recentForm = new Map<string, number[]>();

  async simulateGame(
    homeTeam: SimulationTeamInput,
    awayTeam: SimulationTeamInput,
    iterations = 10000
  ): Promise<SimulationResults> {
    this.registerTeam(homeTeam);
    this.registerTeam(awayTeam);

    const lambdaHome = this.calculateIntensity(homeTeam, awayTeam, true);
    const lambdaAway = this.calculateIntensity(awayTeam, homeTeam, false);

    const tallies: SimulationTallies = {
      homeWins: 0,
      awayWins: 0,
      draws: 0,
      scoreDistribution: new Map<string, number>(),
      outcomes: [],
    };

    for (let i = 0; i < iterations; i += 1) {
      const homeScore = this.poissonSample(lambdaHome);
      const awayScore = this.poissonSample(lambdaAway);

      this.updateTallies(tallies, homeScore, awayScore);
    }

    return this.calculateResults(tallies, iterations);
  }

  private registerTeam(team: SimulationTeamInput): void {
    if (team.attackStrength !== undefined) {
      this.attackStrengths.set(team.id, team.attackStrength);
    }
    if (team.defenseStrength !== undefined) {
      this.defenseStrengths.set(team.id, team.defenseStrength);
    }
    if (Array.isArray(team.recentForm)) {
      this.recentForm.set(team.id, team.recentForm);
    }
  }

  private calculateIntensity(
    team: SimulationTeamInput,
    opponent: SimulationTeamInput,
    isHome: boolean
  ): number {
    const baseIntensity = isHome ? 1.4 : 1.0;
    const formComponent = this.getRecentForm(team.id);
    const attackComponent = this.attackStrengths.get(team.id) ?? 1.0;
    const defenseComponent = this.defenseStrengths.get(opponent.id) ?? 1.0;
    const offensiveEPA = typeof team.offensiveEPA === 'number' ? team.offensiveEPA : 0;
    const defensiveEPA = typeof opponent.defensiveEPA === 'number' ? opponent.defensiveEPA : 0;

    const intensity = baseIntensity * Math.exp(
      0.3 * formComponent +
        0.4 * attackComponent +
        0.2 * offensiveEPA -
        0.3 * defenseComponent -
        0.15 * defensiveEPA
    );

    return Math.max(0.05, intensity);
  }

  private getRecentForm(teamId: string): number {
    const recentGames = this.recentForm.get(teamId) ?? [];
    if (recentGames.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let weightTotal = 0;
    const startIndex = Math.max(0, recentGames.length - 5);

    for (let idx = startIndex; idx < recentGames.length; idx += 1) {
      const weight = Math.exp(-0.2 * (recentGames.length - 1 - idx));
      weightedSum += recentGames[idx] * weight;
      weightTotal += weight;
    }

    return weightTotal > 0 ? weightedSum / weightTotal : 0;
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

  private updateTallies(tallies: SimulationTallies, homeScore: number, awayScore: number): void {
    const scoreKey = `${homeScore}-${awayScore}`;
    tallies.scoreDistribution.set(
      scoreKey,
      (tallies.scoreDistribution.get(scoreKey) ?? 0) + 1
    );

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

  private calculateResults(tallies: SimulationTallies, iterations: number): SimulationResults {
    const homeWinProbability = tallies.homeWins / iterations;
    const awayWinProbability = tallies.awayWins / iterations;
    const drawProbability = tallies.draws / iterations;

    const scoreEntries = this.toScoreEntries(tallies.scoreDistribution, iterations);
    const expectedValue = this.calculateExpectedGoals(scoreEntries);
    const mostLikelyScores = this.getTopScores(scoreEntries, 5);

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
      scoreDistribution: scoreEntries,
      outcomes: tallies.outcomes,
      rawCounts,
      model: 'PARX',
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
    let totalHome = 0;
    let totalAway = 0;
    let totalSims = 0;

    entries.forEach(({ score, count }) => {
      const [home, away] = score.split('-').map((value) => Number.parseInt(value, 10));
      totalHome += home * count;
      totalAway += away * count;
      totalSims += count;
    });

    if (totalSims === 0) {
      return { home: 0, away: 0 };
    }

    return {
      home: totalHome / totalSims,
      away: totalAway / totalSims,
    };
  }

  private getTopScores(entries: SimulationScoreEntry[], count: number): SimulationScoreEntry[] {
    return entries.slice(0, count);
  }
}
