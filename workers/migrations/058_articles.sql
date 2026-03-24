-- Migration 058: Create articles table for CFB (and future sport) article storage
-- Referenced by: workers/handlers/cfb.ts (handleCFBArticle, handleCFBArticlesList)

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL DEFAULT 'college-football',
  article_type TEXT NOT NULL DEFAULT 'recap',
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT,
  home_team_name TEXT,
  away_team_name TEXT,
  game_date TEXT,
  conference TEXT,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_articles_sport_type ON articles(sport, article_type);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
