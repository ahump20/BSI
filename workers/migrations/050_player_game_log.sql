-- 050: Per-game player stats for game log feature.
-- Captures individual box score lines that the season-total UPSERT discards.

CREATE TABLE IF NOT EXISTS player_game_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  espn_id       TEXT NOT NULL,
  game_id       TEXT NOT NULL,
  game_date     TEXT NOT NULL,
  season        INTEGER NOT NULL DEFAULT 2026,
  sport         TEXT NOT NULL DEFAULT 'college-baseball',
  opponent      TEXT,
  is_home       INTEGER DEFAULT 0,
  result        TEXT,  -- 'W' or 'L'

  -- batting
  ab    INTEGER DEFAULT 0,
  r     INTEGER DEFAULT 0,
  h     INTEGER DEFAULT 0,
  rbi   INTEGER DEFAULT 0,
  hr    INTEGER DEFAULT 0,
  bb    INTEGER DEFAULT 0,
  k     INTEGER DEFAULT 0,
  sb    INTEGER DEFAULT 0,

  -- pitching
  ip_thirds   INTEGER DEFAULT 0,
  ha    INTEGER DEFAULT 0,
  er    INTEGER DEFAULT 0,
  so    INTEGER DEFAULT 0,
  bb_p  INTEGER DEFAULT 0,
  w     INTEGER DEFAULT 0,
  l     INTEGER DEFAULT 0,
  sv    INTEGER DEFAULT 0,

  UNIQUE(espn_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_pgl_player_date ON player_game_log(espn_id, game_date DESC);
