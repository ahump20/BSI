# Cloudflare Pages Deployment Guide

**Last Updated:** November 1, 2024 (America/Chicago)

This guide provides step-by-step instructions for deploying the BSI application to Cloudflare Pages using GitHub Actions.

## Prerequisites

- GitHub repository with admin access
- Cloudflare account with Pages enabled
- Node.js 20.x installed locally (for testing builds)

## Required GitHub Secrets

The following secrets must be configured in your GitHub repository for automated deployments:

### 1. CLOUDFLARE_API_TOKEN
- **Description:** API token with Cloudflare Pages permissions
- **How to obtain:**
  1. Log in to your Cloudflare dashboard
  2. Go to **My Profile** → **API Tokens**
  3. Click **Create Token**
  4. Use the **Edit Cloudflare Workers** template or create a custom token
  5. Required permissions:
     - Account - Cloudflare Pages - Edit
  6. Copy the token (you won't see it again!)

### 2. CLOUDFLARE_ACCOUNT_ID
- **Description:** Your Cloudflare account ID
- **How to obtain:**
  1. Log in to your Cloudflare dashboard
  2. Navigate to any domain/site
  3. Scroll down the right sidebar to find **Account ID**
  4. Copy the ID (format: 32-character hex string)

### 3. CLOUDFLARE_PAGES_PROJECT
- **Description:** The name of your Cloudflare Pages project
- **How to obtain:**
  1. Log in to your Cloudflare dashboard
  2. Go to **Workers & Pages** → **Pages**
  3. Either use an existing project name or create a new project
  4. The project name is shown in the project list (e.g., "blazesportsintel")

## Setting GitHub Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `CLOUDFLARE_API_TOKEN`
     Value: [your API token]
   - Name: `CLOUDFLARE_ACCOUNT_ID`
     Value: [your account ID]
   - Name: `CLOUDFLARE_PAGES_PROJECT`
     Value: [your project name]
5. Click **Add secret** for each one

## Deployment Workflow

### Automatic Deployments

The workflow automatically triggers on:

1. **Push to `main` branch** - Production deployment
2. **Push to `staging` branch** - Staging deployment
3. **Pull Request to `main`** - Preview deployment for testing

### Manual Deployment

To manually trigger a deployment:

1. Ensure all code is committed and pushed to GitHub
2. The workflow will automatically run on push to `main` or `staging`
3. Monitor the deployment:
   - Go to **Actions** tab in your GitHub repository
   - Click on the running workflow
   - View logs and deployment status

## Build Process

The deployment workflow performs the following steps:

1. **Checkout code** - Fetches the latest code from the repository
2. **Setup Node.js 20** - Installs Node.js 20.x with npm caching
3. **Install dependencies** - Runs `npm ci` for clean install
4. **Build project** - Executes `npm run build` which:
   - Compiles TypeScript (`npm run build:lib`)
   - Builds the Vite application
   - Outputs to `./dist` directory
5. **Deploy to Cloudflare Pages** - Uses Wrangler to deploy the `./dist` directory

## Verifying Deployment

After deployment completes:

1. Check the GitHub Actions logs for any errors
2. Visit your Cloudflare Pages dashboard
3. Navigate to **Workers & Pages** → **Pages** → [your project]
4. View the deployment history and status
5. Click on the deployment URL to test the live site

## Troubleshooting

### Build Failures

If the build fails:
- Check the Actions logs for error messages
- Verify all dependencies are correctly specified in `package.json`
- Test the build locally: `npm ci && npm run build`
- Ensure TypeScript compiles without errors: `npm run build:lib`

### Deployment Failures

If deployment fails:
- Verify all three GitHub secrets are correctly set
- Check that the CLOUDFLARE_PAGES_PROJECT name matches exactly
- Ensure the API token has the correct permissions
- Review Cloudflare Pages dashboard for deployment errors

### Secret Issues

If secrets are missing or incorrect:
- Go to **Settings** → **Secrets and variables** → **Actions**
- Update or recreate the failing secret
- Re-run the workflow from the Actions tab

## Environment Variables

For application environment variables (not deployment secrets):
- See `.env.example` for all available configuration options
- Set environment variables in Cloudflare Pages dashboard:
  1. Go to **Workers & Pages** → [your project] → **Settings**
  2. Click **Environment variables**
  3. Add production and preview environment variables as needed

## Branch Protection (Optional)

For production safety, consider enabling branch protection on `main`:
- See `.github/BRANCH_PROTECTION.md` for setup instructions
- Requires at least 1 approving review before merge
- Ensures status checks pass before merge

## Support

For issues or questions:
- Review GitHub Actions logs
- Check Cloudflare Pages documentation: https://developers.cloudflare.com/pages/
- Consult Wrangler CLI documentation: https://developers.cloudflare.com/workers/wrangler/
