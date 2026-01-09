-- Migration 005: Team Pages & Enhanced Transfer Portal
-- D1 Database: bsi-game-db
-- Created: 2025-01-08
-- Purpose: Create D1 team pages infrastructure and enhance transfer portal with impact scoring

-- =============================================================================
-- PART 1: COLLEGE BASEBALL TEAMS (SEO-OPTIMIZED FOR 300+ PROGRAMS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS college_baseball_teams (
  id TEXT PRIMARY KEY,
  espn_id TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  mascot TEXT,
  abbreviation TEXT,
  nickname TEXT,
  conference TEXT NOT NULL,
  division TEXT DEFAULT 'D1',
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
  website_url TEXT,
  twitter_handle TEXT,
  instagram_handle TEXT,
  founded_year INTEGER,
  -- SEO fields
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  -- Analytics
  page_views INTEGER DEFAULT 0,
  last_viewed_at TEXT,
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_teams_slug ON college_baseball_teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_conference ON college_baseball_teams(conference);
CREATE INDEX IF NOT EXISTS idx_teams_state ON college_baseball_teams(state);

-- Team page analytics for tracking engagement
CREATE TABLE IF NOT EXISTS team_page_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  view_date TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0,
  referrer_source TEXT,
  device_type TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id)
);

CREATE INDEX IF NOT EXISTS idx_team_analytics_date ON team_page_analytics(team_id, view_date);

-- Team records (standings, season performance)
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
  streak_type TEXT,
  streak_count INTEGER DEFAULT 0,
  last_10 TEXT,
  rpi REAL,
  sos REAL,
  ranking INTEGER,
  conference_rank INTEGER,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id),
  UNIQUE(team_id, season)
);

CREATE INDEX IF NOT EXISTS idx_records_team_season ON college_baseball_records(team_id, season);

-- Team rankings from multiple sources
CREATE TABLE IF NOT EXISTS college_baseball_rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  source TEXT NOT NULL,
  rank INTEGER,
  previous_rank INTEGER,
  week INTEGER,
  season INTEGER NOT NULL,
  points INTEGER,
  first_place_votes INTEGER,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id)
);

CREATE INDEX IF NOT EXISTS idx_rankings_team_season ON college_baseball_rankings(team_id, season);
CREATE INDEX IF NOT EXISTS idx_rankings_source_week ON college_baseball_rankings(source, week, season);

-- Program history (CWS appearances, titles, etc.)
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
  first_season INTEGER,
  notable_alumni TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id)
);

-- =============================================================================
-- PART 2: ENHANCED TRANSFER PORTAL WITH IMPACT SCORING
-- =============================================================================

-- Add impact scoring columns to existing transfer_portal table
-- Using ALTER TABLE since the table already exists
ALTER TABLE transfer_portal ADD COLUMN impact_score REAL DEFAULT 0;
ALTER TABLE transfer_portal ADD COLUMN power_grade REAL;
ALTER TABLE transfer_portal ADD COLUMN speed_grade REAL;
ALTER TABLE transfer_portal ADD COLUMN arm_grade REAL;
ALTER TABLE transfer_portal ADD COLUMN field_grade REAL;
ALTER TABLE transfer_portal ADD COLUMN hit_grade REAL;
ALTER TABLE transfer_portal ADD COLUMN contact_grade REAL;
ALTER TABLE transfer_portal ADD COLUMN pitch_command REAL;
ALTER TABLE transfer_portal ADD COLUMN pitch_velocity INTEGER;
ALTER TABLE transfer_portal ADD COLUMN pitch_stuff REAL;
ALTER TABLE transfer_portal ADD COLUMN years_remaining INTEGER;
ALTER TABLE transfer_portal ADD COLUMN from_team_rank INTEGER;
ALTER TABLE transfer_portal ADD COLUMN to_team_rank INTEGER;
ALTER TABLE transfer_portal ADD COLUMN perfect_game_grade TEXT;
ALTER TABLE transfer_portal ADD COLUMN high_school_rank INTEGER;
ALTER TABLE transfer_portal ADD COLUMN is_mlb_draft_eligible INTEGER DEFAULT 0;
ALTER TABLE transfer_portal ADD COLUMN projected_round INTEGER;
ALTER TABLE transfer_portal ADD COLUMN nil_valuation REAL;
ALTER TABLE transfer_portal ADD COLUMN interest_score REAL DEFAULT 0;
ALTER TABLE transfer_portal ADD COLUMN last_impact_calc TEXT;

-- Indexes for impact scoring queries
CREATE INDEX IF NOT EXISTS idx_portal_impact ON transfer_portal(impact_score DESC);

-- Transfer portal activity timeline
CREATE TABLE IF NOT EXISTS transfer_portal_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  details TEXT,
  source TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES transfer_portal(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_player ON transfer_portal_activity(player_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON transfer_portal_activity(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON transfer_portal_activity(activity_type);

-- Transfer portal watchlists (Enterprise feature)
CREATE TABLE IF NOT EXISTS transfer_portal_watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  player_id INTEGER NOT NULL,
  notes TEXT,
  alert_on_commit INTEGER DEFAULT 1,
  alert_on_update INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES transfer_portal(id),
  UNIQUE(user_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON transfer_portal_watchlist(user_id);

-- Saved reports (Enterprise feature)
CREATE TABLE IF NOT EXISTS transfer_portal_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  report_name TEXT NOT NULL,
  filters TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_run_at TEXT,
  schedule TEXT
);

-- Conference transfer summaries
CREATE TABLE IF NOT EXISTS conference_transfer_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conference TEXT NOT NULL,
  season INTEGER NOT NULL,
  players_lost INTEGER DEFAULT 0,
  players_gained INTEGER DEFAULT 0,
  net_transfers INTEGER DEFAULT 0,
  avg_impact_lost REAL DEFAULT 0,
  avg_impact_gained REAL DEFAULT 0,
  top_loss TEXT,
  top_gain TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(conference, season)
);

CREATE INDEX IF NOT EXISTS idx_conf_transfer ON conference_transfer_summary(conference, season);

-- =============================================================================
-- PART 3: DATA SYNC TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS data_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  last_sync TEXT,
  records_updated INTEGER,
  status TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO data_sync_log (source, entity_type, last_sync, records_updated, status)
VALUES ('migration-005', 'schema', datetime('now'), 0, 'success');
