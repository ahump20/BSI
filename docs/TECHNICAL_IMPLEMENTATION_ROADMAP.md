# Technical Implementation Roadmap
## Blazesportsintel.com Site Upgrades

**Version**: 1.0
**Date**: 2025-11-06
**Related**: SITE_UPGRADE_PLAN.md

---

## Phase 1 Implementation Details

### 1.1 Multi-Sport Live Game Center

#### Worker Configuration: `workers/live-game-center/`

**File Structure**:
```
workers/live-game-center/
├── wrangler.toml
├── index.ts
├── src/
│   ├── coordinators/
│   │   ├── mlb-coordinator.ts
│   │   ├── nfl-coordinator.ts
│   │   ├── cfb-coordinator.ts
│   │   └── game-coordinator.ts
│   ├── integrations/
│   │   ├── mlb-stats-api.ts
│   │   ├── sportsdata-io.ts
│   │   └── cfb-data.ts
│   ├── simulations/
│   │   ├── monte-carlo.ts
│   │   ├── win-probability.ts
│   │   └── momentum-tracker.ts
│   └── ai/
│       └── live-commentary.ts
└── schema.sql
```

**wrangler.toml**:
```toml
name = "live-game-center"
main = "index.ts"
compatibility_date = "2025-01-01"

# Cron for active game monitoring
[triggers]
crons = ["*/2 * * * *"]  # Every 2 minutes

# KV for caching live data
[[kv_namespaces]]
binding = "LIVE_CACHE"
id = "your-kv-namespace-id"

# D1 for game state
[[d1_databases]]
binding = "GAMES_DB"
database_name = "live-games"
database_id = "your-d1-id"

# R2 for completed games
[[r2_buckets]]
binding = "GAME_ARCHIVES"
bucket_name = "blazesports-live-archives"

# Analytics
[[analytics_engine_datasets]]
binding = "ANALYTICS"

# Secrets (set via: wrangler secret put SECRET_NAME)
# - MLB_API_KEY
# - NFL_API_KEY
# - CFBDATA_API_KEY
# - SPORTSDATAIO_API_KEY
# - ANTHROPIC_API_KEY

[vars]
ENVIRONMENT = "production"
CACHE_TTL_SECONDS = 30
SIMULATION_ITERATIONS = 1000
```

**Key Implementation Files**:

**`index.ts`** (Main handler):
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Routes
    if (url.pathname === '/live/games') {
      return handleLiveGames(env);
    }
    if (url.pathname.startsWith('/live/game/')) {
      const gameId = url.pathname.split('/')[3];
      return handleGameDetail(gameId, env);
    }
    if (url.pathname === '/live/commentary') {
      return handleLiveCommentary(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // Run every 2 minutes to update live games
    await updateLiveGames(env);
  }
};

async function handleLiveGames(env: Env): Promise<Response> {
  // Check cache first
  const cached = await env.LIVE_CACHE.get('live-games', 'json');
  if (cached) {
    return Response.json(cached, {
      headers: { 'Cache-Control': 'public, max-age=30' }
    });
  }

  // Fetch from all sources
  const [mlbGames, nflGames, cfbGames] = await Promise.all([
    fetchMLBLiveGames(env),
    fetchNFLLiveGames(env),
    fetchCFBLiveGames(env)
  ]);

  const allGames = {
    mlb: mlbGames,
    nfl: nflGames,
    cfb: cfbGames,
    updated: new Date().toISOString()
  };

  // Cache for 30 seconds
  await env.LIVE_CACHE.put('live-games', JSON.stringify(allGames), {
    expirationTtl: 30
  });

  return Response.json(allGames);
}
```

**`src/simulations/monte-carlo.ts`**:
```typescript
interface GameState {
  sport: 'mlb' | 'nfl' | 'cfb';
  homeScore: number;
  awayScore: number;
  inning?: number;  // MLB
  quarter?: number; // NFL/CFB
  timeRemaining?: number;
  outs?: number;  // MLB
  runners?: { first?: boolean; second?: boolean; third?: boolean };
  down?: number;  // NFL/CFB
  distance?: number;
  ballPosition?: number;
}

