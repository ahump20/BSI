import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockEnv } from '../utils/mocks';
import { fetchShowItemPageHistory } from '../../workers/shared/mlb-the-show-source';
import { handleShowBuildCreate, handleShowCards } from '../../workers/handlers/mlb-the-show';

const ITEM_HTML = `
  <html>
    <body>
      <canvas id="item-trends"></canvas>
      <script>
        var chart = new Chart(document.getElementById("item-trends"), {
          "type":"line",
          "data":{
            "datasets":[
              {"label":"Best Sell","data":[21000,22000,21500]},
              {"label":"Best Buy","data":[18000,19000,18500]}
            ],
            "labels":["2026-03-08","2026-03-09","2026-03-10"]
          }
        });
      </script>
      <table id='table-completed-orders'>
        <tbody>
          <tr><td>21,500</td><td>2026-03-10 18:30</td></tr>
          <tr><td>21,250</td><td>2026-03-10 17:05</td></tr>
        </tbody>
      </table>
    </body>
  </html>
`;

function mockShowFetch() {
  globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes('/apis/listings.json')) {
      return new Response(
        JSON.stringify({
          listings: [
            {
              listing_name: 'Aaron Judge',
              best_sell_price: 32000,
              best_buy_price: 28500,
              item: {
                uuid: 'judge',
                img: 'https://example.com/judge.png',
                baked_img: null,
                name: 'Aaron Judge',
                rarity: 'Diamond',
                team: 'Yankees',
                team_short_name: 'NYY',
                ovr: 99,
                series: 'Live Series',
                series_year: 2026,
                display_position: 'RF',
                display_secondary_positions: 'CF,LF',
                bat_hand: 'R',
                throw_hand: 'R',
                born: 'Linden, California',
                is_hitter: true,
                has_augment: false,
                augment_text: null,
                set_name: 'Live',
                is_live_set: true,
                is_sellable: true,
                locations: ['Marketplace'],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/apis/captains.json')) {
      return new Response(JSON.stringify({ captains: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/items/')) {
      return new Response(ITEM_HTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('not found', { status: 404 });
  }) as unknown as typeof fetch;
}

describe('MLB The Show Diamond Dynasty worker paths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses official item-page history into daily and completed-order points', async () => {
    mockShowFetch();
    const env = createMockEnv();

    const history = await fetchShowItemPageHistory(env as never, 'judge');

    expect(history.dailyPoints).toHaveLength(3);
    expect(history.dailyPoints[0]?.bestSellNow).toBe(21000);
    expect(history.dailyPoints[0]?.bestBuyNow).toBe(18000);
    expect(history.completedOrders).toHaveLength(2);
    expect(history.completedOrders[0]?.lastSalePrice).toBe(21500);
  });

  it('serves a fallback compatibility-mode card catalog when D1 is empty', async () => {
    mockShowFetch();
    const env = createMockEnv();

    const response = await handleShowCards(
      new URL('https://blazesportsintel.com/api/mlb/the-show-26/cards?search=Judge'),
      env as never,
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      cards: Array<{ id: string; name: string }>;
      totalCards: number;
      meta: { degraded?: boolean; partial_catalog?: boolean };
    };

    expect(payload.cards).toHaveLength(1);
    expect(payload.cards[0]?.name).toBe('Aaron Judge');
    expect(payload.totalCards).toBe(1);
    expect(payload.meta.degraded).toBe(true);
    expect(payload.meta.partial_catalog).toBe(true);
  });

  it('creates a shareable build record with computed summary', async () => {
    const env = createMockEnv();
    const request = new Request('https://blazesportsintel.com/api/mlb/the-show-26/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Judge stack',
        captainCardId: null,
        cards: [
          {
            slotId: 'rf',
            cardId: 'judge',
            displayName: 'Aaron Judge',
            team: 'Yankees',
            primaryPosition: 'RF',
            secondaryPositions: ['CF'],
            overall: 99,
            bats: 'R',
            bestSellNow: 32000,
            rarity: 'Diamond',
            series: 'Live Series',
            themeTag: 'Yankees',
            localParallelLevel: 2,
            localParallelModLabel: 'Power Focus',
          },
        ],
      }),
    });

    const response = await handleShowBuildCreate(request, env as never);
    expect(response.status).toBe(201);

    const payload = (await response.json()) as {
      build: {
        title: string;
        summary: { totalStubCost: number; averageOverall: number; themeTeams: string[] };
      };
    };

    expect(payload.build.title).toBe('Judge stack');
    expect(payload.build.summary.totalStubCost).toBe(32000);
    expect(payload.build.summary.averageOverall).toBe(99);
    expect(payload.build.summary.themeTeams).toContain('Yankees');
  });
});
