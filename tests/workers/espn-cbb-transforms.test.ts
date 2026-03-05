/**
 * ESPN College Baseball High-Level Transform Tests
 *
 * Direct unit tests for the four high-level transforms in espn-college-baseball.ts.
 * The home/away team ID matching fallback is the primary risk — a missed ID
 * silently swaps home and away with no error.
 */
import { describe, expect, it } from 'vitest';
import {
  transformCollegeBaseballBoxScore,
  transformCollegeBaseballGameSummary,
  transformCollegeBaseballStandings,
  transformCollegeBaseballRankings,
} from '../../lib/api-clients/espn-college-baseball';

// Minimal competitor fixture
const makeCompetitor = (id: string, homeAway: 'home' | 'away', score = 0) => ({
  homeAway,
  score: String(score),
  team: { id, displayName: `Team ${id}`, abbreviation: id.toUpperCase(), logo: '' },
  linescores: [],
  statistics: [],
});

// Minimal boxscorePlayers fixture (ESPN shape: two teams)
const makeBoxscorePlayers = (homeId: string, awayId: string) => [
  {
    team: { id: homeId, displayName: `Team ${homeId}`, abbreviation: homeId.toUpperCase() },
    statistics: [
      { name: 'batting', labels: ['H-AB','AB','R','H','RBI','HR','BB','K','#P','AVG','OBP','SLG'], athletes: [] },
      { name: 'pitching', labels: ['IP','H','R','ER','BB','K','HR','#P','ERA'], athletes: [] },
    ],
  },
  {
    team: { id: awayId, displayName: `Team ${awayId}`, abbreviation: awayId.toUpperCase() },
    statistics: [
      { name: 'batting', labels: ['H-AB','AB','R','H','RBI','HR','BB','K','#P','AVG','OBP','SLG'], athletes: [] },
      { name: 'pitching', labels: ['IP','H','R','ER','BB','K','HR','#P','ERA'], athletes: [] },
    ],
  },
];

// ---------------------------------------------------------------------------
// transformCollegeBaseballBoxScore
// ---------------------------------------------------------------------------

describe('transformCollegeBaseballBoxScore', () => {
  it('matches home team by ID', () => {
    // Note: signature is (boxscorePlayers, competitors) — players first
    const competitors = [makeCompetitor('10', 'home', 5), makeCompetitor('20', 'away', 3)];
    const players = makeBoxscorePlayers('10', '20');
    const result = transformCollegeBaseballBoxScore(players as any, competitors as any);

    expect(result.home.team.id).toBe('10');
    expect(result.away.team.id).toBe('20');
  });

  it('home and away are not swapped when IDs match', () => {
    const competitors = [makeCompetitor('99', 'away', 2), makeCompetitor('77', 'home', 6)];
    const players = makeBoxscorePlayers('77', '99');
    const result = transformCollegeBaseballBoxScore(players as any, competitors as any);

    expect(result.home.team.id).toBe('77');
    expect(result.away.team.id).toBe('99');
  });

  it('returns empty batting/pitching arrays for teams with no athletes', () => {
    const competitors = [makeCompetitor('1', 'home'), makeCompetitor('2', 'away')];
    const players = makeBoxscorePlayers('1', '2');
    const result = transformCollegeBaseballBoxScore(players as any, competitors as any);

    expect(result.home.batting).toEqual([]);
    expect(result.home.pitching).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// transformCollegeBaseballGameSummary
// ---------------------------------------------------------------------------

describe('transformCollegeBaseballGameSummary', () => {
  // The function reads from raw.header.competitions (not raw.competitions)
  // and raw.boxscore.players for the box score.
  const minimalRaw = {
    header: {
      competitions: [{
        status: { type: { state: 'post', description: 'Final', completed: true } },
        competitors: [makeCompetitor('10', 'home', 5), makeCompetitor('20', 'away', 3)],
        venue: { fullName: 'Test Park', address: { city: 'Austin', state: 'TX' } },
      }],
    },
    boxscore: { players: makeBoxscorePlayers('10', '20') },
    plays: [],
    winprobability: [],
  };

  it('emits BSI meta contract shape', () => {
    const result = transformCollegeBaseballGameSummary(minimalRaw as any);
    expect(result.meta).toHaveProperty('source');
    expect(result.meta).toHaveProperty('fetched_at');
    expect(result.meta).toHaveProperty('timezone');
    expect(result.meta.timezone).toBe('America/Chicago');
    expect(result.meta.source).toBe('espn');
  });

  it('identifies final game status', () => {
    const result = transformCollegeBaseballGameSummary(minimalRaw as any);
    expect(result.status.isFinal).toBe(true);
    expect(result.status.isLive).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// transformCollegeBaseballStandings
// ---------------------------------------------------------------------------

describe('transformCollegeBaseballStandings', () => {
  const minimalRaw = {
    children: [{
      name: 'SEC East',
      standings: {
        entries: [{
          team: { id: '1', displayName: 'Team A', abbreviation: 'TA', logos: [{ href: '' }] },
          stats: [
            { name: 'wins', value: 10 },
            { name: 'losses', value: 3 },
            { name: 'winPercent', value: 0.769 },
            { name: 'gamesBehind', value: 0 },
          ],
        }],
      },
    }],
  };

  it('emits BSI meta contract shape', () => {
    const result = transformCollegeBaseballStandings(minimalRaw as any);
    expect(result.meta).toHaveProperty('source');
    expect(result.meta).toHaveProperty('fetched_at');
    expect(result.meta).toHaveProperty('timezone');
    expect(result.meta.timezone).toBe('America/Chicago');
  });

  it('returns at least one standings group', () => {
    const result = transformCollegeBaseballStandings(minimalRaw as any);
    expect(result.standings.length).toBeGreaterThan(0);
    expect(result.standings[0].teams.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// transformCollegeBaseballRankings
// ---------------------------------------------------------------------------

describe('transformCollegeBaseballRankings', () => {
  const minimalRaw = {
    rankings: [{
      name: 'D1Baseball',
      season: { year: 2026 },
      lastUpdated: '2026-02-25T00:00:00Z',
      ranks: [{
        current: 1,
        previous: 2,
        team: { id: '126', displayName: 'Texas Longhorns', abbreviation: 'TEX', logos: [{ href: '' }] },
        recordSummary: '5-0',
        pointsAfter: 1450,
        firstPlaceVotes: 20,
      }],
    }],
  };

  it('emits BSI meta contract shape', () => {
    const result = transformCollegeBaseballRankings(minimalRaw as any);
    expect(result.meta).toHaveProperty('source');
    expect(result.meta).toHaveProperty('fetched_at');
    expect(result.meta).toHaveProperty('timezone');
    expect(result.meta.timezone).toBe('America/Chicago');
  });

  it('parses ranking trend correctly', () => {
    const result = transformCollegeBaseballRankings(minimalRaw as any);
    const poll = result.polls[0];
    expect(poll.rankings[0].trend).toBe('up'); // moved from 2 to 1
    expect(poll.rankings[0].rank).toBe(1);
  });

  it('emits polls array', () => {
    const result = transformCollegeBaseballRankings(minimalRaw as any);
    expect(Array.isArray(result.polls)).toBe(true);
    expect(result.polls.length).toBeGreaterThan(0);
  });
});
