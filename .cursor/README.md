# Cursor Configuration (BSI)

This folder contains Cursor IDE rules and commands for the Blaze Sports Intel project.

## Structure

```
.cursor/
├── rules/          # Context rules (applied based on globs or always)
├── commands/       # Slash commands (/bsi-plan, /bsi-deploy, etc.)
└── README.md       # This file
```

## Rules (24 total)

Rules in `.cursor/rules/` are `.mdc` files with frontmatter specifying when they apply:

### Always Applied (Global Context)

| File | Description |
|------|-------------|
| `001-bsi-core.mdc` | Core project context |
| `002-bsi-security.mdc` | Secrets and safety |
| `010-bsi-cloudflare.mdc` | Cloudflare conventions |
| `020-bsi-typescript-quality.mdc` | TypeScript quality bar |
| `021-cloudflare-globals.mdc` | CF Workers runtime globals |
| `022-eslint-context.mdc` | ESLint config context |
| `030-bsi-brand-voice.mdc` | Brand voice for copy |
| `060-favorite-teams.mdc` | Cardinals/Longhorns context |
| `070-no-placeholders.mdc` | Zero placeholders policy |

### File-Specific Rules

| File | Scope | Description |
|------|-------|-------------|
| `040-sports-data-adapters.mdc` | `lib/adapters/**` | Data adapter rules |
| `041-react-components.mdc` | `components/**`, `app/**/*.tsx` | React conventions |
| `042-workers-config.mdc` | `**/wrangler.toml`, `workers/**` | Worker config |
| `043-test-files.mdc` | `tests/**`, `**/*.test.ts` | Test conventions |
| `044-api-routes.mdc` | `app/api/**`, `lib/api/**` | API route rules |
| `045-mcp-servers.mdc` | `mcp/**` | MCP server rules |
| `046-scripts.mdc` | `scripts/**` | Automation scripts |
| `047-validation-schemas.mdc` | `lib/validation/**`, `**/*.schema.ts` | Zod schemas |
| `048-games.mdc` | `games/**` | Interactive games |
| `049-tailwind-theming.mdc` | `tailwind.config.*`, `src/styles/**` | Design tokens |
| `050-college-baseball.mdc` | `**/college-baseball/**` | Priority sport |
| `080-documentation.mdc` | `docs/**`, `*.md` | Doc conventions |
| `081-github-workflows.mdc` | `.github/workflows/**` | CI/CD workflows |
| `090-3d-graphics-engine.mdc` | `**/graphics/**`, `**/*3D*` | Three.js/shaders |
| `091-bsi-production.mdc` | `bsi-production/**` | Production site |

## Commands (15 total)

Slash commands in `.cursor/commands/`:

### Planning & Implementation

| Command | Purpose |
|---------|---------|
| `/bsi-plan` | Plan before coding |
| `/bsi-implement` | Implement with discipline |
| `/bsi-refactor` | Safe refactoring workflow |

### Review & Quality

| Command | Purpose |
|---------|---------|
| `/bsi-audit` | Surgical code review |
| `/bsi-pr` | Generate PR description |
| `/bsi-test` | Run and analyze tests |
| `/bsi-check` | Health check and validation |

### Debugging & Data

| Command | Purpose |
|---------|---------|
| `/bsi-debug` | Systematic debugging |
| `/bsi-data` | Debug sports data issues |
| `/bsi-ingest` | Data ingestion workflow |

### Operations

| Command | Purpose |
|---------|---------|
| `/bsi-deploy` | Deployment checklist |
| `/bsi-api` | API endpoint development |
| `/bsi-migrate` | Database migration workflow |
| `/bsi-quick` | Quick reference for common ops |

### Specialized

| Command | Purpose |
|---------|---------|
| `/bsi-graphics` | 3D graphics development |

## Related Files

- `.cursorignore` — Files excluded from AI context (secrets, binaries)
- `.cursorindexingignore` — Files excluded from indexing (+ large generated files)

## Usage Tips

1. **Commands are context-aware** — Use `/bsi-data` when debugging sports data, `/bsi-graphics` for 3D work
2. **Rules auto-apply** — When editing `lib/adapters/espn-api.ts`, the adapter rules activate automatically
3. **Combine commands** — Use `/bsi-plan` first, then `/bsi-implement` for complex features
4. **Use `/bsi-check`** — Run health checks before major work or deployments

## After Changes

When modifying rules or commands:

1. Save the file
2. Cursor will pick up changes automatically (or restart if needed)
3. Commit changes to share with the team:

```bash
git add .cursor
git commit -m "chore: Update Cursor rules"
```
