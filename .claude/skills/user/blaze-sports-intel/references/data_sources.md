# Data Sources Reference

Complete API documentation for all sports data sources used by Blaze Sports Intel.

## College Baseball (Primary Priority)

### ESPN College Baseball API

**Base URL:** `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball`

#### Scoreboard Endpoint

```
GET /scoreboard
GET /scoreboard?dates=YYYYMMDD
```

**Parameters:**
- `dates` (optional): Date in YYYYMMDD format (e.g., `20250315`)
- `groups` (optional): Conference ID filter
- `limit` (optional): Number of results (default: 50)

**Response Structure:**
```json
{
  "leagues": [...],
  "season": { "year": 2025, "type": 2 },
  "events": [
    {
      "id": "401234567",
      "name": "Texas vs Oklahoma",
      "shortName": "TEX @ OU",
      "date": "2025-03-15T19:00Z",
      "competitions": [
        {
          "competitors": [
            {
              "team": { "displayName": "Texas", "abbreviation": "TEX" },
              "score": "5",
              "homeAway": "away"
            },
            {
              "team": { "displayName": "Oklahoma", "abbreviation": "OU" },
              "score": "3",
              "homeAway": "home"
            }
          ],
          "status": {
            "type": { "state": "post", "completed": true }
          }
        }
      ]
    }
  ]
}
```

**Key Fields:**
- `events[].id`: ESPN event ID (store for future queries)
- `events[].competitions[0].status.type.state`: Game state (pre, in, post)
- `events[].competitions[0].competitors`: Team data and scores

**Citation:**
```typescript
{
  source: 'ESPN college-baseball',
  timestamp: '2025-03-15',
  timezone: 'America/Chicago'
}
```

#### Teams Endpoint

```
GET /teams
GET /teams/{teamId}
```

Returns team information including roster, schedule, and stats.

#### Conferences

Major conferences to track:
- SEC (Southeastern Conference)
- Big 12
- ACC (Atlantic Coast Conference)
- Pac-12
- Big Ten

**Note:** ESPN's college baseball API has historically lacked detailed box scores and player stats. This is the primary gap Blaze Sports Intel aims to fill.

---

## MLB (Secondary Priority)

### MLB StatsAPI

**Base URL:** `https://statsapi.mlb.com/api/v1`

Community-maintained unofficial API. No authentication required.

#### Schedule Endpoint

```
GET /schedule?sportId=1&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Parameters:**
- `sportId`: 1 for MLB
- `startDate`: ISO date format
- `endDate`: ISO date format
- `teamId` (optional): Filter by team
- `hydrate` (optional): Additional data (e.g., `team,linescore,decisions`)

**Response:**
```json
{
  "dates": [
    {
      "date": "2025-04-01",
      "games": [
        {
          "gamePk": 745001,
          "gameDate": "2025-04-01T19:05:00Z",
          "teams": {
            "away": { "team": { "name": "New York Yankees" }, "score": 0 },
            "home": { "team": { "name": "Houston Astros" }, "score": 0 }
          },
          "status": { "abstractGameState": "Preview" }
        }
      ]
    }
  ]
}
```

#### Live Game Feed

```
GET /game/{gamePk}/feed/live
```

**Returns:** Complete game data including:
- Box score
- Line score by inning
- Play-by-play events
- Player stats
- Weather conditions
- Venue information

**Key Fields:**
- `liveData.plays.allPlays`: Every play in the game
- `liveData.boxscore`: Traditional box score
- `liveData.linescore`: Score by inning
- `gameData.status.abstractGameState`: Preview, Live, Final

**Citation:**
```typescript
{
  source: 'statsapi.mlb.com',
  timestamp: '2025-04-01',
  timezone: 'America/Chicago'
}
```

#### Player Endpoint

```
GET /people/{playerId}
GET /people/{playerId}/stats?stats=season&season=2025
```

Returns player biographical data and seasonal statistics.

#### Teams Endpoint

```
GET /teams
GET /teams/{teamId}
```

#### Standings

```
GET /standings?leagueId=103,104&season=2025
```

**Parameters:**
- `leagueId`: 103 (AL), 104 (NL)
- `standingsTypes`: regularSeason, wildCard, divisionLeaders

---

## NFL (Third Priority)

### ESPN NFL API

**Base URL:** `https://site.api.espn.com/apis/site/v2/sports/football/nfl`

#### Scoreboard

```
GET /scoreboard
GET /scoreboard?dates=YYYYMMDD
GET /scoreboard?week={week}&seasontype={type}
```

**Parameters:**
- `dates`: YYYYMMDD format
- `week`: Week number (1-18 for regular season)
- `seasontype`: 1 (preseason), 2 (regular), 3 (postseason)

**Response Structure:** Similar to college baseball scoreboard format

#### Teams

```
GET /teams
GET /teams/{teamId}
```

