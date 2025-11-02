# Live Game Win Probability Simulation

> **Transform postgame models into live, in-game simulation—your own "smarter ESPN win-probability" feed.**

Real-time Monte Carlo simulation engine that continuously simulates the rest of the game as new plays happen, streaming updated win odds and player projections to your site/app with near-zero lag.

## What This Does

- **Continuously simulates** the rest of the game (Monte Carlo) as new plays happen
- **Streams updated win odds** and player projections every few seconds
- **Works cheaply at the edge** so fans see updates with near-zero lag
- **Sport-agnostic architecture** starting with baseball, expandable to football/basketball

## Architecture

Built on Cloudflare's edge stack for maximum performance and minimal cost:

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Workers    │───▶│   D1 (SQLite)│◀───│Durable Objects│  │
│  │ (Edge Compute)│    │  Game State  │    │  Per-Game DO  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                        │           │
│         ▼                                        ▼           │
│  ┌──────────────┐                        ┌──────────────┐  │
│  │      KV      │                        │   Analytics  │  │
│  │ (Hot Cache)  │                        │    Engine    │  │
│  └──────────────┘                        └──────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              R2 (Optional)                            │  │
│  │        Reference Data (Park Factors, Priors)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ▲                                        │
         │ PlayEvent                             │ SSE Stream
         │ (webhook/poll)                        ▼
    ┌─────────┐                            ┌──────────┐
    │Official │                            │  Client  │
    │  Feed   │                            │ Dashboard│
    └─────────┘                            └──────────┘
```

### Components

- **Workers (serverless at edge)**: Ingest play-by-play events and run lightweight sim steps
- **D1 (serverless SQLite)**: Store game state, roster/lineup, priors, and recent play history
- **Durable Objects**: Per-game coordinator + hot caches to avoid DB thrash
- **KV**: Hot cache for snapshots and recent simulations
- **R2 (optional)**: Static reference datasets (league schedules, park factors, historical priors)
- **SSE**: Server-Sent Events for low-overhead live updates to clients

## Data Flow

```
1. Ingest    → webhook/poll official feeds → normalize to PlayEvent
2. Update    → write current state to D1 + Durable Object memory
3. Simulate  → run N micro-sims (500–2,000) seeded from current state
4. Aggregate → compute win prob, next-play distributions, player deltas
5. Stream    → push JSON frames over SSE to clients
6. Persist   → snapshot every X plays to D1/KV
```

## Monte Carlo Basics

### Baseball-Specific Implementation

**State representation:**
- `(inning, top/bot, outs, base_state, score_diff)`
- Base state: binary flags (1st=1, 2nd=2, 3rd=4)

**Outcome model:**
- Context-conditioned rates from priors + park factors
- Player priors: rolling xwOBA, Stuff+, platoon splits
- Bayesian updating: nudge priors toward observed performance
- Baserunning: Markov transitions by hit type + runner speed

**Adjustments:**
- Platoon splits (L/R matchup)
- Fatigue proxy (pitch count)
- Park factors (power, contact)
- Leverage index (scale sim count)

## API Endpoints

### POST `/ingest`

Ingest a play-by-play event.

**Headers:**
- `Content-Type: application/json`
- `X-Ingest-Secret: <secret>` (optional, for write protection)

**Request Body:**
```json
{
  "gameId": "2025-11-01-UTvsAM",
  "sport": "baseball",
  "timestamp": "2025-11-01T20:14:33Z",
  "sequence": 142,
  "inning": 7,
  "inningHalf": "bottom",
  "outs": 2,
  "baseState": 5,
  "balls": 2,
  "strikes": 2,
  "homeScore": 3,
  "awayScore": 2,
  "eventType": "single",
  "batterId": "player_123",
  "pitcherId": "player_456",
  "metadata": {
    "epa": 0.42,
    "winProbShift": 8.3
  }
}
```

**Response:**
```json
{
  "success": true,
  "gameId": "2025-11-01-UTvsAM",
  "winProb": {
    "home": 0.687,
    "away": 0.313
  }
}
```

### GET `/live/:gameId`

Subscribe to live SSE stream for a game.

**Headers:**
- `Accept: text/event-stream`

**Response:** Server-Sent Events stream

```
data: {"gameId":"2025-11-01-UTvsAM","timestamp":"2025-11-01T20:14:35Z","winProb":{"home":0.687,"away":0.313},"nextPlay":{"single":0.23,"out":0.68,...},"numSims":1000,"stateHash":"7b2530-2"}

