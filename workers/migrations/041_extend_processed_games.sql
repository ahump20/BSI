-- Migration 041: Add team IDs and scores to processed_games for SOS/RPI computation
-- Run: wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/041_extend_processed_games.sql
ALTER TABLE processed_games ADD COLUMN home_team_id TEXT;
ALTER TABLE processed_games ADD COLUMN away_team_id TEXT;
ALTER TABLE processed_games ADD COLUMN home_score INTEGER;
ALTER TABLE processed_games ADD COLUMN away_score INTEGER;
CREATE INDEX IF NOT EXISTS idx_pg_teams ON processed_games(home_team_id, away_team_id);
