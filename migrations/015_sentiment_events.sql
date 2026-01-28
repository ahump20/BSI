-- Migration: 015_sentiment_events
-- Description: Add sentiment_events table for event-driven sentiment updates
-- Database: FANBASE_DB (D1)
-- Date: 2026-01-28

-- ============================================================================
-- Sentiment Events Table
-- ============================================================================
-- Stores events that trigger sentiment adjustments (game results, recruiting, etc.)
-- Used by the sentiment engine to calculate real-time sentiment changes.

CREATE TABLE IF NOT EXISTS sentiment_events (
  id TEXT PRIMARY KEY,
  fanbase_id TEXT NOT NULL REFERENCES fanbase_profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'game_win',
    'game_loss',
    'recruiting_commit',
    'recruiting_decommit',
    'coach_hire',
    'coach_fire',
    'injury_major',
    'transfer_portal_gain',
    'transfer_portal_loss'
  )),
  timestamp TEXT NOT NULL,

  -- Event metadata (JSON blob for type-specific data)
  metadata_json TEXT NOT NULL DEFAULT '{}',

  -- Sentiment impact from this event
  impact_overall REAL NOT NULL DEFAULT 0,
  impact_optimism REAL NOT NULL DEFAULT 0,
  impact_loyalty REAL NOT NULL DEFAULT 0,

  -- Context
  season INTEGER NOT NULL,
  week INTEGER,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TEXT,

  -- Audit
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Indexes for common queries
  FOREIGN KEY (fanbase_id) REFERENCES fanbase_profiles(id)
);

-- Index for fetching recent events by fanbase
CREATE INDEX IF NOT EXISTS idx_sentiment_events_fanbase_timestamp
ON sentiment_events(fanbase_id, timestamp DESC);

-- Index for fetching unprocessed events
CREATE INDEX IF NOT EXISTS idx_sentiment_events_unprocessed
ON sentiment_events(processed, timestamp ASC)
WHERE processed = FALSE;

-- Index for season/week queries
CREATE INDEX IF NOT EXISTS idx_sentiment_events_season_week
ON sentiment_events(season, week);

-- ============================================================================
-- Event Impact History View
-- ============================================================================
-- Aggregates event impacts by fanbase and week for analysis.

CREATE VIEW IF NOT EXISTS v_weekly_event_impacts AS
SELECT
  fanbase_id,
  season,
  week,
  COUNT(*) as event_count,
  SUM(impact_overall) as total_impact_overall,
  SUM(impact_optimism) as total_impact_optimism,
  SUM(impact_loyalty) as total_impact_loyalty,
  GROUP_CONCAT(event_type, ', ') as event_types
FROM sentiment_events
WHERE processed = TRUE
GROUP BY fanbase_id, season, week
ORDER BY season DESC, week DESC;

-- ============================================================================
-- Sample Event Types Reference (for documentation)
-- ============================================================================
--
-- game_win / game_loss metadata:
-- {
--   "opponentId": "alabama",
--   "opponentName": "Alabama",
--   "score": { "team": 24, "opponent": 21 },
--   "expectedWinProb": 0.35,
--   "isRivalry": true,
--   "gameType": "regular" | "conference_championship" | "bowl" | "playoff"
-- }
--
-- recruiting_commit / recruiting_decommit metadata:
-- {
--   "playerName": "John Doe",
--   "position": "QB",
--   "rating": 0.95,
--   "nationalRank": 12,
--   "isFlip": true,
--   "flippedFrom": "Ohio State"
-- }
--
-- coach_hire / coach_fire metadata:
-- {
--   "coachName": "Steve Sarkisian",
--   "role": "head_coach" | "coordinator" | "position_coach",
--   "previousPrestige": 0.85,
--   "fanSentimentOnDeparture": "positive" | "negative" | "mixed"
-- }
--
-- injury_major metadata:
-- {
--   "playerName": "Quinn Ewers",
--   "position": "QB",
--   "severity": "minor" | "moderate" | "season_ending",
--   "isStarter": true
-- }
--
-- transfer_portal_gain / transfer_portal_loss metadata:
-- {
--   "playerName": "Transfer Player",
--   "position": "WR",
--   "rating": 4.5,
--   "fromSchool": "Oklahoma",
--   "toSchool": "Texas"
-- }
