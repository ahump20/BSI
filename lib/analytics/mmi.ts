/**
 * MMI (Momentum Magnitude Index) — in-game momentum computation for baseball.
 *
 * Pure math. No fetch, no KV, no D1. Takes a game state snapshot,
 * returns a signed momentum reading from -100 (away dominant) to +100
 * (home dominant).
 *
 * Formula:
 *   MMI = clamp(-100, 100, SD × 0.40 + RS × 0.30 + GP × 0.15 + BS × 0.15)
 *
 * where GP acts as a multiplier on the other three components before
 * weighting, not as a standalone additive term.
 *
 * Components:
 *   SD — Score Differential (leverage-adjusted by innings remaining)
 *   RS — Recent Scoring (net runs in last 2 innings)
 *   GP — Game Phase (multiplier: early=0.7, mid=1.0, late=1.3, extras=1.5)
 *   BS — Base Situation (runners on base, sign depends on who's batting)
 *
 * Related work: Sandlot-Sluggers repo (github.com/ahump20/Sandlot-Sluggers)
 * has `mmi-live/` with a pitch-level "Moment Mentality Index" (0-100,
 * z-score normalized: LI 35%, Pressure 20%, Fatigue 20%, Execution 15%,
 * Bio 10%). Different concept — per-pitch difficulty vs. per-game momentum.
 * Could complement this module as a micro-level overlay on the macro-level
 * momentum tracked here.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InningScore {
  inning: number;
  homeRuns: number;
  awayRuns: number;
}

export interface MMIInput {
  gameId: string;
  inning: number;
  inningHalf: 'top' | 'bottom';
  outs: number;
  homeScore: number;
  awayScore: number;
  /** [first, second, third] — true if a runner occupies that base */
  runnersOn: [boolean, boolean, boolean];
  /** Scoring breakdown for the two most recent completed innings */
  recentInnings: InningScore[];
  /** Regulation length — defaults to 9 */
  totalInnings?: number;
}

export interface MMIComponents {
  sd: number;
  rs: number;
  gp: number;
  bs: number;
}

export interface MMIMeta {
  source: 'bsi-mmi';
  computed_at: string;
  timezone: 'America/Chicago';
}

export interface MMISnapshot {
  value: number;
  direction: 'home' | 'away' | 'neutral';
  magnitude: 'low' | 'medium' | 'high' | 'extreme';
  components: MMIComponents;
  meta: MMIMeta;
}

