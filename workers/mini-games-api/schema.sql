CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  metadata TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_game_score
  ON leaderboard_entries (game_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_global_score
  ON leaderboard_entries (score DESC);
