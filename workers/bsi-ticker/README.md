# BSI Live Sports Ticker

Real-time breaking news and score ticker using Cloudflare Durable Objects + Queues.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Data Sources   │────▶│ BSI_TICKER_QUEUE │────▶│  Ticker Worker  │
│ (ESPN, MLB API) │     └──────────────────┘     │                 │
└─────────────────┘                              │  ┌───────────┐  │
                                                 │  │TickerRoom │  │
┌─────────────────┐                              │  │   (DO)    │  │
│ Frontend Client │◀────── WebSocket ───────────▶│  └───────────┘  │
│ (blazesportsintel│                              │                 │
│      .com)      │                              │  ┌───────────┐  │
└─────────────────┘                              │  │ D1 + KV   │  │
                                                 │  └───────────┘  │
                                                 └─────────────────┘
```

## Deployment

### 1. Create Cloudflare Resources

```bash
cd workers/bsi-ticker

# Create KV namespace
npm run kv:create
# Copy the ID to wrangler.jsonc

# Create D1 database
npm run db:create
# Copy the ID to wrangler.jsonc

# Run D1 migrations
npm run db:migrate

# Create queues
npm run queue:create
npm run queue:dlq

# Set API secret
npm run secret:set
# Enter a secure random string
```

### 2. Update wrangler.jsonc

Replace placeholder IDs in `wrangler.jsonc`:

- `BSI_TICKER_CACHE` KV namespace ID
- `BSI_TICKER_DB` D1 database ID

### 3. Deploy

```bash
npm run deploy
```

## API Endpoints

### WebSocket: `wss://ticker.blazesportsintel.com/ws`

Connect to receive real-time ticker updates.

**Subscribe Message:**

```json
{
  "type": "subscribe",
  "payload": {
    "leagues": ["MLB", "NFL"],
    "types": ["score", "news"],
    "minPriority": 2
  },
  "timestamp": 1234567890
}
```

### POST `/publish` (Authenticated)

Publish a new ticker item.

**Headers:**

- `X-API-Key: <API_SECRET>`

**Body:**

```json
{
  "type": "score",
  "league": "MLB",
  "headline": "Cardinals 5, Cubs 3 - Final",
  "priority": 2,
  "metadata": {
    "gameId": "123",
    "teamIds": ["STL", "CHC"]
  }
}
```

### GET `/items`

Get current ticker items (cached).

**Query Params:**

- `leagues`: comma-separated (e.g., `MLB,NFL`)
- `types`: comma-separated (e.g., `score,news`)
- `priority`: max priority (1-3)
- `limit`: max items (1-50)

### GET `/stats` (Authenticated)

Get ticker statistics (connections, items, subscriptions).

### GET `/health`

Health check endpoint.

## Frontend Integration

### React Component

```tsx
import { LiveTicker, HeroTicker, useTicker } from '@/components/live-ticker';

// Full ticker component
<LiveTicker
  leagues={['MLB', 'NFL']}
  types={['score', 'news']}
  minPriority={2}
/>

// Compact ticker for hero sections
<HeroTicker
  position="bottom"
  enableGlow
/>

// Custom implementation with hook
const { items, hasBreakingNews, isConnected } = useTicker({
  leagues: ['MLB'],
  minPriority: 1,
});
```

### Vanilla JS

```js
import { BSITickerClient } from './client-example';

const ticker = new BSITickerClient('wss://ticker.blazesportsintel.com/ws');

ticker.onItem((item) => {
  console.log('New:', item.headline);
});

await ticker.connect();
ticker.subscribe({ leagues: ['MLB'] });
```

## Message Types

| Type      | Priority | Description         |
| --------- | -------- | ------------------- |
| `score`   | 1-3      | Game scores         |
| `news`    | 1-3      | Breaking news       |
| `injury`  | 1-2      | Injury reports      |
| `trade`   | 1-2      | Trades/transactions |
| `weather` | 2-3      | Weather delays      |

| Priority | Meaning     |
| -------- | ----------- |
| 1        | 🔴 BREAKING |
| 2        | Important   |
| 3        | Standard    |

## Supported Leagues

- `MLB` - Major League Baseball
- `NFL` - National Football League
- `NCAAF` - NCAA Football
- `NBA` - National Basketball Association
- `NCAABB` - NCAA Basketball
