import { describe, expect, it } from 'vitest';
import { extractDataMeta, getDataSourceLabel, normalizeDataMeta, toDataMeta } from '@/lib/utils/data-meta';

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

  it('extracts metadata from wrapped payloads with timestamp fallbacks', () => {
    const meta = extractDataMeta({
      data: [],
      timestamp: '2026-02-26T09:15:00Z',
      meta: {
        source: 'ESPN',
        timezone: 'America/Chicago',
      },
    });

    expect(meta).toEqual({
      source: 'ESPN',
      sources: ['ESPN'],
      lastUpdated: '2026-02-26T09:15:00Z',
      timezone: 'America/Chicago',
      degraded: false,
    });
  });

  it('returns a non-null object when only timezone option is provided', () => {
    // Bug 2: null guard ignored options.timezone, causing null return for timezone-only callers
    const meta = normalizeDataMeta(undefined, { timezone: 'America/Chicago' });

    expect(meta).not.toBeNull();
    expect(meta?.timezone).toBe('America/Chicago');
    expect(meta?.degraded).toBe(false);
    expect(meta?.sources).toEqual([]);
    expect(meta?.source).toBe('');
  });

  it('returns a non-null object when only degraded option is provided', () => {
    const meta = normalizeDataMeta(undefined, { degraded: true });

    expect(meta).not.toBeNull();
    expect(meta?.degraded).toBe(true);
  });

  it('converts normalized metadata back into the shared DataMeta shape', () => {
    expect(
      toDataMeta({
        source: 'SportsDataIO',
        sources: ['SportsDataIO', 'ESPN'],
        lastUpdated: '2026-02-25T12:00:00Z',
        timezone: 'America/Chicago',
        degraded: true,
      }),
    ).toEqual({
      dataSource: 'SportsDataIO',
      source: 'SportsDataIO',
      lastUpdated: '2026-02-25T12:00:00Z',
      fetched_at: '2026-02-25T12:00:00Z',
      timezone: 'America/Chicago',
      degraded: true,
      sources: ['SportsDataIO', 'ESPN'],
    });
  });
});
