# GitHub Codespaces Quick Start

Welcome to the BSI development environment! This Codespace is pre-configured with everything you need.

## ✅ Already Set Up For You

- ✅ Node.js 20
- ✅ npm dependencies installed
- ✅ Wrangler CLI (Cloudflare Workers)
- ✅ Playwright browsers (for testing)
- ✅ Git configured with your BSI credentials
- ✅ VS Code extensions (ESLint, Prettier, Tailwind, etc.)
- ✅ Port forwarding (3000, 8787)
- ✅ Timezone set to America/Chicago

## 🔑 First-Time Setup (Required)

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

Follow the browser prompt to authenticate.

### 2. Add API Keys (GitHub Secrets)

**Option A: GitHub UI (Recommended)**
1. Go to: `github.com/ahump20/BSI/settings/secrets/codespaces`
2. Click "New repository secret"
3. Add these secrets:
   ```
   HIGHLIGHTLY_API_KEY
   SPORTSDATAIO_API_KEY
   CLOUDFLARE_API_TOKEN
   CLOUDFLARE_ACCOUNT_ID
   ```

**Option B: Terminal (Temporary - lost on rebuild)**
```bash
# Copy template
cp .env.template .env.local

# Edit with your keys
code .env.local
```

### 3. Verify Everything Works

```bash
# Type check
npm run typecheck

# Run tests
npm test

# Start dev server
npm run dev
```

## 🚀 Common Commands

```bash
# Development
npm run dev              # Next.js dev server (port 3000)
npm run dev:worker       # Wrangler dev (port 8787)
npm run dev:hybrid       # Both servers together

# Testing
npm run test             # Run tests (watch mode)
npm run test:all         # All tests once
npm run test:routes      # Playwright route tests
npm run test:a11y        # Accessibility tests

# Code Quality
npm run typecheck        # TypeScript validation
npm run lint             # ESLint
npm run format:fix       # Prettier auto-fix

# Deployment
npm run build            # Production build
npm run deploy:production    # Deploy to Cloudflare Pages
npm run deploy:worker        # Deploy worker
npm run deploy:hybrid        # Deploy both
```

## 📁 Project Structure

```
app/                    # Next.js pages (App Router)
  college-baseball/     # Flagship sport (CBB)
  mlb/ nfl/ nba/ cfb/  # Other sports
  arcade/              # Browser games
components/            # React components
lib/                   # Core logic (API clients, utils, hooks)
workers/               # Cloudflare Workers (53 deployed)
functions/             # Cloudflare Pages Functions
tests/                 # Test suites
docs/                  # Documentation
```

## 🔌 Ports

These ports are automatically forwarded and accessible:

- **3000** - Next.js dev server (click to open preview)
- **8787** - Wrangler dev server
- **9229** - Node.js debugger

## 🎯 Common Workflows

### Working on a Feature

```bash
# Create feature branch
git checkout -b feat/your-feature

# Make changes, test locally
npm run dev
npm run test

# Commit (hooks run automatically)
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push origin feat/your-feature
```

### Deploying Changes

```bash
# Build and test
npm run build
npm run test:all

# Deploy to production
npm run deploy:production
```

### Working with Workers

```bash
# List deployed workers
wrangler deployments list

# Tail worker logs
wrangler tail bsi-ingest

# Deploy specific worker
wrangler deploy --config workers/bsi-news-ticker/wrangler.toml
```

## 🐛 Troubleshooting

**"Module not found" errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Type check fails:**
- Check if environment variables are set
- Run `npm run typecheck:strict` for detailed errors

**Ports not accessible:**
- Click "Ports" tab in VS Code
- Make port visibility "Public" if needed

**Wrangler auth issues:**
```bash
wrangler logout
wrangler login
```

**Git hooks failing:**
- Hooks may be slow on iCloud Drive (BSI repo location)
- Use `git commit --no-verify` if hooks hang
- Check for stale `.git/index.lock` file

## 📚 Documentation

- **Setup Guide:** `docs/plans/2026-02-13-github-codespaces-setup.md`
- **Project Guide:** `CLAUDE.md` (in repo root)
- **Devcontainer Config:** `.devcontainer/README.md`

## 💡 Tips

- **Format on save is enabled** - Files auto-format when you save
- **ESLint auto-fixes** - Many lint errors fix on save
- **Import costs shown** - See package sizes in imports
- **Spell checking enabled** - Typos are highlighted
- **Copilot available** - If you have GitHub Copilot access

## 🔄 Rebuilding the Container

If you modify `.devcontainer/devcontainer.json`:

1. Command Palette (Cmd/Ctrl+Shift+P)
2. "Codespaces: Rebuild Container"
3. Wait for rebuild (~2-3 minutes)

## 💰 Cost Management

- **Free tier:** 120 core-hours/month (60 hours on 2-core)
- **Auto-stop:** Codespace stops after 30 min idle
- **Monitor usage:** `github.com/settings/billing`
- **Delete when done:** Keep only active Codespaces

## 🆘 Need Help?

- **Codespace issues:** `github.com/codespaces`
- **BSI questions:** Check `CLAUDE.md` and `docs/`
- **Worker debugging:** Use `wrangler tail <worker-name>`
- **Test failures:** Run `npm run test:all` for full output

---

**Ready to build?** Start with: `npm run dev`
