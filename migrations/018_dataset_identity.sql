-- BSI Dataset Identity Hardening
-- Canonical typed identity backing every datasetId string.
-- UNIQUE constraint on the identity tuple is the hard collision guard.

CREATE TABLE IF NOT EXISTS dataset_identity (
  dataset_id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  competition_level TEXT NOT NULL,
  season TEXT NOT NULL,
  dataset_type TEXT NOT NULL,
  qualifier TEXT,
  legacy_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_write_at TEXT NOT NULL,
  collision_attempts INTEGER NOT NULL DEFAULT 0,
  UNIQUE(sport, competition_level, season, dataset_type, qualifier)
);

-- Add schema columns to dataset_commits if not present (idempotent via IF NOT EXISTS on index)
-- These were added in 013 but ensure forward compat
CREATE INDEX IF NOT EXISTS idx_identity_sport_season ON dataset_identity(sport, season);
CREATE INDEX IF NOT EXISTS idx_identity_legacy ON dataset_identity(legacy_id);

-- Add schema tracking columns to dataset_current_version if missing
-- (SQLite ALTER TABLE ADD COLUMN is idempotent-safe: errors silently if column exists)
-- These columns may already exist from 013_dataset_schema.sql, but we reference them in code.
