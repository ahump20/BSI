import { NextRequest, NextResponse } from 'next/server';
import baseballData from '../../../../mcp/texas-longhorns/feeds/baseball.json';
import footballData from '../../../../mcp/texas-longhorns/feeds/football.json';
import basketballData from '../../../../mcp/texas-longhorns/feeds/basketball.json';
import trackFieldData from '../../../../mcp/texas-longhorns/feeds/track-field.json';

/**
 * Texas Longhorns MCP Data API with Cloudflare KV Caching
 * Serves MCP data with edge caching for optimal performance
 */

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

declare global {
  const LONGHORNS_CACHE: KVNamespace | undefined;
}

const CACHE_TTL = 3600; // 1 hour for static MCP data

type Sport = 'baseball' | 'football' | 'basketball' | 'track-field';

const sportData = {
  baseball: baseballData,
  football: footballData,
  basketball: basketballData,
  'track-field': trackFieldData,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport') as Sport | null;
  const includeAll = searchParams.get('all') === 'true';

  try {
    // Generate cache key
    const cacheKey = `longhorns:mcp:${sport || 'all'}`;

    // Try Cloudflare KV cache first (production only)
    if (typeof LONGHORNS_CACHE !== 'undefined') {
      const cached = await LONGHORNS_CACHE.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          data: JSON.parse(cached),
          cached: true,
          timestamp: new Date().toISOString(),
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            'CDN-Cache-Control': 'public, s-maxage=3600',
          },
        });
      }
    }

    // Prepare response data
    let responseData;
    if (includeAll || !sport) {
      responseData = {
        baseball: baseballData,
        football: footballData,
        basketball: basketballData,
        trackField: trackFieldData,
      };
    } else if (sport in sportData) {
      responseData = sportData[sport];
    } else {
      return NextResponse.json(
        { error: 'Invalid sport parameter' },
        { status: 400 }
      );
    }

    // Cache in KV (production only)
    if (typeof LONGHORNS_CACHE !== 'undefined') {
      await LONGHORNS_CACHE.put(
        cacheKey,
        JSON.stringify(responseData),
        { expirationTtl: CACHE_TTL }
      );
    }

    return NextResponse.json({
      data: responseData,
      cached: false,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Longhorns MCP API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Longhorns data' },
      { status: 500 }
    );
  }
}

// Enable for specific sports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sport, query } = body;

    if (!sport || !query) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Search functionality for MCP data
    const data = sportData[sport as Sport];
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid sport' },
        { status: 400 }
      );
    }

    // Simple search implementation
    const results = searchMCPData(data, query);

    return NextResponse.json({
      results,
      sport,
      query,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Longhorns MCP search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

function searchMCPData(data: any, query: string): any[] {
  const results: any[] = [];
  const queryLower = query.toLowerCase();

  // Search in legendary players
  if (data.legendaryPlayers) {
    const players = data.legendaryPlayers.filter((p: any) =>
      p.name?.toLowerCase().includes(queryLower) ||
      p.accolades?.some((a: string) => a.toLowerCase().includes(queryLower))
    );
    results.push(...players.map((p: any) => ({ type: 'player', data: p })));
  }

  // Search in seasons
  if (data.seasons) {
    const seasons = data.seasons.filter((s: any) =>
      s.achievements?.some((a: string) => a.toLowerCase().includes(queryLower)) ||
      s.postseason?.toLowerCase().includes(queryLower)
    );
    results.push(...seasons.map((s: any) => ({ type: 'season', data: s })));
  }

  return results;
}

export const runtime = 'edge';
