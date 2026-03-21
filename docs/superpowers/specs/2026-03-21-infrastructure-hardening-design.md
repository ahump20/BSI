# Infrastructure Hardening: Alerting + Fleet Observability

**Date:** 2026-03-21
**Context:** Infrastructure audit revealed 8 orphan Workers (deleted), a phantom cron bug (fixed), and two systemic gaps: (1) the synthetic monitor detects failures but never notifies anyone, (2) 16 of 19 Workers lack observability, making the Cloudflare dashboard untrustworthy.

## Part A: Wire Failure Alerts via Resend

### Problem
`synthetic-monitor` checks 12 endpoints every 5 minutes. It detects failures and schema drift, archives drift payloads to R2, stores results in KV. But `ALERT_WEBHOOK_URL` was never set — `sendAlert()` silently no-ops on every failure.

### Design
Rewrite `sendAlert()` in `workers/synthetic-monitor/index.ts` to call the Resend API (same pattern as `workers/shared/auth.ts:89-119`). Replace the generic webhook POST with a Resend email POST.

**Alert email spec:**
- From: `BSI Monitor <noreply@blazesportsintel.com>`
- To: `humphrey.austin20@gmail.com`
- Subject (failures): `[BSI Monitor] {N}/{total} endpoints DOWN`
- Subject (drift): `[BSI Monitor] Schema drift on {N} endpoint(s)`
- Body: HTML table with endpoint name, URL, status code, latency, error message

**`sendAlert()` approach:** Keep the existing string-based signature. Both call sites already format descriptive strings. Wrap the message in `<pre>` inside a styled HTML email. This avoids touching call sites and keeps the change to one function body.

**Files changed:**
- `workers/synthetic-monitor/index.ts` — rewrite `sendAlert()` (~15 lines), add `ALERT_TO_EMAIL` constant
- `workers/synthetic-monitor/env.secrets.d.ts` — replace `ALERT_WEBHOOK_URL` with `RESEND_API_KEY`
- `workers/synthetic-monitor/wrangler.toml` — remove stale `ALERT_WEBHOOK_URL` comment block (lines 26-28)

**Secret to set:**
```bash
wrangler secret put RESEND_API_KEY --config workers/synthetic-monitor/wrangler.toml
```
Value: same `RESEND_API_KEY` used by the main worker.

**What doesn't change:** Check logic, schema drift detection, KV storage, R2 archival, endpoint list, cron schedule.

## Part B: Enable Observability Fleet-Wide

### Problem
Only 3 of 19 Workers have `[observability] enabled = true`. The other 16 produce zero observability events — the Cloudflare dashboard shows a partial view.

### Design
Add `[observability]\nenabled = true` to 16 wrangler.toml files. Redeploy all 16.

**Workers to update:**
1. `workers/wrangler.toml` (main worker — both top-level AND `[env.production.observability]`)
2. `workers/blaze-field-do/wrangler.toml`
3. `workers/blaze-field-site/wrangler.toml` (dual-env — both top-level AND `[env.production.observability]`)
4. `workers/bsi-analytics-events/wrangler.toml` (dual-env — both top-level AND `[env.production.observability]`)
5. `workers/bsi-cbb-analytics/wrangler.toml`
6. `workers/bsi-cbb-ingest/wrangler.toml`
7. `workers/bsi-college-baseball-daily/wrangler.toml`
8. `workers/bsi-live-scores/wrangler.toml`
9. `workers/bsi-portal-sync/wrangler.toml`
10. `workers/bsi-savant-compute/wrangler.toml`
11. `workers/bsi-show-dd-sync/wrangler.toml`
12. `workers/bsi-social-intel/wrangler.toml`
13. `workers/error-tracker/wrangler.toml`
14. `workers/mini-games-api/wrangler.toml`
15. `workers/sportradar-ingest/wrangler.toml`
16. `workers/synthetic-monitor/wrangler.toml`

**Already have it (no change):** `college-baseball-mcp`, `bsi-intelligence-stream`, `bsi-baseball-agent`

**Placement:** After `compatibility_flags` line, before any `[[kv_namespaces]]` or `[triggers]` block.

**Deploy order:**
1. Satellites first (each via `wrangler deploy --config workers/{name}/wrangler.toml`)
2. Main worker last (`npm run deploy:worker`)

## Part C: Update infrastructure.md Memory File

Update `~/.claude/projects/-Users-AustinHumphrey/memory/infrastructure.md` to reflect:
- 19 Workers (not 23) — list deleted orphans
- Observability enabled fleet-wide
- Alerting active on synthetic-monitor via Resend
- Remove references to deleted Workers (cbb-api, cbb-api-sync, blaze-field-site-prod, moltbot-sandbox, blazesportsintel-worker, bsi-cache-warmer, cardinals-intelligence-app, college-baseball-mcp-production)

## Verification

1. **Alerting:** After deploying synthetic-monitor with Resend, wait for next 5-minute cron cycle. If all endpoints are healthy, no email fires (correct). To force-test: temporarily add a fake endpoint that 404s, deploy, wait for cron, verify email arrives, remove fake endpoint, redeploy.
2. **Observability:** After redeploying fleet, check Cloudflare observability dashboard — all 19 Workers should appear within their next invocation window.
3. **Health:** `curl https://blazesportsintel.com/api/health` and `curl https://sabermetrics.blazesportsintel.com/health` both return 200.
4. **No regressions:** `npm run health` (9 production curl checks).

## Non-Goals

- No changes to what the synthetic monitor checks or its schedule
- No changes to error-tracker logic
- No new Workers or KV namespaces
- No alerting on error-tracker (can add later if email volume from monitor is insufficient)
