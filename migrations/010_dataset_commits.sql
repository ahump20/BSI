-- Dataset Commit Boundaries
-- Tracks committed versions per dataset with LKG (Last Known Good) guarantees.
-- Partial ingestion failures do not cascade into global silence.

CREATE TABLE IF NOT EXISTS dataset_commits (
  dataset_id TEXT PRIMARY KEY,
  last_committed_version INTEGER NOT NULL DEFAULT 0,
  last_committed_at TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT NOT NULL,
  last_attempt_status TEXT NOT NULL CHECK (last_attempt_status IN ('success', 'failed', 'partial')),
  last_attempt_error TEXT,
  is_serving_lkg INTEGER NOT NULL DEFAULT 0,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for finding degraded datasets (serving LKG)
CREATE INDEX IF NOT EXISTS idx_dataset_commits_lkg ON dataset_commits(is_serving_lkg) WHERE is_serving_lkg = 1;

-- Index for monitoring consecutive failures
CREATE INDEX IF NOT EXISTS idx_dataset_commits_failures ON dataset_commits(consecutive_failures) WHERE consecutive_failures > 0;

-- Index for recent activity queries
CREATE INDEX IF NOT EXISTS idx_dataset_commits_updated ON dataset_commits(updated_at DESC);
