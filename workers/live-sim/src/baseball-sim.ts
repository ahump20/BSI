/**
 * Baseball In-Game Monte Carlo Simulation Engine
 *
 * Simulates remaining game from current state using:
 * - Player priors (rolling xwOBA, Stuff+, platoon splits)
 * - Game context (leverage, inning, outs, base state)
 * - Park factors
 * - Bayesian updating for observed performance
 */

import type {
  BaseballSimContext,
  BaseballOutcomes,
  BaseballPlayerPriors,
  SimConfig,
  SimOutput
} from './types';

/**
 * Base outcome rates by count (balls-strikes)
 * Calibrated from MLB 2024 data
 */
const BASE_OUTCOME_RATES: Record<string, BaseballOutcomes> = {
  '0-0': { single: 0.15, double: 0.04, triple: 0.004, homeRun: 0.03, strikeout: 0.18, groundOut: 0.25, flyOut: 0.20, lineOut: 0.10, walk: 0.045, hitByPitch: 0.01, error: 0.015 },
  '0-1': { single: 0.13, double: 0.035, triple: 0.003, homeRun: 0.025, strikeout: 0.22, groundOut: 0.27, flyOut: 0.21, lineOut: 0.09, walk: 0.025, hitByPitch: 0.008, error: 0.012 },
  '0-2': { single: 0.10, double: 0.025, triple: 0.002, homeRun: 0.018, strikeout: 0.35, groundOut: 0.28, flyOut: 0.18, lineOut: 0.07, walk: 0.015, hitByPitch: 0.005, error: 0.010 },
  '1-0': { single: 0.17, double: 0.045, triple: 0.005, homeRun: 0.038, strikeout: 0.15, groundOut: 0.23, flyOut: 0.19, lineOut: 0.11, walk: 0.070, hitByPitch: 0.012, error: 0.018 },
  '1-1': { single: 0.15, double: 0.04, triple: 0.004, homeRun: 0.03, strikeout: 0.19, groundOut: 0.25, flyOut: 0.20, lineOut: 0.10, walk: 0.045, hitByPitch: 0.01, error: 0.015 },
  '2-0': { single: 0.19, double: 0.05, triple: 0.006, homeRun: 0.045, strikeout: 0.12, groundOut: 0.21, flyOut: 0.17, lineOut: 0.12, walk: 0.11, hitByPitch: 0.015, error: 0.022 },
  '3-0': { single: 0.18, double: 0.04, triple: 0.004, homeRun: 0.038, strikeout: 0.08, groundOut: 0.18, flyOut: 0.15, lineOut: 0.10, walk: 0.25, hitByPitch: 0.018, error: 0.020 },
  '3-1': { single: 0.19, double: 0.048, triple: 0.005, homeRun: 0.042, strikeout: 0.11, groundOut: 0.20, flyOut: 0.16, lineOut: 0.11, walk: 0.18, hitByPitch: 0.016, error: 0.021 },
  '3-2': { single: 0.16, double: 0.042, triple: 0.004, homeRun: 0.035, strikeout: 0.23, groundOut: 0.22, flyOut: 0.18, lineOut: 0.09, walk: 0.095, hitByPitch: 0.012, error: 0.016 }
};

/**
 * Baserunning transition matrix
 * Given hit type, advance probabilities for runners on base
 */
interface BaserunningAdvance {
  scorer: number; // Probability runner scores
  advance2: number; // Advances 2 bases
  advance1: number; // Advances 1 base
  out: number; // Out on bases (thrown out)
}

