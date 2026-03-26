-- D1 Database Schema for Blaze Sports Intel
-- All timestamps use SQLite's datetime('now','localtime') for America/Chicago

-- College baseball scoreboard snapshots
CREATE TABLE IF NOT EXISTS cb_scoreboard (
  id INTEGER PRIMARY KEY,
  espn_event_id TEXT UNIQUE NOT NULL,
  date_yyyymmdd TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ESPN college-baseball',
  fetched_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_cb_date 
  ON cb_scoreboard(date_yyyymmdd);

CREATE INDEX IF NOT EXISTS idx_cb_fetched 
  ON cb_scoreboard(fetched_at DESC);

-- MLB game status tracking
CREATE TABLE IF NOT EXISTS mlb_game_status (
  game_pk INTEGER PRIMARY KEY,
  state TEXT NOT NULL,
  home_team TEXT,
  away_team TEXT,
  game_date TEXT,
  fetched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mlb_date 
  ON mlb_game_status(game_date);

CREATE INDEX IF NOT EXISTS idx_mlb_state 
  ON mlb_game_status(state);

-- MLB player stats cache (optional)
CREATE TABLE IF NOT EXISTS mlb_player_stats (
  player_id INTEGER NOT NULL,
  stat_type TEXT NOT NULL,
  season INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'statsapi.mlb.com',
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (player_id, stat_type, season)
);

CREATE INDEX IF NOT EXISTS idx_mlb_player_fetched 
  ON mlb_player_stats(fetched_at DESC);

-- NFL game tracking (optional)
CREATE TABLE IF NOT EXISTS nfl_games (
  game_id TEXT PRIMARY KEY,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_status TEXT NOT NULL,
  payload_json TEXT,
  source TEXT NOT NULL DEFAULT 'ESPN NFL',
  fetched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nfl_season_week 
  ON nfl_games(season, week);

-- FanGraphs leaderboard metadata
CREATE TABLE IF NOT EXISTS fangraphs_imports (
  import_id INTEGER PRIMARY KEY,
  leaderboard_type TEXT NOT NULL,
  season INTEGER NOT NULL,
  r2_path TEXT NOT NULL,
  row_count INTEGER,
  imported_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_fg_season 
  ON fangraphs_imports(season DESC);
