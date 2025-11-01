# Deployment Guide

**Last Updated**: November 1, 2025 14:43 CST (America/Chicago)

This guide explains how deployments work for the BSI (Blaze Sports Intelligence) flagship site using GitHub Actions and Cloudflare Pages.

## Table of Contents

- [Overview](#overview)
- [Deployment Environments](#deployment-environments)
- [Required GitHub Secrets](#required-github-secrets)
- [Setup Instructions](#setup-instructions)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)

---

## Overview

The BSI site uses an automated CI/CD pipeline powered by GitHub Actions and Cloudflare Pages. Deployments are triggered automatically on:

- **Production deploys**: Pushes to the `main` branch
- **Staging deploys**: Pushes to the `staging` branch
- **Preview deploys**: Pull requests targeting the `main` branch

### How It Works

1. Code is pushed to GitHub (main, staging, or PR)
2. GitHub Actions workflow triggers automatically
3. Dependencies are installed with `npm ci`
4. Site is built with `npm run build` (outputs to `./dist`)
5. Built assets are deployed to Cloudflare Pages via Wrangler
6. Deployment URL is provided in the GitHub Actions output

---

## Deployment Environments

### Production (main branch)
- **Branch**: `main`
- **URL**: Your configured Cloudflare Pages production domain
- **Auto-deploy**: Yes, on every push to `main`
- **Use case**: Live production site for end users

### Staging (staging branch)
- **Branch**: `staging`
- **URL**: `https://staging.<your-project>.pages.dev`
- **Auto-deploy**: Yes, on every push to `staging`
- **Use case**: Pre-production testing and QA

### Preview (Pull Requests)
- **Trigger**: Pull requests targeting `main`
- **URL**: Unique preview URL for each PR (e.g., `https://abc123.<your-project>.pages.dev`)
- **Auto-deploy**: Yes, on every commit to the PR
- **Use case**: Review changes before merging

---

## Required GitHub Secrets

Configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions > New repository secret`):

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token with Cloudflare Pages permissions | Create at [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) with "Edit Cloudflare Workers" template or custom token with `Account.Cloudflare Pages:Edit` permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Found in [Cloudflare Dashboard](https://dash.cloudflare.com/) on the right sidebar of any page, or in the URL after `/accounts/` |
| `CLOUDFLARE_PAGES_PROJECT` | Name of your Cloudflare Pages project | The project name you created in Cloudflare Pages (e.g., `blazesportsintel`) |

### Finding Your Cloudflare Account ID

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Look at the right sidebar under "Account ID"
3. Or check the URL: `https://dash.cloudflare.com/{account-id}/...`

### Creating a Cloudflare API Token

1. Go to [API Tokens page](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template, or create a custom token with:
   - Permissions: `Account` > `Cloudflare Pages` > `Edit`
   - Account Resources: Include your specific account
4. Copy the token immediately (it won't be shown again)
5. Add it as `CLOUDFLARE_API_TOKEN` in GitHub repository secrets

---

## Setup Instructions

### Step 1: Configure GitHub Secrets

1. Navigate to your repository on GitHub
2. Go to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each of the three required secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_PAGES_PROJECT`

### Step 2: Enable Branch Protection (Recommended)

For production safety, enable branch protection on `main`:

1. Go to **Settings** > **Branches** > **Add branch protection rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (at least 1)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings
4. Disable:
   - ❌ Allow force pushes

See `.github/BRANCH_PROTECTION.md` for automated setup using GitHub CLI.

### Step 3: Create Staging Branch (Optional)

If you want a staging environment:

```bash
git checkout -b staging
git push -u origin staging
```

### Step 4: First Deployment

#### Option A: Deploy via Pull Request (Recommended)

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes and commit
3. Push: `git push -u origin feature/my-feature`
4. Create a Pull Request targeting `main`
5. GitHub Actions will automatically create a preview deployment
6. Review the preview URL in the PR checks
7. Merge the PR to deploy to production

#### Option B: Direct Push (Use with Caution)

```bash
git checkout main
git push origin main
```

This triggers an immediate production deployment.

---

## Local Development

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher

### Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production (outputs to ./dist)
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run typecheck

# Run tests
npm test
```

### Environment Variables

Copy `.env.example` to `.env` and configure variables as needed:

```bash
cp .env.example .env
```

Most environment variables are optional for local development. See `.env.example` for available options.

### Changing Build Output Directory

The default build output directory is `./dist`. If you need to change this:

1. Update `vite.config.js`:
   ```js
   export default defineConfig({
     build: {
       outDir: 'your-custom-dir',
       // ...
     }
   });
   ```

2. Update `.github/workflows/deploy-pages.yml`:
   ```yaml
   command: pages deploy ./your-custom-dir --project-name=${{ secrets.CLOUDFLARE_PAGES_PROJECT }} --branch=${{ github.ref_name }}
   ```

---

## Troubleshooting

### Missing Secrets Error

**Problem**: Workflow fails with `Error: Input required and not supplied: apiToken`

**Solution**: Ensure all three secrets are configured in GitHub:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`

Verify at: `Settings > Secrets and variables > Actions`

### Wrangler Authentication Error

**Problem**: `Error: Authentication error: Invalid API Token`

**Solution**:
1. Verify your API token has the correct permissions:
   - `Account` > `Cloudflare Pages` > `Edit`
2. Regenerate the token if it's expired or compromised
3. Update the `CLOUDFLARE_API_TOKEN` secret in GitHub

### Build Directory Mismatch

**Problem**: `Error: Directory './dist' does not exist`

**Solution**:
1. Verify the build completes successfully in the workflow logs
2. Check `vite.config.js` to confirm `outDir: 'dist'`
3. Ensure `npm run build` generates the `dist` directory locally
4. If using a different output directory, update the workflow's `command` parameter

### Build Fails During CI

**Problem**: `npm ci` or `npm run build` fails in GitHub Actions

**Solution**:
1. Test locally first: `npm ci && npm run build`
2. Check for missing dependencies or version conflicts
3. Review workflow logs for specific error messages
4. Ensure `package-lock.json` is committed to the repository

### Project Not Found Error

**Problem**: `Error: Project not found`

**Solution**:
1. Verify the `CLOUDFLARE_PAGES_PROJECT` secret matches your exact Cloudflare Pages project name
2. Create the project in Cloudflare Pages first if it doesn't exist:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to Workers & Pages > Create application > Pages
   - Connect to GitHub and select your repository
   - Configure build settings (Build command: `npm run build`, Output directory: `dist`)

### Permission Denied Error

**Problem**: `Error: Insufficient permissions`

**Solution**:
1. Ensure the API token has `Cloudflare Pages:Edit` permission
2. Verify the token is associated with the correct Cloudflare account
3. Check that the account ID matches the account containing your Pages project

### Deploy Succeeds but Site Doesn't Update

**Problem**: Deployment completes but changes aren't visible

**Solution**:
1. Check Cloudflare Pages dashboard for deployment status
2. Clear your browser cache and hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Wait 1-2 minutes for Cloudflare's CDN to propagate changes
4. Verify you're visiting the correct deployment URL (production vs preview)

### Node Version Mismatch

**Problem**: Build fails with Node.js version errors

**Solution**:
The workflow is configured to use Node.js 20. If you need a different version:
1. Update `.github/workflows/deploy-pages.yml`:
   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: '18'  # or your preferred version
   ```

---

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)

---

**Questions or Issues?** Open an issue in the repository or contact the development team.
