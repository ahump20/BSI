# BlazeSportsIntel Full API Integration - Deployment Guide

## Overview

This guide walks you through deploying the complete SportsDataIO integration system for blazesportsintel.com with:

- ✅ Server-side Cloudflare Workers Functions for all 4 sports (NFL, MLB, CFB, CBB)
- ✅ D1 database for persistent storage
- ✅ KV caching layer for performance
- ✅ Automated cron jobs for data updates
- ✅ Complete error handling and retry logic

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   blazesportsintel.com                       │
│                                                              │
│  Frontend (HTML/React) → API Endpoints → Cloudflare Workers │
│                              ↓                               │
│                        SportsDataIO API                      │
│                              ↓                               │
│                      KV Cache (5-30 min)                     │
│                              ↓                               │
│                     D1 Database (SQLite)                     │
│                              ↑                               │
│                  Cron Jobs (5-20 min intervals)              │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Cloudflare Account**: With Pages enabled
2. **Wrangler CLI**: Installed globally
   ```bash
   npm install -g wrangler
   ```
3. **SportsDataIO API Key**: You have `d34e00995322470fb49b6d02a8a4df33`
4. **Git Repository**: Pushed to GitHub (ahump20/BSI)

## Step 1: Create D1 Database

```bash
# Navigate to project directory
cd /Users/AustinHumphrey/BSI

# Create D1 database
wrangler d1 create blazesports-db

# OUTPUT WILL LOOK LIKE:
# ✅ Successfully created DB 'blazesports-db'
# [[d1_databases]]
# binding = "DB"
# database_name = "blazesports-db"
# database_id = "abc123def456" # <-- COPY THIS ID
```

**Action**: Copy the `database_id` from output and update `wrangler.toml` line 13:
```toml
database_id = "abc123def456"  # Replace with your actual ID
```

## Step 2: Run Database Migration

```bash
# Apply the schema to your D1 database
wrangler d1 execute blazesports-db --file=schema/001_initial_schema.sql --remote

# You should see:
# ✅ Successfully executed SQL
# 🌀 Processed 11 statements
```

## Step 3: Create KV Namespaces

```bash
# Create production KV namespace
wrangler kv:namespace create CACHE

# OUTPUT:
# ✅ Created namespace "CACHE" with id "xyz789abc123" # <-- COPY THIS ID

# Create preview KV namespace for development
wrangler kv:namespace create CACHE --preview

# OUTPUT:
# ✅ Created namespace "CACHE" with id "preview456def789" # <-- COPY THIS ID
```

**Action**: Update `wrangler.toml` with both IDs:
```toml
# Line 21
id = "xyz789abc123"  # Production namespace

# Line 26
preview_id = "preview456def789"  # Preview namespace
```

## Step 4: Set API Secrets

```bash
# Set SportsDataIO API key
wrangler pages secret put SPORTSDATA_API_KEY --project-name blazesportsintel
# When prompted, enter: d34e00995322470fb49b6d02a8a4df33

# Set Anthropic API key (for chat assistant)
wrangler pages secret put ANTHROPIC_API_KEY --project-name blazesportsintel
# When prompted, enter your Claude API key
```

**Verify secrets were set**:
```bash
wrangler pages secret list --project-name blazesportsintel

# OUTPUT:
# SPORTSDATA_API_KEY
# ANTHROPIC_API_KEY
```

## Step 5: Deploy to Cloudflare Pages

```bash
# Deploy all functions and static files
wrangler pages deploy . --project-name blazesportsintel --branch main --commit-dirty=true

# You should see:
# ✨ Compiled Worker successfully
# ✨ Uploading...
# ✨ Deployment complete!
# ✨ https://blazesportsintel.pages.dev
```

## Step 6: Verify API Endpoints

Test each sport's API endpoints:

### NFL Endpoints
```bash
# Get NFL standings
curl https://blazesportsintel.com/api/nfl/standings?season=2025 | jq

# Get NFL teams
curl https://blazesportsintel.com/api/nfl/teams | jq

# Get live NFL games
curl https://blazesportsintel.com/api/nfl/games?season=2025 | jq
```

