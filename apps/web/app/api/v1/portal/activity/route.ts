import { NextResponse, type NextRequest } from 'next/server';
import {
  buildPortalActivityResponse,
  getPortalActivitySnapshot
} from '../../../../../lib/portal';
import type {
  NilTier,
  PortalActivitySelectors,
  PortalActivitySnapshot,
  PortalClass
} from '../../../../../lib/portal';

export const dynamic = 'force-dynamic';

function parseSelectors(
  request: NextRequest,
  filters: PortalActivitySnapshot['filters']
): PortalActivitySelectors {
  const { searchParams } = new URL(request.url);
  const conferences = searchParams.getAll('conference');
  const classes = searchParams
    .getAll('class')
    .filter((value): value is PortalClass => filters.classes.includes(value as PortalClass));
  const nilTiers = searchParams
    .getAll('nilTier')
    .filter((value): value is NilTier => filters.nilTiers.includes(value as NilTier));
  const topMoversLimitRaw = searchParams.get('limitTopMovers');
  const topMoversLimit = topMoversLimitRaw ? Number.parseInt(topMoversLimitRaw, 10) : undefined;

  return {
    conferences: conferences.length > 0
      ? conferences.filter((value) => filters.conferences.includes(value))
      : undefined,
    classes: classes.length > 0 ? classes : undefined,
    nilTiers: nilTiers.length > 0 ? nilTiers : undefined,
    topMoversLimit: Number.isFinite(topMoversLimit) && topMoversLimit ? Math.max(1, Math.min(topMoversLimit, 10)) : undefined
  };
}

export async function GET(request: NextRequest) {
  const snapshot = getPortalActivitySnapshot();
  const selectors = parseSelectors(request, snapshot.filters);
  const response = buildPortalActivityResponse(snapshot, selectors);

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=60'
    }
  });
}
