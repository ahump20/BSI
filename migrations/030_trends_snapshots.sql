-- Migration 030: Historical standings snapshots for trend visualization
-- Supports per-team daily snapshots used by the college baseball trends charts.
-- Populated by ingest workers; queried by the /api/college-baseball/trends/:teamId endpoint.

-- ---------------------------------------------------------------------------
-- Standings snapshots — one row per team per day
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS standings_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  conference TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  conference_wins INTEGER DEFAULT 0,
  conference_losses INTEGER DEFAULT 0,
  rpi REAL,
  ranking INTEGER,
  run_differential INTEGER DEFAULT 0,
  snapshot_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(team_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_team ON standings_snapshots(team_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON standings_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_conference ON standings_snapshots(conference);
