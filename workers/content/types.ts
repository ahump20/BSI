/**
 * Content Generation Worker Types
 *
 * Defines interfaces for NLG content generation with fact-checking
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

  interface AnalyticsEngineDataset {
    writeDataPoint(event: any): void;
  }
}

export interface Env {
  DATABASE_URL: string;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  GOOGLE_GEMINI_API_KEY: string;
  CONTENT_SECRET: string;
  CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
}

export interface GameContext {
  game: {
    id: string;
    scheduledAt: string;
    status: 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED';
    homeScore: number | null;
    awayScore: number | null;
    currentInning?: number;
    venueId?: string;
    venueName?: string;
  };
  homeTeam: {
    id: string;
    name: string;
    school: string;
    conference: string;
    record: string;
    recentForm?: string; // e.g., "W-L-W-W-L" last 5
  };
  awayTeam: {
    id: string;
    name: string;
    school: string;
    conference: string;
    record: string;
    recentForm?: string;
  };
  boxScore?: {
    homeStats: TeamBoxStats;
    awayStats: TeamBoxStats;
  };
  topPerformers?: {
    hitting?: PlayerPerformance[];
    pitching?: PlayerPerformance[];
  };
  keyMoments?: string[];
  historicalMatchup?: {
    gamesPlayed: number;
    homeTeamWins: number;
    awayTeamWins: number;
    lastMeetingDate?: string;
    lastMeetingWinner?: string;
  };
}

export interface TeamBoxStats {
  runs: number;
  hits: number;
  errors: number;
  leftOnBase: number;
  battingAvg: number;
  era?: number;
}

export interface PlayerPerformance {
  playerId: string;
  playerName: string;
  position: string;
  stats: string; // e.g., "3-4, 2 HR, 5 RBI" or "7 IP, 2 ER, 10 K"
  impact: 'high' | 'medium' | 'low';
}

export interface ContentRequest {
  type: 'recap' | 'preview';
  gameId: string;
  provider?: 'anthropic' | 'openai' | 'gemini';
  maxTokens?: number;
  temperature?: number;
}

export interface ContentResponse {
  articleId: string;
  gameId: string;
  type: 'recap' | 'preview';
  title: string;
  content: string;
  summary: string;
  factChecked: boolean;
  factCheckResults?: FactCheckResult[];
  provider: string;
  generatedAt: string;
  wordCount: number;
  readingTimeMinutes: number;
}

export interface FactCheckResult {
  claim: string;
  verified: boolean;
  source: 'database' | 'manual' | 'external';
  confidence: number; // 0-1
  correction?: string;
}

export interface PromptTemplate {
  system: string;
  user: string;
  constraints: string[];
}
