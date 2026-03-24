/**
 * Sport-Specific Metric Definitions for the Player Evaluation Tool
 *
 * Each sport defines the metrics that matter for player evaluation,
 * grouped by category. The evaluation API uses these to:
 *  1. Decide which stats to extract from raw player data
 *  2. Compute percentile rankings within sport/position
 *  3. Format display values for the UI
 *
 * Format helpers imported from @/lib/utils/format — no duplication.
 */

import { fmt1, fmt2, fmt3, fmtPct, fmtInt } from '@/lib/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EvaluationSport = 'college-baseball' | 'mlb' | 'nfl' | 'nba';

export type EvaluationTier =
  | 'Elite'
  | 'Above Average'
  | 'Average'
  | 'Below Average'
  | 'Developing';

export interface SportMetricDef {
  /** Machine key matching the raw stat field */
  key: string;
  /** Human-readable label for UI display */
  label: string;
  /** Grouping category (e.g. 'hitting', 'pitching', 'passing') */
  category: string;
  /** True when a higher value means better performance */
  higherIsBetter: boolean;
  /** Formats the raw numeric value for display */
  format: (v: number) => string;
  /** If set, only show this metric for these positions */
  positions?: string[];
}

export interface EvaluationMetric {
  key: string;
  label: string;
  value: number;
  percentile: number;
  higherIsBetter: boolean;
  category: string;
  displayValue: string;
}

export interface EvaluationProfile {
  player: {
    id: string;
    name: string;
    sport: EvaluationSport;
    team: string;
    position: string;
    headshot?: string;
    bio?: {
      height?: string;
      weight?: number;
      age?: number;
      experience?: string;
    };
  };
  evaluation: {
    tier: EvaluationTier;
    overallPercentile: number;
    metrics: EvaluationMetric[];
  };
  meta: {
    source: string;
    fetched_at: string;
    timezone: 'America/Chicago';
  };
}

// ---------------------------------------------------------------------------
// Tier Classification
// ---------------------------------------------------------------------------

/** Map an overall percentile to a human-readable tier. */
export function classifyTier(percentile: number): EvaluationTier {
  if (percentile >= 90) return 'Elite';
  if (percentile >= 70) return 'Above Average';
  if (percentile >= 40) return 'Average';
  if (percentile >= 20) return 'Below Average';
  return 'Developing';
}

/** Heritage-compatible CSS color for each tier. */
export function tierColor(tier: EvaluationTier): string {
  switch (tier) {
    case 'Elite':
      return 'var(--bsi-primary)'; // burnt-orange
    case 'Above Average':
      return '#f97316'; // orange
    case 'Average':
      return '#8890a4'; // neutral gray
    case 'Below Average':
      return '#3b82f6'; // blue
    case 'Developing':
      return '#6366f1'; // indigo
  }
}

// ---------------------------------------------------------------------------
// College Baseball — Hitters
// ---------------------------------------------------------------------------

const CBB_HITTING: SportMetricDef[] = [
  { key: 'woba', label: 'wOBA', category: 'hitting', higherIsBetter: true, format: fmt3 },
  { key: 'wrc_plus', label: 'wRC+', category: 'hitting', higherIsBetter: true, format: fmtInt },
  { key: 'ops_plus', label: 'OPS+', category: 'hitting', higherIsBetter: true, format: fmtInt },
  { key: 'ops', label: 'OPS', category: 'hitting', higherIsBetter: true, format: fmt3 },
  { key: 'iso', label: 'ISO', category: 'hitting', higherIsBetter: true, format: fmt3 },
  { key: 'k_pct', label: 'K%', category: 'discipline', higherIsBetter: false, format: fmtPct },
  { key: 'bb_pct', label: 'BB%', category: 'discipline', higherIsBetter: true, format: fmtPct },
  { key: 'babip', label: 'BABIP', category: 'hitting', higherIsBetter: true, format: fmt3 },
  { key: 'avg', label: 'AVG', category: 'traditional', higherIsBetter: true, format: fmt3 },
  { key: 'obp', label: 'OBP', category: 'traditional', higherIsBetter: true, format: fmt3 },
  { key: 'slg', label: 'SLG', category: 'traditional', higherIsBetter: true, format: fmt3 },
];