export async function runMonteCarloSimulation(
  gameState: GameState,
  iterations: number = 1000
): Promise<{ homeWinProbability: number; awayWinProbability: number }> {
  let homeWins = 0;

  for (let i = 0; i < iterations; i++) {
    const finalScore = simulateGameCompletion(gameState);
    if (finalScore.home > finalScore.away) {
      homeWins++;
    }
  }

  return {
    homeWinProbability: homeWins / iterations,
    awayWinProbability: (iterations - homeWins) / iterations
  };
}

function simulateGameCompletion(state: GameState): { home: number; away: number } {
  // Sport-specific simulation logic
  switch (state.sport) {
    case 'mlb':
      return simulateMLBCompletion(state);
    case 'nfl':
      return simulateNFLCompletion(state);
    case 'cfb':
      return simulateCFBCompletion(state);
  }
}
```

**Frontend: `apps/web/app/live/page.tsx`**:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

interface LiveGame {
  id: string;
  sport: 'mlb' | 'nfl' | 'cfb';
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  winProbability: { home: number; away: number };
  momentum: number;
}

export default function LiveGameCenter() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      const response = await fetch('/api/live/games');
      const data = await response.json();
      setGames([...data.mlb, ...data.nfl, ...data.cfb]);
      setLoading(false);
    };

    fetchGames();
    const interval = setInterval(fetchGames, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading live games...</div>;

  return (
    <div className="live-game-center">
      <h1>Live Game Center</h1>
      <div className="games-grid">
        {games.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}

function GameCard({ game }: { game: LiveGame }) {
  return (
    <div className="game-card">
      <div className="teams">
        <div className="team">
          <span>{game.awayTeam}</span>
          <span className="score">{game.awayScore}</span>
        </div>
        <div className="team">
          <span>{game.homeTeam}</span>
          <span className="score">{game.homeScore}</span>
        </div>
      </div>
      <div className="status">{game.status}</div>
      <WinProbabilityChart game={game} />
      <MomentumIndicator momentum={game.momentum} />
    </div>
  );
}
```

---

### 1.2 Betting Intelligence Hub

#### Worker Configuration: `workers/betting-intelligence/`

**wrangler.toml**:
```toml
name = "betting-intelligence"
main = "index.ts"
compatibility_date = "2025-01-01"

[triggers]
crons = ["*/2 * * * *"]  # Every 2 minutes during games

[[kv_namespaces]]
binding = "ODDS_CACHE"
id = "your-kv-id"

[[d1_databases]]
binding = "ODDS_DB"
database_name = "betting-odds-history"
database_id = "your-d1-id"

# Secrets:
# - THEODDS_API_KEY
# - ANTHROPIC_API_KEY

[vars]
ENVIRONMENT = "production"
ODDS_CACHE_TTL = 60
```

**`src/theodds-client.ts`**:
```typescript
export class TheOddsAPIClient {
  private apiKey: string;
  private baseURL = 'https://api.the-odds-api.com/v4';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getSportOdds(sport: string): Promise<any> {
    const url = `${this.baseURL}/sports/${sport}/odds`;
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american'
    });

    const response = await fetch(`${url}?${params}`);
    if (!response.ok) {
      throw new Error(`TheOdds API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getGameOdds(sport: string, eventId: string): Promise<any> {
    const url = `${this.baseURL}/sports/${sport}/events/${eventId}/odds`;
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american'
    });

    const response = await fetch(`${url}?${params}`);
    return response.json();
  }
}
```

**`src/value-bet-detector.ts`**:
```typescript
export interface ValueBet {
  gameId: string;
  market: 'h2h' | 'spread' | 'total';
  book: string;
  odds: number;
  fairOdds: number;
  edge: number;  // Percentage edge
  confidence: number;  // 0-1
}

