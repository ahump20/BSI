# Blaze Sports Intel - Comprehensive Engine Integration Architecture

**Version**: 1.0.0
**Date**: October 17, 2025
**Author**: Blaze Intelligence Engineering Team

## Executive Summary

Integration of four comprehensive intelligence engines into Blaze Sports Intel platform:

1. **Predictive Intelligence Engine** - Machine learning models for player projections, injury risk, draft predictions, and live win probability
2. **Personalization & Community Engine** - User-driven feeds, smart alerts, prediction contests, and discussion forums
3. **Historical Research Engine** - Deep historical queries, matchup analysis, coaching patterns, and officiating scorecards
4. **Situational Awareness Engine** - Real-time weather impact, lineup changes, injury reports, and officiating assignments

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BLAZE SPORTS INTEL PLATFORM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │
│  │   Predictive      │  │  Personalization  │  │   Historical    │ │
│  │  Intelligence     │◄─┤   & Community     │◄─┤    Research     │ │
│  │     Engine        │  │      Engine       │  │     Engine      │ │
│  └────────┬──────────┘  └────────┬──────────┘  └────────┬────────┘ │
│           │                      │                       │          │
│           └──────────────┬───────┴───────────────────────┘          │
│                          │                                          │
│                  ┌───────▼────────┐                                 │
│                  │  Situational   │                                 │
│                  │   Awareness    │                                 │
│                  │     Engine     │                                 │
│                  └───────┬────────┘                                 │
│                          │                                          │
├──────────────────────────┼──────────────────────────────────────────┤
│                          │                                          │
│                  ┌───────▼────────┐                                 │
│                  │  Unified API   │                                 │
│                  │     Layer      │                                 │
│                  └───────┬────────┘                                 │
│                          │                                          │
├──────────────────────────┼──────────────────────────────────────────┤
│                          │                                          │
│        ┌─────────────────┼─────────────────┐                       │
│        │                 │                 │                       │
│   ┌────▼─────┐     ┌─────▼────┐     ┌─────▼────┐                  │
│   │  D1 SQL  │     │    KV    │     │    R2    │                  │
│   │ Database │     │  Cache   │     │ Storage  │                  │
│   └──────────┘     └──────────┘     └──────────┘                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Database Schema Design

### Predictive Intelligence Tables

```sql
-- Model metadata
CREATE TABLE predictive_models (
  model_id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  sport TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'player_development', 'injury_risk', 'draft', 'win_probability'
  trained_at TIMESTAMP NOT NULL,
  metrics TEXT, -- JSON: accuracy, precision, recall, F1
  parameters TEXT, -- JSON: hyperparameters
  status TEXT DEFAULT 'active', -- 'active', 'deprecated', 'training'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player development projections
CREATE TABLE player_projections (
  projection_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  projection_type TEXT NOT NULL, -- 'mlb_draft_round', 'starter_probability', 'nfl_combine'
  value REAL NOT NULL,
  confidence REAL NOT NULL, -- 0.0 to 1.0
  comparable_players TEXT, -- JSON array of similar player examples
  model_id TEXT REFERENCES predictive_models(model_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  INDEX idx_player_projections_player (player_id),
  INDEX idx_player_projections_sport (sport)
);

-- Injury risk scoring
CREATE TABLE injury_risk_scores (
  risk_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  risk_index REAL NOT NULL, -- 0-100 scale
  risk_category TEXT, -- 'low', 'moderate', 'high', 'critical'
  reasons TEXT, -- JSON array: ['high_pitch_count', 'velocity_drop', 'insufficient_rest']
  recommended_actions TEXT, -- JSON array
  workload_metrics TEXT, -- JSON: pitch counts, innings, rest days
  model_id TEXT REFERENCES predictive_models(model_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_injury_risk_player (player_id),
  INDEX idx_injury_risk_category (risk_category)
);

-- Draft projections
CREATE TABLE draft_projections (
  draft_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  league TEXT NOT NULL, -- 'MLB', 'NFL'
  draft_year INTEGER NOT NULL,
  projected_round INTEGER,
  pick_range TEXT, -- '15-25', '1st round'
  signing_bonus_range TEXT, -- '$2M-$3.5M'
  draft_grade REAL, -- 0-100
  confidence_level TEXT, -- 'high', 'medium', 'low'
  comparable_players TEXT, -- JSON
  model_id TEXT REFERENCES predictive_models(model_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_draft_projections_player (player_id),
  INDEX idx_draft_projections_year (draft_year)
);

-- Live win probability
CREATE TABLE win_probability (
  prob_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  inning_or_drive INTEGER,
  outs INTEGER,
  runners_on TEXT, -- '1st_3rd', 'bases_loaded'
  team_id TEXT NOT NULL,
  win_prob REAL NOT NULL, -- 0.0 to 1.0
  lower_ci REAL, -- 95% confidence interval lower bound
  upper_ci REAL, -- 95% confidence interval upper bound
  key_factors TEXT, -- JSON array of contributors
  model_id TEXT REFERENCES predictive_models(model_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_win_prob_game (game_id),
  INDEX idx_win_prob_updated (updated_at)
);
```

