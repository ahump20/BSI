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
