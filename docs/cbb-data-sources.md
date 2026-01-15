# BSI College Baseball Data Sources

> Last updated: 2025-01-09

## Overview

The BSI College Baseball data layer ingests data from two primary sources, with manual NIL imports as a tertiary source. All data flows through the `bsi-cbb-sync` worker and is served via the `bsi-cbb-gateway` API.

---

## Primary Sources

### 1. NCAA API (henrygd/ncaa-api)

**Base URL:** `https://ncaa-api.henrygd.me`

**Endpoints Used:**
- `/scoreboard/baseball/{yyyy}/{mm}/{dd}` — Daily scoreboard with live scores
- `/game/baseball/{gameId}` — Individual game details with box scores

**Data Provided:**
- Game schedules and live scores
- Team records (overall, conference)
- Venue information
- Competition status (in_progress, final, postponed, etc.)
- Linescore data (inning-by-inning)

**Rate Limits:**
- 60 requests/minute (self-imposed)
- KV key format: `ratelimit:ncaa:YYYYMMDDHHmm`

**Caching:**
- Scoreboard: 60s TTL (fresh), 600s stale fallback
- Completed games: 24h TTL
- In-progress games: 5m TTL

**ID Mapping:**
- NCAA game/team IDs stored in `entity_sources` table
- Entity type: `team`, `game`
- Source: `ncaa`

---

### 2. Highlightly Baseball API (RapidAPI)

**Base URL:** `https://baseball.highlightly.net/baseball`

**Required Header:**
```
X-RapidAPI-Key: {HIGHLIGHTLY_API_KEY}
X-RapidAPI-Host: baseball.highlightly.net
```

**Endpoints Used:**
- `/teams` — All teams in NCAA baseball
- `/tournament/{id}/teams` — Teams by tournament/conference
- `/team/{id}` — Team details
- `/team/{id}/players` — Team roster
- `/matches/live` — Live matches
- `/matches/date/{yyyy-mm-dd}` — Matches by date
- `/match/{id}` — Match details with scores
- `/tournament/{id}/standings` — Conference standings
- `/player/{id}` — Player details
- `/player/{id}/statistics` — Player season stats

**Data Provided:**
- Team metadata (colors, logos, abbreviations)
- Player rosters with physical attributes
- Player statistics (batting, pitching)
- Conference standings with win percentages
- Match details with inning-by-inning scores

**Rate Limits:**
- 30 requests/minute (RapidAPI basic tier)
- KV key format: `ratelimit:highlightly:YYYYMMDDHHmm`

**Caching:**
- Teams: 24h TTL
- Players: 12h TTL
- Live matches: 60s TTL
- Historical matches: 24h TTL (finished games)
- Standings: 1h TTL

**ID Mapping:**
- Highlightly IDs stored in `entity_sources` table
- Entity types: `team`, `player`, `game`
- Source: `highlightly`

---

### 3. Manual NIL Feed

**Import Method:** POST to `/sync/nil` endpoint or R2 bucket upload

**Format:** JSON array of NIL deals
```json
[
  {
    "playerName": "John Smith",
    "teamName": "Texas Longhorns",
    "brandName": "Nike",
    "dealType": "endorsement",
    "dealValueTier": "50k_100k",
    "announcedDate": "2025-01-15",
    "source": "on3.com",
    "sourceUrl": "https://...",
    "verified": false
  }
]
```

**Data Provided:**
- NIL deal announcements
- Brand partnerships
- Estimated deal values (tiered)
- Verification status

**Player Matching:**
- First attempts exact match on `playerName` + `teamName`
- Falls back to fuzzy name search
- Creates entity_sources mapping on successful match

---

## Entity Source Mapping

All external IDs are mapped to internal BSI IDs via the `entity_sources` table:

```sql
CREATE TABLE entity_sources (
  entity_type TEXT,      -- team, player, game
  entity_id TEXT,        -- BSI internal ID
  source TEXT,           -- ncaa, highlightly, espn, manual
  source_id TEXT,        -- External source ID
  source_url TEXT,       -- Optional reference URL
  confidence REAL,       -- 0.0-1.0 match confidence
  verified INTEGER,      -- Manual verification flag
  UNIQUE(source, source_id)
);
```

**Critical Rule:** Never join data between sources using names—always resolve through entity_sources first.

---

## Data Refresh Schedule

| Data Type | Source | Frequency | Season Gate |
|-----------|--------|-----------|-------------|
| Live scores | NCAA | 5 min | Feb-Jun only |
| Teams | Highlightly | 6 hours | None |
| Standings | Highlightly | 6 hours | None |
| Player stats | Highlightly | 12 hours | Feb-Jun only |
| Full refresh | Both | Daily 3am CST | None |
| NIL deals | Manual | On demand | None |

**Season Gating:**
- February (2) through June (6) = college baseball season
- Off-season syncs can be enabled with `ENABLE_OFFSEASON_SYNC=true`

---

## Error Handling

### API Failures
1. Try primary fetch
2. On failure, check KV for stale cache (10x normal TTL)
3. If stale available, return with `isStale: true` flag
4. If no stale, throw error

### Rate Limiting
1. Check KV rate limit key before each request
2. If limit exceeded, return 429 immediately
3. Log rate limit event to analytics

### Data Validation
1. All API responses validated with Zod schemas
2. Invalid responses logged but not saved
3. Partial failures logged to `cbb_sync_log`

---

## Monitoring

**Sync Log Table:** `cbb_sync_log`
- Tracks every sync operation
- Records: fetched, inserted, updated, skipped counts
- Duration in milliseconds
- Error messages and details

**KV Metrics:**
- `sync:last:{source}:{entity}` — Last successful sync timestamp
- `sync:errors:{source}` — Recent error count

**Analytics Events:**
- `cbb_sync_started`
- `cbb_sync_completed`
- `cbb_sync_failed`
- `cbb_api_rate_limited`
