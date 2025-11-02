# Game Development - Build & Run Guide

This document provides instructions for building, running, and deploying Blaze Sports Intel games.

## Overview

BSI Games consists of:
- **Web Games**: Phaser-based games embedded in Next.js site
- **Native Games** (future): Godot-based games for mobile/desktop

## Quick Start

### Prerequisites

- **Node.js**: 18.x or later
- **pnpm**: 10.x or later (workspace package manager)
- **Git**: For version control

### Installation

```bash
# Clone repository
git clone https://github.com/ahump20/BSI.git
cd BSI

# Install dependencies (all workspaces)
pnpm install
```

## Web Game Development (Phaser)

### Project Structure

```
apps/games/phaser-bbp-web/
├── src/
│   ├── main.ts              # Entry point
│   ├── config/
│   │   └── GameConfig.ts    # Game constants
│   ├── scenes/              # Phaser scenes
│   │   ├── BootScene.ts     # Loading
│   │   ├── MenuScene.ts     # Main menu
│   │   └── GameScene.ts     # Gameplay
│   ├── systems/             # Game logic
│   │   ├── PhysicsSystem.ts # Ball physics
│   │   ├── InputSystem.ts   # Touch/keyboard
│   │   ├── AudioSystem.ts   # Sound effects
│   │   └── GameState.ts     # Score tracking
│   └── ui/                  # UI components
│       ├── Scoreboard.ts
│       └── Tutorial.ts
├── assets/                  # Game assets
│   ├── sprites/             # Character sprites
│   └── audio/               # Sound effects
├── index.html               # HTML entry
├── vite.config.js           # Vite build config
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

### Development Workflow

#### 1. Run Game Locally (Hot Reload)

```bash
cd apps/games/phaser-bbp-web
pnpm dev
```

Opens at http://localhost:8080 with live reload on code changes.

#### 2. Build for Production

```bash
cd apps/games/phaser-bbp-web
pnpm build
```

Outputs to `dist/` directory. Files are:
- `index.html` - Entry point
- `assets/index-[hash].js` - Game code bundle (~15KB)
- `assets/phaser-[hash].js` - Phaser library (~1.5MB, gzips to ~326KB)

#### 3. Preview Production Build

```bash
cd apps/games/phaser-bbp-web
pnpm preview
```

Opens production build at http://localhost:4173

### Integration with Next.js Site

The game is embedded in the main BSI website:

#### Build Process

```bash
# From repository root
pnpm build:games
```

This:
1. Builds Phaser game to `apps/games/phaser-bbp-web/dist`
2. Copies dist to `apps/web/public/games/bbp-web`
3. Next.js serves it as static files

#### Next.js Routes

- `/games` - Games landing page
- `/games/bbp` - Baseball game page (iframe embed)
- `/games/bbp/legal` - Legal compliance and credits

**Game embed**: Uses iframe pointing to `/games/bbp-web/index.html`

### Testing

#### Local Testing

1. Build game: `cd apps/games/phaser-bbp-web && pnpm build`
2. Copy to public: `cp -r dist ../../web/public/games/bbp-web`
3. Run Next.js: `cd ../../web && pnpm dev`
4. Open: http://localhost:3000/games/bbp

#### Mobile Testing

**Browser DevTools:**
1. Open game in Chrome
2. Press F12 → Toggle device toolbar
3. Test on various screen sizes
4. Throttle network to "Fast 3G"
5. Test touch controls (click-and-drag to simulate touch)

**Real Device:**
1. Build and deploy to preview environment
2. Open on mobile device
3. Test touch controls, orientation, performance

### Asset Management

#### Adding New Assets

1. **Create/Generate Asset**
   - Follow `docs/ai-assets/prompts-and-guidelines.md` for AI-generated assets
   - Or create original art using design tools

2. **Optimize Asset**
   ```bash
   # Images: Convert to WebP
   cwebp -q 80 input.png -o output.webp

   # Audio: Convert to MP3 (compressed)
   ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3
   ```

3. **Add to Project**
   ```
   Place in: apps/games/phaser-bbp-web/assets/[sprites|audio]/filename.ext
   ```

4. **Load in BootScene**
   ```typescript
   // src/scenes/BootScene.ts
   preload(): void {
     this.load.image('player', 'assets/sprites/player.png');
     this.load.audio('hit', 'assets/audio/hit.mp3');
   }
   ```

5. **Use in Game**
   ```typescript
   // src/scenes/GameScene.ts
   create(): void {
     this.player = this.add.sprite(x, y, 'player');
     this.sound.play('hit');
   }
   ```

6. **Document**
   - Update `assets/LICENSES.md`
   - Save prompt to `docs/ai-assets/generated/` (if AI-generated)
   - Update legal page if needed

#### Replacing Placeholder Assets

Current version uses geometric shapes. To upgrade:

| Current | Replacement | Priority |
|---------|-------------|----------|
| Rectangle sprites | Character sprites | High |
| Circle ball | Baseball sprite | Medium |
| Gradient fields | Stadium background | Medium |
| No audio | Sound effects | Low |
| System fonts | Custom font (optional) | Low |

See **Asset Replacement Roadmap** below.

## Native Game Development (Godot)

### Status

**Godot project is currently a stub** for future native builds. Web version (Phaser) is the active implementation.

### Setup (Future)

1. Install Godot 4.3+
2. Open `apps/games/godot-bbp-native/project.godot`
3. Run in editor (F5)

See `apps/games/godot-bbp-native/README.md` for roadmap.

## Full Build Process (All Games + Site)

### Complete Build

```bash
# From repository root
pnpm install          # Install all dependencies
pnpm build:games      # Build Phaser game + copy to public
cd apps/web && pnpm build  # Build Next.js site
```

Output:
- Next.js site: `apps/web/.next/`
- Game embedded at: `apps/web/public/games/bbp-web/`

### Cloudflare Deployment

**Automatic (via CI/CD):**

Push to main branch triggers:
1. `pnpm install` (all workspaces)
2. `pnpm build:games` (builds game)
3. `pnpm -w build` (builds site)
4. Cloudflare Pages deployment

**Manual:**

```bash
# Build
pnpm install
pnpm build:games
cd apps/web && pnpm build

