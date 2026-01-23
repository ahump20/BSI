/**
 * BSI Sport Configuration
 *
 * Centralized sport-specific constants for polling, columns, theming, and stats.
 * Single source of truth across all BSI components.
 */

import type { UnifiedSportKey } from '@/lib/types/adapters';

/**
 * Stat category types for each sport
 */
export type BaseballStatCategory = 'batting' | 'pitching';
export type FootballStatCategory = 'passing' | 'rushing' | 'receiving' | 'defense';
export type BasketballStatCategory = 'scoring' | 'rebounds' | 'assists';

export type StatCategory = BaseballStatCategory | FootballStatCategory | BasketballStatCategory;

/**
 * Sport configuration interface
 */
export interface SportConfig {
  /** Polling interval for live data in milliseconds */
  pollingInterval: number;
  /** Columns to display in standings tables */
  standingsColumns: string[];
  /** Available stat categories for box scores */
  statCategories: StatCategory[];
  /** Label for game period (Inning, Quarter, Half, Period) */
  periodLabel: string;
  /** Number of periods in a game */
  periodCount: number;
  /** Whether the sport uses linescore format (baseball) */
  hasLinescore: boolean;
  /** Key stats for team-to-team comparison */
  comparisonStats: string[];
  /** Sport display name */
  displayName: string;
  /** Short display name */
  shortName: string;
}

/**
 * Box score column definitions by sport and category
 */
export const BOXSCORE_COLUMNS = {
  // Baseball (MLB, College Baseball)
  baseball: {
    batting: {
      columns: ['AB', 'R', 'H', 'RBI', 'BB', 'SO', 'AVG'],
      compactColumns: ['AB', 'H', 'R', 'RBI', 'BB', 'SO'],
      statKeys: ['ab', 'r', 'h', 'rbi', 'bb', 'so', 'avg'],
    },
    pitching: {
      columns: ['IP', 'H', 'R', 'ER', 'BB', 'SO', 'ERA'],
      compactColumns: ['IP', 'H', 'R', 'ER', 'BB', 'SO'],
      statKeys: ['ip', 'h', 'r', 'er', 'bb', 'so', 'era'],
    },
  },

  // Football (NFL, CFB)
  football: {
    passing: {
      columns: ['C/ATT', 'YDS', 'TD', 'INT', 'QBR', 'SACKS'],
      compactColumns: ['C/ATT', 'YDS', 'TD', 'INT'],
      statKeys: ['comp', 'att', 'yds', 'td', 'int', 'qbr', 'sacks'],
      compoundStats: { 'C/ATT': ['comp', 'att'] },
    },
    rushing: {
      columns: ['CAR', 'YDS', 'AVG', 'TD', 'LNG'],
      compactColumns: ['CAR', 'YDS', 'TD'],
      statKeys: ['car', 'yds', 'avg', 'td', 'long'],
    },
    receiving: {
      columns: ['REC', 'TGT', 'YDS', 'AVG', 'TD'],
      compactColumns: ['REC', 'YDS', 'TD'],
      statKeys: ['rec', 'targets', 'yds', 'avg', 'td'],
    },
    defense: {
      columns: ['TCKL', 'SOLO', 'SACK', 'TFL', 'INT', 'PD'],
      compactColumns: ['TCKL', 'SACK', 'INT'],
      statKeys: ['tackles', 'soloTackles', 'sacks', 'tacklesForLoss', 'int', 'passDefended'],
    },
  },

  // Basketball (NBA, NCAAB)
  basketball: {
    standard: {
      columns: ['MIN', 'PTS', 'FG', '3P', 'FT', 'REB', 'AST', 'STL', 'BLK', 'TO', '+/-'],
      compactColumns: ['MIN', 'PTS', 'REB', 'AST', 'FG', '3P'],
      statKeys: [
        'minutes',
        'pts',
        'fg',
        'threeP',
        'ft',
        'reb',
        'ast',
        'stl',
        'blk',
        'to',
        'plusMinus',
      ],
    },
  },
} as const;

/**
 * Team comparison stat labels and descriptions
 */
export const COMPARISON_STATS = {
  // Baseball
  AVG: { label: 'AVG', description: 'Batting Average', higher: 'better' },
  HR: { label: 'HR', description: 'Home Runs', higher: 'better' },
  RBI: { label: 'RBI', description: 'Runs Batted In', higher: 'better' },
  ERA: { label: 'ERA', description: 'Earned Run Average', higher: 'worse' },
  WHIP: { label: 'WHIP', description: 'Walks + Hits per IP', higher: 'worse' },
  K: { label: 'K', description: 'Strikeouts', higher: 'better' },

  // Football
  PPG: { label: 'PPG', description: 'Points Per Game', higher: 'better' },
  YPG: { label: 'YPG', description: 'Yards Per Game', higher: 'better' },
  TOP: { label: 'TOP', description: 'Time of Possession', higher: 'better' },
  TO: { label: 'TO', description: 'Turnovers', higher: 'worse' },
  '3rd%': { label: '3rd%', description: '3rd Down Conversion', higher: 'better' },
  'RedZone%': { label: 'RedZone%', description: 'Red Zone Scoring', higher: 'better' },

  // Basketball
  'FG%': { label: 'FG%', description: 'Field Goal Percentage', higher: 'better' },
  '3P%': { label: '3P%', description: '3-Point Percentage', higher: 'better' },
  REB: { label: 'REB', description: 'Rebounds', higher: 'better' },
  AST: { label: 'AST', description: 'Assists', higher: 'better' },
} as const;

