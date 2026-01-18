import { describe, expect, it } from 'vitest';

import {
  DiamondCertaintyEngine,
  type DiamondCertaintyInput,
  type MicroExpressionSnapshot,
  type BodyLanguageSnapshot,
  type PhysiologicalSample,
  type PerformancePlay,
} from '../lib/analytics/diamond-certainty-engine';

const buildMicroExpressions = (): MicroExpressionSnapshot[] => [
  {
    timestamp: '2025-04-15T18:01:00Z',
    expression: 'focus',
    intensity: 0.82,
    durationMs: 900,
    confidence: 0.94,
    valence: 0.4,
    arousal: 0.55,
    situation: 'pressure',
  },
  {
    timestamp: '2025-04-15T18:01:10Z',
    expression: 'determination',
    intensity: 0.87,
    durationMs: 650,
    confidence: 0.92,
    valence: 0.2,
    arousal: 0.74,
    situation: 'pressure',
  },
  {
    timestamp: '2025-04-15T18:02:00Z',
    expression: 'focus',
    intensity: 0.78,
    durationMs: 1000,
    confidence: 0.9,
    valence: 0.3,
    arousal: 0.48,
    situation: 'baseline',
  },
  {
    timestamp: '2025-04-15T18:05:00Z',
    expression: 'determination',
    intensity: 0.91,
    durationMs: 720,
    confidence: 0.95,
    valence: 0.25,
    arousal: 0.82,
    situation: 'adversity',
  },
];

const buildBodyLanguage = (): BodyLanguageSnapshot[] => [
  {
    timestamp: '2025-04-15T18:01:00Z',
    postureScore: 0.88,
    eyeContactScore: 0.83,
    movementSharpness: 0.79,
    composureScore: 0.81,
    dominanceIndex: 0.85,
    energyLevel: 0.8,
    sidelineInfluence: 0.76,
  },
  {
    timestamp: '2025-04-15T18:02:00Z',
    postureScore: 0.9,
    eyeContactScore: 0.87,
    movementSharpness: 0.82,
    composureScore: 0.84,
    dominanceIndex: 0.88,
    energyLevel: 0.83,
    sidelineInfluence: 0.79,
  },
];

const buildPhysiology = (): PhysiologicalSample[] => [
  {
    timestamp: '2025-04-15T18:01:00Z',
    heartRate: 128,
    heartRateBaseline: 118,
    heartRateVariability: 92,
    respirationRate: 19,
    stressIndex: 38,
    skinConductance: 6.4,
    lactateLevel: 8.1,
  },
  {
    timestamp: '2025-04-15T18:02:00Z',
    heartRate: 132,
    heartRateBaseline: 118,
    heartRateVariability: 97,
    respirationRate: 18,
    stressIndex: 41,
    skinConductance: 6.1,
    lactateLevel: 8.4,
  },
  {
    timestamp: '2025-04-15T18:04:30Z',
    heartRate: 130,
    heartRateBaseline: 118,
    heartRateVariability: 101,
    respirationRate: 17,
    stressIndex: 36,
    skinConductance: 6.0,
    lactateLevel: 8.6,
  },
];

const buildPerformance = (): PerformancePlay[] => [
  {
    timestamp: '2025-04-15T18:05:00Z',
    leverage: 8.4,
    outcome: 'success',
    winProbabilityAdded: 32,
    difficulty: 0.78,
    phase: 'late',
    aggressionFactor: 0.72,
    reactionTimeMs: 410,
    impactScore: 86,
    recoveryTimeSec: 8,
  },
  {
    timestamp: '2025-04-15T18:07:00Z',
    leverage: 7.6,
    outcome: 'success',
    winProbabilityAdded: 27,
    difficulty: 0.74,
    phase: 'late',
    aggressionFactor: 0.69,
    reactionTimeMs: 395,
    impactScore: 90,
    recoveryTimeSec: 9,
  },
  {
    timestamp: '2025-04-15T18:09:00Z',
    leverage: 5.4,
    outcome: 'failure',
    winProbabilityAdded: -8,
    difficulty: 0.62,
    phase: 'middle',
    aggressionFactor: 0.61,
    reactionTimeMs: 440,
    impactScore: 75,
    recoveryTimeSec: 6,
  },
  {
    timestamp: '2025-04-15T18:11:00Z',
    leverage: 6.1,
    outcome: 'success',
    winProbabilityAdded: 18,
    difficulty: 0.68,
    phase: 'late',
    aggressionFactor: 0.66,
    reactionTimeMs: 405,
    impactScore: 92,
    recoveryTimeSec: 5,
  },
];

describe('Diamond Certainty Engine', () => {
  const baseInput: DiamondCertaintyInput = {
    athleteId: 'athlete_001',
    sampleWindow: { start: '2025-04-15T18:00:00Z', end: '2025-04-15T18:15:00Z' },
    microExpressions: buildMicroExpressions(),
    bodyLanguage: buildBodyLanguage(),
    physiological: buildPhysiology(),
    performance: buildPerformance(),
    resume: {
      clutchWinPct: 0.71,
      seriesCloseRate: 0.68,
      eliminationRecord: { wins: 5, losses: 2 },
      championshipAppearances: 2,
      consecutiveWins: 11,
      seasonWinPct: 0.74,
      roadWinPct: 0.64,
    },
    context: {
      opponentStrength: 0.84,
      fatigueIndex: 0.74,
      venueType: 'road',
    },
  };

  it('returns scores for all eight champion dimensions with tiers and audit trail', () => {
    const report = DiamondCertaintyEngine.evaluate(baseInput);

    expect(report.athleteId).toBe(baseInput.athleteId);
    expect(Object.keys(report.dimensions)).toHaveLength(8);

    const championKeys = [
      'clutchGene',
      'killerInstinct',
      'flowState',
      'mentalFortress',
      'predatorMindset',
      'championAura',
      'winnerDNA',
      'beastMode',
    ] as const;

    championKeys.forEach((key) => {
      const dimension = report.dimensions[key];
      expect(dimension.score).toBeGreaterThan(0);
      expect(dimension.score).toBeLessThanOrEqual(100);
      expect(['generational', 'elite', 'ascendant', 'developing']).toContain(dimension.tier);
      expect(dimension.contributions.length).toBeGreaterThan(0);
      const weightTotal = dimension.contributions.reduce((acc, item) => acc + item.weight, 0);
      expect(weightTotal).toBeGreaterThan(0.95);
      expect(weightTotal).toBeLessThanOrEqual(1.05);
    });

    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.auditTrail).toHaveLength(8);
  });

  it('drops confidence when data is sparse', () => {
    const minimalInput: DiamondCertaintyInput = {
      ...baseInput,
      microExpressions: baseInput.microExpressions.slice(0, 1),
      bodyLanguage: baseInput.bodyLanguage.slice(0, 1),
      physiological: baseInput.physiological.slice(0, 1),
      performance: baseInput.performance.slice(0, 1),
    };

    const full = DiamondCertaintyEngine.evaluate(baseInput);
    const sparse = DiamondCertaintyEngine.evaluate(minimalInput);

    expect(sparse.confidence).toBeLessThan(full.confidence);
  });
});
