# Real Examples

Verbatim copies of real manifest + hook files from the user's installed plugin cache. Each file includes a `// from:` annotation comment where the format permits (JSON files rely on this README for provenance).

## Source annotations

| File | Source path | Purpose |
|------|-------------|---------|
| `context7-plugin.json` | `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/context7/.claude-plugin/plugin.json` | The 7-line trivial Claude wrapper we emulate |
| `context7-mcp.json` | `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/context7/.mcp.json` | The 5-line Claude `.mcp.json` pointing to an npm package |
| `openai-canva-plugin.json` | `~/.codex/plugins/cache/openai-curated/canva/fb0a18376bcd9f2604047fbe7459ec5aed70c64b/.codex-plugin/plugin.json` | Full Codex manifest with `interface{}` block, `apps` pointer, minimal author (`{url}` only), no `mcpServers`/`developerName`/`brandColor` |
| `openai-cloudflare-plugin.json` | `~/.codex/plugins/cache/openai-curated/cloudflare/fb0a18376bcd9f2604047fbe7459ec5aed70c64b/.codex-plugin/plugin.json` | Codex manifest with `mcpServers` pointer, full author object |
| `openai-cloudflare-mcp.json` | `~/.codex/plugins/cache/openai-curated/cloudflare/fb0a18376bcd9f2604047fbe7459ec5aed70c64b/.mcp.json` | WRAPPED-shape Codex `.mcp.json` — note the outer `{"mcpServers": {...}}` wrapper |
| `openai-github-plugin.json` | `~/.codex/plugins/cache/openai-curated/github/fb0a18376bcd9f2604047fbe7459ec5aed70c64b/.codex-plugin/plugin.json` | Codex manifest with `apps` connector registry |
| `openai-figma-hooks.json` | `~/.codex/plugins/cache/openai-curated/figma/fb0a18376bcd9f2604047fbe7459ec5aed70c64b/hooks.json` | The only Codex-ecosystem `hooks.json` observed in the 16-plugin corpus; uses `PostToolUse` event |
| `bsi-college-baseball-intelligence-SKILL.md` | `BSI-repo/skill-improvements/college-baseball-intelligence/SKILL.md` | Real standalone SKILL.md following router pattern (dispatcher ≤100 lines) |
| `codex-plugin-cc-plugin.json` | `~/.research/ecosystem/codex-plugin-cc/plugins/codex/.claude-plugin/plugin.json` | **Cross-ecosystem proof**: OpenAI ships this Claude wrapper for Codex — confirms bidirectional plugin compatibility today |
| `codex-plugin-cc-marketplace.json` | `~/.research/ecosystem/codex-plugin-cc/.claude-plugin/marketplace.json` | The marketplace.json that ships with codex-plugin-cc; shows a Codex org publishing into Claude's marketplace format |
| `anthropic-skills-marketplace.json` | `~/.research/ecosystem/anthropic-skills/.claude-plugin/marketplace.json` | Anthropic's official skills marketplace.json — skills listed as directory paths within the same repo |
| `claude-knowledge-work-sales-plugin.json` | `~/.research/ecosystem/knowledge-work-plugins/sales/.claude-plugin/plugin.json` | Knowledge-work domain plugin (sales) — same minimal 3-field Claude plugin.json pattern |
| `claude-mcp-server-dev-plugin.json` | `~/.research/ecosystem/claude-plugins-official/plugins/mcp-server-dev/.claude-plugin/plugin.json` | Official Anthropic plugin for MCP server development — canonical minimal plugin.json |
| `openai-skill-installer-SKILL.md` | `~/.research/ecosystem/openai-skills/skills/.system/skill-installer/SKILL.md` | OpenAI's `.system` skill for installing other skills — confirms SKILL.md frontmatter is identical to Claude's format |

## Why these specific files

**Chosen for coverage:** together they exercise every major shape in the manifest translator:

- Claude minimal wrapper (context7)
- Claude `.mcp.json` flat shape (context7)
- Codex `.mcp.json` wrapped shape (openai-cloudflare-mcp)
- Codex `interface{}` with 14 sub-fields (openai-cloudflare)
- Codex with partial fields — `apps` present, `mcpServers` absent (openai-canva)
- Codex with `apps` connector (openai-github)
- Codex `hooks.json` with `PostToolUse` (openai-figma-hooks)
- Standalone SKILL.md following router pattern (bsi-college-baseball-intelligence)
- Cross-ecosystem Claude wrapper from OpenAI (codex-plugin-cc) — **bidirectional proof**
- Anthropic's own marketplace.json with directory-path skill refs (anthropic-skills)
- OpenAI `.system` SKILL.md showing identical frontmatter format (openai-skill-installer)

## Usage

Templates in `../templates/` are **blueprints** — use them to generate new manifests. These `real-examples/` are **ground truth** — use them to verify that generated output matches real-world structure.

Translator round-trip tests at `../fixtures/` reference these files as sources for their expected outputs.

## Do NOT edit

If you need a different example, add a new file alongside. Don't edit these — they represent observed reality as of 2026-04-12. Editing them invalidates the translator's ground truth.

## Refresh procedure

If a future Phase 0 spike revisits the installed plugin cache (e.g. after Codex or Claude plugin schema changes upstream), rerun:

```bash
bash skills/universal-skills-marketplace/scripts/fetch-upstream-catalog.sh --refresh-real-examples
```

The script re-copies all files listed above with updated paths + regenerates this README.
