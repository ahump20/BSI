/**
 * MLB Game Detail API Route
 *
 * Proxies to the unified game API with sport=mlb parameter.
 *
 * GET /api/mlb/game/:gameId
 */

import { ESPNUnifiedAdapter } from '@/lib/adapters/espn-unified-adapter';

interface Env {
  BSI_CACHE?: KVNamespace;
}

interface GameApiResponse {
  success: boolean;
  game: {
    id: string;
    date: string;
    status: {
      state: string;
      detailedState: string;
      inning?: number;
      inningState?: string;
      isLive: boolean;
      isFinal: boolean;
    };
    teams: {
      away: {
        name: string;
        abbreviation: string;
        score: number;
        isWinner: boolean;
        record?: string;
        logo?: string;
      };
      home: {
        name: string;
        abbreviation: string;
        score: number;
        isWinner: boolean;
        record?: string;
        logo?: string;
      };
    };
    venue?: {
      name: string;
      city?: string;
      state?: string;
    };
    linescore?: {
      innings: Array<{ away: number | null; home: number | null }>;
      totals: {
        away: { runs: number; hits: number; errors: number };
        home: { runs: number; hits: number; errors: number };
      };
    };
    boxscore?: {
      away: {
        batting: Array<{
          player: { id: string; name: string; position: string };
          ab: number;
          r: number;
          h: number;
          rbi: number;
          bb: number;
          so: number;
          avg: string;
        }>;
        pitching: Array<{
          player: { id: string; name: string };
          decision?: string;
          ip: string;
          h: number;
          r: number;
          er: number;
          bb: number;
          so: number;
          era: string;
        }>;
      };
      home: {
        batting: Array<{
          player: { id: string; name: string; position: string };
          ab: number;
          r: number;
          h: number;
          rbi: number;
          bb: number;
          so: number;
          avg: string;
        }>;
        pitching: Array<{
          player: { id: string; name: string };
          decision?: string;
          ip: string;
          h: number;
          r: number;
          er: number;
          bb: number;
          so: number;
          era: string;
        }>;
      };
    };
    plays?: Array<{
      id: string;
      inning: number;
      halfInning: 'top' | 'bottom';
      description: string;
      result: string;
      isScoring: boolean;
    }>;
  };
  meta: {
    source: string;
    timestamp: string;
    timezone: string;
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { gameId } = context.params;

  if (!gameId || typeof gameId !== 'string') {
    return new Response(JSON.stringify({ error: 'Game ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const adapter = new ESPNUnifiedAdapter(context.env.BSI_CACHE);
    const summary = await adapter.getGameSummary('mlb', gameId);

    // Transform ESPN format to our frontend format
    const game = summary.game;
    const boxscore = summary.boxscore;

    // Map status
    const statusState = game.status.toLowerCase();
    const isLive = statusState === 'live';
    const isFinal = statusState === 'final';

    const response: GameApiResponse = {
      success: true,
      game: {
        id: game.id,
        date: game.scheduledAt,
        status: {
          state: game.status,
          detailedState:
            game.sportData?.sport === 'baseball' && game.sportData.inning
              ? `${game.sportData.inningHalf === 'TOP' ? 'Top' : 'Bot'} ${game.sportData.inning}`
              : game.status,
          inning: game.sportData?.sport === 'baseball' ? game.sportData.inning : undefined,
          inningState:
            game.sportData?.sport === 'baseball'
              ? game.sportData.inningHalf?.toLowerCase()
              : undefined,
          isLive,
          isFinal,
        },
        teams: {
          away: {
            name: game.awayTeamName,
            abbreviation: game.awayTeamAbbrev,
            score: game.awayScore ?? 0,
            isWinner: isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0),
            logo: game.awayTeamLogo,
          },
          home: {
            name: game.homeTeamName,
            abbreviation: game.homeTeamAbbrev,
            score: game.homeScore ?? 0,
            isWinner: isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0),
            logo: game.homeTeamLogo,
          },
        },
        venue: game.venue ? { name: game.venue, city: game.venueCity } : undefined,
        boxscore: boxscore ? transformBoxscore(boxscore) : undefined,
        plays: summary.plays ? transformPlays(summary.plays) : undefined,
      },
      meta: {
        source: 'ESPN',
        timestamp: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': isLive ? 'public, max-age=15' : 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error(`[MLB Game API] Error fetching game ${gameId}:`, error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch game data',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

function transformBoxscore(boxscore: any): GameApiResponse['game']['boxscore'] {
  // ESPN boxscore format varies - extract batting/pitching lines
  const extractTeamStats = (teamData: any) => {
    const batting: GameApiResponse['game']['boxscore']['away']['batting'] = [];
    const pitching: GameApiResponse['game']['boxscore']['away']['pitching'] = [];

    // Extract batting stats
    if (teamData?.statistics) {
      const battingStats = teamData.statistics.find((s: any) => s.name === 'batting');
      if (battingStats?.athletes) {
        for (const athlete of battingStats.athletes) {
          const stats = athlete.stats || [];
          batting.push({
            player: {
              id: athlete.athlete?.id || '',
              name: athlete.athlete?.displayName || athlete.athlete?.shortName || 'Unknown',
              position: athlete.athlete?.position?.abbreviation || '',
            },
            ab: parseInt(stats[0] || '0', 10),
            r: parseInt(stats[1] || '0', 10),
            h: parseInt(stats[2] || '0', 10),
            rbi: parseInt(stats[3] || '0', 10),
            bb: parseInt(stats[4] || '0', 10),
            so: parseInt(stats[5] || '0', 10),
            avg: stats[6] || '.000',
          });
        }
      }

      // Extract pitching stats
      const pitchingStats = teamData.statistics.find((s: any) => s.name === 'pitching');
      if (pitchingStats?.athletes) {
        for (const athlete of pitchingStats.athletes) {
          const stats = athlete.stats || [];
          pitching.push({
            player: {
              id: athlete.athlete?.id || '',
              name: athlete.athlete?.displayName || athlete.athlete?.shortName || 'Unknown',
            },
            decision: athlete.starter ? undefined : (stats[7] as any),
            ip: stats[0] || '0.0',
            h: parseInt(stats[1] || '0', 10),
            r: parseInt(stats[2] || '0', 10),
            er: parseInt(stats[3] || '0', 10),
            bb: parseInt(stats[4] || '0', 10),
            so: parseInt(stats[5] || '0', 10),
            era: stats[6] || '0.00',
          });
        }
      }
    }

    return { batting, pitching };
  };

  const teams = boxscore?.teams || [];
  const awayTeam = teams.find((t: any) => t.homeAway === 'away') || teams[0];
  const homeTeam = teams.find((t: any) => t.homeAway === 'home') || teams[1];

  return {
    away: extractTeamStats(awayTeam),
    home: extractTeamStats(homeTeam),
  };
}

function transformPlays(plays: any[]): GameApiResponse['game']['plays'] {
  return plays.slice(0, 50).map((play) => ({
    id: play.id || String(Math.random()),
    inning: play.period?.number || 1,
    halfInning: play.type?.text?.toLowerCase().includes('bottom') ? 'bottom' : 'top',
    description: play.text || play.shortText || '',
    result: play.type?.text || '',
    isScoring: play.scoringPlay || false,
  }));
}
