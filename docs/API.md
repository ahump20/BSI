# Blaze Sports Intel API Documentation

Version: 2.2.0
Base URL: `https://blazesportsintel.com/api`
Timezone: America/Chicago (CST/CDT)
Last Updated: November 29, 2025

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [MLB Endpoints](#mlb-endpoints)
- [NFL Endpoints](#nfl-endpoints)
- [NBA Endpoints](#nba-endpoints)
- [College Baseball Endpoints](#college-baseball-endpoints)
- [AI Copilot Endpoints](#ai-copilot-endpoints)
- [Predictions & Analytics](#predictions--analytics)
- [Health & Metrics](#health--metrics)
- [Admin Endpoints](#admin-endpoints)
- [OpenAPI Specification](#openapi-specification)

## Overview

The Blaze Sports Intel API provides programmatic access to:

- Real-time sports data (scores, standings, schedules)
- Historical statistics and records
- Advanced analytics and predictions
- AI-powered insights via Copilot
- Scouting reports and player projections

**Supported Sports:**
- ⚾ MLB (Major League Baseball)
- 🏈 NFL (National Football League)
- 🏀 NBA (National Basketball Association)
- ⚾ College Baseball (NCAA Division I)

**Data Sources:**
- SportsDataIO (primary)
- MLB Stats API (baseball)
- ESPN API (supplementary)
- NCAA Stats (college sports)

## Authentication

Most endpoints are publicly accessible. Premium endpoints require API key authentication.

### API Key Authentication

Include your API key in the request header:

```http
Authorization: Bearer YOUR_API_KEY
```

**Obtaining an API Key:**
1. Create account at [blazesportsintel.com/signup](https://blazesportsintel.com/signup)
2. Navigate to Dashboard > API Keys
3. Generate new API key
4. Store securely (never commit to version control)

### Public Endpoints

These endpoints do not require authentication:
- `GET /health`
- `GET /mlb/standings`
- `GET /nfl/standings`
- `GET /nba/standings`
- `GET /college-baseball/standings`
- `GET /coverage-matrix`

### Premium Endpoints

These endpoints require API key:
- `POST /copilot/*` (AI insights)
- `GET /v1/predictive/*` (player projections)
- `GET /v1/predictions/*` (game predictions)
- `GET /college-baseball/scouting-professional` (pro scouting reports)

## Rate Limiting

### Public Endpoints

- **Rate Limit:** 100 requests per minute per IP
- **Daily Limit:** 10,000 requests per day per IP

### Authenticated Endpoints

Limits vary by plan:

| Plan | Requests/Minute | Requests/Day | Burst Limit |
|------|----------------|--------------|-------------|
| Free | 10 | 1,000 | 20 |
| Basic | 60 | 50,000 | 100 |
| Pro | 300 | 500,000 | 500 |
| Enterprise | Custom | Custom | Custom |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564800
```

### Exceeding Limits

When rate limit is exceeded, API returns:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "message": "You have exceeded your rate limit. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

## Error Handling

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource does not exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Temporary outage

### Error Response Format

```json
{
  "error": "ValidationError",
  "message": "Invalid sport parameter. Must be one of: mlb, nfl, nba, college-baseball",
  "code": "INVALID_PARAMETER",
  "details": {
    "parameter": "sport",
    "value": "soccer",
    "allowedValues": ["mlb", "nfl", "nba", "college-baseball"]
  }
}
```

## MLB Endpoints

### Get MLB Standings

Returns current standings for all MLB teams.

**Endpoint:** `GET /mlb/standings`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `season` | integer | No | Season year (default: current season) |
| `division` | string | No | Filter by division (e.g., "AL East") |

**Response:**

```json
{
  "season": 2025,
  "lastUpdated": "2025-11-06T18:30:00Z",
  "dataSource": "MLB Stats API",
  "standings": [
    {
      "division": "American League East",
      "teams": [
        {
          "teamId": 110,
          "teamName": "Baltimore Orioles",
          "abbreviation": "BAL",
          "wins": 95,
          "losses": 67,
          "winPercentage": 0.586,
          "gamesBack": 0.0,
          "runsScored": 810,
          "runsAllowed": 702,
          "homeRecord": "52-29",
          "awayRecord": "43-38",
          "divisionRecord": "42-34",
          "lastTenGames": "7-3",
          "streak": "W3"
        }
      ]
    }
  ]
}
```

### Get MLB Scores

Returns live and completed game scores.

**Endpoint:** `GET /mlb/scores`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | No | Date in YYYY-MM-DD format (default: today) |
| `teamId` | integer | No | Filter by team ID |

**Response:**

```json
{
  "date": "2025-11-06",
  "games": [
    {
      "gameId": 717623,
      "status": "Final",
      "gameTime": "2025-11-06T18:10:00Z",
      "venue": "Busch Stadium",
      "homeTeam": {
        "teamId": 138,
        "teamName": "St. Louis Cardinals",
        "score": 5,
        "hits": 9,
        "errors": 0
      },
      "awayTeam": {
        "teamId": 112,
        "teamName": "Chicago Cubs",
        "score": 3,
        "hits": 7,
        "errors": 1
      }
    }
  ]
}
```

## NFL Endpoints

### Get NFL Standings

Returns current standings for all NFL teams.

**Endpoint:** `GET /nfl/standings`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `season` | integer | No | Season year (default: current season) |
| `conference` | string | No | Filter by conference ("AFC" or "NFC") |

**Response:**

```json
{
  "season": 2025,
  "week": 10,
  "lastUpdated": "2025-11-06T20:00:00Z",
  "dataSource": "SportsDataIO",
  "standings": {
    "AFC": {
      "North": [
        {
          "teamId": 1,
          "teamName": "Baltimore Ravens",
          "abbreviation": "BAL",
          "wins": 7,
          "losses": 2,
          "ties": 0,
          "winPercentage": 0.778,
          "pointsFor": 245,
          "pointsAgainst": 198,
          "conferenceRecord": "5-1",
          "divisionRecord": "3-0",
          "homeRecord": "4-1",
          "awayRecord": "3-1",
          "streak": "W3"
        }
      ]
    }
  }
}
```

### Get NFL Scores

Returns live and completed game scores.

**Endpoint:** `GET /nfl/scores`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `week` | integer | No | Week number (default: current week) |
| `season` | integer | No | Season year (default: current season) |

**Response:**

```json
{
  "season": 2025,
  "week": 10,
  "games": [
    {
      "gameId": 20251106001,
      "status": "In Progress",
      "quarter": 3,
      "timeRemaining": "8:45",
      "homeTeam": {
        "teamId": 1,
        "teamName": "Baltimore Ravens",
        "score": 21
      },
      "awayTeam": {
        "teamId": 5,
        "teamName": "Cincinnati Bengals",
        "score": 17
      }
    }
  ]
}
```

## NBA Endpoints

### Get NBA Standings

Returns current standings for all NBA teams.

**Endpoint:** `GET /nba/standings`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `season` | integer | No | Season year (default: current season) |
| `conference` | string | No | Filter by conference ("Eastern" or "Western") |

**Response:**

```json
{
  "season": 2025,
  "lastUpdated": "2025-11-06T22:00:00Z",
  "dataSource": "ESPN API",
  "standings": {
    "Eastern": [
      {
        "teamId": 1610612738,
        "teamName": "Boston Celtics",
        "abbreviation": "BOS",
        "wins": 10,
        "losses": 2,
        "winPercentage": 0.833,
        "gamesBack": 0.0,
        "conferenceRecord": "7-1",
        "divisionRecord": "3-0",
        "homeRecord": "6-1",
        "awayRecord": "4-1",
        "lastTenGames": "8-2",
        "streak": "W5"
      }
    ]
  }
}
```

### Get NBA Scores

Returns live and completed game scores.

**Endpoint:** `GET /nba/scores`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | No | Date in YYYY-MM-DD format (default: today) |

**Response:**

```json
{
  "date": "2025-11-06",
  "games": [
    {
      "gameId": 401584580,
      "status": "Final",
      "homeTeam": {
        "teamId": 1610612738,
        "teamName": "Boston Celtics",
        "score": 118
      },
      "awayTeam": {
        "teamId": 1610612752,
        "teamName": "New York Knicks",
        "score": 112
      }
    }
  ]
}
```

## College Baseball Endpoints

### Get College Baseball Standings

Returns standings for NCAA Division I college baseball teams.

**Endpoint:** `GET /college-baseball/standings`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conference` | string | No | Filter by conference (e.g., "SEC", "Big 12") |
| `season` | integer | No | Season year (default: current season) |

**Response:**

```json
{
  "season": 2025,
  "lastUpdated": "2025-11-06T16:00:00Z",
  "dataSource": "NCAA Stats",
  "standings": {
    "SEC": [
      {
        "teamId": 251,
        "schoolName": "Texas Longhorns",
        "overallRecord": "45-15",
        "conferenceRecord": "22-8",
        "winPercentage": 0.750,
        "runsScored": 432,
        "runsAllowed": 298,
        "homeRecord": "28-5",
        "awayRecord": "17-10"
      }
    ]
  }
}
```

### Get College Baseball Games

Returns game schedules and scores.

**Endpoint:** `GET /college-baseball/games`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | No | Date in YYYY-MM-DD format (default: today) |
| `teamId` | integer | No | Filter by team ID |

**Response:**

```json
{
  "date": "2025-11-06",
  "games": [
    {
      "gameId": "cbb-2025-11-06-001",
      "status": "Final",
      "homeTeam": {
        "teamId": 251,
        "schoolName": "Texas Longhorns",
        "score": 8
      },
      "awayTeam": {
        "teamId": 109,
        "schoolName": "Oklahoma Sooners",
        "score": 5
      }
    }
  ]
}
```

### Get Professional Scouting Reports

**Premium endpoint** - Returns detailed scouting reports for pro prospects.

**Endpoint:** `GET /college-baseball/scouting-professional`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `playerId` | integer | Yes | Player ID |
| `season` | integer | No | Season year (default: current season) |

**Authentication:** Required

**Response:**

```json
{
  "playerId": 12345,
  "playerName": "John Smith",
  "school": "Texas Longhorns",
  "position": "SS",
  "gradYear": 2025,
  "scoutingReport": {
    "hit": {
      "grade": 60,
      "ceiling": 70,
      "notes": "Advanced bat-to-ball skills with excellent plate discipline"
    },
    "power": {
      "grade": 55,
      "ceiling": 65,
      "notes": "Above-average raw power, projects for 20+ HR at peak"
    },
    "speed": {
      "grade": 60,
      "ceiling": 60,
      "notes": "Plus runner, 6.5 sixty-yard dash"
    },
    "arm": {
      "grade": 60,
      "ceiling": 65,
      "notes": "Above-average arm strength, accurate throws across diamond"
    },
    "field": {
      "grade": 55,
      "ceiling": 60,
      "notes": "Smooth actions, good hands, reliable defender"
    },
    "overall": {
      "grade": 55,
      "ceiling": 65,
      "projectDraftRound": "2-3",
      "ageAtMLBDebut": 22.5,
      "mlbEta": "2027"
    }
  }
}
```

## AI Copilot Endpoints

### Semantic Search

Search sports data using natural language queries.

**Endpoint:** `POST /copilot/search`

**Authentication:** Required

**Request Body:**

```json
{
  "query": "Show me Cardinals pitchers with ERA under 3.50",
  "sport": "mlb",
  "filters": {
    "teamId": 138,
    "position": "P"
  },
  "limit": 10
}
```

**Response:**

```json
{
  "query": "Show me Cardinals pitchers with ERA under 3.50",
  "resultsCount": 5,
  "results": [
    {
      "playerId": 543243,
      "playerName": "Jordan Montgomery",
      "position": "SP",
      "era": 3.20,
      "wins": 10,
      "losses": 5,
      "strikeouts": 135,
      "relevanceScore": 0.95
    }
  ],
  "confidence": 0.92,
  "sources": ["MLB Stats API", "Baseball Savant"]
}
```

### Enhanced Insights

Get AI-generated insights and analysis.

**Endpoint:** `POST /copilot/enhanced-insights`

**Authentication:** Required

**Request Body:**

```json
{
  "query": "Analyze Cardinals playoff chances",
  "sport": "mlb",
  "context": {
    "teamId": 138,
    "includeProjections": true
  }
}
```

**Response:**

```json
{
  "query": "Analyze Cardinals playoff chances",
  "insight": "Based on current standings and remaining schedule, the St. Louis Cardinals have a 72% probability of making the playoffs. Key factors include...",
  "confidence": 0.85,
  "data": {
    "currentRecord": "82-68",
    "playoffOdds": 0.72,
    "strengthOfSchedule": 0.485,
    "remainingGames": 12
  },
  "sources": [
    "MLB Stats API (2025-11-06 18:30:00 CST)",
    "FanGraphs Playoff Odds (2025-11-06 17:00:00 CST)"
  ]
}
```

### Copilot Status

Check AI Copilot service health and capabilities.

**Endpoint:** `GET /copilot/status`

**Response:**

```json
{
  "status": "operational",
  "capabilities": {
    "semanticSearch": true,
    "insights": true,
    "embeddings": true,
    "rag": true
  },
  "models": {
    "embedding": "@cf/baai/bge-base-en-v1.5",
    "llm": "@cf/meta/llama-3.1-8b-instruct"
  },
  "uptime": 99.98,
  "lastIncident": null
}
```

## Predictions & Analytics

### Win Probability

Get real-time win probability for active games.

**Endpoint:** `GET /v1/predictions/win-probability`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gameId` | string | Yes | Game identifier |
| `sport` | string | Yes | Sport (mlb, nfl, nba) |

**Authentication:** Required

**Response:**

```json
{
  "gameId": "717623",
  "sport": "mlb",
  "homeTeam": {
    "teamName": "St. Louis Cardinals",
    "winProbability": 0.68
  },
  "awayTeam": {
    "teamName": "Chicago Cubs",
    "winProbability": 0.32
  },
  "factors": {
    "score": 0.40,
    "inning": 0.15,
    "baserunners": 0.20,
    "momentum": 0.15,
    "bullpenStrength": 0.10
  },
  "confidence": 0.87,
  "lastUpdated": "2025-11-06T20:45:30Z"
}
```

### Player Projections

Get statistical projections for individual players.

**Endpoint:** `GET /v1/predictive/players/[id]/projection`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Player identifier |

**Authentication:** Required

**Response:**

```json
{
  "playerId": 543243,
  "playerName": "Jordan Montgomery",
  "position": "SP",
  "team": "St. Louis Cardinals",
  "projections": {
    "2025": {
      "wins": 14,
      "losses": 9,
      "era": 3.45,
      "strikeouts": 185,
      "innings": 190.0,
      "whip": 1.22
    }
  },
  "confidence": 0.82,
  "methodology": "Pythagorean expectation + PECOTA-style aging curves",
  "lastUpdated": "2025-11-06T12:00:00Z"
}
```

### Injury Risk Assessment

Assess injury risk for players.

**Endpoint:** `GET /v1/predictive/players/[id]/injury-risk`

**Authentication:** Required

**Response:**

```json
{
  "playerId": 543243,
  "playerName": "Jordan Montgomery",
  "injuryRisk": {
    "overall": "medium",
    "probability": 0.35,
    "factors": {
      "workload": 0.60,
      "age": 0.25,
      "injuryHistory": 0.15
    }
  },
  "recommendations": [
    "Monitor innings pitched closely",
    "Consider rest between starts in late season"
  ],
  "confidence": 0.75
}
```

## Health & Metrics

### Health Check

Check API health and service status.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T22:00:00Z",
  "services": {
    "database": "operational",
    "cache": "operational",
    "mlbApi": "operational",
    "nflApi": "operational",
    "nbaApi": "operational",
    "aiCopilot": "operational"
  },
  "version": "1.0.0",
  "uptime": 99.99
}
```

### Coverage Matrix

Get data coverage information for historical data.

**Endpoint:** `GET /coverage-matrix`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sport` | string | No | Filter by sport |
| `startYear` | integer | No | Start year for range |
| `endYear` | integer | No | End year for range |

**Response:**

```json
{
  "sports": {
    "mlb": {
      "seasons": [2020, 2021, 2022, 2023, 2024, 2025],
      "dataTypes": {
        "standings": true,
        "scores": true,
        "playerStats": true,
        "advancedMetrics": true
      },
      "completeness": 0.98
    },
    "nfl": {
      "seasons": [2020, 2021, 2022, 2023, 2024, 2025],
      "dataTypes": {
        "standings": true,
        "scores": true,
        "playerStats": true,
        "advancedMetrics": false
      },
      "completeness": 0.95
    }
  },
  "lastUpdated": "2025-11-06T12:00:00Z"
}
```

### System Metrics

Get system performance metrics.

**Endpoint:** `GET /metrics`

**Authentication:** Admin only

**Response:**

```json
{
  "timestamp": "2025-11-06T22:00:00Z",
  "apiCalls": {
    "total": 1250000,
    "lastHour": 4500,
    "avgResponseTime": 185
  },
  "cacheHitRate": 0.89,
  "errorRate": 0.002,
  "activeUsers": 1250
}
```

## Admin Endpoints

Administrative endpoints for system monitoring and debugging.

### Secrets Status

Check which secrets and bindings are configured (presence only, never exposes values).

**Endpoint:** `GET /admin/secrets-status`

**Response:**

```json
{
  "timestamp": "2025-11-29T12:00:00Z",
  "environment": "production",
  "summary": {
    "total": 20,
    "configured": 15,
    "missing": 5,
    "requiredMissing": 2,
    "status": "incomplete"
  },
  "byCategory": {
    "sports-data": {
      "configured": ["SPORTSDATAIO_API_KEY", "CFBDATA_API_KEY"],
      "missing": ["THEODDS_API_KEY"]
    },
    "authentication": {
      "configured": ["JWT_SECRET", "GOOGLE_CLIENT_ID"],
      "missing": []
    },
    "cloudflare": {
      "configured": ["KV", "DB", "AI"],
      "missing": ["VECTORIZE"]
    }
  },
  "missingRequired": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]
}
```

### API Provider Tests

Test individual external API providers to verify connectivity.

**Endpoint:** `GET /admin/api-tests/:provider`

**Available Providers:**
- `mlb` - Test MLB Stats API
- `espn` - Test ESPN APIs (NFL, NBA, NCAA)
- `sportsdataio` - Test SportsDataIO (requires API key)
- `cfbd` - Test College Football Data (requires API key)
- `all` - Run all tests

**Example:** `GET /admin/api-tests/all`

**Response:**

```json
{
  "timestamp": "2025-11-29T12:00:00Z",
  "provider": "all",
  "summary": {
    "totalTests": 4,
    "passed": 3,
    "failed": 0,
    "skipped": 1,
    "totalTime": 2345,
    "overallStatus": "healthy"
  },
  "results": [
    {
      "provider": "MLB Stats API",
      "status": "pass",
      "responseTime": 245,
      "statusCode": 200,
      "dataValidation": true,
      "details": {
        "teamFound": "St. Louis Cardinals"
      }
    },
    {
      "provider": "ESPN APIs",
      "status": "pass",
      "responseTime": 890,
      "dataValidation": true,
      "details": {
        "endpoints": 4,
        "passed": 4
      }
    },
    {
      "provider": "SportsDataIO",
      "status": "skip",
      "responseTime": 0,
      "error": "SPORTSDATAIO_API_KEY not configured"
    }
  ]
}
```

## OpenAPI Specification

Full OpenAPI 3.1 specification available at:

**JSON:** [/api/openapi.json](https://blazesportsintel.com/api/openapi.json)
**YAML:** [/api/openapi.yaml](https://blazesportsintel.com/api/openapi.yaml)

### OpenAPI 3.1 Schema

```yaml
openapi: 3.1.0
info:
  title: Blaze Sports Intel API
  version: 1.0.0
  description: |
    Comprehensive sports data and analytics API covering MLB, NFL, NBA, and College Baseball.
    Includes real-time scores, standings, predictions, and AI-powered insights.
  contact:
    name: Austin Humphrey
    email: austin@blazesportsintel.com
    url: https://blazesportsintel.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://blazesportsintel.com/api
    description: Production server
  - url: https://staging.blazesportsintel.com/api
    description: Staging server

security:
  - ApiKeyAuth: []

components:
  securitySchemes:
    ApiKeyAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Team:
      type: object
      required:
        - teamId
        - teamName
      properties:
        teamId:
          type: integer
          example: 138
        teamName:
          type: string
          example: "St. Louis Cardinals"
        abbreviation:
          type: string
          example: "STL"
        wins:
          type: integer
          example: 82
        losses:
          type: integer
          example: 68
        winPercentage:
          type: number
          format: float
          example: 0.547

    Game:
      type: object
      required:
        - gameId
        - status
        - homeTeam
        - awayTeam
      properties:
        gameId:
          type: string
          example: "717623"
        status:
          type: string
          enum: [Scheduled, In Progress, Final, Postponed]
          example: "Final"
        homeTeam:
          $ref: '#/components/schemas/TeamScore'
        awayTeam:
          $ref: '#/components/schemas/TeamScore'

    TeamScore:
      type: object
      properties:
        teamId:
          type: integer
        teamName:
          type: string
        score:
          type: integer
        hits:
          type: integer
        errors:
          type: integer

    Error:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
          example: "ValidationError"
        message:
          type: string
          example: "Invalid sport parameter"
        code:
          type: string
          example: "INVALID_PARAMETER"
        details:
          type: object

paths:
  /health:
    get:
      summary: Health Check
      description: Check API health and service status
      security: []
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "healthy"
                  timestamp:
                    type: string
                    format: date-time

  /mlb/standings:
    get:
      summary: Get MLB Standings
      description: Returns current standings for all MLB teams
      security: []
      parameters:
        - name: season
          in: query
          schema:
            type: integer
            example: 2025
        - name: division
          in: query
          schema:
            type: string
            example: "AL East"
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  season:
                    type: integer
                  standings:
                    type: array
                    items:
                      $ref: '#/components/schemas/Team'

  /copilot/search:
    post:
      summary: Semantic Search
      description: Search sports data using natural language queries
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - query
                - sport
              properties:
                query:
                  type: string
                  example: "Show me Cardinals pitchers with ERA under 3.50"
                sport:
                  type: string
                  enum: [mlb, nfl, nba, college-baseball]
                limit:
                  type: integer
                  default: 10
      responses:
        '200':
          description: Search results
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
```

---

## Additional Resources

- **Interactive API Explorer:** [blazesportsintel.com/api-docs](https://blazesportsintel.com/api-docs)
- **Postman Collection:** [Download](https://blazesportsintel.com/api/postman.json)
- **SDK Libraries:**
  - JavaScript/TypeScript: `npm install @blazesportsintel/api-client`
  - Python: `pip install blazesportsintel`
  - Go: `go get github.com/ahump20/blazesportsintel-go`

## Support

- **Documentation:** [docs.blazesportsintel.com](https://docs.blazesportsintel.com)
- **GitHub Issues:** [github.com/ahump20/BSI/issues](https://github.com/ahump20/BSI/issues)
- **Email:** austin@blazesportsintel.com
- **Status Page:** [status.blazesportsintel.com](https://status.blazesportsintel.com)

---

**Last Updated:** November 29, 2025
**API Version:** 2.2.0
**Documentation Version:** 2.0.0