// ---------------------------------------------------------------------------
// College Baseball — Pitchers
// ---------------------------------------------------------------------------

const CBB_PITCHING: SportMetricDef[] = [
  { key: 'fip', label: 'FIP', category: 'pitching', higherIsBetter: false, format: fmt2 },
  { key: 'era_minus', label: 'ERA-', category: 'pitching', higherIsBetter: false, format: fmtInt },
  { key: 'x_fip', label: 'xFIP', category: 'pitching', higherIsBetter: false, format: fmt2 },
  { key: 'era', label: 'ERA', category: 'traditional', higherIsBetter: false, format: fmt2 },
  { key: 'whip', label: 'WHIP', category: 'traditional', higherIsBetter: false, format: fmt2 },
  { key: 'k_9', label: 'K/9', category: 'stuff', higherIsBetter: true, format: fmt1 },
  { key: 'bb_9', label: 'BB/9', category: 'command', higherIsBetter: false, format: fmt1 },
  { key: 'k_pct', label: 'K%', category: 'stuff', higherIsBetter: true, format: fmtPct },
  { key: 'bb_pct', label: 'BB%', category: 'command', higherIsBetter: false, format: fmtPct },
  { key: 'k_bb', label: 'K-BB%', category: 'stuff', higherIsBetter: true, format: fmtPct },
  { key: 'lob_pct', label: 'LOB%', category: 'pitching', higherIsBetter: true, format: fmtPct },
];

// ---------------------------------------------------------------------------
// MLB — Hitters
// ---------------------------------------------------------------------------

const MLB_HITTING: SportMetricDef[] = [
  { key: 'onBasePercentage', label: 'OBP', category: 'hitting', higherIsBetter: true, format: fmt3 },
  { key: 'sluggingPercentage', label: 'SLG', category: 'hitting', higherIsBetter: true, format: fmt3 },
  { key: 'ops', label: 'OPS', category: 'hitting', higherIsBetter: true, format: fmt3 },
  { key: 'battingAverage', label: 'AVG', category: 'hitting', higherIsBetter: true, format: fmt3 },
  { key: 'homeRuns', label: 'HR', category: 'power', higherIsBetter: true, format: fmtInt },
  { key: 'rbi', label: 'RBI', category: 'production', higherIsBetter: true, format: fmtInt },
  { key: 'stolenBases', label: 'SB', category: 'speed', higherIsBetter: true, format: fmtInt },
  { key: 'runs', label: 'R', category: 'production', higherIsBetter: true, format: fmtInt },
  { key: 'hits', label: 'H', category: 'traditional', higherIsBetter: true, format: fmtInt },
];

// ---------------------------------------------------------------------------
// MLB — Pitchers
// ---------------------------------------------------------------------------

const MLB_PITCHING: SportMetricDef[] = [
  { key: 'era', label: 'ERA', category: 'pitching', higherIsBetter: false, format: fmt2 },
  { key: 'whip', label: 'WHIP', category: 'pitching', higherIsBetter: false, format: fmt2 },
  { key: 'strikeouts', label: 'K', category: 'stuff', higherIsBetter: true, format: fmtInt },
  { key: 'wins', label: 'W', category: 'traditional', higherIsBetter: true, format: fmtInt },
  { key: 'saves', label: 'SV', category: 'traditional', higherIsBetter: true, format: fmtInt },
  { key: 'inningsPitched', label: 'IP', category: 'workload', higherIsBetter: true, format: fmt1 },
];

// ---------------------------------------------------------------------------
// NFL
// ---------------------------------------------------------------------------

