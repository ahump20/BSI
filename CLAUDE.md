# BSI Project Rules

> **Single folder. Single repo. Replace don't add. Clean as you go.**

---

## Owner Context

**Austin Humphrey** — Founder, Blaze Sports Intel
- Location: Boerne, Texas
- Contact: Austin@blazesportsintel.com
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

## TECH STACK

### Frontend
- **Framework:** Next.js 16 (App Router, static export)
- **React:** 19.2 with React Server Components
- **Styling:** Tailwind CSS 3.4 with custom design tokens
- **3D Graphics:** Three.js + React Three Fiber (pitch tunneling, embers)
- **Animation:** Framer Motion 12 for UI animations
- **State Management:** TanStack Query v5 for server state
- **Charts:** Recharts for data visualization

### Backend
- **Deployment:** Cloudflare Pages with Functions
- **Database:** Cloudflare D1 (SQLite)
- **Cache:** Cloudflare KV (key-value)
- **Storage:** Cloudflare R2 (object storage)
- **Workers:** Standalone Cloudflare Workers for heavy processing
- **Auth:** Google OAuth + session management

### Data Adapters
| Provider | Sports | Usage |
|----------|--------|-------|
| ESPN API | MLB, NFL, NBA, CFB | Scores, schedules, standings |
| MLB Stats API | MLB | Official stats, Statcast |
| NCAA API | College Baseball | Teams, rosters, schedules |
| BallDontLie | NBA | Player stats, game data |
| CFBD | College Football | Advanced analytics |

### Testing
- **Unit/Integration:** Vitest + jsdom
- **Accessibility:** Playwright + axe-core
- **Visual:** Playwright visual snapshots
- **API:** Custom test suites for each sport

### Build & Deploy
```bash
npm run dev          # Next.js dev server
npm run build        # Build for production (static export to /out)
npm run deploy       # Build + deploy to Cloudflare Pages
npm run test         # Run Vitest
npm run test:a11y    # Run accessibility tests
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

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

This is a **Next.js 16** application deployed to **Cloudflare Pages** with serverless functions.

```
BSI/
├── app/                      # Next.js App Router (pages & routes)
│   ├── mlb/                  # MLB sport section
│   ├── nfl/                  # NFL sport section
│   ├── nba/                  # NBA sport section
│   ├── college-baseball/     # College baseball section
│   ├── cfb/                  # College football section
│   ├── auth/                 # Authentication pages
│   ├── checkout/             # Stripe checkout flow
│   ├── dashboard/            # User dashboard
│   ├── data/                 # Data adapters & JSON files
│   ├── css/                  # Global CSS (blaze-*.css)
│   ├── globals.css           # Tailwind base styles
│   └── layout.tsx            # Root layout
├── components/               # Reusable React components
│   ├── box-score/            # Universal box score components
│   ├── cinematic/            # Visual effects (parallax, noise, etc.)
│   ├── game-detail/          # Game detail modal system
│   ├── headlines/            # News headline components
│   ├── hero/                 # Hero section components
│   ├── layout-ds/            # Design system layout (Navbar, Footer)
│   ├── media/                # Video players & highlights
│   ├── motion/               # Framer Motion animations
│   ├── pitch-tracker/        # Baseball pitch visualization
│   ├── play-by-play/         # Play-by-play components
│   ├── recruiting/           # Portal tracker, heatmaps
│   ├── sports/               # Score cards, standings, tabs
│   ├── three/                # Three.js 3D components
│   └── vision-ai/            # Vision AI intelligence components
├── functions/                # Cloudflare Pages Functions (API)
│   └── api/                  # All API endpoints
│       ├── auth/             # Authentication endpoints
│       ├── mlb/              # MLB API routes
│       ├── nfl/              # NFL API routes
│       ├── nba/              # NBA API routes
│       ├── college-baseball/ # College baseball API
│       ├── college-football/ # College football API
│       ├── copilot/          # AI Copilot endpoints
│       ├── game/             # Game detail endpoints
│       └── live/             # Live scores endpoints
├── lib/                      # Shared library code
│   ├── adapters/             # Data source adapters (ESPN, MLB, NCAA, etc.)
│   ├── analytics/            # Analytics engines (win prob, Pythagorean)
│   ├── api/                  # API client utilities
│   ├── cache/                # Tiered caching system
│   ├── hooks/                # React hooks (useSportsData, etc.)
│   ├── lei/                  # Live Event Intelligence engine
│   ├── ml/                   # Machine learning models
│   ├── nlg/                  # Natural language generation
│   └── utils/                # Utility functions
├── hooks/                    # Additional React hooks
├── src/                      # Legacy/specialized source
│   ├── basketball/           # Basketball standalone app
│   ├── football/             # Football standalone app
│   ├── games/                # Diamond Sluggers game
│   ├── styles/tokens/        # Design tokens (colors, typography)
│   └── tools/                # Tools showcase
├── workers/                  # Standalone Cloudflare Workers
│   ├── baseball-rankings/    # Baseball rankings worker
│   ├── bsi-game-backend/     # Game backend worker
│   ├── ingest/               # Data ingestion workers
│   └── prediction/           # Prediction worker
├── tests/                    # Test suites
│   ├── a11y/                 # Accessibility tests (Playwright)
│   ├── analytics/            # Analytics unit tests
│   ├── api/                  # API integration tests
│   ├── integration/          # Integration tests
│   ├── validation/           # Schema validation tests
│   └── visual/               # Visual regression tests
├── schema/                   # D1 database schemas (SQL)
├── scripts/                  # Build, deploy, data scripts
├── docs/                     # Documentation (100+ markdown files)
├── public/                   # Static assets (images, fonts, js)
├── .claude/                  # Claude tooling (analyzers, MCP servers)
├── .cursor/                  # Cursor IDE rules & commands
├── .github/                  # GitHub workflows & templates
├── CLAUDE.md                 # This file (AI assistant rules)
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── next.config.js            # Next.js configuration
└── vitest.config.ts          # Vitest test configuration
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
    gold: '#C9A227',         // Value highlights
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

