# Blaze Blitz Football

A 60-90 second arcade football microgame for BlazeSportsIntel.com. Built with Babylon.js 7.x, featuring NFL Blitz-inspired gameplay with snappy controls and over-the-top arcade physics.

## 100% Original IP

This game contains no NFL trademarks, player likenesses, team logos, or city names. All teams, characters, and branding are original creations of Blaze Sports Intel.

## Features

### Gameplay
- **7-on-7 Format**: Simplified football with focus on offense
- **60-Second Challenge**: Score as many points as possible in one drive
- **Arcade Physics**: Instant acceleration, turbo boost, exaggerated tackles
- **AI Defenders**: Yuka.js-style steering behaviors (Pursuit, Interpose)

### Controls

| Input | Action |
|-------|--------|
| W/A/S/D | Move player |
| Shift | Turbo boost (drains stamina) |
| Space | Snap ball / Throw / Tackle |
| 1-5 | Select receiver target |
| Click | Select receiver (mouse) |

### Scoring

| Action | Points |
|--------|--------|
| Yards gained | +10 per yard |
| Turbo yards | +15 per yard |
| First down | +100 bonus |
| Big play (20+ yds) | +200 bonus |
| Touchdown | +700 bonus |
| Stiff-arm | +50 bonus |
| Juke | +75 bonus |

## Teams

### Playable Teams

**Blaze Firebirds** (Default)
- Colors: Burnt Orange / Ember / Gold
- Stats: OFF 8 | DEF 6 | SPD 8 | PWR 7
- Special: Phoenix Rising (Turbo regenerates 50% faster when behind)

**Storm Thunder**
- Colors: Gold / Navy / White
- Stats: OFF 9 | DEF 5 | SPD 10 | PWR 5
- Special: Lightning Strike (Big plays give 2x bonus points)

**Iron Titans**
- Colors: Iron Gray / Dark Red / Silver
- Stats: OFF 7 | DEF 7 | SPD 5 | PWR 10
- Special: Iron Will (Cannot be tackled for loss on first contact)

**Venom Vipers**
- Colors: Forest Green / Black / Gold
- Stats: OFF 8 | DEF 8 | SPD 9 | PWR 6
- Special: Venom Strike (Stiff-arms have 100% success rate)

### AI Opponent

**Shadow Wolves**
- Colors: Midnight / Royal Blue / Silver
- Stats: OFF 6 | DEF 9 | SPD 7 | PWR 8
- Special: Pack Hunter (Defenders converge 25% faster)

## Technical Architecture

### Tech Stack
- **Engine**: Babylon.js 7.x
- **Physics**: Havok Physics (via @babylonjs/havok)
- **Build**: Vite + TypeScript
- **Backend**: Cloudflare Pages + D1 + KV
- **UI Framework**: React (for embed component)

### Project Structure

```
blitz/
├── src/
│   ├── core/
│   │   ├── BlitzGameEngine.ts      # Main game engine
│   │   ├── PlayerController.ts     # Input handling
│   │   ├── SteeringAI.ts           # Defender AI behaviors
│   │   ├── BallPhysics.ts          # Pass/catch mechanics
│   │   └── Field.ts                # Field generation
│   ├── data/
│   │   ├── teams.ts                # Team definitions
│   │   └── plays.ts                # Offensive/defensive plays
│   ├── ui/
│   │   └── BlitzFootballEmbed.tsx  # React embed component
│   └── main.ts                     # Entry point
├── functions/api/blitz/
│   ├── submit-score.ts             # Score submission API
│   └── leaderboard.ts              # Leaderboard API
├── index.html                      # Game HTML with arcade UI
├── schema.sql                      # D1 database schema
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml
```

## Physics System

### Player Movement
- **Acceleration**: 0.2 seconds to max speed (snappy arcade feel)
- **Base Speed**: 15 yards/second
- **Turbo Boost**: 1.5x speed multiplier
- **Stamina**: 100 points, drains at 25/sec during turbo, regens at 15/sec

### Ball Physics
- **Bullet Pass**: Hold throw button for flattened arc, higher velocity
- **Touch Pass**: Normal arc for timing routes
- **Lob Pass**: High arc for deep throws
- **Catch Radius**: 2.5 yard magnetic snap zone

