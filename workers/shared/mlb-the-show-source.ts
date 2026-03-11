import type { Env } from './types';
import type {
  ShowAcquisitionPath,
  ShowCaptainBoostTier,
  ShowCaptainCard,
  ShowCardAttributes,
  ShowCardSummary,
  ShowHistoryPoint,
  ShowMarketCurrent,
  ShowSourceKind,
  ShowSourceStatus,
} from '../../lib/mlb-the-show/types';

interface RawShowCard {
  uuid: string;
  img: string;
  baked_img: string | null;
  name: string;
  rarity: string;
  team: string;
  team_short_name: string;
  ovr: number;
  series: string;
  series_year: number | null;
  display_position: string;
  display_secondary_positions: string | null;
  bat_hand: string;
  throw_hand: string;
  born: string | null;
  is_hitter: boolean;
  has_augment: boolean;
  augment_text: string | null;
  set_name: string | null;
  is_live_set: boolean;
  is_sellable: boolean;
  locations?: string[];
  pitches?: Array<{ name: string; speed?: number; control?: number; movement?: number }>;
  quirks?: Array<{ name: string; description: string; img?: string }>;
  stamina?: number;
  pitching_clutch?: number;
  hits_per_bf?: number;
  k_per_bf?: number;
  bb_per_bf?: number;
  hr_per_bf?: number;
  pitch_velocity?: number;
  pitch_control?: number;
  pitch_movement?: number;
  contact_left?: number;
  contact_right?: number;
  power_left?: number;
  power_right?: number;
  plate_vision?: number;
  plate_discipline?: number;
  batting_clutch?: number;
  bunting_ability?: number;
  drag_bunting_ability?: number;
  hitting_durability?: number;
  fielding_durability?: number;
  fielding_ability?: number;
  arm_strength?: number;
  arm_accuracy?: number;
  reaction_time?: number;
  blocking?: number;
  speed?: number;
  baserunning_ability?: number;
  baserunning_aggression?: number;
}

interface RawListing {
  listing_name: string;
  best_sell_price: number | null;
  best_buy_price: number | null;
  item: RawShowCard;
}

interface RawCaptain {
  uuid: string;
  img: string;
  baked_img: string | null;
  name: string;
  display_position: string;
  team: string;
  ovr: number;
  ability_name: string;
  ability_desc: string;
  update_date: string;
  boosts: Array<{
    tier: string;
    description: string;
    attributes: Array<{ name: string; value: string }>;
  }>;
}

interface ParsedItemPageHistory {
  dailyPoints: ShowHistoryPoint[];
  completedOrders: ShowHistoryPoint[];
}

const SHOW_CACHE_PREFIX = 'show-dd';

function showNow() {
  return new Date().toISOString();
}

function sourceKindForCompatibility(host: string): ShowSourceKind {
  return host.includes('mlb25.') ? 'compat_official_api' : 'official_api';
}

export function getShowSourceStatus(env: Env): ShowSourceStatus {
  const resolvedHost = env.SHOW_API_HOST || 'mlb25.theshow.com';
  const itemPageHost = env.SHOW_MARKET_WEB_HOST || resolvedHost;
  const compatibilityMode = resolvedHost.includes('mlb25.');

  return {
    seasonLabel: 'MLB The Show 26',
    requestedHost: env.SHOW_API_HOST || 'mlb26.theshow.com',
    resolvedHost,
    itemPageHost,
    gameCode: env.SHOW_PUBLIC_GAME_CODE || 'MLBTS26',
    officialApiAvailable: true,
    officialWebAvailable: true,
    compatibilityMode,
    notes: compatibilityMode
      ? ['Official 26 public API host is not configured; using verified public MLB 25 The Show endpoints in compatibility mode.']
      : ['Official public host configured.'],
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': 'BlazeSportsIntel/1.0' } });
  if (!res.ok) {
    throw new Error(`Upstream request failed: ${res.status} ${url}`);
  }
  return res.json() as Promise<T>;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'BlazeSportsIntel/1.0' } });
  if (!res.ok) {
    throw new Error(`Upstream request failed: ${res.status} ${url}`);
  }
  return res.text();
}

