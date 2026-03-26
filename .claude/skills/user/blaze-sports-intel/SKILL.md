---
name: blaze-sports-intel
description: Fetch and process sports data across MLB, NFL, NBA, NCAA (baseball, football, basketball), Track & Field, and Texas youth baseball via Cloudflare Workers/D1/KV/R2 for mobile-first sports analytics. Equal coverage across all sports—no sport is second-class. Always includes citations with America/Chicago timestamps.
---

# Blaze Sports Intel — Sports Data Engine

This skill powers mobile-first sports data workflows for Blaze Sports Intel. It provides production-ready Cloudflare implementations for fetching, transforming, and serving sports data with proper citations.

## When to Use This Skill

Trigger this skill for any request involving:

- **College baseball** scores, box scores, standings, schedules, previews, or recaps
- **MLB** live games, schedules, player stats, or team data via StatsAPI
- **NFL** scores, schedules, or stats via ESPN API
- **NBA** scores, standings, player stats via ESPN API
- **College football** scores, standings, rankings via ESPN API
- **College basketball** scores, brackets, standings via ESPN API
- **Track & Field** meet results, times, rankings (TFRRS, MileSplit)
- **Texas youth baseball** (Perfect Game, MaxPreps, THSBCA)
- **Cloudflare infrastructure** (Workers, D1, KV, R2) for sports data pipelines
- **API endpoint design** for sports analytics
- **FanGraphs** leaderboard data ingestion or processing

**Do not use for:** Soccer content (absolute prohibition per project scope)

## Core Principles

### Sport Priority Order

1. **Baseball** — College baseball + MLB. College baseball is severely neglected by ESPN despite its importance
2. **Football** — NFL + College football
3. **Basketball** — NBA + College basketball
4. **Track & Field** — High school and college meets
5. **Texas Youth Baseball** — Perfect Game tournaments, MaxPreps, THSBCA

**Equal coverage principle:** No sport is a second-class citizen. Each deserves the same analytical depth and data quality.

### Mobile-First Design

All outputs must be optimized for phone screens:

- Lead with working code
- Brief summaries after code blocks
- Expand details only when needed
- No excessive formatting

### Infrastructure Standards

**Use Cloudflare only:**

- **Workers** for serverless API endpoints
- **KV** for short-lived caches (15-60 seconds)
- **D1** for SQL storage with proper indexes
- **R2** for large file storage (CSV, Parquet)

**Do not suggest:** AWS Lambda, Vercel, PostgreSQL, MongoDB, or other platforms

### Citation Requirements

Every data point must include source attribution:

```typescript
interface DataPoint {
  value: unknown;
  source:
    | 'ESPN college-baseball'
    | 'statsapi.mlb.com'
    | 'FanGraphs'
    | 'ESPN NFL'
    | 'ESPN NBA'
    | 'ESPN college-football'
    | 'ESPN college-basketball'
    | 'Perfect Game'
    | 'MaxPreps'
    | 'TFRRS'
    | 'Baseball-Reference'
    | 'Pro-Football-Reference';
  timestamp: string;    // YYYY-MM-DD format
  timezone: 'America/Chicago';
  note?: string;
}
```

Record the fetch date in `America/Chicago` timezone using ISO date format (YYYY-MM-DD).

## Data Sources

### College Baseball (Primary)

ESPN college baseball scoreboard:
```
https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard
```

Optional date parameter: `?dates=YYYYMMDD`

### MLB

MLB StatsAPI community endpoints:
- Schedule: `/api/v1/schedule`
- Live game: `/api/v1/game/{gamePk}/feed/live`
- Player info: `/api/v1/people/{playerId}`
- Teams: `/api/v1/teams`

Base URL: `https://statsapi.mlb.com`

### NFL

ESPN NFL API:
```
https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings
https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{teamId}
```

For historical data, use Pro Football Reference (respect robots.txt).

### NBA

ESPN NBA API:
```
https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard
https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings
https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{teamId}
```

### College Football

ESPN college football API:
```
https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard
https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings
```

### College Basketball

ESPN college basketball API:
```
https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard
https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/rankings
```

### Texas Youth Baseball

**Perfect Game:**
- Tournament schedules and results
- Player rankings and profiles
- Showcase events

**MaxPreps:**
- High school baseball stats
- Texas regional coverage

**THSBCA (Texas High School Baseball Coaches Association):**
- State rankings
- All-state selections

### Track & Field

**TFRRS (Track & Field Results Reporting System):**
```
https://www.tfrrs.org/
```
- College and high school meet results
- Performance lists and rankings

**MileSplit:**
- High school track coverage
- Texas regional meets

### FanGraphs

Leaderboards support CSV exports. See `references/fangraphs.md` for ingestion workflow.

## Implementation Patterns

### Standard Worker Response

Always wrap responses with citation metadata:

```typescript
const ts = new Date().toLocaleDateString('en-CA', { 
  timeZone: 'America/Chicago' 
});

const response = {
  meta: { 
    source: 'ESPN college-baseball',
    fetched_at: ts,
    timezone: 'America/Chicago' 
  },
  data: rawData
};
```

### KV Caching Pattern

Cache external API responses briefly to reduce latency:

```typescript
const cacheKey = `sport:endpoint:${identifier}`;
const cached = await env.BLAZE_KV.get(cacheKey, 'json');
if (cached) return json(cached, 200, { 'x-cache': 'hit' });

// Fetch fresh data...

await env.BLAZE_KV.put(cacheKey, JSON.stringify(result), { 
  expirationTtl: 30  // 15-60 seconds typical
});
```

### D1 Persistence

Use prepared statements with proper error handling:

```typescript
await env.BLAZE_D1.exec(
  `INSERT INTO table (col1, col2) VALUES (?1, ?2)
   ON CONFLICT(col1) DO UPDATE SET col2=excluded.col2`,
  [value1, value2]
);
```

### Error Handling

Implement exponential backoff for external APIs:

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

## Bundled Resources

### Scripts

Production-ready Workers for common use cases:

- `scripts/cb_scoreboard_worker.ts` — College baseball scoreboard with KV caching
- `scripts/mlb_live_worker.ts` — MLB live game feed with D1 persistence

These scripts can be deployed directly or used as templates.

### References

Detailed documentation loaded as needed:

- `references/schemas.sql` — D1 table definitions and indexes
- `references/fangraphs.md` — FanGraphs CSV ingestion workflow
- `references/data_sources.md` — Complete API endpoint documentation

## Example Usage

**College baseball scoreboard for specific date:**
```
"Show college baseball scores for March 5, 2025 with sources"
```

**MLB live game with caching:**
```
"Fetch MLB game 123456 live feed and cache in KV"
```

**FanGraphs leaderboard ingestion:**
```
"Ingest latest FanGraphs batting leaderboard to R2 with citations"
```

## Output Format

1. **Code first** — Provide working implementation immediately
2. **Citation metadata** — Include source, date, timezone for all data
3. **Brief summary** — TL;DR after code (mobile-friendly)
4. **Minimal formatting** — Avoid excessive bold, headers, or lists unless requested

## Quality Standards

- **No pseudocode** — All code must be production-ready
- **No placeholder values** — Use real endpoints and proper types
- **No unsupported platforms** — Cloudflare infrastructure only
- **No soccer content** — Excluded per project scope
