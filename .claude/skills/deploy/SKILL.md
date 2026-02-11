---
name: deploy
description: |
  Deploy BSI to Cloudflare. Handles Pages, Workers, and hybrid deploys with pre-flight checks.
  Wraps the 7 deploy scripts in package.json so the right sequence runs for the target.

  Example triggers: "/deploy", "/deploy production", "/deploy preview",
  "/deploy worker", "/deploy hybrid", "/deploy arcade-api"
disable-model-invocation: true
---

# BSI Deploy Skill

## Available Targets

| Target | Script | What it does |
|--------|--------|-------------|
| `production` (default) | `deploy:production` | Builds Next.js + deploys to Cloudflare Pages (main branch) |
| `preview` | `deploy:preview` | Builds + deploys to Pages preview branch |
| `worker` | `deploy:worker` | Deploys the main hybrid router Worker |
| `worker:production` | `deploy:worker:production` | Deploys main Worker with `--env production` |
| `hybrid` | `deploy:hybrid` | Deploys both Pages (production) and Worker (production) |
| `arcade-api` | `deploy:arcade-api` | Deploys the mini-games API Worker |
| `pages` | `deploy` | Builds + deploys Pages to main (same as production without --commit-dirty) |

## Pre-flight Checks

Before running any deploy, perform these checks in order:

### 1. Git status
```bash
git status --short
```
- Warn if there are uncommitted changes (production deploys use `--commit-dirty=true` but the user should know)
- Show which files are modified

### 2. TypeScript check
```bash
npx tsc --noEmit 2>&1 | tail -20
```
- If there are type errors, show them and ask whether to proceed

### 3. Build test (for Pages deploys)
For targets that include a build step (`production`, `preview`, `hybrid`, `pages`), the build is part of the deploy script. No separate pre-build needed. But warn if `node_modules` looks stale:
```bash
# Check if node_modules exists and package.json is newer
if [ package.json -nt node_modules/.package-lock.json ]; then echo "WARN: package.json is newer than node_modules -- consider running npm install"; fi
```

### 4. Environment check (for Worker deploys)
For targets that deploy workers (`worker`, `worker:production`, `hybrid`, `arcade-api`):
```bash
# Verify wrangler auth
wrangler whoami 2>&1 | head -5
```

## Execution

After pre-flight passes (or user acknowledges warnings), run the deploy:

```bash
npm run <script-name>
```

Report the output. If deployment succeeds, show the URL. If it fails, show the error and suggest fixes.

## Argument Parsing

- No argument or `production` -> `npm run deploy:production`
- `preview` -> `npm run deploy:preview`
- `worker` -> `npm run deploy:worker`
- `worker:production` or `worker prod` -> `npm run deploy:worker:production`
- `hybrid` -> `npm run deploy:hybrid`
- `arcade` or `arcade-api` -> `npm run deploy:arcade-api`
- `pages` -> `npm run deploy`

If the argument doesn't match any target, list the available targets and ask the user to pick one.
