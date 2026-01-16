# BSI Game Backend

Cloudflare Worker backend for the Diamond Sluggers mobile backyard baseball game.

## Features

- **Game Save/Load**: Persistent game progress with D1 database
- **Leaderboards**: Cached high scores with KV namespace
- **Characters**: 12 unique Texas-themed kid players with unlockable abilities
- **Stadiums**: 5 Texas-inspired backyard fields with unique features
- **Match Recording**: Full match history with stats tracking
- **Rate Limiting**: Built-in abuse prevention

## Endpoints

| Method | Path                      | Description              |
| ------ | ------------------------- | ------------------------ |
| `POST` | `/api/game/save`          | Save game progress       |
| `GET`  | `/api/game/load/:userId`  | Load saved game          |
| `GET`  | `/api/leaderboard`        | Get top scores           |
| `POST` | `/api/leaderboard/submit` | Submit high score        |
| `GET`  | `/api/players`            | Get available characters |
| `GET`  | `/api/stadiums`           | Get unlocked stadiums    |
| `POST` | `/api/match/result`       | Record match results     |
| `GET`  | `/health`                 | Health check             |

## Setup

### 1. Create D1 Database

```bash
wrangler d1 create bsi-game-db
```

Update `wrangler.jsonc` with the returned database ID.

### 2. Initialize Schema

```bash
cd workers/bsi-game-backend
wrangler d1 execute bsi-game-db --file=schema.sql
```

### 3. Create R2 Bucket

```bash
wrangler r2 bucket create bsi-game-assets
```

### 4. Deploy

```bash
wrangler deploy
```

## Usage Examples

### Save Game Progress

```bash
curl -X POST https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/game/save \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "MayaThunder",
    "progress": {
      "unlocked_characters": ["maya-thunder", "jackson-rocket"],
      "unlocked_stadiums": ["boerne-backyard"],
      "coins": 1500,
      "total_games": 25,
      "total_wins": 18,
      "season_progress": {
        "current_season": 2,
        "games_played": 10,
        "wins": 7,
        "losses": 3,
        "championship_wins": 1
      }
    }
  }'
```

### Load Game Progress

```bash
curl https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/game/load/550e8400-e29b-41d4-a716-446655440000
```

### Get Leaderboard

```bash
# Top 100 by wins (default)
curl https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/leaderboard

# Top 50 by home runs
curl "https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/leaderboard?category=home_runs&limit=50"
```

### Submit High Score

```bash
curl -X POST https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "category": "wins",
    "score": 50
  }'
```

### Get Characters

```bash
# All characters
curl https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/players

# With unlock status for user
curl "https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/players?userId=550e8400-e29b-41d4-a716-446655440000"
```

### Get Stadiums

```bash
# All stadiums
curl https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/stadiums

# With unlock status for user
curl "https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/stadiums?userId=550e8400-e29b-41d4-a716-446655440000"
```

### Record Match Result

```bash
curl -X POST https://bsi-game-backend.YOUR_SUBDOMAIN.workers.dev/api/match/result \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "opponentType": "cpu",
    "userScore": 7,
    "opponentScore": 3,
    "stadium": "boerne-backyard",
    "matchStats": {
      "hits": 12,
      "homeRuns": 2,
      "strikeouts": 5,
      "innings": 5
    }
  }'
```

## Response Format

All endpoints return JSON with this structure:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-26T12:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-11-26T12:00:00.000Z"
}
```

## Rate Limiting

- 100 requests per minute per client IP
- Include `X-Client-ID` header for consistent rate limiting across devices

## Cloudflare Bindings

| Binding  | Type | Purpose                                 |
| -------- | ---- | --------------------------------------- |
| `DB`     | D1   | Game data, user progress, match history |
| `CACHE`  | KV   | Leaderboard caching, rate limiting      |
| `ASSETS` | R2   | Character sprites, stadium images       |

## Characters

| ID             | Name                       | Unlock  |
| -------------- | -------------------------- | ------- |
| maya-thunder   | Maya Thunder               | Starter |
| jackson-rocket | Jackson "Rocket" Rodriguez | Starter |
| emma-glove     | Emma "Glove" Chen          | Starter |
| tyler-knuckle  | Tyler "Knuckle" Williams   | 5 wins  |
| sophia-spark   | Sophia "Spark" Martinez    | 10 wins |
| marcus-dash    | Marcus "Dash" Johnson      | 15 wins |
| olivia-cannon  | Olivia "Cannon" Lee        | 20 wins |
| carlos-magic   | Carlos "Magic" Garcia      | 25 wins |
| isabella-ice   | Isabella "Ice" Nguyen      | 30 wins |
| ryan-wall      | Ryan "The Wall" Brown      | 35 wins |
| lily-zoom      | Lily "Zoom" Park           | 40 wins |
| diego-fire     | Diego "Fire" Ramirez       | 50 wins |

## Stadiums

| ID                  | Name                     | Unlock  |
| ------------------- | ------------------------ | ------- |
| boerne-backyard     | Boerne Backyard          | Starter |
| san-antonio-lot     | San Antonio Sand Lot     | 8 wins  |
| austin-treehouse    | Austin Treehouse Field   | 15 wins |
| houston-bayou       | Houston Bayou Diamond    | 25 wins |
| dallas-construction | Dallas Construction Site | 40 wins |
