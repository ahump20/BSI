# Prompt feed: provider setup + deployment execution

Use this prompt with an execution-capable agent:

---
You are operating inside the BSI repo. Execute this production-safe integration plan in order.

1) Validate prerequisites:
- `wrangler --version`
- `wrangler whoami`
- `npm --version`

2) Configure production provider secrets for both runtimes (never print secret values):
- `./scripts/configure-provider-secrets.sh --target pages --env production`
- `./scripts/configure-provider-secrets.sh --target worker --env production`

3) Verify configuration:
- Worker secrets: `wrangler secret list --config workers/wrangler.toml --env production`
- Pages secrets: verify in Cloudflare dashboard for Pages project `blazesportsintel`

4) Run checks and build:
- `npm run lint`
- `npm run typecheck`
- `npm run build`

5) Deploy:
- Pages: `npm run deploy:production`
- Worker (if applicable): `npm run deploy:worker:production`

6) Post-deploy smoke checks:
- `curl -i https://blazesportsintel.com/api/agent-health`
- `curl -i https://blazesportsintel.com/api/semantic-health`

7) Return a report containing:
- Every command run
- Pass/fail status per command
- Any blockers and the exact next corrective command

Rules:
- Never echo or log secret values.
- Never commit provider keys to source, `.env` files tracked by git, or client bundles.
- Stop immediately on first failed deploy step and report the error.
---
