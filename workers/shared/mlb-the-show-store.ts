import type { Env } from './types';

/** Use isolated Show DB when available, fall back to main DB during migration. */
function showDb(env: Env): D1Database { return env.SHOW_DB ?? env.DB; }
import type {
  DDBuildCardSelection,
  DDBuildRecord,
  DDBuildSummary,
  ShowAcquisitionPath,
  ShowCaptainCard,
  ShowCollectionDetail,
  ShowCardDetail,
  ShowCardSummary,
  ShowCollectionSummary,
  ShowHistoryPoint,
  ShowMarketCurrent,
  ShowMarketOverview,
  ShowSourceStatus,
  ShowWatchEvent,
} from '../../lib/mlb-the-show/types';

type D1Value = string | number | null;

interface ShowCardRow {
  card_id: string;
  name: string;
  overall: number;
  rarity: string;
  team: string;
  team_short_name: string;
  series: string;
  series_year: number | null;
  set_name: string | null;
  is_live_set: number;
  primary_position: string;
  secondary_positions_json: string;
  bats: string;
  throws: string;
  born: string | null;
  image_url: string;
  baked_image_url: string | null;
  locations_json: string;
  is_sellable: number;
  has_augment: number;
  augment_text: string | null;
  is_hitter: number;
  attributes_json: string;
  source_kind: ShowCardSummary['sourceKind'];
  source_name: string;
  source_updated_at: string;
}

interface ShowMarketRow {
  card_id: string;
  best_buy_now: number | null;
  best_sell_now: number | null;
  last_sale_price: number | null;
  mid_price: number | null;
  spread: number | null;
  listing_count: number | null;
  source_kind: ShowMarketCurrent['sourceKind'];
  source_name: string;
  captured_at: string;
}

interface ShowCaptainRow {
  card_id: string;
  name: string;
  team: string;
  overall: number;
  image_url: string;
  baked_image_url: string | null;
  position: string;
  ability_name: string;
  ability_description: string;
  updated_at: string;
  boosts_json: string;
}

interface ShowCollectionRow {
  collection_id: string;
  name: string;
  type: ShowCollectionSummary['type'];
  card_count: number;
  low_stub_cost: number | null;
  high_stub_cost: number | null;
}

interface ShowBuildRow {
  build_id: string;
  title: string;
  season_label: string;
  captain_card_id: string | null;
  cards_json: string;
  summary_json: string;
  created_at: string;
  updated_at: string;
}

