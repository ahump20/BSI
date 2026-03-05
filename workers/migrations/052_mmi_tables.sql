-- Migration 052: MMI (Momentum Magnitude Index) tables
-- Ported from root migrations/035 into workers/migrations/ where
-- production D1 actually reads migrations.
-- Fixed excitement_rating CHECK to match classifyExcitement() output
-- in lib/analytics/mmi.ts: routine | competitive | thriller | instant-classic.

CREATE TABLE IF NOT EXISTS mmi_snapshots (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id         TEXT NOT NULL,
  league          TEXT NOT NULL CHECK (league IN ('mlb', 'college-baseball')),
  inning          INTEGER NOT NULL,
  inning_half     TEXT NOT NULL CHECK (inning_half IN ('top', 'bottom')),
  outs            INTEGER NOT NULL DEFAULT 0,
  -- Scores at this point
  home_score      INTEGER NOT NULL DEFAULT 0,
  away_score      INTEGER NOT NULL DEFAULT 0,
  -- MMI value and components
  mmi_value       REAL NOT NULL DEFAULT 0,
  sd_component    REAL NOT NULL DEFAULT 0,
  rs_component    REAL NOT NULL DEFAULT 0,
  gp_component    REAL NOT NULL DEFAULT 0,
  bs_component    REAL NOT NULL DEFAULT 0,
  -- Base state
  runners_on      TEXT,
  -- Metadata
  computed_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mmi_game_summary (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id             TEXT NOT NULL UNIQUE,
  league              TEXT NOT NULL CHECK (league IN ('mlb', 'college-baseball')),
  game_date           TEXT NOT NULL,
  home_team           TEXT NOT NULL,
  away_team           TEXT NOT NULL,
  final_home_score    INTEGER,
  final_away_score    INTEGER,
  -- Aggregate MMI stats
  max_mmi             REAL NOT NULL DEFAULT 0,
  min_mmi             REAL NOT NULL DEFAULT 0,
  avg_mmi             REAL NOT NULL DEFAULT 0,
  mmi_volatility      REAL NOT NULL DEFAULT 0,
  lead_changes        INTEGER NOT NULL DEFAULT 0,
  max_swing           REAL NOT NULL DEFAULT 0,
  swing_inning        INTEGER,
  -- Classification
  excitement_rating   TEXT CHECK (excitement_rating IN ('routine', 'competitive', 'thriller', 'instant-classic')),
  -- Metadata
  data_source         TEXT NOT NULL DEFAULT 'highlightly',
  computed_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mmi_snap_game ON mmi_snapshots(game_id, inning, inning_half);
CREATE INDEX IF NOT EXISTS idx_mmi_summary_date ON mmi_game_summary(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mmi_summary_excitement ON mmi_game_summary(excitement_rating, game_date DESC);
