-- BSI Portal Intelligence Agent - D1 Schema
-- Run with: npx wrangler d1 execute bsi-portal-db --file=./schema.sql

-- Portal entries table
CREATE TABLE IF NOT EXISTS portal_entries (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  school_from TEXT,
  school_to TEXT,
  position TEXT,
  conference TEXT,
  class_year TEXT,

  -- Source tracking
  source TEXT NOT NULL,
  source_id TEXT,
  source_url TEXT,

  -- Timestamps
  portal_date TEXT NOT NULL,
  discovered_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  -- Status
  status TEXT DEFAULT 'in_portal',

  -- Engagement metrics (from Twitter)
  engagement_score INTEGER DEFAULT 0,

  -- Generated content
  profile_generated INTEGER DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,

  -- Indexes
  UNIQUE(player_name, school_from, portal_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_portal_status ON portal_entries(status);
CREATE INDEX IF NOT EXISTS idx_portal_conference ON portal_entries(conference);
CREATE INDEX IF NOT EXISTS idx_portal_date ON portal_entries(portal_date);
CREATE INDEX IF NOT EXISTS idx_portal_school ON portal_entries(school_from);

-- Player profiles table
CREATE TABLE IF NOT EXISTS player_profiles (
  id TEXT PRIMARY KEY,
  portal_entry_id TEXT NOT NULL,

  -- Stats
  batting_avg TEXT,
  era TEXT,
  home_runs INTEGER,
  rbis INTEGER,
  strikeouts INTEGER,
  innings_pitched TEXT,

  -- Scouting
  scouting_grade TEXT,
  strengths TEXT,
  weaknesses TEXT,

  -- Generated content
  summary TEXT,
  analysis TEXT,
  comparison_players TEXT,

  -- Timestamps
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (portal_entry_id) REFERENCES portal_entries(id)
);

-- Alert history table
CREATE TABLE IF NOT EXISTS alert_history (
  id TEXT PRIMARY KEY,
  portal_entry_id TEXT NOT NULL,

  -- Alert details
  channel TEXT NOT NULL,
  recipient TEXT,
  message TEXT NOT NULL,

  -- Status
  sent_at TEXT NOT NULL,
  success INTEGER DEFAULT 0,
  error_message TEXT,

  FOREIGN KEY (portal_entry_id) REFERENCES portal_entries(id)
);

-- Create index for alert lookups
CREATE INDEX IF NOT EXISTS idx_alert_entry ON alert_history(portal_entry_id);
CREATE INDEX IF NOT EXISTS idx_alert_channel ON alert_history(channel);
