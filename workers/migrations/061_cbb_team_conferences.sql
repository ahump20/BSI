-- Migration 061: College Baseball team → conference mapping table
--
-- Replaces the hardcoded TEAM_CONFERENCE_MAP in bsi-cbb-analytics with a
-- D1-backed table that can be seeded and updated without a worker redeploy.
--
-- Seed: the worker falls back to the hardcoded 244-entry map on first run.
-- To expand coverage to all ~330 D1 programs, INSERT rows here and run:
--   wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/061_cbb_team_conferences.sql
--
-- Run: wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/061_cbb_team_conferences.sql

CREATE TABLE IF NOT EXISTS cbb_team_conferences (
  team_id   TEXT NOT NULL,          -- ESPN college baseball team ID
  conference TEXT NOT NULL,          -- Conference name (matches cbb_batting_advanced.conference)
  team_name  TEXT,                   -- Human-readable team name (optional, for debugging)
  season     INTEGER NOT NULL DEFAULT 0,  -- 0 = all seasons; use specific year for overrides
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

  PRIMARY KEY (team_id, season)
);

CREATE INDEX IF NOT EXISTS idx_cbb_team_conf_conf ON cbb_team_conferences(conference);
