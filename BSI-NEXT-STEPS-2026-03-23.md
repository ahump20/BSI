# BSI Next Steps & Claude Code Prompting Script
## Generated: March 23, 2026

---

## SITUATION REPORT (What I Found Across All Connectors)

### Infrastructure Inventory (Live as of 2026-03-24T02:00Z)

**Zones (3):** blazesportsintel.com (Pro plan, active) · blazecraft.app (Free, active) · austinhumphrey.com (Free, active)

**Workers (20 deployed):**
| Worker | Last Modified | Status |
|--------|--------------|--------|
| blazesportsintel-worker-prod | Mar 24 | ✅ Apex worker, actively serving |
| bsi-baseball-agent | Mar 16 | ⚠️ DO binding error (see errors) |
| bsi-show-dd-sync | Mar 21 | ✅ |
| bsi-social-intel | Mar 21 | ✅ |
| college-baseball-mcp | Mar 21 | 🔴 Cron failing every 6h (no scheduled export) |
| college-baseball-mcp-production | — | 🔴 Same cron error pattern |
| bsi-savant-compute | Mar 21 | ✅ |
| bsi-cbb-analytics | Mar 21 | ✅ |
| bsi-college-baseball-daily | Mar 21 | ✅ |
| bsi-analytics-events | Mar 21 | ✅ |
| bsi-intelligence-stream | Mar 11 | ⚠️ Not modified in 12 days |
| bsi-live-scores | Mar 21 | ✅ |
| bsi-sportradar-ingest | Mar 21 | ✅ |
| bsi-cbb-ingest | Mar 21 | ✅ |
| bsi-portal-sync | Mar 21 | ✅ |
| bsi-synthetic-monitor | Mar 21 | ✅ |
| bsi-error-tracker | Mar 21 | ✅ |
| blaze-field-do | Mar 21 | ✅ |
| blaze-field-site / blaze-field-site-prod | Mar 21 | ✅ |
| mini-games-api | Mar 21 | ✅ |

**KV Namespaces (12):** BSI_PROD_CACHE · BSI_DEV_CACHE · BSI_AI_CACHE · BSI_KEYS · BSI_SPORTRADAR_CACHE · BSI_ERROR_LOG · BSI_MONITOR_KV · TEAM_STATS_KV · RATE_LIMIT · RATE_LIMIT_KV · PREDICTION_CACHE · portfolio-contacts

**D1 Databases (8):** bsi-prod-db (43MB) · bsi-events-db (11MB) · cbb-api-db (4.5MB) · bsi-historical-db (4.5MB) · bsi-game-db (3.4MB) · bsi-fanbase-db (196KB) · blazecraft-leaderboards (45KB) · humphrey-dna-db (65KB)

**R2 Buckets (18):** blaze-intelligence · blaze-sports-data-lake · blazesports-assets · bsi-web-assets · bsi-game-assets · bsi-embeddings · + 12 more

**GitHub:** ahump20/BSI · main branch · Last push Mar 21 · 23 open issues/PRs

---

### ACTIVE ERRORS (Last 7 Days from Observability)

**🔴 CRITICAL — college-baseball-mcp cron failure (56 errors/week)**
- Error: "Handler does not export a scheduled() function"
- Fires every 6 hours on cron `0 */6 * * *`
- Root cause: The worker has a cron trigger configured in wrangler.toml but the code doesn't export a `scheduled()` handler
- **Fix:** Either add a `scheduled()` export or remove the cron trigger from wrangler.toml

**🟡 HIGH — MLB Leaderboards 500 (blazesportsintel-worker-prod)**
- Error: "[handleMLBLeaderboard] ESPN 404"
- Route: `/api/mlb/leaderboards/batting`
- Returns HTTP 500 to visitors
- Root cause: ESPN endpoint returning 404 — needs fallback to Highlightly or SportsDataIO

**🟡 HIGH — CFB Articles D1 table missing**
- Error: "[handleCFBArticlesList] D1_ERROR: no such table: articles: SQLITE_ERROR"
- Route: `/api/college-football/articles`
- Root cause: Table `articles` was never created in the bound D1 database
- **Fix:** Run migration to create articles table, or remove route if not ready

