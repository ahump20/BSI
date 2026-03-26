# MLB StatsAPI Reference

Official MLB data via community-accessible endpoints. No authentication required.

## Base URL

```
https://statsapi.mlb.com
```

## Key Endpoints

### Schedule & Scores

```
GET /api/v1/schedule
GET /api/v1/schedule?sportId=1&date=YYYY-MM-DD
GET /api/v1/schedule?sportId=1&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
GET /api/v1/schedule?sportId=1&season=2024&gameType=R
```

**Game Types:**
- `R` = Regular Season
- `S` = Spring Training
- `P` = Postseason
- `A` = All-Star Game
- `W` = Wild Card
- `D` = Division Series
- `L` = League Championship
- `F` = World Series

### Live Game Feed

```
GET /api/v1.1/game/{gamePk}/feed/live
GET /api/v1.1/game/{gamePk}/feed/live/diffPatch
GET /api/v1/game/{gamePk}/boxscore
GET /api/v1/game/{gamePk}/linescore
GET /api/v1/game/{gamePk}/playByPlay
GET /api/v1/game/{gamePk}/content
```

The `gamePk` is the unique game identifier from the schedule endpoint.

### Teams

```
GET /api/v1/teams
GET /api/v1/teams?sportId=1                    # MLB teams only
GET /api/v1/teams?sportId=1&season=2024
GET /api/v1/teams/{teamId}
GET /api/v1/teams/{teamId}/roster
GET /api/v1/teams/{teamId}/roster?season=2024
GET /api/v1/teams/{teamId}/roster/40Man
GET /api/v1/teams/{teamId}/coaches
GET /api/v1/teams/{teamId}/leaders?leaderCategories=homeRuns,battingAverage
```

**Common Team IDs:**
- 109 = Arizona Diamondbacks
- 144 = Atlanta Braves
- 110 = Baltimore Orioles
- 111 = Boston Red Sox
- 112 = Chicago Cubs
- 145 = Chicago White Sox
- 113 = Cincinnati Reds
- 114 = Cleveland Guardians
- 115 = Colorado Rockies
- 116 = Detroit Tigers
- 117 = Houston Astros
- 118 = Kansas City Royals
- 108 = Los Angeles Angels
- 119 = Los Angeles Dodgers
- 158 = Milwaukee Brewers
- 142 = Minnesota Twins
- 121 = New York Mets
- 147 = New York Yankees
- 133 = Oakland Athletics
- 143 = Philadelphia Phillies
- 134 = Pittsburgh Pirates
- 135 = San Diego Padres
- 137 = San Francisco Giants
- 136 = Seattle Mariners
- 138 = St. Louis Cardinals
- 139 = Tampa Bay Rays
- 140 = Texas Rangers
- 141 = Toronto Blue Jays
- 120 = Washington Nationals

### Players

```
GET /api/v1/people/{playerId}
GET /api/v1/people/{playerId}?hydrate=stats(group=[hitting,pitching],type=[yearByYear])
GET /api/v1/people/{playerId}?hydrate=currentTeam,team,stats(type=[yearByYear,career],group=[hitting,pitching,fielding])
GET /api/v1/people/freeAgents?season=2024
```

### Standings

```
GET /api/v1/standings
GET /api/v1/standings?leagueId=103,104&season=2024
GET /api/v1/standings?leagueId=103,104&season=2024&standingsTypes=regularSeason
```

**League IDs:**
- 103 = American League
- 104 = National League

### Stats & Leaders

```
GET /api/v1/stats?stats=season&group=hitting&season=2024&sportId=1
GET /api/v1/stats/leaders?leaderCategories=homeRuns&season=2024&sportId=1
GET /api/v1/stats/leaders?leaderCategories=homeRuns,battingAverage,strikeouts&season=2024&limit=10
```

**Leader Categories:**
- Hitting: `homeRuns`, `battingAverage`, `runs`, `hits`, `rbi`, `stolenBases`, `onBasePercentage`, `sluggingPercentage`, `ops`
- Pitching: `wins`, `era`, `strikeouts`, `saves`, `inningsPitched`, `whip`

### Divisions & Leagues

```
GET /api/v1/divisions
GET /api/v1/leagues
GET /api/v1/sports
```

### Draft

```
GET /api/v1/draft/{year}
GET /api/v1/draft/prospects/{year}
```

### Transactions

```
GET /api/v1/transactions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

---

## Hydration Parameter

Many endpoints support `hydrate` to include related data:

```
?hydrate=team,stats,currentTeam
?hydrate=stats(group=[hitting,pitching],type=[yearByYear,career])
?hydrate=person,stats(group=hitting,type=career)
```

Common hydration values:
- `team` / `currentTeam`
- `stats(type=[yearByYear])` 
- `person`
- `linescore`
- `decisions`
- `probablePitcher`
- `weather`
- `venue`

---

## Response Structure

### Schedule Response
```json
{
  "dates": [{
    "date": "2024-06-15",
    "games": [{
      "gamePk": 745123,
      "gameDate": "2024-06-15T18:10:00Z",
      "status": { "abstractGameState": "Final" },
      "teams": {
        "away": { "team": { "id": 147, "name": "Yankees" }, "score": 5 },
        "home": { "team": { "id": 111, "name": "Red Sox" }, "score": 3 }
      },
      "venue": { "id": 3, "name": "Fenway Park" }
    }]
  }]
}
```

### Live Feed Response
```json
{
  "gamePk": 745123,
  "gameData": {
    "teams": {},
    "players": {},
    "venue": {}
  },
  "liveData": {
    "plays": {
      "allPlays": [],
      "currentPlay": {}
    },
    "linescore": {},
    "boxscore": {}
  }
}
```

---

## Cloudflare Worker Example

```typescript
interface Env {
  MLB_CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint') || 'schedule';
    const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    
    const cacheKey = `mlb:${endpoint}:${date}`;
    const cached = await env.MLB_CACHE.get(cacheKey, 'json');
    if (cached) {
      return Response.json({ ...cached, cached: true });
    }
    
    let apiUrl: string;
    switch (endpoint) {
      case 'schedule':
        apiUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`;
        break;
      case 'standings':
        const year = date.slice(0, 4);
        apiUrl = `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${year}`;
        break;
      case 'teams':
        apiUrl = `https://statsapi.mlb.com/api/v1/teams?sportId=1`;
        break;
      default:
        return Response.json({ error: 'Unknown endpoint' }, { status: 400 });
    }
    
    const res = await fetch(apiUrl);
    if (!res.ok) {
      return Response.json({ error: `MLB API returned ${res.status}` }, { status: res.status });
    }
    
    const data = await res.json();
    const result = {
      meta: {
        source: 'statsapi.mlb.com',
        endpoint,
        date,
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago'
      },
      data
    };
    
    // Cache for 30 seconds for live data, longer for static
    const ttl = endpoint === 'teams' ? 86400 : 30;
    await env.MLB_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: ttl });
    
    return Response.json(result);
  }
};
```

---

## Common Patterns

### Get Today's Games
```typescript
const today = new Date().toISOString().slice(0, 10);
const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=linescore,probablePitcher`;
```

### Get Player Career Stats
```typescript
const playerId = 660271; // Shohei Ohtani
const url = `https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=stats(type=[yearByYear,career],group=[hitting,pitching])`;
```

### Get Live Game Updates
```typescript
const gamePk = 745123;
const liveUrl = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;

// For incremental updates during game
const diffUrl = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live/diffPatch`;
```

### Get Standings with Records
```typescript
const season = 2024;
const url = `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason&hydrate=team`;
```
