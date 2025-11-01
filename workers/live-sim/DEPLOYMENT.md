# Deployment Guide - Live Game Win Probability Simulation

Complete step-by-step deployment guide for production and development environments.

## Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **Node.js** 18+ and npm installed
3. **Wrangler CLI** installed globally:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

## Initial Setup (One-Time)

### 1. Create D1 Database

```bash
cd workers/live-sim

# Create production database
wrangler d1 create live-sim

# Output will show database ID:
# ✅ Successfully created DB 'live-sim'!
# database_id = "abc123..."

# Copy the database_id and update wrangler.toml
```

Edit `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "live-sim"
database_id = "abc123..."  # ← Paste your database ID here
```

### 2. Create KV Namespace

```bash
# Create production KV namespace
wrangler kv:namespace create CACHE
# Output: id = "xyz789..."

# Create preview KV namespace (for development)
wrangler kv:namespace create CACHE --preview
# Output: preview_id = "xyz789preview..."
```

Update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "xyz789..."              # ← Production ID
preview_id = "xyz789preview..." # ← Preview ID
```

### 3. Create R2 Bucket (Optional)

If you want to store reference data like park factors:

```bash
wrangler r2 bucket create blazesports-live-sim-data
```

This is already configured in `wrangler.toml`.

### 4. Initialize Database Schema

```bash
# Run migration
npm run db:init

# Verify tables were created
wrangler d1 execute live-sim --command "SELECT name FROM sqlite_master WHERE type='table'"

# Expected output:
# games
# game_state
# players
# events
# sim_cache
```

### 5. Set Secrets

```bash
# Generate a random secret (or use your own)
export INGEST_SECRET=$(openssl rand -hex 32)

# Set the secret in Cloudflare
wrangler secret put INGEST_SECRET
# When prompted, paste the value of $INGEST_SECRET
```

**Important**: Save this secret somewhere secure! You'll need it to authenticate ingestion requests.

## Deployment

### Production Deployment

```bash
cd workers/live-sim

# Install dependencies
npm install

# Deploy to production
npm run deploy

# Output:
# ✨ Built successfully!
# 🚀 Deployed to https://blazesports-live-sim.<your-subdomain>.workers.dev
```

Your worker is now live! Note the URL for later.

### Custom Domain (Optional)

To use a custom domain like `live.blazesportsintel.com`:

1. Add the domain to your Cloudflare zone
2. Update `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "live.blazesportsintel.com/*", zone_name = "blazesportsintel.com" }
   ]
   ```
3. Deploy again:
   ```bash
   npm run deploy
   ```

## Verification

### 1. Health Check

```bash
WORKER_URL="https://blazesports-live-sim.<your-subdomain>.workers.dev"

curl "$WORKER_URL/health"

# Expected:
# {"status":"ok","service":"live-sim-worker","timestamp":"2025-11-01T20:00:00Z","version":"1.0.0"}
```

### 2. Test Ingestion

```bash
# Create a test event
curl -X POST "$WORKER_URL/ingest" \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Secret: $INGEST_SECRET" \
  -d '{
    "gameId": "test-game-001",
    "sport": "baseball",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "sequence": 1,
    "inning": 1,
    "inningHalf": "top",
    "outs": 0,
    "baseState": 0,
    "homeScore": 0,
    "awayScore": 0,
    "eventType": "strikeout"
  }'

# Expected:
# {"success":true,"gameId":"test-game-001","winProb":{"home":0.5,"away":0.5}}
```

### 3. View Dashboard

Open in your browser:
```
https://blazesports-live-sim.<your-subdomain>.workers.dev/dashboard.html?gameId=test-game-001
```

You should see the live dashboard with initial win probabilities.

### 4. Test SSE Stream

```bash
# Subscribe to SSE stream (keeps connection open)
curl -N -H "Accept: text/event-stream" "$WORKER_URL/live/test-game-001"

# You should see SSE events streaming
```

Press Ctrl+C to stop.

### 5. Run Full Game Simulation

Use the test script to simulate a full game:

```bash
cd workers/live-sim

# Export your worker URL and secret
export WORKER_URL="https://blazesports-live-sim.<your-subdomain>.workers.dev"
export INGEST_SECRET="your-secret-here"

# Run simulation (3 second delay between events)
./test-data/simulate-game.sh "$WORKER_URL" 3

# Open dashboard to watch live updates:
# https://blazesports-live-sim.<your-subdomain>.workers.dev/dashboard.html?gameId=2025-11-01-UTvsAM
```

## Development Environment

### Local Development

```bash
cd workers/live-sim

# Start dev server
npm run dev

