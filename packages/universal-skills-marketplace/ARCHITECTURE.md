# Universal Skills Marketplace — Architecture

> **ClaudOpenAI is unofficial. Not affiliated with Anthropic or OpenAI. See NOTICE.**

Context7 for skills, not docs. One MCP server. Two ecosystems.

## System Topology

```
┌──────────────────────────────────────────────────────────────────────────┐
│ UPSTREAM REPOS (9 — Tier A/B/C)                                         │
│                                                                          │
│  anthropics/claude-plugins-official   anthropics/skills                  │
│  anthropics/knowledge-work-plugins    openai/codex                       │
│  openai/codex-plugin-cc               openai/plugins                     │
│  openai/skills                        openai/swarm                       │
│  openai/openai-agents-python                                             │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │ git sparse-clone + ls-remote
                       ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ WORKER: universal-skills-indexer     cron = "0 */6 * * *"               │
│ indexer.marketplace.blazesportsintel.com                                 │
│   walk → parse frontmatter → translate → canonical JSON → UPSERT D1    │
│   Bindings: DB (D1), CONTENT (R2), INDEXER_STATE (KV), GITHUB_TOKEN     │
└──────────────────────┬───────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ STORAGE                                                                  │
│  D1 universal-skills        R2 universal-skills-content   KV (3 ns)     │
│    skills                     skills/{id}/{ver}/skill.md    CACHE        │
│    skill_versions             skills/{id}/{ver}/refs.tgz    RATE_LIMIT   │
│    skill_references           skills/{id}/{ver}/canonical   INDEXER_STATE│
│    sources                    .json                                      │
│    skills_fts (FTS5)                                                     │
└──────────┬───────────────────────────────────────┬───────────────────────┘
           ↓                                       ↓
┌─────────────────────────┐          ┌─────────────────────────┐
│ WORKER: api             │          │ WORKER: bridge          │
│ api.marketplace.blaze.. │          │ marketplace.blaze..com  │
│                         │          │                         │
│ POST /mcp (JSON-RPC 2.0)│          │ GET /.claude-plugin/    │
│  resolve-skill          │          │     marketplace.json    │
│  get-skill-content      │          │ GET /.agents/plugins/   │
│  install-skill          │          │     marketplace.json    │
│ GET  /health            │          │ GET /health             │
│ 60 rpm/IP (KV)          │          │ read-only D1            │
└──────────┬──────────────┘          └──────────┬──────────────┘
           ↑                                    ↑
           │                                    │
┌──────────┴─────────────────┐  ┌───────────────┴─────────────────┐
│ CLAUDE CODE                │  │ OPENAI CODEX                    │
│ ~/.claude/mcp.json:        │  │ ~/.codex/config.toml:           │
│ {"universal-skills": {     │  │ [mcp_servers.universal-skills]  │
│  "type":"http",            │  │ command = "npx"                 │
│  "url":"api.marketplace.." │  │ args = ["-y","@bsi/u-s-mcp"]   │
│  OR "command":"npx",...}}  │  │                                 │
└────────────────────────────┘  └─────────────────────────────────┘
```

## Key Architectural Decisions

### 1. Context7 pattern — trivial wrappers, logic in npm

Per `references/10-context7-architectural-analysis.md`:
- `.claude-plugin/plugin.json` — 3 fields. No code.
- `.codex-plugin/plugin.json` — full Codex schema, still no code.
- `.mcp.json` — just declares `npx -y @blazesportsintel/universal-skills-mcp`.
- All logic lives in `packages/mcp-server/`.

### 2. Canonical intermediate format

Translator operates `ClaudePlugin ↔ CanonicalSkill ↔ CodexPlugin`. Never direct.

- Schema: `assets/schemas/canonical-skill.schema.json` (JSON Schema) + `packages/mcp-server/src/types.ts` (TypeScript)
- Every field mismatch logged in `translation_log[]` — no silent drops.

### 3. `.mcp.json` shape divergence

```json
// Claude — FLAT
{ "<server-name>": { "command": "...", "args": [...] } }

// Codex — WRAPPED
{ "mcpServers": { "<server-name>": { "command": "...", "args": [...] } } }
```

