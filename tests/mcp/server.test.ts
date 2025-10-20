import { describe, expect, it } from 'vitest';

import {
  SUPPORTED_SPORTS,
  formatCitationTimestamp,
  get_season_schedule,
  get_team_seasons,
  search_archive
} from '../../mcp/server.ts';

describe('MCP server tool handlers', () => {
  it('rejects soccer queries across handlers', async () => {
    await expect(get_team_seasons({ sport: 'soccer', team: 'texas' } as any)).rejects.toThrow(
      /Soccer is explicitly excluded/
    );
  });

  it('maintains baseball-first ordering across responses', async () => {
    const schedule = await get_season_schedule({ sport: 'baseball', team: 'texas', season: 2024 });
    expect(schedule.data.games.map((game) => game.sport)).toEqual(SUPPORTED_SPORTS);

    const seasons = await get_team_seasons({ sport: 'baseball', team: 'texas' });
    expect(seasons.data.sports.map((entry) => entry.sport)).toEqual(SUPPORTED_SPORTS);
  });

  it('formats citations with CDT timestamps', async () => {
    const fixed = new Date('2024-03-20T15:30:45Z');
    expect(formatCitationTimestamp(fixed)).toBe('2024-03-20T10:30:45 CDT');

    const archive = await search_archive({ sport: 'baseball', query: 'pitch' });
    expect(archive.meta.citations[0].accessed.endsWith('CDT')).toBe(true);
    archive.data.hits.forEach((hit) => {
      expect(hit.citation.accessed.endsWith('CDT')).toBe(true);
    });
  });
});
