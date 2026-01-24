-- Migration: 011_fanbase_sentiment.sql
-- Purpose: Fanbase Sentiment & Characteristics database for CFB fanbases
-- Database: bsi-fanbase-db
-- Created: 2025-01-24
-- Author: BSI Team

-- =============================================================================
-- FANBASE PROFILES TABLE
-- Core characteristics for each college football fanbase
-- =============================================================================

CREATE TABLE IF NOT EXISTS fanbase_profiles (
  id TEXT PRIMARY KEY,
  school TEXT NOT NULL,
  short_name TEXT NOT NULL,
  mascot TEXT NOT NULL,
  conference TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  logo_url TEXT,

  -- Sentiment metrics (individual columns for querying)
  sentiment_overall REAL NOT NULL DEFAULT 0,
  sentiment_optimism REAL NOT NULL DEFAULT 0.5,
  sentiment_loyalty REAL NOT NULL DEFAULT 0.5,
  sentiment_volatility REAL NOT NULL DEFAULT 0.5,

  -- Engagement metrics
  engagement_social REAL NOT NULL DEFAULT 0.5,
  engagement_attendance REAL NOT NULL DEFAULT 0.5,
  engagement_travel REAL NOT NULL DEFAULT 0.5,
  engagement_merch REAL NOT NULL DEFAULT 0.5,

  -- Demographics
  demo_primary_age TEXT DEFAULT '25-45',
  demo_alumni_pct REAL DEFAULT 0.3,

  -- JSON columns for complex nested data
  personality_json TEXT NOT NULL DEFAULT '{"traits":[],"rivalries":[],"traditions":[],"quirks":[]}',
  demo_geo_json TEXT NOT NULL DEFAULT '[]',

  -- Research metadata
  data_source TEXT NOT NULL DEFAULT 'manual',
  confidence REAL NOT NULL DEFAULT 0.5,
  sample_size INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================================================
-- SENTIMENT SNAPSHOTS TABLE
-- Historical weekly sentiment tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS sentiment_snapshots (
  id TEXT PRIMARY KEY,
  fanbase_id TEXT NOT NULL,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  timestamp TEXT NOT NULL,

  -- Sentiment readings
  sentiment_overall REAL NOT NULL,
  sentiment_optimism REAL NOT NULL,
  sentiment_coach_confidence REAL NOT NULL,
  sentiment_playoff_hope REAL NOT NULL,

  -- Context and themes (JSON)
  context_json TEXT NOT NULL DEFAULT '{"recentResult":"","record":"","ranking":null,"keyEvents":[]}',
  themes_json TEXT NOT NULL DEFAULT '[]',

  -- Research metadata
  data_source TEXT NOT NULL DEFAULT 'x-research',
  confidence REAL NOT NULL DEFAULT 0.5,
  sample_size INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (fanbase_id) REFERENCES fanbase_profiles(id),
  UNIQUE(fanbase_id, week, season)
);

-- =============================================================================
-- FANBASE RIVALRIES TABLE
-- Rivalry relationships between fanbases
-- =============================================================================

CREATE TABLE IF NOT EXISTS fanbase_rivalries (
  id TEXT PRIMARY KEY,
  team_a_id TEXT NOT NULL,
  team_b_id TEXT NOT NULL,
  name TEXT NOT NULL,
  intensity REAL NOT NULL DEFAULT 0.5,
  historical_record TEXT,
  last_meeting TEXT,
  trophy_name TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (team_a_id) REFERENCES fanbase_profiles(id),
  FOREIGN KEY (team_b_id) REFERENCES fanbase_profiles(id),
  UNIQUE(team_a_id, team_b_id)
);

-- =============================================================================
-- INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Fanbase profiles indexes
CREATE INDEX IF NOT EXISTS idx_fanbase_conference ON fanbase_profiles(conference);
CREATE INDEX IF NOT EXISTS idx_fanbase_sentiment ON fanbase_profiles(sentiment_overall);
CREATE INDEX IF NOT EXISTS idx_fanbase_updated ON fanbase_profiles(updated_at);

-- Sentiment snapshots indexes
CREATE INDEX IF NOT EXISTS idx_snapshot_fanbase ON sentiment_snapshots(fanbase_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_season_week ON sentiment_snapshots(season, week);
CREATE INDEX IF NOT EXISTS idx_snapshot_timestamp ON sentiment_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_snapshot_fanbase_season ON sentiment_snapshots(fanbase_id, season);

-- Rivalries indexes
CREATE INDEX IF NOT EXISTS idx_rivalry_team_a ON fanbase_rivalries(team_a_id);
CREATE INDEX IF NOT EXISTS idx_rivalry_team_b ON fanbase_rivalries(team_b_id);

-- =============================================================================
-- VIEWS FOR ANALYTICS
-- =============================================================================

-- Conference sentiment overview
CREATE VIEW IF NOT EXISTS v_conference_sentiment AS
SELECT
  conference,
  COUNT(*) as team_count,
  AVG(sentiment_overall) as avg_overall,
  AVG(sentiment_optimism) as avg_optimism,
  AVG(sentiment_loyalty) as avg_loyalty,
  AVG(sentiment_volatility) as avg_volatility,
  MAX(sentiment_overall) as max_sentiment,
  MIN(sentiment_overall) as min_sentiment
FROM fanbase_profiles
GROUP BY conference;

-- Recent sentiment changes (week-over-week)
CREATE VIEW IF NOT EXISTS v_sentiment_changes AS
SELECT
  s1.fanbase_id,
  fp.short_name,
  fp.mascot,
  s1.season,
  s1.week as current_week,
  s2.week as previous_week,
  s1.sentiment_overall as current_sentiment,
  s2.sentiment_overall as previous_sentiment,
  (s1.sentiment_overall - s2.sentiment_overall) as delta,
  CASE
    WHEN (s1.sentiment_overall - s2.sentiment_overall) > 0.1 THEN 'rising'
    WHEN (s1.sentiment_overall - s2.sentiment_overall) < -0.1 THEN 'falling'
    ELSE 'stable'
  END as trend
FROM sentiment_snapshots s1
JOIN sentiment_snapshots s2 ON s1.fanbase_id = s2.fanbase_id
  AND s1.season = s2.season
  AND s1.week = s2.week + 1
JOIN fanbase_profiles fp ON s1.fanbase_id = fp.id;

-- Trending fanbases (biggest changes this week)
CREATE VIEW IF NOT EXISTS v_trending_fanbases AS
SELECT
  fanbase_id,
  short_name,
  mascot,
  season,
  current_week,
  current_sentiment,
  previous_sentiment,
  delta,
  trend,
  ABS(delta) as abs_delta
FROM v_sentiment_changes
ORDER BY abs_delta DESC;

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER IF NOT EXISTS update_fanbase_profiles_timestamp
AFTER UPDATE ON fanbase_profiles
BEGIN
  UPDATE fanbase_profiles SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_fanbase_rivalries_timestamp
AFTER UPDATE ON fanbase_rivalries
BEGIN
  UPDATE fanbase_rivalries SET updated_at = datetime('now') WHERE id = NEW.id;
END;
