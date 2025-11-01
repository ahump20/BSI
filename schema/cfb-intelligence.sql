CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conference TEXT NOT NULL,
  division TEXT NOT NULL,
  recruiting_rank INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_teams_division ON teams(division);
CREATE INDEX IF NOT EXISTS idx_teams_conference ON teams(conference);

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
