-- FCS Football Playoff Historical Data Schema
-- Coverage: 2010-2024 FCS Playoffs (Championship Subdivision)
-- Fills ESPN's coverage gap for non-FBS college football

-- FCS playoff games table (extends historical_games with FCS-specific data)
CREATE TABLE IF NOT EXISTS fcs_playoff_games (
  game_id TEXT PRIMARY KEY,
  season INTEGER NOT NULL,
  playoff_round TEXT NOT NULL CHECK (playoff_round IN (
    'First Round',
    'Second Round',
    'Quarterfinals',
    'Semifinals',
    'Championship'
  )),
  game_date TEXT NOT NULL,
  home_team TEXT NOT NULL,
  home_seed INTEGER,
  home_conference TEXT,
  home_score INTEGER NOT NULL,
  away_team TEXT NOT NULL,
  away_seed INTEGER,
  away_conference TEXT,
  away_score INTEGER NOT NULL,
  venue TEXT,
  city TEXT,
  state TEXT,
  attendance INTEGER,
  weather_temp INTEGER,
  weather_conditions TEXT,
  overtime BOOLEAN DEFAULT 0,
  overtime_periods INTEGER DEFAULT 0,
  total_yards_home INTEGER,
  total_yards_away INTEGER,
  turnovers_home INTEGER,
  turnovers_away INTEGER,
  time_of_possession_home TEXT,
  time_of_possession_away TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES historical_games(game_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fcs_season ON fcs_playoff_games(season);
CREATE INDEX IF NOT EXISTS idx_fcs_round ON fcs_playoff_games(playoff_round);
CREATE INDEX IF NOT EXISTS idx_fcs_teams ON fcs_playoff_games(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_fcs_conference ON fcs_playoff_games(home_conference, away_conference);

-- FCS playoff team performance stats
CREATE TABLE IF NOT EXISTS fcs_playoff_team_stats (
  stat_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  team TEXT NOT NULL,
  season INTEGER NOT NULL,
  playoff_round TEXT NOT NULL,
  first_downs INTEGER,
  third_down_conversions TEXT, -- "8-15" format
  fourth_down_conversions TEXT,
  total_plays INTEGER,
  total_yards INTEGER,
  yards_per_play REAL,
  rushing_attempts INTEGER,
  rushing_yards INTEGER,
  rushing_tds INTEGER,
  passing_completions INTEGER,
  passing_attempts INTEGER,
  passing_yards INTEGER,
  passing_tds INTEGER,
  interceptions INTEGER,
  sacks_allowed INTEGER,
  fumbles INTEGER,
  fumbles_lost INTEGER,
  penalties INTEGER,
  penalty_yards INTEGER,
  possession_time TEXT,
  red_zone_conversions TEXT, -- "3-5" format
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES fcs_playoff_games(game_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fcs_team_stats_game ON fcs_playoff_team_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_fcs_team_stats_team ON fcs_playoff_team_stats(team, season);

-- FCS playoff player performances (notable individual games)
CREATE TABLE IF NOT EXISTS fcs_playoff_player_performances (
  performance_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT NOT NULL,
  season INTEGER NOT NULL,
  position TEXT NOT NULL,
  stat_category TEXT NOT NULL CHECK (stat_category IN (
    'passing', 'rushing', 'receiving', 'defense', 'kicking', 'special_teams'
  )),
  stat_line TEXT NOT NULL, -- JSON string with all stats
  notable_achievement TEXT, -- "300+ passing yards", "3 TD game", etc.
  game_mvp BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES fcs_playoff_games(game_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fcs_player_game ON fcs_playoff_player_performances(game_id);
CREATE INDEX IF NOT EXISTS idx_fcs_player_name ON fcs_playoff_player_performances(player_name);
CREATE INDEX IF NOT EXISTS idx_fcs_player_team ON fcs_playoff_player_performances(team, season);

-- FCS champions and runner-ups history
CREATE TABLE IF NOT EXISTS fcs_champions (
  season INTEGER PRIMARY KEY,
  champion TEXT NOT NULL,
  champion_conference TEXT,
  champion_record TEXT, -- "14-1" format
  runner_up TEXT NOT NULL,
  runner_up_conference TEXT,
  runner_up_record TEXT,
  championship_game_id TEXT,
  championship_score TEXT, -- "28-20" format
  championship_site TEXT,
  championship_attendance INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (championship_game_id) REFERENCES fcs_playoff_games(game_id)
);

CREATE INDEX IF NOT EXISTS idx_fcs_champion ON fcs_champions(champion);
CREATE INDEX IF NOT EXISTS idx_fcs_champion_conference ON fcs_champions(champion_conference);

-- Sample FCS Championship data (2010-2024)
INSERT OR IGNORE INTO fcs_champions VALUES
  (2024, 'Montana State', 'Big Sky', '15-1', 'South Dakota State', 'Missouri Valley', '13-3', null, '31-17', 'Toyota Stadium (Frisco, TX)', 18243, CURRENT_TIMESTAMP),
  (2023, 'South Dakota State', 'Missouri Valley', '14-1', 'Montana', 'Big Sky', '13-3', null, '23-3', 'Toyota Stadium (Frisco, TX)', 19512, CURRENT_TIMESTAMP),
  (2022, 'South Dakota State', 'Missouri Valley', '14-1', 'Montana State', 'Big Sky', '13-2', null, '23-3', 'Toyota Stadium (Frisco, TX)', 19689, CURRENT_TIMESTAMP),
  (2021, 'North Dakota State', 'Missouri Valley', '14-1', 'Montana State', 'Big Sky', '13-2', null, '38-10', 'Toyota Stadium (Frisco, TX)', 18843, CURRENT_TIMESTAMP),
  (2020, 'Sam Houston', 'Southland', '10-0', 'South Dakota State', 'Missouri Valley', '8-2', null, '23-21', 'Toyota Stadium (Frisco, TX)', 3500, CURRENT_TIMESTAMP),
  (2019, 'North Dakota State', 'Missouri Valley', '16-0', 'James Madison', 'Colonial', '14-2', null, '28-20', 'Toyota Stadium (Frisco, TX)', 19939, CURRENT_TIMESTAMP),
  (2018, 'North Dakota State', 'Missouri Valley', '15-0', 'Eastern Washington', 'Big Sky', '13-2', null, '38-24', 'Toyota Stadium (Frisco, TX)', 19939, CURRENT_TIMESTAMP),
  (2017, 'North Dakota State', 'Missouri Valley', '14-1', 'James Madison', 'Colonial', '14-1', null, '17-13', 'Toyota Stadium (Frisco, TX)', 19939, CURRENT_TIMESTAMP),
  (2016, 'James Madison', 'Colonial', '14-1', 'Youngstown State', 'Missouri Valley', '12-4', null, '28-14', 'Toyota Stadium (Frisco, TX)', 19939, CURRENT_TIMESTAMP),
  (2015, 'North Dakota State', 'Missouri Valley', '15-0', 'Jacksonville State', 'Ohio Valley', '13-2', null, '37-10', 'Toyota Stadium (Frisco, TX)', 19939, CURRENT_TIMESTAMP),
  (2014, 'North Dakota State', 'Missouri Valley', '15-0', 'Illinois State', 'Missouri Valley', '13-2', null, '29-27', 'Toyota Stadium (Frisco, TX)', 19939, CURRENT_TIMESTAMP),
  (2013, 'North Dakota State', 'Missouri Valley', '15-0', 'Towson', 'Colonial', '13-3', null, '35-7', 'Toyota Stadium (Frisco, TX)', 18735, CURRENT_TIMESTAMP),
  (2012, 'North Dakota State', 'Missouri Valley', '14-1', 'Sam Houston State', 'Southland', '12-3', null, '39-13', 'Toyota Stadium (Frisco, TX)', 17823, CURRENT_TIMESTAMP),
  (2011, 'North Dakota State', 'Missouri Valley', '14-1', 'Sam Houston State', 'Southland', '14-1', null, '17-6', 'Toyota Stadium (Frisco, TX)', 16592, CURRENT_TIMESTAMP),
  (2010, 'Eastern Washington', 'Big Sky', '13-2', 'Delaware', 'Colonial', '12-3', null, '20-19', 'Pizza Hut Park (Frisco, TX)', 16412, CURRENT_TIMESTAMP);

-- Add sample playoff game to demonstrate schema
INSERT OR IGNORE INTO historical_games VALUES (
  'fcs-championship-2024',
  '2025-01-06',
  'Montana State',
  'South Dakota State',
  31,
  17,
  'football',
  'FCS Championship',
  'Toyota Stadium',
  18243,
  4,
  0,
  3,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO fcs_playoff_games VALUES (
  'fcs-championship-2024',
  2024,
  'Championship',
  '2025-01-06',
  'Montana State',
  2,
  'Big Sky',
  31,
  'South Dakota State',
  1,
  'Missouri Valley',
  17,
  'Toyota Stadium',
  'Frisco',
  'TX',
  18243,
  45,
  'Clear',
  0,
  0,
  425,
  312,
  1,
  2,
  '34:22',
  '25:38',
  CURRENT_TIMESTAMP
);
