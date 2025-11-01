# Clutch Performance + Wearables Integration Schema

**Last Updated**: 2025-11-01
**Target Sport**: Basketball (NBA)
**Wearables Platform**: WHOOP v2 API
**Confidence**: 88%

---

## Executive Summary

This document outlines the complete data architecture, integration pipeline, and modeling framework for integrating athlete wearables data (WHOOP v2) with NBA clutch performance analytics within the Blaze Sports Intel platform.

**Key Goals:**
1. Ingest real-time wearables data (HRV, HR, strain, recovery) from WHOOP v2 API
2. Capture NBA clutch situations (last 5:00, margin ≤5) via NBA Stats API
3. Time-align wearable signals with game events (UTC timestamp synchronization)
4. Build hierarchical Bayesian models correlating athlete state → clutch performance
5. Surface actionable insights via interactive dashboards

---

## 1. Database Schema Extensions

### 1.1 Wearables Tables

#### `wearables_devices`
Tracks registered wearable devices per athlete.

```sql
CREATE TABLE wearables_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,

    -- Device metadata
    device_type VARCHAR(50) NOT NULL DEFAULT 'whoop', -- 'whoop', 'oura', 'garmin', etc.
    device_serial VARCHAR(255),
    firmware_version VARCHAR(50),

    -- API integration
    api_version VARCHAR(10) NOT NULL DEFAULT 'v2', -- WHOOP v2 required by 2025-10-01
    access_token_encrypted TEXT, -- Encrypted OAuth token
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Consent & privacy
    consent_granted BOOLEAN NOT NULL DEFAULT FALSE,
    consent_granted_at TIMESTAMPTZ,
    consent_revoked_at TIMESTAMPTZ,
    data_retention_days INTEGER DEFAULT 365,

    -- Status tracking
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'syncing', 'success', 'error'
    sync_error_message TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(player_id, device_serial),
    CHECK (consent_granted = TRUE OR access_token_encrypted IS NULL)
);

CREATE INDEX idx_wearables_devices_player ON wearables_devices(player_id) WHERE is_active = TRUE;
CREATE INDEX idx_wearables_devices_sync ON wearables_devices(last_sync_at) WHERE sync_status = 'success';
```

#### `wearables_readings`
Raw time-series biometric data from wearables.

```sql
CREATE TABLE wearables_readings (
    reading_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES wearables_devices(device_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,

    -- Timestamp (UTC normalized)
    reading_timestamp TIMESTAMPTZ NOT NULL,
    timezone_offset INTEGER, -- Minutes from UTC for local time reconstruction

    -- Metric type
    metric_type VARCHAR(100) NOT NULL, -- 'heart_rate', 'hrv_rmssd', 'strain', 'recovery_score', 'sleep_performance', 'respiratory_rate'
    metric_value DECIMAL(12, 4),
    metric_unit VARCHAR(50), -- 'bpm', 'ms', 'score', '%', 'count'

    -- Quality & confidence
    quality_score DECIMAL(3, 2) CHECK (quality_score >= 0 AND quality_score <= 1), -- 0.0-1.0
    confidence_interval_lower DECIMAL(12, 4),
    confidence_interval_upper DECIMAL(12, 4),

    -- Context
    activity_state VARCHAR(50), -- 'resting', 'active', 'sleeping', 'exercising', 'game'
    source_session_id VARCHAR(255), -- WHOOP workout/sleep cycle ID

    -- Metadata
    raw_payload JSONB, -- Full API response for debugging
    data_source VARCHAR(100) NOT NULL DEFAULT 'whoop_v2',

    -- Audit
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(device_id, metric_type, reading_timestamp)
);

-- Performance indexes
CREATE INDEX idx_wearables_readings_player_time ON wearables_readings(player_id, reading_timestamp DESC);
CREATE INDEX idx_wearables_readings_metric ON wearables_readings(metric_type, reading_timestamp DESC);
CREATE INDEX idx_wearables_readings_device ON wearables_readings(device_id, reading_timestamp DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_wearables_readings_payload ON wearables_readings USING GIN(raw_payload);

-- Partitioning by month for performance (optional, for high-volume data)
-- ALTER TABLE wearables_readings PARTITION BY RANGE (reading_timestamp);
```

#### `wearables_daily_summary`
Pre-aggregated daily metrics for faster queries.

