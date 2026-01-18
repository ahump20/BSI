# 🚀 Quick Start Guide - Blaze Sports Intel

## Setup (One Time Only)

### 1. Configure SSH Authentication

Your SSH key is already generated. Now add it to GitHub:

```bash
# Copy your public key to clipboard
cat ~/.ssh/id_ed25519.pub | pbcopy

# Open GitHub SSH settings
open https://github.com/settings/ssh/new

# Paste the key and give it a title like "Blaze Intelligence Mac"
```

Or use the automated setup script:

```bash
./scripts/setup-git-ssh.sh
```

### 2. Verify Setup

```bash
# Test SSH connection
ssh -T git@github.com

# Should see: "Hi ahump20! You've successfully authenticated..."
```

## Daily Development Workflow

### Start a New Feature

```bash
# Get latest from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/my-awesome-feature
```

### Make Changes

```bash
# Edit files...
# Test locally...

# Stage and commit
git add .
git commit -m "✨ Add awesome feature

Description of what changed and why.

🤖 Generated with Claude Code"
```

### Push and Create PR

```bash
# Push your branch
git push -u origin feature/my-awesome-feature

# Create pull request
gh pr create

# Or open PR in browser
open https://github.com/ahump20/BSI/compare
```

### Review and Merge

1. Wait for automated checks to pass
2. Address any review feedback
3. Once approved, merge using "Squash and merge"
4. Delete the feature branch

## Common Commands

```bash
# List all PRs
gh pr list

# View specific PR
gh pr view 123

# Checkout a PR locally
gh pr checkout 123

# List your recent branches
git branch --sort=-committerdate | head -10

# Clean up merged branches
git branch --merged main | grep -v "main" | xargs git branch -d

# Update your branch with latest main
git fetch origin
git rebase origin/main
```

## Before Every PR

Run these checks:

```bash
# Lint
npm run lint

# Test
npm test

# Build
npm run build

# Check for UI changes
git diff --name-only origin/main...HEAD | grep -E '\.html$|\.css$'
# If yes, add "ui-change" to PR title
```

## Tips

### Small PRs

- Keep PRs under 400 lines
- One feature per PR
- Easier to review = faster merge

### Good Commit Messages

```bash
# Good
git commit -m "✨ Add user authentication

Implement JWT-based auth with refresh tokens.
- Add login/logout endpoints
- Store tokens in httpOnly cookies
- Add auth middleware"

# Bad
git commit -m "fix stuff"
```

### Branch Naming

```bash
# Good
feature/user-authentication
fix/broken-team-navigation
hotfix/critical-data-loss

# Bad
austin-branch
test
fix
```

## Emergency Hotfix

For critical production issues:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Fix the issue
# ... make changes ...

# Commit and push
git commit -m "🔥 HOTFIX: Fix critical issue"
git push -u origin hotfix/critical-issue

# Create PR with HOTFIX label
gh pr create --label hotfix

# Get immediate review and merge ASAP
```

## Getting Help

- Check [PR Workflow Guide](PR_WORKFLOW.md)
- Check [Contributing Guidelines](../CONTRIBUTING.md)
- Search [closed issues](https://github.com/ahump20/BSI/issues?q=is%3Aissue+is%3Aclosed)
- Create a new issue
- Email: ahump20@outlook.com

## Useful Aliases

Add these to your `~/.gitconfig`:

```ini
[alias]
    co = checkout
    br = branch
    ci = commit
    st = status
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --all --decorate
    amend = commit --amend --no-edit
```

Then use like:

```bash
git co main
git br -a
git visual
```

---

Happy coding! 🔥

🤖 Generated with [Claude Code](https://claude.com/claude-code)
