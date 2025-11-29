# BSI Project Rules

> **Single folder. Single repo. Replace don't add. Clean as you go.**

## ABSOLUTE RULES (NEVER VIOLATE)

### 1. ONE LOCATION
- **Local:** `~/BSI/`
- **Remote:** `github.com/ahump20/BSI` (main branch)
- **Deploy:** Cloudflare Workers/Pages from this repo ONLY
- NEVER create files anywhere else
- NEVER create new repos (no BSI-NextGen, BSI-v2, blaze-new, etc.)
- NEVER create folders outside the structure below

### 2. REPLACE, DON'T ADD
- When updating: **overwrite the original file**
- When upgrading: **delete the old version in the SAME commit**
- No `index2.html`, `utils-new.js`, `component-backup.tsx`
- No "archive" folders—git history IS your archive
- If the new version is better, it **replaces**. Period.

### 3. SEARCH BEFORE CREATE
Before creating ANY file:
```
1. Search repo for files with similar names
2. Search repo for files with similar purposes
3. If found → UPDATE existing, don't create new
4. If similar exists → ASK: "Replace [existing] or merge?"
5. Only create if genuinely new functionality
```

### 4. DELETE AS YOU CREATE
Every new file = audit for obsolete files:
- Delete superseded files in the **same commit**
- Remove dead imports immediately
- No orphaned code

---

## TECHNOLOGY STACK

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 19, Next.js 16, TypeScript 5.9, Tailwind CSS 3.4 |
| **Backend** | Cloudflare Workers, Node.js |
| **Databases** | Cloudflare D1 (SQLite), PostgreSQL, Prisma ORM |
| **Caching** | Cloudflare KV, R2, In-memory cascading cache |
| **Storage** | Cloudflare R2 buckets |
| **Analytics** | Cloudflare Analytics Engine, Amplitude, Sentry |
| **AI/ML** | Cloudflare Workers AI, Vectorize, Claude API (MCP) |
| **Testing** | Vitest, Playwright, Axe-core |
| **Code Quality** | ESLint, Prettier, TypeScript |
| **CI/CD** | GitHub Actions, Cloudflare Pages/Workers |
| **Icons** | Lucide React |
| **Charting** | Recharts |
| **Animations** | Framer Motion |
| **Validation** | Zod |
| **Data Sources** | ESPN API, NCAA API, SportsDataIO API |

---

## PROJECT STRUCTURE

```
BSI/
├── app/                      # Next.js pages and layouts
│   ├── (routes)/             # Route groups
│   ├── api/                  # API routes
│   └── layout.tsx            # Root layout
├── apps/                     # Monorepo sub-applications
│   ├── api-worker/           # Worker API implementation
│   ├── web/                  # Next.js web app (app/, components/, lib/)
│   └── games/                # Game implementations (Phaser, Godot)
├── components/               # Reusable React UI components
│   ├── sports/               # ScoreCard, SportTabs, StandingsTable
│   ├── box-score/            # ProAnalyticsTab
│   ├── recruiting/           # PortalHeatmap, PortalTracker
│   ├── college-baseball/     # BullpenInsights, GameCenter
│   ├── layout/               # Header, navigation
│   ├── live-game/            # WinProbabilityChart
│   └── [utilities]/          # Card, Modal, Table, etc.
├── lib/                      # Shared utilities (33+ modules)
│   ├── adapters/             # ESPN, NCAA, SportsDataIO adapters
│   ├── api/                  # API endpoint utilities
│   ├── analytics/            # Analytics functions
│   ├── cache/                # Caching logic
│   ├── cf/                   # Cloudflare-specific utilities
│   ├── data/                 # Data transformation
│   ├── db/                   # Database query helpers
│   ├── hooks/                # React custom hooks
│   ├── nlg/                  # Natural Language Generation
│   ├── validation/           # Zod schemas
│   └── [more modules]/       # skills, icons, reconstruction, etc.
├── mcp/                      # MCP (Model Context Protocol) servers
│   └── texas-longhorns/      # Texas Longhorns data tools
├── public/                   # Static assets
│   ├── images/               # Logos, photos
│   ├── college-baseball/     # Static pages (standings, games)
│   ├── dashboards/           # Analytics dashboards
│   ├── css/, js/             # Stylesheets and scripts
│   └── data/                 # Static data files
├── scripts/                  # 75+ utility scripts
│   ├── ingest-*.js           # Data ingestion scripts
│   ├── setup-database.js     # DB setup
│   ├── deploy-*.sh           # Deployment scripts
│   └── health_check.py       # Monitoring
├── src/
│   ├── components/           # SportSwitcher components
│   └── styles/tokens/        # Design system tokens
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       ├── breakpoints.ts
│       └── index.ts
├── tests/                    # Test suites
│   ├── api/                  # API tests (mlb, nfl, college-baseball)
│   ├── integration/          # Cache tests
│   ├── validation/           # Schema tests
│   ├── a11y/                 # Accessibility tests (Playwright)
│   └── visual/               # Visual regression tests
├── workers/                  # Cloudflare Workers configs
│   ├── ingest/               # blazesports-ingest worker
│   ├── cfp/                  # College Football Playoff worker
│   ├── content/              # Content delivery worker
│   └── baseball-rankings/    # Baseball rankings worker
├── docs/                     # Documentation
├── .github/                  # GitHub workflows
├── CLAUDE.md                 # This file
├── package.json
├── tsconfig.json
├── tailwind.config.ts        # Tailwind theming (173 lines)
├── wrangler.toml             # Root Cloudflare config
├── vitest.config.ts          # Vitest testing config
└── playwright.config.ts      # E2E/a11y testing config
```

