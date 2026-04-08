# BSI Production Site Audit — March 24, 2026

Full browser-level audit of blazesportsintel.com. Every route checked visually with Chrome screenshots, network requests inspected, console monitored. Findings ranked by severity and visitor impact.

---

## Executive Summary

The site has a split personality. College baseball is production-grade — scores, savant, teams, and the hub all render real data with polished UI. Everything else ranges from partially broken to completely invisible. A visitor who arrives at `/college-baseball/` sees a serious product. A visitor who clicks to MLB, NFL, NBA, CFB, About, Intel, or Contact sees empty pages and permanent loading skeletons.

**Working routes:** 8 of 25+ audited
**Broken/degraded routes:** 12+
**404 dead links:** 4 (NIL, Portal, Auth root, hero-scores API)
**Root cause pattern:** Frontend rendering failures despite healthy API responses (all return 200)

---

## SEVERITY 1 — Visitor Sees Nothing (Fix Immediately)

### 1.1 About Page — Ghosted Content
**Route:** `/about/`
**What visitors see:** Dark page with barely perceptible text outlines. Content exists in DOM but is effectively invisible — extremely low contrast or near-zero opacity.
**Impact:** Brand credibility page is the worst-looking page on the site.
**Root cause:** CSS opacity/color issue. No API dependency — this is static content.
**Fix:** Audit the About component's CSS. Likely an animation that never completes (Framer Motion `initial` opacity set to 0 with `animate` never firing), or a Heritage token mismatch where text color matches background.

### 1.2 Auth/Login Page — Invisible Form
**Route:** `/auth/login/`
**What visitors see:** Dark page with a faint amber glow in the center. The login form exists but renders invisible.
**Impact:** Users literally cannot sign in. Blocks all authenticated features.
**Root cause:** Same ghosting pattern as About — likely a shared layout component or animation issue.
**Fix:** Check for shared wrapper components between About and Auth. Look for Framer Motion `initial={{ opacity: 0 }}` without corresponding `animate`.

### 1.3 Contact Page — Completely Blank
**Route:** `/contact/`
**What visitors see:** Nav bar and nothing else. No form, no text, no footer.
**Impact:** No way to reach BSI. Footer links here.
**Fix:** Check if the page component exists and exports correctly. May be an empty file or a client component that fails silently.

### 1.4 College Baseball Rankings — Ghosted
**Route:** `/college-baseball/rankings/`
**What visitors see:** Same ghosting as About. Content exists but invisible.
**Impact:** Rankings is a high-traffic college baseball destination. Currently useless.
**Fix:** Same root cause investigation as About page.

### 1.5 Intel Page — 100% Shimmer Skeletons
**Route:** `/intel/`
**What visitors see:** Every single element is a loading skeleton. Nothing ever resolves.
**Impact:** Intel is a primary nav item. Visitors see an obviously broken page.
**Root cause:** The page fetches `/api/intel/news` (returns 200) but the component never transitions from loading state. Data shape mismatch between API response and component expectations is likely.
**Fix:** Compare the Intel page's expected data interface with the actual `/api/intel/news` response shape.

---

## SEVERITY 2 — Visitor Sees Partial/Broken Content

### 2.1 MLB Hub — Shimmer Standings, Empty Hero
**Route:** `/mlb/`
**What visitors see:** "Spring Training" banner renders. Feature cards show titles but no numbers. Standings section is permanent shimmer despite `/api/mlb/standings` returning 200.
**Impact:** MLB is the second-most important sport vertical.
**Root cause:** API returns data, component doesn't render it. Either the response shape doesn't match what the component destructures, or a conditional rendering check fails (e.g., checking for a property that exists under a different key).
**Fix:** Read the MLB hub component, log the actual API response, and compare against the TypeScript interface.

### 2.2 NFL Hub — Empty Hero + Shimmer
**Route:** `/nfl/`
**What visitors see:** Empty hero area, permanent shimmer skeletons below.
**Impact:** Offseason page should show standings or offseason content — not broken loading states.
**Fix:** Same pattern as MLB. Check data shape alignment.

### 2.3 NBA Hub — Empty Hero + Shimmer
**Route:** `/nba/`
**What visitors see:** Identical to NFL — empty hero, shimmer skeletons in standings.
**Fix:** Same pattern. These three sport hubs likely share a layout component with the same data-binding bug.

