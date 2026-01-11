# BSI Route Map

Generated: 2025-01-11
Crawl Tool: Playwright MCP

## Route Inventory

### Marketing Pages (CSR from R2)
| Route | Status | Issues |
|-------|--------|--------|
| `/` | 200 | None - Renders correctly |
| `/about` | 200 | Not crawled |
| `/pricing` | 200 | Not crawled |
| `/contact` | 200 | Not crawled |
| `/privacy` | 200 | Not crawled |
| `/terms` | 200 | Not crawled |

### Score Hub Pages (CSR with Dynamic Data)
| Route | Status | Issues |
|-------|--------|--------|
| `/scores` | 200 | Vanilla JS - no React (previous docs were incorrect) |
| `/mlb/` | 200 | "TBD" placeholders, "--" for stats |
| `/nfl/` | 200 | Not crawled |
| `/nba/` | 200 | Not crawled |
| `/college-baseball/` | 200 | 404 resource, freshness-indicator.js blocked, "Loading..." stuck |
| `/college-football/` | 200 | Not crawled |
| `/ncaab/` | 200 | Not crawled |

### Tools (CSR from R2)
| Route | Status | Issues |
|-------|--------|--------|
| `/tools` | 200 | None - Renders correctly |
| `/tools/strike-zone/` | 200 | Not crawled |
| `/tools/spray-chart/` | 200 | Not crawled |
| `/tools/nil-valuation/` | 200 | Not crawled (Pro) |

### Auth Routes
| Route | Status | Issues |
|-------|--------|--------|
| `/login` | 200 | Not crawled |
| `/signup` | 200 | Not crawled |
| `/dashboard` | 200 | Not crawled |

## Issues Identified (Updated 2025-01-11)

### Resolved
1. ~~**React Hydration Mismatch** (`/scores`)~~ - **RESOLVED**: /scores is 100% vanilla JS, not React. Previous documentation was incorrect.
2. ~~**Script MIME Type Blocking**~~ - **RESOLVED**: Added JS uploads to deploy.sh and /src/js/* route in worker.js
3. ~~**Missing Attribution**~~ - **RESOLVED**: BSIAttribution footer component integrated

### Remaining
4. **Data Placeholders** (`/mlb/`, `/college-baseball/`)
   - "TBD" showing for team names when API fails
   - "--" showing for stats during loading
   - Solution: Skeleton loaders during load, error state on failure

5. **404 Resources**
   - Some pages may still have missing resources
   - Monitor console errors during testing

## Console Errors Log

### /scores
```
(No errors - vanilla JS, no React)
```

### /college-baseball/
```
Failed to load resource: 404
Refused to execute script 'freshness-indicator.js' - MIME type
[BSI Analytics] Initialized - success
```

### /mlb/
```
No console errors - data just shows placeholders
```

## Baseline Screenshots

| Page | File | Notes |
|------|------|-------|
| Home | `bsi-baseline-home.png` | Brand tokens correct |
| Scores | `bsi-baseline-scores.png` | React template, different nav |
| College Baseball | `bsi-baseline-college-baseball.png` | Data hydration issues |
| MLB | `bsi-baseline-mlb.png` | TBD placeholders |
| Tools | `bsi-baseline-tools.png` | Clean render |

Screenshots saved to: `/Users/AustinHumphrey/.playwright-mcp/`

## Rendering Architecture

All pages use vanilla HTML + vanilla JavaScript:

- **Homepage** (`/`): Vanilla HTML served from R2, client-side JS for interactivity
- **Score Pages** (`/scores`): Vanilla HTML + fetch() for live data, no React
- **Sport Hubs** (`/mlb/`, `/college-baseball/`): Vanilla HTML + fetch() for data
- **Tools** (`/tools`): Vanilla HTML hub; 3d-showcase and vision-coach use React internally (isolated)

**Note**: Previous documentation incorrectly stated /scores uses React. Investigation confirmed all public pages are vanilla JS.

## Recommendations (Updated 2025-01-11)

1. ~~Add error boundaries~~ - Done (error-boundary.js)
2. ~~Fix MIME type for freshness-indicator.js~~ - Done (deploy.sh + worker route)
3. Add skeleton loaders for loading states (replace "--" and "TBD")
4. ~~Add attribution footer component~~ - Done (BSIAttribution)
5. No consolidation needed - architecture is already consistent (vanilla JS)