**🟠 MEDIUM — bsi-baseball-agent DO binding broken**
- Error: "does not match any server namespace... Did you forget to add a durable object binding to the class Chat-agent in your wrangler.jsonc?"
- Root cause: Durable Object class name doesn't match wrangler binding

---

## PRIORITIZED NEXT STEPS

### Phase 0: Stop the Bleeding (Error Triage)
1. Fix college-baseball-mcp cron — either export scheduled() or remove cron trigger
2. Fix MLB leaderboards fallback — switch from ESPN to Highlightly for batting leaderboards
3. Fix CFB articles D1 migration — create the `articles` table or hide the route
4. Fix bsi-baseball-agent DO binding — correct the class name in wrangler.toml

### Phase 1: Public Truth Collapse (PASS 1)
5. Route audit — enumerate every `app/` page and every `/api/*` handler, classify KEEP/MERGE/REDIRECT/DELETE/HIDE
6. Reconcile nav/footer links against surviving routes
7. Verify pricing page reflects current Stripe products
8. Clean up 23 open GitHub issues/PRs — close stale, merge ready

### Phase 2: Wiring & Rendering (PASS 2)
9. Verify every surviving `/api/*` route returns real data (not 500, not empty)
10. Verify every surviving page renders populated state (not skeleton, not empty table)
11. Wire any pages currently showing loading states to their real API endpoints

### Phase 3: Deploy & Prove (PASS 3)
12. Full deploy cycle with gate checks
13. Browser-level verification of all public surfaces
14. Health check pass (`npm run health`)

---

## VERBATIM CLAUDE CODE PROMPTING SCRIPT

Copy-paste each prompt into Claude Code in sequence. Each is self-contained and references the BSI three-pass system.

---

### PROMPT 0A — Fix college-baseball-mcp cron error

```
I need you to fix the college-baseball-mcp worker cron error. Cloudflare observability shows 56 errors in the last 7 days — "Handler does not export a scheduled() function" firing every 6 hours on cron `0 */6 * * *`.

Steps:
1. `cd ~/bsi-repo && pwd && git rev-parse --show-toplevel && git branch --show-current`
2. Read `workers/college-baseball-mcp/wrangler.toml` — find the cron trigger
3. Read the worker's main entry file (index.ts or similar)
4. Decision: If there's meaningful scheduled work to do, add a proper `scheduled()` export. If not, remove the `[triggers]` cron from wrangler.toml.
5. Deploy: `wrangler deploy --config workers/college-baseball-mcp/wrangler.toml`
6. Verify: Wait 1 minute, check Cloudflare observability for the worker — no new cron errors should appear.

Do NOT create mock data. Do NOT claim done without observability proof.
```

---

### PROMPT 0B — Fix MLB leaderboards 500

```
The `/api/mlb/leaderboards/batting` route is returning HTTP 500 because ESPN is 404ing. I need you to fix the fallback chain.

Steps:
1. `cd ~/bsi-repo && pwd && git rev-parse --show-toplevel && git branch --show-current`
2. Read `workers/handlers/` — find the MLB leaderboard handler (grep for "handleMLBLeaderboard" or "leaderboards/batting")
3. Read the current data-fetching logic. Identify which ESPN endpoint is failing.
4. Implement fallback: try Highlightly first (it's BSI's primary source), then ESPN, then SportsDataIO. Each attempt should log which source was tried.
5. `npm run typecheck && npm run test:workers`
6. Deploy worker: `npm run deploy:worker`
7. Verify: `curl -s https://blazesportsintel.com/api/mlb/leaderboards/batting | head -200` — must return real player data, not an error.

ESPN API reference: site.api.espn.com — no auth needed but frequently breaks.
Highlightly: api.highlightly.net — uses x-api-key header.
```

---

### PROMPT 0C — Fix CFB articles D1 table

```
The `/api/college-football/articles` route throws "D1_ERROR: no such table: articles: SQLITE_ERROR". Either the table needs to be created or the route needs to be hidden until it's ready.

