-- Migration: 007_cbb_entity_sources_and_stats.sql
-- Purpose: Add entity_sources mapping table and normalized stats tables for CBB gateway/sync
-- Database: bsi-game-db
-- Created: 2025-01-09
-- Author: BSI Team
--
-- CRITICAL: entity_sources enables multi-source ID mapping without name-based joins
-- Sources: NCAA API (henrygd/ncaa-api), Highlightly Baseball API

-- =============================================================================
-- ENTITY SOURCES - CROSS-SOURCE ID MAPPING (THIS IS KEY)
-- Maps internal BSI IDs to source-specific IDs (NCAA, Highlightly, ESPN)
-- NEVER use name-based joins - always use this table
-- =============================================================================

CREATE TABLE IF NOT EXISTS entity_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,          -- 'team', 'player', 'game'
  entity_id TEXT NOT NULL,            -- Our internal BSI ID
  source TEXT NOT NULL,               -- 'ncaa', 'highlightly', 'espn', 'd1baseball'
  source_id TEXT NOT NULL,            -- The ID from that source
  source_url TEXT,                    -- Optional: direct URL to source record
  confidence REAL DEFAULT 1.0,        -- 0.0-1.0 mapping confidence
  verified INTEGER DEFAULT 0,         -- Manual verification flag
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(source, source_id),                    -- Each source ID maps to one entity
  UNIQUE(entity_type, entity_id, source)        -- Each entity has one ID per source
);

-- =============================================================================
-- PLAYER SEASON STATS (NORMALIZED)
-- Separates batting and pitching stats from player bio data
-- Supports season-by-season tracking and multi-source aggregation
-- =============================================================================

CREATE TABLE IF NOT EXISTS cbb_player_season_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  split_type TEXT NOT NULL DEFAULT 'season',  -- 'season', 'conference', 'postseason'
  
  -- Batting stats
  games_batting INTEGER DEFAULT 0,
  at_bats INTEGER DEFAULT 0,
  runs INTEGER DEFAULT 0,
  hits INTEGER DEFAULT 0,
  doubles INTEGER DEFAULT 0,
  triples INTEGER DEFAULT 0,
  home_runs INTEGER DEFAULT 0,
  rbi INTEGER DEFAULT 0,
  walks INTEGER DEFAULT 0,
  strikeouts_batting INTEGER DEFAULT 0,
  stolen_bases INTEGER DEFAULT 0,
  caught_stealing INTEGER DEFAULT 0,
  hit_by_pitch INTEGER DEFAULT 0,
  sacrifice_hits INTEGER DEFAULT 0,
  sacrifice_flies INTEGER DEFAULT 0,
  batting_avg REAL,
  on_base_pct REAL,
  slugging_pct REAL,
  ops REAL,
  
  -- Pitching stats
  games_pitching INTEGER DEFAULT 0,
  games_started INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  holds INTEGER DEFAULT 0,
  innings_pitched REAL DEFAULT 0,
  hits_allowed INTEGER DEFAULT 0,
  runs_allowed INTEGER DEFAULT 0,
  earned_runs INTEGER DEFAULT 0,
  walks_allowed INTEGER DEFAULT 0,
  strikeouts_pitching INTEGER DEFAULT 0,
  home_runs_allowed INTEGER DEFAULT 0,
  wild_pitches INTEGER DEFAULT 0,
  hit_batters INTEGER DEFAULT 0,
  era REAL,
  whip REAL,
  k_per_9 REAL,
  bb_per_9 REAL,
  
  -- Fielding (basic)
  games_fielding INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  putouts INTEGER DEFAULT 0,
  fielding_pct REAL,
  
  -- Source tracking
  source TEXT NOT NULL,               -- 'highlightly', 'ncaa', 'espn'
  source_updated_at TEXT,             -- When source last updated this data
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (player_id) REFERENCES college_baseball_players(id),
  UNIQUE(player_id, season, split_type, source)
);

-- =============================================================================
-- TEAM SEASON STATS (AGGREGATED)
-- Team-level stats per season for standings and comparison
-- =============================================================================

