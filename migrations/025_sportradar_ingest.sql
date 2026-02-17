-- Migration 025: Sportradar MLB Ingest Tables
-- Supports pitch-level event storage, ABS challenge tracking,
-- pre-computed aggregates, and idempotent ingest logging.

-- ---------------------------------------------------------------------------
-- Canonical game reference
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sportradar_game (
  game_id TEXT PRIMARY KEY,
  scheduled_start TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  last_synced TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sr_game_date
  ON sportradar_game(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_sr_game_status
  ON sportradar_game(status);

-- ---------------------------------------------------------------------------
-- Pitch-level events (source of truth for ABS data)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sportradar_pitch_event (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES sportradar_game(game_id),
  at_bat_id TEXT,
  pitcher_id TEXT,
  batter_id TEXT,
  inning INTEGER,
  half TEXT,
  pitch_number INTEGER,
  outcome_id TEXT,
  outcome_desc TEXT,
  is_challenge INTEGER DEFAULT 0,
  challenge_team TEXT,
  challenge_role TEXT,
  challenge_result TEXT,
  wall_clock TEXT,
  raw_json TEXT,
  UNIQUE(game_id, at_bat_id, pitch_number)
);

CREATE INDEX IF NOT EXISTS idx_sr_pitch_game
  ON sportradar_pitch_event(game_id);

CREATE INDEX IF NOT EXISTS idx_sr_pitch_challenge
  ON sportradar_pitch_event(is_challenge)
  WHERE is_challenge = 1;

-- ---------------------------------------------------------------------------
-- Pre-computed ABS daily aggregates (refreshed by ingest worker)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS abs_daily_aggregate (
  date TEXT NOT NULL,
  role TEXT NOT NULL,
  challenges INTEGER DEFAULT 0,
  overturned INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  PRIMARY KEY (date, role)
);

-- ---------------------------------------------------------------------------
-- Ingest dedup log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sportradar_ingest_log (
  idempotency_key TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  game_id TEXT,
  received_at TEXT NOT NULL,
  payload_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sr_ingest_provider
  ON sportradar_ingest_log(provider);

CREATE INDEX IF NOT EXISTS idx_sr_ingest_game
  ON sportradar_ingest_log(game_id);
