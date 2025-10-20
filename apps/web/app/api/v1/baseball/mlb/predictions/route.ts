import { NextResponse } from 'next/server';

export const runtime = 'edge';

const TEAM_PARAM = 'team';
const DEFAULT_PATH = '/v1/baseball/mlb/predictions';

function buildTargetUrl(team: string): URL {
  const baseUrl = process.env.CHAMPION_PARLIAMENT_BASE_URL;

  if (!baseUrl) {
    throw new Error('Champion Parliament base URL is not configured.');
  }

  const target = new URL(baseUrl);
  const normalizedBasePath = target.pathname.replace(/\/$/, '');
  const normalizedDefaultPath = DEFAULT_PATH.replace(/^\//, '');
  target.pathname = `${normalizedBasePath ? `${normalizedBasePath}/` : '/'}${normalizedDefaultPath}`.replace(/\/+/g, '/');
  target.searchParams.set(TEAM_PARAM, team);

  return target;
}

function resolveAuthHeader(): Record<string, string> {
  const token = process.env.CHAMPION_PARLIAMENT_API_TOKEN;

  if (!token) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const team = requestUrl.searchParams.get(TEAM_PARAM);

  if (!team) {
    return NextResponse.json(
      {
        error: 'Missing required "team" query parameter.'
      },
      { status: 400 }
    );
  }

  let target: URL;

  try {
    target = buildTargetUrl(team);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Configuration error.'
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(target, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BlazeSportsIntel-Web/1.0',
        ...resolveAuthHeader()
      },
      cache: 'no-store'
    });

    const cacheStatus = response.headers.get('cf-cache-status') ?? 'MISS';
    const responseHeaders = new Headers({
      'cache-control': 'no-store, max-age=0',
      'x-bsi-champion-cache': cacheStatus,
      'x-bsi-champion-origin': target.origin
    });

    const contentType = response.headers.get('content-type') ?? 'application/json';
    responseHeaders.set('content-type', contentType);

    const rawBody = await response.text();

    if (contentType.includes('application/json')) {
      try {
        const jsonBody = rawBody.length ? JSON.parse(rawBody) : {};

        return NextResponse.json(jsonBody, {
          status: response.status,
          headers: responseHeaders
        });
      } catch {
        // Fall through to return raw body as text if parsing fails.
      }
    }

    return new NextResponse(rawBody, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upstream request failed.'
      },
      { status: 502 }
    );
  }
}
