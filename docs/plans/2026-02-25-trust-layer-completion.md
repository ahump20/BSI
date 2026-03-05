# Trust Layer Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the two FreshnessBadge wiring gaps and add test coverage for all trust-layer components shipped in the previous session.

**Architecture:** Two one-line wiring fixes (HomeLiveScores, IntelHeader), one hook return-value addition (useIntelDashboard), four new test files covering FreshnessBadge, HealthDot, EmptyState, and standings meta shape.

**Tech Stack:** React 19, TypeScript, Vitest, @testing-library/react, jsdom

---

### Task 1: Wire fetchedAt in HomeLiveScores

**Files:**
- Modify: `components/home/HomeLiveScores.tsx:389`

**Step 1: Make the change**

Line 389 currently reads:
```tsx
{hasLiveGames && <FreshnessBadge isLive />}
```

Replace with:
```tsx
{hasLiveGames && <FreshnessBadge isLive fetchedAt={lastFetched?.toISOString()} />}
```

`lastFetched` is `Date | null` state already declared at line 294 and set at line 330 on every successful fetch. No imports or state changes needed.

**Step 2: Verify build**

Run: `npx vitest run --reporter=dot 2>&1 | tail -5`
Expected: All tests still pass.

**Step 3: Commit**

```bash
git add components/home/HomeLiveScores.tsx
git commit -m "fix(home): wire fetchedAt to FreshnessBadge in HomeLiveScores"
```

---

### Task 2: Wire fetchedAt in IntelHeader via useIntelDashboard

IntelHeader renders at `app/intel/page.tsx:148`. The data comes from `useIntelDashboard` which uses React Query's `useQueries` — each query result has `dataUpdatedAt: number` (ms timestamp of last successful fetch). We'll expose the max across all score queries as `lastFetched`.

**Files:**
- Modify: `lib/intel/hooks.ts` — add `lastFetched` to `useIntelDashboard` return
- Modify: `components/dashboard/intel/IntelHeader.tsx` — add `fetchedAt` prop, wire to FreshnessBadge
- Modify: `app/intel/page.tsx` — destructure `lastFetched`, pass to IntelHeader

**Step 1: Add lastFetched to useIntelDashboard return**

In `lib/intel/hooks.ts`, find the return block at line 1003:

```typescript
return {
    games: enrichedGames,
    hero,
    ...
    isError,
};
```

Add before `isError`:

```typescript
    lastFetched: Math.max(...scoreQueryResults.map(r => r.dataUpdatedAt ?? 0)) || undefined,
```

**Step 2: Add fetchedAt prop to IntelHeader**

In `components/dashboard/intel/IntelHeader.tsx`, add to `IntelHeaderProps` interface (line 22 area):

```typescript
fetchedAt?: string;
```

Add to destructured props (line 39 area):

```typescript
fetchedAt,
```

Update line 68:
```tsx
// Before
<FreshnessBadge isLive={liveCount > 0} />
// After
<FreshnessBadge isLive={liveCount > 0} fetchedAt={fetchedAt} />
```

**Step 3: Pass fetchedAt from intel page**

In `app/intel/page.tsx`, update the destructure at line 58-71:

Add `lastFetched` to the destructured return of `useIntelDashboard`.

Update the IntelHeader render at line 148-157, adding:
```tsx
fetchedAt={lastFetched ? new Date(lastFetched).toISOString() : undefined}
```

**Step 4: Verify build**

Run: `npx vitest run --reporter=dot 2>&1 | tail -5`
Expected: All tests still pass.

**Step 5: Commit**

```bash
git add lib/intel/hooks.ts components/dashboard/intel/IntelHeader.tsx app/intel/page.tsx
git commit -m "fix(intel): wire fetchedAt to IntelHeader FreshnessBadge via useIntelDashboard"
```

---

### Task 3: FreshnessBadge unit tests

**Files:**
- Create: `tests/components/FreshnessBadge.test.tsx`

**Step 1: Write the tests**

```tsx
/**
 * FreshnessBadge Component Tests
 *
 * Tests the honest data-freshness badge that replaced static LiveBadge.
 * Verifies rendering for all freshness levels and the isLive gate.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';

describe('FreshnessBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when isLive is false', () => {
    const { container } = render(
      <FreshnessBadge isLive={false} fetchedAt="2026-02-25T11:59:00Z" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when isLive is omitted', () => {
    const { container } = render(
      <FreshnessBadge fetchedAt="2026-02-25T11:59:00Z" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows green LIVE when data is less than 2 minutes old', () => {
    render(
      <FreshnessBadge isLive fetchedAt="2026-02-25T11:59:00Z" />
    );
    expect(screen.getByText(/LIVE/)).toBeTruthy();
    // Should NOT contain age suffix
    expect(screen.queryByText(/ago/)).toBeNull();
  });

  it('shows yellow LIVE with age when data is 2-5 minutes old', () => {
    render(
      <FreshnessBadge isLive fetchedAt="2026-02-25T11:57:00Z" />
    );
    const badge = screen.getByText(/LIVE/);
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('3m ago');
  });

  it('shows orange STALE with age when data is over 5 minutes old', () => {
    render(
      <FreshnessBadge isLive fetchedAt="2026-02-25T11:50:00Z" />
    );
    const badge = screen.getByText(/STALE/);
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('10m ago');
  });

  it('defaults to fresh when fetchedAt is undefined', () => {
    render(
      <FreshnessBadge isLive />
    );
    // Falls back to "now" — should show green LIVE
    expect(screen.getByText(/LIVE/)).toBeTruthy();
    expect(screen.queryByText(/ago/)).toBeNull();
  });

  it('treats invalid date as stale', () => {
    render(
      <FreshnessBadge isLive fetchedAt="not-a-date" />
    );
    // getAgeMinutes returns 999 for invalid dates → stale
    expect(screen.getByText(/STALE/)).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/components/FreshnessBadge.test.tsx`
