-- Migration: 004_vision_baselines
-- Purpose: Store user calibration baselines for Vision AI pose estimation
-- Created: 2025-12-28

-- Vision AI baseline storage
CREATE TABLE IF NOT EXISTS vision_baselines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    baseline_data TEXT NOT NULL,  -- JSON: {stability, shoulderSymmetry, hipSymmetry, spineLean, savedAt}
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_vision_baselines_user_id ON vision_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_baselines_updated_at ON vision_baselines(updated_at);

-- Vision AI session recordings metadata (optional - full recordings stored client-side in IndexedDB)
CREATE TABLE IF NOT EXISTS vision_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    session_name TEXT,
    frame_count INTEGER DEFAULT 0,
    duration_seconds REAL DEFAULT 0,
    average_stability REAL,
    average_symmetry REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES vision_baselines(user_id)
);

CREATE INDEX IF NOT EXISTS idx_vision_sessions_user_id ON vision_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_sessions_created_at ON vision_sessions(created_at);
