-- BSI System Readiness Table
-- Gates system/scope level readiness before KV lifecycle checks.
-- Prevents cold starts from poisoning cache or serving uncertain data.

CREATE TABLE IF NOT EXISTS system_readiness (
  scope TEXT PRIMARY KEY,
  readiness_state TEXT NOT NULL DEFAULT 'initializing',
  last_transition_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT,
  snapshot_validated_at TEXT,
  live_ingestion_at TEXT,
  CHECK (readiness_state IN ('initializing', 'ready', 'degraded', 'unavailable'))
);

-- Seed system scope with cold-start state
INSERT INTO system_readiness (scope, readiness_state, last_transition_at, reason)
VALUES ('system', 'initializing', datetime('now'), 'Cold start - awaiting first validation')
ON CONFLICT(scope) DO NOTHING;

-- Index for fast scope lookups
CREATE INDEX IF NOT EXISTS idx_readiness_scope ON system_readiness(scope);

-- Index for finding ready/degraded scopes
CREATE INDEX IF NOT EXISTS idx_readiness_state ON system_readiness(readiness_state);
