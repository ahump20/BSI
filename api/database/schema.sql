-- BLAZE SPORTS INTEL - DATABASE SCHEMA
-- Phase 3B: Production PostgreSQL schema for sports analytics ML pipeline
--
-- Real database structure replacing hardcoded data with persistent storage

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Teams table - core entity for all sports
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(50) UNIQUE NOT NULL, -- API provider ID
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    sport VARCHAR(20) NOT NULL CHECK (sport IN ('mlb', 'nfl', 'nba', 'ncaa_football', 'ncaa_baseball', 'high_school')),
    league VARCHAR(50),
    division VARCHAR(50),
    conference VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(50) UNIQUE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(20),
    jersey_number INTEGER,
    height_inches INTEGER,
    weight_pounds INTEGER,
    birth_date DATE,
    sport VARCHAR(20) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table - all game results
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(50) UNIQUE NOT NULL,
    home_team_id UUID REFERENCES teams(id) NOT NULL,
    away_team_id UUID REFERENCES teams(id) NOT NULL,
    game_date TIMESTAMP WITH TIME ZONE NOT NULL,
    season INTEGER NOT NULL,
    week INTEGER, -- for NFL/NCAA football
    game_type VARCHAR(20) DEFAULT 'regular', -- regular, playoff, preseason
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, postponed
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    sport VARCHAR(20) NOT NULL,
    venue VARCHAR(200),
    weather JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game statistics - detailed box score data
CREATE TABLE game_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) NOT NULL,
    player_id UUID REFERENCES players(id),
    stat_type VARCHAR(50) NOT NULL, -- hits, runs, yards, points, etc.
    stat_value DECIMAL(10,4) NOT NULL,
    stat_category VARCHAR(20), -- offense, defense, pitching, etc.
    period VARCHAR(10), -- inning, quarter, half, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team analytics - calculated metrics
CREATE TABLE team_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    week INTEGER, -- for weekly calculations
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    win_percentage DECIMAL(5,4) DEFAULT 0,

    -- Pythagorean expectation
    runs_scored INTEGER DEFAULT 0,
    runs_allowed INTEGER DEFAULT 0,
    pythagorean_wins DECIMAL(5,2) DEFAULT 0,
    pythagorean_win_pct DECIMAL(5,4) DEFAULT 0,

    -- Elo rating
    elo_rating INTEGER DEFAULT 1500,
    elo_change_last_game INTEGER DEFAULT 0,

    -- Strength of schedule
    strength_of_schedule DECIMAL(5,4) DEFAULT 0.500,
    sos_rating DECIMAL(6,2) DEFAULT 0,

    -- Sport-specific analytics stored as JSONB
    sport_specific_stats JSONB DEFAULT '{}',

    -- Model predictions
    predicted_wins DECIMAL(5,2),
    predicted_losses DECIMAL(5,2),
    playoff_probability DECIMAL(5,4),

    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, season, week)
);

-- Player analytics - individual performance metrics
CREATE TABLE player_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) NOT NULL,
    season INTEGER NOT NULL,
    games_played INTEGER DEFAULT 0,

    -- Baseball-specific
    batting_average DECIMAL(5,4),
    on_base_percentage DECIMAL(5,4),
    slugging_percentage DECIMAL(5,4),
    ops DECIMAL(5,4),
    era DECIMAL(5,2),
    whip DECIMAL(5,4),

    -- Football-specific
    passing_yards INTEGER,
    rushing_yards INTEGER,
    receiving_yards INTEGER,
    touchdowns INTEGER,
    interceptions INTEGER,

    -- Advanced metrics
    war DECIMAL(6,3), -- Wins Above Replacement
    value_over_replacement DECIMAL(8,2),
    performance_score DECIMAL(6,3),

    -- Sport-specific stats
    sport_specific_stats JSONB DEFAULT '{}',

    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, season)
);

-- ML model predictions - store prediction results
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    prediction_type VARCHAR(50) NOT NULL, -- game_outcome, season_wins, player_performance
    target_entity_type VARCHAR(20) NOT NULL, -- team, player, game
    target_entity_id UUID NOT NULL,
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_date TIMESTAMP WITH TIME ZONE, -- when prediction is for

    -- Prediction results
    predicted_value DECIMAL(10,4),
    confidence_score DECIMAL(5,4),
    probability_distribution JSONB, -- for multi-class predictions

    -- Model metadata
    features_used JSONB,
    model_metrics JSONB, -- accuracy, precision, recall, etc.

    -- Validation
    actual_value DECIMAL(10,4), -- filled in after event occurs
    prediction_error DECIMAL(10,4),
    is_validated BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature store - ML features for training and inference
