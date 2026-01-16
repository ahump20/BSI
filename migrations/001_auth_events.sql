-- Auth Events Table Migration
-- Tracks signup, login, logout, and session validation events
-- Run via: wrangler d1 execute BSI_DB --file=migrations/001_auth_events.sql

CREATE TABLE IF NOT EXISTS auth_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  event_type TEXT NOT NULL CHECK(event_type IN (
    'signup_success',
    'signup_failed',
    'login_success',
    'login_failed',
    'logout',
    'session_validated',
    'session_expired',
    'password_reset_requested',
    'password_reset_completed',
    'tier_upgraded',
    'tier_downgraded',
    'google_oauth_success',
    'google_oauth_failed'
  )),
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT, -- JSON string for additional context
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_auth_events_user ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON auth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_events_created ON auth_events(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_events_email ON auth_events(email);

-- Recent auth events view (last 7 days)
CREATE VIEW IF NOT EXISTS v_recent_auth_events AS
SELECT
  ae.id,
  ae.user_id,
  ae.email,
  ae.event_type,
  ae.ip_address,
  ae.metadata,
  datetime(ae.created_at, 'unixepoch') as created_at_utc,
  u.name as user_name,
  u.tier as user_tier
FROM auth_events ae
LEFT JOIN users u ON ae.user_id = u.id
WHERE ae.created_at > unixepoch() - (86400 * 7)
ORDER BY ae.created_at DESC;
