import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

// Schema definitions for MLB API responses
const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  abbreviation: z.string(),
  city: z.string(),
  division: z.string(),
  league: z.string(),
  wins: z.number(),
  losses: z.number(),
  winPct: z.number(),
  gamesBack: z.number().optional(),
  runsScored: z.number(),
  runsAllowed: z.number(),
  pythagWins: z.number().optional(),
  pythagLosses: z.number().optional(),
  lastUpdated: z.string(),
});

const StandingsSchema = z.object({
  league: z.string(),
  division: z.string(),
  teams: z.array(TeamSchema),
  lastUpdated: z.string(),
  dataSource: z.string(),
});

const PlayerStatsSchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  teamId: z.number(),
  position: z.string(),
  battingAverage: z.number().optional(),
  homeRuns: z.number().optional(),
  rbi: z.number().optional(),
  era: z.number().optional(),
  wins: z.number().optional(),
  strikeouts: z.number().optional(),
  lastUpdated: z.string(),
});

const PythagoreanCalculationSchema = z.object({
  teamId: z.number(),
  runsScored: z.number(),
  runsAllowed: z.number(),
  actualWins: z.number(),
  actualLosses: z.number(),
  expectedWins: z.number(),
  expectedLosses: z.number(),
  luckFactor: z.number(),
  confidence: z.number(),
});

