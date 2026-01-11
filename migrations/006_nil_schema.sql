-- NIL Valuation Database Schema
-- BlazeSportsIntel.com
-- Migration: 0002_nil_schema.sql
-- Created: 2025-11-25

-- ============================================================================
-- PLAYERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS nil_players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    team TEXT NOT NULL,
    conference TEXT NOT NULL,
    class TEXT, -- FR, SO, JR, SR, GR
    height_inches INTEGER,
    weight_lbs INTEGER,
    hometown TEXT,
    state TEXT,
    stars INTEGER DEFAULT 3 CHECK (stars >= 1 AND stars <= 5),
    social_followers INTEGER DEFAULT 0,
    engagement_rate REAL DEFAULT 0,
    tv_games INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nil_players_position ON nil_players(position);
CREATE INDEX IF NOT EXISTS idx_nil_players_team ON nil_players(team);
CREATE INDEX IF NOT EXISTS idx_nil_players_conference ON nil_players(conference);
CREATE INDEX IF NOT EXISTS idx_nil_players_stars ON nil_players(stars DESC);
CREATE INDEX IF NOT EXISTS idx_nil_players_state ON nil_players(state);

-- ============================================================================
-- PLAYER METRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS nil_player_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL UNIQUE,
    position_score REAL DEFAULT 0.5 CHECK (position_score >= 0 AND position_score <= 1),
    efficiency_score REAL DEFAULT 0.5 CHECK (efficiency_score >= 0 AND efficiency_score <= 1),
    production_score REAL DEFAULT 0.5 CHECK (production_score >= 0 AND production_score <= 1),
    games_played INTEGER DEFAULT 0,
    season TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (player_id) REFERENCES nil_players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nil_metrics_player ON nil_player_metrics(player_id);

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS nil_teams (
    id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL UNIQUE,
    conference TEXT NOT NULL,
    conference_rank INTEGER,
    team_ranking INTEGER,
    total_roster_value INTEGER DEFAULT 0,
    avg_player_value INTEGER DEFAULT 0,
    collective_name TEXT,
    position_needs TEXT, -- JSON string of position needs
    budget_remaining INTEGER DEFAULT 0,
    trend TEXT, -- 'rising', 'steady', 'declining'
    year_over_year_change INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nil_teams_conference ON nil_teams(conference);
CREATE INDEX IF NOT EXISTS idx_nil_teams_ranking ON nil_teams(team_ranking);

-- ============================================================================
-- VALUATIONS HISTORY TABLE (for R2 archival)
-- ============================================================================
CREATE TABLE IF NOT EXISTS nil_valuation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    fmnv INTEGER NOT NULL,
    base_value INTEGER NOT NULL,
    performance_index REAL,
    exposure_index REAL,
    influence_index REAL,
    confidence REAL,
    calculated_at TEXT DEFAULT (datetime('now')),
    archived_to_r2 INTEGER DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES nil_players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nil_history_player ON nil_valuation_history(player_id);
CREATE INDEX IF NOT EXISTS idx_nil_history_date ON nil_valuation_history(calculated_at);

-- ============================================================================
-- SEED DATA: Top Programs (2025-26)
-- ============================================================================
INSERT OR REPLACE INTO nil_teams (id, team_name, conference, conference_rank, team_ranking, total_roster_value, avg_player_value, collective_name, trend, year_over_year_change) VALUES
    ('texas', 'Texas', 'SEC', 1, 3, 22000000, 253000, 'Texas One Fund', 'rising', 2100000),
    ('alabama', 'Alabama', 'SEC', 2, 5, 18400000, 206000, 'Yellowhammer Fund', 'rising', 2400000),
    ('ohio-state', 'Ohio State', 'Big Ten', 1, 2, 18300000, 208000, 'THE Foundation', 'rising', 4700000),
    ('lsu', 'LSU', 'SEC', 3, 8, 17900000, 180000, 'Bayou Traditions', 'surging', 7800000),
    ('georgia', 'Georgia', 'SEC', 4, 1, 15700000, 159000, 'Classic City Collective', 'rising', 2300000),
    ('penn-state', 'Penn State', 'Big Ten', 2, 6, 14600000, 120000, 'Happy Valley United', 'rising', 4700000),
    ('texas-am', 'Texas A&M', 'SEC', 5, 15, 14300000, 159000, 'Texas Aggies United', 'rising', 5000000),
    ('oregon', 'Oregon', 'Big Ten', 3, 4, 13700000, 149000, 'Division Street', 'rising', 2100000),
    ('michigan', 'Michigan', 'Big Ten', 4, 10, 13000000, 139000, 'Champions Circle', 'rising', 1400000),
    ('oklahoma', 'Oklahoma', 'SEC', 6, 18, 12600000, 146000, 'Crimson & Cream', 'rising', 2900000),
    ('tennessee', 'Tennessee', 'SEC', 7, 12, 11500000, 135000, 'Spyre Sports', 'steady', -100000),
    ('south-carolina', 'South Carolina', 'SEC', 8, 20, 10600000, 125000, 'Garnet Trust', 'rising', 2600000);

-- ============================================================================
-- SEED DATA: Sample Players (Top NIL Athletes 2025-26)
-- ============================================================================
INSERT OR REPLACE INTO nil_players (id, name, position, team, conference, class, stars, social_followers, engagement_rate, tv_games, state) VALUES
    ('arch-manning', 'Arch Manning', 'QB', 'Texas', 'SEC', 'SO', 5, 850000, 4.2, 12, 'LA'),
    ('nico-iamaleava', 'Nico Iamaleava', 'QB', 'Tennessee', 'SEC', 'SO', 5, 420000, 5.1, 12, 'CA'),
    ('jeremiah-smith', 'Jeremiah Smith', 'WR', 'Ohio State', 'Big Ten', 'SO', 5, 380000, 6.2, 13, 'FL'),
    ('garrett-nussmeier', 'Garrett Nussmeier', 'QB', 'LSU', 'SEC', 'SR', 4, 180000, 3.8, 12, 'TX'),
    ('caleb-downs', 'Caleb Downs', 'S', 'Ohio State', 'Big Ten', 'SO', 5, 220000, 4.5, 13, 'GA'),
    ('drew-allar', 'Drew Allar', 'QB', 'Penn State', 'Big Ten', 'JR', 4, 150000, 3.5, 12, 'OH'),
    ('bryce-underwood', 'Bryce Underwood', 'QB', 'Michigan', 'Big Ten', 'FR', 5, 280000, 5.8, 10, 'MI'),
    ('ryan-williams', 'Ryan Williams', 'WR', 'Alabama', 'SEC', 'SO', 5, 320000, 5.5, 12, 'FL'),
    ('david-stone', 'David Stone', 'DL', 'Oklahoma', 'SEC', 'FR', 5, 95000, 2.8, 10, 'OK'),
    ('dakorien-moore', 'Dakorien Moore', 'WR', 'Oregon', 'Big Ten', 'FR', 5, 180000, 4.0, 11, 'TX'),
    ('lanorris-sellers', 'LaNorris Sellers', 'QB', 'South Carolina', 'SEC', 'SO', 4, 120000, 4.2, 11, 'SC'),
    ('travis-sykora', 'Travis Sykora', 'RHP', 'Texas', 'SEC', 'JR', 4, 15000, 2.5, 8, 'TX');

-- ============================================================================
-- SEED DATA: Player Metrics
-- ============================================================================
INSERT OR REPLACE INTO nil_player_metrics (player_id, position_score, efficiency_score, production_score, games_played, season) VALUES
    ('arch-manning', 0.95, 0.85, 0.70, 6, '2024'),
    ('nico-iamaleava', 0.88, 0.75, 0.80, 12, '2024'),
    ('jeremiah-smith', 0.98, 0.92, 0.95, 13, '2024'),
    ('garrett-nussmeier', 0.82, 0.78, 0.85, 12, '2024'),
    ('caleb-downs', 0.90, 0.88, 0.82, 13, '2024'),
    ('drew-allar', 0.80, 0.75, 0.78, 12, '2024'),
    ('bryce-underwood', 0.92, 0.70, 0.60, 8, '2024'),
    ('ryan-williams', 0.94, 0.88, 0.90, 12, '2024'),
    ('david-stone', 0.85, 0.72, 0.65, 10, '2024'),
    ('dakorien-moore', 0.88, 0.75, 0.70, 11, '2024'),
    ('lanorris-sellers', 0.78, 0.72, 0.76, 11, '2024'),
    ('travis-sykora', 0.82, 0.85, 0.80, 18, '2024');

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS nil_players_updated_at
AFTER UPDATE ON nil_players
BEGIN
    UPDATE nil_players SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS nil_teams_updated_at
AFTER UPDATE ON nil_teams
BEGIN
    UPDATE nil_teams SET updated_at = datetime('now') WHERE id = NEW.id;
END;
