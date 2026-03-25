# Claude Code Prompt — PASS 2 Session (2026-03-20)

> Paste this into Claude Code as your opening prompt for the next PASS 2 work session.
> Generated from live browser audit + Cloudflare observability + execution packet analysis.
> Revised with systems-level debugging model — treat as system failure, not React bug.

---

## Context

You are working in the canonical BSI repo at `/Users/AustinHumphrey/bsi-repo`. Confirm root before doing anything:

```bash
pwd && git rev-parse --show-toplevel && git branch --show-current && git remote -v
```

BSI completed PASS 1A (Public Truth Collapse) as of 2026-03-20. We are now in PASS 2 — Wiring & Rendering. Multiple critical routes render blank pages. This is a system failure — edge routing, API contract, and client runtime all need validation before any component code is touched.

---

## PHASE 0: CRITICAL PRECONDITIONS (Complete Before All Else)

### 0A — Apex Worker Visibility

`blazesportsintel-worker-prod` handles ALL site traffic (apex worker, Hono). It emits **zero observability events**. In the last 24h, only 3 satellite workers appear in Workers Observability:

| Worker | Events (24h) | Errors |
|--------|-------------|--------|
| `college-baseball-mcp-production` | 312 | 8 |
| `bsi-intelligence-stream` | 294 | 0 |
| `college-baseball-mcp` | 12 | 8 |
| **`blazesportsintel-worker-prod`** | **0** | **unknown** |

This means every broken route is happening in a black box. No request logs, no error traces, no timing data.

**Action:**
1. Confirm whether `blazesportsintel-worker-prod` has Workers Observability enabled
2. If not, add `console.log` at minimum at:
   - Request entry (method, path, timestamp)
   - API proxy boundaries (upstream fetch start/end, status)
   - Error catch blocks
3. Redeploy worker
4. Verify logs appear in Observability
5. **No further debugging is valid until this is complete**

### 0B — Edge Routing Verification

All traffic flows through the apex worker. If routing is broken, every downstream assumption collapses.

For each failing route, confirm the edge layer works:

```bash
# Verbose curl — check for redirects, correct content-type, worker handling
curl -v https://blazesportsintel.com/api/nfl/scores 2>&1 | head -40
curl -v https://blazesportsintel.com/api/nba/scoreboard 2>&1 | head -40
curl -v https://blazesportsintel.com/api/cfb/scores 2>&1 | head -40
curl -v https://blazesportsintel.com/api/college-baseball/schedule 2>&1 | head -40
curl -v https://blazesportsintel.com/api/intel/news?sport=college-baseball 2>&1 | head -40
curl -v https://blazesportsintel.com/api/savant/batting/leaderboard 2>&1 | head -40
curl -v https://blazesportsintel.com/api/college-baseball/game/401848476 2>&1 | head -40
```

Confirm for each:
- Correct worker handles the request (not a 404, not a redirect loop)
- `content-type: application/json` in response
- Non-empty response body
- No unexpected redirects

If ANY endpoint returns empty, 404, 500, or malformed response → that's a backend failure. Stop. Fix the handler or routing before touching client code.

### 0C — API Contract Validation (No Assumptions)

Do NOT assume APIs work because the homepage renders. The homepage uses a different code path (aggregation, possibly different endpoints). Each broken route's API must be independently proven.

```bash
# API health
curl -s https://blazesportsintel.com/api/health | jq .

# Each broken route's data source — validate non-empty, correct shape
curl -s https://blazesportsintel.com/api/college-baseball/scores | jq 'length'
curl -s https://blazesportsintel.com/api/college-baseball/schedule | jq 'keys'
curl -s https://blazesportsintel.com/api/nfl/scores | jq 'keys'
curl -s https://blazesportsintel.com/api/nba/scoreboard | jq 'keys'
curl -s https://blazesportsintel.com/api/cfb/scores | jq 'keys'
curl -s https://blazesportsintel.com/api/intel/news?sport=college-baseball | jq 'length'
curl -s https://blazesportsintel.com/api/savant/batting/leaderboard | jq '.[0] | keys'
curl -s https://blazesportsintel.com/api/college-baseball/game/401848476 | jq 'keys'
```

For each endpoint, record:
- HTTP status
- Response shape (keys, array length)
- Whether critical fields exist and are non-null
- Whether the shape matches what the client component expects