**DO NOT CREATE:**
- Random folders in root
- Nested `src/src/` or `workers/workers/`
- `dist/`, `build/`, `out/` (gitignored, auto-generated)
- `archive/`, `old/`, `backup/`, `deprecated/`

---

## NAMING CONVENTIONS

### Files
| Type | Convention | Example |
|------|------------|---------|
| Workers | `bsi-{domain}-{function}.ts` | `bsi-baseball-ingest.ts` |
| Components | PascalCase | `GameCard.tsx`, `ScoreBoard.tsx` |
| Utilities | camelCase | `formatStats.ts`, `parseSchedule.ts` |
| Types | PascalCase with `.types.ts` | `Game.types.ts` |
| Styles | kebab-case | `game-card.css` |

### FORBIDDEN Names
- `index2.html`, `index-new.html`, `index-backup.html`
- `utils.js`, `helpers.ts`, `misc.ts` (too generic)
- `test.ts`, `temp.ts`, `foo.ts`
- Anything with `-v2`, `-new`, `-old`, `-backup`

### Cloudflare Resources
| Type | Convention | Example |
|------|------------|---------|
| Workers | `bsi-{domain}-{function}` | `bsi-baseball-ingest` |
| KV | `BSI_{DOMAIN}_{PURPOSE}` | `BSI_BASEBALL_CACHE` |
| D1 | `bsi-{domain}-db` | `bsi-baseball-db` |
| R2 | `bsi-{domain}-{asset-type}` | `bsi-media-videos` |

---

## DESIGN SYSTEM

### Token Definitions
Location: `src/styles/tokens/`
```
tokens/
├── colors.ts        # Color palette
├── typography.ts    # Font families, sizes, weights
├── spacing.ts       # Margin/padding scale
├── breakpoints.ts   # Responsive breakpoints
└── index.ts         # Combined export
```

Format:
```typescript
// colors.ts
export const colors = {
  brand: {
    primary: '#FF6B35',      // Blaze orange
    secondary: '#1A1A2E',    // Deep navy
    accent: '#F7931E',       // Gold
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  neutral: {
    white: '#FFFFFF',
    gray: {
      50: '#F9FAFB',
      // ... scale
      900: '#111827',
    },
    black: '#000000',
  },
} as const;
```

### Component Architecture
Location: `src/components/`

Structure per component:
```
components/
├── GameCard/
│   ├── GameCard.tsx        # Component logic
│   ├── GameCard.styles.ts  # Styled/CSS
│   ├── GameCard.types.ts   # TypeScript interfaces
│   ├── GameCard.test.ts    # Tests (optional)
│   └── index.ts            # Re-export
```

Pattern:
```typescript
// GameCard.tsx
import type { GameCardProps } from './GameCard.types';
import { styles } from './GameCard.styles';

export function GameCard({ game, variant = 'default' }: GameCardProps) {
  // Component logic
}
```

### Styling Approach
- **Primary:** Tailwind CSS utility classes
- **Custom:** CSS Modules for complex components
- **Tokens:** Always use design tokens, never hardcode values
- **Responsive:** Mobile-first (`min-width` breakpoints)

