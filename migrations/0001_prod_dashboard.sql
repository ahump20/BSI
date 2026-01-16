-- WC3 Productivity Dashboard Schema
-- Tracks real dev events as game units/resources

-- Source of truth for all productivity events
CREATE TABLE IF NOT EXISTS prod_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'commit', 'pr_review', 'bug_fix', 'deployment', 'error', 'claude_session'
  source TEXT NOT NULL, -- 'github', 'cloudflare', 'claude'
  payload TEXT NOT NULL, -- JSON blob
  unit_type TEXT, -- 'peon', 'grunt', 'raider', 'shaman', 'kodo', 'catapult', or enemy types
  resources_granted TEXT, -- JSON: { gold: N, lumber: N }
  xp_granted INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Player state (resources, hero stats)
CREATE TABLE IF NOT EXISTS prod_player_state (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  gold INTEGER DEFAULT 0,
  lumber INTEGER DEFAULT 0,
  food_used INTEGER DEFAULT 0,
  food_cap INTEGER DEFAULT 10,
  upkeep_level TEXT DEFAULT 'none', -- 'none', 'low', 'high'
  hero_xp INTEGER DEFAULT 0,
  hero_level INTEGER DEFAULT 1,
  hero_class TEXT DEFAULT 'archmage',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Permanent buildings (unlocked by conditions)
CREATE TABLE IF NOT EXISTS prod_buildings (
  id TEXT PRIMARY KEY,
  building_type TEXT NOT NULL, -- 'great_hall', 'keep', 'castle', 'barracks', 'watch_tower', 'farm'
  unlocked_at TEXT NOT NULL,
  condition_met TEXT NOT NULL, -- description of unlock condition
  food_bonus INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Daily aggregates for trends
CREATE TABLE IF NOT EXISTS prod_daily_stats (
  date TEXT PRIMARY KEY, -- YYYY-MM-DD
  total_commits INTEGER DEFAULT 0,
  total_lines_added INTEGER DEFAULT 0,
  total_lines_removed INTEGER DEFAULT 0,
  bugs_fixed INTEGER DEFAULT 0,
  features_shipped INTEGER DEFAULT 0,
  deployments INTEGER DEFAULT 0,
  errors_encountered INTEGER DEFAULT 0,
  claude_sessions INTEGER DEFAULT 0,
  peak_units INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Active enemies (errors/failures that need defeating)
CREATE TABLE IF NOT EXISTS prod_enemies (
  id TEXT PRIMARY KEY,
  enemy_type TEXT NOT NULL, -- 'footman', 'knight', 'golem', 'dragon', 'pit_lord'
  source TEXT NOT NULL, -- 'lint', 'typescript', 'test', 'build', 'production'
  description TEXT NOT NULL,
  hp INTEGER NOT NULL,
  hp_max INTEGER NOT NULL,
  spawn_event_id TEXT REFERENCES prod_events(id),
  defeated_at TEXT,
  defeated_by_event_id TEXT REFERENCES prod_events(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Active units (temporary, TTL-based)
CREATE TABLE IF NOT EXISTS prod_units (
  id TEXT PRIMARY KEY,
  unit_type TEXT NOT NULL, -- 'peon', 'grunt', 'raider', 'shaman', 'kodo', 'catapult'
  spawn_event_id TEXT REFERENCES prod_events(id),
  description TEXT,
  ttl_seconds INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prod_events_timestamp ON prod_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_prod_events_type ON prod_events(event_type);
CREATE INDEX IF NOT EXISTS idx_prod_enemies_active ON prod_enemies(defeated_at) WHERE defeated_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prod_units_expires ON prod_units(expires_at);

-- Initialize singleton player state
INSERT OR IGNORE INTO prod_player_state (id) VALUES ('singleton');
