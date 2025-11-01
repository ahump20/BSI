-- Live Game Win Probability Simulation
-- D1 Database Schema
-- Optimized for edge compute with minimal reads

-- Games table: metadata for active games
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL CHECK(sport IN ('baseball', 'football', 'basketball')),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  venue TEXT,
  scheduled_at INTEGER NOT NULL, -- Unix timestamp
  status TEXT NOT NULL CHECK(status IN ('scheduled', 'live', 'final', 'postponed')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_sport ON games(sport);

-- Game state: current in-game situation (compact, frequently updated)
CREATE TABLE IF NOT EXISTS game_state (
  game_id TEXT PRIMARY KEY,

  -- Baseball state
  inning INTEGER,
  inning_half TEXT CHECK(inning_half IN ('top', 'bottom')),
  outs INTEGER CHECK(outs >= 0 AND outs <= 3),
  base_state INTEGER CHECK(base_state >= 0 AND base_state <= 7), -- Binary: 1st=1, 2nd=2, 3rd=4
  balls INTEGER CHECK(balls >= 0 AND balls <= 3),
  strikes INTEGER CHECK(strikes >= 0 AND strikes <= 2),

  -- Football state (for future expansion)
  quarter INTEGER,
  clock_seconds INTEGER,
  down INTEGER CHECK(down >= 1 AND down <= 4),
  distance INTEGER,
  yardline INTEGER CHECK(yardline >= 0 AND yardline <= 100),
  possession TEXT,

  -- Basketball state (for future expansion)
  period INTEGER,
  time_remaining INTEGER,

  -- Universal
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Players: rolling priors for simulation
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  sport TEXT NOT NULL,
  position TEXT,

  -- Baseball batting stats (rolling 200 PA or season)
  batting_avg REAL,
  obp REAL,
  slg REAL,
  xwoba REAL, -- Expected weighted on-base average
  iso REAL, -- Isolated power
  k_rate REAL,
  bb_rate REAL,

  -- Baseball pitching stats
  era REAL,
  fip REAL, -- Fielding Independent Pitching
  whip REAL,
  k_per_9 REAL,
  bb_per_9 REAL,
  stuff_plus REAL, -- Stuff+ metric

  -- Football stats (for future)
  epa_per_play REAL,
  success_rate REAL,

  -- Platoon splits
  vs_lhp_woba REAL,
  vs_rhp_woba REAL,

  -- Park factors reference
  park_factor REAL DEFAULT 1.0,

  -- Last updated
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_players_team ON players(team);
CREATE INDEX idx_players_sport ON players(sport);

-- Events: play-by-play log (append-only)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  sequence INTEGER NOT NULL, -- Event sequence in game
  timestamp INTEGER NOT NULL,

  -- Event details
  event_type TEXT NOT NULL, -- 'pitch', 'hit', 'out', 'run', etc.
  description TEXT,

  -- Context (snapshot at time of event)
  inning INTEGER,
  inning_half TEXT,
  outs INTEGER,
  base_state INTEGER,
  home_score INTEGER,
  away_score INTEGER,

  -- Actors
  batter_id TEXT,
  pitcher_id TEXT,

  -- Outcome metrics
  epa REAL, -- Expected points/runs added
  win_prob_change REAL,

  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_game ON events(game_id, sequence);
CREATE INDEX idx_events_timestamp ON events(timestamp);

-- Simulation cache: store recent simulation results
CREATE TABLE IF NOT EXISTS sim_cache (
  game_id TEXT NOT NULL,
  state_hash TEXT NOT NULL, -- Hash of game state for cache key

  -- Simulation results
  home_win_prob REAL NOT NULL,
  away_win_prob REAL NOT NULL,
  num_sims INTEGER NOT NULL,

  -- Distributions
  next_play_dist TEXT, -- JSON: { "single": 0.23, "out": 0.68, ... }
  final_score_dist TEXT, -- JSON array of [home, away] score probabilities

  -- Player projections
  player_deltas TEXT, -- JSON: { "player_id": { "proj_hits": 1.2, ... } }

  -- Metadata
  computed_at INTEGER NOT NULL DEFAULT (unixepoch()),

  PRIMARY KEY (game_id, state_hash)
);

CREATE INDEX idx_sim_cache_game ON sim_cache(game_id);
CREATE INDEX idx_sim_cache_computed ON sim_cache(computed_at);

-- Cleanup old cache entries (worker will run periodically)
-- DELETE FROM sim_cache WHERE computed_at < unixepoch() - 86400; -- 24 hours