```sql
CREATE TABLE wearables_daily_summary (
    summary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES wearables_devices(device_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,

    -- Date (player's local timezone)
    summary_date DATE NOT NULL,

    -- HRV metrics (primary clutch predictor)
    hrv_rmssd_avg DECIMAL(8, 2), -- Average HRV in ms
    hrv_rmssd_min DECIMAL(8, 2),
    hrv_rmssd_max DECIMAL(8, 2),
    hrv_baseline_deviation DECIMAL(8, 2), -- % deviation from 30-day baseline

    -- Heart rate
    resting_hr_avg DECIMAL(6, 2), -- bpm
    resting_hr_min DECIMAL(6, 2),
    hr_variability_index DECIMAL(6, 2), -- Coefficient of variation

    -- Strain & recovery
    day_strain DECIMAL(5, 2), -- WHOOP's 0-21 strain score
    recovery_score DECIMAL(5, 2), -- WHOOP's 0-100% recovery
    sleep_performance_score DECIMAL(5, 2), -- Sleep quality %

    -- Sleep metrics
    total_sleep_minutes INTEGER,
    rem_sleep_minutes INTEGER,
    deep_sleep_minutes INTEGER,
    sleep_efficiency DECIMAL(5, 2), -- %

    -- Respiratory
    respiratory_rate_avg DECIMAL(5, 2), -- breaths per minute

    -- Quality
    data_completeness DECIMAL(3, 2), -- % of expected readings received

    -- Metadata
    raw_payload JSONB,
    data_source VARCHAR(100) NOT NULL DEFAULT 'whoop_v2',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(device_id, summary_date)
);

CREATE INDEX idx_wearables_daily_player ON wearables_daily_summary(player_id, summary_date DESC);
CREATE INDEX idx_wearables_daily_recovery ON wearables_daily_summary(recovery_score) WHERE recovery_score IS NOT NULL;
```

---

### 1.2 Clutch Performance Tables

#### `clutch_situations`
Define clutch game contexts for NBA basketball.

```sql
CREATE TABLE clutch_situations (
    situation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,

    -- Situation definition
    situation_type VARCHAR(50) NOT NULL, -- 'clutch_time', 'overtime', 'final_possession', 'playoff_elimination'

    -- Timing (UTC)
    start_timestamp TIMESTAMPTZ NOT NULL,
    end_timestamp TIMESTAMPTZ NOT NULL,
    game_clock_start VARCHAR(10), -- e.g., "5:00", "2:30"
    game_clock_end VARCHAR(10),
    period INTEGER, -- 1, 2, 3, 4, OT1, OT2, etc.

    -- Score context
    score_margin INTEGER, -- Positive = home team leading
    score_margin_absolute INTEGER, -- For filtering (≤5 for clutch)
    home_score INTEGER,
    away_score INTEGER,

    -- Clutch criteria (NBA standard: last 5:00, margin ≤5)
    is_clutch_time BOOLEAN NOT NULL DEFAULT FALSE,
    clutch_intensity DECIMAL(3, 2), -- 0.0-1.0 based on time remaining + margin

    -- Context
    playoff_game BOOLEAN DEFAULT FALSE,
    elimination_game BOOLEAN DEFAULT FALSE,

    -- Metadata
    raw_payload JSONB,
    data_source VARCHAR(100) NOT NULL DEFAULT 'nba_stats_api',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CHECK (end_timestamp > start_timestamp),
    CHECK (score_margin_absolute >= 0)
);

CREATE INDEX idx_clutch_situations_game ON clutch_situations(game_id, start_timestamp);
CREATE INDEX idx_clutch_situations_type ON clutch_situations(situation_type) WHERE is_clutch_time = TRUE;
CREATE INDEX idx_clutch_situations_intensity ON clutch_situations(clutch_intensity DESC);
```

#### `clutch_player_actions`
Individual player actions during clutch situations.

```sql
CREATE TABLE clutch_player_actions (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    situation_id UUID NOT NULL REFERENCES clutch_situations(situation_id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,

    -- Action details
    action_timestamp TIMESTAMPTZ NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'field_goal_made', 'field_goal_missed', 'free_throw', 'turnover', 'assist', 'rebound', 'steal', 'block'
    action_subtype VARCHAR(50), -- 'three_pointer', 'layup', 'dunk', etc.

    -- Outcome
    is_successful BOOLEAN,
    points_scored INTEGER DEFAULT 0,

    -- Context
    shot_distance DECIMAL(5, 2), -- feet
    shot_location_x DECIMAL(6, 2), -- court coordinates
    shot_location_y DECIMAL(6, 2),
    defender_distance DECIMAL(5, 2), -- feet to nearest defender
    touch_time DECIMAL(5, 2), -- seconds ball in hands before shot

    -- Expected value (from NBA tracking data)
    expected_points DECIMAL(5, 3), -- xPTS based on shot quality
    points_over_expected DECIMAL(5, 3), -- Actual - Expected

    -- Metadata
    raw_payload JSONB,
    data_source VARCHAR(100) NOT NULL DEFAULT 'nba_stats_api',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clutch_actions_player ON clutch_player_actions(player_id, action_timestamp DESC);
CREATE INDEX idx_clutch_actions_situation ON clutch_player_actions(situation_id, action_timestamp);
CREATE INDEX idx_clutch_actions_type ON clutch_player_actions(action_type) WHERE is_successful = TRUE;
```

#### `clutch_performance_scores`
Aggregated clutch performance metrics with wearables context.