const NFL_PASSING: SportMetricDef[] = [
  { key: 'passerRating', label: 'Passer Rtg', category: 'passing', higherIsBetter: true, format: fmt1, positions: ['QB'] },
  { key: 'completionPercentage', label: 'Comp%', category: 'passing', higherIsBetter: true, format: (v) => `${v.toFixed(1)}%`, positions: ['QB'] },
  { key: 'yardsPerAttempt', label: 'Y/A', category: 'passing', higherIsBetter: true, format: fmt1, positions: ['QB'] },
  { key: 'touchdowns', label: 'TD', category: 'production', higherIsBetter: true, format: fmtInt, positions: ['QB'] },
  { key: 'interceptions', label: 'INT', category: 'turnovers', higherIsBetter: false, format: fmtInt, positions: ['QB'] },
  { key: 'passingYards', label: 'Pass Yds', category: 'passing', higherIsBetter: true, format: fmtInt, positions: ['QB'] },
];

const NFL_RUSHING: SportMetricDef[] = [
  { key: 'rushingYards', label: 'Rush Yds', category: 'rushing', higherIsBetter: true, format: fmtInt, positions: ['RB', 'QB'] },
  { key: 'yardsPerCarry', label: 'Y/C', category: 'rushing', higherIsBetter: true, format: fmt1, positions: ['RB', 'QB'] },
  { key: 'rushingTouchdowns', label: 'Rush TD', category: 'rushing', higherIsBetter: true, format: fmtInt, positions: ['RB', 'QB'] },
];

const NFL_RECEIVING: SportMetricDef[] = [
  { key: 'receptions', label: 'REC', category: 'receiving', higherIsBetter: true, format: fmtInt, positions: ['WR', 'TE', 'RB'] },
  { key: 'receivingYards', label: 'Rec Yds', category: 'receiving', higherIsBetter: true, format: fmtInt, positions: ['WR', 'TE', 'RB'] },
  { key: 'yardsPerReception', label: 'Y/R', category: 'receiving', higherIsBetter: true, format: fmt1, positions: ['WR', 'TE', 'RB'] },
  { key: 'receivingTouchdowns', label: 'Rec TD', category: 'receiving', higherIsBetter: true, format: fmtInt, positions: ['WR', 'TE', 'RB'] },
  { key: 'targets', label: 'TGT', category: 'receiving', higherIsBetter: true, format: fmtInt, positions: ['WR', 'TE', 'RB'] },
];

const NFL_DEFENSE: SportMetricDef[] = [
  { key: 'tackles', label: 'Tackles', category: 'defense', higherIsBetter: true, format: fmtInt, positions: ['LB', 'CB', 'S', 'DE', 'DT'] },
  { key: 'sacks', label: 'Sacks', category: 'defense', higherIsBetter: true, format: fmt1, positions: ['LB', 'DE', 'DT'] },
  { key: 'interceptions', label: 'INT', category: 'defense', higherIsBetter: true, format: fmtInt, positions: ['CB', 'S', 'LB'] },
  { key: 'passDeflections', label: 'PD', category: 'defense', higherIsBetter: true, format: fmtInt, positions: ['CB', 'S', 'LB'] },
  { key: 'forcedFumbles', label: 'FF', category: 'defense', higherIsBetter: true, format: fmtInt, positions: ['LB', 'DE', 'DT', 'S'] },
];

// ---------------------------------------------------------------------------
// NBA
// ---------------------------------------------------------------------------

const NBA_SCORING: SportMetricDef[] = [
  { key: 'points', label: 'PPG', category: 'scoring', higherIsBetter: true, format: fmt1 },
  { key: 'fieldGoalPercentage', label: 'FG%', category: 'shooting', higherIsBetter: true, format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'threePointPercentage', label: '3P%', category: 'shooting', higherIsBetter: true, format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'freeThrowPercentage', label: 'FT%', category: 'shooting', higherIsBetter: true, format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'trueShootingPercentage', label: 'TS%', category: 'shooting', higherIsBetter: true, format: (v) => `${(v * 100).toFixed(1)}%` },
];

