# Cloudflare CI/CD Quick Start Guide

Get your Cloudflare-based CI/CD pipeline running in 30 minutes or less.

## Prerequisites

- [ ] GitHub CLI (`gh`) installed and authenticated
- [ ] `jq` installed (`brew install jq` on macOS)
- [ ] Cloudflare account with Workers/Pages access
- [ ] Cloudflare API token created ([guide](https://dash.cloudflare.com/profile/api-tokens))
- [ ] All 6 repos cloned locally (optional, for workflow distribution)

## 5-Step Setup

### Step 1: Set Universal Secrets (5 min)

Run the initialization script to set API tokens and enable branch protection:

```bash
cd BSI
chmod +x scripts/init-cloudflare-ci.sh
./scripts/init-cloudflare-ci.sh
```

**You'll be prompted for:**
- Cloudflare API Token
- Cloudflare Account ID

**This script will:**
- Set `CLOUDFLARE_API_TOKEN` in all 6 repos
- Set `CLOUDFLARE_ACCOUNT_ID` in all 6 repos
- Enable branch protection on `main` (requires PR + approval)

### Step 2: Set Repository-Specific Secrets (5 min)

Generate and run commands to set project-specific secrets:

```bash
./scripts/setup-secrets.sh
# Review the generated file
./setup-secrets-commands.sh
```

**This sets:**
- `CLOUDFLARE_PAGES_PROJECT` for each Pages repo
- `D1_DATABASE_NAME` for Worker repo
- `R2_BUCKET_NAME` for repos with media

### Step 3: Create Cloudflare Resources (10 min)

#### Pages Projects
```bash
wrangler pages project create bsi-main
wrangler pages project create bsi-legacy
wrangler pages project create lone-star-legends
wrangler pages project create blaze-college-baseball
wrangler pages project create blaze-worlds
```

#### D1 Database (for API)
```bash
wrangler d1 create bsi-scores
# Note the database_id output!
```

#### KV Namespace (for API caching)
```bash
wrangler kv:namespace create CACHE
# Note the namespace id output!
```

#### R2 Bucket (for media)
```bash
wrangler r2 bucket create bsi-media-prod
```

### Step 4: Distribute Workflows to All Repos (5 min)

Copy workflow files to all repositories:

```bash
# Option A: Automated distribution (if all repos cloned locally)
./scripts/distribute-workflows.sh

# Option B: Manual copy per repo
cd ../BI
cp ../BSI/.github/workflows/deploy-pages.yml .github/workflows/
cp ../BSI/.github/workflows/sync-r2.yml .github/workflows/
cp ../BSI/.github/pull_request_template.md .github/
cp ../BSI/CLOUDFLARE_CI_CD_SETUP.md .
git add .github/ CLOUDFLARE_CI_CD_SETUP.md
git commit -m "feat(ci): add Cloudflare CI/CD workflows"
git push

# Repeat for other repos...
```

### Step 5: Test with a PR (5 min)

Validate the pipeline end-to-end:

```bash
cd BSI
git checkout -b test/ci-validation
echo "# CI Test" >> CI_TEST.md
git add CI_TEST.md
git commit -m "test: validate CI pipeline"
git push -u origin test/ci-validation
```

**Then:**
1. Open PR via GitHub UI or `gh pr create`
2. Wait for CI to run
3. Check for Cloudflare preview URL in PR
4. Merge if successful
5. Verify production deployment

## Troubleshooting

### "Failed to deploy to Cloudflare Pages"

**Check:**
```bash
# Verify secrets are set
gh secret list -R ahump20/BSI

# Check Pages project exists
wrangler pages project list

# Verify build command
cd ../BSI
npm install
npm run build  # Should create ./dist directory
ls -la dist/
```

### "D1 migration failed"

**Fix:**
```bash
# Test migration locally first
cd live-sports-scoreboard-api
wrangler d1 migrations apply bsi-scores --local

# Check migration syntax
cat migrations/0001_initial_schema.sql

# Apply manually if needed
wrangler d1 migrations apply bsi-scores --remote
```

### "npm ci failed"

**Fix:**
```bash
# Ensure package-lock.json exists and is committed
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
git push
```

## What's Next?

✅ **Immediate**: You're deployed! Monitor your first few deployments.

🔜 **This Week**:
- [ ] Configure custom domains
- [ ] Set up SSL certificates
- [ ] Add deployment notifications (Slack/email)
- [ ] Review and merge PRs in other repos

📅 **This Month**:
- [ ] Add automated testing to workflows
- [ ] Set up Cloudflare Web Analytics
- [ ] Implement performance monitoring
- [ ] Create runbooks for common operations

## Commands Cheat Sheet

```bash
# Check workflow runs
gh run list -R ahump20/BSI --limit 5
gh run watch -R ahump20/BSI

# View workflow logs
gh run view <run-id> --log

# Check secrets
gh secret list -R ahump20/BSI

# Cloudflare CLI
wrangler pages deployment list --project-name=bsi-main
wrangler deployments list  # For Workers
wrangler d1 list
wrangler kv:namespace list
wrangler r2 bucket list

# Manual deploy (if needed)
wrangler pages deploy ./dist --project-name=bsi-main
wrangler deploy  # For Workers
```

## Full Documentation

- **Complete Setup Guide**: `CLOUDFLARE_CI_CD_SETUP.md`
- **Repo-Specific Configs**: `REPO_CONFIGURATIONS.md`
- **Setup Checklist**: Run `./scripts/setup-secrets.sh` to generate

## Getting Help

1. Check the full docs: `CLOUDFLARE_CI_CD_SETUP.md`
2. Review repo configs: `REPO_CONFIGURATIONS.md`
3. Search GitHub Actions logs: `gh run list -R <repo>`
4. Check Cloudflare dashboard logs
5. Create issue with `ci/cd` label

---

**Time to first deployment**: 30 minutes
**Time to all repos deployed**: 2-3 hours

You've got this! 🔥
