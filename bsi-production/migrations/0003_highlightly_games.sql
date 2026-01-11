-- Migration: 0003_highlightly_games.sql
-- Purpose: Add games table for live scores and ingest_log for observability
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL CHECK (sport IN ('college_baseball', 'college_football')),
  season INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  home_team_abbrev TEXT,
  away_team_abbrev TEXT,
  home_rank INTEGER,
  away_rank INTEGER,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'final', 'postponed', 'canceled', 'delayed')),
  period INTEGER,
  period_detail TEXT,
  clock TEXT,
  venue TEXT,
  broadcast TEXT,
  is_conference_game INTEGER DEFAULT 0,
  source TEXT DEFAULT 'highlightly' CHECK (source IN ('highlightly', 'espn', 'ncaa')),
  source_id TEXT,
  last_updated TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(sport, source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_games_sport_date ON games(sport, date);
CREATE INDEX IF NOT EXISTS idx_games_sport_season ON games(sport, season);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_games_updated ON games(last_updated);

CREATE TABLE IF NOT EXISTS ingest_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('scores', 'standings', 'rankings', 'teams')),
  source TEXT NOT NULL CHECK (source IN ('highlightly', 'espn', 'ncaa', 'd1baseball', 'cfbd')),
  season INTEGER NOT NULL,
  date_param TEXT,
  records_fetched INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  duration_ms INTEGER,
  success INTEGER DEFAULT 1 CHECK (success IN (0, 1)),
  error_message TEXT,
  error_stack TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ingest_log_sport_type ON ingest_log(sport, data_type);
CREATE INDEX IF NOT EXISTS idx_ingest_log_source ON ingest_log(source);
CREATE INDEX IF NOT EXISTS idx_ingest_log_created ON ingest_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ingest_log_success ON ingest_log(success);

CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO sync_metadata (key, value) VALUES
  ('cbb_scores_last_sync', ''),
  ('cbb_scores_source', ''),
  ('cbb_standings_last_sync', ''),
  ('cbb_standings_source', ''),
  ('cbb_rankings_last_sync', ''),
  ('cbb_rankings_source', ''),
  ('cfb_scores_last_sync', ''),
  ('cfb_scores_source', ''),
  ('cfb_standings_last_sync', ''),
  ('cfb_standings_source', ''),
  ('cfb_rankings_last_sync', ''),
  ('cfb_rankings_source', ''),
  ('highlightly_enabled', 'true'),
  ('espn_fallback_enabled', 'true');

CREATE VIEW IF NOT EXISTS v_todays_games AS
SELECT
  g.*,
  CASE
    WHEN g.status = 'live' THEN 1
    WHEN g.status = 'scheduled' THEN 2
    WHEN g.status = 'final' THEN 3
    ELSE 4
  END as sort_order
FROM games g
WHERE g.date = date('now')
ORDER BY g.sport, sort_order, g.start_time;

CREATE VIEW IF NOT EXISTS v_recent_ingest_failures AS
SELECT *
FROM ingest_log
WHERE success = 0
  AND created_at >= datetime('now', '-24 hours')
ORDER BY created_at DESC
LIMIT 50;

CREATE VIEW IF NOT EXISTS v_ingest_summary AS
SELECT
  sport,
  data_type,
  source,
  COUNT(*) as total_runs,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_runs,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_runs,
  AVG(duration_ms) as avg_duration_ms,
  SUM(records_inserted) as total_records_inserted,
  MAX(created_at) as last_run
FROM ingest_log
WHERE created_at >= datetime('now', '-24 hours')
GROUP BY sport, data_type, source
ORDER BY sport, data_type;
