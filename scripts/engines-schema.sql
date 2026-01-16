-- ============================================================================
-- BLAZE SPORTS INTEL - COMPREHENSIVE ENGINES DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-10-17
-- Database: Cloudflare D1 (SQLite)
--
-- Four Intelligence Engines:
-- 1. Predictive Intelligence Engine
-- 2. Personalization & Community Engine
-- 3. Historical Research Engine
-- 4. Situational Awareness Engine
-- ============================================================================

-- ============================================================================
-- PREDICTIVE INTELLIGENCE ENGINE
-- ============================================================================

-- Model metadata and versioning
CREATE TABLE IF NOT EXISTS predictive_models (
  model_id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('college-baseball', 'college-football', 'mlb', 'nfl', 'nba')),
  model_type TEXT NOT NULL CHECK (model_type IN ('player_development', 'injury_risk', 'draft', 'win_probability')),
  trained_at INTEGER NOT NULL, -- Unix timestamp
  metrics TEXT, -- JSON: {"accuracy": 0.85, "precision": 0.82, "recall": 0.88, "f1": 0.85}
  parameters TEXT, -- JSON: hyperparameters
  r2_model_path TEXT, -- R2 storage key for model weights
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'training')),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_predictive_models_sport ON predictive_models(sport);
CREATE INDEX IF NOT EXISTS idx_predictive_models_type ON predictive_models(model_type);
CREATE INDEX IF NOT EXISTS idx_predictive_models_status ON predictive_models(status);

-- Player development projections
CREATE TABLE IF NOT EXISTS player_projections (
  projection_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  projection_type TEXT NOT NULL, -- 'mlb_draft_round', 'starter_probability', 'nfl_combine', 'all_star'
  value REAL NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
  comparable_players TEXT, -- JSON: [{"player_id": "...", "name": "...", "similarity": 0.85}]
  model_id TEXT,
  season INTEGER,
  updated_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER,
  FOREIGN KEY (model_id) REFERENCES predictive_models(model_id)
);

CREATE INDEX IF NOT EXISTS idx_player_projections_player ON player_projections(player_id);
CREATE INDEX IF NOT EXISTS idx_player_projections_sport ON player_projections(sport);
CREATE INDEX IF NOT EXISTS idx_player_projections_type ON player_projections(projection_type);
CREATE INDEX IF NOT EXISTS idx_player_projections_expires ON player_projections(expires_at);

-- Injury risk scoring
CREATE TABLE IF NOT EXISTS injury_risk_scores (
  risk_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  position TEXT,
  risk_index REAL NOT NULL CHECK (risk_index >= 0 AND risk_index <= 100),
  risk_category TEXT CHECK (risk_category IN ('low', 'moderate', 'high', 'critical')),
  reasons TEXT, -- JSON: ["high_pitch_count", "velocity_drop_3mph", "insufficient_rest"]
  recommended_actions TEXT, -- JSON: ["rest_3_days", "reduce_pitch_count_to_85", "biomechanics_check"]
  workload_metrics TEXT, -- JSON: {"pitches_last_7d": 215, "innings_last_30d": 42.1, "rest_days": 2}
  model_id TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (model_id) REFERENCES predictive_models(model_id)
);

CREATE INDEX IF NOT EXISTS idx_injury_risk_player ON injury_risk_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_injury_risk_category ON injury_risk_scores(risk_category);
CREATE INDEX IF NOT EXISTS idx_injury_risk_updated ON injury_risk_scores(updated_at);

-- Draft projections (MLB & NFL)
CREATE TABLE IF NOT EXISTS draft_projections (
  draft_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  league TEXT NOT NULL CHECK (league IN ('MLB', 'NFL')),
  draft_year INTEGER NOT NULL,
  projected_round INTEGER,
  pick_range TEXT, -- '15-25', '1st round'
  signing_bonus_range TEXT, -- '$2M-$3.5M'
  draft_grade REAL CHECK (draft_grade >= 0 AND draft_grade <= 100),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  signability_assessment TEXT, -- 'likely', 'difficult', 'college_commitment'
  comparable_players TEXT, -- JSON: draft comps
  model_id TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (model_id) REFERENCES predictive_models(model_id)
);