**Gate:** If >50% of endpoints return valid data → failure is client-side. If >50% fail → failure is backend/routing. This determines the entire debugging direction.

---

## PHASE 1: FAILURE CLASSIFICATION (Mandatory Before Fixes)

### Render Failure Classification

The browser evidence shows a specific signature:

| Route | JSON-LD | React Content | Loading State | Error UI |
|-------|---------|---------------|---------------|----------|
| `/nfl/` | Renders | Empty | None | None |
| `/nba/` | Renders | Empty | None | None |
| `/cfb/` | Renders | Empty | None | None |
| `/scores/` | Renders | Empty | None | None |
| `/intel/` | None | Empty | None | None |
| `/college-baseball/savant/` | Renders | **Partial** (chrome only) | None | None |

JSON-LD renders because it's in the static export (build-time). React content is empty because client-side hydration fails. No loading skeletons or error boundaries fire. This is **Class C: Runtime Exception** — the React tree throws during render and the entire component tree dies silently.

**Before editing any component, determine which class applies to each route:**

- **Class A (Data Empty):** API returns `[]` or `null`. Component correctly renders empty state. Fix: backend.
- **Class B (Data Invalid):** API returns data, but wrong shape. Component renders `[object Object]` or garbled output. Fix: transform layer.
- **Class C (Runtime Exception):** Component throws during render. Entire tree fails. `<main>` is hollow. Fix: error boundary + guard the throwing code path.

**How to classify:**
1. Check browser console for uncaught errors (open DevTools → Console → reload page)
2. If no console errors visible, wrap the page's root component in a temporary try/catch or ErrorBoundary that logs
3. Inspect the throwing line — is it a property access on undefined? A `.map()` on null? A hook that throws?

### Shared Dependency Check

Before fixing any individual route, identify whether the failure is in a shared layer:

```bash
# What fetch utilities/hooks do the broken pages share?
grep -rn "useSportData\|useQuery\|useFetch\|getReadApiUrl" app/nfl/ app/nba/ app/cfb/ app/scores/ app/intel/ --include="*.tsx" -l

# What normalization functions are shared?
grep -rn "normalize\|transform\|dig(" lib/ --include="*.ts" -l | head -20

# Compare working vs broken
diff <(head -50 app/college-baseball/page.tsx) <(head -50 app/nfl/page.tsx)
```

**If multiple broken routes share a hook or utility that the working routes don't use** → fix the shared layer once. Do not create per-route band-aids.

---

## Live Site Evidence (Browser-Verified 2026-03-20)

| Route | Status | What Visitors See |
|-------|--------|-------------------|
| `/` | **WORKS** | 54 live scores, real leaderboard (Daniel Jackson .636 OBP), 30 articles, agent chat, intel feed |
| `/college-baseball/` | **WORKS** | 45 live games, Top 10 rankings, leaders (Quinton Coats .667 AVG), editorial, social intel |
| `/mlb/` | **WORKS** | Hero section, standings, spring training, Statcast section, SportsDataIO attribution |
| `/pricing/` | **WORKS** | Free/Pro tiers ($12/mo), comparison table, "Why BSI?" section, contact email |
| `/podcast/` | **PARTIAL** | Garrido Code notebook link renders — thin content, not a rendering bug |
| `/scores/` | **BROKEN** | Empty `<main>` — zero visible content |
| `/intel/` | **BROKEN** | Empty `<main>` — zero visible content |
| `/nfl/` | **BROKEN** | Only JSON-LD schema markup, zero visible content |
| `/nba/` | **BROKEN** | Only JSON-LD schema markup, zero visible content |
| `/cfb/` | **BROKEN** | Only JSON-LD schema markup, zero visible content |
| `/college-baseball/savant/` | **PARTIAL** | UI chrome (filters, tabs, PRO gating) renders, but data table is empty — no player rows |
| `/college-baseball/game/401848476/` | **BROKEN** | Breadcrumb shows game ID, content region is empty |

---

## PHASE 2: ROOT CAUSE INVESTIGATION

Only begin this phase after Phase 0 (preconditions) and Phase 1 (classification) are complete.

### Pattern 1: Sport Hub Pages Empty (NFL, NBA, CFB)

Three hubs share an identical failure: JSON-LD renders, React tree is hollow. College baseball hub works on a different implementation. This is the "abstraction that works for the first consumer but breaks for the second through fifth" pattern.

