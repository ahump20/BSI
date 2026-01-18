# MLB Data Lab Integration Architecture

**Date**: November 5, 2025
**Status**: Architecture Design Phase
**Repository**: ahump20/mlb-data-lab
**Target Platform**: blazesportsintel.com (Cloudflare Workers/Pages)

---

## Executive Summary

This document outlines the integration architecture for incorporating the Python-based `mlb-data-lab` library into the blazesportsintel.com platform running on Cloudflare infrastructure. The solution employs a **hybrid architecture** combining static pre-generated assets with real-time API integrations.

---

## Repository Analysis

### mlb-data-lab Capabilities

The mlb-data-lab repository provides:

1. **Data Sources**:
   - MLB Stats API (official MLB data)
   - FanGraphs API (advanced sabermetrics)
   - Statcast via pybaseball (pitch tracking, batted ball data)
   - Chadwick Register (player ID mapping)

2. **Core Features**:
   - Player stat summary sheets (PNG generation)
   - Advanced metrics (wOBA, wRC+, WAR, FIP, xwOBA, etc.)
   - Statcast deep dives (exit velocity, launch angle, spin rate)
   - Team analysis tools
   - Splits analysis (vs RHP/LHP, home/away, situational)
   - Historical comparisons
   - Batch processing

3. **API Clients**:

   ```python
   UnifiedDataClient  # Main facade
   ├── MlbStatsClient      # MLB Stats API wrapper
   ├── FangraphsClient     # FanGraphs advanced stats
   ├── PybaseballClient    # Statcast/pybaseball wrapper
   └── WebClient           # Headshots and logos
   ```

4. **Data Models**:
   - `Player`: Core model with stat loading methods
   - `BaseSheet`: Base class for summary generation
   - `PlayerSummarySheet`: Player-specific sheets (batter/pitcher)
   - `TeamSheets`: Team batting/pitching summaries

5. **Database Schema** (PostgreSQL):
   ```sql
   games              # Game dimension
   players            # Player dimension
   umpires            # Umpire dimension
   plate_appearances  # Statcast fact table (100+ columns)
   ```

---

