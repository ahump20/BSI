import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

// Schema definitions for NFL API responses
const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  abbreviation: z.string(),
  city: z.string(),
  division: z.string(),
  conference: z.string(),
  wins: z.number(),
  losses: z.number(),
  ties: z.number().optional(),
  winPct: z.number(),
  pointsFor: z.number(),
  pointsAgainst: z.number(),
  pointDifferential: z.number(),
  lastUpdated: z.string(),
});

const StandingsSchema = z.object({
  conference: z.string(),
  division: z.string(),
  teams: z.array(TeamSchema),
  lastUpdated: z.string(),
  dataSource: z.string(),
});

const GameSchema = z.object({
  id: z.number(),
  week: z.number(),
  season: z.number(),
  homeTeam: z.object({
    id: z.number(),
    name: z.string(),
    score: z.number().optional(),
  }),
  awayTeam: z.object({
    id: z.number(),
    name: z.string(),
    score: z.number().optional(),
  }),
  status: z.enum(['scheduled', 'in_progress', 'final', 'postponed']),
  startTime: z.string(),
  venue: z.string().optional(),
});

const AnalyticsSchema = z.object({
  teamId: z.number(),
  dvoa: z.number().optional(),
  epa: z.number().optional(),
  successRate: z.number().optional(),
  pythagWins: z.number().optional(),
  strengthOfSchedule: z.number().optional(),
});