CREATE TABLE IF NOT EXISTS cbb_team_season_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  
  -- Overall record
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_pct REAL,
  
  -- Conference record
  conference_wins INTEGER DEFAULT 0,
  conference_losses INTEGER DEFAULT 0,
  conference_win_pct REAL,
  
  -- Home/Away/Neutral splits
  home_wins INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  neutral_wins INTEGER DEFAULT 0,
  neutral_losses INTEGER DEFAULT 0,
  
  -- Team batting
  team_runs_scored INTEGER DEFAULT 0,
  team_hits INTEGER DEFAULT 0,
  team_home_runs INTEGER DEFAULT 0,
  team_batting_avg REAL,
  team_on_base_pct REAL,
  team_slugging_pct REAL,
  
  -- Team pitching
  team_runs_allowed INTEGER DEFAULT 0,
  team_era REAL,
  team_whip REAL,
  team_strikeouts INTEGER DEFAULT 0,
  team_walks_allowed INTEGER DEFAULT 0,
  
  -- Team fielding
  team_errors INTEGER DEFAULT 0,
  team_fielding_pct REAL,
  
  -- Derived metrics
  run_differential INTEGER DEFAULT 0,
  pythagorean_win_pct REAL,
  
  -- Rankings (updated from rankings table or API)
  rpi REAL,
  sos REAL,                           -- Strength of schedule
  
  -- Source tracking
  source TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id),
  UNIQUE(team_id, season, source)
);

-- =============================================================================
-- GAME BOX SCORES (DETAILED GAME DATA)
-- Individual game box score data for completed games
-- =============================================================================

CREATE TABLE IF NOT EXISTS cbb_game_box_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  
  -- Linescore (JSON: {"1": 0, "2": 1, ...})
  home_linescore TEXT,
  away_linescore TEXT,
  
  -- Final totals
  home_runs INTEGER,
  home_hits INTEGER,
  home_errors INTEGER,
  away_runs INTEGER,
  away_hits INTEGER,
  away_errors INTEGER,
  
  -- Game info
  innings_played INTEGER DEFAULT 9,
  attendance INTEGER,
  duration_minutes INTEGER,
  weather TEXT,
  
  -- Winning/Losing pitchers
  winning_pitcher_id TEXT,
  losing_pitcher_id TEXT,
  save_pitcher_id TEXT,
  
  -- Source tracking
  source TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (game_id) REFERENCES college_baseball_games(id),
  FOREIGN KEY (winning_pitcher_id) REFERENCES college_baseball_players(id),
  FOREIGN KEY (losing_pitcher_id) REFERENCES college_baseball_players(id),
  FOREIGN KEY (save_pitcher_id) REFERENCES college_baseball_players(id),
  UNIQUE(game_id, source)
);

-- =============================================================================
-- SYNC LOG (ENHANCED FOR GATEWAY/SYNC WORKERS)
-- Tracks sync operations with rate limiting and error handling
-- =============================================================================

CREATE TABLE IF NOT EXISTS cbb_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker TEXT NOT NULL,               -- 'bsi-cbb-sync', 'bsi-cbb-gateway'
  source TEXT NOT NULL,               -- 'ncaa', 'highlightly', 'nil_manual'
  entity_type TEXT NOT NULL,          -- 'teams', 'players', 'games', 'stats', 'nil'
  operation TEXT NOT NULL,            -- 'full_sync', 'incremental', 'scoreboard', 'manual'
  status TEXT NOT NULL,               -- 'started', 'success', 'partial', 'failed', 'rate_limited'
  records_fetched INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  error_details TEXT,                 -- JSON for detailed error info
  duration_ms INTEGER,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================================================
-- ALTER EXISTING TABLES FOR SOURCE ID COLUMNS
-- Add columns for direct source ID storage (for performance)
-- =============================================================================

-- Add NCAA and Highlightly IDs to teams (in addition to entity_sources mapping)
-- SQLite doesn't support IF NOT EXISTS for ALTER, so these may fail if columns exist
-- Run individually and ignore errors for existing columns

