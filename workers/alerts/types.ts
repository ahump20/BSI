export interface Env {
  DATABASE_URL: string;
  WATCHLIST_ALERT_WEBHOOK?: string;
  WATCHLIST_ALERT_EMAIL_WEBHOOK?: string;
  LIVE_GAMES_API?: string;
  ALERT_MIN_PROBABILITY_DELTA?: string;
}
export interface LiveGameSnapshot {
  id: string;
  entityType: 'GAME' | 'TEAM';
  entityId: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
  lastLeadChangeAt?: string;
  upsetProbability?: number;
  previousUpsetProbability?: number;
  summary?: string;
}
