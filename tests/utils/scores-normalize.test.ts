import { describe, expect, it } from 'vitest';
import { normalizeGames, sortGames, type GameScore } from '@/lib/scores/normalize';

// ── normalizeGames ─────────────────────────────────────────────────

describe('normalizeGames — shape 1: transformed { games: [...] } with teams[]', () => {
  const data = {
    games: [
      {
        id: 'g1',
        teams: [
          { homeAway: 'home', score: 5, team: { displayName: 'Red Sox', abbreviation: 'BOS' } },
          { homeAway: 'away', score: 3, team: { displayName: 'Yankees', abbreviation: 'NYY' } },
        ],
        status: { isFinal: true, isLive: false, detailedState: 'Final' },
      },
    ],
  };

  it('parses home and away teams', () => {
    const games = normalizeGames('mlb', data);
    expect(games).toHaveLength(1);
    expect(games[0].home.name).toBe('Red Sox');
    expect(games[0].away.name).toBe('Yankees');
    expect(games[0].home.abbreviation).toBe('BOS');
    expect(games[0].away.abbreviation).toBe('NYY');
  });

  it('parses scores', () => {
    const games = normalizeGames('mlb', data);
    expect(games[0].home.score).toBe(5);
    expect(games[0].away.score).toBe(3);
  });

  it('marks final game correctly', () => {
    const games = normalizeGames('mlb', data);
    expect(games[0].isFinal).toBe(true);
    expect(games[0].isLive).toBe(false);
  });

  it('uses game id', () => {
    const games = normalizeGames('mlb', data);
    expect(games[0].id).toBe('g1');
  });
});

describe('normalizeGames — shape 2: scoreboard wrapper', () => {
  const data = {
    scoreboard: {
      games: [
        {
          id: 42,
          teams: {
            home: { name: 'Lakers', score: 110 },
            away: { name: 'Celtics', score: 105 },
          },
          status: { isFinal: true, detailedState: 'Final' },
        },
      ],
    },
  };

  it('reads from scoreboard.games', () => {
    const games = normalizeGames('nba', data);
    expect(games).toHaveLength(1);
    expect(games[0].home.name).toBe('Lakers');
    expect(games[0].away.name).toBe('Celtics');
  });

  it('marks as final', () => {
    const games = normalizeGames('nba', data);
    expect(games[0].isFinal).toBe(true);
  });
});

describe('normalizeGames — shape 3: raw ESPN college baseball format', () => {
  const data = {
    data: [
      {
        id: 'cb1',
        competitions: [
          {
            competitors: [
              {
                homeAway: 'home',
                score: 4,
                team: { displayName: 'Texas Longhorns', abbreviation: 'TEX' },
                curatedRank: { current: 5 },
              },
              {
                homeAway: 'away',
                score: 2,
                team: { displayName: 'LSU Tigers', abbreviation: 'LSU' },
                curatedRank: { current: 10 },
              },
            ],
            status: {
              type: {
                state: 'post',
                completed: true,
                shortDetail: 'Final',
              },
            },
          },
        ],
      },
    ],
  };

  it('parses home and away teams from ESPN format', () => {
    const games = normalizeGames('college-baseball', data);
    expect(games).toHaveLength(1);
    expect(games[0].home.name).toBe('Texas Longhorns');
    expect(games[0].away.name).toBe('LSU Tigers');
  });

  it('marks as final when state is post', () => {
    const games = normalizeGames('college-baseball', data);
    expect(games[0].isFinal).toBe(true);
    expect(games[0].isLive).toBe(false);
  });

  it('assigns curatedRank when <= 25', () => {
    const games = normalizeGames('college-baseball', data);
    expect(games[0].home.rank).toBe(5);
    expect(games[0].away.rank).toBe(10);
  });

  it('omits rank when curatedRank > 25', () => {
    const noRankData = {
      data: [
        {
          id: 'cb2',
          competitions: [
            {
              competitors: [
                { homeAway: 'home', score: 1, team: { displayName: 'TeamA' }, curatedRank: { current: 99 } },
                { homeAway: 'away', score: 0, team: { displayName: 'TeamB' }, curatedRank: { current: 30 } },
              ],
              status: { type: { state: 'post', shortDetail: 'Final' } },
            },
          ],
        },
      ],
    };
    const games = normalizeGames('college-baseball', noRankData);
    expect(games[0].home.rank).toBeUndefined();
    expect(games[0].away.rank).toBeUndefined();
  });

  it('detects live game (state === "in")', () => {
    const liveData = {
      data: [
        {
          id: 'live1',
          competitions: [
            {
              competitors: [
                { homeAway: 'home', score: 2, team: { displayName: 'Home' } },
                { homeAway: 'away', score: 1, team: { displayName: 'Away' } },
              ],
              status: { type: { state: 'in', shortDetail: 'Top 7th' } },
            },
          ],
        },
      ],
    };
    const games = normalizeGames('college-baseball', liveData);
    expect(games[0].isLive).toBe(true);
    expect(games[0].isFinal).toBe(false);
  });

  it('flags postponed games', () => {
    const postponedData = {
      data: [
        {
          id: 'p1',
          competitions: [
            {
              competitors: [
                { homeAway: 'home', score: 0, team: { displayName: 'Home' } },
                { homeAway: 'away', score: 0, team: { displayName: 'Away' } },
              ],
              status: { type: { state: 'pre', description: 'Postponed', shortDetail: 'Postponed' } },
            },
          ],
        },
      ],
    };
    const games = normalizeGames('college-baseball', postponedData);
    expect(games[0].isPostponed).toBe(true);
  });
});