## KEY COMPONENT PATTERNS

### Page Components (app/)
Each sport page follows this pattern:
```
app/{sport}/
├── page.tsx              # Main sport landing page
├── scores/page.tsx       # Live scores
├── standings/page.tsx    # Standings tables
├── teams/page.tsx        # Team listings
├── teams/[teamId]/page.tsx  # Team detail
├── game/[gameId]/        # Game detail routes
│   ├── page.tsx          # Game summary
│   ├── box-score/page.tsx
│   ├── play-by-play/page.tsx
│   ├── recap/page.tsx
│   └── team-stats/page.tsx
└── news/page.tsx         # Sport news
```

### Game Detail Modal (components/game-detail/)
The universal game detail system uses:
- `GameDetailModal.tsx` - Main modal container
- Tab system: Gamecast, Box Score, Play-by-Play, Recap, Videos
- Swipe gestures for mobile navigation
- Shared components in `shared/` subdirectory

### Data Fetching Pattern
```typescript
// In a page component
import { useSportsData } from '@/lib/hooks/useSportsData';

export default function ScoresPage() {
  const { data, isLoading, error } = useSportsData('mlb', 'scoreboard');
  // ...
}
```

### Adapter Pattern (lib/adapters/)
Each data source has an adapter that normalizes data:
```typescript
// lib/adapters/espn-unified-adapter.ts
export async function getScoreboard(sport: Sport): Promise<Game[]> {
  const raw = await fetchESPN(sport);
  return normalizeGames(raw);
}
```

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

### Key API Routes (functions/api/)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/mlb/[[teamId]]` | GET | MLB team data, scores |
| `/api/nfl/[[route]]` | GET | NFL scores, standings |
| `/api/nba/[[route]]` | GET | NBA scores, standings |
| `/api/college-baseball/games/[[gameId]]` | GET | College baseball games |
| `/api/college-baseball/teams/[teamId]` | GET | Team details |
| `/api/college-football/scoreboard` | GET | CFB live scores |
| `/api/copilot/search` | POST | AI-powered search |
| `/api/copilot/insight` | POST | AI game insights |
| `/api/live/[[route]]` | GET | Live scores across sports |
| `/api/auth/login` | POST | User authentication |
| `/api/auth/session` | GET | Session validation |

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

### Primary Deployment (Next.js to Cloudflare Pages)
```bash
# Production deployment
npm run deploy:production

# Preview deployment
npm run deploy:preview
```

The main site deploys as a **static export** to Cloudflare Pages with Functions in `/functions/api/`.

### Standalone Workers Deployment
```bash
# Deploy a standalone worker
wrangler deploy --config workers/{worker-name}/wrangler.toml
```

### wrangler.toml Template (for standalone workers)
```toml
name = "bsi-{domain}-{function}"
main = "index.ts"
compatibility_date = "2024-01-01"

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
| Worker | Location | Purpose | Status |
|--------|----------|---------|--------|
| `blazesportsintel` | Cloudflare Pages | Main site + API functions | Active |
| `baseball-rankings` | `workers/baseball-rankings/` | Baseball rankings engine | Active |
| `bsi-game-backend` | `workers/bsi-game-backend/` | Diamond Sluggers backend | Active |
| `bsi-ingest` | `workers/ingest/` | Data ingestion (WHOOP, NBA) | Active |
| `bsi-prediction` | `workers/prediction/` | Prediction worker | Active |

### Key Cloudflare Resources
| Type | Name | Purpose |
|------|------|---------|
| D1 | `blazesports-historical` | Historical game data |
| KV | `BSI_CACHE` | API response cache |
| KV | `BSI_SESSIONS` | User sessions |
| R2 | `bsi-media` | Video/image storage |

Before creating a new worker, verify it doesn't duplicate existing functionality.

---

## TESTING

### Test Commands
```bash
npm run test              # Run all Vitest tests
npm run test:ui           # Vitest with UI
npm run test:coverage     # With coverage report
npm run test:api          # API tests only
npm run test:integration  # Integration tests only
npm run test:validation   # Schema validation tests
npm run test:a11y         # Playwright accessibility tests
npm run test:a11y:ui      # Playwright with UI
```

### Test File Locations
| Type | Location | Framework |
|------|----------|-----------|
| Unit | `tests/analytics/` | Vitest |
| API | `tests/api/` | Vitest |
| Integration | `tests/integration/` | Vitest |
| Validation | `tests/validation/` | Vitest |
| Accessibility | `tests/a11y/` | Playwright + axe-core |
| Visual | `tests/visual/` | Playwright |

### Writing Tests
- Use `describe()` and `it()` for test organization
- Mock external APIs using Vitest mocks
- Test adapters should verify data normalization
- Accessibility tests use `@axe-core/playwright`

---

## CODE QUALITY REQUIREMENTS

- Zero TODO comments or placeholders
- Complete error handling with proper types
- TypeScript for all new code (`.tsx` for components, `.ts` for utilities)
- WCAG AA accessibility minimum (tested via Playwright + axe-core)
- Mobile-first responsive design (Tailwind breakpoints: `sm`, `md`, `lg`, `xl`)
- Performance optimized (lazy loading, code splitting, tiered caching)
- API Keys: NEVER commit to files, always use environment variables
- Current year is 2026
- Use Zod for runtime validation of API responses
- Use TanStack Query for all data fetching in components
- Follow existing patterns in `lib/adapters/` for new data sources

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

*Last updated: January 2026*
