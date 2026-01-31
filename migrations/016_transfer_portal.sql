-- Transfer Portal Pipeline Schema
-- Phase 1: Data integrity, freshness tracking, source attribution
-- Target DB: bsi-game-db (GAME_DB binding)

-- Drop legacy table if it exists with incompatible schema
DROP TABLE IF EXISTS portal_predictions;
DROP TABLE IF EXISTS portal_entries;

CREATE TABLE IF NOT EXISTS transfer_portal (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  sport TEXT NOT NULL CHECK(sport IN ('baseball', 'football')),
  position TEXT NOT NULL,
  class_year TEXT CHECK(class_year IN ('Fr', 'So', 'Jr', 'Sr', 'Gr')),
  from_team TEXT NOT NULL,
  to_team TEXT,
  from_conference TEXT,
  to_conference TEXT,
  status TEXT NOT NULL CHECK(status IN ('in_portal', 'committed', 'withdrawn', 'signed')),
  event_timestamp TEXT NOT NULL,        -- ISO 8601, America/Chicago
  portal_date TEXT NOT NULL,            -- Date entered portal
  commitment_date TEXT,                 -- Date committed (if applicable)

  -- Stats (JSON blobs, sport-specific)
  stats_json TEXT,                      -- Baseball or football stats

  -- Engagement & ranking
  engagement_score INTEGER,
  stars INTEGER CHECK(stars BETWEEN 1 AND 5),
  overall_rank INTEGER,

  -- Source attribution (spec requirement)
  source_url TEXT,
  source_id TEXT,
  source_name TEXT NOT NULL,

  -- Data quality flags (spec requirement)
  is_partial INTEGER NOT NULL DEFAULT 0,
  needs_review INTEGER NOT NULL DEFAULT 0,
  source_confidence REAL NOT NULL DEFAULT 1.0 CHECK(source_confidence BETWEEN 0 AND 1),
  verified INTEGER NOT NULL DEFAULT 0,

  -- R2 raw snapshot reference
  raw_snapshot_key TEXT,

  -- Freshness tracking
  last_verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tp_sport_status ON transfer_portal(sport, status);
CREATE INDEX IF NOT EXISTS idx_tp_sport_position ON transfer_portal(sport, position);
CREATE INDEX IF NOT EXISTS idx_tp_sport_conference ON transfer_portal(sport, from_conference);
CREATE INDEX IF NOT EXISTS idx_tp_updated ON transfer_portal(updated_at);
CREATE INDEX IF NOT EXISTS idx_tp_event_ts ON transfer_portal(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_tp_player ON transfer_portal(player_name);

-- Changelog for freshness feed / recent changes strip
CREATE TABLE IF NOT EXISTS transfer_portal_changelog (
  id TEXT PRIMARY KEY,
  portal_entry_id TEXT NOT NULL REFERENCES transfer_portal(id),
  change_type TEXT NOT NULL CHECK(change_type IN ('entered', 'committed', 'withdrawn', 'signed', 'updated')),
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  event_timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tpc_timestamp ON transfer_portal_changelog(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_tpc_entry ON transfer_portal_changelog(portal_entry_id);
