import { describe, expect, it } from 'vitest';
import {
  flattenNBAStandings,
  flattenNFLStandings,
  groupNFLByDivision,
  splitNBAByConference,
  type NBAApiConference,
  type NFLApiConference,
} from '@/lib/utils/standings';

// ── NFL ─────────────────────────────────────────────────────────────

const nflConferences: NFLApiConference[] = [
  {
    name: 'AFC',
    divisions: [
      {
        name: 'East',
        teams: [
          { name: 'Bills', wins: 13, losses: 4, ties: 0, pct: 0.765, pf: 480, pa: 310, conference: 'AFC', division: 'East' },
          { name: 'Dolphins', wins: 8, losses: 9, ties: 0, pct: 0.471, pf: 370, pa: 390, conference: 'AFC', division: 'East' },
        ],
      },
      {
        name: 'North',
        teams: [
          { name: 'Ravens', wins: 12, losses: 5, ties: 0, pct: 0.706, pf: 460, pa: 330, conference: 'AFC', division: 'North' },
        ],
      },
    ],
  },
  {
    name: 'NFC',
    divisions: [
      {
        name: 'West',
        teams: [
          { name: 'Rams', wins: 10, losses: 7, ties: 0, pct: 0.588, pf: 390, pa: 370 },
        ],
      },
    ],
  },
];

describe('flattenNFLStandings', () => {
  it('flattens all conferences and divisions into a single array', () => {
    const result = flattenNFLStandings(nflConferences);
    expect(result).toHaveLength(4);
  });

  it('maps team fields correctly', () => {
    const result = flattenNFLStandings(nflConferences);
    const bills = result.find((t) => t.teamName === 'Bills')!;
    expect(bills.wins).toBe(13);
    expect(bills.losses).toBe(4);
    expect(bills.ties).toBe(0);
    expect(bills.winPercentage).toBe(0.765);
    expect(bills.pointsFor).toBe(480);
    expect(bills.pointsAgainst).toBe(310);
    expect(bills.conference).toBe('AFC');
    expect(bills.division).toBe('East');
  });

  it('falls back to division name when team lacks explicit conference/division fields', () => {
    const result = flattenNFLStandings(nflConferences);
    const rams = result.find((t) => t.teamName === 'Rams')!;
    expect(rams.conference).toBe('NFC');
    expect(rams.division).toBe('West');
  });

  it('skips conferences with no divisions', () => {
    const empty: NFLApiConference[] = [{ name: 'AFC', divisions: undefined as unknown as never }];
    expect(flattenNFLStandings(empty)).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(flattenNFLStandings([])).toEqual([]);
  });
});

describe('groupNFLByDivision', () => {
  it('groups teams by "conference division" key', () => {
    const flat = flattenNFLStandings(nflConferences);
    const grouped = groupNFLByDivision(flat);
    expect(Object.keys(grouped)).toContain('AFC East');
    expect(Object.keys(grouped)).toContain('AFC North');
    expect(Object.keys(grouped)).toContain('NFC West');
  });

  it('sorts each division by wins descending', () => {
    const flat = flattenNFLStandings(nflConferences);
    const grouped = groupNFLByDivision(flat);
    const afcEast = grouped['AFC East'];
    expect(afcEast[0].teamName).toBe('Bills');
    expect(afcEast[1].teamName).toBe('Dolphins');
  });
});

// ── NBA ─────────────────────────────────────────────────────────────

const nbaConferences: NBAApiConference[] = [
  {
    name: 'Eastern Conference',
    teams: [
      { name: 'Celtics', abbreviation: 'BOS', id: '2', logo: '', wins: 58, losses: 24, pct: 0.707, gb: '-', streak: 'W3', home: '33-8', away: '25-16', last10: '7-3' },
      { name: 'Knicks', abbreviation: 'NYK', id: '20', logo: '', wins: 51, losses: 31, pct: 0.622, gb: '7', streak: 'W1', home: '28-13', away: '23-18', last10: '6-4' },
    ],
  },
  {
    name: 'Western Conference',
    teams: [
      { name: 'Thunder', abbreviation: 'OKC', id: '25', logo: '', wins: 62, losses: 20, pct: 0.756, gb: '-', streak: 'W5', home: '34-7', away: '28-13', last10: '9-1' },
    ],
  },
];

