-- Push Notification Subscriptions Schema
-- Created: 2025-01-10

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_id TEXT,
    teams TEXT,  -- JSON array of favorite teams
    sports TEXT, -- JSON array of sports to notify (nfl, nba, mlb, ncaa)
    notify_scores INTEGER DEFAULT 1,  -- Notify on final scores
    notify_lineups INTEGER DEFAULT 1, -- Notify when lineups posted
    notify_odds INTEGER DEFAULT 0,    -- Notify on significant odds shifts
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by team/sport preferences
CREATE INDEX IF NOT EXISTS idx_push_teams ON push_subscriptions(teams);
CREATE INDEX IF NOT EXISTS idx_push_sports ON push_subscriptions(sports);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
