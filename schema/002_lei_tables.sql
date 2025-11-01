-- Leverage Equivalency Index (LEI) Schema
-- Stores clutch playoff moments across sports with normalized 0-100 leverage scores
-- Created: 2025-11-01

-- ============================================================================
-- LEI PLAYS TABLE - Individual clutch moments
-- ============================================================================
CREATE TABLE IF NOT EXISTS lei_plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Play identification
    play_id TEXT NOT NULL UNIQUE,  -- Format: YYYY-SERIES-GAME-INNING/QUARTER-PLAYER-PLAY
    game_id TEXT NOT NULL,         -- Link to game identifier
    season INTEGER NOT NULL,

    -- Sport and playoff context
    sport TEXT NOT NULL CHECK(sport IN ('baseball', 'football')),
    playoff_round TEXT NOT NULL CHECK(playoff_round IN ('wildcard', 'division', 'conference', 'championship')),

    -- Play description
    description TEXT NOT NULL,
    players TEXT NOT NULL,         -- JSON array of player names

    -- Win probability data
    pre_play_win_prob REAL NOT NULL CHECK(pre_play_win_prob >= 0 AND pre_play_win_prob <= 1),
    post_play_win_prob REAL NOT NULL CHECK(post_play_win_prob >= 0 AND post_play_win_prob <= 1),
    wpa REAL GENERATED ALWAYS AS (ABS(post_play_win_prob - pre_play_win_prob)) VIRTUAL,

    -- Baseball-specific context
    outs_remaining INTEGER,
    strikes_remaining INTEGER,

    -- Football-specific context
    time_remaining INTEGER,        -- Seconds remaining
    timeouts_remaining INTEGER,

    -- Common context
    score_differential INTEGER DEFAULT 0,

    -- LEI computation results
    lei_score REAL NOT NULL CHECK(lei_score >= 0 AND lei_score <= 100),
    championship_weight REAL NOT NULL,
    scarcity REAL NOT NULL CHECK(scarcity >= 0 AND scarcity <= 1),

    -- Data source and validation
    data_source TEXT,              -- e.g., "Baseball-Reference", "nflfastR"
    verified BOOLEAN DEFAULT 0,    -- Manual verification flag

    -- Timestamps
    play_timestamp TEXT,           -- When the play occurred
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for fast queries
CREATE INDEX idx_lei_plays_sport_round ON lei_plays(sport, playoff_round);
CREATE INDEX idx_lei_plays_lei_score ON lei_plays(lei_score DESC);
CREATE INDEX idx_lei_plays_season ON lei_plays(season, sport);
CREATE INDEX idx_lei_plays_game ON lei_plays(game_id);
CREATE INDEX idx_lei_plays_wpa ON lei_plays(wpa DESC);

-- ============================================================================
-- LEI GAMES TABLE - Game-level aggregations
-- ============================================================================
CREATE TABLE IF NOT EXISTS lei_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Game identification
    game_id TEXT NOT NULL UNIQUE,
    season INTEGER NOT NULL,
    sport TEXT NOT NULL CHECK(sport IN ('baseball', 'football')),
    playoff_round TEXT NOT NULL CHECK(playoff_round IN ('wildcard', 'division', 'conference', 'championship')),

    -- Teams
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,

    -- Game result
    home_score INTEGER,
    away_score INTEGER,
    winner TEXT,

    -- LEI metrics
    total_lei REAL,                -- Sum of all LEI scores in game
    max_lei REAL,                  -- Highest single play LEI
    avg_lei REAL,                  -- Average LEI across all plays
    play_count INTEGER DEFAULT 0,  -- Number of tracked plays

    -- Game metadata
    game_date TEXT,
    series_description TEXT,       -- e.g., "2011 World Series Game 6"

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_lei_games_sport_season ON lei_games(sport, season);
CREATE INDEX idx_lei_games_playoff_round ON lei_games(playoff_round);
CREATE INDEX idx_lei_games_max_lei ON lei_games(max_lei DESC);

-- ============================================================================
-- LEI LEADERBOARD VIEW - Top clutch plays across all time
-- ============================================================================
CREATE VIEW IF NOT EXISTS lei_leaderboard AS
SELECT
    play_id,
    description,
    players,
    sport,
    playoff_round,
    season,
    lei_score,
    wpa,
    championship_weight,
    scarcity,
    data_source,
    play_timestamp
FROM lei_plays
WHERE verified = 1
ORDER BY lei_score DESC
LIMIT 100;

