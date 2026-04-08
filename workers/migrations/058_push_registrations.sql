-- Push notification registrations for Expo Push API
-- Used by mobile app to register push tokens and team preferences
CREATE TABLE IF NOT EXISTS push_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expo_push_token TEXT UNIQUE NOT NULL,
  favorite_teams TEXT NOT NULL DEFAULT '[]',
  platform TEXT DEFAULT 'ios',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_push_token ON push_registrations(expo_push_token);