data: {"gameId":"2025-11-01-UTvsAM","timestamp":"2025-11-01T20:15:12Z","winProb":{"home":0.712,"away":0.288},...}
```

### GET `/snapshot/:gameId`

Get current state + simulation snapshot (cached 5s).

**Response:**
```json
{
  "gameState": {
    "gameId": "2025-11-01-UTvsAM",
    "inning": 7,
    "inningHalf": "bottom",
    "outs": 2,
    "baseState": 5,
    "homeScore": 3,
    "awayScore": 2,
    "updatedAt": 1730493275000
  },
  "simulation": {
    "gameId": "2025-11-01-UTvsAM",
    "timestamp": "2025-11-01T20:14:35Z",
    "winProb": {
      "home": 0.687,
      "away": 0.313
    },
    "nextPlay": {
      "single": 0.23,
      "double": 0.05,
      "homeRun": 0.03,
      "strikeout": 0.24,
      "groundOut": 0.28,
      "flyOut": 0.17
    },
    "finalScoreDist": [
      {"homeScore": 4, "awayScore": 2, "probability": 0.32},
      {"homeScore": 3, "awayScore": 2, "probability": 0.28},
      {"homeScore": 5, "awayScore": 2, "probability": 0.18}
    ],
    "numSims": 1000,
    "stateHash": "7b2530-2",
    "leverageIndex": 1.87
  }
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "live-sim-worker",
  "timestamp": "2025-11-01T20:00:00Z",
  "version": "1.0.0"
}
```

## Deployment

### 1. Prerequisites

```bash
npm install -g wrangler
wrangler login
```

### 2. Create Resources

```bash
# D1 Database
wrangler d1 create live-sim
# Copy database_id to wrangler.toml

# KV Namespace
wrangler kv:namespace create CACHE
wrangler kv:namespace create CACHE --preview
# Copy IDs to wrangler.toml

# R2 Bucket (optional)
wrangler r2 bucket create blazesports-live-sim-data
```

### 3. Initialize Database

```bash
cd workers/live-sim
npm install
npm run db:init
```

### 4. Set Secrets

```bash
# Optional: Set ingest secret for write protection
wrangler secret put INGEST_SECRET
# Enter a random secret (e.g., generated with openssl rand -hex 32)
```

### 5. Deploy

```bash
npm run deploy
```

### 6. View Dashboard

Navigate to: `https://blazesports-live-sim.<your-subdomain>.workers.dev/dashboard.html?gameId=your-game-id`

## Local Development

```bash
cd workers/live-sim
npm install
npm run dev
```

Open dashboard at: `http://localhost:8788/dashboard.html?gameId=demo-game`

## Usage Examples

### Ingest Play Event (cURL)

```bash
curl -X POST https://blazesports-live-sim.workers.dev/ingest \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Secret: your-secret" \
  -d '{
    "gameId": "2025-11-01-UTvsAM",
    "sport": "baseball",
    "timestamp": "2025-11-01T20:14:33Z",
    "sequence": 142,
    "inning": 7,
    "inningHalf": "bottom",
    "outs": 2,
    "baseState": 5,
    "homeScore": 3,
    "awayScore": 2,
    "eventType": "single"
  }'
```

### Subscribe to SSE Stream (JavaScript)

```javascript
const gameId = '2025-11-01-UTvsAM';
const eventSource = new EventSource(`https://blazesports-live-sim.workers.dev/live/${gameId}`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Win Probability:', data.winProb);
  console.log('Next Play:', data.nextPlay);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

### Get Snapshot (cURL)

```bash
curl https://blazesports-live-sim.workers.dev/snapshot/2025-11-01-UTvsAM
```

## Performance

- **Latency**: < 50ms p50, < 200ms p99
- **Cost**: ~$0.50 per million requests (Cloudflare Workers pricing)
- **Simulation speed**: 500-2,000 sims in < 30ms (adaptive based on leverage)
- **Concurrency**: Unlimited (edge compute scales automatically)
- **SSE connections**: No limit (Durable Objects handle per-game coordination)

## Roadmap

- [x] Baseball in-game simulation
- [ ] Football in-game simulation (down/distance/field position)
- [ ] Basketball in-game simulation (time/score/possession)
- [ ] Player projections (hits, RBIs, strikeouts, etc.)
- [ ] Advanced metrics (WPA, championship leverage)
- [ ] Historical replay mode
- [ ] Optimal decision prompts ("go for it on 4th?", "pinch-hit?")

## Why This Matters

### Fan Engagement
- **Stickiness**: Live, sport-specific odds keep users on-page
- **Interactivity**: Real-time updates create compelling viewing experience
- **Mobile-first**: Works perfectly on phones with SSE

### Analyst Tools
- **Leverage**: Instant leverage index for strategic decisions
- **Optimal decisions**: Prompts for pinch-hitting, going for it on 4th, etc.
- **What-if scenarios**: Simulate different lineup/strategy choices

### Sponsorship
- **"Win Shift presented by ___"**: Sponsorable unit
- **Branded widgets**: Embeddable win probability charts
- **Premium features**: Advanced metrics behind paywall

## License

MIT

## Support

For questions or issues, please contact [support@blazesportsintel.com](mailto:support@blazesportsintel.com)

---

**Built with ❤️ by Blaze Sports Intel**
