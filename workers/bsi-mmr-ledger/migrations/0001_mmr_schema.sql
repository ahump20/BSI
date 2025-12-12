-- BSI MMR Ledger Schema
-- Version: 1.0.0
-- Append-only Merkle Mountain Range for tamper-evident audit logs

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────────────────────
-- Core MMR Structure
-- ─────────────────────────────────────────────────────────────

-- Internal MMR tree nodes (leaves and internal nodes)
CREATE TABLE IF NOT EXISTS mmr_nodes (
  node_id   INTEGER PRIMARY KEY,  -- Explicit ID for predictable batch inserts
  height    INTEGER NOT NULL CHECK (height >= 0),
  hash      TEXT NOT NULL CHECK (length(hash) = 64),  -- SHA-256 hex
  left_id   INTEGER REFERENCES mmr_nodes(node_id),
  right_id  INTEGER REFERENCES mmr_nodes(node_id),
  parent_id INTEGER REFERENCES mmr_nodes(node_id),
  
  -- Constraints for structural integrity
  CHECK (
    (height = 0 AND left_id IS NULL AND right_id IS NULL) OR
    (height > 0 AND left_id IS NOT NULL AND right_id IS NOT NULL)
  )
);

-- Event payloads with timestamps
CREATE TABLE IF NOT EXISTS mmr_leaves (
  leaf_index   INTEGER PRIMARY KEY,  -- 1-indexed for human readability
  node_id      INTEGER NOT NULL UNIQUE REFERENCES mmr_nodes(node_id),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at   INTEGER NOT NULL CHECK (created_at > 0)
);

-- Singleton state row (id is always 1)
CREATE TABLE IF NOT EXISTS mmr_state (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  leaf_count INTEGER NOT NULL CHECK (leaf_count >= 0),
  peaks_json TEXT NOT NULL CHECK (json_valid(peaks_json)),
  root_hash  TEXT NOT NULL CHECK (length(root_hash) = 64),
  updated_at INTEGER NOT NULL CHECK (updated_at > 0)
);

-- Historical snapshots for stable proofs
CREATE TABLE IF NOT EXISTS mmr_versions (
  version    INTEGER PRIMARY KEY CHECK (version > 0),
  root_hash  TEXT NOT NULL CHECK (length(root_hash) = 64),
  peaks_json TEXT NOT NULL CHECK (json_valid(peaks_json)),
  created_at INTEGER NOT NULL CHECK (created_at > 0)
);

-- ─────────────────────────────────────────────────────────────
-- Indexes for Query Performance
-- ─────────────────────────────────────────────────────────────

-- Fast parent lookups during proof construction
CREATE INDEX IF NOT EXISTS idx_mmr_nodes_parent 
  ON mmr_nodes(parent_id) WHERE parent_id IS NOT NULL;

-- Fast hash lookups (for integrity checks)
CREATE INDEX IF NOT EXISTS idx_mmr_nodes_hash 
  ON mmr_nodes(hash);

-- Fast leaf lookups by node
CREATE INDEX IF NOT EXISTS idx_mmr_leaves_node 
  ON mmr_leaves(node_id);

-- Time-based queries on events
CREATE INDEX IF NOT EXISTS idx_mmr_leaves_created 
  ON mmr_leaves(created_at);

-- Actor filtering (JSON extraction)
CREATE INDEX IF NOT EXISTS idx_mmr_leaves_actor 
  ON mmr_leaves(json_extract(payload_json, '$.actor'));

-- Event type filtering
CREATE INDEX IF NOT EXISTS idx_mmr_leaves_type 
  ON mmr_leaves(json_extract(payload_json, '$.type'));

-- Version lookups (usually latest, but also historical)
CREATE INDEX IF NOT EXISTS idx_mmr_versions_created 
  ON mmr_versions(created_at DESC);
