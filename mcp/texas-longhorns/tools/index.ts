/**
 * MCP Tools Index
 *
 * Exports all modular tool definitions for the Texas Longhorns MCP server.
 * Following official MCP patterns from modelcontextprotocol/typescript-sdk.
 */

// Re-export types
export * from './types';

// Re-export base utilities
export * from './base';

// Tool definitions will be exported from this index
// as they are created in separate modules

// ============================================================================
// TOOL REGISTRY
// ============================================================================

import type { ToolDefinition, ToolContext, ToolResponse } from './types';
import {
  executeWithCache,
  createCitation,
  enforceSportGuard,
  enforceQueryPolicy,
  sortBySportOrder,
  getSportsInOrder,
} from './base';
import type {
  Sport,
  SeasonSummary,
  ScheduleGame,
  BoxScore,
  PlayerCareer,
  RankingsContext,
  ArchiveResult,
} from './types';

// ============================================================================
// TOOL: get_team_seasons
// ============================================================================

export interface GetTeamSeasonsInput {
  sport?: Sport;
  limit?: number;
}

export const getTeamSeasonsTool: ToolDefinition<GetTeamSeasonsInput, SeasonSummary[]> = {
  name: 'get_team_seasons',
  description: 'Get season summaries for Texas Longhorns athletics. Baseball-first ordering.',
  inputSchema: {
    type: 'object',
    properties: {
      sport: {
        type: 'string',
        description: 'Filter by sport (baseball, football, basketball, track_field)',
        enum: ['baseball', 'football', 'basketball', 'track_field'],
      },
      limit: {
        type: 'number',
        description: 'Maximum number of seasons to return',
        default: 10,
      },
    },
  },
  handler: async (input, context) => {
    enforceSportGuard(input.sport);

    return executeWithCache('get_team_seasons', input, context, async () => {
      // This would be populated from the feeds in production
      const sports = input.sport ? [input.sport] : getSportsInOrder();
      const results: SeasonSummary[] = [];

      for (const sport of sports) {
        // Placeholder - actual implementation loads from feeds
        results.push({
          sport,
          season: '2024',
          record: 'TBD',
          highlights: [],
        });
      }

      return {
        result: sortBySportOrder(results).slice(0, input.limit || 10),
        citations: [createCitation('seasons', '/feeds', 'Texas Longhorns Season Data')],
      };
    });
  },
};

// ============================================================================
// TOOL: get_season_schedule
// ============================================================================

export interface GetSeasonScheduleInput {
  sport: Sport;
  season: number;
  program?: string;
}

export const getSeasonScheduleTool: ToolDefinition<GetSeasonScheduleInput, ScheduleGame[]> = {
  name: 'get_season_schedule',
  description: 'Get schedule for a specific sport and season.',
  inputSchema: {
    type: 'object',
    properties: {
      sport: {
        type: 'string',
        description: 'Sport to get schedule for',
        enum: ['baseball', 'football', 'basketball', 'track_field'],
      },
      season: {
        type: 'number',
        description: 'Season year (e.g., 2024)',
      },
      program: {
        type: 'string',
        description: 'For basketball, specify "men" or "women"',
        enum: ['men', 'women'],
      },
    },
    required: ['sport', 'season'],
  },
  handler: async (input, context) => {
    enforceSportGuard(input.sport);

    return executeWithCache('get_season_schedule', input, context, async () => {
      // Placeholder - actual implementation loads from feeds
      const games: ScheduleGame[] = [];

      return {
        result: games,
        citations: [
          createCitation(
            `schedule-${input.sport}-${input.season}`,
            `/feeds/${input.sport}.json`,
            `${input.sport} ${input.season} Schedule`
          ),
        ],
      };
    });
  },
};

// ============================================================================
// TOOL: get_game_box_score
// ============================================================================

export interface GetGameBoxScoreInput {
  sport: Sport;
  gameId: string;
  program?: string;
}

export const getGameBoxScoreTool: ToolDefinition<GetGameBoxScoreInput, BoxScore> = {
  name: 'get_game_box_score',
  description: 'Get detailed box score for a specific game.',
  inputSchema: {
    type: 'object',
    properties: {
      sport: {
        type: 'string',
        description: 'Sport',
        enum: ['baseball', 'football', 'basketball', 'track_field'],
      },
      gameId: {
        type: 'string',
        description: 'Game identifier',
      },
      program: {
        type: 'string',
        description: 'For basketball, specify "men" or "women"',
        enum: ['men', 'women'],
      },
    },
    required: ['sport', 'gameId'],
  },
  handler: async (input, context) => {
    enforceSportGuard(input.sport);

    return executeWithCache('get_game_box_score', input, context, async () => {
      // Placeholder - actual implementation loads from feeds/API
      const boxScore: BoxScore = {
        gameId: input.gameId,
        date: new Date().toISOString(),
        opponent: 'TBD',
        final: { texas: 0, opponent: 0 },
        stats: {},
      };

      return {
        result: boxScore,
        citations: [
          createCitation(
            `boxscore-${input.gameId}`,
            `/games/${input.gameId}`,
            `Game ${input.gameId} Box Score`
          ),
        ],
      };
    });
  },
};

