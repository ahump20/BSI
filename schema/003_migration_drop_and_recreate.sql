-- Migration: Drop all tables and recreate with corrected foreign keys
-- This fixes the fundamental schema flaw where foreign keys referenced non-primary key columns
-- Created: 2025-10-19

-- ============================================================================
-- STEP 1: Drop all tables in reverse dependency order
-- ============================================================================

PRAGMA foreign_keys = OFF;

-- Drop tables with foreign keys first (child tables)
DROP TABLE IF EXISTS player_game_stats;
DROP TABLE IF EXISTS team_game_stats;
DROP TABLE IF EXISTS player_season_stats;
DROP TABLE IF EXISTS team_season_stats;
DROP TABLE IF EXISTS depth_charts;
DROP TABLE IF EXISTS standings;
DROP TABLE IF EXISTS scouting_reports;

-- Drop tables with fewer dependencies
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS players;

-- Drop parent tables last
DROP TABLE IF EXISTS teams;

-- Drop utility tables
DROP TABLE IF EXISTS api_sync_log;
DROP TABLE IF EXISTS cache_metadata;

PRAGMA foreign_keys = ON;

-- ============================================================================
-- STEP 2: Recreate all tables with corrected foreign keys
-- ============================================================================

-- TEAMS TABLE
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB', 'baseball')),
    team_id INTEGER NOT NULL,
    global_team_id INTEGER,
    key TEXT,
    city TEXT,
    name TEXT NOT NULL,
    school TEXT,
    conference TEXT,
    division TEXT,
    stadium_name TEXT,
    stadium_capacity INTEGER,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    active BOOLEAN DEFAULT 1,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    conference_wins INTEGER DEFAULT 0,
    conference_losses INTEGER DEFAULT 0,
    home_wins INTEGER DEFAULT 0,
    home_losses INTEGER DEFAULT 0,
    away_wins INTEGER DEFAULT 0,
    away_losses INTEGER DEFAULT 0,
    neutral_wins INTEGER DEFAULT 0,
    neutral_losses INTEGER DEFAULT 0,
    runs_scored INTEGER DEFAULT 0,
    runs_allowed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, team_id)
);

CREATE INDEX idx_teams_sport_key ON teams(sport, key);
CREATE INDEX idx_teams_conference ON teams(sport, conference);
CREATE INDEX idx_teams_global_id ON teams(global_team_id);

-- PLAYERS TABLE (FIXED: team_id → teams(id))
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB', 'baseball')),
    player_id INTEGER NOT NULL,
    team_id INTEGER,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT NOT NULL,
    position TEXT,
    jersey_number INTEGER,
    height TEXT,
    weight INTEGER,
    birth_date TEXT,
    birth_city TEXT,
    birth_state TEXT,
    college TEXT,
    experience INTEGER,
    status TEXT,
    photo_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, player_id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_players_sport_team ON players(sport, team_id);
CREATE INDEX idx_players_name ON players(last_name, first_name);
CREATE INDEX idx_players_position ON players(sport, position);

-- GAMES TABLE (FIXED: home_team_id/away_team_id → teams(id))
CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB', 'baseball')),
    game_id INTEGER NOT NULL,
    season INTEGER NOT NULL,
    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),
    week INTEGER,
    game_date TEXT NOT NULL,
    game_time TEXT,
    status TEXT,
    home_team_id INTEGER NOT NULL,
    home_team_key TEXT NOT NULL,
    home_team_name TEXT NOT NULL,
    home_score INTEGER,
    away_team_id INTEGER NOT NULL,
    away_team_key TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    away_score INTEGER,
    stadium_name TEXT,
    channel TEXT,
    neutral_site BOOLEAN DEFAULT 0,
    attendance INTEGER,
    weather_temp INTEGER,
    weather_desc TEXT,
    winning_team_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, game_id),
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

CREATE INDEX idx_games_sport_season ON games(sport, season, season_type);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX idx_games_status ON games(status);

-- STANDINGS TABLE (FIXED: team_id → teams(id))
CREATE TABLE standings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB', 'baseball')),
    season INTEGER NOT NULL,
    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),
    team_id INTEGER NOT NULL,
    team_key TEXT NOT NULL,
    team_name TEXT NOT NULL,
    conference TEXT,
    division TEXT,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    ties INTEGER DEFAULT 0,
    win_percentage REAL,
    games_back TEXT,
    streak TEXT,
    points_for INTEGER,
    points_against INTEGER,
    point_differential INTEGER,
    home_wins INTEGER DEFAULT 0,
    home_losses INTEGER DEFAULT 0,
    away_wins INTEGER DEFAULT 0,
    away_losses INTEGER DEFAULT 0,
    conference_wins INTEGER DEFAULT 0,
    conference_losses INTEGER DEFAULT 0,
    division_wins INTEGER DEFAULT 0,
    division_losses INTEGER DEFAULT 0,
    division_rank INTEGER,
    conference_rank INTEGER,
    playoff_rank INTEGER,
    data_source TEXT DEFAULT 'SportsDataIO',
    last_updated TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, season, season_type, team_id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_standings_sport_season ON standings(sport, season, season_type);
