import type { Env } from '../shared/types';
import {
  cacheKeyForShow,
  fetchShowCaptains,
  fetchShowCardsPage,
  fetchShowListingsPage,
  getShowSourceStatus,
  normalizeAcquisitionPaths,
} from '../shared/mlb-the-show-source';
import {
  rebuildCollections,
  upsertAcquisitionPaths,
  upsertCaptains,
  upsertCardAttributeSnapshots,
  upsertCards,
  upsertMarketData,
} from '../shared/mlb-the-show-store';

function pageCount(rawValue: string | undefined, fallback: number) {
  const parsed = Number(rawValue || fallback);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 50) : fallback;
}

async function recordRunStart(env: Env, runId: string, jobType: string, sourceName: string, startedAt: string) {
  await env.DB.prepare(
    `INSERT INTO show_ingest_runs (run_id, job_type, source_name, started_at, status)
     VALUES (?, ?, ?, ?, 'running')`,
  ).bind(runId, jobType, sourceName, startedAt).run();
}

async function recordRunFinish(
  env: Env,
  runId: string,
  status: 'success' | 'failed',
  recordsWritten: number,
  degraded: boolean,
  errorText: string | null,
  manifestKey: string | null,
) {
  await env.DB.prepare(
    `UPDATE show_ingest_runs
     SET finished_at = ?, status = ?, records_written = ?, degraded = ?, error_text = ?, payload_manifest_r2_key = ?
     WHERE run_id = ?`,
  ).bind(new Date().toISOString(), status, recordsWritten, degraded ? 1 : 0, errorText, manifestKey, runId).run();
}

async function archiveManifest(env: Env, runId: string, payload: unknown) {
  if (!env.DATA_LAKE) return null;
  const key = `mlb-the-show/sync/${new Date().toISOString().slice(0, 10)}/${runId}.json`;
  await env.DATA_LAKE.put(key, JSON.stringify(payload), {
    httpMetadata: { contentType: 'application/json' },
  });
  return key;
}

