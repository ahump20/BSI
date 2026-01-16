-- Blaze QB Challenge - D1 Database Schema

-- Players table
CREATE TABLE IF NOT EXISTS qb_players (
  player_id TEXT PRIMARY KEY,
  player_name TEXT,
  high_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  total_touchdowns INTEGER DEFAULT 0,
  total_perfect_throws INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_play_time_seconds INTEGER DEFAULT 0,
  favorite_qb_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual game scores
CREATE TABLE IF NOT EXISTS qb_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  qb_id TEXT NOT NULL,
  completions INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  touchdowns INTEGER DEFAULT 0,
  perfect_throws INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES qb_players(player_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qb_players_high_score ON qb_players(high_score DESC);
CREATE INDEX IF NOT EXISTS idx_qb_scores_player ON qb_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_qb_scores_created ON qb_scores(created_at DESC);
