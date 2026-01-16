# BSI Video & Historical Record Book Components

Production-ready React components for BlazeSportsIntel.com featuring Cloudflare Stream video integration and D1-powered historical record books.

## Components

### Video Components (StreamVideo.tsx)

Three reusable video components using Cloudflare Stream:

#### InlineClip

Short clips (12-60s) placed between content sections. Click-to-play.

```tsx
import { InlineClip } from './StreamVideo';

<InlineClip
  streamId="9c532757647485d89cb77cb510333863"
  title="AI in Sports: Recovery Protocols"
  description="Exploring psychedelic research for CTE treatment in athletes."
/>;
```

#### HeroReel

Autoplay-muted clip under homepage hero. Respects mobile data (tap-to-play on mobile).

```tsx
import { HeroReel } from './StreamVideo';

<HeroReel
  streamId="slice_000"
  title="The Conversation"
  description="A deep dive into sports science frontiers."
/>;
```

#### LeagueDeepDive

Featured video at top of league analytics pages. Expandable layout.

```tsx
import { LeagueDeepDive } from './StreamVideo';

<LeagueDeepDive
  streamId="full-lecture-id"
  title="College Baseball Analytics: What ESPN Misses"
  description="In-depth analysis of coverage gaps and data opportunities."
/>;
```

### Historical Record Book (HistoricalRecordBook.tsx)

Comprehensive team record display with collapsible sections.

```tsx
import { HistoricalRecordBook } from './HistoricalRecordBook';

<HistoricalRecordBook
  teamId="texas-baseball"
  teamName="Texas Longhorns"
  league="NCAA_BB"
  apiBaseUrl="https://bsi-records-api.your-account.workers.dev"
/>;
```

## Configuration

### Stream Customer Code

Update `STREAM_CUSTOMER_CODE` in `StreamVideo.tsx`:

```typescript
const STREAM_CUSTOMER_CODE = 'your-customer-code';
```

Find your customer code in Cloudflare Dashboard → Stream → Any video → Embed code.

### Stream Video IDs

Customer Code: `mpdvoybjqct2pzls`

Complete video inventory from Cloudflare Stream (sorted by duration):

| File          | Duration | Stream ID                          | Recommended Use                    |
| ------------- | -------- | ---------------------------------- | ---------------------------------- |
| slice_006.mp4 | 29s      | `803f4d36546295cf91c3660e160bc9e7` | **HeroReel** (homepage background) |
| slice_008.mp4 | 46s      | `8b7efb55ece2eed6bf921be783f3744e` | InlineClip                         |
| slice_010.mp4 | 46s      | `803cc447f6543473716038e20f5680c8` | InlineClip                         |
| slice_005.mp4 | 47s      | `9c532757647485d89cb77cb510333863` | InlineClip                         |
| slice_002.mp4 | 48s      | `ffefcf3466e89a319d4cbb1ebfcf23f2` | InlineClip                         |
| slice_013.mp4 | 52s      | `655bb4b37c34c7f370275b717da377c0` | InlineClip                         |
| slice_036.mp4 | 53s      | `105206f2d4be6b59adaa6159987f4e4d` | InlineClip                         |
| slice_012.mp4 | 54s      | `3dad0df878eb1ce0e4984c28c003fd43` | InlineClip                         |
| slice_000.mp4 | 56s      | `37fcebbccfc8dd672345183ce4196125` | InlineClip                         |
| slice_025.mp4 | 58s      | `4447962cf9ebf3737d4269ba4deb3e8b` | InlineClip                         |
| slice_023.mp4 | 59s      | `1d1893034cafc71da1fbe397e2caf2e3` | InlineClip                         |
| slice_011.mp4 | 61s      | `51e9ee20d66ebcba415f7542f2f42a86` | InlineClip                         |
| slice_001.mp4 | 63s      | `2e6718ffaae98bbddb0b76a21e54532e` | InlineClip                         |
| slice_004.mp4 | 63s      | `98fc435b58ebb503e8d0c44b43216a23` | InlineClip                         |
| slice_007.mp4 | 71s      | `f4d79215697743047a30328a3d24a9f8` | **LeagueDeepDive**                 |
| slice_014.mp4 | 78s      | `f19e74f58362de01fa8de894d8f89a87` | **LeagueDeepDive**                 |
| slice_003.mp4 | 79s      | `a7e1b7e2650de8b65231b8c0f1144c6f` | **LeagueDeepDive**                 |

