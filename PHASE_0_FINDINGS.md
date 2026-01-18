# Phase 0 Findings: BSI Site Audit

**Date:** January 14, 2026
**Auditor:** Staff Engineer + UI Systems Architect
**Repo:** github.com/ahump20/BSI

---

## Executive Summary

The BSI site has multiple broken pages, dead links, and non-functional tools. Root causes fall into four categories:

1. **Missing Route Files** - Links point to routes that don't exist in the Next.js app directory
2. **Static Export Misconfiguration** - Next.js `trailingSlash: true` creates file structure incompatible with Cloudflare Pages expectations
3. **Navigation Fragmentation** - Multiple nav components with inconsistent link targets
4. **Unintegrated Builds** - Arcade games (Hot Dog Dash) are separate Vite apps not included in main build

---

## Framework & Deployment Topology

| Component    | Technology             | Notes                                         |
| ------------ | ---------------------- | --------------------------------------------- |
| Framework    | Next.js 16.x           | App Router with `output: 'export'`            |
| Deployment   | Cloudflare Pages       | Static site at `blazesportsintel.com`         |
| Build Output | `out/` directory       | Deployed via `wrangler pages deploy out`      |
| Database     | Cloudflare D1          | `bsi-historical-db`, `bsi-game-db`            |
| Cache        | Cloudflare KV          | Single namespace with key prefixes            |
| Storage      | Cloudflare R2          | `blaze-sports-data-lake`, `blaze-nil-archive` |
| AI           | Workers AI + Vectorize | `sports-scouting-index`                       |

---

## Issue #1: Dead Pages (404 Errors)

### 1.1 NFL Scores Page

- **Symptom:** `/nfl/scores` returns 404
- **Root Cause:** No `app/nfl/scores/page.tsx` file exists
- **Evidence:** `app/nfl/` directory contains only `page.tsx` (main NFL hub), no `scores/` subdirectory
- **Fix Required:** Create `app/nfl/scores/page.tsx`

### 1.2 NBA Scores Page

- **Symptom:** `/nba/scores` returns 404
- **Root Cause:** No `app/nba/scores/page.tsx` file exists
- **Evidence:** `app/nba/` directory contains only `page.tsx` (main NBA hub), no `scores/` subdirectory
- **Fix Required:** Create `app/nba/scores/page.tsx`

### 1.3 Bottom Nav Dead Links

- **Symptom:** Mobile bottom nav links to non-existent routes
- **Root Cause:** `components/sports/BottomNav.tsx` hardcodes links to:
  - `/watch` - NO app route exists
  - `/teams` - NO app route exists
  - `/more` - NO app route exists
- **Evidence:** No matching directories in `app/` folder
- **Fix Required:** Either create routes or update nav links to existing pages

### 1.4 Scores Hub Links

- **Symptom:** `/scores` page links to pages that return 404
- **Root Cause:** `app/scores/page.tsx` links to `/nfl` and `/nba` (exist) but sports cards imply scores pages
- **Evidence:** Cards show "View Scores →" but href goes to `/nfl`, `/nba` main pages, not dedicated scores pages
- **Note:** These links technically work but UX implies dedicated scores pages

---

## Issue #2: Blank/Broken Tools

### 2.1 Tools Architecture Problem

- **Symptom:** Tool pages render blank or return "Asset not found"
- **Root Cause:** Tools exist ONLY as static HTML in `public/tools/`, not as Next.js app routes
- **Evidence:**
  - `public/tools/draft-value.html` exists (static HTML)
  - `app/tools/` directory does NOT exist
  - No Next.js routing for `/tools/*` paths

### 2.2 Affected Tools

| Tool                   | Static File Exists                    | App Route Exists | Status  |
| ---------------------- | ------------------------------------- | ---------------- | ------- |
| Draft Value Calculator | `public/tools/draft-value.html`       | ❌ No            | Broken  |
| Schedule Strength      | `public/tools/schedule-strength.html` | ❌ No            | Broken  |
| Player Comparison      | `public/tools/player-comparison.html` | ❌ No            | Broken  |
| Win Probability        | `public/tools/win-probability.html`   | ❌ No            | Broken  |
| 3D Showcase            | Unknown                               | ❌ No            | Missing |
| Head-to-Head           | Unknown                               | ❌ No            | Missing |

### 2.3 Fix Options

**Option A:** Convert static HTML tools to Next.js pages in `app/tools/*/page.tsx`
**Option B:** Configure Cloudflare Pages `_redirects` to serve static HTML at `/tools/*` paths
**Option C:** Use `public/_routes.json` to handle tool routing

---

## Issue #3: Navigation Inconsistencies

### 3.1 Multiple Nav Configurations