```sql
CREATE TABLE clutch_performance_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    situation_id UUID NOT NULL REFERENCES clutch_situations(situation_id) ON DELETE CASCADE,

    -- Performance metrics
    actions_total INTEGER NOT NULL,
    actions_successful INTEGER,
    success_rate DECIMAL(5, 4), -- 0.0000-1.0000

    points_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    rebounds INTEGER DEFAULT 0,

    -- Expected vs actual
    expected_points DECIMAL(8, 3),
    points_over_expected DECIMAL(8, 3), -- Clutch "impact"

    -- Clutch score (0-100)
    clutch_score DECIMAL(5, 2), -- Composite metric: success rate + POE + context
    clutch_percentile DECIMAL(5, 2), -- Percentile vs all players (season)

    -- Wearables context (from wearables_daily_summary on game date)
    hrv_rmssd_pregame DECIMAL(8, 2), -- HRV from morning of game
    hrv_baseline_deviation DECIMAL(8, 2), -- % from 30-day baseline
    recovery_score_pregame DECIMAL(5, 2), -- WHOOP recovery %
    sleep_performance_pregame DECIMAL(5, 2), -- Prior night sleep quality
    day_strain_pregame DECIMAL(5, 2), -- Accumulated strain before game

    -- Wearables availability
    has_wearables_data BOOLEAN NOT NULL DEFAULT FALSE,
    wearables_quality_score DECIMAL(3, 2), -- Data completeness for that day

    -- Model predictions (optional, for validation)
    predicted_clutch_score DECIMAL(5, 2), -- From hierarchical model
    prediction_confidence DECIMAL(3, 2),

    -- Metadata
    calculation_method VARCHAR(100) DEFAULT 'hierarchical_bayesian_v1',
    raw_payload JSONB,

    -- Audit
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(player_id, game_id, situation_id),
    CHECK (success_rate >= 0 AND success_rate <= 1)
);

CREATE INDEX idx_clutch_scores_player ON clutch_performance_scores(player_id, calculated_at DESC);
CREATE INDEX idx_clutch_scores_game ON clutch_performance_scores(game_id);
CREATE INDEX idx_clutch_scores_score ON clutch_performance_scores(clutch_score DESC);
CREATE INDEX idx_clutch_scores_wearables ON clutch_performance_scores(player_id) WHERE has_wearables_data = TRUE;
```

---

### 1.3 ML Feature Store Extensions

Add wearables-derived features to existing `ml_features` table.

```sql
-- Example feature rows for player with wearables data:

INSERT INTO ml_features (entity_id, entity_type, feature_name, feature_value, calculation_window, as_of_date) VALUES
    ('player-uuid', 'player', 'hrv_avg_last_7_days', 68.5, 'last_7_games', '2025-11-01'),
    ('player-uuid', 'player', 'hrv_trend_slope', -2.3, 'last_30_days', '2025-11-01'),
    ('player-uuid', 'player', 'recovery_score_avg', 72.0, 'season', '2025-11-01'),
    ('player-uuid', 'player', 'sleep_quality_variance', 12.5, 'last_14_days', '2025-11-01'),
    ('player-uuid', 'player', 'strain_vs_recovery_ratio', 1.15, 'season', '2025-11-01'),
    ('player-uuid', 'player', 'clutch_score_with_wearables', 78.2, 'season', '2025-11-01'),
    ('player-uuid', 'player', 'clutch_score_without_wearables', 68.9, 'season', '2025-11-01');
```

**New Feature Categories:**
- **Wearables Base**: `hrv_rmssd_avg`, `resting_hr_avg`, `recovery_score_avg`
- **Wearables Trends**: `hrv_trend_7d`, `recovery_trend_14d`, `sleep_quality_variance`
- **Wearables + Performance**: `clutch_score_adjusted`, `fatigue_index`, `strain_recovery_ratio`
- **Time-Aligned**: `hrv_delta_pregame_vs_baseline`, `recovery_on_clutch_games`

---

## 2. API Integration Architecture

### 2.1 WHOOP v2 API Adapter

**File**: `lib/adapters/whoop-v2-adapter.ts`

**Key Endpoints**:
```typescript
// OAuth 2.0 Authorization
POST https://api.whoop.com/oauth/token
Headers: { "Content-Type": "application/x-www-form-urlencoded" }
Body: {
  grant_type: "authorization_code",
  code: "<authorization_code>",
  client_id: "<client_id>",
  client_secret: "<client_secret>",
  redirect_uri: "<redirect_uri>"
}

// Get User Profile
GET https://api.whoop.com/v2/user/profile/basic
Headers: { "Authorization": "Bearer <access_token>" }

// Get Recovery Data (daily)
GET https://api.whoop.com/v2/recovery
Params: { start: "2025-10-01T00:00:00Z", end: "2025-11-01T00:00:00Z" }

// Get Sleep Data
GET https://api.whoop.com/v2/sleep
Params: { start: "2025-10-01T00:00:00Z", end: "2025-11-01T00:00:00Z" }

// Get Workout/Strain Data
GET https://api.whoop.com/v2/workout
Params: { start: "2025-10-01T00:00:00Z", end: "2025-11-01T00:00:00Z" }

// Get Cycle Data (combines recovery, sleep, strain)
GET https://api.whoop.com/v2/cycle
Params: { start: "2025-10-01T00:00:00Z", end: "2025-11-01T00:00:00Z" }

// Webhook Subscription (real-time updates)
POST https://api.whoop.com/v2/webhook
Body: {
  url: "https://bsi-edge.workers.dev/api/webhooks/whoop",
  events: ["recovery.updated", "sleep.updated", "workout.updated"]
}
```

