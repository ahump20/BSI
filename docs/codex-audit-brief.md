# Codex Self-Audit Brief (Evidence-Based)

This brief is designed to be pasted into another ChatGPT session for independent review. It only includes claims I verified in this repository and clearly marks what I could not verify from code alone.

## Scope and method

I audited the current branch under `/workspace/BSI` and checked the routes, hooks, worker router, and release test scripts that were named in your prior findings.

### Commands run

```bash
find .. -name AGENTS.md -o -name AGENTS.override.md
cat AGENTS.md
cat package.json
rg --line-number "use client|getReadApiUrl|Promise.allSettled|conference|ignoreBuildErrors|output: 'export'|smoke:release|scores-integrity|gate:cbb" app hooks lib next.config.ts tests scripts package.json workers -g '!node_modules'
sed -n '1,220p' app/scores/page.tsx
rg --line-number "Promise.allSettled|fetch\(|getReadApiUrl|loaded: true|fetchError" app/scores/page.tsx
rg --line-number "useSportData|getReadApiUrl|use client" app/mlb app/college-baseball app -g 'page.tsx'
sed -n '1,220p' lib/hooks/useSportData.ts
sed -n '1,260p' app/college-baseball/page.tsx
sed -n '1,260p' app/college-baseball/standings/page.tsx
cat next.config.ts
sed -n '1,220p' tests/smoke/scores-integrity.spec.ts
rg --line-number "scores/overview|api/scores" workers app | head -n 80
sed -n '520,760p' workers/index.ts
sed -n '200,330p' app/college-baseball/scores/page.tsx
sed -n '1,90p' app/college-baseball/scores/page.tsx
npm run typecheck
```

## Verified findings (true)

1. The app does use many client-rendered data pages in a static export build.
- `next.config.ts` sets `output: 'export'`.
- MLB, MLB scores, MLB standings, college baseball hub, college baseball scores, and college baseball standings are all `'use client'` pages.

2. Data-loading strategy is inconsistent across routes.
- `useSportData` centralizes URL resolution through `getReadApiUrl()` and has a timeout path.
- `/scores` bypasses that hook and does direct browser `fetch('/api/...')` fan-out with `Promise.allSettled`.

3. `/scores` currently masks partial failures as “loaded” for some sports.
- In `/scores`, each sport result path often returns `loaded: true`.
- There is a fallback branch `return { ...s, loaded: true }` for settled requests that are not fulfilled, which can collapse error distinction into non-error UI states.

4. Conference wiring drift exists between college baseball hub links and standings behavior.
- Hub standings links are generated as slugged query values like `?conference=pac12`.
- Standings page initializes `selectedConference` to `'SEC'`, does not parse URL search params, and conference options do not include Pac-12.
- College baseball scores page also has a constrained conference list and different query key (`conf`), reinforcing split behavior.

5. Release smoke checks are narrow for “rendered data actually present.”
- `smoke:release` includes homepage/layout/scores-integrity/mobile-overflow tests.
- `scores-integrity` currently only asserts no `[object Object]` and no `undefined undefined` text.
- `gate:cbb` covers college baseball critical/api/rankings routes but not explicit MLB + all-sports rendered-data assertions.

6. TypeScript build errors are explicitly ignored in Next config.
- `typescript.ignoreBuildErrors` is set to `true`.

7. There is no existing `/api/scores/overview` aggregate worker endpoint.
- Worker routes include per-sport endpoints and `/api/scores/cached`, but no `/api/scores/overview`.

## Partially verified / cannot fully prove from local code alone

1. “Live site renders SEC on Pac-12 standings URL” cannot be proven from static code inspection alone.
- I can prove the code path likely causes it.
- I did not run a live browser reproduction against production in this pass.

2. “Frontend data surfaces are mostly client-only fetchers” is directionally true for major routes mentioned, but “mostly” across the entire app is a broad quantifier.
- I validated named critical routes, not every route in the repo.

## Tight remediation order (codebase-consistent)

1. Create a canonical conference registry module and consume it in college baseball hub + scores + standings.
2. Teach standings to read `conference` search param on initial load and normalize aliases (`pac12`, `pac-12`, `Pac-12`) to one canonical ID.
3. Replace `/scores` browser fan-out with a single Worker aggregate endpoint (`/api/scores/overview`) that returns per-sport data + explicit per-sport error/degraded flags.
4. Add hard Playwright release gates for `/scores`, `/mlb`, `/mlb/scores`, `/mlb/standings`, `/college-baseball/scores`, `/college-baseball/standings` that assert at least one rendered data card/row when API returns non-empty payloads.
5. Make production release fail on typecheck (or at minimum add required CI typecheck gate before deployment promotion).

## Copy-paste prompt for external audit

```text
Audit this BSI repo evidence summary for correctness and blind spots.

Task:
1) Classify each verified finding as: correct, overstated, or under-specified.
2) Identify missing high-risk issues not covered here.
3) Propose a concrete 7-day repair plan with execution order and release gates.
4) Provide exact test assertions for rendered-data integrity on:
   - /scores
   - /mlb
   - /mlb/scores
   - /mlb/standings
   - /college-baseball/scores
   - /college-baseball/standings
5) Suggest a conference-registry schema (ids, slugs, aliases, display names) and migration strategy.

Evidence summary:
- Static export enabled (`output: 'export'`) with many critical routes as `use client` pages.
- `useSportData` uses `getReadApiUrl` + timeout, but `/scores` uses direct fan-out `fetch()` + `Promise.allSettled`.
- `/scores` has fallback paths that mark sports `loaded: true` without explicit per-sport failure semantics.
- College baseball hub generates slug links like `?conference=pac12`; standings defaults to SEC and does not parse query params; standings conference list omits Pac-12.
- Smoke release test includes a scores-integrity test that only checks text leaks (`[object Object]`, `undefined undefined`) and does not assert populated rendered cards/rows.
- Next config has `typescript.ignoreBuildErrors: true`.
- Worker lacks a unified `/api/scores/overview` endpoint.
```
