/**
 * BSI Live Sports Ticker - Type Definitions
 * Real-time breaking news and sports event ticker
 */

// ULID generator (simple implementation without external deps)
export function ulid(): string {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const ENCODING_LEN = ENCODING.length;
  const TIME_LEN = 10;
  const RANDOM_LEN = 16;

  let time = Date.now();
  let str = '';

  for (let i = TIME_LEN; i > 0; i--) {
    str = ENCODING[time % ENCODING_LEN] + str;
    time = Math.floor(time / ENCODING_LEN);
  }

  for (let i = 0; i < RANDOM_LEN; i++) {
    str += ENCODING[Math.floor(Math.random() * ENCODING_LEN)];
  }

  return str;
}

// Ticker item types
export type TickerType = 'score' | 'news' | 'injury' | 'trade' | 'weather';
export type League = 'MLB' | 'NFL' | 'NCAAF' | 'NBA' | 'NCAABB';
export type Priority = 1 | 2 | 3; // 1 = breaking, 2 = important, 3 = standard

export interface TickerItemMetadata {
  teamIds?: string[];
  gameId?: string;
  playerId?: string;
  link?: string;
}

export interface TickerItem {
  id: string;
  type: TickerType;
  league: League;
  headline: string; // max 120 chars
  timestamp: number; // unix ms
  priority: Priority;
  metadata?: TickerItemMetadata;
}

// WebSocket message types
export type WSMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'ticker_item'
  | 'ticker_batch'
  | 'heartbeat'
  | 'ack'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  payload?: unknown;
  timestamp: number;
}

export interface SubscribeMessage extends WSMessage {
  type: 'subscribe';
  payload: {
    leagues?: League[];
    types?: TickerType[];
    minPriority?: Priority;
  };
}

export interface TickerItemMessage extends WSMessage {
  type: 'ticker_item';
  payload: TickerItem;
}

export interface TickerBatchMessage extends WSMessage {
  type: 'ticker_batch';
  payload: TickerItem[];
}

export interface HeartbeatMessage extends WSMessage {
  type: 'heartbeat';
  payload: {
    serverTime: number;
    connectionId: string;
  };
}

export interface ErrorMessage extends WSMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
  };
}

// Queue message for ingestion
export interface QueueMessage {
  id: string;
  type: TickerType;
  league: League;
  headline: string;
  priority: Priority;
  metadata?: TickerItemMetadata;
  source: string; // e.g., 'espn', 'mlb-api', 'manual'
}

// API request/response types
export interface PublishRequest {
  type: TickerType;
  league: League;
  headline: string;
  priority?: Priority;
  metadata?: TickerItemMetadata;
}

export interface PublishResponse {
  success: boolean;
  item?: TickerItem;
  error?: string;
}

export interface ItemsResponse {
  items: TickerItem[];
  count: number;
  timestamp: number;
}

// Durable Object state
export interface TickerRoomState {
  items: TickerItem[];
  maxItems: number;
  connections: Map<string, WebSocket>;
}

// Environment bindings
export interface Env {
  TICKER_ROOM: DurableObjectNamespace;
  BSI_TICKER_CACHE: KVNamespace;
  BSI_TICKER_QUEUE: Queue<QueueMessage>;
  BSI_TICKER_DB: D1Database;
  API_SECRET: string;
  ALLOWED_ORIGINS: string; // comma-separated
}

// D1 schema types
export interface TickerHistoryRow {
  id: string;
  type: string;
  league: string;
  headline: string;
  priority: number;
  metadata: string | null; // JSON string
  timestamp: number;
  created_at: string;
}

// Client connection state
export interface ClientState {
  id: string;
  subscribedLeagues: Set<League>;
  subscribedTypes: Set<TickerType>;
  minPriority: Priority;
  lastHeartbeat: number;
  connectedAt: number;
}

// Validation helpers
export const VALID_TYPES: TickerType[] = ['score', 'news', 'injury', 'trade', 'weather'];
export const VALID_LEAGUES: League[] = ['MLB', 'NFL', 'NCAAF', 'NBA', 'NCAABB'];
export const MAX_HEADLINE_LENGTH = 120;
export const MAX_ITEMS = 50;
export const HEARTBEAT_INTERVAL_MS = 30000;
export const CONNECTION_TIMEOUT_MS = 90000;

export function validateTickerItem(item: Partial<TickerItem>): item is TickerItem {
  if (!item.type || !VALID_TYPES.includes(item.type)) return false;
  if (!item.league || !VALID_LEAGUES.includes(item.league)) return false;
  if (!item.headline || item.headline.length > MAX_HEADLINE_LENGTH) return false;
  if (!item.priority || ![1, 2, 3].includes(item.priority)) return false;
  return true;
}

export function sanitizeHeadline(headline: string): string {
  return headline
    .trim()
    .slice(0, MAX_HEADLINE_LENGTH)
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}