describe('MLB API Tests', () => {
  const BASE_URL = process.env.API_BASE_URL || 'https://blazesportsintel.com';
  const API_KEY = process.env.SPORTSDATAIO_API_KEY;

  beforeAll(() => {
    if (!API_KEY) {
      console.warn('⚠️  SPORTSDATAIO_API_KEY not set. Some tests may fail.');
    }
  });

  // =============================================================================
  // TESTS REQUIRING LIVE MLB DATA - Skipped during offseason
  // These tests require the MLB season to be active with current runs/stats data
  // =============================================================================

  describe.skip('Cardinals Team Data (/api/mlb/cardinals) [REQUIRES LIVE DATA]', () => {
    it('should return valid Cardinals data', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.team).toBeDefined();
      expect(data.team.name).toBe('St. Louis Cardinals');
      expect(data.team.abbreviation).toBe('STL');
      expect(data.team.city).toBe('St. Louis');
    });

    it('should include recent statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const data = await response.json();

      expect(data.team.wins).toBeGreaterThanOrEqual(0);
      expect(data.team.losses).toBeGreaterThanOrEqual(0);
      expect(data.team.winPct).toBeGreaterThanOrEqual(0);
      expect(data.team.winPct).toBeLessThanOrEqual(1);
    });

    it('should include Pythagorean calculations', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const data = await response.json();

      if (data.team.pythagWins) {
        expect(data.team.pythagWins).toBeGreaterThanOrEqual(0);
        expect(data.team.pythagLosses).toBeGreaterThanOrEqual(0);

        // Pythagorean wins + losses should approximately equal total games
        const totalGames = data.team.wins + data.team.losses;
        const pythagTotal = Math.round(data.team.pythagWins + data.team.pythagLosses);
        expect(Math.abs(pythagTotal - totalGames)).toBeLessThanOrEqual(2);
      }
    });

    it('should have fresh data (less than 24 hours old)', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const data = await response.json();

      const lastUpdated = new Date(data.lastUpdated);
      const now = new Date();
      const ageInHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      expect(ageInHours).toBeLessThan(24);
    });

    it('should include data source attribution', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const data = await response.json();

      expect(data.dataSource).toBeDefined();
      expect(data.dataSource).toMatch(/MLB Stats API|SportsDataIO|Real-time/i);
    });

    it('should set correct cache headers', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);

      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeDefined();
      expect(cacheControl).toMatch(/max-age=/);

      // Cache should be between 30 seconds and 5 minutes
      const maxAge = parseInt(cacheControl?.match(/max-age=(\d+)/)?.[1] || '0');
      expect(maxAge).toBeGreaterThanOrEqual(30);
      expect(maxAge).toBeLessThanOrEqual(300);
    });
  });

  describe.skip('Pythagorean Calculations [REQUIRES LIVE DATA]', () => {
    it('should calculate expected wins correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/analytics/pythagorean?teamId=138`);
      expect(response.ok).toBe(true);

      const data = await response.json();

      // Validate schema
      const result = PythagoreanCalculationSchema.parse(data);

      // Expected wins should be between 0 and total games
      const totalGames = result.actualWins + result.actualLosses;
      expect(result.expectedWins).toBeGreaterThanOrEqual(0);
      expect(result.expectedWins).toBeLessThanOrEqual(totalGames);

      // Luck factor should be reasonable (-10 to +10 wins)
      expect(Math.abs(result.luckFactor)).toBeLessThan(10);
    });

    it('should use correct Pythagorean exponent for baseball', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/analytics/pythagorean?teamId=138`);
      const data = await response.json();

      // Baseball uses exponent of 1.83
      const expectedExponent = 1.83;
      const calculatedWinPct =
        Math.pow(data.runsScored, expectedExponent) /
        (Math.pow(data.runsScored, expectedExponent) +
          Math.pow(data.runsAllowed, expectedExponent));

      const expectedWinPct = data.expectedWins / (data.expectedWins + data.expectedLosses);

      expect(Math.abs(calculatedWinPct - expectedWinPct)).toBeLessThan(0.01);
    });
  });

  describe.skip('Player Statistics [REQUIRES LIVE DATA]', () => {
    it('should return valid player stats', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/players?teamId=138`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.players).toBeDefined();
      expect(Array.isArray(data.players)).toBe(true);
    });

    it('should filter by position', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/players?teamId=138&position=P`);
      expect(response.ok).toBe(true);

      const data = await response.json();

      for (const player of data.players) {
        expect(player.position).toBe('P');
        // Pitchers should have ERA and strikeouts
        expect(player.era).toBeDefined();
        expect(player.strikeouts).toBeDefined();
      }
    });

    it('should calculate batting average correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/players?teamId=138&position=OF`);
      const data = await response.json();

      for (const player of data.players) {
        if (player.battingAverage) {
          expect(player.battingAverage).toBeGreaterThanOrEqual(0);
          expect(player.battingAverage).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe.skip('Performance [REQUIRES LIVE DATA]', () => {
    it('should respond within 200ms for cached data', async () => {
      // First request to warm cache
      await fetch(`${BASE_URL}/api/mlb/cardinals`);

      // Second request should be fast
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const duration = Date.now() - start;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(200);
    });

    it('should respond within 2 seconds for fresh data', async () => {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/mlb/standings?bustCache=true`);
      const duration = Date.now() - start;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe.skip('CORS Headers [REQUIRES LIVE DATA]', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toContain('GET');
    });

    it('should handle OPTIONS preflight', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe.skip('Data Consistency [REQUIRES LIVE DATA]', () => {
    it('should have consistent data across endpoints', async () => {
      // Get Cardinals data from team endpoint
      const teamResponse = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const teamData = await teamResponse.json();

      // Get Cardinals data from standings endpoint
      const standingsResponse = await fetch(`${BASE_URL}/api/mlb/standings?division=NL%20Central`);
      const standingsData = await standingsResponse.json();
      const cardinalsStandings = standingsData.standings[0].teams.find(
        (t: any) => t.abbreviation === 'STL'
      );

      // Win/loss records should match
      expect(teamData.team.wins).toBe(cardinalsStandings.wins);
      expect(teamData.team.losses).toBe(cardinalsStandings.losses);
    });
  });

  // =============================================================================
  // TESTS THAT DON'T REQUIRE LIVE DATA - Always run
  // =============================================================================

  describe('MLB Standings (/api/mlb/standings)', () => {
    it('should return standings for all divisions', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/standings`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.standings).toBeDefined();
      expect(Array.isArray(data.standings)).toBe(true);

      // Should have 6 divisions (AL East, AL Central, AL West, NL East, NL Central, NL West)
      expect(data.standings.length).toBeGreaterThanOrEqual(6);
    });

    it('should have valid team records', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/standings`);
      const data = await response.json();

      for (const division of data.standings) {
        expect(division.division).toBeDefined();
        expect(division.teams.length).toBeGreaterThan(0);

        for (const team of division.teams) {
          // Win percentage should be calculated correctly (handle 0-0 record)
          if (team.wins + team.losses > 0) {
            const expectedWinPct = team.wins / (team.wins + team.losses);
            expect(Math.abs(team.winPct - expectedWinPct)).toBeLessThan(0.01);
          }

          // Teams should have valid records
          expect(team.wins).toBeGreaterThanOrEqual(0);
          expect(team.losses).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should calculate games back correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/standings`);
      const data = await response.json();

      for (const division of data.standings) {
        const teams = division.teams;
        if (teams.length > 1) {
          // First place team should have 0 games back
          expect(teams[0].gamesBack).toBe(0);

          // Games back should increase as we go down the standings
          for (let i = 1; i < teams.length; i++) {
            expect(teams[i].gamesBack).toBeGreaterThanOrEqual(teams[i - 1].gamesBack);
          }
        }
      }
    });

    it('should filter by division', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/standings?division=NL%20Central`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.standings.length).toBe(1);
      expect(data.standings[0].division).toBe('NL Central');

      // Should include Cardinals
      const cardinals = data.standings[0].teams.find((t: any) => t.abbreviation === 'STL');
      expect(cardinals).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for invalid team ID', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/teams/99999`);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/standings?division=InvalidDivision`);
      expect(response.status).toBe(400);
    });

    it('should include correlation ID in error responses', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/teams/99999`);
      const data = await response.json();

      expect(data.correlationId).toBeDefined();
      expect(typeof data.correlationId).toBe('string');
    });

    it('should return 404 for unknown team slug', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/unknownteam`);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.correlationId).toBeDefined();
    });
  });

  describe('CORS Headers (Standings)', () => {
    it('should include CORS headers on standings endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/standings`);

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('should include CORS headers on error responses', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/teams/99999`);

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });
});
