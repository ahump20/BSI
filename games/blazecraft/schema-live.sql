-- Blazecraft Live Session Schema
-- For real-time Claude Code agent events

-- Live sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  name TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_activity TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'active',  -- active, paused, ended
  metadata TEXT  -- JSON blob
);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_activity ON sessions(last_activity DESC);

-- Live agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',  -- idle, working, error, terminated
  region TEXT NOT NULL DEFAULT 'townhall',
  spawned_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_update TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT,  -- JSON blob
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agents_session ON agents(session_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Live events table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  agent_id TEXT,
  type TEXT NOT NULL,  -- spawn, task_start, task_complete, error, terminate, status
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  data TEXT,  -- JSON blob with files, region, message, etc.
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- City state per session
CREATE TABLE IF NOT EXISTS city_states (
  session_id TEXT PRIMARY KEY,
  state TEXT NOT NULL,  -- JSON blob of full CityState
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
