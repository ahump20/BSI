-- Blazecraft D1 Schema
-- Stores replay metadata (actual replay files go in R2)

-- Replays table
CREATE TABLE IF NOT EXISTS replays (
  id TEXT PRIMARY KEY,
  title TEXT,
  map TEXT NOT NULL,
  agents TEXT NOT NULL,              -- JSON array of agent info
  duration INTEGER NOT NULL,         -- Total ticks
  uploaded_at TEXT NOT NULL,         -- ISO 8601 timestamp
  file_key TEXT NOT NULL,            -- R2 object key
  file_size INTEGER NOT NULL,        -- Bytes
  metadata TEXT,                     -- JSON blob for extensibility
  tags TEXT,                         -- JSON array of tags
  is_public INTEGER DEFAULT 1,       -- 1 = public, 0 = private
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_replays_uploaded ON replays(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_replays_map ON replays(map);
CREATE INDEX IF NOT EXISTS idx_replays_public ON replays(is_public);
CREATE INDEX IF NOT EXISTS idx_replays_views ON replays(view_count DESC);

-- Analysis results table (for caching agent trace analysis)
CREATE TABLE IF NOT EXISTS analysis_results (
  id TEXT PRIMARY KEY,
  replay_id TEXT NOT NULL REFERENCES replays(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,       -- 'intent_summary', 'decision_tree', etc.
  result TEXT NOT NULL,              -- JSON analysis result
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(replay_id, agent_id, analysis_type)
);

CREATE INDEX IF NOT EXISTS idx_analysis_replay ON analysis_results(replay_id);

-- Saved annotations table (user-added notes on replays)
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  replay_id TEXT NOT NULL REFERENCES replays(id) ON DELETE CASCADE,
  tick INTEGER NOT NULL,
  note TEXT NOT NULL,
  author TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_annotations_replay ON annotations(replay_id);
CREATE INDEX IF NOT EXISTS idx_annotations_tick ON annotations(replay_id, tick);
