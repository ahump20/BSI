import { describe, expect, it, vi } from 'vitest';
import { createMockEnv } from '../utils/mocks';
import { handleShowCardHistory, handleShowWatchEvents } from '../../workers/handlers/mlb-the-show';

function createPrepared(sql: string) {
  return {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(async () => {
      if (sql.includes('FROM show_cards')) return { count: 1 };
      if (sql.includes('FROM show_collections')) return { count: 1 };
      if (sql.includes('FROM show_ingest_runs')) return { synced_at: '2026-03-10T12:00:00.000Z' };
      return null;
    }),
    all: vi.fn(async () => {
      if (sql.includes('FROM show_market_snapshots')) {
        return {
          results: [
            {
              card_id: 'judge',
              captured_at: '2026-03-10T12:00:00.000Z',
              best_buy_now: 19800,
              best_sell_now: 21000,
              last_sale_price: null,
              spread: 1200,
              listing_count: null,
              source_name: 'mlb25.theshow.com',
            },
            {
              card_id: 'judge',
              captured_at: '2026-03-10T13:00:00.000Z',
              best_buy_now: 20600,
              best_sell_now: 22000,
              last_sale_price: null,
              spread: 1400,
              listing_count: null,
              source_name: 'mlb25.theshow.com',
            },
          ],
        };
      }

      if (sql.includes('FROM show_market_daily')) {
        return {
          results: [
            {
              card_id: 'judge',
              label: '2026-03-09',
              captured_at: '2026-03-09T00:00:00.000Z',
              best_buy_now: 18800,
              best_sell_now: 20000,
              last_sale_price: null,
              spread: 1200,
              listing_count: null,
              series_type: 'official_daily',
              source_name: 'mlb25.theshow.com',
            },
          ],
        };
      }

      if (sql.includes('FROM show_watch_events')) {
        return {
          results: [
            {
              event_id: 'judge:price:2026-03-10T13:00:00.000Z',
              card_id: 'judge',
              card_name: 'Aaron Judge',
              image_url: 'https://example.com/judge.png',
              overall: 99,
              team: 'Yankees',
              rarity: 'Diamond',
              event_type: 'price_surge',
              event_label: 'New price surge',
              previous_value: 21000,
              current_value: 22000,
              delta_value: 1000,
              triggered_at: '2026-03-10T13:00:00.000Z',
              details_json: '{"trigger":"delta_abs_gte_1000"}',
            },
          ],
        };
      }

      return { results: [] };
    }),
    run: vi.fn(async () => ({ success: true })),
  };
}

function createShowEnv() {
  const env = createMockEnv();
  env.DB.prepare = vi.fn((sql: string) => createPrepared(sql));
  return env;
}

describe('MLB The Show Diamond Dynasty enhancements', () => {
  it('summarizes history ranges for card detail analytics', async () => {
    const env = createShowEnv();
    const response = await handleShowCardHistory(
      'judge',
      new URL('https://blazesportsintel.com/api/mlb/the-show-26/cards/judge/history?range=30d&metric=sell'),
      env as never,
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      summary: {
        sampleCount: number;
        latestValue: number | null;
        deltaValue: number | null;
        officialPoints: number;
        intradayPoints: number;
      };
    };

    expect(payload.summary.sampleCount).toBe(3);
    expect(payload.summary.latestValue).toBe(22000);
    expect(payload.summary.deltaValue).toBe(2000);
    expect(payload.summary.officialPoints).toBe(1);
    expect(payload.summary.intradayPoints).toBe(2);
  });

  it('returns recent watch events with joined card context', async () => {
    const env = createShowEnv();
    const response = await handleShowWatchEvents(
      new URL('https://blazesportsintel.com/api/mlb/the-show-26/watch-events?card_id=judge&limit=5'),
      env as never,
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      events: Array<{ cardName: string; eventLabel: string; deltaValue: number | null }>;
    };

    expect(payload.events).toHaveLength(1);
    expect(payload.events[0]?.cardName).toBe('Aaron Judge');
    expect(payload.events[0]?.eventLabel).toBe('New price surge');
    expect(payload.events[0]?.deltaValue).toBe(1000);
  });
});