async function emitWatchEvents(
  env: Env,
  entries: Array<{ market: { cardId: string; bestSellNow: number | null; spread: number | null; capturedAt: string } }>,
) {
  const statements: D1PreparedStatement[] = [];

  for (const entry of entries) {
    const previous = await env.DB.prepare(
      `SELECT best_sell_now, spread
       FROM show_market_snapshots
       WHERE card_id = ? AND captured_at < ?
       ORDER BY captured_at DESC
       LIMIT 1`,
    ).bind(entry.market.cardId, entry.market.capturedAt).first<{ best_sell_now: number | null; spread: number | null }>();

    if (entry.market.bestSellNow !== null && previous && previous.best_sell_now !== null) {
      const previousSell = previous.best_sell_now;
      const delta = entry.market.bestSellNow - previousSell;
      if (Math.abs(delta) >= 1000) {
        statements.push(
          env.DB.prepare(
            `INSERT OR REPLACE INTO show_watch_events (
              event_id, card_id, event_type, event_label, previous_value, current_value, delta_value, triggered_at, details_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).bind(
            `${entry.market.cardId}:price:${entry.market.capturedAt}`,
            entry.market.cardId,
            delta > 0 ? 'price_surge' : 'price_drop',
            delta > 0 ? 'New price surge' : 'New price drop',
            previousSell,
            entry.market.bestSellNow,
            delta,
            entry.market.capturedAt,
            JSON.stringify({ trigger: 'delta_abs_gte_1000' }),
          ),
        );
      }
    }

    if (entry.market.spread !== null && previous && previous.spread !== null) {
      const previousSpread = previous.spread;
      const spreadDelta = entry.market.spread - previousSpread;
      if (Math.abs(spreadDelta) >= 1000) {
        statements.push(
          env.DB.prepare(
            `INSERT OR REPLACE INTO show_watch_events (
              event_id, card_id, event_type, event_label, previous_value, current_value, delta_value, triggered_at, details_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).bind(
            `${entry.market.cardId}:spread:${entry.market.capturedAt}`,
            entry.market.cardId,
            spreadDelta > 0 ? 'spread_expansion' : 'spread_compression',
            spreadDelta > 0 ? 'Spread expansion' : 'Spread compression',
            previousSpread,
            entry.market.spread,
            spreadDelta,
            entry.market.capturedAt,
            JSON.stringify({ trigger: 'spread_delta_abs_gte_1000' }),
          ),
        );
      }
    }
  }

  for (let index = 0; index < statements.length; index += 50) {
    await env.DB.batch(statements.slice(index, index + 50));
  }
}

async function runSync(env: Env, trigger: 'fetch' | 'scheduled') {
  const sourceStatus = getShowSourceStatus(env);
  const sourceName = sourceStatus.resolvedHost;
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const cardPages = pageCount(env.SHOW_SYNC_CARD_PAGES, 6);
  const listingPages = pageCount(env.SHOW_SYNC_LISTING_PAGES, 6);
  const captainPages = pageCount(env.SHOW_SYNC_CAPTAIN_PAGES, 2);

  await recordRunStart(env, runId, trigger, sourceName, startedAt);

  try {
    const cardsById = new Map<string, Awaited<ReturnType<typeof fetchShowCardsPage>>[number]>();
    const listingsById = new Map<string, Awaited<ReturnType<typeof fetchShowListingsPage>>[number]>();
    const captainsById = new Map<string, Awaited<ReturnType<typeof fetchShowCaptains>>[number]>();

    for (let page = 1; page <= cardPages; page += 1) {
      const cards = await fetchShowCardsPage(env, page);
      for (const card of cards) cardsById.set(card.id, card);
    }

    for (let page = 1; page <= listingPages; page += 1) {
      const listings = await fetchShowListingsPage(env, page);
      for (const listing of listings) {
        cardsById.set(listing.id, listing);
        listingsById.set(listing.id, listing);
      }
    }

    for (let page = 1; page <= captainPages; page += 1) {
      const captains = await fetchShowCaptains(env, page);
      if (captains.length === 0) break;
      for (const captain of captains) captainsById.set(captain.id, captain);
    }

    const cards = [...cardsById.values()];
    const listings = [...listingsById.values()];
    const captains = [...captainsById.values()];

    await upsertCards(env, cards);
    await upsertCardAttributeSnapshots(env, cards);
    await upsertMarketData(
      env,
      listings.map((listing) => ({ card: listing, market: listing.market })),
      runId,
    );
    await upsertCaptains(env, captains);
    await upsertAcquisitionPaths(env, cards.flatMap((card) => normalizeAcquisitionPaths(card)));
    await rebuildCollections(env);
    await emitWatchEvents(
      env,
      listings.map((listing) => ({
        market: {
          cardId: listing.market.cardId,
          bestSellNow: listing.market.bestSellNow,
          spread: listing.market.spread,
          capturedAt: listing.market.capturedAt,
        },
      })),
    );

    const manifestKey = await archiveManifest(env, runId, {
      runId,
      startedAt,
      sourceStatus,
      counts: {
        cards: cards.length,
        listings: listings.length,
        captains: captains.length,
      },
      pages: {
        cardPages,
        listingPages,
        captainPages,
      },
      cacheKeys: {
        overview: cacheKeyForShow('overview'),
      },
    });

    await recordRunFinish(
      env,
      runId,
      'success',
      cards.length + listings.length + captains.length,
      sourceStatus.compatibilityMode,
      null,
      manifestKey,
    );

    return {
      ok: true,
      runId,
      sourceStatus,
      counts: {
        cards: cards.length,
        listings: listings.length,
        captains: captains.length,
      },
      manifestKey,
    };
  } catch (error) {
    await recordRunFinish(
      env,
      runId,
      'failed',
      0,
      true,
      error instanceof Error ? error.message : 'Unknown sync error',
      null,
    );

    return {
      ok: false,
      runId,
      sourceStatus,
      error: error instanceof Error ? error.message : 'Unknown sync error',
    };
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        worker: 'bsi-show-dd-sync',
        timestamp: new Date().toISOString(),
        sourceStatus: getShowSourceStatus(env),
      });
    }

    if (url.pathname === '/sync') {
      const result = await runSync(env, 'fetch');
      return Response.json(result, { status: result.ok ? 200 : 502 });
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(_controller: ScheduledController, env: Env) {
    await runSync(env, 'scheduled');
  },
};