function normalizeAttributes(item: RawShowCard): ShowCardAttributes {
  return {
    stamina: item.stamina ?? 0,
    pitchingClutch: item.pitching_clutch ?? 0,
    hitsPerBf: item.hits_per_bf ?? 0,
    kPerBf: item.k_per_bf ?? 0,
    bbPerBf: item.bb_per_bf ?? 0,
    hrPerBf: item.hr_per_bf ?? 0,
    pitchVelocity: item.pitch_velocity ?? 0,
    pitchControl: item.pitch_control ?? 0,
    pitchMovement: item.pitch_movement ?? 0,
    contactLeft: item.contact_left ?? 0,
    contactRight: item.contact_right ?? 0,
    powerLeft: item.power_left ?? 0,
    powerRight: item.power_right ?? 0,
    plateVision: item.plate_vision ?? 0,
    plateDiscipline: item.plate_discipline ?? 0,
    battingClutch: item.batting_clutch ?? 0,
    buntingAbility: item.bunting_ability ?? 0,
    dragBuntingAbility: item.drag_bunting_ability ?? 0,
    hittingDurability: item.hitting_durability ?? 0,
    fieldingDurability: item.fielding_durability ?? 0,
    fieldingAbility: item.fielding_ability ?? 0,
    armStrength: item.arm_strength ?? 0,
    armAccuracy: item.arm_accuracy ?? 0,
    reactionTime: item.reaction_time ?? 0,
    blocking: item.blocking ?? 0,
    speed: item.speed ?? 0,
    baserunningAbility: item.baserunning_ability ?? 0,
    baserunningAggression: item.baserunning_aggression ?? 0,
  };
}

export function normalizeShowCard(item: RawShowCard, host: string): ShowCardSummary {
  return {
    id: item.uuid,
    name: item.name,
    overall: item.ovr,
    rarity: item.rarity,
    team: item.team,
    teamShortName: item.team_short_name,
    series: item.series,
    seriesYear: item.series_year,
    setName: item.set_name,
    isLiveSet: item.is_live_set,
    primaryPosition: item.display_position,
    secondaryPositions: item.display_secondary_positions
      ? item.display_secondary_positions.split(',').map((value) => value.trim()).filter(Boolean)
      : [],
    bats: item.bat_hand,
    throws: item.throw_hand,
    born: item.born,
    imageUrl: item.img,
    bakedImageUrl: item.baked_img,
    locations: item.locations ?? [],
    isSellable: item.is_sellable,
    hasAugment: item.has_augment,
    augmentText: item.augment_text,
    isHitter: item.is_hitter,
    attributes: normalizeAttributes(item),
    sourceKind: sourceKindForCompatibility(host),
    sourceName: host,
    sourceUpdatedAt: showNow(),
  };
}

export function normalizeMarketCurrent(listing: RawListing, host: string): ShowMarketCurrent {
  const bestBuyNow = listing.best_buy_price ?? null;
  const bestSellNow = listing.best_sell_price ?? null;
  const midPrice =
    bestBuyNow !== null && bestSellNow !== null
      ? Math.round((bestBuyNow + bestSellNow) / 2)
      : bestSellNow ?? bestBuyNow;

  return {
    cardId: listing.item.uuid,
    bestBuyNow,
    bestSellNow,
    lastSalePrice: null,
    midPrice,
    spread:
      bestBuyNow !== null && bestSellNow !== null
        ? bestSellNow - bestBuyNow
        : null,
    listingCount: null,
    sourceKind: sourceKindForCompatibility(host),
    sourceName: host,
    capturedAt: showNow(),
  };
}

