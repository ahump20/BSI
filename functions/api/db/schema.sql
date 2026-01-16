-- Blaze Sports Intel - D1 Database Schema
-- Production schema for regression models and sports analytics
-- Sport Priority: Baseball → Football → Basketball → Track & Field

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS teams (
  team_id TEXT PRIMARY KEY,
  sport TEXT NOT NULL CHECK(sport IN ('baseball', 'football', 'basketball', 'track')),
  league TEXT NOT NULL CHECK(league IN ('ncaa', 'mlb', 'nfl', 'nba')),
  name TEXT NOT NULL,
  school TEXT,
  conference TEXT,
  division TEXT,
  venue_name TEXT,
  city TEXT,
  state TEXT,
  founded_year INTEGER,
  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_league_conf ON teams(league, conference);
CREATE INDEX IF NOT EXISTS idx_teams_sport ON teams(sport);

CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT,
  height_cm INTEGER,
  weight_kg INTEGER,
  birthdate TEXT,
  throws TEXT CHECK(throws IN ('R', 'L', NULL)),
  bats TEXT CHECK(bats IN ('R', 'L', 'S', NULL)),
  draft_year INTEGER,
  draft_round INTEGER,
  hometown_city TEXT,
  hometown_state TEXT,
  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(last_name, first_name);

CREATE TABLE IF NOT EXISTS games (
  game_id TEXT PRIMARY KEY,
  sport TEXT NOT NULL CHECK(sport IN ('baseball', 'football', 'basketball', 'track')),
  league TEXT NOT NULL CHECK(league IN ('ncaa', 'mlb', 'nfl', 'nba')),
  season INTEGER NOT NULL,
  game_date TEXT NOT NULL,  -- ISO8601 America/Chicago
  game_time TEXT,
  home_team_id TEXT REFERENCES teams(team_id),
  away_team_id TEXT REFERENCES teams(team_id),
  home_score INTEGER,
  away_score INTEGER,
  venue_name TEXT,
  venue_id TEXT,
  weather_temp_f INTEGER,
  weather_wind_mph INTEGER,
  weather_condition TEXT,
  status TEXT CHECK(status IN ('scheduled', 'in_progress', 'final', 'postponed', 'cancelled')),
  is_playoff BOOLEAN DEFAULT FALSE,
  is_championship BOOLEAN DEFAULT FALSE,
  attendance INTEGER,
  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_season ON games(league, season);
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- ============================================================================
-- BASEBALL PLAYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS plays_baseball (
  play_id TEXT PRIMARY KEY,
  game_id TEXT REFERENCES games(game_id) NOT NULL,
  inning INTEGER NOT NULL CHECK(inning >= 1),
  top_bot TEXT NOT NULL CHECK(top_bot IN ('top', 'bot')),
  outs INTEGER NOT NULL CHECK(outs BETWEEN 0 AND 2),
  batter_id TEXT REFERENCES players(player_id),
  pitcher_id TEXT REFERENCES players(pitcher_id),
  catcher_id TEXT REFERENCES players(catcher_id),

  -- Pitch sequence (JSON array)
  pitch_sequence JSON,

  -- Play outcome
  play_outcome TEXT NOT NULL,  -- single, double, triple, HR, K, BB, HBP, etc.
  runs_scored INTEGER DEFAULT 0,
  rbi INTEGER DEFAULT 0,

  -- Base state
  base_state_before TEXT NOT NULL,  -- '---', '1--', '12-', '123', etc.
  base_state_after TEXT NOT NULL,

  -- Context
  score_diff INTEGER,  -- positive = batting team ahead
  leverage_index REAL,
  run_expectancy_before REAL,
  run_expectancy_after REAL,

  -- Win probability
  win_prob_before REAL CHECK(win_prob_before BETWEEN 0 AND 1),
  win_prob_after REAL CHECK(win_prob_after BETWEEN 0 AND 1),

  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plays_bb_game ON plays_baseball(game_id);
CREATE INDEX IF NOT EXISTS idx_plays_bb_pitcher ON plays_baseball(pitcher_id);
CREATE INDEX IF NOT EXISTS idx_plays_bb_batter ON plays_baseball(batter_id);
CREATE INDEX IF NOT EXISTS idx_plays_bb_outcome ON plays_baseball(play_outcome);

-- ============================================================================
-- FEATURES (Denormalized for Performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS features_baseball_batted_ball (
  feature_id TEXT PRIMARY KEY,
  play_id TEXT REFERENCES plays_baseball(play_id) NOT NULL,

  -- Contact quality (from video/sensors)
  exit_velo REAL,
  launch_angle REAL,
  spray_angle REAL,
  bat_speed REAL,
  attack_angle REAL,
  on_plane_time_ms REAL,
  contact_depth_cm REAL,
  swing_decision_time_ms REAL,

  -- Body mechanics
  hand_speed REAL,
  torso_rotation_deg REAL,
  head_stability_px REAL,
  stride_length_cm REAL,
  weight_transfer_pct REAL,

  -- Pitch context (what they faced)
  pitch_velo REAL,
  pitch_spin_rpm REAL,
  pitch_movement_horiz_in REAL,
  pitch_movement_vert_in REAL,
  zone_x REAL CHECK(zone_x BETWEEN -2 AND 2),
  zone_y REAL CHECK(zone_y BETWEEN 0 AND 5),
  pitch_type TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_features_bb_play ON features_baseball_batted_ball(play_id);

CREATE TABLE IF NOT EXISTS features_micro_expression (
  feature_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('player', 'dugout', 'coach')),
  entity_id TEXT NOT NULL,
  play_id TEXT,  -- Optional: link to specific play
  timestamp TEXT NOT NULL,  -- ISO8601

  -- Dimensions (0.0 - 1.0)
  agency REAL CHECK(agency BETWEEN 0 AND 1),
  focus REAL CHECK(focus BETWEEN 0 AND 1),
  tension REAL CHECK(tension BETWEEN 0 AND 1),
  confidence REAL CHECK(confidence BETWEEN 0 AND 1),

  -- Metadata
  confidence_score REAL,  -- Model confidence
  frame_count INTEGER,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_micro_expr_entity ON features_micro_expression(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_micro_expr_play ON features_micro_expression(play_id);

CREATE TABLE IF NOT EXISTS features_conference_strength (
  strength_id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  conference TEXT NOT NULL,
  season INTEGER NOT NULL,

  -- Elo-based strength
  elo_rating REAL NOT NULL,
  elo_rank INTEGER,

  -- Performance metrics
  overall_win_pct REAL,
  nonconf_win_pct REAL,
  rpi REAL,

  -- Updated weekly
  as_of_date TEXT NOT NULL,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sport, league, conference, season, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_conf_strength ON features_conference_strength(sport, league, season);

-- ============================================================================
-- LABELS (Ground Truth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS labels (
  label_id TEXT PRIMARY KEY,
  entity_scope TEXT NOT NULL CHECK(entity_scope IN ('play', 'player', 'game', 'season')),
  entity_id TEXT NOT NULL,

  label_type TEXT NOT NULL,  -- is_barrel, is_hr, xwoba, run_value, injury_occurred

  -- Value (one of these will be populated)
  value_numeric REAL,
  value_categorical TEXT,
  value_boolean BOOLEAN,

  -- Confidence/source
  confidence REAL CHECK(confidence BETWEEN 0 AND 1),
  data_source TEXT,  -- 'statcast', 'video_analysis', 'official_scorer'

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_labels_scope ON labels(entity_scope, entity_id);
CREATE INDEX IF NOT EXISTS idx_labels_type ON labels(label_type);

-- ============================================================================
-- MODEL REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_registry (
  model_id TEXT PRIMARY KEY,
  model_key TEXT NOT NULL,  -- xwoba_batball_v1
  version TEXT NOT NULL,    -- semver or git hash

  -- Artifact location
  artifact_r2_uri TEXT NOT NULL,

  -- Model metadata
  algo TEXT NOT NULL,  -- logistic_l2, ridge, lasso, elastic_net, neural_net
  sport TEXT NOT NULL,
  league TEXT NOT NULL,

  -- Training data
  train_date_start TEXT,
  train_date_end TEXT,
  train_samples INTEGER,
  val_samples INTEGER,
  test_samples INTEGER,

  -- Features and hyperparams (JSON)
  features_json JSON NOT NULL,
  hyperparams_json JSON,

  -- Performance metrics (JSON)
  performance_metrics JSON NOT NULL,  -- {auc, rmse, ece, brier, calibration_plot}

  -- Status
  status TEXT DEFAULT 'canary' CHECK(status IN ('canary', 'champion', 'archived')),

  -- Git metadata
  git_hash TEXT,
  git_branch TEXT,

  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_key ON model_registry(model_key);
CREATE INDEX IF NOT EXISTS idx_model_status ON model_registry(status);
CREATE INDEX IF NOT EXISTS idx_model_sport ON model_registry(sport, league);

CREATE TABLE IF NOT EXISTS eval_snapshots (
  eval_id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES model_registry(model_id) NOT NULL,

  dataset_tag TEXT NOT NULL,  -- holdout_2025, val_fold_3, production_7d
  eval_timestamp TEXT NOT NULL,

  -- Comprehensive metrics (JSON)
  metrics_json JSON NOT NULL,  -- {auc, pr_auc, rmse, mae, ece, brier, lift_table, confusion_matrix}

  -- Feature importance
  feature_importance_json JSON,

  -- Calibration
  calibration_plot_json JSON,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eval_model ON eval_snapshots(model_id);
CREATE INDEX IF NOT EXISTS idx_eval_timestamp ON eval_snapshots(eval_timestamp);

-- ============================================================================
-- PREDICTION LOG (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prediction_log (
  prediction_id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES model_registry(model_id) NOT NULL,

  entity_id TEXT NOT NULL,  -- play_id, player_id, etc.
  entity_type TEXT NOT NULL,

  -- Input features
  features_json JSON NOT NULL,

  -- Prediction output
  prediction_value REAL,
  prediction_proba REAL CHECK(prediction_proba BETWEEN 0 AND 1),
  prediction_class TEXT,

  -- Explainability
  top_contributors_json JSON,  -- [{feature, weight, contribution}]

  -- Actual outcome (populated later)
  actual_outcome REAL,
  actual_class TEXT,

  -- Performance tracking
  error REAL,  -- prediction - actual
  absolute_error REAL,

  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pred_log_model ON prediction_log(model_id);
CREATE INDEX IF NOT EXISTS idx_pred_log_timestamp ON prediction_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_pred_log_entity ON prediction_log(entity_type, entity_id);

-- ============================================================================
-- DRIFT MONITORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS drift_snapshots (
  drift_id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES model_registry(model_id) NOT NULL,

  snapshot_timestamp TEXT NOT NULL,
  window_hours INTEGER NOT NULL,  -- 24, 168 (week), etc.

  -- Population Stability Index per feature
  psi_json JSON NOT NULL,  -- {feature_name: psi_value}

  -- Overall drift status
  drift_status TEXT CHECK(drift_status IN ('ok', 'warning', 'critical')),
  drift_score REAL,

  -- Recommendations
  recommendation TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drift_model ON drift_snapshots(model_id);
CREATE INDEX IF NOT EXISTS idx_drift_timestamp ON drift_snapshots(snapshot_timestamp);

-- ============================================================================
-- CHAMPION ENIGMA (8-Dimensional Performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS champion_enigma_scores (
  score_id TEXT PRIMARY KEY,
  player_id TEXT REFERENCES players(player_id) NOT NULL,

  season INTEGER NOT NULL,
  as_of_date TEXT NOT NULL,

  -- 8 Dimensions (percentiles 0-100)
  clutch_gene REAL CHECK(clutch_gene BETWEEN 0 AND 100),
  killer_instinct REAL CHECK(killer_instinct BETWEEN 0 AND 100),
  flow_state REAL CHECK(flow_state BETWEEN 0 AND 100),
  mental_fortress REAL CHECK(mental_fortress BETWEEN 0 AND 100),
  predator_mindset REAL CHECK(predator_mindset BETWEEN 0 AND 100),
  champion_aura REAL CHECK(champion_aura BETWEEN 0 AND 100),
  winner_dna REAL CHECK(winner_dna BETWEEN 0 AND 100),
  beast_mode REAL CHECK(beast_mode BETWEEN 0 AND 100),

  -- Meta
  overall_index REAL,  -- Composite score
  confidence REAL CHECK(confidence BETWEEN 0 AND 1),
  sample_size INTEGER,

  -- Championship context
  cws_performance_delta REAL,  -- Predicted performance boost in CWS

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, season, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_enigma_player ON champion_enigma_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_enigma_season ON champion_enigma_scores(season);

-- ============================================================================
-- INJURY RISK (Aggregate Only for Public)
-- ============================================================================

CREATE TABLE IF NOT EXISTS injury_risk_team_summary (
  summary_id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id) NOT NULL,

  as_of_date TEXT NOT NULL,

  -- Aggregate metrics (NO individual player identification)
  high_risk_count INTEGER,
  medium_risk_count INTEGER,
  low_risk_count INTEGER,

  avg_workload_percentile REAL,
  recommended_rest_days INTEGER,

  -- Risk categories
  ucl_risk_aggregate REAL,
  hamstring_risk_aggregate REAL,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_injury_team ON injury_risk_team_summary(team_id);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active models by sport
CREATE VIEW IF NOT EXISTS v_active_models AS
SELECT
  model_key,
  model_id,
  sport,
  league,
  algo,
  status,
  json_extract(performance_metrics, '$.auc_roc') as auc,
  json_extract(performance_metrics, '$.ece') as ece,
  created_at
FROM model_registry
WHERE status IN ('champion', 'canary')
ORDER BY sport, league, model_key;

-- Recent predictions with actuals
CREATE VIEW IF NOT EXISTS v_recent_predictions AS
SELECT
  p.prediction_id,
  p.model_id,
  m.model_key,
  p.entity_id,
  p.prediction_proba,
  p.actual_outcome,
  p.error,
  p.timestamp
FROM prediction_log p
JOIN model_registry m ON p.model_id = m.model_id
WHERE p.timestamp >= datetime('now', '-7 days')
  AND p.actual_outcome IS NOT NULL
ORDER BY p.timestamp DESC;

-- Conference strength rankings
CREATE VIEW IF NOT EXISTS v_conference_rankings AS
SELECT
  sport,
  league,
  season,
  conference,
  elo_rating,
  elo_rank,
  overall_win_pct,
  nonconf_win_pct
FROM features_conference_strength
WHERE as_of_date = (
  SELECT MAX(as_of_date)
  FROM features_conference_strength fcs2
  WHERE fcs2.sport = features_conference_strength.sport
    AND fcs2.league = features_conference_strength.league
    AND fcs2.season = features_conference_strength.season
)
ORDER BY sport, league, season, elo_rank;

-- ============================================================================
-- FAN ENGAGEMENT & AI FEATURES (Phase 20)
-- ============================================================================

-- Daily Trivia System
CREATE TABLE IF NOT EXISTS trivia_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  options JSON NOT NULL,           -- ["Option A", "Option B", "Option C", "Option D"]
  category TEXT NOT NULL CHECK(category IN ('baseball', 'football', 'basketball', 'history', 'records')),
  difficulty INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 3),
  sport TEXT CHECK(sport IN ('baseball', 'football', 'basketball', NULL)),
  explanation TEXT,                -- Why the answer is correct
  source TEXT,                     -- Citation for the fact
  active BOOLEAN DEFAULT TRUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trivia_category ON trivia_questions(category);
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty ON trivia_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_trivia_active ON trivia_questions(active);

CREATE TABLE IF NOT EXISTS trivia_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT,                    -- NULL for anonymous
  question_id TEXT NOT NULL REFERENCES trivia_questions(id),
  selected_answer TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK(correct IN (0, 1)),
  response_time_ms INTEGER,        -- How fast they answered
  session_id TEXT,                 -- Group responses by session
  answered_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trivia_responses_user ON trivia_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_trivia_responses_question ON trivia_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_trivia_responses_date ON trivia_responses(answered_at);

CREATE TABLE IF NOT EXISTS trivia_streaks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_attempted INTEGER DEFAULT 0,
  last_played_date TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trivia_streaks_user ON trivia_streaks(user_id);

-- Beat the Line Predictions
CREATE TABLE IF NOT EXISTS prediction_props (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL CHECK(sport IN ('baseball', 'football', 'basketball')),
  prop_type TEXT NOT NULL,         -- 'over_under', 'spread', 'moneyline', 'player_prop'
  description TEXT NOT NULL,
  line_value REAL,
  game_id TEXT,
  player_id TEXT,
  expires_at TEXT NOT NULL,
  result TEXT CHECK(result IN ('over', 'under', 'push', 'pending', NULL)),
  actual_value REAL,
  source TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_props_sport ON prediction_props(sport);
CREATE INDEX IF NOT EXISTS idx_props_expires ON prediction_props(expires_at);
CREATE INDEX IF NOT EXISTS idx_props_result ON prediction_props(result);

CREATE TABLE IF NOT EXISTS user_predictions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prop_id TEXT NOT NULL REFERENCES prediction_props(id),
  prediction TEXT NOT NULL CHECK(prediction IN ('over', 'under', 'home', 'away')),
  confidence INTEGER CHECK(confidence BETWEEN 1 AND 5),
  result TEXT CHECK(result IN ('correct', 'incorrect', 'push', 'pending')),
  points_earned INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_predictions_user ON user_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_prop ON user_predictions(prop_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_result ON user_predictions(result);

-- AI Query Log (for Natural Language Stat Query)
CREATE TABLE IF NOT EXISTS ai_queries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  query_text TEXT NOT NULL,
  parsed_intent JSON,              -- {"entity": "player", "stat": "ERA", "timeframe": "last_week"}
  response_text TEXT NOT NULL,
  response_data JSON,              -- Structured data returned
  model TEXT NOT NULL,             -- 'llama-3.1-8b-instruct'
  latency_ms INTEGER,
  tokens_used INTEGER,
  sources_cited JSON,              -- ["Baseball-Reference", "NCAA Stats"]
  feedback_rating INTEGER CHECK(feedback_rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_queries_user ON ai_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_queries_date ON ai_queries(created_at);

-- AI Scouting Report Cache
CREATE TABLE IF NOT EXISTS ai_scouting_reports (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK(report_type IN ('brief', 'full', 'draft')),
  report_text TEXT NOT NULL,
  key_stats JSON NOT NULL,         -- Verified stats used in report
  strengths JSON,                  -- ["Power hitter", "Plate discipline"]
  weaknesses JSON,                 -- ["Strikeout prone", "Slow runner"]
  comparable_players JSON,         -- ["Player A", "Player B"]
  projection_grade TEXT,           -- "55", "60", etc.
  model TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,        -- Reports cache for 1 hour
  fact_checked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_scouting_player ON ai_scouting_reports(player_id);
CREATE INDEX IF NOT EXISTS idx_scouting_expires ON ai_scouting_reports(expires_at);

-- Transfer Portal Predictions
CREATE TABLE IF NOT EXISTS portal_entries (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  position TEXT,
  origin_school TEXT NOT NULL,
  origin_conference TEXT,
  entry_date TEXT NOT NULL,
  status TEXT CHECK(status IN ('in_portal', 'committed', 'withdrawn')),
  destination_school TEXT,
  destination_conference TEXT,
  commitment_date TEXT,
  nil_estimate REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portal_status ON portal_entries(status);
CREATE INDEX IF NOT EXISTS idx_portal_entry_date ON portal_entries(entry_date);

CREATE TABLE IF NOT EXISTS portal_predictions (
  id TEXT PRIMARY KEY,
  portal_entry_id TEXT NOT NULL REFERENCES portal_entries(id),
  predicted_school TEXT NOT NULL,
  probability REAL NOT NULL CHECK(probability BETWEEN 0 AND 1),
  factors JSON,                    -- ["NIL opportunity", "Playing time", "Conference move"]
  model_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portal_preds_entry ON portal_predictions(portal_entry_id);

-- Guess the Stat Game
CREATE TABLE IF NOT EXISTS guess_stat_rounds (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  stat_type TEXT NOT NULL,         -- 'batting_avg', 'era', 'home_runs', etc.
  actual_value REAL NOT NULL,
  hint_level_1 TEXT NOT NULL,      -- "This SEC slugger..."
  hint_level_2 TEXT,               -- "He hit 15+ HR..."
  hint_level_3 TEXT,               -- Player silhouette clue
  active_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guess_stat_date ON guess_stat_rounds(active_date);

CREATE TABLE IF NOT EXISTS guess_stat_attempts (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES guess_stat_rounds(id),
  user_id TEXT,
  guessed_value REAL NOT NULL,
  error_pct REAL NOT NULL,         -- |guess - actual| / actual * 100
  hints_used INTEGER DEFAULT 0,
  score INTEGER NOT NULL,          -- Points earned
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guess_attempts_round ON guess_stat_attempts(round_id);
CREATE INDEX IF NOT EXISTS idx_guess_attempts_user ON guess_stat_attempts(user_id);
