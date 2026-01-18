-- College Baseball Extended Schema Migration
-- Adds tables for games, teams, players, and box scores
-- Part of the multi-source college baseball API integration
--
-- Author: BSI Team
-- Created: 2025-01-16

-- =============================================================================
-- TEAMS TABLE
-- =============================================================================
-- Stores team information from NCAA, ESPN, Highlightly APIs
-- Master reference for team normalization across sources

CREATE TABLE IF NOT EXISTS college_baseball_teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Identifiers (multiple sources)
    team_id TEXT NOT NULL UNIQUE,          -- BSI normalized ID (lowercase abbreviation)
    ncaa_id TEXT,                          -- NCAA.com team ID
    espn_id TEXT,                          -- ESPN team ID
    highlightly_id INTEGER,                -- Highlightly API team ID

    -- Basic Info
    team_name TEXT NOT NULL,               -- Full display name (e.g., "Texas Longhorns")
    location TEXT,                         -- City/University name (e.g., "Texas")
    nickname TEXT,                         -- Team nickname (e.g., "Longhorns")
    abbreviation TEXT,                     -- Short code (e.g., "TEX")
    team_logo TEXT,                        -- Primary logo URL

    -- Conference
    conference TEXT,                       -- Conference name (normalized)
    conference_id TEXT,                    -- Conference ID (if available)
    division TEXT DEFAULT 'D1',            -- NCAA division (D1, D2, D3)

    -- Colors & Branding
    primary_color TEXT,                    -- Hex color code
    secondary_color TEXT,                  -- Hex color code

    -- Location
    venue_name TEXT,                       -- Home stadium name
    venue_city TEXT,                       -- Stadium city
    venue_state TEXT,                      -- Stadium state
    venue_capacity INTEGER,                -- Stadium capacity

    -- Metadata
    is_active INTEGER DEFAULT 1,           -- 1 = active, 0 = inactive
    data_source TEXT NOT NULL,             -- Primary data source (ncaa-api, espn, highlightly)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cbb_teams_conference ON college_baseball_teams(conference);
CREATE INDEX IF NOT EXISTS idx_cbb_teams_division ON college_baseball_teams(division);
CREATE INDEX IF NOT EXISTS idx_cbb_teams_ncaa_id ON college_baseball_teams(ncaa_id);
CREATE INDEX IF NOT EXISTS idx_cbb_teams_espn_id ON college_baseball_teams(espn_id);

-- =============================================================================
-- GAMES TABLE
-- =============================================================================
-- Stores game/match information with live score tracking
-- Updated via cron jobs and on-demand refreshes