CREATE INDEX IF NOT EXISTS idx_draft_projections_player ON draft_projections(player_id);
CREATE INDEX IF NOT EXISTS idx_draft_projections_year ON draft_projections(draft_year);
CREATE INDEX IF NOT EXISTS idx_draft_projections_league ON draft_projections(league);

-- Live win probability (pitch-by-pitch for college baseball, drive-by-drive for football)
CREATE TABLE IF NOT EXISTS win_probability (
  prob_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  inning_or_drive INTEGER,
  outs INTEGER,
  runners_on TEXT, -- '1st', '1st_3rd', 'bases_loaded', NULL
  team_id TEXT NOT NULL,
  opponent_id TEXT NOT NULL,
  win_prob REAL NOT NULL CHECK (win_prob >= 0.0 AND win_prob <= 1.0),
  lower_ci REAL, -- 95% confidence interval lower bound
  upper_ci REAL, -- 95% confidence interval upper bound
  key_factors TEXT, -- JSON: [{"factor": "bullpen_strength", "impact": 0.12}, ...]
  model_id TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (model_id) REFERENCES predictive_models(model_id)
);

CREATE INDEX IF NOT EXISTS idx_win_prob_game ON win_probability(game_id);
CREATE INDEX IF NOT EXISTS idx_win_prob_updated ON win_probability(updated_at);
CREATE INDEX IF NOT EXISTS idx_win_prob_team ON win_probability(team_id);

-- ============================================================================
-- PERSONALIZATION & COMMUNITY ENGINE
-- ============================================================================

