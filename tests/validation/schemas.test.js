/**
 * VALIDATION SCHEMAS TESTS
 * Tests for API endpoint validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  predictGameSchema,
  liveScoresSchema,
  gameDetailsSchema,
} from '../../api/validation/schemas/game.schemas.js';
import {
  teamAnalyticsSchema,
  teamInfoSchema,
  teamRankingsSchema,
} from '../../api/validation/schemas/team.schemas.js';
import {
  predictPlayerSchema,
  playerStatsSchema,
} from '../../api/validation/schemas/player.schemas.js';
import { schedulingOptimizerSchema } from '../../api/validation/schemas/scheduling.schemas.js';

describe('Game Prediction Schemas', () => {
  describe('predictGameSchema', () => {
    it('should validate valid game prediction request', () => {
      const validRequest = {
        body: {
          homeTeam: 'texas-longhorns',
          awayTeam: 'oklahoma-sooners',
          sport: 'football',
          gameDate: '2024-10-12',
        },
      };

      const result = predictGameSchema.body.safeParse(validRequest.body);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sport', () => {
      const invalidRequest = {
        body: {
          homeTeam: 'team1',
          awayTeam: 'team2',
          sport: 'invalid-sport',
          gameDate: '2024-10-12',
        },
      };

      const result = predictGameSchema.body.safeParse(invalidRequest.body);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidRequest = {
        body: {
          homeTeam: 'team1',
          awayTeam: 'team2',
          sport: 'baseball',
          gameDate: '10/12/2024',
        },
      };

      const result = predictGameSchema.body.safeParse(invalidRequest.body);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const requestWithOptionals = {
        body: {
          homeTeam: 'team1',
          awayTeam: 'team2',
          sport: 'baseball',
          venue: 'Yankee Stadium',
          weather: {
            temperature: 72,
            conditions: 'clear',
          },
        },
      };

      const result = predictGameSchema.body.safeParse(requestWithOptionals.body);
      expect(result.success).toBe(true);
    });
  });

  describe('liveScoresSchema', () => {
    it('should validate valid live scores query', () => {
      const validQuery = {
        query: {
          sport: 'baseball',
          limit: '20',
        },
      };

      const result = liveScoresSchema.query.safeParse(validQuery.query);
      expect(result.success).toBe(true);
    });

    it('should coerce limit to number', () => {
      const query = {
        query: {
          limit: '50',
        },
      };

      const result = liveScoresSchema.query.safeParse(query.query);
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(50);
    });

    it('should enforce limit maximum', () => {
      const query = {
        query: {
          limit: '500',
        },
      };

      const result = liveScoresSchema.query.safeParse(query.query);
      expect(result.success).toBe(false);
    });
  });
});

describe('Team Schemas', () => {
  describe('teamAnalyticsSchema', () => {
    it('should validate valid team analytics request', () => {
      const validRequest = {
        params: {
          sport: 'baseball',
          teamKey: 'yankees',
        },
        query: {
          season: '2024',
          includeAdvanced: 'true',
        },
      };

      const paramsResult = teamAnalyticsSchema.params.safeParse(validRequest.params);
      const queryResult = teamAnalyticsSchema.query.safeParse(validRequest.query);

      expect(paramsResult.success).toBe(true);
      expect(queryResult.success).toBe(true);
    });

    it('should reject invalid team key', () => {
      const invalidParams = {
        params: {
          sport: 'baseball',
          teamKey: '', // Empty team key
        },
      };

      const result = teamAnalyticsSchema.params.safeParse(invalidParams.params);
      expect(result.success).toBe(false);
    });
  });

  describe('teamRankingsSchema', () => {
    it('should validate valid rankings query', () => {
      const validQuery = {
        query: {
          sport: 'football',
          season: '2024',
          limit: '25',
        },
      };

      const result = teamRankingsSchema.query.safeParse(validQuery.query);
      expect(result.success).toBe(true);
    });

    it('should accept rankingType enum', () => {
      const query = {
        query: {
          sport: 'basketball',
          rankingType: 'offense',
        },
      };

      const result = teamRankingsSchema.query.safeParse(query.query);
      expect(result.success).toBe(true);
    });
  });
});

describe('Player Schemas', () => {
  describe('predictPlayerSchema', () => {
    it('should validate valid player prediction request', () => {
      const validRequest = {
        body: {
          playerId: 'player-123',
          sport: 'baseball',
          gameContext: {
            opponent: 'red-sox',
            venue: 'Fenway Park',
            date: '2024-10-15',
          },
        },
      };

      const result = predictPlayerSchema.body.safeParse(validRequest.body);
      expect(result.success).toBe(true);
    });

    it('should accept minimal player prediction', () => {
      const minimalRequest = {
        body: {
          playerId: 'player-456',
          sport: 'football',
        },
      };

      const result = predictPlayerSchema.body.safeParse(minimalRequest.body);
      expect(result.success).toBe(true);
    });
  });

  describe('playerStatsSchema', () => {
    it('should validate player stats request', () => {
      const validRequest = {
        params: {
          sport: 'baseball',
          playerId: 'player-789',
        },
        query: {
          season: '2024',
          statType: 'season',
          split: 'home',
        },
      };

      const paramsResult = playerStatsSchema.params.safeParse(validRequest.params);
      const queryResult = playerStatsSchema.query.safeParse(validRequest.query);

      expect(paramsResult.success).toBe(true);
      expect(queryResult.success).toBe(true);
    });

    it('should use default statType', () => {
      const query = { query: {} };

      const result = playerStatsSchema.query.safeParse(query.query);
      expect(result.success).toBe(true);
      expect(result.data.statType).toBe('season');
    });
  });
});

describe('Scheduling Schemas', () => {
  describe('schedulingOptimizerSchema', () => {
    it('should validate valid scheduling request', () => {
      const validRequest = {
        body: {
          teamId: 'team-123',
          futureOpponents: [
            { teamId: 'opp-1', location: 'home' },
            { teamId: 'opp-2', location: 'away' },
          ],
          userTier: 'pro',
          iterations: 1000,
        },
      };

      const result = schedulingOptimizerSchema.body.safeParse(validRequest.body);
      expect(result.success).toBe(true);
    });

    it('should enforce minimum opponents', () => {
      const invalidRequest = {
        body: {
          teamId: 'team-123',
          futureOpponents: [],
        },
      };

      const result = schedulingOptimizerSchema.body.safeParse(invalidRequest.body);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum opponents', () => {
      const opponents = Array(60).fill({ teamId: 'opp', location: 'home' });
      const invalidRequest = {
        body: {
          teamId: 'team-123',
          futureOpponents: opponents,
        },
      };

      const result = schedulingOptimizerSchema.body.safeParse(invalidRequest.body);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum iterations', () => {
      const invalidRequest = {
        body: {
          teamId: 'team-123',
          futureOpponents: [{ teamId: 'opp-1' }],
          iterations: 20000,
        },
      };

      const result = schedulingOptimizerSchema.body.safeParse(invalidRequest.body);
      expect(result.success).toBe(false);
    });

    it('should use default values', () => {
      const minimalRequest = {
        body: {
          teamId: 'team-123',
          futureOpponents: [{ teamId: 'opp-1' }],
        },
      };

      const result = schedulingOptimizerSchema.body.safeParse(minimalRequest.body);
      expect(result.success).toBe(true);
      expect(result.data.userTier).toBe('free');
      expect(result.data.iterations).toBe(100);
    });
  });
});

describe('Common Validation Patterns', () => {
  it('should validate team keys with correct format', () => {
    const validKeys = ['team-123', 'texas_longhorns', 'team-ABC-xyz'];
    const invalidKeys = ['team 123', 'team@123', 'team#abc'];

    validKeys.forEach((key) => {
      const result = teamInfoSchema.params.safeParse({
        sport: 'baseball',
        teamKey: key,
      });
      expect(result.success).toBe(true);
    });

    invalidKeys.forEach((key) => {
      const result = teamInfoSchema.params.safeParse({
        sport: 'baseball',
        teamKey: key,
      });
      expect(result.success).toBe(false);
    });
  });

  it('should validate date strings', () => {
    const validDates = ['2024-01-01', '2024-12-31', '2023-06-15'];
    const invalidDates = ['2024/01/01', '01-01-2024', '2024-13-01', 'not-a-date'];

    validDates.forEach((date) => {
      const result = predictGameSchema.body.safeParse({
        homeTeam: 'team1',
        awayTeam: 'team2',
        sport: 'baseball',
        gameDate: date,
      });
      expect(result.success).toBe(true);
    });

    invalidDates.forEach((date) => {
      const result = predictGameSchema.body.safeParse({
        homeTeam: 'team1',
        awayTeam: 'team2',
        sport: 'baseball',
        gameDate: date,
      });
      expect(result.success).toBe(false);
    });
  });
});
