/**
 * NCAA API Type Definitions
 *
 * Centralized types for NCAA.com API integration across all sports.
 * Extracted from ncaa-api-adapter.ts to eliminate duplication.
 *
 * Based on patterns from henrygd/ncaa-api GitHub repository.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type NCAAApiSport =
  | 'baseball'
  | 'softball'
  | 'basketball-men'
  | 'basketball-women'
  | 'football'
  | 'soccer-men'
  | 'soccer-women'
  | 'volleyball-women'
  | 'hockey-men'
  | 'hockey-women'
  | 'lacrosse-men'
  | 'lacrosse-women';

export type NCAADivision = 'd1' | 'd2' | 'd3' | 'fbs' | 'fcs';

export type NCAAApiGameStatus =
  | 'pre' // Scheduled
  | 'live' // In progress
  | 'final' // Completed
  | 'postponed'
  | 'canceled'
  | 'delayed';

// ============================================================================
// TEAM TYPES
// ============================================================================

export interface NCAAApiTeam {
  id: string;
  seoName: string;
  shortName: string;
  fullName: string;
  nickname?: string;
  color?: string;
  conference?: string;
  division?: NCAADivision;
  logo?: string;
  record?: {
    overall: string;
    conference: string;
    wins: number;
    losses: number;
    confWins: number;
    confLosses: number;
  };
  ranking?: number;
}

export interface NCAAApiStandingsTeam extends NCAAApiTeam {
  conferenceRank: number;
  overallRecord: string;
  conferenceRecord: string;
  streak?: string;
  lastTen?: string;
  homeRecord?: string;
  awayRecord?: string;
  pointsFor?: number;
  pointsAgainst?: number;
  winPct: number;
}

// ============================================================================
// GAME TYPES
// ============================================================================

export interface NCAAApiGame {
  id: string;
  slug: string;
  title: string;
  status: NCAAApiGameStatus;
  startDate: string;
  startTime?: string;
  startTimeEpoch?: number;
  finalMessage?: string;
  home: NCAAApiTeam;
  away: NCAAApiTeam;
  homeScore: number | null;
  awayScore: number | null;
  currentPeriod?: string;
  currentClock?: string;
  venue?: {
    name: string;
    city: string;
    state: string;
  };
  broadcast?: string;
  attendance?: number;
  sport: NCAAApiSport;
  seasonYear: number;
  gameType: 'regular' | 'conference' | 'postseason';
  conferenceGame: boolean;
  neutralSite: boolean;
}

// ============================================================================
// BOX SCORE TYPES
// ============================================================================

export interface NCAAApiBoxScore {
  gameId: string;
  home: NCAAApiTeamBoxScore;
  away: NCAAApiTeamBoxScore;
  scoring: NCAAApiScoringSummary[];
  leaders?: NCAAApiGameLeaders;
}

export interface NCAAApiTeamBoxScore {
  team: NCAAApiTeam;
  score: number;
  stats: NCAAApiTeamStats;
  players: NCAAApiPlayerStats[];
}

export interface NCAAApiTeamStats {
  // Baseball specific
  runs?: number;
  hits?: number;
  errors?: number;
  leftOnBase?: number;
  // Basketball specific
  fieldGoals?: string;
  threePointers?: string;
  freeThrows?: string;
  rebounds?: number;
  assists?: number;
  turnovers?: number;
  // Football specific
  totalYards?: number;
  passingYards?: number;
  rushingYards?: number;
  firstDowns?: number;
  thirdDownConv?: string;
  timeOfPossession?: string;
  // General
  [key: string]: unknown;
}

export interface NCAAApiPlayerStats {
  id: string;
  name: string;
  position: string;
  stats: Record<string, string | number>;
}

export interface NCAAApiScoringSummary {
  period: string | number;
  home: number;
  away: number;
  description?: string;
}

export interface NCAAApiGameLeaders {
  home: NCAAApiLeaderCategory[];
  away: NCAAApiLeaderCategory[];
}

export interface NCAAApiLeaderCategory {
  category: string;
  leaders: Array<{
    name: string;
    value: string;
    position?: string;
  }>;
}

// ============================================================================
// STANDINGS TYPES
// ============================================================================

export interface NCAAApiStandings {
  sport: NCAAApiSport;
  division: NCAADivision;
  conference: string;
  season: number;
  teams: NCAAApiStandingsTeam[];
}

// ============================================================================
// RANKINGS TYPES
// ============================================================================

export interface NCAAApiRanking {
  rank: number;
  team: NCAAApiTeam;
  record: string;
  previousRank?: number;
  points?: number;
  firstPlaceVotes?: number;
}

export interface NCAAApiRankingPoll {
  poll: string;
  sport: NCAAApiSport;
  week: number;
  season: number;
  lastUpdated: string;
  rankings: NCAAApiRanking[];
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface NCAAApiScoreboardResponse {
  sport: NCAAApiSport;
  division: NCAADivision;
  date: string;
  games: NCAAApiGame[];
}

export interface NCAAApiScheduleResponse {
  team: NCAAApiTeam;
  sport: NCAAApiSport;
  season: number;
  games: NCAAApiGame[];
}

// ============================================================================
// ADAPTER OPTIONS
// ============================================================================

export interface NCAAApiAdapterOptions {
  kv?: KVNamespace;
  userAgent?: string;
  timeout?: number;
}

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Sport path mapping for NCAA.com URLs
 */
export const NCAA_SPORT_PATHS: Record<NCAAApiSport, string> = {
  baseball: 'baseball',
  softball: 'softball',
  'basketball-men': 'basketball-men',
  'basketball-women': 'basketball-women',
  football: 'football',
  'soccer-men': 'soccer-men',
  'soccer-women': 'soccer-women',
  'volleyball-women': 'volleyball-women',
  'hockey-men': 'ice-hockey-men',
  'hockey-women': 'ice-hockey-women',
  'lacrosse-men': 'lacrosse-men',
  'lacrosse-women': 'lacrosse-women',
} as const;

/**
 * Division path mapping for NCAA.com URLs
 */
export const NCAA_DIVISION_PATHS: Record<NCAADivision, string> = {
  d1: 'd1',
  d2: 'd2',
  d3: 'd3',
  fbs: 'fbs',
  fcs: 'fcs',
} as const;

/**
 * Cache TTLs in seconds for different NCAA API resources
 */
export const NCAA_CACHE_TTLS: Record<string, number> = {
  scoreboard: 30, // Live scores update frequently
  boxscore: 60, // Box scores during game
  standings: 300, // 5 minutes
  rankings: 1800, // 30 minutes
  schedule: 3600, // 1 hour
  team: 86400, // 24 hours
} as const;

/**
 * NCAA API base URL
 */
export const NCAA_API_BASE = 'https://data.ncaa.com/casablanca/scoreboard';
