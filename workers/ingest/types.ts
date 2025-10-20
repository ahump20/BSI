/**
 * Worker Environment Types
 */

export interface Env {
  // Database
  DATABASE_URL: string;

  // KV Cache
  CACHE: KVNamespace;

  // R2 Storage
  R2_BUCKET: R2Bucket;

  // Analytics Engine
  ANALYTICS?: AnalyticsEngineDataset;

  // API Keys
  SPORTSDATA_API_KEY: string;
  NCAA_API_KEY?: string;
  ESPN_API_KEY?: string;

  // Worker Secrets
  INGEST_SECRET: string;
}

/**
 * Game data structure from providers
 */
export interface ProviderGame {
  id: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED';
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamSlug?: string;
  awayTeamSlug?: string;
  homeScore: number | null;
  awayScore: number | null;
  venueId?: string;
  currentInning?: number;
  currentInningHalf?: 'TOP' | 'BOTTOM';
  balls?: number;
  strikes?: number;
  outs?: number;
  providerName: string;
  feedPrecision: 'EVENT' | 'PITCH' | 'PLAY';
}

/**
 * Team stats structure from providers
 */
export interface ProviderTeamStats {
  wins: number;
  losses: number;
  confWins: number;
  confLosses: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
  runsScored: number;
  runsAllowed: number;
  battingAvg: number;
  era: number;
  fieldingPct: number;
  rpi?: number;
  strengthOfSched?: number;
  pythagWins?: number;
}

/**
 * Query parameters for getGames
 */
export interface GamesQueryParams {
  sport: 'baseball' | 'football' | 'basketball';
  division: 'D1' | 'D2' | 'D3' | 'JUCO';
  date: Date;
  status?: Array<'SCHEDULED' | 'LIVE' | 'FINAL'>;
  teamId?: string;
}

/**
 * Query parameters for getTeamStats
 */
export interface TeamStatsQueryParams {
  teamId: string;
  season: number;
}