**Response Normalization**:
```typescript
interface WHOOPRecoveryResponse {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string; // ISO 8601
  updated_at: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score: {
    user_calibrating: boolean;
    recovery_score: number; // 0-100
    resting_heart_rate: number; // bpm
    hrv_rmssd_milli: number; // ms
    spo2_percentage: number; // %
    skin_temp_celsius: number;
  };
}

// Normalized to BSI schema
interface NormalizedWearablesReading {
  player_id: string;
  reading_timestamp: Date;
  metric_type: "heart_rate" | "hrv_rmssd" | "recovery_score" | "spo2" | "skin_temp";
  metric_value: number;
  metric_unit: "bpm" | "ms" | "score" | "%" | "celsius";
  quality_score: number; // 0.0-1.0
  activity_state: "resting" | "sleeping" | "active";
  source_session_id: string; // cycle_id
  raw_payload: object;
  data_source: "whoop_v2";
}
```

**Error Handling & Retry Logic**:
- **Rate Limits**: WHOOP v2 allows 100 requests/minute. Implement exponential backoff.
- **Token Refresh**: Refresh tokens expire after 30 days. Auto-refresh before expiry.
- **Data Gaps**: If `score_state === "UNSCORABLE"`, mark `quality_score = 0.0`.
- **Webhook Verification**: Validate HMAC signature on incoming webhook events.

---

### 2.2 NBA Stats API Adapter

**File**: `lib/adapters/nba-stats-clutch-adapter.ts`

**Key Endpoints**:
```typescript
// Clutch Player Stats
GET https://stats.nba.com/stats/leaguedashplayerclutch
Params: {
  LeagueID: "00",
  Season: "2024-25",
  SeasonType: "Regular Season",
  PerMode: "Totals",
  ClutchTime: "Last 5 Minutes",
  AheadBehind: "Ahead or Behind",
  PointDiff: 5,
  GameScope: "",
  PlayerExperience: "",
  PlayerPosition: "",
  StarterBench: ""
}

// Play-by-Play Data
GET https://stats.nba.com/stats/playbyplayv2
Params: {
  GameID: "0022400123",
  StartPeriod: 4,
  EndPeriod: 4
}

// Player Tracking Stats (shot quality)
GET https://stats.nba.com/stats/playerdashptshotlog
Params: {
  PlayerID: "2544",
  Season: "2024-25",
  SeasonType: "Regular Season"
}
```

**Clutch Context Detection**:
```typescript
function isClutchSituation(playByPlayEvent: NBAPlayByPlayEvent): boolean {
  const period = playByPlayEvent.PERIOD;
  const gameClock = parseGameClock(playByPlayEvent.PCTIMESTRING); // "5:00" → 300 seconds
  const scoreMargin = Math.abs(playByPlayEvent.SCOREMARGIN);

  // NBA standard: Last 5:00 of 4th quarter or OT, margin ≤5
  const isLastFiveMinutes = (period >= 4) && (gameClock <= 300);
  const isCloseGame = scoreMargin <= 5;

  return isLastFiveMinutes && isCloseGame;
}
```

**Data Synchronization**:
- **Polling Frequency**: Every 5 minutes during live games
- **Historical Backfill**: Batch process previous 2 seasons on initial setup
- **Timezone**: NBA uses ET (America/New_York). Convert all to UTC for storage.

---

### 2.3 Time Alignment Utilities

**File**: `lib/utils/time-alignment.ts`

**Challenge**: Synchronize wearable readings (sampled every 1-60 minutes) with discrete game events (sub-second resolution).

**Strategy**:
1. **Pre-game Baseline**: Use wearables data from morning of game (6am-12pm local time)
2. **Event Window Matching**: For each clutch action, find closest wearable reading within ±2 hours
3. **Interpolation**: For missing data, linearly interpolate between adjacent readings
4. **Quality Scoring**: Reduce quality score if time delta > 30 minutes

```typescript
interface TimeAlignedData {
  game_event_timestamp: Date; // UTC
  wearable_reading_timestamp: Date; // UTC
  time_delta_minutes: number; // Absolute difference
  interpolated: boolean;
  quality_score: number; // 1.0 if exact match, 0.5 if >1hr delta
  hrv_value: number;
  recovery_score: number;
}

async function alignWearablesToClutchEvent(
  playerId: string,
  clutchEventTime: Date,
  lookbackHours: number = 2
): Promise<TimeAlignedData> {
  const windowStart = new Date(clutchEventTime.getTime() - (lookbackHours * 3600000));
  const windowEnd = clutchEventTime;

  const readings = await db.query(`
    SELECT * FROM wearables_readings
    WHERE player_id = $1
      AND reading_timestamp BETWEEN $2 AND $3
      AND metric_type IN ('hrv_rmssd', 'recovery_score', 'heart_rate')
    ORDER BY ABS(EXTRACT(EPOCH FROM (reading_timestamp - $4)))
    LIMIT 1
  `, [playerId, windowStart, windowEnd, clutchEventTime]);

  if (readings.rows.length === 0) {
    return null; // No wearables data available
  }

  const reading = readings.rows[0];
  const timeDelta = Math.abs(
    (clutchEventTime.getTime() - reading.reading_timestamp.getTime()) / 60000
  );

  const qualityScore = timeDelta < 30 ? 1.0 : (timeDelta < 120 ? 0.7 : 0.4);

  return {
    game_event_timestamp: clutchEventTime,
    wearable_reading_timestamp: reading.reading_timestamp,
    time_delta_minutes: timeDelta,
    interpolated: false,
    quality_score: qualityScore,
    hrv_value: reading.metric_value,
    recovery_score: null // Fetch separately if needed
  };
}
```