```typescript
// CORRECT
<div className="bg-brand-primary text-white p-4 md:p-6">

// WRONG - hardcoded values
<div style={{ backgroundColor: '#FF6B35', padding: '16px' }}>
```

### Icon System
Location: `src/components/icons/`
- Use Lucide React as base icon library
- Custom icons as SVG components
- Naming: `{Name}Icon.tsx` (e.g., `BaseballIcon.tsx`)

```typescript
// Usage
import { BaseballIcon } from '@/components/icons';
<BaseballIcon className="w-6 h-6 text-brand-primary" />
```

### Asset Management
Location: `public/`
```
public/
├── images/
│   ├── logos/
│   ├── teams/
│   └── players/
├── fonts/
└── favicon.ico
```

- Optimize images before commit (WebP preferred)
- Use Cloudflare R2 for large/dynamic assets
- Reference via `/images/...` not absolute URLs

---

## MCP SERVERS

### BSI Texas Longhorns MCP Server
Location: `mcp/texas-longhorns/`

**Available Tools:**
| Tool | Purpose |
|------|---------|
| `get_team_seasons` | Season summaries (baseball-first) |
| `get_season_schedule` | Schedule/meet slate for sports |
| `get_game_box_score` | Box scores with cache metadata |
| `get_player_career` | Player career dossier search |
| `get_rankings_context` | Poll movement and ranking trends |
| `search_archive` | BSI archive search |

**Cascading Cache Implementation:**
1. KV Namespace (5-minute TTL edge cache)
2. R2 Bucket (durable JSON archive)
3. D1 Database (normalized cache table)
4. Durable Objects (concurrent update coordination)
5. In-memory Map (offline fallback)

**Response Format:**
```json
{
  "result": { /* tool-specific payload */ },
  "citations": [ /* source attribution */ ],
  "generatedAt": "timestamp (CDT)",
  "meta": {
    "cache": {
      "key": "longhorns:tool:hash",
      "status": "HIT|MISS"
    }
  }
}
```

### Figma MCP Integration

**Required flow (do not skip):**
1. Run `get_design_context` first for exact node(s)
2. If truncated, run `get_metadata` then re-fetch specific nodes
3. Run `get_screenshot` for visual reference
4. Download assets, then implement
5. Translate to BSI conventions (not raw Figma output)
6. Validate 1:1 with Figma before complete

**Implementation rules:**
- Figma MCP output is **reference**, not final code
- Replace Tailwind utilities with BSI tokens when applicable
- Reuse existing components—never duplicate
- Match BSI color system, typography, spacing
- Respect existing routing/state patterns

**Asset rules:**
- If Figma MCP returns localhost source → use directly
- DO NOT import new icon packages—use Figma payload
- DO NOT create placeholders if source provided

### Cloudflare MCP Integration

Available tools:
- `workers_list` - List deployed workers
- `workers_get_worker` - Get worker details
- `d1_databases_list` - List D1 databases
- `kv_namespaces_list` - List KV namespaces
- `r2_buckets_list` - List R2 buckets

**Before deploying new worker:**
1. Check if similar worker exists
2. Use canonical naming convention
3. Bind to existing KV/D1/R2 when appropriate

---

## CLOUDFLARE DEPLOYMENT

### Deploy Command
```bash
# From BSI root
wrangler deploy --config workers/{worker-name}/wrangler.toml
```

### wrangler.toml Template
```toml
name = "bsi-{domain}-{function}"
main = "src/workers/{path}/index.ts"
compatibility_date = "2025-03-07"

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "CACHE"
id = "xxx"

[[d1_databases]]
binding = "DB"
database_name = "bsi-{domain}-db"
database_id = "xxx"
```

### Root Worker Configuration
The main `wrangler.toml` configures `college-baseball-tracker` with:
- **KV Namespaces:** Unified cache, NIL cache
- **D1 Databases:** Historical DB (shared between main and NIL)
- **Workers AI:** Enabled
- **Vectorize:** `sports-scouting-index`
- **R2 Buckets:** Sports data lake, NIL archive
- **Analytics Engine:** `bsi_sports_metrics`
- **Stripe Integration:** Payment processing secrets
- **Node.js Compatibility:** Enabled

