-- BSI Game Backend Database Schema
-- D1 Database: bsi-game-db
-- Run with: wrangler d1 execute bsi-game-db --file=schema.sql

-- ============================================
-- Users Table
-- Stores player accounts
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_played TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- Progress Table
-- Stores game progression, unlocks, and stats
-- ============================================
CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  unlocked_characters TEXT DEFAULT '[]',
  unlocked_stadiums TEXT DEFAULT '[]',
  coins INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  season_progress TEXT DEFAULT '{}'
);

-- ============================================
-- Matches Table
-- Records individual match history
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_type TEXT NOT NULL CHECK(opponent_type IN ('cpu', 'player')),
  user_score INTEGER NOT NULL,
  opponent_score INTEGER NOT NULL,
  stadium TEXT NOT NULL,
  played_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- Leaderboard Table
-- Stores high scores by category
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('wins', 'home_runs', 'season', 'total_score')),
  score INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, category)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_played_at ON matches(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_category_score ON leaderboard(category, score DESC);
CREATE INDEX IF NOT EXISTS idx_progress_total_wins ON progress(total_wins DESC);

-- ============================================
-- Seed Data (Optional)
-- Uncomment to add test data
-- ============================================
-- INSERT OR IGNORE INTO users (id, username) VALUES
--   ('test-user-001', 'TestPlayer1'),
--   ('test-user-002', 'TestPlayer2');

-- INSERT OR IGNORE INTO progress (user_id) VALUES
--   ('test-user-001'),
--   ('test-user-002');