---

## 3. Data Ingestion Pipeline

### 3.1 Wearables Ingestion Worker

**File**: `workers/ingest/whoop-ingestion-worker.ts`

**Architecture**: Cloudflare Worker triggered by:
1. **Scheduled CRON**: Every 1 hour for batch sync
2. **Webhook Events**: Real-time when WHOOP sends `recovery.updated`

```typescript
// Cloudflare Worker entrypoint
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Batch sync for all active devices
    const devices = await db.query(`
      SELECT device_id, player_id, access_token_encrypted
      FROM wearables_devices
      WHERE is_active = TRUE
        AND consent_granted = TRUE
        AND last_sync_at < NOW() - INTERVAL '1 hour'
    `);

    for (const device of devices.rows) {
      await syncWHOOPData(device, env);
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Handle webhook events
    if (request.method === "POST" && new URL(request.url).pathname === "/webhooks/whoop") {
      const event = await request.json();
      await handleWHOOPWebhook(event, env);
      return new Response("OK", { status: 200 });
    }
    return new Response("Not Found", { status: 404 });
  }
};

async function syncWHOOPData(device: WearableDevice, env: Env) {
  const accessToken = decrypt(device.access_token_encrypted, env.ENCRYPTION_KEY);
  const lastSync = device.last_sync_at || new Date(Date.now() - 7 * 86400000); // 7 days ago

  // Fetch cycle data (combines recovery, sleep, strain)
  const response = await fetch(`https://api.whoop.com/v2/cycle?start=${lastSync.toISOString()}&end=${new Date().toISOString()}`, {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });

  if (response.status === 401) {
    // Token expired, refresh
    await refreshWHOOPToken(device, env);
    return syncWHOOPData(device, env); // Retry
  }

  const data = await response.json();

  // Transform and insert
  for (const cycle of data.records) {
    await insertWearablesReading(device.player_id, cycle);
    await upsertDailySummary(device.player_id, cycle);
  }

  // Update sync status
  await db.query(`
    UPDATE wearables_devices
    SET last_sync_at = NOW(), sync_status = 'success'
    WHERE device_id = $1
  `, [device.device_id]);
}
```

---

### 3.2 NBA Clutch Data Ingestion

**File**: `workers/ingest/nba-clutch-ingestion-worker.ts`

**Trigger**: Scheduled every 5 minutes during NBA season (October-June)

```typescript
async function ingestNBAClutchData(gameId: string) {
  // 1. Fetch play-by-play data
  const pbp = await nbaStats.getPlayByPlay(gameId);

  // 2. Identify clutch situations
  const clutchWindows = [];
  let currentClutchWindow = null;

  for (const event of pbp.events) {
    const isClutch = isClutchSituation(event);

    if (isClutch && !currentClutchWindow) {
      // Start new clutch window
      currentClutchWindow = {
        start_timestamp: event.timestamp,
        game_clock_start: event.game_clock,
        period: event.period,
        score_margin: event.score_margin
      };
    } else if (!isClutch && currentClutchWindow) {
      // End clutch window
      currentClutchWindow.end_timestamp = event.timestamp;
      clutchWindows.push(currentClutchWindow);
      currentClutchWindow = null;
    }
  }

  // 3. Insert clutch situations
  for (const window of clutchWindows) {
    const situationId = await db.query(`
      INSERT INTO clutch_situations (game_id, situation_type, start_timestamp, end_timestamp, ...)
      VALUES ($1, 'clutch_time', $2, $3, ...)
      RETURNING situation_id
    `, [gameId, window.start_timestamp, window.end_timestamp]);

    // 4. Extract player actions within window
    const actionsInWindow = pbp.events.filter(e =>
      e.timestamp >= window.start_timestamp && e.timestamp <= window.end_timestamp
    );

    for (const action of actionsInWindow) {
      await db.query(`
        INSERT INTO clutch_player_actions (situation_id, player_id, action_type, is_successful, ...)
        VALUES ($1, $2, $3, $4, ...)
      `, [situationId, action.player_id, action.action_type, action.is_successful]);
    }
  }
}
```

---

## 4. Modeling Framework

### 4.1 Hierarchical Bayesian Model

**File**: `api/ml/clutch-performance-model.py`

**Objective**: Estimate player-specific clutch ability accounting for:
1. **Player-level random effects**: Some players are inherently "clutch"
2. **Wearables covariates**: HRV, recovery, sleep quality
3. **Situation covariates**: Score margin, playoff vs regular season
4. **Temporal trends**: Performance over time

**Model Specification** (using PyMC):

```python
import pymc as pm
import numpy as np
import pandas as pd

