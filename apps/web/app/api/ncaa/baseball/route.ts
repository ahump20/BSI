import { NextRequest, NextResponse } from 'next/server';
import '../../../../lib/cloudflare-types';

/**
 * NCAA Baseball Live Data API
 * Fetches real-time game data from NCAA Stats API
 * Cached via Cloudflare KV
 */

interface NCAAGame {
  gameId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  inning: string;
  status: 'scheduled' | 'live' | 'final';
}

const NCAA_STATS_API = 'https://stats.ncaa.org/rankings/change_sport_year_div';
const CACHE_TTL = 300; // 5 minutes

async function fetchNCAAGames(): Promise<NCAAGame[]> {
  try {
    // NCAA Stats API for live baseball games
    const response = await fetch(`${NCAA_STATS_API}?sport_code=MBA&division=1`, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NCAA API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform NCAA data to our format
    return transformNCAAData(data);
  } catch (error) {
    console.error('NCAA API fetch error:', error);
    return [];
  }
}

function transformNCAAData(data: any): NCAAGame[] {
  // Transform NCAA response to our game format
  // This is a placeholder - actual transformation depends on NCAA API structure
  if (!data || !Array.isArray(data.games)) {
    return [];
  }

  return data.games.map((game: any) => ({
    gameId: game.id || `game-${Date.now()}`,
    date: game.contest_date || new Date().toISOString(),
    homeTeam: game.home?.institution?.name || 'TBD',
    awayTeam: game.away?.institution?.name || 'TBD',
    homeScore: game.home?.score || 0,
    awayScore: game.away?.score || 0,
    inning: game.inning || 'Pre-game',
    status: game.status || 'scheduled',
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team') || 'all';
  const cacheKey = `ncaa:baseball:games:${team}`;

  try {
    // Try Cloudflare KV cache first (production only)
    if (typeof LONGHORNS_CACHE !== 'undefined') {
      const cached = await LONGHORNS_CACHE.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          games: JSON.parse(cached),
          cached: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Fetch fresh data
    const games = await fetchNCAAGames();

    // Filter by team if specified
    const filteredGames = team === 'all'
      ? games
      : games.filter(g =>
          g.homeTeam.toLowerCase().includes(team.toLowerCase()) ||
          g.awayTeam.toLowerCase().includes(team.toLowerCase())
        );

    // Cache in KV (production only)
    if (typeof LONGHORNS_CACHE !== 'undefined') {
      await LONGHORNS_CACHE.put(
        cacheKey,
        JSON.stringify(filteredGames),
        { expirationTtl: CACHE_TTL }
      );
    }

    return NextResponse.json({
      games: filteredGames,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('NCAA API route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NCAA data' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
