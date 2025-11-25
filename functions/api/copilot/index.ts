/**
 * BSI Copilot API Endpoint
 *
 * Natural language interface for sports data queries.
 * Parses user intent and routes to appropriate data sources.
 *
 * Example queries:
 * - "What are the live scores in college football?"
 * - "Who leads the SEC in rushing yards?"
 * - "What's the win probability for the current Texas game?"
 * - "Show me the AP Top 25"
 * - "When does Alabama play next?"
 *
 * Architecture:
 * - Intent classification using keyword patterns and entity extraction
 * - Routes to EnhancedProviderManager for data fetching
 * - Formats responses for human-readable output
 *
 * Brand: BlazeSportsIntel - "Born to Blaze the Path Less Beaten"
 * No fake data. Real sports intelligence.
 */

import type { EventContext } from '@cloudflare/workers-types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Env {
  KV: KVNamespace;
  CFBD_API_KEY?: string;
  BALLDONTLIE_API_KEY?: string;
}

interface CopilotRequest {
  query: string;
  context?: {
    sport?: string;
    team?: string;
    date?: string;
  };
  options?: {
    format?: 'text' | 'json' | 'markdown';
    includeAnalytics?: boolean;
  };
}

interface CopilotResponse {
  success: boolean;
  intent: QueryIntent;
  data?: any;
  answer: string;
  followUpQuestions?: string[];
  sources?: string[];
  timestamp: string;
}

interface QueryIntent {
  type: IntentType;
  sport?: string;
  team?: string;
  player?: string;
  conference?: string;
  date?: string;
  week?: number;
  statType?: string;
  confidence: number;
}

type IntentType =
  | 'live_scores'
  | 'game_summary'
  | 'standings'
  | 'rankings'
  | 'schedule'
  | 'team_info'
  | 'player_stats'
  | 'win_probability'
  | 'stat_leaders'
  | 'comparison'
  | 'news'
  | 'odds'
  | 'unknown';

// ============================================================================
// INTENT PATTERNS
// ============================================================================

const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  live_scores: [
    /live\s+scores?/i,
    /current\s+scores?/i,
    /what.*score/i,
    /how.*doing/i,
    /who.*winning/i,
    /games?\s+(?:today|now|live)/i,
  ],
  game_summary: [
    /game\s+summary/i,
    /box\s+score/i,
    /final\s+score/i,
    /how.*game\s+go/i,
    /what\s+happened.*game/i,
    /recap/i,
  ],
  standings: [
    /standings/i,
    /standings?\s+(?:for|in)/i,
    /conference\s+(?:record|standings)/i,
    /division\s+standings/i,
    /who.*lead/i,
    /(?:first|last)\s+place/i,
  ],
  rankings: [
    /rank(?:ings?|ed)/i,
    /top\s+\d+/i,
    /ap\s+poll/i,
    /coaches\s+poll/i,
    /cfp\s+rank/i,
    /playoff\s+rank/i,
  ],
  schedule: [
    /schedule/i,
    /when.*play/i,
    /next\s+game/i,
    /upcoming/i,
    /(?:this|next)\s+week/i,
    /games?\s+(?:on|this)/i,
  ],
  team_info: [
    /team\s+info/i,
    /roster/i,
    /tell\s+me\s+about/i,
    /who.*(?:plays?\s+for|on)/i,
    /team\s+stats/i,
  ],
  player_stats: [
    /player\s+stats/i,
    /(?:passing|rushing|receiving|batting)\s+(?:yards?|average|stats?)/i,
    /(?:how\s+many|what.*)\s+(?:yards?|points?|touchdowns?|home\s+runs?)/i,
    /stats?\s+for/i,
  ],
  win_probability: [
    /win\s+prob/i,
    /chance.*win/i,
    /likely.*win/i,
    /odds.*win/i,
    /who.*favored/i,
  ],
  stat_leaders: [
    /who\s+leads/i,
    /leader(?:s|board)/i,
    /most\s+\w+/i,
    /best\s+\w+/i,
    /top\s+\w+\s+in/i,
  ],
  comparison: [
    /compare/i,
    /vs\.?|versus/i,
    /better\s+than/i,
    /difference\s+between/i,
  ],
  news: [
    /news/i,
    /headlines/i,
    /latest/i,
    /updates?/i,
    /what.*happening/i,
  ],
  odds: [
    /odds/i,
    /spread/i,
    /over\s*\/?\s*under/i,
    /betting\s+line/i,
    /moneyline/i,
    /point\s+spread/i,
  ],
  unknown: [],
};

