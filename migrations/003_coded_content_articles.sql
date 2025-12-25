-- Migration 003: Coded Content Articles
-- Creates table for storing SportsDataIO Coded Content articles (previews, recaps)
-- Part of CFB AI content integration

-- Coded Content Articles table
CREATE TABLE IF NOT EXISTS coded_content_articles (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'sportsdataio-coded-content',
  provider_content_id TEXT NOT NULL,
  league TEXT NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body_html TEXT NOT NULL,
  published_at INTEGER,
  updated_at INTEGER,
  game_id TEXT,
  team_ids TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for listing articles by league, type, and date
CREATE INDEX IF NOT EXISTS idx_coded_content_league_type_published
  ON coded_content_articles(league, content_type, published_at DESC);

-- Index for finding articles by game
CREATE INDEX IF NOT EXISTS idx_coded_content_game_id
  ON coded_content_articles(game_id)
  WHERE game_id IS NOT NULL;

-- Index for ordering by update time
CREATE INDEX IF NOT EXISTS idx_coded_content_updated_at
  ON coded_content_articles(updated_at DESC);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_coded_content_slug
  ON coded_content_articles(slug);

-- Index for provider content ID (for upsert deduplication)
CREATE INDEX IF NOT EXISTS idx_coded_content_provider_id
  ON coded_content_articles(provider, provider_content_id);
