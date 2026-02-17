-- Migration 034: HAV-F (Hits/At-Bats/Velocity/Fielding) composite player metric
-- Proprietary BSI player evaluation on a 0-100 scale

CREATE TABLE IF NOT EXISTS havf_scores (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id       TEXT    NOT NULL,
  player_name     TEXT    NOT NULL,
  team            TEXT    NOT NULL,
  league          TEXT    NOT NULL CHECK (league IN ('mlb', 'college-baseball')),
  season          INTEGER NOT NULL,
  -- Component scores (0-100 percentile)
  h_score         REAL    NOT NULL DEFAULT 0,
  a_score         REAL    NOT NULL DEFAULT 0,
  v_score         REAL    NOT NULL DEFAULT 0,
  f_score         REAL    NOT NULL DEFAULT 0,
  -- Composite (weighted sum of components)
  havf_composite  REAL    NOT NULL DEFAULT 0,
  havf_rank       INTEGER,
  -- Raw inputs stored for audit/transparency
  raw_avg         REAL,
  raw_obp         REAL,
  raw_slg         REAL,
  raw_woba        REAL,
  raw_iso         REAL,
  raw_bb_pct      REAL,
  raw_k_pct       REAL,
  raw_babip       REAL,
  raw_hr_rate     REAL,
  raw_fielding_pct REAL,
  raw_range_factor REAL,
  -- Meta
  data_source     TEXT    NOT NULL DEFAULT 'highlightly',
  computed_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, league, season)
);

CREATE INDEX IF NOT EXISTS idx_havf_composite ON havf_scores(havf_composite DESC);
CREATE INDEX IF NOT EXISTS idx_havf_player ON havf_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_havf_team ON havf_scores(team, league);
CREATE INDEX IF NOT EXISTS idx_havf_league_season ON havf_scores(league, season);