/**
 * Main sport configuration object
 */
export const SPORT_CONFIG: Record<UnifiedSportKey, SportConfig> = {
  mlb: {
    pollingInterval: 15000,
    standingsColumns: ['W', 'L', 'PCT', 'GB', 'RS', 'RA', 'STRK'],
    statCategories: ['batting', 'pitching'],
    periodLabel: 'Inning',
    periodCount: 9,
    hasLinescore: true,
    comparisonStats: ['AVG', 'HR', 'RBI', 'ERA', 'WHIP', 'K'],
    displayName: 'MLB',
    shortName: 'MLB',
  },
  nfl: {
    pollingInterval: 30000,
    standingsColumns: ['W', 'L', 'T', 'PCT', 'PF', 'PA'],
    statCategories: ['passing', 'rushing', 'receiving', 'defense'],
    periodLabel: 'Quarter',
    periodCount: 4,
    hasLinescore: false,
    comparisonStats: ['PPG', 'YPG', 'TOP', 'TO', '3rd%', 'RedZone%'],
    displayName: 'NFL',
    shortName: 'NFL',
  },
  nba: {
    pollingInterval: 20000,
    standingsColumns: ['W', 'L', 'PCT', 'GB', 'HOME', 'AWAY'],
    statCategories: ['scoring', 'rebounds', 'assists'],
    periodLabel: 'Quarter',
    periodCount: 4,
    hasLinescore: false,
    comparisonStats: ['PPG', 'FG%', '3P%', 'REB', 'AST', 'TO'],
    displayName: 'NBA',
    shortName: 'NBA',
  },
  ncaaf: {
    pollingInterval: 30000,
    standingsColumns: ['W', 'L', 'CONF', 'PF', 'PA'],
    statCategories: ['passing', 'rushing', 'receiving', 'defense'],
    periodLabel: 'Quarter',
    periodCount: 4,
    hasLinescore: false,
    comparisonStats: ['PPG', 'YPG', 'TOP', '3rd%', 'TO'],
    displayName: 'College Football',
    shortName: 'CFB',
  },
  cbb: {
    pollingInterval: 15000,
    standingsColumns: ['W', 'L', 'CONF', 'RS', 'RA'],
    statCategories: ['batting', 'pitching'],
    periodLabel: 'Inning',
    periodCount: 9,
    hasLinescore: true,
    comparisonStats: ['AVG', 'HR', 'ERA', 'WHIP'],
    displayName: 'College Baseball',
    shortName: 'CBB',
  },
  ncaab: {
    pollingInterval: 20000,
    standingsColumns: ['W', 'L', 'CONF', 'PF', 'PA'],
    statCategories: ['scoring', 'rebounds', 'assists'],
    periodLabel: 'Half',
    periodCount: 2,
    hasLinescore: false,
    comparisonStats: ['PPG', 'FG%', '3P%', 'REB'],
    displayName: "Men's College Basketball",
    shortName: 'NCAAM',
  },
  wcbb: {
    pollingInterval: 20000,
    standingsColumns: ['W', 'L', 'CONF', 'PF', 'PA'],
    statCategories: ['scoring', 'rebounds', 'assists'],
    periodLabel: 'Quarter',
    periodCount: 4,
    hasLinescore: false,
    comparisonStats: ['PPG', 'FG%', '3P%', 'REB'],
    displayName: "Women's College Basketball",
    shortName: 'NCAAW',
  },
  wnba: {
    pollingInterval: 20000,
    standingsColumns: ['W', 'L', 'PCT', 'GB', 'HOME', 'AWAY'],
    statCategories: ['scoring', 'rebounds', 'assists'],
    periodLabel: 'Quarter',
    periodCount: 4,
    hasLinescore: false,
    comparisonStats: ['PPG', 'FG%', '3P%', 'REB', 'AST'],
    displayName: 'WNBA',
    shortName: 'WNBA',
  },
  nhl: {
    pollingInterval: 20000,
    standingsColumns: ['W', 'L', 'OT', 'PTS', 'GF', 'GA'],
    statCategories: ['scoring', 'assists'],
    periodLabel: 'Period',
    periodCount: 3,
    hasLinescore: false,
    comparisonStats: ['PPG', 'GF', 'GA', 'PP%', 'PK%'],
    displayName: 'NHL',
    shortName: 'NHL',
  },
};

/**
 * Sport theming for UI components
 */
