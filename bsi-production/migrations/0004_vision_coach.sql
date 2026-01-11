-- Vision Coach Persistence Schema
-- Migration 0004: Tables for session storage, challenges, and achievements
-- Created: 2025-01-10

-- ============================================
-- VISION COACH SESSIONS
-- Stores completed training sessions with metrics and replay data
-- ============================================
CREATE TABLE IF NOT EXISTS vision_coach_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  duration INTEGER NOT NULL,
  attractor TEXT NOT NULL,

  -- Aggregate metrics (0-100 scale)
  avg_presence REAL NOT NULL,
  avg_stability REAL NOT NULL,
  peak_presence REAL NOT NULL,
  avg_pitch REAL,
  avg_voice_energy REAL,

  -- Composite scoring
  composite_score REAL,
  composite_grade TEXT,

  -- Historical data (JSON arrays)
  presence_history TEXT,  -- JSON array of presence scores over time
  snapshots TEXT,         -- JSON array of full metric snapshots for replay

  -- Metadata
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_vc_sessions_user ON vision_coach_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vc_sessions_user_date ON vision_coach_sessions(user_id, date DESC);

-- ============================================
-- VISION COACH CHALLENGES
-- Tracks completed coaching challenges per user
-- ============================================
CREATE TABLE IF NOT EXISTS vision_coach_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  badge TEXT,
  xp INTEGER DEFAULT 0,

  -- Prevent duplicate completions
  UNIQUE(user_id, challenge_id)
);

-- Index for user challenge lookups
CREATE INDEX IF NOT EXISTS idx_vc_challenges_user ON vision_coach_challenges(user_id);

-- ============================================
-- VISION COACH ACHIEVEMENTS (Future expansion)
-- Badge system for milestone achievements
-- ============================================
CREATE TABLE IF NOT EXISTS vision_coach_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  earned_at TEXT DEFAULT (datetime('now')),
  session_id TEXT REFERENCES vision_coach_sessions(id),

  UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_vc_achievements_user ON vision_coach_achievements(user_id);

-- ============================================
-- AGGREGATE STATS VIEW
-- Quick access to user's overall Vision Coach stats
-- ============================================
CREATE VIEW IF NOT EXISTS v_user_vision_coach_stats AS
SELECT
  user_id,
  COUNT(*) as total_sessions,
  SUM(duration) as total_duration_seconds,
  ROUND(AVG(avg_presence), 1) as overall_avg_presence,
  MAX(peak_presence) as all_time_peak_presence,
  ROUND(AVG(avg_stability), 1) as overall_avg_stability,
  MAX(date) as last_session_at,
  (SELECT COUNT(*) FROM vision_coach_challenges c WHERE c.user_id = s.user_id) as challenges_completed,
  (SELECT COALESCE(SUM(xp), 0) FROM vision_coach_challenges c WHERE c.user_id = s.user_id) as total_xp
FROM vision_coach_sessions s
GROUP BY user_id;