-- college_baseball_teams additions
ALTER TABLE college_baseball_teams ADD COLUMN ncaa_id TEXT;
ALTER TABLE college_baseball_teams ADD COLUMN highlightly_id TEXT;

-- college_baseball_players additions  
ALTER TABLE college_baseball_players ADD COLUMN ncaa_id TEXT;
ALTER TABLE college_baseball_players ADD COLUMN highlightly_id TEXT;
ALTER TABLE college_baseball_players ADD COLUMN is_active INTEGER DEFAULT 1;

-- college_baseball_games additions
ALTER TABLE college_baseball_games ADD COLUMN ncaa_id TEXT;
ALTER TABLE college_baseball_games ADD COLUMN highlightly_id TEXT;
ALTER TABLE college_baseball_games ADD COLUMN season INTEGER;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- Optimized for common query patterns in gateway/sync workers
-- =============================================================================

-- Entity sources - fast lookups by source and by entity
CREATE INDEX IF NOT EXISTS idx_entity_sources_lookup 
  ON entity_sources(source, source_id);
CREATE INDEX IF NOT EXISTS idx_entity_sources_entity 
  ON entity_sources(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_sources_type_source 
  ON entity_sources(entity_type, source);

-- Player stats - fast lookups by player/season and source
CREATE INDEX IF NOT EXISTS idx_player_stats_player_season 
  ON cbb_player_season_stats(player_id, season);
CREATE INDEX IF NOT EXISTS idx_player_stats_source 
  ON cbb_player_season_stats(source, season);
CREATE INDEX IF NOT EXISTS idx_player_stats_batting_avg 
  ON cbb_player_season_stats(batting_avg DESC) WHERE batting_avg IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_player_stats_era 
  ON cbb_player_season_stats(era ASC) WHERE era IS NOT NULL AND innings_pitched >= 10;

-- Team stats - fast lookups for standings
CREATE INDEX IF NOT EXISTS idx_team_stats_season 
  ON cbb_team_season_stats(season, wins DESC);
CREATE INDEX IF NOT EXISTS idx_team_stats_conference 
  ON cbb_team_season_stats(team_id, season);

-- Box scores - game lookup
CREATE INDEX IF NOT EXISTS idx_box_scores_game 
  ON cbb_game_box_scores(game_id);

-- Sync log - recent operations
CREATE INDEX IF NOT EXISTS idx_sync_log_recent 
  ON cbb_sync_log(worker, source, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_status 
  ON cbb_sync_log(status, started_at DESC);

-- Source ID columns on existing tables
CREATE INDEX IF NOT EXISTS idx_teams_ncaa ON college_baseball_teams(ncaa_id) WHERE ncaa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teams_highlightly ON college_baseball_teams(highlightly_id) WHERE highlightly_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_ncaa ON college_baseball_players(ncaa_id) WHERE ncaa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_highlightly ON college_baseball_players(highlightly_id) WHERE highlightly_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_ncaa ON college_baseball_games(ncaa_id) WHERE ncaa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_season ON college_baseball_games(season) WHERE season IS NOT NULL;

-- =============================================================================
-- INITIAL SYNC LOG ENTRIES
-- =============================================================================

INSERT OR IGNORE INTO data_sync_log (source, entity_type, status, created_at)
VALUES 
  ('ncaa_api', 'scoreboard', 'pending', datetime('now')),
  ('ncaa_api', 'schedule', 'pending', datetime('now')),
  ('ncaa_api', 'games', 'pending', datetime('now')),
  ('highlightly_api', 'teams', 'pending', datetime('now')),
  ('highlightly_api', 'matches', 'pending', datetime('now')),
  ('highlightly_api', 'standings', 'pending', datetime('now')),
  ('highlightly_api', 'players', 'pending', datetime('now')),
  ('highlightly_api', 'player_stats', 'pending', datetime('now')),
  ('manual', 'nil_import', 'pending', datetime('now'));