def build_hierarchical_clutch_model(df: pd.DataFrame):
    """
    df columns:
    - player_id: categorical
    - clutch_score: 0-100 (target)
    - hrv_baseline_deviation: % from baseline
    - recovery_score_pregame: 0-100
    - sleep_performance: 0-100
    - score_margin: -5 to +5
    - is_playoff: boolean
    - days_since_last_game: integer
    """

    n_players = df['player_id'].nunique()
    player_idx = pd.Categorical(df['player_id']).codes

    with pm.Model() as model:
        # Hyperpriors (league-wide)
        mu_alpha = pm.Normal('mu_alpha', mu=50, sigma=10)  # Mean clutch ability
        sigma_alpha = pm.HalfNormal('sigma_alpha', sigma=10)  # Player variability

        # Player-specific intercepts (random effects)
        alpha = pm.Normal('alpha', mu=mu_alpha, sigma=sigma_alpha, shape=n_players)

        # Fixed effects (wearables + situation)
        beta_hrv = pm.Normal('beta_hrv', mu=0, sigma=5)  # HRV effect
        beta_recovery = pm.Normal('beta_recovery', mu=0, sigma=5)  # Recovery effect
        beta_sleep = pm.Normal('beta_sleep', mu=0, sigma=5)  # Sleep effect
        beta_margin = pm.Normal('beta_margin', mu=0, sigma=2)  # Score margin
        beta_playoff = pm.Normal('beta_playoff', mu=0, sigma=5)  # Playoff boost
        beta_rest = pm.Normal('beta_rest', mu=0, sigma=2)  # Days rest

        # Linear predictor
        mu = (
            alpha[player_idx] +
            beta_hrv * df['hrv_baseline_deviation'].values +
            beta_recovery * df['recovery_score_pregame'].values +
            beta_sleep * df['sleep_performance'].values +
            beta_margin * df['score_margin'].values +
            beta_playoff * df['is_playoff'].values +
            beta_rest * df['days_since_last_game'].values
        )

        # Likelihood (normal distribution for clutch_score)
        sigma = pm.HalfNormal('sigma', sigma=10)
        y = pm.Normal('y', mu=mu, sigma=sigma, observed=df['clutch_score'].values)

        # Inference
        trace = pm.sample(2000, tune=1000, return_inferencedata=True, random_seed=42)

    return model, trace

# Posterior predictive checks
def predict_clutch_score(trace, new_data: pd.DataFrame) -> np.ndarray:
    """Generate predictions for new player-game combinations"""
    player_idx = pd.Categorical(new_data['player_id'], categories=trace.posterior['alpha'].player.values).codes

    alpha_samples = trace.posterior['alpha'].values  # (chains, draws, n_players)
    beta_samples = {
        'hrv': trace.posterior['beta_hrv'].values,
        'recovery': trace.posterior['beta_recovery'].values,
        'sleep': trace.posterior['beta_sleep'].values,
        'margin': trace.posterior['beta_margin'].values,
        'playoff': trace.posterior['beta_playoff'].values,
        'rest': trace.posterior['beta_rest'].values
    }

    # Compute posterior mean prediction
    predictions = []
    for i, row in new_data.iterrows():
        mu = (
            alpha_samples[..., player_idx[i]].mean() +
            beta_samples['hrv'].mean() * row['hrv_baseline_deviation'] +
            beta_samples['recovery'].mean() * row['recovery_score_pregame'] +
            beta_samples['sleep'].mean() * row['sleep_performance'] +
            beta_samples['margin'].mean() * row['score_margin'] +
            beta_samples['playoff'].mean() * row['is_playoff'] +
            beta_samples['rest'].mean() * row['days_since_last_game']
        )
        predictions.append(mu)

    return np.array(predictions)
```

**Model Training Pipeline**:
1. **Data Preparation**: Join `clutch_performance_scores` + `wearables_daily_summary`
2. **Train/Test Split**: 80/20, stratified by player
3. **Fit Model**: Run MCMC sampling (2000 samples, 1000 tuning)
4. **Validation**: Posterior predictive checks, R-hat convergence diagnostics
5. **Deployment**: Save trace to Cloudflare R2 as `clutch_model_v1_{timestamp}.nc`

---

### 4.2 Model Deployment

**File**: `api/ml/clutch-prediction-service.js`

```javascript
const { loadModel } = require('./model-loader');
const R2 = require('./r2-client');

class ClutchPredictionService {
  constructor() {
    this.model = null;
    this.modelVersion = 'v1.0.0';
  }

  async initialize() {
    // Load model from R2
    const modelArtifact = await R2.getObject('models', `clutch_model_v1_latest.nc`);
    this.model = await loadModel(modelArtifact);
  }

