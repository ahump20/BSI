-- Blaze Hoops Shootout - D1 Database Schema

-- Players table
CREATE TABLE IF NOT EXISTS hoops_players (
  player_id TEXT PRIMARY KEY,
  player_name TEXT,
  high_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_shots_made INTEGER DEFAULT 0,
  total_shots_attempted INTEGER DEFAULT 0,
  total_swishes INTEGER DEFAULT 0,
  total_money_balls INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_play_time_seconds INTEGER DEFAULT 0,
  favorite_shooter_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual game scores
CREATE TABLE IF NOT EXISTS hoops_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  shooter_id TEXT NOT NULL,
  shots_made INTEGER DEFAULT 0,
  shots_attempted INTEGER DEFAULT 0,
  shooting_percentage INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  swishes INTEGER DEFAULT 0,
  money_balls_made INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES hoops_players(player_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hoops_players_high_score ON hoops_players(high_score DESC);
CREATE INDEX IF NOT EXISTS idx_hoops_scores_player ON hoops_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_hoops_scores_created ON hoops_scores(created_at DESC);
