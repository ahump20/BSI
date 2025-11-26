# Blaze Backyard Baseball - Microgame Documentation

A 60-second batting challenge microgame for BlazeSportsIntel.com. Built with Babylon.js 7.x, Havok Physics, and Cloudflare infrastructure.

**100% Original IP** - No Humongous Entertainment or other copyrighted content.

---

## Quick Start

### Local Development

```bash
# Navigate to the game directory
cd ~/BSI/games/backyard

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5174 in your browser
```

### Build for Production

```bash
# Build the project
npm run build

# Preview production build locally
npm run preview
```

### Deploy to Cloudflare

```bash
# Deploy to Cloudflare Pages
npm run deploy
```

---

## Project Structure

```
games/backyard/
├── src/
│   ├── core/
│   │   └── BackyardGameEngine.ts    # Main Babylon.js game engine
│   ├── data/
│   │   ├── backyardCharacters.ts    # Original character definitions
│   │   └── backyardField.ts         # Field/stadium configurations
│   ├── ui/
│   │   └── BackyardBaseballEmbed.tsx # React wrapper component
│   └── main.ts                       # Entry point
├── functions/
│   └── api/
│       └── backyard/
│           ├── submit-score.ts       # Score submission API
│           ├── leaderboard.ts        # Leaderboard API
│           └── player.ts             # Player stats API
├── public/                           # Static assets
├── index.html                        # Main HTML entry
├── vite.config.ts                    # Vite configuration
├── tsconfig.json                     # TypeScript configuration
├── wrangler.toml                     # Cloudflare configuration
├── schema.sql                        # D1 database schema
└── package.json                      # Dependencies
```

---

## Gameplay

### Objective
Score as many points as possible in 60 seconds by timing your swings to hit the ball.

### Controls
- **Desktop**: Click or press SPACEBAR to swing
- **Mobile**: Tap anywhere on the screen to swing

### Scoring
| Hit Type | Base Points |
|----------|-------------|
| Single   | 100         |
| Double   | 200         |
| Triple   | 350         |
| Home Run | 500         |

### Multiplier System
- 3+ hit streak: 1.5x multiplier
- 5+ hit streak: 2.0x multiplier
- 10+ hit streak: 3.0x multiplier

### Game Over Conditions
1. 60 seconds elapsed
2. 3 outs recorded (whiffs or ground balls)

---

## Characters

All characters are **100% original IP** with unique stats affecting gameplay.

### Starter Characters (Available Immediately)

| Name | Nickname | Power | Contact | Speed | Special Ability |
|------|----------|-------|---------|-------|-----------------|
| Ember Ellis | The Spark | 6 | 8 | 7 | Hot Streak - Faster multiplier growth |
| Marcus Jackson | Big Mac | 10 | 4 | 3 | Power Surge - Double HR points |
| Sofia Ramirez | Speedy | 4 | 7 | 10 | Speed Demon - Singles become doubles |
| Tommy Chen | T-Bone | 6 | 6 | 6 | Student of the Game - Wider timing window |

### Unlockable Characters

| Name | Unlock Requirement |
|------|-------------------|
| Jazz Williams | Score 2,500 points |
| Diesel Martinez | Hit 10 home runs |
| Radar O'Brien | 8 hit streak |
| Hurricane Nakamura | Play 10 games |
| Ollie Santos | Score 5,000 points |
| Zeus Thunders | Hit 25 home runs |

### Secret Characters

| Name | Unlock Requirement |
|------|-------------------|
| Blaze the Dog | Score 10,000 points |
| Austin "Ace" Maverick | Score 25,000 points |

---

## Fields

### Starter Fields

1. **Dusty Acres Backyard** - Classic Texas backyard diamond
2. **Sunset Beach Diamond** - Sandy beach field with ocean breeze

### Unlockable Fields

| Field | Unlock Requirement |
|-------|-------------------|
| Treehouse Heights | Play 5 games |
| Rusty's Junkyard | Score 3,000 points |
| Downtown Rooftop | Hit 15 home runs |
| Old MacDonald's Farm | Play 15 games |
| Blaze Stadium | Score 15,000 points |

---

## API Endpoints

### Submit Score

```
POST /api/backyard/submit-score
```

**Request Body:**
```json
{
  "playerId": "player_123",
  "playerName": "Austin",
  "score": 2500,
  "characterId": "char_blaze_001",
  "stats": {
    "totalPitches": 15,
    "totalHits": 8,
    "singles": 4,
    "doubles": 2,
    "triples": 1,
    "homeRuns": 1,
    "whiffs": 3,
    "longestStreak": 5,
    "durationSeconds": 60
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rank": 42,
    "isHighScore": true,
    "playerStats": {
      "highScore": 2500,
      "gamesPlayed": 5,
      "totalHomeRuns": 12,
      "longestStreak": 5
    }
  }
}
```

### Get Leaderboard

```
GET /api/backyard/leaderboard?limit=10&period=alltime
```

