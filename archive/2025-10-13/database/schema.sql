
 ⛅️ wrangler 4.40.2 (update available 4.42.2)
─────────────────────────────────────────────
🌀 Executing on remote database blazesports-db (cbafed34-782f-4bf1-a14b-4ea49661e52b):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.3429ms
[
  {
    "results": [
      {
        "name": "_cf_KV",
        "sql": "CREATE TABLE _cf_KV (\n        key TEXT PRIMARY KEY,\n        value BLOB\n      ) WITHOUT ROWID"
      },
      {
        "name": "api_sync_log",
        "sql": "CREATE TABLE api_sync_log (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    sport TEXT NOT NULL,\n    endpoint TEXT NOT NULL,\n    season INTEGER,\n    week INTEGER,\n    date TEXT,\n    status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'ERROR', 'PARTIAL')),\n    records_updated INTEGER DEFAULT 0,\n    error_message TEXT,\n    retry_count INTEGER DEFAULT 0,\n    duration_ms INTEGER,\n    synced_at TEXT DEFAULT (datetime('now'))\n)"
      },
      {
        "name": "cache_metadata",
        "sql": "CREATE TABLE cache_metadata (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    cache_key TEXT NOT NULL UNIQUE,\n    sport TEXT NOT NULL,\n    data_type TEXT NOT NULL,  -- standings, teams, players, games, stats\n    season INTEGER,\n    week INTEGER,\n    ttl_seconds INTEGER NOT NULL,\n    expires_at TEXT NOT NULL,\n    created_at TEXT DEFAULT (datetime('now'))\n)"
      },
      {
        "name": "depth_charts",
        "sql": "CREATE TABLE depth_charts (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),\n    team_id INTEGER NOT NULL,\n    player_id INTEGER NOT NULL,\n    player_name TEXT NOT NULL,\n    position TEXT NOT NULL,\n    depth_order INTEGER,  -- 1 = starter, 2 = backup, etc.\n    position_category TEXT,  -- Offense, Defense, Special Teams, etc.\n    injury_status TEXT,   -- Healthy, Questionable, Doubtful, Out, IR\n    injury_body_part TEXT,\n    injury_notes TEXT,\n    last_updated TEXT DEFAULT (datetime('now')),\n    FOREIGN KEY (team_id) REFERENCES teams(team_id),\n    FOREIGN KEY (player_id) REFERENCES players(player_id)\n)"
      },
      {
        "name": "games",
        "sql": "CREATE TABLE games (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  sport TEXT NOT NULL,\n  game_id INTEGER,\n  season INTEGER NOT NULL,\n  season_type TEXT NOT NULL,\n  week INTEGER,\n  game_date DATETIME NOT NULL,\n  game_time TEXT,\n  status TEXT DEFAULT 'scheduled',\n  home_team_id INTEGER NOT NULL,\n  home_team_key TEXT NOT NULL,\n  home_team_name TEXT NOT NULL,\n  home_score INTEGER,\n  away_team_id INTEGER NOT NULL,\n  away_team_key TEXT NOT NULL,\n  away_team_name TEXT NOT NULL,\n  away_score INTEGER,\n  stadium_name TEXT,\n  winning_team_id INTEGER,\n  description TEXT,\n  stats JSON,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n)"
      },
      {
        "name": "idx_cache_meta_expires",
        "sql": "CREATE INDEX idx_cache_meta_expires ON cache_metadata(expires_at)"
      },
      {
        "name": "idx_cache_meta_key",
        "sql": "CREATE INDEX idx_cache_meta_key ON cache_metadata(cache_key)"
      },
      {
        "name": "idx_cache_meta_sport_type",
        "sql": "CREATE INDEX idx_cache_meta_sport_type ON cache_metadata(sport, data_type)"
      },
      {
        "name": "idx_depth_charts_injuries",
        "sql": "CREATE INDEX idx_depth_charts_injuries ON depth_charts(injury_status)"
      },
      {
        "name": "idx_depth_charts_player",
        "sql": "CREATE INDEX idx_depth_charts_player ON depth_charts(player_id)"
      },
      {
        "name": "idx_depth_charts_team",
        "sql": "CREATE INDEX idx_depth_charts_team ON depth_charts(team_id, position)"
      },
      {
        "name": "idx_games_away_team",
        "sql": "CREATE INDEX idx_games_away_team ON games(away_team_id)"
      },
      {
        "name": "idx_games_date",
        "sql": "CREATE INDEX idx_games_date ON games(game_date)"
      },
      {
        "name": "idx_games_home_team",
        "sql": "CREATE INDEX idx_games_home_team ON games(home_team_id)"
      },
      {
        "name": "idx_games_season",
        "sql": "CREATE INDEX idx_games_season ON games(season, season_type)"
      },
      {
        "name": "idx_games_sport",
        "sql": "CREATE INDEX idx_games_sport ON games(sport)"
      },
      {
        "name": "idx_games_status",
        "sql": "CREATE INDEX idx_games_status ON games(status)"
      },
      {
        "name": "idx_player_stats_player",
        "sql": "CREATE INDEX idx_player_stats_player ON player_season_stats(player_id)"
      },
      {
        "name": "idx_player_stats_sport_season",
        "sql": "CREATE INDEX idx_player_stats_sport_season ON player_season_stats(sport, season, season_type)"
      },
      {
        "name": "idx_player_stats_team",
        "sql": "CREATE INDEX idx_player_stats_team ON player_season_stats(team_id)"
      },
      {
        "name": "idx_players_position",
        "sql": "CREATE INDEX idx_players_position ON players(position)"
      },
      {
        "name": "idx_players_sport",
        "sql": "CREATE INDEX idx_players_sport ON players(sport)"
      },
      {
        "name": "idx_players_team",
        "sql": "CREATE INDEX idx_players_team ON players(team_id)"
      },
      {
        "name": "idx_reports_embedding",
        "sql": "CREATE INDEX idx_reports_embedding ON scouting_reports(embedding_id)"
      },
      {
        "name": "idx_reports_game",
        "sql": "CREATE INDEX idx_reports_game ON scouting_reports(game_id)"
      },
      {
        "name": "idx_reports_type",
        "sql": "CREATE INDEX idx_reports_type ON scouting_reports(report_type)"
      },
      {
        "name": "idx_standings_conference",
        "sql": "CREATE INDEX idx_standings_conference ON standings(sport, season, conference, division_rank)"
      },
      {
        "name": "idx_standings_sport_season",
        "sql": "CREATE INDEX idx_standings_sport_season ON standings(sport, season, season_type)"
      },
      {
        "name": "idx_standings_updated",
        "sql": "CREATE INDEX idx_standings_updated ON standings(last_updated)"
      },
      {
        "name": "idx_sync_log_sport_endpoint",
        "sql": "CREATE INDEX idx_sync_log_sport_endpoint ON api_sync_log(sport, endpoint, synced_at)"
      },
      {
        "name": "idx_sync_log_status",
        "sql": "CREATE INDEX idx_sync_log_status ON api_sync_log(status)"
      },
      {
        "name": "idx_team_stats_sport_season",
        "sql": "CREATE INDEX idx_team_stats_sport_season ON team_season_stats(sport, season, season_type)"
      },
      {
        "name": "idx_team_stats_team",
        "sql": "CREATE INDEX idx_team_stats_team ON team_season_stats(team_id)"
      },
      {
        "name": "idx_teams_key",
        "sql": "CREATE INDEX idx_teams_key ON teams(key)"
      },
      {
        "name": "idx_teams_name",
        "sql": "CREATE INDEX idx_teams_name ON teams(name)"
      },
      {
        "name": "idx_teams_sport",
        "sql": "CREATE INDEX idx_teams_sport ON teams(sport)"
      },
      {
        "name": "player_season_stats",
        "sql": "CREATE TABLE player_season_stats (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),\n    season INTEGER NOT NULL,\n    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),\n    player_id INTEGER NOT NULL,\n    team_id INTEGER,\n    player_name TEXT NOT NULL,\n    position TEXT,\n\n    -- Universal stats\n    games_played INTEGER DEFAULT 0,\n    games_started INTEGER DEFAULT 0,\n\n    -- Football-specific (NFL/CFB)\n    passing_yards INTEGER,\n    passing_tds INTEGER,\n    interceptions INTEGER,\n    rushing_yards INTEGER,\n    rushing_tds INTEGER,\n    receptions INTEGER,\n    receiving_yards INTEGER,\n    receiving_tds INTEGER,\n    tackles INTEGER,\n    sacks REAL,\n\n    -- Baseball-specific (MLB)\n    at_bats INTEGER,\n    hits INTEGER,\n    doubles INTEGER,\n    triples INTEGER,\n    home_runs INTEGER,\n    rbis INTEGER,\n    batting_avg REAL,\n    obp REAL,\n    slg REAL,\n    ops REAL,\n    innings_pitched REAL,\n    earned_runs INTEGER,\n    era REAL,\n    strikeouts INTEGER,\n    walks INTEGER,\n    whip REAL,\n\n    -- Basketball-specific (CBB)\n    points_per_game REAL,\n    rebounds_per_game REAL,\n    assists_per_game REAL,\n    field_goal_pct REAL,\n    three_point_pct REAL,\n    free_throw_pct REAL,\n\n    stats_json TEXT,  -- Store full JSON for all stats\n    last_updated TEXT DEFAULT (datetime('now')),\n    UNIQUE(sport, season, season_type, player_id),\n    FOREIGN KEY (player_id) REFERENCES players(player_id),\n    FOREIGN KEY (team_id) REFERENCES teams(team_id)\n)"
      },
      {
        "name": "players",
        "sql": "CREATE TABLE players (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  team_id INTEGER NOT NULL,\n  sport TEXT NOT NULL,\n  player_id INTEGER,\n  name TEXT NOT NULL,\n  position TEXT,\n  jersey_number INTEGER,\n  height TEXT,\n  weight INTEGER,\n  year TEXT,\n  stats JSON,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n)"
      },
      {
        "name": "scouting_reports",
        "sql": "CREATE TABLE scouting_reports (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  game_id INTEGER NOT NULL,\n  report_type TEXT NOT NULL,\n  content TEXT,\n  embedding_id TEXT,\n  confidence_score REAL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n)"
      },
      {
        "name": "sqlite_autoindex_cache_metadata_1",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_player_season_stats_1",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_standings_1",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_team_season_stats_1",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_teams_1",
        "sql": null
      },
      {
        "name": "sqlite_sequence",
        "sql": "CREATE TABLE sqlite_sequence(name,seq)"
      },
      {
        "name": "standings",
        "sql": "CREATE TABLE standings (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),\n    season INTEGER NOT NULL,\n    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),\n    team_id INTEGER NOT NULL,\n    team_key TEXT NOT NULL,\n    team_name TEXT NOT NULL,\n    conference TEXT,\n    division TEXT,\n    wins INTEGER NOT NULL DEFAULT 0,\n    losses INTEGER NOT NULL DEFAULT 0,\n    ties INTEGER DEFAULT 0,\n    win_percentage REAL,\n    games_back TEXT,\n    streak TEXT,\n    points_for INTEGER,\n    points_against INTEGER,\n    point_differential INTEGER,\n    home_wins INTEGER DEFAULT 0,\n    home_losses INTEGER DEFAULT 0,\n    away_wins INTEGER DEFAULT 0,\n    away_losses INTEGER DEFAULT 0,\n    conference_wins INTEGER DEFAULT 0,\n    conference_losses INTEGER DEFAULT 0,\n    division_wins INTEGER DEFAULT 0,\n    division_losses INTEGER DEFAULT 0,\n    division_rank INTEGER,\n    conference_rank INTEGER,\n    playoff_rank INTEGER,\n    data_source TEXT DEFAULT 'SportsDataIO',\n    last_updated TEXT DEFAULT (datetime('now')),\n    UNIQUE(sport, season, season_type, team_id),\n    FOREIGN KEY (team_id) REFERENCES teams(team_id)\n)"
      },
      {
        "name": "team_season_stats",
        "sql": "CREATE TABLE team_season_stats (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    sport TEXT NOT NULL CHECK(sport IN ('NFL', 'MLB', 'CFB', 'CBB')),\n    season INTEGER NOT NULL,\n    season_type TEXT NOT NULL CHECK(season_type IN ('REG', 'POST')),\n    team_id INTEGER NOT NULL,\n    team_key TEXT NOT NULL,\n\n    -- Universal stats\n    games_played INTEGER DEFAULT 0,\n    wins INTEGER DEFAULT 0,\n    losses INTEGER DEFAULT 0,\n    points_for INTEGER DEFAULT 0,\n    points_against INTEGER DEFAULT 0,\n\n    -- Football-specific (NFL/CFB)\n    total_yards REAL,\n    passing_yards REAL,\n    rushing_yards REAL,\n    turnovers INTEGER,\n    sacks INTEGER,\n    third_down_pct REAL,\n\n    -- Baseball-specific (MLB)\n    runs_scored INTEGER,\n    runs_allowed INTEGER,\n    hits INTEGER,\n    home_runs INTEGER,\n    batting_avg REAL,\n    era REAL,\n    whip REAL,\n\n    -- Basketball-specific (CBB)\n    field_goal_pct REAL,\n    three_point_pct REAL,\n    free_throw_pct REAL,\n    rebounds_per_game REAL,\n    assists_per_game REAL,\n\n    stats_json TEXT,  -- Store full JSON for sport-specific stats\n    last_updated TEXT DEFAULT (datetime('now')),\n    UNIQUE(sport, season, season_type, team_id),\n    FOREIGN KEY (team_id) REFERENCES teams(team_id)\n)"
      },
      {
        "name": "teams",
        "sql": "CREATE TABLE teams (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  sport TEXT NOT NULL,\n  team_id INTEGER NOT NULL,\n  key TEXT NOT NULL,\n  name TEXT NOT NULL,\n  city TEXT,\n  conference TEXT,\n  division TEXT,\n  metadata JSON,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  UNIQUE(sport, team_id)\n)"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.3429
      },
      "duration": 0.3429,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 286720,
      "rows_read": 96,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]
