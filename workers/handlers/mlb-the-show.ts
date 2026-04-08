import type { Env } from '../shared/types';
import { cachedJson, json, kvGet, kvPut } from '../shared/helpers';
import {
  fetchShowCard,
  fetchShowListingsPage,
  fetchShowItemPageHistory,
  fetchShowListing,
  getShowSourceStatus,
  normalizeAcquisitionPaths,
} from '../shared/mlb-the-show-source';
import {
  showDb,
  getBuild,
  getCardDetailFromDb,
  getCollectionDetailFromDb,
  getHistoryFromDb,
  getOverviewFromDb,
  getShowCardCount,
  listCaptains,
  listCollections,
  listWatchEvents,
  makeBuildId,
  queryCardsFromDb,
  rebuildCollections,
  replaceOfficialDailyHistory,
  saveBuild,
  showMeta,
  upsertAcquisitionPaths,
  upsertCardAttributeSnapshots,
  upsertCards,
  upsertMarketData,
} from '../shared/mlb-the-show-store';
import { DD_ROSTER_SLOTS, DD_PARALLEL_LEVELS, DD_PARALLEL_MODS, summarizeBuild } from '../../lib/mlb-the-show/roster';
import type {
  DDBuildCardSelection,
  DDBuildRecord,
  ShowCardSummary,
  ShowHistorySummary,
  ShowHistoryPoint,
  ShowMarketCurrent,
  ShowSourceStatus,
} from '../../lib/mlb-the-show/types';

const SHOW_CACHE_TTL = {
  status: 60,
  overview: 60,
  cards: 60,
  card: 60,
  history: 300,
  collections: 300,
  collectionDetail: 300,
  watchEvents: 60,
  builder: 3600,
  build: 900,
} as const;

function buildCacheKey(scope: string, suffix = '') {
  return `show26:${scope}${suffix ? `:${suffix}` : ''}`;
}

async function getCollectionCount(env: Env): Promise<number> {
  const row = await showDb(env).prepare('SELECT COUNT(*) as count FROM show_collections').first<{ count: number }>();
  return row?.count ?? 0;
}

async function getLastSyncAt(env: Env): Promise<string | null> {
  const row = await showDb(env).prepare(
    `SELECT COALESCE(finished_at, started_at) as synced_at
     FROM show_ingest_runs
     ORDER BY started_at DESC
     LIMIT 1`,
  ).first<{ synced_at: string | null }>();
  return row?.synced_at ?? null;
}

async function resolveSourceStatus(env: Env): Promise<ShowSourceStatus> {
  const [cardCount, collectionCount, lastSyncAt] = await Promise.all([
    getShowCardCount(env),
    getCollectionCount(env),
    getLastSyncAt(env),
  ]);

  const base = getShowSourceStatus(env);
  return {
    ...base,
    catalogReady: cardCount > 0,
    marketReady: cardCount > 0,
    collectionsReady: collectionCount > 0,
    acquisitionReady: cardCount > 0,
    cardCount,
    collectionCount,
    lastSyncAt,
    degradedReason:
      cardCount > 0
        ? undefined
        : 'No verified MLB The Show data has been ingested into BSI yet. Configure a public source host and run the sync worker before expecting live catalog or market data.',
  };
}

function allowLiveSource(env: Env): boolean {
  return getShowSourceStatus(env).officialApiAvailable;
}

