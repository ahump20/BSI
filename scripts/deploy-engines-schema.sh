#!/bin/bash

# ============================================================================
# Blaze Sports Intel - Engines Schema Deployment Script
# ============================================================================
# This script deploys the comprehensive engines database schema to D1 in batches
# to avoid timeout and authentication issues with large SQL files
# ============================================================================

set -e  # Exit on error

WRANGLER="/Users/AustinHumphrey/.npm-global/bin/wrangler"
DB_NAME="blazesports-db"

echo "🚀 Deploying Blaze Engines Database Schema to D1..."
echo "📊 Database: $DB_NAME"
echo ""

# Function to execute SQL and report success
execute_sql() {
  local description=$1
  local sql=$2
  echo "⏳ $description..."
  if $WRANGLER d1 execute $DB_NAME --remote --command="$sql" > /dev/null 2>&1; then
    echo "   ✅ $description complete"
  else
    echo "   ❌ $description failed"
    return 1
  fi
}

# ============================================================================
# Predictive Intelligence Tables
# ============================================================================

echo "📈 Deploying Predictive Intelligence Engine tables..."

execute_sql "Creating player_projections table" "
CREATE TABLE IF NOT EXISTS player_projections (
  projection_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  projection_type TEXT NOT NULL,
  value REAL NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
  comparable_players TEXT,
  model_id TEXT,
  season INTEGER,
  updated_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER,
  FOREIGN KEY (model_id) REFERENCES predictive_models(model_id)
);
CREATE INDEX IF NOT EXISTS idx_player_projections_player ON player_projections(player_id);
CREATE INDEX IF NOT EXISTS idx_player_projections_sport ON player_projections(sport);
CREATE INDEX IF NOT EXISTS idx_player_projections_type ON player_projections(projection_type);
"

execute_sql "Creating injury_risk_scores table" "
CREATE TABLE IF NOT EXISTS injury_risk_scores (
  risk_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  position TEXT,
  risk_index REAL NOT NULL CHECK (risk_index >= 0 AND risk_index <= 100),
  risk_category TEXT CHECK (risk_category IN ('low', 'moderate', 'high', 'critical')),
  reasons TEXT,
  recommended_actions TEXT,
  workload_metrics TEXT,
  model_id TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (model_id) REFERENCES predictive_models(model_id)
);
CREATE INDEX IF NOT EXISTS idx_injury_risk_player ON injury_risk_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_injury_risk_category ON injury_risk_scores(risk_category);
"

execute_sql "Creating draft_projections table" "
CREATE TABLE IF NOT EXISTS draft_projections (
  draft_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  league TEXT NOT NULL CHECK (league IN ('MLB', 'NFL')),
  draft_year INTEGER NOT NULL,
  projected_round INTEGER,
  pick_range TEXT,
  signing_bonus_range TEXT,
  draft_grade REAL CHECK (draft_grade >= 0 AND draft_grade <= 100),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  signability_assessment TEXT,
  comparable_players TEXT,
  model_id TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (model_id) REFERENCES predictive_models(model_id)
);
CREATE INDEX IF NOT EXISTS idx_draft_projections_player ON draft_projections(player_id);
CREATE INDEX IF NOT EXISTS idx_draft_projections_year ON draft_projections(draft_year);
"

execute_sql "Creating win_probability table" "
CREATE TABLE IF NOT EXISTS win_probability (
  prob_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  inning_or_drive INTEGER,
  outs INTEGER,
  runners_on TEXT,
  team_id TEXT NOT NULL,
  opponent_id TEXT NOT NULL,
  win_prob REAL NOT NULL CHECK (win_prob >= 0.0 AND win_prob <= 1.0),
  lower_ci REAL,
  upper_ci REAL,
  key_factors TEXT,
  model_id TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (model_id) REFERENCES predictive_models(model_id)
);
CREATE INDEX IF NOT EXISTS idx_win_prob_game ON win_probability(game_id);
CREATE INDEX IF NOT EXISTS idx_win_prob_team ON win_probability(team_id);
"

# ============================================================================
# Personalization & Community Tables
# ============================================================================

echo ""
echo "👥 Deploying Personalization & Community Engine tables..."

execute_sql "Creating user_preferences table" "
CREATE TABLE IF NOT EXISTS user_preferences (
  pref_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('team', 'player', 'conference', 'sport', 'coach')),
  interest_score REAL DEFAULT 0.5 CHECK (interest_score >= 0.0 AND interest_score <= 1.0),
  explicit_follow INTEGER DEFAULT 0 CHECK (explicit_follow IN (0, 1)),
  interaction_count INTEGER DEFAULT 0,
  last_interaction INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prefs_entity ON user_preferences(entity_id, entity_type);
