-- Telemetry events table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    session_time REAL DEFAULT 0,
    data TEXT NOT NULL DEFAULT '{}',
    environment TEXT NOT NULL DEFAULT 'production',
    ip_country TEXT DEFAULT 'XX',
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_environment ON events(environment);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

-- Sessions summary view
CREATE VIEW IF NOT EXISTS session_summary AS
SELECT
    session_id,
    MIN(timestamp) as session_start,
    MAX(timestamp) as session_end,
    MAX(session_time) as duration_seconds,
    COUNT(*) as event_count,
    SUM(CASE WHEN event_type = 'swing' THEN 1 ELSE 0 END) as swing_count,
    SUM(CASE WHEN event_type = 'home_run' THEN 1 ELSE 0 END) as home_runs,
    MAX(CASE WHEN event_type = 'game_end' THEN json_extract(data, '$.finalScore') END) as final_score,
    environment
FROM events
GROUP BY session_id, environment;

-- Daily aggregates view
CREATE VIEW IF NOT EXISTS daily_stats AS
SELECT
    DATE(created_at) as date,
    environment,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) as total_events,
    SUM(CASE WHEN event_type = 'game_start' THEN 1 ELSE 0 END) as games_started,
    SUM(CASE WHEN event_type = 'game_end' THEN 1 ELSE 0 END) as games_completed,
    SUM(CASE WHEN event_type = 'home_run' THEN 1 ELSE 0 END) as total_home_runs,
    AVG(CASE WHEN event_type = 'game_end' THEN json_extract(data, '$.finalScore') END) as avg_score
FROM events
GROUP BY DATE(created_at), environment;
