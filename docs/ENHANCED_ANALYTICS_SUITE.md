# Enhanced Sports Analytics Suite - Documentation

## Overview

This update adds five major features to Blaze Sports Intel, integrating functionality from best-in-class open-source repositories to significantly enhance the platform's capabilities.

## Features Implemented

### 1. NFL Play-by-Play Analytics (nflfastR-style)

**Reference**: [nflfastR](https://github.com/nflverse/nflfastR)

#### Components:
- **Types**: `lib/types/nfl-playbyplay.ts`
  - `NFLPlay`: Play-by-play data with EPA, WPA, CPOE metrics
  - `PlayByPlayResponse`: Complete game play-by-play response
  - `EPAMetrics`: Expected Points Added analysis
  - `WPAMetrics`: Win Probability Added analysis

- **Service**: `lib/services/nfl-playbyplay.ts`
  - EPA calculation based on field position and down
  - WPA calculation based on game situation
  - CPOE (Completion Percentage Over Expected) for passes
  - Historical data aggregation

- **API Endpoint**: `functions/api/nfl/playbyplay.ts`
  - GET `/api/nfl/playbyplay?gameId={gameId}`
  - Returns play-by-play data with EPA/WPA metrics

- **Components**:
  - `components/nfl/PlayByPlayFeed.tsx`: Interactive play-by-play feed
  - `components/nfl/EPAChart.tsx`: EPA visualization by quarter

#### Usage:
```tsx
import { PlayByPlayFeed, EPAChart } from '@/components/nfl';

<PlayByPlayFeed gameId="nfl-game-123" />
<EPAChart gameId="nfl-game-123" />
```

### 2. SportsDataverse Unified Adapter

**Reference**: [SportsDataverse](https://www.sportsdataverse.org/)

#### Components:
- **Types**: `lib/types/sportsdataverse.ts`
  - `UnifiedGameData`: Consistent game data across all sports
  - `UnifiedStandingsData`: Consistent standings format
  - `UnifiedPlayerData`: Consistent player data

- **Adapter**: `lib/adapters/sportsdataverse.ts`
  - Unified interface for NFL, NBA, MLB, CFB, CBB, Soccer
  - Automatic data normalization
  - Consistent error handling

- **Service**: `lib/services/unified-sports-service.ts`
  - Single interface for all sports data
  - Automatic caching with configurable TTL
  - Cross-sport data aggregation

#### Usage:
```tsx
import { unifiedSportsService } from '@/lib/services/unified-sports-service';

// Get games for a specific sport
const games = await unifiedSportsService.getGames('nfl', '2024-01-15');

// Get games across all sports
const allGames = await unifiedSportsService.getGames();

// Get live scores
const liveScores = await unifiedSportsService.getLiveScores();
```

### 3. TailAdmin UI Components

**Reference**: [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard)

#### New Components:

**StatsCard** (`components/ui/StatsCard.tsx`):
```tsx
<StatsCard
  title="Total Games"
  value={156}
  change={{ value: 12, trend: 'up' }}
  icon="🏈"
  color="primary"
/>
```

**DataTable** (`components/ui/DataTable.tsx`):
```tsx
<DataTable
  data={tableData}
  columns={columns}
  pagination={true}
  searchable={true}
  sortable={true}
/>
```

**ChartCard** (`components/ui/ChartCard.tsx`):
```tsx
<ChartCard title="Performance" subtitle="Last 30 days">
  <YourChart />
</ChartCard>
```

**ProgressBar** (`components/ui/ProgressBar.tsx`):
```tsx
<ProgressBar value={75} color="primary" showLabel size="lg" />
```

**Dropdown** (`components/ui/Dropdown.tsx`):
```tsx
<Dropdown
  trigger={<button>Options</button>}
  items={[
    { label: 'Edit', value: 'edit', onClick: handleEdit },
    { label: 'Delete', value: 'delete', onClick: handleDelete },
  ]}
/>
```

**Tabs** (`components/ui/Tabs.tsx`):
```tsx
<Tabs
  tabs={[
    { id: 'stats', label: 'Statistics', content: <Stats /> },
    { id: 'schedule', label: 'Schedule', content: <Schedule /> },
  ]}
/>
```

### 4. ML Prediction Models

**Reference**: [NBA-Machine-Learning-Sports-Betting](https://github.com/kyleskom/NBA-Machine-Learning-Sports-Betting)

#### Components:
- **Types**: `lib/types/predictions.ts`
  - `GamePrediction`: Game outcome predictions with confidence
  - `PredictionFactor`: Individual prediction factors
  - `PlayerPropPrediction`: Player prop predictions

- **Service**: `lib/services/predictions.ts`
  - Game winner prediction
  - Point spread prediction
  - Over/under total prediction
  - Confidence levels (high/medium/low)
  - Factor-based analysis

- **API Endpoint**: `functions/api/predictions/[sport].ts`
  - GET `/api/predictions/{sport}?gameId={gameId}`
  - Returns predictions with confidence and factors

- **Components**:
  - `components/predictions/PredictionCard.tsx`: Game prediction display
  - `components/predictions/ConfidenceMeter.tsx`: Visual confidence indicator
  - `components/predictions/FactorBreakdown.tsx`: Detailed factor analysis

#### Usage:
```tsx
import { PredictionCard, FactorBreakdown } from '@/components/predictions';

<PredictionCard prediction={gamePrediction} />
<FactorBreakdown factors={prediction.factors} />
```

### 5. Real-Time WebSocket Odds

**Reference**: [sports-odds-api-python](https://github.com/SportsGameOdds/sports-odds-api-python)

#### Components:
- **Types**: `lib/types/websocket-odds.ts`
  - `OddsUpdate`: Real-time odds update
  - `WebSocketConfig`: WebSocket connection config
  - `OddsHistory`: Historical odds tracking

- **Service**: `lib/services/websocket-odds.ts`
  - WebSocket connection management
  - Automatic reconnection with exponential backoff
  - Heartbeat mechanism
  - Odds history tracking

- **React Hook**: `lib/hooks/useOddsWebSocket.ts`
  - Easy WebSocket integration in React components
  - Automatic connection management
  - Real-time updates

- **Components**:
  - `components/odds/LiveOddsPanel.tsx`: Live odds display
  - `components/odds/OddsMovementIndicator.tsx`: Movement arrows
  - `components/odds/LineHistory.tsx`: Historical line movement

#### Usage:
```tsx
import { LiveOddsPanel } from '@/components/odds';

<LiveOddsPanel gameId="nfl-game-123" sport="nfl" />
```

Or using the hook:
```tsx
import { useOddsWebSocket } from '@/lib/hooks/useOddsWebSocket';

const { connected, latestUpdate, getHistory } = useOddsWebSocket({
  gameIds: ['game-123'],
  sports: ['nfl'],
});
```

## Environment Variables

Add to your `.env` file:

```bash
# SportsGameOdds WebSocket (for real-time odds)
SPORTSGAMEODDS_API_KEY=your_sportsgameodds_key_here
SPORTSGAMEODDS_WS_URL=wss://api.sportsgameodds.com/v1/stream

# ML Predictions (optional - enhances predictions)
PREDICTION_MODEL_VERSION=v1.0.0
```

## Demo Page

Visit `/features-demo` to see all features in action with interactive examples.

## Architecture Notes

### Cloudflare Compatibility
- All services designed to work in Cloudflare Workers environment
- Uses Cloudflare-compatible patterns (no Node.js-specific APIs in client code)
- Caching uses in-memory cache compatible with Workers

### Design System Integration
- All components follow BSI design tokens:
  - Burnt Orange (#BF5700)
  - Texas Soil (#8B4513)
  - Charcoal (#1A1A1A)
  - Midnight (#0D0D0D)
- Components are fully responsive
- Dark mode compatible

### Performance
- Lazy loading for heavy components
- Efficient caching with configurable TTL
- WebSocket reconnection with exponential backoff
- Pagination and search in data tables

## Future Enhancements

1. **NFL Play-by-Play**:
   - Integration with live game data
   - Player tracking analytics
   - Advanced EPA models

2. **SportsDataverse**:
   - Add more sports (Hockey, Soccer)
   - Real-time data synchronization
   - Cross-sport analytics

3. **Predictions**:
   - Train actual ML models on historical data
   - Player-specific predictions
   - Live in-game predictions

4. **WebSocket Odds**:
   - Multiple sportsbook comparison
   - Arbitrage opportunities detection
   - Historical odds analytics

## Testing

To test the features:

1. **UI Components**: Visit `/features-demo` page
2. **API Endpoints**:
   - `/api/nfl/playbyplay?gameId=demo-game-1`
   - `/api/predictions/nfl?gameId=demo-game-1`
3. **WebSocket**: Configure environment variables and test with live games

## Support

For issues or questions:
- Check DEVELOPMENT.md for build instructions
- Review component documentation in source files
- See individual feature READMEs in component directories
