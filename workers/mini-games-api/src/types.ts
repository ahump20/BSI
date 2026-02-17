export interface Env {
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
}

export interface ScoreSubmission {
  gameId: string;
  playerName: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface LeaderboardEntry {
  id: number;
  game_id: string;
  player_name: string;
  score: number;
  metadata: string | null;
  submitted_at: string;
}

// ── Economy types ──────────────────────────────

export interface MatchResult {
  deviceId: string;
  unitsKilled: number;
  buildingsDestroyed: number;
  resourcesGathered: number;
  matchDurationSec: number;
  victory: boolean;
}

export interface WalletResponse {
  deviceId: string;
  blazeCoins: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  createdAt: string;
  updatedAt: string;
}
