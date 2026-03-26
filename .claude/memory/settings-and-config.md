# Claude Code Settings & Configuration

## Auto Mode (applied March 24, 2026)
- `~/.claude/settings.json` updated: `defaultMode: "auto"` (was `"dontAsk"`)
- `autoMode.environment`: 7 BSI context entries (Cloudflare, trusted domains, data sources)
- `permissions.deny`: 8 rules — rm -rf, force push, DROP/DELETE on D1, .env reads, secrets/
- `permissions.allow`: 57 rules (expanded from 36) — generalized wrangler, npm, git, curl patterns
- Existing hooks, plugins (25), statusLine, effortLevel all preserved
- Claude Code version at time of config: 2.1.81
- Backup at `~/.claude/settings.json.bak`

## .env Protection (double-layer)
- Deny rule: `Read(./.env)`, `Read(./.env.*)`
- PreToolUse hook: blocks Edit/Write on any file matching `.env`
- Both layers must be maintained — deny rules have known regressions (GitHub #12918, #27040)
