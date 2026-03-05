-- Migration 043: College Baseball Savant — Advanced Analytics Tables
--
-- Four tables for the Savant feature:
--   1. cbb_batting_advanced  — per-player batting advanced metrics
--   2. cbb_pitching_advanced — per-player pitching advanced metrics
--   3. cbb_park_factors      — per-venue park factor adjustments
--   4. cbb_conference_strength — conference strength index rankings

-- ---------------------------------------------------------------------------
-- 1. Batting Advanced
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cbb_batting_advanced (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT NOT NULL,
  team_id TEXT,
  conference TEXT,
  season INTEGER NOT NULL DEFAULT 2026,
  position TEXT,
  class_year TEXT,

  -- Traditional
  g INTEGER DEFAULT 0,
  ab INTEGER DEFAULT 0,
  pa INTEGER DEFAULT 0,
  r INTEGER DEFAULT 0,
  h INTEGER DEFAULT 0,
  doubles INTEGER DEFAULT 0,
  triples INTEGER DEFAULT 0,
  hr INTEGER DEFAULT 0,
  rbi INTEGER DEFAULT 0,
  bb INTEGER DEFAULT 0,
  so INTEGER DEFAULT 0,
  sb INTEGER DEFAULT 0,
  cs INTEGER DEFAULT 0,
  avg REAL DEFAULT 0,
  obp REAL DEFAULT 0,
  slg REAL DEFAULT 0,
  ops REAL DEFAULT 0,

  -- Advanced (Free tier)
  k_pct REAL DEFAULT 0,
  bb_pct REAL DEFAULT 0,
  iso REAL DEFAULT 0,
  babip REAL DEFAULT 0,

  -- Advanced (Pro tier)
  woba REAL DEFAULT 0,
  wrc_plus REAL DEFAULT 0,
  ops_plus REAL DEFAULT 0,

  -- Estimated (Pro tier)
  e_ba REAL,
  e_slg REAL,
  e_woba REAL,

  -- Meta
  park_adjusted INTEGER DEFAULT 0,
  data_source TEXT DEFAULT 'bsi-savant',
  computed_at TEXT NOT NULL,

  UNIQUE(player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_cbb_bat_adv_team ON cbb_batting_advanced(team, season);
CREATE INDEX IF NOT EXISTS idx_cbb_bat_adv_conf ON cbb_batting_advanced(conference, season);
CREATE INDEX IF NOT EXISTS idx_cbb_bat_adv_woba ON cbb_batting_advanced(woba DESC);
CREATE INDEX IF NOT EXISTS idx_cbb_bat_adv_wrc ON cbb_batting_advanced(wrc_plus DESC);

-- ---------------------------------------------------------------------------
-- 2. Pitching Advanced
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cbb_pitching_advanced (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT NOT NULL,
  team_id TEXT,
  conference TEXT,
  season INTEGER NOT NULL DEFAULT 2026,
  position TEXT,
  class_year TEXT,

  -- Traditional
  g INTEGER DEFAULT 0,
  gs INTEGER DEFAULT 0,
  w INTEGER DEFAULT 0,
  l INTEGER DEFAULT 0,
  sv INTEGER DEFAULT 0,
  ip REAL DEFAULT 0,
  h INTEGER DEFAULT 0,
  er INTEGER DEFAULT 0,
  bb INTEGER DEFAULT 0,
  hbp INTEGER DEFAULT 0,
  so INTEGER DEFAULT 0,
  era REAL DEFAULT 0,
  whip REAL DEFAULT 0,

  -- Advanced (Free tier)
  k_9 REAL DEFAULT 0,
  bb_9 REAL DEFAULT 0,
  hr_9 REAL DEFAULT 0,

  -- Advanced (Pro tier)
  fip REAL DEFAULT 0,
  x_fip REAL,
  era_minus REAL DEFAULT 0,
  k_bb REAL DEFAULT 0,
  lob_pct REAL DEFAULT 0,
  babip REAL DEFAULT 0,

  -- Workload
  pitch_count_total INTEGER DEFAULT 0,
  avg_pitches_per_start REAL DEFAULT 0,
  appearances_last_7d INTEGER DEFAULT 0,
  appearances_last_14d INTEGER DEFAULT 0,

  -- Meta
  park_adjusted INTEGER DEFAULT 0,
  data_source TEXT DEFAULT 'bsi-savant',
  computed_at TEXT NOT NULL,

  UNIQUE(player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_cbb_pitch_adv_team ON cbb_pitching_advanced(team, season);
CREATE INDEX IF NOT EXISTS idx_cbb_pitch_adv_conf ON cbb_pitching_advanced(conference, season);
CREATE INDEX IF NOT EXISTS idx_cbb_pitch_adv_fip ON cbb_pitching_advanced(fip ASC);
CREATE INDEX IF NOT EXISTS idx_cbb_pitch_adv_era_minus ON cbb_pitching_advanced(era_minus ASC);

-- ---------------------------------------------------------------------------
-- 3. Park Factors
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cbb_park_factors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team TEXT NOT NULL,
  team_id TEXT,
  venue_name TEXT,
  conference TEXT,
  season INTEGER NOT NULL DEFAULT 2026,

  runs_factor REAL DEFAULT 1.0,
  hits_factor REAL DEFAULT 1.0,
  hr_factor REAL DEFAULT 1.0,
  bb_factor REAL DEFAULT 1.0,
  so_factor REAL DEFAULT 1.0,

  sample_games INTEGER DEFAULT 0,
  methodology_note TEXT,
  computed_at TEXT NOT NULL,

  UNIQUE(team, season)
);

CREATE INDEX IF NOT EXISTS idx_cbb_park_conf ON cbb_park_factors(conference, season);

-- ---------------------------------------------------------------------------
-- 4. Conference Strength
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cbb_conference_strength (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conference TEXT NOT NULL,
  season INTEGER NOT NULL DEFAULT 2026,

  strength_index REAL DEFAULT 0,
  run_environment REAL DEFAULT 0,
  avg_era REAL DEFAULT 0,
  avg_ops REAL DEFAULT 0,
  avg_woba REAL DEFAULT 0,
  inter_conf_win_pct REAL DEFAULT 0,
  rpi_avg REAL DEFAULT 0,
  is_power INTEGER DEFAULT 0,

  computed_at TEXT NOT NULL,

  UNIQUE(conference, season)
);

CREATE INDEX IF NOT EXISTS idx_cbb_conf_strength ON cbb_conference_strength(strength_index DESC);
