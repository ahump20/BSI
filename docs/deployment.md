# Deployment Guide

This document explains the automated deployment workflow for Blaze Sports Intel to Cloudflare Pages and Workers.

## Overview

The BSI platform uses GitHub Actions to automatically deploy to Cloudflare infrastructure on every push to the `main` branch. The deployment includes:

1. **Cloudflare Pages** - Static site deployment for BlazeSportsIntel and BlazeCraft
2. **Cloudflare Workers** - Backend API and data pipeline workers

## Automated Deployment Workflow

The deployment workflow is defined in `.github/workflows/deploy.yml` and runs automatically on:

- **Push to main branch** - Full production deployment
- **Pull requests** - Preview deployments (Pages only, Workers are not deployed)
- **Manual trigger** - Via GitHub Actions UI with optional site selection

### Workflow Jobs

1. **Detect Changes** - Analyzes changed files to determine which components need deployment
2. **Deploy BlazeSportsIntel** - Builds and deploys the main site to Cloudflare Pages
3. **Deploy BlazeCraft** - Builds and deploys the BlazeCraft game to Cloudflare Pages
4. **Deploy Workers** - Deploys the production worker to handle dynamic routes (main branch only)
5. **Deployment Summary** - Reports the status of all deployments

## Required GitHub Secrets

The following secrets must be configured in the GitHub repository settings (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token with permissions to deploy Pages and Workers | Create at [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) with "Edit Cloudflare Workers" and "Cloudflare Pages" permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Found in Cloudflare Dashboard → Account → Workers & Pages (visible in URL or sidebar) |

### Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to `Settings` → `Secrets and variables` → `Actions`
3. Click `New repository secret`
4. Add each secret with the exact name and value from the table above

**Important:** Never commit these secrets to the repository. The workflow is configured to prevent secret exposure in logs.

## Deployment Process

### Automatic Deployment (Push to Main)

When code is pushed to the `main` branch:

1. Changes are detected and analyzed
2. Type checking, linting, and tests run automatically
3. Static site is built with `pnpm build`
4. Site is deployed to Cloudflare Pages at `blazesportsintel.com`
5. Production worker is deployed to handle API routes
6. Health check verifies the deployment
7. Deployment summary is posted to the workflow run

### Manual Deployment

To manually trigger a deployment:

1. Go to `Actions` tab in GitHub
2. Select "Deploy to Cloudflare" workflow
3. Click `Run workflow`
4. Choose which site to deploy (all, blazesportsintel, or blazecraft)
5. Click `Run workflow` to start

### Local Deployment

You can also deploy manually from your local machine using npm scripts:

```bash
# Deploy Pages (static site)
npm run deploy:production

# Deploy Worker (backend)
npm run deploy:worker

# Deploy both (hybrid)
npm run deploy:hybrid
```

**Note:** Local deployments require Wrangler to be authenticated with Cloudflare. Run `npx wrangler login` first.

## Worker Configuration

The main worker is configured in `workers/wrangler.toml` with separate environments:

- **Development** (default) - Used for local testing with `npm run dev:worker`
- **Production** (`--env production`) - Used for live deployment to `blazesportsintel.com`

The worker handles:
- Dynamic API routes (`/api/*`)
- Backend data pipelines
- Proxying to the static Pages site for content

## Troubleshooting

### Deployment Fails with "Unauthorized"

- Verify `CLOUDFLARE_API_TOKEN` is correctly set in GitHub secrets
- Ensure the token has "Edit Cloudflare Workers" and "Cloudflare Pages" permissions
- Check the token hasn't expired

### Deployment Succeeds but Site Doesn't Update

- Check the Cloudflare Pages dashboard for deployment status
- Wait 30-60 seconds for CDN propagation
- Clear browser cache or test in incognito mode
- Check the workflow run logs for any warnings

### Worker Deployment Fails

- Verify `workers/wrangler.toml` configuration is correct
- Check that required bindings (KV, D1, R2) exist in Cloudflare
- Review worker logs in Cloudflare Dashboard → Workers & Pages → Logs

### Changes Not Detected

The workflow detects changes based on file paths. Ensure modified files match the patterns in the `detect-changes` job:

- `app/`, `components/`, `functions/`, `lib/`, `public/` - Triggers BlazeSportsIntel deployment
- `package.json`, `pnpm-lock.yaml`, `wrangler.toml` - Triggers BlazeSportsIntel deployment
- `games/blazecraft/` - Triggers BlazeCraft deployment

## Security Notes

- Secrets are never exposed in workflow logs
- The workflow uses GitHub's built-in secret masking
- API tokens are passed directly to the Wrangler action without intermediate storage
- All deployments use secure HTTPS connections

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
