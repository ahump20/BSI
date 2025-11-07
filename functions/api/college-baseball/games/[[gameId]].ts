/**
 * College Baseball Games API Endpoint
 *
 * GET /api/college-baseball/games/:gameId
 *   - Fetches complete game data including box score
 *   - Generates auto-generated game recap (ESPN KILLER FEATURE)
 *   - Provides play-by-play data
 *
 * Query Parameters:
 *   - include: comma-separated list ('boxscore', 'recap', 'playbyplay', 'preview')
 *   - format: 'full' | 'compact' (default: 'full')
 *
 * ESPN GAP: ESPN app shows only score and inning for college baseball.
 * We provide COMPLETE box scores, player stats, and auto-generated recaps.
 *
 * Examples:
 *   /api/college-baseball/games/401778104
 *   /api/college-baseball/games/401778104?include=boxscore,recap
 *   /api/college-baseball/games/401778104?format=compact
 */

import { NCAABaseballAdapter, NCAAGameRecap, extractBattingStats, extractPitchingStats, getGameState } from '../../../../lib/adapters/ncaa-baseball-adapter';

interface Env {
  CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  AI?: any; // Cloudflare Workers AI binding
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Extract game ID from URL params
    const gameIdParam = params.gameId as string | string[];
    const gameId = Array.isArray(gameIdParam) ? gameIdParam[0] : gameIdParam;

