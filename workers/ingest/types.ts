/**
 * Worker Environment Types
 */

// Cloudflare Workers types
declare global {
  interface KVNamespace {
    get(key: string, options?: { type: 'text' }): Promise<string | null>;
    get(key: string, options: { type: 'json' }): Promise<any>;
    get(key: string, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
    get(key: string, options: { type: 'stream' }): Promise<ReadableStream | null>;
    put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: any): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: any): Promise<any>;
  }

  interface R2Bucket {
    get(key: string): Promise<any>;
    put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob, options?: any): Promise<any>;
    delete(key: string | string[]): Promise<void>;
    list(options?: any): Promise<any>;
  }

  interface AnalyticsEngineDataset {
    writeDataPoint(event: any): void;
  }
}

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
