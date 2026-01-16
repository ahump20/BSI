/**
 * College Baseball API Test Suite
 * Tests for NCAA Baseball data, box scores, and team information
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';

describe('College Baseball API - Teams', () => {
  it('should validate team data structure', () => {
    const mockTeam = {
      team_id: 'texas',
      name: 'Texas Longhorns',
      abbreviation: 'TEX',
      conference: 'SEC',
      wins: 45,
      losses: 15,
      rpi: 5,
    };

    expect(mockTeam).toHaveProperty('team_id');
    expect(mockTeam).toHaveProperty('name');
    expect(mockTeam).toHaveProperty('conference');
    expect(mockTeam.wins).toBeGreaterThanOrEqual(0);
  });

  it('should validate conference affiliations', () => {
    const validConferences = ['SEC', 'ACC', 'Big 12', 'Pac-12', 'Big Ten'];
    const testConference = 'SEC';

    expect(validConferences).toContain(testConference);
  });
});

describe('College Baseball API - Box Scores', () => {
  it('should validate complete box score structure', () => {
    const mockBoxScore = {
      game_id: 'tex-ou-2025-04-15',
      home_team: 'Texas',
      away_team: 'Oklahoma',
      home_score: 7,
      away_score: 4,
      innings: 9,
      status: 'Final',
      batting: [
        {
          player: 'Player Name',
          ab: 4,
          r: 2,
          h: 3,
          rbi: 2,
          bb: 1,
          so: 0,
          avg: '.325',
        },
      ],
      pitching: [
        {
          player: 'Pitcher Name',
          ip: '7.0',
          h: 5,
          r: 3,
          er: 2,
          bb: 2,
          so: 8,
          era: '2.45',
        },
      ],
    };

    expect(mockBoxScore).toHaveProperty('game_id');
    expect(mockBoxScore).toHaveProperty('batting');
    expect(mockBoxScore).toHaveProperty('pitching');
    expect(mockBoxScore.batting).toBeInstanceOf(Array);
    expect(mockBoxScore.pitching).toBeInstanceOf(Array);
  });

  it('should calculate batting statistics correctly', () => {
    const ab = 4;
    const hits = 3;
    const avg = (hits / ab).toFixed(3);

    expect(parseFloat(avg)).toBeCloseTo(0.75, 3);
  });

  it('should validate earned run average calculation', () => {
    const earnedRuns = 2;
    const inningsPitched = 7.0;
    const era = ((earnedRuns / inningsPitched) * 9).toFixed(2);

    expect(parseFloat(era)).toBeCloseTo(2.57, 2);
  });
});

describe('College Baseball API - Standings', () => {
  it('should validate conference standings structure', () => {
    const mockStandings = {
      conference: 'SEC',
      teams: [
        {
          team_name: 'Texas',
          conference_wins: 18,
          conference_losses: 6,
          overall_wins: 45,
          overall_losses: 15,
          winning_percentage: 0.75,
          games_behind: 0,
        },
      ],
    };

    expect(mockStandings).toHaveProperty('conference');
    expect(mockStandings.teams[0]).toHaveProperty('conference_wins');
    expect(mockStandings.teams[0]).toHaveProperty('overall_wins');
    expect(mockStandings.teams[0].winning_percentage).toBeGreaterThan(0);
    expect(mockStandings.teams[0].winning_percentage).toBeLessThanOrEqual(1);
  });

  it('should calculate games behind correctly', () => {
    const firstPlaceWins = 18;
    const firstPlaceLosses = 6;
    const teamWins = 15;
    const teamLosses = 9;

    const gamesBehind = (firstPlaceWins - teamWins + (teamLosses - firstPlaceLosses)) / 2;

    expect(gamesBehind).toBeCloseTo(3, 1);
  });
});

describe('College Baseball API - Player Stats', () => {
  it('should validate batting statistics', () => {
    const mockBatter = {
      player_id: '12345',
      name: 'Ivan Melendez',
      position: '1B',
      games: 60,
      at_bats: 220,
      runs: 45,
      hits: 75,
      doubles: 18,
      triples: 2,
      home_runs: 15,
      rbi: 60,
      stolen_bases: 5,
      batting_avg: '.341',
      obp: '.425',
      slg: '.627',
      ops: 1.052,
    };

    expect(mockBatter).toHaveProperty('player_id');
    expect(mockBatter.at_bats).toBeGreaterThan(0);
    expect(parseFloat(mockBatter.batting_avg)).toBeGreaterThan(0);
    expect(parseFloat(mockBatter.batting_avg)).toBeLessThanOrEqual(1);
  });

  it('should validate pitching statistics', () => {
    const mockPitcher = {
      player_id: '54321',
      name: 'Ty Madden',
      games: 15,
      games_started: 15,
      innings_pitched: 95.1,
      wins: 10,
      losses: 2,
      saves: 0,
      strikeouts: 120,
      walks: 25,
      hits_allowed: 65,
      earned_runs: 25,
      era: '2.36',
      whip: '0.94',
    };

    expect(mockPitcher).toHaveProperty('player_id');
    expect(mockPitcher.strikeouts).toBeGreaterThan(0);
    expect(parseFloat(mockPitcher.era)).toBeGreaterThan(0);
  });
});

describe('College Baseball API - Schedule', () => {
  it('should validate game schedule structure', () => {
    const mockSchedule = [
      {
        game_id: 'game-001',
        date: '2025-04-15',
        time: '18:00',
        opponent: 'Oklahoma',
        location: 'UFCU Disch-Falk Field',
        is_home: true,
        result: 'W 7-4',
        conference_game: true,
      },
    ];

    expect(mockSchedule).toBeInstanceOf(Array);
    expect(mockSchedule[0]).toHaveProperty('game_id');
    expect(mockSchedule[0]).toHaveProperty('date');
    expect(mockSchedule[0]).toHaveProperty('opponent');
    expect(mockSchedule[0].is_home).toBe(true);
  });

  it('should parse game results correctly', () => {
    const parseResult = (result) => {
      const match = result.match(/([WL])\s+(\d+)-(\d+)/);
      if (!match) return null;

      return {
        outcome: match[1],
        team_score: parseInt(match[2]),
        opponent_score: parseInt(match[3]),
      };
    };

    const parsed = parseResult('W 7-4');
    expect(parsed.outcome).toBe('W');
    expect(parsed.team_score).toBe(7);
    expect(parsed.opponent_score).toBe(4);
  });
});

describe('College Baseball API - Rankings', () => {
  it('should validate D1Baseball rankings structure', () => {
    const mockRankings = {
      source: 'D1Baseball',
      date: '2025-04-15',
      rankings: [
        {
          rank: 5,
          team: 'Texas',
          record: '45-15',
          previous_rank: 6,
          change: 1,
        },
      ],
    };

    expect(mockRankings).toHaveProperty('source');
    expect(mockRankings.rankings[0]).toHaveProperty('rank');
    expect(mockRankings.rankings[0].rank).toBeGreaterThan(0);
    expect(mockRankings.rankings[0].rank).toBeLessThanOrEqual(25);
  });

  it('should calculate RPI (Rating Percentage Index)', () => {
    // Simplified RPI calculation
    const winPct = 0.75; // 75%
    const oppWinPct = 0.55; // 55%
    const oppOppWinPct = 0.52; // 52%

    const rpi = 0.25 * winPct + 0.5 * oppWinPct + 0.25 * oppOppWinPct;

    expect(rpi).toBeCloseTo(0.593, 3);
  });
});

describe('College Baseball API - Live Games', () => {
  it('should validate live game data structure', () => {
    const mockLiveGame = {
      game_id: 'live-001',
      status: 'In Progress',
      inning: 7,
      inning_half: 'Top',
      outs: 2,
      balls: 2,
      strikes: 1,
      home_score: 5,
      away_score: 4,
      runners: {
        first: true,
        second: false,
        third: true,
      },
    };

    expect(mockLiveGame.status).toBe('In Progress');
    expect(mockLiveGame.inning).toBeGreaterThan(0);
    expect(mockLiveGame.outs).toBeGreaterThanOrEqual(0);
    expect(mockLiveGame.outs).toBeLessThanOrEqual(2);
    expect(mockLiveGame.balls).toBeLessThanOrEqual(3);
    expect(mockLiveGame.strikes).toBeLessThanOrEqual(2);
  });
});
