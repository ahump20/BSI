import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { SportsClient } from './sports-client.js';

const SPORT_ENUM = ['nfl', 'nba', 'mlb', 'ncaaf', 'ncaab', 'wcbb', 'cbb', 'nhl'] as const;
const COLLEGE_SPORT_ENUM = ['ncaaf', 'ncaab', 'wcbb'] as const;
const POLL_ENUM = ['ap', 'coaches', 'cfp'] as const;

export function createSportsServer(rapidApiKey?: string): ReturnType<typeof createSdkMcpServer> {
  const client = new SportsClient(rapidApiKey);

  return createSdkMcpServer({
    name: 'bsi-sports',
    version: '1.0.0',
    tools: [
      tool(
        'get_live_scores',
        'Get live scores and game results for a sport. Returns current/recent games with scores, status, and team info.',
        {
          sport: z.enum(SPORT_ENUM).describe('Sport to get scores for'),
          date: z.string().optional().describe('Date in YYYY-MM-DD or YYYYMMDD format. Defaults to today.'),
        },
        async (args) => {
          const games = await client.getScores(args.sport, args.date);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(games, null, 2),
              },
            ],
          };
        }
      ),

      tool(
        'get_rankings',
        'Get college sports rankings (AP Top 25, Coaches Poll, CFP). Only available for college football, mens basketball, and womens basketball.',
        {
          sport: z.enum(COLLEGE_SPORT_ENUM).describe('College sport to get rankings for'),
          poll: z.enum(POLL_ENUM).optional().describe('Specific poll to return. If omitted, returns all available polls.'),
        },
        async (args) => {
          const polls = await client.getRankings(args.sport);
          const filtered = args.poll
            ? polls.filter((p) => p.poll.toLowerCase().includes(args.poll!))
            : polls;
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(filtered, null, 2),
              },
            ],
          };
        }
      ),

      tool(
        'get_team_info',
        'Look up a team by name. Returns team record, conference, ranking, logo, and basic info. Uses fuzzy name matching.',
        {
          sport: z.enum(SPORT_ENUM).describe('Sport the team plays'),
          team_name: z.string().describe('Team name, abbreviation, or partial name (e.g. "Texas", "TEX", "Longhorns")'),
        },
        async (args) => {
          const team = await client.getTeamInfo(args.sport, args.team_name);
          if (!team) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No team found matching "${args.team_name}" in ${args.sport.toUpperCase()}.`,
                },
              ],
            };
          }
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(team, null, 2),
              },
            ],
          };
        }
      ),

      tool(
        'search_games',
        'Search for games by team and/or date range. Returns schedule and results for matching games.',
        {
          sport: z.enum(SPORT_ENUM).describe('Sport to search'),
          team_name: z.string().optional().describe('Team name to filter by'),
          start_date: z.string().optional().describe('Start date (YYYY-MM-DD) for date range filter'),
          end_date: z.string().optional().describe('End date (YYYY-MM-DD) for date range filter'),
        },
        async (args) => {
          const games = await client.searchGames(
            args.sport,
            args.team_name,
            args.start_date,
            args.end_date
          );
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(games, null, 2),
              },
            ],
          };
        }
      ),
    ],
  });
}
