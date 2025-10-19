import type { Division, FeedPrecision, GameStatus, InningHalf, Sport } from '@prisma/client';

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
  status: GameStatus;
  sport: Sport;
  division: Division;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  venueId?: string;
  currentInning?: number;
  currentInningHalf?: InningHalf;
  balls?: number;
  strikes?: number;
  outs?: number;
  providerName: string;
  feedPrecision: FeedPrecision;
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
  hitsTotal: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  stolenBases: number;
  caughtStealing: number;
  battingAvg: number;
  era: number;
  fieldingPct: number;
  rpi?: number;
  strengthOfSched?: number;
  pythagWins?: number;
  onBasePct?: number;
  sluggingPct?: number;
  ops?: number;
  hitsAllowed?: number;
  strikeouts?: number;
  walks?: number;
  whip?: number;
  recentForm?: string;
  injuryImpact?: number;
}

/**
 * Query parameters for getGames
 */
export interface GamesQueryParams {
  sport: Sport;
  division: Division;
  date: Date;
  status?: GameStatus[];
  teamId?: string;
}

/**
 * Query parameters for getTeamStats
 */
export interface TeamStatsQueryParams {
  teamId: string;
  season: number;
}