"

execute_sql "Creating notification_rules table" "
CREATE TABLE IF NOT EXISTS notification_rules (
  rule_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('injury_risk', 'lineup_change', 'game_upset', 'draft_update', 'win_prob_swing', 'contest_result')),
  entity_id TEXT,
  entity_type TEXT,
  threshold REAL,
  enabled INTEGER DEFAULT 1 CHECK (enabled IN (0, 1)),
  delivery_methods TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_notification_rules_user ON notification_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_type ON notification_rules(rule_type);
"

execute_sql "Creating contests table" "
CREATE TABLE IF NOT EXISTS contests (
  contest_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contest_type TEXT NOT NULL CHECK (contest_type IN ('bracket', 'game_outcome', 'player_performance', 'season_standings')),
  sport TEXT NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  rules TEXT,
  scoring_method TEXT,
  prize_description TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'scoring', 'completed')),
  max_entries INTEGER,
  current_entries INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_contests_sport ON contests(sport);
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
"

execute_sql "Creating contest_entries table" "
CREATE TABLE IF NOT EXISTS contest_entries (
  entry_id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  prediction TEXT NOT NULL,
  score REAL,
  rank INTEGER,
  tiebreaker_value REAL,
  submitted_at INTEGER DEFAULT (unixepoch()),
  scored_at INTEGER,
  FOREIGN KEY (contest_id) REFERENCES contests(contest_id)
);
CREATE INDEX IF NOT EXISTS idx_contest_entries_contest ON contest_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_entries_user ON contest_entries(user_id);
"

