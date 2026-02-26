-- NCAA Canonical Data Schema
-- Supports: (a) NCAA-style officially reported boxes, (b) play-by-play,
-- (c) optional pitch/batted-ball tracking, (d) historical archives.
-- All IDs are persistent and never change; only mappings change.

-- -------------------------------------------------------------------------
-- Source system registry — track upstream sources and licensing domain
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS source_system (
  source_system_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('licensed','public','internal')),
  license_scope TEXT,
  allowed_redistribution INTEGER NOT NULL DEFAULT 0,  -- boolean
  refresh_sla INTEGER,                                -- seconds
  contract_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed known sources
INSERT OR IGNORE INTO source_system (source_system_id, name, type, license_scope, allowed_redistribution) VALUES
  ('espn_public',    'ESPN Site API',         'public',   'public-view-only', 0),
  ('sportradar',     'Sportradar NCAA Baseball','licensed','internal-use',     0),
  ('sportsdataio',   'SportsDataIO',          'licensed', 'internal-use',     0),
  ('ncaa_livestats', 'NCAA LiveStats XML',    'public',   'public-view-only', 0),
  ('host_xml',       'School/SID XML upload', 'public',   'public-view-only', 0),
  ('internal',       'BSI internal/derived',  'internal', NULL,               0);

-- -------------------------------------------------------------------------
-- Canonical season
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS canonical_season (
  season_id TEXT PRIMARY KEY,           -- e.g. "2026-d1"
  year INTEGER NOT NULL,
  division TEXT NOT NULL,               -- 'D1','D2','D3','NAIA'
  ruleset_version TEXT,
  start_date TEXT,
  end_date TEXT
);

INSERT OR IGNORE INTO canonical_season (season_id, year, division, start_date, end_date) VALUES
  ('2026-d1', 2026, 'D1', '2026-02-13', '2026-06-24'),
  ('2025-d1', 2025, 'D1', '2025-02-14', '2025-06-24');

-- -------------------------------------------------------------------------
-- Canonical team
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS canonical_team (
  team_id TEXT PRIMARY KEY,
  ncaa_org_code TEXT,
  name TEXT NOT NULL,
  short_name TEXT,
  school_name TEXT,
  division TEXT,
  conference_id TEXT,
  home_venue_id TEXT,
  active_from TEXT,
  active_to TEXT
);

CREATE INDEX IF NOT EXISTS idx_canonical_team_ncaa_org ON canonical_team(ncaa_org_code);
CREATE INDEX IF NOT EXISTS idx_canonical_team_conference ON canonical_team(conference_id);

-- -------------------------------------------------------------------------
-- Canonical player
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS canonical_player (
  player_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  bats TEXT CHECK(bats IN ('L','R','S',NULL)),
  throws TEXT CHECK(throws IN ('L','R',NULL)),
  primary_pos TEXT,
  dob TEXT,        -- access-controlled; nullable
  hometown TEXT,
  active_from TEXT,
  active_to TEXT
);

CREATE INDEX IF NOT EXISTS idx_canonical_player_name ON canonical_player(full_name);

-- -------------------------------------------------------------------------
-- Canonical game (header)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS canonical_game (
  game_id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES canonical_season(season_id),
  date_start TEXT NOT NULL,
  team_id_home TEXT REFERENCES canonical_team(team_id),
  team_id_away TEXT REFERENCES canonical_team(team_id),
  venue_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK(status IN ('scheduled','live','final','suspended','forfeit')),
  doubleheader_n INTEGER,  -- 0=single, 1=first game, 2=second game
  neutral_site INTEGER NOT NULL DEFAULT 0,
  source_system_id TEXT REFERENCES source_system(source_system_id)
);

CREATE INDEX IF NOT EXISTS idx_canonical_game_season ON canonical_game(season_id);
CREATE INDEX IF NOT EXISTS idx_canonical_game_date ON canonical_game(date_start);
CREATE INDEX IF NOT EXISTS idx_canonical_game_home ON canonical_game(team_id_home);
CREATE INDEX IF NOT EXISTS idx_canonical_game_away ON canonical_game(team_id_away);

-- -------------------------------------------------------------------------
-- Entity mapping — cross-source canonical ID mapping
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entity_mapping (
  mapping_id TEXT PRIMARY KEY,
  source_system_id TEXT NOT NULL REFERENCES source_system(source_system_id),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('player','team','game','season','venue')),
  source_id TEXT NOT NULL,
  canonical_id TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1.0 CHECK(confidence BETWEEN 0.0 AND 1.0),
  method TEXT NOT NULL DEFAULT 'direct'
    CHECK(method IN ('direct','feed','heuristic','manual')),
  valid_from TEXT,
  valid_to TEXT,
  merge_group_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_mapping_source
  ON entity_mapping(source_system_id, entity_type, source_id);
