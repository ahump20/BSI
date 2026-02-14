# BSI Devcontainer Configuration

This directory contains the configuration for GitHub Codespaces and VS Code Dev Containers.

## What It Does

When you create a GitHub Codespace or open this repo in a VS Code Dev Container, this configuration automatically:

1. **Sets up the environment:**
   - Node.js 20
   - GitHub CLI (`gh`)
   - Git with BSI user configuration

2. **Installs tools:**
   - All npm dependencies
   - Wrangler CLI (Cloudflare Workers)
   - Playwright browsers (for testing)

3. **Configures VS Code:**
   - ESLint, Prettier, Tailwind CSS extensions
   - Format on save enabled
   - Proper TypeScript workspace configuration
   - Code spell checker

4. **Forwards ports:**
   - 3000: Next.js dev server
   - 8787: Wrangler dev server
   - 9229: Node.js debugger

5. **Sets timezone:**
   - America/Chicago (BSI default)

## Files

- `devcontainer.json` - Main configuration
- `postCreate.sh` - Setup script that runs after container creation
- `README.md` - This file

## First Time Setup

After your Codespace is created:

```bash
# Authenticate with Cloudflare
wrangler login

# Authenticate with GitHub (if needed)
gh auth login

# Start development
npm run dev
```

## Environment Variables

Add secrets in GitHub repo settings:
- Settings → Secrets and variables → Codespaces
- Add: `HIGHLIGHTLY_API_KEY`, `SPORTSDATAIO_API_KEY`, etc.

These will be available as environment variables in your Codespace.

## Customization

To modify the environment:
1. Edit `devcontainer.json`
2. Commit changes
3. Rebuild Codespace: Codespace menu → Rebuild Container

Or test locally with VS Code:
1. Install "Dev Containers" extension
2. Command Palette → "Dev Containers: Reopen in Container"

## SSH Access

To connect via SSH:

```bash
# List Codespaces
gh codespace list

# Get SSH config
gh codespace ssh --codespace <NAME> --config

# Connect
gh codespace ssh --codespace <NAME>
```

## Cost Management

Free tier: 120 core-hours/month (60 hours on 2-core machine)

To minimize costs:
- Stop Codespace when not in use (auto-stops after 30 min idle)
- Delete old Codespaces you're not using
- Monitor usage at: github.com/settings/billing

## Troubleshooting

**Codespace won't start:**
- Check `.devcontainer/devcontainer.json` for syntax errors
- Try: Codespace menu → Rebuild Container

**Dependencies not installed:**
- Check `postCreate.sh` execution in creation logs
- Manually run: `bash .devcontainer/postCreate.sh`

**Ports not forwarding:**
- Check Ports tab in VS Code
- Make port visibility "Public" if needed

**Wrangler auth fails:**
- Run `wrangler login` in terminal
- Follow browser authentication flow

## VS Code Extensions Included

- **ESLint** - Linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **Playwright** - Test runner
- **Vitest** - Test explorer
- **GitHub Copilot** - AI code completion (if you have access)
- **Import Cost** - Show package sizes
- **Code Spell Checker** - Catch typos
- **Pretty TypeScript Errors** - Better error messages
- **MDX** - MDX syntax support

## Related Documentation

See also:
- `docs/plans/2026-02-13-github-codespaces-setup.md` - Complete setup guide
- `docs/plans/2026-02-13-ssh-remote-development-setup.md` - SSH alternative (AWS EC2)
