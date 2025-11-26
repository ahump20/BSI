/**
 * BlazeSportsIntel MCP Server
 *
 * Model Context Protocol (MCP) server providing AI agents with access to
 * comprehensive sports data. Enables natural language queries about games,
 * teams, players, and statistics.
 *
 * Available Tools:
 * - get_live_scores: Real-time scores across all supported sports
 * - get_team_info: Team details, rosters, and statistics
 * - get_game_summary: Detailed game information including box scores
 * - get_standings: Conference and overall standings
 * - get_rankings: AP, Coaches, and CFP rankings
 * - get_player_stats: Individual player statistics
 * - search_sports: Natural language search across all data
 * - get_schedule: Upcoming games for teams or conferences
 * - calculate_win_probability: Real-time win probability for live games
 *
 * Integration:
 * - Connects to BALLDONTLIE MCP at mcp.balldontlie.io
 * - Custom BSI tools for college sports specialization
 *
 * Brand: BlazeSportsIntel - "Born to Blaze the Path Less Beaten"
 * No fake data. Real sports intelligence for AI agents.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPPropertySchema>;
    required?: string[];
  };
}

export interface MCPPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  enum?: string[];
  items?: { type: string };
  default?: any;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  tools: MCPTool[];
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const BSI_TOOLS: MCPTool[] = [
  {
    name: 'get_live_scores',
    description:
      'Get real-time scores for live games across supported sports. Returns current score, game status, and key game details.',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'Sport to get scores for',
          enum: ['ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl', 'all'],
          default: 'all',
        },
        conference: {
          type: 'string',
          description: 'Filter by conference (college sports only). Examples: SEC, Big Ten, ACC',
        },
        team: {
          type: 'string',
          description: 'Filter by team name or abbreviation',
        },
      },
    },
  },
  {
    name: 'get_team_info',
    description: 'Get detailed information about a team including roster, record, and statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'Sport the team plays',
          enum: ['ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl'],
        },
        team: {
          type: 'string',
          description: 'Team name, city, or abbreviation (e.g., "Texas A&M", "TAM", "Patriots")',
        },
        include_roster: {
          type: 'boolean',
          description: 'Include full roster in response',
          default: false,
        },
        include_stats: {
          type: 'boolean',
          description: 'Include season statistics',
          default: true,
        },
      },
      required: ['sport', 'team'],
    },
  },
  {
    name: 'get_game_summary',
    description:
      'Get detailed summary of a specific game including box score, play-by-play highlights, and statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'Sport of the game',
          enum: ['ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl'],
        },
        game_id: {
          type: 'string',
          description: 'Game identifier from ESPN or other provider',
        },
        teams: {
          type: 'string',
          description:
            'Alternative to game_id: specify matchup like "Texas vs Oklahoma" or "SEC Championship"',
        },
        date: {
          type: 'string',
          description: 'Game date in YYYY-MM-DD format (helps narrow down matchup)',
        },
      },
      required: ['sport'],
    },
  },
  {
    name: 'get_standings',
    description:
      'Get current standings for a sport, optionally filtered by conference or division.',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'Sport to get standings for',
          enum: ['ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl'],
        },
        conference: {
          type: 'string',
          description: 'Conference name (e.g., "SEC", "AFC East")',
        },
        division: {
          type: 'string',
          description: 'Division (e.g., "FBS", "Division I")',
        },
      },
      required: ['sport'],
    },
  },
  {
    name: 'get_rankings',
    description: 'Get college sports rankings including AP Poll, Coaches Poll, and CFP Rankings.',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'College sport to get rankings for',
          enum: ['ncaaf', 'ncaab', 'wcbb'],
        },
        poll: {
          type: 'string',
          description: 'Specific poll to retrieve',
          enum: ['ap', 'coaches', 'cfp', 'all'],
          default: 'all',
        },
        week: {
          type: 'number',
          description: 'Week number (defaults to current week)',
        },
      },
      required: ['sport'],
    },
  },
  {
    name: 'get_player_stats',
    description: 'Get statistics for a specific player.',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'Sport the player competes in',
          enum: ['ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'nhl'],
        },
        player_name: {
          type: 'string',
          description: 'Player name (e.g., "Patrick Mahomes", "Caitlin Clark")',
        },
        team: {
          type: 'string',
          description: 'Team name to help identify player',
        },
        season: {
          type: 'number',
          description: 'Season year (defaults to current)',
        },
        stat_type: {
          type: 'string',
          description: 'Type of stats to retrieve',
          enum: ['season', 'game', 'career', 'advanced'],
          default: 'season',
        },
      },
      required: ['sport', 'player_name'],
    },
  },
  {
    name: 'get_schedule',
    description: 'Get upcoming or past games for a team, conference, or entire sport.',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'Sport to get schedule for',
          enum: ['ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl'],
        },
        team: {
          type: 'string',
          description: 'Team name or abbreviation',
        },
        conference: {
          type: 'string',
          description: 'Conference name',
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
        week: {
          type: 'number',
          description: 'Week number (football only)',
        },
      },
      required: ['sport'],
    },
  },
  {
    name: 'calculate_win_probability',
    description: 'Calculate real-time win probability for a game given current state.',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'Sport type',
          enum: ['football', 'basketball', 'baseball'],
        },
        home_score: {
          type: 'number',
          description: 'Home team current score',
        },
        away_score: {
          type: 'number',
          description: 'Away team current score',
        },
        time_remaining: {
          type: 'number',
          description: 'Time remaining in seconds',
        },
        period: {
          type: 'number',
          description: 'Current period/quarter/inning',
        },
        possession: {
          type: 'string',
          description: 'Team with possession (home/away)',
          enum: ['home', 'away'],
        },
        // Football-specific
        down: {
          type: 'number',
          description: 'Current down (football only)',
        },
        distance: {
          type: 'number',
          description: 'Yards to first down (football only)',
        },
        yard_line: {
          type: 'number',
          description: 'Yard line from own end zone (football only)',
        },
      },
      required: ['sport', 'home_score', 'away_score', 'time_remaining', 'period'],
    },
  },
  {
    name: 'search_sports',
    description:
      'Natural language search across all sports data. Use for complex queries like "Who leads the SEC in rushing yards?" or "What ranked teams lost last week?"',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query',
        },
        sport: {
          type: 'string',
          description: 'Limit search to specific sport',
          enum: ['ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl'],
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_betting_odds',
    description: 'Get current betting lines and odds for games.',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'Sport to get odds for',
          enum: ['ncaaf', 'ncaab', 'nfl', 'nba', 'mlb', 'nhl'],
        },
        team: {
          type: 'string',
          description: 'Team name to filter',
        },
        date: {
          type: 'string',
          description: 'Game date in YYYY-MM-DD format',
        },
      },
      required: ['sport'],
    },
  },
];

// ============================================================================
// MCP SERVER CLASS
// ============================================================================

export class SportsMCPServer {
  private config: MCPServerConfig;
  private providerManager: any; // EnhancedProviderManager
  private winProbModels: any; // Win probability models

  constructor(providerManager: any) {
    this.providerManager = providerManager;
    this.config = {
      name: 'blazesportsintel',
      version: '2.0.0',
      description: 'BlazeSportsIntel MCP Server - Real-time sports data and analytics',
      tools: BSI_TOOLS,
    };
  }

  /**
   * Get server configuration
   */
  getConfig(): MCPServerConfig {
    return this.config;
  }

  /**
   * Get available tools
   */
  getTools(): MCPTool[] {
    return this.config.tools;
  }

  /**
   * Execute a tool call
   */
  async executeTool(call: MCPToolCall): Promise<MCPToolResult> {
    try {
      switch (call.name) {
        case 'get_live_scores':
          return this.getLiveScores(call.arguments);

        case 'get_team_info':
          return this.getTeamInfo(call.arguments);

        case 'get_game_summary':
          return this.getGameSummary(call.arguments);

        case 'get_standings':
          return this.getStandings(call.arguments);

        case 'get_rankings':
          return this.getRankings(call.arguments);

        case 'get_player_stats':
          return this.getPlayerStats(call.arguments);

        case 'get_schedule':
          return this.getSchedule(call.arguments);

        case 'calculate_win_probability':
          return this.calculateWinProbability(call.arguments);

        case 'search_sports':
          return this.searchSports(call.arguments);

        case 'get_betting_odds':
          return this.getBettingOdds(call.arguments);

        default:
          return this.errorResult(`Unknown tool: ${call.name}`);
      }
    } catch (error) {
      console.error(`[MCP] Tool execution error for ${call.name}:`, error);
      return this.errorResult(`Error executing ${call.name}: ${(error as Error).message}`);
    }
  }

  // ==========================================================================
  // TOOL IMPLEMENTATIONS
  // ==========================================================================

  private async getLiveScores(args: Record<string, any>): Promise<MCPToolResult> {
    const { sport = 'all', conference, team } = args;

    try {
      let games: any[];

      if (sport === 'all') {
        games = await this.providerManager.getLiveGames();
      } else {
        games = await this.providerManager.getGames(sport, { conference });
        games = games.filter((g: any) => g.status === 'LIVE');
      }

      // Filter by team if specified
      if (team) {
        const teamLower = team.toLowerCase();
        games = games.filter(
          (g: any) =>
            g.homeTeamName.toLowerCase().includes(teamLower) ||
            g.awayTeamName.toLowerCase().includes(teamLower) ||
            g.homeTeamAbbrev?.toLowerCase() === teamLower ||
            g.awayTeamAbbrev?.toLowerCase() === teamLower
        );
      }

      if (games.length === 0) {
        return this.textResult('No live games found matching your criteria.');
      }

      const formatted = games.map((g: any) => this.formatGameScore(g)).join('\n\n');

      return this.textResult(`## Live Scores\n\n${formatted}`);
    } catch (error) {
      return this.errorResult(`Failed to fetch live scores: ${(error as Error).message}`);
    }
  }

  private async getTeamInfo(args: Record<string, any>): Promise<MCPToolResult> {
    const { sport, team, include_roster, include_stats } = args;

    // This would call the appropriate adapter
    return this.textResult(`Team info for ${team} (${sport}) - Implementation pending`);
  }

  private async getGameSummary(args: Record<string, any>): Promise<MCPToolResult> {
    const { sport, game_id, teams, date } = args;

    // This would call the appropriate adapter for game summary
    return this.textResult(
      `Game summary for ${game_id || teams} (${sport}) - Implementation pending`
    );
  }

  private async getStandings(args: Record<string, any>): Promise<MCPToolResult> {
    const { sport, conference, division } = args;

    // This would call the appropriate adapter for standings
    return this.textResult(
      `Standings for ${sport}${conference ? ` - ${conference}` : ''} - Implementation pending`
    );
  }

  private async getRankings(args: Record<string, any>): Promise<MCPToolResult> {
    const { sport, poll = 'all', week } = args;

    // This would call the appropriate adapter for rankings
    return this.textResult(`Rankings for ${sport} (${poll} poll) - Implementation pending`);
  }

  private async getPlayerStats(args: Record<string, any>): Promise<MCPToolResult> {
    const { sport, player_name, team, season, stat_type } = args;

    // This would search for player and return stats
    return this.textResult(
      `Stats for ${player_name}${team ? ` (${team})` : ''} - Implementation pending`
    );
  }

  private async getSchedule(args: Record<string, any>): Promise<MCPToolResult> {
    const { sport, team, conference, start_date, end_date, week } = args;

    // This would call the appropriate adapter for schedule
    return this.textResult(
      `Schedule for ${sport}${team ? ` - ${team}` : ''} - Implementation pending`
    );
  }

  private async calculateWinProbability(args: Record<string, any>): Promise<MCPToolResult> {
    const {
      sport,
      home_score,
      away_score,
      time_remaining,
      period,
      possession,
      down,
      distance,
      yard_line,
    } = args;

    // Import win probability model dynamically
    const { calculateWinProbability } = await import('../analytics/win-probability');

    let state: any;

    if (sport === 'football') {
      state = {
        homeScore: home_score,
        awayScore: away_score,
        quarter: period,
        timeRemaining: time_remaining,
        possession: possession || 'home',
        down: down || 1,
        distance: distance || 10,
        yardLine: yard_line || 75,
        homeTimeouts: 3,
        awayTimeouts: 3,
      };
    } else if (sport === 'basketball') {
      state = {
        homeScore: home_score,
        awayScore: away_score,
        period: period,
        timeRemaining: time_remaining,
        possession: possession || 'home',
        homeFouls: 0,
        awayFouls: 0,
      };
    } else if (sport === 'baseball') {
      state = {
        homeScore: home_score,
        awayScore: away_score,
        inning: period,
        inningHalf: possession === 'home' ? 'bottom' : 'top',
        outs: 0,
        runnersOn: [false, false, false],
      };
    } else {
      return this.errorResult(`Unsupported sport for win probability: ${sport}`);
    }

    const result = calculateWinProbability(sport, state);

    return this.textResult(`## Win Probability

**Home Team**: ${(result.homeWinProbability * 100).toFixed(1)}%
**Away Team**: ${(result.awayWinProbability * 100).toFixed(1)}%

**Confidence**: ${(result.confidence * 100).toFixed(0)}%

### Factors
- Score Differential: ${result.factors.scoreDifferential}
- Time Remaining: ${Math.floor(result.factors.timeRemaining / 60)}:${String(result.factors.timeRemaining % 60).padStart(2, '0')}`);
  }

  private async searchSports(args: Record<string, any>): Promise<MCPToolResult> {
    const { query, sport } = args;

    // This would implement natural language search
    // Could use embeddings or keyword extraction to route to appropriate data

    return this.textResult(
      `Search results for "${query}"${sport ? ` in ${sport}` : ''} - Implementation pending`
    );
  }

  private async getBettingOdds(args: Record<string, any>): Promise<MCPToolResult> {
    const { sport, team, date } = args;

    // This would call BALLDONTLIE or other odds provider
    return this.textResult(
      `Betting odds for ${sport}${team ? ` - ${team}` : ''} - Implementation pending`
    );
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private formatGameScore(game: any): string {
    const homeRank = game.homeRanking ? `#${game.homeRanking} ` : '';
    const awayRank = game.awayRanking ? `#${game.awayRanking} ` : '';

    const score = game.status === 'SCHEDULED' ? 'vs' : `${game.awayScore} - ${game.homeScore}`;

    let statusLine = '';
    if (game.status === 'LIVE') {
      statusLine = game.sportData?.quarter
        ? `Q${game.sportData.quarter} ${game.sportData.timeRemaining || ''}`
        : game.sportData?.period
          ? `${game.sportData.period}H ${game.sportData.timeRemaining || ''}`
          : 'LIVE';
    } else if (game.status === 'FINAL') {
      statusLine = 'FINAL';
    } else {
      statusLine = new Date(game.scheduledAt).toLocaleString();
    }

    return `**${awayRank}${game.awayTeamName}** ${score} **${homeRank}${game.homeTeamName}**
${statusLine}${game.broadcast ? ` | ${game.broadcast}` : ''}${game.venue ? ` | ${game.venue}` : ''}`;
  }

  private textResult(text: string): MCPToolResult {
    return {
      content: [{ type: 'text', text }],
    };
  }

  private errorResult(error: string): MCPToolResult {
    return {
      content: [{ type: 'text', text: `Error: ${error}` }],
      isError: true,
    };
  }
}

// ============================================================================
// MCP SERVER HANDLER
// ============================================================================

/**
 * Handle MCP protocol messages
 */
export async function handleMCPRequest(
  request: Request,
  server: SportsMCPServer
): Promise<Response> {
  const url = new URL(request.url);

  // List tools
  if (url.pathname === '/tools' && request.method === 'GET') {
    return new Response(JSON.stringify(server.getTools()), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Execute tool
  if (url.pathname === '/execute' && request.method === 'POST') {
    try {
      const call = (await request.json()) as MCPToolCall;
      const result = await server.executeTool(call);

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
          isError: true,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Server info
  if (url.pathname === '/info' || url.pathname === '/') {
    return new Response(JSON.stringify(server.getConfig()), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not Found', { status: 404 });
}
