# 🔄 Pull Request Workflow for Blaze Sports Intel

## Overview

This document outlines the PR workflow for the BSI repository to maintain code quality, enable collaboration, and prevent issues in production.

## 📋 Branch Strategy

### Branch Naming Convention

```
<type>/<short-description>
```

**Types:**

- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `refactor/` - Code refactoring without changing functionality
- `docs/` - Documentation updates
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks, dependency updates

**Examples:**

```bash
feature/platform-access-hub
fix/team-navigation-activeview
hotfix/critical-analytics-crash
refactor/particle-engine-optimization
docs/api-integration-guide
```

## 🚀 Workflow Steps

### 1. Create a Feature Branch

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create and checkout a new branch
git checkout -b feature/my-new-feature
```

### 2. Make Your Changes

- Write clean, well-documented code
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed

### 3. Commit Your Changes

Use conventional commit messages:

```bash
git add .
git commit -m "✨ Add comprehensive platform access hub

- Create 9 navigation cards for all subroutes
- Implement glass morphism design
- Add hover animations and transitions
- Ensure mobile responsiveness

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Commit Emoji Guide:**

- ✨ `:sparkles:` - New feature
- 🐛 `:bug:` - Bug fix
- 🔥 `:fire:` - Remove code/files
- 📝 `:memo:` - Documentation
- ⚡ `:zap:` - Performance
- 💄 `:lipstick:` - UI/styling
- ♻️ `:recycle:` - Refactor
- ✅ `:white_check_mark:` - Tests
- 🔒 `:lock:` - Security
- 🚀 `:rocket:` - Deployment

### 4. Push Your Branch

```bash
# First time pushing this branch
git push -u origin feature/my-new-feature

# Subsequent pushes
git push
```

### 5. Create a Pull Request

#### Using GitHub CLI:

```bash
gh pr create --title "✨ Add platform access hub" --body "$(cat <<'EOF'
## Summary
- Created comprehensive navigation section with 9 interactive cards
- Links to all major platform subroutes
- Glass morphism design with hover effects

## Testing
- [x] All cards link to correct routes
- [x] Hover animations work smoothly
- [x] Mobile responsive design verified
- [x] Accessibility tested

## Screenshots
[Add screenshots here]

🤖 Generated with Claude Code
EOF
)"
```

#### Using GitHub Web UI:

1. Navigate to https://github.com/ahump20/BSI
2. Click "Pull requests" → "New pull request"
3. Select your branch
4. Fill out the PR template
5. Request reviewers if applicable
6. Add appropriate labels

### 6. Code Review Process

**For Reviewers:**

- Check code quality and style
- Verify tests pass
- Test functionality manually
- Suggest improvements
- Approve or request changes

**For Authors:**

- Address all review comments
- Push additional commits to the same branch
- Request re-review when ready

### 7. Merge the PR

Once approved and all checks pass:

```bash
# Using GitHub CLI
gh pr merge <number> --squash --delete-branch

# Or use the GitHub UI "Squash and merge" button
```

## 🔒 Branch Protection Rules

### Recommended Settings for `main` branch:

1. **Require pull request reviews before merging**
   - Required approvals: 1 (for solo projects, can be 0)
   - Dismiss stale reviews on new commits

2. **Require status checks to pass**
   - Build checks
   - Test suite
   - Linting

3. **Require branches to be up to date before merging**
   - Ensures no merge conflicts

4. **Do not allow force pushes**
   - Protects commit history

5. **Do not allow deletions**
   - Prevents accidental branch deletion

### To Enable Branch Protection:

1. Go to https://github.com/ahump20/BSI/settings/branches
2. Click "Add rule" next to "main"
3. Configure the settings above
4. Click "Create" or "Save changes"

## 🧪 Pre-PR Checklist

Before creating a PR, ensure:

- [ ] Code builds without errors
- [ ] All tests pass locally
- [ ] No console errors or warnings
- [ ] Code follows project style guidelines
- [ ] Documentation is updated
- [ ] No secrets or API keys in code
- [ ] UI changes have screenshots in PR
- [ ] Accessibility tested (WCAG AA)
- [ ] Mobile responsiveness verified
- [ ] Performance impact considered

## 🚨 Special Cases

### UI Changes

If your PR modifies HTML, CSS, or UI components:

1. Add the `ui-change` label
2. Include before/after screenshots
3. Request design review if applicable
4. Verify on multiple screen sizes
5. Test with screen readers if possible

The `scripts/check-tokens.sh` script will enforce this:

```bash
#!/usr/bin/env bash
set -euo pipefail

if git diff --name-only origin/main...HEAD | grep -E 'public/|\.html$|\.css$' > /dev/null; then
  if ! git log -1 --pretty=%B | grep -q 'ui-change'; then
    echo "❌ UI changes detected without 'ui-change' in commit message"
    exit 1
  fi
fi
```

### Hotfixes

For critical production issues:

1. Create branch from `main`: `hotfix/critical-issue`
2. Fix the issue
3. Create PR with "🔥 HOTFIX:" prefix
4. Get immediate review
5. Merge and deploy ASAP
6. Follow up with proper tests

## 📊 PR Review Guidelines

### What to Look For:

**Code Quality:**

- Clean, readable code
- Proper error handling
- No code duplication
- Consistent style

**Functionality:**

- Does what it claims to do
- No breaking changes (unless documented)
- Edge cases handled

**Performance:**

- No obvious performance issues
- Efficient algorithms
- Proper caching where applicable

**Security:**

- No exposed secrets
- Input validation
- XSS/CSRF protection

**Testing:**

- Adequate test coverage
- Tests actually test the feature
- No flaky tests

### PR Review Comments:

Use these conventions:

- **[nit]** - Minor suggestion, not blocking
- **[question]** - Need clarification
- **[important]** - Should be addressed before merge
- **[blocking]** - Must be fixed before merge

## 🔧 Git Configuration

### Set up SSH authentication:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key to clipboard
cat ~/.ssh/id_ed25519.pub | pbcopy

# Add to GitHub: https://github.com/settings/ssh/new
```

### Configure SSH for GitHub:

```bash
# ~/.ssh/config
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
    UseKeychain yes
```

### Update Git remote to use SSH:

```bash
# Change from HTTPS to SSH
git remote set-url origin git@github.com:ahump20/BSI.git

# Verify
git remote -v
```

## 📝 Useful Commands

```bash
# List all PRs
gh pr list

# View PR details
gh pr view <number>

# View PR diff
gh pr diff <number>

# Check out a PR locally
gh pr checkout <number>

# Review a PR
gh pr review <number> --approve
gh pr review <number> --request-changes --body "Comments here"

# Merge PR
gh pr merge <number> --squash --delete-branch

# Create PR from current branch
gh pr create

# List open PRs needing your review
gh pr list --search "is:open review-requested:@me"
```

## 🎓 Best Practices

### Keep PRs Small

- Aim for < 400 lines of code
- One feature/fix per PR
- Easier to review and test
- Faster to merge

### Write Descriptive Titles

- ✨ Add platform access hub navigation
- 🐛 Fix team navigation activeView default
- ⚡ Optimize particle rendering performance
- 📝 Update API integration documentation

### Provide Context

- Explain WHY, not just WHAT
- Link to related issues/discussions
- Include screenshots for UI changes
- Describe testing approach

### Be Responsive

- Address review comments promptly
- Ask questions if unclear
- Thank reviewers
- Request re-review when ready

### Keep Branches Updated

```bash
# Rebase on main regularly
git fetch origin
git rebase origin/main

# Or merge main into your branch
git merge origin/main
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm test
      - name: Build
        run: npm run build
```

## 📚 Additional Resources

- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/)
- [Git Branch Naming](https://deepsource.io/blog/git-branch-naming-conventions/)

---

**Questions?** Reach out to Austin Humphrey (ahump20@outlook.com)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
