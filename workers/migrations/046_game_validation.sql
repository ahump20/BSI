-- Migration 046: Add box score validation columns to processed_games
-- Tracks whether each ingested game passed the runs consistency check
-- (sum of individual player runs per team == scoreboard team score).
--
-- Run: wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/046_game_validation.sql

ALTER TABLE processed_games ADD COLUMN validation_status TEXT DEFAULT 'unchecked';
ALTER TABLE processed_games ADD COLUMN validation_detail TEXT;
