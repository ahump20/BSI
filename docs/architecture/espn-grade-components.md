# ESPN-Grade Sports Platform Architecture

> Implementation summary for BSI's ESPN-style sports components (2025-12-15)

---

## Components Implemented

### 1. ScoreCard Component

**Location:** `/components/sports/ScoreCard.tsx`

ESPN-style score card with:
- Team logos/abbreviations with proper styling
- Live game indicators with pulsing animation
- Status bar showing game state (scheduled, live, final)
- Winner highlighting with checkmark icons
- Optional embedded linescore table for baseball
- Responsive design with mobile scrolling
- Link support via `href` prop for navigation
- Support for MLB, NFL, NBA, college baseball, and college football

**Props:**
```typescript
interface ScoreCardProps {
  gameId?: string | number;
  homeTeam: Team;
  awayTeam: Team;
  status: GameStatus;  // 'scheduled' | 'live' | 'final' | 'delayed' | 'postponed'
  gameTime?: string;
  venue?: string;
  inning?: string;
  inningState?: string;
  linescore?: LineScore;
  sport?: 'mlb' | 'nfl' | 'nba' | 'cbb' | 'ncaaf';
  href?: string;
  onClick?: () => void;
  compact?: boolean;
  showLinescore?: boolean;
}
```

**Usage:**
```tsx
import { ScoreCard, ScoreCardGrid } from '@/components/sports';

<ScoreCardGrid>
  <ScoreCard
    gameId={746812}
    awayTeam={{ name: 'Cardinals', abbreviation: 'STL', score: 5 }}
    homeTeam={{ name: 'Cubs', abbreviation: 'CHC', score: 3 }}
    status="final"
    sport="mlb"
    href="/mlb/game/746812"
    linescore={gameData.linescore}
  />
</ScoreCardGrid>
```

---

### 2. BoxScoreTable Component

**Location:** `/components/box-score/BoxScoreTable.tsx`

Full box score display with:
- Linescore header showing runs by inning
- Batting tables with AB, R, H, RBI, BB, SO, AVG
- Pitching tables with IP, H, R, ER, BB, SO, ERA
- Win/Loss/Save decision indicators
- Multi-hit and home run highlighting
- Team totals row
- Compact and full variants
- Tab navigation between batting/pitching

**Props:**
```typescript
interface BoxScoreTableProps {
  linescore?: Linescore;
  boxscore?: BoxScoreData;
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  variant?: 'full' | 'compact';
  showLinescore?: boolean;
  defaultTab?: 'batting' | 'pitching';
}
```

**Usage:**
```tsx
import { BoxScoreTable } from '@/components/box-score';

<BoxScoreTable
  linescore={game.linescore}
  boxscore={game.boxscore}
  awayTeam={{ name: 'Cardinals', abbreviation: 'STL', score: 5 }}
  homeTeam={{ name: 'Cubs', abbreviation: 'CHC', score: 3 }}
  variant="full"
/>
```

---

## MLB Game Detail Routes

**Base Path:** `/mlb/game/[gameId]`

### Route Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/mlb/game/[gameId]` | Summary | Game overview with key stats, batting leaders, pitching summary |
| `/mlb/game/[gameId]/box-score` | BoxScorePage | Full batting and pitching statistics |
| `/mlb/game/[gameId]/play-by-play` | PlayByPlayPage | All plays organized by inning with filters |
| `/mlb/game/[gameId]/team-stats` | TeamStatsPage | Team comparison bars and game insights |
| `/mlb/game/[gameId]/recap` | RecapPage | Narrative game summary with scoring plays |

### Shared Layout

The layout (`layout.tsx`) provides:
- Game data context via `useGameData()` hook
- Shared scoreboard header with linescore
- Tab navigation between sub-routes
- Auto-refresh every 30 seconds for live games
- Breadcrumb navigation
- Data source attribution footer

**Context Usage:**
```tsx
import { useGameData } from './layout';

export default function MyPage() {
  const { game, loading, error, meta, refresh } = useGameData();

  if (loading || error || !game) {
    return null; // Layout handles these states
  }

  return <div>{/* Page content */}</div>;
}
```

---

## File Structure

```
components/
  sports/
    ScoreCard.tsx         # ESPN-style score cards
    index.ts              # Exports
  box-score/
    BoxScoreTable.tsx     # Full box score component
    UniversalBoxScore.tsx # Generic multi-sport box score
    index.ts              # Exports

app/mlb/game/[gameId]/
  layout.tsx              # Shared layout with game context
  page.tsx                # Summary page (default)
  box-score/
    page.tsx              # Full box score
  play-by-play/
    page.tsx              # Play-by-play feed
  team-stats/
    page.tsx              # Team comparison
  recap/
    page.tsx              # Narrative recap
```

---

## Design Tokens Used

All components use the BSI design system tokens:

- **Colors:** `burnt-orange`, `charcoal`, `graphite`, `text-primary/secondary/tertiary`
- **Status:** `success` (wins/live), `error` (losses), `warning` (delays)
- **Animations:** `animate-pulse` for live indicators
- **Typography:** `font-mono` for statistics, `font-display` for headers

---

## Voice Preservation

Empty states maintain Austin's voice:
- "Box score data not available yet" / "Stats will appear once the game gets underway"
- "Play-by-play data not available yet" / "Every pitch, every swing, every play."
- "Game recap will be available after the final out"
- "Sometimes the best games are pitchers' duels" (for no scoring plays)

---

## API Integration

Components expect data from `/api/mlb/game/[gameId]` endpoint with structure:

```typescript
interface APIResponse {
  game: {
    id: number;
    date: string;
    status: GameStatus;
    teams: { away: TeamData; home: TeamData };
    venue: { name: string };
    linescore?: LinescoreData;
    boxscore?: BoxScoreData;
    plays?: PlayData[];
  };
  meta: {
    dataSource: string;
    lastUpdated: string;
    timezone: string;
  };
}
```

---

## Next Steps

1. **College Baseball:** Replicate pattern for `/college-baseball/game/[gameId]`
2. **NFL:** Adapt components for football stats (passing, rushing, receiving)
3. **Team Detail Routes:** Add roster, schedule, depth-chart sub-routes
4. **News Feed:** Implement `/:sport/news` route with headline cards

---

*Last updated: 2025-12-15 | Blaze Sports Intel*
