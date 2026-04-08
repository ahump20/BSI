-- Push notification token registrations
CREATE TABLE IF NOT EXISTS push_registrations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  expo_token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'ios',
  favorite_teams TEXT DEFAULT '[]',
  active_sports TEXT DEFAULT '["college-baseball","mlb","nfl","cfb","nba"]',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_push_reg_token ON push_registrations(expo_token);
CREATE INDEX IF NOT EXISTS idx_push_reg_enabled ON push_registrations(enabled);

-- Push notification send log for rate limiting
CREATE TABLE IF NOT EXISTS push_send_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  registration_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (registration_id) REFERENCES push_registrations(id)
);

CREATE INDEX IF NOT EXISTS idx_push_log_reg_game ON push_send_log(registration_id, game_id);
CREATE INDEX IF NOT EXISTS idx_push_log_sent ON push_send_log(sent_at);
