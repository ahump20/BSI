/**
 * MCP Tools Type Definitions
 *
 * Shared types for the Texas Longhorns MCP server tools.
 * Based on official MCP patterns from modelcontextprotocol/typescript-sdk.
 *
 * @see https://github.com/modelcontextprotocol/typescript-sdk
 */

// ============================================================================
// CORE MCP TYPES
// ============================================================================

export type Sport = 'baseball' | 'football' | 'basketball' | 'track_field';

export const SPORT_ORDER: Sport[] = ['baseball', 'football', 'basketball', 'track_field'];

export const TEAM_NAME = 'Texas Longhorns';

// ============================================================================
// CITATION & RESPONSE TYPES
// ============================================================================

export interface Citation {
  id: string;
  label: string;
  path: string;
  timestamp: string;
}

export interface ToolPayload<T> {
  result: T;
  citations: Citation[];
  generatedAt: string;
}

export interface ToolResponse<T> extends ToolPayload<T> {
  meta: {
    cache: {
      key: string;
      status: 'HIT' | 'MISS';
    };
  };
}

// ============================================================================
// TOOL CONTEXT & ENVIRONMENT
// ============================================================================

export interface LonghornsEnv {
  LONGHORNS_KV?: KVNamespace;
  LONGHORNS_R2?: R2Bucket;
  LONGHORNS_D1?: D1Database;
  LONGHORNS_DO?: DurableObjectNamespace;
}

export interface ToolContext {
  env?: LonghornsEnv;
  cache?: CacheChainInterface;
}

// ============================================================================
// CACHE CHAIN INTERFACE
// ============================================================================

export interface CacheChainInterface {
  get(key: string): Promise<string | undefined>;
  put(key: string, value: string): Promise<void>;
}

// ============================================================================
// KV NAMESPACE INTERFACE
// ============================================================================

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

// ============================================================================
// R2 BUCKET INTERFACE
// ============================================================================

interface R2ObjectBody {
  text(): Promise<string>;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }
  ): Promise<void>;
}

// ============================================================================
// D1 DATABASE INTERFACE
// ============================================================================

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// ============================================================================
// DURABLE OBJECT INTERFACE
// ============================================================================

interface DurableObjectId {}

interface DurableObjectStub {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

// ============================================================================
// TOOL DEFINITION TYPES (MCP SDK PATTERN)
// ============================================================================

export interface ToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  handler: (input: TInput, context: ToolContext) => Promise<ToolResponse<TOutput>>;
}

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, ToolPropertySchema>;
  required?: string[];
}

export interface ToolPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ToolPropertySchema;
  default?: unknown;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class LonghornsError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'BAD_REQUEST'
  ) {
    super(message);
    this.name = 'LonghornsError';
  }
}

// ============================================================================
// SPORT-SPECIFIC TYPES
// ============================================================================

export interface SeasonSummary {
  sport: Sport;
  season: string;
  record?: string;
  conferenceRecord?: string;
  ranking?: number;
  coach?: string;
  highlights?: string[];
}

export interface ScheduleGame {
  id: string;
  date: string;
  opponent: string;
  location: 'home' | 'away' | 'neutral';
  result?: {
    score: string;
    win: boolean;
  };
  venue?: string;
  broadcast?: string;
  ranking?: {
    texas?: number;
    opponent?: number;
  };
}

export interface BoxScore {
  gameId: string;
  date: string;
  opponent: string;
  final: {
    texas: number;
    opponent: number;
  };
  linescore?: Array<{ period: string | number; texas: number; opponent: number }>;
  stats: Record<string, unknown>;
  leaders?: Record<string, unknown>;
}

export interface PlayerCareer {
  playerId: string;
  name: string;
  sport: Sport;
  position: string;
  years: string;
  stats: Record<string, unknown>;
  accolades?: string[];
  draft?: {
    year: number;
    team: string;
    round: number;
    pick: number;
  };
}

export interface RankingsContext {
  sport: Sport;
  season: string;
  currentRank?: number;
  previousRank?: number;
  highRank?: number;
  lowRank?: number;
  weeksRanked?: number;
  pollHistory?: Array<{
    week: number;
    rank: number;
    points?: number;
  }>;
}

export interface ArchiveResult {
  id: string;
  title: string;
  sport: Sport;
  date: string;
  type: string;
  excerpt: string;
  path: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ToolName =
  | 'get_team_seasons'
  | 'get_season_schedule'
  | 'get_game_box_score'
  | 'get_player_career'
  | 'get_rankings_context'
  | 'search_archive';

export interface ToolRegistry {
  [key: string]: ToolDefinition<unknown, unknown>;
}
