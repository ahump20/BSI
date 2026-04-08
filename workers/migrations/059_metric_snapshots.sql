-- Migration 059: Weekly metric snapshots for movement tracking
--
-- Captures key metrics weekly so the system can show "biggest movers"
-- and week-over-week trends. Inserted by bsi-savant-compute on a weekly schedule.

CREATE TABLE IF NOT EXISTS cbb_metric_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_week TEXT NOT NULL,        -- ISO week: '2026-W13'
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT NOT NULL,
  team_id TEXT,
  conference TEXT,
  season INTEGER NOT NULL DEFAULT 2026,
  player_type TEXT NOT NULL,          -- 'batter' or 'pitcher'

  -- Batting metrics (null for pitchers)
  woba REAL,
  wrc_plus REAL,
  ops REAL,
  avg REAL,
  iso REAL,
  k_pct REAL,
  bb_pct REAL,

  -- Pitching metrics (null for batters)
  fip REAL,
  era_minus REAL,
  era REAL,
  whip REAL,
  k_9 REAL,
  bb_9 REAL,

  -- Common
  pa_or_ip REAL,                     -- PA for batters, IP for pitchers

  captured_at TEXT NOT NULL,

  UNIQUE(snapshot_week, player_id, player_type)
);

CREATE INDEX IF NOT EXISTS idx_snap_week ON cbb_metric_snapshots(snapshot_week, season);
CREATE INDEX IF NOT EXISTS idx_snap_player ON cbb_metric_snapshots(player_id, season);
CREATE INDEX IF NOT EXISTS idx_snap_type ON cbb_metric_snapshots(player_type, snapshot_week);
