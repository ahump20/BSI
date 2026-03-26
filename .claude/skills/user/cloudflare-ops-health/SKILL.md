---
name: cloudflare-ops-health
description: |
  Operational health monitoring, deployment validation, and incident triage for BSI's
  Cloudflare infrastructure. Chains pre-deploy checks, Wrangler deployment, post-deploy
  smoke tests, and health monitoring into a single operational workflow.

  Use when: (1) deploying a Worker or site update ("deploy", "ship it", "push to prod"),
  (2) checking infrastructure health ("is the site up", "health check", "status"),
  (3) something is broken ("500 error", "site is down", "Worker failing", "KV not
  returning data"), (4) validating after a deploy ("smoke test", "verify deploy"),
  (5) auditing infrastructure state ("what Workers are running", "check bindings").

  Triggers: "deploy", "ship it", "push to prod", "smoke test", "health check",
  "site down", "Worker error", "500", "KV issue", "D1 query failing", "cache not
  working", "verify deploy", "infra status", "what's running", "check production".
  Not for writing code — use code-engine for that. This skill handles ops.
---

# Cloudflare Ops & Health

Twenty-three Workers. Eight databases. Eighteen buckets. Six sports. One person.
The person shouldn't be manually smoke-testing after every deploy.

Full infrastructure inventory: `~/.claude/cloudflare.local.md`

## Active Infrastructure

### Workers (23)
**Site & API:** blazesportsintel-worker-prod, blazesportsintel-worker
**Ingest:** bsi-cbb-ingest, bsi-sportradar-ingest, bsi-portal-sync
**College Baseball API:** cbb-api, cbb-api-sync, college-baseball-mcp
**Analytics & Compute:** bsi-analytics-events, bsi-savant-compute, bsi-cbb-analytics
**Real-time & AI:** bsi-live-scores, bsi-intelligence-stream, bsi-college-baseball-daily, bsi-social-intel
**Operations:** bsi-error-tracker, bsi-synthetic-monitor
**BlazeCraft:** blaze-field-site, blaze-field-site-prod, blaze-field-do
**Games:** mini-games-api
**Other:** moltbot-sandbox

### Tool Routing
Use MCP server priority from `~/.claude/cloudflare.local.md`:
1. `mcp__plugin_cloudflare_*` — locally configured plugin servers
2. `mcp__cloudflare-mcp-*` — standalone local MCP servers
3. Wrangler CLI (via bash) — for deployment ops
4. Web fetch — for endpoint validation

---

## Phase 1: Pre-Deploy Validation

Before any deployment, verify:

```
□ Code compiles without errors (wrangler deploy --dry-run)
□ Bindings match wrangler.toml (KV namespaces, D1 databases, R2 buckets)
□ Environment variables set for target environment
□ No uncommitted changes in working directory
□ Tests pass (if test suite exists for this Worker)
```

If dry-run fails, stop and report the error. Do not proceed to deployment.

## Phase 2: Deployment

Execute via Wrangler:

```bash
wrangler deploy --env production
```

Capture and report:
- Worker name deployed
- Routes configured
- Upload size
- Any warnings from Wrangler output

## Phase 3: Post-Deploy Smoke Test

This is the non-negotiable validation sequence. Run all five checks:

### Check 1: Root responds 200
```bash
curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/
# Expected: 200
```

### Check 2: Nonexistent route returns 404
```bash
curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/this-should-not-exist-xyz
# Expected: 404
```

### Check 3: Deep routes return 200 with correct content
Test 2-3 known routes that exercise different Workers:
```bash
# Scores endpoint
curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/scores
# College baseball endpoint
curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/college-baseball
```
Verify response body contains expected content markers (not error pages).

### Check 4: No mixed content warnings
Fetch page HTML and scan for `http://` references in `src` or `href` attributes.
All assets must load over HTTPS.

### Check 5: Cloudflare cache headers present
```bash
curl -s -D - https://blazesportsintel.com/ | grep -i "cf-cache-status"
# Expected: HIT or MISS (not absent)
```

### Smoke Test Verdict

| Result | Action |
|--------|--------|
| All 5 pass | Report success. Done. |
| Check 1 fails | Critical — site is down. Trigger incident triage (Phase 5). |
| Check 2 fails | 404 handling broken. Check Worker routing. |
| Check 3 fails | Specific route broken. Identify which Worker serves it. |
| Check 4 fails | Mixed content. Find and fix http:// references. |
| Check 5 fails | Cache misconfigured. Check Cache-Control headers and page rules. |

---

## Phase 4: Health Monitoring

When asked for infrastructure status, check each active Worker:

```
For each Worker in the active list:
  1. Fetch its primary route
  2. Record: HTTP status, response time, CF-Ray header
  3. Flag any non-200 responses or response times > 2000ms
```

Report format:
```
BSI Infrastructure Status — {timestamp}

Worker                          Status    Latency    Cache
blazesportsintel-worker-prod    200 OK    142ms      HIT
bsi-live-scores                 200 OK    89ms       MISS
cbb-api                         200 OK    234ms      HIT
...

Issues: None / {list specific failures}
```

Use Cloudflare Dev Platform MCP to check:
- Worker error rates (last 24h)
- KV read/write latency
- D1 query performance
- R2 storage usage

---

## Phase 5: Incident Triage

When something is broken, follow this decision tree:

```
What's the symptom?
├── Site completely down (all routes 5xx)
│   → Check: Is the Worker deployed? (wrangler whoami + wrangler deployments list)
│   → Check: Is the DNS resolving? (dig blazesportsintel.com)
│   → Check: Is Cloudflare itself having issues? (cloudflarestatus.com)
│
├── Specific route failing
│   → Identify which Worker serves this route
│   → Check Worker logs via Cloudflare dashboard or wrangler tail
│   → Look for: binding errors, uncaught exceptions, timeout
│
├── Data stale or missing
│   → Check KV: Is the key present? What's the TTL?
│   → Check D1: Does the query return data directly?
│   → Check upstream API: Is Highlightly/ESPN responding?
│   → Check rate limits: Has Highlightly 429'd us?
│
├── Slow responses
│   → Check: Response time at edge (CF-Ray) vs origin
│   → Check: Cache hit rate — are we serving from cache?
│   → Check: D1 query performance — any full table scans?
│
└── Intermittent failures
    → Check: Worker CPU time limits (10ms free, 30ms paid)
    → Check: Subrequest limits (50 per invocation)
    → Check: Memory limits (128MB)
    → Correlate with traffic patterns — failing under load?
```

### Cloudflare-Specific Error Codes

| Code | Meaning | BSI Action |
|------|---------|------------|
| 1000 | DNS points to prohibited IP | Check DNS records in CF dashboard |
| 1001 | DNS resolution error | Verify CNAME/A records exist |
| 1015 | Rate limited | Check rate limiting rules |
| 1016 | Origin DNS error | Worker route misconfigured |
| 1101 | Worker threw exception | Check wrangler tail for stack trace |
| 1102 | Worker exceeded CPU time | Optimize hot path or split into subrequests |

---

## Reporting Standard

Report like a co-owner:
- What was deployed (Worker name, route)
- What the visitor sees now (homepage loads, scores update, etc.)
- What passed/failed in smoke test
- What needs attention (if anything)

Never surface Wrangler output, file paths, or technical diagnostics unless asked.