CREATE TABLE IF NOT EXISTS college_baseball_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Identifiers (multiple sources)
    game_id TEXT NOT NULL UNIQUE,          -- BSI normalized game ID
    ncaa_game_id TEXT,                     -- NCAA.com game ID
    espn_event_id TEXT,                    -- ESPN event ID
    highlightly_match_id INTEGER,          -- Highlightly match ID

    -- Teams
    home_team_id TEXT NOT NULL,            -- References college_baseball_teams.team_id
    away_team_id TEXT NOT NULL,            -- References college_baseball_teams.team_id
    home_team_name TEXT NOT NULL,          -- Cached team name for quick display
    away_team_name TEXT NOT NULL,          -- Cached team name for quick display
    home_team_logo TEXT,                   -- Cached logo URL
    away_team_logo TEXT,                   -- Cached logo URL
    home_team_rank INTEGER,                -- Current ranking (if ranked)
    away_team_rank INTEGER,                -- Current ranking (if ranked)

    -- Scores
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    home_hits INTEGER DEFAULT 0,
    away_hits INTEGER DEFAULT 0,
    home_errors INTEGER DEFAULT 0,
    away_errors INTEGER DEFAULT 0,

    -- Game Status
    status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, final, postponed, cancelled
    period INTEGER,                        -- Current inning (1-9+)
    period_half TEXT,                      -- 'top' or 'bottom'
    clock TEXT,                            -- Display clock if applicable
    outs INTEGER DEFAULT 0,                -- Current outs (0-3)
    on_first INTEGER DEFAULT 0,            -- 1 if runner on first
    on_second INTEGER DEFAULT 0,           -- 1 if runner on second
    on_third INTEGER DEFAULT 0,            -- 1 if runner on third

    -- Linescore (JSON array of inning scores)
    home_linescore TEXT,                   -- JSON: [1, 0, 2, 0, 1, ...]
    away_linescore TEXT,                   -- JSON: [0, 0, 0, 1, 0, ...]

    -- Schedule Info
    scheduled_date TEXT NOT NULL,          -- YYYY-MM-DD
    scheduled_time TEXT,                   -- HH:MM (local time)
    start_timestamp INTEGER,               -- Unix timestamp of start time

    -- Venue
    venue_name TEXT,
    venue_city TEXT,
    venue_state TEXT,
    attendance INTEGER,

    -- Broadcast
    broadcasts TEXT,                       -- JSON array of broadcast info

    -- Conference/Tournament
    conference TEXT,                       -- If conference game
    tournament TEXT,                       -- If tournament game (e.g., "CWS")
    is_conference_game INTEGER DEFAULT 0,
    is_neutral_site INTEGER DEFAULT 0,

    -- Weather (if available)
    weather_temp INTEGER,                  -- Temperature in F
    weather_condition TEXT,                -- e.g., "Sunny", "Partly Cloudy"
    weather_wind TEXT,                     -- e.g., "10 mph SW"

    -- Season Info
    season INTEGER NOT NULL,               -- Year (e.g., 2025)
    week INTEGER,                          -- Week number

    -- Metadata
    data_source TEXT NOT NULL,             -- Primary data source
    last_play TEXT,                        -- Description of last play
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cbb_games_date ON college_baseball_games(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cbb_games_status ON college_baseball_games(status);
CREATE INDEX IF NOT EXISTS idx_cbb_games_home_team ON college_baseball_games(home_team_id);
CREATE INDEX IF NOT EXISTS idx_cbb_games_away_team ON college_baseball_games(away_team_id);
CREATE INDEX IF NOT EXISTS idx_cbb_games_season ON college_baseball_games(season);
CREATE INDEX IF NOT EXISTS idx_cbb_games_conference ON college_baseball_games(conference);
CREATE INDEX IF NOT EXISTS idx_cbb_games_ncaa_id ON college_baseball_games(ncaa_game_id);
CREATE INDEX IF NOT EXISTS idx_cbb_games_espn_id ON college_baseball_games(espn_event_id);

-- =============================================================================
-- PLAYERS TABLE
-- =============================================================================
-- Stores player information and season statistics
-- Updated daily during season

CREATE TABLE IF NOT EXISTS college_baseball_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Identifiers
    player_id TEXT NOT NULL,               -- BSI normalized player ID
    ncaa_player_id TEXT,                   -- NCAA player ID
    espn_player_id TEXT,                   -- ESPN player ID
    highlightly_player_id INTEGER,         -- Highlightly player ID

    -- Basic Info
    player_name TEXT NOT NULL,             -- Full name
    first_name TEXT,
    last_name TEXT,
    jersey_number TEXT,
    position TEXT,                         -- Primary position (e.g., "P", "C", "1B")
    bats TEXT,                             -- "L", "R", "S" (switch)
    throws TEXT,                           -- "L", "R"

    -- Physical
    height TEXT,                           -- e.g., "6-2"
    weight INTEGER,                        -- lbs

    -- Academic
    year TEXT,                             -- Fr, So, Jr, Sr, Gr
    eligibility_year INTEGER,              -- Years of eligibility remaining

    -- Team
    team_id TEXT NOT NULL,                 -- References college_baseball_teams.team_id
    team_name TEXT,                        -- Cached team name

    -- Headshot
    headshot_url TEXT,

    -- Hometown
    hometown TEXT,
    home_state TEXT,
    high_school TEXT,

    -- Season
    season INTEGER NOT NULL,

    -- Metadata
    data_source TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_cbb_players_team ON college_baseball_players(team_id);
CREATE INDEX IF NOT EXISTS idx_cbb_players_position ON college_baseball_players(position);
CREATE INDEX IF NOT EXISTS idx_cbb_players_season ON college_baseball_players(season);
CREATE INDEX IF NOT EXISTS idx_cbb_players_name ON college_baseball_players(player_name);

-- =============================================================================
-- PLAYER BATTING STATS TABLE
-- =============================================================================
-- Season batting statistics for players

CREATE TABLE IF NOT EXISTS college_baseball_player_batting (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    player_id TEXT NOT NULL,               -- References college_baseball_players.player_id
    team_id TEXT NOT NULL,                 -- References college_baseball_teams.team_id
    season INTEGER NOT NULL,

    -- Games
    games INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,

    -- Plate Appearances
    plate_appearances INTEGER DEFAULT 0,
    at_bats INTEGER DEFAULT 0,

    -- Hits
    runs INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    doubles INTEGER DEFAULT 0,
    triples INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    rbi INTEGER DEFAULT 0,

    -- Discipline
    walks INTEGER DEFAULT 0,
    intentional_walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    hit_by_pitch INTEGER DEFAULT 0,
    sacrifice_hits INTEGER DEFAULT 0,
    sacrifice_flies INTEGER DEFAULT 0,

    -- Baserunning
    stolen_bases INTEGER DEFAULT 0,
    caught_stealing INTEGER DEFAULT 0,

    -- Calculated Stats (stored for query efficiency)
    batting_average REAL,                  -- Calculated: H / AB
    on_base_percentage REAL,               -- OBP
    slugging_percentage REAL,              -- SLG
    ops REAL,                              -- OBP + SLG

    -- Advanced (if available)
    total_bases INTEGER DEFAULT 0,
    ground_into_double_play INTEGER DEFAULT 0,

    -- Metadata
    data_source TEXT NOT NULL,
    stat_rank INTEGER,                     -- Rank in league for primary stat
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_cbb_batting_player ON college_baseball_player_batting(player_id);
CREATE INDEX IF NOT EXISTS idx_cbb_batting_team ON college_baseball_player_batting(team_id);
CREATE INDEX IF NOT EXISTS idx_cbb_batting_season ON college_baseball_player_batting(season);
CREATE INDEX IF NOT EXISTS idx_cbb_batting_avg ON college_baseball_player_batting(batting_average DESC);
CREATE INDEX IF NOT EXISTS idx_cbb_batting_hr ON college_baseball_player_batting(home_runs DESC);

-- =============================================================================
-- PLAYER PITCHING STATS TABLE
-- =============================================================================
-- Season pitching statistics for players

CREATE TABLE IF NOT EXISTS college_baseball_player_pitching (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    player_id TEXT NOT NULL,               -- References college_baseball_players.player_id
    team_id TEXT NOT NULL,                 -- References college_baseball_teams.team_id
    season INTEGER NOT NULL,

    -- Games
    games INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,
    complete_games INTEGER DEFAULT 0,
    shutouts INTEGER DEFAULT 0,

    -- Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    holds INTEGER DEFAULT 0,
    blown_saves INTEGER DEFAULT 0,

    -- Innings
    innings_pitched REAL DEFAULT 0,        -- e.g., 45.2 = 45 and 2/3 innings

    -- Batters Faced
    batters_faced INTEGER DEFAULT 0,
    hits_allowed INTEGER DEFAULT 0,
    runs_allowed INTEGER DEFAULT 0,
    earned_runs INTEGER DEFAULT 0,
    home_runs_allowed INTEGER DEFAULT 0,

    -- Discipline
    walks INTEGER DEFAULT 0,
    intentional_walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    hit_batters INTEGER DEFAULT 0,
    wild_pitches INTEGER DEFAULT 0,
    balks INTEGER DEFAULT 0,

    -- Calculated Stats
    era REAL,                              -- Earned Run Average
    whip REAL,                             -- Walks + Hits per IP
    strikeouts_per_nine REAL,              -- K/9
    walks_per_nine REAL,                   -- BB/9
    hits_per_nine REAL,                    -- H/9
    strikeout_walk_ratio REAL,             -- K/BB
    opponent_batting_avg REAL,             -- Opponent BA

    -- Pitch Counts (if available)
    total_pitches INTEGER,
    total_strikes INTEGER,
    strike_percentage REAL,

    -- Metadata
    data_source TEXT NOT NULL,
    stat_rank INTEGER,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_cbb_pitching_player ON college_baseball_player_pitching(player_id);
CREATE INDEX IF NOT EXISTS idx_cbb_pitching_team ON college_baseball_player_pitching(team_id);
CREATE INDEX IF NOT EXISTS idx_cbb_pitching_season ON college_baseball_player_pitching(season);
CREATE INDEX IF NOT EXISTS idx_cbb_pitching_era ON college_baseball_player_pitching(era ASC);
CREATE INDEX IF NOT EXISTS idx_cbb_pitching_wins ON college_baseball_player_pitching(wins DESC);

-- =============================================================================
-- BOX SCORES TABLE
-- =============================================================================
-- Detailed box score data for completed games

CREATE TABLE IF NOT EXISTS college_baseball_box_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    game_id TEXT NOT NULL UNIQUE,          -- References college_baseball_games.game_id

    -- Team Totals
    home_runs INTEGER DEFAULT 0,
    home_hits INTEGER DEFAULT 0,
    home_errors INTEGER DEFAULT 0,
    home_lob INTEGER DEFAULT 0,            -- Left on base

    away_runs INTEGER DEFAULT 0,
    away_hits INTEGER DEFAULT 0,
    away_errors INTEGER DEFAULT 0,
    away_lob INTEGER DEFAULT 0,

    -- Linescore (JSON)
    linescore TEXT,                        -- JSON with inning-by-inning scores

    -- Batting Lines (JSON arrays)
    home_batting TEXT,                     -- JSON array of batting lines
    away_batting TEXT,                     -- JSON array of batting lines

    -- Pitching Lines (JSON arrays)
    home_pitching TEXT,                    -- JSON array of pitching lines
    away_pitching TEXT,                    -- JSON array of pitching lines

    -- Game Notes
    winning_pitcher TEXT,
    losing_pitcher TEXT,
    save_pitcher TEXT,

    -- Plays (if available)
    plays TEXT,                            -- JSON array of plays

    -- Game Info
    duration TEXT,                         -- Game duration (e.g., "2:45")
    attendance INTEGER,
    umpires TEXT,                          -- JSON with umpire names

    -- Metadata
    data_source TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cbb_boxscores_game ON college_baseball_box_scores(game_id);

-- =============================================================================
-- API SOURCE TRACKING TABLE
-- =============================================================================
-- Tracks API source health and data freshness

CREATE TABLE IF NOT EXISTS college_baseball_api_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    source_name TEXT NOT NULL UNIQUE,      -- 'ncaa-api', 'espn', 'highlightly'
    source_type TEXT NOT NULL,             -- 'primary', 'secondary', 'backup'
    priority INTEGER NOT NULL,             -- 1 = highest priority

    -- Status
    is_enabled INTEGER DEFAULT 1,
    is_healthy INTEGER DEFAULT 1,

    -- Rate Limiting
    rate_limit_remaining INTEGER,
    rate_limit_reset TEXT,                 -- ISO timestamp

    -- Sync Status
    last_sync_success TEXT,                -- ISO timestamp
    last_sync_error TEXT,
    consecutive_failures INTEGER DEFAULT 0,

    -- Statistics
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,

    -- Configuration
    api_base_url TEXT,
    requires_auth INTEGER DEFAULT 0,

    -- Metadata
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert default API sources
INSERT OR IGNORE INTO college_baseball_api_sources (source_name, source_type, priority, api_base_url, requires_auth)
VALUES
    ('ncaa-api', 'primary', 1, 'https://ncaa-api.henrygd.me', 0),
    ('espn', 'secondary', 2, 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball', 0),
    ('highlightly', 'premium', 3, 'https://mlb-college-baseball-api.p.rapidapi.com', 1);

-- =============================================================================
-- DATA SYNC LOG TABLE
-- =============================================================================
-- Tracks all sync operations for monitoring and debugging

CREATE TABLE IF NOT EXISTS college_baseball_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    sync_type TEXT NOT NULL,               -- 'games', 'rankings', 'standings', 'players', 'boxscores'
    data_source TEXT NOT NULL,             -- Which API source was used

    -- Results
    success INTEGER NOT NULL,              -- 1 = success, 0 = failure
    records_fetched INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,

    -- Timing
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_ms INTEGER,

    -- Validation
    validation_status TEXT,                -- 'valid', 'invalid', 'unavailable'
    validation_reason TEXT,

    -- Error Tracking
    error_message TEXT,
    error_stack TEXT,

    -- Context
    triggered_by TEXT,                     -- 'cron', 'manual', 'webhook'
    worker_version TEXT
);

CREATE INDEX IF NOT EXISTS idx_cbb_sync_type ON college_baseball_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_cbb_sync_source ON college_baseball_sync_log(data_source);
CREATE INDEX IF NOT EXISTS idx_cbb_sync_success ON college_baseball_sync_log(success);
CREATE INDEX IF NOT EXISTS idx_cbb_sync_started ON college_baseball_sync_log(started_at DESC);
