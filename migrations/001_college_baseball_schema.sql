-- College Baseball Live Data Schema
-- D1 Database: bsi-historical-db
-- Created: 2025-11-29

-- Teams table - core team data
CREATE TABLE IF NOT EXISTS college_baseball_teams (
  id TEXT PRIMARY KEY,
  espn_id TEXT,
  name TEXT NOT NULL,
  mascot TEXT,
  abbreviation TEXT,
  conference TEXT NOT NULL,
  division TEXT,
  city TEXT,
  state TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  logo_url TEXT,
  stadium_name TEXT,
  stadium_capacity INTEGER,
  stadium_surface TEXT,
  coach_name TEXT,
  coach_years INTEGER,
  coach_record TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Rankings table - preseason and weekly rankings
CREATE TABLE IF NOT EXISTS college_baseball_rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  source TEXT NOT NULL, -- 'd1baseball', 'baseball_america', 'coaches_poll', 'rpi'
  rank INTEGER,
  previous_rank INTEGER,
  week INTEGER, -- 0 for preseason
  season INTEGER NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id)
);

-- Players table - roster with stats
CREATE TABLE IF NOT EXISTS college_baseball_players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  name TEXT NOT NULL,
  jersey_number TEXT,
  position TEXT,
  class_year TEXT, -- Fr, So, Jr, Sr, Gr
  height TEXT,
  weight INTEGER,
  bats TEXT,
  throws TEXT,
  hometown TEXT,
  high_school TEXT,
  is_transfer INTEGER DEFAULT 0,
  transfer_from TEXT,
  -- Batting stats
  games INTEGER DEFAULT 0,
  at_bats INTEGER DEFAULT 0,
  runs INTEGER DEFAULT 0,
  hits INTEGER DEFAULT 0,
  doubles INTEGER DEFAULT 0,
  triples INTEGER DEFAULT 0,
  home_runs INTEGER DEFAULT 0,
  rbi INTEGER DEFAULT 0,
  walks INTEGER DEFAULT 0,
  strikeouts INTEGER DEFAULT 0,
  stolen_bases INTEGER DEFAULT 0,
  batting_avg REAL DEFAULT 0,
  on_base_pct REAL DEFAULT 0,
  slugging_pct REAL DEFAULT 0,
  -- Pitching stats (if pitcher)
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  era REAL DEFAULT 0,
  games_started INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  innings_pitched REAL DEFAULT 0,
  hits_allowed INTEGER DEFAULT 0,
  earned_runs INTEGER DEFAULT 0,
  walks_allowed INTEGER DEFAULT 0,
  strikeouts_pitched INTEGER DEFAULT 0,
  whip REAL DEFAULT 0,
  -- Draft info
  is_draft_eligible INTEGER DEFAULT 0,
  mlb_pipeline_rank INTEGER,
  draft_projection TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id)
);

-- Team records table - overall and conference records
CREATE TABLE IF NOT EXISTS college_baseball_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  overall_wins INTEGER DEFAULT 0,
  overall_losses INTEGER DEFAULT 0,
  conference_wins INTEGER DEFAULT 0,
  conference_losses INTEGER DEFAULT 0,
  home_wins INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  neutral_wins INTEGER DEFAULT 0,
  neutral_losses INTEGER DEFAULT 0,
  streak_type TEXT, -- 'W' or 'L'
  streak_count INTEGER DEFAULT 0,
  last_10 TEXT,
  rpi REAL,
  sos REAL,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id),
  UNIQUE(team_id, season)
);

-- Program history table
CREATE TABLE IF NOT EXISTS college_baseball_history (
  team_id TEXT PRIMARY KEY,
  cws_appearances INTEGER DEFAULT 0,
  last_cws_year INTEGER,
  national_titles INTEGER DEFAULT 0,
  last_national_title INTEGER,
  conference_titles INTEGER DEFAULT 0,
  last_conference_title INTEGER,
  conference_tournament_titles INTEGER DEFAULT 0,
  regional_appearances INTEGER DEFAULT 0,
  super_regional_appearances INTEGER DEFAULT 0,
  all_time_wins INTEGER DEFAULT 0,
  all_time_losses INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id)
);

-- Schedule/Games table
CREATE TABLE IF NOT EXISTS college_baseball_games (
  id TEXT PRIMARY KEY,
  espn_id TEXT,
  date TEXT NOT NULL,
  time TEXT,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled', -- scheduled, live, final, postponed, canceled
  inning INTEGER,
  inning_half TEXT, -- 'top' or 'bottom'
  venue TEXT,
  tv_broadcast TEXT,
  attendance INTEGER,
  is_conference_game INTEGER DEFAULT 0,
  is_tournament_game INTEGER DEFAULT 0,
  tournament_name TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (home_team_id) REFERENCES college_baseball_teams(id),
  FOREIGN KEY (away_team_id) REFERENCES college_baseball_teams(id)
);

-- Team outlooks/analysis (preseason projections)
CREATE TABLE IF NOT EXISTS college_baseball_outlooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  outlook_text TEXT,
  projected_finish TEXT,
  schedule_strength TEXT,
  key_games TEXT, -- JSON array
  strengths TEXT,
  weaknesses TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id),
  UNIQUE(team_id, season)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rankings_team_season ON college_baseball_rankings(team_id, season);
CREATE INDEX IF NOT EXISTS idx_rankings_source_week ON college_baseball_rankings(source, week, season);
CREATE INDEX IF NOT EXISTS idx_players_team ON college_baseball_players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON college_baseball_players(position);
CREATE INDEX IF NOT EXISTS idx_records_team_season ON college_baseball_records(team_id, season);
CREATE INDEX IF NOT EXISTS idx_games_date ON college_baseball_games(date);
CREATE INDEX IF NOT EXISTS idx_games_teams ON college_baseball_games(home_team_id, away_team_id);

-- Data freshness tracking
CREATE TABLE IF NOT EXISTS data_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'teams', 'players', 'rankings', 'games', 'records'
  last_sync TEXT,
  records_updated INTEGER,
  status TEXT, -- 'success', 'partial', 'failed'
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