CREATE INDEX IF NOT EXISTS idx_entity_mapping_canonical ON entity_mapping(canonical_id);
CREATE INDEX IF NOT EXISTS idx_entity_mapping_merge_group ON entity_mapping(merge_group_id);

-- -------------------------------------------------------------------------
-- Roster snapshot — rosters change; keep snapshots, not overwrites
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roster_snapshot (
  roster_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES canonical_team(team_id),
  season_id TEXT NOT NULL REFERENCES canonical_season(season_id),
  as_of_date TEXT NOT NULL,
  player_id TEXT NOT NULL REFERENCES canonical_player(player_id),
  class_year TEXT,
  jersey TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_roster_team_season ON roster_snapshot(team_id, season_id);
CREATE INDEX IF NOT EXISTS idx_roster_player ON roster_snapshot(player_id);

-- -------------------------------------------------------------------------
-- Box score — team totals per game
-- Used for reconciliation and "official" outputs.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS box_team_game (
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  team_id TEXT NOT NULL REFERENCES canonical_team(team_id),
  is_home INTEGER NOT NULL,
  runs INTEGER,
  hits INTEGER,
  errors INTEGER,
  lob INTEGER,
  ab INTEGER,
  bb INTEGER,
  so INTEGER,
  hbp INTEGER,
  sb INTEGER,
  cs INTEGER,
  dp INTEGER,
  tp INTEGER,
  sf INTEGER,
  sh INTEGER,
  rbi INTEGER,
  source_system_id TEXT REFERENCES source_system(source_system_id),
  is_official INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id, team_id)
);