-- ============================================================================
-- LEI SEASON LEADERS VIEW - Top plays by season
-- ============================================================================
CREATE VIEW IF NOT EXISTS lei_season_leaders AS
SELECT
    season,
    sport,
    playoff_round,
    COUNT(*) as play_count,
    AVG(lei_score) as avg_lei,
    MAX(lei_score) as max_lei,
    MIN(lei_score) as min_lei
FROM lei_plays
GROUP BY season, sport, playoff_round
ORDER BY season DESC, avg_lei DESC;

-- ============================================================================
-- Sample data: Famous playoff moments for calibration
-- ============================================================================

-- David Freese triple, 2011 World Series Game 6
INSERT OR IGNORE INTO lei_plays (
    play_id, game_id, season, sport, playoff_round,
    description, players,
    pre_play_win_prob, post_play_win_prob,
    outs_remaining, strikes_remaining, score_differential,
    lei_score, championship_weight, scarcity,
    data_source, verified, play_timestamp
) VALUES (
    '2011-WS-G6-B9-FREESE-TRIPLE',
    '2011-WS-G6',
    2011,
    'baseball',
    'championship',
    'David Freese game-tying triple',
    '["David Freese"]',
    0.078,
    0.605,
    1,
    0,
    -2,
    95.0,
    8.0,
    0.96,
    'Baseball-Reference Win Expectancy',
    1,
    '2011-10-27T22:15:00Z'
);

-- Mario Manningham catch, Super Bowl XLVI
INSERT OR IGNORE INTO lei_plays (
    play_id, game_id, season, sport, playoff_round,
    description, players,
    pre_play_win_prob, post_play_win_prob,
    time_remaining, timeouts_remaining, score_differential,
    lei_score, championship_weight, scarcity,
    data_source, verified, play_timestamp
) VALUES (
    '2012-SB46-Q4-MANNINGHAM-CATCH',
    '2012-SB46',
    2011,
    'football',
    'championship',
    'Mario Manningham sideline catch',
    '["Mario Manningham", "Eli Manning"]',
    0.52,
    0.68,
    246,
    2,
    0,
    82.0,
    8.0,
    0.89,
    'nflfastR Win Probability model',
    1,
    '2012-02-05T21:45:00Z'
);

-- Aaron Boone walk-off HR, 2003 ALCS Game 7
INSERT OR IGNORE INTO lei_plays (
    play_id, game_id, season, sport, playoff_round,
    description, players,
    pre_play_win_prob, post_play_win_prob,
    outs_remaining, strikes_remaining, score_differential,
    lei_score, championship_weight, scarcity,
    data_source, verified, play_timestamp
) VALUES (
    '2003-ALCS-G7-B11-BOONE-HR',
    '2003-ALCS-G7',
    2003,
    'baseball',
    'conference',
    'Aaron Boone walk-off home run',
    '["Aaron Boone"]',
    0.50,
    1.00,
    3,
    2,
    0,
    88.0,
    4.0,
    0.75,
    'Baseball-Reference Win Expectancy (estimated)',
    1,
    '2003-10-16T23:30:00Z'
);

-- Malcolm Butler interception, Super Bowl XLIX
INSERT OR IGNORE INTO lei_plays (
    play_id, game_id, season, sport, playoff_round,
    description, players,
    pre_play_win_prob, post_play_win_prob,
    time_remaining, timeouts_remaining, score_differential,
    lei_score, championship_weight, scarcity,
    data_source, verified, play_timestamp
) VALUES (
    '2015-SB49-Q4-BUTLER-INT',
    '2015-SB49',
    2014,
    'football',
    'championship',
    'Malcolm Butler goal line interception',
    '["Malcolm Butler", "Russell Wilson"]',
    0.35,
    1.00,
    20,
    1,
    -4,
    98.0,
    8.0,
    0.98,
    'nflfastR Win Probability model',
    1,
    '2015-02-01T22:05:00Z'
);

-- Insert corresponding game records
INSERT OR IGNORE INTO lei_games (
    game_id, season, sport, playoff_round,
    home_team, away_team, home_score, away_score, winner,
    series_description, game_date
) VALUES
    ('2011-WS-G6', 2011, 'baseball', 'championship', 'STL', 'TEX', 10, 9, 'STL', '2011 World Series Game 6', '2011-10-27'),
    ('2012-SB46', 2011, 'football', 'championship', 'NYG', 'NE', 21, 17, 'NYG', 'Super Bowl XLVI', '2012-02-05'),
    ('2003-ALCS-G7', 2003, 'baseball', 'conference', 'NYY', 'BOS', 6, 5, 'NYY', '2003 ALCS Game 7', '2003-10-16'),
    ('2015-SB49', 2014, 'football', 'championship', 'NE', 'SEA', 28, 24, 'NE', 'Super Bowl XLIX', '2015-02-01');
