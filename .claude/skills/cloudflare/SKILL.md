---
name: cf
description: >
  Use when inspecting, querying, managing, deploying, or scaffolding Cloudflare
  infrastructure — Workers, D1, KV, R2, crons, secrets, routes, DO, Workflows, or AI.
---

# Cloudflare — BSI Control Plane

Routing and safety layer for all Cloudflare operations. BSI infrastructure context
lives in `~/.claude/cloudflare.local.md` (loaded by the cloudflare-skills plugin).
This skill handles disambiguation, safety gates, deploy targets, and MCP routing.

For deep Cloudflare knowledge, defer to the cloudflare plugin's specialized skills:
- Durable Objects patterns: `cloudflare:durable-objects`
- Worker best practices: `cloudflare:workers-best-practices`
- Wrangler CLI reference: `cloudflare:wrangler`
- Agents SDK: `cloudflare:agents-sdk`
- Web performance: `cloudflare:web-perf`

BSI-specific Worker patterns (Hono router, handler structure, anti-patterns):
`~/.claude/cloudflare.workers-bsi.local.md`

## MCP Server Priority

Multiple Cloudflare MCP servers exist. Use in order, fall through on failure:

| Priority | Method | When to use |
|----------|--------|-------------|
| 1st | `mcp__plugin_cloudflare_*` | Default — locally configured plugin servers |
| 2nd | `mcp__cloudflare-mcp-*` | Standalone local MCP servers |
| 3rd | `mcp__claude_ai_Cloudflare_*` | Cloud-hosted MCP servers |
| 4th | Cloudflare REST API via Bash | Last resort (OAuth at `~/.wrangler/config/default.toml`) |

Account ID: `a12cb329d84130460eed99b816e4d0d3`.

## Tool Loading

```
ToolSearch(query: "select:mcp__plugin_cloudflare_<tool_name>")
```

Load all tools needed for a composite operation in parallel.

## Pagination

List operations may return partial results. If a response includes a cursor,
continuation token, or indicates truncation, make follow-up calls until the full
list is retrieved. KV list paginates at 20 per page — pass `per_page=100` or
follow `cursor` to get the full set.

## Safety

**No confirmation needed:** list, get, query (SELECT), keys, whoami, analytics

**Always confirm before executing:**
- Any `put`, `set`, `create`, `delete`, `deploy`, `rollback`, `execute`
- D1 queries containing INSERT, UPDATE, DELETE, DROP, ALTER, CREATE
- Setting or deleting secrets or env vars

Show exactly what will change and which resource it affects.

## Deploy Targets

When asked to deploy, map the argument to the correct npm script:

| Argument | Script |
|----------|--------|
| `production` (default) | `npm run deploy:production` |
| `preview` | `npm run deploy:preview` |
| `worker` | `npm run deploy:worker` |
| `worker:production` | `npm run deploy:worker:production` |
| `hybrid` | `npm run deploy:hybrid` |
| `arcade-api` | `npm run deploy:arcade-api` |
| `pages` | `npm run deploy` |

If the argument doesn't match, list available targets and ask.

## BSI Overrides

- **Config format:** BSI uses `wrangler.toml` — NOT `wrangler.jsonc`. Translate any plugin examples accordingly.
- **Anti-sprawl:** Replace over add. Search before create. Delete obsolete in same commit. Cloudflare only — no AWS, Vercel, or external databases.
- Naming conventions, TTLs, worker inventory, and deploy patterns: see `~/.claude/cloudflare.local.md`.

## Live State

Never hardcode resource counts or names. All commands hit Cloudflare's API in real time.
When asked for an infrastructure overview, run these four in parallel:
`worker_list`, `get_kvs`, `d1_list_databases`, `r2_list_buckets`
