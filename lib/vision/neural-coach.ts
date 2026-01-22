export type CoachingLevel = 'clear' | 'early' | 'mid' | 'late';

export interface NeuralMetricSnapshot {
  timestamp: number;
  stability: number;
  shoulderSymmetry: number;
  hipSymmetry: number;
  spineLean: number;
  energy: number;
  steadiness: number;
}

export interface NeuralBaseline {
  stability: number;
  shoulderSymmetry: number;
  hipSymmetry: number;
  spineLean: number;
  energy: number;
  steadiness: number;
}

export interface DriftVector {
  stability: number;
  shoulderSymmetry: number;
  hipSymmetry: number;
  spineLean: number;
  energy: number;
  steadiness: number;
}

export interface DriftAssessment {
  driftScore: number;
  vector: DriftVector;
}

export interface CoachingCue {
  level: CoachingLevel;
  label: string;
  message: string;
  severity: number;
}

export interface PatternSessionSummary {
  id: string;
  createdAt: number;
  baseline: NeuralBaseline;
  driftAverage: number;
}

export interface PatternModel {
  baseline: NeuralBaseline;
  driftTrend: number;
  sampleCount: number;
}

export const DEFAULT_DRIFT_THRESHOLDS: NeuralBaseline = {
  stability: 14,
  shoulderSymmetry: 12,
  hipSymmetry: 12,
  spineLean: 7,
  energy: 18,
  steadiness: 18,
};

export const DEFAULT_COACHING_THRESHOLDS = {
  early: 22,
  mid: 40,
  late: 60,
  earlyStreak: 10,
  midStreak: 20,
  lateStreak: 30,
};

export const DEFAULT_FILLER_WORDS = [
  'um',
  'uh',
  'like',
  'you know',
  'so',
  'actually',
  'basically',
  'literally',
  'right',
] as const;

const COACH_LABELS: Record<CoachingLevel, CoachingCue> = {
  clear: {
    level: 'clear',
    label: 'Aligned',
    message: 'Presence stable. Maintain current posture and cadence.',
    severity: 0,
  },
  early: {
    level: 'early',
    label: 'Subtle Drift',
    message: 'Micro-adjust shoulders and breathe for steady cadence.',
    severity: 1,
  },
  mid: {
    level: 'mid',
    label: 'Correct Now',
    message: 'Re-center torso and lift gaze to camera.',
    severity: 2,
  },
  late: {
    level: 'late',
    label: 'Hard Reset',
    message: 'Pause, reset posture, then restart with stable energy.',
    severity: 3,
  },
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const safeAverage = (values: number[]): number =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const computeNormalizedDelta = (current: number, baseline: number, threshold: number): number => {
  if (threshold <= 0) return 0;
  return clamp(Math.abs(current - baseline) / threshold, 0, 1);
};

const escapeRegex = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const countFillerWords = (
  transcript: string,
  fillerWords: readonly string[] = DEFAULT_FILLER_WORDS
): number => {
  if (!transcript.trim()) return 0;
  const normalized = transcript.toLowerCase();
  return fillerWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'g');
    const matches = normalized.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
};

