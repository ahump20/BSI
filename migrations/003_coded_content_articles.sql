-- Migration: 003_coded_content_articles
-- Description: Table for SportsDataIO Coded Content (AI-generated game previews and recaps)
-- Created: 2025-12-25

-- Coded Content Articles table for storing AI-generated game content
CREATE TABLE IF NOT EXISTS coded_content_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Article metadata
  article_type TEXT NOT NULL CHECK (article_type IN ('preview', 'recap', 'analysis')),
  game_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,

  -- Content
  summary TEXT,
  content TEXT NOT NULL,

  -- Team and game context
  home_team_id INTEGER,
  home_team_name TEXT,
  away_team_id INTEGER,
  away_team_name TEXT,
  game_date TEXT,

  -- Categorization
  sport TEXT NOT NULL DEFAULT 'CFB',
  conference TEXT,

  -- Timing
  published_at TEXT NOT NULL,
  expires_at TEXT,

  -- Source tracking
  source_url TEXT,
  source_article_id TEXT UNIQUE,

  -- Additional data (JSON)
  metadata TEXT,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_coded_content_sport ON coded_content_articles(sport);
CREATE INDEX IF NOT EXISTS idx_coded_content_type ON coded_content_articles(article_type);
CREATE INDEX IF NOT EXISTS idx_coded_content_game ON coded_content_articles(game_id);
CREATE INDEX IF NOT EXISTS idx_coded_content_published ON coded_content_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_coded_content_conference ON coded_content_articles(conference);
CREATE INDEX IF NOT EXISTS idx_coded_content_teams ON coded_content_articles(home_team_id, away_team_id);

-- Composite index for filtering by sport and type
CREATE INDEX IF NOT EXISTS idx_coded_content_sport_type ON coded_content_articles(sport, article_type, published_at DESC);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_coded_content_timestamp
  AFTER UPDATE ON coded_content_articles
  FOR EACH ROW
BEGIN
  UPDATE coded_content_articles SET updated_at = datetime('now') WHERE id = OLD.id;
END;
