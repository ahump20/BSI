# BSI Context Reference

BSI-specific knowledge that enriches the domain-generic reference files. Load this alongside any other reference when working on BSI properties.

## Heritage Design System v2.1

Complete site-wide as of Mar 10, 2026. Every page and component uses heritage tokens.

**Surfaces:**
- `--surface-dugout` (#161616) — cards
- `--surface-scoreboard` (#0A0A0A) — hero backgrounds
- `--surface-press-box` (#111111) — table headers

**Colors:**
- `--bsi-primary` (#BF5700) — burnt orange, stamps/borders/buttons
- `--bsi-bone` (#F5F2EB) — primary text
- `--bsi-dust` (#C4B8A5) — secondary text
- `--heritage-columbia-blue` (#4B9CD3) — data links
- `--border-vintage` (rgba(140,98,57,0.3)) — subtle borders

**Typography:**
- Bebas Neue — hero headings at `clamp(2.5rem,6vw,5rem)`
- Oswald — section headings (uppercase)
- Cormorant Garamond — body text
- JetBrains Mono — code/data

**Utility classes:**
- `.heritage-stamp` — Oswald/burnt-orange labels
- `.heritage-card` — solid-surface card
- `.btn-heritage` / `.btn-heritage-fill` — buttons
- `.corner-marks` — 20px inset decorative corners
- `.grain-overlay` — scoped film-grain texture
- Score ticker: CSS marquee, burnt-orange diamond separators, 2px top border

## Slogan (NON-NEGOTIABLE)

"Born to Blaze the Path Beaten Less" — this is the ONLY correct word order. Must be visible in the homepage hero, front-and-center. Never remove during refactors.

## Data Source Hierarchy

1. **Highlightly Pro** (`api.highlightly.net`) — primary, use first for baseball and football
2. **ESPN Site API** (`site.api.espn.com`) — college baseball fallback only
3. **SportsDataIO** (`api.sportsdata.io`) — NFL, NBA, MLB, CFB, CBB

Every API response must include: `meta: { source, fetched_at, timezone: 'America/Chicago' }`. The UI always shows "Last updated" and the data source.

**ESPN date bug:** Dates labeled UTC are actually ET. Convert accordingly.

## Infrastructure Map

**Stack:** Next.js 16 (static export) · React 19 · TypeScript · Tailwind CSS 3 · Cloudflare Pages/Workers (Hono) · D1/KV/R2

**Static export constraint:** Every dynamic route needs `generateStaticParams()`. No SSR. Components using hooks/browser APIs need `'use client'`.

**Data flow:** External APIs → Workers (fetch, transform, cache) → KV/D1/R2 → Pages Functions or client fetches → Static UI. Workers are the only code that talks to external APIs.

Full infrastructure inventory: `~/.claude/projects/-Users-AustinHumphrey/memory/infrastructure.md`

## Auth Model

Stripe-keyed, no passwords. Signup → Stripe checkout → webhook provisions key into `BSI_KEYS` KV. Login sends key via Resend. Client stores in `localStorage`, sends as `X-BSI-Key`.

## Deploy Gotchas

- Build staging path: `/var/tmp/bsi-deploy-out` — NOT `/tmp/` (iCloud evicts)
- Wrangler 4.71.0+ required
- Pages deploy may timeout on 15K+ files — retry; second deploy is instant (hash dedup)
- iCloud Drive can stall git operations — check for stale `.git/index.lock`

## Dual Cron Overlap

`bsi-savant-compute` (6h cycle) and `bsi-cbb-analytics` (daily) both write advanced metrics. Check both when debugging analytics discrepancies.

## KV TTL Tiers

| Data type | TTL |
|-----------|-----|
| Live scores | 15–30s |
| Standings | 60s |
| Final games | 5 min |
| Rosters | 1 hour |

## Naming Conventions

| Resource | Pattern | Example |
|----------|---------|---------|
| Worker | `bsi-{domain}-{function}` | `bsi-scores-live` |
| KV | `BSI_{DOMAIN}_{PURPOSE}` | `BSI_SCORES_CACHE` |
| D1 | `bsi-{domain}-db` | `bsi-analytics-db` |
| R2 | `bsi-{domain}-assets` | `bsi-media-assets` |
| Files | kebab-case | `game-stats.ts` |
| Functions | camelCase, verb-first | `fetchStandings()` |
| Types | PascalCase | `GameData` |
| Constants | SCREAMING_SNAKE | `DEFAULT_TTL` |
| Commits | `type(scope): description` | `feat(scores): add MLB polling` |
