# Original Baseball Game - Web Version

A mobile-friendly, original baseball batting game built with Phaser 3.

## ⚠️ Legal Notice

This game contains **100% original content**. No Backyard Baseball assets, characters, names, or distinctive visual elements are used or referenced. All game mechanics, sprites, and audio are created specifically for this project.

## Features

- ✅ Simple, timing-based batting mechanics
- ✅ Touch-first controls (tap to swing)
- ✅ Desktop support (space bar to swing)
- ✅ 3-inning game format
- ✅ Multiple pitch types (fastball, changeup, curveball)
- ✅ Hit outcomes based on timing (home run, triple, double, single, out, foul)
- ✅ Score tracking and simple CPU opponent
- ✅ Tutorial overlay for first-time players
- ✅ Responsive design that fits any screen size

## Tech Stack

- **Phaser 3.80+**: Game engine
- **TypeScript**: Type-safe game logic
- **Vite**: Fast build tool and dev server

## Development

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

Opens at http://localhost:8080 with hot reload.

### Build for Production

```bash
pnpm build
```

Outputs to `dist/` directory.

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
phaser-bbp-web/
├── src/
│   ├── main.ts              # Game entry point
│   ├── config/
│   │   └── GameConfig.ts    # Game constants and rules
│   ├── scenes/
│   │   ├── BootScene.ts     # Loading and initialization
│   │   ├── MenuScene.ts     # Main menu
│   │   └── GameScene.ts     # Core gameplay
│   ├── systems/
│   │   ├── PhysicsSystem.ts # Ball physics and hit detection
│   │   ├── InputSystem.ts   # Touch/keyboard input handling
│   │   ├── AudioSystem.ts   # Sound effects (placeholder)
│   │   └── GameState.ts     # Score and inning tracking
│   └── ui/
│       ├── Scoreboard.ts    # Score display
│       └── Tutorial.ts      # Tutorial overlay
├── assets/                   # Game assets (sprites, audio)
│   ├── sprites/             # Character and object sprites (placeholder)
│   ├── audio/               # Sound effects (placeholder)
│   └── fonts/               # Custom fonts (optional)
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Game Mechanics

### Batting

- **Perfect Timing** (±50ms): Home run
- **Good Timing** (±150ms): Double or triple
- **Early/Late** (±200ms): Single
- **Very Early/Late**: Foul or out

### Pitch Types

- **Fastball**: Fast straight pitch (red ball)
- **Changeup**: Slower pitch to throw off timing (blue ball)
- **Curveball**: Medium speed with slight variance (green ball)

### Scoring

- 3 innings
- 3 outs per half-inning
- CPU innings are auto-simulated
- Player with most runs at end wins

## Mobile Optimization

- Touch-first control design
- Large tap targets (entire screen is swing button)
- Responsive scaling (fits any screen size)
- Prevents pull-to-refresh and zoom gestures
- Optimized for 60fps on mid-range devices

## Asset Replacement

Current assets are simple geometric shapes. To replace with custom sprites:

1. Add image files to `assets/sprites/`
2. Update `BootScene.ts` to load them:
   ```typescript
   this.load.image('batter', 'assets/sprites/batter.png');
   ```
3. Replace rectangles in `GameScene.ts` with sprites:
   ```typescript
   this.batter = this.add.sprite(x, y, 'batter');
   ```

See `docs/ai-assets/prompts-and-guidelines.md` for AI-assisted asset generation.

## Known Limitations (MVP)

- No base running (simplified scoring)
- CPU innings are auto-simulated (not playable)
- No sound effects yet (placeholders only)
- No player/team customization
- Simple geometric placeholder graphics

## Future Enhancements

- [ ] Custom character sprites (AI-generated)
- [ ] Sound effects and music
- [ ] Base running mechanics
- [ ] Multiple stadiums
- [ ] Player stats and progression
- [ ] Multiplayer mode
- [ ] Power-ups and special abilities

## License

UNLICENSED - Proprietary to Blaze Sports Intel.

All game content is original. No third-party IP is used.
