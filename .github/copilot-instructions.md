# Copilot Instructions for BSI (Blaze Sports Intel)

## Architecture Overview

BSI is a **Cloudflare-only** sports intelligence platform. All infrastructure runs on Cloudflare—no exceptions.

- **Frontend**: Next.js 16 + React 19 deployed to Cloudflare Pages (build output: `out/`)
- **API**: Cloudflare Pages Functions (`functions/api/`) with gateway at `functions/api-gateway.js`
- **Workers**: Domain-specific workers in `workers/` (e.g., `bsi-ticker`, `bsi-cfb-ai`)
- **Data**: D1 (SQLite), KV (cache), R2 (assets), Vectorize (embeddings)
- **Real-time**: Durable Objects for WebSocket connections (`bsi-news-ticker`)

## Anti-Sprawl Rules (Critical)

1. **Replace, don't add** — New code replaces obsolete code in the same commit
2. **Search before create** — Run `grep -r` to check for existing implementations
3. **Delete obsolete** — Remove dead code in the same PR
4. **One way to do things** — Consolidate duplicate patterns

## Naming Conventions

| Resource | Pattern                   | Example            |
| -------- | ------------------------- | ------------------ |
| Worker   | `bsi-{domain}-{function}` | `bsi-scores-live`  |
| KV       | `BSI_{DOMAIN}_{PURPOSE}`  | `BSI_SCORES_CACHE` |
| D1       | `bsi-{domain}-db`         | `bsi-analytics-db` |
| R2       | `bsi-{domain}-assets`     | `bsi-media-assets` |

KV key prefixes: `cache:*`, `scores:*`, `nil:*`, `session:*`, `rate_limit:*`

## Data Provider Failover

The `lib/adapters/provider-manager.ts` implements circuit breaker pattern with failover:

1. **SportsDataIO** (primary) → 2. **NCAA API** → 3. **ESPN API**

Add new adapters in `lib/adapters/` following existing patterns (e.g., `highlightly-adapter.ts`).

## TypeScript Standards

```typescript
// ✓ Explicit return types on exports
export function parseScore(raw: string): GameScore {}

// ✓ Early returns
if (!id) return null;

// ✓ Typed errors
throw new APIError(`Failed: ${response.statusText}`, response.status, url);

// ✗ Never: any, nested ternaries, magic numbers, console.log
```

## Key Directories

- `app/` — Next.js pages (routes mirror URL structure: `/mlb`, `/college-baseball`, etc.)
- `functions/api/` — API endpoints (70+ endpoints organized by sport)
- `workers/` — Standalone Workers (ticker, predictions, rankings)
- `lib/adapters/` — Data source adapters with normalization
- `components/` — React components (domain-specific subdirectories)
- `tests/` — Vitest unit tests + Playwright E2E (`npm run test`, `npm run test:a11y`)

## Commands

```bash
npm run dev           # Next.js dev server (localhost:3000)
npm run test          # Vitest watch mode
npm run test:a11y     # Playwright accessibility tests
npm run deploy        # Build + deploy to Cloudflare Pages
npm run lint:fix      # ESLint + auto-fix
```

## Design Tokens

- Burnt orange: `#BF5700`, Texas soil: `#8B4513`
- Charcoal: `#1A1A1A`, Midnight: `#0D0D0D`, Ember (accent): `#FF6B35`
- **No visual noise**: Never add film grain, noise overlays, or SVG turbulence filters

## Git Commits

```bash
feat(scores): add live score polling for MLB
fix(api): handle null response from endpoint
refactor(utils): consolidate date formatting
```

## Before Committing

- [ ] No `any` types or `console.log`
- [ ] No magic numbers or commented-out code
- [ ] Deleted obsolete code this change replaces
- [ ] Timezone always `America/Chicago` for timestamps
