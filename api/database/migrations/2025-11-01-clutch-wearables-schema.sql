-- Migration: Clutch Performance + Wearables Integration
-- Created: 2025-11-01
-- Description: Add tables for wearables data (WHOOP v2) and NBA clutch performance tracking

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- WEARABLES TABLES
-- ============================================================================

-- Table: wearables_devices
-- Tracks registered wearable devices per athlete with OAuth tokens and consent
CREATE TABLE IF NOT EXISTS wearables_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,

    -- Device metadata
    device_type VARCHAR(50) NOT NULL DEFAULT 'whoop',
    device_serial VARCHAR(255),
    firmware_version VARCHAR(50),

    -- API integration
    api_version VARCHAR(10) NOT NULL DEFAULT 'v2',
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Consent & privacy
    consent_granted BOOLEAN NOT NULL DEFAULT FALSE,
    consent_granted_at TIMESTAMPTZ,
    consent_revoked_at TIMESTAMPTZ,
    data_retention_days INTEGER DEFAULT 365,

    -- Status tracking
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'pending',
    sync_error_message TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_player_device UNIQUE(player_id, device_serial),
    CONSTRAINT consent_token_check CHECK (consent_granted = TRUE OR access_token_encrypted IS NULL)
);

CREATE INDEX idx_wearables_devices_player ON wearables_devices(player_id) WHERE is_active = TRUE;
CREATE INDEX idx_wearables_devices_sync ON wearables_devices(last_sync_at) WHERE sync_status = 'success';

COMMENT ON TABLE wearables_devices IS 'Registered wearable devices with OAuth tokens and consent status';
COMMENT ON COLUMN wearables_devices.access_token_encrypted IS 'AES-256 encrypted OAuth access token';
COMMENT ON COLUMN wearables_devices.consent_granted IS 'Athlete must explicitly grant consent before data collection';