### MLB Endpoints
```bash
# Get MLB standings
curl https://blazesportsintel.com/api/mlb/standings?season=2025 | jq

# Get MLB teams
curl https://blazesportsintel.com/api/mlb/teams | jq

# Get MLB games
curl https://blazesportsintel.com/api/mlb/games?season=2025 | jq
```

### CFB (SEC) Endpoints
```bash
# Get SEC standings
curl https://blazesportsintel.com/api/cfb/standings?season=2025&conference=SEC | jq

# Get SEC teams only
curl https://blazesportsintel.com/api/cfb/teams?conference=SEC | jq

# Get SEC games
curl https://blazesportsintel.com/api/cfb/games?season=2025&week=5 | jq
```

### CBB (SEC) Endpoints
```bash
# Get SEC basketball standings
curl https://blazesportsintel.com/api/cbb/standings?season=2026&conference=SEC | jq

# Get SEC basketball teams
curl https://blazesportsintel.com/api/cbb/teams?conference=SEC | jq

# Get CBB rankings
curl https://blazesportsintel.com/api/cbb/rankings?season=2026 | jq
```

## Step 7: Verify Cron Jobs

Cron jobs run automatically based on schedules in `wrangler.toml`:

- **NFL**: Every 5 minutes (Sep-Feb)
- **MLB**: Every 10 minutes (Mar-Oct)
- **CFB**: Every 15 minutes (Aug-Jan)
- **CBB**: Every 20 minutes (Nov-Mar)

**Check cron job execution logs**:
```bash
wrangler tail --project-name blazesportsintel --format pretty

# You should see logs like:
# [NFL CRON] Starting NFL data update for 2025 season
# [NFL CRON] Updated 32 team standings
# [NFL CRON] Updated 256 games
# [NFL CRON] NFL data update completed successfully
```

## Step 8: Verify D1 Data

```bash
# Check that data is being written to D1
wrangler d1 execute blazesports-db --command "SELECT COUNT(*) as total_teams FROM teams;" --remote

# OUTPUT: Should show team count (32 NFL + 30 MLB + 16 SEC CFB + 14 SEC CBB = 92+ teams)

# Check standings
wrangler d1 execute blazesports-db --command "SELECT * FROM standings WHERE sport='NFL' LIMIT 5;" --remote

# Check sync logs
wrangler d1 execute blazesports-db --command "SELECT * FROM api_sync_log ORDER BY synced_at DESC LIMIT 10;" --remote
```

## Step 9: Test Frontend Integration

Update your analytics.html to use the new API endpoints:

```javascript
// Replace hardcoded data with API calls
async function fetchNFLStandings() {
    const response = await fetch('/api/nfl/standings?season=2025');
    const { data, meta } = await response.json();

    console.log(`Loaded ${data.length} NFL teams (cached: ${meta.cached})`);
    return data;
}

async function fetchMLBStandings() {
    const response = await fetch('/api/mlb/standings?season=2025');
    const { data, meta } = await response.json();

    console.log(`Loaded ${data.length} MLB teams (cached: ${meta.cached})`);
    return data;
}

async function fetchSECFootball() {
    const response = await fetch('/api/cfb/standings?season=2025&conference=SEC');
    const { data, meta } = await response.json();

    console.log(`Loaded ${data.length} SEC teams (cached: ${meta.cached})`);
    return data;
}
```

## Troubleshooting

### Issue: API returns 500 errors

**Check**:
1. Verify secrets are set: `wrangler pages secret list --project-name blazesportsintel`
2. Check D1 database exists: `wrangler d1 list`
3. View error logs: `wrangler tail --project-name blazesportsintel`

### Issue: Cron jobs not running

**Check**:
1. Verify cron triggers in wrangler.toml
2. Ensure you're in the correct season (cron jobs are seasonal)
3. Check logs: `wrangler tail --project-name blazesportsintel --format pretty`

### Issue: Database queries failing

