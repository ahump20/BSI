import { describe, expect, it } from 'vitest';

import {
  CacheChain,
  get_team_seasons,
  get_rankings_context,
  search_archive,
  LonghornsError,
  type Sport,
} from '../../mcp/texas-longhorns/server';

const TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} (CDT|CST)$/;

describe('Texas Longhorns MCP server', () => {
  it('rejects soccer sport requests', async () => {
    await expect(get_team_seasons({ sport: 'soccer' as unknown as Sport })).rejects.toThrowError(
      LonghornsError
    );
  });

  it('rejects soccer archive queries', async () => {
    await expect(search_archive({ query: 'latest soccer news' })).rejects.toThrowError(
      LonghornsError
    );
  });

  it('returns sports in mandated order for seasons and rankings', async () => {
    const seasons = await get_team_seasons();
    expect(seasons.result.sports.map((entry) => entry.sport)).toEqual([
      'baseball',
      'football',
      'basketball',
      'track_field',
    ]);

    const rankings = await get_rankings_context();
    expect(rankings.result.sports.map((entry) => entry.sport)).toEqual([
      'baseball',
      'football',
      'basketball',
      'track_field',
    ]);
  });

  it('formats timestamps in America/Chicago', async () => {
    const response = await get_team_seasons();
    expect(TIMESTAMP_REGEX.test(response.generatedAt)).toBe(true);
    for (const citation of response.citations) {
      expect(TIMESTAMP_REGEX.test(citation.timestamp)).toBe(true);
    }
  });

  it('surfaces cache HITs after first call', async () => {
    const cache = new CacheChain();
    const first = await get_team_seasons({}, { cache });
    expect(first.meta.cache.status).toBe('MISS');
    const second = await get_team_seasons({}, { cache });
    expect(second.meta.cache.status).toBe('HIT');
    expect(second.meta.cache.key).toBe(first.meta.cache.key);
  });

  it('sorts archive results by sport order and includes archive citation', async () => {
    const response = await search_archive({ query: 'Texas' });
    expect(response.citations.some((citation) => citation.id === 'archive-feed')).toBe(true);
    const sports = response.result.results.map((entry) => entry.sport);
    expect(sports).toEqual(['baseball', 'football', 'basketball', 'track_field', 'track_field']);
  });
});
