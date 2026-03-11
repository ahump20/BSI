import { describe, expect, it } from 'vitest';
import { extractCBBGames } from '@/lib/scores/featured-games';

describe('extractCBBGames', () => {
  it('normalizes college baseball schedule payloads without leaking object strings', () => {
    const games = extractCBBGames({
      data: [
        {
          id: '401852648',
          status: 'live',
          awayTeam: {
            id: '354',
            name: 'Fordham Rams',
            shortName: 'FOR',
            score: 5,
          },
          homeTeam: {
            id: '102',
            name: 'Rutgers Scarlet Knights',
            shortName: 'RUTG',
            score: 7,
          },
        },
      ],
    });

    expect(games).toHaveLength(1);
    expect(games[0].away.name).toBe('Fordham Rams');
    expect(games[0].away.abbreviation).toBe('FOR');
    expect(games[0].away.score).toBe('5');
    expect(games[0].home.name).toBe('Rutgers Scarlet Knights');
    expect(games[0].home.abbreviation).toBe('RUTG');
    expect(games[0].home.score).toBe('7');
  });

  it('keeps legacy string-based college baseball payloads compatible', () => {
    const games = extractCBBGames({
      data: [
        {
          id: 'legacy-1',
          status: 'final',
          awayTeam: 'Texas',
          awayAbbreviation: 'TEX',
          awayScore: 6,
          homeTeam: 'Texas State',
          homeAbbreviation: 'TXST',
          homeScore: 4,
        },
      ],
    });

    expect(games[0].away.name).toBe('Texas');
    expect(games[0].away.abbreviation).toBe('TEX');
    expect(games[0].away.score).toBe('6');
    expect(games[0].home.name).toBe('Texas State');
    expect(games[0].home.abbreviation).toBe('TXST');
    expect(games[0].home.score).toBe('4');
  });
});
