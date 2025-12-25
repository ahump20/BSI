# BSI Project Rules

> **Single folder. Single repo. Replace don't add. Clean as you go.**

---

## Owner Context

**Austin Humphrey** — Founder, Blaze Sports Intel
- Location: Boerne, Texas
- Contact: Austin@blazesportsintel.com
- Focus: Sports intelligence and analytics (MLB, NFL, NCAA coverage that serves fans, not networks)
- Stack: Next.js + Cloudflare Workers/D1/KV/R2/Pages
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
- Colors: Burnt orange (#BF5700), Texas soil (#8B4513), Ember (#FF6B35), Charcoal (#1A1A1A), Midnight (#0D0D0D), Cream (#FAF8F5), Gold (#C9A227)
- Voice: Direct, warm, no corporate slop
- Tagline: "Born to Blaze the Path Less Beaten"

**Background:**
Born August 17, 1995—same day as Davy Crockett—in Memphis on Texas soil his father placed beneath the hospital bed. The soil came from West Columbia, birthplace of the Republic of Texas. The doctor told my parents, "You know you ain't the first to do this—but they've ALL been from Texas." The news made the local paper in El Campo—my father's hometown, where my grandad Bill founded banks after growing up dirt poor in West Texas and meeting my grandma Helen at Hardin-Simmons following his service in WWII.

**Athletic History:**
- First time at RB in 7th grade: 70 yards to the house, first play of the season
- Boerne Champion High School: Scored first TD against big rival Kerrville Tivy
- Marble Falls game: Scored on first play via screen pass against Coach Todd Dodge; play landed on ESPN
- Pitched a perfect game in baseball (27 up, 27 down)
- South Texas Sliders: Toured Texas Tech, started that day against #1 team in the country on Tech's field
- Family has held same four season tickets to Longhorn football for 40-50 years
- Was at the Ricky Williams record-breaking game against A&M

**Education & Career:**
UT Austin (International Relations; European Studies, Polisci, Econ minors). Full Sail (Entertainment Business MS). Top 10% nationally at Northwestern Mutual. Got tired of waiting for ESPN to fix college baseball coverage.

**Brand Name Origin:**
The name "Blaze Sports Intel" comes from my dog—a dachshund named Blaze after the first baseball team I played on: the Bartlett Blaze.

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
- **Repository:** `github.com/ahump20/BSI` (main branch)
- **Deploy:** Cloudflare Pages/Workers from this repo ONLY
- NEVER create files outside the project structure
- NEVER create new repos (no BSI-NextGen, BSI-v2, blaze-new, etc.)
- NEVER create folders outside the canonical structure below

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
├── app/                      # Next.js App Router (primary frontend)
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage
│   ├── globals.css           # Global styles
│   ├── providers.tsx         # React context providers
│   ├── mlb/                  # MLB routes
│   ├── nfl/                  # NFL routes
│   ├── nba/                  # NBA routes
│   ├── college-baseball/     # College baseball routes
│   ├── cfb/                  # College football routes
│   ├── dashboard/            # User dashboard
│   ├── auth/                 # Authentication pages
│   ├── checkout/             # Stripe checkout flow
│   └── pricing/              # Pricing page
├── components/               # Shared React components
│   ├── ui/                   # Base UI primitives (Button, Card, Input, etc.)
│   ├── layout/               # Layout components (Footer, Header, Navbar)
│   ├── analytics/            # Analytics visualizations
│   ├── sports/               # Sport-specific components
│   └── [feature]/            # Feature-specific component folders
├── lib/                      # Shared utilities and business logic
│   ├── api/                  # API client utilities
│   ├── analytics/            # Analytics engines
│   ├── sports-data/          # Sports data fetching/parsing
│   ├── utils/                # General utilities
│   ├── types/                # TypeScript type definitions
│   └── validation/           # Zod schemas and validation
├── hooks/                    # Custom React hooks
├── workers/                  # Cloudflare Worker definitions
│   ├── ingest/               # Data ingestion workers
│   ├── prediction/           # Prediction engine workers
│   └── baseball-rankings/    # Rankings calculation workers
├── functions/                # Cloudflare Pages Functions (API routes)
├── public/                   # Static assets (images, fonts, favicon)
├── data/                     # Static JSON data files
├── tests/                    # Test suites
│   ├── api/                  # API endpoint tests
│   ├── integration/          # Integration tests
│   ├── validation/           # Schema validation tests
│   └── visual/               # Visual regression tests
├── docs/                     # Documentation
├── scripts/                  # Build/deploy automation
├── schema/                   # Database schemas and migrations
├── migrations/               # D1 migration files
├── .github/                  # GitHub workflows
├── CLAUDE.md                 # This file
├── package.json
├── tsconfig.json
├── tailwind.config.ts        # Tailwind with BSI design tokens
├── wrangler.toml             # Primary Cloudflare config
└── vitest.config.ts          # Test configuration
```

**DO NOT CREATE:**
- Random folders in root
- Nested `src/src/` or `workers/workers/`
- `dist/`, `build/`, `out/`, `.next/` (gitignored, auto-generated)
- `archive/`, `old/`, `backup/`, `deprecated/`

---

## TECH STACK

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS with custom design tokens
- **State:** React Query (@tanstack/react-query)
- **Animations:** Framer Motion
- **3D:** React Three Fiber + Drei
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend
- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Cache:** Cloudflare KV
- **Storage:** Cloudflare R2
- **AI:** Cloudflare Workers AI + Vectorize
- **Analytics:** Cloudflare Analytics Engine

### Testing
- **Unit/Integration:** Vitest
- **E2E/Accessibility:** Playwright with axe-core
- **Visual Regression:** Percy

### Development
- **Package Manager:** npm (pnpm available)
- **Linting:** ESLint with TypeScript parser
- **Formatting:** Prettier
- **Hooks:** Husky pre-commit

---

## NAMING CONVENTIONS

### Files
| Type | Convention | Example |
|------|------------|---------|
| Pages | kebab-case folder + page.tsx | `app/college-baseball/page.tsx` |
| Components | PascalCase | `GameCard.tsx`, `ScoreBoard.tsx` |
| Utilities | camelCase | `formatStats.ts`, `parseSchedule.ts` |
| Hooks | camelCase with `use` prefix | `useGameData.ts`, `useLiveScores.ts` |
| Types | PascalCase | `Game.types.ts`, `Player.types.ts` |
| Workers | kebab-case | `baseball-rankings/`, `ingest/` |

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
| D1 | `bsi-{domain}-db` | `bsi-historical-db` |
| R2 | `bsi-{domain}-{asset-type}` | `blaze-sports-data-lake` |

---

## DESIGN SYSTEM

### Tailwind Configuration
All design tokens are defined in `tailwind.config.ts`. Use Tailwind classes—never hardcode values.

**Brand Colors:**
```typescript
'burnt-orange': {
  600: '#BF5700',  // Primary Brand - UT Burnt Orange
  DEFAULT: '#BF5700',
}
'texas-soil': '#8B4513'
'ember': '#FF6B35'
'gold': { 500: '#FDB913', DEFAULT: '#FDB913' }
'charcoal': { 800: '#1f2937', 950: '#0a0a0f', DEFAULT: '#1f2937' }
'midnight': '#0d0d12'
```

**Sport Colors:**
```typescript
baseball: { DEFAULT: '#BF5700', diamond: '#6B8E23', dirt: '#8B7355' }
football: { DEFAULT: '#8B4513', grass: '#228B22', field: '#355E3B' }
basketball: { DEFAULT: '#FF6B35', court: '#E25822', paint: '#1E40AF' }
track: { DEFAULT: '#F59E0B', surface: '#DC143C', lane: '#FFD700' }
```

**Team Colors:**
```typescript
cardinals: { DEFAULT: '#C41E3A', secondary: '#0C2340' }
titans: { DEFAULT: '#002244', secondary: '#4B92DB' }
longhorns: { DEFAULT: '#BF5700' }
grizzlies: { DEFAULT: '#5D76A9', secondary: '#FDB927' }
```

### Component Patterns

**UI Primitives** (`components/ui/`):
- `Button.tsx` - Variants: primary, secondary, ghost, danger
- `Card.tsx` - Variants: default, elevated, glass
- `Input.tsx` - With validation states
- `Badge.tsx` - Status indicators
- `Skeleton.tsx` - Loading states

**Usage:**
```tsx
import { Button, Card, Badge } from '@/components/ui';

<Card variant="glass">
  <Badge variant="success">Live</Badge>
  <Button variant="primary">View Game</Button>
</Card>
```

### Styling Approach
- **Primary:** Tailwind CSS utility classes
- **Tokens:** Always use Tailwind config values
- **Responsive:** Mobile-first (`min-width` breakpoints)
- **Dark Mode:** `dark:` prefix, class-based toggling
- **Glass Effects:** `backdrop-blur-glass`, `bg-surface-light`

```tsx
// CORRECT - using Tailwind tokens
<div className="bg-burnt-orange-600 text-white p-4 md:p-6 backdrop-blur-glass">

// WRONG - hardcoded values
<div style={{ backgroundColor: '#BF5700', padding: '16px' }}>
```

---

## SPORTS DATA SOURCES

### Primary Sources
| Sport | Primary | Secondary |
|-------|---------|-----------|
| MLB | statsapi.mlb.com | Baseball-Reference, FanGraphs |
| NFL | ESPN API, NFL.com | Pro-Football-Reference |
| NBA | NBA API, ESPN | Basketball-Reference |
| NCAA Baseball | NCAA Stats, D1Baseball | Perfect Game |
| NCAA Football | ESPN, CFBD API | Sports-Reference |
| Youth | Perfect Game, MaxPreps | THSBCA |

### Update Frequency
- Live scores: Real-time during games
- Standings: 24 hours max
- Injuries: 2 hours max
- Player stats: Daily during season

### Data Quality Standards
- Always cite sources with timestamps (America/Chicago timezone)
- Cross-reference 3+ sources for critical data
- Use absolute dates, never relative ("2025-01-10" not "last week")
- Flag uncertainty explicitly
- Validate sports statistics against official sources
- Privacy: Always redact minors' full names (use initials/jersey numbers)

---

## NEXT.JS APP ROUTER PATTERNS

### Route Structure
```
app/
├── layout.tsx          # Root layout with providers
├── page.tsx            # Homepage
├── [sport]/
│   ├── layout.tsx      # Sport-specific layout (optional)
│   ├── page.tsx        # Sport landing page
│   └── [team]/
│       └── page.tsx    # Team detail page
```

### Data Fetching
```tsx
// Server Component (default) - fetch at build or request time
export default async function Page() {
  const data = await fetchGameData(); // Direct fetch, no useEffect
  return <GameCard game={data} />;
}

// Client Component - for interactivity
'use client';
import { useQuery } from '@tanstack/react-query';

export function LiveScores() {
  const { data } = useQuery({ queryKey: ['scores'], queryFn: fetchScores });
  return <ScoreBoard scores={data} />;
}
```

### Metadata
```tsx
export const metadata = {
  title: 'College Baseball | Blaze Sports Intel',
  description: 'Live scores, standings, and analytics',
};
```

---

## CLOUDFLARE DEPLOYMENT

### Deploy Commands
```bash
# Deploy Next.js to Cloudflare Pages
npm run deploy

# Deploy individual worker
wrangler deploy --config workers/{worker-name}/wrangler.toml

# Deploy preview environment
npm run deploy:preview
```

### wrangler.toml Template
```toml
name = "bsi-{domain}-{function}"
main = "src/index.ts"
compatibility_date = "2025-03-07"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-id"

[[d1_databases]]
binding = "DB"
database_name = "bsi-historical-db"
database_id = "your-d1-id"
```

### Active Resources
| Resource | Binding | Purpose |
|----------|---------|---------|
| KV | `KV` | Unified caching (scores, odds, sessions) |
| D1 | `DB` | Historical sports data, NIL valuations |
| R2 | `SPORTS_DATA` | Sports data lake |
| R2 | `NIL_ARCHIVE` | NIL historical archives |
| AI | `AI` | Workers AI inference |
| Vectorize | `VECTORIZE` | Semantic search |
| Analytics | `ANALYTICS` | Time-series metrics |

---

## TESTING

### Running Tests
```bash
npm test                  # Run all tests
npm run test:api          # API endpoint tests
npm run test:integration  # Integration tests
npm run test:a11y         # Accessibility tests (Playwright)
npm run test:coverage     # With coverage report
```

### Test File Locations
```
tests/
├── api/                  # API endpoint tests (vitest)
│   ├── mlb.test.ts
│   ├── nfl.test.ts
│   └── nba.test.ts
├── integration/          # Integration tests
├── validation/           # Schema validation
└── visual/               # Visual regression (Playwright)
```

### Writing Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('MLB API', () => {
  it('returns valid standings', async () => {
    const response = await fetchStandings();
    expect(response.standings).toBeDefined();
    expect(response.standings.length).toBeGreaterThan(0);
  });
});
```

---

## MCP SERVERS

### Figma MCP Integration

**Required flow (do not skip):**
1. Run `get_design_context` first for exact node(s)
2. If truncated, run `get_metadata` then re-fetch specific nodes
3. Run `get_screenshot` for visual reference
4. Download assets, then implement
5. Translate to BSI Tailwind tokens (not raw Figma output)
6. Validate 1:1 with Figma before complete

**Implementation rules:**
- Figma MCP output is **reference**, not final code
- Replace generic Tailwind with BSI tokens (`burnt-orange-600`, not `orange-600`)
- Reuse existing components—never duplicate
- Match BSI typography, spacing, animation patterns
- Respect existing routing/state patterns

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

## CODE QUALITY REQUIREMENTS

- Zero TODO comments or placeholders
- Complete error handling with proper types
- TypeScript strict mode
- WCAG AA accessibility minimum
- Mobile-first responsive design
- Performance optimized (lazy loading, code splitting)
- API Keys: NEVER commit to files, always use environment variables/secrets
- Current year is 2025

### TypeScript Standards
```typescript
// Use explicit types for function parameters and returns
function calculateERA(earnedRuns: number, inningsPitched: number): number {
  return (earnedRuns / inningsPitched) * 9;
}

// Use Zod for runtime validation
import { z } from 'zod';
const GameSchema = z.object({
  id: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  status: z.enum(['scheduled', 'live', 'final']),
});
```

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

## SESSION PROTOCOL

### On Every New Session
```
1. Read this CLAUDE.md
2. Confirm working directory is BSI root
3. Search for existing files before creating
4. Check recent git commits for context
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
- Create a file outside BSI structure
- Create a second `index.html` anywhere
- Create a folder not in canonical structure
- Name something with `-v2`, `-new`, `-backup`
- Create a new repo or "NextGen" variant
- Deploy a worker that duplicates existing functionality
- Hardcode colors, spacing, or other design values
- Skip Tailwind tokens for inline styles

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

## COMMON TASKS

### Add a New Sport Page
1. Create route: `app/{sport}/page.tsx`
2. Add layout if needed: `app/{sport}/layout.tsx`
3. Create components in `components/{sport}/`
4. Add data fetching in `lib/sports-data/`
5. Add tests in `tests/api/{sport}.test.ts`

### Add a New Component
1. Check `components/ui/` for existing primitives
2. Create in appropriate feature folder
3. Use Tailwind tokens from `tailwind.config.ts`
4. Export from folder's `index.ts`
5. Add to Storybook if applicable

### Deploy a Change
```bash
# 1. Run tests
npm test

# 2. Build locally
npm run build

# 3. Deploy to preview
npm run deploy:preview

# 4. Verify, then deploy to production
npm run deploy:production
```

---

## WHEN IN DOUBT

**Update existing. Delete old. One location. No sprawl.**

---

*Last updated: December 2025*
