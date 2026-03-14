# Cross-Property Audit & Deploy — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Audit, fix, and deploy all four BSI properties to production — every page renders, every feature works, every site is live and verified.

**Architecture:** Sequential property sweep ordered by dependency. BSI main first (largest surface, shared backend), Labs second (shared infra), Portfolio third (independent, `feature/resurrection` branch), DNA last (smallest). Quick production smoke of all four domains before deep dive.

**Tech Stack:** Next.js 16 (BSI), Vite + React (Portfolio, Labs, DNA), Cloudflare Pages + Workers, Playwright, Wrangler CLI

**Executor:** Site-perfection-engine agent — autonomous audit/fix/deploy. Fixes batched in groups of 5 by priority tier. No stopping to ask. Blockers logged and skipped.

**Reference:** Completion checklist at `/Users/AustinHumphrey/.claude/plugins/bsi-site-completionism/references/completion-checklist.md`

---

### Task 1: Production Smoke — All Four Domains

**Purpose:** Establish baseline. What do visitors see right now? Flag anything catastrophically broken.

**Step 1: Smoke test all four domains**

Hit each domain's homepage and 2-3 key routes. Record HTTP status, whether page content renders, and any immediate errors.

| Domain | Routes to Hit |
|--------|---------------|
| `blazesportsintel.com` | `/`, `/scores/`, `/standings/`, `/college-baseball/` |
| `labs.blazesportsintel.com` | `/` |
| `austinhumphrey.com` | `/` |
| `dna.austinhumphrey.com` | `/` |

Use `WebFetch` or `curl` for each. Record results.

**Step 2: Triage results**

If any domain is completely down (5xx, blank page, DNS failure), escalate that property to the front of the queue. Otherwise proceed with the planned order.

**Step 3: Document baseline**

Record the current state in agent memory — what's working, what's broken, what's stale. This is the "before" snapshot.

---

### Task 2: BSI Main — Build & Type Check

**Directory:** `/Users/AustinHumphrey/BSI-local`

**Step 1: Install dependencies if needed**

Run: `cd /Users/AustinHumphrey/BSI-local && npm install`

**Step 2: Type check**

Run: `npm run typecheck`
Expected: Exit 0 with no errors. If errors, log them — they become fixes in later steps.

**Step 3: Build**

Run: `npm run build`
Expected: Static export to `out/` with exit 0. If build errors, they are Priority 1 (build-breaking) fixes.

**Step 4: Lint check**

Run: `npm run lint`
Expected: Clean or only warnings. Errors become fix candidates.

---

### Task 3: BSI Main — Route Audit

**Directory:** `/Users/AustinHumphrey/BSI-local`

**Step 1: Start dev server**

Run: `npm run dev` (background)
Expected: Next.js dev server on `localhost:3000`

**Step 2: Crawl completion checklist routes**

Test each route from the checklist. For each, verify: HTTP 200, page renders with content (not blank), no console errors, no hydration mismatches.

| Route | What to Verify |
|-------|----------------|
| `/` | Homepage loads, featured content or live scores visible |
| `/scores/` | Scoreboard renders with data (not empty state) |
| `/standings/` | Conference standings table populated |
| `/rankings/` | National rankings display |
| `/college-baseball/` | College baseball hub page |
| `/college-baseball/teams/` | Team listing |
| `/college-baseball/players/` | Player listing |
| `/about/` | About page content |
| `/contact/` | Contact page, form present |
| `/pricing/` | Pricing tiers display |
| `/search/` | Search page loads |
| `/status/` | System status page |
| `/intel/` | Intel page loads |
| `/arcade/` | Arcade hub page |

Use Playwright, `WebFetch`, or direct browser verification via Claude in Chrome.

**Step 3: Check mobile viewport**

Verify `/`, `/scores/`, `/standings/` render without horizontal scroll on 375px width.

**Step 4: Verify brand standards**

