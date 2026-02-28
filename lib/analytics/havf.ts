/**
 * HAV-F Computation Engine
 *
 * Hits / At-Bat Quality / Velocity / Fielding — a composite player evaluation
 * metric built for BSI. Each component scores 0-100 via percentile rank against
 * the supplied cohort, then the four components are weighted into a single
 * composite. No external calls — pure math against whatever data you feed it.
 *
 * Component weights:
 *   H (Hitting)         0.30
 *   A (At-Bat Quality)  0.25
 *   V (Velocity proxy)  0.25
 *   F (Fielding)        0.20
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw stats needed to compute HAV-F. Batting fields match BattingAdvanced. */
export interface HAVFInput {
  playerID: string;
  name: string;
  team: string;
  league: string;
  season: number;

  // Batting (from BattingAdvanced)
  avg: number;
  obp: number;
  slg: number;
  woba: number;
  iso: number;
  bbPct: number;
  kPct: number;
  babip: number;
  hrPct: number;

  // Fielding
  fieldingPct: number | null;
  rangeFactor: number | null;
  games: number | null;
}

/** Breakdown of sub-stat contributions within each component. */
export interface HAVFComponentBreakdown {
  h: { avg: number; obp: number; slg: number; woba: number; iso: number };
  a: { bbPct: number; kPctInv: number; babip: number; hrPct: number };
  v: { iso: number; slg: number; hrPct: number };
  f: { fieldingPct: number | null; rangeFactor: number | null };
}

/** Full HAV-F result for a single player. */
export interface HAVFResult {
  playerID: string;
  name: string;
  team: string;
  league: string;
  season: number;

  h_score: number;
  a_score: number;
  v_score: number;
  f_score: number;
  havf_composite: number;

  breakdown: HAVFComponentBreakdown;

  meta: {
    source: string;
    computed_at: string;
    timezone: string;
  };
}

/** Sorted arrays of stat values for percentile lookup. */
export type PercentileTable = Record<string, number[]>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const HAVF_WEIGHTS = {
  H: 0.30,
  A: 0.25,
  V: 0.25,
  F: 0.20,
} as const;

// Sub-weights within each component
const H_WEIGHTS = { avg: 0.25, obp: 0.25, slg: 0.20, woba: 0.20, iso: 0.10 };
const A_WEIGHTS = { bbPct: 0.30, kPctInv: 0.30, babip: 0.20, hrPct: 0.20 };
const V_WEIGHTS = { iso: 0.40, slg: 0.35, hrPct: 0.25 };
const F_WEIGHTS = { fieldingPct: 0.60, rangeFactor: 0.40 };

// Stats tracked in the percentile table
const PERCENTILE_STATS = [
  'avg', 'obp', 'slg', 'woba', 'iso',
  'bbPct', 'kPct', 'babip', 'hrPct',
  'fieldingPct', 'rangeFactor',
] as const;

// ---------------------------------------------------------------------------
// Rounding helpers
// ---------------------------------------------------------------------------

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ---------------------------------------------------------------------------
// Percentile Rank
// ---------------------------------------------------------------------------

/**
 * Binary search to find where `value` falls in a sorted distribution.
 * Returns 0-100. Empty distributions return 50 (league-average assumption).
 */
export function percentileRank(value: number, distribution: number[]): number {
  const len = distribution.length;
  if (len === 0) return 50;

  // Binary search: count of values <= value
  let lo = 0;
  let hi = len;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (distribution[mid] <= value) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  // lo = number of values <= value
  // Percentile = (count below + 0.5 * count equal) / total * 100
  // Simplified: lo / len * 100 gives the upper-bound percentile.
  // Adjust to midpoint of the tie range for fairness.
  let countBelow = lo;
  // Walk back to find start of tie range
  let countEqual = 0;
  let i = lo - 1;
  while (i >= 0 && distribution[i] === value) {
    countEqual++;
    i--;
  }
  countBelow = countBelow - countEqual;

  return round1(((countBelow + 0.5 * countEqual) / len) * 100);
}

// ---------------------------------------------------------------------------
// Component Scores
// ---------------------------------------------------------------------------

/**
 * H-Score (Hitting): AVG 25%, OBP 25%, SLG 20%, wOBA 20%, ISO 10%
 */
export function computeHScore(
  input: HAVFInput,
  percentiles: PercentileTable,
): number {
  const pAvg = percentileRank(input.avg, percentiles['avg'] ?? []);
  const pObp = percentileRank(input.obp, percentiles['obp'] ?? []);
  const pSlg = percentileRank(input.slg, percentiles['slg'] ?? []);
  const pWoba = percentileRank(input.woba, percentiles['woba'] ?? []);
  const pIso = percentileRank(input.iso, percentiles['iso'] ?? []);

  return round1(
    H_WEIGHTS.avg * pAvg +
    H_WEIGHTS.obp * pObp +
    H_WEIGHTS.slg * pSlg +
    H_WEIGHTS.woba * pWoba +
    H_WEIGHTS.iso * pIso,
  );
}

/**
 * A-Score (At-Bat Quality): BB% 30%, inverse K% 30%, BABIP 20%, HR% 20%
 * K% is inverted — lower K% means higher quality at-bats.
 */
export function computeAScore(
  input: HAVFInput,
  percentiles: PercentileTable,
): number {
  const pBb = percentileRank(input.bbPct, percentiles['bbPct'] ?? []);
  // Invert K%: percentile rank gives "% of players you strike out less than",
  // so 100 - rank = quality (fewer strikeouts = better).
  const pKRaw = percentileRank(input.kPct, percentiles['kPct'] ?? []);
  const pKInv = 100 - pKRaw;
  const pBabip = percentileRank(input.babip, percentiles['babip'] ?? []);
  const pHr = percentileRank(input.hrPct, percentiles['hrPct'] ?? []);

  return round1(
    A_WEIGHTS.bbPct * pBb +
    A_WEIGHTS.kPctInv * pKInv +
    A_WEIGHTS.babip * pBabip +
    A_WEIGHTS.hrPct * pHr,
  );
}

