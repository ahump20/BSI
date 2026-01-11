-- Newsletter Subscribers Schema
-- Created: 2025-01-10

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'footer',  -- Where they signed up: footer, popup, landing, etc.
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resubscribed_at DATETIME,
    unsubscribed_at DATETIME,
    status TEXT DEFAULT 'active',  -- active, unsubscribed, bounced
    preferences TEXT,  -- JSON: { sports: ['mlb', 'ncaa'], frequency: 'daily' }
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups and status filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_source ON newsletter_subscribers(source);