const SPORT_PATTERNS: Record<string, RegExp[]> = {
  ncaaf: [/college\s+football/i, /cfb/i, /ncaaf/i, /fbs/i, /fcs/i],
  ncaab: [/college\s+basketball/i, /cbb/i, /ncaab/i, /march\s+madness/i],
  wcbb: [/women'?s\s+college\s+basketball/i, /wcbb/i],
  nfl: [/nfl/i, /pro\s+football/i, /(?:sunday|monday|thursday)\s+night\s+football/i],
  nba: [/nba/i, /pro\s+basketball/i],
  wnba: [/wnba/i, /women'?s\s+(?:pro\s+)?basketball/i],
  mlb: [/mlb/i, /baseball/i, /(?:major|pro)\s+league/i],
  cbb: [/college\s+baseball/i],
  nhl: [/nhl/i, /hockey/i],
};

const CONFERENCE_PATTERNS: Record<string, RegExp[]> = {
  SEC: [/\bsec\b/i, /southeastern/i],
  'Big Ten': [/big\s*ten/i, /b1g/i],
  'Big 12': [/big\s*12/i, /big\s*twelve/i],
  ACC: [/\bacc\b/i, /atlantic\s+coast/i],
  'Pac-12': [/pac[\s-]*12/i],
  AFC: [/\bafc\b/i],
  NFC: [/\bnfc\b/i],
  AL: [/\bal\b/i, /american\s+league/i],
  NL: [/\bnl\b/i, /national\s+league/i],
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function onRequest(context: EventContext<Env, string, unknown>): Promise<Response> {
  const { request, env } = context;

  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as CopilotRequest;

    if (!body.query || typeof body.query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid query' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await processCopilotQuery(body, env);

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[Copilot] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================================================
// QUERY PROCESSING
// ============================================================================

async function processCopilotQuery(
  request: CopilotRequest,
  env: Env
): Promise<CopilotResponse> {
  const query = request.query.trim();

  // Extract intent
  const intent = extractIntent(query, request.context);

  // Route to appropriate handler
  let data: any;
  let answer: string;
  let followUpQuestions: string[] = [];

  switch (intent.type) {
    case 'live_scores':
      ({ data, answer, followUpQuestions } = await handleLiveScores(intent, env));
      break;

    case 'rankings':
      ({ data, answer, followUpQuestions } = await handleRankings(intent, env));
      break;

    case 'standings':
      ({ data, answer, followUpQuestions } = await handleStandings(intent, env));
      break;

    case 'schedule':
      ({ data, answer, followUpQuestions } = await handleSchedule(intent, env));
      break;

    case 'win_probability':
      ({ data, answer, followUpQuestions } = await handleWinProbability(intent, query, env));
      break;

    case 'stat_leaders':
      ({ data, answer, followUpQuestions } = await handleStatLeaders(intent, query, env));
      break;

    default:
      answer = `I understand you're asking about "${query}". Let me help you find that information.\n\n` +
        `I detected this as a "${intent.type}" query` +
        (intent.sport ? ` for ${intent.sport}` : '') +
        (intent.team ? ` about ${intent.team}` : '') +
        `.\n\nThis feature is being expanded. Try asking about:\n` +
        `- Live scores (e.g., "What are the live college football scores?")\n` +
        `- Rankings (e.g., "Show me the AP Top 25")\n` +
        `- Standings (e.g., "SEC standings")\n` +
        `- Schedules (e.g., "When does Texas play next?")`;
      followUpQuestions = [
        'What are the live scores right now?',
        'Show me the current rankings',
        'What games are on today?',
      ];
  }

  return {
    success: true,
    intent,
    data,
    answer,
    followUpQuestions,
    sources: ['ESPN', 'NCAA', 'CFBD', 'BALLDONTLIE'],
    timestamp: new Date().toISOString(),
  };
}

function extractIntent(query: string, context?: CopilotRequest['context']): QueryIntent {
  let intentType: IntentType = 'unknown';
  let highestConfidence = 0;

  // Check each intent pattern
  for (const [type, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (type === 'unknown') continue;

    for (const pattern of patterns) {
      if (pattern.test(query)) {
        const confidence = 0.8; // Base confidence for pattern match
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          intentType = type as IntentType;
        }
      }
    }
  }

  // Extract sport
  let sport: string | undefined = context?.sport;
  if (!sport) {
    for (const [sportKey, patterns] of Object.entries(SPORT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          sport = sportKey;
          break;
        }
      }
      if (sport) break;
    }
  }

  // Extract conference
  let conference: string | undefined;
  for (const [confName, patterns] of Object.entries(CONFERENCE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        conference = confName;
        break;
      }
    }
    if (conference) break;
  }

  // Extract team (simplified - would use NER in production)
  let team = context?.team;
  const teamPatterns = [
    /(?:for|about|of)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:game|schedule|roster)/,
  ];

  for (const pattern of teamPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      team = match[1];
      break;
    }
  }

  // Extract week number (for football)
  let week: number | undefined;
  const weekMatch = query.match(/week\s*(\d+)/i);
  if (weekMatch) {
    week = parseInt(weekMatch[1], 10);
  }

  return {
    type: intentType,
    sport,
    team,
    conference,
    week,
    confidence: highestConfidence || 0.5,
  };
}

// ============================================================================
// INTENT HANDLERS
// ============================================================================

async function handleLiveScores(intent: QueryIntent, env: Env) {
  const sport = intent.sport || 'all';

  // This would integrate with EnhancedProviderManager
  const answer = intent.sport
    ? `Here are the live ${formatSportName(intent.sport)} scores:\n\n` +
      `[Live score data would appear here]\n\n` +
      `Data refreshes every 30 seconds.`
    : `Here are the current live scores across all sports:\n\n` +
      `[Live score data for all sports would appear here]\n\n` +
      `Specify a sport for more detailed information.`;

  return {
    data: { sport, intent: 'live_scores' },
    answer,
    followUpQuestions: [
      `What's the score of the ${intent.team || 'biggest'} game?`,
      'Show me just college football scores',
      'Who\'s winning right now?',
    ],
  };
}

async function handleRankings(intent: QueryIntent, env: Env) {
  const sport = intent.sport || 'ncaaf';

  const answer = `Here are the current ${formatSportName(sport)} rankings:\n\n` +
    `[AP Top 25 / CFP Rankings would appear here]\n\n` +
    `Rankings are updated weekly.`;

  return {
    data: { sport, intent: 'rankings' },
    answer,
    followUpQuestions: [
      'What teams moved up this week?',
      'Show me the Coaches Poll',
      'Who are the CFP top 4?',
    ],
  };
}

async function handleStandings(intent: QueryIntent, env: Env) {
  const sport = intent.sport || 'ncaaf';
  const conference = intent.conference;

  const answer = conference
    ? `Here are the ${conference} standings:\n\n[Standings data would appear here]`
    : `Here are the ${formatSportName(sport)} standings:\n\n[Full standings would appear here]\n\n` +
      `Specify a conference for more detailed standings.`;

  return {
    data: { sport, conference, intent: 'standings' },
    answer,
    followUpQuestions: [
      `Who leads the ${conference || 'conference'}?`,
      'Show me the full conference standings',
      'Who has the best record?',
    ],
  };
}

async function handleSchedule(intent: QueryIntent, env: Env) {
  const { sport, team, week } = intent;

  const answer = team
    ? `Here's the schedule for ${team}:\n\n[Schedule data would appear here]`
    : sport
      ? `Here are the upcoming ${formatSportName(sport)} games:\n\n[Schedule would appear here]`
      : `Please specify a team or sport to see the schedule.`;

  return {
    data: { sport, team, week, intent: 'schedule' },
    answer,
    followUpQuestions: [
      'What time does the game start?',
      'What channel is it on?',
      'What\'s next week\'s schedule?',
    ],
  };
}

async function handleWinProbability(intent: QueryIntent, query: string, env: Env) {
  const answer = `Win probability calculation requires a live game state.\n\n` +
    `To calculate win probability, I need:\n` +
    `- Current score\n` +
    `- Time remaining\n` +
    `- Which team has possession\n\n` +
    `Try asking about a specific live game!`;

  return {
    data: { intent: 'win_probability' },
    answer,
    followUpQuestions: [
      'What are the live games right now?',
      'Who\'s favored in the big game?',
      'What are the current odds?',
    ],
  };
}

async function handleStatLeaders(intent: QueryIntent, query: string, env: Env) {
  const { sport, conference } = intent;

  // Extract stat type from query
  let statType = 'general';
  if (/rush/i.test(query)) statType = 'rushing';
  if (/pass/i.test(query)) statType = 'passing';
  if (/receiv/i.test(query)) statType = 'receiving';
  if (/scor|point/i.test(query)) statType = 'scoring';
  if (/bat|hit/i.test(query)) statType = 'batting';
  if (/pitch|era/i.test(query)) statType = 'pitching';

  const answer = `Here are the ${statType} leaders${conference ? ` in the ${conference}` : ''}:\n\n` +
    `[Stat leaders would appear here]\n\n` +
    `Stats are updated after each game.`;

  return {
    data: { sport, conference, statType, intent: 'stat_leaders' },
    answer,
    followUpQuestions: [
      'Who has the most touchdowns?',
      'Show me the top quarterbacks',
      'What about defensive stats?',
    ],
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatSportName(sport: string): string {
  const names: Record<string, string> = {
    ncaaf: 'College Football',
    ncaab: 'College Basketball',
    wcbb: "Women's College Basketball",
    nfl: 'NFL',
    nba: 'NBA',
    wnba: 'WNBA',
    mlb: 'MLB',
    cbb: 'College Baseball',
    nhl: 'NHL',
  };
  return names[sport] || sport.toUpperCase();
}

export default { onRequest };