### 2.4 CFB Hub — Empty Hero + Shimmer
**Route:** `/cfb/`
**What visitors see:** Empty hero, shimmer in scores and standings.
**Fix:** Same shared-layout issue.

### 2.5 MLB Scores — Shimmer Cards
**Route:** `/mlb/scores/`
**What visitors see:** Date navigation works. 6 score cards are permanent shimmer. Footer visible.
**Impact:** Scores subpage is broken despite `/api/mlb/scores` returning 200.
**Fix:** Score card component likely expects a different data structure than what the MLB scores API provides.

### 2.6 College Baseball News — Shimmer Articles
**Route:** `/college-baseball/news/`
**What visitors see:** Great filter UI (All/Scores/Transfers/Recruiting/Editorial/Analysis/Rankings + source filters). But all 6 article cards are permanent shimmer skeletons.
**Impact:** News aggregation page is unusable.
**Root cause:** `/api/intel/news` returns 200. The news component either expects a different response key or the article card mapping function fails silently.

### 2.7 College Baseball Standings — Barely Visible
**Route:** `/college-baseball/standings/`
**What visitors see:** "CONFERENCE STANDINGS" text barely visible against dark background. Content may exist but contrast is critically low.
**Fix:** Check text color tokens. Likely using `--bsi-dust` or similar on `--surface-scoreboard` without enough contrast.

---

## SEVERITY 3 — Dead Routes / 404s

### 3.1 NIL Valuation — 404
**Route:** `/nil/`
**What visitors see:** Custom 404 page ("Looks like this play got called back").
**Impact:** Footer links to "NIL Valuation" under Tools. Dead link.
**Fix:** Either build the route or remove it from the footer.

### 3.2 Transfer Portal — 404
**Route:** `/college-baseball/portal/`
**What visitors see:** Custom 404 page.
**Impact:** Footer links to "Transfer Portal" under Tools. Dead link.
**Fix:** Either build the route or remove it from the footer.

### 3.3 Auth Root — 404
**Route:** `/auth/`
**What visitors see:** Custom 404 page. Redirecting to `/auth/login/` works (title updates) but the form is invisible (see 1.2).
**Fix:** Add redirect from `/auth/` to `/auth/login/`.

### 3.4 `/api/hero-scores` — 404 on Every Page Load
**Endpoint:** `/api/hero-scores`
**What happens:** Called on every single page navigation, returns 404 every time. This is wasted network traffic site-wide.
**Fix:** Either implement the endpoint or remove the fetch call from the shared layout/ticker component.

---

## SEVERITY 4 — Design & Polish Issues

### 4.1 Dashboard Page — Ghost Content
**Route:** `/dashboard/`
**What visitors see:** Title resolves ("Sign In | Blaze Sports Intel" redirect) but content is invisible. Similar to About page ghosting.

### 4.2 Footer Links Inventory (Broken)
These footer links point to non-existent or broken routes:
- **Transfer Portal** → `/college-baseball/portal/` → 404
- **NIL Valuation** → `/nil/` → 404 (or wherever it links)
- **About** → `/about/` → ghosted/invisible
- **Contact** → `/contact/` → blank
- **Status** → needs verification

### 4.3 Score Ticker — `/api/hero-scores` 404
The scrolling news/score ticker in the nav makes a `/api/hero-scores` call that 404s on every page. It still shows text (likely from a different source or fallback), but the failed request adds latency.

---

## What's Working Well

These routes are production-quality and demonstrate what BSI should look like everywhere:

| Route | Quality | Notes |
|-------|---------|-------|
| `/` (Homepage) | ✅ Excellent | Logo, tagline, CTAs, live game counts (104 today), sport tabs |
| `/scores/` | ✅ Excellent | All 5 sports, real counts (82 CBB, 12 MLB, 10 NBA), conference filters |
| `/college-baseball/` | ✅ Excellent | Full hub with real data, feature cards, navigation |
| `/college-baseball/scores/` | ✅ Excellent | 82 games, conference filters, date nav, venue info |
| `/college-baseball/savant/` | ✅ Crown jewel | Real batting leaders, PRO gating, 100 players, park factors |
| `/college-baseball/teams/` | ✅ Excellent | 496 teams, logos, conference filters, search |
| `/models/` | ✅ Solid | 4 model cards, live/dev status badges, accuracy stat |
| `/glossary/` | ✅ Solid | Real definitions, sport filters, letter nav, search |
| `/pricing/` | ✅ Solid | Free + Pro tiers, feature lists, CTAs |
| `/agent/` | ✅ Clean | Chat UI with prompt suggestions |
| `/nfl/scores/` | ✅ Good | Proper empty state ("No Games Found" with context) |

