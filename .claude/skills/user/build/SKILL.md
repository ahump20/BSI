---
name: build
description: |
  Unified builder — routes any "build" request to the right subsystems and runs the full pipeline.
  Handles frontend pages, browser games, standalone HTML artifacts, and backend APIs.

  Triggers: /build, "build me a...", "create a...", "make a...", any request to construct
  a UI, game, artifact, API, worker, or interactive tool.

  Modes: Frontend (pages, components, dashboards), Game (arcade, physics, engines),
  Artifact (standalone single-file HTML demos), Backend (APIs, workers, pipelines).
  Multiple modes activate simultaneously when the request spans domains.
---

# /build — Unified Builder

Single entry point for all construction work. Classifies the request, activates the right subsystems, and runs from design through delivery.

## Step 1: Classify

Read the user's request and activate one or more modes based on signal words. Do NOT pause to confirm — announce which modes activated and start working.

### Mode Detection

| Mode | Signal Words | Subsystems to Activate |
|------|-------------|----------------------|
| **Frontend** | page, component, landing, dashboard, UI, design, layout, section, hero, nav, form | `frontend-design` skill (+ `blaze-platform-visual-design` for BSI pages) |
| **Game** | game, arcade, platformer, physics, multiplayer, player, level, score, engine | `game-dev-master` skill |
| **Artifact** | artifact, standalone, single-file, demo, prototype, bundle, HTML app, playground, interactive tool, data viz | `web-artifacts-builder` scripts + `frontend-design` skill |
| **Backend** | API, endpoint, worker, database, pipeline, cron, schema, KV, D1, R2, ingest | `backend-design` agent |

