-- BlazeSportsIntel D1 Database Schema
-- SportsDataIO Integration - All Sports (NFL, MLB, CFB, CBB)
-- Created: 2025-10-01

-- ============================================================================
-- TEAMS TABLE (All Sports)
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),
    team_id INTEGER NOT NULL,  -- SportsDataIO TeamID
    global_team_id INTEGER,    -- GlobalTeamID (cross-season identifier)
    key TEXT,                  -- Team abbreviation (e.g., 'BUF', 'NYY')
    city TEXT,
    name TEXT NOT NULL,
    school TEXT,               -- College teams only
    conference TEXT,           -- NFL: AFC/NFC, MLB: AL/NL, CFB/CBB: SEC
    division TEXT,             -- Division within conference
    stadium_name TEXT,
    stadium_capacity INTEGER,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, team_id)
);

CREATE INDEX idx_teams_sport_key ON teams(sport, key);
CREATE INDEX idx_teams_conference ON teams(sport, conference);
CREATE INDEX idx_teams_global_id ON teams(global_team_id);

-- ============================================================================
-- PLAYERS TABLE (All Sports)
-- ============================================================================
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),
    player_id INTEGER NOT NULL,  -- SportsDataIO PlayerID
    team_id INTEGER,             -- Current team (foreign key to teams.team_id)
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
    status TEXT,                 -- Active, Inactive, Injured, etc.
    photo_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, player_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

CREATE INDEX idx_players_sport_team ON players(sport, team_id);
CREATE INDEX idx_players_name ON players(last_name, first_name);
CREATE INDEX idx_players_position ON players(sport, position);

-- ============================================================================
-- STANDINGS TABLE (Season Standings - All Sports)
-- ============================================================================
CREATE TABLE IF NOT EXISTS standings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),
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
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

CREATE INDEX idx_standings_sport_season ON standings(sport, season, season_type);
CREATE INDEX idx_standings_conference ON standings(sport, season, conference, division_rank);
CREATE INDEX idx_standings_updated ON standings(last_updated);

-- ============================================================================
-- GAMES TABLE (Schedules & Scores - All Sports)
-- ============================================================================
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),
    game_id INTEGER NOT NULL,    -- SportsDataIO GameID
    season INTEGER NOT NULL,
    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),
    week INTEGER,                -- NFL/CFB only
    game_date TEXT NOT NULL,
    game_time TEXT,
    status TEXT,                 -- Scheduled, InProgress, Final, Postponed, Canceled
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
    FOREIGN KEY (home_team_id) REFERENCES teams(team_id),
    FOREIGN KEY (away_team_id) REFERENCES teams(team_id)
);

CREATE INDEX idx_games_sport_season ON games(sport, season, season_type);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX idx_games_status ON games(status);

-- ============================================================================
-- TEAM SEASON STATS TABLE (Aggregated Season Stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_season_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),
    season INTEGER NOT NULL,
    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),
    team_id INTEGER NOT NULL,
    team_key TEXT NOT NULL,

    -- Universal stats
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    points_for INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,

    -- Football-specific (NFL/CFB)
    total_yards REAL,
    passing_yards REAL,
    rushing_yards REAL,
    turnovers INTEGER,
    sacks INTEGER,
    third_down_pct REAL,

    -- Baseball-specific (MLB)
    runs_scored INTEGER,
    runs_allowed INTEGER,
    hits INTEGER,
    home_runs INTEGER,
    batting_avg REAL,
    era REAL,
    whip REAL,

    -- Basketball-specific (CBB)
    field_goal_pct REAL,
    three_point_pct REAL,
    free_throw_pct REAL,
    rebounds_per_game REAL,
    assists_per_game REAL,

    stats_json TEXT,  -- Store full JSON for sport-specific stats
    last_updated TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, season, season_type, team_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

CREATE INDEX idx_team_stats_sport_season ON team_season_stats(sport, season, season_type);
CREATE INDEX idx_team_stats_team ON team_season_stats(team_id);

-- ============================================================================
-- PLAYER SEASON STATS TABLE (Aggregated Season Stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_season_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),
    season INTEGER NOT NULL,
    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),
    player_id INTEGER NOT NULL,
    team_id INTEGER,
    player_name TEXT NOT NULL,
    position TEXT,

    -- Universal stats
    games_played INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,

    -- Football-specific (NFL/CFB)
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

    -- Baseball-specific (MLB)
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

    -- Basketball-specific (CBB)
    points_per_game REAL,
    rebounds_per_game REAL,
    assists_per_game REAL,
    field_goal_pct REAL,
    three_point_pct REAL,
    free_throw_pct REAL,

    stats_json TEXT,  -- Store full JSON for all stats
    last_updated TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, season, season_type, player_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

CREATE INDEX idx_player_stats_sport_season ON player_season_stats(sport, season, season_type);
CREATE INDEX idx_player_stats_player ON player_season_stats(player_id);
CREATE INDEX idx_player_stats_team ON player_season_stats(team_id);

-- ============================================================================
-- TEAM GAME STATS TABLE (Per-Game Stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_game_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),
    game_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    team_key TEXT NOT NULL,
    is_home BOOLEAN DEFAULT 0,
    opponent_id INTEGER NOT NULL,

    -- Core stats
    points INTEGER DEFAULT 0,
    opponent_points INTEGER DEFAULT 0,
    won BOOLEAN DEFAULT 0,

    stats_json TEXT,  -- Store full game stats JSON
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, game_id, team_id),
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

CREATE INDEX idx_team_game_stats_game ON team_game_stats(game_id);
CREATE INDEX idx_team_game_stats_team ON team_game_stats(team_id);

-- ============================================================================
-- PLAYER GAME STATS TABLE (Per-Game Stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_game_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    position TEXT,

    stats_json TEXT,  -- Store full player game stats JSON
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sport, game_id, player_id),
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

CREATE INDEX idx_player_game_stats_game ON player_game_stats(game_id);
CREATE INDEX idx_player_game_stats_player ON player_game_stats(player_id);

-- ============================================================================
-- DEPTH CHARTS TABLE (Depth Chart & Injury Status)
-- ============================================================================
CREATE TABLE IF NOT EXISTS depth_charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),
    team_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    position TEXT NOT NULL,
    depth_order INTEGER,  -- 1 = starter, 2 = backup, etc.
    position_category TEXT,  -- Offense, Defense, Special Teams, etc.
    injury_status TEXT,   -- Healthy, Questionable, Doubtful, Out, IR
    injury_body_part TEXT,
    injury_notes TEXT,
    last_updated TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE INDEX idx_depth_charts_team ON depth_charts(team_id, position);
CREATE INDEX idx_depth_charts_player ON depth_charts(player_id);
CREATE INDEX idx_depth_charts_injuries ON depth_charts(injury_status);

-- ============================================================================
-- API SYNC LOG TABLE (Track API Updates & Errors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_sync_log (
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

-- ============================================================================
-- CACHE METADATA TABLE (KV Cache Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cache_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    sport TEXT NOT NULL,
    data_type TEXT NOT NULL,  -- standings, teams, players, games, stats
    season INTEGER,
    week INTEGER,
    ttl_seconds INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_cache_meta_key ON cache_metadata(cache_key);
CREATE INDEX idx_cache_meta_expires ON cache_metadata(expires_at);
CREATE INDEX idx_cache_meta_sport_type ON cache_metadata(sport, data_type);
