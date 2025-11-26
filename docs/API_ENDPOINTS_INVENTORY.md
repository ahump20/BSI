# Comprehensive API Endpoints Inventory - Blaze Sports Intel

## Overview
This document contains ALL API endpoints in the codebase, organized by file location, with HTTP methods, route paths, parameters, and validation details.

---

## 1. MAIN EXPRESS SERVER - `/home/user/BSI/api/server.js`

### Endpoint 1.1: Health Check
**File:** `/home/user/BSI/api/server.js` (lines 96-121)
**Method:** GET
**Route:** `/health`
**Request Params:**
- None
**Response:** 
- status: 'healthy' | 'degraded' | 'unhealthy'
- timestamp: ISO timestamp
- version: '2.0.0'
- features: array
- components: health status breakdown
**Validation:** None specified
**Cache:** no-cache, no-store, must-revalidate

---

### Endpoint 1.2: Team Analytics
**File:** `/home/user/BSI/api/server.js` (lines 124-158)
**Method:** GET
**Route:** `/api/team/:sport/:teamKey/analytics`
**Path Parameters:**
- sport: string (mlb, nfl, nba, ncaa_football, ncaa_baseball)
- teamKey: string (team identifier)
**Query Parameters:** None
**Request Body:** None
**Response:** 
- success: boolean
- data: analytics object
- metadata: generatedAt, dataSource, disclaimer
**Validation:** Implicit - requires sport and teamKey path params
**Cache:** No specific cache header

---

### Endpoint 1.3: Game Prediction
**File:** `/home/user/BSI/api/server.js` (lines 161-198)
**Method:** POST
**Route:** `/api/predict/game`
**Request Body:**
- homeTeam: string (required)
- awayTeam: string (required)
- sport: string (required)
- gameDate?: string (ISO format, optional)
**Validation:**
- Line 165-170: Checks for homeTeam, awayTeam, sport - returns 400 if missing
- Error response includes required fields list
**Response:**
- success: boolean
- data: prediction object
- metadata: methodology, dataSource
**Status Codes:** 200 (success), 400 (missing params), 500 (error)

---

### Endpoint 1.4: Scheduling Optimizer
**File:** `/home/user/BSI/api/server.js` (lines 201-248)
**Method:** POST
**Route:** `/api/v1/scheduling/optimizer`
**Request Body:**
- teamId: string (required)
- conference?: string
- currentMetrics?: object
- futureOpponents: array (required)
- userTier?: string
- iterations?: number
- deterministic?: boolean
**Validation:**
- Line 205-210: Checks for teamId and futureOpponents array
- Returns 400 with required fields if missing
**Response:**
- success: boolean
- data: projection/forecast
- tierAccess: tier info and unlocked features
- performance: computeMs, totalMs, cached flags
- upgradeMessage: optional message
**Status Codes:** 200 (success), 400 (missing params), 500 (error)

---

### Endpoint 1.5: Player Performance Prediction
**File:** `/home/user/BSI/api/server.js` (lines 252-288)
**Method:** POST
**Route:** `/api/predict/player`
**Request Body:**
- playerId: string (required)
- sport: string (required)
- gameContext?: object
**Validation:**
- Line 256-261: Checks for playerId and sport
- Returns 400 with required fields if missing
**Response:**
- success: boolean
- data: prediction object
- metadata: methodology, dataSource
**Status Codes:** 200 (success), 400 (missing params), 500 (error)

---

### Endpoint 1.6: ML Model Training
**File:** `/home/user/BSI/api/server.js` (lines 291-313)
**Method:** POST
**Route:** `/api/ml/train`
**Request Body:**
- modelTypes?: array
**Validation:** None (optional modelTypes)
**Response:**
- success: boolean
- data: training results
- metadata: startedAt, note
**Status Codes:** 200 (success), 500 (error)

---

### Endpoint 1.7: Enhanced Team Data
**File:** `/home/user/BSI/api/server.js` (lines 316-342)
**Method:** GET
**Route:** `/api/team/:sport/:teamKey`
**Path Parameters:**
- sport: string (mlb, nfl, nba, ncaa_football, ncaa_baseball)
- teamKey: string
**Response:**
- success: boolean
- data: team data with analytics
- metadata: generatedAt, dataSource
**Status Codes:** 200 (success), 500 (error)

