-- Migration 042: Add HBP, SF, SH, CS, TB, OBP, SLG columns to player_season_stats
-- Required for accurate wOBA (HBP in numerator), correct PA (AB+BB+HBP+SF),
-- and cumulative stats sync from ESPN team statistics endpoint.
-- Run: wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/042_add_hbp_sf_columns.sql

ALTER TABLE player_season_stats ADD COLUMN hit_by_pitch INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_season_stats ADD COLUMN sacrifice_flies INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_season_stats ADD COLUMN sacrifice_hits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_season_stats ADD COLUMN caught_stealing INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_season_stats ADD COLUMN total_bases INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_season_stats ADD COLUMN on_base_pct REAL NOT NULL DEFAULT 0;
ALTER TABLE player_season_stats ADD COLUMN slugging_pct REAL NOT NULL DEFAULT 0;

-- Source tracking: whether this row was set by box-score accumulation or cumulative sync
ALTER TABLE player_season_stats ADD COLUMN stats_source TEXT NOT NULL DEFAULT 'box-score';
