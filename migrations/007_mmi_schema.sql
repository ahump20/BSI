-- ============================================================================
-- BLAZE SPORTS INTEL - MMI (MOMENT MENTALITY INDEX) DATABASE SCHEMA
-- ============================================================================
-- D1 Database Schema for storing MMI calculations and player analytics
-- Last Updated: 2025-11-21
-- ============================================================================

-- ============================================================================
-- TABLE: mmi_moments
-- Stores individual MMI calculations for every significant play
-- ============================================================================
CREATE TABLE IF NOT EXISTS mmi_moments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Game & Play Identification
  game_id TEXT NOT NULL,
  play_id TEXT NOT NULL,
  inning INTEGER NOT NULL,
  outs INTEGER NOT NULL CHECK (outs BETWEEN 0 AND 2),

  -- Players
  pitcher_id TEXT NOT NULL,
  pitcher_name TEXT NOT NULL,
  batter_id TEXT NOT NULL,
  batter_name TEXT NOT NULL,

  -- MMI Score & Components
  mmi_score REAL NOT NULL CHECK (mmi_score BETWEEN 0 AND 100),
  leverage_index REAL NOT NULL,
  pressure REAL NOT NULL CHECK (pressure BETWEEN 0 AND 100),
  fatigue REAL NOT NULL CHECK (fatigue BETWEEN 0 AND 100),
  execution REAL NOT NULL CHECK (execution BETWEEN 0 AND 100),
  bio REAL NOT NULL CHECK (bio BETWEEN 0 AND 100),

  -- Interpretation
  interpretation TEXT NOT NULL CHECK (
    interpretation IN ('Elite Pressure', 'High Difficulty', 'Moderate', 'Routine')
  ),

  -- Metadata
  created_at TEXT NOT NULL,

  -- Ensure unique play tracking
  UNIQUE(game_id, play_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_mmi_pitcher ON mmi_moments(pitcher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mmi_batter ON mmi_moments(batter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mmi_game ON mmi_moments(game_id, inning DESC);
CREATE INDEX IF NOT EXISTS idx_mmi_score ON mmi_moments(mmi_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mmi_created ON mmi_moments(created_at DESC);

-- ============================================================================
-- TABLE: mmi_player_streaks
-- Tracks player performance in high-pressure situations (clutch rating)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mmi_player_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Player Identification
  player_id TEXT NOT NULL UNIQUE,
  player_name TEXT NOT NULL,

  -- Streak Statistics
  current_streak INTEGER DEFAULT 0,        -- Consecutive elite performances
  longest_streak INTEGER DEFAULT 0,        -- Career best streak
  total_elite_moments INTEGER DEFAULT 0,   -- MMI >= 70
  total_moments INTEGER DEFAULT 0,         -- All MMI calculations

  -- Performance Metrics
  average_mmi REAL DEFAULT 0,              -- Overall average MMI
  elite_percentage REAL DEFAULT 0,         -- % of moments >= 70
  clutch_rating REAL DEFAULT 0,            -- Weighted average (recent bias)

  -- Last Updated
  last_game_id TEXT,
  last_updated TEXT NOT NULL
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_streaks_clutch ON mmi_player_streaks(clutch_rating DESC);
CREATE INDEX IF NOT EXISTS idx_streaks_elite ON mmi_player_streaks(total_elite_moments DESC);

-- ============================================================================
-- TABLE: mmi_game_summary
-- Aggregates MMI data per game for team-level analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS mmi_game_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Game Identification
  game_id TEXT NOT NULL UNIQUE,
  game_date TEXT NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,

  -- Team MMI Aggregates
  home_total_mmi REAL DEFAULT 0,
  away_total_mmi REAL DEFAULT 0,
  home_avg_mmi REAL DEFAULT 0,
  away_avg_mmi REAL DEFAULT 0,

  -- Moment Counts
  home_elite_moments INTEGER DEFAULT 0,    -- MMI >= 70
  away_elite_moments INTEGER DEFAULT 0,
  total_moments INTEGER DEFAULT 0,

  -- Game Context
  final_score_home INTEGER,
  final_score_away INTEGER,
  winner TEXT,                              -- 'home' | 'away' | 'tie'

  -- Metadata
  created_at TEXT NOT NULL,
  last_updated TEXT NOT NULL
);

-- Index for team performance queries
CREATE INDEX IF NOT EXISTS idx_summary_date ON mmi_game_summary(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_summary_home ON mmi_game_summary(home_team_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_summary_away ON mmi_game_summary(away_team_id, game_date DESC);

-- ============================================================================
-- TABLE: mmi_calibration
-- Stores seasonal parameters for z-score normalization
-- ============================================================================
CREATE TABLE IF NOT EXISTS mmi_calibration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Season Identification
  season INTEGER NOT NULL UNIQUE,

  -- Statistical Parameters (mean, std deviation)
  leverage_index_mean REAL DEFAULT 1.0,
  leverage_index_stddev REAL DEFAULT 1.5,
  pressure_mean REAL DEFAULT 50.0,
  pressure_stddev REAL DEFAULT 20.0,
  fatigue_mean REAL DEFAULT 50.0,
  fatigue_stddev REAL DEFAULT 20.0,
  execution_mean REAL DEFAULT 50.0,
  execution_stddev REAL DEFAULT 20.0,
  bio_mean REAL DEFAULT 50.0,
  bio_stddev REAL DEFAULT 20.0,

  -- Sample Size
  total_moments INTEGER DEFAULT 0,

  -- Metadata
  last_updated TEXT NOT NULL
);

-- Insert default calibration for 2025 season
INSERT OR IGNORE INTO mmi_calibration (
  season,
  leverage_index_mean,
  leverage_index_stddev,
  pressure_mean,
  pressure_stddev,
  fatigue_mean,
  fatigue_stddev,
  execution_mean,
  execution_stddev,
  bio_mean,
  bio_stddev,
  total_moments,
  last_updated
) VALUES (
  2025,
  1.0,
  1.5,
  50.0,
  20.0,
  50.0,
  20.0,
  50.0,
  20.0,
  50.0,
  20.0,
  0,
  datetime('now')
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Top 10 Elite Performers (Last 30 Days)
CREATE VIEW IF NOT EXISTS vw_elite_performers AS
SELECT
  pitcher_id,
  pitcher_name,
  COUNT(*) as elite_moments,
  AVG(mmi_score) as avg_mmi,
  MAX(mmi_score) as peak_mmi,
  MIN(created_at) as first_moment,
  MAX(created_at) as last_moment
FROM mmi_moments
WHERE mmi_score >= 70
  AND created_at >= datetime('now', '-30 days')
GROUP BY pitcher_id, pitcher_name
ORDER BY elite_moments DESC, avg_mmi DESC
LIMIT 10;

-- Recent High-Pressure Moments (Last 24 Hours)
CREATE VIEW IF NOT EXISTS vw_recent_pressure AS
SELECT
  m.game_id,
  m.inning,
  m.outs,
  m.pitcher_name,
  m.batter_name,
  m.mmi_score,
  m.interpretation,
  m.created_at
FROM mmi_moments m
WHERE m.created_at >= datetime('now', '-24 hours')
ORDER BY m.mmi_score DESC
LIMIT 20;

-- Player Clutch Leaderboard
CREATE VIEW IF NOT EXISTS vw_clutch_leaderboard AS
SELECT
  player_id,
  player_name,
  clutch_rating,
  total_elite_moments,
  elite_percentage,
  average_mmi,
  current_streak,
  longest_streak
FROM mmi_player_streaks
WHERE total_moments >= 10  -- Minimum sample size
ORDER BY clutch_rating DESC
LIMIT 50;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update player streaks when new moment is added
CREATE TRIGGER IF NOT EXISTS trg_update_streaks
AFTER INSERT ON mmi_moments
BEGIN
  -- Insert or update player streak data
  INSERT INTO mmi_player_streaks (
    player_id,
    player_name,
    total_moments,
    total_elite_moments,
    average_mmi,
    elite_percentage,
    last_game_id,
    last_updated
  )
  VALUES (
    NEW.pitcher_id,
    NEW.pitcher_name,
    1,
    CASE WHEN NEW.mmi_score >= 70 THEN 1 ELSE 0 END,
    NEW.mmi_score,
    CASE WHEN NEW.mmi_score >= 70 THEN 100.0 ELSE 0.0 END,
    NEW.game_id,
    NEW.created_at
  )
  ON CONFLICT(player_id) DO UPDATE SET
    total_moments = total_moments + 1,
    total_elite_moments = total_elite_moments + CASE WHEN NEW.mmi_score >= 70 THEN 1 ELSE 0 END,
    average_mmi = (average_mmi * total_moments + NEW.mmi_score) / (total_moments + 1),
    elite_percentage = (CAST(total_elite_moments + CASE WHEN NEW.mmi_score >= 70 THEN 1 ELSE 0 END AS REAL) / (total_moments + 1)) * 100,
    last_game_id = NEW.game_id,
    last_updated = NEW.created_at;
END;

-- Update game summary when new moment is added
CREATE TRIGGER IF NOT EXISTS trg_update_game_summary
AFTER INSERT ON mmi_moments
BEGIN
  INSERT INTO mmi_game_summary (
    game_id,
    game_date,
    home_team_id,
    away_team_id,
    total_moments,
    created_at,
    last_updated
  )
  VALUES (
    NEW.game_id,
    date(NEW.created_at),
    'unknown',  -- Would be populated from game data
    'unknown',
    1,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT(game_id) DO UPDATE SET
    total_moments = total_moments + 1,
    last_updated = NEW.created_at;
END;

-- ============================================================================
-- SAMPLE QUERIES (Documentation)
-- ============================================================================

/*
-- Get player's MMI history (last 20 moments)
SELECT * FROM mmi_moments
WHERE pitcher_id = '660271'  -- Nestor Cortes
ORDER BY created_at DESC
LIMIT 20;

-- Top 10 highest MMI moments of all time
SELECT pitcher_name, batter_name, mmi_score, interpretation, inning, outs, created_at
FROM mmi_moments
ORDER BY mmi_score DESC
LIMIT 10;

-- Average MMI by inning (late-inning pressure)
SELECT inning, AVG(mmi_score) as avg_mmi, COUNT(*) as moments
FROM mmi_moments
GROUP BY inning
ORDER BY inning;

-- Clutch performers (elite percentage > 20%)
SELECT player_name, elite_percentage, total_elite_moments, average_mmi
FROM mmi_player_streaks
WHERE total_moments >= 20
  AND elite_percentage > 20
ORDER BY elite_percentage DESC;

-- Game-by-game team performance
SELECT game_id, game_date, home_avg_mmi, away_avg_mmi, winner
FROM mmi_game_summary
WHERE game_date >= date('now', '-7 days')
ORDER BY game_date DESC;
*/

-- ============================================================================
-- SCHEMA VERSION
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_version (version, applied_at)
VALUES (1, datetime('now'));