### Personalization & Community Tables

```sql
-- User profiles and preferences
CREATE TABLE user_preferences (
  pref_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_id TEXT NOT NULL, -- team_id, player_id, conference_id
  entity_type TEXT NOT NULL, -- 'team', 'player', 'conference', 'sport'
  interest_score REAL DEFAULT 0.5, -- 0.0 to 1.0, learned from behavior
  explicit_follow BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_prefs_user (user_id),
  INDEX idx_user_prefs_entity (entity_id, entity_type)
);

-- Notification rules
CREATE TABLE notification_rules (
  rule_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'injury_risk', 'lineup_change', 'game_upset', 'draft_update'
  entity_id TEXT, -- Optional: specific team/player
  threshold REAL, -- Trigger threshold (e.g., injury_risk > 75)
  enabled BOOLEAN DEFAULT TRUE,
  delivery_methods TEXT, -- JSON: ['push', 'email', 'sms']
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notification_rules_user (user_id),
  INDEX idx_notification_rules_type (rule_type)
);

-- Prediction contests
CREATE TABLE contests (
  contest_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contest_type TEXT NOT NULL, -- 'bracket', 'game_outcome', 'player_performance'
  sport TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  rules TEXT, -- JSON
  scoring_method TEXT, -- JSON
  prize_pool TEXT, -- Description (no gambling)
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'scoring', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contests_sport (sport),
  INDEX idx_contests_status (status)
);

CREATE TABLE contest_entries (
  entry_id TEXT PRIMARY KEY,
  contest_id TEXT REFERENCES contests(contest_id),
  user_id TEXT NOT NULL,
  prediction TEXT NOT NULL, -- JSON
  score REAL,
  rank INTEGER,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contest_entries_contest (contest_id),
  INDEX idx_contest_entries_user (user_id)
);

CREATE TABLE leaderboards (
  leaderboard_id TEXT PRIMARY KEY,
  contest_id TEXT REFERENCES contests(contest_id),
  user_id TEXT NOT NULL,
  total_score REAL NOT NULL,
  rank INTEGER NOT NULL,
  badges TEXT, -- JSON array
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_leaderboards_contest (contest_id),
  INDEX idx_leaderboards_rank (rank)
);

-- Community posts and discussions
CREATE TABLE community_posts (
  post_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  post_type TEXT NOT NULL, -- 'scouting_report', 'discussion', 'analysis'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  entity_id TEXT, -- Related team/player/game
  entity_type TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_moderated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_community_posts_type (post_type),
  INDEX idx_community_posts_entity (entity_id, entity_type)
);

CREATE TABLE post_comments (
  comment_id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES community_posts(post_id),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_post_comments_post (post_id)
);
```

### Historical Research Tables