---

### Endpoint 1.8: API Documentation
**File:** `/home/user/BSI/api/server.js` (lines 345-370)
**Method:** GET
**Route:** `/api/docs`
**Response:**
- service: 'Blaze Intelligence API'
- version: '2.0.0'
- description: string
- endpoints: object with all available endpoints
- supportedSports: array
- features: array
- rateLimit: string
**Validation:** None

---

### Endpoint 1.9: Root/Home
**File:** `/home/user/BSI/api/server.js` (lines 373-381)
**Method:** GET
**Route:** `/`
**Response:**
- message: string
- version: string
- status: 'running'
- documentation: '/api/docs'
- health: '/health'
**Validation:** None

---

## 2. CLOUDFLARE PAGES FUNCTIONS - `/home/user/BSI/functions/api`

### Endpoint 2.1: Health Check (Cloudflare)
**File:** `/home/user/BSI/functions/api/health.js` (lines 6-121)
**Method:** GET
**Route:** `/api/health`
**Response:**
- status: 'healthy' | 'degraded' | 'unhealthy'
- timestamp: ISO
- platform: 'Blaze Sports Intel'
- version: '2.1.0'
- environment: production/development
- responseTime: string
- checks: array of dependency checks
- summary: {total, healthy, degraded, unhealthy}
**Validation:** None
**Cache:** no-cache, no-store, must-revalidate
**Checks Performed:**
- MLB Stats API
- SportsDataIO
- Cloudflare KV

---

### Endpoint 2.2: Analytics
**File:** `/home/user/BSI/functions/api/analytics.js` (lines 1-25)
**Method:** GET, POST, OPTIONS
**Route:** `/api/analytics`
**Validation:** 
- OPTIONS handler for CORS
**Response:**
- message: 'Analytics endpoint ready'
- timestamp: ISO
- sports: array

---

### Endpoint 2.3: Chat (Claude Integration)
**File:** `/home/user/BSI/functions/api/chat.js` (lines 2-122)
**Method:** POST, OPTIONS
**Route:** `/api/chat`
**Request Body:**
- message: string (required)
- conversationHistory?: array
**Validation:**
- Line 26-31: Checks for message presence
- Returns 400 if missing
- Only POST allowed (405 for other methods)
**Response:**
- message: string
- conversationId: string
**Status Codes:** 200 (success), 400 (missing params), 405 (wrong method), 500 (error)

---

### Endpoint 2.4: Championship Data
**File:** `/home/user/BSI/functions/api/championship.js` (lines 7-215)
**Method:** GET, OPTIONS
**Route:** `/api/championship`
**Response:**
- timestamp: ISO
- brand: "Deep South Sports Authority"
- tagline: string
- featuredTeams: object with cardinals, titans, grizzlies, longhorns
- pipeline: perfect game and high school data
- analytics: championship intelligence metrics
- liveGames: array
- nextGames: array
- sources: data attribution
**Validation:** None

---

### Endpoint 2.5: College Baseball Games
**File:** `/home/user/BSI/functions/api/college-baseball/games.js` (lines 13-112)
**Method:** GET, OPTIONS
**Route:** `/api/college-baseball/games`
**Query Parameters:**
- date?: string (YYYY-MM-DD format, defaults to today)
- conference?: string
- status?: string ('live', 'scheduled', 'final')
- team?: string
**Cache Keys:** `college-baseball:games:${date}:${conference||'all'}:${status||'all'}:${team||'all'}`
**Cache TTL:** 30 seconds (live games), 5 minutes (scheduled)
**Response:**
- success: boolean
- data: array of games
- count: number
- cached: boolean
- timestamp: ISO
- source: 'cache' | 'live'
**Validation:** Query params validated for format
**Cache-Control:** `public, max-age=30/300, stale-while-revalidate`

---

### Endpoint 2.6: College Baseball Teams
**File:** `/home/user/BSI/functions/api/college-baseball/teams.js` (lines 13-100)
**Method:** GET, OPTIONS
**Route:** `/api/college-baseball/teams`
**Query Parameters:**
- search?: string
- conference?: string
**Cache Keys:** `college-baseball:teams:${search}:${conference}`
**Cache TTL:** 300 seconds (5 minutes)
**Response:**
- success: boolean
- teams: array
- count: number
- cached: boolean
- timestamp: ISO
**Validation:** None specified
**Cache-Control:** `public, max-age=300, stale-while-revalidate=60`