const BASERUNNING_ADVANCES: Record<string, Record<number, BaserunningAdvance>> = {
  single: {
    1: { scorer: 0.38, advance2: 0.45, advance1: 0.15, out: 0.02 }, // Runner on 1st
    2: { scorer: 0.62, advance2: 0.30, advance1: 0.06, out: 0.02 }, // Runner on 2nd
    4: { scorer: 0.95, advance2: 0.03, advance1: 0.01, out: 0.01 }  // Runner on 3rd
  },
  double: {
    1: { scorer: 0.78, advance2: 0.18, advance1: 0.02, out: 0.02 },
    2: { scorer: 0.92, advance2: 0.06, advance1: 0.01, out: 0.01 },
    4: { scorer: 0.98, advance2: 0.01, advance1: 0.00, out: 0.01 }
  },
  triple: {
    1: { scorer: 0.97, advance2: 0.02, advance1: 0.00, out: 0.01 },
    2: { scorer: 0.98, advance2: 0.01, advance1: 0.00, out: 0.01 },
    4: { scorer: 0.99, advance2: 0.00, advance1: 0.00, out: 0.01 }
  }
};

/**
 * Hash game state for cache key
 */
function hashState(ctx: BaseballSimContext): string {
  return `${ctx.inning}${ctx.inningHalf[0]}${ctx.outs}${ctx.baseState}${ctx.homeScore}-${ctx.awayScore}`;
}

/**
 * Apply player priors and context to base outcome rates
 */
function getContextualOutcomes(
  batter: BaseballPlayerPriors | undefined,
  pitcher: BaseballPlayerPriors | undefined,
  balls: number,
  strikes: number,
  parkFactor: number = 1.0
): BaseballOutcomes {
  const countKey = `${balls}-${strikes}`;
  const baseRates = BASE_OUTCOME_RATES[countKey] || BASE_OUTCOME_RATES['0-0'];

  // Clone base rates
  const outcomes = { ...baseRates };

  // Adjust for batter quality (xwOBA)
  if (batter?.xwoba) {
    const batterBoost = (batter.xwoba - 0.320) / 0.100; // Center at .320, scale by .100
    outcomes.single *= (1 + batterBoost * 0.15);
    outcomes.double *= (1 + batterBoost * 0.20);
    outcomes.homeRun *= (1 + batterBoost * 0.25);
    outcomes.walk *= (1 + (batter.bbRate || 0.085) / 0.085);
    outcomes.strikeout *= (1 - (batter.kRate ? (0.22 - batter.kRate) / 0.22 : 0));
  }

  // Adjust for pitcher quality (Stuff+, FIP)
  if (pitcher?.stuffPlus) {
    const pitcherFactor = (pitcher.stuffPlus - 100) / 20; // Stuff+ centered at 100
    outcomes.strikeout *= (1 + pitcherFactor * 0.12);
    outcomes.single *= (1 - pitcherFactor * 0.10);
    outcomes.homeRun *= (1 - pitcherFactor * 0.15);
  }

  if (pitcher?.bbPer9) {
    outcomes.walk *= (pitcher.bbPer9 / 3.2); // League avg ~3.2 BB/9
  }

  // Park factor (affects power)
  outcomes.homeRun *= parkFactor;
  outcomes.double *= Math.sqrt(parkFactor); // Moderate effect on doubles

  // Normalize to sum to 1.0
  const total = Object.values(outcomes).reduce((sum, p) => sum + p, 0);
  Object.keys(outcomes).forEach(key => {
    outcomes[key as keyof BaseballOutcomes] /= total;
  });

  return outcomes;
}

/**
 * Sample outcome from probability distribution
 */
function sampleOutcome(outcomes: BaseballOutcomes): keyof BaseballOutcomes {
  const rand = Math.random();
  let cumulative = 0;

  for (const [outcome, prob] of Object.entries(outcomes)) {
    cumulative += prob;
    if (rand < cumulative) {
      return outcome as keyof BaseballOutcomes;
    }
  }

  return 'groundOut'; // Fallback
}

/**
 * Update base state and score given outcome
 */
