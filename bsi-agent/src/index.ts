import 'dotenv/config';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createSportsServer } from './tools.js';

const SYSTEM_PROMPT = `You are a sports data analyst for BSI (Blaze Sports Intel). Use the available tools to fetch live sports data and answer questions accurately.

Guidelines:
- All times in America/Chicago (Central Time)
- Lead with the answer — no preamble
- Cite the data source (ESPN, Highlightly, MLB Stats API) and when it was fetched
- If no data is available, explain why (off-season, no games scheduled, API unavailable)
- Format scores and rankings clearly with team names, scores, and game status
- For rankings, include rank, team name, record, and points when available

Available sports: NFL, NBA, MLB, NHL, NCAAF (college football), NCAAB (men's college basketball), WCBB (women's college basketball), CBB (college baseball)`;

const userPrompt = process.argv.slice(2).join(' ') || 'What games are on today?';

const sportsServer = createSportsServer(process.env.RAPIDAPI_KEY);

async function main(): Promise<void> {
  for await (const message of query({
    prompt: userPrompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      mcpServers: { 'bsi-sports': sportsServer },
      allowedTools: [
        'mcp__bsi-sports__get_live_scores',
        'mcp__bsi-sports__get_rankings',
        'mcp__bsi-sports__get_team_info',
        'mcp__bsi-sports__search_games',
      ],
      maxTurns: 5,
    },
  })) {
    if (message.type === 'assistant') {
      for (const block of message.message.content) {
        if (block.type === 'text') {
          process.stdout.write(block.text);
        }
      }
    }
    if (message.type === 'result' && 'subtype' in message && message.subtype === 'success') {
      process.stdout.write('\n');
    }
  }
}

main();
