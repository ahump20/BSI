-- Enhanced arcade tracking — session-level play data and daily aggregates

CREATE TABLE IF NOT EXISTS arcade_sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT NOT NULL UNIQUE,
  game_id         TEXT NOT NULL,
  player_name     TEXT,
  score           INTEGER NOT NULL DEFAULT 0,
  duration_ms     INTEGER,  -- how long they played
  started_at      TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at        TEXT,
  user_agent      TEXT,
  ip_hash         TEXT      -- hashed for privacy, used for unique player counts
);

CREATE TABLE IF NOT EXISTS arcade_daily_stats (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id         TEXT NOT NULL,
  stat_date       TEXT NOT NULL,
  total_plays     INTEGER NOT NULL DEFAULT 0,
  unique_players  INTEGER NOT NULL DEFAULT 0,
  high_score      INTEGER NOT NULL DEFAULT 0,
  avg_score       REAL NOT NULL DEFAULT 0,
  avg_duration_ms INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(game_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_arcade_sessions_game ON arcade_sessions(game_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_arcade_daily_date ON arcade_daily_stats(stat_date DESC);
