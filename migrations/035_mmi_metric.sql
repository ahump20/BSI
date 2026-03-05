-- MMI (Momentum Magnitude Index) — per-play and per-game momentum tracking
-- Captures in-game momentum shifts from -100 (away dominant) to +100 (home dominant).
-- Components: Score Differential (40%), Recent Scoring (30%), Game Phase (15%), Base Situation (15%)

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
  runners_on      TEXT,  -- e.g., '1,3' for runners on 1st and 3rd
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
  mmi_volatility      REAL NOT NULL DEFAULT 0,  -- standard deviation
  lead_changes        INTEGER NOT NULL DEFAULT 0,
  max_swing           REAL NOT NULL DEFAULT 0,   -- largest single-play MMI change
  swing_inning        INTEGER,                    -- inning of largest swing
  -- Classification
  excitement_rating   TEXT CHECK (excitement_rating IN ('low', 'medium', 'high', 'extreme')),
  -- Metadata
  data_source         TEXT NOT NULL DEFAULT 'highlightly',
  computed_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mmi_snap_game ON mmi_snapshots(game_id, inning, inning_half);
CREATE INDEX IF NOT EXISTS idx_mmi_summary_date ON mmi_game_summary(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_mmi_summary_excitement ON mmi_game_summary(excitement_rating, game_date DESC);
