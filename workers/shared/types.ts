export interface Env {
  KV: KVNamespace;
  CACHE: DurableObjectNamespace;
  PORTAL_POLLER: DurableObjectNamespace;
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  ENVIRONMENT: string;
  API_VERSION: string;
  PAGES_ORIGIN: string;
  SPORTS_DATA_IO_API_KEY?: string;
  RAPIDAPI_KEY?: string;
  ERROR_LOG?: KVNamespace;
  TURNSTILE_SECRET_KEY?: string;
  OPS_EVENTS?: AnalyticsEngineDataset;
  BSI_KEYS?: KVNamespace;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  PREDICTION_CACHE?: KVNamespace;
  BSI_PROD_CACHE?: KVNamespace;
  MONITOR_KV?: KVNamespace;
  DATA_LAKE?: R2Bucket;
  ADMIN_KEY?: string;
  RATE_LIMIT?: KVNamespace;
  SHOW_API_HOST?: string;
  SHOW_MARKET_WEB_HOST?: string;
  SHOW_PUBLIC_GAME_CODE?: string;
  SHOW_26_VERIFIED?: string;
  SHOW_SYNC_CARD_PAGES?: string;
  SHOW_SYNC_LISTING_PAGES?: string;
  SHOW_SYNC_CAPTAIN_PAGES?: string;
}

export interface PredictionPayload {
  gameId: string;
  sport: string;
  predictedWinner: string;
  confidence: number;
  spread?: number;
  overUnder?: number;
}
