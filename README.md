# BlazeSportsIntel MCP Overview

## Purpose
- Anchor the BlazeSportsIntel mobile stack to a single, Cloudflare-friendly Model Context Protocol (MCP) surface that delivers college baseball intelligence first, while leaving hooks for football, basketball, and track & field expansions.
- Standardize how tools expose deterministic payloads, caching hints, and citation-ready metadata so downstream clients (mobile apps, workers, dashboards) can reason about source trust without custom adapters.

## Sport Coverage Ladder
1. **Baseball (Primary)** – NCAA Division I focus with extensions for recruiting, portal, and MLB draft crosswalks.
2. **Football (Secondary)** – Depth modules activate only when baseball parity is satisfied; inheriting the same telemetry contracts.
3. **Basketball (Tertiary)** – Lightweight analytics overlays for postseason scouting.
4. **Track & Field (Emerging)** – Event timing and split projections for training partners.

### No-Soccer Policy
- BlazeSportsIntel does **not** ingest, cache, or visualize soccer content. Attempts to register soccer contexts must be rejected at the tool layer with `422` errors and audit logging.

## MCP Tool Suite
| Tool | Intent | Mobile-First Contract Notes |
| --- | --- | --- |
| `resolve-library-id` | Resolve a canonical library slug used by mobile clients. | Responses must fit in ≤1 KB and include `meta.cache` hints for KV hydration. |
| `get-library-docs` | Pull curated documentation slices for sanctioned libraries. | Must prefer dark-mode UI snippets; TTL defaults to 12 hours unless overridden. |
| `sports-context` | Supply compact, ordered sport capsules for chat or widgets. | Respect the baseball → football → basketball → track ordering regardless of request order. |
| `inject-sports-context` | Merge supplemental context into a docs payload. | Enforce bounded supplements (<750 characters) with explicit TTLs. |
| `cache-stats` | Inspect cache health for docs/context scopes. | Only available in non-production nodes; guard behind `NODE_ENV !== "production"`. |
| `invalidate-cache` | Drop KV/Redis entries by key or glob. | Requires dual confirmation flags in production deployments.

### Usage Examples
All tools accept a **mobile-first contract** object: `version`, `tool`, `meta`, and `input`. The `meta.cache` block carries hints used by Cloudflare KV, R2, and D1 workers.

#### `resolve-library-id`
```json
{
  "version": "2025.10-mobile",
  "tool": "resolve-library-id",
  "meta": {
    "client": "bsi-mobile-app",
    "cache": {
      "tier": "kv",
      "ttlSeconds": 86400,
      "staleWhileRevalidateSeconds": 600
    }
  },
  "input": {
    "libraryName": "context7 enhanced"
  }
}
```
_Response excerpt_
```json
{
  "id": "@blaze/context7-enhanced",
  "name": "Context7 Enhanced",
  "source": "official",
  "meta": {
    "cache": {
      "tier": "kv",
      "hit": false,
      "ttlSeconds": 86400
    }
  }
}
```

#### `get-library-docs`
```json
{
  "version": "2025.10-mobile",
  "tool": "get-library-docs",
  "meta": {
    "client": "bsi-mobile-app",
    "cache": {
      "tier": "r2",
      "ttlSeconds": 43200,
      "revalidateEverySeconds": 1800
    }
  },
  "input": {
    "context7CompatibleLibraryID": "@blaze/context7-enhanced",
    "topic": "dark-mode-theming",
    "tokens": 2400
  }
}
```
_Response excerpt_
```json
{
  "docs": "Tailwind tokens for dark-mode mobile cards...",
  "meta": {
    "libraryID": "@blaze/context7-enhanced",
    "topic": "dark-mode-theming",
    "cache": {
      "tier": "r2",
      "hit": true,
      "ageMs": 42000
    }
  }
}
```

#### `sports-context`
```json
{
  "version": "2025.10-mobile",
  "tool": "sports-context",
  "meta": {
    "client": "bsi-mobile-app",
    "cache": {
      "tier": "redis",
      "ttlSeconds": 60,
      "bustOn": ["live-game", "portal-update"]
    }
  },
  "input": {
    "sport": "baseball",
    "league": "NCAA-DI",
    "team": "LSU Tigers",
    "timeframe": "live"
  }
}
```
_Response excerpt_
```json
{
  "supplement": {
    "type": "context",
    "ts": "2025-10-13T14:05:22Z",
    "ttlSeconds": 45,
    "ordering": ["baseball", "football", "basketball", "track"],
    "body": "Baseball • LSU up 4-1 mid 6th..."
  },
  "cache": {
    "tier": "redis",
    "hit": false
  }
}
```

#### `inject-sports-context`
```json
{
  "version": "2025.10-mobile",
  "tool": "inject-sports-context",
  "meta": {
    "client": "bsi-mobile-app",
    "cache": {
      "tier": "kv",
      "ttlSeconds": 600,
      "propagate": true
    }
  },
  "input": {
    "context7CompatibleLibraryID": "@blaze/context7-enhanced",
    "topic": "lineup-optimizers",
    "supplement": {
      "type": "context",
      "ts": "2025-10-13T14:07:10Z",
      "ttlSeconds": 120,
      "ordering": ["baseball", "football", "basketball", "track"],
      "body": "Portal watch: two-way transfer target visiting Thursday."
    }
  }
}
```
_Response excerpt_
```json
{
  "merged": {
    "docs": "Lineup optimizer API parameters...",
    "supplement": {
      "type": "context",
      "ts": "2025-10-13T14:07:10Z",
      "ttlSeconds": 120,
      "ordering": ["baseball", "football", "basketball", "track"],
      "body": "Portal watch: two-way transfer target visiting Thursday."
    }
  }
}
```

