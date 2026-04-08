-- Migration 060: Add slug and category columns to editorials table
-- The original table (migration 031) had date as UNIQUE which doesn't work
-- for multiple articles per day. Drop and recreate with slug as unique key.

DROP TABLE IF EXISTS editorials;

CREATE TABLE editorials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  date       TEXT NOT NULL,
  title      TEXT NOT NULL,
  preview    TEXT,
  teams      TEXT,
  word_count INTEGER DEFAULT 0,
  category   TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_editorials_date ON editorials(date DESC);
CREATE INDEX IF NOT EXISTS idx_editorials_slug ON editorials(slug);
CREATE INDEX IF NOT EXISTS idx_editorials_category ON editorials(category, date DESC);
