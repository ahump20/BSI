/**
 * HAV-F (Hits / At-Bat Quality / Velocity Proxy / Fielding)
 *
 * BSI's proprietary composite player evaluation metric on a 0–100 scale.
 * Each dimension is percentile-normalized against same-league, same-season peers.
 *
 * Weights: H 35% | A 25% | V 25% | F 15%
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HAVFBattingInput {
  avg: number;
  obp: number;
  slg: number;
  woba: number;
  iso: number;
  bbPct: number;   // Walk rate as percentage (e.g. 10.5)
  kPct: number;    // Strikeout rate as percentage
  babip: number;
  hrRate: number;  // HR / PA as percentage
}

export interface HAVFFieldingInput {
  fieldingPct: number;  // 0–1 scale (e.g. 0.975)
  putouts: number;
  assists: number;
  games: number;
  errors: number;
}

export interface HAVFInput {
  batting: HAVFBattingInput;
  fielding: HAVFFieldingInput;
}

export interface PercentileTable {
  /** For each stat, a sorted array of values from the league population */
  avg: number[];
  obp: number[];
  slg: number[];
  woba: number[];
  iso: number[];
  bbPct: number[];
  kPct: number[];
  babip: number[];
  hrRate: number[];
  fieldingPct: number[];
  rangeFactor: number[];
  assistsPerGame: number[];
}

export interface HAVFResult {
  hScore: number;   // 0–100
  aScore: number;   // 0–100
  vScore: number;   // 0–100
  fScore: number;   // 0–100
  composite: number; // 0–100 weighted
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

const W_H = 0.35;
const W_A = 0.25;
const W_V = 0.25;
const W_F = 0.15;

// Sub-weights within each dimension
const H_WEIGHTS = { avg: 0.15, obp: 0.25, slg: 0.25, woba: 0.25, iso: 0.10 };
const A_WEIGHTS = { bbPct: 0.30, invKPct: 0.30, babip: 0.20, hrRate: 0.20 };
const V_WEIGHTS = { iso: 0.40, slg: 0.30, hrRate: 0.30 };
const F_WEIGHTS = { fieldingPct: 0.50, rangeFactor: 0.30, assistsPerGame: 0.20 };

// ---------------------------------------------------------------------------
// Core Computation
// ---------------------------------------------------------------------------

export function computeHAVF(input: HAVFInput, percentiles: PercentileTable): HAVFResult {
  const { batting, fielding } = input;
  const rangeFactor = fielding.games > 0
    ? (fielding.putouts + fielding.assists) / fielding.games
    : 0;
  const assistsPerGame = fielding.games > 0
    ? fielding.assists / fielding.games
    : 0;

  // H (Hitting): weighted percentile of AVG, OBP, SLG, wOBA, ISO
  const hScore = clamp100(
    H_WEIGHTS.avg * pctRank(batting.avg, percentiles.avg) +
    H_WEIGHTS.obp * pctRank(batting.obp, percentiles.obp) +
    H_WEIGHTS.slg * pctRank(batting.slg, percentiles.slg) +
    H_WEIGHTS.woba * pctRank(batting.woba, percentiles.woba) +
    H_WEIGHTS.iso * pctRank(batting.iso, percentiles.iso)
  );

  // A (At-Bat Quality): BB%, inverse K%, BABIP, HR rate
  const aScore = clamp100(
    A_WEIGHTS.bbPct * pctRank(batting.bbPct, percentiles.bbPct) +
    A_WEIGHTS.invKPct * (100 - pctRank(batting.kPct, percentiles.kPct)) +
    A_WEIGHTS.babip * pctRank(batting.babip, percentiles.babip) +
    A_WEIGHTS.hrRate * pctRank(batting.hrRate, percentiles.hrRate)
  );

  // V (Velocity proxy): ISO, SLG, HR rate — power indicators
  const vScore = clamp100(
    V_WEIGHTS.iso * pctRank(batting.iso, percentiles.iso) +
    V_WEIGHTS.slg * pctRank(batting.slg, percentiles.slg) +
    V_WEIGHTS.hrRate * pctRank(batting.hrRate, percentiles.hrRate)
  );

  // F (Fielding): fielding%, range factor, assists/game
  const fScore = clamp100(
    F_WEIGHTS.fieldingPct * pctRank(fielding.fieldingPct, percentiles.fieldingPct) +
    F_WEIGHTS.rangeFactor * pctRank(rangeFactor, percentiles.rangeFactor) +
    F_WEIGHTS.assistsPerGame * pctRank(assistsPerGame, percentiles.assistsPerGame)
  );

  const composite = round1(
    W_H * hScore + W_A * aScore + W_V * vScore + W_F * fScore
  );

  return {
    hScore: round1(hScore),
    aScore: round1(aScore),
    vScore: round1(vScore),
    fScore: round1(fScore),
    composite,
  };
}

// ---------------------------------------------------------------------------
// Percentile Table Builder
// ---------------------------------------------------------------------------

export function buildPercentileTable(
  players: Array<{ batting: HAVFBattingInput; fielding: HAVFFieldingInput }>
): PercentileTable {
  const extract = (fn: (p: typeof players[0]) => number) =>
    players.map(fn).sort((a, b) => a - b);

  return {
    avg: extract(p => p.batting.avg),
    obp: extract(p => p.batting.obp),
    slg: extract(p => p.batting.slg),
    woba: extract(p => p.batting.woba),
    iso: extract(p => p.batting.iso),
    bbPct: extract(p => p.batting.bbPct),
    kPct: extract(p => p.batting.kPct),
    babip: extract(p => p.batting.babip),
    hrRate: extract(p => p.batting.hrRate),
    fieldingPct: extract(p => p.fielding.fieldingPct),
    rangeFactor: extract(p =>
      p.fielding.games > 0 ? (p.fielding.putouts + p.fielding.assists) / p.fielding.games : 0
    ),
    assistsPerGame: extract(p =>
      p.fielding.games > 0 ? p.fielding.assists / p.fielding.games : 0
    ),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Percentile rank: what % of the sorted population this value beats (0–100) */
function pctRank(value: number, sorted: number[]): number {
  if (sorted.length === 0) return 50;
  let count = 0;
  for (const v of sorted) {
    if (v < value) count++;
    else break;
  }
  return (count / sorted.length) * 100;
}

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
