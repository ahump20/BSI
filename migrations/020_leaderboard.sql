-- BSI Leaderboard persistence
-- Stores game scores from mini-games for the multiplayer leaderboard.

CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  avatar TEXT DEFAULT '🎮',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_game ON leaderboard(game_id, score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_player_game ON leaderboard(player_name, game_id);
