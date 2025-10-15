-- Rollback: drop game_events table and associated indexes
-- Reminder: drop hypertable/partitions first if you promoted game_events to a TimescaleDB hypertable.

DROP INDEX IF EXISTS idx_game_events_event_ts_desc;
DROP INDEX IF EXISTS idx_game_events_pitcher;
DROP INDEX IF EXISTS idx_game_events_batter;
DROP INDEX IF EXISTS idx_game_events_game_sequence;
DROP TABLE IF EXISTS game_events;
