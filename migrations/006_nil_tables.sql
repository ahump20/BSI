-- Migration: 006_nil_tables.sql
-- Purpose: Add NIL (Name, Image, Likeness) tracking tables for college baseball
-- Database: bsi-game-db
-- Created: 2025-01-09
-- Author: BSI Team

-- =============================================================================
-- NIL DEALS TABLE
-- Tracks individual NIL deals and endorsements for players
-- =============================================================================

CREATE TABLE IF NOT EXISTS nil_deals (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  deal_type TEXT NOT NULL,
  deal_value REAL,
  deal_value_tier TEXT,
  announced_date TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  source TEXT,
  source_url TEXT,
  notes TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES college_baseball_players(id),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id)
);

-- =============================================================================
-- NIL VALUATIONS TABLE
-- Estimated NIL value for players (aggregate from multiple sources)
-- =============================================================================

CREATE TABLE IF NOT EXISTS nil_valuations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL UNIQUE,
  team_id TEXT NOT NULL,
  estimated_value REAL,
  value_range_low REAL,
  value_range_high REAL,
  social_following INTEGER DEFAULT 0,
  instagram_followers INTEGER DEFAULT 0,
  twitter_followers INTEGER DEFAULT 0,
  tiktok_followers INTEGER DEFAULT 0,
  engagement_rate REAL,
  marketability_score REAL,
  performance_score REAL,
  overall_nil_rank INTEGER,
  conference_nil_rank INTEGER,
  position_nil_rank INTEGER,
  source TEXT,
  last_updated TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES college_baseball_players(id),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id)
);

-- =============================================================================
-- TEAM NIL SUMMARY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_nil_summary (
  team_id TEXT PRIMARY KEY,
  total_nil_value REAL DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  avg_player_value REAL DEFAULT 0,
  top_earner_id TEXT,
  top_earner_value REAL,
  collective_name TEXT,
  collective_website TEXT,
  collective_established_year INTEGER,
  nil_ranking INTEGER,
  conference_nil_rank INTEGER,
  last_updated TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id),
  FOREIGN KEY (top_earner_id) REFERENCES college_baseball_players(id)
);

-- =============================================================================
-- NIL COLLECTIVES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS nil_collectives (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  established_year INTEGER,
  estimated_annual_budget REAL,
  focus_sports TEXT,
  num_athletes_supported INTEGER,
  is_official INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES college_baseball_teams(id)
);

-- =============================================================================
-- NIL MARKET TRENDS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS nil_market_trends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL DEFAULT 'baseball',
  period_type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  total_deals INTEGER DEFAULT 0,
  total_value REAL DEFAULT 0,
  avg_deal_value REAL DEFAULT 0,
  median_deal_value REAL DEFAULT 0,
  top_deal_value REAL DEFAULT 0,
  new_athletes_with_deals INTEGER DEFAULT 0,
  top_categories TEXT,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================================================
-- TRANSFER PORTAL NIL TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS transfer_portal_nil (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  from_team_id TEXT,
  to_team_id TEXT,
  transfer_date TEXT,
  nil_reported_factor INTEGER DEFAULT 0,
  estimated_nil_increase REAL,
  previous_nil_value REAL,
  new_nil_value REAL,
  source TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (player_id) REFERENCES college_baseball_players(id),
  FOREIGN KEY (from_team_id) REFERENCES college_baseball_teams(id),
  FOREIGN KEY (to_team_id) REFERENCES college_baseball_teams(id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_nil_deals_player ON nil_deals(player_id);
CREATE INDEX IF NOT EXISTS idx_nil_deals_team ON nil_deals(team_id);
CREATE INDEX IF NOT EXISTS idx_nil_deals_status ON nil_deals(status);
CREATE INDEX IF NOT EXISTS idx_nil_deals_date ON nil_deals(announced_date);
CREATE INDEX IF NOT EXISTS idx_nil_deals_brand ON nil_deals(brand_name);

CREATE INDEX IF NOT EXISTS idx_nil_valuations_team ON nil_valuations(team_id);
CREATE INDEX IF NOT EXISTS idx_nil_valuations_value ON nil_valuations(estimated_value DESC);
CREATE INDEX IF NOT EXISTS idx_nil_valuations_rank ON nil_valuations(overall_nil_rank);

CREATE INDEX IF NOT EXISTS idx_team_nil_summary_rank ON team_nil_summary(nil_ranking);
CREATE INDEX IF NOT EXISTS idx_team_nil_summary_value ON team_nil_summary(total_nil_value DESC);

CREATE INDEX IF NOT EXISTS idx_nil_collectives_team ON nil_collectives(team_id);

CREATE INDEX IF NOT EXISTS idx_nil_market_trends_period ON nil_market_trends(period_type, period_start);

CREATE INDEX IF NOT EXISTS idx_transfer_portal_nil_player ON transfer_portal_nil(player_id);
CREATE INDEX IF NOT EXISTS idx_transfer_portal_nil_to_team ON transfer_portal_nil(to_team_id);

-- =============================================================================
-- INITIAL SYNC LOG ENTRIES
-- =============================================================================

INSERT OR IGNORE INTO data_sync_log (source, entity_type, status, created_at)
VALUES
  ('nil_athletes_api', 'nil_valuations', 'pending', datetime('now')),
  ('nil_athletes_api', 'nil_deals', 'pending', datetime('now')),
  ('highlightly_api', 'player_stats', 'pending', datetime('now'));
