# Integration Guide - Connecting Live Sim to Existing BSI Infrastructure

## Overview

This guide explains how to integrate the live-sim worker with your existing Blaze Sports Intel infrastructure.

## Architecture Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Existing BSI Infrastructure                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  Ingest Worker   │─────▶│  Live Sim Worker │                │
│  │  (existing)      │      │     (new)        │                │
│  └──────────────────┘      └──────────────────┘                │
│         │                            │                          │
│         │                            ▼                          │
│         ▼                     ┌──────────────┐                  │
│  ┌──────────────┐            │   Durable    │                  │
│  │  D1 (main)   │            │   Objects    │                  │
│  │   games      │            └──────────────┘                  │
│  │   events     │                    │                          │
│  └──────────────┘                    ▼                          │
│                              ┌──────────────┐                   │
│                              │  D1 (live)   │                   │
│                              │  game_state  │                   │
│                              │  sim_cache   │                   │
│                              └──────────────┘                   │
│                                     │                            │
│                                     ▼                            │
│                              ┌──────────────┐                   │
│                              │   SSE to     │                   │
│                              │   Clients    │                   │
│                              └──────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Ingest Worker → Live Sim Worker

When your existing ingest worker receives a play-by-play event, forward it to the live-sim worker.

**File**: `workers/ingest/index.ts`

Add this function:

```typescript
/**
 * Forward play event to live-sim worker for win probability calculation
 */
async function forwardToLiveSim(event: any, env: Env): Promise<void> {
  if (!env.LIVE_SIM_URL || !env.LIVE_SIM_SECRET) {
    console.warn('[Ingest] Live sim not configured, skipping');
    return;
  }

  try {
    // Transform to PlayEvent format
    const playEvent = {
      gameId: event.externalId || event.id,
      sport: 'baseball', // or map from event.sport
      timestamp: new Date().toISOString(),
      sequence: event.sequence || 0,

      // Baseball specific
      inning: event.currentInning,
      inningHalf: event.currentInningHalf?.toLowerCase(),
      outs: event.outs || 0,
      baseState: calculateBaseState(event),
      balls: event.balls || 0,
      strikes: event.strikes || 0,

      // Scores
      homeScore: event.homeScore || 0,
      awayScore: event.awayScore || 0,

      // Event details
      eventType: event.eventType || 'unknown',
      description: event.description,

      // Actors
      batterId: event.batterId,
      pitcherId: event.pitcherId,

      // Metadata
      metadata: {
        epa: event.epa,
        winProbShift: event.winProbShift,
        leverageIndex: event.leverageIndex
      }
    };

    // Forward to live-sim worker
    const response = await fetch(`${env.LIVE_SIM_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ingest-Secret': env.LIVE_SIM_SECRET
      },
      body: JSON.stringify(playEvent)
    });

    if (!response.ok) {
      console.error('[Ingest] Live sim forwarding failed:', await response.text());
    } else {
      const result = await response.json();
      console.log('[Ingest] Live sim updated:', result.winProb);
    }
  } catch (error) {
    console.error('[Ingest] Failed to forward to live sim:', error);
    // Don't throw - live sim is optional enhancement
  }
}

/**
 * Calculate base state from event
 * Binary representation: 1st=1, 2nd=2, 3rd=4
 */
function calculateBaseState(event: any): number {
  let state = 0;
  if (event.runnerOn1st || event.baseState?.includes('1st')) state |= 1;
  if (event.runnerOn2nd || event.baseState?.includes('2nd')) state |= 2;
  if (event.runnerOn3rd || event.baseState?.includes('3rd')) state |= 4;
  return state;
}
```

**Usage in your ingest handler**:

```typescript
async function ingestLiveGames(env: Env, ctx: ExecutionContext): Promise<void> {
  // ... existing code to fetch and process games ...

  for (const game of validatedGames) {
    // Existing: upsert to main DB
    await prisma.game.upsert({ /* ... */ });

    // NEW: Forward to live-sim for win probability
    if (game.status === 'LIVE') {
      ctx.waitUntil(forwardToLiveSim(game, env));
    }
  }
}
```

### 2. Environment Variables

Add to `workers/ingest/wrangler.toml`:

```toml
[vars]
LIVE_SIM_URL = "https://blazesports-live-sim.workers.dev"
# Set via: wrangler secret put LIVE_SIM_SECRET
```

Set the secret:

```bash
cd workers/ingest
wrangler secret put LIVE_SIM_SECRET
# Enter the same secret you used for live-sim worker
```

### 3. Web App Integration

**Frontend Component** (`apps/web/components/LiveWinProbability.tsx`):

```typescript
'use client';