```sql
-- Historical games archive
CREATE TABLE historical_games (
  game_id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  date DATE NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  tournament_round TEXT, -- 'College World Series - Finals', 'SEC Championship'
  venue TEXT,
  attendance INTEGER,
  weather_conditions TEXT,
  box_score_url TEXT,
  play_by_play_r2_key TEXT, -- R2 storage key for detailed PBP data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_historical_games_date (date),
  INDEX idx_historical_games_teams (home_team_id, away_team_id),
  INDEX idx_historical_games_tournament (tournament_round)
);

-- Player statistical archive
CREATE TABLE player_stats_archive (
  stat_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  sport TEXT NOT NULL,
  stat_category TEXT NOT NULL, -- 'batting', 'pitching', 'rushing', 'passing'
  stat_name TEXT NOT NULL, -- 'batting_avg', 'era', 'rushing_yards'
  value REAL NOT NULL,
  games_played INTEGER,
  team_id TEXT,
  INDEX idx_player_stats_player (player_id, season),
  INDEX idx_player_stats_season (season, sport)
);

-- Coaching decision patterns
CREATE TABLE coaching_decisions (
  decision_id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  decision_type TEXT NOT NULL, -- 'fourth_down_attempt', 'hit_and_run', 'starter_pull'
  game_situation TEXT, -- JSON: score_margin, time_remaining, field_position
  attempt_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  seasons TEXT, -- JSON array of seasons analyzed
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coaching_decisions_coach (coach_id),
  INDEX idx_coaching_decisions_type (decision_type)
);

-- Umpire and referee scorecards
CREATE TABLE umpire_scorecards (
  scorecard_id TEXT PRIMARY KEY,
  umpire_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  games_called INTEGER DEFAULT 0,
  metric_name TEXT NOT NULL, -- 'strike_accuracy', 'zone_consistency', 'ejection_rate'
  metric_value REAL NOT NULL,
  details TEXT, -- JSON: handedness bias, high/low zone bias
  INDEX idx_umpire_scorecards_umpire (umpire_id, season),
  INDEX idx_umpire_scorecards_metric (metric_name)
);
```

### Situational Awareness Tables

```sql
-- Weather forecasts
CREATE TABLE weather_forecasts (
  forecast_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  forecast_time TIMESTAMP NOT NULL,
  temp_f REAL,
  wind_speed_mph REAL,
  wind_direction TEXT, -- 'N', 'SSW', 'Out to RF'
  precip_chance REAL, -- 0.0 to 1.0
  humidity REAL,
  conditions TEXT, -- 'Clear', 'Partly Cloudy', 'Thunderstorms'
  impact_score REAL, -- 0-100: calculated impact on game
  impact_details TEXT, -- JSON: hitting conditions, delay risk
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_weather_forecasts_game (game_id),
  INDEX idx_weather_forecasts_time (forecast_time)
);

-- Lineup changes
CREATE TABLE lineup_changes (
  change_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'scratched', 'inserted', 'moved', 'called_up'
  position TEXT,
  batting_order INTEGER,
  reason TEXT, -- 'injury', 'matchup', 'rest'
  significance REAL, -- 0-100: calculated impact
  replacement_player_id TEXT,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lineup_changes_game (game_id),
  INDEX idx_lineup_changes_player (player_id)
);

-- Injury updates
CREATE TABLE injury_updates (
  injury_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  status TEXT NOT NULL, -- 'probable', 'questionable', 'doubtful', 'out'
  injury_type TEXT, -- 'shoulder', 'hamstring', 'concussion'
  source TEXT, -- 'official', 'beat_writer', 'practice_report'
  reliability_score REAL, -- 0-100: source reliability
  expected_return_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_injury_updates_player (player_id),
  INDEX idx_injury_updates_status (status)
);

-- Officiating assignments
CREATE TABLE official_assignments (
  assignment_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  crew_id TEXT NOT NULL,
  position TEXT, -- 'home_plate', 'referee', 'line_judge'
  crew_metrics TEXT, -- JSON: historical tendencies
  INDEX idx_official_assignments_game (game_id),
  INDEX idx_official_assignments_crew (crew_id)
);
```

## API Endpoint Structure

### Predictive Intelligence Endpoints

