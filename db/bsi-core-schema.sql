-- ============================================================================
-- BSI CORE DATABASE SCHEMA
-- Multi-sport Analytics Platform
-- ============================================================================
-- Schema Version: 1.0.0
-- Created: 2025-11-29
-- Database: Cloudflare D1 (SQLite)
-- Purpose: Core database for BSI platform with predictions, odds, and scores
-- ============================================================================

-- Drop tables in reverse dependency order (for clean migrations)
DROP TABLE IF EXISTS prediction_outcomes;
DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS game_odds;
DROP TABLE IF EXISTS live_scores;
DROP TABLE IF EXISTS stats;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS leagues;
DROP TABLE IF EXISTS schema_version;

-- ============================================================================
-- REFERENCE TABLES
-- ============================================================================

-- Leagues: Supported sports leagues
CREATE TABLE leagues (
    league_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,           -- 'MLB', 'NFL', 'NCAAB', 'NCAAF', etc.
    name TEXT NOT NULL,                   -- 'Major League Baseball'
    sport TEXT NOT NULL,                  -- 'baseball', 'football', 'basketball'
    level TEXT DEFAULT 'professional',    -- 'professional', 'college'
    country TEXT DEFAULT 'USA',
    api_source TEXT,                      -- 'espn', 'sportsdataio', 'sportsradar'
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leagues_code ON leagues(code);
CREATE INDEX idx_leagues_sport ON leagues(sport);
CREATE INDEX idx_leagues_active ON leagues(is_active);

-- ============================================================================
-- TEAM TABLES
-- ============================================================================

-- Teams: All teams across leagues
CREATE TABLE teams (
    team_id INTEGER PRIMARY KEY AUTOINCREMENT,
    league_id INTEGER NOT NULL,
    external_id TEXT,                     -- ESPN/SportsDataIO team ID
    name TEXT NOT NULL,
    abbreviation TEXT,
    city TEXT,
    state TEXT,
    mascot TEXT,
    conference TEXT,
    division TEXT,
    primary_color TEXT,                   -- Hex color
    secondary_color TEXT,                 -- Hex color
    logo_url TEXT,
    stadium_name TEXT,
    stadium_capacity INTEGER,
    latitude REAL,
    longitude REAL,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(league_id),
    UNIQUE(league_id, external_id)
);

CREATE INDEX idx_teams_league ON teams(league_id);
CREATE INDEX idx_teams_external_id ON teams(external_id);
CREATE INDEX idx_teams_abbreviation ON teams(abbreviation);
CREATE INDEX idx_teams_conference ON teams(conference);
CREATE INDEX idx_teams_active ON teams(is_active);

-- ============================================================================
-- PLAYER TABLES
-- ============================================================================

-- Players: Individual player records
CREATE TABLE players (
    player_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    external_id TEXT,                     -- ESPN/SportsDataIO player ID
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    jersey_number INTEGER,
    position TEXT,
    height_inches INTEGER,
    weight_lbs INTEGER,
    birth_date TEXT,                      -- ISO 8601: YYYY-MM-DD
    college TEXT,
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    years_experience INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',         -- 'active', 'injured', 'inactive', 'retired'
    headshot_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_external_id ON players(external_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_status ON players(status);

-- ============================================================================
-- GAME TABLES
-- ============================================================================

-- Games: Scheduled and completed games
CREATE TABLE games (
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    league_id INTEGER NOT NULL,
    external_id TEXT,                     -- ESPN/SportsDataIO game ID
    season INTEGER NOT NULL,              -- Year (e.g., 2025)
    season_type TEXT DEFAULT 'regular',   -- 'preseason', 'regular', 'postseason'
    week INTEGER,                         -- NFL week, null for other sports
    game_date TEXT NOT NULL,              -- ISO 8601: YYYY-MM-DD
    game_time TEXT,                       -- HH:MM (24-hour, local time)
    game_time_utc TEXT,                   -- Full ISO timestamp in UTC
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    status TEXT DEFAULT 'scheduled',      -- 'scheduled', 'in_progress', 'final', 'postponed', 'cancelled'
    period INTEGER,                       -- Current inning/quarter/half
    clock TEXT,                           -- Time remaining in period
    venue_name TEXT,
    venue_city TEXT,
    venue_state TEXT,
    attendance INTEGER,
    weather_condition TEXT,
    temperature_f INTEGER,
    wind_mph INTEGER,
    broadcast_network TEXT,
    is_neutral_site INTEGER DEFAULT 0 CHECK (is_neutral_site IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(league_id),
    FOREIGN KEY (home_team_id) REFERENCES teams(team_id),
    FOREIGN KEY (away_team_id) REFERENCES teams(team_id),
    UNIQUE(league_id, external_id),
    CHECK (home_team_id != away_team_id)
);

CREATE INDEX idx_games_league ON games(league_id);
CREATE INDEX idx_games_external_id ON games(external_id);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_season ON games(season, season_type);
CREATE INDEX idx_games_home_team ON games(home_team_id);
CREATE INDEX idx_games_away_team ON games(away_team_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_week ON games(week);

-- ============================================================================
-- LIVE SCORES TABLE
-- ============================================================================

-- Live Scores: Real-time score updates
CREATE TABLE live_scores (
    score_id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL UNIQUE,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    period INTEGER DEFAULT 1,
    clock TEXT,
    possession TEXT,                      -- 'home' or 'away'
    last_play TEXT,                       -- Description of last play
    situation TEXT,                       -- e.g., "1st & 10 at NYG 35"
    home_timeouts INTEGER,
    away_timeouts INTEGER,
    scoring_summary TEXT,                 -- JSON array of scoring plays
    period_scores TEXT,                   -- JSON: {"home": [7,3,7,0], "away": [0,10,3,7]}
    win_probability_home REAL,            -- Current win probability 0-1
    is_final INTEGER DEFAULT 0 CHECK (is_final IN (0, 1)),
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

CREATE INDEX idx_live_scores_game ON live_scores(game_id);
CREATE INDEX idx_live_scores_updated ON live_scores(last_updated);

-- ============================================================================
-- STATS TABLE
-- ============================================================================

-- Stats: Aggregated team and player statistics
CREATE TABLE stats (
    stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,            -- 'team' or 'player'
    entity_id INTEGER NOT NULL,           -- team_id or player_id
    league_id INTEGER NOT NULL,
    season INTEGER NOT NULL,
    season_type TEXT DEFAULT 'regular',
    stat_type TEXT NOT NULL,              -- 'batting', 'pitching', 'passing', 'rushing', etc.
    games_played INTEGER DEFAULT 0,

    -- Universal stats (JSON for flexibility across sports)
    stats_json TEXT NOT NULL,             -- Sport-specific stats as JSON

    -- Computed aggregates
    points_per_game REAL,
    yards_per_game REAL,
    batting_average REAL,
    era REAL,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(league_id),
    UNIQUE(entity_type, entity_id, league_id, season, season_type, stat_type)
);

CREATE INDEX idx_stats_entity ON stats(entity_type, entity_id);
CREATE INDEX idx_stats_league_season ON stats(league_id, season);
CREATE INDEX idx_stats_type ON stats(stat_type);

-- ============================================================================
-- GAME ODDS TABLE
-- ============================================================================

-- Game Odds: Betting lines from TheOdds API and other sources
CREATE TABLE game_odds (
    odds_id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    sportsbook TEXT NOT NULL,             -- 'draftkings', 'fanduel', 'betmgm', etc.
    odds_type TEXT NOT NULL,              -- 'spread', 'moneyline', 'total'

    -- Spread odds
    home_spread REAL,
    away_spread REAL,
    spread_home_price INTEGER,            -- American odds: -110, +105, etc.
    spread_away_price INTEGER,

    -- Moneyline odds
    home_moneyline INTEGER,
    away_moneyline INTEGER,

    -- Total (Over/Under)
    total_line REAL,
    over_price INTEGER,
    under_price INTEGER,

    -- Opening lines for comparison
    opening_spread REAL,
    opening_total REAL,
    opening_home_ml INTEGER,
    opening_away_ml INTEGER,

    -- Metadata
    captured_at TEXT DEFAULT CURRENT_TIMESTAMP,
    source_api TEXT DEFAULT 'theoddsapi',
    is_live INTEGER DEFAULT 0 CHECK (is_live IN (0, 1)),

    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

CREATE INDEX idx_odds_game ON game_odds(game_id);
CREATE INDEX idx_odds_sportsbook ON game_odds(sportsbook);
CREATE INDEX idx_odds_type ON game_odds(odds_type);
CREATE INDEX idx_odds_captured ON game_odds(captured_at);
CREATE INDEX idx_odds_live ON game_odds(is_live);

-- ============================================================================
-- PREDICTIONS TABLE
-- ============================================================================

-- Predictions: AI/ML model predictions for games
CREATE TABLE predictions (
    prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    model_name TEXT NOT NULL,             -- 'bsi-monte-carlo', 'bsi-neural-v1', etc.
    model_version TEXT NOT NULL,          -- Semantic version: '1.0.0'

    -- Win probabilities
    home_win_prob REAL NOT NULL CHECK (home_win_prob >= 0 AND home_win_prob <= 1),
    away_win_prob REAL NOT NULL CHECK (away_win_prob >= 0 AND away_win_prob <= 1),

    -- Score predictions
    predicted_home_score REAL,
    predicted_away_score REAL,
    predicted_total REAL,

    -- Spread predictions
    predicted_spread REAL,                -- Negative means home favored
    spread_confidence REAL CHECK (spread_confidence >= 0 AND spread_confidence <= 1),

    -- Confidence intervals
    confidence_level REAL DEFAULT 0.95,   -- 95% confidence interval
    home_score_lower REAL,
    home_score_upper REAL,
    away_score_lower REAL,
    away_score_upper REAL,

    -- Model metadata
    features_used TEXT,                   -- JSON array of feature names
    feature_importance TEXT,              -- JSON object of feature weights
    simulation_count INTEGER,             -- Number of Monte Carlo simulations

    -- Edge detection for betting
    spread_edge REAL,                     -- Predicted vs actual line difference
    total_edge REAL,
    moneyline_edge_home REAL,
    moneyline_edge_away REAL,

    -- Recommendation
    recommendation TEXT,                  -- 'home_spread', 'away_spread', 'over', 'under', 'no_bet'
    recommendation_strength TEXT,         -- 'strong', 'moderate', 'weak'

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    UNIQUE(game_id, model_name, model_version),
    CHECK (home_win_prob + away_win_prob > 0.99 AND home_win_prob + away_win_prob < 1.01)
);

CREATE INDEX idx_predictions_game ON predictions(game_id);
CREATE INDEX idx_predictions_model ON predictions(model_name, model_version);
CREATE INDEX idx_predictions_created ON predictions(created_at);
CREATE INDEX idx_predictions_recommendation ON predictions(recommendation);

-- Prediction Outcomes: Track prediction accuracy
CREATE TABLE prediction_outcomes (
    outcome_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,

    -- Actual results
    actual_home_score INTEGER NOT NULL,
    actual_away_score INTEGER NOT NULL,
    actual_winner TEXT NOT NULL,          -- 'home' or 'away'

    -- Outcome evaluation
    win_prediction_correct INTEGER CHECK (win_prediction_correct IN (0, 1)),
    spread_prediction_correct INTEGER CHECK (spread_prediction_correct IN (0, 1)),
    total_prediction_correct INTEGER CHECK (total_prediction_correct IN (0, 1)),

    -- Error metrics
    home_score_error REAL,                -- Predicted - Actual
    away_score_error REAL,
    total_error REAL,
    spread_error REAL,

    -- Betting outcome (if recommendation followed)
    bet_outcome TEXT,                     -- 'win', 'loss', 'push'
    bet_profit_units REAL,                -- Profit in betting units

    evaluated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (prediction_id) REFERENCES predictions(prediction_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    UNIQUE(prediction_id)
);

CREATE INDEX idx_outcomes_prediction ON prediction_outcomes(prediction_id);
CREATE INDEX idx_outcomes_game ON prediction_outcomes(game_id);
CREATE INDEX idx_outcomes_correct ON prediction_outcomes(win_prediction_correct);
CREATE INDEX idx_outcomes_bet ON prediction_outcomes(bet_outcome);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active games with teams
CREATE VIEW v_active_games AS
SELECT
    g.game_id,
    g.external_id,
    l.code AS league_code,
    l.name AS league_name,
    g.game_date,
    g.game_time,
    g.status,
    ht.name AS home_team,
    ht.abbreviation AS home_abbr,
    at.name AS away_team,
    at.abbreviation AS away_abbr,
    g.home_score,
    g.away_score,
    g.venue_name,
    g.broadcast_network
FROM games g
JOIN leagues l ON g.league_id = l.league_id
JOIN teams ht ON g.home_team_id = ht.team_id
JOIN teams at ON g.away_team_id = at.team_id
WHERE g.status IN ('scheduled', 'in_progress')
ORDER BY g.game_date, g.game_time;

-- Latest predictions with game info
CREATE VIEW v_latest_predictions AS
SELECT
    p.prediction_id,
    g.game_date,
    l.code AS league_code,
    ht.name AS home_team,
    at.name AS away_team,
    p.home_win_prob,
    p.away_win_prob,
    p.predicted_spread,
    p.predicted_total,
    p.recommendation,
    p.recommendation_strength,
    p.model_name,
    p.created_at
FROM predictions p
JOIN games g ON p.game_id = g.game_id
JOIN leagues l ON g.league_id = l.league_id
JOIN teams ht ON g.home_team_id = ht.team_id
JOIN teams at ON g.away_team_id = at.team_id
WHERE g.status = 'scheduled'
ORDER BY g.game_date, g.game_time;

-- Model performance summary
CREATE VIEW v_model_performance AS
SELECT
    p.model_name,
    p.model_version,
    COUNT(*) AS total_predictions,
    SUM(CASE WHEN po.win_prediction_correct = 1 THEN 1 ELSE 0 END) AS correct_wins,
    ROUND(AVG(CASE WHEN po.win_prediction_correct = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS win_accuracy_pct,
    SUM(CASE WHEN po.spread_prediction_correct = 1 THEN 1 ELSE 0 END) AS correct_spreads,
    ROUND(AVG(CASE WHEN po.spread_prediction_correct = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) AS spread_accuracy_pct,
    ROUND(AVG(ABS(po.total_error)), 2) AS avg_total_error,
    SUM(COALESCE(po.bet_profit_units, 0)) AS total_profit_units
FROM predictions p
JOIN prediction_outcomes po ON p.prediction_id = po.prediction_id
GROUP BY p.model_name, p.model_version
ORDER BY win_accuracy_pct DESC;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE TRIGGER update_leagues_timestamp
AFTER UPDATE ON leagues
FOR EACH ROW
BEGIN
    UPDATE leagues SET updated_at = CURRENT_TIMESTAMP WHERE league_id = NEW.league_id;
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

CREATE TRIGGER update_stats_timestamp
AFTER UPDATE ON stats
FOR EACH ROW
BEGIN
    UPDATE stats SET updated_at = CURRENT_TIMESTAMP WHERE stat_id = NEW.stat_id;
END;

CREATE TRIGGER update_predictions_timestamp
AFTER UPDATE ON predictions
FOR EACH ROW
BEGIN
    UPDATE predictions SET updated_at = CURRENT_TIMESTAMP WHERE prediction_id = NEW.prediction_id;
END;

-- ============================================================================
-- SEED DATA: LEAGUES
-- ============================================================================

INSERT INTO leagues (code, name, sport, level, api_source) VALUES
    ('MLB', 'Major League Baseball', 'baseball', 'professional', 'espn'),
    ('NFL', 'National Football League', 'football', 'professional', 'espn'),
    ('NBA', 'National Basketball Association', 'basketball', 'professional', 'espn'),
    ('NHL', 'National Hockey League', 'hockey', 'professional', 'espn'),
    ('NCAAB', 'NCAA Division I Baseball', 'baseball', 'college', 'espn'),
    ('NCAAF', 'NCAA Division I Football', 'football', 'college', 'espn'),
    ('NCAAM', 'NCAA Division I Men''s Basketball', 'basketball', 'college', 'espn'),
    ('NCAAW', 'NCAA Division I Women''s Basketball', 'basketball', 'college', 'espn');

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

CREATE TABLE schema_version (
    version TEXT PRIMARY KEY,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial BSI core database schema with predictions support');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
