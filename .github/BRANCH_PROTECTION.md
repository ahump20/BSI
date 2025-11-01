# Branch Protection Setup Guide

This guide provides step-by-step instructions for configuring branch protection rules on the `main` branch to ensure code quality, stability, and security in production.

## Why Branch Protection?

Branch protection helps maintain code quality by:
- **Preventing direct pushes** to critical branches
- **Requiring code reviews** before merging changes
- **Enforcing CI checks** to pass before merging
- **Preventing force pushes** that could rewrite history
- **Maintaining a clean, auditable history** of all production changes

---

## Quick Setup Checklist

- [ ] Enable branch protection on `main` branch
- [ ] Require pull request reviews (minimum 1 approval)
- [ ] Require status checks to pass before merging
- [ ] Require branches to be up to date before merging
- [ ] Restrict who can push to the branch
- [ ] Prevent force pushes and deletions
- [ ] Apply rules to administrators (recommended)

---

## Detailed Setup Instructions

### Step 1: Access Branch Protection Settings

1. Navigate to your GitHub repository
2. Click on **Settings** (top navigation, requires admin access)
3. In the left sidebar, click **Branches**
4. Under "Branch protection rules", click **Add branch protection rule**

### Step 2: Specify Branch Pattern

1. In the **Branch name pattern** field, enter: `main`
   - This applies the rule specifically to the main branch
   - You can use wildcards like `release/*` for multiple branches

### Step 3: Configure Pull Request Requirements

✅ **Enable:** "Require a pull request before merging"

Under this section:
- ✅ **Enable:** "Require approvals"
  - Set **Required number of approvals before merging:** `1`
  - This ensures at least one team member reviews all changes

- ✅ **Enable:** "Dismiss stale pull request approvals when new commits are pushed"
  - Forces re-review when code changes after approval

- ✅ **Enable:** "Require review from Code Owners" (if you have a CODEOWNERS file)
  - Ensures specific team members review their areas of expertise

### Step 4: Configure Status Check Requirements

✅ **Enable:** "Require status checks to pass before merging"

Under this section:
- ✅ **Enable:** "Require branches to be up to date before merging"
  - Ensures the branch is rebased/merged with latest main before merging
  - Prevents integration issues

- **Add required status checks:**
  1. In the search box, start typing the name of your GitHub Actions workflow
  2. Select: `Build and Deploy to Cloudflare Pages`
  3. This ensures CI passes before any merge

**Note:** Status checks will only appear in the list after they've run at least once. Create and merge an initial PR to populate this list.

### Step 5: Configure Additional Protections

✅ **Enable:** "Require conversation resolution before merging"
- Ensures all PR comments/discussions are resolved

✅ **Enable:** "Require signed commits" (optional but recommended)
- Adds an extra layer of security by verifying commit authenticity

✅ **Enable:** "Require linear history" (optional)
- Prevents merge commits, keeping history clean
- Only allows squash or rebase merging

### Step 6: Restrict Push Access

✅ **Enable:** "Restrict who can push to matching branches"
- Select specific teams or individuals who can push
- Leave empty to restrict to pull requests only (recommended)

### Step 7: Prevent Destructive Actions

✅ **Enable:** "Allow force pushes" - **LEAVE DISABLED**
- Force pushes can rewrite history and break collaboration

✅ **Enable:** "Allow deletions" - **LEAVE DISABLED**
- Prevents accidental deletion of the main branch

### Step 8: Apply Rules to Administrators

⚠️ **Important Decision:** "Do not allow bypassing the above settings"

This setting determines whether administrators can bypass branch protection rules:

- ✅ **Enable (Recommended):** Apply the same rules to repository administrators
  - Ensures consistency and prevents accidental mistakes
  - Best practice for production environments
  - All team members, including admins, must follow the same process

- ❌ **Disable (Not Recommended):** Allow administrators to bypass
  - Useful for emergency hotfixes or special circumstances
  - Can lead to inconsistent practices
  - Only consider if you have a documented emergency access procedure

### Step 9: Save Configuration

1. Scroll to the bottom
2. Click **Create** (or **Save changes** if editing)
3. Your branch protection rules are now active!

---

## Recommended Configuration Summary

Here's the recommended configuration for production-grade branch protection:

```yaml
Branch name pattern: main

Protect matching branches:
  ✅ Require a pull request before merging
     ✅ Require approvals: 1
     ✅ Dismiss stale pull request approvals when new commits are pushed
     ✅ Require review from Code Owners (if applicable)
  
  ✅ Require status checks to pass before merging
     ✅ Require branches to be up to date before merging
     Status checks required:
       - Build and Deploy to Cloudflare Pages
  
  ✅ Require conversation resolution before merging
  
  ✅ Require signed commits (optional)
  
  ✅ Require linear history (optional)
  
  ✅ Do not allow bypassing the above settings
  
  ✅ Restrict who can push to matching branches
     - (Leave empty to require PRs)
  
  ❌ Allow force pushes: DISABLED
  ❌ Allow deletions: DISABLED
```

---

## Testing Branch Protection

After configuring branch protection, verify it works:

### Test 1: Direct Push Prevention
```bash
git checkout main
git pull origin main
echo "test" >> test.txt
git add test.txt
git commit -m "test direct push"
git push origin main
```
**Expected:** Push should be rejected with a message about branch protection

### Test 2: Pull Request Flow
```bash
git checkout -b test/branch-protection
echo "test" >> test.txt
git add test.txt
git commit -m "test PR flow"
git push origin test/branch-protection
```
Then create a PR on GitHub - it should require approval and passing CI

### Test 3: Force Push Prevention
```bash
git checkout main
git commit --amend -m "modified commit"
git push -f origin main
```
**Expected:** Force push should be rejected

---

## Workflow for Team Members

With branch protection enabled, the typical workflow is:

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit**:
   ```bash
   # Make your changes
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

3. **Create a Pull Request** on GitHub:
   - Go to the repository on GitHub
   - Click "Compare & pull request"
   - Fill in PR description
   - Request reviewers

4. **Wait for:**
   - ✅ CI checks to pass (GitHub Actions)
   - ✅ At least 1 approval from reviewer
   - ✅ All conversations resolved

5. **Merge the PR**:
   - Click "Merge pull request"
   - Choose merge method (squash/merge/rebase)
   - Confirm merge

6. **Automatic deployment** to Cloudflare Pages happens via GitHub Actions

---

## Handling Emergency Hotfixes

If you need to deploy an urgent fix:

### Option 1: Fast-Track PR (Recommended)
1. Create a hotfix branch: `git checkout -b hotfix/critical-issue`
2. Make the fix and push
3. Create PR with "HOTFIX" in title
4. Get expedited review from available team member
5. Merge as soon as CI passes and approved

### Option 2: Temporarily Disable Protection (Last Resort)
1. Go to Settings → Branches → Edit rule
2. Uncheck "Do not allow bypassing the above settings"
3. Make your changes via PR or direct push
4. **Immediately re-enable** the protection
5. Document the emergency action in commit/PR

⚠️ **Important:** Always prefer Option 1. Only use Option 2 for critical production outages.

---

## Additional Branch Protection for Staging

Consider applying similar (but less strict) rules to `staging`:

```yaml
Branch name pattern: staging

Protect matching branches:
  ✅ Require a pull request before merging
     ✅ Require approvals: 1
  ✅ Require status checks to pass before merging
     Status checks: Build and Deploy to Cloudflare Pages
  ❌ Allow force pushes: DISABLED
```

This allows for more flexibility in staging while maintaining some quality gates.

---

## Monitoring and Compliance

### Regular Audits
- Review branch protection settings quarterly
- Ensure all team members understand the workflow
- Update rules as team grows or processes evolve

### Metrics to Track
- Number of PRs merged per week
- Average time from PR creation to merge
- Number of CI failures caught before merge
- Code review response time

### Tools
- GitHub Insights → Pulse (shows PR activity)
- GitHub Insights → Code frequency (shows contribution patterns)
- GitHub Actions logs (shows CI pass/fail rates)

---

## Troubleshooting

### Issue: Can't push to main even with proper PR

**Solution:** 
- Ensure you're not pushing directly to main
- Use the GitHub UI to merge the PR after approval

### Issue: Status check not appearing in required checks

**Solution:**
- The workflow must run at least once before it appears
- Create a test PR to any branch
- After it runs, return to branch protection settings to add it

### Issue: PR can't be merged even though everything passed

**Solution:**
- Check if branch is up to date with main
- Check if all conversations are resolved
- Verify all required status checks passed (not just some)

### Issue: Need to bypass protection for emergency

**Solution:**
- Only repository admins can temporarily disable protection
- Document the reason and re-enable immediately after
- Consider creating an "emergency access" procedure document

---

## Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [GitHub Code Owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Git Workflow Best Practices](https://docs.github.com/en/get-started/quickstart/github-flow)
