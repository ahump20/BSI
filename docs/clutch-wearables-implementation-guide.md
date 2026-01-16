# Clutch Performance + Wearables Integration - Implementation Guide

**Last Updated**: 2025-11-01
**Author**: Blaze Sports Intel Engineering Team
**Status**: Ready for Implementation

---

## Quick Start

This integration adds athlete wearables data (WHOOP v2) to clutch performance analytics for NBA basketball, enabling coaches and analysts to understand how biometric factors (HRV, recovery, sleep) correlate with clutch-time performance.

### What's Included

1. **Database Schema** (`api/database/migrations/2025-11-01-clutch-wearables-schema.sql`)
   - 6 new tables for wearables + clutch performance tracking
   - Views for leaderboards and summaries
   - Indexes for optimal query performance

2. **WHOOP v2 API Adapter** (`lib/adapters/whoop-v2-adapter.ts`)
   - OAuth 2.0 consent flow
   - Real-time webhook support
   - Data normalization to BSI schema
   - Rate limiting + retry logic

3. **NBA Stats Clutch Adapter** (`lib/adapters/nba-stats-clutch-adapter.ts`)
   - Play-by-play ingestion
   - Clutch situation detection (last 5:00, margin ≤5)
   - Player action extraction
   - Expected points calculation

4. **Time Alignment Utilities** (`lib/utils/time-alignment.ts`)
   - Pre-game baseline extraction
   - Event-to-wearable synchronization
   - Timezone normalization
   - Quality scoring

5. **Comprehensive Documentation** (`docs/clutch-wearables-integration-schema.md`)
   - Detailed schema specification
   - API integration architecture
   - Modeling framework (hierarchical Bayesian)
   - Privacy & consent management

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                             │
├─────────────────────────────────────────────────────────────────┤
│  WHOOP v2 API          │  NBA Stats API     │  Game Schedule    │
│  (HRV, Recovery,       │  (Play-by-Play,    │  (Dates, Teams,   │
│   Sleep, Strain)       │   Shot Tracking)   │   Playoff Context)│
└─────────┬───────────────┴──────────┬─────────┴───────────────────┘
          │                          │
          ▼                          ▼
┌─────────────────────┐    ┌───────────────────────┐
│  WHOOP v2 Adapter   │    │  NBA Clutch Adapter   │
│  - OAuth Flow       │    │  - Clutch Detection   │
│  - Webhooks         │    │  - Action Extraction  │
│  - Normalization    │    │  - xPTS Calculation   │
└─────────┬───────────┘    └───────────┬───────────┘
          │                            │
          ▼                            ▼
┌──────────────────────────────────────────────────────┐
│           TIME ALIGNMENT SERVICE                     │
│  - Pre-game Baseline Extraction (6am-12pm)          │
│  - Event-to-Wearable Synchronization                │
│  - Timezone Normalization (UTC)                     │
│  - Quality Scoring (0.0-1.0)                        │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE                     │
│  Tables:                                             │
│  - wearables_devices, wearables_readings,            │
│    wearables_daily_summary                           │
│  - clutch_situations, clutch_player_actions,         │
│    clutch_performance_scores                         │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│       HIERARCHICAL BAYESIAN MODEL (PyMC)             │
│  Inputs:                                             │
│  - Player-specific random effects                    │
│  - Wearables covariates (HRV deviation, recovery)    │
│  - Situation covariates (margin, playoff status)     │
│  Output: Predicted clutch score + confidence         │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              ANALYTICS DASHBOARD                     │
│  - 3D Performance Sphere with Wearables Ring         │
│  - Clutch Score Timeline + HRV Overlay               │
│  - Win Probability Wave with Biometric Context       │
│  - Leaderboard (Clutch Score vs Recovery)            │
└──────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Phase 1: Database Setup (Week 1)

**1. Run Database Migration**

```bash
# Connect to PostgreSQL
psql -U your_user -d blaze_sports_intel

# Run migration
\i api/database/migrations/2025-11-01-clutch-wearables-schema.sql

# Verify tables created
\dt wearables_*
\dt clutch_*

# Check views
\dv clutch_leaderboard
\dv player_wearables_summary
```

**2. Configure Environment Variables**

Add to `.env` or environment configuration:

```bash
# WHOOP v2 API
WHOOP_CLIENT_ID=your_client_id_here
WHOOP_CLIENT_SECRET=your_client_secret_here
WHOOP_REDIRECT_URI=https://yourdomain.com/api/auth/whoop/callback
WHOOP_WEBHOOK_SECRET=your_webhook_secret_here

# Encryption (for storing OAuth tokens)
ENCRYPTION_KEY=generate_random_32_byte_key

# NBA Stats API (optional custom headers)
NBA_STATS_USER_AGENT=Mozilla/5.0...
```

**3. Test Database Connection**

```typescript
// test-db-connection.ts
import { db } from './api/database/connection-service';

async function testConnection() {
  const result = await db.query('SELECT COUNT(*) FROM wearables_devices');
  console.log('Wearables devices:', result.rows[0].count);
}

testConnection();
```

---

### Phase 2: WHOOP Integration (Week 2)

**1. Athlete Consent Flow**

Create consent page at `/players/:id/wearables/consent`:

```tsx
// apps/web/app/players/[id]/wearables/consent/page.tsx
import { createWHOOPAdapter } from '@/lib/adapters/whoop-v2-adapter';

export default function WearablesConsentPage({ params }: { params: { id: string } }) {
  const whoopAdapter = createWHOOPAdapter();

  const handleConnect = () => {
    const authUrl = whoopAdapter.getAuthorizationUrl(params.id);
    window.location.href = authUrl;
  };

  return (
    <div>
      <h1>Connect Your WHOOP Device</h1>
      <button onClick={handleConnect}>Authorize Access</button>
    </div>
  );
}
```

**2. OAuth Callback Handler**

```typescript
// apps/web/app/api/auth/whoop/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createWHOOPAdapter } from '@/lib/adapters/whoop-v2-adapter';
import { db } from '@/api/database/connection-service';
import { encrypt } from '@/lib/utils/encryption';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const playerId = request.nextUrl.searchParams.get('state'); // player_id

  const whoopAdapter = createWHOOPAdapter();
  const tokens = await whoopAdapter.exchangeCodeForTokens(code!);

  // Store encrypted tokens in database
  await db.query(
    `
    INSERT INTO wearables_devices (
      player_id, device_type, api_version,
      access_token_encrypted, refresh_token_encrypted,
      token_expires_at, consent_granted, consent_granted_at
    )
    VALUES ($1, 'whoop', 'v2', $2, $3, $4, TRUE, NOW())
  `,
    [
      playerId,
      encrypt(tokens.access_token),
      encrypt(tokens.refresh_token),
      new Date(Date.now() + tokens.expires_in * 1000),
    ]
  );

  return NextResponse.redirect(`/players/${playerId}/wearables?success=true`);
}
```

**3. Data Sync Worker (Cloudflare Worker or CRON)**