export async function detectValueBets(
  gameOdds: any,
  winProbability: { home: number; away: number }
): Promise<ValueBet[]> {
  const valueBets: ValueBet[] = [];

  // Convert our win probability to fair odds
  const fairHomeOdds = probabilityToAmericanOdds(winProbability.home);
  const fairAwayOdds = probabilityToAmericanOdds(winProbability.away);

  // Check each bookmaker's odds
  for (const bookmaker of gameOdds.bookmakers) {
    for (const market of bookmaker.markets) {
      if (market.key === 'h2h') {
        const homeOdds = market.outcomes.find((o: any) => o.name === gameOdds.home_team)?.price;
        const awayOdds = market.outcomes.find((o: any) => o.name === gameOdds.away_team)?.price;

        // Calculate edge
        const homeEdge = calculateEdge(homeOdds, fairHomeOdds);
        const awayEdge = calculateEdge(awayOdds, fairAwayOdds);

        if (homeEdge > 5) {  // 5% edge threshold
          valueBets.push({
            gameId: gameOdds.id,
            market: 'h2h',
            book: bookmaker.title,
            odds: homeOdds,
            fairOdds: fairHomeOdds,
            edge: homeEdge,
            confidence: calculateConfidence(homeEdge, winProbability.home)
          });
        }
      }
    }
  }

  return valueBets;
}

function probabilityToAmericanOdds(probability: number): number {
  if (probability >= 0.5) {
    return -100 * (probability / (1 - probability));
  } else {
    return 100 * ((1 - probability) / probability);
  }
}

function calculateEdge(bookOdds: number, fairOdds: number): number {
  const bookProb = americanOddsToProbability(bookOdds);
  const fairProb = americanOddsToProbability(fairOdds);
  return ((fairProb - bookProb) / bookProb) * 100;
}

function americanOddsToProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}
```

---

### 1.3 Enhanced WHOOP Biometric Dashboard

#### Database Schema: `prisma/schema.prisma`

```prisma
model WhoopUser {
  id            String   @id @default(cuid())
  playerId      String   @unique
  whoopUserId   String   @unique
  accessToken   String   @db.Text  // Encrypted
  refreshToken  String   @db.Text  // Encrypted
  tokenExpiry   DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  cycles        WhoopCycle[]
  sleeps        WhoopSleep[]
  workouts      WhoopWorkout[]
  recoveries    WhoopRecovery[]

  player        Player   @relation(fields: [playerId], references: [id])
}

model WhoopCycle {
  id            String   @id @default(cuid())
  userId        String
  cycleId       String   @unique
  start         DateTime
  end           DateTime?
  timezone      String
  score         Json     // strain, kilojoules, avgHeartRate, maxHeartRate
  createdAt     DateTime @default(now())

  user          WhoopUser @relation(fields: [userId], references: [id])
  recovery      WhoopRecovery?

  @@index([userId, start])
}

model WhoopRecovery {
  id            String   @id @default(cuid())
  userId        String
  cycleId       String   @unique
  recoveryScore Float    // 0-100
  hrvRmssd      Float    // HRV in milliseconds
  restingHR     Int
  hrVariability Float
  spo2          Float?
  skinTemp      Float?
  recorded      DateTime
  createdAt     DateTime @default(now())

  user          WhoopUser @relation(fields: [userId], references: [id])
  cycle         WhoopCycle @relation(fields: [cycleId], references: [cycleId])

  @@index([userId, recorded])
}

model WhoopSleep {
  id            String   @id @default(cuid())
  userId        String
  sleepId       String   @unique
  start         DateTime
  end           DateTime
  timezone      String
  duration      Int      // minutes
  quality       Float    // 0-100
  efficiency    Float    // 0-100
  stages        Json     // light, deep, rem, awake
  disturbances  Int
  respiratoryRate Float
  createdAt     DateTime @default(now())

  user          WhoopUser @relation(fields: [userId], references: [id])

  @@index([userId, start])
}

