/**
 * Play-by-Play API Route
 *
 * Returns normalized play-by-play data for a game.
 *
 * GET /api/game/:gameId/plays?sport=mlb|nfl|nba|cbb|cfb
 */

import { ESPNUnifiedAdapter, type SportKey } from '@/lib/adapters/espn-unified-adapter';
import type { NormalizedPlay, PlayByPlaySection } from '@/lib/types/adapters';

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
    const rawPlays = summary.plays || [];

    // Normalize plays
    const normalizedPlays = rawPlays.map((play: any, index: number) =>
      normalizePlay(play, sport, index)
    );

    // Group into sections
    const sections = groupPlaysIntoSections(normalizedPlays, sport);

    return new Response(
      JSON.stringify({
        success: true,
        plays: normalizedPlays,
        sections,
        count: normalizedPlays.length,
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
            summary.game?.status === 'LIVE' ? 'public, max-age=15' : 'public, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error(`[Plays API] Error fetching plays for ${gameId}:`, error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch play-by-play',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

function normalizePlay(play: any, sport: SportKey, index: number): NormalizedPlay {
  const isBaseball = sport === 'mlb' || sport === 'cbb';
  const isFootball = sport === 'nfl' || sport === 'ncaaf';

  // Extract period/inning/quarter
  let period: string | number = play.period?.number || play.quarter || play.inning || 1;
  if (isBaseball && play.half) {
    period = `${play.half === 'TOP' ? 'Top' : 'Bot'} ${period}`;
  }

  // Determine if scoring play
  const isScoring =
    play.scoringPlay ||
    play.scoreValue > 0 ||
    play.type?.text?.toLowerCase().includes('touchdown') ||
    play.type?.text?.toLowerCase().includes('field goal') ||
    play.type?.text?.toLowerCase().includes('home run') ||
    play.type?.text?.toLowerCase().includes('scores') ||
    play.result?.type === 'scoring';

  // Determine if key play
  const isKeyPlay =
    play.priority ||
    play.important ||
    play.turnover ||
    play.type?.text?.toLowerCase().includes('turnover') ||
    play.type?.text?.toLowerCase().includes('interception') ||
    play.type?.text?.toLowerCase().includes('fumble') ||
    play.type?.text?.toLowerCase().includes('sack') ||
    play.type?.text?.toLowerCase().includes('strikeout') ||
    play.type?.text?.toLowerCase().includes('double play');

  return {
    id: play.id?.toString() || `play-${index}`,
    period,
    timestamp: play.clock?.displayValue || play.time || '',
    description: play.text || play.shortText || play.description || '',
    team: play.team?.abbreviation || play.team?.displayName || '',
    teamLogo: play.team?.logo || play.team?.logos?.[0]?.href,
    player: play.athlete?.displayName || play.players?.[0]?.athlete?.displayName || '',
    playType: play.type?.text || play.playType || 'play',
    isScoring,
    isKeyPlay,
    scoreChange: play.scoreValue || 0,
    homeScore: play.homeScore || play.awayScore?.displayValue || 0,
    awayScore: play.awayScore || play.homeScore?.displayValue || 0,
    videoId: play.videos?.[0]?.id,
    ...(isFootball && {
      down: play.down,
      distance: play.distance,
      yardLine: play.yardLine,
      yardsGained: play.yardsGained,
    }),
    ...(isBaseball && {
      outs: play.outs,
      balls: play.balls,
      strikes: play.strikes,
      atBatResult: play.atBatResult,
    }),
  };
}

function groupPlaysIntoSections(plays: NormalizedPlay[], sport: SportKey): PlayByPlaySection[] {
  const groups = new Map<string | number, NormalizedPlay[]>();

  for (const play of plays) {
    const key = play.period;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(play);
  }

  const sections: PlayByPlaySection[] = [];
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    // Sort in reverse order (most recent first)
    const numA = typeof a === 'number' ? a : parseInt(String(a).replace(/\D/g, ''), 10) || 0;
    const numB = typeof b === 'number' ? b : parseInt(String(b).replace(/\D/g, ''), 10) || 0;
    return numB - numA;
  });

  for (const key of sortedKeys) {
    sections.push({
      label: formatPeriodLabel(key, sport),
      period: key,
      plays: groups.get(key) || [],
      isExpanded: sections.length === 0, // First section expanded
    });
  }

  return sections;
}

function formatPeriodLabel(period: string | number, sport: SportKey): string {
  if (typeof period === 'string') return period;

  const num = period;
  const isBaseball = sport === 'mlb' || sport === 'cbb';
  const isFootball = sport === 'nfl' || sport === 'ncaaf';
  const isHockey = sport === 'nhl';

  if (isBaseball) {
    return `${getOrdinal(num)} Inning`;
  }
  if (isFootball) {
    return `${getOrdinal(num)} Quarter`;
  }
  if (isHockey) {
    if (num <= 3) return `${getOrdinal(num)} Period`;
    return `OT${num - 3}`;
  }
  // Basketball
  if (num <= 4) return `${getOrdinal(num)} Quarter`;
  return `OT${num - 4}`;
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