---

### Endpoint 2.7: Live Scores (Multi-Sport)
**File:** `/home/user/BSI/functions/api/live-scores.js` (lines 17-207)
**Method:** GET, OPTIONS
**Route:** `/api/live-scores`
**Query Parameters:**
- sport?: string ('all', 'mlb', 'nfl', 'nba', 'ncaa', 'ncaa-baseball') - default 'all'
- date?: string (YYYY-MM-DD format)
**Validation:**
- Line 30-36: Validates sport parameter
- Returns 400 if unsupported sport
**Response:**
- timestamp: ISO
- date: string
- cached_at: number
- sports: object with sport data
  - mlb: {games: array}
  - nfl: {week: number, games: array}
  - nba: {games: array}
  - ncaa: {football: {week, games}}
  - ncaaBaseball: {games: array, meta: {...}}
**Cache TTL:** 60 seconds (1 minute)
**Cache-Control:** `public, max-age=60`

---

### Endpoint 2.8: MLB Scores
**File:** `/home/user/BSI/functions/api/mlb/scores.js` (lines 10-193)
**Method:** GET
**Route:** `/api/mlb/scores`
**Query Parameters:**
- date?: string (YYYY-MM-DD format, defaults to current date)
- team?: string (optional team abbreviation filter)
**Cache Keys:** `mlb:scores:${date}:${teamFilter||'all'}`
**Cache TTL:** 30 seconds (live), 5 minutes (no live)
**Response:**
- league: 'MLB'
- season: '2025'
- date: string
- live: boolean
- games: array with:
  - id, date, gameType, season
  - status: {state, detailedState, statusCode, inning, inningState, isLive, isFinal}
  - teams: {away: {...}, home: {...}}
  - venue: {id, name}
  - linescore: {...}
  - pitchers: {winning, losing, save}
  - broadcasts: array
  - weather: object
- meta: {dataSource, lastUpdated, timezone, cacheTTL}
**Validation:** 
- Date format validation
- Team abbreviation validation (if provided)
**Status Codes:** 200 (success), 500 (error)

---

### Endpoint 2.9: NFL Scores
**File:** `/home/user/BSI/functions/api/nfl/scores.js` (lines 10-179)
**Method:** GET
**Route:** `/api/nfl/scores`
**Query Parameters:**
- week?: string ('current' or week number)
- team?: string (optional team abbreviation)
**Cache Keys:** `nfl:scores:${week}:${teamFilter||'all'}`
**Cache TTL:** 30 seconds
**Response:**
- league: 'NFL'
- season: '2025'
- week: number
- live: boolean
- games: array with:
  - id, uid, date, name, shortName
  - week, season
  - status: {type, state, completed, detail, period, clock, isFinal, isLive}
  - teams: {away: {...}, home: {...}}
  - venue: {name, city, state}
  - broadcast: string
  - odds: object
  - weather: object
  - link: string
- meta: {dataSource, lastUpdated, timezone, cacheTTL}
**Validation:** 
- Week validation
- Team abbreviation validation
**Status Codes:** 200, 500

---

### Endpoint 2.10: NBA Scores
**File:** `/home/user/BSI/functions/api/nba/scores.js` (lines 10-173)
**Method:** GET
**Route:** `/api/nba/scores`
**Query Parameters:**
- date?: string (YYYYMMDD format)
- team?: string (optional team abbreviation)
**Cache Keys:** `nba:scores:${date||'current'}:${teamFilter||'all'}`
**Cache TTL:** 30 seconds
**Response:**
- league: 'NBA'
- season: '2025-26'
- date: string or 'today'
- live: boolean
- games: array with detailed game data
- meta: {dataSource, lastUpdated, timezone, cacheTTL}
**Validation:**
- Date format validation
- Team abbreviation validation
**Status Codes:** 200, 500

---

