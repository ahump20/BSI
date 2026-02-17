/**
 * Pages Function Fallback Test — /api/live-scores
 *
 * Tests the minimal fallback payload served by functions/api/live-scores.ts
 * when the main Worker can't handle live scores requests. Verifies the
 * contract that the UI depends on: empty arrays, source attribution,
 * timestamp, and timezone.
 */
import { describe, expect, it } from 'vitest';

// The Pages Function exports onRequestGet and onRequestOptions.
// We import them directly and call with a minimal context.
import { onRequestGet, onRequestOptions } from '../../functions/api/live-scores';

// Minimal PagesFunction context — the fallback doesn't use request or env
const mockContext = {} as any;

describe('/api/live-scores Pages Function fallback', () => {
  it('GET returns empty arrays with fallback meta', async () => {
    const res = await onRequestGet(mockContext);
    const body = JSON.parse(await res.text());

    expect(res.status).toBe(200);
    expect(body.mlb).toEqual([]);
    expect(body.nfl).toEqual([]);
    expect(body.nba).toEqual([]);
    expect(body.ncaa).toEqual([]);
    expect(body.meta.source).toBe('pages-fallback');
  });

  it('includes fetched_at as valid ISO timestamp', async () => {
    const res = await onRequestGet(mockContext);
    const body = JSON.parse(await res.text());

    expect(body.meta.fetched_at).toBeDefined();
    const date = new Date(body.meta.fetched_at);
    expect(date.toISOString()).toBe(body.meta.fetched_at);
  });

  it('includes timezone as America/Chicago', async () => {
    const res = await onRequestGet(mockContext);
    const body = JSON.parse(await res.text());

    expect(body.meta.timezone).toBe('America/Chicago');
  });

  it('OPTIONS returns preflight response with CORS headers', async () => {
    const res = await onRequestOptions(mockContext);

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});
