-- Migration 054: Social Intelligence tables
-- Stores classified signals from Reddit + Twitter for college baseball
-- Worker: bsi-social-intel (cron every 30 min)

CREATE TABLE IF NOT EXISTS cbb_social_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,            -- 'reddit' | 'twitter'
  post_id TEXT NOT NULL,             -- platform-native ID
  post_url TEXT,
  post_text TEXT NOT NULL,
  author TEXT,
  posted_at TEXT NOT NULL,           -- ISO 8601
  signal_type TEXT NOT NULL,         -- injury_lineup | transfer_portal | recruiting | sentiment | general
  confidence REAL NOT NULL,          -- 0.0–1.0
  team_mentioned TEXT,               -- normalized team slug
  player_mentioned TEXT,
  summary TEXT,                      -- Claude-generated 1-sentence summary
  raw_entities TEXT,                 -- JSON: { teams: [], players: [] }
  computed_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(platform, post_id)
);

CREATE INDEX IF NOT EXISTS idx_social_signals_type ON cbb_social_signals(signal_type, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_signals_team ON cbb_social_signals(team_mentioned, computed_at DESC);

CREATE TABLE IF NOT EXISTS cbb_social_intel_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_slug TEXT NOT NULL,
  summary_date TEXT NOT NULL,        -- YYYY-MM-DD CT
  injury_count INTEGER DEFAULT 0,
  transfer_count INTEGER DEFAULT 0,
  recruiting_count INTEGER DEFAULT 0,
  sentiment_score REAL,              -- -1.0 to 1.0
  top_signals TEXT,                  -- JSON: array of top 5 signal summaries
  computed_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(team_slug, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_social_summary_date ON cbb_social_intel_summary(summary_date DESC);
