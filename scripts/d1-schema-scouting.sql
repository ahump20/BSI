-- College Baseball Scouting Engine - D1 Database Schema
-- Version: 1.0.0
-- Date: 2025-10-16
-- Timezone: America/Chicago
--
-- Tables for storing scouting data, historical player stats, and analysis results

-- ============================================================================
-- Player History: Game-by-game performance tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  game_id TEXT,
  game_date TEXT NOT NULL,
  opponent TEXT,
  opponent_rank INTEGER,

  -- Pitching stats
  innings_pitched REAL DEFAULT 0,
  strikeouts INTEGER DEFAULT 0,
  walks INTEGER DEFAULT 0,
  hits_allowed INTEGER DEFAULT 0,
  earned_runs INTEGER DEFAULT 0,
  pitch_count INTEGER DEFAULT 0,

  -- Velocity tracking
  avg_velocity REAL,
  max_velocity REAL,
  min_velocity REAL,
  velocity_stddev REAL,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(player_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_player_history_player_id ON player_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_history_game_date ON player_history(game_date DESC);

-- ============================================================================
-- Scout Notes: Free-form observations and rubric ratings
-- ============================================================================
CREATE TABLE IF NOT EXISTS scout_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  scout_name TEXT,
  scout_organization TEXT,

  -- Free-form notes
  notes TEXT,

  -- Rubric ratings (1-5 scale)
  -- Stored as JSON: {"leadership": 4, "work_ethic": 5, "composure": 3, "coachability": 4}
  rubric_json TEXT,

  -- Game context
  game_id TEXT,
  game_date TEXT,
  opponent TEXT,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scout_notes_player_id ON scout_notes(player_id);
CREATE INDEX IF NOT EXISTS idx_scout_notes_created_at ON scout_notes(created_at DESC);

-- ============================================================================
-- Scouting Reports: Complete ensemble model outputs
-- ============================================================================
CREATE TABLE IF NOT EXISTS scouting_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  team_id TEXT,

  -- Complete report stored as JSON
  report_json TEXT NOT NULL,

  -- Quick access fields (denormalized for querying)
  draft_grade INTEGER,
  confidence_level TEXT,
  recommendation TEXT,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scouting_reports_player_id ON scouting_reports(player_id);
CREATE INDEX IF NOT EXISTS idx_scouting_reports_draft_grade ON scouting_reports(draft_grade DESC);
CREATE INDEX IF NOT EXISTS idx_scouting_reports_created_at ON scouting_reports(created_at DESC);

-- ============================================================================
-- Enigma Scores: Champion Enigma Engine proprietary cognitive assessments
-- ============================================================================
CREATE TABLE IF NOT EXISTS enigma_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL UNIQUE,

  -- Cognitive assessment scores (0-100 scale)
  enigma_score REAL NOT NULL,
  confidence REAL NOT NULL,

  -- Detailed cognitive traits (stored as JSON)
  cognitive_traits_json TEXT,

  -- Assessment metadata
  assessment_date TEXT,
  assessor TEXT,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enigma_scores_player_id ON enigma_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_enigma_scores_enigma_score ON enigma_scores(enigma_score DESC);

-- ============================================================================
-- Team Roster: Current roster for graph-based analysis (future use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_roster (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT,
  position TEXT,

  -- Feature vector for GNN (stored as JSON)
  features_json TEXT,

  -- Status
  active INTEGER DEFAULT 1,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(team_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_team_roster_team_id ON team_roster(team_id);
CREATE INDEX IF NOT EXISTS idx_team_roster_player_id ON team_roster(player_id);

-- ============================================================================
-- Team Roles: Defined roles/archetypes for scheme fit analysis (future use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  role_name TEXT NOT NULL,
  role_description TEXT,

  -- Requirements vector (stored as JSON)
  requirements_json TEXT,

  -- Metadata
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(team_id, role_name)
);

CREATE INDEX IF NOT EXISTS idx_team_roles_team_id ON team_roles(team_id);

-- ============================================================================
-- Seed Data: Sample scout notes and player history
-- ============================================================================

-- Sample scout notes for demo purposes
INSERT OR IGNORE INTO scout_notes (player_id, scout_name, scout_organization, notes, rubric_json, game_date)
VALUES
(
  'demo_player_001',
  'John Smith',
  'Texas Baseball Analytics',
  'Excellent velocity consistency throughout 7 innings. Strong composure under pressure against ranked opponent. Work ethic evident in post-game conditioning routine.',
  '{"leadership": 4, "work_ethic": 5, "composure": 4, "coachability": 4}',
  '2025-03-15'
);

-- Sample player history
INSERT OR IGNORE INTO player_history (
  player_id, game_id, game_date, opponent, opponent_rank,
  innings_pitched, strikeouts, walks, hits_allowed, earned_runs,
  avg_velocity, max_velocity, min_velocity
)
VALUES
(
  'demo_player_001',
  'game_001',
  '2025-03-15',
  'LSU',
  5,
  7.0,
  10,
  2,
  4,
  1,
  93.5,
  96.2,
  91.8
),
(
  'demo_player_001',
  'game_002',
  '2025-03-08',
  'Arkansas',
  12,
  6.0,
  8,
  3,
  5,
  2,
  92.8,
  95.6,
  90.9
);

-- Sample enigma score
INSERT OR IGNORE INTO enigma_scores (
  player_id,
  enigma_score,
  confidence,
  cognitive_traits_json,
  assessment_date,
  assessor
)
VALUES (
  'demo_player_001',
  87.5,
  0.92,
  '{"pattern_recognition": 89, "decision_speed": 91, "tactical_awareness": 83, "adaptability": 88}',
  '2025-02-01',
  'Blaze Intelligence Cognitive Assessment'
);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Latest scouting report per player
CREATE VIEW IF NOT EXISTS latest_scouting_reports AS
SELECT
  sr.*,
  ROW_NUMBER() OVER (PARTITION BY sr.player_id ORDER BY sr.created_at DESC) as rn
FROM scouting_reports sr;

-- Player performance trends
CREATE VIEW IF NOT EXISTS player_velocity_trends AS
SELECT
  player_id,
  COUNT(*) as games_tracked,
  AVG(avg_velocity) as season_avg_velocity,
  MAX(max_velocity) as season_peak_velocity,
  MIN(min_velocity) as season_min_velocity,
  AVG(velocity_stddev) as avg_consistency,
  AVG(strikeouts) as avg_strikeouts_per_game,
  AVG(walks) as avg_walks_per_game
FROM player_history
GROUP BY player_id;

-- ============================================================================
-- Triggers for Updated Timestamps
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_player_history_timestamp
AFTER UPDATE ON player_history
BEGIN
  UPDATE player_history SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_scout_notes_timestamp
AFTER UPDATE ON scout_notes
BEGIN
  UPDATE scout_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_scouting_reports_timestamp
AFTER UPDATE ON scouting_reports
BEGIN
  UPDATE scouting_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_enigma_scores_timestamp
AFTER UPDATE ON enigma_scores
BEGIN
  UPDATE enigma_scores SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
