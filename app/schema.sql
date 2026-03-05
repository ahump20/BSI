-- Leads table for storing form submissions
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    sport TEXT,
    message TEXT,
    source TEXT DEFAULT 'Website',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_processed ON leads(processed);

-- Analytics events table (optional)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_data TEXT,
    user_id TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Model health tracking (weekly accuracy per sport)
CREATE TABLE IF NOT EXISTS model_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL,
    week TEXT NOT NULL,
    accuracy REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_model_health_sport_week
    ON model_health(sport, week);

-- Prediction tracking (model predictions before game outcomes)
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    sport TEXT NOT NULL,
    predicted_winner TEXT NOT NULL,
    confidence REAL DEFAULT 0,
    spread REAL,
    over_under REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_predictions_game ON predictions(game_id);

-- Game outcomes (resolved results for accuracy calculation)
CREATE TABLE IF NOT EXISTS outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL UNIQUE,
    sport TEXT NOT NULL,
    actual_winner TEXT NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    resolved_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_outcomes_game ON outcomes(game_id);

-- Create a view for lead analytics
CREATE VIEW IF NOT EXISTS lead_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_leads,
    COUNT(DISTINCT sport) as unique_sports,
    COUNT(CASE WHEN processed = TRUE THEN 1 END) as processed_leads
FROM leads
GROUP BY DATE(created_at);