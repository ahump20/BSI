-- Historical game records
CREATE TABLE IF NOT EXISTS historical_games (
  game_id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('baseball', 'football')),
  tournament_round TEXT,
  venue TEXT,
  attendance INTEGER,
  innings INTEGER DEFAULT 9,
  extra_innings BOOLEAN DEFAULT 0,
  lead_changes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_date ON historical_games(date);
CREATE INDEX IF NOT EXISTS idx_games_teams ON historical_games(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_games_tournament ON historical_games(tournament_round);
CREATE INDEX IF NOT EXISTS idx_games_sport ON historical_games(sport);

-- Player season statistics
CREATE TABLE IF NOT EXISTS player_stats (
  stat_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT NOT NULL,
  season TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('baseball', 'football')),
  position TEXT,
  stat_type TEXT NOT NULL,
  stat_value REAL NOT NULL,
  games_played INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stats_player ON player_stats(player_id, season);
CREATE INDEX IF NOT EXISTS idx_stats_team ON player_stats(team, season);
CREATE INDEX IF NOT EXISTS idx_stats_type ON player_stats(stat_type, season);
CREATE INDEX IF NOT EXISTS idx_stats_sport ON player_stats(sport);

-- Coaching decision patterns
CREATE TABLE IF NOT EXISTS coaching_decisions (
  decision_id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  team TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('baseball', 'football')),
  season TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  game_state TEXT,
  attempt_count INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  success_rate REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_decisions_coach ON coaching_decisions(coach_id, season);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON coaching_decisions(decision_type, sport);
CREATE INDEX IF NOT EXISTS idx_decisions_team ON coaching_decisions(team, season);

-- Umpire performance scorecards
CREATE TABLE IF NOT EXISTS umpire_scorecards (
  scorecard_id TEXT PRIMARY KEY,
  umpire_id TEXT NOT NULL,
  umpire_name TEXT NOT NULL,
  game_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  batter_handedness TEXT CHECK (batter_handedness IN ('L', 'R', NULL)),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scorecards_umpire ON umpire_scorecards(umpire_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_metric ON umpire_scorecards(metric);
CREATE INDEX IF NOT EXISTS idx_scorecards_game ON umpire_scorecards(game_id);

-- Insert sample data for testing
INSERT OR IGNORE INTO historical_games VALUES (
  'cwsf-2009-06-23-tex-lsu',
  '2009-06-23',
  'Texas',
  'LSU',
  5,
  6,
  'baseball',
  'College World Series Finals - Game 1',
  'Rosenblatt Stadium',
  24167,
  9,
  0,
  2,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO player_stats VALUES (
  'ps-rocker-2021-era',
  'rocker-kumar-001',
  'Kumar Rocker',
  'Vanderbilt',
  '2021',
  'baseball',
  'P',
  'era',
  2.73,
  14,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO coaching_decisions VALUES (
  'cd-saban-2022-4thdown',
  'saban-nick-001',
  'Nick Saban',
  'Alabama',
  'football',
  '2022',
  'fourth_down_conversion',
  'neutral_field',
  18,
  11,
  0.611,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO umpire_scorecards VALUES (
  'us-barrett-2023-01-acc',
  'barrett-ted-001',
  'Ted Barrett',
  'cwsf-2009-06-23-tex-lsu',
  'strike_accuracy',
  0.94,
  'R',
  CURRENT_TIMESTAMP
);
