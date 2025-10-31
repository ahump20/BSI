-- College Football Intelligence Engine - D1 Database Schema
-- Purpose: Store teams, games, and advanced analytics for CFB
-- Deploy: wrangler d1 execute blaze-cfb --file=schema.sql

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conference TEXT NOT NULL,
  division TEXT NOT NULL CHECK(division IN ('FBS', 'FCS', 'D2', 'D3')),
  recruiting_rank INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_teams_division ON teams(division);
CREATE INDEX IF NOT EXISTS idx_teams_conference ON teams(conference);
CREATE INDEX IF NOT EXISTS idx_teams_recruiting ON teams(recruiting_rank) WHERE recruiting_rank IS NOT NULL;

-- ============================================================================
-- GAMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('scheduled', 'live', 'final')),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  quarter INTEGER DEFAULT 0,
  time_remaining TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (home_team_id) REFERENCES teams(id),
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_scheduled ON games(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_games_home_team ON games(home_team_id);
CREATE INDEX IF NOT EXISTS idx_games_away_team ON games(away_team_id);
CREATE INDEX IF NOT EXISTS idx_games_status_scheduled ON games(status, scheduled_time);

-- ============================================================================
-- GAME ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  home_epa REAL,
  away_epa REAL,
  home_success_rate REAL,
  away_success_rate REAL,
  home_win_probability REAL,
  upset_probability REAL,
  FOREIGN KEY (game_id) REFERENCES games(id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_game ON game_analytics(game_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON game_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_upset ON game_analytics(upset_probability);
CREATE INDEX IF NOT EXISTS idx_analytics_game_timestamp ON game_analytics(game_id, timestamp DESC);

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample FCS teams
INSERT OR IGNORE INTO teams (id, name, conference, division, recruiting_rank) VALUES
  ('ndsu', 'North Dakota State', 'Missouri Valley', 'FCS', 85),
  ('montana', 'Montana', 'Big Sky', 'FCS', 102),
  ('jmu', 'James Madison', 'Sun Belt', 'FBS', 78),
  ('sdsu', 'South Dakota State', 'Missouri Valley', 'FCS', 95);

-- Insert sample Group of Five teams
INSERT OR IGNORE INTO teams (id, name, conference, division, recruiting_rank) VALUES
  ('toledo', 'Toledo', 'MAC', 'FBS', 110),
  ('coastal', 'Coastal Carolina', 'Sun Belt', 'FBS', 98),
  ('utsa', 'UTSA', 'AAC', 'FBS', 89),
  ('boise', 'Boise State', 'MWC', 'FBS', 72);

-- Insert sample Power Five teams for comparison
INSERT OR IGNORE INTO teams (id, name, conference, division, recruiting_rank) VALUES
  ('alabama', 'Alabama', 'SEC', 'FBS', 1),
  ('georgia', 'Georgia', 'SEC', 'FBS', 3),
  ('ohio-state', 'Ohio State', 'Big Ten', 'FBS', 2),
  ('michigan', 'Michigan', 'Big Ten', 'FBS', 8);

-- Insert sample games
INSERT OR IGNORE INTO games (id, home_team_id, away_team_id, scheduled_time, status, home_score, away_score, quarter, time_remaining) VALUES
  ('game1', 'ndsu', 'montana', '2025-10-31T18:00:00Z', 'live', 21, 14, 3, '8:45'),
  ('game2', 'toledo', 'coastal', '2025-10-31T19:00:00Z', 'live', 28, 31, 4, '2:13'),
  ('game3', 'utsa', 'boise', '2025-10-31T20:00:00Z', 'scheduled', 0, 0, 0, '15:00'),
  ('game4', 'alabama', 'georgia', '2025-10-31T19:30:00Z', 'live', 17, 24, 3, '11:22');

-- Insert sample analytics
INSERT OR IGNORE INTO game_analytics (game_id, timestamp, home_epa, away_epa, home_success_rate, away_success_rate, home_win_probability, upset_probability) VALUES
  ('game1', '2025-10-31T20:30:00Z', 0.15, -0.08, 0.52, 0.45, 0.68, 0.32),
  ('game2', '2025-10-31T21:00:00Z', -0.05, 0.18, 0.48, 0.55, 0.42, 0.58),
  ('game3', '2025-10-31T19:00:00Z', 0.22, 0.28, 0.58, 0.62, 0.35, 0.65),
  ('game4', '2025-10-31T20:45:00Z', -0.12, 0.25, 0.44, 0.61, 0.28, 0.72);

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Query to find high upset probability games
-- SELECT * FROM games g
-- JOIN game_analytics ga ON g.id = ga.game_id
-- WHERE ga.upset_probability > 0.5
-- AND g.status IN ('scheduled', 'live')
-- ORDER BY ga.upset_probability DESC;

-- Query to check recruiting impact
-- SELECT
--   t.recruiting_rank,
--   AVG(CASE WHEN g.home_team_id = t.id THEN ga.home_epa ELSE ga.away_epa END) as avg_epa
-- FROM teams t
-- JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
-- JOIN game_analytics ga ON g.id = ga.game_id
-- WHERE t.recruiting_rank IS NOT NULL
-- GROUP BY t.id
-- ORDER BY t.recruiting_rank ASC;