**Query Parameters:**
- `limit` (optional): Number of entries (default: 10, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `period` (optional): `alltime`, `daily`, `weekly`, `monthly`
- `character` (optional): Filter by character ID

**Response:**
```json
{
  "success": true,
  "entries": [
    {
      "rank": 1,
      "playerId": "player_abc",
      "playerName": "Champion",
      "score": 15000,
      "characterId": "char_blaze_002",
      "gamesPlayed": 50,
      "totalHomeRuns": 125
    }
  ],
  "meta": {
    "period": "alltime",
    "totalPlayers": 1500,
    "lastUpdated": "2025-01-15T12:00:00Z",
    "cached": false
  }
}
```

### Get Player Stats

```
GET /api/backyard/player?id=player_123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playerId": "player_123",
    "playerName": "Austin",
    "highScore": 5000,
    "gamesPlayed": 25,
    "totalHomeRuns": 50,
    "longestStreak": 12,
    "rank": 15
  }
}
```

---

## React Embed Component

### Basic Usage

```tsx
import { BackyardBaseballEmbed } from '@/games/backyard/BackyardBaseballEmbed';

export default function GamePage() {
  return (
    <BackyardBaseballEmbed
      width="100%"
      height="600px"
    />
  );
}
```

### With Callbacks

```tsx
import { BackyardBaseballEmbed } from '@/games/backyard/BackyardBaseballEmbed';

export default function GamePage() {
  return (
    <BackyardBaseballEmbed
      width="100%"
      height="600px"
      playerId="user_123"
      playerName="Austin"
      onGameEnd={(result) => {
        console.log('Game ended:', result.finalScore);
      }}
      onScoreSubmit={(result, rank) => {
        console.log(`Ranked #${rank} with ${result.finalScore} points`);
      }}
      onError={(error) => {
        console.error('Game error:', error);
      }}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | string/number | '100%' | Container width |
| height | string/number | '600px' | Container height |
| playerId | string | auto-generated | Custom player ID |
| playerName | string | undefined | Player name for leaderboard |
| defaultCharacterId | string | undefined | Pre-select character |
| defaultFieldId | string | undefined | Pre-select field |
| autoStart | boolean | false | Skip menu and start immediately |
| apiBaseUrl | string | '/api/backyard' | API endpoint base URL |
| showLeaderboard | boolean | true | Show leaderboard after game |
| onGameEnd | function | undefined | Callback when game ends |
| onScoreSubmit | function | undefined | Callback when score submitted |
| onError | function | undefined | Callback for errors |

---

## Database Setup

### Create D1 Database

```bash
# Create the database
wrangler d1 create backyard-db

# Update wrangler.toml with the database ID
```

### Apply Schema

```bash
# Local development
npm run db:migrate

# Production
npm run db:migrate:production
```

### Create KV Namespace

```bash
# Create KV namespace for caching
wrangler kv:namespace create BACKYARD_CACHE

# Update wrangler.toml with the namespace ID
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial Load | < 5 seconds |
| Frame Rate | 60 FPS |
| Time to Interactive | < 3 seconds |
| Bundle Size (gzipped) | < 500 KB |
| Mobile Battery Impact | Low |

### Optimization Tips

1. **Babylon.js Lazy Loading**: Game engine loaded only when needed
2. **Texture Atlasing**: Combine small textures to reduce draw calls
3. **Object Pooling**: Reuse particles and temporary meshes
4. **KV Caching**: Leaderboard cached for 5 minutes

---

## Testing

### Manual Testing Checklist

- [ ] Game loads on desktop Chrome/Firefox/Safari
- [ ] Game loads on iOS Safari
- [ ] Game loads on Android Chrome
- [ ] Swing timing feels responsive
- [ ] Score submits correctly
- [ ] Leaderboard displays correctly
- [ ] Character selection works
- [ ] Sound effects play (if enabled)
- [ ] Game over screen shows correct stats

### Device Testing

Test on:
- iPhone 12+ (Safari)
- Samsung Galaxy S21+ (Chrome)
- iPad (Safari)
- Desktop Chrome/Firefox/Safari/Edge

---

## Embedding on BlazeSportsIntel.com

### Option 1: Direct iframe

```html
<iframe
  src="https://blaze-backyard-baseball.pages.dev"
  width="100%"
  height="600"
  frameborder="0"
  allow="autoplay; fullscreen"
></iframe>
```

### Option 2: React Component

```tsx
// In your Next.js page
import dynamic from 'next/dynamic';

const BackyardBaseball = dynamic(
  () => import('@/games/backyard/BackyardBaseballEmbed'),
  { ssr: false }
);

export default function GamesPage() {
  return (
    <div className="games-container">
      <h1>Blaze Backyard Baseball</h1>
      <BackyardBaseball height="70vh" />
    </div>
  );
}
```

---

## Legal Notes

This game is **100% original intellectual property**:

- All character names, designs, and backstories are original creations
- No Humongous Entertainment assets, names, or concepts used
- No reference to Backyard Baseball, Backyard Sports, or related trademarks
- Game mechanics inspired by classic batting games but uniquely implemented
- All art assets are either original or properly licensed

---

## Troubleshooting

### Game Won't Load

1. Check browser console for errors
2. Verify WebGL2 support: `about:gpu` in Chrome
3. Disable browser extensions that might block scripts
4. Try incognito/private mode

### Low Frame Rate

1. Close other browser tabs
2. Reduce browser window size
3. Update graphics drivers
4. Try a different browser

### Score Not Submitting

1. Check network connection
2. Verify API endpoint is accessible
3. Check browser console for API errors
4. Ensure localStorage is enabled

---

## Support

- **Issues**: github.com/ahump20/BSI/issues
- **Email**: ahump20@outlook.com
- **Website**: blazesportsintel.com

---

*Built with passion by Blaze Sports Intel. Born to Blaze the Path Less Beaten.*