### Tackle System
- **Tackle Radius**: 1.5 yards (sphere overlap check)
- **Late Hit Window**: 1.5 seconds after whistle
- **Knockback Impulse**: 8 units

## AI System

### Steering Behaviors (Yuka.js-inspired)

**Pursuit**: Predicts ball carrier position and intercepts
- Look-ahead time: 0.5 seconds
- Adjusts based on distance and speed

**Interpose**: Positions between ball and receiver
- Used for coverage assignments
- Configurable ratio (default: 0.6 toward receiver)

**Separation**: Prevents defender clustering
- Minimum separation: 3 yards
- Weighted by inverse distance

**Arrival**: Slows down when approaching target
- Prevents overshooting
- Smooth deceleration radius: 5 yards

## API Endpoints

### POST /api/blitz/submit-score

Submit a game score.

```json
{
  "playerId": "player_123",
  "playerName": "John Doe",
  "score": 2500,
  "teamId": "team_firebirds",
  "stats": {
    "yardsGained": 85,
    "touchdowns": 1,
    "firstDowns": 4,
    "bigPlays": 2,
    "turnovers": 0,
    "tacklesMade": 0,
    "stiffArms": 3,
    "jukes": 2,
    "turboYards": 45,
    "longestPlay": 35,
    "durationSeconds": 58,
    "result": "touchdown"
  }
}
```

### GET /api/blitz/leaderboard

Fetch leaderboard entries.

Query params:
- `limit` (default: 10, max: 100)
- `offset` (default: 0)
- `period` (alltime, daily, weekly, monthly)
- `team` (filter by team ID)

## React Embed Component

```tsx
import { BlitzFootballEmbed } from './src/ui/BlitzFootballEmbed';

function App() {
  return (
    <BlitzFootballEmbed
      width="100%"
      height="600px"
      playerId="user_123"
      playerName="John Doe"
      defaultTeamId="team_firebirds"
      onGameOver={(result) => {
        console.log('Final score:', result.finalScore);
      }}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | string/number | "100%" | Container width |
| height | string/number | "600px" | Container height |
| playerId | string | auto-generated | Player ID for leaderboard |
| playerName | string | undefined | Display name |
| defaultTeamId | string | "team_firebirds" | Initial team selection |
| autoStart | boolean | false | Start game immediately |
| apiEndpoint | string | "/api/blitz" | API base URL |
| onGameOver | function | undefined | Callback on game end |
| onGameStateChange | function | undefined | Callback on state updates |

## Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Setup

```bash
cd /Users/AustinHumphrey/BSI/games/blitz
npm install
```

### Development Server

```bash
# Frontend only
npm run dev

# With API functions
npm run dev:full
```

### Build & Deploy

```bash
# Build
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

### Database Migration

```bash
# Local
npm run db:migrate

# Production
npm run db:migrate:production
```

## Visual Style

### 90s Arcade Aesthetic
- Skewed UI elements (`transform: skewX(-10deg)`)
- Neon glow effects
- CRT scanline overlay
- Heavy sans-serif typography (Russo One)

### Color Palette
- Neon Green: #39FF14
- Hot Pink: #FF6EC7
- Construction Yellow: #FFD700
- Cyan: #00FFFF
- Purple: #9D00FF

### Brand Colors
- Burnt Orange: #BF5700
- Ember: #FF6B35
- Gold: #C9A227
- Charcoal: #1A1A1A
- Midnight: #0D0D0D

## Legal Compliance

### Safe Terminology

| Avoid | Use Instead |
|-------|-------------|
| Super Bowl | The Big Game, Championship |
| NFL | Pro League, Gridiron League |
| Real player names | Position names (Quarterback, Blitzer) |
| City names | Generic team names |

### No Trademarked Content
- No NFL team colors or logos
- No real player likenesses
- No stadium names
- No broadcast graphics mimicry

## Credits

- **Developer**: Blaze Sports Intel
- **Engine**: Babylon.js Team
- **Physics**: Havok (via Babylon.js)
- **Fonts**: Google Fonts (Russo One, Inter)

## License

UNLICENSED - Proprietary software of Blaze Sports Intel.

---

*Built with love in Boerne, Texas. Born to Blaze the Path Less Beaten.*
