-- Blaze Backyard Baseball - D1 Database Schema
-- High scores, player stats, and leaderboard data

-- Player profiles (tracks cumulative stats)
CREATE TABLE IF NOT EXISTS backyard_players (
  player_id TEXT PRIMARY KEY,
  player_name TEXT,
  high_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  total_hits INTEGER DEFAULT 0,
  total_home_runs INTEGER DEFAULT 0,
  total_singles INTEGER DEFAULT 0,
  total_doubles INTEGER DEFAULT 0,
  total_triples INTEGER DEFAULT 0,
  total_whiffs INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_play_time_seconds INTEGER DEFAULT 0,
  favorite_character_id TEXT,
  unlocked_characters TEXT DEFAULT '[]',
  unlocked_fields TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_backyard_players_high_score ON backyard_players(high_score DESC);
CREATE INDEX IF NOT EXISTS idx_backyard_players_total_home_runs ON backyard_players(total_home_runs DESC);
CREATE INDEX IF NOT EXISTS idx_backyard_players_longest_streak ON backyard_players(longest_streak DESC);

-- Individual game scores (for detailed leaderboard and history)
CREATE TABLE IF NOT EXISTS backyard_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  field_id TEXT,
  total_pitches INTEGER DEFAULT 0,
  total_hits INTEGER DEFAULT 0,
  singles INTEGER DEFAULT 0,
  doubles INTEGER DEFAULT 0,
  triples INTEGER DEFAULT 0,
  home_runs INTEGER DEFAULT 0,
  whiffs INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  multiplier_peak REAL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES backyard_players(player_id)
);

-- Index for recent scores and leaderboard
CREATE INDEX IF NOT EXISTS idx_backyard_scores_score ON backyard_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_backyard_scores_player_id ON backyard_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_backyard_scores_created_at ON backyard_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backyard_scores_character_id ON backyard_scores(character_id);

-- Daily/weekly/monthly leaderboard cache (populated by scheduled worker)
CREATE TABLE IF NOT EXISTS backyard_leaderboard_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'alltime'
  rank INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT,
  score INTEGER NOT NULL,
  character_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period, rank)
);

CREATE INDEX IF NOT EXISTS idx_backyard_leaderboard_period ON backyard_leaderboard_cache(period, rank);

-- Achievement tracking (future feature)
CREATE TABLE IF NOT EXISTS backyard_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, achievement_id),
  FOREIGN KEY (player_id) REFERENCES backyard_players(player_id)
);

CREATE INDEX IF NOT EXISTS idx_backyard_achievements_player ON backyard_achievements(player_id);