Steps:
1. `cd ~/bsi-repo && pwd && git rev-parse --show-toplevel && git branch --show-current`
2. Read `workers/handlers/` — find the CFB articles handler (grep for "handleCFBArticlesList" or "college-football/articles")
3. Check if there's a migration file for an `articles` table anywhere in the repo (grep for "CREATE TABLE articles" or check `scripts/` and any migration directories)
4. If a migration exists: run it against the correct D1 database. If not: either create the migration OR return a proper empty-state response instead of crashing.
5. Decision: If articles is a future feature with no data pipeline yet, return `{ articles: [], meta: { source: "bsi", note: "Coming soon" } }` with HTTP 200 — NOT a 500.
6. Deploy and verify: `curl -s https://blazesportsintel.com/api/college-football/articles` — must not 500.
```

---

### PROMPT 0D — Fix bsi-baseball-agent DO binding

```
The bsi-baseball-agent worker has a broken Durable Object binding. Error: "does not match any server namespace. Did you forget to add a durable object binding to the class Chat-agent in your wrangler.jsonc?"

Steps:
1. `cd ~/bsi-repo && pwd && git rev-parse --show-toplevel && git branch --show-current`
2. Read `workers/bsi-baseball-agent/wrangler.toml` — check the `[durable_objects]` bindings
3. Read the worker's source code — find the actual exported class name
4. Ensure the class name in wrangler.toml exactly matches the exported class in the code (case-sensitive)
5. Deploy: `wrangler deploy --config workers/bsi-baseball-agent/wrangler.toml`
6. Verify: `curl -s https://bsi-baseball-agent.humphrey-austin20.workers.dev/` — should not return the namespace error
```

---

### PROMPT 1A — Full Route Audit (PASS 1)

```
BSI PASS 1 — Public Truth Collapse. I need a full route inventory.

This is an AUDIT task. Do NOT edit any code. Read only.

Steps:
1. `cd ~/bsi-repo && pwd && git rev-parse --show-toplevel && git branch --show-current`
2. List every `page.tsx` file under `app/` — this is the full set of static routes
3. List every API route handler in `workers/handlers/` — grep for `app.get(`, `app.post(`, `app.route(` or Hono route patterns
4. For each route, classify:
   - KEEP — route serves real data to real users
   - MERGE — route duplicates another (list which one it merges into)
   - REDIRECT — route should 301 to a surviving route
   - DELETE — route is dead, broken, or vestigial
   - HIDE — route works but isn't ready for public (remove from nav, keep endpoint)
   - FINISH-NOW — route is 90%+ done and just needs wiring

5. Cross-reference against:
   - Nav links in the header/footer components
   - Sitemap if one exists
   - Known broken routes from observability: `/api/mlb/leaderboards/batting`, `/api/college-football/articles`

6. Output a markdown table: Route | Type (page/api) | Classification | Reason | Action Required

Do NOT edit files. Do NOT create PRs. Output the audit as a markdown file at `~/bsi-repo/ROUTE-AUDIT-2026-03-23.md`.
```

---

### PROMPT 1B — Nav/Footer Reconciliation (PASS 1)

```
BSI PASS 1 continued. Using the route audit from ROUTE-AUDIT-2026-03-23.md, reconcile the navigation.

Steps:
1. `cd ~/bsi-repo && pwd && git rev-parse --show-toplevel && git branch --show-current`
2. Read `ROUTE-AUDIT-2026-03-23.md`
3. Find the main nav component (likely in `components/` — grep for "nav" or "header" or "Navigation")
4. Find the footer component
5. For every nav/footer link:
   - If it points to a KEEP route: leave it
   - If it points to a DELETE route: remove the link
   - If it points to a REDIRECT route: update to the redirect target
   - If it points to a HIDE route: remove from nav (but keep the page)
6. Run `npm run typecheck` to verify no broken imports
7. Do NOT deploy yet. Commit with: `fix(nav): reconcile nav/footer links against route audit`
```

---

### PROMPT 2A — API Health Sweep (PASS 2)

```
BSI PASS 2 — Wiring & Rendering. Verify every surviving API route returns real data.