# Output:
# ⎔ Starting local server...
# ⎔ Listening on http://localhost:8788
```

Open dashboard at: `http://localhost:8788/dashboard.html?gameId=test`

Test ingestion locally:
```bash
curl -X POST http://localhost:8788/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "local-test",
    "sport": "baseball",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "sequence": 1,
    "inning": 1,
    "inningHalf": "top",
    "outs": 0,
    "baseState": 0,
    "homeScore": 0,
    "awayScore": 0,
    "eventType": "single"
  }'
```

### Live Logs

To tail production logs:

```bash
wrangler tail
```

This shows real-time logs from your production worker.

## Monitoring & Analytics

### View Analytics

```bash
# View analytics data
wrangler analytics --table bsi_live_sim_analytics

# Filter by time range
wrangler analytics --table bsi_live_sim_analytics --since 1h
```

### Common Metrics

- **Ingestion rate**: Number of events per second
- **SSE connections**: Number of active live streams
- **Simulation latency**: Time to compute Monte Carlo sims
- **Error rate**: Failed requests

### Setting Up Alerts (Optional)

In Cloudflare Dashboard:
1. Go to Workers → live-sim → Metrics
2. Set up alerts for:
   - Error rate > 5%
   - CPU time > 40ms p99
   - Request rate spikes

## Database Maintenance

### View Game State

```bash
# List all active games
wrangler d1 execute live-sim --command "SELECT * FROM games WHERE status='live'"

# View game state
wrangler d1 execute live-sim --command "SELECT * FROM game_state WHERE game_id='2025-11-01-UTvsAM'"

# View recent events
wrangler d1 execute live-sim --command "SELECT * FROM events WHERE game_id='2025-11-01-UTvsAM' ORDER BY sequence DESC LIMIT 10"
```

### Clean Up Old Data

```bash
# Delete simulation cache older than 24 hours
wrangler d1 execute live-sim --command "DELETE FROM sim_cache WHERE computed_at < unixepoch() - 86400"

# Archive completed games
wrangler d1 execute live-sim --command "UPDATE games SET status='final' WHERE status='live' AND updated_at < unixepoch() - 14400"
```

## Troubleshooting

### Issue: "Database not found"

**Solution**: Make sure you ran the database initialization:
```bash
npm run db:init
```

### Issue: "Unauthorized" on /ingest

**Solution**: Check that you're sending the correct secret:
```bash
# Verify secret is set
wrangler secret list

# Update if needed
wrangler secret put INGEST_SECRET
```

### Issue: SSE stream disconnects immediately

**Solution**: Check browser compatibility. SSE is supported in all modern browsers except IE. For fallback, implement polling:
```javascript
// Fallback to snapshot polling
setInterval(async () => {
  const response = await fetch(`/snapshot/${gameId}`);
  const data = await response.json();
  updateDashboard(data.simulation);
}, 5000);
```

### Issue: High CPU time

**Solution**: Reduce simulation count for low-leverage situations. Edit `src/game-coordinator.ts`:
```typescript
const numSims = leverageIndex > 1.5 ? 2000 : leverageIndex > 1.0 ? 1000 : 300; // Lower baseline
```

### Issue: D1 rate limits

**Solution**: The Durable Object already batches writes every 2 seconds. If you still hit limits, increase the batch interval in `src/game-coordinator.ts`:
```typescript
this.flushTimer = setTimeout(() => {
  this.flushToD1();
}, 5000); // Increase from 2s to 5s
```

## Production Checklist

Before going live with real games:

- [ ] Database initialized and tested
- [ ] KV namespace created and configured
- [ ] Secrets set (INGEST_SECRET)
- [ ] Custom domain configured (optional)
- [ ] Analytics dashboard reviewed
- [ ] Alerts configured
- [ ] Load testing completed (simulate 100+ concurrent SSE connections)
- [ ] Documentation shared with team
- [ ] Ingest webhook configured with official data provider
- [ ] Dashboard embedded on main site
- [ ] Sponsorship/branding applied

## Next Steps

1. **Integrate with official feed**: Set up webhook from SportsDataIO, NCAA API, or ESPN
2. **Add player priors**: Populate `players` table with rolling stats
3. **Customize branding**: Update dashboard colors/logo in `public/dashboard.html`
4. **Enable sponsorship**: Add "presented by" branding
5. **Expand sports**: Add football/basketball simulation engines

## Support

For issues or questions:
- **Documentation**: See [README.md](README.md)
- **Issues**: Create issue in repo
- **Email**: support@blazesportsintel.com

---

**Happy simulating! 🔥⚾**
