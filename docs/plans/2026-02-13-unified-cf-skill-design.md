# Unified `/cf` Skill — Design

**Date:** 2026-02-13
**Status:** Approved
**Replaces:** `/deploy`, `/new-worker`, `bsi-cloudflare-platform`, current `/cf`

## Problem

Four separate Cloudflare skills plus an MCP server, independently authored. Fragmented, overlapping, partially stale. TDD baselines showed Claude discovers MCP tools fine on its own — the routing tables add no value. The real gaps are server disambiguation, error recovery, and BSI-specific conventions.

## Decision

One skill (`/cf`) replaces all four. Every line must either:
1. Address a failure proven by TDD baselines, OR
2. Encode a stable BSI convention Claude can't infer from the codebase

Everything else is cut.

## What Migrates

| Source | Keeps | Drops |
|--------|-------|-------|
| current `/cf` | Server priority, pagination, safety rules, live state directive | Routing table |
| `/deploy` | Deploy target mapping (7 npm scripts) | Pre-flight checks (Claude does these naturally) |
| `/new-worker` | Nothing (conventions table covers it) | Code templates, directory structure |
| `bsi-cloudflare-platform` | Naming conventions, anti-sprawl rules, TTL reference | Code snippets, binding configs, wrangler templates |

## Skill Content (~430 words target)

### Section 1: Server Priority (baseline-proven)

| Priority | Prefix | Use |
|----------|--------|-----|
| 1st | `mcp__cloudflare__` | Default, locally configured |
| 2nd | `mcp__claude_ai_Wrangler_Deploy__` | Fallback for `[object Object]` responses |
| Skip | `mcp__claude_ai_Cloudflare_Developer_Platform__` | Duplicate |
| Skip | `mcp__claude_ai_Cloudflare_Developer_Platform_2__` | Duplicate |

Retry with next priority server on unparseable responses.

### Section 2: Safety (stable interface)

- Read-safe: list, get, SELECT, keys, whoami, analytics
- Confirm before: put, set, create, delete, deploy, rollback, execute, INSERT/UPDATE/DELETE/DROP/ALTER/CREATE
- Show exactly what changes and which resource

### Section 3: Pagination (baseline-proven)

Follow cursors/continuation tokens until full list retrieved.

### Section 4: Deploy Targets (stable)

| Argument | Script |
|----------|--------|
| `production` (default) | `deploy:production` |
| `preview` | `deploy:preview` |
| `worker` | `deploy:worker` |
| `worker:production` | `deploy:worker:production` |
| `hybrid` | `deploy:hybrid` |
| `arcade-api` | `deploy:arcade-api` |
| `pages` | `deploy` |

### Section 5: BSI Conventions (stable policy)

**Naming:**
| Resource | Pattern | Example |
|----------|---------|---------|
| Worker | `bsi-{domain}-{function}` | `bsi-scores-live` |
| KV | `BSI_{DOMAIN}_{PURPOSE}` | `BSI_SCORES_CACHE` |
| D1 | `bsi-{domain}-db` | `bsi-analytics-db` |
| R2 | `bsi-{domain}-assets` | `bsi-media-assets` |

**Anti-sprawl:** Replace over add. Search before create. Delete obsolete in same commit. Cloudflare only.

**TTL:** Live scores 15-30s. Standings 60s. Final games 5min. Rosters 1hr.

### Section 6: Live State (one line)

Never hardcode resource counts or names. Query the API.

## Excluded (with reasoning)

- **Routing tables** — baselines proved Claude discovers tools via ToolSearch
- **Code templates** — Claude generates from conventions alone
- **Binding configs** — wrangler docs / Claude's training knowledge
- **Infrastructure inventory** — goes stale immediately
- **Pre-flight checks** — Claude already runs git status / tsc when context warrants

## Testing Plan

TDD baselines before deployment:
1. "List my workers" — verify server priority followed, pagination works
2. "Query D1 with a DELETE" — verify safety confirmation triggers
3. "Deploy production" — verify correct npm script selected
4. "Scaffold a new worker called bsi-alerts" — verify naming conventions applied

## Implementation Steps

1. Write unified SKILL.md (~430 words)
2. TDD baseline all 4 scenarios WITHOUT skill
3. TDD verify all 4 scenarios WITH skill
4. Delete `/deploy/SKILL.md`, `/new-worker/SKILL.md`, `user/bsi-cloudflare-platform/`
5. Commit all changes together
