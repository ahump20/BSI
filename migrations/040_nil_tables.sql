-- NIL Intelligence Platform — 4 new tables
-- Supports: NIL Performance Index scoring, trend tracking, school market data, social profiles

-- Computed NIL index for every qualifying player (upserted every 6h by bsi-savant-compute)
CREATE TABLE IF NOT EXISTS nil_player_scores (
  player_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  index_score REAL NOT NULL DEFAULT 0,       -- composite NIL index [0-100]
  performance_score REAL NOT NULL DEFAULT 0,  -- on-field component [0-100]
  exposure_score REAL NOT NULL DEFAULT 0,     -- social/media reach [0-100]
  market_score REAL NOT NULL DEFAULT 0,       -- school/metro market [0-100]
  estimated_low INTEGER,                      -- dollar range low
  estimated_mid INTEGER,                      -- dollar range midpoint
  estimated_high INTEGER,                     -- dollar range high
  tier TEXT,                                  -- 'elite', 'high', 'mid', 'emerging', 'developmental'
  player_name TEXT,
  team TEXT,
  conference TEXT,
  position TEXT,
  social_followers INTEGER DEFAULT 0,
  market_size TEXT,                            -- 'large', 'medium', 'small'
  computed_at TEXT NOT NULL,
  PRIMARY KEY (player_id, season)
);

-- Point-in-time snapshots for trend tracking (append-only)
CREATE TABLE IF NOT EXISTS nil_score_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  index_score REAL NOT NULL,
  performance_score REAL,
  estimated_mid INTEGER,
  computed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nil_history_player ON nil_score_history(player_id, season);

-- School-level market data (seeded, updated periodically)
CREATE TABLE IF NOT EXISTS nil_school_market (
  team TEXT NOT NULL PRIMARY KEY,
  conference TEXT,
  metro_population INTEGER,
  enrollment INTEGER,
  program_tier TEXT,                           -- 'power', 'mid-major', 'low-major'
  market_size TEXT,                            -- 'large', 'medium', 'small'
  avg_attendance INTEGER,
  brand_value_rank INTEGER,
  updated_at TEXT
);

-- Player social media profiles (seeded manually, enriched later by social sync)
CREATE TABLE IF NOT EXISTS nil_social_profiles (
  player_id TEXT NOT NULL,
  platform TEXT NOT NULL,                     -- 'instagram', 'twitter', 'tiktok'
  handle TEXT,
  follower_count INTEGER DEFAULT 0,
  engagement_rate REAL,
  last_fetched TEXT,
  PRIMARY KEY (player_id, platform)
);
