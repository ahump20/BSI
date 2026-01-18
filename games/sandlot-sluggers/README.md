# Sandlot Sluggers

A nostalgic backyard baseball minigame built with Three.js for Blaze Sports Intel.

## Overview

Sandlot Sluggers is a browser-based batting practice game inspired by the sandlot baseball experience. Step up to the plate and test your timing against a variety of pitches.

**100% Original IP** - No MLB, NCAA, or legacy game content. All characters, teams, and assets are original creations.

## Features

- **Practice Mode**: Endless batting practice to hone your timing
- **Quick Play Mode**: One-inning challenge - make every at-bat count
- **Deterministic Gameplay**: Reproducible pitch/swing mechanics using seeded RNG
- **Mobile + Desktop**: Touch controls and keyboard support
- **GLB-First Architecture**: Blender-exported field assets with stable node naming

## Tech Stack

- **Rendering**: Three.js ^0.160.0
- **Build**: Vite + TypeScript
- **Architecture**: GLB contract system for Blender → game integration
- **Deployment**: Cloudflare (R2 for assets, Workers for backend)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Game Controls

| Action      | Keyboard | Mobile       |
| ----------- | -------- | ------------ |
| Start Pitch | Space    | Tap anywhere |
| Swing       | Space    | Tap anywhere |

## Project Structure

```
sandlot-sluggers/
├── src/
│   ├── main.ts           # Entry point, input handling
│   └── syb/              # Core game systems
│       ├── engine.ts     # Main game loop
│       ├── scene.ts      # GLB loading, node indexing
│       ├── cameras.ts    # Camera rig and transitions
│       ├── pitch.ts      # Pitch mechanics
│       ├── batting.ts    # Swing timing, contact, fielding
│       ├── gameState.ts  # Innings, runs, stats
│       └── ui.ts         # HUD overlay
├── public/
│   └── assets/           # GLB field asset (gitignored)
├── index.html
├── vite.config.ts
└── tsconfig.json
```

## GLB Contract

The game expects a GLB file exported from Blender with specific node naming:

### Required Anchors

- `SYB_Root` - Scene root
- `SYB_Anchor_Home` - Home plate
- `SYB_Anchor_1B/2B/3B` - Bases
- `SYB_Anchor_Mound` - Pitcher's mound
- `SYB_Anchor_Batter` - Batter position
- `SYB_Anchor_*_F` - Fielder positions

### Required Cameras

- `SYB_Cam_BehindBatter` - Default batting view
- `SYB_Cam_StrikeZoneHigh` - Pitch tracking view
- `SYB_Cam_Isometric` - Field play view

### Aim Targets

- `SYB_Aim_StrikeZone` - Strike zone center
- `SYB_Aim_Mound` - Pitch origin

See `04_GLB_PIPELINE.md` in the brief pack for full Blender export settings.

## Environment Variables

| Variable       | Description            | Default                     |
| -------------- | ---------------------- | --------------------------- |
| `VITE_GLB_URL` | URL to field GLB asset | `/assets/sandlot-field.glb` |

## Development

### Without GLB Asset

The game includes a fallback scene with primitive geometry. Start with `npm run dev` and the fallback field will render automatically.

### With Custom GLB

1. Create field in Blender following the GLB contract
2. Export as GLB with Y-up → Z-up conversion
3. Place in `public/assets/sandlot-field.glb`
4. Restart dev server

### Type Checking

```bash
npm run typecheck
```

## IP Safety

This project maintains strict IP boundaries:

- **No MLB content**: No team names, logos, player likenesses
- **No NCAA content**: No university names or branding
- **No legacy game content**: No Backyard Baseball assets or names
- **Original everything**: Characters, teams, and assets are BSI originals

See `03_LEGAL_IP_GUARDRAILS.md` and `08_SAFE_NAMING_PACK.md` for approved naming conventions.

## License

Proprietary - Blaze Sports Intel

## Credits

Built for Blaze Sports Intel by Claude Code.