// ============================================================================
// TOOL: get_player_career
// ============================================================================

export interface GetPlayerCareerInput {
  playerId: string;
  sportHint?: Sport;
}

export const getPlayerCareerTool: ToolDefinition<GetPlayerCareerInput, PlayerCareer> = {
  name: 'get_player_career',
  description: 'Get career dossier for a player. Searches baseball first.',
  inputSchema: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'Player ID or name to search',
      },
      sportHint: {
        type: 'string',
        description: 'Hint for which sport to search first',
        enum: ['baseball', 'football', 'basketball', 'track_field'],
      },
    },
    required: ['playerId'],
  },
  handler: async (input, context) => {
    if (input.sportHint) {
      enforceSportGuard(input.sportHint);
    }

    return executeWithCache('get_player_career', input, context, async () => {
      // Search order: sportHint first (if provided), then baseball-first order
      const searchOrder = input.sportHint
        ? [input.sportHint, ...getSportsInOrder().filter((s) => s !== input.sportHint)]
        : getSportsInOrder();

      // Placeholder - actual implementation searches player databases
      const career: PlayerCareer = {
        playerId: input.playerId,
        name: input.playerId,
        sport: searchOrder[0],
        position: 'Unknown',
        years: 'TBD',
        stats: {},
      };

      return {
        result: career,
        citations: [
          createCitation(`player-${input.playerId}`, `/players/${input.playerId}`, `Player Career`),
        ],
      };
    });
  },
};

// ============================================================================
// TOOL: get_rankings_context
// ============================================================================

export interface GetRankingsContextInput {
  season: number;
  sport: Sport;
}

export const getRankingsContextTool: ToolDefinition<GetRankingsContextInput, RankingsContext> = {
  name: 'get_rankings_context',
  description: 'Get poll movement and ranking trends for a sport/season.',
  inputSchema: {
    type: 'object',
    properties: {
      season: {
        type: 'number',
        description: 'Season year',
      },
      sport: {
        type: 'string',
        description: 'Sport',
        enum: ['baseball', 'football', 'basketball', 'track_field'],
      },
    },
    required: ['season', 'sport'],
  },
  handler: async (input, context) => {
    enforceSportGuard(input.sport);

    return executeWithCache('get_rankings_context', input, context, async () => {
      // Placeholder - actual implementation loads ranking history
      const rankings: RankingsContext = {
        sport: input.sport,
        season: String(input.season),
        pollHistory: [],
      };

      return {
        result: rankings,
        citations: [
          createCitation(
            `rankings-${input.sport}-${input.season}`,
            `/rankings/${input.sport}`,
            `${input.sport} ${input.season} Rankings`
          ),
        ],
      };
    });
  },
};

// ============================================================================
// TOOL: search_archive
// ============================================================================

export interface SearchArchiveInput {
  query: string;
  limit?: number;
  sportFilter?: Sport;
}

export const searchArchiveTool: ToolDefinition<SearchArchiveInput, ArchiveResult[]> = {
  name: 'search_archive',
  description: 'Search the BSI archive for Texas Longhorns content.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
        default: 10,
      },
      sportFilter: {
        type: 'string',
        description: 'Filter results by sport',
        enum: ['baseball', 'football', 'basketball', 'track_field'],
      },
    },
    required: ['query'],
  },
  handler: async (input, context) => {
    enforceQueryPolicy(input.query);
    if (input.sportFilter) {
      enforceSportGuard(input.sportFilter);
    }

    return executeWithCache('search_archive', input, context, async () => {
      // Placeholder - actual implementation searches archive
      const results: ArchiveResult[] = [];

      return {
        result: results.slice(0, input.limit || 10),
        citations: [createCitation('archive-search', '/archive', 'BSI Archive Search')],
      };
    });
  },
};

// ============================================================================
// TOOL REGISTRY EXPORT
// ============================================================================

export const tools = {
  get_team_seasons: getTeamSeasonsTool,
  get_season_schedule: getSeasonScheduleTool,
  get_game_box_score: getGameBoxScoreTool,
  get_player_career: getPlayerCareerTool,
  get_rankings_context: getRankingsContextTool,
  search_archive: searchArchiveTool,
};

export type ToolName = keyof typeof tools;

/**
 * Execute a tool by name
 */
export async function executeTool(
  name: ToolName,
  input: unknown,
  context: ToolContext
): Promise<ToolResponse<unknown>> {
  const tool = tools[name];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.handler(input as any, context);
}

/**
 * Get all tool definitions for MCP manifest
 */
export function getToolDefinitions(): Array<{
  name: string;
  description: string;
  inputSchema: unknown;
}> {
  return Object.values(tools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}