model WhoopWorkout {
  id            String   @id @default(cuid())
  userId        String
  workoutId     String   @unique
  start         DateTime
  end           DateTime
  timezone      String
  sport         String
  strain        Float    // 0-21
  avgHeartRate  Int
  maxHeartRate  Int
  kilojoules    Float
  distance      Float?
  altitude      Float?
  createdAt     DateTime @default(now())

  user          WhoopUser @relation(fields: [userId], references: [id])

  @@index([userId, start])
}
```

**API Route: `apps/web/app/api/players/[id]/wearables/timeline/route.ts`**:
```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const playerId = params.id;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch all biometric data for timeline
  const [recoveries, sleeps, workouts] = await Promise.all([
    prisma.whoopRecovery.findMany({
      where: {
        user: { playerId },
        recorded: { gte: startDate }
      },
      orderBy: { recorded: 'asc' },
      include: { cycle: true }
    }),
    prisma.whoopSleep.findMany({
      where: {
        user: { playerId },
        start: { gte: startDate }
      },
      orderBy: { start: 'asc' }
    }),
    prisma.whoopWorkout.findMany({
      where: {
        user: { playerId },
        start: { gte: startDate }
      },
      orderBy: { start: 'asc' }
    })
  ]);

  return Response.json({
    recoveries: recoveries.map(r => ({
      date: r.recorded,
      score: r.recoveryScore,
      hrv: r.hrvRmssd,
      restingHR: r.restingHR,
      strain: r.cycle.score
    })),
    sleeps: sleeps.map(s => ({
      date: s.start,
      duration: s.duration,
      quality: s.quality,
      efficiency: s.efficiency,
      stages: s.stages
    })),
    workouts: workouts.map(w => ({
      date: w.start,
      sport: w.sport,
      strain: w.strain,
      avgHR: w.avgHeartRate,
      maxHR: w.maxHeartRate
    }))
  });
}
```

---

## Environment Setup Checklist

### Development Environment

```bash
# 1. Clone repository
git clone https://github.com/ahump20/BSI.git
cd BSI

# 2. Copy environment template
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Set up local database
docker-compose up -d postgres redis minio

# 5. Run database migrations
npx prisma migrate dev

# 6. Seed database (optional)
npm run db:seed

# 7. Start development servers
npm run dev              # Next.js web app
npm run dev:workers      # All workers in dev mode

# 8. Run workers individually (for debugging)
cd workers/ingest && wrangler dev
cd workers/content && wrangler dev
cd workers/live-sim && wrangler dev
```

### Production Environment Setup

```bash
# 1. Create Cloudflare resources
wrangler kv:namespace create "LIVE_CACHE"
wrangler kv:namespace create "ODDS_CACHE"
wrangler d1 create live-games
wrangler d1 create betting-odds-history
wrangler r2 bucket create blazesports-live-archives

# 2. Set secrets (do NOT commit these!)
wrangler secret put MLB_API_KEY
wrangler secret put NFL_API_KEY
wrangler secret put NBA_API_KEY
wrangler secret put CFBDATA_API_KEY
wrangler secret put THEODDS_API_KEY
wrangler secret put SPORTSDATAIO_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put WHOOP_CLIENT_ID
wrangler secret put WHOOP_CLIENT_SECRET
wrangler secret put WHOOP_WEBHOOK_SECRET
wrangler secret put JWT_SECRET
wrangler secret put SESSION_SECRET
wrangler secret put CSRF_SECRET
wrangler secret put ENCRYPTION_KEY
wrangler secret put API_KEY_SALT

# 3. Deploy workers
wrangler deploy --config workers/live-game-center/wrangler.toml
wrangler deploy --config workers/betting-intelligence/wrangler.toml
# ... deploy all workers

# 4. Deploy web app (Cloudflare Pages)
npm run build
wrangler pages deploy dist

# 5. Run database migrations on production
npx prisma migrate deploy
```

---

## Testing Strategy

### Unit Tests
```bash
# Run all tests
npm test

# Run specific worker tests
npm test -- workers/live-game-center

# Run with coverage
npm test -- --coverage
```

### Integration Tests
```typescript
// tests/integration/live-game-center.test.ts
import { env, createExecutionContext } from 'cloudflare:test';
import worker from '../workers/live-game-center';

