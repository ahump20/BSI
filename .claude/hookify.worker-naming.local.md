---
name: warn-worker-naming
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: wrangler\.(toml|jsonc)$
  - field: new_text
    operator: regex_match
    pattern: name\s*=\s*"(?!bsi-)[a-z]
---

**Worker naming convention violation.** New Cloudflare Workers must follow the `bsi-{domain}-{function}` pattern.

Examples:
- `bsi-scores-live` (correct)
- `bsi-cbb-ingest` (correct)
- `my-cool-worker` (wrong)

Exceptions: `blazesportsintel-worker-prod`, `college-baseball-mcp`, `blaze-field-*`, `mini-games-api`, `moltbot-sandbox` are grandfathered.
