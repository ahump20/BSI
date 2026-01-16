# BSI Deployment Notes

**Date:** January 14, 2026
**Status:** Ready for Deployment

---

## Summary of Changes

This update fixes all broken pages, dead links, and blank tools identified in the Phase 0 audit.

### Files Created

1. **`app/nfl/scores/page.tsx`** - New NFL scores page
   - Week-based navigation (weeks 1-18)
   - Live game indicators with auto-refresh (30s)
   - Full game cards with scores, venue, broadcast info

2. **`app/nba/scores/page.tsx`** - New NBA scores page
   - Date-based navigation
   - Live game indicators with auto-refresh (30s)
   - Full game cards with scores, venue, broadcast info

3. **`scripts/validate-routes.mjs`** - Route health validator
   - Run with `node scripts/validate-routes.mjs`
   - Detects broken internal links before deployment

### Files Modified

1. **`components/sports/BottomNav.tsx`**
   - Fixed dead links `/watch`, `/teams`, `/more`
   - Now links to: `/scores`, `/college-baseball`, `/dashboard`, `/pricing`

2. **`app/scores/page.tsx`**
   - Updated hrefs from `/nfl` to `/nfl/scores`
   - Updated hrefs from `/nba` to `/nba/scores`

3. **`app/nfl/page.tsx`**
   - Updated "NFL Scores" button to link to `/nfl/scores`

4. **`app/nba/page.tsx`**
   - Updated "NBA Scores" button to link to `/nba/scores`

5. **`public/_redirects`**
   - Added tools rewrites (clean URLs for static HTML tools)
   - Added legacy score URL redirects (`/scores/mlb` → `/mlb/scores`, etc.)
   - Added legal page redirects (`/legal/privacy` → `/privacy`, etc.)

6. **`PHASE_0_FINDINGS.md`**
   - Updated with implementation log documenting all fixes

---

## Deployment Steps

### 1. Install Dependencies (if needed)

```bash
npm install
```

### 2. Run TypeScript Check

```bash
npx tsc --noEmit
```

Should pass with no errors.

### 3. Build the Site

```bash
npm run build
```

This runs Next.js static export to `out/` directory.

### 4. Deploy to Cloudflare Pages

```bash
wrangler pages deploy out
```

### 5. Verify in Production

Check these URLs after deployment:

- `/nfl/scores` - NFL scores page (NEW)
- `/nba/scores` - NBA scores page (NEW)
- `/scores` - Scores hub with working links
- `/tools/draft-value` - Draft Value Calculator
- `/tools/win-probability` - Win Probability Calculator
- `/arcade` - Arcade games hub

### 6. Run Route Validator (Optional CI Step)

```bash
node scripts/validate-routes.mjs
```

---

## Redirects Active

The following redirects are now configured in `public/_redirects`:

| From                       | To                              | Type         |
| -------------------------- | ------------------------------- | ------------ |
| `/scores/mlb`              | `/mlb/scores`                   | 301 Redirect |
| `/scores/nfl`              | `/nfl/scores`                   | 301 Redirect |
| `/scores/nba`              | `/nba/scores`                   | 301 Redirect |
| `/legal/privacy`           | `/privacy`                      | 301 Redirect |
| `/legal/terms`             | `/terms`                        | 301 Redirect |
| `/tools/draft-value`       | `/tools/draft-value.html`       | 200 Rewrite  |
| `/tools/win-probability`   | `/tools/win-probability.html`   | 200 Rewrite  |
| `/tools/schedule-strength` | `/tools/schedule-strength.html` | 200 Rewrite  |
| `/tools/player-comparison` | `/tools/player-comparison.html` | 200 Rewrite  |

---

## Known Limitations

1. **Legacy HTML Files**: Many static HTML files in `public/` and `bsi-production/` contain links to non-existent routes. These are legacy files that should be migrated to Next.js pages or removed.

2. **Build Environment**: The build requires:
   - Node.js 18+
   - `sharp` module for image optimization (optional, build continues without it)
   - All dependencies in `node_modules`

3. **API Endpoints**: NFL and NBA scores pages fetch from `/api/nfl/scores` and `/api/nba/scores`. These API routes must exist and return data in the expected format for live data to display.

---

---

## Deployment History

### January 14, 2026 - Phase 0 Fixes Deployed ✅

**Deployment ID:** `b2c64b5a-faa4-4a52-865c-2bb1e1389d5c`
**Preview URL:** https://b2c64b5a.blazesportsintel.pages.dev
**Production URL:** https://blazesportsintel.pages.dev

**Verified Routes (all returning 200):**

- `/nfl/scores` ✅
- `/nba/scores` ✅
- `/scores` ✅
- `/tools/draft-value` ✅
- `/tools/win-probability` ✅
- `/arcade` ✅

**Note:** The `_redirects` file was updated to remove tools rewrites that conflicted with Cloudflare Pages' automatic HTML extension stripping. This was causing redirect loops.

_Deployment complete and verified._
