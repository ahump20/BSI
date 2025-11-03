import { SimulationResults, SimulationTeamInput } from './types';

interface SimulationBatchParameters {
  homeTeam: SimulationTeamInput;
  awayTeam: SimulationTeamInput;
  sport: string;
  iterations: number;
  correlation?: number;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {}

interface DurableObjectStub {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

interface SimulationCoordinatorEnv {
  SIMULATOR?: DurableObjectNamespace;
}

export class SimulationCoordinator {
  constructor(private readonly env: SimulationCoordinatorEnv) {}

  async distributeSimulations(
    parameters: SimulationBatchParameters,
    totalIterations: number,
    runLocalBatch: (iterations: number) => Promise<SimulationResults>
  ): Promise<SimulationResults> {
    if (!this.env.SIMULATOR) {
      return runLocalBatch(totalIterations);
    }

    const batchSize = 1000;
    const batches = Math.ceil(totalIterations / batchSize);

    const responses: SimulationResults[] = [];

    for (let i = 0; i < batches; i += 1) {
      const iterations = i === batches - 1 ? totalIterations - batchSize * i : batchSize;
      if (iterations <= 0) {
        continue;
      }

      try {
        const stub = this.env.SIMULATOR.get(
          this.env.SIMULATOR.idFromName(`sim-${i}`)
        );
        const response = await stub.fetch('https://simulation/run', {
          method: 'POST',
          body: JSON.stringify({ ...parameters, iterations }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Durable Object responded with ${response.status}`);
        }

        const payload = (await response.json()) as SimulationResults;
        responses.push(payload);
      } catch (error) {
        console.warn('[SimulationCoordinator] Durable Object error, falling back:', error);
        const fallback = await runLocalBatch(iterations);
        responses.push(fallback);
      }
    }

    if (responses.length === 0) {
      return runLocalBatch(totalIterations);
    }

    return this.aggregateResults(responses);
  }

  private aggregateResults(results: SimulationResults[]): SimulationResults {
    const aggregateCounts: Record<string, number> = {};
    let totalIterations = 0;
    let totalHomeWins = 0;
    let totalAwayWins = 0;
    let totalDraws = 0;
    const outcomes: number[] = [];

    results.forEach((result) => {
      totalIterations += result.iterations;
      totalHomeWins += result.homeWinProbability * result.iterations;
      totalAwayWins += result.awayWinProbability * result.iterations;
      totalDraws += (result.drawProbability ?? 0) * result.iterations;
      outcomes.push(...result.outcomes);

      Object.entries(result.rawCounts).forEach(([score, count]) => {
        aggregateCounts[score] = (aggregateCounts[score] ?? 0) + count;
      });
    });

    const scoreDistribution = Object.entries(aggregateCounts)
      .map(([score, count]) => ({
        score,
        count,
        probability: count / totalIterations,
      }))
      .sort((a, b) => b.probability - a.probability);

    const expectedValue = this.calculateExpectedTotals(scoreDistribution);
    const mostLikelyScores = scoreDistribution.slice(0, 5);

    return {
      iterations: totalIterations,
      homeWinProbability: totalIterations > 0 ? totalHomeWins / totalIterations : 0,
      awayWinProbability: totalIterations > 0 ? totalAwayWins / totalIterations : 0,
      drawProbability: totalIterations > 0 ? totalDraws / totalIterations : 0,
      expectedValue,
      mostLikelyScores,
      scoreDistribution,
      outcomes,
      rawCounts: aggregateCounts,
      model: results[0]?.model ?? 'Unknown',
    };
  }

  private calculateExpectedTotals(entries: { score: string; count: number }[]): {
    home: number;
    away: number;
  } {
    let homeTotal = 0;
    let awayTotal = 0;
    let sims = 0;

    entries.forEach(({ score, count }) => {
      const [home, away] = score.split('-').map((value) => Number.parseInt(value, 10));
      homeTotal += home * count;
      awayTotal += away * count;
      sims += count;
    });

    if (sims === 0) {
      return { home: 0, away: 0 };
    }

    return {
      home: homeTotal / sims,
      away: awayTotal / sims,
    };
  }
}