---

## Systemic Patterns

### Pattern A: The Ghosting Bug
**Affected:** About, Auth/Login, Rankings, Dashboard, Standings (partial)
**Symptom:** Content exists in DOM but renders at near-zero opacity/contrast.
**Hypothesis:** A shared Framer Motion entrance animation that never triggers. The `initial` state sets opacity to 0, but `animate` never fires — possibly because the animation triggers on a scroll/intersection observer that fails, or because an `animate` prop depends on a state value that stays falsy.
**Single fix potential:** HIGH. Finding and fixing the shared animation wrapper likely fixes 4-5 pages at once.

### Pattern B: The Shimmer Lock
**Affected:** MLB hub, NFL hub, NBA hub, CFB hub, MLB Scores, College Baseball News, Intel
**Symptom:** Loading skeletons never transition to populated state despite APIs returning 200.
**Hypothesis:** The sport hub components use `useSportData` or similar hooks. The hook sets `loading: false` after data arrives, but the component's rendering conditional checks for a specific data shape property that doesn't exist in the response (e.g., checking `data.games` when the API returns `data.schedule`). The component stays in loading branch forever.
**Single fix potential:** MEDIUM-HIGH. The four sport hubs likely share a layout. News and Intel are separate components but the same pattern.

### Pattern C: Dead Footer Links
**Affected:** NIL Valuation, Transfer Portal, Contact, About
**Impact:** Footer is the trust-building navigation area. 4 of ~20 footer links lead to broken or empty destinations.
**Fix:** Remove unbuilt routes from footer. Fix About and Contact.

---

## Recommended Fix Priority

**Week 1 — Stop the Bleeding:**
1. Fix the ghosting bug (About, Auth/Login, Rankings, Dashboard) — likely one shared animation fix
2. Fix Contact page (blank)
3. Remove dead footer links (NIL, Portal) or hide until built
4. Remove `/api/hero-scores` fetch or implement the endpoint

**Week 2 — Sport Hub Rendering:**
5. Debug MLB hub data binding (API returns 200, component doesn't render)
6. Apply MLB fix pattern to NFL, NBA, CFB hubs (likely same issue)
7. Fix MLB Scores page rendering
8. Fix College Baseball News shimmer

**Week 3 — Polish & Completeness:**
9. Fix College Baseball Standings contrast
10. Fix Intel page data binding
11. Add `/auth/` → `/auth/login/` redirect
12. Audit all nav dropdown links for dead routes not yet discovered

---

## API Health Summary

All audited API endpoints return 200 except one:

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/college-baseball/scores` | 200 | ✅ |
| `/api/mlb/scores` | 200 | ✅ Data returns, frontend doesn't render |
| `/api/mlb/standings` | 200 | ✅ Data returns, frontend doesn't render |
| `/api/nfl/scores` | 200 | ✅ |
| `/api/nba/scores` | 200 | ✅ |
| `/api/intel/news` | 200 | ✅ Data returns, frontend doesn't render |
| `/api/savant/batting/leaderboard` | 200 | ✅ |
| `/api/savant/pitching/leaderboard` | 200 | ✅ |
| `/api/savant/park-factors` | 200 | ✅ |
| `/api/savant/conference-strength` | 200 | ✅ |
| `/api/college-baseball/teams/all` | 200 | ✅ |
| `/api/college-baseball/editorial/list` | 200 | ✅ |
| `/api/model-health` | 200 | ✅ |
| `/api/status` | 200 | ✅ |
| `/api/hero-scores` | **404** | ❌ Called on every page, always fails |

**Bottom line:** The backend is healthy. Every single rendering failure is a frontend problem — either CSS/animation bugs (ghosting) or data shape mismatches (shimmer lock). No backend work needed.
