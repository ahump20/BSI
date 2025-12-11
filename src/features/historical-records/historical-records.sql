-- BSI Historical Records Database Schema
-- Database: bsi-historical-db
-- Purpose: Store franchise records, single-season records, postseason history, key eras, all-time players

-- =============================================================================
-- TEAMS - Master table for all teams across leagues
-- =============================================================================
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  league TEXT NOT NULL, -- 'MLB', 'NFL', 'NBA', 'NCAA_FB', 'NCAA_BB'
  name TEXT NOT NULL,
  abbreviation TEXT,
  location TEXT,
  conference TEXT, -- For college teams
  division TEXT,
  founded_year INTEGER,
  venue TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_teams_league ON teams(league);
CREATE INDEX idx_teams_conference ON teams(conference);

-- =============================================================================
-- FRANCHISE RECORDS - All-time franchise records
-- =============================================================================
CREATE TABLE IF NOT EXISTS franchise_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  category TEXT NOT NULL, -- 'offense', 'defense', 'pitching', 'batting', 'passing', etc.
  record_type TEXT NOT NULL, -- 'career', 'single_game', 'single_season'
  stat_name TEXT NOT NULL, -- 'home_runs', 'passing_yards', 'strikeouts', etc.
  stat_value REAL NOT NULL,
  holder_name TEXT NOT NULL,
  holder_years TEXT, -- '1920-1935' or '2024'
  achieved_date TEXT, -- ISO date if single game/season
  notes TEXT,
  source_url TEXT NOT NULL, -- Citation requirement
  source_name TEXT NOT NULL, -- 'Baseball Reference', 'ESPN', etc.
  verified_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_franchise_records_team ON franchise_records(team_id);
CREATE INDEX idx_franchise_records_category ON franchise_records(category);
CREATE INDEX idx_franchise_records_type ON franchise_records(record_type);

-- =============================================================================
-- SINGLE SEASON RECORDS - Best individual seasons in franchise history
-- =============================================================================
CREATE TABLE IF NOT EXISTS season_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  category TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  stat_value REAL NOT NULL,
  player_name TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  rank_in_category INTEGER DEFAULT 1, -- Allow top 5/10 lists
  notes TEXT,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_season_records_team ON season_records(team_id);
CREATE INDEX idx_season_records_year ON season_records(season_year);
CREATE INDEX idx_season_records_category ON season_records(category);

-- =============================================================================
-- POSTSEASON HISTORY - Championships, playoff appearances, notable runs
-- =============================================================================
CREATE TABLE IF NOT EXISTS postseason_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  season_year INTEGER NOT NULL,
  achievement_type TEXT NOT NULL, -- 'championship', 'conference_title', 'division_title', 'playoff_appearance', 'bowl_game', 'cws_appearance'
  achievement_name TEXT, -- 'World Series', 'Super Bowl LVIII', 'College World Series', etc.
  result TEXT, -- 'won', 'lost', 'semifinal', 'quarterfinal'
  opponent TEXT,
  final_score TEXT, -- '4-2' for series, '31-24' for single games
  mvp_name TEXT,
  notable_moments TEXT,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_postseason_team ON postseason_history(team_id);
CREATE INDEX idx_postseason_year ON postseason_history(season_year);
CREATE INDEX idx_postseason_type ON postseason_history(achievement_type);

-- =============================================================================
-- KEY ERAS - Significant periods in franchise history
-- =============================================================================
CREATE TABLE IF NOT EXISTS key_eras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  era_name TEXT NOT NULL, -- 'The Curse of the Bambino', 'The Dynasty Years', 'The Mack Brown Era'
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  head_coach TEXT,
  overall_record TEXT, -- '98-45'
  championships INTEGER DEFAULT 0,
  notable_players TEXT, -- JSON array or comma-separated
  summary TEXT NOT NULL,
  significance TEXT, -- Why this era matters
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_key_eras_team ON key_eras(team_id);
CREATE INDEX idx_key_eras_years ON key_eras(start_year, end_year);

-- =============================================================================
-- ALL-TIME PLAYERS - Greatest players in franchise history
-- =============================================================================
CREATE TABLE IF NOT EXISTS all_time_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  player_name TEXT NOT NULL,
  position TEXT NOT NULL,
  years_with_team TEXT NOT NULL, -- '1996-2014' or '2020-present'
  jersey_number INTEGER,
  
  -- Career stats (flexible JSON for different sports)
  career_stats TEXT, -- JSON object with sport-specific stats
  
  -- Honors
  hall_of_fame INTEGER DEFAULT 0, -- 0 = no, 1 = yes
  hof_year INTEGER,
  retired_number INTEGER DEFAULT 0,
  all_star_selections INTEGER DEFAULT 0,
  mvp_awards INTEGER DEFAULT 0,
  
  -- Rankings
  franchise_rank INTEGER, -- 1 = greatest of all time
  rank_category TEXT, -- 'overall', 'pitchers', 'hitters', 'quarterbacks', etc.
  
  -- Bio
  birthplace TEXT,
  college TEXT,
  draft_info TEXT, -- 'Round 1, Pick 15, 2005 NFL Draft'
  legacy_summary TEXT,
  
  -- Sources
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  image_url TEXT,
  
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_all_time_players_team ON all_time_players(team_id);
CREATE INDEX idx_all_time_players_position ON all_time_players(position);
CREATE INDEX idx_all_time_players_rank ON all_time_players(franchise_rank);

-- =============================================================================
-- SOURCES - Track all citation sources
-- =============================================================================
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- 'Baseball Reference', 'ESPN', 'Pro Football Reference'
  base_url TEXT NOT NULL,
  reliability_score INTEGER DEFAULT 5, -- 1-5 scale
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Seed common sources
INSERT OR IGNORE INTO sources (name, base_url, reliability_score) VALUES
  ('Baseball Reference', 'https://www.baseball-reference.com', 5),
  ('Pro Football Reference', 'https://www.pro-football-reference.com', 5),
  ('Basketball Reference', 'https://www.basketball-reference.com', 5),
  ('ESPN', 'https://www.espn.com', 4),
  ('College Baseball Foundation', 'https://collegebaseballfoundation.org', 5),
  ('NCAA', 'https://www.ncaa.com', 5),
  ('D1Baseball', 'https://d1baseball.com', 4),
  ('Baseball America', 'https://www.baseballamerica.com', 5),
  ('Sports Reference CFB', 'https://www.sports-reference.com/cfb', 5);

-- =============================================================================
-- CACHE TABLE - For API response caching (matches blaze-sports-api pattern)
-- =============================================================================
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ttl INTEGER NOT NULL
);

CREATE INDEX idx_cache_created ON cache(created_at);

-- =============================================================================
-- AUDIT LOG - Track changes for data integrity
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_by TEXT,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_record ON audit_log(record_id);