#### Schedule

```
GET /teams/{teamId}/schedule?season=2025
```

**Citation:**
```typescript
{
  source: 'ESPN NFL',
  timestamp: '2025-10-16',
  timezone: 'America/Chicago'
}
```

### Pro Football Reference (Historical Data)

**Base URL:** `https://www.pro-football-reference.com`

**Important:** Always check and respect `robots.txt` before scraping.

#### Common Patterns

Player pages:
```
/players/{LastInitial}/{PlayerID}.htm
Example: /players/M/MahoPa00.htm (Patrick Mahomes)
```

Team pages:
```
/teams/{abbrev}/{year}.htm
Example: /teams/kan/2024.htm (2024 Kansas City Chiefs)
```

**Scraping Guidelines:**
1. Rate limit: Maximum 1 request per 3 seconds
2. Use proper User-Agent header
3. Cache responses aggressively
4. Respect robots.txt at all times

---

## FanGraphs

**Base URL:** `https://www.fangraphs.com`

### Leaderboards

Interactive leaderboards with CSV export functionality.

#### Batting Leaderboard

```
/leaders.aspx?pos=all&stats=bat&lg=all&qual=y&type=8&season=2025
```

**Parameters:**
- `pos`: all, of, if, c, 1b, 2b, 3b, ss
- `stats`: bat (batting)
- `lg`: all, al, nl
- `qual`: y (qualified), n (all players)
- `type`: 8 (standard), c (advanced), etc.
- `season`: Year

#### Pitching Leaderboard

```
/leaders.aspx?pos=all&stats=pit&lg=all&qual=y&type=8&season=2025
```

**Parameters:**
- `pos`: all, sp, rp
- `stats`: pit (pitching)
- Other params similar to batting

#### CSV Export

Use the "Export Data" button on any leaderboard page.

**Important:** Do not scrape HTML. Use official CSV exports only.

**Citation:**
```typescript
{
  source: 'FanGraphs',
  timestamp: '2025-03-15',
  timezone: 'America/Chicago',
  note: 'Standard batting leaderboard, min 100 PA'
}
```

---

## Rate Limiting and Caching Strategy

### KV Cache TTLs

Recommended cache durations:

- **Live games (in progress):** 15 seconds
- **Today's scoreboard:** 30 seconds
- **Recent box scores:** 60 seconds
- **Historical data:** 3600 seconds (1 hour)
- **Player career stats:** 86400 seconds (24 hours)

### D1 Persistence

Store in D1 for:
- Game status changes (for historical analysis)
- Daily scoreboards (full season archive)
- Player stat snapshots (trend analysis)

### R2 Storage

Store in R2 for:
- Raw CSV exports (audit trail)
- Large JSON responses (>1MB)
- Historical data dumps

---

## API Reliability Notes

### ESPN APIs

- Generally reliable during live games
- Occasionally missing data for smaller conferences
- College baseball endpoint notably lacks detailed box scores

### MLB StatsAPI

- Very reliable, well-documented community resource
- No authentication required
- Rate limiting not enforced but be respectful
- Data typically available 1-2 minutes after real events

### FanGraphs

- Manual CSV exports only (no programmatic API)
- Data updated daily (typically overnight)
- Historical data very reliable
- Current season may have corrections/adjustments

---

## Error Handling Patterns

### HTTP Status Codes

Handle common error scenarios:

```typescript
const res = await fetch(url);

if (res.status === 404) {
  // Game/player not found - log and return empty result
}

if (res.status === 429) {
  // Rate limited - back off exponentially
  await sleep(2000);
  return fetchWithRetry(url, retries - 1);
}

if (res.status >= 500) {
  // Server error - retry with backoff
  return fetchWithRetry(url, retries - 1);
}

if (!res.ok) {
  throw new Error(`HTTP ${res.status}`);
}
```

### Data Quality Checks

Validate critical fields before processing:

```typescript
// Example: MLB game feed
if (!live?.gameData?.game?.pk) {
  throw new Error('Invalid game feed: missing gamePk');
}

if (!live?.gameData?.status?.abstractGameState) {
  console.warn('Missing game state, defaulting to Unknown');
  abstractState = 'Unknown';
}
```

---

## Timezone Handling

All timestamps must be normalized to `America/Chicago` (Central Time) for consistency.

### Converting from UTC

```typescript
const date = new Date(utcTimestamp);
const chicagoDate = date.toLocaleDateString('en-CA', { 
  timeZone: 'America/Chicago' 
});
// Returns: YYYY-MM-DD in Central Time
```

### Working with Game Times

ESPN and MLB APIs return times in UTC. Always convert for display:

```typescript
const gameTime = new Date(event.date);
const formatted = gameTime.toLocaleString('en-US', {
  timeZone: 'America/Chicago',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});
// Returns: "Mar 15, 7:00 PM"
```
