# BSI College Baseball Gateway API

## Overview

The BSI College Baseball Gateway (`bsi-cbb-gateway`) provides a unified REST API for accessing college baseball data, cross-sport scores, standings, rosters, and NIL market intelligence. All endpoints are publicly accessible with rate limiting via Cloudflare.

- **Base URL:** `https://api.blazesportsintel.com/cbb`
- **Auth:** Public (rate limited)
- **Cache:** Edge caching via Cloudflare KV with sport-specific TTLs
- **Last Updated:** 2025-01-09

---

## Table of Contents

- [Health Check](#health-check)
- [College Baseball](#college-baseball)
  - [Live Scores](#live-scores)
  - [Scores by Date](#scores-by-date)
  - [Standings](#standings)
  - [Teams](#teams)
  - [Players](#players)
  - [Game Details](#game-details)
- [NIL Intelligence](#nil-intelligence)
  - [NIL Deals](#nil-deals)
  - [NIL Market](#nil-market)
- [MLB](#mlb)
  - [Live Scores](#mlb-live-scores)
  - [Scores by Date](#mlb-scores-by-date)
  - [Standings](#mlb-standings)
  - [Teams](#mlb-teams)
  - [Team Roster](#mlb-team-roster)
- [NFL](#nfl)
  - [Live Scores](#nfl-live-scores)
  - [Scores by Date](#nfl-scores-by-date)
  - [Standings](#nfl-standings)
  - [Teams](#nfl-teams)
  - [Team Roster](#nfl-team-roster)
- [NCAA Football](#ncaa-football)
  - [Live Scores](#ncaaf-live-scores)
  - [Standings](#ncaaf-standings)
  - [Team Roster](#ncaaf-team-roster)
- [NCAA Baseball](#ncaa-baseball)
  - [Live Scores](#ncaab-live-scores)
  - [Team Roster](#ncaab-team-roster)
- [Admin Endpoints](#admin-endpoints)
  - [Cache Stats](#cache-stats)
  - [Cache Invalidation](#cache-invalidation)

---

## Health Check

### `GET /cbb/health`

Returns API health status and data source availability.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "timezone": "America/Chicago",
  "environment": "production",
  "dataSources": {
    "highlightly": {
      "status": "active",
      "sports": ["ncaa-baseball", "ncaa-football", "mlb", "nfl"]
    },
    "espnFallback": { "status": "active", "sports": ["college-football", "nfl", "mlb"] }
  },
  "cache": {
    "provider": "Cloudflare KV",
    "namespace": "BSI_CACHE"
  }
}
```

---

## College Baseball

### Live Scores

`GET /cbb/scores/live`

Returns live and today's college baseball games.

**Cache:** 60 seconds

**Response:**

```json
{
  "data": [
    {
      "id": "401573165",
      "homeTeam": { "name": "Texas", "abbreviation": "TEX", "score": 5 },
      "awayTeam": { "name": "Oklahoma", "abbreviation": "OU", "score": 3 },
      "status": "live",
      "inning": "7",
      "inningState": "Top",
      "venue": "UFCU Disch-Falk Field",
      "startTime": "2025-03-15T19:00:00Z"
    }
  ],
  "count": 15,
  "source": "highlightly",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

### Scores by Date

`GET /cbb/scores/:date`

Returns college baseball games for a specific date.

| Parameter | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| `date`    | string | Yes      | Date in YYYY-MM-DD format |

**Cache:** 1 hour (historical), 60 seconds (today)

**Response:** Same structure as live scores

### Standings

`GET /cbb/standings`

Returns college baseball conference standings.

| Query Parameter | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `conference`    | string | No       | Filter by conference (e.g., "SEC", "Big 12") |

**Cache:** 1 hour

**Response:**

```json
{
  "data": [
    {
      "rank": 1,
      "team": "Texas",
      "abbreviation": "TEX",
      "conference": "Big 12",
      "wins": 45,
      "losses": 15,
      "confWins": 18,
      "confLosses": 6,
      "pct": ".750",
      "streak": "W3"
    }
  ],
  "source": "highlightly",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

### Teams

#### List All Teams

`GET /cbb/teams`

Returns all college baseball teams.

| Query Parameter | Type   | Required | Description                    |
| --------------- | ------ | -------- | ------------------------------ |
| `conference`    | string | No       | Filter by conference           |
| `limit`         | number | No       | Results per page (default: 50) |
| `offset`        | number | No       | Pagination offset              |

**Cache:** 24 hours

#### Get Team by ID

`GET /cbb/teams/:id`

Returns detailed team information.

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `id`      | string | Yes      | Team ID from Highlightly |

**Cache:** 24 hours

**Response:**

```json
{
  "data": {
    "id": "251",
    "name": "Texas Longhorns",
    "abbreviation": "TEX",
    "conference": "Big 12",
    "location": "Austin, TX",
    "venue": "UFCU Disch-Falk Field",
    "coach": "David Pierce",
    "record": { "wins": 45, "losses": 15 },
    "logo": "https://..."
  },
  "source": "highlightly",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

### Players

#### List Players

`GET /cbb/players`

Returns college baseball players.

| Query Parameter | Type   | Required | Description                         |
| --------------- | ------ | -------- | ----------------------------------- |
| `team`          | string | No       | Filter by team ID                   |
| `position`      | string | No       | Filter by position (P, C, 1B, etc.) |
| `limit`         | number | No       | Results per page (default: 50)      |

**Cache:** 24 hours

#### Get Player by ID

`GET /cbb/players/:id`

Returns detailed player information including stats.

| Parameter | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| `id`      | string | Yes      | Player ID from Highlightly |

**Cache:** 24 hours

### Game Details

`GET /cbb/games/:id`

Returns detailed game information including box score.

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | string | Yes      | Game ID     |

**Cache:** 5 minutes (live), 24 hours (final)

**Response:**

```json
{
  "data": {
    "id": "401573165",
    "homeTeam": { "name": "Texas", "score": 5, "hits": 9, "errors": 1 },
    "awayTeam": { "name": "Oklahoma", "score": 3, "hits": 6, "errors": 2 },
    "status": "final",
    "linescore": {
      "innings": [
        { "away": 0, "home": 1 },
        { "away": 1, "home": 0 }
      ],
      "totals": {
        "away": { "runs": 3, "hits": 6, "errors": 2 },
        "home": { "runs": 5, "hits": 9, "errors": 1 }
      }
    },
    "venue": "UFCU Disch-Falk Field",
    "attendance": 7845,
    "weather": "72°F, Clear"
  },
  "source": "highlightly",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

---

## NIL Intelligence

### NIL Deals

`GET /cbb/nil/deals`

Returns recent NIL deals in college baseball.

| Query Parameter | Type   | Required | Description                    |
| --------------- | ------ | -------- | ------------------------------ |
| `team`          | string | No       | Filter by team                 |
| `limit`         | number | No       | Results per page (default: 20) |

**Cache:** 1 hour

### NIL Market

`GET /cbb/nil/market`

Returns NIL market analytics and trends.

**Cache:** 1 hour

---

## MLB

### MLB Live Scores

`GET /cbb/mlb/live`

Returns live MLB games.

**Cache:** 60 seconds

### MLB Scores by Date

`GET /cbb/mlb/scores/:date`

Returns MLB games for a specific date.

| Parameter | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| `date`    | string | Yes      | Date in YYYY-MM-DD format |

**Cache:** 1 hour

### MLB Standings

`GET /cbb/mlb/standings`

Returns MLB division standings.

**Cache:** 1 hour

### MLB Teams

`GET /cbb/mlb/teams`

Returns all MLB teams.

**Cache:** 24 hours

### MLB Team Roster

`GET /cbb/mlb/teams/:id/players`

Returns team roster via ESPN fallback.

| Parameter | Type   | Required | Description                             |
| --------- | ------ | -------- | --------------------------------------- |
| `id`      | string | Yes      | ESPN team ID (e.g., "24" for Cardinals) |

**Cache:** 24 hours

**Note:** Uses ESPN public API as fallback. Team IDs differ from MLB Stats API. Common IDs:

- Cardinals: 24
- Cubs: 16
- Dodgers: 19
- Yankees: 10

**Response:**

```json
{
  "data": [
    {
      "id": "425877",
      "fullName": "Nolan Arenado",
      "displayName": "Nolan Arenado",
      "jersey": "28",
      "position": "3B",
      "experience": 11,
      "status": "active",
      "headshot": "https://..."
    }
  ],
  "teamId": "24",
  "count": 40,
  "source": "espn",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

---

## NFL

### NFL Live Scores

`GET /cbb/nfl/live`

Returns live NFL games.

**Cache:** 60 seconds

### NFL Scores by Date

`GET /cbb/nfl/scores/:date`

Returns NFL games for a specific date.

| Parameter | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| `date`    | string | Yes      | Date in YYYY-MM-DD format |

**Cache:** 1 hour

### NFL Standings

`GET /cbb/nfl/standings`

Returns NFL conference standings.

**Cache:** 1 hour

### NFL Teams

`GET /cbb/nfl/teams`

Returns all NFL teams.

**Cache:** 24 hours

### NFL Team Roster

`GET /cbb/nfl/teams/:id/players`

Returns team roster via ESPN fallback.

| Parameter | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `id`      | string | Yes      | ESPN team ID (e.g., "10" for Titans) |

**Cache:** 24 hours

**Common Team IDs:**

- Titans: 10
- Chiefs: 12
- Bills: 2
- Cowboys: 6

---

## NCAA Football

### NCAAF Live Scores

`GET /cbb/ncaa-football/live`

Returns live college football games.

**Cache:** 60 seconds

### NCAAF Standings

`GET /cbb/ncaa-football/standings`

Returns college football conference standings.

**Cache:** 1 hour

### NCAAF Team Roster

`GET /cbb/ncaa-football/teams/:id/players`

Returns team roster via ESPN fallback.

| Parameter | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `id`      | string | Yes      | ESPN team ID (e.g., "251" for Texas) |

**Cache:** 24 hours

**Common Team IDs:**

- Texas: 251
- Texas A&M: 245
- Oklahoma: 201
- Georgia: 61

---

## NCAA Baseball

### NCAAB Live Scores

`GET /cbb/ncaa-baseball/live`

Returns live college baseball games.

**Cache:** 60 seconds

### NCAAB Team Roster

`GET /cbb/ncaa-baseball/teams/:id/players`

Attempts to return team roster via ESPN fallback.

| Parameter | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| `id`      | string | Yes      | ESPN team ID |

**Note:** ESPN's public API does not expose college baseball rosters. This endpoint returns an empty array. For college baseball rosters, use the primary `/cbb/teams/:id` endpoint via Highlightly.

---

## Admin Endpoints

### Cache Stats

`GET /cbb/admin/cache-stats`

Returns cache statistics and hit rates.

**Response:**

```json
{
  "timestamp": "2025-01-09T12:00:00.000Z",
  "timezone": "America/Chicago",
  "cache": {
    "provider": "Cloudflare KV",
    "namespace": "BSI_CACHE",
    "totalKeysEstimate": 59,
    "analysis": [
      {
        "prefix": "espn:roster",
        "description": "ESPN roster data",
        "defaultTtl": "24h",
        "keysFound": 4,
        "hasMore": false,
        "sampleKeys": ["espn:roster:nfl:10", "espn:roster:mlb:24"]
      },
      {
        "prefix": "highlightly:scores",
        "description": "Live scores",
        "defaultTtl": "60s",
        "keysFound": 12,
        "hasMore": false
      }
    ]
  },
  "dataSources": {
    "primary": { "name": "Highlightly API", "status": "active" },
    "fallback": { "name": "ESPN API", "status": "active" }
  }
}
```

### Cache Invalidation

`DELETE /cbb/admin/cache/:prefix`

Invalidates cache entries by prefix.

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `prefix`  | string | Yes      | Cache key prefix to invalidate |

**Example:** `DELETE /cbb/admin/cache/espn:roster`

**Response:**

```json
{
  "success": true,
  "prefix": "espn:roster",
  "keysDeleted": 4,
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable description",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

**HTTP Status Codes:**

- `200` - Success
- `400` - Bad request (invalid parameters)
- `404` - Resource not found
- `500` - Server error

---

## Rate Limiting

Rate limiting is handled at the Cloudflare edge:

| Tier           | Requests/min | Burst |
| -------------- | ------------ | ----- |
| Public         | 60           | 100   |
| Pro Subscriber | 300          | 500   |
| Enterprise     | 1000         | 2000  |

Rate limit headers included in responses:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Data Sources

| Source          | Sports                                 | Data Type                                |
| --------------- | -------------------------------------- | ---------------------------------------- |
| Highlightly API | NCAA Baseball, NCAA Football, MLB, NFL | Scores, standings, teams, players, games |
| ESPN Public API | College Football, NFL, MLB             | Team rosters (fallback)                  |
| D1 Database     | All                                    | Player profiles, NIL data                |

---

## Changelog

- **2025-01-09:** Added ESPN roster fallback for NFL, MLB, NCAA Football
- **2025-01-09:** Added cache statistics dashboard (`/admin/cache-stats`)
- **2025-01-08:** Initial gateway deployment with Highlightly integration
