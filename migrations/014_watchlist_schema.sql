-- Watchlist Persistence Schema
-- Stores user watchlists and alert preferences in D1 for cross-device sync

-- User watchlist entries
CREATE TABLE IF NOT EXISTS user_watchlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    team_abbreviation TEXT,
    conference TEXT,
    sport TEXT NOT NULL CHECK(sport IN ('college_baseball', 'mlb', 'nfl', 'cfb', 'cbb')),
    logo_url TEXT,
    team_record TEXT,
    team_ranking INTEGER,
    added_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, team_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_sport ON user_watchlists(user_id, sport);

-- User alert preferences
CREATE TABLE IF NOT EXISTS user_alert_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    alert_types_json TEXT NOT NULL DEFAULT '{"highLeverage":true,"leadChange":true,"closeGame":true,"upsetAlert":true,"walkOff":true,"momentumShift":false,"gameStart":true,"gameEnd":true}',
    min_leverage_threshold REAL DEFAULT 1.8,
    upset_threshold REAL DEFAULT 0.3,
    close_game_margin REAL DEFAULT 0.1,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '07:00',
    delivery_methods_json TEXT NOT NULL DEFAULT '{"push":true,"email":false,"sms":false,"webSocket":true}',
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_user_alert_preferences_user_id ON user_alert_preferences(user_id);

-- Trigger to update timestamp on preference changes
CREATE TRIGGER IF NOT EXISTS update_alert_preferences_timestamp
AFTER UPDATE ON user_alert_preferences
FOR EACH ROW
BEGIN
    UPDATE user_alert_preferences SET updated_at = datetime('now') WHERE id = OLD.id;
END;
