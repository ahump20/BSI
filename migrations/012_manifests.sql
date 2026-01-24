-- Asset manifest tracking for R2/D1 reconciliation
-- Used by bsi-ingest worker catalog functionality

CREATE TABLE IF NOT EXISTS manifests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  meta TEXT,
  size_bytes INTEGER NOT NULL,
  content_type TEXT,
  last_verified_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_manifests_checksum ON manifests(checksum);
CREATE INDEX IF NOT EXISTS idx_manifests_verified ON manifests(last_verified_at);
