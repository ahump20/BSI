---
name: fix-all
description: >
  Hunt and kill bugs in batches. Runs the test suite, checks build output, runs
  typecheck, audits the browser for console errors, and fixes everything found —
  in batches of 5. Reports results in product language. Use when Austin says
  "fix everything", "fix all", "debug", "find and fix bugs", "clean up errors",
  or any variant of wanting issues found and resolved.
---

# Fix All

## What This Does

Systematically finds every issue across the codebase and browser, then fixes them in batches of 5. No manual bug-hunting. No one-at-a-time reporting.

## Detection Sequence

Run all checks in parallel where possible:

### 1. Build Check
```bash
cd ~/BSI-local && npm run build 2>&1
```
Capture any build errors or warnings.

### 2. Type Check
```bash
cd ~/BSI-local && npm run typecheck 2>&1
```
Capture type errors across the frontend.

### 3. Worker Type Check
```bash
cd ~/BSI-local && npm run typecheck:workers 2>&1
```
Capture type errors across all 16+ satellite workers.

### 4. Lint Check
```bash
cd ~/BSI-local && npm run lint 2>&1
```
Capture lint violations.

### 5. Test Suite
```bash
cd ~/BSI-local && npm run test:all 2>&1
```
Capture test failures (Vitest only — Playwright tests are separate).

### 6. Browser Audit (if Claude-in-Chrome available)
- Open blazesportsintel.com
- Check console for errors (filter out noise like third-party script warnings)
- Navigate to 3-5 key pages: homepage, college baseball hub, scores, standings, a team page
- Screenshot any broken layouts or missing data

### 7. Data Freshness
- Check if scores/standings data looks stale (timestamps older than expected TTL)
- Verify "Last updated" displays are reasonable

## Triage

After detection, rank all issues by impact:

1. **Critical:** Build failures, test failures, broken pages, missing data, console errors visible to users
2. **High:** Type errors that could cause runtime issues, stale data beyond TTL
3. **Medium:** Lint violations, non-critical type errors, minor UI issues
4. **Low:** Style inconsistencies, non-blocking warnings

## Fix Sequence

- Take the top 5 issues by impact
- Fix all 5
- Run the relevant checks again to verify fixes
- If fixes introduce new issues, fix those in the same batch
- Deploy the fixes (invoke deploy-all skill)

## Reporting

For each batch of 5 fixes, report in plain English:

- What was broken (from the visitor's perspective)
- What's fixed now
- Any remaining issues queued for the next batch

Example: "Fixed 5 issues: the scores page was showing yesterday's games as today's, two team pages had missing logos, the standings sort was reversed for conference play, and the mobile navigation menu wasn't closing after tap. All deployed and verified."

## Bug Workflow

When Austin reports a specific bug: write a failing test that reproduces it FIRST. Then fix. Then prove it with the passing test. Do not skip the test step — it is the only valid proof that the bug is gone.

## Rules

- **Batch of 5.** Fix 5, deploy, report. Then ask if Austin wants another batch.
- **No asking which bug to fix.** Pick the highest-impact ones yourself.
- **Product language only.** "The scores page was stale" not "KV TTL on cb:scores:today was set to 86400."
- **Verify before claiming fixed.** Re-run the check that caught the issue.
- **Don't fix what isn't broken.** If all checks pass and the browser looks clean, say so.

## Edge Cases

- **Zero issues found:** "All checks pass. Build clean, types clean, tests green, browser audit shows no errors. Nothing to fix."
- **More than 5 issues:** Fix the top 5 by impact, deploy, report, then ask about the next batch.
- **Issues that require product decisions:** Flag them separately: "Found an issue that needs your call: [description]. The rest I can fix autonomously."
