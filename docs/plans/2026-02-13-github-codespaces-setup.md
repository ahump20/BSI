# GitHub Codespaces Setup for BSI

**Created:** 2026-02-13
**Purpose:** Set up cloud development environment with GitHub Codespaces
**Access:** Web browser + Claude Code desktop app via SSH

---

## Why Codespaces Over AWS EC2?

| Benefit | Why It Matters for BSI |
|---------|------------------------|
| **GitHub-native** | Repo already lives on GitHub—no manual cloning |
| **2-minute setup** | No AWS console, no key management, no IP addresses |
| **Free tier** | 60 hours/month free (vs AWS 12-month limit) |
| **Flexible access** | Browser when mobile, SSH when at desk |
| **Secrets built-in** | GitHub handles env vars (Highlightly API key, etc.) |

---

## Quick Start (2 Minutes)

### 1. Create Your Codespace

1. Go to: `https://github.com/ahump20/BSI`
2. Click green **"Code"** button
3. Select **"Codespaces"** tab
4. Click **"Create codespace on main"**
5. Wait 30-60 seconds—VS Code opens in browser

**What just happened:**
- GitHub created a cloud VM
- Cloned your BSI repo
- Installed basic dev environment
- Opened VS Code web interface

---

## Workflow 1: Browser-Based Development

**Use when:** Quick edits, reviewing code, mobile/tablet access

### Working in the Codespace

The VS Code interface that opened is a real development environment:

- **Terminal:** Click hamburger menu → Terminal → New Terminal
- **Files:** Browse repo in sidebar
- **Extensions:** Install VS Code extensions (GitHub Copilot, ESLint, etc.)
- **Port forwarding:** Run `npm run dev`—Codespaces exposes port 3000 automatically

### Install BSI Dependencies

In the Codespace terminal:

```bash
# Check Node version (should be 18+)
node --version

# Install dependencies
npm install

# Run dev server
npm run dev
```

**Access the dev server:**
- Codespaces shows "Open in Browser" notification
- Or click "Ports" tab → click the forwarded port URL

### Ask Claude Questions

Two approaches:

**Option A: Copy/paste**
- Copy code from Codespace
- Paste into `claude.ai/new` in another tab
- Get answers, copy solutions back

**Option B: Share context**
- Screenshot errors in Codespace
- Paste terminal output into Claude
- "I'm running BSI in a Codespace and seeing this error: [paste]"

---

## Workflow 2: Claude Code Desktop App (SSH)

**Use when:** At your desk, want full Claude Code integration

### Get SSH Connection Details

**In your Codespace (web interface):**

1. Click hamburger menu (≡) → Terminal → New Terminal
2. Run this command:

```bash
gh codespace ssh --codespace $(hostname)
```

If that doesn't work, get the SSH command manually:

```bash
# In Codespace terminal
echo "Codespace name: $(hostname)"
```

**On your Mac (separate terminal):**

```bash
# Install GitHub CLI if needed
brew install gh

# Authenticate
gh auth login

# List your Codespaces
gh codespace list

# Get SSH config
gh codespace ssh --codespace YOUR_CODESPACE_NAME --config
```

This outputs something like:

```
Host codespace-name
  HostName vs-ssh.visualstudio.com
  User vsonline
  IdentityFile ~/.ssh/codespaces.auto
```

### Connect Claude Code Desktop App

**Add SSH Connection in Claude Code:**

| Field | Value |
|-------|-------|
| **Name** | `BSI Codespace` |
| **SSH Host** | Copy from `gh codespace ssh --config` output |
| **SSH Port** | `22` (default) |
| **Identity File** | (Leave empty—gh CLI handles auth) |

**Alternative: Use SSH config file**

1. Generate SSH config:
   ```bash
   gh codespace ssh --codespace YOUR_CODESPACE_NAME --config >> ~/.ssh/config
   ```

2. In Claude Code, just use the host name from config:
   - SSH Host: `codespace-name` (whatever `gh` called it)

### Verify Connection

In Claude Code:
1. Switch to Codespace connection (dropdown)
2. Open terminal—should show: `@codespaces-xxxxx:/workspaces/BSI$`
3. Try reading a file: should work seamlessly