export const computeDriftAssessment = (
  baseline: NeuralBaseline,
  snapshot: NeuralMetricSnapshot,
  thresholds: NeuralBaseline = DEFAULT_DRIFT_THRESHOLDS
): DriftAssessment => {
  const vector: DriftVector = {
    stability: snapshot.stability - baseline.stability,
    shoulderSymmetry: snapshot.shoulderSymmetry - baseline.shoulderSymmetry,
    hipSymmetry: snapshot.hipSymmetry - baseline.hipSymmetry,
    spineLean: snapshot.spineLean - baseline.spineLean,
    energy: snapshot.energy - baseline.energy,
    steadiness: snapshot.steadiness - baseline.steadiness,
  };

  const normalizedDeltas = [
    computeNormalizedDelta(snapshot.stability, baseline.stability, thresholds.stability),
    computeNormalizedDelta(
      snapshot.shoulderSymmetry,
      baseline.shoulderSymmetry,
      thresholds.shoulderSymmetry
    ),
    computeNormalizedDelta(snapshot.hipSymmetry, baseline.hipSymmetry, thresholds.hipSymmetry),
    computeNormalizedDelta(snapshot.spineLean, baseline.spineLean, thresholds.spineLean),
    computeNormalizedDelta(snapshot.energy, baseline.energy, thresholds.energy),
    computeNormalizedDelta(snapshot.steadiness, baseline.steadiness, thresholds.steadiness),
  ];

  const driftScore = Math.round(safeAverage(normalizedDeltas) * 100);

  return { driftScore, vector };
};

export const computeSessionSummary = (snapshots: NeuralMetricSnapshot[]): NeuralBaseline | null => {
  if (!snapshots.length) return null;
  return {
    stability: safeAverage(snapshots.map((s) => s.stability)),
    shoulderSymmetry: safeAverage(snapshots.map((s) => s.shoulderSymmetry)),
    hipSymmetry: safeAverage(snapshots.map((s) => s.hipSymmetry)),
    spineLean: safeAverage(snapshots.map((s) => s.spineLean)),
    energy: safeAverage(snapshots.map((s) => s.energy)),
    steadiness: safeAverage(snapshots.map((s) => s.steadiness)),
  };
};

export const computeAverageDrift = (
  snapshots: NeuralMetricSnapshot[],
  baseline: NeuralBaseline,
  thresholds: NeuralBaseline = DEFAULT_DRIFT_THRESHOLDS
): number => {
  if (!snapshots.length) return 0;
  const scores = snapshots.map(
    (snapshot) => computeDriftAssessment(baseline, snapshot, thresholds).driftScore
  );
  return Math.round(safeAverage(scores));
};

const computeTrendSlope = (values: number[]): number => {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = (n - 1) * (n / 2);
  const sumX2 = ((n - 1) * n * (2 * n - 1)) / 6;
  const sumY = values.reduce((sum, value) => sum + value, 0);
  const sumXY = values.reduce((sum, value, index) => sum + value * index, 0);
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
};

export const buildPatternModel = (history: PatternSessionSummary[]): PatternModel | null => {
  if (!history.length) return null;
  const baselines = history.map((session) => session.baseline);
  const baseline: NeuralBaseline = {
    stability: safeAverage(baselines.map((b) => b.stability)),
    shoulderSymmetry: safeAverage(baselines.map((b) => b.shoulderSymmetry)),
    hipSymmetry: safeAverage(baselines.map((b) => b.hipSymmetry)),
    spineLean: safeAverage(baselines.map((b) => b.spineLean)),
    energy: safeAverage(baselines.map((b) => b.energy)),
    steadiness: safeAverage(baselines.map((b) => b.steadiness)),
  };

  const driftTrend = computeTrendSlope(history.map((session) => session.driftAverage));

  return {
    baseline,
    driftTrend: Number.isFinite(driftTrend) ? driftTrend : 0,
    sampleCount: history.length,
  };
};

export const evaluateCoachingCue = (
  driftScore: number,
  consecutiveTicks: number,
  thresholds = DEFAULT_COACHING_THRESHOLDS
): CoachingCue => {
  const meetsLate = driftScore >= thresholds.late || consecutiveTicks >= thresholds.lateStreak;
  const meetsMid = driftScore >= thresholds.mid || consecutiveTicks >= thresholds.midStreak;
  const meetsEarly = driftScore >= thresholds.early || consecutiveTicks >= thresholds.earlyStreak;

  if (meetsLate) return COACH_LABELS.late;
  if (meetsMid) return COACH_LABELS.mid;
  if (meetsEarly) return COACH_LABELS.early;
  return COACH_LABELS.clear;
};