# Deploy
wrangler pages deploy .next --project-name blazesportsintel
```

### Performance Optimization

#### Game Bundle Size

Current:
- Game code: ~15KB (minified)
- Phaser library: ~1.5MB (~326KB gzipped)
- Total: ~341KB over network

**Optimization:**
- Phaser is code-split (loads separately)
- Vite tree-shakes unused Phaser features
- Served with Brotli compression on Cloudflare

#### Load Time Targets

- **First Byte**: < 600ms (Cloudflare Edge)
- **Game Interactive**: < 3s on 4G mobile
- **Frame Rate**: 60fps on mid-range devices

#### Monitoring

Check performance in:
- Lighthouse CI (automated on PRs)
- Browser DevTools Performance tab
- Real User Monitoring (Datadog RUM)

## Asset Replacement Roadmap

### Phase 1: Character Sprites (Priority: High)

**Current**: Colored rectangles
**Target**: Original cartoon characters

**Steps**:
1. Generate 2-3 batter sprites using AI (Midjourney)
2. Generate 1 pitcher sprite
3. Optimize to WebP format
4. Update GameScene.ts to use sprites
5. Test across devices

**ETA**: 2-3 hours

### Phase 2: Ball & Field (Priority: Medium)

**Current**: Circle + gradients
**Target**: Baseball sprite + simple field background

**Steps**:
1. Create/generate baseball sprite (16x16px)
2. Create simple grass/dirt field background (800x600px)
3. Update GameScene.ts
4. Test

**ETA**: 1 hour

### Phase 3: Audio (Priority: Low)

**Current**: No audio (placeholder system)
**Target**: Basic sound effects

**Sounds Needed**:
- Bat swing (whoosh)
- Ball hit (crack)
- Strike sound (thud)
- Crowd cheer (for home runs)

**Steps**:
1. Generate sounds using AI audio tool (ElevenLabs or Soundful)
2. Convert to MP3 format
3. Update AudioSystem.ts
4. Update BootScene.ts to load sounds
5. Test volume levels

**ETA**: 2 hours

### Phase 4: UI Polish (Priority: Low)

**Current**: Simple text labels
**Target**: Styled UI with icons

**Steps**:
1. Design scoreboard UI (Figma or AI-generated)
2. Create button sprites for menu
3. Add icons for outs, strikes, balls
4. Update UI components
5. Test readability on mobile

**ETA**: 3 hours

## Troubleshooting

### Game Won't Build

```bash
# Clear caches
rm -rf apps/games/phaser-bbp-web/node_modules
rm -rf apps/games/phaser-bbp-web/dist