describe('Live Game Center Worker', () => {
  it('should return live games', async () => {
    const request = new Request('http://localhost/live/games');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('mlb');
    expect(data).toHaveProperty('nfl');
    expect(data).toHaveProperty('cfb');
  });

  it('should cache responses', async () => {
    const request = new Request('http://localhost/live/games');
    const ctx = createExecutionContext();

    // First request
    const response1 = await worker.fetch(request, env, ctx);
    const data1 = await response1.json();

    // Second request (should be cached)
    const response2 = await worker.fetch(request, env, ctx);
    const data2 = await response2.json();

    expect(data1).toEqual(data2);
  });
});
```

### End-to-End Tests (Playwright)
```typescript
// tests/e2e/live-game-center.spec.ts
import { test, expect } from '@playwright/test';

test('Live Game Center displays games', async ({ page }) => {
  await page.goto('/live');

  // Wait for games to load
  await page.waitForSelector('.game-card');

  // Check that games are displayed
  const gameCards = await page.locator('.game-card').count();
  expect(gameCards).toBeGreaterThan(0);

  // Check win probability chart
  await expect(page.locator('canvas')).toBeVisible();

  // Check momentum indicator
  await expect(page.locator('.momentum-indicator')).toBeVisible();
});

test('Live Game Center updates every 30 seconds', async ({ page }) => {
  await page.goto('/live');
  await page.waitForSelector('.game-card');

  // Get initial score
  const initialScore = await page.locator('.score').first().textContent();

  // Wait 35 seconds
  await page.waitForTimeout(35000);

  // Check if score updated (or timestamp changed)
  const updatedTimestamp = await page.locator('.updated').textContent();
  expect(updatedTimestamp).toBeTruthy();
});
```

---

## Performance Optimization

### Caching Strategy

```typescript
// Multi-level caching
interface CacheStrategy {
  level1: 'Browser Cache';  // 30s for live data
  level2: 'Cloudflare CDN'; // 60s for API responses
  level3: 'KV Store';       // 2min for worker data
  level4: 'PostgreSQL';     // Permanent storage
}

// Example: Aggressive caching for live games
export async function getCachedLiveGames(env: Env): Promise<any> {
  // 1. Check KV cache (fastest)
  const kvCache = await env.LIVE_CACHE.get('live-games', 'json');
  if (kvCache && kvCache.timestamp > Date.now() - 30000) {
    return kvCache;
  }

  // 2. Fetch fresh data
  const freshData = await fetchLiveGamesFromAPIs(env);

  // 3. Update cache
  await env.LIVE_CACHE.put('live-games', JSON.stringify({
    ...freshData,
    timestamp: Date.now()
  }), {
    expirationTtl: 30
  });

  return freshData;
}
```

### Database Query Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_whoop_recovery_user_date ON whoop_recovery(user_id, recorded DESC);
CREATE INDEX idx_whoop_sleep_user_date ON whoop_sleep(user_id, start DESC);
CREATE INDEX idx_games_date_sport ON games(date, sport) WHERE status = 'live';

-- Composite index for game queries
CREATE INDEX idx_games_composite ON games(sport, date, status)
INCLUDE (home_team, away_team, home_score, away_score);
```

### Code Splitting (Next.js)

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const BabylonVisualization = dynamic(
  () => import('@/components/3d/BabylonVisualization'),
  {
    ssr: false,
    loading: () => <div>Loading 3D visualization...</div>
  }
);

const MLPredictionEngine = dynamic(
  () => import('@/components/analytics/MLPredictionEngine'),
  { loading: () => <div>Loading predictions...</div> }
);
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Lighthouse score > 90
- [ ] Security audit completed
- [ ] Load testing completed (100+ concurrent users)
- [ ] Secrets rotated
- [ ] Database backups configured
- [ ] Monitoring alerts configured
- [ ] CDN cache rules configured
- [ ] Rate limiting tested

