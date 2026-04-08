import { describe, expect, it } from 'vitest';
import { normalizeRankings, type ESPNPoll, type RankedTeam } from '@/lib/utils/rankings';

describe('normalizeRankings', () => {
  it('returns empty result for empty rankings array', () => {
    expect(normalizeRankings({ rankings: [] })).toEqual({ teams: [], pollName: '' });
  });

  it('returns empty result when rankings is undefined', () => {
    expect(normalizeRankings({})).toEqual({ teams: [], pollName: '' });
  });

  describe('ESPN poll format', () => {
    const espnRaw: { rankings: ESPNPoll[] } = {
      rankings: [
        {
          name: 'AP Top 25',
          ranks: [
            {
              current: 1,
              team: { name: 'Longhorns', location: 'Texas', nickname: 'Longhorns' },
              recordSummary: '50-9',
            },
            {
              current: 2,
              team: { name: 'Tigers', location: 'LSU', nickname: 'Tigers' },
              recordSummary: '48-14',
            },
            {
              current: 3,
              team: { name: 'Volunteers', location: 'Tennessee' },
              recordSummary: '47-16',
            },
          ],
        },
      ],
    };

    it('extracts the poll name', () => {
      const { pollName } = normalizeRankings(espnRaw);
      expect(pollName).toBe('AP Top 25');
    });

    it('builds full team names from location + name', () => {
      const { teams } = normalizeRankings(espnRaw);
      expect(teams[0].team).toBe('Texas Longhorns');
      expect(teams[1].team).toBe('LSU Tigers');
      expect(teams[2].team).toBe('Tennessee Volunteers');
    });

    it('maps rank numbers correctly', () => {
      const { teams } = normalizeRankings(espnRaw);
      expect(teams[0].rank).toBe(1);
      expect(teams[1].rank).toBe(2);
      expect(teams[2].rank).toBe(3);
    });

    it('maps recordSummary to record field', () => {
      const { teams } = normalizeRankings(espnRaw);
      expect(teams[0].record).toBe('50-9');
    });

    it('sets empty string for conference', () => {
      const { teams } = normalizeRankings(espnRaw);
      expect(teams[0].conference).toBe('');
    });
  });

  describe('flat RankedTeam array format', () => {
    const flatRaw: { rankings: RankedTeam[] } = {
      rankings: [
        { rank: 1, team: 'Texas Longhorns', conference: 'SEC', record: '50-9', slug: 'texas' },
        { rank: 2, team: 'LSU Tigers', conference: 'SEC', record: '48-14' },
      ],
    };

    it('returns empty poll name for flat format', () => {
      const { pollName } = normalizeRankings(flatRaw);
      expect(pollName).toBe('');
    });

    it('passes through existing fields', () => {
      const { teams } = normalizeRankings(flatRaw);
      expect(teams).toHaveLength(2);
      expect(teams[0].rank).toBe(1);
      expect(teams[0].team).toBe('Texas Longhorns');
      expect(teams[0].conference).toBe('SEC');
      expect(teams[0].record).toBe('50-9');
      expect(teams[0].slug).toBe('texas');
    });

    it('preserves provided slug and does not overwrite with undefined', () => {
      const { teams } = normalizeRankings(flatRaw);
      expect(teams[0].slug).toBe('texas');
    });
  });
});
