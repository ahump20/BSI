# Cloudflare CI/CD Setup Guide

## Overview

This guide documents the Cloudflare-based CI/CD infrastructure for all Blaze Sports Intel repositories. All deployments use GitHub Actions with Cloudflare Workers, Pages, D1, R2, and KV.

## Repository Inventory

| Repository | Purpose | Deploy Target | Domain/Path |
|------------|---------|---------------|-------------|
| **ahump20/BSI** | Main brand site (Blaze Sports Intel) | Cloudflare Pages | `blazesportsintel.com` |
| **ahump20/BI** | Legacy/alternate site | Cloudflare Pages | TBD subdomain or archive |
| **ahump20/lone-star-legends-championship** | Event microsite | Cloudflare Pages | `blazesportsintel.com/lone-star-legends` |
| **ahump20/Blaze-College-Baseball** | College baseball coverage | Cloudflare Pages | `blazesportsintel.com/college-baseball` |
| **ahump20/blaze-worlds-github** | Track & Field Worlds coverage | Cloudflare Pages | `blazesportsintel.com/worlds` |
| **ahump20/live-sports-scoreboard-api** | Real-time scores API | Cloudflare Worker + KV/D1 | `api.blazesportsintel.com/scores` |

## Branch Standards

- **`main`**: Production branch; auto-deploys to Cloudflare on merge
- **`staging`** (optional): Preview environment; auto-deploys to staging URL
- **Feature branches**: `feature/*`, `fix/*` — require PR to merge
- **Branch Protection**: `main` requires 1 approval, CI passing, no force-push

## GitHub Actions Workflows

### 1. Cloudflare Pages Deployment (`.github/workflows/deploy-pages.yml`)

Deploys static sites to Cloudflare Pages. Use for:
- BSI (main site)
- BI (legacy site)
- lone-star-legends-championship
- Blaze-College-Baseball
- blaze-worlds-github

**Triggers:**
- Push to `main` or `staging`
- Pull requests to `main`

**Requirements:**
- `npm run build` script in `package.json`
- Build output in `./dist` directory

### 2. Cloudflare Workers Deployment (`.github/workflows/deploy-worker.yml`)

Deploys Workers with D1 database migrations. Use for:
- live-sports-scoreboard-api

**Triggers:**
- Push to `main` or `staging`
- Pull requests to `main`

**Features:**
- Runs D1 migrations on production deploys
- Environment-specific deployments (production/staging)

### 3. R2 Asset Sync (`.github/workflows/sync-r2.yml`)

Syncs static assets to Cloudflare R2 buckets.

**Triggers:**
- Manual workflow dispatch
- Push to `main` with changes to `assets/`, `media/`, or `public/images/`

## Required GitHub Secrets

Add these to **Settings → Secrets and variables → Actions** in each repository:

### Universal Secrets (all repos)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers/Pages/D1/R2/KV permissions | [Create token](https://dash.cloudflare.com/profile/api-tokens) with "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Find in Cloudflare dashboard URL or Workers overview |

### Repository-Specific Secrets

| Repository | Secret Name | Example Value | Description |
|------------|-------------|---------------|-------------|
| BSI, BI, lone-star-legends, etc. | `CLOUDFLARE_PAGES_PROJECT` | `bsi-main` | Cloudflare Pages project name |
| live-sports-scoreboard-api | `D1_DATABASE_NAME` | `bsi-scores` | D1 database name |
| Repos with media | `R2_BUCKET_NAME` | `bsi-media-prod` | R2 bucket name |

## Setup Instructions

### Step 1: Run Initialization Script

The `scripts/init-cloudflare-ci.sh` script automates secret setup and branch protection:

```bash
chmod +x scripts/init-cloudflare-ci.sh
./scripts/init-cloudflare-ci.sh
```

**Prerequisites:**
- GitHub CLI (`gh`) installed and authenticated
- `jq` installed (`brew install jq` on macOS)
- Cloudflare API token and account ID ready

**What it does:**
- Sets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in all 6 repos
- Enables branch protection on `main` (requires PR, 1 approval)
- Validates prerequisites before running

### Step 2: Add Repo-Specific Secrets

