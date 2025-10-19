import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import {
  buildFallbackGamesPayload,
  getD1BaseballGames,
  type BaseballGame,
  type GamesResponse,
  type SubscriptionTier
} from '@/lib/baseball/games';

const CACHE_TTL_SECONDS = 55;
const CACHE_PREFIX = 'api:v1:games:d1:';

type ApiPayload = {
  meta: {
    generatedAt: string;
    tier: SubscriptionTier;
    source: 'database' | 'cache' | 'fallback';
    fallback: boolean;
  };
  games: Array<BaseballGame & { locked: boolean }>;
};

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

function resolveTier(request: NextRequest): SubscriptionTier {
  const headerTier = request.headers.get('x-bsi-subscription');
  const queryTier = request.nextUrl.searchParams.get('tier');
  const declaredTier = headerTier ?? queryTier ?? '';
  return declaredTier.toLowerCase() === 'diamond_pro' ? 'diamond_pro' : 'free';
}

function applyEntitlements(games: BaseballGame[], tier: SubscriptionTier) {
  return games.map((game) => {
    const locked = tier === 'free' && game.subscriptionTier === 'diamond_pro';
    if (!locked) {
      return { ...game, locked: false };
    }

    return {
      ...game,
      locked: true,
      plays: [],
      leverageIndex: null,
      home: {
        ...game.home,
        tendencies: []
      },
      away: {
        ...game.away,
        tendencies: []
      }
    };
  });
}

async function getPayloadFromCache(cacheKey: string): Promise<ApiPayload | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const cached = await client.get<ApiPayload>(cacheKey);
    if (!cached) {
      return null;
    }

    return {
      ...cached,
      meta: { ...cached.meta, source: 'cache' }
    };
  } catch (error) {
    console.error('Upstash read failed', error);
    return null;
  }
}

async function writePayloadToCache(cacheKey: string, payload: ApiPayload): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    await client.set(cacheKey, payload, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error('Upstash write failed', error);
  }
}

function buildResponsePayload(
  gamesResponse: GamesResponse,
  tier: SubscriptionTier,
  source: ApiPayload['meta']['source']
): ApiPayload {
  return {
    meta: {
      generatedAt: gamesResponse.generatedAt,
      tier,
      source,
      fallback: source === 'fallback'
    },
    games: applyEntitlements(gamesResponse.games, tier)
  };
}

export async function GET(request: NextRequest) {
  const tier = resolveTier(request);
  const cacheKey = `${CACHE_PREFIX}${tier}`;

  const cached = await getPayloadFromCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=30'
      }
    });
  }

  let gamesResponse: GamesResponse | null = null;
  let source: ApiPayload['meta']['source'] = 'database';

  try {
    gamesResponse = await getD1BaseballGames();
  } catch (error) {
    console.error('Failed to load games from database', error);
  }

  if (!gamesResponse || gamesResponse.games.length === 0) {
    gamesResponse = buildFallbackGamesPayload();
    source = 'fallback';
  }

  const payload = buildResponsePayload(gamesResponse, tier, source);

  await writePayloadToCache(cacheKey, payload);

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 's-maxage=30, stale-while-revalidate=30'
    }
  });
}
