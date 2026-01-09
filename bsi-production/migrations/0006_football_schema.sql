-- Migration: 0006_football_schema.sql
-- Purpose: NCAA Football FBS infrastructure (132 teams, transfer portal, games, rankings)
-- Created: 2025-01-08
-- Author: BSI Team

-- =============================================================================
-- FOOTBALL TEAMS TABLE
-- All 132 FBS programs with ESPN IDs, colors, stadiums, coaches
-- =============================================================================
CREATE TABLE IF NOT EXISTS football_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  mascot TEXT,
  conference TEXT NOT NULL,
  division TEXT DEFAULT 'FBS',
  city TEXT,
  state TEXT,
  stadium TEXT,
  stadium_capacity INTEGER,
  head_coach TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  logo_url TEXT,
  espn_id INTEGER,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  conf_wins INTEGER DEFAULT 0,
  conf_losses INTEGER DEFAULT 0,
  ap_rank INTEGER,
  cfp_rank INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for football_teams
CREATE INDEX IF NOT EXISTS idx_football_teams_conference ON football_teams(conference);
CREATE INDEX IF NOT EXISTS idx_football_teams_slug ON football_teams(slug);
CREATE INDEX IF NOT EXISTS idx_football_teams_espn_id ON football_teams(espn_id);
CREATE INDEX IF NOT EXISTS idx_football_teams_ap_rank ON football_teams(ap_rank);
CREATE INDEX IF NOT EXISTS idx_football_teams_cfp_rank ON football_teams(cfp_rank);

-- =============================================================================
-- FOOTBALL TRANSFER PORTAL TABLE
-- Tracks all portal entries, commitments, and impact scores
-- =============================================================================
CREATE TABLE IF NOT EXISTS football_transfer_portal (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  position TEXT NOT NULL,
  year TEXT,
  from_school TEXT NOT NULL,
  from_conference TEXT,
  to_school TEXT,
  to_conference TEXT,
  status TEXT DEFAULT 'in_portal',
  entry_date TEXT,
  commit_date TEXT,
  stars INTEGER,
  height TEXT,
  weight INTEGER,
  hometown TEXT,
  home_state TEXT,
  stats_passing_yards INTEGER,
  stats_rushing_yards INTEGER,
  stats_receiving_yards INTEGER,
  stats_tackles INTEGER,
  stats_sacks REAL,
  stats_interceptions INTEGER,
  impact_score INTEGER,
  notes TEXT,
  source TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for football_transfer_portal
CREATE INDEX IF NOT EXISTS idx_ftp_from_school ON football_transfer_portal(from_school);
CREATE INDEX IF NOT EXISTS idx_ftp_to_school ON football_transfer_portal(to_school);
CREATE INDEX IF NOT EXISTS idx_ftp_position ON football_transfer_portal(position);
CREATE INDEX IF NOT EXISTS idx_ftp_status ON football_transfer_portal(status);
CREATE INDEX IF NOT EXISTS idx_ftp_impact_score ON football_transfer_portal(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_ftp_from_conference ON football_transfer_portal(from_conference);
CREATE INDEX IF NOT EXISTS idx_ftp_to_conference ON football_transfer_portal(to_conference);

-- =============================================================================
-- FOOTBALL GAMES TABLE
-- Schedule and results for all FBS games
-- =============================================================================
CREATE TABLE IF NOT EXISTS football_games (
  id TEXT PRIMARY KEY,
  season INTEGER NOT NULL DEFAULT 2025,
  week INTEGER,
  game_date TEXT NOT NULL,
  game_time TEXT,
  home_team_id TEXT NOT NULL,
  home_team_name TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled',
  quarter INTEGER,
  time_remaining TEXT,
  venue TEXT,
  venue_city TEXT,
  venue_state TEXT,
  conference_game INTEGER DEFAULT 0,
  neutral_site INTEGER DEFAULT 0,
  bowl_game TEXT,
  playoff_game INTEGER DEFAULT 0,
  tv_coverage TEXT,
  attendance INTEGER,
  spread REAL,
  over_under REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (home_team_id) REFERENCES football_teams(id),
  FOREIGN KEY (away_team_id) REFERENCES football_teams(id)
);

-- Indexes for football_games
CREATE INDEX IF NOT EXISTS idx_football_games_season ON football_games(season);
CREATE INDEX IF NOT EXISTS idx_football_games_week ON football_games(week);
CREATE INDEX IF NOT EXISTS idx_football_games_date ON football_games(game_date);
CREATE INDEX IF NOT EXISTS idx_football_games_home_team ON football_games(home_team_id);
CREATE INDEX IF NOT EXISTS idx_football_games_away_team ON football_games(away_team_id);
CREATE INDEX IF NOT EXISTS idx_football_games_status ON football_games(status);
CREATE INDEX IF NOT EXISTS idx_football_games_bowl ON football_games(bowl_game);

-- =============================================================================
-- COLLEGE FOOTBALL RANKINGS TABLE
-- AP Poll, CFP Rankings, Coaches Poll
-- =============================================================================
CREATE TABLE IF NOT EXISTS college_football_rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  team_name TEXT,
  team_logo TEXT,
  source TEXT NOT NULL,
  rank INTEGER,
  previous_rank INTEGER,
  week INTEGER,
  season INTEGER NOT NULL,
  points INTEGER,
  first_place_votes INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for college_football_rankings
CREATE INDEX IF NOT EXISTS idx_cfb_rankings_team ON college_football_rankings(team_id);
CREATE INDEX IF NOT EXISTS idx_cfb_rankings_source ON college_football_rankings(source);
CREATE INDEX IF NOT EXISTS idx_cfb_rankings_season_week ON college_football_rankings(season, week);
CREATE INDEX IF NOT EXISTS idx_cfb_rankings_rank ON college_football_rankings(rank);