### Endpoint 2.11: Monte Carlo Simulations
**File:** `/home/user/BSI/functions/api/monte-carlo.js` (lines 7-123)
**Method:** GET, POST, OPTIONS
**Route:** `/api/monte-carlo`
**Query Parameters:**
- simulations?: number (default 1000)
- sport?: string ('baseball', 'football', 'basketball') - default 'baseball'
- scenario?: string (default 'championship')
**Validation:**
- Sport validation against supported sports
**Response:**
- platform: string
- analysis: championship analysis object
- detailedResults: array (first 10)
- summary: {totalSimulations, wins, losses, winRate, confidenceLevel}
- timestamp: ISO
- processingTime: string
**Status Codes:** 200, 500

---

### Endpoint 2.12: Metrics
**File:** `/home/user/BSI/functions/api/metrics.js` (lines 37-143)
**Method:** GET
**Route:** `/api/metrics`
**Query Parameters:**
- reset?: boolean ('true' to reset metrics - requires auth in production)
**Headers (if reset=true):**
- Authorization: Bearer token (required in production)
**Response:**
- platform: 'Blaze Sports Intel'
- version: '2.1.0'
- environment: string
- timestamp: ISO
- uptime: {hours, minutes, formatted}
- metrics: {requests, cache, errors, performance}
- meta: {startTime, lastReset}
**Validation:**
- Line 44-49: Auth check for reset functionality
**Status Codes:** 200 (success), 401 (unauthorized for reset)

---

### Endpoint 2.13: Simulations by Sport
**File:** `/home/user/BSI/functions/api/simulations/[sport].ts` (lines 14-77)
**Method:** GET, OPTIONS
**Route:** `/api/simulations/:sport`
**Path Parameters:**
- sport: string ('sec', 'nfl', 'mlb', 'all')
**Validation:**
- Line 46-62: Sport validation
- Returns 400 for invalid sport
**Response:**
- sec/nfl/mlb: filtered simulation data
- metadata: simulation metadata
- error: if invalid sport
**Status Codes:** 200 (success), 400 (invalid sport), 500 (error)
**Cache-Control:** `public, max-age=3600` (1 hour)

---

### Endpoint 2.14: Live Sports Data (Multi-Route)
**File:** `/home/user/BSI/functions/api/live/[[route]].ts` (lines 139-1069)
**Method:** GET, OPTIONS
**Routes:**
- `/api/live/ncaa/football` - NCAA Football Rankings
- `/api/live/ncaa/baseball` - NCAA Baseball Live Stream
- `/api/live/mlb/scores` - MLB Live Scores
- `/api/live/nfl/scores` - NFL Live Scores
- `/api/live/nba/scores` - NBA Live Scores
- `/api/live/all/scores` - All Sports Aggregated

#### 2.14.1: NCAA Football Rankings
**Query Parameters:**
- year?: string (default '2025')
- week?: string
**Response:**
- success: boolean
- sport: 'ncaa-football'
- season: string
- week: string
- rankings: array of ranking objects
- meta: {dataSource, lastUpdated, timezone, totalTeams}
**Cache TTL:** 300 seconds (5 minutes)

#### 2.14.2: NCAA Baseball Live Stream
**Query Parameters:**
- gameId: string (required)
- sequence?: number (optional - for resuming stream)
**Validation:**
- gameId required (400 if missing)
- sequence must be non-negative number
**Response:**
- success: boolean
- sport: 'ncaa-baseball'
- gameId: string
- sequence: number
- frames: array of live frame updates
- innings: array of inning snapshots
- meta: {dataSource, lastUpdated, delivered, cacheHit}
**Status Codes:** 200 (success), 400 (validation error), 500 (error)

#### 2.14.3: MLB Live Scores
**Query Parameters:**
- date?: string (YYYY-MM-DD format)
**Response:**
- success: boolean
- sport: 'mlb'
- date: string
- games: array
- meta: {dataSource, lastUpdated, timezone, totalGames}
**Cache TTL:** 30 seconds

#### 2.14.4: NFL Live Scores
**Query Parameters:**
- season?: string (default '2025')
- week?: string (default 'current')
**Response:**
- success: boolean
- sport: 'nfl'
- season: string
- week: string
- games: array
- meta: {dataSource, lastUpdated, timezone, totalGames}

