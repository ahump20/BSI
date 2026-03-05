-- Migration: 002_player_season_stats
-- Creates tables for accumulating college baseball player stats from ESPN box scores.
-- Run: npx wrangler d1 execute bsi-prod-db --remote --file=workers/migrations/002_player_season_stats.sql

-- ---------------------------------------------------------------------------
-- processed_games: tracks which ESPN game IDs have already been ingested
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processed_games (
  game_id       TEXT    PRIMARY KEY,          -- ESPN event ID (e.g. "401850092")
  sport         TEXT    NOT NULL DEFAULT 'college-baseball',
  game_date     TEXT    NOT NULL,             -- YYYY-MM-DD
  home_team     TEXT,
  away_team     TEXT,
  processed_at  TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pg_sport_date ON processed_games(sport, game_date DESC);

-- ---------------------------------------------------------------------------
-- player_season_stats: one row per player per season, upserted on each ingest
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS player_season_stats (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  espn_id       TEXT    NOT NULL,             -- ESPN athlete ID
  season        INTEGER NOT NULL DEFAULT 2026,
  sport         TEXT    NOT NULL DEFAULT 'college-baseball',

  -- identity
  name          TEXT    NOT NULL,
  team          TEXT    NOT NULL,             -- display name (e.g. "TCU Horned Frogs")
  team_id       TEXT,                         -- ESPN team ID
  position      TEXT,
  headshot      TEXT,                         -- URL

  -- batting (accumulated)
  games_bat     INTEGER NOT NULL DEFAULT 0,
  at_bats       INTEGER NOT NULL DEFAULT 0,
  runs          INTEGER NOT NULL DEFAULT 0,
  hits          INTEGER NOT NULL DEFAULT 0,
  rbis          INTEGER NOT NULL DEFAULT 0,
  home_runs     INTEGER NOT NULL DEFAULT 0,
  walks_bat     INTEGER NOT NULL DEFAULT 0,
  strikeouts_bat INTEGER NOT NULL DEFAULT 0,
  stolen_bases  INTEGER NOT NULL DEFAULT 0,

  -- pitching (accumulated)
  games_pitch   INTEGER NOT NULL DEFAULT 0,
  innings_pitched_thirds INTEGER NOT NULL DEFAULT 0,  -- stored as thirds (6.1 IP = 19 thirds)
  hits_allowed  INTEGER NOT NULL DEFAULT 0,
  runs_allowed  INTEGER NOT NULL DEFAULT 0,
  earned_runs   INTEGER NOT NULL DEFAULT 0,
  walks_pitch   INTEGER NOT NULL DEFAULT 0,
  strikeouts_pitch INTEGER NOT NULL DEFAULT 0,
  home_runs_allowed INTEGER NOT NULL DEFAULT 0,
  wins          INTEGER NOT NULL DEFAULT 0,
  losses        INTEGER NOT NULL DEFAULT 0,
  saves         INTEGER NOT NULL DEFAULT 0,

  updated_at    TEXT    DEFAULT (datetime('now')),

  UNIQUE(espn_id, season, sport)
);

CREATE INDEX IF NOT EXISTS idx_pss_sport_season ON player_season_stats(sport, season);
CREATE INDEX IF NOT EXISTS idx_pss_team ON player_season_stats(team);
CREATE INDEX IF NOT EXISTS idx_pss_espn_id ON player_season_stats(espn_id, season);
