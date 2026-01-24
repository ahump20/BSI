-- BSI Dataset Commit Boundary System
-- Versioned KV with atomic promotion and Last Known Good (LKG) fallback.
-- Prevents partial ingestion failures from cascading into global silence.

-- Commit records per dataset
CREATE TABLE IF NOT EXISTS dataset_commits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  record_count INTEGER NOT NULL,
  previous_record_count INTEGER,
  validation_status TEXT NOT NULL,
  validation_errors TEXT,
  ingested_at TEXT NOT NULL,
  committed_at TEXT,
  kv_versioned_key TEXT NOT NULL,
  source TEXT DEFAULT 'highlightly',
  CHECK (status IN ('pending', 'committed', 'rolled_back', 'superseded')),
  CHECK (validation_status IN ('valid', 'invalid', 'partial', 'empty')),
  UNIQUE(dataset_id, version)
);

-- Current version pointer (fast reads)
CREATE TABLE IF NOT EXISTS dataset_current_version (
  dataset_id TEXT PRIMARY KEY,
  current_version INTEGER NOT NULL,
  last_committed_version INTEGER,
  last_committed_at TEXT,
  is_serving_lkg INTEGER DEFAULT 0,
  lkg_reason TEXT
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_commits_dataset_version ON dataset_commits(dataset_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_commits_status ON dataset_commits(status);
CREATE INDEX IF NOT EXISTS idx_commits_sport ON dataset_commits(sport);
CREATE INDEX IF NOT EXISTS idx_current_version_lkg ON dataset_current_version(is_serving_lkg);