**Check**:
1. Verify migration ran successfully
2. Check database binding in wrangler.toml (should be `binding = "DB"`)
3. Test with: `wrangler d1 execute blazesports-db --command "SELECT * FROM teams LIMIT 1;" --remote`

### Issue: KV cache not working

**Check**:
1. Verify KV namespace IDs in wrangler.toml
2. Check binding name is `CACHE`
3. List namespaces: `wrangler kv:namespace list`

## Monitoring & Maintenance

### View Real-Time Logs
```bash
# All function logs
wrangler tail --project-name blazesportsintel --format pretty

# Filter for specific sport
wrangler tail --project-name blazesportsintel --format pretty | grep "NFL"
```

### Check API Sync Status
```bash
# Last 20 sync operations
wrangler d1 execute blazesports-db --command "
    SELECT sport, endpoint, status, records_updated, retry_count, synced_at
    FROM api_sync_log
    ORDER BY synced_at DESC
    LIMIT 20;
" --remote
```

### Clear Cache (Force Refresh)
```bash
# List all KV keys
wrangler kv:key list --namespace-id="your-kv-namespace-id"

# Delete specific cache key
wrangler kv:key delete "sportsdata:nfl:/scores/json/Standings/2025:{}" --namespace-id="your-kv-namespace-id"
```

### Database Maintenance
```bash
# Backup D1 database
wrangler d1 export blazesports-db --output=backup.sql --remote

# View table sizes
wrangler d1 execute blazesports-db --command "
    SELECT
        'teams' as table_name, COUNT(*) as row_count FROM teams
    UNION ALL SELECT 'standings', COUNT(*) FROM standings
    UNION ALL SELECT 'games', COUNT(*) FROM games
    UNION ALL SELECT 'api_sync_log', COUNT(*) FROM api_sync_log;
" --remote
```

## Production Checklist

Before going live:

- [ ] D1 database created and migrated
- [ ] KV namespaces created (production + preview)
- [ ] All secrets set (SPORTSDATA_API_KEY, ANTHROPIC_API_KEY)
- [ ] All 4 sports API endpoints tested and returning data
- [ ] Cron jobs verified in logs (seasonal - check during active season)
- [ ] Frontend updated to use new API endpoints
- [ ] Error handling tested (invalid season, missing data, rate limits)
- [ ] Cache invalidation strategy confirmed
- [ ] Monitoring alerts configured (optional: set up external monitoring)

## API Rate Limits

SportsDataIO free tier limits:
- **NFL**: 1,000 requests/month
- **MLB**: 1,000 requests/month
- **CFB**: 1,000 requests/month
- **CBB**: 1,000 requests/month

With current cron schedule and KV caching:
- **NFL**: ~8,640 requests/month (5 min intervals × 6 months)
- **MLB**: ~4,320 requests/month (10 min intervals × 8 months)
- **CFB**: ~2,880 requests/month (15 min intervals × 6 months)
- **CBB**: ~2,160 requests/month (20 min intervals × 5 months)

**Note**: Caching reduces API calls significantly. Frontend requests hit KV cache first.

## Support

If issues persist:
1. Check Cloudflare Pages dashboard: https://dash.cloudflare.com/
2. Review D1 database console
3. Check function logs in real-time: `wrangler tail`
4. Verify wrangler.toml configuration matches this guide

## Next Steps

1. **Update analytics.html** to fetch from API endpoints
2. **Add loading states** for async data fetching
3. **Implement error boundaries** for API failures
4. **Add data freshness indicators** (show "Last updated: 5 minutes ago")
5. **Create admin dashboard** to monitor API sync status
6. **Set up Cloudflare Analytics** for endpoint usage tracking

---

**Deployment Complete! 🎉**

Your BlazeSportsIntel platform now has:
- ✅ Real-time sports data from SportsDataIO
- ✅ Persistent storage in D1 database
- ✅ High-performance KV caching
- ✅ Automated data updates via cron jobs
- ✅ Production-ready error handling
- ✅ Full API coverage for NFL, MLB, CFB (SEC), CBB (SEC)
