-- Blaze Sports Intel - Live Event Reconstruction Schema
-- Database migration for real-time 3D analytics and reconstruction
-- Created: 2025-10-31 (America/Chicago)
-- Version: 1.0.0

-- ============================================================================
-- CORE TABLES: Live Game Monitoring
-- ============================================================================

-- Track actively monitored live games
CREATE TABLE IF NOT EXISTS live_games (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL CHECK (sport IN ('mlb', 'nfl', 'nba', 'ncaa_football', 'ncaa_baseball')),
  game_id TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  game_state TEXT, -- JSON: {period, score, clock, status}
  start_time TEXT NOT NULL, -- ISO8601 timestamp
  monitoring_started TEXT NOT NULL DEFAULT (datetime('now')),
  last_polled TEXT,
  poll_interval_seconds INTEGER NOT NULL DEFAULT 15,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(sport, game_id)
);

CREATE INDEX IF NOT EXISTS idx_live_games_active ON live_games(is_active, sport);
CREATE INDEX IF NOT EXISTS idx_live_games_game_id ON live_games(game_id);
CREATE INDEX IF NOT EXISTS idx_live_games_start_time ON live_games(start_time);

-- ============================================================================
-- EVENT DETECTION: Analytically Interesting Moments
-- ============================================================================

-- Store detected events for reconstruction
CREATE TABLE IF NOT EXISTS live_events (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'batted_ball', 'pitch', 'defensive_play', 'scoring_play',
    'turnover', 'big_play', 'biomechanical_anomaly', 'rare_event'
  )),
  timestamp TEXT NOT NULL, -- ISO8601 timestamp
  game_timestamp TEXT, -- In-game time (e.g., "Top 3rd, 2 outs")

  -- Analytics metrics
  leverage_index REAL,
  win_prob_delta REAL,
  expected_value REAL,
  actual_value REAL,
  significance_score REAL NOT NULL, -- 0-100 scale

  -- Raw data payload
  raw_data TEXT NOT NULL, -- JSON blob with complete event data
  statcast_data TEXT, -- JSON blob with Statcast tracking data (MLB)

  -- Flags
  is_reconstructed INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (game_id) REFERENCES live_games(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_live_events_game ON live_events(game_id);
CREATE INDEX IF NOT EXISTS idx_live_events_timestamp ON live_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_live_events_significance ON live_events(significance_score DESC);
CREATE INDEX IF NOT EXISTS idx_live_events_reconstructed ON live_events(is_reconstructed);
CREATE INDEX IF NOT EXISTS idx_live_events_type ON live_events(event_type);

-- ============================================================================
-- 3D RECONSTRUCTIONS: Generated Scenes and Analytics
-- ============================================================================

-- Store 3D reconstruction data and exports
CREATE TABLE IF NOT EXISTS reconstructions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,

  -- 3D Scene Data
  scene_data TEXT NOT NULL, -- JSON: {positions, trajectories, annotations, camera}
  physics_params TEXT, -- JSON: {gravity, air_resistance, spin_effect, wind}

  -- Prediction vs Reality
  prediction_data TEXT, -- JSON: {predicted_outcome, probability, factors}
  actual_outcome TEXT NOT NULL, -- JSON: {result, deviation, surprise_factor}
  prediction_accuracy REAL, -- 0-1 scale

  -- Export Assets (R2 URLs)
  video_url TEXT, -- MP4 render
  thumbnail_url TEXT, -- PNG/JPG
  gif_url TEXT, -- Animated GIF for social
  embed_code TEXT, -- iframe HTML

  -- Social Media Exports
  twitter_card_url TEXT,
  instagram_story_url TEXT,

  -- Metadata
  render_time_ms INTEGER,
  data_quality_score REAL, -- 0-1 based on completeness
  spatial_accuracy_cm REAL, -- Accuracy in centimeters vs tracking data

  -- Publishing
  is_published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (event_id) REFERENCES live_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reconstructions_event ON reconstructions(event_id);
CREATE INDEX IF NOT EXISTS idx_reconstructions_published ON reconstructions(is_published);
CREATE INDEX IF NOT EXISTS idx_reconstructions_created ON reconstructions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reconstructions_accuracy ON reconstructions(prediction_accuracy DESC);

-- ============================================================================
-- HIGHLIGHT LIBRARY: Searchable Content Database
-- ============================================================================

-- Aggregate highlights by game/date/team
CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  reconstruction_id TEXT NOT NULL,

  -- Classification
  sport TEXT NOT NULL,
  highlight_type TEXT NOT NULL, -- 'top_play', 'rare_event', 'leverage_moment', 'analytical_interest'
  ranking INTEGER, -- 1-10 per game

  -- Searchable metadata
  teams TEXT NOT NULL, -- JSON array: ["Cardinals", "Dodgers"]
  players TEXT, -- JSON array: ["Player 1", "Player 2"]
  tags TEXT, -- JSON array: ["walk-off", "diving-catch", "statcast-gem"]

  -- Analytics
  leverage_index REAL,
  win_prob_added REAL,
  percentile_rank REAL, -- Historical percentile (95th = top 5%)

  -- Social performance
  engagement_score REAL, -- Calculated from views/shares/saves

  date TEXT NOT NULL, -- YYYY-MM-DD for daily aggregation
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (game_id) REFERENCES live_games(id) ON DELETE CASCADE,
  FOREIGN KEY (reconstruction_id) REFERENCES reconstructions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_highlights_game ON highlights(game_id);
CREATE INDEX IF NOT EXISTS idx_highlights_date ON highlights(date DESC);
CREATE INDEX IF NOT EXISTS idx_highlights_ranking ON highlights(ranking);
CREATE INDEX IF NOT EXISTS idx_highlights_engagement ON highlights(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_highlights_type ON highlights(highlight_type);

-- ============================================================================
-- PREDICTION TRACKING: Model Validation
-- ============================================================================

-- Track all predictions for accuracy validation
CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,

  -- Prediction details
  model_name TEXT NOT NULL, -- 'pythagorean', 'statcast', 'win_probability', etc.
  model_version TEXT NOT NULL,
  prediction_type TEXT NOT NULL, -- 'catch_probability', 'hit_probability', 'win_probability'

  -- Predicted values
  predicted_outcome TEXT NOT NULL, -- JSON: {value, probability, confidence_interval}
  predicted_probability REAL,
  confidence_score REAL,

  -- Actual outcome
  actual_outcome TEXT, -- JSON: {value, timestamp}
  was_correct INTEGER, -- Boolean: 1 if prediction matched
  error_margin REAL, -- Numerical difference between predicted and actual

  -- Metadata
  features_used TEXT, -- JSON: Input features that drove prediction
  prediction_timestamp TEXT NOT NULL,
  outcome_timestamp TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (event_id) REFERENCES live_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_predictions_event ON predictions(event_id);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_name, model_version);
CREATE INDEX IF NOT EXISTS idx_predictions_correct ON predictions(was_correct);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(prediction_timestamp DESC);

-- ============================================================================
-- CONTENT PIPELINE: Automated Publishing Queue
-- ============================================================================

-- Queue for automated social media posts
CREATE TABLE IF NOT EXISTS content_queue (
  id TEXT PRIMARY KEY,
  reconstruction_id TEXT NOT NULL,

  -- Content details
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram', 'facebook', 'youtube')),
  content_type TEXT NOT NULL, -- 'video', 'image', 'carousel', 'story'
  caption TEXT,
  hashtags TEXT, -- JSON array

  -- Assets
  media_urls TEXT NOT NULL, -- JSON array of URLs

  -- Scheduling
  scheduled_for TEXT,
  published_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'published', 'failed')),

  -- Performance tracking
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (reconstruction_id) REFERENCES reconstructions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_queue_scheduled ON content_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_queue_platform ON content_queue(platform);