describe('flattenNBAStandings', () => {
  it('flattens both conferences into a single array', () => {
    const result = flattenNBAStandings(nbaConferences);
    expect(result).toHaveLength(3);
  });

  it('labels Eastern Conference correctly', () => {
    const result = flattenNBAStandings(nbaConferences);
    const celtics = result.find((t) => t.teamName === 'Celtics')!;
    expect(celtics.conference).toBe('Eastern');
    expect(celtics.wins).toBe(58);
    expect(celtics.losses).toBe(24);
    expect(celtics.gamesBack).toBe(0); // "-" becomes 0
  });

  it('labels Western Conference correctly', () => {
    const result = flattenNBAStandings(nbaConferences);
    const thunder = result.find((t) => t.teamName === 'Thunder')!;
    expect(thunder.conference).toBe('Western');
  });

  it('parses numeric games-back correctly', () => {
    const result = flattenNBAStandings(nbaConferences);
    const knicks = result.find((t) => t.teamName === 'Knicks')!;
    expect(knicks.gamesBack).toBe(7);
  });

  it('preserves optional fields', () => {
    const result = flattenNBAStandings(nbaConferences);
    const celtics = result.find((t) => t.teamName === 'Celtics')!;
    expect(celtics.home).toBe('33-8');
    expect(celtics.away).toBe('25-16');
    expect(celtics.last10).toBe('7-3');
    expect(celtics.streak).toBe('W3');
    expect(celtics.abbreviation).toBe('BOS');
  });

  it('accepts alternate "East"/"West" conference name variants', () => {
    const alt: NBAApiConference[] = [
      { name: 'East', teams: [{ name: 'Hawks', wins: 40, losses: 42, pct: 0.488, gb: '18', streak: 'L2', abbreviation: 'ATL', id: '1', logo: '' }] },
      { name: 'West', teams: [{ name: 'Lakers', wins: 44, losses: 38, pct: 0.537, gb: '18', streak: 'W2', abbreviation: 'LAL', id: '13', logo: '' }] },
    ];
    const result = flattenNBAStandings(alt);
    expect(result.find((t) => t.teamName === 'Hawks')!.conference).toBe('Eastern');
    expect(result.find((t) => t.teamName === 'Lakers')!.conference).toBe('Western');
  });

  it('returns empty array for empty input', () => {
    expect(flattenNBAStandings([])).toEqual([]);
  });
});

describe('splitNBAByConference', () => {
  it('splits teams into eastern and western buckets', () => {
    const flat = flattenNBAStandings(nbaConferences);
    const { eastern, western } = splitNBAByConference(flat);
    expect(eastern).toHaveLength(2);
    expect(western).toHaveLength(1);
    expect(eastern.every((t) => t.conference === 'Eastern')).toBe(true);
    expect(western.every((t) => t.conference === 'Western')).toBe(true);
  });

  it('falls back gracefully when conference data is missing', () => {
    // No teams match either conference → returns all in eastern, none in western
    const badData = [{ teamName: 'Unknown', wins: 10, losses: 10, winPercentage: 0.5, conference: 'Unknown', gamesBack: 0, streak: 'W1' }];
    const { eastern, western } = splitNBAByConference(badData);
    expect(eastern).toHaveLength(1);
    expect(western).toHaveLength(0);
  });

  it('returns empty arrays for empty input', () => {
    const { eastern, western } = splitNBAByConference([]);
    expect(eastern).toHaveLength(0);
    expect(western).toHaveLength(0);
  });
});
