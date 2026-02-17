/**
 * MMI (Momentum Magnitude Index)
 *
 * Real-time game momentum metric: −100 (away dominant) to +100 (home dominant).
 * Designed for baseball but adaptable to other sports.
 *
 * Components:
 *   SD (Score Differential, 40%) — weighted by innings remaining
 *   RS (Recent Scoring, 30%)    — net runs in last 2 innings
 *   GP (Game Phase, 15%)        — late-game multiplier
 *   BS (Base Situation, 15%)    — current baserunner leverage
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MMIInput {
  homeScore: number;
  awayScore: number;
  currentInning: number;
  totalInnings: number;  // 9 for standard baseball
  inningHalf: 'top' | 'bottom';
  /** Net runs scored by home in last 2 innings */
  recentHomeRuns: number;
  /** Net runs scored by away in last 2 innings */
  recentAwayRuns: number;
  bases: { first: boolean; second: boolean; third: boolean };
  outs: number;
}

export interface MMIComponents {
  sd: number;
  rs: number;
  gp: number;
  bs: number;
  composite: number;
}

export interface MMIGameSummary {
  finalMMI: number;
  maxMMI: number;
  minMMI: number;
  momentumSwings: number;
  biggestSwing: number;
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

const W_SD = 0.40;
const W_RS = 0.30;
const W_GP = 0.15;
const W_BS = 0.15;

// ---------------------------------------------------------------------------
// Core Computation
// ---------------------------------------------------------------------------

export function computeMMI(input: MMIInput): number {
  return computeMMIComponents(input).composite;
}

export function computeMMIComponents(input: MMIInput): MMIComponents {
  const sd = computeScoreDifferential(input);
  const rs = computeRecentScoring(input);
  const gp = computeGamePhase(input);
  const bs = computeBaseSituation(input);

  const raw = W_SD * sd + W_RS * rs + W_GP * gp + W_BS * bs;
  const composite = clamp(raw, -100, 100);

  return {
    sd: round1(sd),
    rs: round1(rs),
    gp: round1(gp),
    bs: round1(bs),
    composite: round1(composite),
  };
}

// ---------------------------------------------------------------------------
// SD: Score Differential (scaled by innings remaining)
// ---------------------------------------------------------------------------

function computeScoreDifferential(input: MMIInput): number {
  const { homeScore, awayScore, currentInning, totalInnings } = input;
  const diff = homeScore - awayScore;
  const inningsRemaining = Math.max(0, totalInnings - currentInning);

  // A 1-run lead in the 9th matters more than in the 1st.
  // Scale factor: 1.0 at start, up to ~1.9 in the 9th.
  const urgency = 1 + 0.1 * (totalInnings - inningsRemaining);

  // Normalize so that a 5-run lead maxes out the SD component at ~±50
  const normalized = (diff / 5) * 50 * (urgency / totalInnings);
  return clamp(normalized, -100, 100);
}

// ---------------------------------------------------------------------------
// RS: Recent Scoring (net runs in last 2 innings)
// ---------------------------------------------------------------------------

function computeRecentScoring(input: MMIInput): number {
  const netRecent = input.recentHomeRuns - input.recentAwayRuns;
  // Normalize: 3-run net swing = full ±30 scale
  const normalized = (netRecent / 3) * 30;
  return clamp(normalized, -30, 30);
}

// ---------------------------------------------------------------------------
// GP: Game Phase Multiplier
// ---------------------------------------------------------------------------

function computeGamePhase(input: MMIInput): number {
  const { currentInning, totalInnings, homeScore, awayScore } = input;
  const diff = homeScore - awayScore;

  let multiplier: number;
  const thirdOfGame = totalInnings / 3;

  if (currentInning <= thirdOfGame) {
    multiplier = 0.7;     // Early game: momentum is volatile
  } else if (currentInning <= thirdOfGame * 2) {
    multiplier = 1.0;     // Mid game: standard
  } else if (currentInning <= totalInnings) {
    multiplier = 1.3;     // Late game: momentum crystallizes
  } else {
    multiplier = 1.5;     // Extra innings: every play magnified
  }

  // GP amplifies the direction of the current score
  const direction = diff > 0 ? 1 : diff < 0 ? -1 : 0;
  return direction * multiplier * 15;
}

// ---------------------------------------------------------------------------
// BS: Base Situation (baseball-specific leverage)
// ---------------------------------------------------------------------------

function computeBaseSituation(input: MMIInput): number {
  const { bases, outs, inningHalf } = input;

  // Sign: positive if home team benefits from the situation
  // In bottom half, home team is batting (positive if runners on)
  // In top half, away team is batting (negative if runners on)
  const sign = inningHalf === 'bottom' ? 1 : -1;

  let leverage = 0;
  if (bases.first) leverage += 3;
  if (bases.second) leverage += 7;
  if (bases.third) leverage += 8;

  // Bases loaded is special — extra leverage
  if (bases.first && bases.second && bases.third) {
    leverage = 15;
  }

  // More outs = less leverage from runners
  const outsFactor = outs === 0 ? 1.0 : outs === 1 ? 0.75 : 0.4;

  return sign * leverage * outsFactor;
}

// ---------------------------------------------------------------------------
// Game Summary (computed from an array of MMI snapshots)
// ---------------------------------------------------------------------------

export function computeGameSummary(snapshots: number[]): MMIGameSummary {
  if (snapshots.length === 0) {
    return { finalMMI: 0, maxMMI: 0, minMMI: 0, momentumSwings: 0, biggestSwing: 0 };
  }

  const finalMMI = snapshots[snapshots.length - 1];
  let maxMMI = -Infinity;
  let minMMI = Infinity;
  let momentumSwings = 0;
  let biggestSwing = 0;

  for (let i = 0; i < snapshots.length; i++) {
    const val = snapshots[i];
    if (val > maxMMI) maxMMI = val;
    if (val < minMMI) minMMI = val;

    if (i > 0) {
      const delta = Math.abs(val - snapshots[i - 1]);
      if (delta > biggestSwing) biggestSwing = delta;

      // A momentum swing = sign change in MMI
      if (
        (snapshots[i - 1] > 0 && val < 0) ||
        (snapshots[i - 1] < 0 && val > 0)
      ) {
        momentumSwings++;
      }
    }
  }

  return {
    finalMMI: round1(finalMMI),
    maxMMI: round1(maxMMI),
    minMMI: round1(minMMI),
    momentumSwings,
    biggestSwing: round1(biggestSwing),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