CREATE INDEX idx_standings_conference ON standings(sport, season, conference, division_rank);
CREATE INDEX idx_standings_updated ON standings(last_updated);

-- TEAM_SEASON_STATS TABLE (FIXED: team_id → teams(id))
CREATE TABLE team_season_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB', 'baseball')),
    season INTEGER NOT NULL,
    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),
    team_id INTEGER NOT NULL,
    team_key TEXT NOT NULL,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    points_for INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,
    total_yards REAL,
    passing_yards REAL,
    rushing_yards REAL,
    turnovers INTEGER,
    sacks INTEGER,
    third_down_pct REAL,
    runs_scored INTEGER,
    runs_allowed INTEGER,
    hits INTEGER,
    home_runs INTEGER,
    batting_avg REAL,
    era REAL,
    whip REAL,
    field_goal_pct REAL,
    three_point_pct REAL,
    free_throw_pct REAL,
    rebounds_per_game REAL,
    assists_per_game REAL,
    stats_json TEXT,
    last_updated TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, season, season_type, team_id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_team_stats_sport_season ON team_season_stats(sport, season, season_type);
CREATE INDEX idx_team_stats_team ON team_season_stats(team_id);

-- PLAYER_SEASON_STATS TABLE (FIXED: player_id/team_id → id columns)
CREATE TABLE player_season_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB', 'baseball')),
    season INTEGER NOT NULL,
    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),
    player_id INTEGER NOT NULL,
    team_id INTEGER,
    player_name TEXT NOT NULL,
    position TEXT,
    games_played INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,
    passing_yards INTEGER,
    passing_tds INTEGER,
    interceptions INTEGER,
    rushing_yards INTEGER,
    rushing_tds INTEGER,
    receptions INTEGER,
    receiving_yards INTEGER,
    receiving_tds INTEGER,
    tackles INTEGER,
    sacks REAL,
    at_bats INTEGER,
    hits INTEGER,
    doubles INTEGER,
    triples INTEGER,
    home_runs INTEGER,
    rbis INTEGER,
    batting_avg REAL,
    obp REAL,
    slg REAL,
    ops REAL,
    innings_pitched REAL,
    earned_runs INTEGER,
    era REAL,
    strikeouts INTEGER,
    walks INTEGER,
    whip REAL,
    points_per_game REAL,
    rebounds_per_game REAL,
    assists_per_game REAL,
    field_goal_pct REAL,
    three_point_pct REAL,
    free_throw_pct REAL,
    stats_json TEXT,
    last_updated TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, season, season_type, player_id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_player_stats_sport_season ON player_season_stats(sport, season, season_type);
CREATE INDEX idx_player_stats_player ON player_season_stats(player_id);
CREATE INDEX idx_player_stats_team ON player_season_stats(team_id);

-- TEAM_GAME_STATS TABLE (FIXED: game_id/team_id → id columns)
CREATE TABLE team_game_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB', 'baseball')),
    game_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    team_key TEXT NOT NULL,
    is_home BOOLEAN DEFAULT 0,
    opponent_id INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    opponent_points INTEGER DEFAULT 0,
    won BOOLEAN DEFAULT 0,
    stats_json TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, game_id, team_id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_team_game_stats_game ON team_game_stats(game_id);
CREATE INDEX idx_team_game_stats_team ON team_game_stats(team_id);

-- PLAYER_GAME_STATS TABLE (FIXED: game_id/player_id/team_id → id columns)
CREATE TABLE player_game_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB', 'baseball')),
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    position TEXT,
    stats_json TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, game_id, player_id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_player_game_stats_game ON player_game_stats(game_id);
CREATE INDEX idx_player_game_stats_player ON player_game_stats(player_id);

-- DEPTH_CHARTS TABLE (FIXED: team_id/player_id → id columns)
CREATE TABLE depth_charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB', 'baseball')),
    team_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    position TEXT NOT NULL,
    depth_order INTEGER,
    position_category TEXT,
    injury_status TEXT,
    injury_body_part TEXT,
    injury_notes TEXT,
    last_updated TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX idx_depth_charts_team ON depth_charts(team_id, position);
CREATE INDEX idx_depth_charts_player ON depth_charts(player_id);
CREATE INDEX idx_depth_charts_injuries ON depth_charts(injury_status);

-- API_SYNC_LOG TABLE
CREATE TABLE api_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    season INTEGER,
    week INTEGER,
    date TEXT,
    status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'ERROR', 'PARTIAL')),
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    duration_ms INTEGER,
    synced_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sync_log_sport_endpoint ON api_sync_log(sport, endpoint, synced_at);
CREATE INDEX idx_sync_log_status ON api_sync_log(status);

-- CACHE_METADATA TABLE
CREATE TABLE cache_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    sport TEXT NOT NULL,
    data_type TEXT NOT NULL,
    season INTEGER,
    week INTEGER,
    ttl_seconds INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_cache_meta_key ON cache_metadata(cache_key);
CREATE INDEX idx_cache_meta_expires ON cache_metadata(expires_at);
CREATE INDEX idx_cache_meta_sport_type ON cache_metadata(sport, data_type);

-- ============================================================================
-- Migration Complete
-- ============================================================================
SELECT 'Migration complete: 14 foreign key constraints fixed' AS status;
