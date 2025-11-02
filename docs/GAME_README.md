# Backyard Blaze Ball Build & Run Guide

Mobile-first baseball mini-game shipping alongside BlazeSportsIntel web.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Commands

```bash
pnpm install
pnpm -w run build:games    # build Phaser bundle and sync into Next.js public assets
pnpm -w --filter @bsi/web build  # build the web app after games bundle exists
```

### Local Development

```bash
pnpm --filter @bsi/phaser-bbp-web dev
```

- Vite dev server runs at `http://localhost:5173`.
- Uses hot module replacement for scenes and systems.

### Production Build Flow

1. `pnpm -w run build:games` – runs Vite build for Phaser, outputs to `apps/games/phaser-bbp-web/dist`, then copies files to `public/games/bbp-web`.
2. `pnpm -w --filter @bsi/web build` – standard Next.js build now that static assets exist.
3. Deploy via Cloudflare Pages/Workers as documented in `CLOUDFLARE-PAGES-DEPLOYMENT.md`.

## Asset Replacement Workflow

- Default sprites are procedural vector graphics generated at runtime.
- To add AI-generated art, follow `docs/ai-assets/prompts-and-guidelines.md` and log provenance in `assets/LICENSES.md`.
- Keep bundles lightweight; prefer sprite atlases ≤ 256KB per target density.

## Analytics Integration

- Phaser iframe sends `postMessage` events (`session:start`, `session:update`, `session:end`).
- Next.js page listens and pipes events into the existing observability stack.
- Respect `doNotTrack`; events are suppressed when the browser sets DNT.

## Native Port (Godot)

- Minimal Godot project lives in `apps/games/godot-bbp-native`.
- Mirror Phaser mechanics before pursuing platform-specific polish.
- Mobile exports should target 60fps but degrade gracefully to 30fps under load.