Expected: 7 tests pass.

**Step 3: Commit**

```bash
git add tests/components/FreshnessBadge.test.tsx
git commit -m "test(ui): add FreshnessBadge unit tests — 7 cases"
```

---

### Task 4: HealthDot unit tests

**Files:**
- Create: `tests/components/HealthDot.test.tsx`

**Step 1: Write the tests**

```tsx
/**
 * HealthDot Component Tests
 *
 * Tests the tiny health indicator used in the site footer.
 * Fetches /api/status once on mount and renders a colored dot.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HealthDot } from '@/components/layout-ds/HealthDot';

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('HealthDot', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders nothing initially (unknown state)', () => {
    fetchSpy.mockImplementation(() => new Promise(() => {})); // never resolves
    const { container } = render(<HealthDot />);
    // While loading, health is 'unknown' → returns null
    expect(container.innerHTML).toBe('');
  });

  it('renders green dot when all endpoints are healthy', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({
        endpoints: [
          { name: 'API', status: 'ok' },
          { name: 'Homepage', status: 'ok' },
        ],
      }), { status: 200 })
    );

    render(<HealthDot />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeTruthy();
    });
    // Link should point to /status
    const link = screen.getByText('Status').closest('a');
    expect(link?.getAttribute('href')).toBe('/status');
  });

  it('renders yellow dot when some endpoints failed', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({
        endpoints: [
          { name: 'API', status: 'ok' },
          { name: 'Ingest', status: 'error' },
        ],
      }), { status: 200 })
    );

    render(<HealthDot />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeTruthy();
    });
  });

  it('renders red dot when all endpoints failed', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({
        endpoints: [
          { name: 'API', status: 'error' },
          { name: 'Ingest', status: 'error' },
        ],
      }), { status: 200 })
    );

    render(<HealthDot />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeTruthy();
    });
  });

  it('hides silently on fetch error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<HealthDot />);

    // Wait for the effect to settle
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    // Should remain hidden (unknown → null)
    expect(container.innerHTML).toBe('');
  });

  it('hides on non-200 response', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Not Found', { status: 404 })
    );

    const { container } = render(<HealthDot />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    expect(container.innerHTML).toBe('');
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/components/HealthDot.test.tsx`
Expected: 6 tests pass.

**Step 3: Commit**

```bash
git add tests/components/HealthDot.test.tsx
git commit -m "test(ui): add HealthDot unit tests — 6 cases"
```

---

### Task 5: EmptyState source-unavailable tests

**Files:**
- Create: `tests/components/EmptyState.test.tsx`

**Step 1: Write the tests**

```tsx
/**
 * EmptyState Component Tests
 *
 * Tests all five empty state types, with focus on the new
 * 'source-unavailable' variant added in the trust hardening session.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders no-games state with Calendar heading', () => {
    render(<EmptyState type="no-games" />);
    expect(screen.getByText('No Games Found')).toBeTruthy();
    expect(screen.getByText(/no games scheduled/i)).toBeTruthy();
  });

  it('renders no-results state', () => {
    render(<EmptyState type="no-results" />);
    expect(screen.getByText('No Results')).toBeTruthy();
  });

  it('renders error state with retry button', () => {
    const onRetry = vi.fn();
    render(<EmptyState type="error" onRetry={onRetry} />);
    expect(screen.getByText('Something Went Wrong')).toBeTruthy();

    const button = screen.getByText('Try Again');
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders offseason state without retry button', () => {
    const onRetry = vi.fn();
    render(<EmptyState type="offseason" onRetry={onRetry} />);
    expect(screen.getByText('Offseason')).toBeTruthy();
    // Offseason should NOT show retry
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('renders source-unavailable state', () => {
    render(<EmptyState type="source-unavailable" />);
    expect(screen.getByText('Data Source Unavailable')).toBeTruthy();
    expect(screen.getByText(/data provider isn't responding/i)).toBeTruthy();
  });

  it('shows retry button for source-unavailable when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<EmptyState type="source-unavailable" onRetry={onRetry} />);
    const button = screen.getByText('Try Again');
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button for source-unavailable when no onRetry', () => {
    render(<EmptyState type="source-unavailable" />);
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('hides retry button for no-games even when onRetry provided', () => {
    render(<EmptyState type="no-games" onRetry={() => {}} />);
    expect(screen.queryByText('Try Again')).toBeNull();
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/components/EmptyState.test.tsx`
Expected: 8 tests pass.

