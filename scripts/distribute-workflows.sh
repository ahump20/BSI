#!/usr/bin/env bash
set -euo pipefail

# Distribution script to copy CI/CD workflows to all Blaze Sports Intel repos
# Run this from the BSI repo root after cloning all other repos locally

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BSI_ROOT="$(dirname "$SCRIPT_DIR")"

# Repository paths (adjust these based on where you cloned the repos)
REPOS_BASE="${REPOS_BASE:-$(dirname "$BSI_ROOT")}"

PAGES_REPOS=(
  "BI"
  "lone-star-legends-championship"
  "Blaze-College-Baseball"
  "blaze-worlds-github"
)

WORKER_REPOS=(
  "live-sports-scoreboard-api"
)

echo "🔥 Distributing Cloudflare CI/CD workflows to all repos"
echo "Base directory: $REPOS_BASE"
echo ""

# Verify source files exist
if [[ ! -f "$BSI_ROOT/.github/workflows/deploy-pages.yml" ]]; then
  echo "❌ Source workflow files not found in BSI repo"
  echo "   Run this script from the BSI repository root"
  exit 1
fi

echo "✅ Source files validated"
echo ""

# Function to copy files to a repo
copy_workflows() {
  local repo_name=$1
  local workflow_type=$2
  local repo_path="$REPOS_BASE/$repo_name"

  echo "📦 Processing $repo_name ($workflow_type)..."

  # Check if repo exists
  if [[ ! -d "$repo_path" ]]; then
    echo "⚠️  Repository not found at $repo_path"
    echo "   Clone it with: gh repo clone ahump20/$repo_name $repo_path"
    echo ""
    return
  fi

  # Create .github/workflows directory
  mkdir -p "$repo_path/.github/workflows"
  mkdir -p "$repo_path/.github"

  # Copy appropriate workflow files
  if [[ "$workflow_type" == "pages" ]]; then
    cp "$BSI_ROOT/.github/workflows/deploy-pages.yml" "$repo_path/.github/workflows/"
    cp "$BSI_ROOT/.github/workflows/sync-r2.yml" "$repo_path/.github/workflows/"
    echo "   ✓ Copied deploy-pages.yml and sync-r2.yml"
  elif [[ "$workflow_type" == "worker" ]]; then
    cp "$BSI_ROOT/.github/workflows/deploy-worker.yml" "$repo_path/.github/workflows/"
    cp "$BSI_ROOT/.github/workflows/sync-r2.yml" "$repo_path/.github/workflows/"
    cp "$BSI_ROOT/wrangler.toml.example" "$repo_path/"
    echo "   ✓ Copied deploy-worker.yml, sync-r2.yml, and wrangler.toml.example"
  fi

  # Copy PR template
  cp "$BSI_ROOT/.github/pull_request_template.md" "$repo_path/.github/"
  echo "   ✓ Copied pull_request_template.md"

  # Copy documentation
  cp "$BSI_ROOT/CLOUDFLARE_CI_CD_SETUP.md" "$repo_path/"
  echo "   ✓ Copied CLOUDFLARE_CI_CD_SETUP.md"

  # Git operations
  cd "$repo_path"

  # Check if on main branch
  current_branch=$(git branch --show-current)
  if [[ "$current_branch" != "main" ]]; then
    echo "⚠️  Not on main branch (currently on $current_branch)"
    echo "   Switch with: cd $repo_path && git checkout main"
    echo ""
    return
  fi

  # Pull latest changes
  git pull origin main 2>/dev/null || echo "   ℹ️  Could not pull from origin"

  # Create feature branch
  branch_name="feat/cloudflare-ci-cd-setup"
  if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    echo "   ℹ️  Branch $branch_name already exists, using it"
    git checkout "$branch_name"
  else
    git checkout -b "$branch_name"
    echo "   ✓ Created branch $branch_name"
  fi

  # Stage files
  git add .github/ CLOUDFLARE_CI_CD_SETUP.md
  [[ "$workflow_type" == "worker" ]] && git add wrangler.toml.example

  # Check if there are changes to commit
  if git diff --staged --quiet; then
    echo "   ℹ️  No changes to commit (files may already be up to date)"
  else
    # Commit
    git commit -m "feat(ci): add Cloudflare CI/CD workflows

- Add GitHub Actions workflows for Cloudflare deployment
- Include PR template and comprehensive setup documentation
- Part of unified CI/CD rollout across all BSI repos

See CLOUDFLARE_CI_CD_SETUP.md for setup instructions"
    echo "   ✓ Committed changes"

    # Push
    git push -u origin "$branch_name" 2>/dev/null && echo "   ✓ Pushed to origin" || echo "   ⚠️  Could not push (push manually)"
  fi

  cd "$BSI_ROOT"
  echo "✅ $repo_name completed"
  echo ""
}

# Process Pages repos
echo "📄 Processing Pages repositories..."
echo ""
for repo in "${PAGES_REPOS[@]}"; do
  copy_workflows "$repo" "pages"
done

# Process Worker repos
echo "⚙️  Processing Worker repositories..."
echo ""
for repo in "${WORKER_REPOS[@]}"; do
  copy_workflows "$repo" "worker"
done

echo "🎉 Distribution complete!"
echo ""
echo "Next steps:"
echo "  1. Run scripts/setup-secrets.sh to configure GitHub secrets"
echo "  2. Create PRs in each repo:"
for repo in "${PAGES_REPOS[@]}" "${WORKER_REPOS[@]}"; do
  echo "     gh pr create --repo ahump20/$repo --title 'feat(ci): add Cloudflare CI/CD workflows'"
done
echo "  3. Merge PRs and test deployments"
