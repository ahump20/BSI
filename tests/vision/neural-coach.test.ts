import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DRIFT_THRESHOLDS,
  buildPatternModel,
  computeAverageDrift,
  computeDriftAssessment,
  computeSessionSummary,
  countFillerWords,
  evaluateCoachingCue,
} from '../../lib/vision/neural-coach';

const baseSnapshot = {
  timestamp: 0,
  stability: 80,
  shoulderSymmetry: 90,
  hipSymmetry: 92,
  spineLean: 2,
  energy: 55,
  steadiness: 70,
};

describe('neural coach utilities', () => {
  it('returns zero drift when snapshot matches baseline', () => {
    const assessment = computeDriftAssessment(baseSnapshot, baseSnapshot);
    expect(assessment.driftScore).toBe(0);
  });

  it('computes higher drift when metrics deviate', () => {
    const assessment = computeDriftAssessment(baseSnapshot, {
      ...baseSnapshot,
      stability: 60,
      energy: 90,
    });
    expect(assessment.driftScore).toBeGreaterThan(0);
  });

  it('summarizes session metrics and averages drift', () => {
    const snapshots = [
      baseSnapshot,
      { ...baseSnapshot, stability: 70, energy: 60, timestamp: 1 },
      { ...baseSnapshot, stability: 75, energy: 50, timestamp: 2 },
    ];

    const summary = computeSessionSummary(snapshots);
    expect(summary).not.toBeNull();
    expect(summary?.stability).toBeGreaterThan(70);

    const driftAverage = computeAverageDrift(snapshots, baseSnapshot, DEFAULT_DRIFT_THRESHOLDS);
    expect(driftAverage).toBeGreaterThanOrEqual(0);
  });

  it('builds a pattern model with drift trend', () => {
    const history = [
      {
        id: 'session-1',
        createdAt: 1,
        baseline: baseSnapshot,
        driftAverage: 25,
      },
      {
        id: 'session-2',
        createdAt: 2,
        baseline: { ...baseSnapshot, stability: 78 },
        driftAverage: 18,
      },
    ];

    const model = buildPatternModel(history);
    expect(model).not.toBeNull();
    expect(model?.sampleCount).toBe(2);
  });

  it('classifies coaching cues by drift and streak', () => {
    const early = evaluateCoachingCue(25, 0);
    const late = evaluateCoachingCue(10, 40);

    expect(early.level).toBe('early');
    expect(late.level).toBe('late');
  });

  it('counts filler words from transcripts', () => {
    const count = countFillerWords('Um, so, you know, like, this is basically it.');
    expect(count).toBe(5);
  });
});