**Investigation (guided by Phase 1 classification):**

If **Class C (runtime exception)**:
1. Open DevTools console on `/nfl/` — capture the error
2. Read `app/nfl/page.tsx` → identify the client component
3. Read that client component → find the hook or data access that throws
4. Check if `/nba/` and `/cfb/` use the same component/hook — almost certainly yes
5. Fix the shared layer. Test all three.

If **Class A (API returns empty)**:
1. The `curl` results from Phase 0C already tell you this
2. Read the worker handler for each sport
3. Verify upstream API keys and data source configuration

### Pattern 2: `/scores/` Hub Empty

Pre-diagnosed in `docs/internal/bsi-pass-2-execution-packets.md` (Packet 1). The page fetches `/api/college-baseball/schedule`. Suspected upstream API error or data shape mismatch.

**Investigation:** Apply the same Phase 1 classification. The `curl` from Phase 0C reveals whether this is backend (empty response) or client (runtime throw).

### Pattern 3: `/intel/` Dashboard Empty

Pre-diagnosed in execution packets (Packet 2). `useIntelDashboard` hook runs normalization functions that use `dig()` helpers. When upstream data shape changes, `dig()` returns objects where strings are expected.

**Key detail:** The page rendered COMPLETELY empty — not `[object Object]`. This confirms Class C (runtime exception), not Class B (invalid data). A normalization function throws, an error boundary (or React itself) catches and swallows, and the tree dies.

**Investigation:**
1. Read `lib/intel/hooks.ts` — find where `dig()` output is passed to `.map()`, `.toString()`, or JSX rendering
2. The throw is almost certainly a property access on an object where a string/array was expected
3. Add type guards at the boundary between `dig()` output and render consumption

### Pattern 4: Game Sub-Pages Empty Content Panels

`GameLayoutShell` fetches game data and provides via React context. Child components read `boxscore`, `plays`, `teamStats` fields. If the API response lacks these fields, children render nothing — or throw.