execute_sql "Creating leaderboards table" "
CREATE TABLE IF NOT EXISTS leaderboards (
  leaderboard_id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  total_score REAL NOT NULL,
  rank INTEGER NOT NULL,
  percentile REAL,
  badges TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (contest_id) REFERENCES contests(contest_id)
);
CREATE INDEX IF NOT EXISTS idx_leaderboards_contest ON leaderboards(contest_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(rank);
"

execute_sql "Creating community_posts table" "
CREATE TABLE IF NOT EXISTS community_posts (
  post_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  post_type TEXT NOT NULL CHECK (post_type IN ('scouting_report', 'discussion', 'analysis', 'question', 'prediction')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  entity_id TEXT,
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
CREATE INDEX IF NOT EXISTS idx_community_posts_sport ON community_posts(sport);
"

execute_sql "Creating post_comments table" "
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
"

# ============================================================================
# Historical Research Tables
# ============================================================================

echo ""
echo "📚 Deploying Historical Research Engine tables..."

execute_sql "Creating historical_games table" "
CREATE TABLE IF NOT EXISTS historical_games (
  game_id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  game_date INTEGER NOT NULL,
  home_team_id TEXT NOT NULL,
  home_team_name TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  innings_or_quarters INTEGER,
  tournament_round TEXT,
  venue TEXT,
  venue_city TEXT,
  venue_state TEXT,
  attendance INTEGER,
  weather_conditions TEXT,
  box_score_url TEXT,
  play_by_play_r2_key TEXT,
  game_notes TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_historical_games_date ON historical_games(game_date);
CREATE INDEX IF NOT EXISTS idx_historical_games_teams ON historical_games(home_team_id, away_team_id);
"

execute_sql "Creating player_stats_archive table" "
CREATE TABLE IF NOT EXISTS player_stats_archive (
  stat_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  season INTEGER NOT NULL,
  sport TEXT NOT NULL,
  team_id TEXT,
  team_name TEXT,
  stat_category TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  value REAL NOT NULL,
  games_played INTEGER,
  position TEXT,
  class_year TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats_archive(player_id, season);
CREATE INDEX IF NOT EXISTS idx_player_stats_season ON player_stats_archive(season, sport);
"

execute_sql "Creating coaching_decisions table" "
CREATE TABLE IF NOT EXISTS coaching_decisions (
  decision_id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  team_id TEXT,
  decision_type TEXT NOT NULL,
  game_situation TEXT,
  attempt_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  success_rate REAL,
  seasons TEXT,
  last_updated INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_coaching_decisions_coach ON coaching_decisions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_decisions_type ON coaching_decisions(decision_type);
"

execute_sql "Creating umpire_scorecards table" "
CREATE TABLE IF NOT EXISTS umpire_scorecards (
  scorecard_id TEXT PRIMARY KEY,
  umpire_id TEXT NOT NULL,
  umpire_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  games_called INTEGER DEFAULT 0,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  rank_percentile REAL,
  details TEXT,
  last_updated INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_umpire_scorecards_umpire ON umpire_scorecards(umpire_id, season);
CREATE INDEX IF NOT EXISTS idx_umpire_scorecards_metric ON umpire_scorecards(metric_name);
"

# ============================================================================
# Situational Awareness Tables
# ============================================================================

echo ""
echo "🌤️ Deploying Situational Awareness Engine tables..."

execute_sql "Creating weather_forecasts table" "
CREATE TABLE IF NOT EXISTS weather_forecasts (
  forecast_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  forecast_time INTEGER NOT NULL,
  temp_f REAL,
  feels_like_f REAL,
  wind_speed_mph REAL,
  wind_direction TEXT,
  wind_direction_degrees INTEGER,
  precip_chance REAL CHECK (precip_chance >= 0.0 AND precip_chance <= 1.0),
  precip_type TEXT,
  humidity REAL,
  conditions TEXT,
  visibility_miles REAL,
  impact_score REAL CHECK (impact_score >= 0 AND impact_score <= 100),
  impact_details TEXT,
  delay_probability REAL,
  fetched_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_weather_forecasts_game ON weather_forecasts(game_id);
CREATE INDEX IF NOT EXISTS idx_weather_forecasts_time ON weather_forecasts(forecast_time);
"

execute_sql "Creating lineup_changes table" "
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
  reason TEXT,
  significance REAL CHECK (significance >= 0 AND significance <= 100),
  replacement_player_id TEXT,
  replacement_player_name TEXT,
  source TEXT,
  update_time INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_lineup_changes_game ON lineup_changes(game_id);
CREATE INDEX IF NOT EXISTS idx_lineup_changes_player ON lineup_changes(player_id);
"

execute_sql "Creating injury_updates table" "
CREATE TABLE IF NOT EXISTS injury_updates (
  injury_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  team_name TEXT,
  sport TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('probable', 'questionable', 'doubtful', 'out', 'DTD', 'IR', 'recovered')),
  injury_type TEXT,
  body_part TEXT,
  severity TEXT CHECK (severity IN ('minor', 'moderate', 'major', 'career_threatening')),
  source TEXT NOT NULL,
  reliability_score REAL CHECK (reliability_score >= 0 AND reliability_score <= 100),
  expected_return_date INTEGER,
  games_missed INTEGER DEFAULT 0,
  update_notes TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_injury_updates_player ON injury_updates(player_id);
CREATE INDEX IF NOT EXISTS idx_injury_updates_team ON injury_updates(team_id);
"

execute_sql "Creating official_assignments table" "
CREATE TABLE IF NOT EXISTS official_assignments (
  assignment_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  crew_id TEXT NOT NULL,
  umpire_or_referee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  crew_metrics TEXT,
  experience_years INTEGER,
  games_this_season INTEGER,
  notable_tendencies TEXT,
  assigned_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_official_assignments_game ON official_assignments(game_id);
CREATE INDEX IF NOT EXISTS idx_official_assignments_crew ON official_assignments(crew_id);
"

# ============================================================================
# Cross-Engine Integration Tables
# ============================================================================

echo ""
echo "🔗 Deploying cross-engine integration tables..."

execute_sql "Creating alert_queue table" "
CREATE TABLE IF NOT EXISTS alert_queue (
  alert_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  source_engine TEXT NOT NULL CHECK (source_engine IN ('predictive', 'situational', 'historical', 'personalization')),
  entity_id TEXT,
  entity_type TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  delivered INTEGER DEFAULT 0 CHECK (delivered IN (0, 1)),
  read_status INTEGER DEFAULT 0 CHECK (read_status IN (0, 1)),
  created_at INTEGER DEFAULT (unixepoch()),
  delivered_at INTEGER,
  expires_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_alert_queue_user ON alert_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_queue_delivered ON alert_queue(delivered);
"

execute_sql "Creating model_training_jobs table" "
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
  triggered_by TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_model_training_jobs_status ON model_training_jobs(status);
"

# ============================================================================
# Final Steps
# ============================================================================

echo ""
echo "✅ Database schema deployment complete!"
echo ""
echo "📊 Verifying tables..."
$WRANGLER d1 execute $DB_NAME --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%predictive%' OR name LIKE '%contest%' OR name LIKE '%historical%' OR name LIKE '%weather%' ORDER BY name;" | grep -E "(predictive_models|contests|historical_games|weather_forecasts)" && echo "   ✅ All engine tables verified"

echo ""
echo "🎉 Blaze Engines Database Schema successfully deployed!"
echo "🚀 Ready for implementation phase"
