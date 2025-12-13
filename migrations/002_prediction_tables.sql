-- BSI Predictive Modeling Engine - D1 Schema Migration
-- Migration: 002_prediction_tables
-- Author: Austin Humphrey - Blaze Sports Intel
-- Date: 2025-01-01
--
-- Adds 4 tables for the hybrid Monte Carlo + ML prediction engine:
-- 1. team_psychological_state - Game-by-game psychological state tracking
-- 2. player_psychological_state - Individual player mental state with biometrics
-- 3. prediction_forecasts - Stored predictions with SHAP explainability
-- 4. model_calibration - Brier score and calibration tracking

-- ============================================================================
-- Table 1: Team Psychological State
-- ============================================================================
-- Tracks the evolution of team psychological variables game-by-game.
-- State updates follow: C_{t+1} = α * C_t + β * f(outcome, expectation_gap) + ε

CREATE TABLE IF NOT EXISTS team_psychological_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Team identification
  team_id TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('cfb', 'cbb', 'nfl', 'nba', 'mlb')),
  season INTEGER NOT NULL,
  game_number INTEGER NOT NULL,

  -- Core psychological variables (0.0 to 1.0 bounded)
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  focus REAL NOT NULL DEFAULT 0.5 CHECK (focus >= 0.0 AND focus <= 1.0),
  cohesion REAL NOT NULL DEFAULT 0.5 CHECK (cohesion >= 0.0 AND cohesion <= 1.0),
  leadership_influence REAL NOT NULL DEFAULT 0.5 CHECK (leadership_influence >= 0.0 AND leadership_influence <= 1.0),

  -- Derived scores (computed from Diamond Certainty Engine)
  momentum_score REAL CHECK (momentum_score IS NULL OR (momentum_score >= 0.0 AND momentum_score <= 1.0)),
  adversity_response REAL CHECK (adversity_response IS NULL OR (adversity_response >= 0.0 AND adversity_response <= 1.0)),
  clutch_factor REAL CHECK (clutch_factor IS NULL OR (clutch_factor >= 0.0 AND clutch_factor <= 1.0)),

  -- Game context that triggered state update
  opponent_id TEXT,
  result TEXT CHECK (result IS NULL OR result IN ('W', 'L', 'T')),
  expectation_gap REAL, -- Actual margin minus expected margin
  win_probability_pre REAL CHECK (win_probability_pre IS NULL OR (win_probability_pre >= 0.0 AND win_probability_pre <= 1.0)),
  win_probability_actual REAL CHECK (win_probability_actual IS NULL OR (win_probability_actual >= 0.0 AND win_probability_actual <= 1.0)),

  -- Metadata
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  model_version TEXT NOT NULL DEFAULT '1.0',

  -- Constraints
  UNIQUE(team_id, sport, season, game_number)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_psych_team_season
  ON team_psychological_state(team_id, sport, season);

CREATE INDEX IF NOT EXISTS idx_psych_sport_season_game
  ON team_psychological_state(sport, season, game_number);

CREATE INDEX IF NOT EXISTS idx_psych_updated
  ON team_psychological_state(updated_at);


-- ============================================================================
-- Table 2: Player Psychological State
-- ============================================================================
-- Individual player mental state with WHOOP biometric integration.

