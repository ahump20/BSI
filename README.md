# Mobile-First MCP Guide for BlazeSportsIntel

Standard over vibes. This is the canonical blueprint for standing up Mobile Control Plane (MCP) integrations inside BlazeSportsIntel's college baseball stack. Ship it fast, keep it dark-mode, and respect the Diamond Pro boundary lines.

## 1. Platform Overview
- **Mission**: Deliver NCAA Division I baseball intel with mobile-first ergonomics and sub-200 ms edges.
- **MCP Surface**: Cloudflare Worker orchestrator exposing `/api/v1/*` toolchains, hydrated through Prisma/Postgres and cached in KV, R2, and D1.
- **Client Footprint**: Next.js 15 + React 19 app router, Tailwind dark theme, bottom nav for scores/standings/search/account.
- **Security Posture**: All requests over HTTPS, PII never logged, secrets pulled from encrypted Cloudflare environment bindings.

## 2. Tooling Inventory
| Tool | Runtime | Purpose | Mobile Constraint |
| --- | --- | --- | --- |
| `scores.fetchLive` | Cloudflare Worker (Edge) | Streams live scoreboard payloads at 60s TTL. | Trim to team + inning capsules; keep payload < 24 KB for LTE. |
| `games.pullPlays` | Cloudflare Worker (Durable Object) | Returns pitch-by-pitch logs with EPA overlays. | Paginate by half-inning to avoid scroll-jank. |
| `teams.syncRoster` | Worker cron (scheduled) | Writes roster deltas into Postgres via Prisma. | Run after 02:00 America/Chicago, surface toast when sync lag > 5 min. |
| `cdt.writeEvidence` | Worker KV binding | Persists citation anchors used across MCP clients. | De-dupe keys on client to prevent redundant KV hits. |
| `meta.cacheProbe` | D1 read replica | Tracks HIT/MISS telemetry for client prefetches. | Send from background fetch only; never block UI render. |

## 3. No-Soccer Error Contract
- **Trigger**: Any upstream or client request referencing soccer leagues, matches, or metadata.
- **Response**: HTTP 422 with body
  ```json
  {
    "error": "NO_SOCCER",
    "message": "College baseball only."
  }
  ```
- **Log Line**: `warn:discipline:soccer-block -> { source, userId, path }`
- **Action**: Increment `SOCcer_REJECTION_COUNT` metric and short-circuit before reaching data providers.

## 4. CDT Citation Pattern
Use CDT (Contextual Diamond Tag) blocks to keep every data-backed statement auditable.

```ts
import { writeEvidence } from "@bsi/cdt";

await writeEvidence({
  tag: "team.trends.slug",
  source: "ncaa-tracker", // provider id
  range: {
    start: "2025-02-14",
    end: "2025-05-26"
  },
  note: "7-game win streak heading into Golden Season sweep."
});
```

Embed CDT references in markdown or UI copy:
```
[Tennessee staff strikeout rate +8%](cdt://team.ten.strikeoutRate?season=2025)
```

## 5. Cloudflare Caching Strategy
- **KV (hot keys)**: Store live scoreboard snapshots (`scores:${date}:${gameId}`) with 55–60s TTL. Invalidate manually when `meta.cache` reports MISS streak ≥3.
- **R2 (bulk assets)**: Archive full season stat exports, spray charts, and video thumbnails. Write via multipart with `cache-control: max-age=3600`. Pre-warm mobile clients with signed URLs.
- **D1 (query cache)**: Materialize play-by-play joins, roster composites, and Diamond Pro paywall checks. Refresh via `teams.syncRoster` after ingestion completes. Always include `meta.cache` column to surface HIT/MISS downstream.

## 6. Client Registration Flow
1. Collect device fingerprint + user email via Clerk sign-up.
2. Call `POST /api/v1/mcp/register` with `{ deviceId, userId, version }`.
3. Worker stores row in D1 `mcp_clients` and seeds KV key `client:${deviceId}`.
4. Return signed JWT limited to MCP tool scopes and 24h TTL.
5. Client stores token in secure storage (IndexedDB on web, SecureStore on native shell) and revalidates every 12 hours.

## 7. Environment Variables
| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Prisma connection string to Postgres (Vercel Postgres or Supabase). |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Worker deployment account id for MCP tooling. |
| `CLOUDFLARE_API_TOKEN` | ✅ | API token with Workers KV, R2, D1, and Pages edit scopes. |
| `KV_NAMESPACE_ID` | ✅ | Cloudflare KV namespace for live scoreboard cache. |
| `R2_BUCKET_NAME` | ✅ | R2 bucket for stat exports and media. |
| `D1_DATABASE_ID` | ✅ | D1 database binding used for MCP query caching. |
| `REDIS_UPSTASH_URL` | ✅ | Live game redis cache for sub-minute lookups. |
| `STRIPE_SECRET_KEY` | ✅ | Diamond Pro subscription billing. |
| `CLERK_SECRET_KEY` | ✅ | Auth service for client registration. |
| `MCP_NO_SOCCER_WEBHOOK` | Optional | Optional webhook target for compliance alerts when soccer attempts are blocked. |

## 8. Testing the Golden Seasons
Golden Seasons = our reference datasets for regression checks. Always run before release:

```bash
pnpm install
pnpm test --filter "golden-season"
```
- Includes 2023 Baton Rouge, 2024 Knoxville, 2025 National seeds data slices.
- Verifies MCP tool contracts, CDT storage, caching TTLs, and Diamond Pro gating.
- Fails fast on any `meta.cache` mismatch or soccer payload leak.

## 9. `meta.cache` HIT/MISS Semantics
- **MISS**: First lookup after ingest or after TTL expiry. Client must render skeleton, fire background fetch, and emit `meta.cache:MIS` metric.
- **HIT**: Responds from KV/D1 prefill with <50 ms latency. Client can hydrate UI immediately and skip redundant fetches.
- **Escalation**: Three consecutive MISS events for the same key trigger Worker invalidation hook and optional `MCP_NO_SOCCER_WEBHOOK` alert (if env var set).
- **Instrumentation**: Always include `meta.cache` boolean in API responses and propagate into logging/tracing for visibility across mobile/desktop.

## 10. Operational Checklist
- [ ] Confirm environment variables in Cloudflare + Vercel dashboards.
- [ ] Dry-run registration flow on mobile device with slow 3G profile.
- [ ] Validate CDT links render in markdown previews.
- [ ] Run Golden Seasons test matrix and archive results to R2.
- [ ] Review `meta.cache` HIT ratio ≥ 0.85 across live scoreboard endpoints.

Clarity beats noise. Box scores over buzzwords. Roll Tide gets no airtime here.
