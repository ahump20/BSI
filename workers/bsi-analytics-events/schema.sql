-- BSI Analytics Events — D1 Schema
-- Supports 5 strategic queries: cross-sport demand, content conversion,
-- return rates, sport transitions, and paywall funnels.

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    session_id TEXT NOT NULL,
    visitor_id TEXT,
    sport TEXT,
    content_type TEXT,
    path TEXT,
    referrer TEXT,
    time_on_page_ms INTEGER,
    plan TEXT,
    properties TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Cross-sport demand: which sports does a visitor engage with?
CREATE INDEX IF NOT EXISTS idx_events_visitor_sport ON events(visitor_id, sport);

-- Time-series: event_name over time (conversion rates, growth)
CREATE INDEX IF NOT EXISTS idx_events_name_created ON events(event_name, created_at);

-- Session reconstruction: all events in a session
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);

-- Content performance by sport: which content_types drive engagement per sport?
CREATE INDEX IF NOT EXISTS idx_events_sport_content ON events(sport, content_type);

-- Visitor retention: visitor activity over time
CREATE INDEX IF NOT EXISTS idx_events_visitor_created ON events(visitor_id, created_at);
