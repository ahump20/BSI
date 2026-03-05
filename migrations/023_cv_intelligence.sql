-- Migration 023: Computer Vision Intelligence Tables
-- Creates the 4 CV data tables for BSI's CV intelligence layer.
-- Safe to run multiple times (IF NOT EXISTS).

-- ---------------------------------------------------------------------------
-- 1. Pitcher Biomechanics — MLB + College Baseball
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pitcher_biomechanics (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id       TEXT    NOT NULL,
  player_name     TEXT    NOT NULL,
  team            TEXT    NOT NULL,
  league          TEXT    NOT NULL CHECK (league IN ('mlb', 'college-baseball')),
  game_id         TEXT    NOT NULL,
  game_date       TEXT    NOT NULL,
  pitch_count     INTEGER NOT NULL DEFAULT 0,
  velocity_start  REAL,
  velocity_current REAL,
  velocity_delta  REAL,
  release_point_drift_inches REAL,
  fatigue_score   INTEGER NOT NULL DEFAULT 0 CHECK (fatigue_score BETWEEN 0 AND 100),
  injury_risk_index INTEGER NOT NULL DEFAULT 0 CHECK (injury_risk_index BETWEEN 0 AND 100),
  risk_factors    TEXT    DEFAULT '[]',
  -- CV-ready fields (null until richer data available)
  arm_slot_angle          REAL,
  arm_slot_variance       REAL,
  stride_length_pct       REAL,
  stride_length_delta     REAL,
  shoulder_rotation_deg   REAL,
  hip_shoulder_separation REAL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_pitcher_bio_player ON pitcher_biomechanics(player_id);
CREATE INDEX IF NOT EXISTS idx_pitcher_bio_game_date ON pitcher_biomechanics(game_date);
CREATE INDEX IF NOT EXISTS idx_pitcher_bio_fatigue ON pitcher_biomechanics(fatigue_score);
CREATE INDEX IF NOT EXISTS idx_pitcher_bio_team ON pitcher_biomechanics(team, league);

-- ---------------------------------------------------------------------------
-- 2. Formation Intelligence — NFL + NCAA Football
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS formation_intelligence (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  team                    TEXT    NOT NULL,
  league                  TEXT    NOT NULL CHECK (league IN ('nfl', 'ncaafb')),
  season                  INTEGER NOT NULL,
  game_id                 TEXT    NOT NULL,
  game_date               TEXT    NOT NULL,
  formation_name          TEXT    NOT NULL,
  personnel_package       TEXT,
  snap_count              INTEGER NOT NULL DEFAULT 0,
  success_rate            REAL,
  epa_per_play            REAL,
  play_type_distribution  TEXT    DEFAULT '{}',
  tendencies              TEXT    DEFAULT '{}',
  created_at              TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_formation_team_season ON formation_intelligence(team, season);
CREATE INDEX IF NOT EXISTS idx_formation_game ON formation_intelligence(game_id);

-- ---------------------------------------------------------------------------
-- 3. Movement Profiles — Cross-Sport
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movement_profiles (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id               TEXT    NOT NULL,
  player_name             TEXT    NOT NULL,
  team                    TEXT    NOT NULL,
  sport                   TEXT    NOT NULL,
  profile_date            TEXT    NOT NULL,
  sprint_speed_mph        REAL,
  acceleration_metric     REAL,
  deceleration_metric     REAL,
  change_of_direction     REAL,
  acute_workload          REAL,
  chronic_workload        REAL,
  acwr                    REAL,
  baseline_deviation_pct  REAL,
  movement_quality_score  REAL,
  created_at              TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, profile_date)
);

CREATE INDEX IF NOT EXISTS idx_movement_player ON movement_profiles(player_id);
CREATE INDEX IF NOT EXISTS idx_movement_sport ON movement_profiles(sport);
CREATE INDEX IF NOT EXISTS idx_movement_date ON movement_profiles(profile_date);

-- ---------------------------------------------------------------------------
-- 4. CV Adoption Tracker — Editorial Data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cv_adoption_tracker (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  sport             TEXT    NOT NULL,
  league            TEXT    NOT NULL,
  team              TEXT    NOT NULL,
  technology_name   TEXT    NOT NULL,
  vendor            TEXT    NOT NULL,
  deployment_status TEXT    NOT NULL CHECK (deployment_status IN ('deployed', 'pilot', 'announced', 'rumored')),
  camera_count      INTEGER,
  capabilities      TEXT    DEFAULT '[]',
  source_url        TEXT    NOT NULL,
  verified_date     TEXT    NOT NULL,
  notes             TEXT,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cv_adoption_sport ON cv_adoption_tracker(sport);
CREATE INDEX IF NOT EXISTS idx_cv_adoption_vendor ON cv_adoption_tracker(vendor);
