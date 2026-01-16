# MLB Analytics Platform Integration

## Overview

This document describes the comprehensive MLB Analytics Platform integration for BlazeSportsIntel.com. The platform provides professional-grade baseball analytics, advanced metrics, Statcast data, and player analysis powered by MLB Stats API, FanGraphs, and the mlb-data-lab library.

## Architecture

### Backend (Python/FastAPI)

#### MLB Data Client (`api/mlb/client.py`)

- Wraps the `UnifiedDataClient` from mlb-data-lab
- Provides high-level methods for data access
- Implements caching and error handling
- Singleton pattern for efficient resource usage

#### API Routes (`api/mlb/routes.py`)

- RESTful endpoints for MLB data
- Pydantic schemas for request/response validation
- Integrated with main FastAPI application
- Full API documentation via OpenAPI/Swagger

#### Data Sources

1. **MLB Stats API** - Official MLB statistics and game data
2. **FanGraphs** - Advanced sabermetrics (wOBA, wRC+, FIP, etc.)
3. **Statcast** - Player tracking data (exit velocity, launch angle, etc.)
4. **Chadwick Register** - Player ID mapping across systems

### Frontend (Next.js/React)

#### Pages Structure

```
/baseball/mlb/
├── page.tsx                          # Landing page
├── dashboard/page.tsx                # Live stats dashboard
├── leaderboards/page.tsx             # Batting/pitching leaderboards
├── players/
│   ├── page.tsx                      # Player search
│   └── [playerId]/
│       ├── page.tsx                  # Player profile
│       └── statcast/page.tsx         # Statcast deep dive
└── standings/page.tsx                # League standings
```

## Features Implemented

### 1. Advanced Player Profile Pages

✅ **Implemented**

**Features:**

- Comprehensive player bio (height, weight, position, bat/throw)
- Season statistics with advanced metrics
- Team logos and player headshots
- Split statistics (vs RHP/LHP, home/away)
- Navigation to detailed views

**API Endpoint:** `GET /mlb/players/{player_id}`

**Page:** `/baseball/mlb/players/[playerId]`

**Advanced Metrics Included:**

- wOBA (Weighted On-Base Average)
- wRC+ (Weighted Runs Created Plus)
- WAR (Wins Above Replacement)
- FIP (Fielding Independent Pitching)
- ISO, BABIP, OPS+
- K%, BB%, K-BB%

### 2. Real-Time Statistics Dashboard

✅ **Implemented**

**Features:**

- Live game scores updated every 60 seconds
- Games filtered by status (Live, Final, Scheduled)
- Quick stats summary
- Game status badges with color coding
- Links to detailed game boxscores

**API Endpoint:** `GET /mlb/schedule`

**Page:** `/baseball/mlb/dashboard`

### 3. Statcast Deep Dives

✅ **Implemented**

**Features:**

- Exit velocity tracking and distribution
- Launch angle analysis
- Hard-hit rate calculation
- Barrel rate metrics
- Batted ball event table with details
- Date range filtering
- Educational content about Statcast metrics

**API Endpoint:** `GET /mlb/players/{player_id}/statcast`

**Page:** `/baseball/mlb/players/[playerId]/statcast`

**Statcast Metrics:**

- Exit Velocity (average, max, distribution)
- Launch Angle (average, optimal zones)
- Hit Distance
- Barrel Rate
- Hard-Hit Rate (95+ mph)
- Sweet Spot % (8-32° launch angle)

### 4. Leaderboards

✅ **Implemented**

**Features:**

- Batting and pitching leaderboards
- Season selector (last 5 years)
- Sortable by multiple stats
- Top 100 players by default
- Click to view player profile
- Stats legend/guide

**API Endpoints:**

- `GET /mlb/leaderboards/batting`
- `GET /mlb/leaderboards/pitching`

**Page:** `/baseball/mlb/leaderboards`

**Batting Stats:** AVG, HR, RBI, OBP, SLG, OPS, wOBA, wRC+, WAR

**Pitching Stats:** W, L, ERA, IP, SO, WHIP, FIP, K%, BB%, WAR

### 5. Player Search

✅ **Implemented**

**Features:**

- Search by first name and/or last name
- Fuzzy matching option for misspellings
- Results show player bio and team
- Active/inactive status indicator
- Links to full player profiles