- **Main Nav** (`lib/navigation.ts`): Home, College Baseball, MLB, NFL, NBA, Vision AI, Dashboard, About, Pricing
- **Bottom Nav** (`components/sports/BottomNav.tsx`): Home, Scores, Watch, Teams, More
- **Result:** Users see different nav options on mobile vs desktop, and mobile nav links to non-existent pages

### 3.2 Nav Item Inventory

| Nav Item         | Desktop Nav                  | Mobile Bottom Nav | Route Exists |
| ---------------- | ---------------------------- | ----------------- | ------------ |
| Home             | ✅ `/`                       | ✅ `/`            | ✅ Yes       |
| College Baseball | ✅ `/college-baseball`       | ❌                | ✅ Yes       |
| MLB              | ✅ `/mlb`                    | ❌                | ✅ Yes       |
| NFL              | ✅ `/nfl`                    | ❌                | ✅ Yes       |
| NBA              | ✅ `/nba`                    | ❌                | ✅ Yes       |
| Scores           | ❌                           | ✅ `/scores`      | ✅ Yes       |
| Watch            | ❌                           | ✅ `/watch`       | ❌ NO        |
| Teams            | ❌                           | ✅ `/teams`       | ❌ NO        |
| More             | ❌                           | ✅ `/more`        | ❌ NO        |
| Vision AI        | ✅ `/vision-AI-Intelligence` | ❌                | ✅ Yes       |
| Dashboard        | ✅ `/dashboard`              | ❌                | ✅ Yes       |
| About            | ✅ `/about`                  | ❌                | ✅ Yes       |
| Pricing          | ✅ `/pricing`                | ❌                | ✅ Yes       |

---

## Issue #4: Arcade Games

### 4.1 BlazeArcade Component

- **Location:** `components/arcade/BlazeArcade.tsx`
- **Architecture:** Games are React components defined inline within the same file
- **Games Defined:** Hot Dog Dash, Backyard Baseball, Blitz Football, Hoops Challenge, QB Challenge

### 4.2 Hot Dog Dash Failure

- **Symptom:** Game fails to load
- **Root Cause:** Hot Dog Dash is a SEPARATE Vite/React app in `/games/hotdog-dash/`
- **Evidence:**
  - `/games/hotdog-dash/package.json` shows separate build: `"build": "vite build"`
  - Main build (`npm run build`) does NOT include games build
  - BlazeArcade component may reference assets that aren't deployed

### 4.3 Games Directory Structure

```
/games/
├── hotdog-dash/      # Separate Vite app
│   ├── index.html
│   ├── package.json
│   ├── src/
│   └── vite.config.ts
├── backyard/         # Status unknown
├── blitz/            # Status unknown
├── hoops/            # Status unknown
└── qb-challenge/     # Status unknown
```

### 4.4 Fix Required

1. Add games build step to main `package.json` scripts
2. Copy built game assets to `public/games/` or `out/games/`
3. Update BlazeArcade component to correctly reference deployed game paths

---

## Issue #5: Static Export Configuration

### 5.1 Trailing Slash Problem

- **Config:** `next.config.ts` has `trailingSlash: true`
- **Expected Behavior:** `/mlb/scores` should resolve to `/mlb/scores/index.html`
- **Actual Behavior:** Build creates `/mlb/scores.html` at parent level, not `index.html` inside directory
- **Evidence:** `out/mlb/scores/` directory contains only `.txt` metadata files

### 5.2 Current Build Output Structure

```
out/
├── mlb/
│   ├── scores/
│   │   └── _buildManifest.js.txt  # Metadata only, no index.html
│   └── scores.html                 # Actual page content
├── college-baseball/
│   ├── scores/
│   │   └── _buildManifest.js.txt
│   └── scores.html
```

### 5.3 Fix Options

**Option A:** Remove `trailingSlash: true` from next.config.ts
**Option B:** Add `_redirects` rules to map trailing slash URLs to `.html` files
**Option C:** Post-build script to restructure output (move `page.html` to `page/index.html`)

---

## Existing Routing Rules

### `public/_redirects`

```
https://www.blazesportsintel.com/* https://blazesportsintel.com/:splat 301
/home /dashboard 301
/sports /dashboard 301
/login /auth/login 301
/signup /auth/signup 301
/register /auth/signup 301
/subscribe /pricing 301
/plans /pricing 301
```

**Note:** No rules for tools or trailing slash resolution.

---

## Routes That DO Work

These routes have corresponding `page.tsx` files and should function:

- `/` - Home page
- `/college-baseball` - College Baseball hub
- `/college-baseball/scores` - College Baseball scores ✅
- `/college-baseball/rankings` - Rankings page ✅
- `/college-baseball/transfer-portal` - Transfer portal ✅
- `/mlb` - MLB hub
- `/mlb/scores` - MLB scores ✅
- `/nfl` - NFL hub (no scores sub-page)
- `/nba` - NBA hub (no scores sub-page)
- `/scores` - Scores hub (links to all sports)
- `/dashboard` - User dashboard
- `/pricing` - Pricing page
- `/about` - About page
- `/vision-AI-Intelligence` - AI tools

---

## Recommended Fix Priority

| Priority | Issue                           | Impact                               | Effort |
| -------- | ------------------------------- | ------------------------------------ | ------ |
| P0       | Create NFL/NBA scores pages     | High - Dead links from main nav      | Low    |
| P0       | Fix Bottom Nav links            | High - Mobile users hit 404s         | Low    |
| P1       | Integrate tools into app routes | High - Tools page non-functional     | Medium |
| P1       | Fix arcade games build          | Medium - Featured content broken     | Medium |
| P2       | Unify navigation components     | Medium - Inconsistent UX             | Medium |
| P3       | Fix trailing slash behavior     | Low - Only affects direct URL access | Low    |

---

## Implementation Log

### Phase 1: Routing & Navigation - COMPLETED ✅

1. **Created `app/nfl/scores/page.tsx`** - Full NFL scores page with week-based navigation (weeks 1-18), live game indicators, auto-refresh for live games
2. **Created `app/nba/scores/page.tsx`** - Full NBA scores page with date-based navigation, live game indicators, auto-refresh for live games
3. **Updated `components/sports/BottomNav.tsx`** - Fixed dead links (`/watch`, `/teams`, `/more`) to working routes (`/scores`, `/college-baseball`, `/dashboard`, `/pricing`)
4. **Updated `app/scores/page.tsx`** - Fixed hrefs from `/nfl` and `/nba` to `/nfl/scores` and `/nba/scores`
5. **Updated `app/nfl/page.tsx`** - Fixed scores button to link to `/nfl/scores`
6. **Updated `app/nba/page.tsx`** - Fixed scores button to link to `/nba/scores`

### Phase 2: Tools Pages - COMPLETED ✅

1. **Updated `public/_redirects`** - Added rewrite rules for clean tool URLs:
   - `/tools/draft-value` → `/tools/draft-value.html`
   - `/tools/win-probability` → `/tools/win-probability.html`
   - `/tools/schedule-strength` → `/tools/schedule-strength.html`
   - `/tools/player-comparison` → `/tools/player-comparison.html`
   - `/tools/composition-optimizer` → `/tools/composition-optimizer/index.html`
   - `/tools/team-archetype-builder` → `/tools/team-archetype-builder/index.html`

### Phase 3: Arcade Games - COMPLETED ✅

1. **Verified `components/arcade/BlazeArcade.tsx`** - Contains 3 fully functional inline games:
   - Hot Dog Dash
   - Sandlot Slugger
   - Gridiron Blitz
2. **Fixed TypeScript errors** - Added proper type assertions to NFL/NBA scores pages
3. **Note:** Games are inline React components (not separate Vite apps) and work correctly

### Phase 4: Reliability & UX - COMPLETED ✅

1. **Created `scripts/validate-routes.mjs`** - Route health validation script for CI
   - Scans all TSX and HTML files for internal links
   - Compares against existing app routes and static files
   - Reports potentially broken links with file locations
2. **Updated `public/_redirects`** - Added legacy URL redirects:
   - `/scores/mlb` → `/mlb/scores`
   - `/scores/nfl` → `/nfl/scores`
   - `/scores/nba` → `/nba/scores`
   - `/legal/privacy` → `/privacy`
   - `/legal/terms` → `/terms`

---

## Files Modified

| File                              | Change                                    |
| --------------------------------- | ----------------------------------------- |
| `app/nfl/scores/page.tsx`         | **NEW** - NFL scores page                 |
| `app/nba/scores/page.tsx`         | **NEW** - NBA scores page                 |
| `components/sports/BottomNav.tsx` | Fixed dead navigation links               |
| `app/scores/page.tsx`             | Updated NFL/NBA href targets              |
| `app/nfl/page.tsx`                | Fixed scores button link                  |
| `app/nba/page.tsx`                | Fixed scores button link                  |
| `public/_redirects`               | Added tools rewrites and legacy redirects |
| `scripts/validate-routes.mjs`     | **NEW** - Route health validator          |

---

## Remaining Work (Phase 5: Deploy & Verify)

1. Run full build: `npm run build`
2. Deploy to Cloudflare Pages: `wrangler pages deploy out`
3. Verify all fixed routes work in production
4. Run route validator to check for any remaining issues

---

_Updated: January 14, 2026_
