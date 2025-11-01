# Quick Start Guide - Live Game Win Probability Simulation

Get up and running in under 10 minutes.

## Prerequisites

- Cloudflare account (free tier works!)
- Node.js 18+ installed
- Wrangler CLI: `npm install -g wrangler`
- Logged in: `wrangler login`

## 1. Automated Setup (Recommended)

```bash
cd workers/live-sim

# Run automated setup script
./scripts/setup.sh
```

This will:
- ✅ Create D1 database
- ✅ Create KV namespace
- ✅ Create R2 bucket (optional)
- ✅ Initialize database schema
- ✅ Update wrangler.toml
- ✅ Set ingestion secret

**Time**: ~3 minutes

## 2. Manual Setup (Alternative)

If you prefer manual setup:

```bash
cd workers/live-sim

# Install dependencies
npm install

# Create resources
wrangler d1 create live-sim
wrangler kv:namespace create CACHE
wrangler kv:namespace create CACHE --preview

# Update wrangler.toml with the IDs from above commands

# Initialize database
npm run db:init

# Set secret
wrangler secret put INGEST_SECRET
# (Use: openssl rand -hex 32)
```

## 3. Test Locally

```bash
# Start dev server
npm run dev
```

In another terminal:

```bash
# Run test game simulation
export WORKER_URL="http://localhost:8788"
./test-data/simulate-game.sh "$WORKER_URL" 3
```

Open dashboard: **http://localhost:8788/dashboard.html?gameId=2025-11-01-UTvsAM**

## 4. Deploy to Production

```bash
# Automated deployment
./scripts/deploy.sh production

# Or manual
npm run deploy
```

Your worker is now live at: `https://blazesports-live-sim.YOUR_SUBDOMAIN.workers.dev`

## 5. Test Production Deployment

```bash
# Health check
curl https://blazesports-live-sim.YOUR_SUBDOMAIN.workers.dev/health

# Run test game (with your worker URL and secret)
export WORKER_URL="https://blazesports-live-sim.YOUR_SUBDOMAIN.workers.dev"
export INGEST_SECRET="your-secret-from-setup"
./test-data/simulate-game.sh "$WORKER_URL" 3
```

## 6. Embed in Your App

### React/Next.js

```bash
# Component is already created at:
# apps/web/components/live-sim/LiveWinProbability.tsx
```

**Usage**:

```tsx
import { LiveWinProbability } from '@/components/live-sim';

export default function GamePage({ gameId }: { gameId: string }) {
  return (
    <div className="container">
      <LiveWinProbability
        gameId={gameId}
        homeTeam="Texas A&M"
        awayTeam="Texas"
        workerUrl="https://blazesports-live-sim.YOUR_SUBDOMAIN.workers.dev"
        showNextPlay={true}
        showChart={true}
      />
    </div>
  );
}
```

### HTML/JavaScript

```html
<iframe
  src="https://blazesports-live-sim.YOUR_SUBDOMAIN.workers.dev/dashboard.html?gameId=2025-11-01-UTvsAM"
  width="100%"
  height="800"
  frameborder="0"
></iframe>
```

## 7. Integrate with Existing Ingest Worker

See [INTEGRATION.md](INTEGRATION.md) for complete integration guide.

**Quick version**:

```typescript
// In your existing ingest worker
async function forwardToLiveSim(event: any, env: Env): Promise<void> {
  const response = await fetch(`${env.LIVE_SIM_URL}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ingest-Secret': env.LIVE_SIM_SECRET
    },
    body: JSON.stringify({
      gameId: event.id,
      sport: 'baseball',
      timestamp: new Date().toISOString(),
      inning: event.currentInning,
      inningHalf: event.currentInningHalf,
      outs: event.outs,
      baseState: calculateBaseState(event),
      homeScore: event.homeScore,
      awayScore: event.awayScore,
      eventType: event.eventType
    })
  });
}
```

## API Quick Reference

### POST /ingest

```bash
curl -X POST $WORKER_URL/ingest \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Secret: $INGEST_SECRET" \
  -d '{
    "gameId": "game-123",
    "sport": "baseball",
    "timestamp": "2025-11-01T20:00:00Z",
    "inning": 7,
    "inningHalf": "bottom",
    "outs": 2,
    "baseState": 5,
    "homeScore": 3,
    "awayScore": 2,
    "eventType": "single"
  }'
```

### GET /live/:gameId (SSE)

```javascript
const es = new EventSource(`${WORKER_URL}/live/game-123`);
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.log('Win Prob:', data.winProb);
};
```

### GET /snapshot/:gameId

```bash
curl $WORKER_URL/snapshot/game-123
```

### GET /health

```bash
curl $WORKER_URL/health
```

## Monitoring

```bash
# Live logs
wrangler tail

# Analytics
wrangler analytics --table bsi_live_sim_analytics
```

## Troubleshooting

### Issue: "Database not found"

```bash
# Re-run database init
npm run db:init
```

### Issue: "Unauthorized" on /ingest

```bash
# Check/reset secret
wrangler secret list
wrangler secret put INGEST_SECRET
```

### Issue: SSE not connecting

Check browser DevTools → Network tab for SSE connection. Falls back to polling automatically.

### Issue: Simulation too slow

Reduce sim count in `src/game-coordinator.ts`:

```typescript
const numSims = leverageIndex > 1.5 ? 1000 : 500; // Lower
```

## What's Next?

1. **Populate player priors** - Add real player stats for better accuracy
2. **Custom branding** - Update dashboard colors/logo
3. **Add sports** - Implement football/basketball engines
4. **Analytics** - Set up monitoring dashboards
5. **Sponsorship** - Add "presented by" branding

## Full Documentation

- [README.md](README.md) - Complete feature documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [INTEGRATION.md](INTEGRATION.md) - Integration with BSI infrastructure
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical deep-dive

## Support

- **Issues**: Create issue in repo
- **Docs**: See README.md
- **Email**: support@blazesportsintel.com

---

**🔥 You're ready to go! Start simulating live games.**