-- ============================================================================
-- ANALYTICS: Performance Metrics
-- ============================================================================

-- Track system performance and accuracy
CREATE TABLE IF NOT EXISTS system_metrics (
  id TEXT PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'reconstruction_time', 'prediction_accuracy', 'api_latency'
  sport TEXT NOT NULL,

  -- Measurements
  value REAL NOT NULL,
  unit TEXT NOT NULL, -- 'milliseconds', 'percentage', 'count'

  -- Context
  metadata TEXT, -- JSON: Additional context

  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_live_games_timestamp
AFTER UPDATE ON live_games
BEGIN
  UPDATE live_games SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_reconstructions_timestamp
AFTER UPDATE ON reconstructions
BEGIN
  UPDATE reconstructions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_content_queue_timestamp
AFTER UPDATE ON content_queue
BEGIN
  UPDATE content_queue SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- VIEWS: Common Queries
-- ============================================================================

-- Active monitoring summary
CREATE VIEW IF NOT EXISTS v_active_monitoring AS
SELECT
  lg.sport,
  COUNT(*) as active_games,
  MAX(lg.last_polled) as last_poll_time,
  COUNT(DISTINCT le.id) as total_events,
  SUM(CASE WHEN le.is_reconstructed = 1 THEN 1 ELSE 0 END) as reconstructed_count
FROM live_games lg
LEFT JOIN live_events le ON lg.id = le.game_id
WHERE lg.is_active = 1
GROUP BY lg.sport;

-- Top highlights by date
CREATE VIEW IF NOT EXISTS v_daily_highlights AS
SELECT
  h.date,
  h.sport,
  h.highlight_type,
  COUNT(*) as highlight_count,
  AVG(h.engagement_score) as avg_engagement,
  AVG(h.leverage_index) as avg_leverage
FROM highlights h
GROUP BY h.date, h.sport, h.highlight_type
ORDER BY h.date DESC;

-- Model accuracy summary
CREATE VIEW IF NOT EXISTS v_model_accuracy AS
SELECT
  p.model_name,
  p.model_version,
  p.prediction_type,
  COUNT(*) as total_predictions,
  SUM(CASE WHEN p.was_correct = 1 THEN 1 ELSE 0 END) as correct_predictions,
  ROUND(AVG(CASE WHEN p.was_correct = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as accuracy_pct,
  AVG(p.error_margin) as avg_error
FROM predictions p
WHERE p.actual_outcome IS NOT NULL
GROUP BY p.model_name, p.model_version, p.prediction_type;

-- ============================================================================
-- INITIAL DATA: Example monitoring configuration
-- ============================================================================

-- No initial data - tables will be populated by live monitoring system

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run migration: wrangler d1 execute blazesports-historical --file=schema/004_live_event_reconstruction.sql --remote
-- 2. Implement Cloudflare Workers for live monitoring
-- 3. Build 3D reconstruction engine
-- 4. Create API endpoints for data access
-- ============================================================================
