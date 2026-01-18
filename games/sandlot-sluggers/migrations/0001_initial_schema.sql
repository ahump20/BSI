-- Sandlot Sluggers - Initial Schema
-- D1 Database: bsi-sandlot-sluggers-stats

-- Game stats table - stores individual game results
CREATE TABLE IF NOT EXISTS game_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('practice', 'quickPlay')),
  runs INTEGER NOT NULL DEFAULT 0,
  hits INTEGER NOT NULL DEFAULT 0,
  home_runs INTEGER NOT NULL DEFAULT 0,
  pitch_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for leaderboard queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_game_stats_leaderboard
ON game_stats (mode, runs DESC, hits DESC, created_at DESC);

-- Index for session-specific queries
CREATE INDEX IF NOT EXISTS idx_game_stats_session
ON game_stats (session_id, created_at DESC);

-- Daily aggregates table - for trending/analytics
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('practice', 'quickPlay')),
  total_games INTEGER NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  total_hits INTEGER NOT NULL DEFAULT 0,
  total_home_runs INTEGER NOT NULL DEFAULT 0,
  unique_sessions INTEGER NOT NULL DEFAULT 0,
  avg_duration_ms INTEGER NOT NULL DEFAULT 0,
  UNIQUE (date, mode)
);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_daily_stats_date
ON daily_stats (date DESC, mode);