Spot-check: burnt orange (#BF5700) primary, Oswald headings, Cormorant Garamond body, dark backgrounds (#1A1A1A / #0D0D0D).

---

### Task 4: BSI Main — Data & Worker Health

**Step 1: Verify Workers are responding**

Check main worker health:
- `curl https://blazesportsintel.com/api/health` — expect 200
- Check savant-compute, live-scores, intelligence-stream via their health endpoints or Wrangler

**Step 2: Verify data integration**

- Scores endpoint returning live/recent data (not stale beyond KV TTL)
- Standings populating from D1 or KV
- Sabermetrics API returning batting/pitching advanced stats
- "Last updated" timestamps present and recent

**Step 3: Check cron triggers**

Via Wrangler or Cloudflare MCP, verify crons are registered:
- `bsi-savant-compute` (every 6h)
- `bsi-cbb-analytics` (daily 6 AM CT)
- `bsi-synthetic-monitor` (every 5 min)
- `bsi-college-baseball-daily` (5 AM + 11 PM CT)

---

### Task 5: BSI Main — Fix Issues (Batched)

**Step 1: Triage all issues found in Tasks 2-4**

Order by 7-tier priority:
1. Build-breaking errors
2. Routing failures (404s, broken nav)
3. Data integration failures (APIs not returning, empty states)
4. Feature breakage (interactive elements, forms, auth)
5. Visual/layout issues (responsive, spacing, typography)
6. Performance (load time, bundle, caching)
7. Polish (animations, transitions, meta tags, OG images)

**Step 2: Fix in batches of 5**

For each batch:
- Fix 5 issues
- Rebuild: `npm run build`
- Verify fixes didn't break anything else
- Commit: `git commit -m "fix(scope): batch description"`

Repeat until all issues resolved.

---

### Task 6: BSI Main — Deploy & Verify

**Step 1: Final build + test**

Run: `npm run build && npm run test:all && npm run typecheck`
Expected: All pass.

**Step 2: Deploy to production**

Run: `npm run deploy:production`
This builds → stages to `/tmp/bsi-deploy-out` → deploys to Cloudflare Pages.

**Step 3: Deploy main worker**

Run: `npm run deploy:worker`
Deploys `blazesportsintel-worker-prod` to production.

**Step 4: Post-deploy smoke test**

Hit production URLs:
- `https://blazesportsintel.com/` → expect 200, content renders
- `https://blazesportsintel.com/nonexistent` → expect 404 page (not crash)
- `https://blazesportsintel.com/scores/` → expect 200, live data
- `https://blazesportsintel.com/standings/` → expect 200, data populated
- Verify `cf-cache-status` headers present
- No mixed content warnings

---

### Task 7: BSI Labs — Build, Audit, Fix

**Directory:** `/Users/AustinHumphrey/trackman-audit-lab`

**Step 1: Install and build**

Run: `cd /Users/AustinHumphrey/trackman-audit-lab && npm install && npm run build`
Expected: Vite build to `dist/` with exit 0.

**Step 2: Audit routes**

Start dev server: `npm run dev`
Verify:
- `/` — Labs landing page with available tools listed
- Each tool route renders with data (not empty/stale)
- No console errors

**Step 3: Fix issues**

Batch in groups of 5, same priority tiers. Rebuild after each batch.

**Step 4: Deploy**

Run: `npx wrangler pages deploy dist --project-name=trackman-audit-lab --branch=main`

**Step 5: Post-deploy smoke**

- `https://labs.blazesportsintel.com/` → expect 200, tools render
- `https://labs.blazesportsintel.com/nonexistent` → expect 404 page

---

### Task 8: Portfolio — Build, Audit, Fix

**Directory:** `/Users/AustinHumphrey/portfolio-website`
**Branch:** `feature/resurrection` (already checked out)

**Step 1: Install and build**

Run: `cd /Users/AustinHumphrey/portfolio-website && npm install && npm run build`
Expected: Vite + tsc build to `dist/` with exit 0.

**Step 2: Audit all sections**

Start dev server: `npm run dev` (localhost:5173)
Verify each section renders:
- Hero (canvas particles, tagline, CTA)
- About (origin story, sidebar facts)
- Experience (timeline with markers)
- Education (3-card grid)
- BSI Showcase (description + stats)
- AI Features (4 gradient cards)
- Podcast (CTA box)
- Philosophy (covenant quote)
- Contact (link grid)

Also verify:
- Navigation scroll tracking works
- Chat widget opens/closes, responds to keywords
- Mobile responsive (375px — no horizontal scroll)
- Canvas particles respect `prefers-reduced-motion`
- All cross-property links work (BSI, GitHub, LinkedIn, etc.)

**Step 3: Brand standards**

- Dark-only palette (midnight #0D0D0D, charcoal #1A1A1A)
- Burnt orange (#BF5700) accent
- Oswald headings, Cormorant Garamond body, JetBrains Mono labels
- Film grain SVG overlay rendering

**Step 4: Fix issues**

Batch in groups of 5. Rebuild after each batch. Commit on `feature/resurrection`.

**Step 5: Deploy**

Run: `npm run deploy`
Which runs: `npm run build && npx wrangler pages deploy dist --project-name austin-humphrey-professional-resume-portfolio --branch main`

**Step 6: Post-deploy smoke**

- `https://austinhumphrey.com/` → expect 200, hero renders, all sections visible on scroll
- `https://austinhumphrey.com/nonexistent` → expect 404 page
- Cross-property links resolve

---

### Task 9: DNA — Build, Audit, Fix

**Directory:** `/Users/AustinHumphrey/humphrey-dna`

**Step 1: Install and build**

Run: `cd /Users/AustinHumphrey/humphrey-dna && npm install && npm run build`
Expected: tsc + Vite build to `dist/`, copies `index.html` to `404.html`. Exit 0.

**Step 2: Audit**

Start dev server: `npm run dev`
Verify:
- `/` — Landing page renders with identity narrative
- All internal navigation works
- External links open correctly
- No placeholder text
- Images/visuals load
- Typography correct
- D1 database connection working (if applicable — check Worker API routes)

**Step 3: Fix issues**

Batch in groups of 5. Rebuild after each batch.

**Step 4: Deploy**

Run: `npm run deploy`
Which runs: `npm run build && npx wrangler pages deploy dist --project-name humphrey-dna`

**Step 5: Post-deploy smoke**

- `https://dna.austinhumphrey.com/` → expect 200, content renders
- `https://dna.austinhumphrey.com/nonexistent` → expect 404 page
- External links resolve

---

### Task 10: Final Cross-Property Verification

**Step 1: Full post-deploy smoke — all four domains**

Run the complete Post-Deploy Smoke Test sequence from the completion checklist:

For each domain (`blazesportsintel.com`, `labs.blazesportsintel.com`, `austinhumphrey.com`, `dna.austinhumphrey.com`):
1. Fetch homepage → expect 200
2. Fetch nonexistent route → expect 404 page (not crash)
3. Check 2-3 deep routes → expect 200 with correct content
4. Verify no mixed content warnings
5. Confirm CF cache headers present (`cf-cache-status`)

**Step 2: Cross-property link verification**

- BSI → Portfolio link works
- Portfolio → BSI link works
- Portfolio → DNA link works (if present)
- DNA → BSI link works (if present)
- All external links (GitHub, LinkedIn, X) resolve

**Step 3: Summary report**

Write plain English summary of everything that changed:
- What was broken and is now fixed
- What visitors see differently
- What was deployed
- Any blockers that were skipped (with reason)
