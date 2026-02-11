import type { ModelHealthPoint } from './types';

// Model health sample data — used when no real model data exists.
// Tagged "Training" in the UI.
export const SAMPLE_MODEL_HEALTH: ModelHealthPoint[] = [
  { week: 'W1', accuracy: 68 },
  { week: 'W2', accuracy: 71 },
  { week: 'W3', accuracy: 66 },
  { week: 'W4', accuracy: 74 },
  { week: 'W5', accuracy: 72 },
  { week: 'W6', accuracy: 78 },
  { week: 'W7', accuracy: 75 },
  { week: 'W8', accuracy: 73 },
  { week: 'W9', accuracy: 79 },
  { week: 'W10', accuracy: 77 },
  { week: 'W11', accuracy: 81 },
  { week: 'W12', accuracy: 76 },
];

export const SAMPLE_MODEL_AVG =
  SAMPLE_MODEL_HEALTH.reduce((s, p) => s + p.accuracy, 0) / SAMPLE_MODEL_HEALTH.length;

// Signal type labels by mode — used to classify generated signals.
export const SIGNAL_TYPES_BY_MODE = {
  coach: ['MODEL', 'EDGE', 'MATCHUP', 'TURNING POINT', 'LINEUP', 'PACE'],
  scout: ['INJURY', 'MVP WATCH', 'USAGE', 'PROSPECT', 'CONTRACT', 'STAT'],
  fan: ['RECAP', 'STREAK', 'MILESTONE', 'STORYLINE', 'UPSET ALERT', 'TREND'],
} as const;
