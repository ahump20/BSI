-- Migration 052: MMI (Momentum Magnitude Index) Tables
-- Creates snapshot + game summary tables for live momentum tracking.
-- Schema matches what workers/handlers/analytics.ts already queries.

-- Per-state-change snapshots — one row per meaningful game event
CREATE TABLE IF NOT EXISTS mmi_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  inning INTEGER NOT NULL,
  inning_half TEXT NOT NULL CHECK(inning_half IN ('top', 'bottom')),
  outs INTEGER NOT NULL DEFAULT 0,
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  mmi_value REAL NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('home', 'away', 'neutral')),
  magnitude TEXT NOT NULL CHECK(magnitude IN ('low', 'medium', 'high', 'extreme')),
  components TEXT NOT NULL,    -- JSON: {sd, rs, gp, bs}
  home_wp REAL,                -- Optional win probability (0-1)
  event_description TEXT,      -- What happened (e.g., "2-run homer")
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Game-level summary — one row per completed game
CREATE TABLE IF NOT EXISTS mmi_game_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL UNIQUE,
  game_date TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  final_home_score INTEGER,
  final_away_score INTEGER,
  max_mmi REAL NOT NULL,
  min_mmi REAL NOT NULL,
  avg_mmi REAL NOT NULL,
  mmi_volatility REAL NOT NULL,
  lead_changes INTEGER NOT NULL DEFAULT 0,
  max_swing REAL NOT NULL DEFAULT 0,
  swing_inning INTEGER,
  excitement_rating TEXT NOT NULL CHECK(excitement_rating IN ('routine', 'competitive', 'thriller', 'instant-classic')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Live lookup: most recent snapshot for a game
CREATE INDEX IF NOT EXISTS idx_mmi_snap_game ON mmi_snapshots(game_id, id DESC);

-- Trending: today's most volatile games
CREATE INDEX IF NOT EXISTS idx_mmi_summary_date ON mmi_game_summary(game_date, mmi_volatility DESC);

-- Game lookup
CREATE INDEX IF NOT EXISTS idx_mmi_summary_game ON mmi_game_summary(game_id);