CREATE TABLE ml_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL, -- team, player, game
    entity_id UUID NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_value DECIMAL(10,6),
    feature_category VARCHAR(50), -- offensive, defensive, situational
    calculation_window VARCHAR(20), -- season, last_10_games, career
    as_of_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(entity_type, entity_id, feature_name, calculation_window, as_of_date)
);

-- Model training runs - track ML model versions and performance
CREATE TABLE model_training_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    training_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    training_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running', -- running, completed, failed

    -- Training configuration
    algorithm VARCHAR(50),
    hyperparameters JSONB,
    training_data_start_date DATE,
    training_data_end_date DATE,
    train_test_split DECIMAL(3,2) DEFAULT 0.8,

    -- Performance metrics
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall SCORE DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    mean_absolute_error DECIMAL(10,6),
    root_mean_squared_error DECIMAL(10,6),

    -- Model artifacts
    model_path TEXT,
    feature_importance JSONB,
    confusion_matrix JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model artifact evaluations - monitoring deployed regression bundles
CREATE TABLE IF NOT EXISTS model_artifact_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_key VARCHAR(100) NOT NULL,
    sport VARCHAR(50),
    artifact_version VARCHAR(50) NOT NULL,
    metrics JSONB,
    calibration JSONB,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (model_key, artifact_version, sport)
);

-- Data quality monitoring
CREATE TABLE data_quality_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100),
    check_type VARCHAR(50) NOT NULL, -- null_check, range_check, freshness_check
    check_description TEXT,
    expected_value TEXT,
    actual_value TEXT,
    status VARCHAR(20) NOT NULL, -- pass, fail, warning
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- API usage tracking - monitor external API calls
CREATE TABLE api_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_provider VARCHAR(50) NOT NULL, -- sportsdata_io, mlb_statsapi, etc.
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) DEFAULT 'GET',
    status_code INTEGER,
    response_time_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    rate_limit_remaining INTEGER,
    cost_cents INTEGER, -- API cost tracking
    called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_teams_sport ON teams(sport);
CREATE INDEX idx_teams_external_id ON teams(external_id);
CREATE INDEX idx_players_team_sport ON players(team_id, sport);
CREATE INDEX idx_players_external_id ON players(external_id);
CREATE INDEX idx_games_teams_date ON games(home_team_id, away_team_id, game_date);
CREATE INDEX idx_games_season_sport ON games(season, sport);
CREATE INDEX idx_game_stats_game_team ON game_stats(game_id, team_id);
CREATE INDEX idx_game_stats_player ON game_stats(player_id);
CREATE INDEX idx_team_analytics_season ON team_analytics(team_id, season);
CREATE INDEX idx_player_analytics_season ON player_analytics(player_id, season);
CREATE INDEX idx_ml_predictions_target ON ml_predictions(target_entity_type, target_entity_id);
CREATE INDEX idx_ml_predictions_date ON ml_predictions(prediction_date);
CREATE INDEX idx_ml_features_entity ON ml_features(entity_type, entity_id, as_of_date);
CREATE INDEX idx_model_training_runs_name_version ON model_training_runs(model_name, model_version);
CREATE INDEX idx_api_calls_provider_endpoint ON api_calls(api_provider, endpoint);
CREATE INDEX idx_api_calls_timestamp ON api_calls(called_at);

-- Full text search indexes
CREATE INDEX idx_teams_name_trgm ON teams USING gin (name gin_trgm_ops);
CREATE INDEX idx_players_name_trgm ON players USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW current_season_team_stats AS
SELECT
    t.name,
    t.abbreviation,
    t.sport,
    ta.season,
    ta.games_played,
    ta.wins,
    ta.losses,
    ta.win_percentage,
    ta.pythagorean_win_pct,
    ta.elo_rating,
    ta.strength_of_schedule,
    ta.playoff_probability
FROM teams t
JOIN team_analytics ta ON t.id = ta.team_id
WHERE ta.season = EXTRACT(YEAR FROM NOW());

CREATE VIEW top_players_by_sport AS
SELECT
    p.first_name || ' ' || p.last_name as player_name,
    p.position,
    t.name as team_name,
    p.sport,
    pa.performance_score,
    pa.war,
    pa.season
FROM players p
JOIN player_analytics pa ON p.id = pa.player_id
JOIN teams t ON p.team_id = t.id
WHERE pa.season = EXTRACT(YEAR FROM NOW())
ORDER BY p.sport, pa.performance_score DESC;

-- Grant permissions (adjust for your app user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO blaze_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO blaze_app_user;