  async predictClutchScore(playerId, gameContext, wearablesData) {
    const features = {
      player_id: playerId,
      hrv_baseline_deviation: wearablesData.hrv_baseline_deviation || 0,
      recovery_score_pregame: wearablesData.recovery_score || 70,
      sleep_performance: wearablesData.sleep_performance || 75,
      score_margin: gameContext.score_margin,
      is_playoff: gameContext.is_playoff ? 1 : 0,
      days_since_last_game: gameContext.days_rest
    };

    const prediction = await this.model.predict(features);

    return {
      predicted_clutch_score: prediction.mean,
      confidence_interval: [prediction.lower, prediction.upper],
      model_version: this.modelVersion,
      has_wearables_data: !!wearablesData.recovery_score
    };
  }
}

module.exports = new ClutchPredictionService();
```

---

## 5. Analytics Dashboard

### 5.1 Frontend Components

**File**: `apps/web/components/clutch/ClutchPerformanceDashboard.tsx`

```tsx
import React from 'react';
import { LineChart } from '../charts/LineChart';
import { PerformanceSphere3D } from '../visuals/PerformanceSphere3D';
import { WinProbabilityWave } from '../visuals/WinProbabilityWave';

interface ClutchDashboardProps {
  playerId: string;
  season: string;
}

export function ClutchPerformanceDashboard({ playerId, season }: ClutchDashboardProps) {
  const [clutchData, setClutchData] = React.useState(null);
  const [wearablesData, setWearablesData] = React.useState(null);

  React.useEffect(() => {
    fetch(`/api/players/${playerId}/clutch-performance?season=${season}`)
      .then(res => res.json())
      .then(data => setClutchData(data));

    fetch(`/api/players/${playerId}/wearables/summary?season=${season}`)
      .then(res => res.json())
      .then(data => setWearablesData(data));
  }, [playerId, season]);

  if (!clutchData) return <div>Loading...</div>;

  return (
    <div className="clutch-dashboard">
      <h1>Clutch Performance Analysis</h1>

      {/* 3D Performance Sphere with Wearables Ring */}
      <PerformanceSphere3D
        data={clutchData.scores}
        wearablesData={wearablesData}
        width={800}
        height={600}
      />

      {/* Time Series: Clutch Score + HRV */}
      <div className="time-series-section">
        <h2>Performance Trends</h2>
        <LineChart
          data={clutchData.timeline}
          xKey="game_date"
          yKeys={['clutch_score', 'hrv_baseline_deviation', 'recovery_score']}
          colors={['#10b981', '#3b82f6', '#f59e0b']}
        />
      </div>

      {/* Win Probability with Wearables Overlay */}
      <WinProbabilityWave
        gameId={clutchData.latest_game_id}
        playerId={playerId}
        showWearablesOverlay={true}
      />

      {/* Data Table */}
      <table className="clutch-data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Opponent</th>
            <th>Clutch Score</th>
            <th>HRV Deviation</th>
            <th>Recovery %</th>
            <th>POE (Points Over Expected)</th>
          </tr>
        </thead>
        <tbody>
          {clutchData.games.map(game => (
            <tr key={game.game_id}>
              <td>{game.date}</td>
              <td>{game.opponent}</td>
              <td>{game.clutch_score.toFixed(1)}</td>
              <td>{game.hrv_baseline_deviation?.toFixed(1) ?? 'N/A'}</td>
              <td>{game.recovery_score_pregame?.toFixed(0) ?? 'N/A'}</td>
              <td>{game.points_over_expected.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 6. Privacy & Consent Management

### 6.1 Consent Flow

**File**: `apps/web/app/players/[id]/wearables/consent/page.tsx`

```tsx
export default function WearablesConsentPage({ params }: { params: { id: string } }) {
  const handleGrantConsent = async () => {
    // Redirect to WHOOP OAuth
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/whoop/callback`;
    const clientId = process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID;
    const scope = 'read:recovery read:sleep read:workout read:cycles';

    const authUrl = `https://api.whoop.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${params.id}`;

    window.location.href = authUrl;
  };

  return (
    <div className="consent-page">
      <h1>Connect Your WHOOP Device</h1>
      <p>Allow Blaze Sports Intel to access your recovery, sleep, and strain data to improve clutch performance insights.</p>

      <h2>Data We Collect:</h2>
      <ul>
        <li>Heart Rate Variability (HRV)</li>
        <li>Resting Heart Rate</li>
        <li>Recovery Score</li>
        <li>Sleep Performance</li>
        <li>Daily Strain</li>
      </ul>

      <h2>Privacy Commitments:</h2>
      <ul>
        <li>Data retained for {365} days, then automatically deleted</li>
        <li>You can revoke access anytime</li>
        <li>Data is encrypted at rest and in transit</li>
        <li>Used only for performance analytics, never sold</li>
      </ul>

      <button onClick={handleGrantConsent}>
        Connect WHOOP
      </button>
    </div>
  );
}
```

**OAuth Callback Handler**: `apps/web/app/api/auth/whoop/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from '@/lib/utils/encryption';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state'); // player_id

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://api.whoop.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/whoop/callback`
    })
  });

  const tokens = await tokenResponse.json();

  // Store encrypted tokens
  await db.query(`
    INSERT INTO wearables_devices (player_id, device_type, api_version, access_token_encrypted, refresh_token_encrypted, token_expires_at, consent_granted, consent_granted_at)
    VALUES ($1, 'whoop', 'v2', $2, $3, $4, TRUE, NOW())
  `, [
    state,
    encrypt(tokens.access_token),
    encrypt(tokens.refresh_token),
    new Date(Date.now() + tokens.expires_in * 1000)
  ]);

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/players/${state}/wearables?success=true`);
}
```

