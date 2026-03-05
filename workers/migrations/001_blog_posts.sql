-- Migration: 001_blog_posts
-- Creates the blog_posts table for the /blog-post-feed route.
-- Run: npx wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/001_blog_posts.sql

CREATE TABLE IF NOT EXISTS blog_posts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  slug           TEXT    NOT NULL UNIQUE,
  title          TEXT    NOT NULL,
  subtitle       TEXT,
  description    TEXT,
  author         TEXT    NOT NULL DEFAULT 'Austin Humphrey',
  category       TEXT    NOT NULL DEFAULT 'editorial',
  tags           TEXT    DEFAULT '[]',
  featured       INTEGER NOT NULL DEFAULT 0,
  published      INTEGER NOT NULL DEFAULT 1,
  published_at   TEXT    NOT NULL,
  read_time_mins INTEGER DEFAULT 5,
  word_count     INTEGER DEFAULT 0,
  source_context TEXT,
  created_at     TEXT    DEFAULT (datetime('now')),
  updated_at     TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bp_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_bp_category     ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_bp_featured     ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_bp_published    ON blog_posts(published);