**Investigation:**
1. `curl` result from Phase 0C shows whether the field exists
2. If field missing → backend fix (handler doesn't include it)
3. If field exists but children still empty → Class C runtime exception in child component

### Pattern 5: Savant Data Table Empty

This is the only PARTIAL failure — UI chrome renders, data table doesn't. This suggests the page-level component works but a child component (the table) fails. Could be:
- Auth gating (PRO tier blocks data for unauthenticated users with no message)
- API returns empty array (no data in D1 savant tables)
- Data shape mismatch in table component

**Investigation:**
1. `curl` the savant endpoint — if it returns rows, failure is client-side
2. Check if the table component gates on auth state — if yes, verify it shows a message, not a blank table
3. If API returns empty → check `bsi-savant-compute` worker cron status — it may not have run recently

---

## PHASE 3: EXECUTION ORDER

Read `docs/internal/bsi-pass-2-execution-packets.md` for the full file-level dependency mapping.

| Step | Target | Precondition | Rationale |
|------|--------|-------------|-----------|
| 0 | Apex worker observability | None | Everything downstream is guesswork without this |
| 0 | Edge routing + API validation | None | Determines whether failure is backend or frontend |
| 0 | Failure classification per route | Routing validated | Determines fix strategy |
| 1 | Shared dependency fix (if found) | Classification complete | One fix, multiple routes unblocked |
| 2a | Sport hubs (NFL, NBA, CFB) | Phase 1 done | Likely same root cause; high visitor impact |
| 2b | `/scores/` (Packet 1) | Phase 1 done | Most-visited data page |
| 2c | `/intel/` (Packet 2) | Phase 1 done | Zero shared files with 2a/2b; safe to parallel |
| 3 | Savant data table | Phase 1 done | Quick diagnostic — may be auth or cron issue |
| 4 | Game sub-pages (Packet 3) | Packet 1 complete | Shares files with scores handler |
| 5 | Transfer portal player detail (Packet 4) | Independent | Missing endpoint; safe to parallel with 4 |

---

## Session Rules

1. **Prove, don't assume.** Every API endpoint gets `curl`'d with response shape validation before any component is touched. The homepage working proves nothing about individual sport endpoints.
2. **Classify before fixing.** Empty `<main>` with intact JSON-LD = Class C runtime exception. Don't treat it as missing data.
3. **Fix shared layers first.** If NFL, NBA, and CFB share a hook that throws, fix the hook once. Three per-route band-aids is regression fuel.
4. **No new routes.** PASS 2 fixes wiring for surviving routes. No feature expansion.
5. **No mock data.** If an API returns empty, the page shows a truthful empty state — not fake data.
6. **Phase boundary.** Do NOT touch any route with PASS 1A status of HIDE, ARCHIVE, REDIRECT, or DELETE. Check `docs/internal/` if unsure.
7. **One file at a time.** The shared file matrix in the execution packets shows which files overlap between packets. Respect sequential ordering for `workers/handlers/college-baseball/scores.ts`.

---

## Verification Standard (Required)

A fix is complete ONLY when ALL conditions are met:

**API Layer:**
- `curl` returns non-empty, correctly shaped JSON
- Critical fields are non-null
- HTTP status is 200

**Client Layer:**
- Component renders non-empty DOM in `<main>`
- No runtime errors in browser console
- Data displayed matches API response (not stale, not mock)

**Edge Layer:**
- Request visible in Workers Observability (requires Phase 0A completion)
- No unexpected redirects or content-type mismatches

**Regression:**
- Previously working routes (`/`, `/college-baseball/`, `/mlb/`, `/pricing/`) still render correctly
- Related routes that share dependencies still render

**If any condition fails → the fix is incomplete. Do not claim completion.**

---

## Diagnostic Commands — Phase 0

```bash
# Root verification
pwd && git rev-parse --show-toplevel && git branch --show-current

# API routing — verbose, check for redirects and response shapes
for endpoint in \
  "api/health" \
  "api/college-baseball/scores" \
  "api/college-baseball/schedule" \
  "api/nfl/scores" \
  "api/nba/scoreboard" \
  "api/cfb/scores" \
  "api/intel/news?sport=college-baseball" \
  "api/savant/batting/leaderboard" \
  "api/college-baseball/game/401848476"; do
  echo "=== $endpoint ==="
  STATUS=$(curl -s -o /tmp/bsi-resp.json -w "%{http_code}" "https://blazesportsintel.com/$endpoint")
  echo "HTTP $STATUS | $(wc -c < /tmp/bsi-resp.json) bytes"
  jq 'if type == "array" then "array[\(length)]" elif type == "object" then keys else type end' /tmp/bsi-resp.json 2>/dev/null || echo "NOT JSON"
  echo ""
done

# Shared hook/utility analysis
grep -rn "useSportData\|useQuery\|useFetch\|getReadApiUrl" app/nfl/ app/nba/ app/cfb/ app/scores/ app/intel/ --include="*.tsx" -l
diff <(head -50 app/college-baseball/page.tsx) <(head -50 app/nfl/page.tsx)

# Recent changes to broken files
git log --oneline -10 -- app/nfl/ app/nba/ app/cfb/ app/scores/
git log --oneline -10 -- lib/intel/hooks.ts
git log --oneline -10 -- workers/handlers/college-baseball/scores.ts

# Apex worker logging status
grep -rn "console\.\|logfmt\|logger\." workers/index.ts workers/handlers/ --include="*.ts" | head -20
```

---

## Skill Sync Note

`austin-super-memory` and `cloudflare-ops-health` skills have stale worker lists (8 workers instead of 19). The exact edits needed are documented in `docs/internal/skill-sync-audit-2026-03-20.md`. These are in `~/.claude/skills/` and need local editing — Cowork can't write to them.

---

## Success Criteria

A visitor navigating to each of these routes sees real data or a truthful empty state — not a blank page:

- [ ] `/scores/` — multi-sport score grid with live games
- [ ] `/nfl/` — NFL hub with standings, scores, or truthful off-season message
- [ ] `/nba/` — NBA hub with standings, scores, or truthful off-season message
- [ ] `/cfb/` — CFB hub with standings or truthful off-season message
- [ ] `/intel/` — intel dashboard with game grid, signal feed, standings
- [ ] `/college-baseball/savant/` — leaderboard table with player rows (or clear PRO-gating message)
- [ ] `/college-baseball/game/{validId}/` — game detail with box score data
- [ ] Apex worker emits observability events (Phase 0A verified)
- [ ] Zero runtime exceptions in browser console on any fixed route

Each checkbox requires: `curl` validation + browser DOM inspection + console error check. "Build passed" and "deploy succeeded" are not proof.