### Deployment
- [ ] Deploy workers in order (dependencies first)
- [ ] Deploy web app
- [ ] Run database migrations
- [ ] Verify DNS configuration
- [ ] Enable Cloudflare proxy
- [ ] Test all critical paths
- [ ] Monitor error rates

### Post-Deployment
- [ ] Verify all workers are running
- [ ] Check cron schedules
- [ ] Monitor API usage
- [ ] Check error logs (Sentry)
- [ ] Verify analytics (Datadog)
- [ ] Test from multiple locations
- [ ] Document any issues

---

## Monitoring & Observability

### Sentry Configuration

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

function getSampleRate(envVar: string | undefined, fallback: number): number {
  const value = parseFloat(envVar ?? '');
  if (!isNaN(value) && value >= 0 && value <= 1) {
    return value;
  }
  return fallback;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: getSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.2),
  profilesSampleRate: getSampleRate(process.env.SENTRY_PROFILES_SAMPLE_RATE, 0.1),

  beforeSend(event, hint) {
    // Filter out known errors
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null;
    }
    return event;
  },

  integrations: [
    new Sentry.Integrations.Postgres(),
    new Sentry.Integrations.Http({ tracing: true })
  ]
});
```

### Custom Metrics (Datadog)

```typescript
// lib/monitoring/metrics.ts
import { datadogRum } from '@datadog/browser-rum';

export function trackGameLoad(gameId: string, loadTime: number) {
  datadogRum.addAction('game_load', {
    game_id: gameId,
    load_time_ms: loadTime
  });
}

export function trackPredictionAccuracy(gameId: string, predicted: string, actual: string) {
  const correct = predicted === actual;
  datadogRum.addAction('prediction_result', {
    game_id: gameId,
    correct,
    predicted_winner: predicted,
    actual_winner: actual
  });
}

export function trackAPILatency(endpoint: string, latency: number) {
  datadogRum.addAction('api_latency', {
    endpoint,
    latency_ms: latency
  });
}
```

---

## Security Best Practices

### Environment Variable Security

```typescript
// lib/env-validator.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required secrets (minimum length enforcement)
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  POSTGRES_PASSWORD: z.string().min(16),

  // API keys
  ANTHROPIC_API_KEY: z.string().startsWith('sk-'),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  THEODDS_API_KEY: z.string().min(16),

  // Optional keys
  MLB_API_KEY: z.string().optional(),
  NFL_API_KEY: z.string().optional(),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
}
```

### API Rate Limiting

```typescript
// middleware/rate-limit.ts
import { RateLimiter } from '@/lib/rate-limiter';

const limiter = new RateLimiter({
  points: 100, // Number of requests
  duration: 60 // Per 60 seconds
});

export async function rateLimit(req: Request): Promise<Response | null> {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';

  try {
    await limiter.consume(ip);
    return null; // Allow request
  } catch (error) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0'
      }
    });
  }
}
```

---

## Cost Monitoring

### Cloudflare Analytics

```typescript
// Track costs in worker
export async function logAnalytics(env: Env, eventType: string, metadata: any) {
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs: [eventType, metadata.sport, metadata.source],
      doubles: [metadata.latency || 0],
      indexes: [eventType]
    });
  }
}

// Query analytics
// wrangler analytics query --dataset=bsi_analytics --query="SELECT sum(doubles[1]) as total_latency FROM bsi_analytics WHERE timestamp > NOW() - INTERVAL '1 day'"
```

### Budget Alerts

```bash
# Set up Cloudflare budget alerts
# Settings > Billing > Notifications
# Alert at 50%, 75%, 90% of budget
```

---

## Next Steps

1. ✅ Create technical implementation roadmap
2. ⬜ Review with development team
3. ⬜ Set up development environment
4. ⬜ Create GitHub project board with tasks
5. ⬜ Begin Sprint 1: Multi-Sport Live Game Center
6. ⬜ Set up CI/CD pipeline
7. ⬜ Configure production Cloudflare resources
8. ⬜ Deploy monitoring and alerting

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Related Documents**: SITE_UPGRADE_PLAN.md
