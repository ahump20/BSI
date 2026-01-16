-- Blaze Sports Intel - D1 Database Schema
-- For Scouting Intel Copilot with Semantic Search

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL,
  team_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  conference TEXT,
  division TEXT,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sport, team_id)
);

CREATE INDEX idx_teams_sport ON teams(sport);
CREATE INDEX idx_teams_key ON teams(key);
CREATE INDEX idx_teams_name ON teams(name);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL,
  game_id INTEGER,
  season INTEGER NOT NULL,
  season_type TEXT NOT NULL,
  week INTEGER,
  game_date DATETIME NOT NULL,
  game_time TEXT,
  status TEXT DEFAULT 'scheduled',
  home_team_id INTEGER NOT NULL,
  home_team_key TEXT NOT NULL,
  home_team_name TEXT NOT NULL,
  home_score INTEGER,
  away_team_id INTEGER NOT NULL,
  away_team_key TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  away_score INTEGER,
  stadium_name TEXT,
  winning_team_id INTEGER,
  stats JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (home_team_id) REFERENCES teams(id),
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

CREATE INDEX idx_games_sport ON games(sport);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_home_team ON games(home_team_id);
CREATE INDEX idx_games_away_team ON games(away_team_id);
CREATE INDEX idx_games_season ON games(season, season_type);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  sport TEXT NOT NULL,
  player_id INTEGER,
  name TEXT NOT NULL,
  position TEXT,
  jersey_number INTEGER,
  height TEXT,
  weight INTEGER,
  year TEXT,
  stats JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_sport ON players(sport);
CREATE INDEX idx_players_position ON players(position);

CREATE TABLE IF NOT EXISTS scouting_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  report_type TEXT NOT NULL,
  content TEXT,
  embedding_id TEXT,
  confidence_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
);

CREATE INDEX idx_reports_game ON scouting_reports(game_id);
CREATE INDEX idx_reports_embedding ON scouting_reports(embedding_id);
CREATE INDEX idx_reports_type ON scouting_reports(report_type);