### Canonical Workers (DO NOT DUPLICATE)
| Worker | Purpose | Config Location |
|--------|---------|-----------------|
| `blazesports-ingest` | Scheduled data ingestion (5min, hourly, daily crons) | `workers/ingest/` |
| `cfp-worker` | College Football Playoff data service | `workers/cfp/` |
| `content-worker` | Content delivery/caching | `workers/content/` |
| `baseball-rankings-worker` | Baseball rankings processing | `workers/baseball-rankings/` |

Before creating a new worker, verify it doesn't duplicate existing functionality.

---

## NPM SCRIPTS

### Build Commands
```bash
npm run build          # Next.js + Functions build
npm run build:lib      # TypeScript compilation
npm run build:functions # Cloudflare Functions build
```

### Development
```bash
npm run dev            # Next.js dev server
npm run dev:vite       # Vite dev server
```

### Testing
```bash
npm run test           # Vitest unit tests
npm run test:ui        # Vitest UI
npm run test:a11y      # Playwright accessibility tests
npm run test:api       # API-specific tests
npm run test:integration # Integration tests
npm run test:coverage  # Coverage report
```

### Deployment
```bash
npm run deploy         # Cloudflare Pages deployment
npm run deploy:production # Production deployment
```

---

## TESTING

### Test Structure
```
tests/
├── api/              # API tests
│   ├── mlb.test.ts
│   ├── nfl.test.ts
│   └── college-baseball.test.js
├── integration/      # Cache and integration tests
│   └── cache.test.ts
├── validation/       # Schema validation tests
│   └── schemas.test.ts
├── a11y/             # Accessibility tests (Playwright + axe-core)
├── intelligence/     # Data intelligence tests
├── visual/           # Visual regression tests
└── mcp/              # MCP server tests
```

### Testing Tools
- **Vitest:** Unit and integration tests
- **Playwright:** E2E and accessibility testing
- **Axe-core:** WCAG accessibility scanning

### Running Tests
```bash
# All tests
npm run test

# Specific test file
npx vitest tests/api/mlb.test.ts

# Accessibility tests
npm run test:a11y
```

---

## CI/CD WORKFLOWS

### Active GitHub Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `api-tests.yml` | PR/push to main | Type checking, linting, API tests, security scan |
| `accessibility-tests.yml` | Changes to HTML/TS/JS | Playwright + axe-core WCAG compliance |
| `workers-compat-lint.yml` | Worker file changes | Cloudflare Workers compatibility checks |
| `deploy-pages.yml` | Push to main | Deploy to Cloudflare Pages |
| `lighthouse-ci.yml` | Scheduled/manual | Performance monitoring |
| `data-freshness.yml` | Scheduled | Data quality checks, Slack alerts |

---

## SESSION PROTOCOL

### On Every New Session
```
1. Read this CLAUDE.md
2. Confirm working directory: ~/BSI/
3. Ask: "What are we building and where does it live?"
4. Search for existing files before creating
```

### After Every Feature
```
1. Audit for obsolete files
2. Delete superseded code (same commit)
3. Remove dead imports
4. Verify no orphaned files
```

### Before Every Commit
```
1. Run: git status (check for untracked sprawl)
2. Delete any accidental duplicates
3. Verify naming conventions
4. Single purpose per commit
```

---

## RED FLAGS (STOP AND ASK)

Stop immediately if about to:
- Create a file outside `BSI/` structure
- Create a second `index.html` anywhere
- Create a folder not in canonical structure
- Name something with `-v2`, `-new`, `-backup`
- Create a new repo or "NextGen" variant
- Deploy a worker that duplicates existing functionality
- Hardcode colors, spacing, or other design values

---

## FORBIDDEN PHRASES

Never say:
- "Let me create a new folder structure..."
- "I'll set up a separate repo for..."
- "Here's an updated version called..."
- "BSI-NextGen", "BSI-v2", "blaze-new"
- "Let me create index2.html..."
- "I'll make a backup first..."

---

## DATA ADAPTERS & LIB MODULES

### Data Source Adapters
Location: `lib/adapters/`

| Adapter | Purpose |
|---------|---------|
| ESPN Adapter | ESPN API integration |
| NCAA Adapter | NCAA data feeds |
| SportsDataIO Adapter | SportsDataIO API |

**Adapter Pattern:**
- Multiple data source adapters with provider failover
- Cascading cache layers for performance
- Consistent response formatting across providers

