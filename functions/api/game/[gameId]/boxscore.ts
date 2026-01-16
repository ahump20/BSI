/**
 * Box Score API Route
 *
 * Returns detailed box score data for a game.
 *
 * GET /api/game/:gameId/boxscore?sport=mlb|nfl|nba|cbb|cfb
 */

import { ESPNUnifiedAdapter, type SportKey } from '@/lib/adapters/espn-unified-adapter';

interface Env {
  BSI_CACHE?: KVNamespace;
}

const SPORT_MAP: Record<string, SportKey> = {
  mlb: 'mlb',
  nfl: 'nfl',
  nba: 'nba',
  cbb: 'cbb',
  ncaab: 'ncaab',
  cfb: 'ncaaf',
  ncaaf: 'ncaaf',
  wnba: 'wnba',
  nhl: 'nhl',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { gameId } = context.params;
  const url = new URL(context.request.url);
  const sportParam = url.searchParams.get('sport') || 'mlb';
  const sport = SPORT_MAP[sportParam.toLowerCase()] || 'mlb';

  if (!gameId || typeof gameId !== 'string') {
    return new Response(JSON.stringify({ error: 'Game ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const adapter = new ESPNUnifiedAdapter(context.env.BSI_CACHE);
    const summary = await adapter.getGameSummary(sport, gameId);

    // Normalize box score based on sport
    const normalizedBoxScore = normalizeBoxScore(summary.boxscore, sport, summary.game);

    return new Response(
      JSON.stringify({
        success: true,
        boxscore: normalizedBoxScore,
        raw: summary.boxscore,
        status: summary.game?.status || 'UNKNOWN',
        dataStamp: {
          timestamp: new Date().toISOString(),
          source: 'ESPN',
          sport,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control':
            summary.game?.status === 'LIVE' ? 'public, max-age=30' : 'public, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error(`[BoxScore API] Error fetching boxscore for ${gameId}:`, error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch box score',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

function normalizeBoxScore(boxscore: any, sport: SportKey, game: any) {
  if (!boxscore) return null;

  const isBaseball = sport === 'mlb' || sport === 'cbb';
  const isFootball = sport === 'nfl' || sport === 'ncaaf';
  const isBasketball = sport === 'nba' || sport === 'ncaab' || sport === 'wnba' || sport === 'wcbb';

  return {
    sport,
    gameId: game?.id,
    status: game?.status || 'UNKNOWN',
    homeTeam: {
      id: game?.homeTeamId,
      name: game?.homeTeamName,
      abbreviation: game?.homeTeamAbbrev,
      score: game?.homeScore,
      logo: game?.homeTeamLogo,
    },
    awayTeam: {
      id: game?.awayTeamId,
      name: game?.awayTeamName,
      abbreviation: game?.awayTeamAbbrev,
      score: game?.awayScore,
      logo: game?.awayTeamLogo,
    },
    players: boxscore.players || [],
    teams: boxscore.teams || [],
    // Sport-specific data
    ...(isBaseball && {
      linescoreHeaders: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'R', 'H', 'E'],
      linescore: extractBaseballLinescore(boxscore),
    }),
    ...(isFootball && {
      linescoreHeaders: ['1', '2', '3', '4', 'OT', 'T'],
      linescore: extractFootballLinescore(boxscore),
    }),
    ...(isBasketball && {
      linescoreHeaders: ['1', '2', '3', '4', 'OT', 'T'],
      linescore: extractBasketballLinescore(boxscore),
    }),
  };
}

function extractBaseballLinescore(boxscore: any) {
  const teams = boxscore?.teams || [];
  return teams.map((team: any) => {
    const stats = team.statistics || [];
    return {
      teamId: team.team?.id,
      innings: team.linescores?.map((ls: any) => ls.value) || [],
      runs: stats.find((s: any) => s.name === 'runs')?.value || 0,
      hits: stats.find((s: any) => s.name === 'hits')?.value || 0,
      errors: stats.find((s: any) => s.name === 'errors')?.value || 0,
    };
  });
}

function extractFootballLinescore(boxscore: any) {
  const teams = boxscore?.teams || [];
  return teams.map((team: any) => ({
    teamId: team.team?.id,
    quarters: team.linescores?.map((ls: any) => ls.value) || [],
    total: team.score || 0,
  }));
}

function extractBasketballLinescore(boxscore: any) {
  const teams = boxscore?.teams || [];
  return teams.map((team: any) => ({
    teamId: team.team?.id,
    quarters: team.linescores?.map((ls: any) => ls.value) || [],
    total: team.score || 0,
  }));
}
