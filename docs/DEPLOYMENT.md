# Deployment Runbook

Version: 1.0.0
Platform: Cloudflare Pages + Functions
Last Updated: November 6, 2025

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Verification](#monitoring-and-verification)
- [Database Migrations](#database-migrations)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Post-Deployment Checklist](#post-deployment-checklist)

## Overview

Blaze Sports Intel uses **Cloudflare Pages** for hosting with **Cloudflare Functions** for API endpoints. The deployment process includes:

- **Source Control:** GitHub repository (ahump20/BSI)
- **Build System:** Cloudflare Pages automatic builds
- **API Layer:** Cloudflare Pages Functions (Cloudflare Workers runtime)
- **Database:** Cloudflare D1 (SQLite)
- **Cache:** Cloudflare KV
- **Storage:** Cloudflare R2
- **CDN:** Cloudflare global edge network

### Deployment Environments

| Environment | URL | Branch | Purpose |
|-------------|-----|--------|---------|
| Local | `localhost:8788` | `*` | Development and testing |
| Preview | `[commit-hash].blazesportsintel.pages.dev` | `feature/*` | PR review and testing |
| Staging | `staging.blazesportsintel.pages.dev` | `dev` | Pre-production validation |
| Production | `blazesportsintel.com` | `main` | Live site |

## Prerequisites

### Required Software

1. **Node.js** v20.x or higher
   ```bash
   node --version  # Should be ≥ v20.0.0
   ```

2. **npm** v10.x or higher
   ```bash
   npm --version  # Should be ≥ v10.0.0
   ```

3. **Wrangler CLI** (Cloudflare development toolkit)
   ```bash
   npm install -g wrangler@latest
   wrangler --version  # Should be ≥ v3.0.0
   ```

4. **Git** latest version
   ```bash
   git --version
   ```

### Required Access

- **GitHub:** Write access to ahump20/BSI repository
- **Cloudflare:** Admin access to Blaze Sports Intel account
- **Cloudflare API Token:** With Pages, Workers, D1, KV, and R2 permissions
- **API Keys:** SportsDataIO, MLB Stats API (stored in environment variables)

### Verification

Run this command to verify all prerequisites:

```bash
./scripts/verify-deployment-setup.sh
```

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/ahump20/BSI.git
cd BSI
```

### 2. Install Dependencies

```bash
npm ci
```

Use `npm ci` instead of `npm install` for reproducible builds.

### 3. Configure Wrangler

Login to Cloudflare:

```bash
wrangler login
```

This opens a browser window for OAuth authentication.

### 4. Set Up Environment Variables

#### Local Development (.dev.vars)

Create `.dev.vars` file for local development:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your API keys:

```ini
# Sports Data APIs
SPORTSDATA_API_KEY=your_sportsdata_key
MLB_STATS_API_KEY=your_mlb_key

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

**⚠️ Security:** Never commit `.dev.vars` to version control (already in .gitignore)

#### Production Secrets

Set production secrets using Wrangler:

```bash
# Set each secret individually
wrangler pages secret put SPORTSDATA_API_KEY --project-name blazesportsintel
wrangler pages secret put MLB_STATS_API_KEY --project-name blazesportsintel
wrangler pages secret put OPENAI_API_KEY --project-name blazesportsintel
wrangler pages secret put ANTHROPIC_API_KEY --project-name blazesportsintel

# Verify secrets (shows names only, not values)
wrangler pages secret list --project-name blazesportsintel
```

### 5. Configure Cloudflare Services

#### D1 Database

```bash
# Create D1 database (if not exists)
wrangler d1 create blazesports-db

# Run migrations
wrangler d1 execute blazesports-db --remote --file=./migrations/001-initial-schema.sql
wrangler d1 execute blazesports-db --remote --file=./migrations/002-add-indexes.sql
```

#### KV Namespaces

```bash
# Create KV namespaces
wrangler kv:namespace create "CACHE" --preview
wrangler kv:namespace create "CACHE" --env production

# Note the namespace IDs and update wrangler.toml
```

#### R2 Buckets

```bash
# Create R2 buckets
wrangler r2 bucket create blazesports-assets
wrangler r2 bucket create blazesports-backups
```

## Local Development

### Start Development Server

```bash
npm run dev
```

This starts Wrangler's local development server at `http://localhost:8788`

**Features:**
- Hot reload on file changes
- Simulated Cloudflare environment
- Local D1 database (SQLite)
- Local KV store
- Function debugging with source maps

### Testing Locally

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:accessibility # Accessibility tests

# Run with coverage
npm run test:coverage
```

### Build for Production

Test production build locally:

```bash
# Build static assets and functions
npm run build

# Preview production build
npm run preview
```

### Verify Build Artifacts

```bash
# Check output directory
ls -la dist/

# Verify critical files exist
ls dist/index.html
ls dist/css/
ls dist/js/
ls functions/
```

## Staging Deployment

### Automatic Preview Deployments

Every pull request automatically deploys to a preview URL:

```
https://[commit-hash].blazesportsintel.pages.dev
```

**Process:**
1. Push commits to feature branch
2. Create pull request
3. Cloudflare Pages builds automatically
4. Preview URL posted as PR comment
5. Test on preview URL
6. Merge when approved

### Manual Staging Deploy

Deploy to staging environment manually:

```bash
# Switch to dev branch
git checkout dev
git pull origin dev

# Build and deploy to staging
npm run build
wrangler pages deploy dist \
  --project-name blazesportsintel \
  --branch dev \
  --env staging

# Verify deployment
curl -I https://staging.blazesportsintel.pages.dev/health
```

### Staging Verification

Test all critical paths on staging:

```bash
# Run smoke tests
./scripts/smoke-test.sh https://staging.blazesportsintel.pages.dev

# Check endpoints
curl https://staging.blazesportsintel.pages.dev/api/mlb/standings
curl https://staging.blazesportsintel.pages.dev/api/nfl/standings
curl https://staging.blazesportsintel.pages.dev/api/health

# Run Lighthouse audit
npx lighthouse https://staging.blazesportsintel.pages.dev --view
```

## Production Deployment

### Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Staging deployment tested and verified
- [ ] Database migrations prepared (if applicable)
- [ ] Environment variables verified
- [ ] Rollback plan prepared
- [ ] Team notified of deployment window
- [ ] Monitoring dashboard open

### Active GitHub Workflows (as of November 2025)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy-pages.yml` | push to main | **Canonical** deployment to Cloudflare Pages |
| `api-tests.yml` | push | API endpoint validation |
| `data-freshness.yml` | scheduled | Data quality monitoring |
| `lighthouse-ci.yml` | push | Performance metrics |
| `accessibility-tests.yml` | PR | WCAG compliance |
| `workers-compat-lint.yml` | push | Worker compatibility checks |

### Method 1: Automated Deployment (Recommended)

**Via GitHub:**

1. **Merge to main branch**
   ```bash
   git checkout main
   git pull origin main
   git merge dev
   git push origin main
   ```

2. **deploy-pages.yml auto-deploys**
   - Triggered by push to main
   - Builds with pnpm
   - Deploys `public/` to Cloudflare Pages
   - Deployment completes in 2-5 minutes

3. **Monitor deployment**
   - Visit [Cloudflare Dashboard > Pages](https://dash.cloudflare.com/pages)
   - Check build logs for errors
   - Verify deployment status

### Method 2: Manual Deployment

**Via Wrangler CLI:**

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Build production assets
npm run build

# Deploy to production
wrangler pages deploy dist \
  --project-name blazesportsintel \
  --branch main \
  --commit-message "Deploy v1.0.0" \
  --commit-dirty=false

# Deployment info displayed:
# Deployment ID: abc123def456
# URL: https://blazesportsintel.com
```

### Post-Deployment Verification

#### 1. Health Check

```bash
curl https://blazesportsintel.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T22:00:00Z",
  "services": {
    "database": "operational",
    "cache": "operational"
  }
}
```

#### 2. Critical Endpoints

```bash
# Test MLB endpoint
curl https://blazesportsintel.com/api/mlb/standings | jq '.standings | length'

# Test NFL endpoint
curl https://blazesportsintel.com/api/nfl/standings | jq '.standings | length'

# Test AI Copilot
curl -X POST https://blazesportsintel.com/api/copilot/status
```

#### 3. Frontend Verification

Open browser and verify:
- [ ] Homepage loads correctly
- [ ] All images and styles load
- [ ] Navigation works
- [ ] MLB dashboard displays data
- [ ] NFL dashboard displays data
- [ ] Search functionality works
- [ ] No console errors

#### 4. Performance Check

```bash
# Run Lighthouse audit
npx lighthouse https://blazesportsintel.com \
  --only-categories=performance,accessibility,seo \
  --output=html \
  --output-path=./lighthouse-report.html \
  --view

# Expected scores:
# Performance: 90+
# Accessibility: 95+
# SEO: 90+
```

## Rollback Procedures

### Scenario 1: Recent Deployment Issues

If issues detected within 1 hour of deployment:

#### Via Cloudflare Dashboard

1. Navigate to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Select "blazesportsintel" project
3. Click "Deployments" tab
4. Find previous working deployment
5. Click "..." menu > "Rollback to this deployment"
6. Confirm rollback

#### Via Wrangler CLI

```bash
# List recent deployments
wrangler pages deployment list --project-name blazesportsintel

# Rollback to specific deployment
wrangler pages deployment rollback [deployment-id] \
  --project-name blazesportsintel

# Example:
wrangler pages deployment rollback abc123def456 \
  --project-name blazesportsintel
```

### Scenario 2: Database Migration Issues

If database migration fails:

```bash
# 1. Identify last good migration
wrangler d1 execute blazesports-db --remote \
  --command="SELECT * FROM _migrations ORDER BY applied_at DESC LIMIT 5;"

# 2. Rollback migration (if rollback script exists)
wrangler d1 execute blazesports-db --remote \
  --file=./migrations/002-rollback.sql

# 3. Verify database state
wrangler d1 execute blazesports-db --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### Scenario 3: Partial Outage

If only specific services affected:

1. **Identify affected service**
   ```bash
   curl https://blazesportsintel.com/api/health
   ```

2. **Check service-specific logs**
   ```bash
   wrangler pages deployment tail --project-name blazesportsintel
   ```

3. **Disable affected feature** (feature flag)
   ```bash
   wrangler kv:key put "feature:copilot:enabled" "false" \
     --namespace-id=YOUR_NAMESPACE_ID
   ```

4. **Deploy fix**
   ```bash
   # Quick fix and deploy
   git checkout -b hotfix/fix-copilot
   # Make changes
   git commit -m "fix(copilot): resolve API timeout issue"
   git push origin hotfix/fix-copilot
   # Create PR with "HOTFIX" label
   # Merge after expedited review
   ```

## Monitoring and Verification

### Real-Time Monitoring

#### Cloudflare Analytics

- **URL:** [dash.cloudflare.com/analytics](https://dash.cloudflare.com/analytics)
- **Metrics:**
  - Requests per second
  - Bandwidth usage
  - Response time (p50, p95, p99)
  - Error rate (4xx, 5xx)
  - Cache hit rate

#### Wrangler Tail (Live Logs)

```bash
# Stream live logs
wrangler pages deployment tail --project-name blazesportsintel

# Filter by status
wrangler pages deployment tail --project-name blazesportsintel \
  --status error

# Filter by method
wrangler pages deployment tail --project-name blazesportsintel \
  --method POST
```

### Performance Monitoring

#### Core Web Vitals

Monitor from Real User Monitoring (RUM):

```bash
# Query Analytics Engine
curl -X POST "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/analytics_engine/sql" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT AVG(lcp) as avg_lcp, AVG(fid) as avg_fid, AVG(cls) as avg_cls FROM web_vitals WHERE timestamp > NOW() - INTERVAL '\''1 hour'\'';"
  }'
```

#### API Response Times

```bash
# Test endpoint latency
time curl -s https://blazesportsintel.com/api/mlb/standings > /dev/null

# Expected: < 500ms
```

### Error Tracking

#### Check Error Rates

```bash
# Last 24 hours
wrangler pages deployment tail --project-name blazesportsintel \
  --status error \
  --since 24h \
  | wc -l

# Expected: < 10 errors per 10,000 requests (0.1%)
```

## Database Migrations

### Creating a Migration

```bash
# Create new migration file
npm run migration:create add_player_stats_table

# Edit generated file in migrations/
# Example: migrations/003-add-player-stats.sql
```

**Migration file format:**

```sql
-- migrations/003-add-player-stats.sql

-- Up migration
CREATE TABLE IF NOT EXISTS player_stats (
  player_id INTEGER PRIMARY KEY,
  season INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  games_played INTEGER DEFAULT 0,
  batting_average REAL DEFAULT 0.000,
  home_runs INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_stats_season ON player_stats(season);
CREATE INDEX idx_player_stats_team ON player_stats(team_id);

-- Rollback migration (in separate file: 003-rollback.sql)
-- DROP TABLE player_stats;
```

### Running Migrations

```bash
# Test on local D1
wrangler d1 execute blazesports-db --local \
  --file=./migrations/003-add-player-stats.sql

# Verify locally
wrangler d1 execute blazesports-db --local \
  --command="SELECT name FROM sqlite_master WHERE type='table';"

# Run on production (after testing)
wrangler d1 execute blazesports-db --remote \
  --file=./migrations/003-add-player-stats.sql

# Record migration
wrangler d1 execute blazesports-db --remote \
  --command="INSERT INTO _migrations (version, name, applied_at) VALUES (3, 'add_player_stats_table', CURRENT_TIMESTAMP);"
```

### Migration Checklist

Before running production migrations:

- [ ] Migration tested on local D1
- [ ] Rollback script prepared
- [ ] Database backup created
- [ ] Team notified
- [ ] Deployment window scheduled
- [ ] Monitoring dashboard open

## Environment Variables

### Managing Secrets

#### List all secrets

```bash
wrangler pages secret list --project-name blazesportsintel
```

#### Add/Update secret

```bash
wrangler pages secret put SECRET_NAME --project-name blazesportsintel
# Prompts for value (hidden input)
```

#### Delete secret

```bash
wrangler pages secret delete SECRET_NAME --project-name blazesportsintel
```

### Required Environment Variables

**Production:**

| Variable | Description | Required |
|----------|-------------|----------|
| `SPORTSDATA_API_KEY` | SportsDataIO API key | Yes |
| `MLB_STATS_API_KEY` | MLB Stats API key | No (uses public endpoints) |
| `OPENAI_API_KEY` | OpenAI API for Copilot | Yes (for AI features) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API | Yes (for AI features) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Yes |
| `DATABASE_URL` | D1 database connection | Auto-configured |
| `KV_NAMESPACE_ID` | KV namespace for cache | Auto-configured |
| `R2_BUCKET_NAME` | R2 bucket for assets | Auto-configured |

## Troubleshooting

### Build Failures

#### Issue: Build times out

```bash
# Check build logs
wrangler pages deployment tail --project-name blazesportsintel

# Common causes:
# - Large dependencies (reduce bundle size)
# - Infinite loops in build scripts
# - Network timeouts fetching dependencies
```

**Solution:**

```bash
# Optimize build
npm run build -- --no-minify  # Debug build issues
npm run build -- --analyze    # Analyze bundle size
```

#### Issue: Module not found

```bash
# Verify dependencies installed
npm ci

# Check for missing files
npm run typecheck
```

### Deployment Failures

#### Issue: Functions not deploying

```bash
# Verify functions directory structure
ls -R functions/

# Check wrangler.toml configuration
cat wrangler.toml | grep -A 5 "functions"
```

#### Issue: Environment variables not available

```bash
# Verify secrets set
wrangler pages secret list --project-name blazesportsintel

# Re-add if missing
wrangler pages secret put MISSING_SECRET --project-name blazesportsintel
```

### Runtime Errors

#### Issue: 500 Internal Server Error

```bash
# Check real-time logs
wrangler pages deployment tail --project-name blazesportsintel --status error

# Common causes:
# - Unhandled exceptions
# - Database connection errors
# - Missing environment variables
```

#### Issue: API returning stale data

```bash
# Clear KV cache
wrangler kv:key delete "cache:mlb:standings" \
  --namespace-id=YOUR_NAMESPACE_ID

# Verify data freshness
curl https://blazesportsintel.com/api/mlb/standings | jq '.lastUpdated'
```

### Performance Issues

#### Issue: Slow response times

```bash
# Check Cloudflare Analytics
# Identify slow endpoints

# Enable detailed timing
wrangler pages deployment tail --project-name blazesportsintel \
  | grep "duration"
```

**Solutions:**

1. **Add caching**
   ```javascript
   // Cache responses in KV
   const cached = await env.CACHE.get(cacheKey);
   if (cached) return new Response(cached);
   ```

2. **Optimize database queries**
   ```sql
   -- Add indexes
   CREATE INDEX idx_games_date ON games(game_date);
   ```

3. **Reduce bundle size**
   ```bash
   npm run build -- --analyze
   # Remove unused dependencies
   ```

## Post-Deployment Checklist

### Immediate (0-15 minutes)

- [ ] Deployment completed successfully
- [ ] Health check returns 200 OK
- [ ] Homepage loads correctly
- [ ] Critical API endpoints responding
- [ ] No 5xx errors in logs
- [ ] Cache hit rate normal (>80%)
- [ ] Response times under 500ms

### Short-term (15-60 minutes)

- [ ] All pages verified manually
- [ ] Search functionality tested
- [ ] AI Copilot responding
- [ ] Database queries performing well
- [ ] No unusual error patterns
- [ ] Lighthouse scores meet targets
- [ ] Mobile site tested
- [ ] Social share previews working

### Long-term (1-24 hours)

- [ ] Monitor error rates (should be <0.1%)
- [ ] Check performance metrics (p95 < 1s)
- [ ] Verify cache efficiency (hit rate >85%)
- [ ] Monitor user feedback
- [ ] Check third-party API usage
- [ ] Verify data freshness
- [ ] Review analytics for anomalies

### Weekly

- [ ] Review deployment logs
- [ ] Check for dependency updates
- [ ] Verify backup integrity
- [ ] Review security advisories
- [ ] Update documentation if needed

---

## Emergency Contacts

**On-Call Engineer:** Austin Humphrey
- **Email:** austin@blazesportsintel.com
- **Phone:** (210) 273-5538

**Cloudflare Support:**
- **Dashboard:** [dash.cloudflare.com/support](https://dash.cloudflare.com/support)
- **Docs:** [developers.cloudflare.com](https://developers.cloudflare.com)

**Status Pages:**
- **Cloudflare:** [cloudflarestatus.com](https://www.cloudflarestatus.com)
- **Blaze Sports Intel:** [status.blazesportsintel.com](https://status.blazesportsintel.com)

---

**Last Updated:** November 6, 2025
**Runbook Version:** 1.0.0
**Platform:** Cloudflare Pages + Functions
**Maintainer:** Austin Humphrey
