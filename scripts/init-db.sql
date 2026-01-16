-- BSI Database Initialization Script
-- Creates schema for Blaze Sports Intelligence Platform

-- Create database if not exists (run as superuser)
-- CREATE DATABASE blazesportsintel;

-- Connect to the database
\c blazesportsintel;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS biomechanics;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS sports_data;

-- Set search path
SET search_path TO public, biomechanics, analytics, sports_data;

-- ==================== BIOMECHANICS SCHEMA ====================

-- Athletes table
CREATE TABLE IF NOT EXISTS biomechanics.athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    position VARCHAR(50),
    team VARCHAR(255),
    height_cm DECIMAL(5, 2),
    weight_kg DECIMAL(5, 2),
    birth_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS biomechanics.capture_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES biomechanics.athletes(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- 'pitching', 'batting', 'throwing', etc
    location VARCHAR(255),
    conditions JSONB DEFAULT '{}',
    equipment JSONB DEFAULT '{}',
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pose captures table
CREATE TABLE IF NOT EXISTS biomechanics.pose_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES biomechanics.capture_sessions(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    timestamp_ms BIGINT NOT NULL,
    pose_keypoints JSONB NOT NULL, -- MediaPipe landmark data
    pose_worldpoints JSONB, -- 3D world coordinates
    confidence_scores JSONB,
    video_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Biomechanical metrics table
CREATE TABLE IF NOT EXISTS biomechanics.metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_id UUID REFERENCES biomechanics.pose_captures(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- 'velocity', 'angle', 'acceleration', etc
    metric_name VARCHAR(255) NOT NULL,
    value DECIMAL(10, 4),
    unit VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analysis results table
CREATE TABLE IF NOT EXISTS biomechanics.analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES biomechanics.capture_sessions(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    results JSONB NOT NULL,
    recommendations JSONB,
    risk_factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== ANALYTICS SCHEMA ====================

-- Teams table
CREATE TABLE IF NOT EXISTS analytics.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport VARCHAR(50) NOT NULL,
    league VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(10),
    location VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sport, league, abbreviation)
);

-- Games table
CREATE TABLE IF NOT EXISTS analytics.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport VARCHAR(50) NOT NULL,
    league VARCHAR(50) NOT NULL,
    home_team_id UUID REFERENCES analytics.teams(id),
    away_team_id UUID REFERENCES analytics.teams(id),
    game_date DATE NOT NULL,
    game_time TIME,
    status VARCHAR(50) DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Player stats table
CREATE TABLE IF NOT EXISTS analytics.player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES biomechanics.athletes(id),
    game_id UUID REFERENCES analytics.games(id),
    team_id UUID REFERENCES analytics.teams(id),
    stats JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table
CREATE TABLE IF NOT EXISTS analytics.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50),
    prediction_type VARCHAR(100) NOT NULL,
    target_id UUID, -- Can reference game, player, or team
    target_type VARCHAR(50), -- 'game', 'player', 'team'
    prediction JSONB NOT NULL,
    confidence DECIMAL(3, 2),
    actual_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monte Carlo simulations table
CREATE TABLE IF NOT EXISTS analytics.monte_carlo_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_type VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL,
    iterations INTEGER NOT NULL,
    results JSONB NOT NULL,
    statistics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SPORTS DATA SCHEMA ====================

-- Data sources table
CREATE TABLE IF NOT EXISTS sports_data.sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    api_endpoint TEXT,
    api_key_ref VARCHAR(255), -- Reference to environment variable
    rate_limit INTEGER,
    last_sync TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Raw data ingestion table
CREATE TABLE IF NOT EXISTS sports_data.raw_ingestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES sports_data.sources(id),
    data_type VARCHAR(100) NOT NULL,
    raw_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES ====================

-- Biomechanics indexes
CREATE INDEX idx_athletes_sport ON biomechanics.athletes(sport);
CREATE INDEX idx_athletes_team ON biomechanics.athletes(team);
CREATE INDEX idx_sessions_athlete ON biomechanics.capture_sessions(athlete_id);
CREATE INDEX idx_sessions_type ON biomechanics.capture_sessions(session_type);
CREATE INDEX idx_captures_session ON biomechanics.pose_captures(session_id);
CREATE INDEX idx_captures_timestamp ON biomechanics.pose_captures(timestamp_ms);
CREATE INDEX idx_metrics_capture ON biomechanics.metrics(capture_id);
CREATE INDEX idx_metrics_type ON biomechanics.metrics(metric_type);

-- Analytics indexes
CREATE INDEX idx_teams_sport_league ON analytics.teams(sport, league);
CREATE INDEX idx_games_date ON analytics.games(game_date);
CREATE INDEX idx_games_teams ON analytics.games(home_team_id, away_team_id);
CREATE INDEX idx_stats_player_game ON analytics.player_stats(player_id, game_id);
CREATE INDEX idx_predictions_target ON analytics.predictions(target_type, target_id);
CREATE INDEX idx_predictions_created ON analytics.predictions(created_at DESC);

-- Sports data indexes
CREATE INDEX idx_ingestions_source ON sports_data.raw_ingestions(source_id);
CREATE INDEX idx_ingestions_type ON sports_data.raw_ingestions(data_type);
CREATE INDEX idx_ingestions_processed ON sports_data.raw_ingestions(processed);

-- GIN indexes for JSONB columns
CREATE INDEX idx_athletes_metadata_gin ON biomechanics.athletes USING gin(metadata);
CREATE INDEX idx_captures_keypoints_gin ON biomechanics.pose_captures USING gin(pose_keypoints);
CREATE INDEX idx_stats_data_gin ON analytics.player_stats USING gin(stats);
CREATE INDEX idx_predictions_data_gin ON analytics.predictions USING gin(prediction);

-- ==================== FUNCTIONS & TRIGGERS ====================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables with updated_at
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON biomechanics.athletes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON analytics.teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON analytics.games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== INITIAL DATA ====================

-- Insert default data sources
INSERT INTO sports_data.sources (name, api_endpoint, api_key_ref, rate_limit) VALUES
    ('SportsDataIO', 'https://api.sportsdata.io/v3', 'SPORTSDATAIO_API_KEY', 1000),
    ('MLB Stats API', 'https://statsapi.mlb.com/api/v1', NULL, 500),
    ('ESPN API', 'https://site.api.espn.com/apis', NULL, 100)
ON CONFLICT (name) DO NOTHING;

-- Insert sample teams
INSERT INTO analytics.teams (sport, league, name, abbreviation, location) VALUES
    ('baseball', 'MLB', 'St. Louis Cardinals', 'STL', 'St. Louis, MO'),
    ('football', 'NFL', 'Tennessee Titans', 'TEN', 'Nashville, TN'),
    ('basketball', 'NBA', 'Memphis Grizzlies', 'MEM', 'Memphis, TN'),
    ('football', 'NCAA', 'Texas Longhorns', 'TEX', 'Austin, TX')
ON CONFLICT (sport, league, abbreviation) DO NOTHING;

-- ==================== PERMISSIONS ====================

-- Grant permissions to application user (adjust as needed)
GRANT USAGE ON SCHEMA biomechanics TO bsi;
GRANT USAGE ON SCHEMA analytics TO bsi;
GRANT USAGE ON SCHEMA sports_data TO bsi;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA biomechanics TO bsi;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO bsi;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sports_data TO bsi;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA biomechanics TO bsi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO bsi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sports_data TO bsi;

-- ==================== COMPLETION ====================

-- Notify that initialization is complete
DO $$
BEGIN
    RAISE NOTICE 'BSI Database initialization complete!';
    RAISE NOTICE 'Schemas created: biomechanics, analytics, sports_data';
    RAISE NOTICE 'Tables created and indexed';
    RAISE NOTICE 'Sample data inserted';
END $$;