-- Migration 036: Enhanced arcade tracking (session history + daily aggregates)

CREATE TABLE IF NOT EXISTS arcade_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT    NOT NULL,
  game_id     TEXT    NOT NULL,
  score       INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  played_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_game ON arcade_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_sessions_player ON arcade_sessions(player_name);
CREATE INDEX IF NOT EXISTS idx_sessions_time ON arcade_sessions(played_at);

CREATE TABLE IF NOT EXISTS arcade_daily_stats (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id         TEXT    NOT NULL,
  stat_date       TEXT    NOT NULL,
  total_plays     INTEGER NOT NULL DEFAULT 0,
  unique_players  INTEGER NOT NULL DEFAULT 0,
  high_score      INTEGER NOT NULL DEFAULT 0,
  avg_score       REAL    NOT NULL DEFAULT 0,
  UNIQUE(game_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_game ON arcade_daily_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_daily_date ON arcade_daily_stats(stat_date);
