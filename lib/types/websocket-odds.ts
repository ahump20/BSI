/**
 * WebSocket Odds Types
 * Real-time odds updates via WebSocket
 */

export interface OddsUpdate {
  gameId: string;
  sport: string;
  timestamp: string;
  odds: {
    moneyline: { home: number; away: number };
    spread: { home: number; away: number; line: number };
    total: { over: number; under: number; line: number };
  };
  sportsbook: string;
  movement?: 'up' | 'down' | 'stable';
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxRetries: number;
  heartbeatInterval: number;
}

export interface WebSocketMessage {
  type: 'odds_update' | 'heartbeat' | 'subscription' | 'error';
  data?: any;
  error?: string;
}

export interface OddsSubscription {
  gameIds: string[];
  sports: string[];
  sportsbooks?: string[];
}

export interface OddsHistory {
  gameId: string;
  updates: OddsUpdate[];
  currentOdds: OddsUpdate;
  trend: 'increasing' | 'decreasing' | 'stable';
}
