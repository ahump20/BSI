# College Baseball API Endpoints

NCAA Division I Baseball API endpoints for Blaze Sports Intel.

## Endpoints

### GET `/api/college-baseball/standings`

Returns conference standings for NCAA Division I baseball.

**Query Parameters:**
- `conference` (optional) - Conference filter (e.g., "SEC", "Big 12", "ACC"). Default: "SEC"
- `season` (optional) - Season year. Default: current year

**Response:**
```json
{
  "conference": "SEC",
  "season": 2026,
  "updated": "2026-03-15T12:00:00.000Z",
  "teams": [
    {
      "rank": 1,
      "team_id": "lsu",
      "school_name": "LSU",
      "conference_wins": 15,
      "conference_losses": 3,
      "conference_pct": 0.833,
      "overall_wins": 28,
      "overall_losses": 5,
      "overall_pct": 0.848,
      "streak": "W5",
      "home_record": "15-2",
      "away_record": "10-3",
      "neutral_record": "3-0"
    }
  ],
  "notes": []
}
```

**Cache:** 15 minutes

---

### GET `/api/college-baseball/teams`

Returns team information for NCAA Division I baseball programs.

**Query Parameters:**
- `conference` (optional) - Filter by conference (e.g., "SEC")
- `teamId` (optional) - Get specific team by ID

**Response (List):**
```json
{
  "count": 6,
  "teams": [
    {
      "team_id": "lsu",
      "school_name": "LSU Tigers",
      "conference": "SEC",
      "division": "West",
      "city": "Baton Rouge",
      "state": "Louisiana",
      "stadium_name": "Alex Box Stadium",
      "capacity": 10326,
      "colors": ["purple", "gold"],
      "coach_name": "Jay Johnson",
      "conference_titles": 17,
      "cws_appearances": 19,
      "national_championships": 7
    }
  ]
}
```

**Response (Single Team):**
```json
{
  "team_id": "lsu",
  "school_name": "LSU Tigers",
  "conference": "SEC",
  "division": "West",
  "city": "Baton Rouge",
  "state": "Louisiana",
  "stadium_name": "Alex Box Stadium",
  "capacity": 10326,
  "colors": ["purple", "gold"],
  "coach_name": "Jay Johnson",
  "conference_titles": 17,
  "cws_appearances": 19,
  "national_championships": 7
}
```

**Cache:** 1 hour

---

## Featured Teams

Currently includes SEC programs:
- LSU Tigers
- Tennessee Volunteers
- Arkansas Razorbacks
- Vanderbilt Commodores
- Florida Gators
- Texas Longhorns

## Future Endpoints

Coming in Phase 2-4:

- `GET /api/college-baseball/games` - Live scores and game schedules
- `GET /api/college-baseball/games/:gameId` - Detailed game information
- `GET /api/college-baseball/players` - Player statistics and profiles
- `GET /api/college-baseball/players/:playerId` - Individual player details
- `GET /api/college-baseball/rankings` - RPI/ISR rankings
- `GET /api/college-baseball/recruiting` - Recruiting class information

## Data Sources

- NCAA Statistics API (planned)
- Conference Databases (SEC, Big 12, ACC)
- Boyd's World RPI/ISR Rankings
- D1Baseball
- Perfect Game Collegiate Pipeline
- Baseball America

## Cron Schedule

Data updates run every 15 minutes, every day, from February through June (months 2-6 in cron's 1-indexed format), regardless of whether games are being played:

Run tests with:
```bash
node tests/college-baseball.test.js
```

## Status

🚧 **Phase 1: Foundation** - In Development
- [x] API endpoint structure
- [x] Basic teams and standings endpoints
- [x] Cron job skeleton
- [ ] NCAA API integration
- [ ] Database schema implementation

**Target Launch:** February 2026 (NCAA Season Start)