### Key Lib Modules
| Module | Path | Purpose |
|--------|------|---------|
| `adapters/` | `lib/adapters/` | Data source adapters |
| `api/` | `lib/api/` | API endpoint utilities |
| `analytics/` | `lib/analytics/` | Analytics functions |
| `cache/` | `lib/cache/` | Caching logic |
| `cf/` | `lib/cf/` | Cloudflare-specific utilities |
| `data/` | `lib/data/` | Data transformation |
| `db/` | `lib/db/` | Database query helpers |
| `hooks/` | `lib/hooks/` | React custom hooks |
| `nlg/` | `lib/nlg/` | Natural Language Generation |
| `validation/` | `lib/validation/` | Zod schemas |
| `reconstruction/` | `lib/reconstruction/` | Data reconstruction |
| `sports-data-qc/` | `lib/sports-data-qc/` | Quality control |
| `skills/` | `lib/skills/` | AI skill modules |
| `icons/` | `lib/icons/` | Icon components |

---

## SCRIPTS

Location: `scripts/` (75+ utility scripts)

### Data Ingestion
```bash
node scripts/ingest-live-data.js      # Live data ingestion
node scripts/ingest-historical-data.js # Historical data
node scripts/batch-ingest-games.js    # Batch game ingestion
node scripts/batch-ingest-teams.js    # Batch team ingestion
```

### Database Management
```bash
node scripts/setup-database.js        # Database setup
node scripts/migrate-database.js      # Run migrations
./scripts/deploy-d1-schema.sh         # Deploy D1 schema
./scripts/backup-database.sh          # Database backup
```

### Monitoring & Validation
```bash
python scripts/health_check.py        # Health check
node scripts/check-data-freshness.js  # Data freshness check
./scripts/production-readiness-check.sh # Pre-deploy validation
./scripts/validate-deployment.sh      # Post-deploy validation
```

### Deployment
```bash
./scripts/deploy-after-bindings.sh    # Deploy with bindings
./scripts/rollback.sh                 # Rollback deployment
```

### Analytics & ML
```bash
node scripts/generate-embeddings.js   # Generate embeddings
node scripts/monte-carlo-engine.js    # Monte Carlo simulations
python scripts/train-hr-model.py      # Train ML models
```

---

## OWNER CONTEXT

**Austin Humphrey** — Founder, Blaze Sports Intel
- Focus: College baseball analytics (filling ESPN's gaps)
- Stack: Cloudflare Workers/D1/KV/R2 exclusively
- Philosophy: Production-ready code, zero placeholders
- Location: Boerne, Texas

**Brand:**
- Colors: Blaze orange (#FF6B35), Deep navy (#1A1A2E)
- Voice: Direct, warm, no corporate slop
- Tagline: "Born to Blaze the Path Less Beaten"

---

## ARCHITECTURE PATTERNS

### 1. Monorepo with Micro-apps
Main repo contains `/apps` sub-applications (api-worker, web, games)

### 2. Cloudflare-first Infrastructure
Workers, Pages, KV, D1, R2, AI, Vectorize, Analytics Engine

### 3. Cascading Cache Strategy
KV (5min TTL) → R2 (durable) → D1 (normalized) → In-memory (fallback)

### 4. API Adapter Pattern
Multiple data source adapters with automatic provider failover

### 5. Design System Driven
Centralized tokens in `src/styles/tokens/`, extended via Tailwind config

### 6. Type-safe Throughout
TypeScript with Zod validation at boundaries

### 7. Mobile-first Responsive
All components use min-width breakpoints

### 8. MCP Integration
AI-ready with structured tool definitions and citation support

---

## QUICK REFERENCE

### Common File Locations
| Need | Location |
|------|----------|
| React components | `components/` |
| Design tokens | `src/styles/tokens/` |
| API utilities | `lib/api/` |
| Custom hooks | `lib/hooks/` |
| Validation schemas | `lib/validation/` |
| Worker configs | `workers/{worker-name}/wrangler.toml` |
| Test files | `tests/` |
| Scripts | `scripts/` |
| Static assets | `public/` |

### Common Commands
```bash
npm run dev              # Start dev server
npm run build            # Build project
npm run test             # Run tests
npm run deploy           # Deploy to Cloudflare
wrangler deploy          # Deploy specific worker
```

### Import Aliases
```typescript
import { Component } from '@/components/Component'
import { useHook } from '@/lib/hooks/useHook'
import { colors } from '@/src/styles/tokens'
```

---

## WHEN IN DOUBT

**Update existing. Delete old. One location. No sprawl.**
