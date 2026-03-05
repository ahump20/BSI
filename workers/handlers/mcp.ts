import type { Env } from '../shared/types';
import { MCP_SERVER_INFO, MCP_TOOLS, SECURITY_HEADERS } from '../shared/constants';
import { mcpCorsHeaders } from '../shared/cors';
import { responseToJson } from '../shared/helpers';

import {
  handleCollegeBaseballScores,
  handleCollegeBaseballStandings,
  handleCollegeBaseballRankings,
  handleCollegeBaseballTeam,
  handleCollegeBaseballGame,
  handleCollegeBaseballPlayer,
  handleCollegeBaseballSchedule,
} from './college-baseball';
import { handleMLBScores, handleMLBStandings } from './mlb';
import { handleNFLScores, handleNFLStandings } from './nfl';
import { handleNBAScores, handleNBAStandings } from './nba';

function mcpJsonRpc(id: unknown, result: unknown): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, result }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS,
        ...mcpCorsHeaders(),
      },
    }
  );
}

function mcpError(id: unknown, code: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }),
    {
      status: 200, // JSON-RPC errors still use 200
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS,
        ...mcpCorsHeaders(),
      },
    }
  );
}

export async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  // CORS preflight for MCP
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: mcpCorsHeaders() });
  }

  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> };
  try {
    body = await request.json() as typeof body;
  } catch {
    return mcpError(null, -32700, 'Parse error');
  }

  const { id, method, params } = body;

  if (method === 'initialize') {
    return mcpJsonRpc(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: MCP_SERVER_INFO,
    });
  }

  if (method === 'tools/list') {
    return mcpJsonRpc(id, { tools: MCP_TOOLS });
  }

  if (method === 'tools/call') {
    const toolName = (params as Record<string, unknown>)?.name as string;
    const args = ((params as Record<string, unknown>)?.arguments ?? {}) as Record<string, string>;

    // Build a synthetic URL for handlers that need query params
    const base = new URL(request.url);

    let result: unknown;

    try {
      switch (toolName) {
        case 'bsi_college_baseball_scores': {
          const u = new URL(`${base.origin}/api/college-baseball/scores`);
          if (args.date) u.searchParams.set('date', args.date);
          result = await responseToJson(await handleCollegeBaseballScores(u, env));
          break;
        }
        case 'bsi_college_baseball_standings': {
          const u = new URL(`${base.origin}/api/college-baseball/standings`);
          if (args.conference) u.searchParams.set('conference', args.conference);
          result = await responseToJson(await handleCollegeBaseballStandings(u, env));
          break;
        }
        case 'bsi_college_baseball_rankings':
          result = await responseToJson(await handleCollegeBaseballRankings(env));
          break;
        case 'bsi_college_baseball_team':
          result = await responseToJson(await handleCollegeBaseballTeam(args.team_id, env));
          break;
        case 'bsi_college_baseball_game':
          result = await responseToJson(await handleCollegeBaseballGame(args.game_id, env));
          break;
        case 'bsi_college_baseball_player':
          result = await responseToJson(await handleCollegeBaseballPlayer(args.player_id, env));
          break;
        case 'bsi_college_baseball_schedule': {
          const u = new URL(`${base.origin}/api/college-baseball/schedule`);
          if (args.date) u.searchParams.set('date', args.date);
          if (args.range) u.searchParams.set('range', args.range);
          result = await responseToJson(await handleCollegeBaseballSchedule(u, env));
          break;
        }
        case 'bsi_mlb_scores': {
          const u = new URL(`${base.origin}/api/mlb/scores`);
          if (args.date) u.searchParams.set('date', args.date);
          result = await responseToJson(await handleMLBScores(u, env));
          break;
        }
        case 'bsi_mlb_standings':
          result = await responseToJson(await handleMLBStandings(env));
          break;
        case 'bsi_nfl_scores': {
          const u = new URL(`${base.origin}/api/nfl/scores`);
          if (args.week) u.searchParams.set('week', args.week);
          if (args.season) u.searchParams.set('season', args.season);
          result = await responseToJson(await handleNFLScores(u, env));
          break;
        }
        case 'bsi_nfl_standings':
          result = await responseToJson(await handleNFLStandings(env));
          break;
        case 'bsi_nba_scores': {
          const u = new URL(`${base.origin}/api/nba/scores`);
          if (args.date) u.searchParams.set('date', args.date);
          result = await responseToJson(await handleNBAScores(u, env));
          break;
        }
        case 'bsi_nba_standings':
          result = await responseToJson(await handleNBAStandings(env));
          break;
        default:
          return mcpError(id, -32602, `Unknown tool: ${toolName}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tool execution failed';
      return mcpJsonRpc(id, {
        content: [{ type: 'text', text: JSON.stringify({ error: msg }) }],
        isError: true,
      });
    }

    return mcpJsonRpc(id, {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    });
  }

  return mcpError(id, -32601, `Method not found: ${method}`);
}
