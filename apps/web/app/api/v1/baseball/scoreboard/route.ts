import { NextRequest, NextResponse } from 'next/server';
import {
  CacheState,
  SCOREBOARD_TTL_SECONDS,
  buildCacheKey,
  createRedisClient,
  getScoreboardData,
  resolveScoreboardDate,
  ScoreboardBaseError,
  ScoreboardProviderError,
  ScoreboardValidationError,
} from './service';

export const runtime = 'edge';

type ErrorBody = {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type SuccessBody = {
  status: 'ok';
  data: Awaited<ReturnType<typeof getScoreboardData>>['data'];
  meta: {
    cacheState: CacheState;
    ttlSeconds: number;
    cacheKey: string;
  };
};

const errorResponse = (body: ErrorBody, status: number) =>
  new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const requestedDate = searchParams.get('date');
  const resolved = resolveScoreboardDate(requestedDate);
  const cacheKey = buildCacheKey(resolved.queryParam);

  try {
    const redis = createRedisClient();
    const { data, cacheState } = await getScoreboardData({
      dateParam: resolved.queryParam,
      now: new Date(),
      redis,
    });

    const payload: SuccessBody = {
      status: 'ok',
      data,
      meta: {
        cacheState,
        ttlSeconds: SCOREBOARD_TTL_SECONDS,
        cacheKey,
      },
    };

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    if (error instanceof ScoreboardValidationError || error instanceof ScoreboardProviderError) {
      return errorResponse(
        {
          status: 'error',
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        error.status,
      );
    }

    const fallback: ErrorBody = {
      status: 'error',
      error: {
        code: error instanceof ScoreboardBaseError ? error.code : 'UNKNOWN_ERROR',
        message:
          error instanceof Error ? error.message : 'Unexpected error while loading college baseball scoreboard',
      },
    };

    return errorResponse(fallback, error instanceof ScoreboardBaseError ? error.status : 500);
  }
}
