-- Migration 040: Add doubles and triples columns to player_season_stats
-- Required for ISO, wOBA, and wRC+ calculations
-- Run: wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/040_add_doubles_triples.sql
ALTER TABLE player_season_stats ADD COLUMN doubles INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_season_stats ADD COLUMN triples INTEGER NOT NULL DEFAULT 0;
