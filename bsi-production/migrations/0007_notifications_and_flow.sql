-- Migration: Notifications, Conference Flow, and Enhanced Verification
-- Created: 2025-01-08
-- Purpose: Push notifications for portal activity, conference flow analysis, roster verification

-- ============================================
-- NOTIFICATION SUBSCRIPTIONS
-- ============================================

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,                    -- From auth session
  email TEXT,                               -- Email for notifications
  push_endpoint TEXT,                       -- Web Push endpoint
  push_p256dh TEXT,                         -- Web Push p256dh key
  push_auth TEXT,                           -- Web Push auth key

  -- Notification preferences
  notify_all_commits INTEGER DEFAULT 0,     -- All commit notifications
  notify_top_100 INTEGER DEFAULT 1,         -- Top 100 prospect commits
  notify_conference TEXT,                   -- Specific conference (SEC, ACC, etc)
  notify_school TEXT,                       -- Specific school
  notify_position TEXT,                     -- Specific position (RHP, SS, etc)

  -- Frequency
  digest_frequency TEXT DEFAULT 'instant',  -- instant, daily, weekly

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  UNIQUE(user_id)
);

-- Notification history (what was sent)
CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL,          -- commit, entry, withdrawal
  sent_via TEXT NOT NULL,                   -- email, push, both
  sent_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (subscription_id) REFERENCES notification_subscriptions(id),
  FOREIGN KEY (player_id) REFERENCES transfer_portal(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_subscription ON notification_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notifications_player ON notification_history(player_id);

-- ============================================
-- CONFERENCE FLOW TRACKING
-- ============================================

-- Daily conference flow snapshots
CREATE TABLE IF NOT EXISTS conference_flow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  conference TEXT NOT NULL,

  -- Entries from this conference
  entries_out INTEGER DEFAULT 0,

  -- Commits to this conference
  commits_in INTEGER DEFAULT 0,

  -- Net flow (commits_in - entries_out)
  net_flow INTEGER DEFAULT 0,

  -- Breakdown by position
  pitchers_in INTEGER DEFAULT 0,
  pitchers_out INTEGER DEFAULT 0,
  catchers_in INTEGER DEFAULT 0,
  catchers_out INTEGER DEFAULT 0,
  infielders_in INTEGER DEFAULT 0,
  infielders_out INTEGER DEFAULT 0,
  outfielders_in INTEGER DEFAULT 0,
  outfielders_out INTEGER DEFAULT 0,

  -- Top schools
  top_gainer_school TEXT,
  top_loser_school TEXT,

  created_at TEXT DEFAULT (datetime('now')),

  UNIQUE(snapshot_date, conference)
);

CREATE INDEX IF NOT EXISTS idx_conference_flow_date ON conference_flow(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_conference_flow_conf ON conference_flow(conference);

-- School-level flow tracking
CREATE TABLE IF NOT EXISTS school_flow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  school_name TEXT NOT NULL,
  conference TEXT,

  entries_out INTEGER DEFAULT 0,
  commits_in INTEGER DEFAULT 0,
  net_flow INTEGER DEFAULT 0,

  -- Quality metrics
  avg_ranking_out REAL,                     -- Avg prospect ranking of departures
  avg_ranking_in REAL,                      -- Avg prospect ranking of commits

  created_at TEXT DEFAULT (datetime('now')),

  UNIQUE(snapshot_date, school_name)
);

CREATE INDEX IF NOT EXISTS idx_school_flow_date ON school_flow(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_school_flow_school ON school_flow(school_name);

-- ============================================
-- ROSTER VERIFICATION SOURCES
-- ============================================

-- Track which rosters we've scraped/verified
CREATE TABLE IF NOT EXISTS roster_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_name TEXT NOT NULL,
  source_type TEXT NOT NULL,                -- espn, d1baseball, official
  source_url TEXT,
  last_scraped TEXT,
  roster_count INTEGER DEFAULT 0,
  season TEXT,                              -- 2025, 2026

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  UNIQUE(school_name, source_type, season)
);

-- Scraped roster data for verification
CREATE TABLE IF NOT EXISTS roster_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_name TEXT NOT NULL,
  player_name TEXT NOT NULL,
  jersey_number TEXT,
  position TEXT,
  class_year TEXT,                          -- Fr, So, Jr, Sr, Gr
  hometown TEXT,
  high_school TEXT,
  height TEXT,
  weight TEXT,
  bats TEXT,
  throws TEXT,

  source_type TEXT NOT NULL,
  source_url TEXT,
  scraped_at TEXT DEFAULT (datetime('now')),
  season TEXT,

  UNIQUE(school_name, player_name, season)
);

CREATE INDEX IF NOT EXISTS idx_roster_school ON roster_players(school_name);
CREATE INDEX IF NOT EXISTS idx_roster_name ON roster_players(player_name);

-- ============================================
-- PLAYER PHOTOS
-- ============================================

-- Track uploaded player photos in R2
CREATE TABLE IF NOT EXISTS player_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,                        -- FK to transfer_portal if known
  player_name TEXT NOT NULL,
  school_name TEXT,                         -- School context for the photo

  r2_key TEXT NOT NULL,                     -- R2 object key
  r2_url TEXT,                              -- Public URL

  photo_type TEXT DEFAULT 'headshot',       -- headshot, action, team
  width INTEGER,
  height INTEGER,
  file_size INTEGER,

  uploaded_by TEXT,                         -- Admin who uploaded
  uploaded_at TEXT DEFAULT (datetime('now')),

  approved INTEGER DEFAULT 0,               -- Moderation flag

  FOREIGN KEY (player_id) REFERENCES transfer_portal(id)
);

CREATE INDEX IF NOT EXISTS idx_photos_player ON player_photos(player_id);
CREATE INDEX IF NOT EXISTS idx_photos_name ON player_photos(player_name);
