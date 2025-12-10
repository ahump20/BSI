-- ============================================================================
-- BLAZE SPORTS INTEL - BILLING & AUTH SCHEMA
-- Required for Stripe subscriptions, user auth, and API key management
-- ============================================================================
-- Created: 2025-12-10
-- Database: blazesports-historical (D1)
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- Core authentication and tier management
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK(tier IN ('free', 'pro', 'enterprise')),
  email_verified INTEGER DEFAULT 0 CHECK(email_verified IN (0, 1)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- Stripe subscription lifecycle tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_tier TEXT NOT NULL DEFAULT 'pro' CHECK(plan_tier IN ('pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  cancel_at_period_end INTEGER DEFAULT 0 CHECK(cancel_at_period_end IN (0, 1)),
  current_period_start INTEGER,
  current_period_end INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- PAYMENTS TABLE
-- Stripe payment history and invoice tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_id TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  subscription_id TEXT,
  user_id TEXT,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK(status IN ('succeeded', 'failed', 'pending', 'refunded')),
  attempt_count INTEGER DEFAULT 1,
  failure_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

-- ============================================================================
-- API KEYS TABLE
-- Developer API key management
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT DEFAULT 'read',
  rate_limit INTEGER DEFAULT 100,
  last_used_at INTEGER,
  expires_at INTEGER,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- ============================================================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- Optional backup for KV-stored subscribers
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email_hash TEXT UNIQUE NOT NULL,
  subscribed_at TEXT NOT NULL,
  source TEXT DEFAULT 'homepage',
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'unsubscribed'))
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email_hash ON newsletter_subscribers(email_hash);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active subscriptions with user details
CREATE VIEW IF NOT EXISTS v_active_subscriptions AS
SELECT
  u.id as user_id,
  u.email,
  u.name,
  u.tier,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status as subscription_status,
  s.current_period_end,
  s.cancel_at_period_end
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active';

-- User subscription summary
CREATE VIEW IF NOT EXISTS v_user_subscription_summary AS
SELECT
  u.id as user_id,
  u.email,
  u.tier,
  COUNT(s.id) as subscription_count,
  SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active_subscriptions,
  MAX(s.current_period_end) as latest_period_end
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
GROUP BY u.id, u.email, u.tier;

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================
INSERT OR IGNORE INTO schema_version (version, description)
VALUES ('2.0.0', 'Billing and auth infrastructure: users, subscriptions, payments, api_keys');