#### 2.14.5: NBA Live Scores
**Query Parameters:**
- date?: string (YYYY-MM-DD format)
**Response:**
- success: boolean
- sport: 'nba'
- date: string
- games: array
- meta: {dataSource, lastUpdated, timezone, totalGames}

#### 2.14.6: All Sports Aggregated
**Query Parameters:**
- date?: string
**Response:**
- success: boolean
- date: string
- games: array (aggregated from all sports)
- meta: {dataSource, lastUpdated, timezone, totalGames}

---

### Endpoint 2.15: Copilot - Games Database Query
**File:** `/home/user/BSI/functions/api/copilot/games.ts` (lines 81-325)
**Method:** GET, POST, OPTIONS
**Route:** `/api/copilot/games`
**Query Parameters:**
- sport?: string (default 'all')
- date?: string (YYYY-MM-DD format)
- dateFrom?: string (YYYY-MM-DD format)
- dateTo?: string (YYYY-MM-DD format)
- teamId?: number
- teamKey?: string
- status?: string ('Scheduled', 'InProgress', 'Final')
- season?: number
- week?: number (for NFL/CFB)
**Validation:**
- Sport validation (line 150-152)
- Date format validation
- Team filter validation
- Status validation
- Season/Week validation (numeric)
**Response:**
- sport: string
- date: string|null
- team: string|null
- status: string|null
- season: number|null
- count: number
- games: array of game records
- gamesByDate?: array
- gamesBySport?: array
- liveGamesCount: number
- completedGamesCount: number
- scheduledGamesCount: number
- timestamp: ISO
- source: 'database' | 'cache'
- responseTime: string
- performance: {queryTime, totalTime, cacheTTL}
**Cache TTL:**
- 300 seconds (5 minutes) if live games
- 3600 seconds (1 hour) if no live games
**Status Codes:** 200 (success), 500 (error)

---

### Endpoint 2.16: Copilot - Semantic Search
**File:** `/home/user/BSI/functions/api/copilot/search.ts` (lines 76-369)
**Method:** GET, POST, OPTIONS
**Route:** `/api/copilot/search`
**Query Parameters (GET):**
- query: string (required, or 'q' alias)
- sport?: string
- topK?: number (default 10, max 50)
- minRelevance?: number (default 0.5, range 0-1)

**Request Body (POST):**
```json
{
  "query": "string (required)",
  "sport": "string (optional)",
  "topK": "number (optional, 1-50)",
  "minRelevance": "number (optional, 0-1)"
}
```

**Validation:**
- Query required, min length > 0 (400 if missing)
- Sport validation against known sports
- topK clamped to 1-50
- minRelevance validated as 0-1 range

**Response:**
- query: string
- sport: string|null
- resultsCount: number
- results: array of game results with:
  - id, sport, game_date
  - home_team_name, away_team_name
  - home_score, away_score, status
  - stadium_name
  - relevanceScore: number (0-1)
  - matchReason?: string
- embeddingGenerated: boolean
- vectorSearchCompleted: boolean
- timestamp: ISO
- performance: {embeddingTime, vectorSearchTime, databaseLookupTime, totalTime}
- cached?: boolean (if cache hit)
- cacheAge?: string (if cache hit)

**Cache TTL:** 180 seconds (3 minutes)
**Status Codes:** 200 (success), 400 (validation error), 500 (error)

---

### Endpoint 2.17: Copilot - Health Check
**File:** `/home/user/BSI/functions/api/copilot/health.ts` (lines 29-258)
**Method:** GET
**Route:** `/api/copilot/health`
**Response:**
- status: 'healthy' | 'degraded' | 'unhealthy'
- timestamp: ISO
- platform: 'Blaze Sports Intel Copilot'
- version: '2.0.0 - Phase 2 AI Integration'
- responseTime: string
- checks: array of health check objects
- summary: {total, healthy, degraded, unhealthy}
- ready_for_production: boolean
- phase2_features: {semantic_search, rag_insights, embedding_generation, vector_search, ai_chat}

**Checks Performed:**
1. D1 Database (teams and games count)
2. KV Namespace (read/write test)
3. R2 Bucket (accessibility)
4. Vectorize Index (query capability)
5. Workers AI - Embeddings (bge-base-en-v1.5)
6. Workers AI - LLM (llama-3.1-8b-instruct)