/**
 * V-Score (Velocity proxy): ISO 40%, SLG 35%, HR% 25%
 * Without exit velocity data, power metrics serve as the proxy.
 */
export function computeVScore(
  input: HAVFInput,
  percentiles: PercentileTable,
): number {
  const pIso = percentileRank(input.iso, percentiles['iso'] ?? []);
  const pSlg = percentileRank(input.slg, percentiles['slg'] ?? []);
  const pHr = percentileRank(input.hrPct, percentiles['hrPct'] ?? []);

  return round1(
    V_WEIGHTS.iso * pIso +
    V_WEIGHTS.slg * pSlg +
    V_WEIGHTS.hrPct * pHr,
  );
}

/**
 * F-Score (Fielding): fielding_pct 60%, range_factor 40%
 * Returns 50 (neutral) if no fielding data is available.
 */
export function computeFScore(
  input: HAVFInput,
  percentiles: PercentileTable,
): number {
  if (input.fieldingPct == null && input.rangeFactor == null) {
    return 50;
  }

  let score = 0;
  let totalWeight = 0;

  if (input.fieldingPct != null) {
    score += F_WEIGHTS.fieldingPct * percentileRank(input.fieldingPct, percentiles['fieldingPct'] ?? []);
    totalWeight += F_WEIGHTS.fieldingPct;
  }

  if (input.rangeFactor != null) {
    score += F_WEIGHTS.rangeFactor * percentileRank(input.rangeFactor, percentiles['rangeFactor'] ?? []);
    totalWeight += F_WEIGHTS.rangeFactor;
  }

  // Normalize to 0-100 if only partial fielding data exists
  return round1(totalWeight > 0 ? score / totalWeight : 50);
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Compute full HAV-F result for a single player against the given percentile table.
 */
export function computeHAVF(
  input: HAVFInput,
  percentiles: PercentileTable,
): HAVFResult {
  const h = computeHScore(input, percentiles);
  const a = computeAScore(input, percentiles);
  const v = computeVScore(input, percentiles);
  const f = computeFScore(input, percentiles);

  const composite = round2(
    HAVF_WEIGHTS.H * h +
    HAVF_WEIGHTS.A * a +
    HAVF_WEIGHTS.V * v +
    HAVF_WEIGHTS.F * f,
  );

  // Build breakdown with the raw percentile values for each sub-stat
  const breakdown: HAVFComponentBreakdown = {
    h: {
      avg: percentileRank(input.avg, percentiles['avg'] ?? []),
      obp: percentileRank(input.obp, percentiles['obp'] ?? []),
      slg: percentileRank(input.slg, percentiles['slg'] ?? []),
      woba: percentileRank(input.woba, percentiles['woba'] ?? []),
      iso: percentileRank(input.iso, percentiles['iso'] ?? []),
    },
    a: {
      bbPct: percentileRank(input.bbPct, percentiles['bbPct'] ?? []),
      kPctInv: round1(100 - percentileRank(input.kPct, percentiles['kPct'] ?? [])),
      babip: percentileRank(input.babip, percentiles['babip'] ?? []),
      hrPct: percentileRank(input.hrPct, percentiles['hrPct'] ?? []),
    },
    v: {
      iso: percentileRank(input.iso, percentiles['iso'] ?? []),
      slg: percentileRank(input.slg, percentiles['slg'] ?? []),
      hrPct: percentileRank(input.hrPct, percentiles['hrPct'] ?? []),
    },
    f: {
      fieldingPct: input.fieldingPct != null
        ? percentileRank(input.fieldingPct, percentiles['fieldingPct'] ?? [])
        : null,
      rangeFactor: input.rangeFactor != null
        ? percentileRank(input.rangeFactor, percentiles['rangeFactor'] ?? [])
        : null,
    },
  };

  return {
    playerID: input.playerID,
    name: input.name,
    team: input.team,
    league: input.league,
    season: input.season,
    h_score: h,
    a_score: a,
    v_score: v,
    f_score: f,
    havf_composite: composite,
    breakdown,
    meta: {
      source: 'bsi-havf',
      computed_at: new Date().toISOString(),
      timezone: 'America/Chicago',
    },
  };
}

// ---------------------------------------------------------------------------
// Percentile Table Builder
// ---------------------------------------------------------------------------

/**
 * Given a cohort of players, extract and sort each stat into a percentile table.
 * Only non-null values are included in fielding distributions.
 */
export function buildPercentileTable(players: HAVFInput[]): PercentileTable {
  const table: PercentileTable = {};

  for (const stat of PERCENTILE_STATS) {
    const values: number[] = [];
    for (const p of players) {
      const val = p[stat];
      if (val != null) {
        values.push(val);
      }
    }
    values.sort((a, b) => a - b);
    table[stat] = values;
  }

  return table;
}

// ---------------------------------------------------------------------------
// Batch
// ---------------------------------------------------------------------------

/**
 * Compute HAV-F for an entire cohort. Builds the percentile table from the
 * cohort itself, so every player is ranked relative to their peers.
 */
export function batchComputeHAVF(players: HAVFInput[]): HAVFResult[] {
  if (players.length === 0) return [];

  const percentiles = buildPercentileTable(players);
  return players.map(p => computeHAVF(p, percentiles));
}
