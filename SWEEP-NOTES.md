# Sweep Notes — Agent 4: Tools and Models

## Scope
NIL Valuation (12 pages), Analytics (5 pages), Models (5 pages), Intel (6 pages + sub-routes), `lib/nil/`, `components/intelligence/`

## Issues Found and Fixed

### 1. Dead link: Analytics hub Monte Carlo
The analytics hub listed Monte Carlo Season Simulator as "Coming Soon" pointing to `href: '#'` with `pointer-events-none`. The actual page at `/models/monte-carlo` exists and renders full methodology content with live API data fetch. Changed status to `available` and linked to `/models/monte-carlo`.

### 2. console.error in error boundaries
Three error boundary files (`app/intel/error.tsx`, `app/nil-valuation/error.tsx`, `app/models/error.tsx`) contained `console.error` calls. Removed per code standards (no console.log in production code).

### 3. Missing OG images in child layouts
Three layouts were missing `openGraph.images` which causes Next.js to drop the parent layout's OG image entirely when the child overrides `openGraph`:
- `app/analytics/layout.tsx`
- `app/analytics/mmi/layout.tsx`
- `app/models/data-quality/layout.tsx`

Added `images: ogImage()` to each.

## Pages Reviewed — Status Summary

### Intel
| Page | Status | Notes |
|------|--------|-------|
| `/intel` | Functional | Fetches live scores for 6 sports via React Query. Empty state handled in GameGrid. |
| `/intel/game-briefs` | Functional | Fetches `/api/college-baseball/editorial/list`. Falls back to one seed brief. |
| `/intel/game-briefs/[slug]` | Functional | Seed brief for Texas opener. Dynamic slugs fetch from game API. |
| `/intel/team-dossiers` | Functional | Fetches live rankings data. Falls back to 3 seed dossiers. |
| `/intel/team-dossiers/[slug]` | Functional | 3 seed dossiers (Texas, TCU, UCLA). Dynamic slugs fetch team API. |
| `/intel/weekly-brief` | Functional | Fetches `/api/intel/weekly-brief`. Shows framework placeholder when no brief published. |

### NIL Valuation
| Page | Status | Notes |
|------|--------|-------|
| `/nil-valuation` | Functional | Fetches `/api/nil/leaderboard`. Shows top 10 + undervalued spotlight. |
| `/nil-valuation/tools` | Functional | Index page linking to all 9 tools. |
| `/nil-valuation/performance-index` | Functional | Live calculator — searches 200 batters + pitchers from Savant API. |
| `/nil-valuation/brand-match` | Functional | Client-side 5-question calculator. No API needed. |
| `/nil-valuation/deal-analyzer` | Functional | Client-side deal analysis calculator. |
| `/nil-valuation/comparables` | Functional | Fetches leaderboard data for comparisons. |
| `/nil-valuation/collective-roi` | Functional | Client-side ROI modeling tool. |
| `/nil-valuation/draft-leverage` | Functional | Fetches leaderboard data for 4-quadrant analysis. |
| `/nil-valuation/market-trends` | Functional | Client-side charts + live leaderboard data. |
| `/nil-valuation/undervalued` | Functional | Fetches `/api/nil/undervalued`. Pro-gated with upgrade CTA. |
| `/nil-valuation/war-to-nil` | Functional | Client-side WAR converter calculator. |
| `/nil-valuation/methodology` | Functional | Static methodology documentation. |

### Analytics
| Page | Status | Notes |
|------|--------|-------|
| `/analytics` | Functional | Hub page with sport filter. All tool links verified. |
| `/analytics/pythagorean` | Bridge | Legacy route bridge redirecting to analytics hub. |
| `/analytics/win-probability` | Bridge | Legacy route bridge redirecting to models/win-probability. |
| `/analytics/historical` | Bridge | Legacy route bridge redirecting to models/data-quality. |
| `/analytics/mmi` | Functional | Fetches `/api/analytics/mmi/trending`. Has proper loading/error/empty states. |

### Models
| Page | Status | Notes |
|------|--------|-------|
| `/models` | Functional | Hub page. Fetches `/api/model-health` for live accuracy display. |
| `/models/havf` | Functional | Full methodology documentation. No live data needed. |
| `/models/win-probability` | Functional | Fetches `/api/models/win-probability/example`. Has fallback for no data. |
| `/models/monte-carlo` | Functional | Fetches `/api/models/monte-carlo/example`. Shows validation framework. |
| `/models/data-quality` | Functional | Fetches `/api/health/providers`. Documents all data sources. |

## Shared Component Observations

No bugs found in shared components within scope. Two observations for other agents:

1. **`components/ui/Card`** — Used extensively across all pages. No issues found.
2. **`components/intelligence/StreamOutput`** — The `renderMarkdown` function handles only bold, italic, and line breaks. If game analysis output ever includes headers, lists, or links, it will render as raw text. Not a bug today but worth noting.

