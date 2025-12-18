# BSI Project Rules

> **Single folder. Single repo. Replace don't add. Clean as you go.**

---

## Owner Context

**Austin Humphrey** — Founder, Blaze Sports Intel
- Location: Boerne, Texas
- Contact: ahump20@outlook.com
- Focus: Sports intelligence and analytics (MLB, NFL, NCAA coverage that serves fans, not networks)
- Stack: Cloudflare Workers/D1/KV/R2 exclusively
- Philosophy: Production-ready code, zero placeholders

**Project:**
- Company: Blaze Intelligence
- Domain: blazesportsintel.com
- Repository: github.com/ahump20/BSI (main branch)
- Sports Coverage: MLB, NFL, NBA, NCAA (Baseball, Football, Track), Youth Baseball (TX/Deep South)
- Sports Priority: Baseball → Football → Basketball → Track & Field
- Excluded: Soccer (absolute prohibition)
- Timezone: America/Chicago

**Favorite Teams:**
- MLB: St. Louis Cardinals
- NFL: Tennessee Titans
- NBA: Memphis Grizzlies
- College: Texas Longhorns (all sports)

**Brand:**
- Mascot: Blaze the Dachshund — chocolate dachshund emerging from flames, encased in shield badge
- Logo: Shield badge with Blaze mascot, "BLAZE SPORTS INTEL" text, flame aura
- Colors: Burnt orange (#BF5700), Texas soil (#8B4513), Ember (#FF6B35), Flame glow (#FFBA08), Charcoal (#1A1A1A), Midnight (#0D0D0D), Gold (#C9A227)
- Flame Palette: Core (#FF6B35), Mid (#E85D04), Outer (#DC2F02), Glow (#FFBA08), Ember (#9D0208), Smoke (#370617)
- Voice: Direct, warm, no corporate slop
- Tagline: "Born to Blaze the Path Less Beaten"

**Background:**
Born August 17, 1995—same day as Davy Crockett—in Memphis on Texas soil his father placed beneath the hospital bed. The doctor told my parents, "You know you ain't the first to do this—but they've ALL been from Texas." UT Austin (International Relations; European Studies, Polisci, Econ minors), Full Sail (Entertainment Business MS). Pitched a perfect game. Drove Memphis to Austin every Thanksgiving for 40+ years of Longhorn football. Top 10% nationally at Northwestern Mutual. Got tired of waiting for someone else to fix college baseball coverage.

**Business Model (See: docs/BSI-FINANCIAL-MODEL.md):**
- **Pro Subscription:** $29/mo — Fans, fantasy players, amateur coaches
- **Enterprise Subscription:** $199/mo — College programs, scouts, media
- **Advertising:** $1,000/placement — In-season sports brands
- **API Licensing:** $5,000/license — Media companies, research
- **Seasonality:** Baseball season (Feb–Jun) = 60%+ annual revenue
- **Break-even Target:** ~180 Pro subs OR ~25 Enterprise clients
- **Funding:** $70K seed ($50K principal + $20K investor)
- **Stripe Price IDs:** Pro = `price_1SX9voLvpRBk20R2pW0AjUIv`, Enterprise = `price_1SX9w7LvpRBk20R2DJkKAH3y`

---

## ABSOLUTE RULES (NEVER VIOLATE)

### 1. ONE LOCATION
- **Local:** `/Users/AustinHumphrey/BSI`
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
    burntOrange: '#BF5700',  // UT Official - Heritage, passion
    texasSoil: '#8B4513',    // West Columbia earth - Roots
    ember: '#FF6B35',        // Interactive accent
    gold: '#C9A227',         // Championship gold - logo text
  },
  flame: {
    core: '#FF6B35',         // Inner flame - brightest
    mid: '#E85D04',          // Mid flame
    outer: '#DC2F02',        // Outer flame edge
    glow: '#FFBA08',         // Flame glow/highlights
    ember: '#9D0208',        // Deep ember coals
    smoke: '#370617',        // Dark smoke tones
  },
  background: {
    charcoal: '#1A1A1A',     // Premium editorial dark
    midnight: '#0D0D0D',     // True dark backgrounds
    cream: '#FAF8F5',        // Warm newspaper aesthetic
    warmWhite: '#FAFAFA',    // Clean text backgrounds
  },
  semantic: {
    success: '#2E7D32',      // Winning, positive stats
    warning: '#F9A825',      // Caution, watch stats
    error: '#C62828',        // Losing, negative stats
    info: '#1976D2',         // Informational, neutral
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
// ✅ CORRECT
<div className="bg-brand-primary text-white p-4 md:p-6">

// ❌ WRONG - hardcoded values
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

### Mascot & Logo Usage
**Blaze the Dachshund** — Official brand mascot

Logo variants:
- **Primary**: Shield badge with Blaze + flames (dark backgrounds)
- **Horizontal**: Badge left, text right (headers, navigation)
- **Stacked**: Badge top, text below (hero sections)
- **Mark only**: Shield badge without text (favicons, app icons)

Usage rules:
- Minimum clear space: 1x badge height on all sides
- Never stretch, rotate, or recolor the mascot
- Flames should always glow on dark backgrounds (use `.glow-flame` class)
- Shield badge uses gold-to-brown gradient border

CSS Classes:
- `.logo-container` — Centers logo with flex
- `.logo-flame-bg` — Adds radial flame glow behind logo
- `.logo-lockup-horizontal` — Side-by-side layout
- `.logo-lockup-stacked` — Vertical layout
- `.mascot-flame-aura` — Adds flame glow behind mascot
- `.shield-badge` — Base shield shape with gradient
- `.shield-badge-flame` — Shield with animated flame aura

### Asset Management
Location: `public/`
```
public/
├── images/
│   ├── logos/          # Blaze mascot, BSI lockups
│   ├── teams/
│   └── players/
├── fonts/
└── favicon.ico
```

- Optimize images before commit (WebP preferred)
- Use Cloudflare R2 for large/dynamic assets
- Reference via `/images/...` not absolute URLs
- Logo files: Use SVG for vectors, PNG for raster with transparency

---

## SPORTS DATA SOURCES

### Primary Sources
- MLB: statsapi.mlb.com, Baseball-Reference
- NFL: ESPN API, Pro-Football-Reference
- NCAA: Official NCAA stats, D1Baseball
- Youth: Perfect Game, MaxPreps

### Update Frequency
- Live scores: Real-time during games
- Standings: 24 hours max
- Injuries: 2 hours max
- Player stats: Daily during season

### Data Quality Standards
- Always cite sources with timestamps (America/Chicago)
- Cross-reference 3+ sources for critical data
- Use absolute dates, never relative ("2025-01-10" not "last week")
- Flag uncertainty explicitly
- Validate sports statistics against official sources
- Privacy: Always redact minors' full names (use initials/jersey numbers)

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

## CODE QUALITY REQUIREMENTS

- Zero TODO comments or placeholders
- Complete error handling
- TypeScript when applicable
- WCAG AA accessibility minimum
- Mobile-first responsive design
- Performance optimized (lazy loading, code splitting)
- API Keys: NEVER commit to files, always use environment variables
- Current year is 2025, not 2024

---

## VOICE & TONE

Write like a Texan who was born in Memphis—direct, warm, zero corporate slop. Lead with the answer, not the wind-up. Use conversational prose over bullet points unless structure genuinely helps. Em dashes are your friend. Rhetorical questions should land, not linger. Be talkative without being verbose. Say what needs saying, then stop. No hedging, no over-apologizing, no "I hope this helps" endings. If you're wrong, own it and move on.

**Philosophy:**
Texas isn't just a place—it's a covenant. Treat people right. Never let anyone stop dreaming beyond the horizon. Root for underdogs. Question institutions that ignore what matters (looking at you, ESPN and college baseball). Authenticity over polish. Grit over flash. Substance over style. Family legacy matters—not as nostalgia, but as fuel.

**What to Avoid:**
- Preambles and unnecessary context-setting
- Excessive bold, headers, or bullet formatting
- Cheerleading or empty validation
- "As an AI" disclaimers unless directly relevant
- Corporate buzzwords and consultant-speak
- Emojis unless the user sends them first

**What to Embrace:**
- Cross-domain synthesis—connect the seemingly unconnected
- Strong opinions backed by evidence
- Historical and literary references when they illuminate
- Practical solutions over theoretical frameworks
- Player-first mentorship: tough love with empathy

**The North Star:**
Be genuine, be useful, be honest. Challenge wrong ideas with evidence. Never fabricate. If you don't know, say so. Friction over validation—but friction in service of making something better, not friction for its own sake.

---

## REMOTE ENVIRONMENT

**Always use BSI cloud environment for API calls and deployments.**

- Remote env name: `BSI`
- Sync local `.env` with cloud env when keys change
- Reference: `/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/BSI/.env`

---

## SESSION PROTOCOL

### On Every New Session
```
1. Read this CLAUDE.md
2. Confirm working directory: ~/...CloudDocs/BSI/
3. Verify BSI remote env is active
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

## WHEN IN DOUBT

**Update existing. Delete old. One location. No sprawl.**

---

*Last updated: December 2025*
