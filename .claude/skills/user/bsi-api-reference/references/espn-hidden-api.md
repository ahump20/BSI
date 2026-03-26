# ESPN Hidden API Reference

ESPN's undocumented APIs power their website and apps. No authentication required. Subject to change without notice.

## Base URLs

- **Site API:** `https://site.api.espn.com`
- **Core API:** `https://sports.core.api.espn.com`
- **Web API:** `https://site.web.api.espn.com`
- **CDN:** `https://cdn.espn.com`

---

## NFL Endpoints

### Scoreboard & Schedule
```
GET /apis/site/v2/sports/football/nfl/scoreboard
GET /apis/site/v2/sports/football/nfl/scoreboard?dates=YYYYMMDD
GET /apis/site/v2/sports/football/nfl/scoreboard?week=1&seasontype=2&season=2024
```

### Teams
```
GET /apis/site/v2/sports/football/nfl/teams
GET /apis/site/v2/sports/football/nfl/teams/{teamId}
GET /apis/site/v2/sports/football/nfl/teams/{teamId}?enable=roster,schedule,stats
GET /apis/site/v2/sports/football/nfl/teams/{teamId}/roster
GET /apis/site/v2/sports/football/nfl/teams/{teamId}/schedule?season=2024
```

### Athletes
```
GET /apis/common/v3/sports/football/nfl/athletes/{athleteId}/overview
GET /apis/common/v3/sports/football/nfl/athletes/{athleteId}/gamelog
GET /apis/common/v3/sports/football/nfl/athletes/{athleteId}/splits
```

Core API athletes:
```
GET /v2/sports/football/leagues/nfl/seasons/{year}/athletes/{id}/eventlog
GET /v2/sports/football/leagues/nfl/athletes/{id}/statisticslog
GET /v3/sports/football/nfl/athletes?limit=20000&active=true
```

### Game Details
```
GET /apis/site/v2/sports/football/nfl/summary?event={gameId}
```

Core API game data:
```
GET /v2/sports/football/leagues/nfl/events/{eventId}/competitions/{eventId}/plays?limit=500
GET /v2/sports/football/leagues/nfl/events/{eventId}/competitions/{eventId}/drives
GET /v2/sports/football/leagues/nfl/events/{eventId}/competitions/{eventId}/probabilities?limit=500
GET /v2/sports/football/leagues/nfl/events/{eventId}/competitions/{eventId}/odds
```

CDN endpoints (append `?xhr=1`):
```
GET /core/nfl/scoreboard?xhr=1
GET /core/nfl/boxscore?xhr=1&gameId={gameId}
GET /core/nfl/playbyplay?xhr=1&gameId={gameId}
GET /core/nfl/schedule?xhr=1&year=2024&week=1
```

### Standings & Leaders
```
GET /apis/site/v2/sports/football/nfl/standings
GET /apis/site/v3/sports/football/nfl/leaders?season=2024&seasontype=2
```

Core API:
```
GET /v2/sports/football/leagues/nfl/seasons/{year}/types/{seasontype}/groups/{groupId}/standings
GET /v2/sports/football/leagues/nfl/seasons/{year}/types/{seasontype}/leaders
```

### News & Injuries
```
GET /apis/site/v2/sports/football/nfl/news?limit=50
GET /apis/site/v2/sports/football/nfl/news?team={teamId}
GET /v2/sports/football/leagues/nfl/teams/{teamId}/injuries
```

### Draft & Transactions
```
GET /v2/sports/football/leagues/nfl/seasons/{year}/draft
GET /v2/sports/football/leagues/nfl/transactions
GET /v2/sports/football/leagues/nfl/seasons/{year}/freeagents
```

### Depth Charts
```
GET /v2/sports/football/leagues/nfl/seasons/{year}/teams/{teamId}/depthcharts
```

---

## College Football Endpoints

### Scoreboard
```
GET /apis/site/v2/sports/football/college-football/scoreboard
GET /apis/site/v2/sports/football/college-football/scoreboard?dates=YYYYMMDD
GET /apis/site/v2/sports/football/college-football/scoreboard?groups=80  # FBS only
GET /apis/site/v2/sports/football/college-football/scoreboard?groups=8   # SEC
GET /apis/site/v2/sports/football/college-football/scoreboard?week=5&seasontype=2
```

**Conference Group IDs:**
- 80 = FBS (all)
- 1 = ACC
- 4 = Big 12
- 5 = Big Ten
- 8 = SEC
- 9 = Pac-12
- 151 = AAC
- 17 = Conference USA
- 18 = MAC
- 15 = Mountain West
- 37 = Sun Belt
- 81 = FCS

### Rankings
```
GET /apis/site/v2/sports/football/college-football/rankings
```

### Teams & Game Summary
```
GET /apis/site/v2/sports/football/college-football/teams
GET /apis/site/v2/sports/football/college-football/teams/{teamAbbrev}  # e.g., "tex" for Texas
GET /apis/site/v2/sports/football/college-football/summary?event={gameId}
```