**Rules:**
- Multiple modes activate simultaneously. "Build a game with a leaderboard API" → Game + Backend.
- "Build a standalone radar chart" → Artifact (standalone + data viz).
- "Build a new college baseball page" → Frontend (it's a page in the existing site).
- If no clear signal, default to Frontend.
- Artifact mode is for things that live OUTSIDE the main codebase as self-contained HTML files. If the request is about a page within blazesportsintel.com, that's Frontend mode.

**Announce format:**
```
Building: [one-line description of what's being built]
Modes: [Frontend | Game | Artifact | Backend] (comma-separated if multiple)
```

Then proceed immediately to Step 2.

## Step 2: Design

Run the design phase for each activated mode. These can run in parallel when independent.

### Frontend Design Phase

1. **Invoke `frontend-design:frontend-design` skill** for aesthetic direction and anti-slop rules.
2. For BSI pages, also invoke `blaze-platform-visual-design` skill for Heritage Design System tokens and brand compliance.
3. Synthesize into a design direction before writing code.

### Game Design Phase

1. **Invoke `game-dev-master` skill** — follow its scope assessment and engine selection workflow.
2. For browser games, also read the web-game-patterns reference from the skill.
3. Determine: scope tier, engine/framework, core mechanics, architecture pattern.

### Artifact Design Phase

1. **Invoke `frontend-design:frontend-design` skill** for aesthetic direction and anti-slop rules.
2. Plan the data model and interactivity — artifacts are self-contained, so all state management is local.
3. Determine whether the artifact needs external data (fetched at build time and embedded) or is purely interactive.

### Backend Design Phase

1. **Launch `backend-design` agent** via Agent tool with the API/worker/pipeline requirements.
2. The agent designs contracts, schema, caching strategy, and implements.
3. Backend design runs in parallel with frontend/game design when both modes are active.

## Step 3: Build

Execute in dependency order. Backend must complete before frontend if frontend depends on API contracts.

### Frontend Build

- Build within the existing BSI codebase (Next.js App Router pages, shared components).
- Apply the design direction from Step 2.
- Follow BSI conventions: `'use client'` for interactive components, `generateStaticParams()` for dynamic routes, mobile-first, Tailwind CSS.

### Game Build

- Follow the game-dev-master architecture decisions from Step 2.
- For BSI Arcade games: build in `~/games/<game-name>/`, deploy to `arcade.blazesportsintel.com`.
- For standalone games: build wherever makes sense.

### Artifact Build

1. **Scaffold:** Run init-artifact.sh to create the project:
   ```bash
   bash ~/.claude/skills/user/build/scripts/init-artifact.sh "<project-name>"
   ```
   This creates a React 18 + TypeScript + Vite + Tailwind + shadcn/ui project at `~/tmp/<project-name>`.

2. **Implement:** Build the artifact in the scaffolded project. Apply the design direction from Step 2. The project has path aliases (@/), shadcn/ui components (Button, Card), and Tailwind pre-configured.

3. **Bundle:** When implementation is complete, bundle to single HTML:
   ```bash
   bash ~/.claude/skills/user/build/scripts/bundle-artifact.sh ~/tmp/<project-name>
   ```
   Output: `~/tmp/<project-name>/bundle.html`

### Backend Build

- The backend-design agent handles implementation.
- If running alongside Frontend mode, share the API contracts so frontend can build against them.

## Step 4: Test Deploy

Every mode that touches production infrastructure gets a test deploy before going live. This is not optional — it fires automatically as part of the build pipeline.

### Frontend Test Deploy (BSI Site)

```bash
# Build the static export
cd ~/BSI && npm run build

# Deploy to preview branch (NOT production)
npm run deploy:preview
```

Preview URL will be something like `https://<branch>.blazesportsintel.pages.dev`. Open it and verify.

### Backend Test Deploy (Workers)

For the main worker:
```bash
cd ~/BSI && wrangler deploy --config workers/wrangler.toml --env preview
```

For standalone workers (e.g., `bsi-live-scores`, `bsi-savant-compute`):
```bash
wrangler deploy --config workers/<worker-name>/wrangler.toml --dry-run
```

If dry-run passes, deploy to the worker's `.workers.dev` domain (non-production route) and hit the health endpoint to verify.

### Game Test Deploy (Arcade)

```bash
cd ~/games/<game-name> && npm run build
npx wrangler pages deploy dist --project-name=bsi-arcade --branch=preview
```

Preview URL: `https://preview.bsi-arcade.pages.dev`. Open and play-test.

### Artifact Test

No deploy needed — artifacts are local. Open `bundle.html` in browser and verify it works self-contained.

## Step 5: Verify

Check the test deployment before going to production. What to verify per mode:

**Frontend:** Page renders correctly, no broken layouts, data loads, mobile viewport works.
**Backend:** Health endpoint returns 200, expected data shape in responses, no 500s on known routes.
**Game:** Game loads, core loop works, no console errors.
**Artifact:** Opens in browser with no network requests, all interactivity functional.

Use browser automation tools (Claude in Chrome) when available. Otherwise, use `curl` for backend endpoints and report what to visually check for frontend/game.

If verification fails, fix the issue and re-run the test deploy. Do not proceed to production.

## Step 6: Production Deploy

Once test deploy is verified, ship to production. Ask for confirmation before this step — production deploys are irreversible in the short term.

### Frontend Production Deploy

```bash
cd ~/BSI && npm run deploy:production
```

This runs: build → stage (rsync to `/tmp/bsi-deploy-out`) → `wrangler pages deploy` to production.

If the build also touches the main worker (new API routes, handler changes):
```bash
npm run deploy:hybrid
```

### Backend Production Deploy

Main worker:
```bash
cd ~/BSI && npm run deploy:worker
```

Standalone workers — each has its own wrangler config:
```bash
wrangler deploy --config workers/<worker-name>/wrangler.toml
```

Common standalone deploys:
| Worker | Command |
|--------|---------|
| live-scores | `npm run deploy:live-scores` |
| daily-digest | `npm run deploy:daily-digest` |
| arcade-api | `npm run deploy:arcade-api` |
| savant-compute | `wrangler deploy --config workers/bsi-savant-compute/wrangler.toml` |
| cbb-analytics | `wrangler deploy --config workers/bsi-cbb-analytics/wrangler.toml` |
| intelligence-stream | `wrangler deploy --config workers/bsi-intelligence-stream/wrangler.toml` |
| synthetic-monitor | `wrangler deploy --config workers/synthetic-monitor/wrangler.toml` |

After deploy, hit the production health endpoint to confirm.

### Game Production Deploy

```bash
cd ~/games/<game-name> && npm run build
npx wrangler pages deploy dist --project-name=bsi-arcade --branch=main
```

Live at: `arcade.blazesportsintel.com`

### Artifact Production

Artifacts don't deploy to infrastructure. Delivery is the `bundle.html` file itself. Report its location and size.

## Step 7: Deliver

Report what shipped and where it lives. Plain language — what the visitor sees, what changed, what's live.

**Frontend:** Which pages are now live at blazesportsintel.com, what the visitor experiences.
**Backend:** Which endpoints are live, what they serve, any new data flowing.
**Game:** Game is playable at arcade.blazesportsintel.com, what modes/features are available.
**Artifact:** Bundle location, file size, how to open it.

## Subsystem Reference

Full paths and invocation details for all 5 subsystems: `~/.claude/skills/user/build/references/subsystem-map.md`
