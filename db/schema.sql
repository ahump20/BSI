-- ============================================================================
-- BLAZE SPORTS INTEL - D1 DATABASE SCHEMA
-- College Baseball Historical Data
-- ============================================================================
-- Schema Version: 1.0.0
-- Created: 2025-10-16
-- Database: Cloudflare D1 (SQLite)
-- Purpose: Store comprehensive historical college baseball data for trend
--          analysis, predictive modeling, and performance tracking
-- ============================================================================

-- Drop tables in reverse dependency order (for clean migrations)
DROP TABLE IF EXISTS player_season_stats;
DROP TABLE IF EXISTS team_season_stats;
DROP TABLE IF EXISTS pitching_stats;
DROP TABLE IF EXISTS batting_stats;
DROP TABLE IF EXISTS box_scores;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS team_rosters;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS conferences;
DROP TABLE IF EXISTS seasons;

-- ============================================================================
-- REFERENCE TABLES
-- ============================================================================

-- Seasons: Track active college baseball seasons
CREATE TABLE seasons (
    season_id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL UNIQUE,
    start_date TEXT NOT NULL,  -- ISO 8601 format: YYYY-MM-DD
    end_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 0 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seasons_year ON seasons(year);
CREATE INDEX idx_seasons_active ON seasons(is_active);

-- Conferences: NCAA baseball conference metadata
CREATE TABLE conferences (
    conference_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT NOT NULL UNIQUE,
    division TEXT DEFAULT 'D1' CHECK (division IN ('D1', 'D2', 'D3')),
    region TEXT,  -- e.g., 'Southeast', 'West Coast', 'Midwest'
    tournament_bids INTEGER DEFAULT 1,  -- Typical number of NCAA tournament bids
    established_year INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conferences_division ON conferences(division);
CREATE INDEX idx_conferences_abbreviation ON conferences(abbreviation);

-- ============================================================================
-- TEAM TABLES
-- ============================================================================

-- Teams: College baseball programs
CREATE TABLE teams (
    team_id INTEGER PRIMARY KEY AUTOINCREMENT,
    espn_id TEXT UNIQUE,  -- ESPN API team ID
    name TEXT NOT NULL,
    school TEXT NOT NULL,
    abbreviation TEXT,
    mascot TEXT,
    conference_id INTEGER,
    city TEXT,
    state TEXT,
    stadium_name TEXT,
    stadium_capacity INTEGER,
    color TEXT,  -- Primary team color (hex)
    alt_color TEXT,  -- Secondary color (hex)
    logo_url TEXT,
    founded_year INTEGER,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conference_id) REFERENCES conferences(conference_id)
);

CREATE INDEX idx_teams_espn_id ON teams(espn_id);
CREATE INDEX idx_teams_conference ON teams(conference_id);
CREATE INDEX idx_teams_school ON teams(school);
CREATE INDEX idx_teams_active ON teams(is_active);

-- ============================================================================
-- PLAYER TABLES
-- ============================================================================

-- Players: Individual player records
CREATE TABLE players (
    player_id INTEGER PRIMARY KEY AUTOINCREMENT,
    espn_id TEXT UNIQUE,  -- ESPN API player ID
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    jersey_number INTEGER,
    position TEXT,  -- Primary position: P, C, 1B, 2B, 3B, SS, OF, DH
    bats TEXT CHECK (bats IN ('R', 'L', 'S', NULL)),  -- Right, Left, Switch
    throws TEXT CHECK (throws IN ('R', 'L', NULL)),
    height INTEGER,  -- Height in inches
    weight INTEGER,  -- Weight in pounds
    home_town TEXT,
    home_state TEXT,
    high_school TEXT,
    birth_date TEXT,  -- ISO 8601: YYYY-MM-DD
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    draft_team TEXT,  -- MLB team that drafted player
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_espn_id ON players(espn_id);
CREATE INDEX idx_players_last_name ON players(last_name);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_draft_year ON players(draft_year);

-- Team Rosters: Link players to teams by season
CREATE TABLE team_rosters (
    roster_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    season_id INTEGER NOT NULL,
    jersey_number INTEGER,
    class_year TEXT CHECK (class_year IN ('FR', 'SO', 'JR', 'SR', 'RS', NULL)),
    is_redshirt INTEGER DEFAULT 0 CHECK (is_redshirt IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (season_id) REFERENCES seasons(season_id),
    UNIQUE(team_id, player_id, season_id)
);

CREATE INDEX idx_rosters_team_season ON team_rosters(team_id, season_id);
CREATE INDEX idx_rosters_player_season ON team_rosters(player_id, season_id);

-- ============================================================================
-- GAME TABLES
-- ============================================================================

-- Games: Individual game results
CREATE TABLE games (
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    espn_id TEXT UNIQUE,  -- ESPN API game ID
    season_id INTEGER NOT NULL,
    game_date TEXT NOT NULL,  -- ISO 8601: YYYY-MM-DD
    game_time TEXT,  -- HH:MM (24-hour format)
    week_number INTEGER,

    -- Teams
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,

    -- Scores
    home_score INTEGER,
    away_score INTEGER,
    innings INTEGER DEFAULT 9,  -- Total innings played (9 or more for extra innings)

    -- Game Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'final', 'postponed', 'cancelled')),
    is_conference_game INTEGER DEFAULT 0 CHECK (is_conference_game IN (0, 1)),
    is_tournament_game INTEGER DEFAULT 0 CHECK (is_tournament_game IN (0, 1)),
    tournament_name TEXT,  -- e.g., 'College World Series', 'Regional'

    -- Venue
    venue_name TEXT,
    venue_city TEXT,
    venue_state TEXT,
    attendance INTEGER,
    weather_condition TEXT,
    temperature INTEGER,

    -- Broadcasts
    broadcast_network TEXT,

    -- Metadata
    winning_team_id INTEGER,
    winning_pitcher_id INTEGER,
    losing_pitcher_id INTEGER,
    save_pitcher_id INTEGER,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (season_id) REFERENCES seasons(season_id),
    FOREIGN KEY (home_team_id) REFERENCES teams(team_id),
    FOREIGN KEY (away_team_id) REFERENCES teams(team_id),
    FOREIGN KEY (winning_team_id) REFERENCES teams(team_id),
    FOREIGN KEY (winning_pitcher_id) REFERENCES players(player_id),
    FOREIGN KEY (losing_pitcher_id) REFERENCES players(player_id),
    FOREIGN KEY (save_pitcher_id) REFERENCES players(player_id),

    CHECK (home_team_id != away_team_id)
);

CREATE INDEX idx_games_espn_id ON games(espn_id);
CREATE INDEX idx_games_season ON games(season_id);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_home_team ON games(home_team_id);
CREATE INDEX idx_games_away_team ON games(away_team_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_conference ON games(is_conference_game);

-- ============================================================================
-- BOX SCORE TABLES
-- ============================================================================

-- Box Scores: Game-level aggregated statistics
CREATE TABLE box_scores (
    box_score_id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL UNIQUE,

    -- Home Team Totals
    home_runs INTEGER DEFAULT 0,
    home_hits INTEGER DEFAULT 0,
    home_errors INTEGER DEFAULT 0,
    home_left_on_base INTEGER DEFAULT 0,
    home_doubles INTEGER DEFAULT 0,
    home_triples INTEGER DEFAULT 0,
    home_home_runs INTEGER DEFAULT 0,
    home_walks INTEGER DEFAULT 0,
    home_strikeouts INTEGER DEFAULT 0,
    home_stolen_bases INTEGER DEFAULT 0,
    home_caught_stealing INTEGER DEFAULT 0,

    -- Away Team Totals
    away_runs INTEGER DEFAULT 0,
    away_hits INTEGER DEFAULT 0,
    away_errors INTEGER DEFAULT 0,
    away_left_on_base INTEGER DEFAULT 0,
    away_doubles INTEGER DEFAULT 0,
    away_triples INTEGER DEFAULT 0,
    away_home_runs INTEGER DEFAULT 0,
    away_walks INTEGER DEFAULT 0,
    away_strikeouts INTEGER DEFAULT 0,
    away_stolen_bases INTEGER DEFAULT 0,
    away_caught_stealing INTEGER DEFAULT 0,

    -- Inning-by-inning scoring (stored as JSON array)
    home_innings TEXT,  -- e.g., '[0,1,0,2,0,0,1,0,0]'
    away_innings TEXT,  -- e.g., '[1,0,1,0,0,1,0,0,0]'

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

CREATE INDEX idx_box_scores_game ON box_scores(game_id);

-- ============================================================================
-- PLAYER PERFORMANCE TABLES
-- ============================================================================

-- Batting Stats: Individual batting performances per game
CREATE TABLE batting_stats (
    batting_stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,

    -- Batting Performance
    at_bats INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    doubles INTEGER DEFAULT 0,
    triples INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    rbi INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    caught_stealing INTEGER DEFAULT 0,
    hit_by_pitch INTEGER DEFAULT 0,
    sacrifice_flies INTEGER DEFAULT 0,
    sacrifice_bunts INTEGER DEFAULT 0,

    -- Batting Order
    batting_order INTEGER,  -- 1-9 or NULL if did not start

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),

    UNIQUE(game_id, player_id)
);

CREATE INDEX idx_batting_stats_game ON batting_stats(game_id);
CREATE INDEX idx_batting_stats_player ON batting_stats(player_id);
CREATE INDEX idx_batting_stats_team ON batting_stats(team_id);

-- Pitching Stats: Individual pitching performances per game
CREATE TABLE pitching_stats (
    pitching_stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,

    -- Pitching Performance
    innings_pitched REAL DEFAULT 0.0,  -- Stored as decimal (e.g., 5.2 = 5 2/3 innings)
    hits_allowed INTEGER DEFAULT 0,
    runs_allowed INTEGER DEFAULT 0,
    earned_runs INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    home_runs_allowed INTEGER DEFAULT 0,
    hit_batters INTEGER DEFAULT 0,
    wild_pitches INTEGER DEFAULT 0,
    balks INTEGER DEFAULT 0,

    -- Pitch Counts
    pitches_thrown INTEGER,
    strikes INTEGER,

    -- Decision
    decision TEXT CHECK (decision IN ('W', 'L', 'S', 'H', NULL)),  -- Win, Loss, Save, Hold

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),

    UNIQUE(game_id, player_id)
);

CREATE INDEX idx_pitching_stats_game ON pitching_stats(game_id);
CREATE INDEX idx_pitching_stats_player ON pitching_stats(player_id);
CREATE INDEX idx_pitching_stats_team ON pitching_stats(team_id);
CREATE INDEX idx_pitching_stats_decision ON pitching_stats(decision);

-- ============================================================================
-- SEASON AGGREGATE TABLES
-- ============================================================================

-- Team Season Stats: Aggregated team statistics per season
CREATE TABLE team_season_stats (
    team_season_stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    season_id INTEGER NOT NULL,

    -- Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    conference_wins INTEGER DEFAULT 0,
    conference_losses INTEGER DEFAULT 0,
    home_wins INTEGER DEFAULT 0,
    home_losses INTEGER DEFAULT 0,
    away_wins INTEGER DEFAULT 0,
    away_losses INTEGER DEFAULT 0,

    -- Offensive Stats
    runs_scored INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    doubles INTEGER DEFAULT 0,
    triples INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    rbi INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    batting_average REAL,
    on_base_percentage REAL,
    slugging_percentage REAL,

    -- Pitching Stats
    runs_allowed INTEGER DEFAULT 0,
    earned_runs_allowed INTEGER DEFAULT 0,
    innings_pitched REAL DEFAULT 0.0,
    hits_allowed INTEGER DEFAULT 0,
    walks_allowed INTEGER DEFAULT 0,
    strikeouts_recorded INTEGER DEFAULT 0,
    team_era REAL,

    -- Advanced Metrics
    rpi REAL,  -- RPI rating
    strength_of_schedule REAL,
    pythagorean_wins REAL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (season_id) REFERENCES seasons(season_id),

    UNIQUE(team_id, season_id)
);

CREATE INDEX idx_team_season_stats_team ON team_season_stats(team_id);
CREATE INDEX idx_team_season_stats_season ON team_season_stats(season_id);
CREATE INDEX idx_team_season_stats_wins ON team_season_stats(wins);

-- Player Season Stats: Aggregated player statistics per season
CREATE TABLE player_season_stats (
    player_season_stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    season_id INTEGER NOT NULL,

    -- Batting Stats (for position players)
    games_played INTEGER DEFAULT 0,
    at_bats INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    doubles INTEGER DEFAULT 0,
    triples INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    rbi INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    batting_average REAL,
    on_base_percentage REAL,
    slugging_percentage REAL,

    -- Pitching Stats (for pitchers)
    games_pitched INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    innings_pitched REAL DEFAULT 0.0,
    hits_allowed INTEGER DEFAULT 0,
    runs_allowed INTEGER DEFAULT 0,
    earned_runs INTEGER DEFAULT 0,
    walks_allowed INTEGER DEFAULT 0,
    strikeouts_recorded INTEGER DEFAULT 0,
    era REAL,
    whip REAL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (season_id) REFERENCES seasons(season_id),

    UNIQUE(player_id, team_id, season_id)
);

CREATE INDEX idx_player_season_stats_player ON player_season_stats(player_id);
CREATE INDEX idx_player_season_stats_team ON player_season_stats(team_id);
CREATE INDEX idx_player_season_stats_season ON player_season_stats(season_id);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active Teams with Conference Info
CREATE VIEW v_active_teams AS
SELECT
    t.team_id,
    t.espn_id,
    t.name,
    t.school,
    t.abbreviation,
    t.mascot,
    c.name AS conference_name,
    c.abbreviation AS conference_abbr,
    c.division,
    t.city,
    t.state,
    t.stadium_name
FROM teams t
LEFT JOIN conferences c ON t.conference_id = c.conference_id
WHERE t.is_active = 1;

-- Current Season Games
CREATE VIEW v_current_season_games AS
SELECT
    g.game_id,
    g.espn_id,
    g.game_date,
    g.game_time,
    ht.name AS home_team,
    at.name AS away_team,
    g.home_score,
    g.away_score,
    g.innings,
    g.status,
    g.venue_name,
    s.year AS season
FROM games g
JOIN teams ht ON g.home_team_id = ht.team_id
JOIN teams at ON g.away_team_id = at.team_id
JOIN seasons s ON g.season_id = s.season_id
WHERE s.is_active = 1;

-- Team Records by Season
CREATE VIEW v_team_records AS
SELECT
    t.name AS team_name,
    s.year AS season,
    tss.wins,
    tss.losses,
    tss.games_played,
    ROUND(CAST(tss.wins AS REAL) / NULLIF(tss.games_played, 0), 3) AS win_percentage,
    tss.conference_wins,
    tss.conference_losses,
    tss.rpi
FROM team_season_stats tss
JOIN teams t ON tss.team_id = t.team_id
JOIN seasons s ON tss.season_id = s.season_id
ORDER BY s.year DESC, tss.wins DESC;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE TRIGGER update_seasons_timestamp
AFTER UPDATE ON seasons
FOR EACH ROW
BEGIN
    UPDATE seasons SET updated_at = CURRENT_TIMESTAMP WHERE season_id = NEW.season_id;
END;

CREATE TRIGGER update_conferences_timestamp
AFTER UPDATE ON conferences
FOR EACH ROW
BEGIN
    UPDATE conferences SET updated_at = CURRENT_TIMESTAMP WHERE conference_id = NEW.conference_id;
END;

CREATE TRIGGER update_teams_timestamp
AFTER UPDATE ON teams
FOR EACH ROW
BEGIN
    UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE team_id = NEW.team_id;
END;

CREATE TRIGGER update_players_timestamp
AFTER UPDATE ON players
FOR EACH ROW
BEGIN
    UPDATE players SET updated_at = CURRENT_TIMESTAMP WHERE player_id = NEW.player_id;
END;

CREATE TRIGGER update_games_timestamp
AFTER UPDATE ON games
FOR EACH ROW
BEGIN
    UPDATE games SET updated_at = CURRENT_TIMESTAMP WHERE game_id = NEW.game_id;
END;

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

CREATE TABLE schema_version (
    version TEXT PRIMARY KEY,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial college baseball historical data schema');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