export interface MMIGameSummary {
  gameId: string;
  snapshots: MMISnapshot[];
  maxMmi: number;
  minMmi: number;
  avgMmi: number;
  /** Standard deviation of snapshot values — higher means wilder game */
  volatility: number;
  leadChanges: number;
  maxSwing: number;
  swingInning: number | null;
  excitementRating: 'routine' | 'competitive' | 'thriller' | 'instant-classic';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MMI_WEIGHTS = {
  SD: 0.40,
  RS: 0.30,
  GP: 0.15,
  BS: 0.15,
} as const;

/**
 * TODO: User contribution point — tune these breakpoints based on observed
 * game data. Current defaults are evenly spaced across the 0–100 absolute
 * value range. Real-world distributions will likely cluster toward the lower
 * end, so the thresholds may need to shift down to keep "extreme" meaningful.
 *
 * Methodology for tuning:
 *   1. Collect MMI snapshots across 200+ games
 *   2. Plot the distribution of |MMI| values
 *   3. Set thresholds at ~60th / ~80th / ~95th percentiles
 *   4. Validate against known blowouts and walk-offs
 */
export const MAGNITUDE_THRESHOLDS = {
  low: 25,
  medium: 50,
  high: 75,
} as const;

/** Max run differential that maps to the ±100 boundary for SD */
const SD_CAP = 10;

/** Max net recent-inning runs that maps to the ±100 boundary for RS */
const RS_CAP = 6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Round to 1 decimal place */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Round to 2 decimal places */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Component Functions
// ---------------------------------------------------------------------------

/**
 * Score Differential — the raw lead/deficit, amplified by how many innings
 * remain. A 3-run lead in the 2nd means less than a 3-run lead in the 8th.
 *
 * Formula: (homeScore - awayScore) × (1 + 0.1 × inningsRemaining)
 * Normalized: ±10 run differential maps linearly to ±100.
 */
export function computeSD(
  homeScore: number,
  awayScore: number,
  inningsRemaining: number,
  _totalInnings: number,
): number {
  const diff = homeScore - awayScore;
  const leverageMultiplier = 1 + 0.1 * inningsRemaining;
  const raw = diff * leverageMultiplier;
  const capped = clamp(-SD_CAP, SD_CAP, raw);
  return (capped / SD_CAP) * 100;
}

/**
 * Recent Scoring — net runs in the last 2 completed innings. Captures
 * who has the hot hand right now, independent of total score.
 *
 * Net = sum(homeRuns - awayRuns) for each recent inning.
 * Capped at ±6 net runs, then scaled to -100..100.
 */
export function computeRS(recentInnings: InningScore[]): number {
  if (recentInnings.length === 0) return 0;

  const sliced = recentInnings.slice(-2);
  let net = 0;
  for (const inn of sliced) {
    net += inn.homeRuns - inn.awayRuns;
  }

  const capped = clamp(-RS_CAP, RS_CAP, net);
  return (capped / RS_CAP) * 100;
}

/**
 * Game Phase — a multiplier that increases the weight of momentum as the
 * game progresses. Early-game momentum is dampened; late-game and extras
 * are amplified.
 *
 * Returns a raw multiplier (not -100..100). This gets applied to the
 * weighted sum of SD, RS, BS before clamping.
 */
export function computeGP(inning: number, totalInnings: number): number {
  const regulation = totalInnings;
  const earlyEnd = Math.ceil(regulation / 3);       // innings 1-3 in a 9-inning game
  const midEnd = Math.ceil((regulation * 2) / 3);   // innings 4-6

  if (inning > regulation) return 1.5;
  if (inning > midEnd) return 1.3;
  if (inning > earlyEnd) return 1.0;
  return 0.7;
}

/**
 * Base Situation — current baserunner state contributes to momentum.
 * More threatening base situations (RISP, bases loaded) push momentum
 * toward the batting team.
 *
 * Sign convention:
 *   Bottom half → home team batting → positive
 *   Top half   → away team batting → negative
 */
export function computeBS(
  runnersOn: [boolean, boolean, boolean],
  inningHalf: 'top' | 'bottom',
): number {
  const [first, second, third] = runnersOn;
  const basesLoaded = first && second && third;
  const risp = second || third;

  let magnitude = 0;

  if (basesLoaded) {
    magnitude = 15;
  } else if (risp) {
    magnitude = 10;
  } else if (first && !second && !third) {
    magnitude = 3;
  }

  // Bottom half: home bats, momentum toward home (positive)
  // Top half: away bats, momentum toward away (negative)
  return inningHalf === 'bottom' ? magnitude : -magnitude;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export function classifyMagnitude(absValue: number): 'low' | 'medium' | 'high' | 'extreme' {
  const v = Math.abs(absValue);
  if (v >= MAGNITUDE_THRESHOLDS.high) return 'extreme';
  if (v >= MAGNITUDE_THRESHOLDS.medium) return 'high';
  if (v >= MAGNITUDE_THRESHOLDS.low) return 'medium';
  return 'low';
}

export function classifyDirection(value: number): 'home' | 'away' | 'neutral' {
  if (Math.abs(value) < 5) return 'neutral';
  return value > 0 ? 'home' : 'away';
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

function buildMeta(): MMIMeta {
  return {
    source: 'bsi-mmi',
    computed_at: new Date().toISOString(),
    timezone: 'America/Chicago',
  };
}

/**
 * Compute a single MMI snapshot from current game state.
 *
 * The game phase multiplier scales the combined weighted signal rather
 * than contributing as a separate additive term. This means late-game
 * situations naturally amplify whatever momentum already exists.
 */
export function computeMMI(input: MMIInput): MMISnapshot {
  const totalInnings = input.totalInnings ?? 9;

  // Innings remaining: for a 9-inning game in the 5th, that's 4 remaining.
  // In the bottom half, the home team has one more half-inning of that
  // inning still implicit, but we keep the calculation simple at the
  // full-inning level.
  const inningsRemaining = Math.max(0, totalInnings - input.inning);

  const sdRaw = computeSD(input.homeScore, input.awayScore, inningsRemaining, totalInnings);
  const rsRaw = computeRS(input.recentInnings);
  const gpMultiplier = computeGP(input.inning, totalInnings);
  const bsRaw = computeBS(input.runnersOn, input.inningHalf);

  // Weighted sum of the three directional components, then amplified by GP
  const weighted =
    (sdRaw * MMI_WEIGHTS.SD + rsRaw * MMI_WEIGHTS.RS + bsRaw * MMI_WEIGHTS.BS) * gpMultiplier;

  const value = round1(clamp(-100, 100, weighted));

  return {
    value,
    direction: classifyDirection(value),
    magnitude: classifyMagnitude(value),
    components: {
      sd: round2(sdRaw),
      rs: round2(rsRaw),
      gp: round2(gpMultiplier),
      bs: round2(bsRaw),
    },
    meta: buildMeta(),
  };
}

// ---------------------------------------------------------------------------
// Game Summary
// ---------------------------------------------------------------------------

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function classifyExcitement(
  volatility: number,
  leadChanges: number,
  maxSwing: number,
): MMIGameSummary['excitementRating'] {
  // Weighted score combining all three signals
  const score = volatility * 0.4 + leadChanges * 8 + maxSwing * 0.3;

  if (score >= 80) return 'instant-classic';
  if (score >= 50) return 'thriller';
  if (score >= 25) return 'competitive';
  return 'routine';
}

/**
 * Aggregate a sequence of MMI snapshots into a game-level summary.
 * Useful for post-game analysis, editorial tagging, and historical comparison.
 */
export function computeGameSummary(
  gameId: string,
  snapshots: MMISnapshot[],
): MMIGameSummary {
  if (snapshots.length === 0) {
    return {
      gameId,
      snapshots,
      maxMmi: 0,
      minMmi: 0,
      avgMmi: 0,
      volatility: 0,
      leadChanges: 0,
      maxSwing: 0,
      swingInning: null,
      excitementRating: 'routine',
    };
  }

  const values = snapshots.map((s) => s.value);
  const maxMmi = round1(Math.max(...values));
  const minMmi = round1(Math.min(...values));
  const avgMmi = round1(values.reduce((a, b) => a + b, 0) / values.length);
  const volatility = round2(stddev(values));

  // Lead changes: count transitions where the sign of MMI flips
  // (ignoring neutral zone crossings that don't represent a true lead change)
  let leadChanges = 0;
  let prevSign: 'home' | 'away' | null = null;
  for (const snap of snapshots) {
    if (snap.direction === 'neutral') continue;
    if (prevSign !== null && snap.direction !== prevSign) {
      leadChanges++;
    }
    prevSign = snap.direction;
  }

  // Max single-step swing and its position in the sequence
  let maxSwing = 0;
  let swingIndex: number | null = null;
  for (let i = 1; i < snapshots.length; i++) {
    const swing = Math.abs(snapshots[i].value - snapshots[i - 1].value);
    if (swing > maxSwing) {
      maxSwing = round1(swing);
      swingIndex = i;
    }
  }

  // Approximate the inning of the max swing from the snapshot index.
  // Without explicit inning data on each snapshot, we use the index position
  // as a proxy. If the caller attaches inning info elsewhere, this can be
  // refined. For now, 1-indexed position in the snapshot array.
  const swingInning = swingIndex !== null ? swingIndex + 1 : null;

  const excitementRating = classifyExcitement(volatility, leadChanges, maxSwing);

  return {
    gameId,
    snapshots,
    maxMmi,
    minMmi,
    avgMmi,
    volatility,
    leadChanges,
    maxSwing,
    swingInning,
    excitementRating,
  };
}
