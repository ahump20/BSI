-- Migration: College Baseball Standings Table
-- Created: 2025-01-08
-- Description: Add standings table (rankings tables already exist)

-- College Baseball Standings (conference standings)
CREATE TABLE IF NOT EXISTS college_baseball_standings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    conference TEXT NOT NULL,
    conference_record TEXT,
    overall_record TEXT,
    win_pct REAL,
    games_back REAL,
    streak TEXT,
    rpi REAL,
    season INTEGER NOT NULL DEFAULT 2025,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for conference lookups
CREATE INDEX IF NOT EXISTS idx_baseball_standings_conference
ON college_baseball_standings(conference, season);

-- Index for team lookups
CREATE INDEX IF NOT EXISTS idx_baseball_standings_team
ON college_baseball_standings(team_id, season);
