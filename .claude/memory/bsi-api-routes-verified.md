# BSI Verified API Routes (March 2026)

Base URL: `https://blazesportsintel.com`

## Scores (sport-specific — NOT generic /api/scores/{sport})
- GET /api/college-baseball/scores
- GET /api/mlb/scores
- GET /api/nfl/scores
- GET /api/cfb/scores
- GET /api/nba/scores
- GET /api/scores/overview — cross-sport summary
- GET /api/scores/cached — cached cross-sport (primary for "All" tab)

## Articles & Editorial
- GET /api/blog-post-feed — list (title, slug, sport, excerpt, publishedAt, heroImage)
- GET /api/blog-post-feed/:slug — full article
- GET /api/college-baseball/editorial/list
- GET /api/college-baseball/news
- GET /api/news/:sport

## Analytics
- GET /api/predictions
- GET /api/predictions/accuracy
- GET /api/savant/batting/leaderboard
- GET /api/savant/pitching/leaderboard
- GET /api/savant/player/:id
- GET /api/analytics/mmi/trending
- GET /api/analytics/havf/leaderboard

## Teams & Standings
- GET /api/college-baseball/standings
- GET /api/cfb/standings
- GET /api/nfl/standings
- GET /api/nba/standings
- GET /api/college-baseball/teams/:teamId/sabermetrics
- GET /api/teams/:league

## Game Detail (sport-specific)
- GET /api/college-baseball/game/:gameId
- GET /api/cfb/game/:gameId
- GET /api/nfl/game/:gameId

## Players
- GET /api/college-baseball/players/:playerId
- GET /api/college-baseball/players/:playerId/game-log
- GET /api/college-baseball/players/:playerId/scouting-report
- GET /api/nfl/players/:playerId
- GET /api/cfb/players/:playerId

## Search
- GET /api/search

## Auth
- POST /api/auth/login
- POST /api/auth/signup
- POST /api/auth/validate
