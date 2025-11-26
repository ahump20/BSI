/**
 * BLAZE SPORTS INTEL | API Configuration
 * Connects to existing Cloudflare Workers for real data
 *
 * @module config
 * @version 10.0.0
 */

// Base URL for Cloudflare Workers API (deployed at blazesportsintel.com)
const API_BASE =
  typeof window !== 'undefined' ? window.location.origin : 'https://blazesportsintel.com';

/**
 * API Endpoints (using existing Cloudflare Workers)
 */
export const API_ENDPOINTS = {
  // MLB Data (FanGraphs via your Cloudflare Worker)
  mlb: {
    leaderboards: `${API_BASE}/api/mlb/leaderboards`,
    players: `${API_BASE}/api/mlb/players`,
    teams: `${API_BASE}/api/mlb/teams`,
    standings: `${API_BASE}/api/mlb/standings`,
  },

  // NFL Data (free ESPN API via your worker)
  nfl: {
    players: `${API_BASE}/api/nfl/players`,
    passingLeaders: `${API_BASE}/api/nfl/players?leaders=passing`,
    teams: `${API_BASE}/api/nfl/teams`,
    standings: `${API_BASE}/api/nfl/standings`,
  },

  // College Baseball Data (ESPN API via worker)
  collegeBaseball: {
    players: `${API_BASE}/api/college-baseball/players`,
    teams: `${API_BASE}/api/college-baseball/teams`,
    standings: `${API_BASE}/api/college-baseball/standings`,
    rankings: `${API_BASE}/api/college-baseball/rankings`,
    scoreboard: `${API_BASE}/api/college-baseball/scoreboard`,
  },

  // College Football Data (CFBD API via worker)
  collegeFootball: {
    players: `${API_BASE}/api/college-football/players`,
    teams: `${API_BASE}/api/college-football/teams`,
    standings: `${API_BASE}/api/college-football/standings`,
    rankings: `${API_BASE}/api/college-football/rankings`,
    scoreboard: `${API_BASE}/api/college-football/scoreboard`,
  },

  // Odds Data (TheOddsAPI via your worker)
  odds: {
    current: `${API_BASE}/api/odds/current`,
    mlb: `${API_BASE}/api/odds/current?sport=baseball_mlb`,
    nfl: `${API_BASE}/api/odds/current?sport=american_football_nfl`,
    ncaaf: `${API_BASE}/api/odds/current?sport=american_football_ncaaf`,
  },

  // News Data (ESPN RSS via your worker)
  news: {
    feed: `${API_BASE}/api/news/feed`,
    mlb: `${API_BASE}/api/news/feed?sport=mlb`,
    nfl: `${API_BASE}/api/news/feed?sport=nfl`,
    ncaaf: `${API_BASE}/api/news/feed?sport=ncaaf`,
    collegeBaseball: `${API_BASE}/api/news/feed?sport=college-baseball`,
  },
};

/**
 * Cache configuration (matches your Cloudflare Workers KV setup)
 */
export const CACHE_TTL = {
  players: 60 * 60 * 1000, // 1 hour (matches your KV cache)
  standings: 60 * 60 * 1000, // 1 hour
  odds: 5 * 60 * 1000, // 5 minutes (matches your worker)
  news: 10 * 60 * 1000, // 10 minutes (matches your worker)
};

/**
 * Sport configuration
 * Note: Basketball (CBB/NBA) intentionally removed per user requirements
 * Focus: Baseball (MLB, College), Football (NFL, College)
 */
export const SPORTS_CONFIG = {
  baseball: {
    name: 'MLB',
    icon: '⚾',
    color: '#DC143C',
    apiKey: 'mlb',
    primaryMetrics: ['AVG', 'HR', 'RBI', 'OPS'],
    season: { start: '03-20', end: '10-31' },
  },
  collegeBaseball: {
    name: 'College Baseball',
    icon: '⚾',
    color: '#BF5700', // Burnt Orange - Texas theme
    apiKey: 'collegeBaseball',
    primaryMetrics: ['AVG', 'HR', 'RBI', 'ERA'],
    season: { start: '02-14', end: '06-30' },
  },
  football: {
    name: 'NFL',
    icon: '🏈',
    color: '#0066CC',
    apiKey: 'nfl',
    primaryMetrics: ['YDS', 'TD', 'QBR', 'Rating'],
    season: { start: '09-01', end: '02-15' },
  },
  collegeFootball: {
    name: 'College Football',
    icon: '🏈',
    color: '#BF5700', // Burnt Orange - Texas theme
    apiKey: 'collegeFootball',
    primaryMetrics: ['YDS', 'TD', 'INT', 'QBR'],
    season: { start: '08-24', end: '01-15' },
  },
};

/**
 * Chart colors (consistent with brand)
 */
export const CHART_COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  tertiary: '#8b5cf6',
  quaternary: '#f59e0b',
  quinary: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

/**
 * View modes
 */
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
  DETAILED: 'detailed',
  COMPACT: 'compact',
} as const;

/**
 * Themes
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

/**
 * Data source attribution (required for every stat)
 */
export const DATA_SOURCES = {
  MLB_STATSAPI: {
    name: 'MLB StatsAPI',
    url: 'https://statsapi.mlb.com',
    description: 'Official MLB statistics',
    free: true,
  },
  ESPN_API: {
    name: 'ESPN API',
    url: 'https://sports.core.api.espn.com',
    description: 'ESPN sports data',
    free: true,
  },
  THEODDS_API: {
    name: 'TheOddsAPI',
    url: 'https://the-odds-api.com',
    description: 'Sports betting odds',
    free: false,
  },
};
