# Baseball Coaching Hub Analytics API Contracts

The `/api/v1/baseball/` namespace powers the Baseball Coaching Hub experience with live probabilistic insights derived from the BlazeSportsIntel data warehouse (Cloudflare D1) and the hot read cache (Cloudflare KV/Redis). Every route is available as both a traditional REST endpoint and a tRPC procedure to support lightweight server components and type-safe clients.

## Shared Characteristics

- **Authentication:** Not required for read-only analytics (subject to future Diamond Pro gating).
- **Content Type:** `application/json`
- **CORS:** Open (`*`) for GET/POST.
- **Rate Limits:** 60 req/min per IP (enforced upstream via Cloudflare).
- **Live Data Freshness:** Cached for 30–60 seconds from the analytics worker. KV acts as the Redis analogue.

## REST Endpoints

### 1. Umpire Zone Probabilities

`GET /api/v1/baseball/umpire-zones`

| Query Param | Type   | Required | Notes |
|-------------|--------|----------|-------|
| `gameId`    | string | ✅       | BlazeSports game identifier. |
| `umpireId`  | string | ✅       | External or internal umpire identifier. |
| `season`    | string | ❌       | Optional NCAA season (defaults to most recent appearance). |

**Response**
```json
{
  "gameId": "48125",
  "umpireId": "ncaa-7821",
  "sampleSize": 196,
  "baselineStrikeProbability": 0.6325,
  "zones": [
    {
      "zone": "inner",
      "calledStrikeProbability": 0.71,
      "chaseRate": 0.39,
      "swingRate": 0.67,
      "sampleSize": 74
    },
    {
      "zone": "outer",
      "calledStrikeProbability": 0.58,
      "chaseRate": 0.31,
      "swingRate": 0.43,
      "sampleSize": 53
    }
  ],
  "confidence": 0.74,
  "updatedAt": "2025-10-20T14:25:03.815Z",
  "source": "derived"
}
```

### 2. Pitcher Workload Risk

`GET /api/v1/baseball/workload-risk`

| Query Param | Type   | Required | Notes |
|-------------|--------|----------|-------|
| `pitcherId` | string | ✅       | Player identifier. |
| `season`    | string | ❌       | Season override (defaults to latest appearance year). |

**Response**
```json
{
  "pitcherId": "91234",
  "season": "2025",
  "workloadIndex": 0.63,
  "riskTier": "medium",
  "recommendedRestDays": 3,
  "rollingAveragePitches": 82,
  "shortRestAppearances": 1,
  "recentAppearances": [
    {
      "gameId": 12044,
      "gameDate": "2025-04-18",
      "pitches": 88,
      "innings": 6.0,
      "strikeouts": 9,
      "walks": 1
    }
  ],
  "seasonTotals": {
    "totalPitches": 1492,
    "totalInnings": 92.2,
    "appearances": 18
  },
  "lastUpdated": "2025-10-20T14:25:03.815Z"
}
```

### 3. Situational Predictions

`GET /api/v1/baseball/situational-predictions`

| Query Param | Type   | Required | Notes |
|-------------|--------|----------|-------|
| `gameId`    | string | ✅       | Game identifier. |
| `inning`    | number | ❌       | Half-inning context (1–18). |
| `outs`      | number | ❌       | 0–2 outs. |
| `baseState` | string | ❌       | `empty`, `runner_on_first`, `runner_on_second`, `runner_on_third`, `runners_on_first_and_second`, `runners_on_corners`, `bases_loaded`. |

**Response**
```json
{
  "gameId": "48125",
  "scenario": "runner_on_first",
  "inning": 7,
  "outs": 1,
  "baseState": "runner_on_first",
  "predictions": [
    {
      "context": "score_next_half_inning",
      "homeTeamProbability": 0.57,
      "awayTeamProbability": 0.43,
      "leverageIndex": 0.66,
      "supportingMetrics": {
        "homeOBP": 0.392,
        "awayOBP": 0.361
      }
    }
  ],
  "confidence": 0.79,
  "generatedAt": "2025-10-20T14:25:03.815Z",
  "modelVersion": "coaching-hub-v1.2.0"
}
```

## tRPC Procedures

All procedures are invoked via `POST /api/v1/baseball/trpc/<procedure>` with a JSON payload. Successful calls return `{ "result": { "data": <payload> } }`. Errors follow `{ "error": { "code": string, "message": string } }`.

| Procedure                 | Input Shape                                                                                  | Output                                   |
|---------------------------|----------------------------------------------------------------------------------------------|------------------------------------------|
| `umpireZones`             | `{ "input": { "gameId": string, "umpireId": string, "season?": string } }`             | `UmpireZoneProbabilityResponse`          |
| `pitcherWorkloadRisk`     | `{ "input": { "pitcherId": string, "season?": string } }`                              | `PitcherWorkloadRiskResponse`            |
| `situationalPredictions`  | `{ "input": { "gameId": string, "inning?": number, "outs?": number, "baseState?": string } }` | `SituationalPredictionsResponse` |

## Data Sources

- **Primary Storage (Postgres equivalent):** Cloudflare D1 `games`, `pitching_stats`, `batting_stats`, and `team_season_stats` tables.
- **Cache Layer (Redis equivalent):** Cloudflare KV namespace `KV` for 30–60 second TTLs.
- **Derivations:** The worker computes probability heuristics using strike%, walk%, recent form, and leverage index from real stat lines—no mock data is used.

## Versioning & Change Management

- Version header `modelVersion` increments with material model updates.
- Breaking field changes require bumping the API path to `/api/v2/baseball/` and updating this document.
- Minor additive fields are backwards compatible and announced via release notes in `/product/ux/specs/baseball-coaching-hub.mdx`.