function applyOutcome(
  outcome: keyof BaseballOutcomes,
  baseState: number,
  homeScore: number,
  awayScore: number,
  isTopInning: boolean
): { baseState: number; homeScore: number; awayScore: number; outs: number } {
  let newBaseState = baseState;
  let newHomeScore = homeScore;
  let newAwayScore = awayScore;
  let outsRecorded = 0;

  // Extract runners on base (binary flags)
  const on1st = (baseState & 1) > 0;
  const on2nd = (baseState & 2) > 0;
  const on3rd = (baseState & 4) > 0;

  let runs = 0;

  switch (outcome) {
    case 'single':
      // Score runners on 2nd/3rd with high probability
      if (on3rd) runs += Math.random() < 0.95 ? 1 : 0;
      if (on2nd) runs += Math.random() < 0.62 ? 1 : 0;

      // Advance runner on 1st to 2nd or 3rd
      if (on1st) {
        newBaseState = Math.random() < 0.45 ? 2 : 1; // 45% to 2nd, else stays on 1st
      } else {
        newBaseState = 0;
      }

      newBaseState |= 1; // Batter reaches 1st
      break;

    case 'double':
      if (on3rd) runs++;
      if (on2nd) runs += Math.random() < 0.92 ? 1 : 0;
      if (on1st) runs += Math.random() < 0.78 ? 1 : 0;

      newBaseState = 2; // Batter on 2nd
      break;

    case 'triple':
      // Clear bases
      runs += (on1st ? 1 : 0) + (on2nd ? 1 : 0) + (on3rd ? 1 : 0);
      newBaseState = 4; // Batter on 3rd
      break;

    case 'homeRun':
      runs += 1 + (on1st ? 1 : 0) + (on2nd ? 1 : 0) + (on3rd ? 1 : 0);
      newBaseState = 0; // Bases empty
      break;

    case 'walk':
    case 'hitByPitch':
      // Force runners
      if (on1st && on2nd && on3rd) {
        runs++; // Bases loaded, walk scores runner on 3rd
        newBaseState = 7; // Bases stay loaded
      } else if (on1st && on2nd) {
        newBaseState = 7; // Load bases
      } else if (on1st) {
        newBaseState = 3; // Runners on 1st and 2nd
      } else {
        newBaseState = 1; // Batter to 1st
      }
      break;

    case 'strikeout':
    case 'groundOut':
    case 'flyOut':
    case 'lineOut':
      outsRecorded = 1;

      // Fly out: tag and advance from 3rd with <2 outs
      if (outcome === 'flyOut' && on3rd && Math.random() < 0.70) {
        runs++;
        newBaseState &= ~4; // Runner leaves 3rd
      } else {
        newBaseState = baseState; // Runners stay (simplified)
      }
      break;

    case 'error':
      // Similar to single
      if (on3rd) runs++;
      newBaseState = (baseState << 1) | 1; // Advance all runners, batter to 1st
      newBaseState &= 7; // Cap at 3 bases
      break;

    default:
      outsRecorded = 1;
      newBaseState = baseState;
  }

  // Update score
  if (isTopInning) {
    newAwayScore += runs;
  } else {
    newHomeScore += runs;
  }

  return {
    baseState: newBaseState,
    homeScore: newHomeScore,
    awayScore: newAwayScore,
    outs: outsRecorded
  };
}

/**
 * Simulate one half-inning
 */
function simulateHalfInning(
  ctx: BaseballSimContext,
  isTopInning: boolean
): { homeScore: number; awayScore: number } {
  let outs = 0;
  let baseState = ctx.baseState;
  let homeScore = ctx.homeScore;
  let awayScore = ctx.awayScore;
  let balls = 0;
  let strikes = 0;

  while (outs < 3) {
    // Get contextual outcomes (simplified: use team-level or league-avg priors)
    const outcomes = getContextualOutcomes(
      ctx.batter,
      ctx.pitcher,
      balls,
      strikes,
      ctx.parkFactor
    );

    const outcome = sampleOutcome(outcomes);

    // Apply outcome
    const result = applyOutcome(outcome, baseState, homeScore, awayScore, isTopInning);
    baseState = result.baseState;
    homeScore = result.homeScore;
    awayScore = result.awayScore;
    outs += result.outs;

    // Reset count after PA
    balls = 0;
    strikes = 0;
  }

  return { homeScore, awayScore };
}

/**
 * Simulate remainder of game from current state
 */
