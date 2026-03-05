-- Schema additions for Highlightly box score ingestion pipeline.
-- player_season_stats and processed_games tables already existed from prior
-- pipeline work. This migration adds:
--   1. UNIQUE index on (espn_id, team_id) for upsert support
--   2. source column to processed_games for pipeline attribution

CREATE UNIQUE INDEX IF NOT EXISTS idx_pss_unique_player_team
  ON player_season_stats(espn_id, team_id);

-- SQLite ALTER TABLE ADD COLUMN is idempotent-safe (errors if exists, but
-- we use IF NOT EXISTS via application-level check before running).
-- ALTER TABLE processed_games ADD COLUMN source TEXT NOT NULL DEFAULT 'espn';
-- ^ Already executed manually; kept here for documentation.
