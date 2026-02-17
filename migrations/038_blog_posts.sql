-- Blog post feed metadata table
-- Stores metadata for feature articles authored by Austin Humphrey.
-- Full article content lives in R2 at blog-posts/{slug}.md.
-- The blog-post-feed worker handler reads/writes this table.

CREATE TABLE IF NOT EXISTS blog_posts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  slug           TEXT    NOT NULL UNIQUE,
  title          TEXT    NOT NULL,
  subtitle       TEXT,
  description    TEXT,
  author         TEXT    NOT NULL DEFAULT 'Austin Humphrey',
  category       TEXT    NOT NULL DEFAULT 'editorial',
  tags           TEXT    DEFAULT '[]',        -- JSON array of tag strings
  featured       INTEGER NOT NULL DEFAULT 0,  -- 1 = featured hero article
  published      INTEGER NOT NULL DEFAULT 1,  -- 0 = draft
  published_at   TEXT    NOT NULL,            -- ISO date string (YYYY-MM-DD)
  read_time_mins INTEGER DEFAULT 5,
  word_count     INTEGER DEFAULT 0,
  source_context TEXT,                        -- e.g. "Full Sail MAN6224 | Sports Management Operations"
  created_at     TEXT    DEFAULT (datetime('now')),
  updated_at     TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bp_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_bp_category     ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_bp_featured     ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_bp_published    ON blog_posts(published);
