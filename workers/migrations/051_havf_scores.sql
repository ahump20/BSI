-- Migration 051: HAV-F Batting Approach Quality Scores
-- Creates the persistence table for BSI's proprietary HAV-F metric.
-- Schema matches what workers/handlers/analytics.ts already queries.

CREATE TABLE IF NOT EXISTS havf_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  league TEXT NOT NULL DEFAULT 'college-baseball',
  season INTEGER NOT NULL,
  position TEXT,
  conference TEXT,
  h_score REAL NOT NULL,
  a_score REAL NOT NULL,
  v_score REAL NOT NULL,
  f_score REAL NOT NULL,
  havf_composite REAL NOT NULL,
  breakdown TEXT,           -- JSON blob of sub-stat percentiles
  computed_at TEXT NOT NULL,
  UNIQUE(player_id, league, season)
);

-- Leaderboard queries: ORDER BY havf_composite DESC, filter by league/season/team/conference
CREATE INDEX IF NOT EXISTS idx_havf_leaderboard ON havf_scores(league, season, havf_composite DESC);
CREATE INDEX IF NOT EXISTS idx_havf_team ON havf_scores(team, season);
CREATE INDEX IF NOT EXISTS idx_havf_conference ON havf_scores(conference, season);
CREATE INDEX IF NOT EXISTS idx_havf_player ON havf_scores(player_id);