-- User profiles and preference learning
CREATE TABLE IF NOT EXISTS user_preferences (
  pref_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_id TEXT NOT NULL, -- team_id, player_id, conference_id
  entity_type TEXT NOT NULL CHECK (entity_type IN ('team', 'player', 'conference', 'sport', 'coach')),
  interest_score REAL DEFAULT 0.5 CHECK (interest_score >= 0.0 AND interest_score <= 1.0),
  explicit_follow INTEGER DEFAULT 0 CHECK (explicit_follow IN (0, 1)), -- Boolean
  interaction_count INTEGER DEFAULT 0,
  last_interaction INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prefs_entity ON user_preferences(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_user_prefs_score ON user_preferences(interest_score DESC);

-- Notification rules
CREATE TABLE IF NOT EXISTS notification_rules (
  rule_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('injury_risk', 'lineup_change', 'game_upset', 'draft_update', 'win_prob_swing', 'contest_result')),
  entity_id TEXT, -- Optional: specific team/player
  entity_type TEXT,
  threshold REAL, -- Trigger threshold (e.g., injury_risk > 75)
  enabled INTEGER DEFAULT 1 CHECK (enabled IN (0, 1)),
  delivery_methods TEXT, -- JSON: ["push", "email"]
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_notification_rules_user ON notification_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_type ON notification_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_notification_rules_enabled ON notification_rules(enabled);

-- Prediction contests
CREATE TABLE IF NOT EXISTS contests (
  contest_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contest_type TEXT NOT NULL CHECK (contest_type IN ('bracket', 'game_outcome', 'player_performance', 'season_standings')),
  sport TEXT NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  rules TEXT, -- JSON
  scoring_method TEXT, -- JSON: scoring algorithm
  prize_description TEXT, -- No gambling - educational/bragging rights only
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'scoring', 'completed')),
  max_entries INTEGER,
  current_entries INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_contests_sport ON contests(sport);
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_dates ON contests(start_date, end_date);

-- Contest entries
CREATE TABLE IF NOT EXISTS contest_entries (
  entry_id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  prediction TEXT NOT NULL, -- JSON: bracket structure or predictions
  score REAL,
  rank INTEGER,
  tiebreaker_value REAL, -- For tiebreaker scenarios
  submitted_at INTEGER DEFAULT (unixepoch()),
  scored_at INTEGER,
  FOREIGN KEY (contest_id) REFERENCES contests(contest_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_entries_contest ON contest_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_entries_user ON contest_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_entries_score ON contest_entries(score DESC);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  leaderboard_id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  total_score REAL NOT NULL,
  rank INTEGER NOT NULL,
  percentile REAL, -- Top X%
  badges TEXT, -- JSON: ["perfect_bracket_round_1", "upset_specialist"]
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (contest_id) REFERENCES contests(contest_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_contest ON leaderboards(contest_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user ON leaderboards(user_id);

-- Community posts and discussions
CREATE TABLE IF NOT EXISTS community_posts (
  post_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT, -- Display name
  post_type TEXT NOT NULL CHECK (post_type IN ('scouting_report', 'discussion', 'analysis', 'question', 'prediction')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  entity_id TEXT, -- Related team/player/game
  entity_type TEXT,
  sport TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_moderated INTEGER DEFAULT 0 CHECK (is_moderated IN (0, 1)),
  is_pinned INTEGER DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_entity ON community_posts(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_sport ON community_posts(sport);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_votes ON community_posts(upvotes DESC);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
  comment_id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_moderated INTEGER DEFAULT 0 CHECK (is_moderated IN (0, 1)),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (post_id) REFERENCES community_posts(post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created ON post_comments(created_at DESC);

-- ============================================================================
-- HISTORICAL RESEARCH ENGINE
-- ============================================================================

-- Historical games archive
CREATE TABLE IF NOT EXISTS historical_games (
  game_id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  game_date INTEGER NOT NULL, -- Unix timestamp
  home_team_id TEXT NOT NULL,
  home_team_name TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  innings_or_quarters INTEGER,
  tournament_round TEXT, -- 'College World Series - Finals', 'SEC Championship', NULL
  venue TEXT,
  venue_city TEXT,
  venue_state TEXT,
  attendance INTEGER,
  weather_conditions TEXT,
  box_score_url TEXT,
  play_by_play_r2_key TEXT, -- R2 storage key for detailed PBP data
  game_notes TEXT, -- Notable events, records set
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_historical_games_date ON historical_games(game_date);
CREATE INDEX IF NOT EXISTS idx_historical_games_home_team ON historical_games(home_team_id);
CREATE INDEX IF NOT EXISTS idx_historical_games_away_team ON historical_games(away_team_id);
CREATE INDEX IF NOT EXISTS idx_historical_games_teams ON historical_games(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_historical_games_tournament ON historical_games(tournament_round);
CREATE INDEX IF NOT EXISTS idx_historical_games_season ON historical_games(season, sport);

-- Player statistical archive (career stats across seasons)
CREATE TABLE IF NOT EXISTS player_stats_archive (
  stat_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  season INTEGER NOT NULL,
  sport TEXT NOT NULL,
  team_id TEXT,
  team_name TEXT,
  stat_category TEXT NOT NULL, -- 'batting', 'pitching', 'rushing', 'passing', 'receiving', 'defense'
  stat_name TEXT NOT NULL, -- 'batting_avg', 'era', 'rushing_yards', 'touchdowns'
  value REAL NOT NULL,
  games_played INTEGER,
  position TEXT,
  class_year TEXT, -- 'FR', 'SO', 'JR', 'SR'
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats_archive(player_id, season);
CREATE INDEX IF NOT EXISTS idx_player_stats_season ON player_stats_archive(season, sport);
CREATE INDEX IF NOT EXISTS idx_player_stats_team ON player_stats_archive(team_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_category ON player_stats_archive(stat_category, stat_name);

-- Coaching decision patterns
CREATE TABLE IF NOT EXISTS coaching_decisions (
  decision_id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  team_id TEXT,
  decision_type TEXT NOT NULL, -- 'fourth_down_attempt', 'hit_and_run', 'starter_pull', 'timeout_usage', 'challenge'
  game_situation TEXT, -- JSON: {"score_margin": -7, "time_remaining": 180, "field_position": "OWN_35"}
  attempt_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  success_rate REAL,
  seasons TEXT, -- JSON: [2023, 2024, 2025]
  last_updated INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_coaching_decisions_coach ON coaching_decisions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_decisions_type ON coaching_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_coaching_decisions_sport ON coaching_decisions(sport);

-- Umpire and referee scorecards
CREATE TABLE IF NOT EXISTS umpire_scorecards (
  scorecard_id TEXT PRIMARY KEY,
  umpire_id TEXT NOT NULL,
  umpire_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  games_called INTEGER DEFAULT 0,
  metric_name TEXT NOT NULL, -- 'strike_accuracy', 'zone_consistency', 'ejection_rate', 'penalty_rate'
  metric_value REAL NOT NULL,
  rank_percentile REAL, -- vs other umpires/refs
  details TEXT, -- JSON: {"handedness_bias": {"LHH": -0.5, "RHH": 0.3}, "zone": {"high": 0.85, "low": 0.92}}
  last_updated INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_umpire_scorecards_umpire ON umpire_scorecards(umpire_id, season);
CREATE INDEX IF NOT EXISTS idx_umpire_scorecards_metric ON umpire_scorecards(metric_name);
CREATE INDEX IF NOT EXISTS idx_umpire_scorecards_season ON umpire_scorecards(season, sport);

-- ============================================================================
-- SITUATIONAL AWARENESS ENGINE
-- ============================================================================

-- Weather forecasts and impact analysis
CREATE TABLE IF NOT EXISTS weather_forecasts (
  forecast_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  forecast_time INTEGER NOT NULL, -- Unix timestamp
  temp_f REAL,
  feels_like_f REAL,
  wind_speed_mph REAL,
  wind_direction TEXT, -- 'N', 'SSW', 'Out to RF', 'In from LF'
  wind_direction_degrees INTEGER,
  precip_chance REAL CHECK (precip_chance >= 0.0 AND precip_chance <= 1.0),
  precip_type TEXT, -- 'rain', 'thunderstorm', 'snow'
  humidity REAL,
  conditions TEXT, -- 'Clear', 'Partly Cloudy', 'Thunderstorms'
  visibility_miles REAL,
  impact_score REAL CHECK (impact_score >= 0 AND impact_score <= 100), -- Calculated game impact
  impact_details TEXT, -- JSON: {"hitting": "favorable", "delay_risk": "high", "pitching": "neutral"}
  delay_probability REAL,
  fetched_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_weather_forecasts_game ON weather_forecasts(game_id);
CREATE INDEX IF NOT EXISTS idx_weather_forecasts_time ON weather_forecasts(forecast_time);
CREATE INDEX IF NOT EXISTS idx_weather_forecasts_impact ON weather_forecasts(impact_score DESC);

-- Lineup changes and roster moves
CREATE TABLE IF NOT EXISTS lineup_changes (
  change_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  team_name TEXT,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scratched', 'inserted', 'moved', 'called_up', 'sent_down', 'DL_IL')),
  position TEXT,
  batting_order INTEGER,
  reason TEXT, -- 'injury', 'matchup', 'rest', 'disciplinary', 'performance'
  significance REAL CHECK (significance >= 0 AND significance <= 100), -- Calculated impact
  replacement_player_id TEXT,
  replacement_player_name TEXT,
  source TEXT, -- 'official', 'beat_writer', 'social_media'
  update_time INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_lineup_changes_game ON lineup_changes(game_id);
CREATE INDEX IF NOT EXISTS idx_lineup_changes_player ON lineup_changes(player_id);
CREATE INDEX IF NOT EXISTS idx_lineup_changes_team ON lineup_changes(team_id);
CREATE INDEX IF NOT EXISTS idx_lineup_changes_significance ON lineup_changes(significance DESC);

-- Injury updates and player availability
CREATE TABLE IF NOT EXISTS injury_updates (
  injury_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  team_name TEXT,
  sport TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('probable', 'questionable', 'doubtful', 'out', 'DTD', 'IR', 'recovered')),
  injury_type TEXT, -- 'shoulder', 'hamstring', 'concussion', 'arm_fatigue'
  body_part TEXT, -- 'throwing_shoulder', 'right_hamstring', 'head'
  severity TEXT CHECK (severity IN ('minor', 'moderate', 'major', 'career_threatening')),
  source TEXT NOT NULL, -- 'official', 'beat_writer', 'practice_report', 'coach_statement'
  reliability_score REAL CHECK (reliability_score >= 0 AND reliability_score <= 100),
  expected_return_date INTEGER, -- Unix timestamp
  games_missed INTEGER DEFAULT 0,
  update_notes TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_injury_updates_player ON injury_updates(player_id);
CREATE INDEX IF NOT EXISTS idx_injury_updates_team ON injury_updates(team_id);
CREATE INDEX IF NOT EXISTS idx_injury_updates_status ON injury_updates(status);
CREATE INDEX IF NOT EXISTS idx_injury_updates_sport ON injury_updates(sport);

-- Officiating crew assignments
CREATE TABLE IF NOT EXISTS official_assignments (
  assignment_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  crew_id TEXT NOT NULL,
  umpire_or_referee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT, -- 'home_plate', 'referee', 'line_judge', '1st_base', 'field_judge'
  crew_metrics TEXT, -- JSON: historical tendencies from umpire_scorecards
  experience_years INTEGER,
  games_this_season INTEGER,
  notable_tendencies TEXT, -- 'tight_strike_zone', 'flag_happy', 'player_friendly'
  assigned_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_official_assignments_game ON official_assignments(game_id);
CREATE INDEX IF NOT EXISTS idx_official_assignments_crew ON official_assignments(crew_id);
CREATE INDEX IF NOT EXISTS idx_official_assignments_official ON official_assignments(umpire_or_referee_id);

-- ============================================================================
-- CROSS-ENGINE INTEGRATION TABLES
-- ============================================================================

-- Alert queue (feeds into personalization engine notifications)
CREATE TABLE IF NOT EXISTS alert_queue (
  alert_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  source_engine TEXT NOT NULL CHECK (source_engine IN ('predictive', 'situational', 'historical', 'personalization')),
  entity_id TEXT,
  entity_type TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT, -- JSON: additional context
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 10 = highest
  delivered INTEGER DEFAULT 0 CHECK (delivered IN (0, 1)),
  read_status INTEGER DEFAULT 0 CHECK (read_status IN (0, 1)),
  created_at INTEGER DEFAULT (unixepoch()),
  delivered_at INTEGER,
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_alert_queue_user ON alert_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_queue_delivered ON alert_queue(delivered);
CREATE INDEX IF NOT EXISTS idx_alert_queue_priority ON alert_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_alert_queue_created ON alert_queue(created_at DESC);

-- Model training jobs (for predictive engine)
CREATE TABLE IF NOT EXISTS model_training_jobs (
  job_id TEXT PRIMARY KEY,
  model_type TEXT NOT NULL,
  sport TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  start_time INTEGER,
  end_time INTEGER,
  duration_seconds INTEGER,
  training_samples INTEGER,
  validation_accuracy REAL,
  error_message TEXT,
  triggered_by TEXT, -- 'cron', 'manual', 'api'
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_model_training_jobs_status ON model_training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_model_training_jobs_created ON model_training_jobs(created_at DESC);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active high-risk players (injury risk > 75)
CREATE VIEW IF NOT EXISTS v_high_risk_players AS
SELECT
  i.player_id,
  i.sport,
  i.risk_index,
  i.risk_category,
  i.reasons,
  i.recommended_actions,
  p.player_name,
  p.team_id,
  p.team_name,
  i.updated_at
FROM injury_risk_scores i
LEFT JOIN player_stats_archive p ON i.player_id = p.player_id
WHERE i.risk_index > 75
  AND i.updated_at > unixepoch() - 86400 -- Last 24 hours
GROUP BY i.player_id
ORDER BY i.risk_index DESC;

-- User's followed entities with recent activity
CREATE VIEW IF NOT EXISTS v_user_followed_entities AS
SELECT
  up.user_id,
  up.entity_id,
  up.entity_type,
  up.interest_score,
  up.explicit_follow,
  up.last_interaction,
  COUNT(cp.post_id) as recent_posts,
  COUNT(DISTINCT lc.change_id) as recent_lineup_changes,
  COUNT(DISTINCT iu.injury_id) as recent_injuries
FROM user_preferences up
LEFT JOIN community_posts cp ON up.entity_id = cp.entity_id AND cp.created_at > unixepoch() - 604800 -- 7 days
LEFT JOIN lineup_changes lc ON up.entity_id = lc.team_id AND lc.update_time > unixepoch() - 86400 -- 1 day
LEFT JOIN injury_updates iu ON up.entity_id = iu.team_id AND iu.updated_at > unixepoch() - 86400 -- 1 day
WHERE up.interest_score > 0.3 OR up.explicit_follow = 1
GROUP BY up.user_id, up.entity_id;

-- Active contests with leaderboard summary
CREATE VIEW IF NOT EXISTS v_active_contests AS
SELECT
  c.contest_id,
  c.name,
  c.contest_type,
  c.sport,
  c.start_date,
  c.end_date,
  c.status,
  c.current_entries,
  c.max_entries,
  COUNT(DISTINCT ce.user_id) as unique_participants,
  AVG(ce.score) as avg_score,
  MAX(ce.score) as top_score
FROM contests c
LEFT JOIN contest_entries ce ON c.contest_id = ce.contest_id
WHERE c.status IN ('active', 'scoring')
GROUP BY c.contest_id;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update updated_at timestamp on record modification
CREATE TRIGGER IF NOT EXISTS trg_predictive_models_updated
AFTER UPDATE ON predictive_models
BEGIN
  UPDATE predictive_models SET updated_at = unixepoch() WHERE model_id = NEW.model_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_user_preferences_updated
AFTER UPDATE ON user_preferences
BEGIN
  UPDATE user_preferences SET updated_at = unixepoch() WHERE pref_id = NEW.pref_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_notification_rules_updated
AFTER UPDATE ON notification_rules
BEGIN
  UPDATE notification_rules SET updated_at = unixepoch() WHERE rule_id = NEW.rule_id;
END;

-- Update contest entry count
CREATE TRIGGER IF NOT EXISTS trg_contests_entry_count
AFTER INSERT ON contest_entries
BEGIN
  UPDATE contests SET current_entries = current_entries + 1 WHERE contest_id = NEW.contest_id;
END;

-- Update community post comment count
CREATE TRIGGER IF NOT EXISTS trg_community_posts_comment_count
AFTER INSERT ON post_comments
BEGIN
  UPDATE community_posts SET comment_count = comment_count + 1 WHERE post_id = NEW.post_id;
END;

-- ============================================================================
-- INITIAL DATA SEEDING (Optional - for testing)
-- ============================================================================

-- Seed example model
INSERT OR IGNORE INTO predictive_models (model_id, model_name, version, sport, model_type, trained_at, status)
VALUES ('model_001', 'Injury Risk Predictor v1', '1.0.0', 'college-baseball', 'injury_risk', unixepoch(), 'active');

-- Seed example contest
INSERT OR IGNORE INTO contests (contest_id, name, contest_type, sport, start_date, end_date, status, max_entries)
VALUES ('contest_001', 'College World Series Bracket Challenge', 'bracket', 'college-baseball', unixepoch(), unixepoch() + 2592000, 'upcoming', 1000);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
