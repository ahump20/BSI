/**
 * Stat definitions and quality thresholds for baseball stats.
 * Used in tooltips and contextual labels across portal cards and box scores.
 */

export interface StatDefinition {
  abbrev: string;
  name: string;
  description: string;
  /** Lower is better (e.g. ERA) vs higher is better (e.g. AVG) */
  lowerIsBetter: boolean;
  /** Thresholds: [elite, good, average]. Values beyond average are below-average. */
  thresholds: [number, number, number];
}

export const BASEBALL_STATS: Record<string, StatDefinition> = {
  ERA: {
    abbrev: 'ERA',
    name: 'Earned Run Average',
    description: 'Average earned runs allowed per 9 innings. Lower is better.',
    lowerIsBetter: true,
    thresholds: [2.5, 3.5, 4.5],
  },
  WHIP: {
    abbrev: 'WHIP',
    name: 'Walks + Hits per Inning Pitched',
    description: 'Baserunners allowed per inning. Lower is better.',
    lowerIsBetter: true,
    thresholds: [1.0, 1.2, 1.4],
  },
  AVG: {
    abbrev: 'AVG',
    name: 'Batting Average',
    description: 'Hits divided by at-bats. Higher is better.',
    lowerIsBetter: false,
    thresholds: [0.3, 0.27, 0.24],
  },
  OBP: {
    abbrev: 'OBP',
    name: 'On-Base Percentage',
    description: 'How often a batter reaches base. Higher is better.',
    lowerIsBetter: false,
    thresholds: [0.38, 0.34, 0.3],
  },
  SLG: {
    abbrev: 'SLG',
    name: 'Slugging Percentage',
    description: 'Total bases divided by at-bats. Measures power. Higher is better.',
    lowerIsBetter: false,
    thresholds: [0.5, 0.42, 0.35],
  },
  OPS: {
    abbrev: 'OPS',
    name: 'On-Base Plus Slugging',
    description: 'OBP + SLG combined. Quick measure of overall hitting. Higher is better.',
    lowerIsBetter: false,
    thresholds: [0.85, 0.75, 0.65],
  },
  K9: {
    abbrev: 'K/9',
    name: 'Strikeouts per 9 Innings',
    description: 'Strikeout rate for pitchers. Higher is better.',
    lowerIsBetter: false,
    thresholds: [10, 8, 6],
  },
  BB9: {
    abbrev: 'BB/9',
    name: 'Walks per 9 Innings',
    description: 'Walk rate for pitchers. Lower is better.',
    lowerIsBetter: true,
    thresholds: [2, 3, 4],
  },
  RBI: {
    abbrev: 'RBI',
    name: 'Runs Batted In',
    description: "Runs scored as a direct result of a batter's action.",
    lowerIsBetter: false,
    thresholds: [80, 60, 40],
  },
  HR: {
    abbrev: 'HR',
    name: 'Home Runs',
    description: 'Balls hit over the outfield fence for an automatic run.',
    lowerIsBetter: false,
    thresholds: [25, 15, 8],
  },
};

/** Returns a quality label for a stat value: 'elite' | 'good' | 'average' | 'below-avg' */
export function getStatQuality(
  stat: string,
  value: number
): 'elite' | 'good' | 'average' | 'below-avg' {
  const def = BASEBALL_STATS[stat];
  if (!def) return 'average';

  const [elite, good, avg] = def.thresholds;

  if (def.lowerIsBetter) {
    if (value <= elite) return 'elite';
    if (value <= good) return 'good';
    if (value <= avg) return 'average';
    return 'below-avg';
  }

  if (value >= elite) return 'elite';
  if (value >= good) return 'good';
  if (value >= avg) return 'average';
  return 'below-avg';
}

/** CSS color class for a quality tier */
export function getQualityColor(quality: 'elite' | 'good' | 'average' | 'below-avg'): string {
  switch (quality) {
    case 'elite':
      return 'text-success';
    case 'good':
      return 'text-burnt-orange';
    case 'average':
      return 'text-text-secondary';
    case 'below-avg':
      return 'text-text-muted';
  }
}

/** Human-readable label for a quality tier */
export function getQualityLabel(quality: 'elite' | 'good' | 'average' | 'below-avg'): string {
  switch (quality) {
    case 'elite':
      return 'Elite';
    case 'good':
      return 'Good';
    case 'average':
      return 'Average';
    case 'below-avg':
      return 'Below Avg';
  }
}
