# BSI: Inferno Sprint - Architecture

## Overview

Inferno Sprint is a WebGL2 3D game built on the Dante engine, optimized for speed and mobile-first performance. The architecture prioritizes:

1. **Minimal Bundle Size**: Aggressive minification and tree-shaking
2. **Instant Load**: No external dependencies, procedural assets
3. **Cloudflare-First**: Workers for API, KV for storage, Pages for hosting

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                          │
├─────────────────────┬───────────────────────────────────────┤
│   Pages (Static)    │         Workers (API)                 │
│   ─────────────     │         ────────────                  │
│   - index.html      │         - POST /api/score             │
│   - bundle.js       │         - GET /api/leaderboard        │
│   - index.css       │         - GET /api/version            │
│                     │                                       │
└─────────────────────┴───────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  KV Namespace   │
                    │  (Leaderboard)  │
                    └─────────────────┘
```

## Frontend Architecture

### Rendering Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Game Loop   │───▶│  Collision   │───▶│   Shadow     │
│  (60fps)     │    │   Render     │    │   Maps       │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
                          ┌──────────────┐    ┌──────────────┐
                          │     Sky      │◀───│    Main      │
                          │   Render     │    │   Render     │
                          └──────────────┘    └──────────────┘
```

### Key Components

| File | Purpose |
|------|---------|
| `main-loop.ts` | Core game loop, WebGL setup, render orchestration |
| `page.ts` | Input handling, UI updates, timer HUD |
| `world-state.ts` | Game state, sprint logic, score submission |
| `game-time.ts` | Delta time, game clock management |
| `player.ts` | Player physics, movement, collision |

### GPU Collision Detection

The game uses a novel GPU-based collision system:

1. Render scene to offscreen canvas with collision shader
2. Use `readPixels` to sample collision data
3. Red/Green channels encode front/back distances
4. Near-instant collision detection without CPU raycasting

### Cascaded Shadow Maps (CSM)

Two shadow map passes for quality/performance balance:

- **Near plane**: High-detail shadows close to player
- **Far plane**: Lower-detail shadows for distant geometry

## Backend Architecture

### Leaderboard Worker

```typescript
// Score validation flow
Request → Validate Time → Validate Souls → Hash Check → Store → Respond
```

### Anti-Cheat Measures

1. **Time Bounds**: Reject times faster than physically possible (~15s min)
2. **Soul Count**: Must collect exactly 13 souls
3. **Timestamp Validation**: Prevent future-dated submissions
4. **Hash Verification**: Server-side signature of run data
5. **Rate Limiting**: Implicit via Cloudflare

### KV Schema

```json
{
  "leaderboard": [
    {
      "playerName": "SwiftRunner42",
      "time": 45.23,
      "timestamp": 1705123456789
    }
  ]
}
```

## Build Pipeline

```
Source (TypeScript)
        │
        ▼
   Vite Build
        │
   ├─── GLSL Minification (vite-plugin-glsl)
   ├─── TypeScript Compilation
   ├─── Tree Shaking
   └─── Terser Minification
        │
        ▼
   dist/ (Production Bundle)
        │
        ▼
   Cloudflare Pages Deploy
```

## Performance Optimizations

### Rendering
- Instanced rendering for souls
- Batched draw calls for world geometry
- Frustum culling via CSM projection

### Memory
- Float32Array for transform buffers
- DOMMatrix for matrix operations (native performance)
- Procedural textures from SVG (no image downloads)

### Bundle Size
- No external runtime dependencies
- Property mangling for `$`-prefixed members
- Dead code elimination via `DEBUG` constants

## Directory Structure

```
apps/inferno-sprint/
├── src/
│   ├── game/          # Game logic
│   ├── geometry/      # 3D model generation
│   ├── math/          # Vector/matrix utilities
│   ├── music/         # Audio synthesis
│   ├── shaders/       # GLSL shaders
│   ├── utils/         # Helpers
│   ├── index.ts       # Entry point
│   ├── main-loop.ts   # Render loop
│   └── page.ts        # UI/Input
├── workers/
│   └── leaderboard.ts # API Worker
├── public/            # Static assets
├── wrangler.toml      # Cloudflare config
└── vite.config.ts     # Build config
```

## Data Flow

### Score Submission

```
Player Completes Run
        │
        ▼
Calculate Final Time
        │
        ▼
Check Personal Best (localStorage)
        │
        ▼
POST /api/score
        │
        ▼
Worker Validates + Stores
        │
        ▼
Return Rank to Client
```

### Leaderboard Fetch

```
User Opens Leaderboard
        │
        ▼
GET /api/leaderboard?limit=25
        │
        ▼
Worker Reads KV
        │
        ▼
Return Sorted Entries
        │
        ▼
Render in Overlay
```

## Security Considerations

See [SECURITY.md](./SECURITY.md) for detailed security documentation.