Use GitHub CLI to add project-specific secrets:

```bash
# BSI - Main site
gh secret set CLOUDFLARE_PAGES_PROJECT -b 'bsi-main' -R ahump20/BSI

# BI - Legacy site
gh secret set CLOUDFLARE_PAGES_PROJECT -b 'bsi-legacy' -R ahump20/BI

# Lone Star Legends
gh secret set CLOUDFLARE_PAGES_PROJECT -b 'lone-star-legends' -R ahump20/lone-star-legends-championship

# College Baseball
gh secret set CLOUDFLARE_PAGES_PROJECT -b 'blaze-college-baseball' -R ahump20/Blaze-College-Baseball

# Track & Field Worlds
gh secret set CLOUDFLARE_PAGES_PROJECT -b 'blaze-worlds' -R ahump20/blaze-worlds-github

# API - D1 and R2
gh secret set D1_DATABASE_NAME -b 'bsi-scores' -R ahump20/live-sports-scoreboard-api
gh secret set R2_BUCKET_NAME -b 'bsi-media-prod' -R ahump20/live-sports-scoreboard-api
```

### Step 3: Copy Workflow Files to Each Repo

Copy the appropriate workflow files from this repo to each target repo:

**For Pages repos (BSI, BI, lone-star-legends, Blaze-College-Baseball, blaze-worlds):**
```bash
cp .github/workflows/deploy-pages.yml ../path-to-repo/.github/workflows/
cp .github/workflows/sync-r2.yml ../path-to-repo/.github/workflows/  # if using R2
cp .github/pull_request_template.md ../path-to-repo/.github/
```

**For Worker repos (live-sports-scoreboard-api):**
```bash
cp .github/workflows/deploy-worker.yml ../path-to-repo/.github/workflows/
cp .github/pull_request_template.md ../path-to-repo/.github/
cp wrangler.toml.example ../path-to-repo/
```

### Step 4: Configure Wrangler for Workers

For `live-sports-scoreboard-api`:

1. Copy the example: `cp wrangler.toml.example wrangler.toml`
2. Update with your values:
   ```bash
   # Create D1 database
   wrangler d1 create bsi-scores
   # Note the database_id and update wrangler.toml

   # Create KV namespace
   wrangler kv:namespace create CACHE
   # Note the id and update wrangler.toml

   # Create R2 bucket
   wrangler r2 bucket create bsi-media-prod
   ```

### Step 5: Audit Build Scripts

Ensure each repo has a `build` script in `package.json`:

```bash
# Check if build script exists
cat package.json | jq '.scripts.build'

# If missing, add one (example for Vite)
npm pkg set scripts.build="vite build"

# Or for Next.js
npm pkg set scripts.build="next build"
```

### Step 6: Test with a PR

1. Create a test branch in BSI:
   ```bash
   git checkout -b test/ci-setup
   echo "# CI Test" >> TEST.md
   git add TEST.md
   git commit -m "test: validate CI pipeline"
   git push -u origin test/ci-setup
   ```

2. Open a PR via GitHub UI or CLI:
   ```bash
   gh pr create --title "Test: Validate CI Pipeline" --body "Testing Cloudflare CI/CD setup"
   ```

3. Verify:
   - [ ] GitHub Actions workflow runs
   - [ ] Cloudflare preview deployment succeeds
   - [ ] Preview URL is accessible

4. Merge and verify production deployment

## Cloudflare Resources Setup

### Create Cloudflare Pages Projects

For each static site repo:

```bash
# Option 1: Via Wrangler CLI
wrangler pages project create bsi-main
wrangler pages project create bsi-legacy
wrangler pages project create lone-star-legends
wrangler pages project create blaze-college-baseball
wrangler pages project create blaze-worlds

# Option 2: Via Dashboard
# Go to https://dash.cloudflare.com/pages
# Click "Create a project"
# Connect to GitHub repo (optional, or use direct upload via Actions)
```

### Create D1 Database