import { useEffect, useState } from 'react';

interface WinProbData {
  gameId: string;
  timestamp: string;
  winProb: {
    home: number;
    away: number;
  };
  nextPlay?: Record<string, number>;
  leverageIndex?: number;
}

export default function LiveWinProbability({ gameId }: { gameId: string }) {
  const [data, setData] = useState<WinProbData | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource(
      `https://blazesports-live-sim.workers.dev/live/${gameId}`
    );

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setConnected(false);

      // Fallback to polling
      const interval = setInterval(async () => {
        try {
          const response = await fetch(
            `https://blazesports-live-sim.workers.dev/snapshot/${gameId}`
          );
          const snapshot = await response.json();
          setData(snapshot.simulation);
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 5000);

      return () => clearInterval(interval);
    };

    return () => {
      eventSource.close();
    };
  }, [gameId]);

  if (!data) {
    return <div className="animate-pulse">Loading win probability...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Live Win Probability</h3>
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">Home</div>
          <div className="text-4xl font-bold text-orange-500">
            {(data.winProb.home * 100).toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">Away</div>
          <div className="text-4xl font-bold text-red-500">
            {(data.winProb.away * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {data.leverageIndex && (
        <div className="text-center text-sm text-gray-400">
          Leverage Index: <span className="text-white font-semibold">
            {data.leverageIndex.toFixed(2)}
          </span>
        </div>
      )}

      {data.nextPlay && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-2">Next Play Probabilities</div>
          <div className="space-y-1">
            {Object.entries(data.nextPlay)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([outcome, prob]) => (
                <div key={outcome} className="flex items-center gap-2">
                  <div className="text-xs text-gray-400 w-20 capitalize">
                    {outcome.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                      style={{ width: `${prob * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 w-12 text-right">
                    {(prob * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Usage in game page** (`apps/web/app/baseball/ncaab/games/[gameSlug]/page.tsx`):

```typescript
import LiveWinProbability from '@/components/LiveWinProbability';

export default function GamePage({ params }: { params: { gameSlug: string } }) {
  const gameId = params.gameSlug;

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Existing game info */}
        <div className="lg:col-span-2">
          {/* Box score, play-by-play, etc. */}
        </div>

        {/* NEW: Live win probability sidebar */}
        <div className="lg:col-span-1">
          <LiveWinProbability gameId={gameId} />
        </div>
      </div>
    </div>
  );
}
```

### 4. Embedding the Dashboard

**Option A: iFrame Embed**

```html
<iframe
  src="https://blazesports-live-sim.workers.dev/dashboard.html?gameId=2025-11-01-UTvsAM"
  width="100%"
  height="800"
  frameborder="0"
  style="border-radius: 8px;"
></iframe>
```

**Option B: Direct Integration**

Copy the dashboard HTML/CSS/JS into your Next.js app and customize styling to match your design system.

## Data Flow

### Game Start → Game End

1. **Game starts**: Your ingest worker creates game record in main DB
2. **First event**: Ingest worker forwards to live-sim
3. **Live-sim creates**: Durable Object for game, runs first simulation
4. **Clients connect**: Users visit game page, SSE connection established
5. **Each play**:
   - Ingest receives event → forwards to live-sim
   - Live-sim updates state → runs simulation → broadcasts to SSE clients
   - Clients update UI in real-time
6. **Game ends**: Live-sim marks game final, keeps last state for replays

### Event Transformation

```
Provider Event → Ingest Worker → PlayEvent → Live-Sim Worker
                      ↓
                  Main DB
                (historical)
```

## Player Priors Integration

To improve simulation accuracy, populate player stats:

**Migration script** (`workers/live-sim/migrations/0002_populate_players.sql`):

```sql
-- Sync player stats from main BSI database
-- Run this periodically (daily) to keep priors fresh

INSERT INTO players (
  id, name, team, sport, position,
  batting_avg, obp, slg, xwoba, iso, k_rate, bb_rate,
  era, fip, whip, k_per_9, bb_per_9, stuff_plus,
  vs_lhp_woba, vs_rhp_woba, park_factor,
  updated_at
)
SELECT
  p.external_id,
  p.name,
  t.abbreviation,
  'baseball',
  p.position,

  -- Batting stats (from your existing player_stats table)
  s.batting_avg,
  s.obp,
  s.slg,
  s.xwoba,
  s.iso,
  s.k_rate,
  s.bb_rate,

  -- Pitching stats
  s.era,
  s.fip,
  s.whip,
  s.k_per_9,
  s.bb_per_9,
  s.stuff_plus,

  -- Platoon splits
  s.vs_lhp_woba,
  s.vs_rhp_woba,

  -- Park factor
  COALESCE(v.park_factor, 1.0),

  unixepoch()
FROM your_main_db.players p
JOIN your_main_db.player_stats s ON s.player_id = p.id
JOIN your_main_db.teams t ON t.id = p.team_id
LEFT JOIN your_main_db.venues v ON v.id = t.home_venue_id
WHERE s.season = 2025
ON CONFLICT(id) DO UPDATE SET
  batting_avg = excluded.batting_avg,
  obp = excluded.obp,
  slg = excluded.slg,
  xwoba = excluded.xwoba,
  -- ... update all stats
  updated_at = excluded.updated_at;
```

**Automated sync** (add to your existing cron worker):

```typescript
// In workers/ingest/index.ts
async function syncPlayerPriors(env: Env): Promise<void> {
  console.log('[Ingest] Syncing player priors to live-sim...');

  const players = await prisma.player.findMany({
    where: { sport: 'BASEBALL' },
    include: {
      stats: {
        where: { season: 2025 },
        orderBy: { updatedAt: 'desc' },
        take: 1
      },
      team: true
    }
  });

  // Batch upsert to live-sim DB
  for (const player of players) {
    const stats = player.stats[0];
    if (!stats) continue;

    await env.LIVE_SIM_DB.prepare(`
      INSERT INTO players (
        id, name, team, sport, position,
        batting_avg, obp, slg, xwoba,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        batting_avg = excluded.batting_avg,
        obp = excluded.obp,
        slg = excluded.slg,
        xwoba = excluded.xwoba,
        updated_at = excluded.updated_at
    `).bind(
      player.externalId,
      player.name,
      player.team.abbreviation,
      'baseball',
      player.position,
      stats.battingAvg,
      stats.obp,
      stats.slg,
      stats.xwoba,
      Math.floor(Date.now() / 1000)
    ).run();
  }

  console.log(`[Ingest] Synced ${players.length} player priors`);
}

// Add to scheduled handler
case '0 3 * * *': // Daily 3am - sync player priors
  await syncPlayerPriors(env);
  break;
```

## Testing Integration

**Test the full flow**:

```bash
# 1. Start your existing ingest worker
cd workers/ingest
wrangler dev --port 8787

# 2. Start live-sim worker (different terminal)
cd workers/live-sim
wrangler dev --port 8788

# 3. Open dashboard
open http://localhost:8788/dashboard.html?gameId=test-game

# 4. Simulate ingestion (different terminal)
curl -X POST http://localhost:8787/ingest/live \
  -H "X-Ingest-Secret: $INGEST_SECRET"

# Watch dashboard update in real-time!
```

## Monitoring

**Check integration health**:

```bash
# Ingest worker logs
wrangler tail --name blazesports-ingest

# Live-sim worker logs
wrangler tail --name blazesports-live-sim

# Search for forwarding logs
# [Ingest] Live sim updated: { home: 0.687, away: 0.313 }
```

## Troubleshooting

### Issue: Events not forwarding

**Check**:
1. Environment variables set: `echo $LIVE_SIM_URL`
2. Secret configured: `wrangler secret list`
3. Network connectivity between workers

**Debug**:
```typescript
// Add to forwardToLiveSim
console.log('[Ingest] Forwarding event:', playEvent);
```

### Issue: Win probability not updating

**Check**:
1. SSE connection established (browser DevTools → Network)
2. Game ID matches between ingest and client
3. Events have required fields (inning, outs, scores)

**Debug**:
```bash
# Check game state in D1
wrangler d1 execute live-sim --command \
  "SELECT * FROM game_state WHERE game_id='your-game-id'"
```

### Issue: Simulation too slow

**Optimize**:
1. Reduce sim count for low-leverage: `numSims = 300` instead of `500`
2. Cache player priors in Durable Object memory
3. Use KV for frequently accessed reference data

## Production Checklist

- [ ] Environment variables configured in both workers
- [ ] Secrets set and matching
- [ ] Player priors populated
- [ ] SSE tested with real game
- [ ] Dashboard embedded on game pages
- [ ] Monitoring alerts configured
- [ ] Fallback to polling implemented
- [ ] Custom domain configured (optional)
- [ ] Sponsorship branding applied

## Support

For integration questions:
- **Docs**: See main [README.md](README.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues**: Create issue in repo

---

**Your live win probability system is now integrated with your existing infrastructure! 🔥**
