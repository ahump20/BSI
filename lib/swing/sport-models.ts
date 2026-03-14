/**
 * Sport-specific swing models — ideal ranges and thresholds for
 * baseball, fast-pitch softball, and slow-pitch softball.
 */

export type SwingSport = 'baseball' | 'fastpitch' | 'slowpitch';

export interface MetricRange {
  label: string;
  unit: string;
  min: number;
  max: number;
  optimal: [number, number];
  description: string;
}

export interface SportModel {
  sport: SwingSport;
  displayName: string;
  description: string;
  metrics: Record<string, MetricRange>;
  analysisNotes: string[];
}

const baseMetrics: Record<string, MetricRange> = {
  weightDistribution: {
    label: 'Weight Distribution',
    unit: '%',
    min: 30,
    max: 70,
    optimal: [55, 65],
    description: 'Front/back foot balance at load position',
  },
  loadTiming: {
    label: 'Load Timing',
    unit: 'ms',
    min: -200,
    max: 200,
    optimal: [-50, 50],
    description: 'When hands reach deepest position relative to stride',
  },
  postureAngle: {
    label: 'Posture at Load',
    unit: '°',
    min: 0,
    max: 45,
    optimal: [10, 25],
    description: 'Spine angle from vertical at load position',
  },
  strideLength: {
    label: 'Stride Length',
    unit: '%h',
    min: 0,
    max: 100,
    optimal: [55, 75],
    description: 'Stride length as percentage of body height',
  },
  strideDirection: {
    label: 'Stride Direction',
    unit: '°',
    min: -30,
    max: 30,
    optimal: [-5, 5],
    description: 'Deviation from direct line to pitcher (negative = closed)',
  },
  footPlantAngle: {
    label: 'Foot Plant',
    unit: '°',
    min: -45,
    max: 45,
    optimal: [-10, 15],
    description: 'Front foot landing orientation relative to pitcher',
  },
  hipRotationVelocity: {
    label: 'Hip Rotation Velocity',
    unit: '°/s',
    min: 0,
    max: 1200,
    optimal: [600, 900],
    description: 'Peak rotational speed of hips',
  },
  hipShoulderSeparation: {
    label: 'Hip-Shoulder Separation',
    unit: '°',
    min: 0,
    max: 90,
    optimal: [40, 65],
    description: 'Maximum angle between hip and shoulder rotation lines',
  },
  barrelPath: {
    label: 'Barrel Path',
    unit: 'score',
    min: 0,
    max: 100,
    optimal: [70, 95],
    description: 'Bat head trajectory efficiency through the zone (0-100)',
  },
  contactPoint: {
    label: 'Contact Point',
    unit: 'in',
    min: -12,
    max: 12,
    optimal: [-2, 4],
    description: 'Location relative to front hip (positive = out front)',
  },
  extension: {
    label: 'Extension',
    unit: '%',
    min: 0,
    max: 100,
    optimal: [75, 95],
    description: 'Arm extension percentage at contact',
  },
  finishBalance: {
    label: 'Finish Position',
    unit: 'score',
    min: 0,
    max: 100,
    optimal: [60, 90],
    description: 'Deceleration control and balance at finish (0-100)',
  },
};