---

## 7. API Endpoints

### 7.1 Wearables Endpoints

```
GET /api/players/:playerId/wearables/latest
→ Returns most recent wearables readings (24h window)

GET /api/players/:playerId/wearables/summary?start=2025-10-01&end=2025-11-01
→ Returns daily summaries for date range

POST /api/webhooks/whoop
→ Receives real-time updates from WHOOP

GET /api/players/:playerId/wearables/consent-status
→ Returns consent status and device info

DELETE /api/players/:playerId/wearables/revoke-consent
→ Revokes consent and deletes data
```

### 7.2 Clutch Performance Endpoints

```
GET /api/players/:playerId/clutch-performance?season=2024-25
→ Returns all clutch performance scores for season

GET /api/games/:gameId/clutch-situations
→ Returns all clutch situations in a game

GET /api/analytics/clutch/leaderboard?season=2024-25&min_games=10
→ Returns top clutch performers with wearables correlation

POST /api/analytics/clutch/predict
→ Predict clutch score for upcoming game given wearables state
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Database schema migration
- [ ] WHOOP v2 adapter implementation
- [ ] OAuth consent flow
- [ ] Basic data ingestion workers

### Phase 2: NBA Integration (Weeks 3-4)
- [ ] NBA Stats clutch adapter
- [ ] Clutch situation detection logic
- [ ] Time alignment utilities
- [ ] Historical data backfill (2 seasons)

### Phase 3: Modeling (Weeks 5-6)
- [ ] Feature engineering pipeline
- [ ] Hierarchical Bayesian model training
- [ ] Model validation and tuning
- [ ] Deployment to R2 + inference service

### Phase 4: Frontend (Weeks 7-8)
- [ ] Clutch performance dashboard
- [ ] Wearables data visualizations
- [ ] 3D components integration
- [ ] API endpoint implementation

### Phase 5: Production (Week 9)
- [ ] Load testing
- [ ] Security audit
- [ ] Privacy compliance review
- [ ] Launch to beta cohort (5-10 athletes)

---

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low athlete consent rate | High | Medium | Incentivize with exclusive insights; start with team buy-in |
| WHOOP API rate limits | Medium | Low | Implement caching; batch requests; use webhooks |
| Data sync latency | Medium | Medium | Prioritize pre-game data (6am-12pm); interpolate gaps |
| Model overfitting | High | Medium | Cross-validation; regularization priors; holdout test set |
| Privacy breach | Critical | Low | Encryption at rest/transit; audit logs; token rotation |
| NBA API changes | Medium | Low | Version API responses; automated schema validation |

---

## 10. Success Metrics

**Technical KPIs:**
- Wearables data uptime: >95%
- API sync latency: <5 minutes
- Model prediction RMSE: <8 points (clutch score scale 0-100)
- Dashboard load time: <2 seconds

**Business KPIs:**
- Athlete adoption: >50% of target cohort
- Clutch prediction accuracy: >70% (POE sign prediction)
- Coach engagement: >80% weekly dashboard views

---

## Appendices

### A. Sample Queries

**Get player's clutch performance with wearables context:**
```sql
SELECT
  cps.game_id,
  g.game_date,
  cps.clutch_score,
  cps.points_over_expected,
  cps.hrv_rmssd_pregame,
  cps.recovery_score_pregame,
  cps.sleep_performance_pregame,
  cps.has_wearables_data
FROM clutch_performance_scores cps
JOIN games g ON cps.game_id = g.game_id
WHERE cps.player_id = '<player-uuid>'
  AND g.season = '2024-25'
ORDER BY g.game_date DESC;
```

**Leaderboard: Top clutch performers with wearables:**
```sql
SELECT
  p.full_name,
  AVG(cps.clutch_score) AS avg_clutch_score,
  AVG(cps.points_over_expected) AS avg_poe,
  AVG(cps.hrv_baseline_deviation) AS avg_hrv_deviation,
  COUNT(*) FILTER (WHERE cps.has_wearables_data) AS games_with_wearables,
  COUNT(*) AS total_clutch_games
FROM clutch_performance_scores cps
JOIN players p ON cps.player_id = p.player_id
WHERE cps.has_wearables_data = TRUE
GROUP BY p.player_id, p.full_name
HAVING COUNT(*) >= 10
ORDER BY avg_clutch_score DESC
LIMIT 20;
```

### B. WHOOP v2 Migration Checklist

- [ ] Update OAuth endpoints from v1 → v2
- [ ] Replace `user/profile` with `v2/user/profile/basic`
- [ ] Migrate webhook URLs to v2 events
- [ ] Test token refresh flow
- [ ] Update data models for new response schemas
- [ ] Deprecate v1 code paths by 2025-10-01

---

**End of Schema Document**