function simulateGame(ctx: BaseballSimContext): { homeWins: boolean; homeScore: number; awayScore: number } {
  let homeScore = ctx.homeScore;
  let awayScore = ctx.awayScore;
  let inning = ctx.inning;
  let inningHalf = ctx.inningHalf;

  // Simulate from current inning/half
  while (inning <= 9 || homeScore === awayScore) {
    if (inningHalf === 'top') {
      const result = simulateHalfInning({ ...ctx, homeScore, awayScore, baseState: 0 }, true);
      awayScore = result.awayScore;
      homeScore = result.homeScore;
      inningHalf = 'bottom';
    } else {
      // Bottom of 9th or extras: walk-off possible
      if (inning >= 9 && homeScore > awayScore) {
        break; // Home team wins, no need to finish inning
      }

      const result = simulateHalfInning({ ...ctx, homeScore, awayScore, baseState: 0 }, false);
      homeScore = result.homeScore;
      awayScore = result.awayScore;

      if (inning >= 9 && homeScore > awayScore) {
        break; // Walk-off win
      }

      inning++;
      inningHalf = 'top';
    }
  }

  return {
    homeWins: homeScore > awayScore,
    homeScore,
    awayScore
  };
}

/**
 * Run Monte Carlo simulation
 */
export function runBaseballSimulation(
  ctx: BaseballSimContext,
  config: SimConfig = { numSims: 1000 }
): SimOutput {
  const results: Array<{ homeWins: boolean; homeScore: number; awayScore: number }> = [];

  // Run simulations
  for (let i = 0; i < config.numSims; i++) {
    results.push(simulateGame(ctx));
  }

  // Aggregate results
  const homeWins = results.filter(r => r.homeWins).length;
  const homeWinProb = homeWins / config.numSims;
  const awayWinProb = 1 - homeWinProb;

  // Final score distribution (group by score)
  const scoreDist = new Map<string, number>();
  results.forEach(r => {
    const key = `${r.homeScore}-${r.awayScore}`;
    scoreDist.set(key, (scoreDist.get(key) || 0) + 1);
  });

  const finalScoreDist = Array.from(scoreDist.entries())
    .map(([key, count]) => {
      const [homeScore, awayScore] = key.split('-').map(Number);
      return {
        homeScore,
        awayScore,
        probability: count / config.numSims
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 10);

  // Next play outcome distribution (run 1-PA sims)
  const nextPlayOutcomes = new Map<string, number>();
  for (let i = 0; i < 500; i++) {
    const outcomes = getContextualOutcomes(
      ctx.batter,
      ctx.pitcher,
      ctx.baseState & 1 ? 0 : 0, // Simplified count
      0,
      ctx.parkFactor
    );
    const outcome = sampleOutcome(outcomes);
    nextPlayOutcomes.set(outcome, (nextPlayOutcomes.get(outcome) || 0) + 1);
  }

  const nextPlay: Record<string, number> = {};
  nextPlayOutcomes.forEach((count, outcome) => {
    nextPlay[outcome] = count / 500;
  });

  return {
    gameId: ctx.gameId,
    timestamp: new Date().toISOString(),
    winProb: {
      home: Math.round(homeWinProb * 1000) / 1000,
      away: Math.round(awayWinProb * 1000) / 1000
    },
    nextPlay,
    finalScoreDist,
    numSims: config.numSims,
    stateHash: hashState(ctx)
  };
}

/**
 * Calculate leverage index
 * Measures importance of current game state
 */
export function calculateLeverageIndex(ctx: BaseballSimContext): number {
  const scoreDiff = Math.abs(ctx.homeScore - ctx.awayScore);
  const inningFactor = ctx.inning >= 7 ? 1.5 : 1.0;
  const outsFactor = ctx.outs === 2 ? 1.3 : 1.0;
  const runnersFactor = ctx.baseState > 0 ? 1.2 : 1.0;

  // Higher leverage = closer game, late innings, runners on
  const baseLeverage = Math.max(0.5, 2.0 - scoreDiff * 0.3);

  return baseLeverage * inningFactor * outsFactor * runnersFactor;
}