---

## Configure the Environment (Optional)

Create `.devcontainer/devcontainer.json` to customize the Codespace:

```json
{
  "name": "BSI Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    }
  },
  "postCreateCommand": "npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss"
      ]
    }
  },
  "forwardPorts": [3000, 8787],
  "portsAttributes": {
    "3000": {
      "label": "Next.js Dev Server",
      "onAutoForward": "notify"
    },
    "8787": {
      "label": "Wrangler Dev",
      "onAutoForward": "notify"
    }
  }
}
```

**What this does:**
- Ensures Node.js 20
- Auto-installs dependencies on creation
- Adds useful VS Code extensions
- Forwards Next.js and Wrangler ports automatically

**To apply:**
1. Commit `.devcontainer/devcontainer.json` to repo
2. Delete old Codespace
3. Create new one—uses custom config

---

## Managing Secrets

### Add Environment Variables

**GitHub UI (recommended):**
1. `github.com/ahump20/BSI` → Settings → Secrets and variables → Codespaces
2. Click "New repository secret"
3. Add:
   - `HIGHLIGHTLY_API_KEY`
   - `SPORTSDATAIO_API_KEY`
   - etc.

**Codespace terminal (temporary):**
```bash
export HIGHLIGHTLY_API_KEY="your-key-here"
```

Secrets added via GitHub UI persist across Codespace rebuilds.

---

## Cost Management

**Free tier:**
- 120 core-hours/month (60 hours on 2-core machine)
- 15 GB storage

**After free tier:**
- 2-core machine: $0.18/hour
- 4-core machine: $0.36/hour
- Storage: $0.07/GB-month

**To save money:**
1. **Stop when not using:**
   - Codespaces auto-stop after 30 min idle
   - Or manually: Codespace menu → Stop Codespace

2. **Delete when done:**
   - `github.com/codespaces`
   - Delete unused Codespaces

3. **Monitor usage:**
   - `github.com/settings/billing`
   - View Codespaces hours used

---

## Quick Reference

### Create Codespace
```
github.com/ahump20/BSI → Code → Codespaces → Create
```

### Connect via SSH (Mac terminal)
```bash
gh codespace ssh --codespace YOUR_CODESPACE_NAME
```

### Get SSH config for Claude Code
```bash
gh codespace ssh --codespace YOUR_CODESPACE_NAME --config
```

### List all Codespaces
```bash
gh codespace list
```

### Delete a Codespace
```bash
gh codespace delete --codespace YOUR_CODESPACE_NAME
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "gh: command not found" | Install GitHub CLI: `brew install gh` |
| Can't find Codespace name | Run `gh codespace list` or check `github.com/codespaces` |
| SSH connection fails | Run `gh auth login` to re-authenticate |
| Port forwarding not working | Check Ports tab in Codespace, make visibility "Public" |
| npm install fails | Check Node version: `node --version` (need 18+) |
| Environment variables missing | Add secrets in GitHub repo settings → Codespaces |

---

## Comparison: When to Use What

| Scenario | Use This |
|----------|----------|
| Quick bug fix on phone | Codespace web interface |
| Reviewing PR on iPad | Codespace web interface |
| Deep work on feature | Claude Code desktop → SSH to Codespace |
| Running tests locally | Claude Code desktop → SSH to Codespace |
| Deploying to Cloudflare | Either (wrangler works in both) |
| Checking logs quickly | Codespace web (faster than SSH) |

---

## Next Steps After Setup

1. **Test the environment:**
   ```bash
   npm run typecheck
   npm run test
   npm run dev
   ```

2. **Configure Wrangler:**
   ```bash
   npx wrangler login
   ```

3. **Set up Git:**
   ```bash
   git config --global user.name "Austin Humphrey"
   git config --global user.email "Austin@BlazeSportsIntel.com"
   ```

4. **Install additional tools:**
   ```bash
   # If needed
   sudo apt-get update
   sudo apt-get install -y postgresql-client redis-tools
   ```

---

**Document created for:** Austin Humphrey / Blaze Sports Intel
**Last updated:** 2026-02-13