```
POST   /api/v1/predictive/models/train           # Trigger model training
GET    /api/v1/predictive/models                 # List available models
GET    /api/v1/predictive/models/:id             # Model details

GET    /api/v1/predictive/players/:id/projection  # Player development projection
GET    /api/v1/predictive/players/:id/injury-risk # Injury risk assessment
GET    /api/v1/predictive/players/:id/draft       # Draft projection

GET    /api/v1/predictive/games/:id/win-prob      # Current win probability
GET    /api/v1/predictive/games/:id/win-prob/history  # Win prob timeline
```

### Personalization & Community Endpoints

```
GET    /api/v1/personalization/feed              # Personalized user feed
POST   /api/v1/personalization/preferences       # Update preferences
GET    /api/v1/personalization/preferences       # Get user preferences

POST   /api/v1/notifications/rules               # Create notification rule
GET    /api/v1/notifications/rules               # List user's rules
DELETE /api/v1/notifications/rules/:id           # Delete rule

GET    /api/v1/contests                          # List active contests
POST   /api/v1/contests/:id/enter                # Enter contest
GET    /api/v1/contests/:id/leaderboard          # Contest leaderboard

POST   /api/v1/community/posts                   # Create discussion post
GET    /api/v1/community/posts                   # List posts (filtered)
POST   /api/v1/community/posts/:id/comments      # Add comment
POST   /api/v1/community/posts/:id/vote          # Upvote/downvote
```

### Historical Research Endpoints

```
GET    /api/v1/historical/matchups               # Team matchup history
GET    /api/v1/historical/players/:id/stats      # Player career stats
GET    /api/v1/historical/coaches/:id/decisions  # Coaching pattern analysis
GET    /api/v1/historical/umpires/:id/scorecard  # Umpire performance

POST   /api/v1/historical/query                  # Natural language query
```

### Situational Awareness Endpoints

```
GET    /api/v1/situational/games/:id/weather     # Weather forecast & impact
GET    /api/v1/situational/games/:id/lineups     # Current lineups & changes
GET    /api/v1/situational/players/:id/status    # Current injury status
GET    /api/v1/situational/games/:id/officials   # Officiating crew info

GET    /api/v1/situational/alerts                # Active situation alerts
```

## Integration Flows

### Flow 1: Live Game Win Probability

```
1. Situational Awareness Engine detects lineup change
   ↓
2. Updates player availability in database
   ↓
3. Triggers Predictive Intelligence Engine to recalculate win probability
   ↓
4. New win probability stored in database
   ↓
5. Personalization Engine checks if users have notification rules
   ↓
6. Smart alerts sent to interested users
```

### Flow 2: Injury Risk Alert

```
1. Predictive Intelligence Engine calculates high injury risk (>75)
   ↓
2. Stores risk score in injury_risk_scores table
   ↓
3. Situational Awareness Engine monitors for game-day status changes
   ↓
4. Personalization Engine checks notification rules
   ↓
5. Alert sent: "Pitcher X has high injury risk (82/100) - 102 pitches, velocity drop"
```

### Flow 3: Historical Context in Game Preview

```
1. User requests game preview for Texas vs LSU
   ↓
2. Historical Research Engine queries matchup history
   ↓
3. Returns: "Texas is 12-8 vs LSU in elimination games"
   ↓
4. Predictive Intelligence adds: "Current win probability: 58%"
   ↓
5. Situational Awareness adds: "Wind blowing out to RF at 15 mph"
   ↓
6. Unified response combines all context
```

## Caching Strategy

### KV Cache Keys

```
# Predictive Intelligence
pred:win-prob:{game_id}                    TTL: 30s (live games)
pred:player-projection:{player_id}         TTL: 24h
pred:injury-risk:{player_id}               TTL: 1h

# Personalization
user:feed:{user_id}                        TTL: 5m
user:prefs:{user_id}                       TTL: 1h
contest:leaderboard:{contest_id}           TTL: 1m

# Historical
hist:matchup:{team1_id}:{team2_id}         TTL: 7d
hist:player-stats:{player_id}:{season}     TTL: 30d

# Situational
situ:weather:{game_id}                     TTL: 15m
situ:lineup:{game_id}                      TTL: 5m
situ:officials:{game_id}                   TTL: 24h
```

## R2 Storage Structure

