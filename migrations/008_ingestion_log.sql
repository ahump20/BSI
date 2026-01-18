-- Ingestion audit log for tracking data pipeline health
-- Records every ingestion attempt (success or failure) for forensics and monitoring

CREATE TABLE IF NOT EXISTS ingestion_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  record_count INTEGER,
  reason TEXT,
  source TEXT DEFAULT 'highlightly',
  timestamp TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index for querying by dataset
CREATE INDEX IF NOT EXISTS idx_ingestion_dataset ON ingestion_log(dataset_id);

-- Index for time-based queries (most recent failures)
CREATE INDEX IF NOT EXISTS idx_ingestion_timestamp ON ingestion_log(timestamp DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_ingestion_status ON ingestion_log(status);

-- Composite index for dashboard queries (dataset + recent failures)
CREATE INDEX IF NOT EXISTS idx_ingestion_dataset_status ON ingestion_log(dataset_id, status, timestamp DESC);