export function normalizeCaptain(card: RawCaptain, host: string): ShowCaptainCard {
  const boosts: ShowCaptainBoostTier[] = (card.boosts || []).map((boost) => ({
    tier: Number(boost.tier || 0),
    description: boost.description,
    attributes: (boost.attributes || []).map((attribute) => ({
      name: attribute.name,
      value: Number(attribute.value || 0),
    })),
  }));

  return {
    id: card.uuid,
    name: card.name,
    team: card.team,
    overall: card.ovr,
    imageUrl: card.img,
    bakedImageUrl: card.baked_img,
    position: card.display_position,
    abilityName: card.ability_name,
    abilityDescription: card.ability_desc,
    updatedAt: card.update_date,
    boosts,
  };
}

export async function fetchShowCardsPage(env: Env, page: number): Promise<ShowCardSummary[]> {
  const host = getShowSourceStatus(env).resolvedHost;
  const url = `https://${host}/apis/items.json?type=mlb_card&page=${page}`;
  const body = await fetchJson<{ items: RawShowCard[] }>(url);
  return (body.items || []).map((item) => normalizeShowCard(item, host));
}

export async function fetchShowListingsPage(env: Env, page: number): Promise<(ShowCardSummary & { market: ShowMarketCurrent })[]> {
  const host = getShowSourceStatus(env).resolvedHost;
  const url = `https://${host}/apis/listings.json?type=mlb_card&page=${page}`;
  const body = await fetchJson<{ listings: RawListing[] }>(url);
  return (body.listings || []).map((listing) => ({
    ...normalizeShowCard(listing.item, host),
    market: normalizeMarketCurrent(listing, host),
  }));
}

export async function fetchShowCard(env: Env, cardId: string): Promise<ShowCardSummary> {
  const host = getShowSourceStatus(env).resolvedHost;
  const url = `https://${host}/apis/item.json?uuid=${encodeURIComponent(cardId)}`;
  const body = await fetchJson<RawShowCard>(url);
  return normalizeShowCard(body, host);
}

export async function fetchShowListing(env: Env, cardId: string): Promise<{
  card: ShowCardSummary;
  market: ShowMarketCurrent;
  history: ShowHistoryPoint[];
}> {
  const status = getShowSourceStatus(env);
  const url = `https://${status.resolvedHost}/apis/listing.json?uuid=${encodeURIComponent(cardId)}`;
  const body = await fetchJson<RawListing & {
    price_history?: Array<{ date: string; best_buy_price: number | null; best_sell_price: number | null }>;
    completed_orders?: Array<{ date: string; price: string }>;
  }>(url);

  const market = normalizeMarketCurrent(body, status.resolvedHost);
  const history: ShowHistoryPoint[] = [];

  for (const point of body.price_history || []) {
    history.push({
      cardId,
      label: point.date,
      capturedAt: point.date,
      bestBuyNow: point.best_buy_price ?? null,
      bestSellNow: point.best_sell_price ?? null,
      spread:
        point.best_buy_price !== null && point.best_buy_price !== undefined &&
        point.best_sell_price !== null && point.best_sell_price !== undefined
          ? point.best_sell_price - point.best_buy_price
          : null,
      lastSalePrice: null,
      listingCount: null,
      seriesType: 'official_daily',
      sourceName: status.resolvedHost,
    });
  }

  for (const order of body.completed_orders || []) {
    history.push({
      cardId,
      label: order.date,
      capturedAt: order.date,
      bestBuyNow: null,
      bestSellNow: null,
      spread: null,
      lastSalePrice: Number(String(order.price).replace(/[^0-9]/g, '')) || null,
      listingCount: null,
      seriesType: 'official_completed_orders',
      sourceName: status.resolvedHost,
    });
  }

  return {
    card: normalizeShowCard(body.item, status.resolvedHost),
    market,
    history,
  };
}

export async function fetchShowCaptains(env: Env, page = 1): Promise<ShowCaptainCard[]> {
  const host = getShowSourceStatus(env).resolvedHost;
  const url = `https://${host}/apis/captains.json?page=${page}`;
  const body = await fetchJson<{ captains: RawCaptain[] }>(url);
  return (body.captains || []).map((captain) => normalizeCaptain(captain, host));
}