const NBA_PLAYMAKING: SportMetricDef[] = [
  { key: 'assists', label: 'APG', category: 'playmaking', higherIsBetter: true, format: fmt1 },
  { key: 'turnovers', label: 'TOV', category: 'playmaking', higherIsBetter: false, format: fmt1 },
  { key: 'assistToTurnover', label: 'A/TO', category: 'playmaking', higherIsBetter: true, format: fmt1 },
];

const NBA_REBOUNDING: SportMetricDef[] = [
  { key: 'rebounds', label: 'RPG', category: 'rebounding', higherIsBetter: true, format: fmt1 },
  { key: 'offensiveRebounds', label: 'OREB', category: 'rebounding', higherIsBetter: true, format: fmt1 },
  { key: 'defensiveRebounds', label: 'DREB', category: 'rebounding', higherIsBetter: true, format: fmt1 },
];

const NBA_DEFENSE: SportMetricDef[] = [
  { key: 'steals', label: 'STL', category: 'defense', higherIsBetter: true, format: fmt1 },
  { key: 'blocks', label: 'BLK', category: 'defense', higherIsBetter: true, format: fmt1 },
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** All metric definitions keyed by sport. Position-aware: use `getMetricsForPlayer()`. */
const SPORT_METRICS: Record<EvaluationSport, SportMetricDef[]> = {
  'college-baseball': [...CBB_HITTING, ...CBB_PITCHING],
  mlb: [...MLB_HITTING, ...MLB_PITCHING],
  nfl: [...NFL_PASSING, ...NFL_RUSHING, ...NFL_RECEIVING, ...NFL_DEFENSE],
  nba: [...NBA_SCORING, ...NBA_PLAYMAKING, ...NBA_REBOUNDING, ...NBA_DEFENSE],
};

// Positions that map to pitcher metrics in baseball
const PITCHER_POSITIONS = new Set([
  'P', 'SP', 'RP', 'LHP', 'RHP', 'CL',
  'Pitcher', 'Starting Pitcher', 'Relief Pitcher', 'Closer',
]);

/**
 * Get the relevant metric definitions for a specific player.
 * Filters by sport and position — a QB only sees passing/rushing metrics,
 * a college baseball pitcher only sees pitching metrics.
 */
export function getMetricsForPlayer(
  sport: EvaluationSport,
  position: string
): SportMetricDef[] {
  const all = SPORT_METRICS[sport];
  const posUpper = position.toUpperCase();

  // Baseball: split hitter/pitcher
  if (sport === 'college-baseball' || sport === 'mlb') {
    const isPitcher = PITCHER_POSITIONS.has(position) || PITCHER_POSITIONS.has(posUpper);
    return all.filter((m) => {
      const pitchingCategories = new Set(['pitching', 'stuff', 'command', 'workload']);
      const isPitchingMetric = pitchingCategories.has(m.category);
      return isPitcher ? isPitchingMetric : !isPitchingMetric;
    });
  }

  // NFL/NBA: filter by position if the metric specifies positions
  return all.filter(
    (m) => !m.positions || m.positions.includes(posUpper) || m.positions.includes(position)
  );
}

/**
 * Get unique category labels from a set of metrics, in display order.
 */
export function getCategories(metrics: SportMetricDef[]): string[] {
  const seen = new Set<string>();
  const cats: string[] = [];
  for (const m of metrics) {
    if (!seen.has(m.category)) {
      seen.add(m.category);
      cats.push(m.category);
    }
  }
  return cats;
}

/**
 * Sport display labels for the UI.
 */
export const SPORT_LABELS: Record<EvaluationSport, string> = {
  'college-baseball': 'College Baseball',
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
};
