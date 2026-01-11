-- Notification Subscribers table for Transfer Portal alerts
-- Created: 2025-01-08
-- Purpose: Store email subscribers for transfer portal notifications

CREATE TABLE IF NOT EXISTS notification_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  notification_type TEXT NOT NULL DEFAULT 'transfer-portal',  -- transfer-portal, all, digest
  frequency TEXT NOT NULL DEFAULT 'instant',  -- instant, daily, weekly
  status TEXT NOT NULL DEFAULT 'active',  -- active, paused, unsubscribed
  unsubscribe_token TEXT NOT NULL UNIQUE,
  filters_position TEXT,  -- Optional: only notify for specific positions (comma-separated)
  filters_conference TEXT,  -- Optional: only notify for specific conferences (comma-separated)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_notified_at TEXT,
  notification_count INTEGER DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON notification_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON notification_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_type ON notification_subscribers(notification_type);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe ON notification_subscribers(unsubscribe_token);

-- Notification Log table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_log (
  id TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'sent',  -- sent, failed, bounced
  error_message TEXT,
  FOREIGN KEY (subscriber_id) REFERENCES notification_subscribers(id),
  FOREIGN KEY (player_id) REFERENCES transfer_portal(id)
);

CREATE INDEX IF NOT EXISTS idx_notification_log_subscriber ON notification_log(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_player ON notification_log(player_id);
