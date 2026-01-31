# Transfer Portal Phase 1: Credibility

## Goal
Replace sample/hardcoded data with D1-backed pipeline. Every record has valid timestamp, source attribution, and data quality flags. UI shows freshness and recent activity.

## Acceptance Criteria
- [x] Zero placeholder strings reach UI
- [x] Every record has valid timestamp and source attribution
- [x] 100+ entries per active sport render without UI glitches
- [x] "Last updated" always reflects KV marker or latest D1 update time
- [x] Failure states visible to user, not hidden

## Technical Approach
- D1 `transfer_portal` + `transfer_portal_changelog` tables (migration 016)
- Seed endpoint populates 130 baseball + 125 football entries
- v2/entries API reads D1 with server-side filtering/pagination/KV caching
- Ingestion endpoint stores R2 snapshots, writes D1, updates KV marker
- Freshness endpoint returns status + recent changes
- Frontend polls every 30s with delta fetches, shows freshness indicator

## Files Modified
- `migrations/016_transfer_portal.sql` — new D1 schema
- `lib/portal/types.ts` — added quality flags, freshness types
- `lib/portal/utils.ts` — added formatTimeAgo
- `lib/portal/api.ts` — v2 API client, freshness client
- `functions/api/portal/v2/entries.ts` — rewritten to query D1
- `functions/api/portal/seed.ts` — data seeder
- `functions/api/portal/freshness.ts` — freshness/changelog API
- `functions/api/portal/ingest.ts` — ingestion with R2 snapshots
- `app/transfer-portal/page.tsx` — freshness UI, 30s polling, failure banners