**API Endpoint:** `GET /mlb/players/search`

**Page:** `/baseball/mlb/players`

### 6. Team Analysis Tools

⚠️ **Partial** (Backend ready, frontend pages pending)

**Backend Ready:**

- Team roster retrieval
- Team stats aggregation
- Schedule and record tracking

**API Endpoints:**

- `GET /mlb/teams/{team_id}/roster`
- `GET /mlb/standings`

**Pending Frontend:**

- Team profile pages
- Team comparison tools
- Roster depth charts

### 7. API & Data Services

✅ **Implemented**

**Features:**

- RESTful API with FastAPI
- OpenAPI/Swagger documentation
- JSON response format
- Error handling and validation
- Caching layer
- Rate limiting ready

**Base URL:** `/mlb`

**Health Check:** `GET /mlb/health`

### 8. Custom Visualizations

⚠️ **Partial**

**Implemented:**

- Statcast data tables
- Stats grids and cards
- Game score displays
- Leaderboard tables

**Planned:**

- Spray charts (hit location visualization)
- Pitch break plots
- Velocity distribution histograms
- Rolling statistics charts

## API Endpoints

### Player Endpoints

```
GET /mlb/players/search
  Query params: first_name, last_name, fuzzy
  Returns: List of matching players

GET /mlb/players/{player_id}
  Query params: season (default: current year)
  Returns: Complete player profile with stats

GET /mlb/players/{player_id}/stats
  Query params: season, stat_type (batting|pitching)
  Returns: Player statistics for season

GET /mlb/players/{player_id}/statcast
  Query params: start_date, end_date, is_pitcher
  Returns: Statcast metrics and batted ball events
```

### Leaderboard Endpoints

```
GET /mlb/leaderboards/batting
  Query params: season, limit
  Returns: Batting leaderboard

GET /mlb/leaderboards/pitching
  Query params: season, limit
  Returns: Pitching leaderboard
```

### Team Endpoints

```
GET /mlb/teams/{team_id}/roster
  Query params: season
  Returns: Team roster with player details

GET /mlb/standings
  Query params: season, league_ids
  Returns: Division/league standings
```

### Schedule Endpoints

```
GET /mlb/schedule
  Query params: start_date, end_date
  Returns: Games in date range

GET /mlb/games/{game_pk}/boxscore
  Returns: Detailed game boxscore
```

### Utility Endpoints

```
GET /mlb/health
  Returns: Service health status
```

## Installation & Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

New dependencies added:

- `pybaseball==2.2.7` - FanGraphs and Baseball Reference data
- `MLB-StatsAPI==1.9.0` - Official MLB Stats API
- `mplcursors==0.5.3` - Interactive matplotlib cursors

### 2. Start the FastAPI Server

```bash
cd api
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### 3. Configure Environment Variables

Create or update `.env`:

```bash
# MLB API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
MLB_CACHE_TTL=3600
```

### 4. Start the Next.js Development Server

```bash
cd apps/web
pnpm install
pnpm dev
```

The web app will be available at `http://localhost:3000`

### 5. Access MLB Analytics

Navigate to: `http://localhost:3000/baseball/mlb`

## Data Sources & Attribution

### MLB Stats API

- Official MLB statistics
- Real-time game data
- Player biographical information
- **Attribution:** Required per MLB terms

### FanGraphs

- Advanced sabermetrics
- wOBA, wRC+, FIP calculations
- League-adjusted metrics
- **Attribution:** Required per FanGraphs terms

### Statcast

- Batted ball tracking
- Pitch movement data
- Sprint speed and defense
- **Attribution:** MLB Statcast technology

### Chadwick Register

- Player ID mapping
- Cross-platform identification
- Historical player data
- **License:** Open source

## Usage Examples

### Search for a Player

```typescript
// Navigate to /baseball/mlb/players
// Enter player name (e.g., "Mike Trout")
// Click search
// Select player from results
```

### View Statcast Data

```typescript
// Navigate to player profile
// Click "Statcast Data" button
// View exit velocity, launch angle, etc.
// Adjust date range as needed
```

### Browse Leaderboards

```typescript
// Navigate to /baseball/mlb/leaderboards
// Toggle between Batting/Pitching
// Select season from dropdown
// Click player row to view profile
```

