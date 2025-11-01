# Branch Protection Setup Guide

This guide provides step-by-step instructions for enabling branch protection on the `main` branch to ensure code quality and prevent accidental deployments.

## Table of Contents

- [Recommended Protection Rules](#recommended-protection-rules)
- [Setup via GitHub Web Interface](#setup-via-github-web-interface)
- [Setup via GitHub CLI](#setup-via-github-cli)
- [Setup via GitHub API](#setup-via-github-api)
- [Verification](#verification)

---

## Recommended Protection Rules

For the `main` (production) branch, we recommend the following protection rules:

✅ **Require a pull request before merging**
- Ensures all changes are reviewed before reaching production
- Prevents direct pushes to main

✅ **Require approvals: 1**
- At least one team member must review and approve changes
- Provides code quality oversight

✅ **Require status checks to pass before merging**
- Ensures CI/CD pipeline completes successfully
- Verifies builds, tests, and linting pass

✅ **Require branches to be up to date before merging**
- Prevents merge conflicts
- Ensures changes are tested against the latest main

✅ **Do not allow bypassing the above settings**
- Enforces rules for all contributors, including admins
- Maintains consistency and safety

❌ **Disable: Allow force pushes**
- Prevents history rewriting on main
- Protects against accidental data loss

❌ **Disable: Allow deletions**
- Prevents accidental branch deletion
- Maintains branch history

---

## Setup via GitHub Web Interface

### Step 1: Navigate to Branch Protection Settings

1. Go to your repository on GitHub: `https://github.com/ahump20/BSI`
2. Click **Settings** (top navigation)
3. Click **Branches** (left sidebar)
4. Under "Branch protection rules", click **Add branch protection rule**

### Step 2: Configure Protection Rule

**Branch name pattern**: `main`

#### Pull Request Requirements
- ✅ Check **Require a pull request before merging**
  - ✅ Check **Require approvals**
    - Set **Required number of approvals before merging**: `1`
  - ✅ Check **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ Check **Require review from Code Owners** (optional, if you have CODEOWNERS file)

#### Status Checks
- ✅ Check **Require status checks to pass before merging**
  - ✅ Check **Require branches to be up to date before merging**
  - In the search box, add these status checks (they'll appear after the first workflow run):
    - `deploy` (from deploy-pages.yml workflow)

#### Additional Rules
- ✅ Check **Require conversation resolution before merging**
- ❌ Uncheck **Allow force pushes**
- ❌ Uncheck **Allow deletions**

### Step 3: Save Protection Rule

Click **Create** (or **Save changes** if editing an existing rule)

---

## Setup via GitHub CLI

If you have the GitHub CLI (`gh`) installed, you can set up branch protection with a single command.

### Prerequisites

1. Install GitHub CLI: https://cli.github.com/
2. Authenticate: `gh auth login`

### Command

```bash
gh api repos/ahump20/BSI/branches/main/protection \
  --method PUT \
  --header 'Accept: application/vnd.github.v3+json' \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["deploy"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
```

### Explanation

- `required_status_checks.strict: true` - Require branches to be up to date
- `required_status_checks.contexts` - Required CI checks that must pass
- `enforce_admins: true` - Apply rules to administrators too
- `required_pull_request_reviews.required_approving_review_count: 1` - Require 1 approval
- `required_pull_request_reviews.dismiss_stale_reviews: true` - Dismiss old approvals on new commits
- `allow_force_pushes: false` - Prevent force pushes
- `allow_deletions: false` - Prevent branch deletion
- `required_conversation_resolution: true` - Require all PR comments to be resolved

---

## Setup via GitHub API

You can also use `curl` to configure branch protection directly via the GitHub API.

### Prerequisites

1. Generate a Personal Access Token (PAT) with `repo` scope:
   - Go to https://github.com/settings/tokens
   - Click **Generate new token (classic)**
   - Select `repo` scope
   - Generate and copy the token

2. Export the token:
   ```bash
   export GITHUB_TOKEN=your_personal_access_token_here
   ```

### Command

```bash
curl -X PUT \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/ahump20/BSI/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": ["deploy"]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false,
      "required_approving_review_count": 1
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_conversation_resolution": true
  }'
```

---

## Verification

After setting up branch protection, verify it's working correctly:

### 1. Check Protection Status

```bash
# Using GitHub CLI
gh api repos/ahump20/BSI/branches/main/protection

# Using curl
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/ahump20/BSI/branches/main/protection
```

### 2. Test Protection Rules

1. Try to push directly to main (should fail):
   ```bash
   git checkout main
   git commit --allow-empty -m "Test direct push"
   git push origin main
   # Expected: Error - branch is protected
   ```

2. Test via Pull Request (should succeed):
   ```bash
   git checkout -b test-branch-protection
   git commit --allow-empty -m "Test PR workflow"
   git push origin test-branch-protection
   # Create PR via GitHub UI
   # Get approval and merge
   ```

### 3. Web Interface Verification

1. Go to `https://github.com/ahump20/BSI/settings/branches`
2. You should see a protection rule for `main` with a green checkmark
3. Click **Edit** to review the configured rules

---

## Updating Branch Protection

If you need to modify the protection rules:

### Via Web Interface
1. Go to **Settings** > **Branches**
2. Click **Edit** next to the `main` protection rule
3. Make your changes
4. Click **Save changes**

### Via CLI/API
Re-run the `gh api` or `curl` command with updated JSON payload.

---

## Removing Branch Protection

⚠️ **Warning**: Only remove branch protection if absolutely necessary.

### Via Web Interface
1. Go to **Settings** > **Branches**
2. Click **Delete** next to the `main` protection rule
3. Confirm deletion

### Via CLI
```bash
gh api repos/ahump20/BSI/branches/main/protection \
  --method DELETE
```

### Via API
```bash
curl -X DELETE \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/ahump20/BSI/branches/main/protection
```

---

## Troubleshooting

### "Unprotected" Warning on Pull Requests

**Problem**: PRs show a warning that status checks are not required

**Solution**: 
1. Ensure the workflow has run at least once so the status check name appears in GitHub
2. Add the exact status check name (`deploy`) to the protection rules
3. The check name must match exactly what appears in the workflow file

### Cannot Push to Main After Enabling Protection

**Problem**: Getting "permission denied" or "branch protected" errors

**Solution**: This is expected behavior. Always create a branch and PR:
```bash
git checkout -b feature/my-changes
git push origin feature/my-changes
# Create PR on GitHub
```

### Admin Bypass Not Working

**Problem**: Admins cannot bypass protection rules even when needed

**Solution**:
1. Temporarily disable `enforce_admins` in the protection rule
2. Make the necessary changes
3. Re-enable `enforce_admins` immediately after

### Status Check Never Completes

**Problem**: Status check shows as "pending" indefinitely

**Solution**:
1. Check the workflow logs in the **Actions** tab
2. Verify all required secrets are configured
3. Ensure the workflow file is valid and triggered correctly

---

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CLI Reference](https://cli.github.com/manual/gh_api)
- [GitHub REST API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)

---

**Questions?** Open an issue or contact the development team.
