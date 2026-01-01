# BSI Infrastructure Audit — January 1, 2025

## Summary

Audited ahump20/BSI repository against live BlazeSportsIntel.com Cloudflare deployment. Removed Netlify artifacts and documented infrastructure discrepancies.

---

## Changes Made

### Files Deleted (4)

| File | Reason |
|------|--------|
| `_redirects` | Netlify artifact—not used by Cloudflare |
| `_headers` | Netlify artifact—not used by Cloudflare |
| `public/_redirects` | Netlify artifact—not used by Cloudflare |
| `public/_headers` | Netlify artifact—not used by Cloudflare |

### Files Verified Clean
- `package.json` — No Netlify dependencies found
- `netlify.toml` — Does not exist (correct)

---

## Wrangler Binding Analysis

**File:** `bsi-production/wrangler.toml`

| Binding | Expected (User) | Actual (Config) | Status |
|---------|-----------------|-----------------|--------|
| ASSETS (R2) | blazesports-assets | blazesports-assets | ✓ Match |
| DB (D1) | bsi-portal-db | bsi-game-db | ⚠ Mismatch |
| SESSIONS (KV) | BSI_PORTAL_CACHE | b03e...ad7 | ✓ Bound |
| ANALYTICS_KV | PREDICTION_CACHE | *commented out* | ⚠ Missing |
| ANALYTICS | bsi_sports_metrics | bsi_home_analytics | ⚠ Mismatch |

### Recommendations
1. **DB binding:** Confirm which D1 database is authoritative—`bsi-portal-db` or `bsi-game-db`
2. **ANALYTICS_KV:** Run `wrangler kv:namespace create "ANALYTICS_KV"` and update wrangler.toml
3. **ANALYTICS dataset:** Confirm which Analytics Engine dataset to use

---

## Worker Route Handler Analysis

**File:** `bsi-production/worker.js`

Worker expects these R2 paths (prefix: `origin/`):

### Core Pages
| Expected Path | Repo File | Status |
|---------------|-----------|--------|
| origin/index.html | bsi-production/index.html | ✓ Exists |
| origin/login.html | bsi-production/login.html | ✓ Exists |
| origin/signup.html | bsi-production/public/signup.html | ✓ Exists |
| origin/dashboard.html | bsi-production/dashboard.html | ✓ Exists |
| origin/analytics.html | — | ✗ MISSING |

### Tools
| Expected Path | Repo File | Status |
|---------------|-----------|--------|
| origin/tools.html | bsi-production/public/tools.html | ✓ Exists |
| origin/tools/team-archetype-builder/index.html | bsi-production/dist/tools/team-archetype-builder/index.html | ✓ Exists |
| origin/tools/composition-optimizer/index.html | bsi-production/dist/tools/composition-optimizer/index.html | ✓ Exists |
| origin/tools/win-probability.html | bsi-production/public/tools/win-probability.html | ✓ Exists |
| origin/tools/player-comparison.html | bsi-production/public/tools/player-comparison.html | ✓ Exists |
| origin/tools/draft-value.html | bsi-production/public/tools/draft-value.html | ✓ Exists |
| origin/tools/schedule-strength.html | bsi-production/public/tools/schedule-strength.html | ✓ Exists |

### Sport Sections
| Expected Path | Repo File | Status |
|---------------|-----------|--------|
| origin/college-baseball/index.html | — | ✗ MISSING |
| origin/mlb/index.html | — | ✗ MISSING |
| origin/nfl/index.html | — | ✗ MISSING |
| origin/nba/index.html | — | ✗ MISSING |

---

## Missing Files (Action Required)

The bsi-home Worker references 5 HTML files that don't exist in the repository:

1. `bsi-production/analytics.html`
2. `bsi-production/college-baseball/index.html`
3. `bsi-production/mlb/index.html`
4. `bsi-production/nfl/index.html`
5. `bsi-production/nba/index.html`

### Options
- **Create stub pages** that redirect to Next.js equivalents
- **Update worker.js** to proxy these routes to Cloudflare Pages
- **Add the HTML files** with appropriate content

---

## Deployment Architecture

The site has **two parallel deployment pipelines**:

### 1. Next.js → Cloudflare Pages
```
npm run build → out/
npm run deploy:production → Cloudflare Pages (blazesportsintel.pages.dev)
```
- Handles: All React routes (`/mlb/*`, `/nfl/*`, `/college-baseball/*`, etc.)
- Domain: blazesportsintel.com (via Pages custom domain)

### 2. bsi-home Worker → R2
```
bsi-production/deploy.sh → R2 bucket + Worker deploy
```
- Handles: Static pages (login, signup, dashboard, tools)
- R2 bucket: blazesports-assets (prefix: origin/)
- Worker: bsi-home

### Conflict
Both pipelines claim the same domain. The Worker's route pattern (`blazesportsintel.com/*`) may intercept Pages traffic. Verify routing priority in Cloudflare Dashboard.

---

## iCloud Duplicate Files (Separate Issue)

Found 100+ files with " 2" and " 3" suffixes from iCloud Drive sync conflicts. These should be cleaned up separately:

```bash
# Preview duplicates
find . -name "* 2.*" -o -name "* 3.*" | wc -l

# Remove after review
find . -name "* 2.*" -exec rm {} \;
find . -name "* 3.*" -exec rm {} \;
```

---

## Audit Metadata

- **Date:** 2025-01-01 (America/Chicago)
- **Auditor:** Claude Code
- **Repository:** github.com/ahump20/BSI
- **Branch:** main
- **Production Worker:** bsi-home
- **R2 Bucket:** blazesports-assets
