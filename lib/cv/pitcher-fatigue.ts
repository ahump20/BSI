import type { FatigueScoreInput, FatigueScoreResult } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PITCH_COUNT_WEIGHT = 0.3;
const VELOCITY_DELTA_WEIGHT = 0.35;
const RELEASE_DRIFT_WEIGHT = 0.35;

// Sigmoid parameters for pitch count normalization
const PITCH_SIGMOID_MIDPOINT = 80;
const PITCH_SIGMOID_STEEPNESS = 0.06;

// Velocity delta: 0mph drop → 0, 5mph+ drop → 100
const VELOCITY_DELTA_MAX = 5;

// Release point drift: 0 inches → 0, 4+ inches → 100
const RELEASE_DRIFT_MAX = 4;

// Risk factor thresholds
const HIGH_PITCH_COUNT = 100;
const ELEVATED_PITCH_COUNT = 85;
const SIGNIFICANT_VELO_DROP = 2.0;
const NOTABLE_VELO_DROP = 1.5;
const SIGNIFICANT_DRIFT = 2.0;
const NOTABLE_DRIFT = 1.5;

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Normalize pitch count to 0-100 using a sigmoid curve.
 * Centers at 80 pitches — fatigue onset is nonlinear.
 */
function normalizePitchCount(count: number): number {
  if (count <= 0) return 0;
  const raw = 100 / (1 + Math.exp(-PITCH_SIGMOID_STEEPNESS * (count - PITCH_SIGMOID_MIDPOINT)));
  // Shift so that 0 pitches maps to 0 (sigmoid at 0 is ~0.8, we subtract that baseline)
  const baseline = 100 / (1 + Math.exp(-PITCH_SIGMOID_STEEPNESS * (0 - PITCH_SIGMOID_MIDPOINT)));
  const scaled = ((raw - baseline) / (100 - baseline)) * 100;
  return Math.max(0, Math.min(100, scaled));
}

/**
 * Normalize velocity delta (drop in mph) to 0-100.
 * Linear scaling: 0mph → 0, VELOCITY_DELTA_MAX+ → 100.
 */
function normalizeVelocityDelta(start: number, current: number): number {
  const drop = Math.max(0, start - current);
  return Math.min(100, (drop / VELOCITY_DELTA_MAX) * 100);
}

/**
 * Normalize release point drift (inches) to 0-100.
 * Linear scaling: 0in → 0, RELEASE_DRIFT_MAX+ → 100.
 */
function normalizeReleaseDrift(driftInches: number): number {
  const abs = Math.abs(driftInches);
  return Math.min(100, (abs / RELEASE_DRIFT_MAX) * 100);
}

/**
 * Calculate a 0-100 fatigue score from available pitcher metrics.
 *
 * Formula:
 *   (pitch_count_normalized * 0.30)
 * + (velocity_delta_normalized * 0.35)
 * + (release_drift_normalized * 0.35)
 */
export function calculateFatigueScore(input: FatigueScoreInput): number {
  const pitchComponent = normalizePitchCount(input.pitchCount);
  const veloComponent = normalizeVelocityDelta(input.velocityStart, input.velocityCurrent);
  const driftComponent = normalizeReleaseDrift(input.releasePointDriftInches);

  const raw =
    pitchComponent * PITCH_COUNT_WEIGHT +
    veloComponent * VELOCITY_DELTA_WEIGHT +
    driftComponent * RELEASE_DRIFT_WEIGHT;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

/**
 * Estimate injury risk index (0-100).
 *
 * Starts from fatigue score and adjusts for:
 * - ACWR (acute:chronic workload ratio) — spikes above 1.3 increase risk
 * - Previous injury history — adds baseline risk
 */
export function calculateInjuryRisk(
  fatigue: number,
  acwr?: number,
  historyFlag?: boolean,
): number {
  let risk = fatigue * 0.7;

  if (acwr !== undefined) {
    // ACWR sweet spot: 0.8-1.3. Above 1.5 is danger zone.
    if (acwr > 1.5) risk += 25;
    else if (acwr > 1.3) risk += 15;
    else if (acwr > 1.1) risk += 5;
  }

  if (historyFlag) {
    risk += 15;
  }

  return Math.round(Math.max(0, Math.min(100, risk)));
}

/**
 * Generate human-readable risk factors for a given input.
 * Returns empty array when all inputs are within normal range.
 */
export function generateRiskFactors(input: FatigueScoreInput): string[] {
  const factors: string[] = [];

  // Pitch count
  if (input.pitchCount >= HIGH_PITCH_COUNT) {
    factors.push(`Pitch count at ${input.pitchCount} — above ${HIGH_PITCH_COUNT}-pitch threshold`);
  } else if (input.pitchCount >= ELEVATED_PITCH_COUNT) {
    factors.push(`Pitch count elevated at ${input.pitchCount}`);
  }

  // Velocity drop
  const veloDrop = input.velocityStart - input.velocityCurrent;
  if (veloDrop >= SIGNIFICANT_VELO_DROP) {
    factors.push(
      `Velocity down ${veloDrop.toFixed(1)} mph from ${input.velocityStart.toFixed(1)} to ${input.velocityCurrent.toFixed(1)}`,
    );
  } else if (veloDrop >= NOTABLE_VELO_DROP) {
    factors.push(`Velocity trending down ${veloDrop.toFixed(1)} mph`);
  }

  // Release point drift
  const drift = Math.abs(input.releasePointDriftInches);
  if (drift >= SIGNIFICANT_DRIFT) {
    factors.push(
      `Release point drifting ${drift.toFixed(1)} inches from baseline`,
    );
  } else if (drift >= NOTABLE_DRIFT) {
    factors.push(`Release point drift of ${drift.toFixed(1)} inches`);
  }

  // Optional CV-enriched factors
  if (input.armSlotVariance !== undefined && input.armSlotVariance > 5) {
    factors.push(
      `Arm slot variance at ${input.armSlotVariance.toFixed(1)}° — mechanical inconsistency`,
    );
  }

  if (input.strideLengthDelta !== undefined && Math.abs(input.strideLengthDelta) > 3) {
    factors.push(
      `Stride length ${input.strideLengthDelta > 0 ? 'increased' : 'decreased'} ${Math.abs(input.strideLengthDelta).toFixed(1)}% from baseline`,
    );
  }

  return factors;
}

/**
 * Full fatigue analysis — combines score, risk, and factors.
 */
export function analyzePitcherFatigue(input: FatigueScoreInput, acwr?: number, historyFlag?: boolean): FatigueScoreResult {
  const fatigueScore = calculateFatigueScore(input);
  const injuryRiskIndex = calculateInjuryRisk(fatigueScore, acwr, historyFlag);
  const riskFactors = generateRiskFactors(input);

  const pitchComponent = normalizePitchCount(input.pitchCount);
  const veloComponent = normalizeVelocityDelta(input.velocityStart, input.velocityCurrent);
  const driftComponent = normalizeReleaseDrift(input.releasePointDriftInches);

  return {
    fatigueScore,
    injuryRiskIndex,
    riskFactors,
    components: {
      pitchCountWeight: Math.round(pitchComponent * PITCH_COUNT_WEIGHT),
      velocityDeltaWeight: Math.round(veloComponent * VELOCITY_DELTA_WEIGHT),
      releaseDriftWeight: Math.round(driftComponent * RELEASE_DRIFT_WEIGHT),
    },
  };
}