Translator rewrites on every direction. Verified against:
- `assets/real-examples/context7-mcp.json` (Claude flat)
- `assets/real-examples/openai-cloudflare-mcp.json` (Codex wrapped)

### 4. Git sparse-clone, not Code Search

GitHub Code Search: 30 rpm authenticated. Unmetered via CDN sparse-clone.
See `references/08-github-indexer-design.md` for the math.

### 5. Quality scoring 0-100

Rubric in `references/09-quality-scoring-rubric.md`. Deterministic — same canonical JSON always produces the same score. Breakdown persists in D1 alongside the aggregate.

## Package Layout

```
packages/universal-skills-marketplace/   ← THIS DIRECTORY (skill framework)
  SKILL.md                               ← ≤100 lines, Phase 1 deliverable
  ARCHITECTURE.md                        ← this file
  NOTICE                                 ← unofficial project statement
  references/00-12-*.md                  ← 13 design documents
  scripts/validate.sh                    ← self-validator (Phase 1 gate)
  scripts/scaffold.sh                    ← bootstrap new plugin/skill
  scripts/fetch-upstream-catalog.sh      ← Phase 3 indexer seed
  scripts/test-translator.ts             ← translator round-trip tests
  assets/schemas/                        ← JSON Schema files (Phase 1 deliverable)
  assets/templates/                      ← blank templates for all manifest types
  assets/fixtures/                       ← known-good, lossy, malformed test vectors
  assets/real-examples/                  ← verbatim copies from installed plugin cache
  assets/diagrams/                       ← Mermaid source diagrams

packages/mcp-server/                     ← Phase 2: npm package
  src/index.ts                           ← MCP server (3 tools)
  src/translator.ts                      ← Claude ↔ Canonical ↔ Codex
  src/registry.ts                        ← catalog search (in-memory → D1 in Phase 3)
  src/scorer.ts                          ← 0-100 quality rubric
  src/github-client.ts                   ← sparse-clone + ETag

workers/                                 ← Phase 3: Cloudflare Workers
  universal-skills-indexer/
  universal-skills-api/
  universal-skills-bridge/
```

## Deployment Targets

| Resource | Name | URL |
|----------|------|-----|
| Worker (api) | `universal-skills-api` | `api.marketplace.blazesportsintel.com` |
| Worker (indexer) | `universal-skills-indexer` | `indexer.marketplace.blazesportsintel.com` |
| Worker (bridge) | `universal-skills-bridge` | `marketplace.blazesportsintel.com` |
| D1 | `universal-skills` | — |
| R2 | `universal-skills-content` | — |
| KV | `CACHE`, `RATE_LIMIT`, `INDEXER_STATE` | — |
| npm | `@blazesportsintel/universal-skills-mcp` | npmjs.com |

## Verification Gates

- **Phase 1:** `bash packages/universal-skills-marketplace/scripts/validate.sh` → exit 0
- **Phase 2:** `npx @modelcontextprotocol/inspector node packages/mcp-server/dist/index.js` → 3 tools listed
- **Phase 3:** `curl https://api.marketplace.blazesportsintel.com/health` → `{"status":"ok",...}`

Full matrix in `references/12-verification-playbook.md`.

## Ecosystem Key Insights (from audit 2026-04-12)

| Discovery | Impact |
|-----------|--------|
| SKILL.md format is identical across both ecosystems | No transformation needed for skill content; bridge only needs manifest translation |
| codex-plugin-cc ships a `.claude-plugin/` wrapper, proving cross-ecosystem plugins work today | Architecture is validated before we write a line |
| Claude marketplace uses JSON with SHA-pinned git sources; Codex uses directory hierarchy | Bridge normalizes both into one D1 table |
| Claude `.mcp.json` is flat; Codex `.mcp.json` is wrapped `{"mcpServers":{...}}` | Translator must rewrite on every direction |
| Codex `interface{}` block (14 sub-fields) has no Claude equivalent | Stash in `codex_ecosystem.json` sidecar; log as `lossy` |
| Codex `apps` connector registry has no Claude equivalent | Same: sidecar + documentation shim |