All videos: 1920×1108 resolution, ready to stream.

## Deployment

### 1. Set up D1 Database

```bash
# Tables already exist, just run the schema if fresh
wrangler d1 execute bsi-historical-db --file=./schema/historical-records.sql

# Seed Texas Longhorns baseball data
wrangler d1 execute bsi-historical-db --file=./schema/seed-texas-baseball.sql
```

### 2. Deploy Records API Worker

```bash
cd workers
wrangler deploy --config wrangler.toml
```

### 3. Copy Components to BSI Repo

```bash
# From bsi-video-components directory
cp StreamVideo.tsx ~/Library/Mobile\ Documents/com~apple~CloudDocs/BSI/src/components/
cp HistoricalRecordBook.tsx ~/Library/Mobile\ Documents/com~apple~CloudDocs/BSI/src/components/
cp index.ts ~/Library/Mobile\ Documents/com~apple~CloudDocs/BSI/src/components/video/
```

## API Endpoints

### Records API (bsi-records-api)

```
GET /api/health
GET /api/records/:league              # List teams in league
GET /api/records/:league/:teamId      # Get full record book
```

Valid leagues: `MLB`, `NFL`, `NBA`, `NCAA_FB`, `NCAA_BB`

Example response:

```json
{
  "teamId": "texas-baseball",
  "teamName": "Texas Longhorns",
  "league": "NCAA_BB",
  "franchiseRecords": [...],
  "seasonRecords": [...],
  "postseasonHistory": [...],
  "keyEras": [...],
  "allTimePlayers": [...],
  "lastUpdated": "2025-11-26T02:45:00Z"
}
```

## Brand Styling

All components use BSI brand tokens:

| Token        | Value     | Usage                       |
| ------------ | --------- | --------------------------- |
| Burnt Orange | `#BF5700` | Primary accent, CTAs        |
| Texas Soil   | `#8B4513` | Secondary accent, citations |
| Charcoal     | `#1A1A1A` | Card backgrounds            |
| Midnight     | `#0D0D0D` | Page backgrounds            |
| Ember        | `#FF6B35` | Accent highlights only      |

## Data Integrity

**All records must be sourced.** Every entry in the historical records database requires:

- `source_url` - Direct link to authoritative source
- `source_name` - Name of source (Baseball Reference, ESPN, NCAA.com, etc.)

Accepted sources:

- Baseball Reference
- Pro Football Reference
- Basketball Reference
- ESPN
- NCAA.com
- D1Baseball
- Official team media guides
- Wikipedia (for historical facts, verify with primary source when possible)

**Never fabricate statistics or records.**

## File Structure

```
bsi-video-components/
├── StreamVideo.tsx           # Video components
├── HistoricalRecordBook.tsx  # Record book component
├── index.ts                  # Exports
├── schema/
│   ├── historical-records.sql    # D1 schema
│   └── seed-texas-baseball.sql   # Sample data
├── workers/
│   ├── bsi-records-api.ts    # API worker
│   └── wrangler.toml         # Deployment config
└── README.md
```

## Next Steps

1. **Get Stream customer code** from Cloudflare dashboard
2. **Get Stream video IDs** for all uploaded clips
3. **Deploy records API** to Cloudflare Workers
4. **Seed database** with Texas baseball data (done) and expand to other teams
5. **Integrate components** into main BSI site

## Adding More Teams

To add records for another team:

1. Research and verify all statistics from authoritative sources
2. Create a new seed file: `seed-{team-slug}.sql`
3. Follow the pattern in `seed-texas-baseball.sql`
4. Every stat needs `source_url` and `source_name`
5. Run: `wrangler d1 execute bsi-historical-db --file=./schema/seed-{team}.sql`