**Status Codes:**
- 200: healthy
- 503: degraded
- 500: unhealthy

---

### Endpoint 2.18: Copilot - Teams Query
**File:** `/home/user/BSI/functions/api/copilot/teams.ts` (lines 36-159)
**Method:** GET
**Route:** `/api/copilot/teams`
**Query Parameters:**
- sport?: string (default 'all')
- conference?: string
- division?: string

**Validation:**
- Sport validation
- Conference validation
- Division validation

**Response:**
- sport: string
- filters: {conference: string|null, division: string|null}
- count: number
- teams: array of team records
- teamsBySport: object grouped by sport
- sportBreakdown: array with sport, count, conferences
- timestamp: ISO
- source: 'database' | 'cache'
- responseTime: string

**Cache TTL:** 3600 seconds (1 hour)
**Status Codes:** 200 (success), 500 (error)

---

### Endpoint 2.19: Copilot - RAG Insights
**File:** `/home/user/BSI/functions/api/copilot/insight.ts` (lines 77-447)
**Method:** GET, POST, OPTIONS
**Route:** `/api/copilot/insight`

**Query Parameters (GET):**
- question: string (required, or 'q' alias)
- sport?: string
- maxContext?: number
- tone?: 'coaching' | 'analyst' | 'casual'

**Request Body (POST):**
```json
{
  "question": "string (required)",
  "sport": "string (optional)",
  "maxContext": "number (optional)",
  "tone": "'coaching' | 'analyst' | 'casual' (optional)"
}
```

**Validation:**
- Question required, min length > 0 (400 if missing)
- Sport validation
- maxContext validated (default 5)
- Tone validated against allowed values

**Response:**
- question: string
- insight: string (generated by LLM)
- sources: array of game context objects
- confidence: number (0-1)
- sport: string|null
- tone: string
- timestamp: ISO
- performance: {embeddingTime, vectorSearchTime, contextExtractionTime, llmGenerationTime, totalTime}
- cached?: boolean
- cacheAge?: string

**Process:**
1. Generate embedding of question
2. Search Vectorize for relevant games
3. Extract game context from D1
4. Generate insight using LLM
5. Calculate confidence score

**Cache TTL:** 300 seconds (5 minutes)
**Status Codes:** 200 (success), 400 (validation error), 404 (no results), 500 (error)

---

### Endpoint 2.20: Sports Data Integration
**File:** `/home/user/BSI/functions/api/sports-data.js` (lines 9-70)
**Method:** GET, POST, OPTIONS
**Routes:**
- `/api/sports-data/mlb` - MLB data
- `/api/sports-data/nfl` - NFL data
- `/api/sports-data/nba` - NBA data
- `/api/sports-data/ncaa` - NCAA data
- `/api/sports-data/perfect-game` - Perfect Game data
- `/api/sports-data/texas-hs` - Texas HS Football data
- `/api/sports-data/championship` - Championship dashboard

**Query Parameters:** None specified per route

**Response:** Sport-specific data objects

**Cache Control:** `public, max-age=300` (5 minutes)

---

## 3. NEXT.JS APP ROUTES - `/home/user/BSI/apps/web/app/api`

### Endpoint 3.1: Baseball Games (Next.js Edge Function)
**File:** `/home/user/BSI/apps/web/app/api/v1/baseball/games/route.ts` (lines 75-167)
**Method:** GET
**Route:** `/api/v1/baseball/games`

**Query Parameters:**
- league?: string (default 'ncaab')
- date?: string (YYYY-MM-DD format)
- conference?: string

**Validation:**
- League validation (default ncaab)
- Date format validation
- Conference validation

**Request Headers:**
- Authorization: Bearer token (if configured)
- Accept: application/json

**Response:**
- games: array of game objects
- fetchedAt: ISO timestamp (from upstream or current)
- ttlSeconds: number (min 15, max 60, default 45)
- source: 'cloudflare-worker' (default)

**Upstream Routing:**
- Resolves base URL from environment variables:
  - `CLOUDFLARE_INFERENCE_BASE_URL` or `BASEBALL_INFERENCE_BASE_URL`
  - Falls back to `INTERIM_NODE_SERVICE_BASE_URL` or `BASEBALL_INTERIM_NODE_BASE_URL`

