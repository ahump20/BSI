-- Model Health Tracking
-- Stores weekly accuracy metrics for prediction models

CREATE TABLE IF NOT EXISTS model_health (
  id INTEGER PRIMARY KEY,
  week TEXT NOT NULL,
  accuracy REAL NOT NULL,
  sport TEXT DEFAULT 'all',
  recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial data
INSERT INTO model_health (week, accuracy, sport, recorded_at) VALUES
  ('W1', 0.72, 'all', '2026-01-06'),
  ('W2', 0.74, 'all', '2026-01-13'),
  ('W3', 0.71, 'all', '2026-01-20'),
  ('W4', 0.76, 'all', '2026-01-27'),
  ('W5', 0.73, 'all', '2026-02-03'),
  ('W6', 0.75, 'all', '2026-02-10');
