-- Migration 047: Seed additional source_system rows
-- bsi-savant: savant-compute worker writes to cbb_batting_advanced / cbb_pitching_advanced
-- cbb-api-sync: college baseball ingest pipeline (box scores → player_season_stats)
-- bsi-savant-compute: cron worker that derives advanced metrics from raw stats
--
-- Run: wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/047_source_system_seeds.sql

INSERT OR IGNORE INTO source_system (source_system_id, name, type, license_scope, allowed_redistribution)
VALUES
  ('bsi-savant', 'BSI Savant Compute', 'internal', 'BSI-derived advanced metrics (wOBA, FIP, wRC+)', 1),
  ('cbb-api-sync', 'CBB API Sync Pipeline', 'internal', 'ESPN box score ingestion into D1', 1),
  ('bsi-savant-compute', 'BSI Savant Compute Worker', 'internal', 'Cron-driven advanced analytics computation', 1);