**Error Handling:**
- 500: Base URL not configured
- 502: Upstream error (not 404)
- 504: Request timeout (4500ms)
- 500: Other errors

**Cache-Control:** Dynamic based on TTL from response

**Status Codes:** 200 (success), 500 (config error), 502 (upstream error), 504 (timeout)

---

## SUMMARY TABLE

| Endpoint | Method | Route | Validation | Cache TTL |
|----------|--------|-------|-----------|-----------|
| Health | GET | `/health` | None | No cache |
| Team Analytics | GET | `/api/team/:sport/:teamKey/analytics` | Path params | None |
| Game Prediction | POST | `/api/predict/game` | Required body fields | None |
| Scheduling Optimizer | POST | `/api/v1/scheduling/optimizer` | Required fields | None |
| Player Prediction | POST | `/api/predict/player` | Required fields | None |
| ML Training | POST | `/api/ml/train` | None | None |
| Team Data | GET | `/api/team/:sport/:teamKey` | Path params | None |
| API Docs | GET | `/api/docs` | None | None |
| Health (CF) | GET | `/api/health` | None | No cache |
| Analytics | GET | `/api/analytics` | None | None |
| Chat | POST | `/api/chat` | Message required | None |
| Championship | GET | `/api/championship` | None | 5 min |
| CB Games | GET | `/api/college-baseball/games` | Query params | 30s-5m |
| CB Teams | GET | `/api/college-baseball/teams` | Query params | 5 min |
| Live Scores | GET | `/api/live-scores` | Sport validation | 1 min |
| MLB Scores | GET | `/api/mlb/scores` | Date/team | 30s-5m |
| NFL Scores | GET | `/api/nfl/scores` | Week/team | 30s |
| NBA Scores | GET | `/api/nba/scores` | Date/team | 30s |
| Monte Carlo | GET | `/api/monte-carlo` | Sport validation | 1 min |
| Metrics | GET | `/api/metrics` | Auth (reset only) | No cache |
| Simulations | GET | `/api/simulations/:sport` | Sport validation | 1 hour |
| Live Multi | GET | `/api/live/:sport/:action` | Sport/action | 30s-5m |
| Copilot Games | GET | `/api/copilot/games` | Query params | 5m-1h |
| Copilot Search | GET/POST | `/api/copilot/search` | Query required | 3 min |
| Copilot Health | GET | `/api/copilot/health` | None | No cache |
| Copilot Teams | GET | `/api/copilot/teams` | None | 1 hour |
| Copilot Insight | GET/POST | `/api/copilot/insight` | Question required | 5 min |
| Sports Data | GET | `/api/sports-data/*` | None | 5 min |
| Baseball (Next.js) | GET | `/api/v1/baseball/games` | Query params | Dynamic |

---

## VALIDATION GAPS - ENDPOINTS NEEDING SCHEMAS

The following endpoints currently have LIMITED or NO input validation and should have validation schemas implemented:

1. `/api/team/:sport/:teamKey/analytics` - Path params validation missing
2. `/api/team/:sport/:teamKey` - Path params validation missing
3. `/api/college-baseball/games` - Query param validation incomplete
4. `/api/college-baseball/teams` - Query param validation incomplete
5. `/api/live-scores` - Sport enum validation exists, but could be enhanced
6. `/api/mlb/scores` - Date format validation missing
7. `/api/nfl/scores` - Week format validation missing
8. `/api/nba/scores` - Date format validation missing
9. `/api/monte-carlo` - Sport validation incomplete
10. `/api/simulations/:sport` - Sport validation exists, but could be enhanced
11. `/api/live/ncaa/football` - Year/week validation missing
12. `/api/live/ncaa/baseball` - GameId validation missing, sequence validation incomplete
13. `/api/live/mlb/scores` - Date format validation missing
14. `/api/live/nfl/scores` - Season/week format validation missing
15. `/api/live/nba/scores` - Date format validation missing
16. `/api/copilot/games` - Comprehensive param validation needed
17. `/api/copilot/search` - Query validation exists, could be enhanced
18. `/api/copilot/teams` - Param validation missing
19. `/api/copilot/insight` - Question validation exists, could be enhanced
20. `/api/v1/baseball/games` - Query param validation incomplete

