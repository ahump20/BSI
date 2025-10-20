# BlazeSportsIntel Championship MCP

Standard over vibes. This repo is the control tower for wiring BlazeSportsIntel's multi-sport Championship MCP into downstream agents. Everything here skews mobile-first, citation-driven, and Cloudflare-native.

## Registering the MCP

1. **Install the runtime** your agent expects (Node.js 18+). The MCP manifest is published at the repo root as `manifest.json`.
2. **Provide the entrypoint** to your orchestrator: point it at `server.ts` (compiled to JavaScript if your runtime cannot execute TypeScript directly).
3. **Set environment bindings** for Cloudflare KV, R2, and D1 if you are deploying inside a Worker. Local development can substitute in-memory mocks, but production must mount:
   - `KV_BSI_MCP` for cache metadata writes.
   - `R2_BSI_MCP` for storing raw payload mirrors.
   - `D1_BSI_MCP` for auditing requests and sport-order compliance.
4. **Respect the sport order** baked into the manifest metadata: Baseball → Football → Basketball → Track. Any attempt to insert Soccer will be rejected by validation hooks and server-side guards.

## Tool Contracts

All tools speak **mobile-first JSON schemas** to simplify downstream rendering. Core principles:

- `sport` is always lower-case and limited to `baseball`, `football`, `basketball`, or `track`.
- Responses embed `meta.cache` describing Cloudflare KV lookups, along with CDT-formatted citations (`CDT:ISO8601|https://source`).
- Tool payloads prefer arrays of cards, timelines, or table-ready rows. Keep heavy assets (play-by-play logs, video manifests) in R2 and reference by signed URL.

| Tool | Purpose | Required Input | Key Payload Blocks |
| --- | --- | --- | --- |
| `get_team_seasons` | Snapshot a program's golden-season arc. | `sport`, `team_id` | `seasons[]` with record, highlights, sources. |
| `get_season_schedule` | Pull the authoritative season slate. | `sport`, `season` | `games[]` with opponent, date, venue, result. |
| `get_game_box_score` | Serve mobile-ready stats w/ CDT citations. | `sport`, `game_id` | `box_score` object containing summary, citations, stat groupings. |
| `get_player_career` | Summarize scouting deltas across seasons. | `sport`, `player_id` | `career` object with `seasons[]` metrics, sources. |
| `get_rankings_context` | Map poll + ELO swings week-to-week. | `sport`, `season` | `rankings.polls[]` plus sources. |
| `search_archive` | Query licensed clippings/transcripts. | `sport`, `query` | `results[]` with synopsis, timestamps, sources. |

## Citation Discipline (CDT Format)

Every record leaving the MCP tags its source using the **Citation Delta Token (CDT)**: `CDT:<ISO8601 timestamp>|<source url>`. Downstream clients should log these untouched and surface them inline where possible. When federating data, append multiple CDT entries in an array.

## Cloudflare Data Strategy

- **KV (hot cache):** store serialized tool responses keyed by `bsi:mcp:<tool>:<sport>:...`. TTL is capped at 60 seconds during live windows.
- **R2 (object storage):** hydrate with raw licensed payloads (box score JSON, PDF transcripts, imagery manifests). Keep metadata-light responses under 250 KB to maximize edge performance.
- **D1 (audit trail):** persist each invocation, along with `requestId`, sport order index, and whether the KV lookup was a HIT or MISS. Use this to enforce ordering discipline and trigger alerts on repeated misses.

All Cloudflare bindings should be wired through Worker secrets. Local development can shim them with `miniflare` or lightweight mocks.

## Golden Season Testing Matrix

Before shipping changes, exercise the toolchain against the four canonical seasons:

| Sport | Season | Command | Expectation |
| --- | --- | --- | --- |
| Baseball | 2005 | `node scripts/test-mcp.js get_team_seasons --sport baseball --team_id rice` | Returns stub record with CDT citation, KV MISS. |
| Football | 2008 | `node scripts/test-mcp.js get_season_schedule --sport football --season 2008` | Confirms schedule array and ordering guard. |
| Basketball | 2023 | `node scripts/test-mcp.js get_game_box_score --sport basketball --game_id kansas-texas-20230311` | Includes CDT citation and Cloudflare KV metadata. |
| Track | 2024 | `node scripts/test-mcp.js search_archive --sport track --query "4x400"` | Applies limit clamp and rejects soccer silently. |

Document results in `MIGRATION_LOG.md` when promoting to production.

## Development Workflow

1. Use Prettier + ESLint on staged files (`npm run lint -- server.ts`).
2. Update tests or smoke scripts under `scripts/` to mirror any schema adjustments.
3. Regenerate deployment bundles for Workers and Next.js as needed.
4. Submit PRs through the branch protections—no direct pushes to `main`.

Clarity beats noise. Box scores over buzzwords.