export const SPORT_THEMES = {
  mlb: {
    accent: 'text-baseball',
    accentBg: 'bg-baseball/10',
    accentRing: 'ring-baseball/50',
    accentGlow: 'shadow-[0_0_20px_rgba(34,139,34,0.15)]',
    badgeBg: 'bg-baseball/20',
    badgeText: 'text-baseball',
    primary: '#228B22',
    secondary: '#DC143C',
    gradient: 'from-green-900/80 to-red-900/60',
  },
  nfl: {
    accent: 'text-football',
    accentBg: 'bg-football/10',
    accentRing: 'ring-football/50',
    accentGlow: 'shadow-[0_0_20px_rgba(139,69,19,0.15)]',
    badgeBg: 'bg-football/20',
    badgeText: 'text-football',
    primary: '#8B4513',
    secondary: '#0066CC',
    gradient: 'from-amber-900/80 to-blue-900/60',
  },
  nba: {
    accent: 'text-basketball',
    accentBg: 'bg-basketball/10',
    accentRing: 'ring-basketball/50',
    accentGlow: 'shadow-[0_0_20px_rgba(255,107,53,0.15)]',
    badgeBg: 'bg-basketball/20',
    badgeText: 'text-basketball',
    primary: '#FF6B35',
    secondary: '#1D428A',
    gradient: 'from-orange-900/80 to-blue-900/60',
  },
  ncaaf: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
    primary: '#BF5700',
    secondary: '#8B4513',
    gradient: 'from-orange-900/80 to-amber-900/60',
  },
  cbb: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
    primary: '#BF5700',
    secondary: '#333333',
    gradient: 'from-orange-900/80 to-charcoal/60',
  },
  ncaab: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
    primary: '#BF5700',
    secondary: '#8B4513',
    gradient: 'from-orange-900/80 to-amber-900/60',
  },
  wcbb: {
    accent: 'text-burnt-orange',
    accentBg: 'bg-burnt-orange/10',
    accentRing: 'ring-burnt-orange/50',
    accentGlow: 'shadow-[0_0_20px_rgba(191,87,0,0.15)]',
    badgeBg: 'bg-burnt-orange/20',
    badgeText: 'text-burnt-orange',
    primary: '#BF5700',
    secondary: '#8B4513',
    gradient: 'from-orange-900/80 to-amber-900/60',
  },
  wnba: {
    accent: 'text-basketball',
    accentBg: 'bg-basketball/10',
    accentRing: 'ring-basketball/50',
    accentGlow: 'shadow-[0_0_20px_rgba(255,107,53,0.15)]',
    badgeBg: 'bg-basketball/20',
    badgeText: 'text-basketball',
    primary: '#FF6B35',
    secondary: '#1D428A',
    gradient: 'from-orange-900/80 to-blue-900/60',
  },
  nhl: {
    accent: 'text-blue-400',
    accentBg: 'bg-blue-400/10',
    accentRing: 'ring-blue-400/50',
    accentGlow: 'shadow-[0_0_20px_rgba(96,165,250,0.15)]',
    badgeBg: 'bg-blue-400/20',
    badgeText: 'text-blue-400',
    primary: '#60A5FA',
    secondary: '#1F2937',
    gradient: 'from-blue-900/80 to-gray-900/60',
  },
} as const;

/**
 * Get sport type category
 */
export function getSportCategory(
  sport: UnifiedSportKey
): 'baseball' | 'football' | 'basketball' | 'hockey' {
  if (sport === 'mlb' || sport === 'cbb') return 'baseball';
  if (sport === 'nfl' || sport === 'ncaaf') return 'football';
  if (sport === 'nba' || sport === 'ncaab' || sport === 'wcbb' || sport === 'wnba')
    return 'basketball';
  return 'hockey';
}

/**
 * Get box score columns for a sport and category
 */
export function getBoxScoreColumns(
  sport: UnifiedSportKey,
  category: string,
  variant: 'compact' | 'full' = 'full'
): {
  columns: readonly string[];
  statKeys: readonly string[];
  compoundStats?: Record<string, string[]>;
} {
  const sportCategory = getSportCategory(sport);
  const config = BOXSCORE_COLUMNS[sportCategory];

  if (!config) {
    return { columns: [], statKeys: [] };
  }

  const categoryConfig = config[category as keyof typeof config];
  if (!categoryConfig) {
    return { columns: [], statKeys: [] };
  }

  return {
    columns: variant === 'compact' ? categoryConfig.compactColumns : categoryConfig.columns,
    statKeys: categoryConfig.statKeys,
    compoundStats: 'compoundStats' in categoryConfig ? categoryConfig.compoundStats : undefined,
  };
}

/**
 * Get theme for a sport
 */
export function getSportTheme(sport: UnifiedSportKey): (typeof SPORT_THEMES)[UnifiedSportKey] {
  return SPORT_THEMES[sport] || SPORT_THEMES.mlb;
}

/**
 * Get config for a sport
 */
export function getSportConfig(sport: UnifiedSportKey): SportConfig {
  return SPORT_CONFIG[sport] || SPORT_CONFIG.mlb;
}