function dedupeHistory(points: ShowHistoryPoint[]): ShowHistoryPoint[] {
  const seen = new Set<string>();
  return points.filter((point) => {
    const key = `${point.seriesType}:${point.label}:${point.capturedAt}:${point.lastSalePrice ?? ''}:${point.bestSellNow ?? ''}:${point.bestBuyNow ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function historyMetricValue(point: ShowHistoryPoint, metric: 'sell' | 'buy' | 'spread' | 'sale') {
  if (metric === 'buy') return point.bestBuyNow;
  if (metric === 'spread') return point.spread;
  if (metric === 'sale') return point.lastSalePrice;
  return point.bestSellNow;
}

function roundMetric(value: number | null) {
  return value === null ? null : Number(value.toFixed(1));
}

export function summarizeHistoryPoints(
  points: ShowHistoryPoint[],
  metric: 'sell' | 'buy' | 'spread' | 'sale',
): ShowHistorySummary {
  const values = points
    .map((point) => historyMetricValue(point, metric))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (values.length === 0) {
    return {
      sampleCount: 0,
      latestValue: null,
      earliestValue: null,
      highValue: null,
      lowValue: null,
      deltaValue: null,
      deltaPct: null,
      averageValue: null,
      volatility: null,
      officialPoints: points.filter((point) => point.seriesType === 'official_daily').length,
      intradayPoints: points.filter((point) => point.seriesType === 'bsi_intraday').length,
      completedSalePoints: points.filter((point) => point.seriesType === 'official_completed_orders').length,
    };
  }

  const earliestValue = values[0];
  const latestValue = values.at(-1) ?? null;
  const deltaValue = latestValue !== null ? latestValue - earliestValue : null;
  const averageValue = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - averageValue) ** 2, 0) / values.length;

  return {
    sampleCount: values.length,
    latestValue,
    earliestValue,
    highValue: Math.max(...values),
    lowValue: Math.min(...values),
    deltaValue,
    deltaPct: earliestValue !== 0 && deltaValue !== null ? roundMetric((deltaValue / earliestValue) * 100) : null,
    averageValue: roundMetric(averageValue),
    volatility: roundMetric(Math.sqrt(variance)),
    officialPoints: points.filter((point) => point.seriesType === 'official_daily').length,
    intradayPoints: points.filter((point) => point.seriesType === 'bsi_intraday').length,
    completedSalePoints: points.filter((point) => point.seriesType === 'official_completed_orders').length,
  };
}

export async function handleShowSourceStatus(env: Env): Promise<Response> {
  try {
    const cacheKey = buildCacheKey('status');
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.status, { 'X-Cache': 'HIT' });
    }

    const status = await resolveSourceStatus(env);
    const payload = {
      status,
      meta: showMeta(status, 'BSI D1', !status.catalogReady),
    };
    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.status);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.status, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleShowMarketOverview(env: Env): Promise<Response> {
  try {
    const cacheKey = buildCacheKey('overview');
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.overview, { 'X-Cache': 'HIT' });
    }

    const status = await resolveSourceStatus(env);
    const overview = status.catalogReady
      ? await getOverviewFromDb(env, status)
      : {
          totalCards: 0,
          sellableCards: 0,
          compatibilityMode: status.compatibilityMode,
          topBuyNow: [],
          topSellNow: [],
          captainSpotlight: [],
          newlyTracked: [],
        };

    const payload = {
      overview,
      collections: status.collectionsReady ? await listCollections(env, 18) : [],
      captains: status.catalogReady ? await listCaptains(env, 8) : [],
      meta: showMeta(status, 'BSI D1', !status.catalogReady),
    };

    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.overview);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.overview, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export const handleShowOverview = handleShowMarketOverview;

function filterLiveCards(
  cards: Array<ShowCardSummary & { market: ShowMarketCurrent }>,
  searchParams: URLSearchParams,
) {
  const search = searchParams.get('search')?.trim().toLowerCase();
  const team = searchParams.get('team')?.trim().toLowerCase();
  const series = searchParams.get('series')?.trim().toLowerCase();
  const rarity = searchParams.get('rarity')?.trim().toLowerCase();
  const bats = searchParams.get('bats')?.trim().toLowerCase();
  const position = searchParams.get('position')?.trim().toLowerCase();
  const marketStatus = searchParams.get('market_status')?.trim();
  const captain = searchParams.get('captain')?.trim();
  const wbcOnly = searchParams.get('wbc_only') === 'true';
  const sort = searchParams.get('sort') || 'sell_desc';

  const filtered = cards.filter((card) => {
    if (search) {
      const haystack = [
        card.name,
        card.team,
        card.teamShortName,
        card.series,
        card.setName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (team && card.team.toLowerCase() !== team) return false;
    if (series && card.series.toLowerCase() !== series) return false;
    if (rarity && card.rarity.toLowerCase() !== rarity) return false;
    if (bats && card.bats.toLowerCase() !== bats) return false;
    if (position) {
      const positions = [card.primaryPosition, ...card.secondaryPositions].map((value) => value.toLowerCase());
      if (!positions.includes(position)) return false;
    }

    if (marketStatus === 'listed' && card.market?.bestSellNow == null) return false;
    if (marketStatus === 'sellable' && !card.isSellable) return false;
    if (marketStatus === 'non_sellable' && card.isSellable) return false;
    if (captain === 'true' && !card.hasAugment) return false;
    if (wbcOnly) {
      const fields = [card.series, card.setName ?? '', ...(card.locations ?? [])].join(' ').toUpperCase();
      if (!fields.includes('WBC') && !fields.includes('WORLD BASEBALL CLASSIC')) return false;
    }
    return true;
  });

  filtered.sort((left, right) => {
    if (sort === 'buy_desc') {
      return (right.market?.bestBuyNow ?? -1) - (left.market?.bestBuyNow ?? -1) || right.overall - left.overall;
    }
    if (sort === 'ovr_desc') {
      return right.overall - left.overall || (right.market?.bestSellNow ?? -1) - (left.market?.bestSellNow ?? -1);
    }
    if (sort === 'name_asc') {
      return left.name.localeCompare(right.name);
    }
    if (sort === 'newest') {
      return new Date(right.sourceUpdatedAt).getTime() - new Date(left.sourceUpdatedAt).getTime();
    }
    return (right.market?.bestSellNow ?? -1) - (left.market?.bestSellNow ?? -1) || right.overall - left.overall;
  });

  return filtered;
}

export async function handleShowCards(url: URL, env: Env): Promise<Response> {
  try {
    const queryKey = url.searchParams.toString() || 'all';
    const cacheKey = buildCacheKey('cards', queryKey);
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.cards, { 'X-Cache': 'HIT' });
    }

    const status = await resolveSourceStatus(env);
    const page = Math.max(Number(url.searchParams.get('page') || 1), 1);
    const perPage = Math.min(Math.max(Number(url.searchParams.get('limit') || 24), 1), 60);
    let result = status.catalogReady
      ? await queryCardsFromDb(env, url.searchParams)
      : { cards: [], page, perPage, totalCards: 0, totalPages: 1 };

    if (!status.catalogReady && allowLiveSource(env)) {
      const liveCards = await fetchShowListingsPage(env, page).catch(() => []);
      const filtered = filterLiveCards(liveCards, url.searchParams);
      result = {
        cards: filtered.slice(0, perPage),
        page,
        perPage,
        totalCards: filtered.length,
        totalPages: Math.max(Math.ceil(filtered.length / perPage), 1),
      };
    }

    const payload = {
      cards: result.cards,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
      totalCards: result.totalCards,
      supportedFilters: ['team', 'series', 'rarity', 'bats', 'position', 'captain', 'collection', 'wbc_only', 'market_status'],
      meta: showMeta(status, 'BSI D1', !status.catalogReady, {
        partial_catalog: !status.catalogReady,
      }),
    };

    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.cards);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.cards, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

async function hydrateCard(env: Env, cardId: string, status: ShowSourceStatus) {
  if (!allowLiveSource(env)) return null;

  const liveCard = await fetchShowCard(env, cardId);
  const liveListing = await fetchShowListing(env, cardId);
  const pageHistory = await fetchShowItemPageHistory(env, cardId).catch(() => ({ dailyPoints: [], completedOrders: [] }));

  await upsertCards(env, [liveCard]);
  await upsertCardAttributeSnapshots(env, [liveCard]);
  await upsertMarketData(env, [{ card: liveCard, market: liveListing.market }], null);
  await upsertAcquisitionPaths(env, normalizeAcquisitionPaths(liveCard));
  await replaceOfficialDailyHistory(env, cardId, dedupeHistory([...liveListing.history, ...pageHistory.dailyPoints, ...pageHistory.completedOrders]));

  return getCardDetailFromDb(env, cardId, status);
}

export async function handleShowCardDetail(cardId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = buildCacheKey('card', cardId);
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.card, { 'X-Cache': 'HIT' });
    }

    const status = await resolveSourceStatus(env);
    let detail = await getCardDetailFromDb(env, cardId, status);

    if (!detail && allowLiveSource(env)) {
      detail = await hydrateCard(env, cardId, status);
    }

    if (!detail) {
      return json({ error: 'Card not found', meta: showMeta(status, 'BSI D1', true) }, 404);
    }

    const payload = {
      detail,
      meta: showMeta(status, detail.card.sourceName || 'BSI D1', !status.catalogReady),
    };

    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.card);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.card, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleShowCardHistory(cardId: string, url: URL, env: Env): Promise<Response> {
  try {
    const range = (url.searchParams.get('range') as '24h' | '7d' | '30d' | 'all' | null) || '30d';
    const metric = (url.searchParams.get('metric') as 'sell' | 'buy' | 'spread' | 'sale' | null) || 'sell';
    const cacheKey = buildCacheKey('history', `${cardId}:${range}:${metric}`);
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.history, { 'X-Cache': 'HIT' });
    }

    const status = await resolveSourceStatus(env);
    let points = await getHistoryFromDb(env, cardId, range);

    if (points.length === 0 && allowLiveSource(env)) {
      await hydrateCard(env, cardId, status);
      points = await getHistoryFromDb(env, cardId, range);
    }

    const payload = {
      cardId,
      metric,
      points,
      summary: summarizeHistoryPoints(points, metric),
      meta: showMeta(status, 'BSI D1', points.length === 0),
    };

    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.history);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.history, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleShowCollections(env: Env): Promise<Response> {
  try {
    const cacheKey = buildCacheKey('collections');
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.collections, { 'X-Cache': 'HIT' });
    }

    const status = await resolveSourceStatus(env);
    const collections = status.collectionsReady ? await listCollections(env, 60) : [];
    const payload = {
      collections,
      meta: showMeta(status, 'BSI D1', !status.collectionsReady),
    };
    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.collections);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.collections, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleShowCollectionDetail(collectionId: string, url: URL, env: Env): Promise<Response> {
  try {
    const queryKey = url.searchParams.toString() || 'all';
    const cacheKey = buildCacheKey('collection-detail', `${collectionId}:${queryKey}`);
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.collectionDetail, { 'X-Cache': 'HIT' });
    }

    const status = await resolveSourceStatus(env);
    const detail = await getCollectionDetailFromDb(env, collectionId, url.searchParams);
    if (!detail) {
      return json({ error: 'Collection not found', meta: showMeta(status, 'BSI D1', true) }, 404);
    }

    const payload = {
      detail,
      meta: showMeta(status, 'BSI D1', !status.collectionsReady),
    };

    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.collectionDetail);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.collectionDetail, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleShowWatchEvents(url: URL, env: Env): Promise<Response> {
  try {
    const queryKey = url.searchParams.toString() || 'all';
    const cacheKey = buildCacheKey('watch-events', queryKey);
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.watchEvents, { 'X-Cache': 'HIT' });
    }

    const status = await resolveSourceStatus(env);
    const events = await listWatchEvents(env, url.searchParams);
    const payload = {
      events,
      meta: showMeta(status, 'BSI D1', !status.catalogReady),
    };

    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.watchEvents);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.watchEvents, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleShowTeamBuilderReference(env: Env): Promise<Response> {
  try {
    const cacheKey = buildCacheKey('team-builder-reference');
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.builder, { 'X-Cache': 'HIT' });
    }

    const status = await resolveSourceStatus(env);
    const payload = {
      slots: DD_ROSTER_SLOTS.map((s) => ({ key: s.id, label: s.label, group: s.group, accepts: s.accepts })),
      captains: status.catalogReady ? await listCaptains(env, 30) : [],
      collections: status.collectionsReady ? await listCollections(env, 24) : [],
      parallelLevels: [...DD_PARALLEL_LEVELS],
      parallelMods: [...DD_PARALLEL_MODS],
      meta: showMeta(status, 'BSI D1', !status.catalogReady),
    };
    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.builder);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.builder, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

function isBuildSelectionArray(value: unknown): value is DDBuildCardSelection[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'object' && entry !== null);
}

export async function handleShowBuildCreate(req: Request, env: Env): Promise<Response> {
  try {
    const body = await req.json().catch(() => null) as { title?: string; captainCardId?: string | null; cards?: unknown } | null;
    if (!body || typeof body.title !== 'string' || !isBuildSelectionArray(body.cards)) {
      return json({ error: 'Invalid build payload' }, 400);
    }

    const now = new Date().toISOString();
    const build: DDBuildRecord = {
      buildId: makeBuildId(),
      title: body.title.trim() || 'Diamond Dynasty Build',
      seasonLabel: 'MLB The Show 26',
      captainCardId: body.captainCardId ?? null,
      cards: body.cards,
      summary: summarizeBuild(body.cards),
      createdAt: now,
      updatedAt: now,
    };

    await saveBuild(env, build);
    return json({ build, meta: { source: 'BSI D1', fetched_at: now, timezone: 'America/Chicago' } }, 201);
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export const handleShowBuildSave = handleShowBuildCreate;

export async function handleShowBuildGet(buildId: string, env: Env): Promise<Response> {
  try {
    const cacheKey = buildCacheKey('build', buildId);
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, SHOW_CACHE_TTL.build, { 'X-Cache': 'HIT' });
    }

    const build = await getBuild(env, buildId);
    if (!build) {
      return json({ error: 'Build not found' }, 404);
    }

    const payload = {
      build,
      meta: { source: 'BSI D1', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };
    await kvPut(env.KV, cacheKey, payload, SHOW_CACHE_TTL.build);
    return cachedJson(payload, 200, SHOW_CACHE_TTL.build, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleShowRebuildCollections(env: Env): Promise<Response> {
  try {
    await rebuildCollections(env);
    const status = await resolveSourceStatus(env);
    return json({ ok: true, meta: showMeta(status, 'BSI D1') });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}
