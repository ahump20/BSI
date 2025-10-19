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
  season?: number;
  seasonType?: 'REGULAR' | 'POSTSEASON' | 'CONFERENCE' | 'EXHIBITION';
  events?: ProviderEvent[];
  boxScore?: ProviderBoxLine[];
}

export interface ProviderEvent {
  sequence: number;
  inning: number;
  inningHalf: 'TOP' | 'BOTTOM';
  outs?: number;
  eventType: string;
  description: string;
  homeWinProb?: number;
  wpaSwing?: number;
}

export interface ProviderBoxLine {
  playerId: string;
  teamId: string;
  side: 'HOME' | 'AWAY';
  battingOrder?: number;
  batting: {
    ab: number;
    r: number;
    h: number;
    rbi: number;
    bb: number;
    so: number;
    doubles?: number;
    triples?: number;
    homeRuns?: number;
    stolenBases?: number;
    caughtStealing?: number;
  };
  pitching?: {
    ip?: number;
    hitsAllowed?: number;
    runsAllowed?: number;
    earnedRuns?: number;
    bbAllowed?: number;
    soRecorded?: number;
    homeRunsAllowed?: number;
    decision?: 'W' | 'L' | 'S' | 'ND';
  };
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
  hitsTotal?: number;
  homeRuns?: number;
  stolenBases?: number;
  earnedRuns?: number;
  hitsAllowed?: number;
  strikeouts?: number;
  walks?: number;
  onBasePct?: number;
  sluggingPct?: number;
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