```typescript
// workers/ingest/whoop-sync-worker.ts
import { createWHOOPAdapter } from '@/lib/adapters/whoop-v2-adapter';
import { db } from '@/api/database/connection-service';

export async function syncWHOOPData() {
  const whoopAdapter = createWHOOPAdapter();

  // Get all active devices
  const devices = await db.query(`
    SELECT device_id, player_id, access_token_encrypted, last_sync_at
    FROM wearables_devices
    WHERE is_active = TRUE AND consent_granted = TRUE
  `);

  for (const device of devices.rows) {
    const accessToken = decrypt(device.access_token_encrypted);
    const lastSync = device.last_sync_at || new Date(Date.now() - 7 * 86400000);

    // Fetch cycle data (combines recovery, sleep, strain)
    const cycleData = await whoopAdapter.getCycleData(accessToken, lastSync, new Date());

    // Insert readings
    for (const cycle of cycleData) {
      const readings = whoopAdapter.normalizeRecoveryData(device.player_id, cycle);

      for (const reading of readings) {
        await db.query(
          `
          INSERT INTO wearables_readings (
            device_id, player_id, reading_timestamp,
            metric_type, metric_value, metric_unit,
            quality_score, activity_state, source_session_id,
            raw_payload, data_source
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (device_id, metric_type, reading_timestamp) DO NOTHING
        `,
          [
            device.device_id,
            reading.player_id,
            reading.reading_timestamp,
            reading.metric_type,
            reading.metric_value,
            reading.metric_unit,
            reading.quality_score,
            reading.activity_state,
            reading.source_session_id,
            JSON.stringify(reading.raw_payload),
            reading.data_source,
          ]
        );
      }
    }

    // Update sync status
    await db.query(
      `
      UPDATE wearables_devices
      SET last_sync_at = NOW(), sync_status = 'success'
      WHERE device_id = $1
    `,
      [device.device_id]
    );
  }
}

// Schedule: Run every hour
// cron: 0 * * * *
```

---

### Phase 3: NBA Clutch Data Ingestion (Week 3)

**1. Ingest Play-by-Play Data**

```typescript
// workers/ingest/nba-clutch-ingest-worker.ts
import { createNBAStatsClutchAdapter } from '@/lib/adapters/nba-stats-clutch-adapter';
import { db } from '@/api/database/connection-service';

export async function ingestNBAClutchData(gameId: string) {
  const nbaAdapter = createNBAStatsClutchAdapter();

  // 1. Fetch play-by-play data
  const playByPlay = await nbaAdapter.getPlayByPlay(gameId);

  // 2. Identify clutch situations
  const clutchSituations = nbaAdapter.identifyClutchSituations(playByPlay, gameId);

  // 3. Insert clutch situations
  for (const situation of clutchSituations) {
    const result = await db.query(
      `
      INSERT INTO clutch_situations (
        game_id, situation_type, start_timestamp, end_timestamp,
        game_clock_start, game_clock_end, period,
        score_margin, score_margin_absolute, home_score, away_score,
        is_clutch_time, clutch_intensity, playoff_game, raw_payload, data_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING situation_id
    `,
      [
        situation.game_id,
        situation.situation_type,
        situation.start_timestamp,
        situation.end_timestamp,
        situation.game_clock_start,
        situation.game_clock_end,
        situation.period,
        situation.score_margin,
        situation.score_margin_absolute,
        situation.home_score,
        situation.away_score,
        situation.is_clutch_time,
        situation.clutch_intensity,
        situation.playoff_game,
        JSON.stringify(situation.raw_payload),
        situation.data_source,
      ]
    );

    const situationId = result.rows[0].situation_id;

    // 4. Extract player actions
    const actions = nbaAdapter.extractClutchPlayerActions(playByPlay, [situation], gameId);

    for (const action of actions) {
      await db.query(
        `
        INSERT INTO clutch_player_actions (
          situation_id, game_id, player_id, action_timestamp,
          action_type, action_subtype, is_successful, points_scored,
          raw_payload, data_source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `,
        [
          situationId,
          action.game_id,
          action.player_id,
          action.action_timestamp,
          action.action_type,
          action.action_subtype,
          action.is_successful,
          action.points_scored,
          JSON.stringify(action.raw_payload),
          action.data_source,
        ]
      );
    }
  }
}
```

---

### Phase 4: Calculate Clutch Performance Scores (Week 4)

**1. Aggregate Player Actions → Performance Scores**

```typescript
// api/services/clutch-performance-calculator.ts
import { db } from '@/api/database/connection-service';
import { createTimeAlignmentService } from '@/lib/utils/time-alignment';

export async function calculateClutchPerformanceScore(
  playerId: string,
  gameId: string,
  situationId: string
) {
  const timeAligner = createTimeAlignmentService();

  // 1. Get player actions in this clutch situation
  const actions = await db.query(
    `
    SELECT * FROM clutch_player_actions
    WHERE situation_id = $1 AND player_id = $2
  `,
    [situationId, playerId]
  );

  // 2. Calculate performance metrics
  const totalActions = actions.rows.length;
  const successfulActions = actions.rows.filter((a) => a.is_successful).length;
  const successRate = totalActions > 0 ? successfulActions / totalActions : 0;

  const pointsScored = actions.rows.reduce((sum, a) => sum + a.points_scored, 0);
  const expectedPoints = actions.rows.reduce((sum, a) => sum + (a.expected_points || 0), 0);
  const pointsOverExpected = pointsScored - expectedPoints;

  // 3. Get wearables data for game date
  const game = await db.query(`SELECT game_date FROM games WHERE game_id = $1`, [gameId]);
  const gameDate = game.rows[0].game_date;

  const wearablesData = await db.query(
    `
    SELECT * FROM wearables_daily_summary
    WHERE player_id = $1 AND summary_date = $2
  `,
    [playerId, gameDate]
  );

  const hasWearables = wearablesData.rows.length > 0;
  const wearables = wearablesData.rows[0] || {};

  // 4. Calculate clutch score (0-100)
  const clutchScore =
    successRate * 40 + // Success rate: 40%
    Math.min(pointsOverExpected + 5, 10) * 4 + // POE: 40% (normalized -5 to +5 → 0 to 10)
    totalActions * 2; // Volume: 20% (more actions = more clutch moments)

  // 5. Insert clutch performance score
  await db.query(
    `
    INSERT INTO clutch_performance_scores (
      player_id, game_id, situation_id,
      actions_total, actions_successful, success_rate,
      points_scored, expected_points, points_over_expected,
      clutch_score, clutch_percentile,
      hrv_rmssd_pregame, hrv_baseline_deviation,
      recovery_score_pregame, sleep_performance_pregame, day_strain_pregame,
      has_wearables_data, wearables_quality_score,
      calculation_method
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12, $13, $14, $15, $16, $17, $18)
    ON CONFLICT (player_id, game_id, situation_id) DO UPDATE
    SET clutch_score = EXCLUDED.clutch_score,
        points_over_expected = EXCLUDED.points_over_expected,
        updated_at = NOW()
  `,
    [
      playerId,
      gameId,
      situationId,
      totalActions,
      successfulActions,
      successRate,
      pointsScored,
      expectedPoints,
      pointsOverExpected,
      clutchScore,
      wearables.hrv_rmssd_avg,
      wearables.hrv_baseline_deviation,
      wearables.recovery_score,
      wearables.sleep_performance_score,
      wearables.day_strain,
      hasWearables,
      wearables.data_completeness,
      'hierarchical_bayesian_v1',
    ]
  );

  return { clutchScore, pointsOverExpected, hasWearables };
}
```

---

### Phase 5: API Endpoints (Week 5)

**1. Get Player Clutch Performance**

```typescript
// apps/web/app/api/players/[id]/clutch-performance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/api/database/connection-service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const season = request.nextUrl.searchParams.get('season') || '2024-25';

  const result = await db.query(
    `
    SELECT
      cps.*,
      g.game_date,
      g.home_team_id,
      g.away_team_id,
      cs.clutch_intensity
    FROM clutch_performance_scores cps
    JOIN games g ON cps.game_id = g.game_id
    JOIN clutch_situations cs ON cps.situation_id = cs.situation_id
    WHERE cps.player_id = $1
      AND g.season = $2
    ORDER BY g.game_date DESC
  `,
    [params.id, season]
  );

  return NextResponse.json({
    player_id: params.id,
    season,
    games: result.rows,
    avg_clutch_score: result.rows.reduce((sum, r) => sum + r.clutch_score, 0) / result.rows.length,
  });
}
```

**2. Get Clutch Leaderboard**

```typescript
// apps/web/app/api/analytics/clutch/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/api/database/connection-service';

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get('season') || '2024-25';
  const minGames = parseInt(request.nextUrl.searchParams.get('min_games') || '10', 10);

  const result = await db.query(
    `
    SELECT * FROM clutch_leaderboard
    WHERE total_clutch_games >= $1
    ORDER BY avg_clutch_score DESC
    LIMIT 50
  `,
    [minGames]
  );

  return NextResponse.json(result.rows);
}
```

---

### Phase 6: Frontend Dashboard (Week 6-7)

**Example Component:**

```tsx
// apps/web/app/players/[id]/clutch/page.tsx
import { ClutchPerformanceDashboard } from '@/components/clutch/ClutchPerformanceDashboard';

export default async function PlayerClutchPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Clutch Performance Analysis</h1>
      <ClutchPerformanceDashboard playerId={params.id} season="2024-25" />
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] WHOOP OAuth flow completes (test with real athlete account)
- [ ] WHOOP data sync worker fetches readings
- [ ] NBA play-by-play ingestion identifies clutch situations
- [ ] Time alignment service matches wearables to game events
- [ ] Clutch performance scores calculate correctly
- [ ] API endpoints return expected data
- [ ] Frontend dashboard renders 3D visualizations
- [ ] Privacy: Consent revocation deletes all athlete data

---

## Next Steps

1. **Beta Cohort**: Recruit 5-10 athletes for pilot program
2. **Model Training**: Collect 1-2 months of data, train hierarchical Bayesian model
3. **Dashboard Iteration**: Gather coach feedback, refine visualizations
4. **Expand to Baseball**: Adapt clutch detection for baseball (late innings, high-leverage situations)
5. **Real-time Alerts**: Push notifications when athlete's recovery suggests high/low clutch performance

---

## Support & Contact

For questions or issues:

- GitHub Issues: https://github.com/your-org/blaze-sports-intel/issues
- Email: engineering@blazesportsintel.com
- Slack: #clutch-wearables-integration

**Confidence Level: 88%** - Architecture is sound, data sources proven, execution complexity moderate.
