# Blaze Sports Intel API Documentation

**Version:** 1.0
**Base URL:** `https://blazesportsintel.com`
**Timezone:** America/Chicago

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Caching](#caching)
- [Error Handling](#error-handling)
- [MLB Endpoints](#mlb-endpoints)
- [NFL Endpoints](#nfl-endpoints)
- [NBA Endpoints](#nba-endpoints)
- [College Baseball Endpoints](#college-baseball-endpoints)
- [Response Schemas](#response-schemas)

---

## Authentication

Currently, all endpoints are publicly accessible. Future versions will support API keys for premium features.

---

## Rate Limiting

- **Rate Limit:** 100 requests per minute per IP
- **Headers:**
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

### Rate Limit Error (429)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60,
  "correlationId": "a1b2c3d4-e5f6-7890-ab12-cd34ef567890"
}
```

---

## Caching

All responses include caching headers:

- **Live Scores:** `max-age=30` (30 seconds)
- **Standings:** `max-age=300` (5 minutes)
- **Team Stats:** `max-age=300` (5 minutes)
- **Player Stats:** `max-age=600` (10 minutes)
- **Historical Data:** `max-age=86400` (24 hours)

### Cache Busting

Add `?bustCache=true` to any endpoint to bypass cache and fetch fresh data:

```
GET /api/mlb/cardinals?bustCache=true
```

---

## Error Handling

All errors return a consistent schema:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "correlationId": "uuid-v4",
  "timestamp": "2025-11-20T12:00:00Z"
}
```

### HTTP Status Codes

- **200 OK:** Success
- **400 Bad Request:** Invalid query parameters
- **404 Not Found:** Resource not found
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server error
- **503 Service Unavailable:** Temporary service disruption

---

## MLB Endpoints

### Get Team Data

```http
GET /api/mlb/{team-slug}
```

**Path Parameters:**
- `team-slug` (string): Team slug (e.g., `cardinals`, `dodgers`, `yankees`)

**Example:**
```bash
curl https://blazesportsintel.com/api/mlb/cardinals
```

**Response:**
```json
{
  "team": {
    "id": 138,
    "name": "St. Louis Cardinals",
    "abbreviation": "STL",
    "city": "St. Louis",
    "division": "NL Central",
    "league": "NL",
    "wins": 83,
    "losses": 79,
    "winPct": 0.512,
    "gamesBack": 8.0,
    "runsScored": 735,
    "runsAllowed": 712,
    "pythagWins": 85.2,
    "pythagLosses": 76.8,
    "lastUpdated": "2025-11-20T12:00:00Z"
  },
  "dataSource": "MLB Stats API (Real-time)",
  "lastUpdated": "2025-11-20T12:00:00Z"
}
```

### Get Standings

```http
GET /api/mlb/standings
```

**Query Parameters:**
- `division` (string, optional): Filter by division (e.g., `NL Central`, `AL East`)
- `league` (string, optional): Filter by league (`AL` or `NL`)
- `bustCache` (boolean, optional): Bypass cache

**Example:**
```bash
curl https://blazesportsintel.com/api/mlb/standings?division=NL%20Central
```

**Response:**
```json
{
  "standings": [
    {
      "division": "NL Central",
      "league": "NL",
      "teams": [
        {
          "id": 158,
          "name": "Milwaukee Brewers",
          "abbreviation": "MIL",
          "wins": 93,
          "losses": 69,
          "winPct": 0.574,
          "gamesBack": 0.0,
          "runsScored": 817,
          "runsAllowed": 698
        }
      ]
    }
  ],
  "dataSource": "MLB Stats API",
  "lastUpdated": "2025-11-20T12:00:00Z"
}
```

### Get Player Statistics

```http
GET /api/mlb/players
```

**Query Parameters:**
- `teamId` (number, required): Team ID
- `position` (string, optional): Filter by position (`P`, `C`, `1B`, `2B`, `3B`, `SS`, `OF`)
- `limit` (number, optional): Number of results (default: 50, max: 200)

**Example:**
```bash
curl https://blazesportsintel.com/api/mlb/players?teamId=138&position=P
```

**Response:**
```json
{
  "players": [
    {
      "playerId": 543037,
      "playerName": "Sonny Gray",
      "teamId": 138,
      "position": "P",
      "gamesPlayed": 28,
      "era": 3.84,
      "wins": 13,
      "losses": 9,
      "strikeouts": 183,
      "innings": 184.0
    }
  ],
  "dataSource": "MLB Stats API",
  "lastUpdated": "2025-11-20T12:00:00Z"
}
```

### Pythagorean Analytics

```http
GET /api/mlb/analytics/pythagorean
```

**Query Parameters:**
- `teamId` (number, required): Team ID

**Example:**
```bash
curl https://blazesportsintel.com/api/mlb/analytics/pythagorean?teamId=138
```

**Response:**
```json
{
  "teamId": 138,
  "runsScored": 735,
  "runsAllowed": 712,
  "actualWins": 83,
  "actualLosses": 79,
  "expectedWins": 85.2,
  "expectedLosses": 76.8,
  "luckFactor": -2.2,
  "confidence": 0.87,
  "exponent": 1.83
}
```

---

## NFL Endpoints

### Get Team Data

```http
GET /api/nfl/{team-slug}
```

**Path Parameters:**
- `team-slug` (string): Team slug (e.g., `titans`, `chiefs`, `cowboys`)

**Example:**
```bash
curl https://blazesportsintel.com/api/nfl/titans
```

**Response:**
```json
{
  "team": {
    "id": 34,
    "name": "Tennessee Titans",
    "abbreviation": "TEN",
    "city": "Tennessee",
    "division": "AFC South",
    "conference": "AFC",
    "wins": 6,
    "losses": 5,
    "ties": 0,
    "winPct": 0.545,
    "pointsFor": 286,
    "pointsAgainst": 268,
    "pointDifferential": 18,
    "lastUpdated": "2025-11-20T12:00:00Z"
  },
  "dataSource": "ESPN API (Real-time)",
  "lastUpdated": "2025-11-20T12:00:00Z"
}
```

### Get Standings

```http
GET /api/nfl/standings
```

**Query Parameters:**
- `conference` (string, optional): Filter by conference (`AFC` or `NFC`)
- `division` (string, optional): Filter by division (e.g., `AFC South`)
- `season` (number, optional): Season year (default: current season)

**Example:**
```bash
curl https://blazesportsintel.com/api/nfl/standings?conference=AFC
```

### Get Live Scores

```http
GET /api/nfl/scores
```

**Query Parameters:**
- `week` (number, optional): Week number (1-18, default: current week)
- `season` (number, optional): Season year

**Example:**
```bash
curl https://blazesportsintel.com/api/nfl/scores?week=11
```

**Response:**
```json
{
  "week": 11,
  "season": 2025,
  "games": [
    {
      "id": 401547394,
      "week": 11,
      "homeTeam": {
        "id": 34,
        "name": "Tennessee Titans",
        "score": 28
      },
      "awayTeam": {
        "id": 10,
        "name": "Houston Texans",
        "score": 24
      },
      "status": "final",
      "startTime": "2025-11-17T13:00:00Z",
      "venue": "Nissan Stadium"
    }
  ],
  "dataSource": "ESPN Live Scores",
  "lastUpdated": "2025-11-20T12:00:00Z"
}
```

### Advanced Analytics

```http
GET /api/nfl/analytics
```

**Query Parameters:**
- `teamId` (number, required): Team ID

**Example:**
```bash
curl https://blazesportsintel.com/api/nfl/analytics?teamId=34
```

**Response:**
```json
{
  "teamId": 34,
  "dvoa": 8.5,
  "epa": 0.12,
  "successRate": 0.47,
  "pythagWins": 7.2,
  "strengthOfSchedule": 0.52,
  "dataSource": "Blaze Analytics Engine",
  "lastUpdated": "2025-11-20T12:00:00Z"
}
```

---

## NBA Endpoints

### Get Standings

```http
GET /api/nba/standings
```

**Query Parameters:**
- `conference` (string, optional): Filter by conference (`Eastern` or `Western`)

---

## College Baseball Endpoints

### Get Teams

```http
GET /api/college-baseball/teams
```

**Query Parameters:**
- `conference` (string, optional): Filter by conference
- `division` (string, optional): Filter by division (D1, D2, D3)

### Get Schedule

```http
GET /api/college-baseball/schedule
```

**Query Parameters:**
- `teamId` (number, optional): Filter by team
- `date` (string, optional): Filter by date (YYYY-MM-DD)

---

## Response Schemas

### Team Object

```typescript
interface Team {
  id: number;
  name: string;
  abbreviation: string;
  city: string;
  division: string;
  wins: number;
  losses: number;
  winPct: number;
  lastUpdated: string; // ISO 8601 datetime
}
```

### Error Object

```typescript
interface ErrorResponse {
  error: string;
  message?: string;
  correlationId: string; // UUID v4
  timestamp: string; // ISO 8601 datetime
}
```

---

## Support

For support or questions:
- **Email:** ahump20@outlook.com
- **GitHub Issues:** https://github.com/ahump20/BSI/issues

---

## Changelog

### Version 1.0 (2025-11-20)
- Initial API documentation
- MLB, NFL, NBA, and College Baseball endpoints
- Caching and rate limiting specifications
