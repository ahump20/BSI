# College Baseball Opening Week Rollout (2026)

## Purpose
Production-safe launch checklist for:
- Main page Schedule tab cutover (date-aware, non-game-day safe)
- Week 1 editorial publishing
- Staged ingest seed publish (Texas PDFs -> R2 + KV + API endpoint)
- Dual-source drift monitoring before any hard cutover

## Current Deployment Baseline (captured 2026-02-12 post-rollout)

| Worker | Current version | Created (UTC) | Previous version | Previous created (UTC) |
|---|---|---:|---|---:|
| `blazesportsintel-worker-prod` | `454679c2-d242-4aef-9abe-012f74a1057b` | 2026-02-12T17:22:50.566Z | `1e9edc05-f540-4535-bb38-e4b59850e082` | 2026-02-12T17:02:50.287Z |
| `bsi-ingest` | `100be83c-4fa7-4167-87be-98a7e0c5b81c` | 2026-01-24T23:48:51.798Z | `985326b3-fe48-428a-9186-e89e19545274` | 2026-01-24T23:46:33.532Z |
| `bsi-college-data-sync` | `b6e84fef-c1c1-45e1-8cd7-948b0daffa89` | 2026-01-24T16:26:30.646Z | `5eb8c7ab-0788-4337-82ad-ded2d7925712` | 2026-01-24T16:25:17.994Z |
| `blazesports-ingest` | `dca0ffa3-d272-4f35-970f-52a3dd517851` | 2026-01-09T04:24:37.006Z | `4aa7944e-babf-4510-ab84-c04d324a63a6` | 2026-01-08T03:37:33.207Z |

## Seed Artifact Publish (completed)

### R2
- Bucket: `blaze-sports-data-lake`
- Object key: `college-baseball/texas/2026-opening-week/latest.json`
- Upload command used:
  - `npx wrangler r2 object put blaze-sports-data-lake/college-baseball/texas/2026-opening-week/latest.json --file data/college-baseball/texas/2026-opening-week.json --remote`

### KV
- Namespace: `BSI_PROD_CACHE` (`e6cb68e815cd45babeee0e10460dbfee`)
- Key: `cb:texas:opening-week:2026`
- Publish command used:
  - `npx wrangler kv key put --namespace-id e6cb68e815cd45babeee0e10460dbfee cb:texas:opening-week:2026 --path data/college-baseball/texas/2026-opening-week.json --remote`

### Pages deployment
- Latest Pages deployment URL:
  - `https://8897f5ce.blazesportsintel.pages.dev`

## API Contracts in this rollout

### Existing additive contracts
- `GET /api/college-baseball/schedule`
  - Preserves: `data`, `totalCount`
  - Adds: `meta: { dataSource, lastUpdated, timezone }`
- `GET /api/college-baseball/scores`
  - Preserves: `data`, `totalCount`
  - Adds: `meta: { dataSource, lastUpdated, timezone }`

### New endpoint
- `GET /api/college-baseball/editorial/texas-opening-week`
  - Read order: `KV (cb:texas:opening-week:2026)` -> local JSON seed fallback
  - Always returns `meta.source`, `meta.fetched_at`, `meta.timezone`

## Dual-source guardrail

Run drift checks before and after production deploy:
- Script: `scripts/check-college-baseball-source-drift.mjs`
- Target dates:
  - `2026-02-14`
  - `2026-02-20`
  - current date
- Output snapshot:
  - `output/college-baseball/source-drift-<timestamp>.json`

## Rollout Order
1. Preflight local checks (targeted for changed scope):
   - `npx vitest run tests/college-baseball/schedule-utils.test.ts`
   - `npx playwright test tests/routes/college-baseball-launch.spec.ts --project=chromium`
2. Deploy Pages:
   - `npm run deploy:production`
3. Deploy Worker:
   - `npm run deploy:worker:production`
4. Run drift check:
   - `node scripts/check-college-baseball-source-drift.mjs 2026-02-14 2026-02-20 $(date +%F)`
5. Verify production URLs:
   - `/college-baseball`
   - `/college-baseball/scores`
   - `/college-baseball/editorial`
   - `/college-baseball/editorial/week-1-preview`
   - `/api/college-baseball/editorial/texas-opening-week`

## Rollback Points

If API behavior regresses:
1. Roll worker to prior version in Cloudflare dashboard for `blazesportsintel-worker-prod`.
2. Verify endpoint contracts and headers (`X-Data-Source`, `X-Last-Updated`) after rollback.

If UI/page rendering regresses:
1. Re-promote last known good Cloudflare Pages deployment.
2. Re-run `/college-baseball` and `/college-baseball/scores` smoke checks.

If ingest seed payload is incorrect:
1. Re-publish corrected JSON to KV key `cb:texas:opening-week:2026`.
2. Re-upload corrected object to `blaze-sports-data-lake/college-baseball/texas/2026-opening-week/latest.json`.
