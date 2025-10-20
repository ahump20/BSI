-- BlazeSportsIntel PostgreSQL schema generated for Prisma data model
-- College baseball-first architecture with Prisma ORM compatibility

-- =============================
-- Enum Definitions
-- =============================
DO $$ BEGIN
  CREATE TYPE sport AS ENUM ('BASEBALL', 'SOFTBALL', 'LACROSSE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE game_status AS ENUM ('SCHEDULED', 'LIVE', 'FINAL', 'POSTPONED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE season_type AS ENUM ('REGULAR', 'POSTSEASON');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inning_half AS ENUM ('TOP', 'BOTTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE feed_precision AS ENUM ('EVENT', 'PITCH', 'PLAY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stat_scope AS ENUM ('GAME', 'SEASON');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE box_role AS ENUM ('BATTING', 'PITCHING', 'FIELDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE article_status AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================
-- Table Definitions
-- =============================
CREATE TABLE IF NOT EXISTS conferences (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sport sport NOT NULL,
  division TEXT,
  short_name TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conferences_sport_division ON conferences (sport, division);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  external_id TEXT UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  nickname TEXT,
  sport sport NOT NULL,
  division TEXT NOT NULL DEFAULT 'D1',
  school TEXT,
  abbreviation TEXT,
  city TEXT,
  state TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  logo_url TEXT,
  conference_id TEXT REFERENCES conferences(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_sport_division ON teams (sport, division);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  external_id TEXT UNIQUE,
  slug TEXT UNIQUE,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT NOT NULL,
  position TEXT,
  jersey_number INTEGER,
  bats TEXT,
  throws TEXT,
  height TEXT,
  weight INTEGER,
  class_year TEXT,
  eligibility TEXT,
  hometown TEXT,
  home_state TEXT,
  birth_date DATE,
  bio JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_team ON players (team_id);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  external_id TEXT UNIQUE,
  sport sport NOT NULL,
  division TEXT NOT NULL DEFAULT 'D1',
  season INTEGER NOT NULL,
  season_type season_type NOT NULL DEFAULT 'REGULAR',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status game_status NOT NULL DEFAULT 'SCHEDULED',
  venue TEXT,
  city TEXT,
  state TEXT,
  attendance INTEGER,
  weather JSONB,
  provider_name TEXT NOT NULL,
  feed_precision feed_precision NOT NULL DEFAULT 'EVENT',
  current_inning INTEGER,
  current_inning_half inning_half,
  balls INTEGER,
  strikes INTEGER,
  outs INTEGER,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  home_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  away_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_games_sport_season ON games (sport, season, season_type);
CREATE INDEX IF NOT EXISTS idx_games_scheduled_at ON games (scheduled_at);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  inning INTEGER,
  half_inning inning_half,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  outs_before INTEGER,
  outs_after INTEGER,
  home_score INTEGER,
  away_score INTEGER,
  runners JSONB,
  metadata JSONB,
  batter_id TEXT REFERENCES players(id) ON DELETE SET NULL,
  pitcher_id TEXT REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events (event_type);

CREATE TABLE IF NOT EXISTS box_lines (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
  role box_role NOT NULL,
  sequence INTEGER,
  started BOOLEAN NOT NULL DEFAULT FALSE,
  summary JSONB,
  at_bats INTEGER,
  runs INTEGER,
  hits INTEGER,
  doubles INTEGER,
  triples INTEGER,
  home_runs INTEGER,
  rbis INTEGER,
  walks INTEGER,
  strikeouts INTEGER,
  stolen_bases INTEGER,
  innings_pitched NUMERIC(4,2),
  hits_allowed INTEGER,
  runs_allowed INTEGER,
  earned_runs INTEGER,
  walks_allowed INTEGER,
  strikeouts_pitched INTEGER,
  pitches INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, team_id, player_id, role)
);

CREATE INDEX IF NOT EXISTS idx_box_lines_game_team ON box_lines (game_id, team_id);
CREATE INDEX IF NOT EXISTS idx_box_lines_player ON box_lines (player_id);

CREATE TABLE IF NOT EXISTS team_stats (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  scope stat_scope NOT NULL DEFAULT 'SEASON',
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  conf_wins INTEGER NOT NULL DEFAULT 0,
  conf_losses INTEGER NOT NULL DEFAULT 0,
  home_wins INTEGER NOT NULL DEFAULT 0,
  home_losses INTEGER NOT NULL DEFAULT 0,
  away_wins INTEGER NOT NULL DEFAULT 0,
  away_losses INTEGER NOT NULL DEFAULT 0,
  runs_scored INTEGER NOT NULL DEFAULT 0,
  runs_allowed INTEGER NOT NULL DEFAULT 0,
  batting_avg DOUBLE PRECISION NOT NULL DEFAULT 0,
  era DOUBLE PRECISION NOT NULL DEFAULT 0,
  fielding_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
  strength_of_sched DOUBLE PRECISION,
  rpi DOUBLE PRECISION,
  pythag_wins DOUBLE PRECISION,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, season, scope)
);

CREATE INDEX IF NOT EXISTS idx_team_stats_season ON team_stats (season);
CREATE INDEX IF NOT EXISTS idx_team_stats_game ON team_stats (game_id);

CREATE TABLE IF NOT EXISTS player_stats (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  scope stat_scope NOT NULL DEFAULT 'SEASON',
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  games_played INTEGER NOT NULL DEFAULT 0,
  at_bats INTEGER NOT NULL DEFAULT 0,
  runs INTEGER NOT NULL DEFAULT 0,
  hits INTEGER NOT NULL DEFAULT 0,
  doubles INTEGER NOT NULL DEFAULT 0,
  triples INTEGER NOT NULL DEFAULT 0,
  home_runs INTEGER NOT NULL DEFAULT 0,
  rbis INTEGER NOT NULL DEFAULT 0,
  walks INTEGER NOT NULL DEFAULT 0,
  strikeouts INTEGER NOT NULL DEFAULT 0,
  stolen_bases INTEGER NOT NULL DEFAULT 0,
  innings_pitched NUMERIC(5,2),
  strikeouts_pitched INTEGER,
  era DOUBLE PRECISION,
  whip DOUBLE PRECISION,
  batting_avg DOUBLE PRECISION,
  obp DOUBLE PRECISION,
  slg DOUBLE PRECISION,
  ops DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, season, scope)
);

CREATE INDEX IF NOT EXISTS idx_player_stats_team ON player_stats (team_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_game ON player_stats (game_id);

CREATE TABLE IF NOT EXISTS rankings (
  id TEXT PRIMARY KEY,
  sport sport NOT NULL,
  poll TEXT NOT NULL,
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points INTEGER,
  first_place_votes INTEGER,
  released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  conference_id TEXT REFERENCES conferences(id) ON DELETE SET NULL,
  UNIQUE (poll, season, week, team_id)
);

CREATE INDEX IF NOT EXISTS idx_rankings_week ON rankings (season, week);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT NOT NULL,
  status article_status NOT NULL DEFAULT 'DRAFT',
  sport sport NOT NULL,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  game_id TEXT REFERENCES games(id) ON DELETE SET NULL,
  author TEXT,
  source TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================
-- End of Schema
-- =============================