#### `cache-stats`
```json
{
  "version": "2025.10-mobile",
  "tool": "cache-stats",
  "meta": {
    "client": "bsi-mobile-app",
    "cache": {
      "tier": "d1",
      "ttlSeconds": 30,
      "debug": true
    }
  },
  "input": {
    "scope": "docs"
  }
}
```
_Response excerpt_
```json
{
  "scope": "docs",
  "mem": { "size": 128, "hits": 542, "misses": 23 },
  "redis": { "hits": 211, "misses": 9 },
  "p95HitMs": 14
}
```

#### `invalidate-cache`
```json
{
  "version": "2025.10-mobile",
  "tool": "invalidate-cache",
  "meta": {
    "client": "bsi-mobile-app",
    "cache": {
      "tier": "kv",
      "ttlSeconds": 5,
      "requires": ["prod-confirm", "pager-duty-ack"]
    }
  },
  "input": {
    "pattern": "sports-context:baseball:lsu:*"
  }
}
```
_Response excerpt_
```json
{
  "ok": true,
  "removed": 12
}
```

## Citation Rules
1. Always cite MCP-derived facts with the `F:<relative_path>†Lx-Ly` or `<chunk_id>†Lx-Ly` syntax.
2. Summaries must trail the cited sentence; never lead with the citation.
3. Tool responses must embed a `meta.source` block listing the authoritative path or run chunk.
4. When a fact spans multiple tools, cite the most authoritative (docs before context before cache stats).

## Cloudflare KV/R2/D1 Caching Blueprint
- **KV (Hot Edge Read Layer)**: Store deterministic doc and context responses with TTL ≤24h; enable `stale-while-revalidate` workers for mobile prefetches. Keys follow `mcp:{tool}:{hash}`. KV writes originate from `mcp/server.ts` only.
- **R2 (Object Payload Archive)**: Persist large doc slices (>32 KB) and replayable game bundles. `meta.cache.tier === "r2"` instructs downstream workers to bypass KV and fetch signed R2 URLs.
- **D1 (Queryable Audit Log)**: Mirror cache events (`invalidate-cache`, smoke checks) with ISO timestamps and partner identifiers. D1 entries guard compliance and power the admin audit UI.
- **Redis/Upstash (Live Overlay)**: Handle sub-60 second sports contexts. TTL hard-capped at 60 seconds with automatic fan-out to KV once stability >90 seconds.
- **Worker Flow**: Mobile request → Edge Worker checks Redis → falls back to KV → escalates to R2 if `meta.cache.tier` demands → logs event to D1 for traceability.

## `mcp/server.ts` Setup
The TypeScript server binds the tools above into a Cloudflare Worker-compatible MCP endpoint.

### Dependencies
- Node.js 20+
- `pnpm` 9+
- TypeScript, `tsx`, and `zod` (already declared in the MCP workspace)

### Environment Variables for Approved Data Partners
| Variable | Partner | Purpose |
| --- | --- | --- |
| `MCP_PARTNER_HIGHLIGHTLY_KEY` | Highlightly | College baseball play-by-play + pitch data. |
| `MCP_PARTNER_TRACKMAN_KEY` | TrackMan | Indoor training telemetry (exit velo, spin). |
| `MCP_PARTNER_STATSCAST_KEY` | Statcast | MLB alignment for draft comps. |
| `MCP_PARTNER_FASTMODEL_KEY` | FastModel | Basketball set-play context (for offseason scouting). |
| `MCP_PARTNER_PERFTRACK_KEY` | Performance Tracking Labs | Track & field split timing feeds. |

Populate these variables in `.env.local` (development) and `wrangler.toml` secrets (Cloudflare). Never commit raw keys.

### Local Installation
```bash
pnpm install
pnpm exec prisma generate # ensures shared types when server resolves player IDs
pnpm exec tsx scripts/apply-mcp-keys.ts --profile dev
```

### Local Smoke Checks
```bash
# Validate partner keys and cache bindings
pnpm exec tsx mcp/server.ts --smoke-check partners

# Dry-run the championship dashboard contract
pnpm exec tsx mcp/server.ts --smoke-check championship

# Verify Redis and KV connectivity with synthetic baseball contexts
pnpm exec tsx mcp/server.ts --smoke-check cache
```
Each smoke check writes a row to the D1 audit log and emits a structured JSON report under `./.reports/mcp/` for manual inspection. Failures must block deployment until addressed.

## Further Study
- **Coursera – Sports Analytics** (University of Michigan): https://www.coursera.org/learn/sports-analytics. Use for conceptual frameworks only; course datasets are licensed for personal educational use and **cannot** be redistributed or reproduced inside BlazeSportsIntel products without written permission.
