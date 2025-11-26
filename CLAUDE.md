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

## PROJECT STRUCTURE

```
BSI/
├── src/
│   ├── workers/              # Cloudflare Worker source code
│   │   ├── api/              # API endpoints (bsi-api-*)
│   │   ├── ingest/           # Data ingestion (bsi-ingest-*)
│   │   ├── public/           # Public site (blazesportsintel.com)
│   │   └── mcp/              # MCP servers
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Shared utilities
│   ├── types/                # TypeScript definitions
│   └── styles/               # Global styles, tokens
├── public/                   # Static assets ONLY (images, fonts)
├── workers/                  # wrangler.toml files (one per worker)
├── scripts/                  # Build/deploy automation
├── docs/                     # Documentation
├── .github/                  # GitHub workflows
├── CLAUDE.md                 # This file
├── package.json
├── tsconfig.json
└── wrangler.toml             # Root config (if single worker)
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
compatibility_date = "2025-01-01"

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

### Canonical Workers (DO NOT DUPLICATE)
| Worker | Purpose | Status |
|--------|---------|--------|
| `bsi-mcp-server` | MCP interface | Active |
| `blaze-sports-api` | Primary REST API | Active |
| `espn-data-cache` | ESPN data layer | Active |
| `bsi-baseball-ingest` | College baseball data | Active |

Before creating a new worker, verify it doesn't duplicate existing functionality.

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

## WHEN IN DOUBT

**Update existing. Delete old. One location. No sprawl.**
