# Player Discovery Engine — Design Spec

**Date:** 2026-03-30
**Status:** Approved
**Signal:** Individual player page (tex-robbins-43) hit top 15 by views organically. Long-tail traffic is the largest bucket (162 views). Pricing page at 19 views shows purchase intent. College baseball in peak conference play.

## What This Does

Rebuilds `/college-baseball/players/` from a small card-based roster browser (8 SEC teams, basic stats) into a searchable directory of every D1 player with advanced analytics. Visitors can find any player by name, filter by conference/position/class year, sort by any metric, and click through to the full scouting profile.

## What Changes for Visitors

**Before:** A page showing player cards for 8 hardcoded SEC teams. Traditional stats only (AVG, HR, RBI, ERA). No way to find players from other programs. No advanced metrics visible.

**After:** A searchable table of 1,900+ players across all D1 programs. Advanced metrics (wOBA, wRC+, FIP, ERA-) visible alongside traditional stats. Tabs for batting and pitching. Filters update the URL so searches are shareable as links.

## Architecture

### Backend

**New handler:** `handleSavantPlayerDirectory` in `workers/handlers/savant.ts`

**Route:** `GET /api/savant/directory`

**Query params:**
- `type` — `batting` (default) or `pitching`
- `search` — LIKE match on player_name or team
- `conference` — exact match on conference name
- `position` — P, C, IF, OF, or specific position code
- `class` — Fr, So, Jr, Sr
- `sort` — any allowed metric column (default: woba for batting, fip for pitching)
- `dir` — asc or desc (default: desc for batting metrics, asc for pitching metrics where lower is better like FIP/ERA)
- `min_pa` / `min_ip` — minimum threshold (default: 1, not 25 like leaderboard)
- `page` — page number (default: 1)
- `limit` — results per page (default: 50, max: 100)

**Data source:** `cbb_batting_advanced` or `cbb_pitching_advanced` (existing D1 tables, computed every 6h by savant-compute cron).

**Response shape:**
```json
{
  "players": [
    {
      "player_id": "12345",
      "player_name": "Blake Binderup",
      "team": "Oklahoma St.",
      "conference": "Big 12",
      "position": "OF",
      "class_year": "Jr",
      "metrics": {
        "avg": 0.421, "obp": 0.520, "slg": 0.895,
        "ops": 1.415, "woba": 0.887, "wrc_plus": 408,
        "iso": 0.474, "k_pct": 8.2, "bb_pct": 18.1,
        "hr": 12, "pa": 122, "g": 28
      },
      "percentiles": {
        "woba": 99, "wrc_plus": 99, "k_pct": 95, "bb_pct": 92
      },
      "playerType": "batter"
    }
  ],
  "total": 1847,
  "page": 1,
  "totalPages": 37,
  "conferences": ["ACC", "American", "Big 12", "Big Ten", "SEC", ...],
  "tier": "free",
  "meta": { "source": "bsi-savant", "fetched_at": "...", "timezone": "America/Chicago" }
}
```

The `conferences` array is returned on the first page load so the frontend can populate the conference filter dynamically.

Reuses existing `computePercentileRanks()` function from savant.ts. Reuses existing KV caching pattern with 5-minute TTL.

### Frontend

**Page:** `/college-baseball/players/` (replaces current implementation)

**Layout:**
- Page header with player count and last-compute timestamp
- Filter bar: search input, conference dropdown, position dropdown, class year dropdown, minimum PA/IP threshold
- Two tabs: Batting / Pitching
- Sortable data table (Heritage `.stat-table` pattern)
- Pagination footer with page count and total
- Data attribution with source and timestamp

**Batting table columns:** Rank, Name (linked), Team, Conf, Pos, Class, AVG, wOBA, wRC+, OPS, ISO, K%, BB%, HR, PA

**Pitching table columns:** Rank, Name (linked), Team, Conf, Pos, Class, ERA, FIP, ERA-, WHIP, K/9, BB/9, K:BB, IP, G/GS

**URL state:** All filter values stored in URL query params via `window.history.replaceState`. On page load, filters initialize from URL params. This makes every search shareable.

Example URLs:
- `/college-baseball/players/?tab=batting&conference=SEC&sort=wrc_plus`
- `/college-baseball/players/?tab=pitching&search=texas&sort=fip&page=2`
- `/college-baseball/players/?tab=batting&class=Jr&sort=woba` (draft-eligible power hitters)

**Player name links:** Each player name links to `/college-baseball/savant/player/{player_id}` (the existing Savant profile page with percentile bars and scouting grades).

**Mobile behavior:** Name column stays fixed, metrics scroll horizontally. Filter bar collapses behind a toggle button.

**Visual treatment:**
- Heritage `.stat-table` pattern: `--surface-press-box` header, `--bsi-font-data` for numbers, `--bsi-dust` column headers
- Player names in `--heritage-columbia-blue` (clickable link color)
- Top-10% metric values highlighted in `--bsi-primary` text color
- Bottom-10% metric values in `--bsi-error` text color
- No percentile bars in table rows (save for profile pages)
- No player photos in table (too heavy at this density)
- No hero section (this is a workspace, not a landing page)

### Cross-Links

- Player names in table link to Savant profile pages
- Page header includes "View Leaderboard" link to `/college-baseball/savant/`
- Savant leaderboard gets reciprocal "Browse All Players" link to this page
- College baseball hub nav includes this page

### What Gets Removed

- Hardcoded SEC teams array (8 teams)
- Card-based player grid layout
- ESPN-only data path for player list
- Traditional-stats-only sort options
- `IntelSignup` component at page bottom (not relevant to this surface)

### What Stays

- `handleCollegeBaseballPlayersList` handler (other pages may reference it)
- `/college-baseball/players/[playerId]/` individual detail page (separate from Savant profile)
- `/college-baseball/players/compare/` comparison page
- `layout.tsx` with metadata (update description to mention advanced metrics)

## Static Export

The page is `'use client'` — all data fetched client-side. The existing `layout.tsx` handles metadata. No `generateStaticParams` needed for the index page itself (only for `[playerId]` dynamic routes, which already have it).

## Files to Create

None. All changes go in existing files.

## Files to Modify

1. `workers/handlers/savant.ts` — add `handleSavantPlayerDirectory` handler
2. `workers/index.ts` — import and register `GET /api/savant/directory` route (Hono, same pattern as line 662-665)
3. `app/college-baseball/players/page.tsx` — full rewrite
4. `app/college-baseball/players/layout.tsx` — update description to mention advanced metrics
5. `components/analytics/SavantLeaderboard.tsx` — add "Browse All Players" cross-link

## Files NOT to Modify

- `app/college-baseball/savant/player/[id]/` — existing profile pages work
- `app/college-baseball/players/[playerId]/` — existing detail pages work
- `app/college-baseball/players/compare/` — existing compare works
- `workers/handlers/college-baseball/players.ts` — existing handler stays
- D1 tables — no migrations needed

## Verification

1. `curl https://blazesportsintel.com/api/savant/directory?type=batting&limit=5` returns 5 batters with advanced metrics
2. `curl https://blazesportsintel.com/api/savant/directory?type=pitching&conference=SEC&sort=fip` returns SEC pitchers sorted by FIP
3. `curl https://blazesportsintel.com/api/savant/directory?search=texas` returns players matching "texas"
4. Browser: `/college-baseball/players/` shows table with real data, all filters work
5. Browser: clicking a player name navigates to working Savant profile page
6. Browser: URL updates when filters change, direct URL with params loads correct filtered state
7. Browser: pagination works (next/prev, page count accurate)
8. Sitemap already includes `/college-baseball/players/`