## Shimmer-Lock Investigation

Investigated the reported Intel page shimmer-lock issue. The `useIntelDashboard` hook has correct loading logic:
- `isLoading` = `!hasAnyData && allStillLoading` — transitions to false as soon as any sport returns data
- `allStillLoading` checks React Query's `isLoading` per query — disabled queries (when filtering to one sport) have `isLoading: false`
- The `useSportData` hook's `finally` block always clears loading state

No shimmer-lock path found in the current code. The skeleton reliably transitions to content or error state.
# Quality Sweep Notes — College Baseball Core (Agent 1)

## Shared Component Issues (DO NOT FIX — for other agents)

### SortableTh component (`components/ui/SortableTh.tsx`)
The SortableTh component does not accept a `text-color` override — it internally uses whatever text styling the `className` prop passes. When Heritage tokens like `text-[var(--bsi-dust)]` are applied via className, the SortableTh label text inherits correctly. No issue here.

### WeeklyPulseClient TypeScript error (`app/college-baseball/weekly-pulse/WeeklyPulseClient.tsx:83`)
Pre-existing TS error: `setPulse(data)` where `data` is `unknown` instead of `WeeklyPulseData`. The `await res.json()` result is untyped. Fix: cast `(await res.json()) as WeeklyPulseData`.

### Tailwind text utility classes vs Heritage CSS variables
Many pages use Tailwind semantic text classes (`text-text-tertiary`, `text-text-muted`) which map to low-contrast colors (#737373, rgba(245,240,235,0.40)). These barely pass WCAG AA against dark backgrounds. Consider updating the Tailwind theme `text.tertiary` from `#737373` to `#C4B8A5` (bsi-dust) or adding a `text-dust` utility class site-wide. This sweep fixed the most visible instances (standings table, rankings table, hub standings tab) but the pattern exists across ~100+ files.

## Issues Fixed in This Sweep

1. **Social Intel — stale freshness on signal rows**: Each signal row showed only clock time (e.g., "14:30 CT"). Changed to relative time ("3d ago") so visitors see how old each post actually is. Clock time available on hover via title attribute.

2. **Standings — low contrast table headers**: Table header row used `bg-background-secondary` (#1A1A1A) with `text-text-tertiary` (#737373). Changed to Heritage tokens: `bg-[var(--surface-press-box)]` (#111111) with `text-[var(--bsi-dust)]` (#C4B8A5). Also updated legend footer and data attribution border.

3. **Standings — Win% column dim text**: `text-text-secondary` for Win% values was readable but inconsistent with the rest of the row. Changed to `text-[var(--bsi-bone)]` for better visibility.

4. **Rankings — table header and legend contrast**: Same pattern as standings — updated table header row, all th elements, and legend footer from generic Tailwind tokens to Heritage Design System tokens.

5. **Rankings — "Also Receiving Votes" and "Dropped Out" were feature stubs**: Two cards contained only static text with no data. Replaced with data-driven sections that filter the rankings data for teams ranked >25 with points (also receiving) and teams whose previousRank was <=25 but current rank >25 (dropped out). Sections only render when there's actual data to show.

6. **Rankings — data attribution border**: Changed from `border-white/[0.06]` to `border-[var(--border-vintage)]`.

7. **News — defensive data shape handling**: Added guard for case where API returns data as a root array instead of `{ articles: [...] }`. Also added null/title check in filter to prevent rendering empty news items.

8. **Hub page — standings tab contrast**: Updated table header text from `text-text-muted` to `text-[var(--bsi-dust)]` with uppercase tracking. Updated data cell text from `text-text-tertiary` to `text-text-primary` / `text-text-secondary` for better readability.

## Pages Audited (No Issues Found)

- Scores page — solid empty states, Heritage tokens, proper live/final/scheduled sections
- Transfer portal — proper loading, empty, and data states with real API wiring
- Trends — correct empty state when no team selected, chart colors acceptable (raw hex for Recharts)
- Watchlist — proper empty state with action links, proper loading state
- Power Rankings — uses Heritage tokens throughout, proper empty/error/loading states
- Weekly Pulse — proper empty/error states, Heritage tokens, conference table well-structured
- Tournament HQ — comprehensive static content, all team links work, CWS timeline correct
- Compare — wired to real APIs, proper empty states
- Players — wired to real API, proper search/filter/sort, proper empty/error states
- Games/Schedule — CalendarView component handles states
- Conferences — wired to real APIs
- Preseason — editorial content, proper links
- Game detail pages — proper static params, client-side data loading

## Not In Scope (Agent 2 Owns)

- editorial/ — all editorial pages
- savant/ — Savant hub and player pages
- texas-intelligence/ — Texas Intel pages
