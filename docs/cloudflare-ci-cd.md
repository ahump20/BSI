# Cloudflare-Only CI/CD Playbook

**Updated**: 2025-11-17 (America/Chicago)

## Repo & Deploy Targets

| Repository | Role | Cloudflare Target | Domain / Route |
|------------|------|-------------------|----------------|
| `ahump20/BSI` | Primary brand site | Pages | `https://blazesportsintel.com` |
| `ahump20/BI` | Legacy archive | Pages | TBD subdomain (recommend `archive.blazesportsintel.com`) |
| `ahump20/lone-star-legends-championship` | Event microsite | Pages | `https://blazesportsintel.com/lone-star-legends` or `https://lone-star.blazesportsintel.com` |
| `ahump20/Blaze-College-Baseball` | College baseball vertical | Pages | `https://blazesportsintel.com/college-baseball` |
| `ahump20/blaze-worlds-github` | Track & Field Worlds | Pages | `https://blazesportsintel.com/worlds` |
| `ahump20/live-sports-scoreboard-api` | Realtime scores API | Workers + KV/D1 | `https://api.blazesportsintel.com/scores` |

## Branch Standards

- `main`: production. Protected (no force-push). Merge to deploys.
- `staging`: optional preview. Deploys to Cloudflare preview or staging subdomain.
- Feature work: `feature/*`, `fix/*`. Always raise PR against `main` (or `staging` if the repo uses it).
- PR requirements: ≥1 approval, all GitHub Actions green.

## Workflows

### Pages Deploy (`.github/workflows/deploy-pages.yml`)
- Triggers on pushes to `main`/`staging` and PRs into `main`.
- Installs dependencies with `npm ci`, runs `npm run build`, deploys `./dist` via Wrangler.
- Uses the branch name to seed the Cloudflare Pages preview/production deploy.
- Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`.

### Worker Deploy (`.github/workflows/deploy-worker.yml`)
- Same triggers as Pages workflow.
- Runs D1 migrations only on `main`.
- Push events deploy to `production` (main) or `staging` (staging branch). PRs perform a dry-run deploy for validation.
- Secrets required: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_NAME`.

### R2 Sync (`.github/workflows/sync-r2.yml`)
- Manual trigger (`workflow_dispatch`) plus auto-trigger on `main` when `assets/**` or `media/**` change.
- Uses Wrangler to recursively upload each directory to the configured R2 bucket.
- Secrets required: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `R2_BUCKET_NAME`.

## Secrets Checklist

Set via **Settings → Secrets and variables → Actions** in each repo.

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Scoped token with Workers KV, Pages, D1, R2 permissions. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier. |
| `CLOUDFLARE_PAGES_PROJECT` | Pages project slug (per repo). |
| `D1_DATABASE_NAME` | Production D1 database binding. |
| `R2_BUCKET_NAME` | Target R2 bucket (e.g., `bsi-media-prod`). |

## Setup Script

`scripts/init-cloudflare-ci.sh` seeds shared secrets across all six repos and enables `main` protection. Run it once:

```bash
chmod +x scripts/init-cloudflare-ci.sh
./scripts/init-cloudflare-ci.sh
```

The script prompts for the API token and account ID, pushes them into repo secrets via `gh secret set`, then locks down `main` (1 review, required status checks, admin override enabled).

## Worker Template

`workers/templates/wrangler.worker.template.toml` defines production + staging environments, D1/KV/R2 bindings, and default routes. Copy it into any Worker repo and replace the `database_id`, KV namespace, and bucket names with live values before deploying.

## KPIs & Observability

- **CI Success Rate**: % of PRs passing on first run. Track via GitHub Insights.
- **Deploy Time**: Monitor merge-to-live latency using GitHub deployment events.
- **Branch Protection Compliance**: Audited monthly. Should be 100% PR-based merges.
- **Failed Deploys**: Wire GitHub deployment failure webhooks into Slack/email for rapid response.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Missing Cloudflare credentials | Document token scopes, verify with `wrangler whoami` before committing. |
| Divergent build steps per repo | Standardize on `npm run build`; add repo-specific overrides in workflow if absolutely necessary. |
| D1 migrations break production | Require schema review + automated backup before apply. |
| R2 bucket naming collisions | Use env suffixes (`-prod`, `-staging`) and manage via Cloudflare dashboard. |

## Next Moves

1. Run the init script to seed secrets + protection.
2. Copy the workflows into the other repos (Pages for sites, Worker for API, R2 sync wherever media lives).
3. Populate repo-specific secrets (Pages project names, D1 DB, R2 bucket).
4. Open a smoke-test PR in each repo and confirm the workflows fire.
5. Wire deployment events into monitoring/alerting.

Standard over vibes. Clarity beats noise.