## Integration Architecture (Hybrid Approach)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    blazesportsintel.com                          │
│                   (Cloudflare Pages/Workers)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐         ┌─────────────────────────┐    │
│  │  Frontend (React)  │────────>│  Cloudflare Workers API │    │
│  │  Player Profiles   │         │  /api/mlb/*             │    │
│  │  Live Stats        │         └──────────┬──────────────┘    │
│  │  Statcast Charts   │                    │                    │
│  └────────────────────┘                    │                    │
│                                             │                    │
│  ┌─────────────────────────────────────────┴─────────────┐     │
│  │         Integration Layer                              │     │
│  │  ┌──────────────────┐  ┌────────────────────────┐    │     │
│  │  │ TypeScript       │  │ Static Assets (R2)     │    │     │
│  │  │ MLB Adapters     │  │ - Player cards (PNG)   │    │     │
│  │  │ - mlb-adapter.ts │  │ - Cached stats (JSON)  │    │     │
│  │  │ - fg-adapter.ts  │  │ - Team logos           │    │     │
│  │  └────────┬─────────┘  └────────┬───────────────┘    │     │
│  │           │                      │                     │     │
│  │           │         ┌────────────┴────────────┐       │     │
│  │           │         │ D1 Database             │       │     │
│  │           │         │ - Cached player stats   │       │     │
│  │           │         │ - Historical data       │       │     │
│  │           │         │ - Team records          │       │     │
│  │           │         └─────────────────────────┘       │     │
│  └───────────┴──────────────────────────────────────────┘     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Scheduled Workers (Cron Triggers)                 │  │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ Daily Stats    │  │ Weekly Card Generation        │   │  │
│  │  │ Refresh        │  │ (calls Python service)        │   │  │
│  │  │ (5am CT)       │  │ (Sundays 2am CT)              │   │  │
│  │  └────────────────┘  └──────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────┬─────────────┘
                   │                               │
                   │                               │
      ┌────────────┴────────────┐     ┌───────────┴────────────┐
      │  External APIs (Direct) │     │  Python Service (Batch)│
      │  - MLB Stats API        │     │  - Railway/Render      │
      │  - FanGraphs API        │     │  - mlb-data-lab        │
      │  - Baseball Savant      │     │  - Summary sheet gen   │
      └─────────────────────────┘     └────────────────────────┘
```

### Component Breakdown

#### 1. **Frontend Layer** (React/Next.js on Cloudflare Pages)

**Files**:

- `/apps/web/app/mlb/players/[playerId]/page.tsx` - Player profile pages
- `/apps/web/app/mlb/leaderboards/page.tsx` - League leaderboards
- `/apps/web/app/mlb/statcast/page.tsx` - Statcast deep dives
- `/public/components/PlayerCard.tsx` - Player card component
- `/public/components/StatcastChart.tsx` - Interactive charts

**Features**:

- Advanced player profile pages with headshots
- Real-time leaderboards (sortable tables)
- Interactive Statcast visualizations (spray charts, pitch break plots)
- Team analysis dashboards
- Player comparison tools

#### 2. **API Layer** (Cloudflare Workers)

**Structure**:

```
/functions/api/mlb/
├── players/
│   ├── [playerId].ts          # GET /api/mlb/players/123456
│   ├── stats.ts                # GET /api/mlb/players/123456/stats
│   ├── splits.ts               # GET /api/mlb/players/123456/splits
│   ├── gamelog.ts              # GET /api/mlb/players/123456/gamelog
│   └── statcast.ts             # GET /api/mlb/players/123456/statcast
├── teams/
│   ├── [teamId].ts             # GET /api/mlb/teams/116
│   ├── roster.ts               # GET /api/mlb/teams/116/roster
│   └── schedule.ts             # GET /api/mlb/teams/116/schedule
├── leaderboards/
│   ├── batting.ts              # GET /api/mlb/leaderboards/batting
│   └── pitching.ts             # GET /api/mlb/leaderboards/pitching
├── standings.ts                # GET /api/mlb/standings
├── scores.ts                   # GET /api/mlb/scores (live games)
└── search.ts                   # GET /api/mlb/search?q=trout
```

**TypeScript Adapters** (port from Python):

```typescript
// lib/adapters/mlb-adapter.ts
export class MlbAdapter {
  static async fetchPlayerInfo(playerId: number): Promise<PlayerInfo>;
  static async fetchPlayerStats(playerId: number, season: number): Promise<PlayerStats>;
  static async fetchPlayerSplits(playerId: number, season: number): Promise<Splits>;
  static async fetchTeamRoster(teamId: number, season: number): Promise<Roster>;
  static async fetchStandings(season: number, leagueId: string): Promise<Standings>;
  static async fetchLiveScores(date?: string): Promise<LiveGames>;
}

// lib/adapters/fangraphs-adapter.ts
export class FangraphsAdapter {
  static async fetchPlayerStats(fgId: number, season: number): Promise<FGStats>;
  static async fetchLeaderboards(
    season: number,
    statType: 'batting' | 'pitching'
  ): Promise<Leaderboard>;
  static async fetchTeamPlayers(teamId: number, season: number): Promise<TeamPlayers>;
}

// lib/adapters/statcast-adapter.ts
export class StatcastAdapter {
  static async fetchBatterData(
    playerId: number,
    startDate: string,
    endDate: string
  ): Promise<StatcastData>;
  static async fetchPitcherData(
    playerId: number,
    startDate: string,
    endDate: string
  ): Promise<StatcastData>;
}
```

#### 3. **Data Storage**

**Cloudflare R2** (Static Assets):

```
blaze-mlb-assets/
├── player-cards/
│   ├── 2024/
│   │   ├── batters/
│   │   │   ├── 682985_riley_greene.png
│   │   │   └── 682998_spencer_torkelson.png
│   │   └── pitchers/
│   │       ├── 669373_tarik_skubal.png
│   │       └── 656427_jack_flaherty.png
│   └── 2025/
├── team-logos/
│   ├── 116_det.svg
│   └── 119_lad.svg
├── player-headshots/
│   ├── 682985.jpg
│   └── 669373.jpg
└── cached-stats/
    ├── leaderboards/
    │   ├── batting_2025.json
    │   └── pitching_2025.json
    └── teams/
        └── 116_roster_2025.json
```

**Cloudflare D1** (SQL Database):

```sql
-- Cached player stats (refreshed daily)
CREATE TABLE player_stats (
  player_id INTEGER PRIMARY KEY,
  season INTEGER NOT NULL,
  stat_type TEXT NOT NULL, -- 'batting' or 'pitching'
  stats_json TEXT NOT NULL, -- JSON blob
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source TEXT NOT NULL -- 'mlb_stats_api', 'fangraphs', 'statcast'
);

-- Team rosters (refreshed daily)
CREATE TABLE team_rosters (
  team_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  roster_json TEXT NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, season)
);

-- Standings cache
CREATE TABLE standings (
  season INTEGER NOT NULL,
  league_id TEXT NOT NULL, -- '103' (AL) or '104' (NL)
  standings_json TEXT NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (season, league_id)
);

-- Player ID mapping (MLB ID <-> FanGraphs ID <-> Baseball Reference ID)
CREATE TABLE player_id_map (
  mlb_id INTEGER PRIMARY KEY,
  fangraphs_id INTEGER,
  bbref_id TEXT,
  player_name TEXT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Cloudflare KV** (Short-term caching):

```
Keys:
- mlb:player:info:{playerId}           # 24-hour TTL
- mlb:player:stats:{playerId}:{season} # 1-hour TTL during season, 24-hour off-season
- mlb:live:scores:{date}                # 30-second TTL
- mlb:standings:{season}:{leagueId}     # 1-hour TTL
- mlb:leaderboard:{season}:{type}       # 1-hour TTL
```

#### 4. **Python Service** (External - for Batch Processing)

**Deployment**: Railway or Render (Python runtime)

**Purpose**: Generate player summary sheets and run heavy analytics

**Endpoints**:

```python
# FastAPI service
@app.post("/api/generate-player-card")
async def generate_player_card(player_id: int, season: int) -> dict:
    """Generate PNG summary sheet for player"""
    # Uses existing mlb-data-lab code
    player = Player(mlb_id=player_id, season=season)
    sheet = PlayerSummarySheet(player, season)
    png_path = sheet.generate()

    # Upload to R2
    r2_url = upload_to_r2(png_path)
    return {"url": r2_url, "player_id": player_id, "season": season}

@app.post("/api/batch-generate-team")
async def batch_generate_team(team_id: int, season: int) -> dict:
    """Generate cards for entire team roster"""
    roster = fetch_team_roster(team_id, season)
    urls = []
    for player in roster:
        card_url = await generate_player_card(player['id'], season)
        urls.append(card_url)
    return {"team_id": team_id, "season": season, "cards": urls}

@app.get("/api/advanced-analytics")
async def advanced_analytics(player_id: int, season: int) -> dict:
    """Complex analytics requiring Python numpy/pandas"""
    # Advanced calculations not practical in Workers
    return {"woba": 0.342, "wrc_plus": 125, "war": 4.2}
```

**Trigger**: Cloudflare Scheduled Workers call this service on cron schedule

#### 5. **Scheduled Workers** (Cron Triggers)

**Daily Stats Refresh** (runs at 5:00 AM CT):

```typescript
// functions/api/cron/daily-stats-refresh.ts
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  // 1. Fetch fresh standings
  const standings = await MlbAdapter.fetchStandings(2025, '103,104');
  await env.D1.prepare('INSERT OR REPLACE INTO standings ...');

  // 2. Update leaderboards
  const battingLeaders = await FangraphsAdapter.fetchLeaderboards(2025, 'batting');
  await storeInR2(env.R2, 'cached-stats/leaderboards/batting_2025.json', battingLeaders);

  // 3. Clear stale KV cache
  await clearStaleKV(env.KV, 'mlb:*');

  // 4. Log to Analytics Engine
  env.ANALYTICS.writeDataPoint({
    blobs: ['daily_stats_refresh_success'],
    doubles: [Date.now()],
    indexes: ['mlb'],
  });
}
```

**Weekly Card Generation** (runs Sundays at 2:00 AM CT):

```typescript
// functions/api/cron/weekly-card-generation.ts
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  // Call Python service to generate cards for active players
  const topPlayers = await getTopPlayers(env.D1, 50); // Top 50 by WAR

  for (const player of topPlayers) {
    const response = await fetch(`${env.PYTHON_SERVICE_URL}/api/generate-player-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.PYTHON_API_KEY}`,
      },
      body: JSON.stringify({ player_id: player.id, season: 2025 }),
    });

    const { url } = await response.json();
    console.log(`Generated card for ${player.name}: ${url}`);
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Set up infrastructure and basic player profiles

**Tasks**:

1. ✅ Clone mlb-data-lab repository
2. Create TypeScript adapters for MLB Stats API
   - Port `MlbStatsClient` key methods to `lib/adapters/mlb-adapter.ts`
   - Implement caching with KV
3. Set up D1 database schema
   - Create `player_stats`, `team_rosters`, `standings`, `player_id_map` tables
4. Create R2 bucket for static assets
   - `blaze-mlb-assets` bucket
5. Implement basic player profile page
   - `/mlb/players/[playerId]` route
   - Display basic stats from MLB Stats API
   - Show player headshot and team logo

**Deliverables**:

- Working player profile pages with real MLB data
- Caching infrastructure operational
- API endpoints for player info and stats

---

### Phase 2: Advanced Stats Integration (Week 2)

**Goal**: Integrate FanGraphs and Statcast data

**Tasks**:

1. Port FanGraphsClient to TypeScript
   - Implement `lib/adapters/fangraphs-adapter.ts`
   - Fetch advanced metrics (wOBA, wRC+, WAR, FIP)
2. Implement Statcast data fetching
   - Direct Baseball Savant API calls
   - Or use pybaseball via Python service
3. Create advanced stats components
   - `PlayerAdvancedStats.tsx` - Display wOBA, wRC+, WAR, FIP, xwOBA
   - `StatcastMetrics.tsx` - Exit velocity, launch angle, barrel rate
4. Deploy Python service for heavy analytics
   - Set up Railway/Render deployment
   - Implement `/api/advanced-analytics` endpoint
5. Create scheduled worker for daily stats refresh

**Deliverables**:

- Player profiles include FanGraphs advanced metrics
- Statcast data integrated
- Python service operational
- Daily stats refresh working

---

### Phase 3: Visualizations & Statcast Deep Dives (Week 3)

**Goal**: Interactive charts and Statcast analysis

**Tasks**:

1. Implement spray charts
   - Canvas-based hit distribution visualization
   - Color-coded by batted ball type (GB, FB, LD)
2. Pitch break plots
   - 2D scatter plot of pitch movement
   - Color-coded by pitch type
3. Velocity distribution charts
   - Histogram of pitch velocities
   - Compare to league average
4. Rolling stats charts
   - Chart.js time series for wOBA, wRC+, etc.
   - 10-game, 30-game, season rolling averages
5. Statcast deep dive pages
   - `/mlb/players/[playerId]/statcast` route
   - Pitch-level data tables
   - Batted ball data tables

**Deliverables**:

- Interactive spray charts
- Pitch break visualizations
- Velocity distributions
- Rolling stats charts
- Statcast deep dive pages

---

### Phase 4: Leaderboards & Team Analysis (Week 4)

**Goal**: League-wide views and team tools

**Tasks**:

1. Implement leaderboards
   - `/mlb/leaderboards/batting` route
   - `/mlb/leaderboards/pitching` route
   - Sortable tables with pagination
   - Color-coded performance indicators (green = elite, red = poor)
2. Team analysis tools
   - `/mlb/teams/[teamId]` route
   - Team roster with stats
   - Team batting/pitching summary
   - Schedule and results
3. Player comparison tool
   - Select 2-4 players to compare
   - Side-by-side stat tables
   - Radar charts for key metrics
4. Historical data
   - Career stats for retired players
   - Historical leaderboards (2015-2024)

**Deliverables**:

- Batting and pitching leaderboards
- Team analysis pages
- Player comparison tool
- Historical data access

---

### Phase 5: Player Cards & Batch Processing (Week 5)

**Goal**: Pre-generated summary sheets

**Tasks**:

1. Set up Python service endpoints
   - `/api/generate-player-card` endpoint
   - `/api/batch-generate-team` endpoint
2. Implement R2 upload from Python service
   - Generate PNG with existing mlb-data-lab code
   - Upload to `blaze-mlb-assets/player-cards/`
3. Create weekly scheduled worker
   - Call Python service for top 50 players
   - Generate and cache player cards
4. Display player cards in profiles
   - Fetch from R2
   - Fallback to live generation if missing
5. Batch processing scripts
   - Generate cards for entire teams
   - Season-end historical summaries

**Deliverables**:

- Python service generating PNG player cards
- R2 storage working
- Weekly scheduled generation
- Player cards displayed in profiles

---

### Phase 6: Mobile App API & Custom Visualizations (Week 6)

**Goal**: Mobile-ready endpoints and custom charts

**Tasks**:

1. Create mobile-optimized API endpoints
   - `/api/v1/mobile/players/[playerId]` - Optimized payload size
   - `/api/v1/mobile/scores` - Live scores
   - `/api/v1/mobile/leaderboards` - Top 20 only
2. Custom visualization library
   - Reusable chart components
   - Baseball diamond overlays
   - Pitch location zones
3. CSV/JSON export functionality
   - Export leaderboards
   - Export player stats
   - Export team rosters
4. Search functionality
   - `/api/mlb/search?q=trout` endpoint
   - Fuzzy player name matching
   - Team name search

**Deliverables**:

- Mobile API endpoints
- Custom chart library
- Export functionality
- Player search

---

## API Endpoint Specifications

### GET /api/mlb/players/{playerId}

**Response**:

```typescript
{
  player: {
    id: 682985,
    name: "Riley Greene",
    team: { id: 116, name: "Detroit Tigers", abbreviation: "DET" },
    position: "OF",
    jerseyNumber: "31",
    bats: "L",
    throws: "R",
    birthDate: "2000-09-28",
    height: "6' 3\"",
    weight: 200,
    headshot: "https://img.mlbstatic.com/mlb-photos/.../682985.jpg",
    teamLogo: "https://www.mlbstatic.com/team-logos/116.svg"
  },
  meta: {
    dataSource: "MLB Stats API",
    lastUpdated: "2025-11-05T18:30:00-06:00",
    season: 2025
  }
}
```

### GET /api/mlb/players/{playerId}/stats?season=2025

**Response**:

```typescript
{
  stats: {
    batting: {
      gamesPlayed: 142,
      atBats: 512,
      runs: 78,
      hits: 156,
      doubles: 32,
      triples: 4,
      homeRuns: 24,
      rbi: 82,
      stolenBases: 12,
      walks: 48,
      strikeouts: 127,
      avg: ".305",
      obp: ".367",
      slg: ".502",
      ops: ".869",
      // Advanced metrics from FanGraphs
      wOBA: ".342",
      wRC_plus: 125,
      WAR: 4.2,
      ISO: ".197",
      BABIP: ".324",
      BB_pct: "8.5%",
      K_pct: "22.4%"
    }
  },
  meta: {
    dataSources: ["MLB Stats API", "FanGraphs"],
    lastUpdated: "2025-11-05T18:30:00-06:00"
  }
}
```

### GET /api/mlb/players/{playerId}/statcast?startDate=2025-04-01&endDate=2025-10-31

**Response**:

```typescript
{
  statcast: {
    batter: {
      pitches: 2847,
      swings: 1523,
      contacts: 1289,
      avgExitVelocity: 89.2,
      maxExitVelocity: 114.3,
      avgLaunchAngle: 12.4,
      barrelRate: "8.2%",
      hardHitRate: "42.1%",
      sweetSpotRate: "38.7%",
      xBA: ".268",
      xwOBA: ".335"
    }
  },
  meta: {
    dataSource: "Baseball Savant",
    lastUpdated: "2025-11-05T18:30:00-06:00"
  }
}
```

---

## Caching Strategy

### Cache Layers

1. **Cloudflare CDN** (Edge):
   - Static assets (player cards, logos): 1 year
   - HTML pages: 5 minutes

2. **KV Namespace** (Short-term):
   - Player info: 24 hours
   - Player stats: 1 hour (during season), 24 hours (off-season)
   - Live scores: 30 seconds
   - Leaderboards: 1 hour

3. **D1 Database** (Medium-term):
   - Cached player stats: Refresh daily
   - Team rosters: Refresh daily
   - Standings: Refresh daily

4. **R2 Storage** (Long-term):
   - Player summary cards: Regenerate weekly
   - Historical data: Permanent

### Cache Invalidation

**Triggers**:

- Scheduled workers (daily 5am CT)
- Manual API call: `POST /api/mlb/cache/invalidate`
- Player transaction (trade, signing): Webhook from MLB

**Stale-While-Revalidate**:

```typescript
// Serve stale content while fetching fresh data in background
const cached = await env.KV.get(cacheKey, 'json');
if (cached) {
  // Return cached immediately
  ctx.waitUntil(
    // Refresh in background
    refreshAndCache(cacheKey, env)
  );
  return ok(cached);
}
```

---

## Performance Targets

| Metric                     | Target      | Measurement                       |
| -------------------------- | ----------- | --------------------------------- |
| Player profile page load   | < 2 seconds | Lighthouse Performance Score > 90 |
| API response time (cached) | < 100ms     | Cloudflare Analytics              |
| API response time (live)   | < 500ms     | Cloudflare Analytics              |
| Player card generation     | < 5 seconds | Python service logs               |
| Statcast query             | < 1 second  | API response time                 |
| Leaderboard render         | < 3 seconds | Frontend performance              |
| Mobile page load (3G)      | < 3 seconds | Lighthouse Mobile                 |

---

## Cost Estimates (Monthly)

| Service                  | Usage                         | Cost           |
| ------------------------ | ----------------------------- | -------------- |
| Cloudflare Workers       | 10M requests                  | $5             |
| Cloudflare D1            | 100M rows read, 1M rows write | $5             |
| Cloudflare R2            | 100GB storage, 10GB egress    | $1             |
| Cloudflare KV            | 10M reads, 100K writes        | $5             |
| Python Service (Railway) | Hobby plan                    | $5             |
| MLB Stats API            | Free                          | $0             |
| FanGraphs API            | Free (rate-limited)           | $0             |
| **Total**                |                               | **~$21/month** |

---

## Security & Compliance

### API Rate Limiting

```typescript
// lib/utils/rate-limit.ts
export async function rateLimit(
  key: string,
  limit: number,
  window: number,
  env: Env
): Promise<{ allowed: boolean; remaining: number }> {
  const current = await env.KV.get(`ratelimit:${key}`);
  const count = current ? parseInt(current) : 0;

  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await env.KV.put(`ratelimit:${key}`, (count + 1).toString(), {
    expirationTtl: window,
  });

  return { allowed: true, remaining: limit - count - 1 };
}
```

**Limits**:

- Player info: 100 requests/minute per IP
- Live scores: 60 requests/minute per IP
- Leaderboards: 30 requests/minute per IP
- Statcast queries: 20 requests/minute per IP

### Data Attribution

**Required Citations**:

- MLB Stats API: "Data provided by MLB Advanced Media"
- FanGraphs: "Advanced metrics via FanGraphs"
- Baseball Savant: "Statcast data courtesy of Baseball Savant"

**Display Format**:

```html
<footer class="data-attribution">
  <p>
    Data Sources:
    <a href="https://www.mlb.com" target="_blank">MLB Stats API</a> •
    <a href="https://www.fangraphs.com" target="_blank">FanGraphs</a> •
    <a href="https://baseballsavant.mlb.com" target="_blank">Baseball Savant</a>
  </p>
  <p>Last Updated: 2025-11-05 6:30 PM CT</p>
</footer>
```

### Privacy

- No personal data collected beyond IP address for rate limiting
- IP addresses hashed before storage
- Analytics aggregated, no individual tracking
- GDPR/CCPA compliant

---

## Monitoring & Observability

### Cloudflare Analytics Engine

**Data Points**:

```typescript
env.ANALYTICS.writeDataPoint({
  blobs: [
    'endpoint_type', // 'player_info', 'leaderboard', etc.
    'cache_status', // 'hit', 'miss'
    'data_source', // 'mlb_api', 'fangraphs', 'statcast'
  ],
  doubles: [
    Date.now(), // Timestamp
    responseTime, // Milliseconds
    payloadSize, // Bytes
  ],
  indexes: ['mlb', playerId.toString()],
});
```

**Dashboards**:

- API request volume by endpoint
- Cache hit rate
- Average response time
- Error rate
- Python service uptime

### Alerting

**Thresholds**:

- Error rate > 5% for 5 minutes → Alert
- Response time > 2 seconds average → Warning
- Cache hit rate < 80% → Warning
- Python service down → Critical Alert

**Notification Channels**:

- Email: austin@blazesportsintel.com
- Slack webhook (if configured)

---

## Future Enhancements

### Phase 7+ (Backlog)

1. **Real-Time Game Updates**:
   - WebSocket connections for live pitch-by-pitch data
   - Animated pitch tracking overlays
   - Live win probability graph

2. **Machine Learning Predictions**:
   - Cloudflare Workers AI integration
   - Player performance predictions
   - Injury risk assessment
   - Trade value estimator

3. **Social Features**:
   - User accounts (Cloudflare Access)
   - Favorite players
   - Custom dashboards
   - Share player comparisons

4. **Mobile App**:
   - React Native app
   - Push notifications for game updates
   - Offline mode with cached data

5. **Video Integration**:
   - MLB Video API integration
   - Pitch-by-pitch video clips
   - Highlight reels

6. **Advanced Analytics**:
   - Expected stats (xBA, xwOBA, xSLG)
   - Park factors
   - Umpire scorecards
   - Defensive run saved (DRS)

---

## Appendix

### Useful URLs

**MLB Stats API**:

- Base: `https://statsapi.mlb.com/api/v1/`
- Player info: `/people/{personId}`
- Player stats: `/people/{personId}/stats`
- Team roster: `/teams/{teamId}/roster`
- Standings: `/standings`
- Live scores: `/schedule`

**FanGraphs**:

- Base: `https://www.fangraphs.com/api/leaders/major-league/data`
- Leaderboards: `?pos=all&stats=bat&lg=all&season=2025`
- Player stats: `?players={fgId}`

**Baseball Savant**:

- Base: `https://baseballsavant.mlb.com/`
- Statcast data: `/statcast_search`

**MLB Static Assets**:

- Player headshots: `https://img.mlbstatic.com/mlb-photos/image/upload/.../people/{playerId}/headshot/67/current`
- Team logos: `https://www.mlbstatic.com/team-logos/team-cap-on-light/{teamId}.svg`

### Key TypeScript Types

```typescript
// lib/types/mlb.ts
export interface PlayerInfo {
  id: number;
  name: string;
  team: Team;
  position: string;
  jerseyNumber: string;
  bats: 'L' | 'R' | 'S';
  throws: 'L' | 'R';
  birthDate: string;
  height: string;
  weight: number;
  headshot: string;
  teamLogo: string;
}

export interface BattingStats {
  gamesPlayed: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  walks: number;
  strikeouts: number;
  avg: string;
  obp: string;
  slg: string;
  ops: string;
  wOBA?: string;
  wRC_plus?: number;
  WAR?: number;
  ISO?: string;
  BABIP?: string;
  BB_pct?: string;
  K_pct?: string;
}

export interface StatcastData {
  pitches: number;
  swings: number;
  contacts: number;
  avgExitVelocity: number;
  maxExitVelocity: number;
  avgLaunchAngle: number;
  barrelRate: string;
  hardHitRate: string;
  sweetSpotRate: string;
  xBA: string;
  xwOBA: string;
}
```

---

**Document Version**: 1.0.0
**Last Updated**: November 5, 2025
**Author**: Claude Code + Austin Humphrey
**Status**: Architecture Design Complete - Ready for Implementation
