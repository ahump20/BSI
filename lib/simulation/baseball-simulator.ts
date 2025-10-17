import { SimulationResults, SimulationScoreEntry, SimulationTeamInput } from './types';

interface BaseballTallies {
  homeWins: number;
  outcomes: number[];
  runDistribution: Map<string, number>;
}

interface BaseballTeamInput extends SimulationTeamInput {
  teamOPS?: number;
  startingPitcher?: {
    name: string;
    era: number;
    whip?: number;
  };
  bullpenEra?: number;
}

export class BaseballSimulator {
  async simulateGame(
    homeTeam: BaseballTeamInput,
    awayTeam: BaseballTeamInput,
    iterations = 10000
  ): Promise<SimulationResults> {
    const tallies: BaseballTallies = {
      homeWins: 0,
      outcomes: [],
      runDistribution: new Map<string, number>(),
    };

    const relativeStrength = this.calculateRelativeStrength(homeTeam, awayTeam);
    const homeFieldAdvantage = 0.54;
    const winProbability = this.bayesianWinProb(relativeStrength, homeFieldAdvantage);

    for (let i = 0; i < iterations; i += 1) {
      const homeWon = Math.random() < winProbability;
      if (homeWon) {
        tallies.homeWins += 1;
        tallies.outcomes.push(1);
      } else {
        tallies.outcomes.push(0);
      }

      const { homeRuns, awayRuns } = this.simulateRunDistribution(relativeStrength, homeFieldAdvantage);
      const scoreKey = `${homeRuns}-${awayRuns}`;
      tallies.runDistribution.set(scoreKey, (tallies.runDistribution.get(scoreKey) ?? 0) + 1);
    }

    return this.calculateResults(tallies, iterations);
  }

  private calculateResults(tallies: BaseballTallies, iterations: number): SimulationResults {
    const homeWinProbability = tallies.homeWins / iterations;
    const awayWinProbability = 1 - homeWinProbability;

    const entries = this.toScoreEntries(tallies.runDistribution, iterations);
    const expectedRuns = this.calculateExpectedRuns(entries);
    const mostLikelyScores = entries.slice(0, 10);

    const rawCounts: Record<string, number> = {};
    tallies.runDistribution.forEach((value, key) => {
      rawCounts[key] = value;
    });

    return {
      iterations,
      homeWinProbability,
      awayWinProbability,
      drawProbability: 0,
      expectedValue: expectedRuns,
      mostLikelyScores,
      scoreDistribution: entries,
      outcomes: tallies.outcomes,
      rawCounts,
      model: 'BayesianBaseball',
    };
  }

  private calculateRelativeStrength(homeTeam: BaseballTeamInput, awayTeam: BaseballTeamInput): number {
    const homePastPerf = this.getRecentPerformance(homeTeam);
    const awayPastPerf = this.getRecentPerformance(awayTeam);

    const homeHitting = this.getTeamOPS(homeTeam);
    const awayHitting = this.getTeamOPS(awayTeam);

    const homePitcherEra = this.getPitcherERA(homeTeam);
    const awayPitcherEra = this.getPitcherERA(awayTeam);

    const bullpenAdjustment = this.getBullpenAdjustment(homeTeam, awayTeam);

    return (
      0.3 * (homePastPerf - awayPastPerf) +
      0.35 * (homeHitting - awayHitting) +
      0.25 * (awayPitcherEra - homePitcherEra) +
      bullpenAdjustment
    );
  }

  private bayesianWinProb(relativeStrength: number, homeAdvantage: number): number {
    const adjustedStrength = Math.max(-0.95, Math.min(0.95, relativeStrength));
    const alpha = Math.max(0.5, 1 + adjustedStrength + homeAdvantage);
    const beta = Math.max(0.5, 1 - adjustedStrength);

    return alpha / (alpha + beta);
  }

  private simulateRunDistribution(relativeStrength: number, homeAdvantage: number): {
    homeRuns: number;
    awayRuns: number;
  } {
    const expectedHomeRuns = Math.max(0.5, 4.5 + 0.5 * relativeStrength + 0.3 * homeAdvantage);
    const expectedAwayRuns = Math.max(0.5, 4.5 - 0.5 * relativeStrength);

    return {
      homeRuns: this.negativeBinomialSample(expectedHomeRuns, 2.0),
      awayRuns: this.negativeBinomialSample(expectedAwayRuns, 2.0),
    };
  }

  private negativeBinomialSample(mean: number, dispersion: number): number {
    const size = Math.max(0.1, dispersion);
    const probability = size / (size + mean);
    const scale = (1 - probability) / probability;

    const lambda = this.gammaSample(size, scale);
    return this.poissonSample(lambda);
  }

  private gammaSample(shape: number, scale: number): number {
    if (shape < 1) {
      const u = Math.random();
      return this.gammaSample(1 + shape, scale) * Math.pow(u, 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;
      do {
        x = this.normalSample();
        v = 1 + c * x;
      } while (v <= 0);
      v **= 3;
      const u = Math.random();
      if (u < 1 - 0.0331 * x ** 4) {
        return d * v * scale;
      }
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  private normalSample(): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  private poissonSample(lambda: number): number {
    if (lambda <= 0) {
      return 0;
    }

    const threshold = Math.exp(-lambda);
    let product = 1;
    let count = 0;

    while (product > threshold) {
      count += 1;
      product *= Math.random();
    }

    return Math.max(0, count - 1);
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

  private calculateExpectedRuns(entries: SimulationScoreEntry[]): { home: number; away: number } {
    let homeRuns = 0;
    let awayRuns = 0;
    let total = 0;

    entries.forEach(({ score, count }) => {
      const [home, away] = score.split('-').map((value) => Number.parseInt(value, 10));
      homeRuns += home * count;
      awayRuns += away * count;
      total += count;
    });

    if (total === 0) {
      return { home: 0, away: 0 };
    }

    return {
      home: homeRuns / total,
      away: awayRuns / total,
    };
  }

  private getRecentPerformance(team: BaseballTeamInput): number {
    const record = team.recentRecord;
    if (!record) {
      return 0;
    }

    const games = Math.max(1, record.wins + record.losses);
    return (record.wins - record.losses) / games;
  }

  private getTeamOPS(team: BaseballTeamInput): number {
    const ops = typeof team.teamOPS === 'number' ? team.teamOPS : 0.72;
    return Math.max(0.55, Math.min(0.95, ops));
  }

  private getPitcherERA(team: BaseballTeamInput): number {
    if (team.startingPitcher && typeof team.startingPitcher.era === 'number') {
      return team.startingPitcher.era;
    }
    if (typeof team.bullpenEra === 'number') {
      return team.bullpenEra;
    }
    return 4.25;
  }

  private getBullpenAdjustment(homeTeam: BaseballTeamInput, awayTeam: BaseballTeamInput): number {
    const homeBullpen = typeof homeTeam.bullpenEra === 'number' ? homeTeam.bullpenEra : 4.0;
    const awayBullpen = typeof awayTeam.bullpenEra === 'number' ? awayTeam.bullpenEra : 4.0;
    return 0.1 * (awayBullpen - homeBullpen) / 5;
  }
}
