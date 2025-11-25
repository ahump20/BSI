import { cfpTop25Data, normalizeAdjustments } from './data';
import type {
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
  ScenarioSimulationTeamResult,
  ScenarioAdjustment,
} from './types';

interface TeamAccumulator {
  inclusionCount: number;
  seedTotal: number;
  topTwoCount: number;
  scoreSum: number;
  scoreSqSum: number;
  seedCounts: Map<number, number>;
}

const BASELINE_WEIGHT = 0.52;
const POWER_WEIGHT = 1.0;
const RESUME_WEIGHT = 0.46;
const PROBABILITY_WEIGHT = 18;
const AUTO_BID_BONUS = 12;

function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function computeScenarioHash(payload: ScenarioSimulationRequest): string {
  const normalized = JSON.stringify({
    iterations: payload.iterations,
    adjustments: payload.adjustments,
    protectSeeds: payload.protectSeeds,
    chaosFactor: payload.chaosFactor,
  });

  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }

  return `cfp-${Math.abs(hash).toString(36)}`;
}

function applyAdjustments(
  team: string,
  adjustments: ScenarioAdjustment[]
): ScenarioAdjustment | undefined {
  return adjustments.find((adjustment) => adjustment.team === team);
}

function computeMedianSeed(seedCounts: Map<number, number>): number {
  if (seedCounts.size === 0) {
    return 6;
  }

  const entries = Array.from(seedCounts.entries()).sort((a, b) => a[0] - b[0]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const midpoint = total / 2;

  let cumulative = 0;
  for (const [seed, count] of entries) {
    cumulative += count;
    if (cumulative >= midpoint) {
      return seed;
    }
  }

  return entries[entries.length - 1][0];
}

function finalizeResults(
  accumulators: Map<string, TeamAccumulator>,
  iterations: number
): ScenarioSimulationTeamResult[] {
  return Array.from(accumulators.entries())
    .map(([team, stats]) => {
      const playoffOdds = stats.inclusionCount / iterations;
      const avgSeed = stats.inclusionCount > 0 ? stats.seedTotal / stats.inclusionCount : 6.5;
      const topTwoOdds = stats.topTwoCount / iterations;
      const volatilityIndex = Math.sqrt(
        Math.max(stats.scoreSqSum / iterations - (stats.scoreSum / iterations) ** 2, 0)
      );

      return {
        team,
        playoffOdds,
        avgSeed,
        topTwoOdds,
        medianSeed: computeMedianSeed(stats.seedCounts),
        volatilityIndex,
        inclusionCount: stats.inclusionCount,
      };
    })
    .sort((a, b) => {
      if (b.playoffOdds !== a.playoffOdds) {
        return b.playoffOdds - a.playoffOdds;
      }
      return a.avgSeed - b.avgSeed;
    });
}

function createAccumulator(): TeamAccumulator {
  return {
    inclusionCount: 0,
    seedTotal: 0,
    topTwoCount: 0,
    scoreSum: 0,
    scoreSqSum: 0,
    seedCounts: new Map<number, number>(),
  };
}

export function runScenarioSimulation(
  payload: ScenarioSimulationRequest = {}
): ScenarioSimulationResponse {
  const iterations = Math.min(Math.max(payload.iterations ?? 2500, 500), 20000);
  const chaosFactor = Math.max(Math.min(payload.chaosFactor ?? 1.0, 2.5), 0.25);
  const adjustments = normalizeAdjustments(payload.adjustments ?? []);
  const protectSeeds = new Set(payload.protectSeeds ?? []);

  const accumulators = new Map<string, TeamAccumulator>();
  cfpTop25Data.rankings.forEach((entry) => {
    accumulators.set(entry.team, createAccumulator());
  });

  for (let i = 0; i < iterations; i += 1) {
    const scored = cfpTop25Data.rankings.map((entry) => {
      const adjustment = applyAdjustments(entry.team, adjustments);
      const basePower = entry.powerRating * POWER_WEIGHT;
      const baseResume = entry.resumeScore * RESUME_WEIGHT;
      const basePlayoff = entry.playoffProbability * PROBABILITY_WEIGHT;
      const baseline = basePower + baseResume + basePlayoff;

      const stabilityCoefficient = 1 - entry.stability;
      const chaos = gaussianRandom() * stabilityCoefficient * 8 * chaosFactor;
      const protectedBonus = protectSeeds.has(entry.team) ? 4 * entry.stability : 0;

      const adjustmentBonus = adjustment
        ? (adjustment.winProbabilityDelta ?? 0) * 20 + (adjustment.resumeBonus ?? 0)
        : 0;
      const autoBidBonus = adjustment?.autoBid ? AUTO_BID_BONUS : 0;

      const totalScore =
        baseline * BASELINE_WEIGHT + chaos + adjustmentBonus + autoBidBonus + protectedBonus;

      const accumulator = accumulators.get(entry.team)!;
      accumulator.scoreSum += totalScore;
      accumulator.scoreSqSum += totalScore * totalScore;

      return {
        team: entry.team,
        score: totalScore,
        baseSeed: entry.projectedSeed,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    scored.slice(0, 4).forEach((candidate, index) => {
      const teamStats = accumulators.get(candidate.team)!;
      teamStats.inclusionCount += 1;
      teamStats.seedTotal += index + 1;
      teamStats.seedCounts.set(index + 1, (teamStats.seedCounts.get(index + 1) ?? 0) + 1);
      if (index < 2) {
        teamStats.topTwoCount += 1;
      }
    });
  }

  const teams = finalizeResults(accumulators, iterations);

  const projectedField = teams
    .filter((team) => team.inclusionCount > 0)
    .slice(0, 4)
    .map((team, index) => ({ team: team.team, seed: Math.round(team.avgSeed ?? index + 1) }));

  const bubbleWatch = teams
    .filter((team) => team.playoffOdds > 0.1 && team.playoffOdds < 0.7)
    .slice(0, 6)
    .map((team) => team.team);

  const narrative: string[] = [];
  if (teams.length > 0) {
    narrative.push(
      `${teams[0].team} remains the anchor with ${(teams[0].playoffOdds * 100).toFixed(1)}% playoff odds.`
    );
  }
  if (bubbleWatch.length > 0) {
    narrative.push(
      `Bubble volatility spotlights ${bubbleWatch.slice(0, 3).join(', ')} in this run.`
    );
  }
  narrative.push(`Chaos factor set to ${(chaosFactor * 100).toFixed(0)}% of baseline variance.`);

  return {
    iterations,
    scenarioHash: computeScenarioHash(payload),
    generatedAt: new Date().toISOString(),
    projectedField,
    teams,
    bubbleWatch,
    narrative,
  };
}