CREATE TABLE IF NOT EXISTS player_psychological_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Player identification
  player_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('cfb', 'cbb', 'nfl', 'nba', 'mlb')),
  season INTEGER NOT NULL,
  week_number INTEGER NOT NULL,

  -- Core psychological variables (0.0 to 1.0)
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  focus REAL NOT NULL DEFAULT 0.5 CHECK (focus >= 0.0 AND focus <= 1.0),
  motivation REAL NOT NULL DEFAULT 0.5 CHECK (motivation >= 0.0 AND motivation <= 1.0),

  -- Physiological inputs (from WHOOP API)
  hrv_baseline_deviation REAL, -- Deviation from personal baseline
  recovery_score REAL CHECK (recovery_score IS NULL OR (recovery_score >= 0.0 AND recovery_score <= 1.0)),
  sleep_performance REAL CHECK (sleep_performance IS NULL OR (sleep_performance >= 0.0 AND sleep_performance <= 1.0)),
  strain_level REAL CHECK (strain_level IS NULL OR (strain_level >= 0.0 AND strain_level <= 1.0)),

  -- Performance context
  recent_performance_trend REAL, -- Rolling 5-game z-score
  role_change INTEGER DEFAULT 0 CHECK (role_change IN (-1, 0, 1)), -- -1 = demoted, 0 = same, 1 = promoted

  -- Metadata
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Constraints
  UNIQUE(player_id, sport, season, week_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_player_psych_team
  ON player_psychological_state(team_id, sport, season);

CREATE INDEX IF NOT EXISTS idx_player_psych_player
  ON player_psychological_state(player_id, sport, season);


-- ============================================================================
-- Table 3: Prediction Forecasts
-- ============================================================================
-- Stores all predictions with SHAP explainability for audit and calibration.

CREATE TABLE IF NOT EXISTS prediction_forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Game identification
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('cfb', 'cbb', 'nfl', 'nba', 'mlb')),
  forecast_timestamp TEXT NOT NULL DEFAULT (datetime('now')),

  -- Win probabilities (must sum to ~1.0)
  home_win_probability REAL NOT NULL CHECK (home_win_probability >= 0.0 AND home_win_probability <= 1.0),
  away_win_probability REAL NOT NULL CHECK (away_win_probability >= 0.0 AND away_win_probability <= 1.0),
  draw_probability REAL DEFAULT 0 CHECK (draw_probability >= 0.0 AND draw_probability <= 1.0),

  -- Confidence bounds (90% interval)
  home_win_lower REAL CHECK (home_win_lower IS NULL OR (home_win_lower >= 0.0 AND home_win_lower <= 1.0)),
  home_win_upper REAL CHECK (home_win_upper IS NULL OR (home_win_upper >= 0.0 AND home_win_upper <= 1.0)),

  -- Spread predictions
  predicted_spread REAL, -- Positive = home favored
  predicted_total REAL,
  spread_confidence REAL CHECK (spread_confidence IS NULL OR (spread_confidence >= 0.0 AND spread_confidence <= 1.0)),

  -- Model metadata
  model_version TEXT NOT NULL DEFAULT '1.0',
  simulation_count INTEGER DEFAULT 10000,
  compute_time_ms INTEGER,

  -- Explainability (JSON blobs)
  top_factors_json TEXT, -- JSON array of top 5 SHAP values
  shap_summary_json TEXT, -- Full SHAP breakdown (Pro/Enterprise)
  human_summary TEXT, -- Natural language explanation

  -- Validation (filled post-game)
  actual_result TEXT CHECK (actual_result IS NULL OR actual_result IN ('home', 'away', 'draw')),
  actual_home_score INTEGER,
  actual_away_score INTEGER,
  brier_score REAL CHECK (brier_score IS NULL OR (brier_score >= 0.0 AND brier_score <= 1.0)),
  calibration_bucket INTEGER CHECK (calibration_bucket IS NULL OR (calibration_bucket >= 0 AND calibration_bucket <= 10)),

  -- Metadata
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Constraints
  UNIQUE(game_id, forecast_timestamp)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_forecast_game
  ON prediction_forecasts(game_id);

CREATE INDEX IF NOT EXISTS idx_forecast_sport_time
  ON prediction_forecasts(sport, forecast_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_forecast_calibration
  ON prediction_forecasts(sport, model_version, calibration_bucket)
  WHERE actual_result IS NOT NULL;


-- ============================================================================
-- Table 4: Model Calibration
-- ============================================================================
-- Tracks model calibration metrics over time for monitoring and validation.

CREATE TABLE IF NOT EXISTS model_calibration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Model identification
  sport TEXT NOT NULL CHECK (sport IN ('cfb', 'cbb', 'nfl', 'nba', 'mlb')),
  model_version TEXT NOT NULL,
  calibration_date TEXT NOT NULL,

  -- Overall metrics
  total_predictions INTEGER NOT NULL DEFAULT 0,
  brier_score REAL CHECK (brier_score IS NULL OR (brier_score >= 0.0 AND brier_score <= 1.0)),
  log_loss REAL,
  accuracy_at_50 REAL CHECK (accuracy_at_50 IS NULL OR (accuracy_at_50 >= 0.0 AND accuracy_at_50 <= 1.0)),

  -- Calibration buckets (JSON arrays)
  bucket_counts_json TEXT, -- [count for 0-10%, 10-20%, ..., 90-100%]
  bucket_actual_json TEXT, -- [actual win rate for each bucket]

  -- Benchmark comparisons
  vs_baseline_improvement REAL, -- % improvement over naive model
  vs_vegas_correlation REAL, -- Correlation with Vegas closing lines
  vs_elo_improvement REAL, -- % improvement over simple Elo

  -- Psychology model impact
  psychology_lift REAL, -- % improvement from psychology features
  top_psychology_factors_json TEXT, -- Most impactful psych features

  -- Metadata
  sample_size_adequate INTEGER DEFAULT 0, -- 1 if n > 100
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Constraints
  UNIQUE(sport, model_version, calibration_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calibration_sport_version
  ON model_calibration(sport, model_version, calibration_date DESC);


-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Latest psychological state per team
CREATE VIEW IF NOT EXISTS v_latest_team_psych AS
SELECT
  t.*
FROM team_psychological_state t
INNER JOIN (
  SELECT team_id, sport, season, MAX(game_number) as max_game
  FROM team_psychological_state
  GROUP BY team_id, sport, season
) latest ON t.team_id = latest.team_id
  AND t.sport = latest.sport
  AND t.season = latest.season
  AND t.game_number = latest.max_game;

-- Predictions pending validation (game completed but not yet validated)
CREATE VIEW IF NOT EXISTS v_pending_validation AS
SELECT
  f.*
FROM prediction_forecasts f
WHERE f.actual_result IS NULL
  AND datetime(f.forecast_timestamp) < datetime('now', '-3 hours');

-- Recent calibration metrics
CREATE VIEW IF NOT EXISTS v_recent_calibration AS
SELECT
  sport,
  model_version,
  calibration_date,
  brier_score,
  accuracy_at_50,
  total_predictions,
  psychology_lift
FROM model_calibration
WHERE calibration_date >= date('now', '-30 days')
ORDER BY sport, calibration_date DESC;
