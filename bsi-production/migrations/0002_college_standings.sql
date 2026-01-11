-- Migration: 0002_college_standings.sql
-- Purpose: Conference standings tables for college baseball and football
-- Source: ESPN API standings endpoints
-- Created: 2025-01-08
-- Author: BSI Team

-- =============================================================================
-- COLLEGE BASEBALL STANDINGS TABLE
-- Conference standings synced from ESPN API
-- =============================================================================
CREATE TABLE IF NOT EXISTS college_baseball_standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_logo TEXT,
  conference TEXT NOT NULL,
  division TEXT,
  overall_wins INTEGER DEFAULT 0,
  overall_losses INTEGER DEFAULT 0,
  conference_wins INTEGER DEFAULT 0,
  conference_losses INTEGER DEFAULT 0,
  win_pct REAL,
  conference_win_pct REAL,
  streak TEXT,
  last_10 TEXT,
  home_record TEXT,
  away_record TEXT,
  runs_scored INTEGER DEFAULT 0,
  runs_allowed INTEGER DEFAULT 0,
  run_differential INTEGER DEFAULT 0,
  rpi REAL,
  games_back REAL,
  conference_rank INTEGER,
  season INTEGER NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(team_id, season)
);

-- =============================================================================
-- COLLEGE FOOTBALL STANDINGS TABLE
-- Conference standings synced from ESPN API
-- =============================================================================
CREATE TABLE IF NOT EXISTS college_football_standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_logo TEXT,
  conference TEXT NOT NULL,
  division TEXT,
  overall_wins INTEGER DEFAULT 0,
  overall_losses INTEGER DEFAULT 0,
  conference_wins INTEGER DEFAULT 0,
  conference_losses INTEGER DEFAULT 0,
  win_pct REAL,
  conference_win_pct REAL,
  streak TEXT,
  home_record TEXT,
  away_record TEXT,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  point_differential INTEGER DEFAULT 0,
  games_back REAL,
  conference_rank INTEGER,
  season INTEGER NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(team_id, season)
);

-- =============================================================================
-- INDEXES FOR STANDINGS QUERIES
-- =============================================================================

-- Baseball standings indexes
CREATE INDEX IF NOT EXISTS idx_baseball_standings_conference
  ON college_baseball_standings(conference, season);

CREATE INDEX IF NOT EXISTS idx_baseball_standings_season
  ON college_baseball_standings(season);

CREATE INDEX IF NOT EXISTS idx_baseball_standings_team_season
  ON college_baseball_standings(team_id, season);

CREATE INDEX IF NOT EXISTS idx_baseball_standings_conf_rank
  ON college_baseball_standings(conference, conference_rank, season);

-- Football standings indexes
CREATE INDEX IF NOT EXISTS idx_football_standings_conference
  ON college_football_standings(conference, season);

CREATE INDEX IF NOT EXISTS idx_football_standings_season
  ON college_football_standings(season);

CREATE INDEX IF NOT EXISTS idx_football_standings_team_season
  ON college_football_standings(team_id, season);

CREATE INDEX IF NOT EXISTS idx_football_standings_conf_rank
  ON college_football_standings(conference, conference_rank, season);

-- Note: Sync logging handled by KV namespace (BSI_CACHE) in the worker