    if (!gameId || gameId === 'undefined') {
      return new Response(
        JSON.stringify({
          error: 'Game ID is required',
          message: 'Please provide a valid ESPN game ID',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const includeParam = url.searchParams.get('include') || 'boxscore,recap';
    const include = new Set(includeParam.split(',').map(s => s.trim()));
    const format = url.searchParams.get('format') || 'full';

    // Initialize adapter
    const adapter = new NCAABaseballAdapter(env.CACHE);

    // Build response object
    const response: Record<string, any> = {
      gameId,
      meta: {
        dataSource: 'ESPN College Baseball API + Blaze Intelligence',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    // Fetch game summary (always includes basic game info)
    const { game, boxscore } = await adapter.fetchGameSummary(gameId);

    // Add game info
    response.game = {
      id: game.id,
      date: game.date,
      name: game.name,
      shortName: game.shortName,
      season: game.season,
      status: game.status,
      venue: game.venue,
      attendance: game.attendance,
      broadcast: game.broadcast,
      notes: game.notes,
      highlights: game.highlights,
    };

    /**
     * Add competition data with defensive programming
     * Handle both data structures:
     * 1. Adapter may return competition directly in game (data.header.competitions[0])
     * 2. Or competition may be nested under game.competitions[0]
     */
    const competition = game.competitions?.[0] || game;

    if (competition.competitors || game.competitors) {
      response.competition = {
        id: competition.id || game.id,
        competitors: competition.competitors || game.competitors || [],
        series: competition.series || game.series,
        situation: competition.situation || game.situation,
      };
    }

    // Add box score if requested
    if (include.has('boxscore')) {
      response.boxscore = boxscore;
    }

    // Generate auto-generated recap if requested (ESPN KILLER FEATURE)
    if (include.has('recap')) {
      response.recap = await generateGameRecap(game, boxscore, env);
    }

    // Add play-by-play if requested
    if (include.has('playbyplay')) {
      const playByPlay = await adapter.fetchPlayByPlay(gameId);
      response.playByPlay = playByPlay;
    }

    // Add game preview if requested (pre-game only)
    if (include.has('preview') && getGameState(game.status) === 'scheduled') {
      response.preview = await generateGamePreview(game, env);
    }

    // Compact format (remove nested objects)
    if (format === 'compact') {
      delete response.boxscore;
      delete response.playByPlay;
    }

    // Track analytics
    if (env.ANALYTICS) {
      try {
        env.ANALYTICS.writeDataPoint({
          blobs: ['college_baseball_game', `game_${gameId}`, includeParam],
          doubles: [1],
          indexes: [`${game.season.year}`],
        });
      } catch (error) {
        console.warn('Analytics write failed:', error);
      }
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': getGameState(game.status) === 'final'
          ? 'public, max-age=3600, s-maxage=86400' // 1hr client, 24hr CDN for completed
          : 'public, max-age=30, s-maxage=300', // 30s client, 5min CDN for live
      },
    });
  } catch (error) {
    console.error('College baseball game error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch game data',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

// ============================================================================
// AUTO-GENERATED GAME RECAP (ESPN KILLER FEATURE)
// ============================================================================

/**
 * Generate comprehensive game recap with narrative and statistics
 * ESPN app shows ONLY score and inning - we provide the full story
 *
 * @param game - Game data (may contain competition directly or nested)
 * @param boxscore - Box score data with player statistics
 * @param env - Environment bindings
 * @returns Structured game recap with headline, summary, and key plays
 */
async function generateGameRecap(
  game: any,
  boxscore: any,
  env: Env
): Promise<NCAAGameRecap> {
  // Defensive: Handle both data structures (nested or direct)
  const competition = game.competitions?.[0] || game;

  if (!competition || !competition.competitors) {
    throw new Error('No competition data available');
  }

  const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
  const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');

  if (!homeTeam || !awayTeam) {
    throw new Error('Missing team data');
  }

  const winner = competition.competitors.find((c: any) => c.winner);
  const loser = competition.competitors.find((c: any) => !c.winner);

  // Extract statistics
  const homeStats = extractBattingStats(boxscore, homeTeam.team.id);
  const awayStats = extractBattingStats(boxscore, awayTeam.team.id);
  const homePitching = extractPitchingStats(boxscore, homeTeam.team.id);
  const awayPitching = extractPitchingStats(boxscore, awayTeam.team.id);

  // Generate headline
  const headline = generateHeadline(winner, loser, game);

  // Generate summary paragraph
  const summary = generateSummary(
    winner,
    loser,
    homeStats,
    awayStats,
    homePitching,
    awayPitching,
    game
  );

  // Identify key plays from line scores
  const keyPlays = identifyKeyPlays(competition);

  // Identify player performances
  const playerPerformances = identifyPlayerPerformances(boxscore, homeTeam, awayTeam);

  // Identify turning point
  const turningPoint = identifyTurningPoint(keyPlays, competition);

  return {
    gameId: game.id,
    headline,
    summary,
    keyPlays,
    playerPerformances,
    turningPoint,
    generated: {
      timestamp: new Date().toISOString(),
      model: 'Blaze Intelligence Recap Generator v1.0',
      confidence: 0.95,
    },
  };
}

function generateHeadline(winner: any, loser: any, game: any): string {
  const winnerName = winner.team.displayName;
  const loserName = loser.team.displayName;
  const score = `${winner.score}-${loser.score}`;

  // Check for special contexts
  if (game.notes && game.notes.length > 0) {
    const note = game.notes[0].headline;
    if (note.includes('Championship')) {
      return `${winnerName} Wins ${note} with ${score} Victory Over ${loserName}`;
    }
  }

  // Check for series context
  if (game.competitions?.[0]?.series) {
    const series = game.competitions[0].series;
    if (series.completed) {
      return `${winnerName} ${series.summary} with ${score} Win Over ${loserName}`;
    }
  }

  // Check for ranked matchup
  if (winner.rank && loser.rank) {
    return `#${winner.rank.current} ${winnerName} Defeats #${loser.rank.current} ${loserName}, ${score}`;
  } else if (winner.rank) {
    return `#${winner.rank.current} ${winnerName} Beats ${loserName}, ${score}`;
  }

  // Default headline
  return `${winnerName} Defeats ${loserName}, ${score}`;
}

function generateSummary(
  winner: any,
  loser: any,
  homeStats: Record<string, string>,
  awayStats: Record<string, string>,
  homePitching: Record<string, string>,
  awayPitching: Record<string, string>,
  game: any
): string {
  const winnerName = winner.team.displayName;
  const loserName = loser.team.displayName;
  const winnerIsHome = winner.homeAway === 'home';

  const winnerStats = winnerIsHome ? homeStats : awayStats;
  const loserStats = winnerIsHome ? awayStats : homeStats;

  const winnerHits = winnerStats.H || '0';
  const loserHits = loserStats.H || '0';
  const winnerErrors = winner.errors || 0;
  const loserErrors = loser.errors || 0;

  // Build narrative
  let narrative = `${winnerName} defeated ${loserName} ${winner.score}-${loser.score}`;

  // Add venue
  if (game.venue) {
    narrative += ` at ${game.venue.fullName}`;
  }

  // Add date
  const gameDate = new Date(game.date);
  narrative += ` on ${gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })}`;

  narrative += '.';

  // Add hitting context
  narrative += ` ${winnerName} out-hit ${loserName} ${winnerHits}-${loserHits}`;

  // Add fielding context
  if (loserErrors > winnerErrors) {
    narrative += `, with ${loserName} committing ${loserErrors} error${loserErrors !== 1 ? 's' : ''} compared to ${winnerName}'s ${winnerErrors}`;
  } else if (winnerErrors === 0 && loserErrors === 0) {
    narrative += ' in a clean defensive game with no errors on either side';
  }

  narrative += '.';

  // Add leader context
  if (winner.leaders && winner.leaders.length > 0) {
    const hittingLeader = winner.leaders.find((l: any) => l.name === 'hittingLeader');
    if (hittingLeader && hittingLeader.leaders && hittingLeader.leaders[0]) {
      const leader = hittingLeader.leaders[0];
      narrative += ` ${leader.athlete.displayName} led ${winnerName} with ${leader.displayValue} hits.`;
    }
  }

  return narrative;
}

function identifyKeyPlays(competition: any): Array<{
  inning: number;
  description: string;
  impact: 'high' | 'medium' | 'low';
}> {
  const keyPlays: Array<{
    inning: number;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }> = [];

  // Analyze line scores to identify scoring innings
  competition.competitors.forEach((team: any) => {
    if (!team.linescores) return;

    team.linescores.forEach((inning: any, idx: number) => {
      const runs = parseInt(inning.displayValue, 10);

      if (runs >= 3) {
        keyPlays.push({
          inning: idx + 1,
          description: `${team.team.displayName} scores ${runs} runs in the ${ordinal(idx + 1)} inning`,
          impact: 'high',
        });
      } else if (runs > 0) {
        keyPlays.push({
          inning: idx + 1,
          description: `${team.team.displayName} scores ${runs} run${runs !== 1 ? 's' : ''} in the ${ordinal(idx + 1)}`,
          impact: runs === 2 ? 'medium' : 'low',
        });
      }
    });
  });

  // Sort by impact and inning
  keyPlays.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    if (impactOrder[a.impact] !== impactOrder[b.impact]) {
      return impactOrder[a.impact] - impactOrder[b.impact];
    }
    return a.inning - b.inning;
  });

  return keyPlays.slice(0, 5); // Top 5 key plays
}

function identifyPlayerPerformances(
  boxscore: any,
  homeTeam: any,
  awayTeam: any
): Array<{
  player: any;
  team: any;
  performance: string;
  stats: string;
}> {
  const performances: Array<{
    player: any;
    team: any;
    performance: string;
    stats: string;
  }> = [];

  // Helper to process team players
  const processTeamPlayers = (teamData: any, team: any) => {
    if (!teamData) return;

    const battingStats = teamData.statistics?.find((s: any) => s.name === 'batting');
    if (battingStats && battingStats.athletes) {
      // Top 3 hitters
      battingStats.athletes.slice(0, 3).forEach((athleteData: any, idx: number) => {
        const stats = athleteData.stats;
        const keys = battingStats.keys;

        // Find hits and RBIs
        const hitsIdx = keys.indexOf('H');
        const rbiIdx = keys.indexOf('RBI');
        const hits = hitsIdx >= 0 ? parseInt(stats[hitsIdx], 10) : 0;
        const rbis = rbiIdx >= 0 ? parseInt(stats[rbiIdx], 10) : 0;

        if (hits >= 2 || rbis >= 2) {
          performances.push({
            player: athleteData.athlete,
            team: team.team,
            performance: idx === 0 ? 'led' : 'contributed',
            stats: `${hits} hit${hits !== 1 ? 's' : ''}, ${rbis} RBI${rbis !== 1 ? 's' : ''}`,
          });
        }
      });
    }
  };

  // Process both teams
  const homeBoxscore = boxscore.players?.find((p: any) => p.team.id === homeTeam.team.id);
  const awayBoxscore = boxscore.players?.find((p: any) => p.team.id === awayTeam.team.id);

  processTeamPlayers(homeBoxscore, homeTeam);
  processTeamPlayers(awayBoxscore, awayTeam);

  return performances.slice(0, 5); // Top 5 performers
}

function identifyTurningPoint(
  keyPlays: Array<{ inning: number; description: string; impact: string }>,
  competition: any
): { inning: number; description: string } | undefined {
  // Find the highest impact play
  const turningPlay = keyPlays.find(p => p.impact === 'high');
  if (!turningPlay) return undefined;

  return {
    inning: turningPlay.inning,
    description: turningPlay.description,
  };
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ============================================================================
// AUTO-GENERATED GAME PREVIEW
// ============================================================================

/**
 * Generate game preview for scheduled games
 *
 * @param game - Game data (may contain competition directly or nested)
 * @param env - Environment bindings
 * @returns Structured game preview with matchup analysis
 */
async function generateGamePreview(game: any, env: Env): Promise<any> {
  // Defensive: Handle both data structures (nested or direct)
  const competition = game.competitions?.[0] || game;

  if (!competition || !competition.competitors) {
    throw new Error('No competition data available');
  }

  const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
  const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');

  const headline = `Preview: ${awayTeam.team.displayName} at ${homeTeam.team.displayName}`;

  const matchup = `${awayTeam.team.displayName} (${awayTeam.record.summary}) travels to face ${homeTeam.team.displayName} (${homeTeam.record.summary}) on ${new Date(game.date).toLocaleDateString()}.`;

  return {
    gameId: game.id,
    headline,
    matchup,
    teamAnalysis: [
      {
        team: awayTeam.team,
        record: awayTeam.record,
        rank: awayTeam.rank,
      },
      {
        team: homeTeam.team,
        record: homeTeam.record,
        rank: homeTeam.rank,
      },
    ],
    generated: {
      timestamp: new Date().toISOString(),
      model: 'Blaze Intelligence Preview Generator v1.0',
    },
  };
}
