# BSI College Baseball Runbook

> Last updated: 2025-01-09

## Quick Reference

| Worker          | Purpose        | Port | Deploy                   |
| --------------- | -------------- | ---- | ------------------------ |
| bsi-cbb-gateway | Public API     | 8791 | `npm run deploy:gateway` |
| bsi-cbb-sync    | Data ingestion | 8792 | `npm run deploy:sync`    |

---

## Deployment

### First-Time Setup

```bash
cd workers/bsi-cbb

# Install dependencies
npm install

# Run D1 migration
wrangler d1 execute bsi-game-db --file=../../migrations/007_cbb_entity_sources_and_stats.sql

# Set secrets
wrangler secret put BSI_SYNC_TOKEN --config sync/wrangler.toml
wrangler secret put HIGHLIGHTLY_API_KEY --config sync/wrangler.toml

# Deploy both workers
npm run deploy
```

### Updating Workers

```bash
cd workers/bsi-cbb

# Deploy gateway only
npm run deploy:gateway

# Deploy sync only
npm run deploy:sync

# Deploy both
npm run deploy
```

### Local Development

```bash
# Gateway (port 8791)
npm run dev:gateway

# Sync (port 8792)
npm run dev:sync
```

---

## API Endpoints

### Gateway (bsi-cbb-gateway)

| Endpoint            | Method | Description                 |
| ------------------- | ------ | --------------------------- |
| `/cbb/health`       | GET    | Health check                |
| `/cbb/scores/live`  | GET    | Live game scores            |
| `/cbb/scores/:date` | GET    | Scores by date (YYYY-MM-DD) |
| `/cbb/standings`    | GET    | Conference standings        |
| `/cbb/teams`        | GET    | All teams                   |
| `/cbb/teams/:id`    | GET    | Team by ID                  |
| `/cbb/players`      | GET    | Search players              |
| `/cbb/players/:id`  | GET    | Player by ID                |
| `/cbb/games/:id`    | GET    | Game details                |
| `/cbb/nil/deals`    | GET    | NIL deals                   |
| `/cbb/nil/market`   | GET    | NIL market overview         |

### Sync (bsi-cbb-sync)

| Endpoint        | Method | Auth                  | Description         |
| --------------- | ------ | --------------------- | ------------------- |
| `/sync/trigger` | POST   | Bearer BSI_SYNC_TOKEN | Manual sync trigger |
| `/sync/nil`     | POST   | Bearer BSI_SYNC_TOKEN | Import NIL deals    |

---

## Monitoring

### Check Sync Status

```bash
# Query last sync times
wrangler d1 execute bsi-game-db --command "SELECT source, entity_type, started_at, status FROM cbb_sync_log ORDER BY started_at DESC LIMIT 10;"

# Check sync errors
wrangler d1 execute bsi-game-db --command "SELECT * FROM cbb_sync_log WHERE status = 'failed' ORDER BY started_at DESC LIMIT 5;"
```

### Check KV Rate Limits

```bash
# List recent rate limit keys
wrangler kv:key list --namespace-id=a53c3726fc3044be82e79d2d1e371d26 --prefix="ratelimit:"
```

### View Worker Logs

```bash
# Gateway logs
wrangler tail bsi-cbb-gateway

# Sync logs
wrangler tail bsi-cbb-sync
```

---

## Troubleshooting

### "NCAA API rate limited"

**Cause:** Exceeded 60 requests/minute to NCAA API.

**Fix:**

1. Wait 1 minute for rate limit window to reset
2. Check if cron jobs are overlapping
3. Reduce sync frequency if persistent

### "Highlightly API error: 429"

**Cause:** Exceeded RapidAPI rate limit (30/min).

**Fix:**

1. Check RapidAPI dashboard for quota usage
2. Upgrade RapidAPI plan if needed
3. Reduce sync frequency

### "Entity not found"

**Cause:** Source ID not mapped to internal ID.

**Fix:**

```sql
-- Check if entity exists in source mapping
SELECT * FROM entity_sources
WHERE source = 'ncaa' AND source_id = '<external_id>';

-- If missing, trigger full sync to rebuild mappings
```

### "Stale data being served"

**Cause:** API failures with stale fallback.

**Fix:**

1. Check API health via `/cbb/health`
2. Review sync logs for errors
3. Manually trigger sync: `POST /sync/trigger`

### Schema Migration Failed

**Fix:**

```bash
# Check current migration state
wrangler d1 execute bsi-game-db --command "SELECT * FROM d1_migrations;"

# Re-run migration if needed
wrangler d1 execute bsi-game-db --file=migrations/007_cbb_entity_sources_and_stats.sql
```

---

## Manual Operations

### Force Full Sync

```bash
curl -X POST https://api.blazesportsintel.com/sync/cbb/trigger \
  -H "Authorization: Bearer $BSI_SYNC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sources": ["ncaa", "highlightly"], "force": true}'
```

### Import NIL Data

```bash
curl -X POST https://api.blazesportsintel.com/sync/cbb/nil \
  -H "Authorization: Bearer $BSI_SYNC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "playerName": "Player Name",
      "teamName": "Team Name",
      "brandName": "Brand",
      "dealType": "endorsement",
      "dealValueTier": "50k_100k",
      "source": "manual"
    }
  ]'
```

### Clear KV Cache

```bash
# Clear all cached data (use sparingly)
wrangler kv:key list --namespace-id=a53c3726fc3044be82e79d2d1e371d26 --prefix="ncaa:" \
  | jq -r '.[].name' \
  | xargs -I {} wrangler kv:key delete --namespace-id=a53c3726fc3044be82e79d2d1e371d26 {}
```

---

## Cron Schedule

| Cron Expression | Description                       |
| --------------- | --------------------------------- |
| `*/5 * * 2-6 *` | Live scores every 5 min (Feb-Jun) |
| `0 */6 * * *`   | Teams/standings every 6 hours     |
| `0 3 * * *`     | Full refresh daily at 3am CST     |

**Season Gating:**

- Months 2-6 (February-June) are college baseball season
- Live score sync only runs during season
- Override with `ENABLE_OFFSEASON_SYNC=true` env var

---

## Database Schema

### Key Tables

```sql
-- Teams
college_baseball_teams (id, name, mascot, conference, ...)

-- Players
college_baseball_players (id, team_id, name, position, ...)

-- Games
college_baseball_games (id, home_team_id, away_team_id, date, status, ...)

-- Entity mapping (CRITICAL)
entity_sources (entity_type, entity_id, source, source_id, ...)

-- NIL deals
nil_deals (id, player_id, brand_name, deal_value_tier, ...)

-- Sync log
cbb_sync_log (worker, source, entity_type, status, records_*, ...)
```

---

## Contacts

- **Owner:** Austin Humphrey (austin@blazesportsintel.com)
- **Cloudflare Account:** a12cb329d84130460eed99b816e4d0d3
- **D1 Database:** bsi-game-db (88eb676f-af0f-470c-a46a-b9429f5b51f3)
- **KV Namespace:** a53c3726fc3044be82e79d2d1e371d26