export async function fetchShowMeta(env: Env): Promise<{ series: string[]; brands: string[]; sets: string[] }> {
  const host = getShowSourceStatus(env).resolvedHost;
  const url = `https://${host}/apis/meta_data.json`;
  const body = await fetchJson<{
    series: Array<{ name: string }>;
    brands: Array<{ name: string }>;
    sets: string[];
  }>(url);

  return {
    series: (body.series || []).map((entry) => entry.name).filter(Boolean),
    brands: (body.brands || []).map((entry) => entry.name).filter(Boolean),
    sets: (body.sets || []).filter(Boolean),
  };
}

function parseNumberList(raw: string): number[] {
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));
}

function parseStringList(raw: string): string[] {
  return [...raw.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function parseCompletedOrders(html: string, cardId: string, sourceName: string): ShowHistoryPoint[] {
  const tbodyMatch = html.match(/<table id='table-completed-orders'>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return [];

  const rows = [...tbodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
  const points: ShowHistoryPoint[] = [];
  for (const match of rows) {
    const body = match[1];
    const cells = [...body.matchAll(/<td>([^<]+)<\/td>/gi)].map((cell) => cell[1]?.trim() ?? '');
    if (cells.length < 2) continue;
    const amount = Number(cells[0].replace(/,/g, ''));
    const capturedAt = cells[1];
    points.push({
      cardId,
      label: capturedAt,
      capturedAt,
      bestBuyNow: null,
      bestSellNow: null,
      spread: null,
      lastSalePrice: amount,
      listingCount: null,
      seriesType: 'official_completed_orders',
      sourceName,
    });
  }
  return points;
}

function parseDailyTrend(html: string, cardId: string, sourceName: string): ShowHistoryPoint[] {
  const datasetsMatch = html.match(/"datasets"\s*:\s*\[([\s\S]*?)\]\s*,\s*"labels"/i);
  const labelsMatch = html.match(/"labels"\s*:\s*\[([^\]]+)\]/i);
  if (!datasetsMatch || !labelsMatch) return [];

  const dataArrays = [...datasetsMatch[1].matchAll(/"data"\s*:\s*\[([^\]]+)\]/gi)];
  if (dataArrays.length < 2) return [];

  const sellPoints = parseNumberList(dataArrays[0]?.[1] ?? '');
  const buyPoints = parseNumberList(dataArrays[1]?.[1] ?? '');
  const labels = parseStringList(labelsMatch[1]);

  return labels.map((label, index) => {
    const sellNow = sellPoints[index] ?? null;
    const buyNow = buyPoints[index] ?? null;
    return {
      cardId,
      label,
      capturedAt: label,
      bestBuyNow: buyNow,
      bestSellNow: sellNow,
      spread:
        sellNow !== null && buyNow !== null
          ? sellNow - buyNow
          : null,
      lastSalePrice: null,
      listingCount: null,
      seriesType: 'official_daily',
      sourceName,
    };
  });
}

export async function fetchShowItemPageHistory(env: Env, cardId: string): Promise<ParsedItemPageHistory> {
  const status = getShowSourceStatus(env);
  const url = `https://${status.itemPageHost}/items/${encodeURIComponent(cardId)}`;
  const html = await fetchText(url);

  return {
    dailyPoints: parseDailyTrend(html, cardId, status.itemPageHost),
    completedOrders: parseCompletedOrders(html, cardId, status.itemPageHost),
  };
}

export function normalizeAcquisitionPaths(card: ShowCardSummary): ShowAcquisitionPath[] {
  return (card.locations || []).map((location) => ({
    cardId: card.id,
    label: location,
    sourceName: card.sourceName,
    sourceKind: card.sourceKind,
    confidence: 'verified',
  }));
}

export function cacheKeyForShow(scope: string, ...parts: (string | number | null | undefined)[]) {
  const serialized = parts
    .filter((part) => part !== null && part !== undefined && String(part).length > 0)
    .map((part) => String(part).replace(/[^a-zA-Z0-9:_-]/g, '-'))
    .join(':');
  return `${SHOW_CACHE_PREFIX}:${scope}${serialized ? `:${serialized}` : ''}`;
}
