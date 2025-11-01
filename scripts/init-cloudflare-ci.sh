#!/usr/bin/env bash
set -euo pipefail

REPOS=(
  "ahump20/BSI"
  "ahump20/BI"
  "ahump20/lone-star-legends-championship"
  "ahump20/Blaze-College-Baseball"
  "ahump20/blaze-worlds-github"
  "ahump20/live-sports-scoreboard-api"
)

echo "🔥 Blaze Sports Intel CI/CD Initialization"
echo ""

# Check prerequisites
command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI (gh) required. Install: https://cli.github.com"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "❌ jq required. Install: brew install jq"; exit 1; }

echo "✅ Prerequisites satisfied"
echo ""

# Prompt for secrets
read -sp "Cloudflare API Token: " CF_TOKEN
echo ""
read -p "Cloudflare Account ID: " CF_ACCOUNT_ID
echo ""

for REPO in "${REPOS[@]}"; do
  echo "📦 Processing $REPO..."

  # Set secrets
  echo "$CF_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN -R "$REPO"
  echo "$CF_ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID -R "$REPO"

  # Enable branch protection on main
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/$REPO/branches/main/protection" \
    -f required_status_checks='{"strict":true,"contexts":[]}' \
    -f enforce_admins=false \
    -f required_pull_request_reviews='{"required_approving_review_count":1}' \
    -f restrictions=null \
    2>/dev/null || echo "⚠️  Branch protection may already be enabled"

  echo "✅ $REPO configured"
  echo ""
done

echo "🎉 All repos initialized. Next steps:"
echo "  1. Add repo-specific secrets (CLOUDFLARE_PAGES_PROJECT, D1_DATABASE_NAME, R2_BUCKET_NAME)"
echo "  2. Copy workflow YAML files to each repo's .github/workflows/"
echo "  3. Test a PR in each repo to validate CI"
echo ""
echo "Example secrets to add per repo:"
echo "  - BSI: gh secret set CLOUDFLARE_PAGES_PROJECT -b 'bsi-main' -R ahump20/BSI"
echo "  - live-sports-scoreboard-api: gh secret set D1_DATABASE_NAME -b 'bsi-scores' -R ahump20/live-sports-scoreboard-api"
echo "  - BSI: gh secret set R2_BUCKET_NAME -b 'bsi-media-prod' -R ahump20/BSI"
