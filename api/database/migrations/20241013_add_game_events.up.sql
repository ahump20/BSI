-- Migration: create game_events table for granular play-by-play data
-- Notes:
--   * Table keeps a unique (game_id, sequence) constraint so COPY + upsert can safely deduplicate.
--   * If TimescaleDB is available, consider running
--       SELECT create_hypertable('game_events', 'event_ts', if_not_exists => TRUE);
--     after this migration to partition events by time for faster retention policies.
--   * For native PostgreSQL partitioning, you can also hash partition on game_id once volume grows.

CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    event_ts TIMESTAMPTZ NOT NULL,
    inning SMALLINT,
    half_inning VARCHAR(6) CHECK (half_inning IN ('top', 'bottom', 'mid', 'end')),
    outs SMALLINT,
    balls SMALLINT,
    strikes SMALLINT,
    batter_id UUID REFERENCES players(id),
    pitcher_id UUID REFERENCES players(id),
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    runners JSONB DEFAULT '[]',
    metrics JSONB DEFAULT '{}',
    raw_payload JSONB DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'unknown',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_game_events_game_sequence ON game_events (game_id, sequence);
CREATE INDEX IF NOT EXISTS idx_game_events_batter ON game_events (batter_id);
CREATE INDEX IF NOT EXISTS idx_game_events_pitcher ON game_events (pitcher_id);
CREATE INDEX IF NOT EXISTS idx_game_events_event_ts_desc ON game_events (event_ts DESC);
