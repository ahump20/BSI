-- Migration 053: Full-text search index using SQLite FTS5
-- Ported directly from root migrations/037 into workers/migrations/
-- where production D1 actually reads migrations.

CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  name,
  type,
  sport,
  url,
  tokenize = 'porter ascii'
);

CREATE TABLE IF NOT EXISTS search_index_meta (
  url TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
