# Blaze Sports Intel - Skill Package

Production-ready Cloudflare infrastructure for mobile-first sports data analytics with focus on college baseball coverage.

## What This Skill Does

This skill enables Claude to help you build and maintain sports data pipelines using Cloudflare's serverless infrastructure. It provides:

- **Working code templates** for Workers, D1, KV, and R2
- **Citation standards** ensuring all data includes source + timestamp
- **Mobile-first outputs** optimized for phone screens
- **Sport prioritization** with college baseball first, MLB second, NFL third

## Quick Start

### 1. Install the Skill

1. Download `blaze-sports-intel.zip`
2. Go to Claude.ai → Settings → Skills
3. Click "Upload Custom Skill"
4. Select the downloaded zip file

### 2. Trigger the Skill

The skill activates when you mention:

- College baseball scores, box scores, standings
- MLB live games, stats, or schedules
- NFL data via ESPN API
- Cloudflare Workers/D1/KV/R2 for sports data
- FanGraphs leaderboard processing

### 3. Example Queries

**College baseball scoreboard:**
```
Show me college baseball scores for March 15, 2025 with proper citations
```

**MLB live game:**
```
Fetch MLB game 745001 and cache it in KV with D1 persistence
```

**Build a Worker:**
```
Create a Cloudflare Worker to fetch today's college baseball scoreboard
```

**FanGraphs ingestion:**
```
How do I ingest a FanGraphs batting leaderboard CSV to R2?
```

## What's Included

### Scripts (`scripts/`)

Production-ready Cloudflare Workers:

- **cb_scoreboard_worker.ts** — College baseball scoreboard with KV caching
- **mlb_live_worker.ts** — MLB live game feed with D1 persistence

Both include:
- Exponential backoff retry logic
- Proper error handling
- Citation metadata
- Optional D1 persistence

### References (`references/`)

Detailed documentation loaded as needed:

- **schemas.sql** — D1 table definitions with indexes
- **fangraphs.md** — CSV ingestion workflow
- **data_sources.md** — Complete API endpoint documentation

### SKILL.md

Core instructions for Claude on when and how to use the skill.

## Deployment Guide

### Prerequisites

1. Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`
3. Authenticated: `wrangler login`

### Deploy College Baseball Scoreboard Worker

```bash
# Create new Worker project
wrangler init cb-scoreboard

# Copy the worker code
cp scripts/cb_scoreboard_worker.ts cb-scoreboard/src/index.ts

# Create KV namespace
wrangler kv:namespace create BLAZE_KV

# Update wrangler.toml with KV binding
# kv_namespaces = [
#   { binding = "BLAZE_KV", id = "your-namespace-id" }
# ]

# Create D1 database (optional)
wrangler d1 create blaze-sports-intel

# Apply schema
wrangler d1 execute blaze-sports-intel --file=references/schemas.sql

# Update wrangler.toml with D1 binding
# [[d1_databases]]
# binding = "BLAZE_D1"
# database_name = "blaze-sports-intel"
# database_id = "your-database-id"

# Deploy
wrangler deploy
```

### Deploy MLB Live Game Worker

```bash
# Create new Worker project
wrangler init mlb-live

# Copy the worker code
cp scripts/mlb_live_worker.ts mlb-live/src/index.ts

# Use same KV and D1 bindings as above

# Deploy
wrangler deploy
```

### Create R2 Bucket (for FanGraphs data)

```bash
wrangler r2 bucket create blaze-sports-data
```

## Citation Standards

Every data point must include:

```typescript
{
  source: 'ESPN college-baseball' | 'statsapi.mlb.com' | 'FanGraphs' | 'ESPN NFL',
  timestamp: '2025-03-15',  // YYYY-MM-DD in America/Chicago
  timezone: 'America/Chicago'
}
```

Workers automatically add this metadata to all responses.

## Infrastructure Patterns

### KV Caching

```typescript
const cacheKey = `sport:endpoint:${id}`;
const cached = await env.BLAZE_KV.get(cacheKey, 'json');
if (cached) return cached;

// Fetch fresh data...

await env.BLAZE_KV.put(cacheKey, JSON.stringify(data), { 
  expirationTtl: 30  // 15-60 seconds typical
});
```

### D1 Persistence

```typescript
await env.BLAZE_D1.prepare(
  `INSERT INTO table (col1, col2) VALUES (?1, ?2)
   ON CONFLICT(col1) DO UPDATE SET col2=excluded.col2`
)
.bind(value1, value2)
.run();
```

### Error Handling

```typescript
async function fetchWithRetry(url: string, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === tries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * 2 ** i));
    }
  }
}
```

## Sport Priority

1. **College baseball** (primary) — ESPN neglects this badly; we prioritize it
2. **MLB** (secondary) — StatsAPI and FanGraphs
3. **NFL** (third) — ESPN API and Pro Football Reference

**Soccer is excluded** per project requirements.

## Mobile-First Philosophy

All outputs optimized for phone screens:

- Code examples come first
- Brief summaries after code
- Minimal formatting (no excessive bold/headers)
- TL;DR style explanations

## Support

For issues or questions:

1. Check `references/data_sources.md` for API documentation
2. Review `references/schemas.sql` for D1 table structures
3. Examine worker scripts for implementation examples

## Version

Current version: 1.2.0

## License

This skill package is for use with Blaze Sports Intel projects. See project documentation for licensing details.