interface ShowWatchEventRow {
  event_id: string;
  card_id: string;
  card_name: string;
  image_url: string | null;
  overall: number | null;
  team: string | null;
  rarity: string | null;
  event_type: string;
  event_label: string;
  previous_value: number | null;
  current_value: number | null;
  delta_value: number | null;
  triggered_at: string;
  details_json: string;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function collectionId(type: ShowCollectionSummary['type'], name: string): string {
  return `${type}:${slugify(name)}`;
}

export function showMeta(sourceStatus: ShowSourceStatus, source: string, degraded = false, extras: Record<string, unknown> = {}) {
  return {
    dataSource: source,
    lastUpdated: new Date().toISOString(),
    timezone: 'America/Chicago',
    source,
    fetched_at: new Date().toISOString(),
    degraded,
    sources: [...new Set([source, sourceStatus.resolvedHost, sourceStatus.itemPageHost])],
    source_status: sourceStatus,
    ...extras,
  };
}

export function toBuildSelection(card: ShowCardSummary, market: ShowMarketCurrent | null, slotId: string): DDBuildCardSelection {
  return {
    slotId,
    cardId: card.id,
    displayName: card.name,
    team: card.team,
    primaryPosition: card.primaryPosition,
    secondaryPositions: card.secondaryPositions,
    overall: card.overall,
    bats: card.bats,
    bestSellNow: market?.bestSellNow ?? null,
    rarity: card.rarity,
    series: card.series,
    themeTag: card.team || null,
    localParallelLevel: 0,
    localParallelModLabel: null,
  };
}

export function deserializeCard(row: ShowCardRow): ShowCardSummary {
  return {
    id: row.card_id,
    name: row.name,
    overall: row.overall,
    rarity: row.rarity,
    team: row.team,
    teamShortName: row.team_short_name,
    series: row.series,
    seriesYear: row.series_year,
    setName: row.set_name,
    isLiveSet: row.is_live_set === 1,
    primaryPosition: row.primary_position,
    secondaryPositions: parseJson<string[]>(row.secondary_positions_json, []),
    bats: row.bats,
    throws: row.throws,
    born: row.born,
    imageUrl: row.image_url,
    bakedImageUrl: row.baked_image_url,
    locations: parseJson<string[]>(row.locations_json, []),
    isSellable: row.is_sellable === 1,
    hasAugment: row.has_augment === 1,
    augmentText: row.augment_text,
    isHitter: row.is_hitter === 1,
    attributes: parseJson(row.attributes_json, {
      stamina: 0,
      pitchingClutch: 0,
      hitsPerBf: 0,
      kPerBf: 0,
      bbPerBf: 0,
      hrPerBf: 0,
      pitchVelocity: 0,
      pitchControl: 0,
      pitchMovement: 0,
      contactLeft: 0,
      contactRight: 0,
      powerLeft: 0,
      powerRight: 0,
      plateVision: 0,
      plateDiscipline: 0,
      battingClutch: 0,
      buntingAbility: 0,
      dragBuntingAbility: 0,
      hittingDurability: 0,
      fieldingDurability: 0,
      fieldingAbility: 0,
      armStrength: 0,
      armAccuracy: 0,
      reactionTime: 0,
      blocking: 0,
      speed: 0,
      baserunningAbility: 0,
      baserunningAggression: 0,
    }),
    sourceKind: row.source_kind,
    sourceName: row.source_name,
    sourceUpdatedAt: row.source_updated_at,
  };
}

export function deserializeMarket(row: ShowMarketRow): ShowMarketCurrent {
  return {
    cardId: row.card_id,
    bestBuyNow: row.best_buy_now,
    bestSellNow: row.best_sell_now,
    lastSalePrice: row.last_sale_price,
    midPrice: row.mid_price,
    spread: row.spread,
    listingCount: row.listing_count,
    sourceKind: row.source_kind,
    sourceName: row.source_name,
    capturedAt: row.captured_at,
  };
}

export function deserializeCaptain(row: ShowCaptainRow): ShowCaptainCard {
  return {
    id: row.card_id,
    name: row.name,
    team: row.team,
    overall: row.overall,
    imageUrl: row.image_url,
    bakedImageUrl: row.baked_image_url,
    position: row.position,
    abilityName: row.ability_name,
    abilityDescription: row.ability_description,
    updatedAt: row.updated_at,
    boosts: parseJson(row.boosts_json, []),
  };
}

export function deserializeCollection(row: ShowCollectionRow): ShowCollectionSummary {
  return {
    id: row.collection_id,
    name: row.name,
    type: row.type,
    cardCount: row.card_count,
    lowStubCost: row.low_stub_cost,
    highStubCost: row.high_stub_cost,
  };
}

export function deserializeWatchEvent(row: ShowWatchEventRow): ShowWatchEvent {
  return {
    eventId: row.event_id,
    cardId: row.card_id,
    cardName: row.card_name,
    cardImageUrl: row.image_url,
    cardOverall: row.overall,
    cardTeam: row.team,
    cardRarity: row.rarity,
    eventType: row.event_type,
    eventLabel: row.event_label,
    previousValue: row.previous_value,
    currentValue: row.current_value,
    deltaValue: row.delta_value,
    triggeredAt: row.triggered_at,
    details: parseJson<Record<string, unknown>>(row.details_json, {}),
  };
}

export function deserializeBuild(row: ShowBuildRow): DDBuildRecord {
  return {
    buildId: row.build_id,
    title: row.title,
    seasonLabel: row.season_label,
    captainCardId: row.captain_card_id,
    cards: parseJson<DDBuildCardSelection[]>(row.cards_json, []),
    summary: parseJson<DDBuildSummary>(row.summary_json, {
      totalStubCost: 0,
      averageOverall: 0,
      captainEligibleCount: 0,
      hitterHandedness: { left: 0, right: 0, switch: 0 },
      themeTeams: [],
    }),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getShowCardCount(env: Env): Promise<number> {
  const row = await showDb(env).prepare('SELECT COUNT(*) as count FROM show_cards').first<{ count: number }>();
  return row?.count ?? 0;
}

async function batchRun(env: Env, statements: D1PreparedStatement[]) {
  for (const group of chunk(statements, 50)) {
    await showDb(env).batch(group);
  }
}

export async function upsertCards(env: Env, cards: ShowCardSummary[]) {
  const statements = cards.map((card) =>
    showDb(env).prepare(
      `INSERT INTO show_cards (
        card_id, name, overall, rarity, team, team_short_name, series, series_year, set_name, is_live_set,
        primary_position, secondary_positions_json, bats, throws, born, image_url, baked_image_url,
        locations_json, is_sellable, has_augment, augment_text, is_hitter, attributes_json,
        source_kind, source_name, source_updated_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(card_id) DO UPDATE SET
        name = excluded.name,
        overall = excluded.overall,
        rarity = excluded.rarity,
        team = excluded.team,
        team_short_name = excluded.team_short_name,
        series = excluded.series,
        series_year = excluded.series_year,
        set_name = excluded.set_name,
        is_live_set = excluded.is_live_set,
        primary_position = excluded.primary_position,
        secondary_positions_json = excluded.secondary_positions_json,
        bats = excluded.bats,
        throws = excluded.throws,
        born = excluded.born,
        image_url = excluded.image_url,
        baked_image_url = excluded.baked_image_url,
        locations_json = excluded.locations_json,
        is_sellable = excluded.is_sellable,
        has_augment = excluded.has_augment,
        augment_text = excluded.augment_text,
        is_hitter = excluded.is_hitter,
        attributes_json = excluded.attributes_json,
        source_kind = excluded.source_kind,
        source_name = excluded.source_name,
        source_updated_at = excluded.source_updated_at,
        updated_at = CURRENT_TIMESTAMP`,
    ).bind(
      card.id,
      card.name,
      card.overall,
      card.rarity,
      card.team,
      card.teamShortName,
      card.series,
      card.seriesYear,
      card.setName,
      card.isLiveSet ? 1 : 0,
      card.primaryPosition,
      JSON.stringify(card.secondaryPositions),
      card.bats,
      card.throws,
      card.born,
      card.imageUrl,
      card.bakedImageUrl,
      JSON.stringify(card.locations),
      card.isSellable ? 1 : 0,
      card.hasAugment ? 1 : 0,
      card.augmentText,
      card.isHitter ? 1 : 0,
      JSON.stringify(card.attributes),
      card.sourceKind,
      card.sourceName,
      card.sourceUpdatedAt,
    ),
  );

  await batchRun(env, statements);
}

export async function upsertCardAttributeSnapshots(env: Env, cards: ShowCardSummary[]) {
  const statements = cards.map((card) =>
    showDb(env).prepare(
      `INSERT OR IGNORE INTO show_card_attributes (
        card_id, captured_at, overall, attributes_json, source_name
      ) VALUES (?, ?, ?, ?, ?)`,
    ).bind(card.id, card.sourceUpdatedAt, card.overall, JSON.stringify(card.attributes), card.sourceName),
  );
  await batchRun(env, statements);
}

export async function upsertMarketData(
  env: Env,
  entries: Array<{ card: ShowCardSummary; market: ShowMarketCurrent }>,
  payloadR2Key?: string | null,
) {
  const currentStatements: D1PreparedStatement[] = [];
  const snapshotStatements: D1PreparedStatement[] = [];

  for (const entry of entries) {
    currentStatements.push(
      showDb(env).prepare(
        `INSERT INTO show_market_current (
          card_id, best_buy_now, best_sell_now, last_sale_price, mid_price, spread, listing_count, source_kind, source_name, captured_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(card_id) DO UPDATE SET
          best_buy_now = excluded.best_buy_now,
          best_sell_now = excluded.best_sell_now,
          last_sale_price = excluded.last_sale_price,
          mid_price = excluded.mid_price,
          spread = excluded.spread,
          listing_count = excluded.listing_count,
          source_kind = excluded.source_kind,
          source_name = excluded.source_name,
          captured_at = excluded.captured_at`,
      ).bind(
        entry.market.cardId,
        entry.market.bestBuyNow,
        entry.market.bestSellNow,
        entry.market.lastSalePrice,
        entry.market.midPrice,
        entry.market.spread,
        entry.market.listingCount,
        entry.market.sourceKind,
        entry.market.sourceName,
        entry.market.capturedAt,
      ),
    );

    snapshotStatements.push(
      showDb(env).prepare(
        `INSERT OR IGNORE INTO show_market_snapshots (
          card_id, captured_at, best_buy_now, best_sell_now, last_sale_price, mid_price, spread, listing_count, source_kind, source_name, payload_r2_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        entry.market.cardId,
        entry.market.capturedAt,
        entry.market.bestBuyNow,
        entry.market.bestSellNow,
        entry.market.lastSalePrice,
        entry.market.midPrice,
        entry.market.spread,
        entry.market.listingCount,
        entry.market.sourceKind,
        entry.market.sourceName,
        payloadR2Key ?? null,
      ),
    );
  }

  await batchRun(env, [...currentStatements, ...snapshotStatements]);
}

export async function upsertCaptains(env: Env, captains: ShowCaptainCard[]) {
  const statements = captains.map((captain) =>
    showDb(env).prepare(
      `INSERT INTO show_captains (
        card_id, name, team, overall, image_url, baked_image_url, position, ability_name, ability_description, updated_at, boosts_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(card_id) DO UPDATE SET
        name = excluded.name,
        team = excluded.team,
        overall = excluded.overall,
        image_url = excluded.image_url,
        baked_image_url = excluded.baked_image_url,
        position = excluded.position,
        ability_name = excluded.ability_name,
        ability_description = excluded.ability_description,
        updated_at = excluded.updated_at,
        boosts_json = excluded.boosts_json`,
    ).bind(
      captain.id,
      captain.name,
      captain.team,
      captain.overall,
      captain.imageUrl,
      captain.bakedImageUrl,
      captain.position,
      captain.abilityName,
      captain.abilityDescription,
      captain.updatedAt,
      JSON.stringify(captain.boosts),
    ),
  );
  await batchRun(env, statements);
}

export async function upsertAcquisitionPaths(env: Env, paths: ShowAcquisitionPath[]) {
  if (paths.length === 0) return;
  const statements = paths.map((path) =>
    showDb(env).prepare(
      `INSERT INTO show_acquisition_paths (card_id, label, source_name, source_kind, confidence)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(card_id, label) DO UPDATE SET
         source_name = excluded.source_name,
         source_kind = excluded.source_kind,
         confidence = excluded.confidence`,
    ).bind(path.cardId, path.label, path.sourceName, path.sourceKind, path.confidence),
  );
  await batchRun(env, statements);
}

export async function replaceOfficialDailyHistory(env: Env, cardId: string, points: ShowHistoryPoint[]) {
  await showDb(env).prepare(
    `DELETE FROM show_market_daily WHERE card_id = ? AND series_type IN ('official_daily', 'official_completed_orders')`,
  ).bind(cardId).run();

  const statements = points.map((point) =>
    showDb(env).prepare(
      `INSERT OR IGNORE INTO show_market_daily (
        card_id, label, captured_at, best_buy_now, best_sell_now, last_sale_price, spread, listing_count, series_type, source_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      point.cardId,
      point.label,
      point.capturedAt,
      point.bestBuyNow,
      point.bestSellNow,
      point.lastSalePrice,
      point.spread,
      point.listingCount,
      point.seriesType,
      point.sourceName,
    ),
  );
  await batchRun(env, statements);
}

export async function rebuildCollections(env: Env) {
  const { results } = await showDb(env).prepare(
    `SELECT
      c.card_id,
      c.series,
      c.set_name,
      c.locations_json,
      mc.best_sell_now
    FROM show_cards c
    LEFT JOIN show_market_current mc ON mc.card_id = c.card_id`,
  ).all<{
    card_id: string;
    series: string;
    set_name: string | null;
    locations_json: string;
    best_sell_now: number | null;
  }>();

  const collections = new Map<
    string,
    { id: string; name: string; type: ShowCollectionSummary['type']; cardIds: Set<string>; prices: number[] }
  >();

  const addCollection = (type: ShowCollectionSummary['type'], name: string | null | undefined, cardId: string, price: number | null) => {
    const normalized = name?.trim();
    if (!normalized) return;
    const id = collectionId(type, normalized);
    const existing = collections.get(id) ?? { id, name: normalized, type, cardIds: new Set<string>(), prices: [] };
    existing.cardIds.add(cardId);
    if (price !== null) existing.prices.push(price);
    collections.set(id, existing);
  };

  for (const row of results) {
    addCollection('series', row.series, row.card_id, row.best_sell_now);
    addCollection('set', row.set_name, row.card_id, row.best_sell_now);
    const locations = parseJson<string[]>(row.locations_json, []);
    for (const location of locations) {
      addCollection('location', location, row.card_id, row.best_sell_now);
    }
  }

  await showDb(env).prepare('DELETE FROM show_collection_cards').run();
  await showDb(env).prepare('DELETE FROM show_collections').run();

  const collectionStatements: D1PreparedStatement[] = [];
  const mappingStatements: D1PreparedStatement[] = [];

  for (const collection of collections.values()) {
    const sortedPrices = collection.prices.sort((a, b) => a - b);
    collectionStatements.push(
      showDb(env).prepare(
        `INSERT INTO show_collections (collection_id, name, type, card_count, low_stub_cost, high_stub_cost, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      ).bind(
        collection.id,
        collection.name,
        collection.type,
        collection.cardIds.size,
        sortedPrices[0] ?? null,
        sortedPrices.at(-1) ?? null,
      ),
    );

    for (const cardId of collection.cardIds) {
      mappingStatements.push(
        showDb(env).prepare(
          `INSERT INTO show_collection_cards (collection_id, card_id, source_name) VALUES (?, ?, ?)`,
        ).bind(collection.id, cardId, 'bsi-derived'),
      );
    }
  }

  await batchRun(env, [...collectionStatements, ...mappingStatements]);
}

export async function listCollections(env: Env, limit = 24) {
  const { results } = await showDb(env).prepare(
    `SELECT collection_id, name, type, card_count, low_stub_cost, high_stub_cost
     FROM show_collections
     ORDER BY card_count DESC, name ASC
     LIMIT ?`,
  ).bind(limit).all<ShowCollectionRow>();

  return results.map(deserializeCollection);
}

export async function getCollectionDetailFromDb(
  env: Env,
  collectionIdValue: string,
  searchParams: URLSearchParams,
): Promise<ShowCollectionDetail | null> {
  const collectionRow = await showDb(env).prepare(
    `SELECT collection_id, name, type, card_count, low_stub_cost, high_stub_cost
     FROM show_collections
     WHERE collection_id = ?`,
  ).bind(collectionIdValue).first<ShowCollectionRow>();

  if (!collectionRow) return null;

  const page = Math.max(Number(searchParams.get('page') || 1), 1);
  const perPage = Math.min(Math.max(Number(searchParams.get('limit') || 24), 1), 60);
  const offset = (page - 1) * perPage;
  const search = searchParams.get('search')?.trim();
  const wbcOnly = searchParams.get('wbc_only') === 'true';
  const sort = searchParams.get('sort') || 'sell_desc';

  const where = ['scc.collection_id = ?'];
  const binds: D1Value[] = [collectionIdValue];

  if (search) {
    where.push('(c.name LIKE ? OR c.team LIKE ? OR c.team_short_name LIKE ? OR c.series LIKE ? OR COALESCE(c.set_name, \'\') LIKE ?)');
    for (let index = 0; index < 5; index += 1) binds.push(`%${search}%`);
  }

  if (wbcOnly) {
    where.push(`(
      UPPER(c.series) LIKE '%WBC%' OR
      UPPER(COALESCE(c.set_name, '')) LIKE '%WBC%' OR
      UPPER(c.locations_json) LIKE '%WBC%' OR
      UPPER(c.locations_json) LIKE '%WORLD BASEBALL CLASSIC%'
    )`);
  }

  const orderBy =
    sort === 'buy_desc'
      ? 'mc.best_buy_now DESC NULLS LAST, c.overall DESC'
      : sort === 'ovr_desc'
        ? 'c.overall DESC, mc.best_sell_now DESC NULLS LAST'
        : sort === 'name_asc'
          ? 'c.name ASC'
          : 'mc.best_sell_now DESC NULLS LAST, c.overall DESC';

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const fromSql = `FROM show_collection_cards scc
    INNER JOIN show_cards c ON c.card_id = scc.card_id
    LEFT JOIN show_market_current mc ON mc.card_id = c.card_id
    LEFT JOIN show_captains scp ON scp.card_id = c.card_id`;

  const countRow = await showDb(env).prepare(
    `SELECT COUNT(*) as count ${fromSql} ${whereSql}`,
  ).bind(...binds).first<{ count: number }>();

  const { results } = await showDb(env).prepare(
    `SELECT
      c.*,
      mc.best_buy_now,
      mc.best_sell_now,
      mc.last_sale_price,
      mc.mid_price,
      mc.spread,
      mc.listing_count,
      mc.source_kind as market_source_kind,
      mc.source_name as market_source_name,
      mc.captured_at as market_captured_at,
      CASE WHEN scp.card_id IS NULL THEN 0 ELSE 1 END AS is_captain
     ${fromSql}
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
  ).bind(...binds, perPage, offset).all<Record<string, unknown>>();

  const cards = results.map((row) => {
    const card = deserializeCard(row as unknown as ShowCardRow);
    const market =
      row.market_captured_at
        ? deserializeMarket({
            card_id: card.id,
            best_buy_now: row.best_buy_now as number | null,
            best_sell_now: row.best_sell_now as number | null,
            last_sale_price: row.last_sale_price as number | null,
            mid_price: row.mid_price as number | null,
            spread: row.spread as number | null,
            listing_count: row.listing_count as number | null,
            source_kind: (row.market_source_kind as ShowMarketCurrent['sourceKind']) || card.sourceKind,
            source_name: (row.market_source_name as string) || card.sourceName,
            captured_at: row.market_captured_at as string,
          })
        : null;
    return {
      ...card,
      market,
      isCaptain: Number(row.is_captain ?? 0) === 1,
    };
  });

  const totalCards = countRow?.count ?? 0;
  return {
    collection: deserializeCollection(collectionRow),
    cards,
    page,
    perPage,
    totalCards,
    totalPages: Math.max(Math.ceil(totalCards / perPage), 1),
  };
}

export async function listCaptains(env: Env, limit = 16) {
  const { results } = await showDb(env).prepare(
    `SELECT card_id, name, team, overall, image_url, baked_image_url, position, ability_name, ability_description, updated_at, boosts_json
     FROM show_captains
     ORDER BY overall DESC, name ASC
     LIMIT ?`,
  ).bind(limit).all<ShowCaptainRow>();

  return results.map(deserializeCaptain);
}

export async function listWatchEvents(
  env: Env,
  searchParams: URLSearchParams,
): Promise<ShowWatchEvent[]> {
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 12), 1), 50);
  const singleCardId = searchParams.get('card_id')?.trim();
  const multipleCardIds = (searchParams.get('card_ids') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const cardIds = singleCardId ? [singleCardId] : multipleCardIds;

  const where: string[] = [];
  const binds: D1Value[] = [];

  if (cardIds.length === 1) {
    where.push('swe.card_id = ?');
    binds.push(cardIds[0]);
  } else if (cardIds.length > 1) {
    where.push(`swe.card_id IN (${cardIds.map(() => '?').join(', ')})`);
    binds.push(...cardIds);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { results } = await showDb(env).prepare(
    `SELECT
      swe.event_id,
      swe.card_id,
      c.name as card_name,
      c.image_url,
      c.overall,
      c.team,
      c.rarity,
      swe.event_type,
      swe.event_label,
      swe.previous_value,
      swe.current_value,
      swe.delta_value,
      swe.triggered_at,
      swe.details_json
     FROM show_watch_events swe
     INNER JOIN show_cards c ON c.card_id = swe.card_id
     ${whereSql}
     ORDER BY swe.triggered_at DESC
     LIMIT ?`,
  ).bind(...binds, limit).all<ShowWatchEventRow>();

  return results.map(deserializeWatchEvent);
}

export async function getCardFromDb(env: Env, cardId: string): Promise<ShowCardSummary | null> {
  const row = await showDb(env).prepare(
    `SELECT * FROM show_cards WHERE card_id = ?`,
  ).bind(cardId).first<ShowCardRow>();
  return row ? deserializeCard(row) : null;
}

export async function getCurrentMarketFromDb(env: Env, cardId: string): Promise<ShowMarketCurrent | null> {
  const row = await showDb(env).prepare(
    `SELECT * FROM show_market_current WHERE card_id = ?`,
  ).bind(cardId).first<ShowMarketRow>();
  return row ? deserializeMarket(row) : null;
}

export async function getCardDetailFromDb(env: Env, cardId: string, sourceStatus: ShowSourceStatus): Promise<ShowCardDetail | null> {
  const card = await getCardFromDb(env, cardId);
  if (!card) return null;

  const [marketRow, captainRow, acquisitionRows, collectionRows, historyRows] = await Promise.all([
    showDb(env).prepare(`SELECT * FROM show_market_current WHERE card_id = ?`).bind(cardId).first<ShowMarketRow>(),
    showDb(env).prepare(`SELECT * FROM show_captains WHERE card_id = ?`).bind(cardId).first<ShowCaptainRow>(),
    showDb(env).prepare(
      `SELECT card_id, label, source_name, source_kind, confidence FROM show_acquisition_paths WHERE card_id = ? ORDER BY label ASC`,
    ).bind(cardId).all<{
      card_id: string;
      label: string;
      source_name: string;
      source_kind: ShowAcquisitionPath['sourceKind'];
      confidence: ShowAcquisitionPath['confidence'];
    }>(),
    showDb(env).prepare(
      `SELECT sc.collection_id, sc.name, sc.type, sc.card_count, sc.low_stub_cost, sc.high_stub_cost
       FROM show_collection_cards scc
       INNER JOIN show_collections sc ON sc.collection_id = scc.collection_id
       WHERE scc.card_id = ?
       ORDER BY sc.type ASC, sc.card_count DESC, sc.name ASC
       LIMIT 12`,
    ).bind(cardId).all<ShowCollectionRow>(),
    showDb(env).prepare(
      `SELECT card_id, label, captured_at, best_buy_now, best_sell_now, last_sale_price, spread, listing_count, series_type, source_name
       FROM show_market_daily
       WHERE card_id = ?
       ORDER BY captured_at DESC
       LIMIT 20`,
    ).bind(cardId).all<{
      card_id: string;
      label: string;
      captured_at: string;
      best_buy_now: number | null;
      best_sell_now: number | null;
      last_sale_price: number | null;
      spread: number | null;
      listing_count: number | null;
      series_type: ShowHistoryPoint['seriesType'];
      source_name: string;
    }>(),
  ]);

  return {
    card,
    market: marketRow ? deserializeMarket(marketRow) : null,
    captain: captainRow ? deserializeCaptain(captainRow) : null,
    acquisitionPaths: acquisitionRows.results.map((row) => ({
      cardId: row.card_id,
      label: row.label,
      sourceName: row.source_name,
      sourceKind: row.source_kind,
      confidence: row.confidence,
    })),
    collections: collectionRows.results.map(deserializeCollection),
    historyPreview: historyRows.results.map((row) => ({
      cardId: row.card_id,
      label: row.label,
      capturedAt: row.captured_at,
      bestBuyNow: row.best_buy_now,
      bestSellNow: row.best_sell_now,
      lastSalePrice: row.last_sale_price,
      spread: row.spread,
      listingCount: row.listing_count,
      seriesType: row.series_type,
      sourceName: row.source_name,
    })),
    sourceStatus,
  };
}

export async function queryCardsFromDb(
  env: Env,
  searchParams: URLSearchParams,
): Promise<{
  cards: Array<ShowCardSummary & { market: ShowMarketCurrent | null }>;
  page: number;
  perPage: number;
  totalCards: number;
  totalPages: number;
}> {
  const page = Math.max(Number(searchParams.get('page') || 1), 1);
  const perPage = Math.min(Math.max(Number(searchParams.get('limit') || 24), 1), 60);
  const offset = (page - 1) * perPage;

  const where: string[] = [];
  const binds: D1Value[] = [];
  let joins = '';

  const search = searchParams.get('search')?.trim();
  if (search) {
    where.push('(c.name LIKE ? OR c.team LIKE ? OR c.team_short_name LIKE ? OR c.series LIKE ? OR COALESCE(c.set_name, \'\') LIKE ?)');
    for (let index = 0; index < 5; index += 1) binds.push(`%${search}%`);
  }

  const team = searchParams.get('team')?.trim();
  if (team) {
    where.push('c.team = ?');
    binds.push(team);
  }

  const series = searchParams.get('series')?.trim();
  if (series) {
    where.push('c.series = ?');
    binds.push(series);
  }

  const rarity = searchParams.get('rarity')?.trim();
  if (rarity) {
    where.push('c.rarity = ?');
    binds.push(rarity);
  }

  const bats = searchParams.get('bats')?.trim();
  if (bats) {
    where.push('c.bats = ?');
    binds.push(bats);
  }

  const position = searchParams.get('position')?.trim();
  if (position) {
    where.push('(c.primary_position = ? OR c.secondary_positions_json LIKE ?)');
    binds.push(position, `%${position}%`);
  }

  const marketStatus = searchParams.get('market_status')?.trim();
  if (marketStatus === 'listed') {
    where.push('mc.best_sell_now IS NOT NULL');
  } else if (marketStatus === 'non_sellable') {
    where.push('c.is_sellable = 0');
  } else if (marketStatus === 'sellable') {
    where.push('c.is_sellable = 1');
  }

  const captain = searchParams.get('captain')?.trim();
  if (captain === 'true') {
    joins += ' INNER JOIN show_captains filter_captain ON filter_captain.card_id = c.card_id ';
  }

  const captainCardId = searchParams.get('captain_card_id')?.trim();
  if (captainCardId) {
    const captainRow = await showDb(env).prepare('SELECT team FROM show_captains WHERE card_id = ?').bind(captainCardId).first<{ team: string }>();
    if (captainRow?.team) {
      where.push('c.team = ?');
      binds.push(captainRow.team);
    }
  }

  const collectionIdFilter = searchParams.get('collection')?.trim();
  if (collectionIdFilter) {
    joins += ' INNER JOIN show_collection_cards scc_filter ON scc_filter.card_id = c.card_id ';
    where.push('scc_filter.collection_id = ?');
    binds.push(collectionIdFilter);
  }

  if (searchParams.get('wbc_only') === 'true') {
    where.push(`(
      UPPER(c.series) LIKE '%WBC%' OR
      UPPER(COALESCE(c.set_name, '')) LIKE '%WBC%' OR
      UPPER(c.locations_json) LIKE '%WBC%' OR
      UPPER(c.locations_json) LIKE '%WORLD BASEBALL CLASSIC%'
    )`);
  }

  const sort = searchParams.get('sort') || 'sell_desc';
  const orderBy =
    sort === 'buy_desc'
      ? 'mc.best_buy_now DESC NULLS LAST, c.overall DESC'
      : sort === 'ovr_desc'
        ? 'c.overall DESC, mc.best_sell_now DESC NULLS LAST'
        : sort === 'name_asc'
          ? 'c.name ASC'
          : sort === 'newest'
            ? 'c.source_updated_at DESC'
            : 'mc.best_sell_now DESC NULLS LAST, c.overall DESC';

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const fromSql = `FROM show_cards c LEFT JOIN show_market_current mc ON mc.card_id = c.card_id ${joins}`;

  const countRow = await showDb(env).prepare(
    `SELECT COUNT(DISTINCT c.card_id) as count ${fromSql} ${whereSql}`,
  ).bind(...binds).first<{ count: number }>();

  const { results } = await showDb(env).prepare(
    `SELECT
      c.*,
      mc.best_buy_now,
      mc.best_sell_now,
      mc.last_sale_price,
      mc.mid_price,
      mc.spread,
      mc.listing_count,
      mc.source_kind as market_source_kind,
      mc.source_name as market_source_name,
      mc.captured_at as market_captured_at
     ${fromSql}
     ${whereSql}
     GROUP BY c.card_id
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
  ).bind(...binds, perPage, offset).all<Record<string, unknown>>();

  const cards = results.map((row) => {
    const card = deserializeCard(row as unknown as ShowCardRow);
    const market =
      row.market_captured_at
        ? deserializeMarket({
            card_id: card.id,
            best_buy_now: row.best_buy_now as number | null,
            best_sell_now: row.best_sell_now as number | null,
            last_sale_price: row.last_sale_price as number | null,
            mid_price: row.mid_price as number | null,
            spread: row.spread as number | null,
            listing_count: row.listing_count as number | null,
            source_kind: (row.market_source_kind as ShowMarketCurrent['sourceKind']) || card.sourceKind,
            source_name: (row.market_source_name as string) || card.sourceName,
            captured_at: row.market_captured_at as string,
          })
        : null;
    return { ...card, market };
  });

  const totalCards = countRow?.count ?? 0;
  return {
    cards,
    page,
    perPage,
    totalCards,
    totalPages: Math.max(Math.ceil(totalCards / perPage), 1),
  };
}

export async function getHistoryFromDb(
  env: Env,
  cardId: string,
  range: '24h' | '7d' | '30d' | 'all',
): Promise<ShowHistoryPoint[]> {
  const rangeClause =
    range === '24h'
      ? `AND captured_at >= datetime('now', '-1 day')`
      : range === '7d'
        ? `AND captured_at >= datetime('now', '-7 day')`
        : range === '30d'
          ? `AND captured_at >= datetime('now', '-30 day')`
          : '';

  const { results: snapshots } = await showDb(env).prepare(
    `SELECT
      card_id,
      captured_at,
      best_buy_now,
      best_sell_now,
      last_sale_price,
      spread,
      listing_count,
      source_name
     FROM show_market_snapshots
     WHERE card_id = ? ${rangeClause}
     ORDER BY captured_at DESC
     LIMIT 720`,
  ).bind(cardId).all<{
    card_id: string;
    captured_at: string;
    best_buy_now: number | null;
    best_sell_now: number | null;
    last_sale_price: number | null;
    spread: number | null;
    listing_count: number | null;
    source_name: string;
  }>();

  const { results: daily } = await showDb(env).prepare(
    `SELECT
      card_id,
      label,
      captured_at,
      best_buy_now,
      best_sell_now,
      last_sale_price,
      spread,
      listing_count,
      series_type,
      source_name
     FROM show_market_daily
     WHERE card_id = ?
     ORDER BY captured_at DESC
     LIMIT 180`,
  ).bind(cardId).all<{
    card_id: string;
    label: string;
    captured_at: string;
    best_buy_now: number | null;
    best_sell_now: number | null;
    last_sale_price: number | null;
    spread: number | null;
    listing_count: number | null;
    series_type: ShowHistoryPoint['seriesType'];
    source_name: string;
  }>();

  const intraday = snapshots.map((row) => ({
    cardId: row.card_id,
    label: row.captured_at,
    capturedAt: row.captured_at,
    bestBuyNow: row.best_buy_now,
    bestSellNow: row.best_sell_now,
    lastSalePrice: row.last_sale_price,
    spread: row.spread,
    listingCount: row.listing_count,
    seriesType: 'bsi_intraday' as const,
    sourceName: row.source_name,
  }));

  const official = daily.map((row) => ({
    cardId: row.card_id,
    label: row.label,
    capturedAt: row.captured_at,
    bestBuyNow: row.best_buy_now,
    bestSellNow: row.best_sell_now,
    lastSalePrice: row.last_sale_price,
    spread: row.spread,
    listingCount: row.listing_count,
    seriesType: row.series_type,
    sourceName: row.source_name,
  }));

  return [...official, ...intraday].sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
}

export async function getOverviewFromDb(env: Env, sourceStatus: ShowSourceStatus): Promise<ShowMarketOverview> {
  const [countsRow, topSellRows, topBuyRows, captainRows, newestRows] = await Promise.all([
    showDb(env).prepare(
      `SELECT
         COUNT(*) as total_cards,
         SUM(CASE WHEN is_sellable = 1 THEN 1 ELSE 0 END) as sellable_cards
       FROM show_cards`,
    ).first<{ total_cards: number; sellable_cards: number }>(),
    showDb(env).prepare(
      `SELECT c.*, mc.best_buy_now, mc.best_sell_now, mc.last_sale_price, mc.mid_price, mc.spread, mc.listing_count, mc.source_kind as market_source_kind, mc.source_name as market_source_name, mc.captured_at as market_captured_at
       FROM show_cards c
       INNER JOIN show_market_current mc ON mc.card_id = c.card_id
       WHERE mc.best_sell_now IS NOT NULL
       ORDER BY mc.best_sell_now DESC
       LIMIT 8`,
    ).all<Record<string, unknown>>(),
    showDb(env).prepare(
      `SELECT c.*, mc.best_buy_now, mc.best_sell_now, mc.last_sale_price, mc.mid_price, mc.spread, mc.listing_count, mc.source_kind as market_source_kind, mc.source_name as market_source_name, mc.captured_at as market_captured_at
       FROM show_cards c
       INNER JOIN show_market_current mc ON mc.card_id = c.card_id
       WHERE mc.best_buy_now IS NOT NULL
       ORDER BY mc.best_buy_now DESC
       LIMIT 8`,
    ).all<Record<string, unknown>>(),
    showDb(env).prepare(
      `SELECT card_id, name, team, overall, image_url, baked_image_url, position, ability_name, ability_description, updated_at, boosts_json
       FROM show_captains
       ORDER BY overall DESC
       LIMIT 6`,
    ).all<ShowCaptainRow>(),
    showDb(env).prepare(
      `SELECT * FROM show_cards ORDER BY source_updated_at DESC LIMIT 8`,
    ).all<ShowCardRow>(),
  ]);

  const mapMarketRow = (row: Record<string, unknown>) => {
    const card = deserializeCard(row as unknown as ShowCardRow);
    const market = deserializeMarket({
      card_id: card.id,
      best_buy_now: row.best_buy_now as number | null,
      best_sell_now: row.best_sell_now as number | null,
      last_sale_price: row.last_sale_price as number | null,
      mid_price: row.mid_price as number | null,
      spread: row.spread as number | null,
      listing_count: row.listing_count as number | null,
      source_kind: row.market_source_kind as ShowMarketCurrent['sourceKind'],
      source_name: row.market_source_name as string,
      captured_at: row.market_captured_at as string,
    });
    return { ...card, market };
  };

  return {
    totalCards: countsRow?.total_cards ?? 0,
    sellableCards: countsRow?.sellable_cards ?? 0,
    compatibilityMode: sourceStatus.compatibilityMode,
    topBuyNow: topBuyRows.results.map(mapMarketRow),
    topSellNow: topSellRows.results.map(mapMarketRow),
    captainSpotlight: captainRows.results.map(deserializeCaptain),
    newlyTracked: newestRows.results.map(deserializeCard),
  };
}

export async function saveBuild(env: Env, build: DDBuildRecord) {
  await showDb(env).prepare(
    `INSERT INTO show_builds (
      build_id, title, season_label, captain_card_id, cards_json, summary_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(build_id) DO UPDATE SET
      title = excluded.title,
      season_label = excluded.season_label,
      captain_card_id = excluded.captain_card_id,
      cards_json = excluded.cards_json,
      summary_json = excluded.summary_json,
      updated_at = excluded.updated_at`,
  ).bind(
    build.buildId,
    build.title,
    build.seasonLabel,
    build.captainCardId,
    JSON.stringify(build.cards),
    JSON.stringify(build.summary),
    build.createdAt,
    build.updatedAt,
  ).run();
}

export async function getBuild(env: Env, buildId: string): Promise<DDBuildRecord | null> {
  const row = await showDb(env).prepare(
    `SELECT build_id, title, season_label, captain_card_id, cards_json, summary_json, created_at, updated_at
     FROM show_builds WHERE build_id = ?`,
  ).bind(buildId).first<ShowBuildRow>();

  return row ? deserializeBuild(row) : null;
}

export function makeBuildId() {
  return slugify(crypto.randomUUID());
}