describe('normalizeGames — returns empty array for empty input', () => {
  it('handles completely empty data object', () => {
    expect(normalizeGames('mlb', {})).toEqual([]);
  });
});

// ── sortGames ──────────────────────────────────────────────────────

describe('sortGames', () => {
  let gameCounter = 0;
  const makeGame = (overrides: Partial<GameScore>): GameScore => ({
    id: `test-game-${++gameCounter}`,
    away: { name: 'Away', score: 0 },
    home: { name: 'Home', score: 0 },
    status: 'Scheduled',
    isLive: false,
    isFinal: false,
    isPostponed: false,
    ...overrides,
  });

  it('returns empty array for null input', () => {
    expect(sortGames(null)).toEqual([]);
  });

  it('returns empty array for undefined input', () => {
    expect(sortGames(undefined)).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(sortGames([] )).toEqual([]);
  });

  it('places live games before scheduled and final games', () => {
    const games = [
      makeGame({ isFinal: true }),
      makeGame({ isLive: true }),
      makeGame({ }),
    ];
    const sorted = sortGames(games);
    expect(sorted[0].isLive).toBe(true);
  });

  it('places postponed games last', () => {
    const games = [
      makeGame({ isPostponed: true }),
      makeGame({ isFinal: true }),
      makeGame({ isLive: true }),
    ];
    const sorted = sortGames(games);
    expect(sorted[sorted.length - 1].isPostponed).toBe(true);
  });

  it('places ranked finals before unranked finals', () => {
    const rankedFinal = makeGame({ isFinal: true, away: { name: 'Away', score: 0, rank: 5 }, home: { name: 'Home', score: 0 } });
    const unrankedFinal = makeGame({ isFinal: true });
    const sorted = sortGames([unrankedFinal, rankedFinal]);
    expect(sorted[0]).toBe(rankedFinal);
  });

  it('sorts ranked matchups by best rank (lower number first)', () => {
    const top5 = makeGame({ away: { name: 'A', score: 0, rank: 1 }, home: { name: 'B', score: 0, rank: 5 } });
    const top10 = makeGame({ away: { name: 'C', score: 0, rank: 8 }, home: { name: 'D', score: 0, rank: 10 } });
    const sorted = sortGames([top10, top5]);
    expect(sorted[0]).toBe(top5);
  });

  it('does not mutate the input array', () => {
    const games = [makeGame({ isFinal: true }), makeGame({ isLive: true })];
    const original = [...games];
    sortGames(games);
    expect(games[0]).toBe(original[0]);
  });
});
