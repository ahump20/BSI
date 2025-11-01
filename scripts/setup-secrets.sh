#!/usr/bin/env bash
set -euo pipefail

# Setup script for repository-specific GitHub secrets
# This script generates the exact commands you need to run

echo "🔥 Blaze Sports Intel - Repository-Specific Secrets Setup"
echo ""
echo "This script will guide you through setting up repository-specific secrets."
echo "Run the generated commands to complete the setup."
echo ""

# Check for gh CLI
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) is required but not installed."
  echo "   Install: https://cli.github.com"
  exit 1
fi

echo "✅ GitHub CLI detected"
echo ""

# Repository configurations
declare -A PAGES_PROJECTS=(
  ["ahump20/BSI"]="bsi-main"
  ["ahump20/BI"]="bsi-legacy"
  ["ahump20/lone-star-legends-championship"]="lone-star-legends"
  ["ahump20/Blaze-College-Baseball"]="blaze-college-baseball"
  ["ahump20/blaze-worlds-github"]="blaze-worlds"
)

WORKER_REPO="ahump20/live-sports-scoreboard-api"
D1_DATABASE="bsi-scores"
R2_BUCKET_PROD="bsi-media-prod"
R2_BUCKET_STAGING="bsi-media-staging"

# Generate commands file
COMMANDS_FILE="setup-secrets-commands.sh"

cat > "$COMMANDS_FILE" <<'HEADER'
#!/usr/bin/env bash
# Generated secrets setup commands
# Review and execute this script to set all repository secrets

set -euo pipefail

echo "🔐 Setting up repository-specific secrets..."
echo ""

HEADER

echo "📝 Generating setup commands..."
echo ""

# Pages repositories
echo "# Cloudflare Pages Projects" >> "$COMMANDS_FILE"
for repo in "${!PAGES_PROJECTS[@]}"; do
  project="${PAGES_PROJECTS[$repo]}"
  echo "echo \"Setting CLOUDFLARE_PAGES_PROJECT for $repo...\"" >> "$COMMANDS_FILE"
  echo "gh secret set CLOUDFLARE_PAGES_PROJECT -b '$project' -R $repo" >> "$COMMANDS_FILE"
  echo "" >> "$COMMANDS_FILE"
done

# Worker repository
cat >> "$COMMANDS_FILE" <<WORKER

# Cloudflare Worker - D1 Database
echo "Setting D1_DATABASE_NAME for $WORKER_REPO..."
gh secret set D1_DATABASE_NAME -b '$D1_DATABASE' -R $WORKER_REPO

# Cloudflare Worker - R2 Buckets
echo "Setting R2_BUCKET_NAME for $WORKER_REPO..."
gh secret set R2_BUCKET_NAME -b '$R2_BUCKET_PROD' -R $WORKER_REPO

WORKER

# Optional: R2 for other repos (if they have media)
cat >> "$COMMANDS_FILE" <<'OPTIONAL'

# Optional: R2 buckets for repos with media assets
# Uncomment these lines if you want to use R2 sync for specific repos

# echo "Setting R2_BUCKET_NAME for BSI..."
# gh secret set R2_BUCKET_NAME -b 'bsi-media-prod' -R ahump20/BSI

# echo "Setting R2_BUCKET_NAME for BI..."
# gh secret set R2_BUCKET_NAME -b 'bsi-media-prod' -R ahump20/BI

OPTIONAL

cat >> "$COMMANDS_FILE" <<'FOOTER'

echo ""
echo "✅ All repository-specific secrets have been set!"
echo ""
echo "Next steps:"
echo "  1. Create Cloudflare Pages projects (see CLOUDFLARE_CI_CD_SETUP.md)"
echo "  2. Create D1 database: wrangler d1 create bsi-scores"
echo "  3. Create R2 buckets: wrangler r2 bucket create bsi-media-prod"
echo "  4. Test deployments by opening PRs in each repo"
FOOTER

chmod +x "$COMMANDS_FILE"

echo "✅ Commands generated in: $COMMANDS_FILE"
echo ""
echo "Review the file and run:"
echo "  ./$COMMANDS_FILE"
echo ""
echo "Or run commands individually as needed."
echo ""

# Also generate a checklist
CHECKLIST_FILE="setup-checklist.md"

cat > "$CHECKLIST_FILE" <<'CHECKLIST'
# Cloudflare CI/CD Setup Checklist

## Phase 1: Universal Secrets (via init-cloudflare-ci.sh)
- [ ] Run `./scripts/init-cloudflare-ci.sh`
- [ ] Verify `CLOUDFLARE_API_TOKEN` set in all 6 repos
- [ ] Verify `CLOUDFLARE_ACCOUNT_ID` set in all 6 repos
- [ ] Verify branch protection enabled on `main` in all repos

## Phase 2: Repository-Specific Secrets
- [ ] Run `./scripts/setup-secrets.sh` to generate commands
- [ ] Execute `./setup-secrets-commands.sh`
- [ ] Verify secrets in GitHub UI for each repo

### Pages Projects Secrets
- [ ] `ahump20/BSI` → `CLOUDFLARE_PAGES_PROJECT=bsi-main`
- [ ] `ahump20/BI` → `CLOUDFLARE_PAGES_PROJECT=bsi-legacy`
- [ ] `ahump20/lone-star-legends-championship` → `CLOUDFLARE_PAGES_PROJECT=lone-star-legends`
- [ ] `ahump20/Blaze-College-Baseball` → `CLOUDFLARE_PAGES_PROJECT=blaze-college-baseball`
- [ ] `ahump20/blaze-worlds-github` → `CLOUDFLARE_PAGES_PROJECT=blaze-worlds`