```
/models/
  /predictive/
    /{model_id}/weights.pkl
    /{model_id}/metadata.json
  /personalization/
    /recommendation_model.pkl

/historical/
  /play-by-play/
    /{game_id}.json
  /archives/
    /{sport}/{season}/games.parquet

/user-generated/
  /scouting-reports/{user_id}/{report_id}.pdf
  /bracket-sheets/{contest_id}/{user_id}.pdf
```

## Implementation Phases

### Phase 1: Database & Core API (Week 1)

- Create all D1 tables
- Build unified API routing layer
- Implement authentication & authorization
- Set up KV caching infrastructure

### Phase 2: Predictive Intelligence (Week 2-3)

- Implement player projection models
- Build injury risk scoring system
- Create draft projection engine
- Develop live win probability tracker

### Phase 3: Personalization & Community (Week 4-5)

- User preference learning system
- Smart notification engine
- Prediction contests platform
- Community discussion forums

### Phase 4: Historical Research (Week 6-7)

- Historical data ETL pipeline
- Natural language query parser
- Matchup analysis engine
- Coaching pattern analyzer
- Umpire scorecard generator

### Phase 5: Situational Awareness (Week 8-9)

- Weather API integration
- Lineup change detection
- Injury report aggregation
- Officiating crew database

### Phase 6: Integration & Testing (Week 10-12)

- Cross-engine data flows
- Frontend dashboard
- Performance optimization
- User acceptance testing
- Production deployment

## Frontend Integration

### Dashboard Components

```jsx
// Unified Intelligence Dashboard
<BlazeDashboard>
  <PredictiveInsights>
    <WinProbabilityChart gameId={gameId} />
    <InjuryRiskAlerts teamId={teamId} />
    <DraftProjections sport="college-baseball" />
  </PredictiveInsights>

  <PersonalizedFeed userId={userId}>
    <SmartAlerts />
    <RecommendedGames />
    <ActiveContests />
  </PersonalizedFeed>

  <HistoricalContext>
    <MatchupHistory team1={team1} team2={team2} />
    <PlayerCareerStats playerId={playerId} />
    <CoachingTendencies coachId={coachId} />
  </HistoricalContext>

  <SituationalAwareness gameId={gameId}>
    <WeatherImpact />
    <LineupChanges />
    <InjuryReports />
    <OfficialsCrew />
  </SituationalAwareness>

  <CommunityHub>
    <Discussions />
    <PredictionContests />
    <Leaderboards />
  </CommunityHub>
</BlazeDashboard>
```

## Performance Targets

- **Win Probability Updates**: <200ms (live games)
- **Personalized Feed Generation**: <500ms
- **Historical Queries**: <1s (complex queries), <200ms (cached)
- **Situational Alerts**: <100ms (from detection to KV cache)
- **Model Training**: Overnight batch jobs (off-peak hours)

## Monitoring & Observability

### Key Metrics

```javascript
// Analytics Engine tracking
{
  "predictive_model_accuracy": 0.0-1.0,
  "injury_prediction_precision": 0.0-1.0,
  "user_engagement_rate": 0.0-1.0,
  "notification_click_through_rate": 0.0-1.0,
  "query_response_time_p95": "ms",
  "cache_hit_rate": 0.0-1.0,
  "contest_participation_rate": 0.0-1.0
}
```

## Security & Privacy

- All user data encrypted at rest (D1, R2)
- PII handling compliant with COPPA (youth sports)
- User consent required for personalization tracking
- Community moderation with automated filters
- Rate limiting on all API endpoints
- No gambling features (contests are skill-based, no money)

## Next Steps

1. **Review & Approve Architecture** - Validate approach with stakeholders
2. **Database Schema Creation** - Deploy D1 tables to production
3. **API Scaffolding** - Create endpoint stubs for all four engines
4. **Phased Implementation** - Begin with Predictive Intelligence Engine
5. **Continuous Testing** - Unit tests, integration tests, E2E tests
6. **Documentation** - API docs, user guides, model explanations

---

**Status**: Architecture Complete - Ready for Implementation
**Next Review**: After Phase 1 Completion
