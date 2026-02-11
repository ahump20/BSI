import { describe, it, expect } from 'vitest';
import {
  calculateFatigueScore,
  calculateInjuryRisk,
  generateRiskFactors,
} from '@lib/cv/pitcher-fatigue';
import type { FatigueScoreInput } from '@lib/cv/types';

// ---------------------------------------------------------------------------
// calculateFatigueScore
// ---------------------------------------------------------------------------

describe('calculateFatigueScore', () => {
  it('returns low score (0-10) for first-inning baseline inputs', () => {
    const input: FatigueScoreInput = {
      pitchCount: 12,
      velocityStart: 95.2,
      velocityCurrent: 95.0,
      releasePointDriftInches: 0.3,
    };
    const score = calculateFatigueScore(input);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('returns high score (>70) when velocity drops >3mph with release drift', () => {
    const input: FatigueScoreInput = {
      pitchCount: 105,
      velocityStart: 96.0,
      velocityCurrent: 92.5,
      releasePointDriftInches: 2.8,
    };
    const score = calculateFatigueScore(input);
    expect(score).toBeGreaterThan(70);
  });

  it('weights velocity delta higher than raw pitch count', () => {
    // High pitch count, no velocity drop
    const highCount: FatigueScoreInput = {
      pitchCount: 110,
      velocityStart: 94.0,
      velocityCurrent: 94.0,
      releasePointDriftInches: 0,
    };
    // Low pitch count, significant velocity drop
    const highDelta: FatigueScoreInput = {
      pitchCount: 40,
      velocityStart: 94.0,
      velocityCurrent: 90.5,
      releasePointDriftInches: 0,
    };
    const countScore = calculateFatigueScore(highCount);
    const deltaScore = calculateFatigueScore(highDelta);
    expect(deltaScore).toBeGreaterThan(countScore);
  });

  it('returns 0 for zero inputs', () => {
    const input: FatigueScoreInput = {
      pitchCount: 0,
      velocityStart: 95.0,
      velocityCurrent: 95.0,
      releasePointDriftInches: 0,
    };
    expect(calculateFatigueScore(input)).toBe(0);
  });

  it('caps at 100 for extreme inputs', () => {
    const input: FatigueScoreInput = {
      pitchCount: 150,
      velocityStart: 97.0,
      velocityCurrent: 89.0,
      releasePointDriftInches: 6.0,
    };
    const score = calculateFatigueScore(input);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('handles missing optional CV fields gracefully', () => {
    const input: FatigueScoreInput = {
      pitchCount: 80,
      velocityStart: 93.0,
      velocityCurrent: 91.5,
      releasePointDriftInches: 1.5,
      armSlotAngle: undefined,
      armSlotVariance: undefined,
    };
    const score = calculateFatigueScore(input);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('always returns an integer', () => {
    const input: FatigueScoreInput = {
      pitchCount: 73,
      velocityStart: 91.3,
      velocityCurrent: 89.8,
      releasePointDriftInches: 1.2,
    };
    const score = calculateFatigueScore(input);
    expect(Number.isInteger(score)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calculateInjuryRisk
// ---------------------------------------------------------------------------

describe('calculateInjuryRisk', () => {
  it('returns low risk when fatigue is low and no history', () => {
    const risk = calculateInjuryRisk(15);
    expect(risk).toBeLessThan(30);
  });

  it('increases with high ACWR', () => {
    const base = calculateInjuryRisk(50);
    const withAcwr = calculateInjuryRisk(50, 1.6);
    expect(withAcwr).toBeGreaterThan(base);
  });

  it('increases with injury history flag', () => {
    const base = calculateInjuryRisk(50);
    const withHistory = calculateInjuryRisk(50, undefined, true);
    expect(withHistory).toBeGreaterThan(base);
  });

  it('clamps between 0 and 100', () => {
    expect(calculateInjuryRisk(0)).toBeGreaterThanOrEqual(0);
    expect(calculateInjuryRisk(100, 2.0, true)).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// generateRiskFactors
// ---------------------------------------------------------------------------

describe('generateRiskFactors', () => {
  it('returns empty array when all inputs are within normal range', () => {
    const input: FatigueScoreInput = {
      pitchCount: 30,
      velocityStart: 94.0,
      velocityCurrent: 93.8,
      releasePointDriftInches: 0.2,
    };
    const factors = generateRiskFactors(input);
    expect(factors).toEqual([]);
  });

  it('flags high pitch count', () => {
    const input: FatigueScoreInput = {
      pitchCount: 115,
      velocityStart: 94.0,
      velocityCurrent: 94.0,
      releasePointDriftInches: 0,
    };
    const factors = generateRiskFactors(input);
    expect(factors.some((f) => /pitch count/i.test(f))).toBe(true);
  });

  it('flags velocity drop', () => {
    const input: FatigueScoreInput = {
      pitchCount: 50,
      velocityStart: 95.0,
      velocityCurrent: 92.0,
      releasePointDriftInches: 0,
    };
    const factors = generateRiskFactors(input);
    expect(factors.some((f) => /velocity/i.test(f))).toBe(true);
  });

  it('flags release point drift', () => {
    const input: FatigueScoreInput = {
      pitchCount: 50,
      velocityStart: 94.0,
      velocityCurrent: 94.0,
      releasePointDriftInches: 3.5,
    };
    const factors = generateRiskFactors(input);
    expect(factors.some((f) => /release point/i.test(f))).toBe(true);
  });

  it('returns multiple factors when multiple thresholds exceeded', () => {
    const input: FatigueScoreInput = {
      pitchCount: 120,
      velocityStart: 96.0,
      velocityCurrent: 92.0,
      releasePointDriftInches: 3.0,
    };
    const factors = generateRiskFactors(input);
    expect(factors.length).toBeGreaterThanOrEqual(3);
  });
});
