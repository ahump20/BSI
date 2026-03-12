import { describe, expect, it } from 'vitest';
import { getDataSourceLabel, normalizeDataMeta } from '@/lib/utils/data-meta';

describe('data-meta utils', () => {
  it('normalizes ESPN-style metadata into a stable shape', () => {
    const meta = normalizeDataMeta({
      source: 'ESPN',
      fetched_at: '2026-02-25T12:00:00Z',
      timezone: 'America/Chicago',
    });

    expect(meta).toEqual({
      source: 'ESPN',
      sources: ['ESPN'],
      lastUpdated: '2026-02-25T12:00:00Z',
      timezone: 'America/Chicago',
      degraded: false,
    });
  });

  it('prefers canonical fields when both field styles exist', () => {
    const meta = normalizeDataMeta({
      dataSource: 'Highlightly',
      lastUpdated: '2026-02-25T12:00:00Z',
      source: 'Legacy Source',
      fetched_at: '2026-02-24T12:00:00Z',
      sources: ['Highlightly', 'ESPN'],
      degraded: true,
    });

    expect(meta?.source).toBe('Highlightly');
    expect(meta?.lastUpdated).toBe('2026-02-25T12:00:00Z');
    expect(meta?.sources).toEqual(['Highlightly', 'ESPN']);
    expect(meta?.degraded).toBe(true);
    expect(getDataSourceLabel(meta)).toBe('Highlightly');
  });
});