# Reinstall
cd apps/games/phaser-bbp-web
pnpm install
pnpm build
```

### Game Not Loading in Next.js

1. Verify build output exists:
   ```bash
   ls apps/web/public/games/bbp-web/
   # Should see: index.html, assets/
   ```

2. Check Next.js is serving static files:
   - Visit http://localhost:3000/games/bbp-web/index.html directly
   - Should see game

3. Check iframe sandbox permissions in `/games/bbp/page.tsx`

### Touch Controls Not Working

1. Check canvas touch event handling in `src/main.ts`
2. Verify InputSystem.ts registers `pointerdown` events
3. Test in real mobile browser (not just DevTools)

### Poor Performance on Mobile

1. **Check Frame Rate**:
   ```typescript
   // Add to GameScene.ts update()
   console.log(this.game.loop.actualFps);
   ```

2. **Reduce Particles**: Lower particle count in animations
3. **Simplify Graphics**: Use simpler sprites, fewer tweens
4. **Profile**: Use Chrome DevTools Performance tab

### Asset Not Appearing

1. **Check Console**: Look for 404 errors
2. **Verify Path**: Asset path relative to `assets/` directory
3. **Check Preload**: Ensure asset loaded in `BootScene.ts`
4. **Check Spelling**: Asset keys are case-sensitive

## Development Best Practices

### Code Style

- **TypeScript**: Use strict mode
- **Naming**: PascalCase for classes, camelCase for variables
- **Comments**: Document complex game logic
- **Types**: Always specify types for function parameters/returns

### Git Workflow

1. Branch from `main`
2. Name: `feat/game-feature-name` or `fix/bug-description`
3. Commit often with clear messages
4. Test locally before pushing
5. Create PR when ready

### Testing Checklist

Before submitting PR:

- [ ] Game builds without errors
- [ ] Game runs in dev mode
- [ ] Game runs in production build
- [ ] Touch controls work on mobile
- [ ] Desktop controls work (keyboard)
- [ ] No console errors
- [ ] Assets load correctly
- [ ] Frame rate is smooth (60fps)
- [ ] Legal compliance verified (no IP violations)

## Resources

### Documentation

- **Phaser 3**: https://photonstorm.github.io/phaser3-docs/
- **Vite**: https://vitejs.dev/guide/
- **TypeScript**: https://www.typescriptlang.org/docs/

### Internal Docs

- `LEGAL_COMPLIANCE.md` - Legal requirements
- `assets/LICENSES.md` - Asset manifest
- `docs/ai-assets/prompts-and-guidelines.md` - AI asset guidelines
- `apps/games/phaser-bbp-web/README.md` - Game-specific docs

### Support

- **Issues**: GitHub Issues tab
- **Questions**: team@blazesportsintel.com (placeholder)

---

**Last Updated**: 2025-11-02
**Next Review**: When major game updates occur
