---
name: deploy-all
description: >
  One-command deploy for BSI. Auto-detects what changed (git diff, modified workers,
  frontend changes) and deploys only the affected targets — Pages frontend, main worker,
  and/or satellite workers. Runs post-deploy smoke tests and reports results in plain
  English. Use when Austin says "deploy", "ship it", "push to production", "deploy all",
  or any variant of getting changes live.
---

# Deploy All

## What This Does

Deploys everything that changed to production. No typing deploy commands. No remembering which worker config lives where. One skill, one invocation.

## Detection Logic

1. **Check git diff** against last deploy (or HEAD~5 if no deploy tag exists)
2. **Categorize changes:**
   - `app/`, `components/`, `lib/`, `public/`, `next.config.*`, `tailwind.*` -> Frontend (Cloudflare Pages)
   - `workers/index.ts`, `workers/handlers/`, `workers/shared/`, `workers/wrangler.toml` -> Main worker
   - `workers/{name}/` -> Satellite worker (by directory name)
   - `functions/` -> Pages Functions (deployed with frontend)
   - `games/` -> Arcade (separate Pages project)
3. **If nothing changed:** Say so and stop. Don't deploy for the sake of deploying.

## Deploy Sequence

### Frontend (blazesportsintel.com)
```bash
cd ~/BSI-local && npm run build && npm run deploy:production
```
- Staging path is `/var/tmp/bsi-deploy-out` (NOT `/tmp/` — iCloud evicts from `/tmp/`)
- If first deploy times out on 15K+ files, retry immediately — second deploy is instant (hash dedup)

### Main Worker (blazesportsintel-worker-prod)
```bash
cd ~/BSI-local && npm run deploy:worker
```

### Satellite Workers
Deploy only the ones with changes. Each has its own wrangler.toml:
```bash
wrangler deploy --config workers/{name}/wrangler.toml
```

Known satellite deploy commands:
- `npm run deploy:live-scores` -> bsi-live-scores
- `npm run deploy:daily-digest` -> bsi-college-baseball-daily
- `npm run deploy:arcade-api` -> mini-games-api
- Other satellites: `wrangler deploy --config workers/{name}/wrangler.toml`

### Arcade (arcade.blazesportsintel.com)
```bash
cd ~/games/sandlot-sluggers && npm run build && npx wrangler pages deploy dist --project-name=bsi-arcade --branch=main
```

### BlazeCraft (blazecraft.app)
```bash
cd ~/blazecraft-app && npm run deploy
```

### BSI Labs (labs.blazesportsintel.com)
```bash
cd ~/bsi-labs && npm run build && npx wrangler pages deploy dist --project-name=trackman-audit-lab
```

## Post-Deploy Smoke Test

After every deploy, verify:
1. Fetch the root URL -> expect 200
2. Fetch a nonexistent route -> expect 404 page (not crash)
3. Check 2-3 deep routes -> 200 + correct content
4. No mixed content warnings
5. Confirm Cloudflare cache headers present

If Claude-in-Chrome is available, take a screenshot of the homepage and one sport page for visual verification.

## Reporting

Report in plain English. What shipped, what the visitor sees now, any issues found during smoke test. No file paths, no function names, no build output.

Example: "Homepage and college baseball pages are live with the updated scores layout. Main data worker redeployed with the new standings logic. All smoke tests passed — homepage loads in under 2 seconds, scores page shows today's games."

## Error Handling

- If build fails: show the error, suggest the fix, don't retry blindly
- If deploy times out: retry once (Cloudflare Pages hash dedup makes retries fast)
- If smoke test fails: report what's broken, don't roll back without asking
- Wrangler version: 4.71.0+ required
