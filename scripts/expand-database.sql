-- Expanded Database Schema for BSI
-- This adds player and game stats tables as requested

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  external_player_id VARCHAR(100) UNIQUE NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200),
  position VARCHAR(50),
  jersey_number VARCHAR(10),
  height VARCHAR(20),
  weight INTEGER,
  birth_date DATE,
  birth_country VARCHAR(100),
  college VARCHAR(200),
  draft_year INTEGER,
  draft_round INTEGER,
  draft_pick INTEGER,
  status VARCHAR(50), -- active, injured, inactive
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game Stats table (for per-game statistics)
CREATE TABLE IF NOT EXISTS game_stats (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id),
  team_id INTEGER REFERENCES teams(id),
  stat_type VARCHAR(50) NOT NULL, -- batting, pitching, passing, rushing, etc
  stats_data JSONB NOT NULL, -- Flexible JSON for sport-specific stats
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, player_id, stat_type)
);

-- Season Stats table (aggregated season statistics)
CREATE TABLE IF NOT EXISTS season_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  team_id INTEGER REFERENCES teams(id),
  season INTEGER NOT NULL,
  sport VARCHAR(50) NOT NULL,
  stat_type VARCHAR(50) NOT NULL,
  games_played INTEGER DEFAULT 0,
  stats_data JSONB NOT NULL, -- Aggregated stats
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, season, stat_type)
);

-- Injuries table
CREATE TABLE IF NOT EXISTS injuries (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  team_id INTEGER REFERENCES teams(id),
  injury_date DATE NOT NULL,
  return_date DATE,
  status VARCHAR(50), -- day-to-day, questionable, out, IR
  injury_type VARCHAR(200),
  body_part VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standings table
CREATE TABLE IF NOT EXISTS standings (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  season INTEGER NOT NULL,
  division VARCHAR(100),
  conference VARCHAR(100),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,3),
  games_back DECIMAL(5,1),
  division_rank INTEGER,
  conference_rank INTEGER,
  playoff_seed INTEGER,
  streak VARCHAR(20),
  last_10 VARCHAR(20),
  home_record VARCHAR(20),
  away_record VARCHAR(20),
  division_record VARCHAR(20),
  conference_record VARCHAR(20),
  run_differential INTEGER,
  points_for INTEGER,
  points_against INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, season)
);

-- Live Scores table for real-time updates
CREATE TABLE IF NOT EXISTS live_scores (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  period VARCHAR(20), -- 1st, 2nd, 3rd, 4th, OT, Top 5th, etc
  time_remaining VARCHAR(20),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  possession VARCHAR(10), -- home/away for football/basketball
  bases_occupied VARCHAR(10), -- for baseball
  down_distance VARCHAR(20), -- for football
  last_play TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table to track our analytics
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  prediction_type VARCHAR(50), -- win_probability, over_under, spread
  home_prediction DECIMAL(10,4),
  away_prediction DECIMAL(10,4),
  confidence_score DECIMAL(5,2),
  algorithm VARCHAR(100), -- pythagorean, elo, ml_model_v1
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actual_result VARCHAR(20), -- home_win, away_win, push
  was_correct BOOLEAN
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_game_stats_game ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_player ON game_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_season_stats_player ON season_stats(player_id, season);
CREATE INDEX IF NOT EXISTS idx_injuries_player ON injuries(player_id);
CREATE INDEX IF NOT EXISTS idx_injuries_status ON injuries(status);
CREATE INDEX IF NOT EXISTS idx_standings_season ON standings(team_id, season);
CREATE INDEX IF NOT EXISTS idx_live_scores_game ON live_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_predictions_game ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at);

-- Create views for common queries
CREATE OR REPLACE VIEW current_standings AS
SELECT
  t.name as team_name,
  t.sport,
  s.*
FROM standings s
JOIN teams t ON s.team_id = t.id
WHERE s.season = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY s.win_percentage DESC;

CREATE OR REPLACE VIEW active_injuries AS
SELECT
  p.display_name as player_name,
  t.name as team_name,
  i.*
FROM injuries i
JOIN players p ON i.player_id = p.id
JOIN teams t ON i.team_id = t.id
WHERE i.return_date IS NULL OR i.return_date > CURRENT_DATE
ORDER BY i.injury_date DESC;

CREATE OR REPLACE VIEW recent_predictions AS
SELECT
  p.*,
  g.game_date,
  ht.name as home_team,
  at.name as away_team,
  g.home_score,
  g.away_score
FROM predictions p
JOIN games g ON p.game_id = g.id
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
WHERE p.created_at > CURRENT_DATE - INTERVAL '30 days'
ORDER BY p.created_at DESC;

-- Grant permissions (if needed)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Add comments for documentation
COMMENT ON TABLE players IS 'Stores player information across all sports';
COMMENT ON TABLE game_stats IS 'Per-game statistics for players';
COMMENT ON TABLE season_stats IS 'Aggregated season statistics for players';
COMMENT ON TABLE injuries IS 'Tracks player injuries and recovery status';
COMMENT ON TABLE standings IS 'Team standings by season';
COMMENT ON TABLE live_scores IS 'Real-time score updates during games';
COMMENT ON TABLE predictions IS 'Stores our predictions and tracks accuracy';

-- Success message
SELECT 'Database expansion complete! Added 7 new tables, 10+ indexes, and 3 views.' as status;