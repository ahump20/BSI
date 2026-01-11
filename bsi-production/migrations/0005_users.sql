-- Users table for authentication
-- Migration 0005: Core user accounts for BSI
-- Created: 2026-01-10

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);
