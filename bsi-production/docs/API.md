# BSI Sports Data API

> Production-ready endpoints for college baseball and football data.

**Base URL:** `https://bsi-college-data-sync.humphrey-austin20.workers.dev`

---

## Authentication

All endpoints are currently public. Rate limiting applies:
- 100 requests/minute per IP
- 1000 requests/hour per IP

---

## College Baseball

### Rankings

Get D1Baseball Top 25 rankings.

```
GET /api/ncaa/baseball/rankings
```

**Response:**
```json
{
  "data": [
    {
      "rank": 1,
      "team": "Texas",
      "conference": "SEC",
      "record": "45-12",
      "previousRank": 2
    }
  ],
  "source": "D1Baseball",
  "lastSync": "2025-01-08T14:30:00.000Z",
  "fetchedAt": "Jan 8, 2025 8:30 AM CT",
  "season": 2025
}
```

**Sync Frequency:** Every 6 hours

---

### Standings

Get conference standings.

```
GET /api/ncaa/baseball/standings?conference={conference}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conference` | string | Yes | Conference abbreviation |

**Valid Conferences:**
- `SEC` - Southeastern Conference
- `ACC` - Atlantic Coast Conference
- `BIG12` - Big 12 Conference
- `BIG10` - Big Ten Conference
- `PAC12` - Pac-12 Conference

**Response:**
```json
{
  "data": [
    {
      "team": "Texas",
      "conferenceRecord": "18-6",
      "overallRecord": "45-12",
      "winPct": ".750",
      "gamesBack": "-"
    }
  ],
  "conference": "SEC",
  "source": "D1Baseball",
  "lastSync": "2025-01-08T14:30:00.000Z",
  "fetchedAt": "Jan 8, 2025 8:30 AM CT",
  "season": 2025
}
```

**Sync Frequency:** Every 6 hours

---

### Scores

Get game scores by date.

```
GET /api/ncaa/baseball/scores?date={date}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `date` | string | No | Date in YYYY-MM-DD format. Defaults to today (CT). |

**Response:**
```json
{
  "data": [
    {
      "gameId": "ncaa-bb-2025-01-08-001",
      "homeTeam": "Texas",
      "awayTeam": "Oklahoma",
      "homeScore": 7,
      "awayScore": 3,
      "status": "Final",
      "inning": null,
      "startTime": "2025-01-08T19:00:00.000Z",
      "venue": "UFCU Disch-Falk Field"
    }
  ],
  "date": "2025-01-08",
  "source": "D1Baseball",
  "lastSync": "2025-01-08T21:15:00.000Z",
  "fetchedAt": "Jan 8, 2025 3:15 PM CT",
  "season": 2025
}
```

**Game Status Values:**
- `Scheduled` - Game hasn't started
- `In Progress` - Game is live
- `Final` - Game completed
- `Postponed` - Game delayed
- `Cancelled` - Game won't be played

**Sync Frequency:** Every 2 minutes during games, every 30 minutes otherwise

---

## College Football

### Rankings

Get CFP/AP Top 25 rankings.

```
GET /api/cfb/rankings
```

**Response:**
```json
{
  "data": [
    {
      "rank": 1,
      "team": "Texas",
      "conference": "SEC",
      "record": "12-0",
      "previousRank": 1,
      "poll": "CFP"
    }
  ],
  "source": "ESPN",
  "lastSync": "2025-01-08T14:30:00.000Z",
  "fetchedAt": "Jan 8, 2025 8:30 AM CT",
  "season": 2025
}
```

**Sync Frequency:** Every 6 hours (updates primarily on Sundays/Tuesdays during season)

---

### Standings

Get conference standings.

```
GET /api/cfb/standings?conference={conference}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conference` | string | Yes | Conference abbreviation |

**Valid Conferences:**
- `SEC` - Southeastern Conference
- `BIG10` - Big Ten Conference
- `BIG12` - Big 12 Conference
- `ACC` - Atlantic Coast Conference

**Response:**
```json
{
  "data": [
    {
      "team": "Texas",
      "conferenceRecord": "8-0",
      "overallRecord": "12-0",
      "winPct": "1.000",
      "divisionRank": 1
    }
  ],
  "conference": "SEC",
  "source": "ESPN",
  "lastSync": "2025-01-08T14:30:00.000Z",
  "fetchedAt": "Jan 8, 2025 8:30 AM CT",
  "season": 2025
}
```

**Sync Frequency:** Every 6 hours

---

### Scores

Get game scores by week.

```
GET /api/cfb/scores?week={week}&year={year}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `week` | integer | No | Week number (1-15). Defaults to current week. |
| `year` | integer | No | Season year. Defaults to current season. |

**Response:**
```json
{
  "data": [
    {
      "gameId": "cfb-2025-w14-001",
      "homeTeam": "Texas",
      "awayTeam": "Oklahoma",
      "homeScore": 35,
      "awayScore": 21,
      "status": "Final",
      "quarter": null,
      "clock": null,
      "startTime": "2025-10-11T16:00:00.000Z",
      "venue": "Cotton Bowl",
      "broadcast": "ABC"
    }
  ],
  "week": 14,
  "year": 2025,
  "source": "ESPN",
  "lastSync": "2025-10-11T23:45:00.000Z",
  "fetchedAt": "Oct 11, 2025 6:45 PM CT",
  "season": 2025
}
```

**Sync Frequency:** Every 2 minutes during games, every 30 minutes otherwise

---

## Standard Response Format

All endpoints return this structure:

```json
{
  "data": [],
  "source": "string",
  "lastSync": "ISO 8601 timestamp",
  "fetchedAt": "human readable (CT)",
  "season": 2025
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | The requested records |
| `source` | string | Data provider (D1Baseball, ESPN, etc.) |
| `lastSync` | string | ISO 8601 UTC timestamp of last sync |
| `fetchedAt` | string | Human-readable CT timestamp |
| `season` | integer | Season year |

---

## Error Responses

### 400 Bad Request

Invalid or missing parameters.

```json
{
  "error": "Bad Request",
  "message": "Invalid conference: XYZ",
  "code": 400
}
```

### 404 Not Found

Resource doesn't exist.

```json
{
  "error": "Not Found",
  "message": "No games found for date 2025-01-08",
  "code": 404
}
```

### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "code": 429,
  "retryAfter": 60
}
```

### 500 Internal Server Error

Server-side failure.

```json
{
  "error": "Internal Server Error",
  "message": "Failed to fetch data from source",
  "code": 500
}
```

### 503 Service Unavailable

Upstream data source unavailable.

```json
{
  "error": "Service Unavailable",
  "message": "D1Baseball API temporarily unavailable",
  "code": 503,
  "retryAfter": 300
}
```

---

## Data Freshness

| Data Type | Sync Interval | Notes |
|-----------|---------------|-------|
| Rankings | 6 hours | Updates Tuesday/Sunday during season |
| Standings | 6 hours | Updates after games complete |
| Live Scores | 2 minutes | Only during active games |
| Final Scores | 30 minutes | After games conclude |

All timestamps use America/Chicago (Central Time).

---

## Data Sources

| Sport | Primary Source | Fallback |
|-------|----------------|----------|
| College Baseball | D1Baseball | Baseball-Reference |
| College Football | ESPN API | Sports Reference |

BSI cross-references multiple sources for accuracy. If discrepancies exist, the primary source takes precedence.

---

## Changelog

| Date | Change |
|------|--------|
| 2025-01-08 | Initial API documentation |

---

*Questions? Contact Austin@blazesportsintel.com*
