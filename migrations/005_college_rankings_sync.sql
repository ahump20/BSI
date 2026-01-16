-- Migration: 005_college_rankings_sync.sql
-- Purpose: Ensure college_baseball_rankings and college_football_rankings tables
--          have all columns needed by bsi-college-data-sync worker
-- Created: 2025-01-08
-- Author: BSI Team

-- =============================================================================
-- COLLEGE BASEBALL RANKINGS TABLE
-- Ensure team_name and team_logo columns exist (may have been added in schema updates)
-- =============================================================================

-- Add team_name column if not exists (SQLite doesn't support IF NOT EXISTS for ALTER)
-- These statements will fail silently if columns already exist
-- Run them individually, ignore errors for existing columns

-- For college_baseball_rankings - add missing columns
ALTER TABLE college_baseball_rankings ADD COLUMN team_name TEXT;
ALTER TABLE college_baseball_rankings ADD COLUMN team_logo TEXT;
ALTER TABLE college_baseball_rankings ADD COLUMN record TEXT;

-- =============================================================================
-- COLLEGE FOOTBALL RANKINGS TABLE
-- This table was created in 0006_football_schema.sql but ensure record column exists
-- =============================================================================

ALTER TABLE college_football_rankings ADD COLUMN record TEXT;

-- =============================================================================
-- DATA SYNC LOG - Add college-data-sync entries
-- =============================================================================

INSERT OR IGNORE INTO data_sync_log (source, entity_type, status, created_at)
VALUES 
  ('espn', 'college_baseball_rankings', 'pending', datetime('now')),
  ('espn', 'college_football_rankings', 'pending', datetime('now'));

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_baseball_rankings_lookup 
  ON college_baseball_rankings(season, week, source);

CREATE INDEX IF NOT EXISTS idx_football_rankings_lookup 
  ON college_football_rankings(season, week, source);

CREATE INDEX IF NOT EXISTS idx_baseball_rankings_team_season 
  ON college_baseball_rankings(team_id, season);

CREATE INDEX IF NOT EXISTS idx_football_rankings_team_season 
  ON college_football_rankings(team_id, season);
