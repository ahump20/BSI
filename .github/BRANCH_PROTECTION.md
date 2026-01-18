# Branch Protection Setup Guide

This guide explains how to enable branch protection rules on the `main` branch to ensure code quality and prevent accidental force pushes.

## Overview

Branch protection rules help maintain code quality by:

- Requiring pull request reviews before merging
- Ensuring status checks pass before merging
- Preventing force pushes and deletions
- Enforcing a consistent development workflow

## Prerequisites

- GitHub repository admin access
- GitHub CLI (`gh`) installed (optional, for automated setup)
- Or use GitHub web interface

## Method 1: Using GitHub CLI (Recommended)

### Install GitHub CLI

If you haven't installed the GitHub CLI:

- **macOS:** `brew install gh`
- **Linux:** See https://github.com/cli/cli/blob/trunk/docs/install_linux.md
- **Windows:** See https://github.com/cli/cli#windows

### Authenticate

```bash
gh auth login
```

### Enable Branch Protection on `main`

Run the following command to enable branch protection with recommended settings:

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/ahump20/BSI/branches/main/protection \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=build-and-deploy \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f required_pull_request_reviews[require_code_owner_reviews]=false \
  -f required_pull_request_reviews[required_approving_review_count]=1 \
  -f required_pull_request_reviews[require_last_push_approval]=false \
  -f enforce_admins=false \
  -f required_linear_history=false \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -f block_creations=false \
  -f required_conversation_resolution=true \
  -f lock_branch=false \
  -f allow_fork_syncing=true
```

### Verify Protection Rules

```bash
gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/ahump20/BSI/branches/main/protection
```

## Method 2: Using GitHub Web Interface

### Step-by-Step Instructions

1. **Navigate to Settings**
   - Go to your repository on GitHub
   - Click **Settings** (requires admin access)

2. **Access Branch Protection Rules**
   - In the left sidebar, click **Branches**
   - Under "Branch protection rules", click **Add branch protection rule**

3. **Configure Branch Name Pattern**
   - In "Branch name pattern", enter: `main`

4. **Enable Required Settings**

   Check the following boxes:

   ✅ **Require a pull request before merging**
   - ✅ Require approvals: **1**
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require review from Code Owners (optional)

   ✅ **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - Add status check: `build-and-deploy` (the GitHub Actions workflow job name)

   ✅ **Require conversation resolution before merging**

   ✅ **Do not allow bypassing the above settings**
   - Leave unchecked if you want admins to be able to bypass (recommended for small teams)

   ❌ **Do not allow force pushes**

   ❌ **Do not allow deletions**

5. **Save Changes**
   - Scroll to the bottom and click **Create** or **Save changes**

## Branch Protection Rules Explained

### Required Pull Request Reviews

- **Required approving review count: 1**
  - At least one team member must approve the PR before it can be merged
  - Ensures code is reviewed by another developer

### Required Status Checks

- **Status check: build-and-deploy**
  - The GitHub Actions workflow must complete successfully
  - Ensures the code builds and deploys without errors
  - Prevents broken code from being merged

### No Force Pushes

- Prevents rewriting git history on the `main` branch
- Maintains a clean, linear history
- Protects against accidental data loss

### Require Conversation Resolution

- All PR comments must be resolved before merging
- Ensures all feedback is addressed
- Promotes thorough code review

## Workflow with Branch Protection

With branch protection enabled, the typical workflow is:

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**

   ```bash
   git add .
   git commit -m "Add your feature"
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request**
   - Go to GitHub and create a PR from your feature branch to `main`
   - Fill out the PR template
   - Request reviews from team members

4. **Wait for Status Checks**
   - The `build-and-deploy` workflow runs automatically
   - Must pass before the PR can be merged

5. **Get Approval**
   - At least 1 approving review is required
   - Address any feedback and resolve conversations

6. **Merge**
   - Once approved and checks pass, merge the PR
   - Delete the feature branch

## Troubleshooting

### Status Check Not Appearing

If the `build-and-deploy` status check doesn't appear:

- Push a commit to trigger the workflow
- Wait for the workflow to run at least once
- Then add it to required status checks

### Can't Merge Despite Approval

Check:

- All status checks are passing (green checkmarks)
- All conversations are resolved
- Branch is up to date with `main` (if strict mode enabled)

### Admin Override Needed

If admins need to bypass protection rules:

- Temporarily disable "Do not allow bypassing the above settings"
- Make the necessary changes
- Re-enable the setting

## Modifying Protection Rules

To modify existing rules:

### Using GitHub CLI

```bash
# First, remove the existing protection
gh api \
  --method DELETE \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/ahump20/BSI/branches/main/protection

# Then, create new protection rules with updated settings
# (Use the command from Method 1 above with your desired changes)
```

### Using Web Interface

1. Go to **Settings** → **Branches**
2. Find the `main` branch rule
3. Click **Edit**
4. Modify settings as needed
5. Click **Save changes**

## Best Practices

1. **Start with minimal rules** and add more as needed
2. **Communicate changes** to your team before enabling
3. **Test the workflow** with a dummy PR to ensure it works
4. **Document exceptions** if you need to bypass rules
5. **Review rules periodically** to ensure they still fit your team's needs

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub REST API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
