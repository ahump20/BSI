-- BSI Dataset Schema Versioning
-- Tracks schema definitions and validates data shape at ingestion and read time.

-- Schema definitions table
CREATE TABLE IF NOT EXISTS dataset_schema (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id TEXT NOT NULL,
  schema_version TEXT NOT NULL,        -- semver: 1.0.0
  schema_hash TEXT NOT NULL,           -- SHA-256 truncated to 16 chars
  required_fields TEXT NOT NULL,       -- JSON array of field names
  invariants TEXT,                     -- JSON object with validation rules
  minimum_renderable_count INTEGER NOT NULL DEFAULT 1,
  sunset_at TEXT,                      -- ISO timestamp for deprecation
  created_at TEXT DEFAULT (datetime('now')),
  is_active INTEGER DEFAULT 1,
  UNIQUE(dataset_id, schema_version)
);

CREATE INDEX IF NOT EXISTS idx_schema_active ON dataset_schema(dataset_id, is_active);
CREATE INDEX IF NOT EXISTS idx_schema_hash ON dataset_schema(schema_hash);

-- Extend dataset_commits with schema tracking
ALTER TABLE dataset_commits ADD COLUMN schema_version TEXT;
ALTER TABLE dataset_commits ADD COLUMN schema_hash TEXT;

-- Extend dataset_current_version with schema tracking
ALTER TABLE dataset_current_version ADD COLUMN current_schema_version TEXT;
ALTER TABLE dataset_current_version ADD COLUMN last_committed_schema_hash TEXT;
