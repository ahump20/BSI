# Blaze Sports Intel — Texas Longhorns MCP

The Blaze Sports Intel (BSI) Texas Longhorns Multi-Context Provider delivers historical data services for the Longhorns' flagship men's programs: **Baseball → Football → Basketball → Track & Field**. Every tool adheres to the Blaze mobile contract, emits citations with Central Time (America/Chicago) timestamps, and exposes Cloudflare-friendly cache metadata.

> **No soccer** — Soccer is intentionally excluded at the platform, API, and documentation layers. All requests that attempt to access soccer content are rejected with a `SOCCER_FORBIDDEN` error.

## Quick Start

```bash
# Install dependencies
npm install

# Run the unit tests (includes MCP policy coverage)
npm run test -- tests/mcp/texas-longhorns.test.ts
```

### Registering the MCP

1. Point your MCP client at [`mcp/manifest.json`](./mcp/manifest.json).
2. Ensure the runtime can execute TypeScript (Node.js 20+ or Cloudflare Workers with Wrangler).
3. Provide the optional Cloudflare bindings (KV, R2, D1, Durable Objects) via the `LonghornsEnv` interface to unlock full caching.

## Tool Surface

| Tool | Summary | Key Notes |
| --- | --- | --- |
| `get_team_seasons` | Baseball-first season summaries across the supported sports. | Optional `sport` filter; rejects soccer. |
| `get_season_schedule` | Season schedule (or meet slate) for a given sport. | `program` disambiguates basketball and track programs. |
| `get_game_box_score` | Box score / meet result bundle for the specified game ID. | Includes cache metadata; throws on unknown IDs. |
| `get_player_career` | Curated player dossier search across all supported sports. | Baseball-first search order; soccer slug guard. |
| `get_rankings_context` | Poll movement and ranking trends. | Honors the required sport ordering. |
| `search_archive` | Search the Blaze Sports Intel archive. | Rejects soccer queries, returns archive citation. |

All responses follow this schema:

```json
{
  "result": { /* tool-specific payload */ },
  "citations": [
    {
      "id": "baseball-feed",
      "label": "Texas baseball feed",
      "path": "mcp/texas-longhorns/feeds/baseball.json",
      "timestamp": "2025-10-19 12:42:03 CDT"
    }
  ],
  "generatedAt": "2025-10-19 12:42:03 CDT",
  "meta": {
    "cache": {
      "key": "longhorns:get_team_seasons:1c3c8fae5e7c4d92",
      "status": "MISS"
    }
  }
}
```

## Data Sources & Licensing

Each tool uses pre-approved feeds and references with Blaze-compliant licensing:

- **Baseball** – NCAA.com, D1Baseball, Boyd's World (RPI), Warren Nolan, TexasSports.com
- **Football** – Sports-Reference CFB, TexasSports.com, AP/Coaches polls, NCAA records
- **Basketball** – Sports-Reference CBB, (optional) KenPom (licensed), TexasSports.com, NCAA records
- **Track & Field** – TFRRS.org, USTFCCCA, TexasSports.com

If a data partner restricts redistribution, the MCP returns descriptive pointers plus citations, never scraped payloads.

## Cloudflare Caching Blueprint

The server includes a cascading cache writer/reader that mirrors the Cloudflare stack:

1. **KV Namespace (`LONGHORNS_KV`)** – 5-minute TTL edge cache for fast key lookups.
2. **R2 Bucket (`LONGHORNS_R2`)** – Durable JSON archive at `seasons/{sport}/{season}.json` style keys.
3. **D1 Database (`LONGHORNS_D1`)** – Normalized cache table (`longhorns_cache`) for auditing and historical replays.
4. **Durable Object (`LONGHORNS_DO`)** – Serialized coordination for concurrent updates (box score streaming, etc.).
5. **In-memory Map** – Local fallback for offline development and unit testing.

`meta.cache.status` returns `HIT` when any layer responds and `MISS` when a fresh payload is generated and pushed through the stack. Cache keys always follow `longhorns:{tool}:{hash(args)}`.

## Mobile Output Contract

The MCP is designed for Blaze Sports Intel's mobile clients:

- Compact JSON objects and arrays suitable for low-bandwidth networks.
- Stable property ordering (Baseball → Football → Basketball → Track & Field) to simplify UI streaming.
- Timestamps always formatted via `America/Chicago` (CDT/CST).
- Citations required on every response with `[Source: <site>, YYYY-MM-DD HH:MM CDT]` semantics.

## Local Development

```bash
# Run MCP unit tests continuously
npm run test -- --watch tests/mcp/texas-longhorns.test.ts

# Type-check the server
npm run typecheck -- --project tsconfig.json
```

### Recommended Environment Variables

```env
# Cloudflare bindings (optional but recommended)
LONGHORNS_KV=<kv-namespace>
LONGHORNS_R2=<r2-binding>
LONGHORNS_D1=<d1-binding>
LONGHORNS_DO=<durable-object-namespace>
```

### Golden Season Smoke Tests

Use these to validate data parity before deploying:

- **Baseball** – 2005 season
- **Football** – 2008 season
- **Basketball** – 2023 season (Men)
- **Track & Field** – 2024 Outdoor campaign

## Further Study

Explore the Coursera course *Foundations of Sports Analytics: Data, Representation, and Models in Sports* by Wenche Wang (University of Michigan) for deeper data-engineering context. Respect all licensing constraints when applying third-party analytics techniques.

---

The Blaze Sports Intel Longhorns MCP is production-ready for Cloudflare Pages + Workers deployments and GitHub-based CI/CD pipelines.
