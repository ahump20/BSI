Run the BSI deploy pipeline. Target: $ARGUMENTS

If $ARGUMENTS specifies a worker name (e.g., "bsi-savant-compute", "bsi-live-scores", "bsi-cbb-analytics"), deploy ONLY that satellite worker using its wrangler.toml. Do not build the frontend or deploy Pages.

If $ARGUMENTS is empty or says "all" or "full", run the full pipeline.

## Full deploy pipeline

1. **Pre-flight checks**
   - Run `git status` — report any uncommitted changes. Do NOT proceed with uncommitted changes unless Austin confirms.
   - Confirm the current branch. Warn if not on `main`.
   - Run `npm run typecheck` — abort if it fails.

2. **Build**
   - Run `TURBOPACK=0 npx next build` (static export to `out/`).
   - If build fails, report the error and stop. Do not retry without diagnosing.

3. **Deploy**
   - Run `npm run deploy:all` (this runs pre-deploy-check + deploy:safe + worker).
   - If deploy times out on first attempt (15K+ files), retry once — second deploy is instant due to hash dedup.

4. **Verify**
   - `curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/` — expect 200.
   - `curl -s https://blazesportsintel.com/api/health` — expect JSON with status.
   - `curl -s -o /dev/null -w "%{http_code}" https://blazesportsintel.com/scores/` — expect 200.
   - Report results: which URLs returned 200, which didn't.

5. **Post-deploy**
   - Run `npm run health` if available (9 curl checks against production).
   - Report: deployed successfully / deployed with warnings / deploy failed.

## Satellite worker deploy

If deploying a single worker:
1. Find its wrangler.toml: `workers/{name}/wrangler.toml`
2. Run `wrangler deploy --config workers/{name}/wrangler.toml`
3. Verify the worker is responding if it has a public route.
4. Report: worker name, deploy status.