-- -------------------------------------------------------------------------
-- Box score — player batting line per game
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS box_player_batting_game (
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  player_id TEXT NOT NULL REFERENCES canonical_player(player_id),
  team_id TEXT NOT NULL REFERENCES canonical_team(team_id),
  batting_order INTEGER,
  pa INTEGER,
  ab INTEGER,
  h INTEGER,
  h1b INTEGER,
  h2b INTEGER,
  h3b INTEGER,
  hr INTEGER,
  bb_uibb INTEGER,  -- unintentional BB
  ibb INTEGER,
  hbp INTEGER,
  so INTEGER,
  sf INTEGER,
  sh INTEGER,
  r INTEGER,
  rbi INTEGER,
  sb INTEGER,
  cs INTEGER,
  source_system_id TEXT REFERENCES source_system(source_system_id),
  PRIMARY KEY (game_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_batting_game_team ON box_player_batting_game(game_id, team_id);
CREATE INDEX IF NOT EXISTS idx_batting_player ON box_player_batting_game(player_id);

-- -------------------------------------------------------------------------
-- Box score — player pitching line per game
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS box_player_pitching_game (
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  player_id TEXT NOT NULL REFERENCES canonical_player(player_id),
  team_id TEXT NOT NULL REFERENCES canonical_team(team_id),
  ip_outs INTEGER,   -- stored as outs (IP * 3)
  bf INTEGER,
  h INTEGER,
  r INTEGER,
  er INTEGER,
  bb INTEGER,
  ibb INTEGER,
  hbp INTEGER,
  so INTEGER,
  hr INTEGER,
  wp INTEGER,
  bk INTEGER,
  sv INTEGER,
  hld INTEGER,
  is_starter INTEGER NOT NULL DEFAULT 0,
  source_system_id TEXT REFERENCES source_system(source_system_id),
  PRIMARY KEY (game_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_pitching_game_team ON box_player_pitching_game(game_id, team_id);
CREATE INDEX IF NOT EXISTS idx_pitching_player ON box_player_pitching_game(player_id);

-- -------------------------------------------------------------------------
-- Play-by-play event stream
-- Drives leverage index, WPA, RE24, situational splits.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pbp_event (
  event_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  inning INTEGER NOT NULL,
  half TEXT NOT NULL CHECK(half IN ('top','bottom')),
  outs_before INTEGER NOT NULL CHECK(outs_before BETWEEN 0 AND 2),
  outs_after INTEGER NOT NULL CHECK(outs_after BETWEEN 0 AND 3),
  bases_before INTEGER NOT NULL CHECK(bases_before BETWEEN 0 AND 7),  -- bitmask: 1=1B,2=2B,4=3B
  bases_after INTEGER NOT NULL CHECK(bases_after BETWEEN 0 AND 7),
  batter_id TEXT REFERENCES canonical_player(player_id),
  pitcher_id TEXT REFERENCES canonical_player(player_id),
  event_type TEXT NOT NULL,
  result TEXT,
  runs_scored INTEGER NOT NULL DEFAULT 0,
  rbi INTEGER NOT NULL DEFAULT 0,
  is_error INTEGER NOT NULL DEFAULT 0,
  fielders TEXT,  -- JSON array of player_ids
  sequence_n INTEGER NOT NULL,  -- ordering within game
  source_system_id TEXT REFERENCES source_system(source_system_id)
);

CREATE INDEX IF NOT EXISTS idx_pbp_game ON pbp_event(game_id, sequence_n);
CREATE INDEX IF NOT EXISTS idx_pbp_batter ON pbp_event(batter_id);
CREATE INDEX IF NOT EXISTS idx_pbp_pitcher ON pbp_event(pitcher_id);

-- -------------------------------------------------------------------------
-- Plate appearance — canonical PA derived from PBP
-- Stabilizes analytics even if PBP source formats vary.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plate_appearance (
  pa_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  event_id TEXT REFERENCES pbp_event(event_id),
  batter_id TEXT REFERENCES canonical_player(player_id),
  pitcher_id TEXT REFERENCES canonical_player(player_id),
  inning INTEGER NOT NULL,
  half TEXT NOT NULL CHECK(half IN ('top','bottom')),
  pa_result TEXT,    -- 'BB','HBP','1B','2B','3B','HR','K','IP_OUT','DP','SF', etc.
  bb_type TEXT,      -- 'IBB','UIBB' when pa_result='BB'
  k_type TEXT,       -- 'KS','KL' for swinging/looking
  bip_type TEXT,     -- 'GB','FB','LD','PU' for balls in play
  woba_flag INTEGER NOT NULL DEFAULT 1,  -- 0 = excluded from wOBA denominator
  li REAL           -- leverage index at PA start
);

CREATE INDEX IF NOT EXISTS idx_pa_game ON plate_appearance(game_id);
CREATE INDEX IF NOT EXISTS idx_pa_batter ON plate_appearance(batter_id);
CREATE INDEX IF NOT EXISTS idx_pa_pitcher ON plate_appearance(pitcher_id);

-- -------------------------------------------------------------------------
-- Pitch — pitch-level data when available
-- Not always available; keep nullable and coverage-aware.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pitch (
  pitch_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  pa_id TEXT REFERENCES plate_appearance(pa_id),
  pitcher_id TEXT REFERENCES canonical_player(player_id),
  batter_id TEXT REFERENCES canonical_player(player_id),
  pitch_type TEXT,
  velo REAL,
  spin REAL,
  loc_x REAL,
  loc_y REAL,
  call TEXT,         -- 'B','S','X','F','T','H' etc.
  count_before TEXT, -- e.g. "1-2"
  count_after TEXT,
  is_in_play INTEGER NOT NULL DEFAULT 0,
  source_system_id TEXT REFERENCES source_system(source_system_id)
);

CREATE INDEX IF NOT EXISTS idx_pitch_game ON pitch(game_id);
CREATE INDEX IF NOT EXISTS idx_pitch_pa ON pitch(pa_id);
CREATE INDEX IF NOT EXISTS idx_pitch_pitcher ON pitch(pitcher_id);

-- -------------------------------------------------------------------------
-- Batted ball — BIP-level tracking
-- Enables xwOBA-style expected stats.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batted_ball (
  bip_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  pa_id TEXT REFERENCES plate_appearance(pa_id),
  ev REAL,          -- exit velocity mph
  la REAL,          -- launch angle degrees
  spray_x REAL,
  spray_y REAL,
  hang_time REAL,
  hit_type TEXT,    -- 'GB','FB','LD','PU'
  out_prob REAL CHECK(out_prob BETWEEN 0.0 AND 1.0),
  source_system_id TEXT REFERENCES source_system(source_system_id)
);

CREATE INDEX IF NOT EXISTS idx_batted_ball_pa ON batted_ball(pa_id);

-- -------------------------------------------------------------------------
-- Win probability timeline
-- Store model version for reproducibility.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS winprob_state (
  wp_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  event_id TEXT REFERENCES pbp_event(event_id),
  home_wp REAL NOT NULL CHECK(home_wp BETWEEN 0.0 AND 1.0),
  run_expectancy REAL,
  model_version TEXT NOT NULL DEFAULT 'wp_v1'
);

CREATE INDEX IF NOT EXISTS idx_winprob_game ON winprob_state(game_id);

-- -------------------------------------------------------------------------
-- Materialized season metrics per player
-- Recompute nightly + backfill.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metrics_player_season (
  season_id TEXT NOT NULL REFERENCES canonical_season(season_id),
  player_id TEXT NOT NULL REFERENCES canonical_player(player_id),
  team_id TEXT REFERENCES canonical_team(team_id),
  pa INTEGER,
  -- batting
  woba REAL,
  wrc_plus REAL,
  ops_plus REAL,
  babip REAL,
  iso REAL,
  k_pct REAL,
  bb_pct REAL,
  -- pitching
  fip REAL,
  xfip REAL,
  k_minus_bb REAL,
  war_est REAL,
  quality_start_rate REAL,
  model_versions TEXT,  -- JSON: {"woba":"woba_weights_2026_d1_v1","wp":"wp_v3"}
  computed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (season_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_metrics_season ON metrics_player_season(season_id);
CREATE INDEX IF NOT EXISTS idx_metrics_player ON metrics_player_season(player_id);

-- -------------------------------------------------------------------------
-- Park factor — park/run environment adjustments
-- College parks vary massively; mandatory for "plus" metrics.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS park_factor (
  season_id TEXT NOT NULL REFERENCES canonical_season(season_id),
  venue_id TEXT NOT NULL,
  pf_runs REAL NOT NULL DEFAULT 1.0,
  pf_hr REAL,
  pf_1b REAL,
  pf_2b REAL,
  pf_3b REAL,
  pf_so REAL,
  sample_size INTEGER,
  PRIMARY KEY (season_id, venue_id)
);

-- -------------------------------------------------------------------------
-- Linear weights — wOBA/run values per season/division
-- Derive NCAA weights; FanGraphs weights change year to year.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS linear_weights (
  season_id TEXT NOT NULL REFERENCES canonical_season(season_id),
  scope TEXT NOT NULL DEFAULT 'D1',   -- division scope for these weights
  wBB REAL NOT NULL DEFAULT 0.69,
  wHBP REAL NOT NULL DEFAULT 0.72,
  w1B REAL NOT NULL DEFAULT 0.89,
  w2B REAL NOT NULL DEFAULT 1.24,
  w3B REAL NOT NULL DEFAULT 1.56,
  wHR REAL NOT NULL DEFAULT 2.01,
  woba_scale REAL NOT NULL DEFAULT 1.15,
  runs_per_pa REAL,
  model_version TEXT,
  PRIMARY KEY (season_id, scope)
);

-- Seed defaults (MLB-derived fallback weights)
INSERT OR IGNORE INTO linear_weights (season_id, scope) VALUES ('2026-d1', 'D1');
INSERT OR IGNORE INTO linear_weights (season_id, scope) VALUES ('2025-d1', 'D1');

-- -------------------------------------------------------------------------
-- Provenance — field-level lineage
-- Lets you answer "where did this number come from?" in the API.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provenance_field (
  prov_id TEXT PRIMARY KEY,
  tbl TEXT NOT NULL,
  field TEXT NOT NULL,
  record_id TEXT NOT NULL,
  source_system_id TEXT REFERENCES source_system(source_system_id),
  method TEXT NOT NULL DEFAULT 'raw'
    CHECK(method IN ('raw','derived','model')),
  last_updated TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_provenance_record ON provenance_field(tbl, record_id);

-- -------------------------------------------------------------------------
-- Corrections ledger — NCAA official correction workflow
-- Home team's report is official; away-team changes require consent.
-- Do NOT overwrite; append corrections with who/when/why.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corrections_ledger (
  correction_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  tbl TEXT NOT NULL,             -- table where the correction applies
  field TEXT NOT NULL,
  record_id TEXT NOT NULL,       -- primary key or composite key of affected row
  old_value TEXT,
  new_value TEXT NOT NULL,
  requested_by TEXT NOT NULL,    -- source: 'home_sid','away_sid','official_feed'
  approved_by TEXT,
  requires_away_consent INTEGER NOT NULL DEFAULT 0,
  away_consent_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected')),
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_corrections_game ON corrections_ledger(game_id);
CREATE INDEX IF NOT EXISTS idx_corrections_status ON corrections_ledger(status);

-- -------------------------------------------------------------------------
-- Submission tracking — expected arrival windows and late flags
-- Aligned to weekly NCAA deadlines and championship conclusion.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submission_window (
  window_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES canonical_game(game_id),
  expected_by TEXT NOT NULL,    -- ISO timestamp: T+2h post-game
  weekly_deadline TEXT,         -- weekly submission deadline
  box_received_at TEXT,
  pbp_received_at TEXT,
  is_late INTEGER NOT NULL DEFAULT 0,
  has_livestats INTEGER NOT NULL DEFAULT 0,  -- 0=manual XML only, 1=LiveStats
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_submission_game ON submission_window(game_id);
CREATE INDEX IF NOT EXISTS idx_submission_deadline ON submission_window(weekly_deadline, is_late);