Steps:
1. `cd ~/bsi-repo && pwd && git rev-parse --show-toplevel && git branch --show-current`
2. Read `ROUTE-AUDIT-2026-03-23.md` — get the list of KEEP and FINISH-NOW API routes
3. For each surviving API route, run: `curl -s "https://blazesportsintel.com{route}" | head -100`
4. Classify each response:
   - ✅ LIVE — returns real data with correct structure
   - ⚠️ EMPTY — returns 200 but empty array/object
   - 🔴 ERROR — returns 4xx/5xx
   - 🟡 STALE — returns data but `fetched_at` is >24h old

5. For any ERROR routes: read the handler code, identify the failure, fix it
6. For any EMPTY routes: verify the data pipeline (KV cache, D1 query, external API) is running
7. After fixes: re-curl every fixed route and confirm real data

Output results as `~/bsi-repo/API-HEALTH-2026-03-23.md`.
```

---

### PROMPT 2B — Page Rendering Verification (PASS 2)

```
BSI PASS 2 continued. Verify every surviving page renders populated content, not skeletons.

Steps:
1. `cd ~/bsi-repo && pwd && git rev-parse --show-toplevel && git branch --show-current`
2. Read `ROUTE-AUDIT-2026-03-23.md` — get the list of KEEP pages
3. Read `API-HEALTH-2026-03-23.md` — know which APIs are live
4. For each KEEP page:
   a. Read the page component and its client components
   b. Identify which API endpoint(s) it fetches from
   c. Verify the API is in the LIVE category
   d. If the API is ERROR or EMPTY, the page CANNOT be showing real data — flag it
5. For any page whose API is broken: fix the API first (PASS 2 rule: fix wiring, not UI)
6. Build: `npm run build` — must succeed with zero errors
7. Commit fixes with: `fix(wiring): connect {page} to live API data`
```

---

### PROMPT 3A — Deploy & Prove (PASS 3)

```
BSI PASS 3 — Deploy & Prove. Ship everything and verify in production.

Steps:
1. `cd ~/bsi-repo && pwd && git rev-parse --show-toplevel && git branch --show-current && git status`
2. Ensure working tree is clean. If not, commit pending changes first.
3. Run pre-deploy checks: `npm run typecheck && npm run test:workers && npm run lint`
4. Deploy Pages: `npm run deploy:production`
5. Deploy main worker: `npm run deploy:worker`
6. Deploy any satellite workers that were modified (check git diff against last deploy)
7. Run health checks: `npm run health`
8. Run smoke tests: `npm run smoke:release`
9. Manually verify critical routes:
   - `curl -s https://blazesportsintel.com/ | grep -o '<title>[^<]*</title>'`
   - `curl -s https://blazesportsintel.com/api/college-baseball/scores | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Games: {len(d.get(\"games\",d.get(\"scores\",[])))}')"`
   - `curl -s https://blazesportsintel.com/api/health`
10. If ANY route returns empty/error: stop, fix, redeploy, re-verify. Do NOT claim shipped.
```

---

### PROMPT 3B — Browser Proof (PASS 3, requires Claude in Chrome)

```
BSI PASS 3 final verification. Open the site in a real browser and prove it works.

Use Claude in Chrome to:
1. Navigate to https://blazesportsintel.com/
2. Screenshot the homepage — verify hero content, nav links, score ticker
3. Navigate to /college-baseball/ — screenshot, verify scores/standings render with real data
4. Navigate to /mlb/ — screenshot, verify content renders
5. Navigate to /scores/ — screenshot, verify live scores appear
6. Navigate to /about/ — screenshot, verify content
7. Navigate to /pricing/ — screenshot, verify Stripe pricing table loads
8. Check mobile viewport (375px wide) for /college-baseball/ — screenshot

For each page: if you see empty tables, loading spinners that never resolve, or "No data available" placeholders, that page is NOT shipped. Report exactly what visitors see.

Output: a verification report with pass/fail for each page, with screenshot evidence.
```

---

## EXECUTION ORDER

```
Phase 0 (Error Triage):     0A → 0B → 0C → 0D    [can parallelize 0A+0C+0D]
Phase 1 (Truth Collapse):   1A → 1B
Phase 2 (Wiring):           2A → 2B
Phase 3 (Deploy & Prove):   3A → 3B
```

Each prompt is self-contained. Run them in order. Don't skip Phase 0 — those errors are firing right now in production.
