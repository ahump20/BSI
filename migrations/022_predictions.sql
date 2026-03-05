-- Prediction Tracking Schema
-- Records model predictions and actual outcomes for accuracy tracking

CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  predicted_winner TEXT,
  confidence REAL,
  spread REAL,
  over_under REAL,
  model_version TEXT DEFAULT '1.0',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outcomes (
  id INTEGER PRIMARY KEY,
  game_id TEXT NOT NULL UNIQUE,
  actual_winner TEXT,
  home_score INTEGER,
  away_score INTEGER,
  recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_predictions_game ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_predictions_sport ON predictions(sport);
CREATE INDEX IF NOT EXISTS idx_outcomes_game ON outcomes(game_id);