export const SPORT_MODELS: Record<SwingSport, SportModel> = {
  baseball: {
    sport: 'baseball',
    displayName: 'Baseball',
    description: 'Rotational mechanics with launch angle emphasis',
    metrics: {
      ...baseMetrics,
      hipRotationVelocity: {
        ...baseMetrics.hipRotationVelocity,
        optimal: [650, 950],
      },
      hipShoulderSeparation: {
        ...baseMetrics.hipShoulderSeparation,
        optimal: [45, 65],
      },
    },
    analysisNotes: [
      'Optimal launch angle: 10-25° for line drives and fly balls',
      'Bat speed is the primary power indicator',
      'Rotational mechanics drive barrel speed through the zone',
    ],
  },
  fastpitch: {
    sport: 'fastpitch',
    displayName: 'Fast-Pitch Softball',
    description: 'Compact swing path for shorter reaction window',
    metrics: {
      ...baseMetrics,
      strideLength: {
        ...baseMetrics.strideLength,
        optimal: [45, 65],
        description: 'Shorter stride for quicker rotation to ball',
      },
      hipRotationVelocity: {
        ...baseMetrics.hipRotationVelocity,
        optimal: [550, 850],
      },
      hipShoulderSeparation: {
        ...baseMetrics.hipShoulderSeparation,
        optimal: [35, 55],
      },
      barrelPath: {
        ...baseMetrics.barrelPath,
        description: 'Level-to-slightly-down swing plane for rise ball pitches',
      },
    },
    analysisNotes: [
      'Compact swing path compensates for shorter reaction window (~0.35s vs 0.44s)',
      'Level-to-slightly-down plane is more effective against rising pitches',
      'Different pitch entry angles require adjusted barrel path',
    ],
  },
  slowpitch: {
    sport: 'slowpitch',
    displayName: 'Slow-Pitch Softball',
    description: 'Uppercut swing plane optimized for arc pitches',
    metrics: {
      ...baseMetrics,
      strideLength: {
        ...baseMetrics.strideLength,
        optimal: [50, 70],
      },
      hipRotationVelocity: {
        ...baseMetrics.hipRotationVelocity,
        optimal: [500, 800],
      },
      hipShoulderSeparation: {
        ...baseMetrics.hipShoulderSeparation,
        optimal: [35, 55],
      },
      barrelPath: {
        ...baseMetrics.barrelPath,
        description: 'Uppercut swing plane to meet ball descending from arc',
        optimal: [60, 90],
      },
      contactPoint: {
        ...baseMetrics.contactPoint,
        optimal: [0, 6],
        description: 'Contact point further out front to optimize trajectory',
      },
    },
    analysisNotes: [
      'Uppercut swing plane matches the ball descending from 6-12ft arc',
      'No pitch-reaction analysis — timing is purely based on arc trajectory',
      'Power and distance optimization are primary goals',
      'USSSA and ASA arc rules (6-12ft) define the timing window',
    ],
  },
};

/** Get the ideal range for a specific metric in a given sport */
export function getIdealRange(sport: SwingSport, metricKey: string): [number, number] | null {
  const model = SPORT_MODELS[sport];
  const metric = model?.metrics[metricKey];
  return metric?.optimal ?? null;
}

/** Score a metric value (0-100) based on how close it is to the optimal range */
export function scoreMetric(sport: SwingSport, metricKey: string, value: number): number {
  const range = getIdealRange(sport, metricKey);
  if (!range) return 50;
  const [low, high] = range;

  if (value >= low && value <= high) return 100;

  const metric = SPORT_MODELS[sport].metrics[metricKey];
  const totalRange = metric.max - metric.min;
  if (totalRange === 0) return 50;

  const distance = value < low ? low - value : value - high;
  const normalizedDistance = distance / totalRange;
  return Math.max(0, Math.round(100 * (1 - normalizedDistance * 2)));
}

/** All 12 metric keys in analysis order */
export const METRIC_KEYS = [
  'weightDistribution',
  'loadTiming',
  'postureAngle',
  'strideLength',
  'strideDirection',
  'footPlantAngle',
  'hipRotationVelocity',
  'hipShoulderSeparation',
  'barrelPath',
  'contactPoint',
  'extension',
  'finishBalance',
] as const;

export type MetricKey = typeof METRIC_KEYS[number];

/** Group metric keys by swing phase */
export const METRIC_GROUPS = {
  'Balance & Load': ['weightDistribution', 'loadTiming', 'postureAngle'],
  'Stride': ['strideLength', 'strideDirection', 'footPlantAngle'],
  'Power Move': ['hipRotationVelocity', 'hipShoulderSeparation', 'barrelPath'],
  'Contact & Follow-Through': ['contactPoint', 'extension', 'finishBalance'],
} as const;