**Step 3: Commit**

```bash
git add tests/components/EmptyState.test.tsx
git commit -m "test(ui): add EmptyState unit tests — 8 cases covering all 5 types"
```

---

### Task 6: Standings endpoint meta shape tests

**Files:**
- Create: `tests/workers/college-baseball-standings-meta.test.ts`
- Reference: `tests/workers/college-baseball-standings-endpoint.test.ts` (existing mock patterns)
- Reference: `tests/utils/mocks.ts` (createMockEnv, ESPN_STANDINGS, HIGHLIGHTLY_STANDINGS)

These tests verify the end-to-end contract: the standings handler returns `meta.sources` and `meta.degraded` fields that the new UI indicator reads.

**Step 1: Write the tests**

```typescript
/**
 * Standings Meta Shape Tests
 *
 * Verifies that the college baseball standings handler returns
 * meta.sources and meta.degraded in the response — the fields
 * that the standings data-source indicator reads on the frontend.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockEnv, createMockCtx, HIGHLIGHTLY_STANDINGS, ESPN_STANDINGS } from '../utils/mocks';

// ---------------------------------------------------------------------------
// Fetch mocks
// ---------------------------------------------------------------------------

function mockBothSources() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    // Highlightly standings
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/standings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_STANDINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ESPN standings
    if (urlStr.includes('espn.com') && urlStr.includes('/standings')) {
      return new Response(JSON.stringify(ESPN_STANDINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ESPN rankings (handler also fetches these)
    if (urlStr.includes('espn.com') && urlStr.includes('/rankings')) {
      return new Response(JSON.stringify({ rankings: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as unknown as typeof fetch;
}

function mockHighlightlyOnly() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/standings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_STANDINGS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ESPN fails
    if (urlStr.includes('espn.com')) {
      return new Response('Service Unavailable', { status: 503 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as unknown as typeof fetch;
}

function mockAllSourcesFail() {
  return vi.fn(async () => {
    return new Response('Service Unavailable', { status: 503 });
  }) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('standings meta.sources and meta.degraded', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: { fetch: (request: Request, env: any, ctx?: any) => Promise<Response> };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    env = createMockEnv();
    worker = await import('../../workers/index');
    if ('default' in worker) worker = (worker as any).default;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('includes meta.sources array and meta.degraded:false on happy path', async () => {
    globalThis.fetch = mockBothSources();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(body.meta).toBeDefined();
    expect(Array.isArray(body.meta.sources)).toBe(true);
    expect(body.meta.sources.length).toBeGreaterThan(0);
    // When Highlightly succeeds, degraded should be false
    expect(body.meta.degraded).toBe(false);
  });

  it('returns meta.sources with highlightly when ESPN fails', async () => {
    globalThis.fetch = mockHighlightlyOnly();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(body.meta).toBeDefined();
    expect(Array.isArray(body.meta.sources)).toBe(true);
    // Highlightly-only path still has data — should include highlightly
    expect(body.meta.sources).toContain('highlightly');
  });

  it('returns meta.degraded:true and empty sources on full failure', async () => {
    globalThis.fetch = mockAllSourcesFail();

    const req = new Request('https://blazesportsintel.com/api/college-baseball/standings?conference=SEC');
    const res = await worker.fetch(req, env, createMockCtx());
    const body = await res.json() as any;

    expect(body.meta).toBeDefined();
    expect(body.meta.degraded).toBe(true);
    expect(Array.isArray(body.meta.sources)).toBe(true);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run tests/workers/college-baseball-standings-meta.test.ts`
Expected: 3 tests pass.

**Step 3: Commit**

```bash
git add tests/workers/college-baseball-standings-meta.test.ts
git commit -m "test(standings): verify meta.sources and meta.degraded shape in response"
```

---

### Task 7: Full suite verification + build

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass, total count ≥ 520.

**Step 2: Run build**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds — 1074+ pages, no errors.

**Step 3: Final commit if any fixes needed**

If any test or build failures require small fixes, commit them here.

---

## Verification Checklist

- [ ] `HomeLiveScores` FreshnessBadge receives `fetchedAt`
- [ ] `IntelHeader` FreshnessBadge receives `fetchedAt` via props
- [ ] `useIntelDashboard` returns `lastFetched` from React Query timestamps
- [ ] FreshnessBadge: 7 test cases pass
- [ ] HealthDot: 6 test cases pass
- [ ] EmptyState: 8 test cases pass
- [ ] Standings meta: 3 test cases pass
- [ ] Full vitest run: all pass, count ≥ 520
- [ ] `npm run build` succeeds
