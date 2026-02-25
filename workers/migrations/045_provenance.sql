-- 045_provenance.sql
-- Data provenance and rights enforcement layer.
-- Tracks which upstream sources contributed to each entity,
-- stores raw payloads in R2 with SHA-256 keys, and enforces
-- redistribution rights at the API level.

-- Upstream data sources (ESPN, Highlightly, BSI-internal, etc.)
CREATE TABLE IF NOT EXISTS source_system (
  source_system_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                    -- licensed | public | internal
  license_scope TEXT NOT NULL DEFAULT '', -- text description of license domain
  allowed_redistribution INTEGER NOT NULL DEFAULT 0,
  refresh_sla TEXT,
  contract_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Which source systems contributed to each entity
CREATE TABLE IF NOT EXISTS entity_source (
  entity_source_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,             -- game | boxscore | player_stats | standings | rankings
  entity_id TEXT NOT NULL,
  source_system_id TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(entity_type, entity_id, source_system_id),
  FOREIGN KEY (source_system_id) REFERENCES source_system(source_system_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_source_entity ON entity_source(entity_type, entity_id);

-- Raw payload ledger (R2 object references)
CREATE TABLE IF NOT EXISTS source_payload (
  payload_id TEXT PRIMARY KEY,
  source_system_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  parsed_at TEXT,
  parse_status TEXT NOT NULL DEFAULT 'received', -- received | parsed | error
  parse_errors_json TEXT,
  FOREIGN KEY (source_system_id) REFERENCES source_system(source_system_id)
);

CREATE INDEX IF NOT EXISTS idx_payload_entity ON source_payload(entity_type, entity_id, received_at);

-- Correction ledger (append-only — tracks every change to canonical data)
CREATE TABLE IF NOT EXISTS correction_ledger (
  correction_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  corrected_at TEXT NOT NULL,
  corrected_by TEXT NOT NULL,            -- worker name or admin
  reason TEXT,
  source_system_id TEXT,
  FOREIGN KEY (source_system_id) REFERENCES source_system(source_system_id)
);

CREATE INDEX IF NOT EXISTS idx_corrections_entity ON correction_ledger(entity_type, entity_id, corrected_at);

-- Seed initial source systems
INSERT OR IGNORE INTO source_system (source_system_id, name, type, license_scope, allowed_redistribution)
VALUES
  ('espn', 'ESPN Site API', 'public', 'Public site API — no commercial redistribution', 0),
  ('highlightly', 'Highlightly Pro (RapidAPI)', 'licensed', 'RapidAPI Pro license — redistribution per terms', 0),
  ('sportsdataio', 'SportsDataIO', 'licensed', 'Ocp-Apim subscription — redistribution per contract', 0),
  ('bsi-internal', 'BSI Internal (derived)', 'internal', 'BSI-computed metrics and analytics', 1);