```bash
# Create database
wrangler d1 create bsi-scores

# Create migrations directory
mkdir -p migrations

# Example migration
cat > migrations/0001_initial_schema.sql <<EOF
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  score_home INTEGER NOT NULL,
  score_away INTEGER NOT NULL,
  status TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_id ON scores(game_id);
CREATE INDEX idx_updated_at ON scores(updated_at);
EOF

# Apply migration locally
wrangler d1 migrations apply bsi-scores --local

# Apply to production (done automatically by CI)
wrangler d1 migrations apply bsi-scores --remote
```

### Create KV Namespace

```bash
# Production namespace
wrangler kv:namespace create CACHE

# Staging namespace (optional)
wrangler kv:namespace create CACHE --env staging
```

### Create R2 Bucket

```bash
# Production bucket
wrangler r2 bucket create bsi-media-prod

# Staging bucket (optional)
wrangler r2 bucket create bsi-media-staging
```

## Monitoring & KPIs

### Key Metrics

- **CI Success Rate**: % of PRs passing CI on first run
- **Deploy Time**: P50/P95 from merge to live
- **Branch Protection Compliance**: % of commits via PR
- **Failed Deploys**: Alert on Slack/email if deploy fails

### GitHub Actions Status

View workflow runs:
```bash
gh run list --repo ahump20/BSI --limit 10
gh run view <run-id> --repo ahump20/BSI
```

### Cloudflare Deployment Logs

View deployment history in Cloudflare dashboard:
- Pages: `https://dash.cloudflare.com/<account-id>/pages`
- Workers: `https://dash.cloudflare.com/<account-id>/workers`

## Troubleshooting

### Common Issues

#### 1. "Failed to deploy to Cloudflare Pages"

**Check:**
- `CLOUDFLARE_API_TOKEN` has correct permissions
- `CLOUDFLARE_PAGES_PROJECT` matches actual project name
- Build output directory is correct (default: `./dist`)

**Fix:**
```bash
# Verify token permissions
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List Pages projects
wrangler pages project list

# Update build output directory in workflow if needed
# Edit .github/workflows/deploy-pages.yml
```

#### 2. "D1 migration failed"

**Check:**
- Migration SQL syntax is valid
- Database ID in `wrangler.toml` is correct
- Migration hasn't already been applied

**Fix:**
```bash
# List migrations
wrangler d1 migrations list bsi-scores

# Test migration locally first
wrangler d1 migrations apply bsi-scores --local

# View database content
wrangler d1 execute bsi-scores --command "SELECT * FROM sqlite_master WHERE type='table';"
```

#### 3. "npm ci failed"

**Check:**
- `package-lock.json` is committed
- Node version matches (20.x)
- No private packages without authentication

**Fix:**
```bash
# Regenerate package-lock.json
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
```

#### 4. "Branch protection preventing push"

**Expected behavior** - use PRs instead:
```bash
# Create branch and push
git checkout -b feature/my-change
git push -u origin feature/my-change

# Open PR
gh pr create
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI configuration changes

**Examples:**
```
feat(api): add real-time score updates via WebSocket
fix(baseball): correct ERA calculation for relief pitchers
docs(readme): add Cloudflare deployment instructions
ci(workflow): enable D1 migrations on staging deploys
```

## Next Steps

### Immediate (< 1 week)

- [ ] Run `init-cloudflare-ci.sh` to configure all repos
- [ ] Add repo-specific secrets via GitHub CLI
- [ ] Copy workflow files to each repository
- [ ] Create Cloudflare resources (Pages projects, D1, KV, R2)
- [ ] Test one PR in each repo to validate end-to-end

### Short-term (1-2 weeks)

- [ ] Add automated testing to workflows (unit, integration)
- [ ] Set up Cloudflare Web Analytics for all sites
- [ ] Configure custom domains and SSL certificates
- [ ] Add deployment notifications to Slack
- [ ] Create runbooks for common operations

### Long-term (1+ months)

- [ ] Implement blue-green deployments for zero-downtime
- [ ] Add performance budgets and Lighthouse CI
- [ ] Set up Cloudflare WAF rules for API protection
- [ ] Create automated rollback mechanism
- [ ] Build deployment dashboard with metrics

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Support

For issues or questions:
1. Check this documentation first
2. Search existing GitHub issues in the relevant repo
3. Create a new issue with detailed logs and steps to reproduce
4. Tag with `ci/cd` label for priority routing
