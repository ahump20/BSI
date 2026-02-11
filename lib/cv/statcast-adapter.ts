import type { PitcherBiomechanics } from './types';
import type { FatigueScoreInput } from './types';
import { calculateFatigueScore, calculateInjuryRisk, generateRiskFactors } from './pitcher-fatigue';

// ---------------------------------------------------------------------------
// Source Data Shapes
// ---------------------------------------------------------------------------

/** Minimal pitch-level data from Statcast or equivalent sources */
export interface PitchRecord {
  inning: number;
  velocity: number;
  releaseX?: number;
  releaseZ?: number;
  pitchType?: string;
}

/** Highlightly pitching line (subset of fields we use) */
export interface HighlightlyPitchingInput {
  playerId: string;
  playerName: string;
  team: string;
  league: 'mlb' | 'college-baseball';
  gameId: string;
  gameDate: string;
  inningsPitched: number;
  pitchCount: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  era?: number;
}

// ---------------------------------------------------------------------------
// Normalization: Pitch Records → Biomechanics
// ---------------------------------------------------------------------------

/**
 * Calculate velocity delta from pitch-level records.
 * Compares first-inning average to latest-inning average.
 */
export function calcVelocityDelta(pitches: PitchRecord[]): {
  velocityStart: number;
  velocityCurrent: number;
  velocityDelta: number;
} {
  if (pitches.length === 0) {
    return { velocityStart: 0, velocityCurrent: 0, velocityDelta: 0 };
  }

  const byInning = new Map<number, number[]>();
  for (const p of pitches) {
    const arr = byInning.get(p.inning) ?? [];
    arr.push(p.velocity);
    byInning.set(p.inning, arr);
  }

  const innings = [...byInning.keys()].sort((a, b) => a - b);
  if (innings.length === 0) {
    return { velocityStart: 0, velocityCurrent: 0, velocityDelta: 0 };
  }

  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  const firstInning = byInning.get(innings[0])!;
  const lastInning = byInning.get(innings[innings.length - 1])!;

  const velocityStart = Math.round(avg(firstInning) * 10) / 10;
  const velocityCurrent = Math.round(avg(lastInning) * 10) / 10;
  const velocityDelta = Math.round((velocityCurrent - velocityStart) * 10) / 10;

  return { velocityStart, velocityCurrent, velocityDelta };
}

/**
 * Estimate release point drift from pitch-level release coordinates.
 * Uses standard deviation of (releaseX, releaseZ) across the outing.
 */
export function calcReleasePointDrift(pitches: PitchRecord[]): number {
  const withRelease = pitches.filter((p) => p.releaseX != null && p.releaseZ != null);
  if (withRelease.length < 5) return 0;

  const xs = withRelease.map((p) => p.releaseX!);
  const zs = withRelease.map((p) => p.releaseZ!);

  const stddev = (arr: number[]): number => {
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  };

  // Combined drift in inches (release coordinates are in feet, convert)
  const driftFeet = Math.sqrt(stddev(xs) ** 2 + stddev(zs) ** 2);
  return Math.round(driftFeet * 12 * 10) / 10; // feet to inches, one decimal
}

/**
 * Convert pitch-level data into a PitcherBiomechanics row.
 */
export function pitchesToBiomechanics(
  playerId: string,
  playerName: string,
  team: string,
  league: 'mlb' | 'college-baseball',
  gameId: string,
  gameDate: string,
  pitches: PitchRecord[],
): Omit<PitcherBiomechanics, 'id' | 'created_at' | 'updated_at'> {
  const { velocityStart, velocityCurrent, velocityDelta } = calcVelocityDelta(pitches);
  const releasePointDriftInches = calcReleasePointDrift(pitches);

  const input: FatigueScoreInput = {
    pitchCount: pitches.length,
    velocityStart,
    velocityCurrent,
    releasePointDriftInches,
  };

  const fatigueScore = calculateFatigueScore(input);
  const injuryRiskIndex = calculateInjuryRisk(fatigueScore);
  const riskFactors = generateRiskFactors(input);

  return {
    player_id: playerId,
    player_name: playerName,
    team,
    league,
    game_id: gameId,
    game_date: gameDate,
    pitch_count: pitches.length,
    velocity_start: velocityStart,
    velocity_current: velocityCurrent,
    velocity_delta: velocityDelta,
    release_point_drift_inches: releasePointDriftInches,
    fatigue_score: fatigueScore,
    injury_risk_index: injuryRiskIndex,
    risk_factors: JSON.stringify(riskFactors),
    arm_slot_angle: null,
    arm_slot_variance: null,
    stride_length_pct: null,
    stride_length_delta: null,
    shoulder_rotation_deg: null,
    hip_shoulder_separation: null,
  };
}

// ---------------------------------------------------------------------------
// Normalization: Highlightly Pitching Line → Biomechanics
// ---------------------------------------------------------------------------

/**
 * Convert a Highlightly pitching line into a partial biomechanics row.
 * Highlightly provides pitch count but not per-pitch velocity/release data,
 * so we estimate fatigue from innings pitched and pitch count alone.
 */
export function highlightlyToBiomechanics(
  input: HighlightlyPitchingInput,
  estimatedVeloStart?: number,
  estimatedVeloCurrent?: number,
): Omit<PitcherBiomechanics, 'id' | 'created_at' | 'updated_at'> {
  const velocityStart = estimatedVeloStart ?? 0;
  const velocityCurrent = estimatedVeloCurrent ?? velocityStart;
  const velocityDelta = velocityCurrent - velocityStart;

  const fatigueInput: FatigueScoreInput = {
    pitchCount: input.pitchCount,
    velocityStart,
    velocityCurrent,
    releasePointDriftInches: 0, // Not available from Highlightly
  };

  const fatigueScore = calculateFatigueScore(fatigueInput);
  const injuryRiskIndex = calculateInjuryRisk(fatigueScore);
  const riskFactors = generateRiskFactors(fatigueInput);

  return {
    player_id: String(input.playerId),
    player_name: input.playerName,
    team: input.team,
    league: input.league,
    game_id: input.gameId,
    game_date: input.gameDate,
    pitch_count: input.pitchCount,
    velocity_start: velocityStart,
    velocity_current: velocityCurrent,
    velocity_delta: Math.round(velocityDelta * 10) / 10,
    release_point_drift_inches: 0,
    fatigue_score: fatigueScore,
    injury_risk_index: injuryRiskIndex,
    risk_factors: JSON.stringify(riskFactors),
    arm_slot_angle: null,
    arm_slot_variance: null,
    stride_length_pct: null,
    stride_length_delta: null,
    shoulder_rotation_deg: null,
    hip_shoulder_separation: null,
  };
}
