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
| `/scores` | 200 | React hydration error #418, 404 on resource |
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

## Issues Identified

### Critical
1. **React Hydration Mismatch** (`/scores`)
   - Error: `Minified React error #418`
   - Cause: Server/client content mismatch
   - Impact: Can cause blank screens or broken UI

2. **Data Not Hydrating** (`/mlb/`, `/college-baseball/`)
   - "TBD" showing for team names
   - "--" showing for stats (Record, Win %, Games Back)
   - API fetch silently failing or returning empty data

### Moderate
3. **Script MIME Type Blocking** (`/college-baseball/`)
   - `freshness-indicator.js` refused to execute
   - Likely incorrect Content-Type header

4. **404 Resources**
   - Multiple pages have missing resources
   - Console errors but UI continues to render

### Low
5. **Missing Attribution**
   - No "Last updated" timestamps on data blocks
   - No "Powered by Highlightly" footer

## Console Errors Log

### /scores
```
Error: Minified React error #418
Failed to load resource: 404
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

- **Homepage** (`/`): Vanilla HTML served from R2, client-side JS hydration
- **Score Pages** (`/scores`): React-based SPA, different component structure
- **Sport Hubs** (`/mlb/`, `/college-baseball/`): Vanilla HTML + fetch() for data
- **Tools** (`/tools`): Vanilla HTML hub, individual tools may be React/Vue

## Recommendations

1. Add error boundaries to catch React hydration failures
2. Fix MIME type for freshness-indicator.js
3. Add fallback UI for failed data fetches (not "--" or "TBD")
4. Consolidate template approaches (vanilla vs React)
5. Add attribution footer component