### Check Live Games

```typescript
// Navigate to /baseball/mlb/dashboard
// View today's games with live scores
// Auto-refreshes every 60 seconds
// Click game for detailed boxscore
```

## Performance Considerations

### Caching Strategy

- Player profiles: 1 hour TTL
- Leaderboards: 6 hours TTL
- Live game data: 1 minute TTL
- Statcast data: 24 hours TTL

### Data Loading

- Skeleton screens for loading states
- Error boundaries for API failures
- Retry mechanisms for network errors
- Progressive data loading

### API Rate Limiting

- FanGraphs: ~100 requests/hour recommended
- MLB Stats API: No published limits, use responsibly
- Statcast: Large data sets, cache aggressively

## Future Enhancements

### Phase 2 Features

1. **Spray Charts**
   - Visual representation of hit locations
   - Heat maps for batted balls
   - Zone analysis

2. **Pitch Movement Plots**
   - Interactive pitch break visualization
   - Velocity vs. movement charts
   - Pitch type comparison

3. **Scouting Reports**
   - Auto-generated player reports
   - Strengths/weaknesses analysis
   - 20-80 scouting grades

4. **Team Analysis**
   - Complete team stats pages
   - Roster depth charts
   - Team comparison tools

5. **Batch Processing**
   - Generate reports for multiple players
   - Season-end summaries
   - Custom date range analysis

6. **Database Integration**
   - PostgreSQL for complex queries
   - Historical data storage
   - Faster data retrieval

7. **Mobile Optimization**
   - Responsive design improvements
   - Touch-friendly controls
   - Offline data caching

## Troubleshooting

### API Connection Issues

```bash
# Check if API is running
curl http://localhost:8000/mlb/health

# Check logs
tail -f api/logs/api.log
```

### Data Loading Errors

Common issues:

1. **Player not found** - Verify player ID is correct
2. **No stats available** - Player may not have data for selected season
3. **Rate limit exceeded** - Wait before making more requests

### Frontend Issues

```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Reinstall dependencies
cd apps/web
pnpm install
```

## Development Guidelines

### Adding New Endpoints

1. Add method to `MLBDataClient` (`api/mlb/client.py`)
2. Create Pydantic schema if needed (`api/mlb/schemas.py`)
3. Add route to router (`api/mlb/routes.py`)
4. Test endpoint in Swagger UI
5. Create frontend page/component

### Code Style

- Python: Follow PEP 8, use type hints
- TypeScript: Follow ESLint rules, use interfaces
- React: Functional components with hooks
- API: RESTful conventions, JSON responses

## Testing

### Manual Testing

1. Start both API and web servers
2. Navigate to `/baseball/mlb`
3. Test each feature:
   - Search players
   - View profiles
   - Check leaderboards
   - Browse dashboard

### Automated Testing

```bash
# Backend tests
cd api
pytest tests/test_mlb.py

# Frontend tests
cd apps/web
pnpm test
```

## Contributing

When adding features:

1. Update this documentation
2. Add API endpoint documentation
3. Include example usage
4. Test thoroughly
5. Update changelog

## License & Legal

- **mlb-data-lab**: Check original repository license
- **MLB data**: Subject to MLB's terms of use
- **FanGraphs data**: Subject to FanGraphs terms
- **Statcast data**: MLB proprietary technology

**Copyright Notice:** This package and its authors are not affiliated with MLB or any MLB team. Use of MLB data is subject to the notice posted at http://gdx.mlb.com/components/copyright.txt

## Support

For issues or questions:

1. Check this documentation
2. Review API documentation at `/docs`
3. Check mlb-data-lab documentation
4. Open a GitHub issue

## Version History

### v1.0.0 (Current)

- Initial MLB Analytics Platform integration
- Player profiles with advanced metrics
- Statcast deep dives
- Real-time dashboard
- Leaderboards (batting/pitching)
- Player search
- API endpoints for all features

## Credits

Built using:

- [mlb-data-lab](https://github.com/ahump20/mlb-data-lab) by ahump20
- [pybaseball](https://github.com/jldbc/pybaseball)
- [MLB-StatsAPI](https://github.com/toddrob99/MLB-StatsAPI)
- FastAPI
- Next.js 15
- React 19
