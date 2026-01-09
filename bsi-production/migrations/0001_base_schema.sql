-- Migration: 0001_base_schema.sql
-- Purpose: Create base transfer_portal and player_headshots tables
-- Created: 2025-01-08
-- Author: BSI Team

-- =============================================================================
-- COLLEGE BASEBALL TRANSFER PORTAL (BASE TABLE)
-- This is the foundation table that other migrations will extend
-- =============================================================================

CREATE TABLE IF NOT EXISTS transfer_portal (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  position TEXT NOT NULL,
  year TEXT,
  from_school TEXT NOT NULL,
  from_conference TEXT,
  to_school TEXT,
  to_conference TEXT,
  status TEXT DEFAULT 'in_portal',  -- in_portal, committed, withdrawn
  entry_date TEXT,
  commit_date TEXT,
  stars INTEGER,
  height TEXT,
  weight INTEGER,
  hometown TEXT,
  home_state TEXT,
  stats_era REAL,
  stats_wins INTEGER,
  stats_losses INTEGER,
  stats_saves INTEGER,
  stats_strikeouts INTEGER,
  stats_innings REAL,
  stats_avg REAL,
  stats_hr INTEGER,
  stats_rbi INTEGER,
  stats_runs INTEGER,
  stats_sb INTEGER,
  notes TEXT,
  source TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_portal_from_school ON transfer_portal(from_school);
CREATE INDEX IF NOT EXISTS idx_portal_to_school ON transfer_portal(to_school);
CREATE INDEX IF NOT EXISTS idx_portal_position ON transfer_portal(position);
CREATE INDEX IF NOT EXISTS idx_portal_status ON transfer_portal(status);
CREATE INDEX IF NOT EXISTS idx_portal_from_conference ON transfer_portal(from_conference);
CREATE INDEX IF NOT EXISTS idx_portal_to_conference ON transfer_portal(to_conference);
CREATE INDEX IF NOT EXISTS idx_portal_entry_date ON transfer_portal(entry_date);

-- =============================================================================
-- PLAYER HEADSHOTS TABLE
-- Stores scraped headshot URLs from official team rosters
-- =============================================================================

CREATE TABLE IF NOT EXISTS player_headshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  source_pattern TEXT,  -- sidearm, imgproxy, wordpress, etc.
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(player_name, school_name)
);

CREATE INDEX IF NOT EXISTS idx_headshots_player ON player_headshots(player_name);
CREATE INDEX IF NOT EXISTS idx_headshots_school ON player_headshots(school_name);

-- =============================================================================
-- DATA SYNC LOG (TRACKING TABLE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS data_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  last_sync TEXT,
  records_updated INTEGER,
  status TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO data_sync_log (source, entity_type, last_sync, records_updated, status)
VALUES ('migration-001', 'schema', datetime('now'), 0, 'success');
