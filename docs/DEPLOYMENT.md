# Deployment Guide - Cloudflare Pages

This guide provides comprehensive instructions for deploying the BSI (Blaze Sports Intelligence) application to Cloudflare Pages using GitHub Actions.

## Table of Contents

1. [Required GitHub Secrets](#required-github-secrets)
2. [Deployment Setup](#deployment-setup)
3. [Branch Protection Setup](#branch-protection-setup)
4. [Local Development](#local-development)
5. [Deployment Workflow](#deployment-workflow)
6. [Troubleshooting](#troubleshooting)

---

## Required GitHub Secrets

Configure the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions → New repository secret):

### `CLOUDFLARE_API_TOKEN`
- **Description:** Cloudflare API token with permissions to deploy to Pages
- **How to obtain:**
  1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
  2. Go to **My Profile** → **API Tokens**
  3. Click **Create Token**
  4. Use the **Edit Cloudflare Workers** template or create a custom token with:
     - **Permissions:**
       - Account - Cloudflare Pages - Edit
       - Account - Workers Scripts - Edit
       - Zone - Workers Routes - Edit
     - **Account Resources:** Include your account
  5. Click **Continue to summary** → **Create Token**
  6. Copy the token (you won't be able to see it again!)

### `CLOUDFLARE_ACCOUNT_ID`
- **Description:** Your Cloudflare account ID
- **How to obtain:**
  1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
  2. Select any domain or go to **Workers & Pages**
  3. Copy the **Account ID** from the right sidebar
  4. Alternatively, find it in the URL: `dash.cloudflare.com/{account_id}/...`

### `CLOUDFLARE_PAGES_PROJECT`
- **Description:** The name of your Cloudflare Pages project
- **Default value:** `blazesportsintel` (based on existing configuration)
- **How to obtain:**
  1. Go to Cloudflare Dashboard → **Workers & Pages**
  2. If the project exists, copy its name
  3. If creating new: this will be the project name you choose during first deployment

---

## Deployment Setup

### Step 1: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the three required secrets listed above

### Step 2: Verify Cloudflare Pages Project

If you haven't created a Cloudflare Pages project yet:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click **Create application** → **Pages** → **Connect to Git**
4. Or let the first GitHub Actions deployment create it automatically

### Step 3: Enable GitHub Actions

The workflow file is located at `.github/workflows/deploy-pages.yml`. It will automatically:
- Deploy to Cloudflare Pages on push to `main` or `staging` branches
- Create preview deployments for pull requests to `main`
- Comment deployment URLs on pull requests

---

## Branch Protection Setup

For production stability, set up branch protection rules for the `main` branch. See [`.github/BRANCH_PROTECTION.md`](./../.github/BRANCH_PROTECTION.md) for detailed instructions.

**Quick setup:**

1. Go to repository **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Configure:
   - Branch name pattern: `main`
   - ☑️ Require a pull request before merging
   - ☑️ Require approvals: 1
   - ☑️ Require status checks to pass before merging
   - ☑️ Require branches to be up to date before merging
   - Status checks: Select `Build and Deploy to Cloudflare Pages`
   - ☑️ Do not allow bypassing the above settings
4. Click **Create**

---

## Local Development

### Prerequisites

- Node.js 20 or higher
- npm or pnpm (this project uses pnpm workspaces; however, the deployment workflow currently uses npm for installing dependencies. If you use pnpm locally, ensure compatibility with npm in CI/CD.)

### Available Scripts

```bash
# Install dependencies
npm install
# or
pnpm install

# Start development server (hot reload enabled)
npm run dev
# Typically runs on http://localhost:3000 or http://localhost:5173

# Build for production
npm run build
# Outputs to ./dist directory

# Preview production build locally
npm run preview
# Runs production build on local server

# Deploy to Cloudflare Pages manually
npm run deploy
# Requires wrangler CLI configured with Cloudflare credentials
```

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your local development values:
   - Database URLs
   - API keys for external services
   - Cloudflare credentials (for manual deployment)

3. **Never commit `.env` file** - it's in `.gitignore` by default

---

## Deployment Workflow

### Automatic Deployments

#### Production Deployment (main branch)
```bash
git checkout main
git pull origin main
# Make changes, commit them
git push origin main
```
→ Automatically deploys to production Cloudflare Pages URL

#### Staging Deployment
```bash
git checkout staging
# Make changes, commit them
git push origin staging
```
→ Automatically deploys to staging preview URL

#### Pull Request Previews
```bash
git checkout -b feature/my-feature
# Make changes, commit them
git push origin feature/my-feature
# Create PR to main
```
→ Automatically creates preview deployment and comments URL on PR

### Manual Deployment

If you need to deploy manually:

```bash
# Install wrangler CLI globally
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=blazesportsintel --branch=main
```

---

## Troubleshooting

### Issue: Build fails with "npm ci" error

**Solution:**
- Ensure `package-lock.json` is committed to the repository
- If using pnpm, the workflow may need to be updated to use pnpm instead
- Check Node.js version compatibility (workflow uses Node 20)

**Workaround for pnpm workspaces:**
Update the workflow to use pnpm:
```yaml
- uses: pnpm/action-setup@v3
  with:
    version: 9
- run: pnpm install --frozen-lockfile
- run: pnpm run build
```

### Issue: Deployment fails with "Authentication error"

**Solution:**
- Verify `CLOUDFLARE_API_TOKEN` is set correctly in GitHub Secrets
- Check that the API token has not expired
- Ensure the token has the correct permissions (Cloudflare Pages - Edit)
- Regenerate the token if necessary

### Issue: Build succeeds but deployment fails

**Solution:**
- Check that `CLOUDFLARE_ACCOUNT_ID` matches your actual account ID
- Verify `CLOUDFLARE_PAGES_PROJECT` name is correct
- Ensure the project exists in Cloudflare Dashboard
- Check Cloudflare Dashboard → **Workers & Pages** for deployment logs

### Issue: Wrong files are deployed (missing dist directory)

**Solution:**
- Verify `npm run build` generates output in `dist` directory
- Check `package.json` build script
- For Next.js: output should be in the `dist` directory (update your build script if necessary)
- Update workflow's `command` to point to the correct output directory:
  ```yaml
  command: pages deploy dist --project-name=...
  ```

### Issue: Environment variables not working in deployed app

**Solution:**
- Build-time variables: Set them in GitHub Actions workflow:
  ```yaml
  env:
    NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
  ```
- Runtime variables: Configure in Cloudflare Dashboard:
  1. Go to **Workers & Pages** → Your Project
  2. **Settings** → **Environment variables**
  3. Add variables for Production and Preview environments

### Issue: Preview deployments not appearing on PRs

**Solution:**
- Verify workflow has `pull-requests: write` permission
- Check that the workflow runs on `pull_request` events
- Ensure GitHub Actions are enabled for the repository
- Check Actions tab for any workflow failures

### Issue: Custom domain not working

**Solution:**
1. Go to Cloudflare Dashboard → **Workers & Pages** → Your Project
2. Navigate to **Custom domains**
3. Add your domain (e.g., `blazesportsintel.com`)
4. Ensure DNS records are configured correctly:
   - CNAME record pointing to `<project>.pages.dev`
5. Wait for DNS propagation (can take up to 24 hours)
6. Ensure SSL/TLS mode is set to **Full (strict)**

### Issue: Build is slow or times out

**Solution:**
- Optimize build process (remove unnecessary dependencies)
- Use build caching in workflow:
  ```yaml
  - uses: actions/setup-node@v4
    with:
      cache: 'npm'
  ```
- Consider splitting build and deploy into separate jobs
- Check for heavy dependencies that can be optimized

---

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Workers & Pages Dashboard](https://dash.cloudflare.com)

---

## Support

For issues specific to this deployment setup:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review GitHub Actions logs in the **Actions** tab
3. Check Cloudflare Pages deployment logs in the dashboard
4. Review existing issues in the repository

For Cloudflare-specific issues:
- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare Support](https://support.cloudflare.com/)
