# BSI Template Architecture

Generated: 2025-01-11

## Current State: Unified Vanilla JS

All public-facing pages use vanilla HTML + vanilla JavaScript. No framework consolidation is needed.

### Architecture Overview

| Layer | Technology | Notes |
|-------|------------|-------|
| Server | Cloudflare Worker | Routes requests, serves assets from R2 |
| HTML | Static files in R2 | Served with proper MIME types |
| Styling | CSS (bsi-enhancements.css) | Design tokens, animations, responsive |
| Interactivity | Vanilla JavaScript | fetch() for data, DOM manipulation |
| Data | Highlightly API | Primary sports data with ESPN fallback |

### Page Types

**Marketing Pages** (static content):
- `/`, `/about`, `/pricing`, `/contact`, `/privacy`, `/terms`
- No API calls, pure HTML/CSS

**Score Hub Pages** (dynamic data):
- `/scores`, `/mlb/scores`, `/nfl/scores`, `/nba/scores`
- fetch() calls to `/api/{sport}/scores`
- 15-second auto-refresh for live games

**Sport Landing Pages** (mixed content):
- `/mlb/`, `/nfl/`, `/nba/`, `/college-baseball/`, `/college-football/`
- Static HTML structure with fetch() for standings/stats

**Pro Tools** (isolated components):
- `/tools/strike-zone/`, `/tools/spray-chart/`, etc.
- Self-contained HTML with embedded JavaScript
- Two exceptions use React internally:
  - `/tools/3d-showcase/` - React Three Fiber for 3D visualization
  - `/tools/vision-coach/` - React via CDN for complex state management
- These React tools are fully isolated and don't affect other pages

### Shared JavaScript Modules

Located in `/src/js/`, uploaded to R2 and served via `/src/js/*` route:

| Module | Purpose |
|--------|---------|
| `error-boundary.js` | Global error handling, fallback UI |
| `freshness-indicator.js` | Orchestrates freshness display |
| `freshness-calculator.js` | Calculates data age/staleness |
| `freshness-badge.js` | Renders visual freshness badges |
| `attribution-footer.js` | "Last updated" + "Powered by Highlightly" |
| `analytics.js` | Event tracking to Cloudflare Analytics |

### Why This Architecture Works

1. **Zero build step** - HTML/CSS/JS served directly, no webpack/vite needed
2. **Fast deployment** - Just upload to R2 and deploy worker
3. **Minimal dependencies** - Only workerd for local dev
4. **Cloudflare-native** - Leverages R2, KV, D1, Analytics Engine
5. **Easy debugging** - View source works, no minification in dev

### Previous Misconception

Earlier documentation incorrectly stated `/scores` used React. Investigation on 2025-01-11 confirmed:
- No React, ReactDOM, or hydration in `/scores`
- All score pages use vanilla JS with fetch()
- The "React hydration error #418" was a stale note from a different context

### Recommendation

**No consolidation needed.** The current vanilla JS architecture is:
- Consistent across all pages
- Well-suited for Cloudflare Workers
- Performant (no framework overhead)
- Maintainable (simple debugging)

The two React tools (3d-showcase, vision-coach) are appropriately isolated and don't warrant converting the rest of the site to React.
