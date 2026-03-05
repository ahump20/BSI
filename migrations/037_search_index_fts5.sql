-- Migration 037: Full-text search index using SQLite FTS5
-- Enables ranked, tokenized search across teams, players, pages, and articles.
-- Populated by the cron handler; queried by the search API handler.

-- FTS5 virtual table — stores searchable content with type/sport metadata.
-- Uses Porter stemmer for English morphological normalization ("running" matches "run").
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  name,
  type,
  sport,
  url,
  tokenize = 'porter ascii'
);

-- Tracking table for incremental population — prevents duplicate inserts.
CREATE TABLE IF NOT EXISTS search_index_meta (
  url TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