### News
```
GET /apis/site/v2/sports/football/college-football/news
```

---

## MLB Endpoints

### Scoreboard
```
GET /apis/site/v2/sports/baseball/mlb/scoreboard
GET /apis/site/v2/sports/baseball/mlb/scoreboard?dates=YYYYMMDD
```

### Teams
```
GET /apis/site/v2/sports/baseball/mlb/teams
GET /apis/site/v2/sports/baseball/mlb/teams/{teamId}
```

### Athletes
```
GET /apis/common/v3/sports/baseball/mlb/athletes/{athleteId}
GET /apis/common/v3/sports/baseball/mlb/athletes/{athleteId}/overview
GET /apis/common/v3/sports/baseball/mlb/athletes/{athleteId}/gamelog
```

### News
```
GET /apis/site/v2/sports/baseball/mlb/news
```

---

## College Baseball Endpoints

### Scoreboard
```
GET /apis/site/v2/sports/baseball/college-baseball/scoreboard
GET /apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=YYYYMMDD
```

### Teams
```
GET /apis/site/v2/sports/baseball/college-baseball/teams
```

---

## NBA Endpoints

### Scoreboard
```
GET /apis/site/v2/sports/basketball/nba/scoreboard
GET /apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
```

### Teams
```
GET /apis/site/v2/sports/basketball/nba/teams
GET /apis/site/v2/sports/basketball/nba/teams/{teamId}
```

### Athletes
```
GET /apis/common/v3/sports/basketball/nba/athletes/{athleteId}/overview
GET /apis/common/v3/sports/basketball/nba/athletes/{athleteId}/gamelog
GET /apis/common/v3/sports/basketball/nba/athletes/{athleteId}/splits
```

### Standings & News
```
GET /apis/site/v2/sports/basketball/nba/standings
GET /apis/site/v2/sports/basketball/nba/news
```

---

## College Basketball Endpoints

### Men's
```
GET /apis/site/v2/sports/basketball/mens-college-basketball/scoreboard
GET /apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups={confId}
GET /apis/site/v2/sports/basketball/mens-college-basketball/teams
GET /apis/site/v2/sports/basketball/mens-college-basketball/rankings
GET /apis/site/v2/sports/basketball/mens-college-basketball/news
```

### Women's
```
GET /apis/site/v2/sports/basketball/womens-college-basketball/scoreboard
GET /apis/site/v2/sports/basketball/womens-college-basketball/teams
GET /apis/site/v2/sports/basketball/womens-college-basketball/news
```

---

## NHL Endpoints

```
GET /apis/site/v2/sports/hockey/nhl/scoreboard
GET /apis/site/v2/sports/hockey/nhl/teams
GET /apis/site/v2/sports/hockey/nhl/standings
GET /apis/site/v2/sports/hockey/nhl/news
```

---

## Betting & Odds Endpoints (Core API)

```
GET /v2/sports/football/leagues/nfl/events/{eventId}/competitions/{eventId}/odds
GET /v2/sports/football/leagues/nfl/events/{eventId}/competitions/{eventId}/odds/{providerId}
GET /v2/sports/football/leagues/nfl/events/{eventId}/competitions/{eventId}/odds/{providerId}/history/0/movement?limit=100
GET /v2/sports/football/leagues/nfl/events/{eventId}/competitions/{eventId}/predictor
GET /v2/sports/football/leagues/nfl/seasons/{year}/futures
GET /v2/sports/football/leagues/nfl/seasons/{year}/types/{seasontype}/teams/{teamId}/ats
```

**Betting Provider IDs:**
- 38 = Caesars
- 31 = William Hill  
- 2000 = Bet365
- 25 = Westgate
- 1001 = Accuscore
- 1004 = Consensus

---

## General/Utility Endpoints

### Sports & Leagues List
```
GET /apis/site/v2/sports
GET /apis/site/v2/sports/football
GET /apis/site/v2/sports/basketball
```

### Search
```
GET /apis/common/v3/search?query={term}&limit=10&mode=prefix
GET /apis/search/v2?query={term}&limit=100
```

### Calendar
```
GET /v2/sports/football/leagues/nfl/calendar/ondays
GET /v2/sports/football/leagues/nfl/calendar/offdays
```

### Venues
```
GET /v2/sports/football/leagues/nfl/venues?limit=100
```

### Positions
```
GET /v2/sports/football/leagues/nfl/positions?limit=50
```

---

## Response Structure Notes

All ESPN responses typically include:
- `events[]` or `games[]` for scoreboards
- `teams[]` for team listings
- `athletes[]` for player listings
- `$ref` links for nested resources (Core API)

Common nested objects:
- `competitions[0].competitors[]` for home/away teams
- `competitions[0].status` for game state
- `team.record` for win/loss
- `statistics[]` for player/team stats
