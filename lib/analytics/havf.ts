/**
 * HAV-F (Hits/At-Bats/Velocity/Fielding) — BSI Proprietary Composite
 *
 * A unified player evaluation metric combining:
 *   H — Hit quality: contact quality via BABIP, ISO, and line-drive proxies
 *   A — At-bat discipline: plate approach via BB%, K%, and selectivity
 *   V — Velocity impact: power proxy via ISO/SLG for batters, K rate for pitchers
 *   F — Fielding reliability: defensive contribution via fielding pct and assists
 *
 * Scale: 0–100 per component (50 = D1 average). Overall is a weighted composite.
 * Weights: H=0.30, A=0.25, V=0.25, F=0.20
 *
 * @see lib/analytics/sabermetrics.ts for underlying advanced stat computation
 */

import type { BattingAdvanced, PitchingAdvanced } from './sabermetrics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HAVFScore {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  overall: number;
  components: {
    hits: number;
    atBats: number;
    velocity: number;
    fielding: number;
  };
  percentile: number;
  trend: 'rising' | 'steady' | 'falling';
  meta: {
    source: string;
    computed_at: string;
    timezone: 'America/Chicago';
    sample_size: number;
  };
}

export interface HAVFLeaderboard {
  players: HAVFScore[];
  totalPlayers: number;
  filters: {
    team?: string;
    position?: string;
    conference?: string;
  };
  meta: {
    source: string;
    computed_at: string;
    timezone: 'America/Chicago';
  };
}

// ---------------------------------------------------------------------------
// Constants — D1 population benchmarks (approximate 50th percentile)
// ---------------------------------------------------------------------------

const D1_BENCHMARKS = {
  // Batting
  babip: { mean: 0.310, stdDev: 0.050 },
  iso: { mean: 0.130, stdDev: 0.060 },
  bbPct: { mean: 10.0, stdDev: 4.0 },
  kPct: { mean: 20.0, stdDev: 6.0 },
  woba: { mean: 0.340, stdDev: 0.050 },
  ops: { mean: 0.780, stdDev: 0.120 },
  slg: { mean: 0.410, stdDev: 0.090 },
  // Pitching
  fip: { mean: 4.20, stdDev: 1.20 },
  kPer9: { mean: 8.0, stdDev: 2.5 },
  bbPer9: { mean: 3.5, stdDev: 1.5 },
  whip: { mean: 1.35, stdDev: 0.25 },
};

const COMPONENT_WEIGHTS = {
  hits: 0.30,
  atBats: 0.25,
  velocity: 0.25,
  fielding: 0.20,
};

// ---------------------------------------------------------------------------
// Z-score normalization → 0–100 scale
// ---------------------------------------------------------------------------

function zScore(value: number, mean: number, stdDev: number): number {
  return stdDev > 0 ? (value - mean) / stdDev : 0;
}

/** Convert z-score to 0–100 scale where 50 = league mean. Clamp to [0, 100]. */
function zToScale(z: number): number {
  return Math.max(0, Math.min(100, 50 + z * 15));
}

/** Invert z-score for stats where lower is better (K%, ERA, etc.) */
function zToScaleInverted(z: number): number {
  return Math.max(0, Math.min(100, 50 - z * 15));
}

// ---------------------------------------------------------------------------
// HAV-F Computation — Batters
// ---------------------------------------------------------------------------

export interface FieldingInput {
  fieldingPct?: number;
  putouts?: number;
  assists?: number;
  errors?: number;
  gamesPlayed?: number;
}

