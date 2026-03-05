# Trust Layer Completion Design

**Date:** 2026-02-25
**Scope:** Close wiring gaps + add test coverage for the trust/freshness components shipped in the Trust & Data-Quality Hardening session.

## Problem

Three gaps remain after the trust hardening session:

1. `HomeLiveScores` shows `FreshnessBadge` with `isLive` but no `fetchedAt`. The component already tracks `lastFetched` state (set on every successful fetch) — it just isn't connected to the badge.

2. `IntelHeader` shows `FreshnessBadge` with `isLive={liveCount > 0}` but no `fetchedAt`. The dashboard page has `stats.lastUpdated` available but doesn't pass it to the component.

3. `FreshnessBadge`, `HealthDot`, and `EmptyState` `source-unavailable` variant all have zero test coverage. Every other major component in the codebase has vitest tests.

## Design

### Fix 1: HomeLiveScores fetchedAt wiring

`components/home/HomeLiveScores.tsx` line 389:

```tsx
// Before
{hasLiveGames && <FreshnessBadge isLive />}

// After
{hasLiveGames && <FreshnessBadge isLive fetchedAt={lastFetched?.toISOString()} />}
```

`lastFetched` is `Date | null` state initialized at line 294, set at line 330 on every successful `fetchAllScores()`. No other changes needed.

### Fix 2: IntelHeader fetchedAt prop

Add `fetchedAt?: string` to `IntelHeaderProps` and wire it in:

```tsx
// IntelHeader props (add)
fetchedAt?: string;

// IntelHeader render (update)
<FreshnessBadge isLive={liveCount > 0} fetchedAt={fetchedAt} />
```

Dashboard page call site (line ~506 area where IntelHeader is rendered):

```tsx
<IntelHeader
  ...existing props...
  fetchedAt={stats.lastUpdated}
/>
```

### Fix 3: Test coverage

Three test files, all in `tests/workers/` or `tests/components/` — consistent with existing test structure.

**`tests/components/FreshnessBadge.test.tsx`**
- Renders null when `isLive=false` regardless of `fetchedAt`
- Renders green "LIVE" dot when `fetchedAt` is less than 2 minutes ago
- Renders yellow "LIVE · Xm ago" when `fetchedAt` is 2–5 minutes ago
- Renders orange "STALE · Xm ago" when `fetchedAt` is >5 minutes ago
- Renders without timestamp when `fetchedAt` is undefined (falls back to fresh)

**`tests/components/HealthDot.test.tsx`**
- Returns null during loading / unknown state
- Renders green dot + "Status" link when all endpoints are healthy
- Renders yellow dot when some endpoints failed
- Renders red dot when all endpoints failed
- Hides silently (returns null) on fetch error

**`tests/components/EmptyState.source-unavailable.test.tsx`**
- Renders WifiOff icon for `source-unavailable` type
- Shows "Data Source Unavailable" title
- Shows retry button when `onRetry` is provided
- Renders correctly for each of the four existing types (regression)

**`tests/workers/college-baseball-standings-endpoint-meta.test.ts`**
- Happy path (ESPN + Highlightly): response includes `meta.sources` array and `meta.degraded: false`
- Degraded path (ESPN only): `meta.degraded: true`, `meta.sources: ['espn-v2']`
- Full failure: `meta.degraded: true`, `meta.sources: []`

## Files Changed

| File | Type | Change |
|------|------|--------|
| `components/home/HomeLiveScores.tsx` | Fix | Wire `fetchedAt` to `FreshnessBadge` |
| `components/dashboard/intel/IntelHeader.tsx` | Fix | Add `fetchedAt` prop |
| `app/dashboard/page.tsx` | Fix | Pass `fetchedAt={stats.lastUpdated}` to IntelHeader |
| `tests/components/FreshnessBadge.test.tsx` | New | Unit tests — 5 cases |
| `tests/components/HealthDot.test.tsx` | New | Unit tests — 5 cases |
| `tests/components/EmptyState.source-unavailable.test.tsx` | New | Unit tests — 7 cases |
| `tests/workers/college-baseball-standings-endpoint-meta.test.ts` | New | Integration — 3 cases |

## Success Criteria

1. `npm run build` passes
2. `npx vitest run` — all tests pass, new test count ≥ 520
3. `HomeLiveScores` LIVE badge shows honest age (green → yellow → orange as time passes)
4. IntelHeader LIVE badge shows honest age
5. Standings handler test explicitly asserts `meta.sources` and `meta.degraded` shape