-- Table: wearables_readings
-- Raw time-series biometric data from wearables
CREATE TABLE IF NOT EXISTS wearables_readings (
    reading_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES wearables_devices(device_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,

    -- Timestamp (UTC normalized)
    reading_timestamp TIMESTAMPTZ NOT NULL,
    timezone_offset INTEGER,

    -- Metric type
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(12, 4),
    metric_unit VARCHAR(50),

    -- Quality & confidence
    quality_score DECIMAL(3, 2) CHECK (quality_score >= 0 AND quality_score <= 1),
    confidence_interval_lower DECIMAL(12, 4),
    confidence_interval_upper DECIMAL(12, 4),

    -- Context
    activity_state VARCHAR(50),
    source_session_id VARCHAR(255),

    -- Metadata
    raw_payload JSONB,
    data_source VARCHAR(100) NOT NULL DEFAULT 'whoop_v2',

    -- Audit
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_device_metric_timestamp UNIQUE(device_id, metric_type, reading_timestamp)
);

CREATE INDEX idx_wearables_readings_player_time ON wearables_readings(player_id, reading_timestamp DESC);
CREATE INDEX idx_wearables_readings_metric ON wearables_readings(metric_type, reading_timestamp DESC);
CREATE INDEX idx_wearables_readings_device ON wearables_readings(device_id, reading_timestamp DESC);
CREATE INDEX idx_wearables_readings_payload ON wearables_readings USING GIN(raw_payload);

COMMENT ON TABLE wearables_readings IS 'Time-series biometric data (HRV, HR, strain, etc.) from wearable devices';
COMMENT ON COLUMN wearables_readings.metric_type IS 'Examples: heart_rate, hrv_rmssd, strain, recovery_score, sleep_performance';
COMMENT ON COLUMN wearables_readings.quality_score IS 'Data quality confidence: 0.0 (poor) to 1.0 (excellent)';

-- Table: wearables_daily_summary
-- Pre-aggregated daily metrics for faster queries
CREATE TABLE IF NOT EXISTS wearables_daily_summary (
    summary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES wearables_devices(device_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,

    -- Date (player's local timezone)
    summary_date DATE NOT NULL,

    -- HRV metrics (primary clutch predictor)
    hrv_rmssd_avg DECIMAL(8, 2),
    hrv_rmssd_min DECIMAL(8, 2),
    hrv_rmssd_max DECIMAL(8, 2),
    hrv_baseline_deviation DECIMAL(8, 2),

    -- Heart rate
    resting_hr_avg DECIMAL(6, 2),
    resting_hr_min DECIMAL(6, 2),
    hr_variability_index DECIMAL(6, 2),

    -- Strain & recovery
    day_strain DECIMAL(5, 2),
    recovery_score DECIMAL(5, 2),
    sleep_performance_score DECIMAL(5, 2),

    -- Sleep metrics
    total_sleep_minutes INTEGER,
    rem_sleep_minutes INTEGER,
    deep_sleep_minutes INTEGER,
    sleep_efficiency DECIMAL(5, 2),

    -- Respiratory
    respiratory_rate_avg DECIMAL(5, 2),

    -- Quality
    data_completeness DECIMAL(3, 2),

    -- Metadata
    raw_payload JSONB,
    data_source VARCHAR(100) NOT NULL DEFAULT 'whoop_v2',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_device_summary_date UNIQUE(device_id, summary_date)
);

CREATE INDEX idx_wearables_daily_player ON wearables_daily_summary(player_id, summary_date DESC);
CREATE INDEX idx_wearables_daily_recovery ON wearables_daily_summary(recovery_score) WHERE recovery_score IS NOT NULL;

COMMENT ON TABLE wearables_daily_summary IS 'Daily aggregated biometric metrics for performance analysis';

-- ============================================================================
-- CLUTCH PERFORMANCE TABLES
-- ============================================================================

-- Table: clutch_situations
-- Define clutch game contexts for NBA basketball
CREATE TABLE IF NOT EXISTS clutch_situations (
    situation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,

    -- Situation definition
    situation_type VARCHAR(50) NOT NULL,

    -- Timing (UTC)
    start_timestamp TIMESTAMPTZ NOT NULL,
    end_timestamp TIMESTAMPTZ NOT NULL,
    game_clock_start VARCHAR(10),
    game_clock_end VARCHAR(10),
    period INTEGER,

    -- Score context
    score_margin INTEGER,
    score_margin_absolute INTEGER,
    home_score INTEGER,
    away_score INTEGER,

    -- Clutch criteria (NBA standard: last 5:00, margin ≤5)
    is_clutch_time BOOLEAN NOT NULL DEFAULT FALSE,
    clutch_intensity DECIMAL(3, 2),

    -- Context
    playoff_game BOOLEAN DEFAULT FALSE,
    elimination_game BOOLEAN DEFAULT FALSE,

    -- Metadata
    raw_payload JSONB,
    data_source VARCHAR(100) NOT NULL DEFAULT 'nba_stats_api',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_timestamps CHECK (end_timestamp > start_timestamp),
    CONSTRAINT valid_margin CHECK (score_margin_absolute >= 0)
);

CREATE INDEX idx_clutch_situations_game ON clutch_situations(game_id, start_timestamp);
CREATE INDEX idx_clutch_situations_type ON clutch_situations(situation_type) WHERE is_clutch_time = TRUE;
CREATE INDEX idx_clutch_situations_intensity ON clutch_situations(clutch_intensity DESC);

COMMENT ON TABLE clutch_situations IS 'Clutch game situations (last 5:00, margin ≤5) for NBA games';
COMMENT ON COLUMN clutch_situations.clutch_intensity IS 'Intensity score 0.0-1.0 based on time + margin';

-- Table: clutch_player_actions
-- Individual player actions during clutch situations
CREATE TABLE IF NOT EXISTS clutch_player_actions (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    situation_id UUID NOT NULL REFERENCES clutch_situations(situation_id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,

    -- Action details
    action_timestamp TIMESTAMPTZ NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_subtype VARCHAR(50),

    -- Outcome
    is_successful BOOLEAN,
    points_scored INTEGER DEFAULT 0,

    -- Context
    shot_distance DECIMAL(5, 2),
    shot_location_x DECIMAL(6, 2),
    shot_location_y DECIMAL(6, 2),
    defender_distance DECIMAL(5, 2),
    touch_time DECIMAL(5, 2),

    -- Expected value (from NBA tracking data)
    expected_points DECIMAL(5, 3),
    points_over_expected DECIMAL(5, 3),

    -- Metadata
    raw_payload JSONB,
    data_source VARCHAR(100) NOT NULL DEFAULT 'nba_stats_api',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clutch_actions_player ON clutch_player_actions(player_id, action_timestamp DESC);
CREATE INDEX idx_clutch_actions_situation ON clutch_player_actions(situation_id, action_timestamp);
CREATE INDEX idx_clutch_actions_type ON clutch_player_actions(action_type) WHERE is_successful = TRUE;

COMMENT ON TABLE clutch_player_actions IS 'Individual player actions (shots, assists, turnovers) during clutch time';
COMMENT ON COLUMN clutch_player_actions.points_over_expected IS 'Actual points - expected points (clutch impact)';

-- Table: clutch_performance_scores
-- Aggregated clutch performance metrics with wearables context
CREATE TABLE IF NOT EXISTS clutch_performance_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    situation_id UUID NOT NULL REFERENCES clutch_situations(situation_id) ON DELETE CASCADE,

    -- Performance metrics
    actions_total INTEGER NOT NULL,
    actions_successful INTEGER,
    success_rate DECIMAL(5, 4),

    points_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    rebounds INTEGER DEFAULT 0,

    -- Expected vs actual
    expected_points DECIMAL(8, 3),
    points_over_expected DECIMAL(8, 3),

    -- Clutch score (0-100)
    clutch_score DECIMAL(5, 2),
    clutch_percentile DECIMAL(5, 2),

    -- Wearables context (from wearables_daily_summary on game date)
    hrv_rmssd_pregame DECIMAL(8, 2),
    hrv_baseline_deviation DECIMAL(8, 2),
    recovery_score_pregame DECIMAL(5, 2),
    sleep_performance_pregame DECIMAL(5, 2),
    day_strain_pregame DECIMAL(5, 2),

    -- Wearables availability
    has_wearables_data BOOLEAN NOT NULL DEFAULT FALSE,
    wearables_quality_score DECIMAL(3, 2),

    -- Model predictions (optional, for validation)
    predicted_clutch_score DECIMAL(5, 2),
    prediction_confidence DECIMAL(3, 2),

    -- Metadata
    calculation_method VARCHAR(100) DEFAULT 'hierarchical_bayesian_v1',
    raw_payload JSONB,

    -- Audit
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_player_game_situation UNIQUE(player_id, game_id, situation_id),
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 1)
);

CREATE INDEX idx_clutch_scores_player ON clutch_performance_scores(player_id, calculated_at DESC);
CREATE INDEX idx_clutch_scores_game ON clutch_performance_scores(game_id);
CREATE INDEX idx_clutch_scores_score ON clutch_performance_scores(clutch_score DESC);
CREATE INDEX idx_clutch_scores_wearables ON clutch_performance_scores(player_id) WHERE has_wearables_data = TRUE;

COMMENT ON TABLE clutch_performance_scores IS 'Aggregated clutch performance with wearables correlation';
COMMENT ON COLUMN clutch_performance_scores.clutch_score IS 'Composite metric 0-100 combining success rate, POE, and context';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wearables_devices_updated_at
    BEFORE UPDATE ON wearables_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wearables_daily_summary_updated_at
    BEFORE UPDATE ON wearables_daily_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clutch_situations_updated_at
    BEFORE UPDATE ON clutch_situations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clutch_performance_scores_updated_at
    BEFORE UPDATE ON clutch_performance_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: clutch_leaderboard
-- Top clutch performers with wearables correlation
CREATE OR REPLACE VIEW clutch_leaderboard AS
SELECT
    p.player_id,
    p.full_name,
    p.team_id,
    t.name AS team_name,
    COUNT(*) AS total_clutch_games,
    COUNT(*) FILTER (WHERE cps.has_wearables_data = TRUE) AS games_with_wearables,
    AVG(cps.clutch_score) AS avg_clutch_score,
    AVG(cps.points_over_expected) AS avg_points_over_expected,
    AVG(cps.success_rate) AS avg_success_rate,
    AVG(cps.hrv_baseline_deviation) AS avg_hrv_deviation,
    AVG(cps.recovery_score_pregame) AS avg_recovery_score,
    STDDEV(cps.clutch_score) AS clutch_score_consistency
FROM clutch_performance_scores cps
JOIN players p ON cps.player_id = p.player_id
LEFT JOIN teams t ON p.team_id = t.team_id
GROUP BY p.player_id, p.full_name, p.team_id, t.name
HAVING COUNT(*) >= 5
ORDER BY avg_clutch_score DESC;

COMMENT ON VIEW clutch_leaderboard IS 'Top clutch performers ranked by average clutch score';

-- View: player_wearables_summary
-- Player wearables data summary
CREATE OR REPLACE VIEW player_wearables_summary AS
SELECT
    p.player_id,
    p.full_name,
    wd.device_id,
    wd.device_type,
    wd.consent_granted,
    wd.is_active,
    wd.last_sync_at,
    COUNT(wr.reading_id) AS total_readings,
    MAX(wr.reading_timestamp) AS latest_reading_timestamp,
    AVG(wds.recovery_score) AS avg_recovery_score,
    AVG(wds.hrv_rmssd_avg) AS avg_hrv,
    AVG(wds.sleep_performance_score) AS avg_sleep_performance
FROM players p
JOIN wearables_devices wd ON p.player_id = wd.player_id
LEFT JOIN wearables_readings wr ON wd.device_id = wr.device_id
LEFT JOIN wearables_daily_summary wds ON wd.device_id = wds.device_id
WHERE wd.is_active = TRUE
GROUP BY p.player_id, p.full_name, wd.device_id, wd.device_type, wd.consent_granted, wd.is_active, wd.last_sync_at;

COMMENT ON VIEW player_wearables_summary IS 'Summary of player wearables devices and recent metrics';

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Note: In production, remove this section or use a separate seed script

-- Insert sample wearable device (for testing)
-- INSERT INTO wearables_devices (player_id, device_type, consent_granted, consent_granted_at)
-- SELECT player_id, 'whoop', TRUE, NOW()
-- FROM players
-- WHERE sport = 'basketball'
-- LIMIT 1;

-- ============================================================================
-- GRANTS (adjust based on your user roles)
-- ============================================================================

-- Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bsi_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bsi_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO bsi_app_user;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE 'Clutch Performance + Wearables schema migration completed successfully';
    RAISE NOTICE 'Tables created: wearables_devices, wearables_readings, wearables_daily_summary';
    RAISE NOTICE 'Tables created: clutch_situations, clutch_player_actions, clutch_performance_scores';
    RAISE NOTICE 'Views created: clutch_leaderboard, player_wearables_summary';
END $$;