### Worker Secrets
- [ ] `ahump20/live-sports-scoreboard-api` → `D1_DATABASE_NAME=bsi-scores`
- [ ] `ahump20/live-sports-scoreboard-api` → `R2_BUCKET_NAME=bsi-media-prod`

## Phase 3: Cloudflare Resources

### Create Pages Projects
```bash
wrangler pages project create bsi-main
wrangler pages project create bsi-legacy
wrangler pages project create lone-star-legends
wrangler pages project create blaze-college-baseball
wrangler pages project create blaze-worlds
```

- [ ] bsi-main
- [ ] bsi-legacy
- [ ] lone-star-legends
- [ ] blaze-college-baseball
- [ ] blaze-worlds

### Create D1 Database
```bash
wrangler d1 create bsi-scores
# Note the database_id and update wrangler.toml
```

- [ ] D1 database created
- [ ] Database ID saved
- [ ] `wrangler.toml` updated with database_id

### Create KV Namespace
```bash
wrangler kv:namespace create CACHE
wrangler kv:namespace create CACHE --env staging
```

- [ ] Production KV namespace created
- [ ] Staging KV namespace created (optional)
- [ ] Namespace IDs saved

### Create R2 Buckets
```bash
wrangler r2 bucket create bsi-media-prod
wrangler r2 bucket create bsi-media-staging
```

- [ ] Production R2 bucket created
- [ ] Staging R2 bucket created (optional)

## Phase 4: Workflow Distribution
- [ ] Run `./scripts/distribute-workflows.sh`
- [ ] Verify workflows copied to all 6 repos
- [ ] Check that branches created: `feat/cloudflare-ci-cd-setup`

## Phase 5: Configuration Files

### BSI (Pages)
- [ ] Verify `npm run build` exists in package.json
- [ ] Build output directory is `./dist`
- [ ] Test local build: `npm install && npm run build`

### BI (Pages)
- [ ] Verify `npm run build` exists in package.json
- [ ] Build output directory is `./dist`
- [ ] Test local build: `npm install && npm run build`

### lone-star-legends-championship (Pages)
- [ ] Verify `npm run build` exists in package.json
- [ ] Build output directory is `./dist`
- [ ] Test local build: `npm install && npm run build`

### Blaze-College-Baseball (Pages)
- [ ] Verify `npm run build` exists in package.json
- [ ] Build output directory is `./dist`
- [ ] Test local build: `npm install && npm run build`

### blaze-worlds-github (Pages)
- [ ] Verify `npm run build` exists in package.json
- [ ] Build output directory is `./dist`
- [ ] Test local build: `npm install && npm run build`

### live-sports-scoreboard-api (Worker)
- [ ] Copy `wrangler.toml.example` to `wrangler.toml`
- [ ] Update `database_id` with actual D1 database ID
- [ ] Update `id` with actual KV namespace ID
- [ ] Test local worker: `wrangler dev`

## Phase 6: PR Testing

### Create Test PRs
```bash
# BSI
cd ../BSI
git checkout -b test/ci-validation
echo "# CI Test" >> CI_TEST.md
git add CI_TEST.md
git commit -m "test: validate CI pipeline"
git push -u origin test/ci-validation
gh pr create --title "Test: Validate CI Pipeline"

# Repeat for other repos as needed
```

- [ ] Test PR created in BSI
- [ ] CI workflow runs successfully
- [ ] Cloudflare preview deployment succeeds
- [ ] Preview URL accessible

## Phase 7: Production Deployment

### BSI (Main Site)
- [ ] Merge CI setup PR to main
- [ ] Verify production deployment
- [ ] Test `blazesportsintel.com` accessibility
- [ ] Verify SSL certificate

### Other Repos
- [ ] Merge CI setup PRs
- [ ] Verify deployments
- [ ] Test all preview URLs
- [ ] Configure custom domains (if applicable)

## Phase 8: Post-Deployment

- [ ] Monitor deployment logs for 24 hours
- [ ] Document any issues or adjustments needed
- [ ] Update team documentation
- [ ] Schedule training session on new CI/CD process
- [ ] Set up monitoring/alerting (optional)

## Verification Commands

### Check Secrets
```bash
gh secret list -R ahump20/BSI
gh secret list -R ahump20/BI
gh secret list -R ahump20/lone-star-legends-championship
gh secret list -R ahump20/Blaze-College-Baseball
gh secret list -R ahump20/blaze-worlds-github
gh secret list -R ahump20/live-sports-scoreboard-api
```

### Check Workflow Runs
```bash
gh run list -R ahump20/BSI --limit 5
gh run watch -R ahump20/BSI
```

### Check Cloudflare Resources
```bash
wrangler pages project list
wrangler d1 list
wrangler kv:namespace list
wrangler r2 bucket list
```

---

## Timeline Estimate

- **Phase 1**: 15 minutes
- **Phase 2**: 10 minutes
- **Phase 3**: 30 minutes
- **Phase 4**: 15 minutes
- **Phase 5**: 30 minutes
- **Phase 6**: 45 minutes
- **Phase 7**: 30 minutes
- **Phase 8**: Ongoing

**Total**: ~3 hours initial setup + ongoing monitoring

CHECKLIST

echo "📋 Checklist generated in: $CHECKLIST_FILE"
echo ""
echo "Track your progress with:"
echo "  cat $CHECKLIST_FILE"
