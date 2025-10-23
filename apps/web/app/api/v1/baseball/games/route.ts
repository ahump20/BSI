import { NextRequest, NextResponse } from 'next/server';
import type { BaseballGamesResponse } from './types';
import { validateQuery } from '../../../../../../../lib/validation/nextjs-validation';
import { baseballGamesQuerySchema } from '../../../../../../../lib/validation/schemas/baseball.schema';

export const runtime = 'edge';

const DEFAULT_TTL_SECONDS = 45;
const MAX_TTL_SECONDS = 60;
const DEFAULT_TIMEOUT_MS = 4500;

function resolveInferenceBaseUrl(): string | null {
  const direct = process.env.CLOUDFLARE_INFERENCE_BASE_URL ?? process.env.BASEBALL_INFERENCE_BASE_URL;
  if (direct) {
    return direct;
  }

  const interim = process.env.INTERIM_NODE_SERVICE_BASE_URL ?? process.env.BASEBALL_INTERIM_NODE_BASE_URL;
  if (interim) {
    return interim;
  }

  return null;
}

function resolveAuthHeader(): string | null {
  const token =
    process.env.CLOUDFLARE_INFERENCE_API_TOKEN ??
    process.env.BASEBALL_INFERENCE_API_TOKEN ??
    process.env.INTERIM_NODE_SERVICE_TOKEN ??
    process.env.BASEBALL_INTERIM_NODE_TOKEN ??
    null;

  if (!token) {
    return null;
  }

  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

function normaliseResponse(payload: unknown, fallbackFetchedAt: string): BaseballGamesResponse {
  const base: Partial<BaseballGamesResponse> =
    payload && typeof payload === 'object' ? (payload as BaseballGamesResponse) : ({} as BaseballGamesResponse);

  const games = Array.isArray(base.games) ? base.games : [];
  const ttlSeconds = Math.min(Math.max(base.ttlSeconds ?? DEFAULT_TTL_SECONDS, 15), MAX_TTL_SECONDS);

  return {
    games,
    fetchedAt: base.fetchedAt ?? fallbackFetchedAt,
    ttlSeconds,
    source: base.source ?? 'cloudflare-worker'
  };
}

function buildTargetUrl(baseUrl: string, request: NextRequest): string {
  const upstreamUrl = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  upstreamUrl.pathname = `${upstreamUrl.pathname.replace(/\/$/, '')}/v1/baseball/games`;

  const incoming = request.nextUrl.searchParams;
  const league = incoming.get('league') ?? 'ncaab';
  upstreamUrl.searchParams.set('league', league);

  const date = incoming.get('date');
  if (date) {
    upstreamUrl.searchParams.set('date', date);
  }

  const conference = incoming.get('conference');
  if (conference) {
    upstreamUrl.searchParams.set('conference', conference);
  }

  return upstreamUrl.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Validate query parameters
  const validationResult = validateQuery(request, baseballGamesQuerySchema);
  if (!validationResult.success) {
    return validationResult.error;
  }

  const baseUrl = resolveInferenceBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Inference endpoint not configured.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5'
        }
      }
    );
  }

  const targetUrl = buildTargetUrl(baseUrl, request);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json'
    };

    const authHeader = resolveAuthHeader();
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeout);

    if (!upstreamResponse.ok) {
      const fallbackFetchedAt = new Date().toISOString();
      let errorPayload: unknown;
      try {
        errorPayload = await upstreamResponse.json();
      } catch (error) {
        errorPayload = { error: 'Upstream did not return JSON.' };
      }

      return NextResponse.json(
        {
          error: 'Unable to retrieve live games from inference worker.',
          upstreamStatus: upstreamResponse.status,
          upstream: errorPayload
        },
        {
          status: upstreamResponse.status === 404 ? 404 : 502,
          headers: {
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5'
          }
        }
      );
    }

    const fallbackFetchedAt = upstreamResponse.headers.get('date') ?? new Date().toISOString();
    const payload = await upstreamResponse.json();
    const normalised = normaliseResponse(payload, fallbackFetchedAt);

    return NextResponse.json(normalised, {
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${normalised.ttlSeconds}, stale-while-revalidate=${Math.max(
          Math.floor(normalised.ttlSeconds / 2),
          5
        )}`
      }
    });
  } catch (error) {
    clearTimeout(timeout);

    const isAbortError = error instanceof Error && error.name === 'AbortError';

    return NextResponse.json(
      {
        error: isAbortError ? 'Inference worker request timed out.' : 'Unexpected error retrieving live games.',
        detail: error instanceof Error ? error.message : String(error)
      },
      {
        status: isAbortError ? 504 : 500,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5'
        }
      }
    );
  }
}
