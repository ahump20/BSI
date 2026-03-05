-- Editorial pipeline metadata table
-- Stores metadata for daily AI-generated digests; content lives in R2.
-- Worker writes here after generating a digest; the list handler reads it.

CREATE TABLE IF NOT EXISTS editorials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  preview TEXT,
  teams TEXT,  -- comma-separated team names mentioned
  word_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_editorials_date ON editorials(date DESC);
