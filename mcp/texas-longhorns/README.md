# Texas Longhorns MCP Server

The Texas Longhorns MCP server ships a baseball-first data interface with football, basketball, and track & field support layered in the mandated order. Every tool emits citations with Central Time (America/Chicago) timestamps and exposes cache metadata so mobile clients can reason about payload freshness.

## Tooling Overview

| Tool | Purpose | Notes |
| --- | --- | --- |
| `get_team_seasons` | Returns season summaries per sport in baseball → football → basketball → track & field order. | Optional `sport` filter. Rejects soccer. |
| `get_season_schedule` | Retrieves a season schedule (or meet slate) for the chosen sport. | `program` parameter disambiguates basketball/track. |
| `get_game_box_score` | Provides structured box score or meet result bundles. | Includes `meta.cache` status. |
| `get_player_career` | Surfaces curated player career dossiers. | Looks across all approved sports, baseball first. |
| `get_rankings_context` | Packages ranking and trend context per sport. | Honors mandated ordering. |
| `search_archive` | Searches the vetted Blaze Sports Intel archive. | Automatically appends archive citation. |

All responses share the schema:

```json
{
  "result": { /* tool-specific payload */ },
  "citations": [
    {
      "id": "baseball-feed",
      "label": "Texas baseball feed",
      "path": "mcp/texas-longhorns/feeds/baseball.json",
      "timestamp": "2025-10-16 14:03:17 CDT"
    }
  ],
  "generatedAt": "2025-10-16 14:03:17 CDT",
  "meta": {
    "cache": {
      "key": "longhorns:get_team_seasons:1c3c8fae5e7c4d92",
      "status": "MISS"
    }
  }
}
```

## Usage Examples

### Team seasons (all sports)

```ts
import { get_team_seasons } from './server';

const response = await get_team_seasons();
```

### Football schedule lookup

```ts
const response = await get_season_schedule({
  sport: 'football',
  season: '2025'
});
```

### Player dossier

```ts
const response = await get_player_career({
  playerId: 'ivan-melendez'
});
```

### Archive search

```ts
const response = await search_archive({
  query: 'SEC title',
  limit: 3
});
```

Each response includes `meta.cache.status` (`HIT` or `MISS`) and the canonical cache key pattern `longhorns:{tool}:{hash(args)}`. Downstream consumers can use this metadata to short-circuit redundant UI fetches.

## Citation Format

* Every citation records the source `path`, a human-readable `label`, and a timestamp formatted via `America/Chicago` with `CDT`/`CST` suffixes.
* `search_archive` always prepends the archive feed citation before sport-specific sources.
* Timestamps update even when served from cache so clients can display the retrieval clock without ambiguity.

## Caching Strategy

The server fans out writes across Cloudflare storage primitives before falling back to in-memory caching:

1. **KV Namespace (`LONGHORNS_KV`)** – primary key-value storage with a 5-minute TTL.
2. **R2 Bucket (`LONGHORNS_R2`)** – durable object storage with JSON metadata and matching TTL.
3. **D1 Database (`LONGHORNS_D1`)** – optional `longhorns_cache` table for auditing cache persistence.
4. **Durable Object (`LONGHORNS_DO`)** – shared cache arbiter for edge workers.
5. **In-memory Map** – final fallback for local execution/testing.

The `meta.cache.status` flag is derived after these layers are consulted. HIT means at least one upstream cache had a payload; MISS triggers a fresh resolution and populates every available layer.

## Cloudflare Worker Integration

This module is designed to run inside a Cloudflare Worker or Node.js environment:

* Pass the Worker `env` object to each handler via the optional `ToolContext` to activate KV/R2/D1/DO persistence.
* Without an `env`, the server uses the shared in-memory cache (suitable for unit tests and local development).

```ts
import { get_team_seasons } from './server';

const response = await get_team_seasons({}, { env });
```

## No-Soccer Policy

Soccer content is out-of-scope for Blaze Sports Intel. Any attempt to:

* Request `sport: 'soccer'`
* Include "soccer" (or variants) in an archive query

…will throw a `LonghornsError` with code `SOCCER_FORBIDDEN` and the message documented in `manifest.json`. Mobile clients should surface that string verbatim.

## Mobile Integration Notes

* Responses are intentionally flat JSON with small objects to keep payloads light for mobile networks.
* Cache keys expose enough entropy to build offline stores keyed by tool + arguments.
* Timestamp formatting is stable for analytics logging and toast notifications.
* Archive search sorts results by mandated sport order, then by recency, enabling predictable UI grouping.

Standard over vibes. Clarity beats noise. Box scores over buzzwords.
