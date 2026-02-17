-- Migration 035: MMI (Momentum Magnitude Index) real-time game momentum metric
-- Range: -100 (away dominant) to +100 (home dominant)

CREATE TABLE IF NOT EXISTS mmi_snapshots (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id         TEXT    NOT NULL,
  sport           TEXT    NOT NULL CHECK (sport IN ('college-baseball', 'mlb', 'nfl', 'nba')),
  -- Snapshot point within the game
  inning          INTEGER,
  inning_half     TEXT    CHECK (inning_half IN ('top', 'bottom', NULL)),
  play_index      INTEGER NOT NULL DEFAULT 0,
  -- Scores at this point
  home_score      INTEGER NOT NULL DEFAULT 0,
  away_score      INTEGER NOT NULL DEFAULT 0,
  -- MMI value and component breakdown
  mmi_value       REAL    NOT NULL DEFAULT 0,
  sd_component    REAL    NOT NULL DEFAULT 0,
  rs_component    REAL    NOT NULL DEFAULT 0,
  gp_component    REAL    NOT NULL DEFAULT 0,
  bs_component    REAL    NOT NULL DEFAULT 0,
  -- Timing
  captured_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(game_id, play_index)
);

CREATE INDEX IF NOT EXISTS idx_mmi_game ON mmi_snapshots(game_id);
CREATE INDEX IF NOT EXISTS idx_mmi_sport ON mmi_snapshots(sport);
CREATE INDEX IF NOT EXISTS idx_mmi_time ON mmi_snapshots(captured_at);

-- Game-level summary computed when the game ends
CREATE TABLE IF NOT EXISTS mmi_game_summary (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id         TEXT    NOT NULL UNIQUE,
  sport           TEXT    NOT NULL,
  home_team       TEXT    NOT NULL,
  away_team       TEXT    NOT NULL,
  final_mmi       REAL    NOT NULL DEFAULT 0,
  max_mmi         REAL    NOT NULL DEFAULT 0,
  min_mmi         REAL    NOT NULL DEFAULT 0,
  momentum_swings INTEGER NOT NULL DEFAULT 0,
  biggest_swing   REAL    NOT NULL DEFAULT 0,
  game_date       TEXT    NOT NULL,
  computed_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mmi_summary_sport ON mmi_game_summary(sport);
CREATE INDEX IF NOT EXISTS idx_mmi_summary_date ON mmi_game_summary(game_date);