describe('NFL API Tests', () => {
  const BASE_URL = process.env.API_BASE_URL || 'https://blazesportsintel.com';
  const API_KEY = process.env.SPORTSDATAIO_API_KEY;

  beforeAll(() => {
    if (!API_KEY) {
      console.warn('⚠️  SPORTSDATAIO_API_KEY not set. Some tests may fail.');
    }
  });

  describe('Titans Team Data (/api/nfl/titans)', () => {
    it('should return valid Titans data', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/titans`);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.team).toBeDefined();
      expect(data.team.name).toBe('Tennessee Titans');
      expect(data.team.abbreviation).toBe('TEN');
      expect(data.team.city).toBe('Tennessee');
    });

    it('should include current season statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/titans`);
      const data = await response.json();

      expect(data.team.wins).toBeGreaterThanOrEqual(0);
      expect(data.team.losses).toBeGreaterThanOrEqual(0);
      expect(data.team.winPct).toBeGreaterThanOrEqual(0);
      expect(data.team.winPct).toBeLessThanOrEqual(1);

      // Total games should not exceed 17 (regular season)
      const totalGames = data.team.wins + data.team.losses + (data.team.ties || 0);
      expect(totalGames).toBeLessThanOrEqual(17);
    });

    it('should include offensive and defensive statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/titans`);
      const data = await response.json();

      expect(data.team.pointsFor).toBeGreaterThanOrEqual(0);
      expect(data.team.pointsAgainst).toBeGreaterThanOrEqual(0);
      expect(data.team.pointDifferential).toBe(data.team.pointsFor - data.team.pointsAgainst);
    });

    it('should have fresh data (less than 24 hours old)', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/titans`);
      const data = await response.json();

      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();
      const ageInHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      expect(ageInHours).toBeLessThan(24);
    });

    it('should include data source attribution', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/titans`);
      const data = await response.json();

      expect(data.dataSource).toBeDefined();
      expect(data.dataSource).toMatch(/ESPN|SportsDataIO|NFL\.com|Real-time/i);
    });
  });

  describe('NFL Standings (/api/nfl/standings)', () => {
    it('should return standings for all divisions', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/standings`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.standings).toBeDefined();
      expect(Array.isArray(data.standings)).toBe(true);

      // Should have 8 divisions (AFC/NFC × East/North/South/West)
      expect(data.standings.length).toBe(8);
    });

    it('should calculate win percentage correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/standings`);
      const data = await response.json();

      for (const division of data.standings) {
        for (const team of division.teams) {
          const totalGames = team.wins + team.losses + (team.ties || 0);
          const expectedWinPct =
            totalGames > 0 ? (team.wins + (team.ties || 0) * 0.5) / totalGames : 0;

          expect(Math.abs(team.winPct - expectedWinPct)).toBeLessThan(0.001);
        }
      }
    });

    it('should sort teams by win percentage', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/standings`);
      const data = await response.json();

      for (const division of data.standings) {
        const teams = division.teams;
        for (let i = 1; i < teams.length; i++) {
          expect(teams[i - 1].winPct).toBeGreaterThanOrEqual(teams[i].winPct);
        }
      }
    });

    it('should filter by conference', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/standings?conference=AFC`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.standings.length).toBe(4); // 4 AFC divisions

      for (const division of data.standings) {
        expect(division.conference).toBe('AFC');
      }
    });

    it('should filter by division', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/standings?division=AFC%20South`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.standings.length).toBe(1);
      expect(data.standings[0].division).toBe('AFC South');

      // Should include Titans
      const titans = data.standings[0].teams.find((t: any) => t.abbreviation === 'TEN');
      expect(titans).toBeDefined();
    });
  });

  describe('NFL Scores (/api/nfl/scores)', () => {
    it('should return scores for current week', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/scores`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.week).toBeDefined();
      expect(data.season).toBeDefined();
      expect(data.games).toBeDefined();
      expect(Array.isArray(data.games)).toBe(true);
    });

    it('should return scores for specific week', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/scores?week=5`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.week).toBe(5);

      for (const game of data.games) {
        expect(game.week).toBe(5);
      }
    });

    it('should include home and away teams', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/scores`);
      const data = await response.json();

      for (const game of data.games) {
        expect(game.homeTeam).toBeDefined();
        expect(game.awayTeam).toBeDefined();
        expect(game.homeTeam.name).toBeDefined();
        expect(game.awayTeam.name).toBeDefined();
      }
    });

    it('should include game status', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/scores`);
      const data = await response.json();

      for (const game of data.games) {
        expect(game.status).toBeDefined();
        expect(['scheduled', 'in_progress', 'final', 'postponed']).toContain(game.status);
      }
    });

    it('should update frequently during game day', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/scores`);
      const cacheControl = response.headers.get('cache-control');

      expect(cacheControl).toBeDefined();
      const maxAge = parseInt(cacheControl?.match(/max-age=(\d+)/)?.[1] || '0');

      // During games, cache should be 30-60 seconds
      expect(maxAge).toBeGreaterThanOrEqual(30);
      expect(maxAge).toBeLessThanOrEqual(300);
    });
  });

  describe('NFL Analytics', () => {
    it('should return advanced analytics for team', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/analytics?teamId=34`); // Titans
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.teamId).toBe(34);
    });

    it('should calculate Pythagorean wins', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/analytics?teamId=34`);
      const data = await response.json();

      if (data.pythagWins !== undefined) {
        expect(data.pythagWins).toBeGreaterThanOrEqual(0);
        expect(data.pythagWins).toBeLessThanOrEqual(17);
      }
    });

    it('should include DVOA if available', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/analytics?teamId=34`);
      const data = await response.json();

      // DVOA can be negative (below average) or positive (above average)
      if (data.dvoa !== undefined) {
        expect(typeof data.dvoa).toBe('number');
        expect(Math.abs(data.dvoa)).toBeLessThan(100); // Reasonable range
      }
    });

    it('should include EPA metrics', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/analytics?teamId=34`);
      const data = await response.json();

      if (data.epa !== undefined) {
        expect(typeof data.epa).toBe('number');
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for invalid team ID', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/teams/99999`);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid week number', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/scores?week=99`);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid conference', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/standings?conference=Invalid`);
      expect(response.status).toBe(400);
    });

    it('should include correlation ID in errors', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/teams/99999`);
      const data = await response.json();

      expect(data.correlationId).toBeDefined();
      expect(typeof data.correlationId).toBe('string');
    });
  });

  describe('Performance', () => {
    it('should respond within 500ms for cached data', async () => {
      // Warm cache
      await fetch(`${BASE_URL}/api/nfl/titans`);

      // Timed request
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/nfl/titans`);
      const duration = Date.now() - start;

      expect(response.ok).toBe(true);
      // 500ms is reasonable for CI environments with network latency
      expect(duration).toBeLessThan(500);
    });

    it('should respond within 2 seconds for fresh standings', async () => {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/nfl/standings?bustCache=true`);
      const duration = Date.now() - start;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/titans`);

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toContain('GET');
    });

    it('should handle OPTIONS preflight', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/titans`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe('Data Consistency', () => {
    it('should have consistent data across endpoints', async () => {
      // Get Titans data from team endpoint
      const teamResponse = await fetch(`${BASE_URL}/api/nfl/titans`);
      const teamData = await teamResponse.json();

      // Get Titans data from standings endpoint
      const standingsResponse = await fetch(`${BASE_URL}/api/nfl/standings?division=AFC%20South`);
      const standingsData = await standingsResponse.json();
      const titansStandings = standingsData.standings[0].teams.find(
        (t: any) => t.abbreviation === 'TEN'
      );

      // Win/loss records should match
      expect(teamData.team.wins).toBe(titansStandings.wins);
      expect(teamData.team.losses).toBe(titansStandings.losses);
      expect(teamData.team.ties || 0).toBe(titansStandings.ties || 0);
    });

    it('should have point differential matching points for/against', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/standings`);
      const data = await response.json();

      for (const division of data.standings) {
        for (const team of division.teams) {
          const expectedDiff = team.pointsFor - team.pointsAgainst;
          expect(team.pointDifferential).toBe(expectedDiff);
        }
      }
    });
  });

  describe('Query Parameters', () => {
    it('should support season parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/standings?season=2025`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.season).toBe(2025);
    });

    it('should support teamId parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/teams?teamId=34`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.team.id).toBe(34);
    });

    it('should support multiple filters', async () => {
      const response = await fetch(`${BASE_URL}/api/nfl/standings?conference=AFC&season=2025`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.season).toBe(2025);
      expect(data.standings.length).toBe(4); // 4 AFC divisions
    });
  });
});