export function computeBatterHAVF(
  stats: BattingAdvanced,
  team: string,
  fielding?: FieldingInput,
): HAVFScore {
  // H: Hit quality — BABIP + ISO composite
  const babipZ = zScore(stats.babip, D1_BENCHMARKS.babip.mean, D1_BENCHMARKS.babip.stdDev);
  const isoZ = zScore(stats.iso, D1_BENCHMARKS.iso.mean, D1_BENCHMARKS.iso.stdDev);
  const hitsComponent = zToScale((babipZ * 0.55 + isoZ * 0.45));

  // A: At-bat discipline — BB% (positive), K% (negative)
  const bbZ = zScore(stats.bbPct, D1_BENCHMARKS.bbPct.mean, D1_BENCHMARKS.bbPct.stdDev);
  const kZ = zScore(stats.kPct, D1_BENCHMARKS.kPct.mean, D1_BENCHMARKS.kPct.stdDev);
  const atBatsComponent = zToScale(bbZ * 0.55 - kZ * 0.45);

  // V: Velocity impact — ISO + SLG as exit-velo proxy
  const slgZ = zScore(stats.slg, D1_BENCHMARKS.slg.mean, D1_BENCHMARKS.slg.stdDev);
  const velocityComponent = zToScale((isoZ * 0.60 + slgZ * 0.40));

  // F: Fielding — use fielding pct if available, else estimate from position
  let fieldingComponent = 50; // default to average
  if (fielding && fielding.fieldingPct !== undefined) {
    // Fielding pct is typically 0.950-1.000 range
    const fpZ = (fielding.fieldingPct - 0.970) / 0.015;
    fieldingComponent = zToScale(fpZ);
  }

  const overall = round1(
    hitsComponent * COMPONENT_WEIGHTS.hits +
    atBatsComponent * COMPONENT_WEIGHTS.atBats +
    velocityComponent * COMPONENT_WEIGHTS.velocity +
    fieldingComponent * COMPONENT_WEIGHTS.fielding
  );

  return {
    playerId: stats.playerID,
    playerName: stats.name,
    position: stats.pos,
    team,
    overall,
    components: {
      hits: round1(hitsComponent),
      atBats: round1(atBatsComponent),
      velocity: round1(velocityComponent),
      fielding: round1(fieldingComponent),
    },
    percentile: 0, // Set later when ranking against population
    trend: 'steady',
    meta: {
      source: 'bsi-havf-engine',
      computed_at: new Date().toISOString(),
      timezone: 'America/Chicago',
      sample_size: stats.pa,
    },
  };
}

// ---------------------------------------------------------------------------
// HAV-F Computation — Pitchers
// ---------------------------------------------------------------------------

export function computePitcherHAVF(
  stats: PitchingAdvanced,
  team: string,
): HAVFScore {
  // H: Hit suppression — WHIP (inverted: lower is better)
  const whipZ = zScore(stats.whip, D1_BENCHMARKS.whip.mean, D1_BENCHMARKS.whip.stdDev);
  const hitsComponent = zToScaleInverted(whipZ);

  // A: Command — BB/9 (inverted) + K/BB ratio
  const bbZ = zScore(stats.bbPer9, D1_BENCHMARKS.bbPer9.mean, D1_BENCHMARKS.bbPer9.stdDev);
  const kbbZ = zScore(stats.kBbRatio, 2.5, 1.0); // D1 avg K/BB ~2.5
  const atBatsComponent = zToScale(-bbZ * 0.50 + kbbZ * 0.50);

  // V: Stuff — K/9 (higher = more dominant)
  const kZ = zScore(stats.kPer9, D1_BENCHMARKS.kPer9.mean, D1_BENCHMARKS.kPer9.stdDev);
  const velocityComponent = zToScale(kZ);

  // F: Fielding — FIP vs ERA gap (lower FIP = better at controlling what they can control)
  const fipZ = zScore(stats.fip, D1_BENCHMARKS.fip.mean, D1_BENCHMARKS.fip.stdDev);
  const fieldingComponent = zToScaleInverted(fipZ);

  const overall = round1(
    hitsComponent * COMPONENT_WEIGHTS.hits +
    atBatsComponent * COMPONENT_WEIGHTS.atBats +
    velocityComponent * COMPONENT_WEIGHTS.velocity +
    fieldingComponent * COMPONENT_WEIGHTS.fielding
  );

  return {
    playerId: stats.playerID,
    playerName: stats.name,
    position: stats.pos,
    team,
    overall,
    components: {
      hits: round1(hitsComponent),
      atBats: round1(atBatsComponent),
      velocity: round1(velocityComponent),
      fielding: round1(fieldingComponent),
    },
    percentile: 0,
    trend: 'steady',
    meta: {
      source: 'bsi-havf-engine',
      computed_at: new Date().toISOString(),
      timezone: 'America/Chicago',
      sample_size: Math.round(stats.ip),
    },
  };
}

// ---------------------------------------------------------------------------
// Population Ranking
// ---------------------------------------------------------------------------

export function rankHAVFScores(scores: HAVFScore[]): HAVFScore[] {
  const sorted = [...scores].sort((a, b) => b.overall - a.overall);
  return sorted.map((score, i) => ({
    ...score,
    percentile: round1(((sorted.length - i) / sorted.length) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round1(n: number): number { return Math.round(n * 10) / 10; }
