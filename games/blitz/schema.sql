-- Blaze Blitz Football - D1 Database Schema
-- High scores, player stats, and leaderboard data for arcade football

-- Player profiles for blitz (tracks cumulative stats)
CREATE TABLE IF NOT EXISTS blitz_players (
  player_id TEXT PRIMARY KEY,
  player_name TEXT,
  high_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_touchdowns INTEGER DEFAULT 0,
  total_yards INTEGER DEFAULT 0,
  total_first_downs INTEGER DEFAULT 0,
  total_big_plays INTEGER DEFAULT 0,
  total_turnovers INTEGER DEFAULT 0,
  total_sacks INTEGER DEFAULT 0,
  total_tackles INTEGER DEFAULT 0,
  total_stiff_arms INTEGER DEFAULT 0,
  total_jukes INTEGER DEFAULT 0,
  longest_play INTEGER DEFAULT 0,
  favorite_team_id TEXT,
  favorite_play_id TEXT,
  total_play_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_blitz_players_high_score ON blitz_players(high_score DESC);
CREATE INDEX IF NOT EXISTS idx_blitz_players_total_touchdowns ON blitz_players(total_touchdowns DESC);
CREATE INDEX IF NOT EXISTS idx_blitz_players_total_yards ON blitz_players(total_yards DESC);

-- Individual game scores (for detailed leaderboard and history)
CREATE TABLE IF NOT EXISTS blitz_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  team_id TEXT NOT NULL,
  yards_gained INTEGER DEFAULT 0,
  touchdowns INTEGER DEFAULT 0,
  first_downs INTEGER DEFAULT 0,
  big_plays INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  sacks_taken INTEGER DEFAULT 0,
  tackles_made INTEGER DEFAULT 0,
  stiff_arms INTEGER DEFAULT 0,
  jukes INTEGER DEFAULT 0,
  longest_play INTEGER DEFAULT 0,
  turbo_yards INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  result TEXT DEFAULT 'incomplete', -- 'touchdown', 'turnover', 'timeout', 'incomplete'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES blitz_players(player_id)
);

-- Index for recent scores and leaderboard
CREATE INDEX IF NOT EXISTS idx_blitz_scores_score ON blitz_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_blitz_scores_player_id ON blitz_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_blitz_scores_created_at ON blitz_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blitz_scores_team_id ON blitz_scores(team_id);

-- Daily/weekly/monthly leaderboard cache (populated by scheduled worker)
CREATE TABLE IF NOT EXISTS blitz_leaderboard_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'alltime'
  rank INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT,
  score INTEGER NOT NULL,
  team_id TEXT,
  touchdowns INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period, rank)
);

CREATE INDEX IF NOT EXISTS idx_blitz_leaderboard_period ON blitz_leaderboard_cache(period, rank);

-- Achievement tracking for blitz
CREATE TABLE IF NOT EXISTS blitz_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, achievement_id),
  FOREIGN KEY (player_id) REFERENCES blitz_players(player_id)
);

CREATE INDEX IF NOT EXISTS idx_blitz_achievements_player ON blitz_achievements(player_id);
