-- Migration 048: Add D1-derived linear weights to cbb_league_context
-- These replace hardcoded MLB weights (wBB=0.69, w1B=0.89, etc.) in savant compute.
-- Derived using Tom Tango's ratio method from aggregate D1 run-scoring data.
--
-- Run: wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/048_league_context_weights.sql

ALTER TABLE cbb_league_context ADD COLUMN w_bb REAL;
ALTER TABLE cbb_league_context ADD COLUMN w_hbp REAL;
ALTER TABLE cbb_league_context ADD COLUMN w_1b REAL;
ALTER TABLE cbb_league_context ADD COLUMN w_2b REAL;
ALTER TABLE cbb_league_context ADD COLUMN w_3b REAL;
ALTER TABLE cbb_league_context ADD COLUMN w_hr REAL;
ALTER TABLE cbb_league_context ADD COLUMN weights_source TEXT DEFAULT 'mlb-derived';
