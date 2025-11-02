# Usage Examples & Recipes

Complete examples for common use cases of the Live Win Probability system.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [React Integration](#react-integration)
3. [Custom Styling](#custom-styling)
4. [Multiple Games](#multiple-games)
5. [Mobile App](#mobile-app)
6. [Advanced Features](#advanced-features)

---

## Basic Setup

### Example 1: Quick Local Test

```bash
# Clone and setup
cd workers/live-sim

# One-command setup
./scripts/setup.sh

# Start local dev
npm run dev

# In another terminal, simulate a game
./test-data/simulate-game.sh http://localhost:8788 3

# Open dashboard
open http://localhost:8788/dashboard.html?gameId=2025-11-01-UTvsAM
```

### Example 2: Production Deployment

```bash
cd workers/live-sim

# Deploy
./scripts/deploy.sh production

# Get worker URL from output
export WORKER_URL="https://blazesports-live-sim.YOUR_SUBDOMAIN.workers.dev"

# Test health
curl $WORKER_URL/health

# Test with live game
export INGEST_SECRET="your-secret"
./test-data/simulate-game.sh $WORKER_URL 5
```

---

## React Integration

### Example 3: Simple Integration

```tsx
// app/games/[gameId]/page.tsx
import { LiveWinProbability } from '@/components/live-sim';

export default function GamePage({ params }: { params: { gameId: string } }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Live Game</h1>

      <LiveWinProbability
        gameId={params.gameId}
        homeTeam="Texas A&M"
        awayTeam="Texas"
        showNextPlay={true}
        showChart={true}
      />
    </div>
  );
}
```

### Example 4: Custom Styled Component

```tsx
// components/CustomWinProb.tsx
import { LiveWinProbability } from '@/components/live-sim';

export default function CustomWinProb({ gameId, teams }) {
  return (
    <div className="my-custom-container">
      <LiveWinProbability
        gameId={gameId}
        homeTeam={teams.home}
        awayTeam={teams.away}
        workerUrl={process.env.NEXT_PUBLIC_LIVE_SIM_URL}
        showNextPlay={true}
        showChart={true}
        className="shadow-2xl border-4 border-orange-500"
      />
    </div>
  );
}
```

### Example 5: Sidebar Widget

```tsx
// components/GameSidebar.tsx
import { LiveWinProbability } from '@/components/live-sim';

export default function GameSidebar({ gameId }) {
  return (
    <aside className="w-80 space-y-4">
      {/* Win Probability Widget */}
      <LiveWinProbability
        gameId={gameId}
        homeTeam="Home"
        awayTeam="Away"
        showNextPlay={false}  // Compact mode
        showChart={false}
        className="rounded-lg"
      />

      {/* Other sidebar widgets */}
      <div className="bg-slate-800 rounded-lg p-4">
        {/* Player stats, etc. */}
      </div>
    </aside>
  );
}
```

---

## Custom Styling

### Example 6: Brand Colors

```tsx
// components/BrandedWinProb.tsx
'use client';

import { LiveWinProbability } from '@/components/live-sim';

// Custom CSS in globals.css or tailwind config
const customStyles = {
  container: "bg-gradient-to-br from-brand-dark to-brand-darker",
  homeColor: "text-brand-orange",
  awayColor: "text-brand-red",
  accent: "border-brand-gold"
};

export default function BrandedWinProb({ gameId }) {
  return (
    <div className={customStyles.container}>
      <LiveWinProbability
        gameId={gameId}
        // Component automatically inherits parent styles
      />
    </div>
  );
}
```

### Example 7: Dark/Light Theme Support

```tsx
// components/ThemedWinProb.tsx
'use client';

import { LiveWinProbability } from '@/components/live-sim';
import { useTheme } from 'next-themes';

export default function ThemedWinProb({ gameId }) {
  const { theme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'bg-slate-900' : 'bg-white'}>
      <LiveWinProbability
        gameId={gameId}
        className={theme === 'dark' ? 'text-white' : 'text-slate-900'}
      />
    </div>
  );
}
```

---

## Multiple Games

### Example 8: Multi-Game Dashboard

```tsx
// app/live-dashboard/page.tsx
'use client';

import { LiveWinProbability } from '@/components/live-sim';
import { useState, useEffect } from 'react';

export default function LiveDashboard() {
  const [liveGames, setLiveGames] = useState([]);

  useEffect(() => {
    // Fetch live games from your API
    fetch('/api/games/live')
      .then(res => res.json())
      .then(setLiveGames);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Live Games</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveGames.map(game => (
          <LiveWinProbability
            key={game.id}
            gameId={game.id}
            homeTeam={game.homeTeam.name}
            awayTeam={game.awayTeam.name}
            showNextPlay={false}
            showChart={false}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example 9: Featured Game with Multiple Widgets

```tsx
// app/featured/page.tsx
import { LiveWinProbability } from '@/components/live-sim';

export default function FeaturedGame() {
  const gameId = "2025-11-01-BigGame";

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Large win probability */}
          <LiveWinProbability
            gameId={gameId}
            homeTeam="Texas A&M"
            awayTeam="Texas"
            showNextPlay={true}
            showChart={true}
            className="text-lg"
          />

          {/* Play by play */}
          <PlayByPlay gameId={gameId} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Compact win prob */}
          <LiveWinProbability
            gameId={gameId}
            homeTeam="A&M"
            awayTeam="UT"
            showNextPlay={false}
            showChart={false}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Mobile App

### Example 10: React Native Integration

```typescript
// components/MobileWinProb.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MobileWinProb({ gameId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Polling (SSE not well-supported in RN)
    const interval = setInterval(async () => {
      const response = await fetch(
        `https://your-worker.workers.dev/snapshot/${gameId}`
      );
      const snapshot = await response.json();
      setData(snapshot.simulation);
    }, 5000);

    return () => clearInterval(interval);
  }, [gameId]);

  if (!data) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.probContainer}>
        <View style={styles.team}>
          <Text style={styles.teamName}>Home</Text>
          <Text style={styles.prob}>
            {(data.winProb.home * 100).toFixed(1)}%
          </Text>
        </View>
        <View style={styles.team}>
          <Text style={styles.teamName}>Away</Text>
          <Text style={styles.prob}>
            {(data.winProb.away * 100).toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
  },
  probContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  team: {
    alignItems: 'center',
  },
  teamName: {
    color: '#999',
    fontSize: 12,
  },
  prob: {
    color: '#ffa500',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
```

---

## Advanced Features

### Example 11: Event Forwarding from Ingest Worker

```typescript
// workers/ingest/src/live-sim-forwarder.ts
export async function forwardToLiveSim(
  event: GameEvent,
  env: Env
): Promise<void> {
  if (!env.LIVE_SIM_URL || event.status !== 'LIVE') {
    return;
  }

  const playEvent = {
    gameId: event.externalId,
    sport: 'baseball',
    timestamp: new Date().toISOString(),
    sequence: event.playNumber || 0,

    // Baseball state
    inning: event.inning,
    inningHalf: event.inningHalf?.toLowerCase(),
    outs: event.outs,
    baseState: (event.runner1st ? 1 : 0) |
               (event.runner2nd ? 2 : 0) |
               (event.runner3rd ? 4 : 0),
    balls: event.balls,
    strikes: event.strikes,

    // Scores
    homeScore: event.homeScore,
    awayScore: event.awayScore,

    // Event
    eventType: event.playResult,
    description: event.playDescription,
    batterId: event.batterId,
    pitcherId: event.pitcherId,

    metadata: {
      epa: event.expectedPointsAdded,
      winProbShift: event.winProbabilityChange,
      leverageIndex: event.leverageIndex
    }
  };

  try {
    const response = await fetch(`${env.LIVE_SIM_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ingest-Secret': env.LIVE_SIM_SECRET
      },
      body: JSON.stringify(playEvent)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[LiveSim] Updated:', result.winProb);
    }
  } catch (error) {
    console.error('[LiveSim] Forward failed:', error);
  }
}
```

### Example 12: Custom SSE Handler with Reconnection

```typescript
// lib/useWinProbability.ts
import { useEffect, useState } from 'react';

export function useWinProbability(gameId: string, workerUrl: string) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      try {
        eventSource = new EventSource(`${workerUrl}/live/${gameId}`);

        eventSource.onopen = () => {
          setConnected(true);
          setRetryCount(0);
        };

        eventSource.onmessage = (event) => {
          const newData = JSON.parse(event.data);
          setData(newData);
        };

        eventSource.onerror = () => {
          setConnected(false);
          eventSource?.close();

          // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

          reconnectTimeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect();
          }, delay);
        };
      } catch (error) {
        console.error('SSE connection failed:', error);
      }
    }

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [gameId, workerUrl, retryCount]);

  return { data, connected };
}
```

### Example 13: Embedding in iframe with PostMessage

```html
<!-- parent-page.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Embedded Win Probability</title>
</head>
<body>
  <h1>Game Dashboard</h1>

  <!-- Embedded dashboard -->
  <iframe
    id="win-prob-frame"
    src="https://your-worker.workers.dev/dashboard.html?gameId=2025-11-01-Game"
    width="100%"
    height="600"
    frameborder="0"
  ></iframe>

  <script>
    // Listen for updates from iframe
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://your-worker.workers.dev') return;

      const { winProb, gameState } = event.data;
      console.log('Win Probability:', winProb);

      // Update parent page UI
      document.getElementById('external-prob').textContent =
        `Home: ${(winProb.home * 100).toFixed(1)}%`;
    });
  </script>

  <div id="external-prob"></div>
</body>
</html>
```

### Example 14: Webhook Integration

```typescript
// api/webhooks/game-event.ts
export async function POST(request: Request) {
  const event = await request.json();

  // Verify webhook signature
  const signature = request.headers.get('X-Webhook-Signature');
  if (!verifySignature(signature, event)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Forward to live-sim
  await fetch(process.env.LIVE_SIM_URL + '/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ingest-Secret': process.env.LIVE_SIM_SECRET!
    },
    body: JSON.stringify({
      gameId: event.game_id,
      sport: 'baseball',
      timestamp: event.timestamp,
      inning: event.inning,
      inningHalf: event.top_bottom === 'top' ? 'top' : 'bottom',
      outs: event.outs,
      baseState: event.bases,
      homeScore: event.home_score,
      awayScore: event.away_score,
      eventType: event.event_type
    })
  });

  return new Response('OK');
}
```

### Example 15: Analytics Integration

```typescript
// lib/analytics.ts
import { useEffect } from 'react';

export function useWinProbAnalytics(gameId: string, data: any) {
  useEffect(() => {
    if (!data) return;

    // Track dramatic win probability shifts
    const shift = Math.abs(data.winProb.home - 0.5);
    if (shift > 0.3) {  // >30% swing
      analytics.track('Dramatic Win Prob Shift', {
        gameId,
        homeProb: data.winProb.home,
        leverageIndex: data.leverageIndex
      });
    }

    // Track high-leverage moments
    if (data.leverageIndex > 2.0) {
      analytics.track('High Leverage Moment', {
        gameId,
        leverageIndex: data.leverageIndex,
        inning: data.inning
      });
    }
  }, [gameId, data]);
}
```

---

## Testing Recipes

### Example 16: Jest Test for Component

```typescript
// __tests__/LiveWinProbability.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { LiveWinProbability } from '@/components/live-sim';

// Mock EventSource
global.EventSource = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
}));

describe('LiveWinProbability', () => {
  it('renders loading state initially', () => {
    render(<LiveWinProbability gameId="test-game" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays win probabilities when data arrives', async () => {
    render(<LiveWinProbability gameId="test-game" />);

    // Simulate SSE message
    // ...test implementation
  });
});
```

---

## Performance Optimization

### Example 17: Debounced Updates

```typescript
// hooks/useDebouncedWinProb.ts
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

export function useDebouncedWinProb(gameId: string, delay = 1000) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource(`/live/${gameId}`);

    const debouncedUpdate = debounce((newData) => {
      setData(newData);
    }, delay);

    eventSource.onmessage = (event) => {
      debouncedUpdate(JSON.parse(event.data));
    };

    return () => {
      eventSource.close();
      debouncedUpdate.cancel();
    };
  }, [gameId, delay]);

  return data;
}
```

---

## Documentation

For more examples, see:
- [README.md](README.md) - Main documentation
- [INTEGRATION.md](INTEGRATION.md) - Integration patterns
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide

## Support

Questions or need help? Create an issue or email support@blazesportsintel.com
