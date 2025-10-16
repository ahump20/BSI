# College Baseball Module

Mobile-first platform for NCAA Division I baseball coverage with live scoring, automated content generation, and push notifications.

## Features

### Core MVP Features

- **Live Game Center** - Real-time game updates with 30-second refresh
- **Full Box Scores** - Complete batting and pitching statistics
- **Conference Standings** - RPI, SOS, and conference records
- **Automated Content** - NLG-generated previews and recaps
- **Push Notifications** - Granular game alerts without spam
- **Offline Support** - Service Worker caching for no-signal scenarios

## Architecture

### Data Flow

```
Data Sources (D1Baseball, NCAA) 
  → Cloudflare Edge Workers
  → KV Cache (15-30s TTL for live)
  → API Response
  → React Components
  → Service Worker Cache (offline)
```

### Caching Strategy

| Data Type | Live TTL | Final TTL | Rationale |
|-----------|----------|-----------|-----------|
| Game List | 30s | 5m | Real-time score updates |
| Box Scores | 15s | 1h | Detailed stats refresh |
| Standings | 5m | 5m | Infrequent changes |
| Team Pages | 1h | 1h | Static content |
| Player Pages | 1h | 1h | Static content |

## API Endpoints

### Games API

```
GET /api/college-baseball/games
```

Query parameters:
- `date` - YYYY-MM-DD format (default: today)
- `conference` - Filter by conference (e.g., "SEC")
- `status` - Filter by status: live, scheduled, final
- `team` - Filter by team ID

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "game-001",
      "date": "2025-10-13",
      "time": "7:00 PM ET",
      "status": "live",
      "homeTeam": {
        "id": "lsu",
        "name": "LSU Tigers",
        "shortName": "LSU",
        "conference": "SEC",
        "score": 4,
        "record": { "wins": 15, "losses": 3 }
      },
      "awayTeam": { /* ... */ },
      "venue": "Alex Box Stadium",
      "tv": "SEC Network"
    }
  ],
  "cached": false,
  "timestamp": "2025-10-13T19:30:00.000Z"
}
```

### Box Score API

```
GET /api/college-baseball/boxscore?gameId={id}
```

Response includes:
- Game status and inning
- Line scores (runs per inning)
- Batting statistics (all players)
- Pitching statistics (all pitchers)
- Last update timestamp

### Standings API

```
GET /api/college-baseball/standings?conference={conf}
```

Response includes:
- Team rankings
- Overall and conference records
- RPI and strength of schedule
- Streaks and last 10 games

## Components

### GameCenter

Mobile-first React component for displaying live games.

```tsx
import GameCenter from '@/components/college-baseball/GameCenter';

<GameCenter 
  autoRefresh={true}
  refreshInterval={30000}
/>
```

Features:
- Pull-to-refresh
- Filter by status
- Auto-refresh for live games
- Offline caching
- Thumb-friendly UI (44px touch targets)

## NLG Templates

Automated content generation for previews and recaps.

```typescript
import { 
  generateGamePreview, 
  generateGameRecap,
  generateInningUpdate 
} from '@/lib/college-baseball/nlg-templates';

// Generate preview
const preview = generateGamePreview(game, homeStanding, awayStanding);

// Generate recap
const recap = generateGameRecap(game, boxScore);

// Generate inning update for notifications
const update = generateInningUpdate(boxScore);
```

## Push Notifications

Granular notification controls with quiet hours support.

```typescript
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  saveNotificationPreferences,
  createGameStartNotification
} from '@/lib/college-baseball/push-notifications';

// Request permission
const permission = await requestNotificationPermission();

// Subscribe
const subscription = await subscribeToPushNotifications();

// Save preferences
saveNotificationPreferences({
  enabled: true,
  gameStart: true,
  inningUpdates: false,
  finalScore: true,
  favoriteTeams: ['lsu', 'tennessee'],
  quietHours: { start: '22:00', end: '08:00' }
});

// Create notification payload
const notification = createGameStartNotification(game);
```

## Configuration

All configuration is in `/lib/college-baseball/config.ts`.

Key settings:
- **Divisions**: D1, D2, D3, JUCO
- **Conferences**: SEC, ACC, Big 12, Pac-12, Big Ten
- **Data Sources**: D1Baseball (priority 1), NCAA Stats (priority 2)
- **Rate Limits**: 30 req/min D1Baseball, 20 req/min NCAA
- **Feature Flags**: Enable/disable MVP features

```typescript
import { 
  COLLEGE_BASEBALL_CONFIG,
  getCacheTTL,
  isFeatureEnabled 
} from '@/lib/college-baseball/config';

// Get cache TTL
const ttl = getCacheTTL('liveGame'); // 30 seconds

// Check feature flag
if (isFeatureEnabled('pushNotifications')) {
  // Enable notifications
}
```

## Type Definitions

All types are in `/lib/college-baseball/types.ts`.

Key types:
- `Game` - Complete game information
- `BoxScore` - Full box score data
- `Team` - Team metadata and record
- `Standing` - Conference standing entry
- `Player` - Player information and stats
- `PushNotificationPreferences` - User notification settings

## Demo

View the working demo at `/college-baseball-demo.html`.

Features demonstrated:
- Live game updates
- Filter tabs (all, live, scheduled, final)
- Auto-refresh every 30 seconds
- Mobile-first responsive design
- Loading states and empty states

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build TypeScript
npm run build:ts

# Deploy to Cloudflare Pages
npm run deploy
```

### Testing APIs

```bash
# Test games endpoint
curl http://localhost:8788/api/college-baseball/games

# Test with filters
curl "http://localhost:8788/api/college-baseball/games?conference=SEC&status=live"

# Test box score
curl "http://localhost:8788/api/college-baseball/boxscore?gameId=game-001"

# Test standings
curl "http://localhost:8788/api/college-baseball/standings?conference=SEC"
```

## Roadmap

### Phase 1: MVP (Complete)
- ✅ API endpoints for games, box scores, standings
- ✅ Mobile-first Game Center component
- ✅ Caching strategy with Cloudflare KV
- ✅ NLG templates for automated content
- ✅ Push notification infrastructure

### Phase 2: Data Integration (Next)
- [ ] D1Baseball scraper implementation
- [ ] NCAA Stats scraper implementation
- [ ] Data reconciliation layer
- [ ] Commercial API evaluation (Highlightly/Genius)
- [ ] Monitoring and alerting

### Phase 3: Enhanced Features (Post-MVP)
- [ ] Team pages with roster and schedule
- [ ] Player pages with career stats
- [ ] Advanced metrics (xBA, wOBA, FIP)
- [ ] Pitch-by-pitch visualization
- [ ] Video highlight aggregation
- [ ] Native iOS app with Swift

### Phase 4: Monetization
- [ ] Diamond Pro subscription ($4.99/month)
- [ ] Payment processing integration
- [ ] Ad integration for free tier
- [ ] Affiliate partnerships
- [ ] Analytics and conversion tracking

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response (p95) | <200ms | TBD |
| Cache Hit Ratio | >80% | TBD |
| Data Staleness | <1%/week | TBD |
| DAU (launch) | 20k-75k | TBD |
| Conversion to Paid | 2-8% | TBD |

## Support

For questions or issues:
- See full integration guide: `/docs/COLLEGE-BASEBALL-INTEGRATION.md`
- GitHub Issues: https://github.com/ahump20/BSI/issues
- Email: support@blazesportsintel.com

## License

MIT License - See LICENSE file for details
