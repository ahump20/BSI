-- Migration 051: HAV-F player evaluation scores
-- Ported from root migrations/034 + 038 into workers/migrations/ where
-- production D1 (bsi-prod-db) actually reads migrations.
-- Column `name` matches the handler INSERT in handlers/analytics.ts.
-- `breakdown` column stores JSON component detail.

CREATE TABLE IF NOT EXISTS havf_scores (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id       TEXT NOT NULL,
  name            TEXT NOT NULL,
  team            TEXT NOT NULL,
  league          TEXT NOT NULL CHECK (league IN ('mlb', 'college-baseball')),
  season          INTEGER NOT NULL,
  position        TEXT,
  conference      TEXT,
  -- Component scores (0-100 each)
  h_score         REAL NOT NULL DEFAULT 0,
  a_score         REAL NOT NULL DEFAULT 0,
  v_score         REAL NOT NULL DEFAULT 0,
  f_score         REAL NOT NULL DEFAULT 0,
  -- Composite
  havf_composite  REAL NOT NULL DEFAULT 0,
  havf_rank       INTEGER,
  -- Component breakdown (JSON)
  breakdown       TEXT,
  -- Raw stats preserved for audit
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
  -- Metadata
  data_source     TEXT NOT NULL DEFAULT 'highlightly',
  computed_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, league, season)
);

CREATE INDEX IF NOT EXISTS idx_havf_composite ON havf_scores(havf_composite DESC);
CREATE INDEX IF NOT EXISTS idx_havf_league_season ON havf_scores(league, season);
CREATE INDEX IF NOT EXISTS idx_havf_team ON havf_scores(team, league, season);
CREATE INDEX IF NOT EXISTS idx_havf_conference ON havf_scores(conference, league, season);
