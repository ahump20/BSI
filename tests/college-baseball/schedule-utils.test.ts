import { describe, expect, it } from 'vitest';
import {
  filterGamesByConference,
  findNextGameDate,
  normalizeSchedulePayload,
  shiftIsoDate,
  type ScheduleGame,
} from '../../lib/college-baseball/schedule-utils';

function makeGame(overrides: Partial<ScheduleGame>): ScheduleGame {
  return {
    id: '1',
    date: '2026-02-14T19:00:00Z',
    time: '1:00 PM',
    status: 'scheduled',
    homeTeam: {
      id: '1',
      name: 'Texas Longhorns',
      shortName: 'TEX',
      conference: 'SEC',
      score: null,
      record: { wins: 0, losses: 0 },
    },
    awayTeam: {
      id: '2',
      name: 'UC Davis Aggies',
      shortName: 'UCD',
      conference: '',
      score: null,
      record: { wins: 0, losses: 0 },
    },
    venue: 'UFCU Disch-Falk Field',
    ...overrides,
  };
}

describe('college baseball schedule utils', () => {
  it('finds the next date with games within +7 days', async () => {
    const startDate = '2026-02-12';
    const nextDate = await findNextGameDate({
      startDate,
      maxDays: 7,
      loadGamesForDate: async (isoDate) => {
        if (isoDate === '2026-02-14') return [makeGame({ id: 'opening-day' })];
        return [];
      },
    });
    expect(nextDate).toBe('2026-02-14');
  });

  it('normalizes schedule payload from status object shape', () => {
    const payload = {
      data: [
        {
          id: '401848062',
          date: '2026-02-14T14:30:00Z',
          homeTeam: { id: '308', name: 'Indiana State Sycamores', abbreviation: 'INST' },
          awayTeam: { id: '95', name: 'NC State Wolfpack', abbreviation: 'NCSU' },
          homeScore: 0,
          awayScore: 0,
          status: {
            type: 'STATUS_SCHEDULED',
            state: 'pre',
            detail: 'Sat, February 14th at 9:30 AM EST',
            period: 1,
          },
          venue: { fullName: 'Estadio Paquito Montaner' },
        },
      ],
      totalCount: 1,
    };

    const normalized = normalizeSchedulePayload(payload);
    expect(normalized.totalCount).toBe(1);
    expect(normalized.games[0].status).toBe('scheduled');
    expect(normalized.games[0].homeTeam.shortName).toBe('INST');
    expect(normalized.games[0].awayTeam.shortName).toBe('NCSU');
  });

  it('filters a conference when either home or away team belongs to that conference', () => {
    const games: ScheduleGame[] = [
      makeGame({
        id: 'sec-home',
        homeTeam: { ...makeGame({}).homeTeam, name: 'Texas Longhorns', conference: 'SEC' },
        awayTeam: { ...makeGame({}).awayTeam, name: 'UC Davis Aggies', conference: '' },
      }),
      makeGame({
        id: 'sec-away',
        homeTeam: { ...makeGame({}).homeTeam, name: 'Dallas Baptist Patriots', conference: '' },
        awayTeam: { ...makeGame({}).awayTeam, name: 'Florida Gators', conference: 'SEC' },
      }),
      makeGame({
        id: 'none',
        homeTeam: { ...makeGame({}).homeTeam, name: 'Wichita State Shockers', conference: '' },
        awayTeam: { ...makeGame({}).awayTeam, name: 'Troy Trojans', conference: '' },
      }),
    ];

    const secGames = filterGamesByConference(games, 'SEC');
    expect(secGames.map((game) => game.id)).toEqual(['sec-home', 'sec-away']);
  });

  it('shifts an ISO date relative to selected date', () => {
    expect(shiftIsoDate('2026-02-14', -2)).toBe('2026-02-12');
    expect(shiftIsoDate('2026-02-14', 3)).toBe('2026-02-17');
  });
});
