-- Migration 044: League context table for D1-derived baselines
-- Stores daily-computed league-wide averages that feed wRC+, OPS+, ERA-, FIP.
-- Populated by bsi-cbb-analytics cron; synced to cbb-api-db for public API.
-- Run: wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/044_cbb_league_context.sql

CREATE TABLE IF NOT EXISTS cbb_league_context (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season INTEGER NOT NULL,
  computed_at TEXT NOT NULL,
  woba REAL NOT NULL,
  obp REAL NOT NULL,
  avg REAL NOT NULL,
  slg REAL NOT NULL,
  era REAL NOT NULL,
  runs_per_pa REAL NOT NULL,
  woba_scale REAL NOT NULL,
  fip_constant REAL NOT NULL,
  hr_fb_rate REAL,
  sample_batting INTEGER DEFAULT 0,
  sample_pitching INTEGER DEFAULT 0,
  UNIQUE(season)
);
