/**
 * BSI News Ticker Worker
 *
 * Real-time sports news ticker powered by:
 * - Durable Objects for state management
 * - Queues for async news ingestion
 * - WebSocket for live client updates
 *
 * Aggregates news from: ESPN, MLB API, NFL, College Baseball sources
 */

import { NewsTickerDO, TickerItem } from './durable-objects/NewsTickerDO';

export { NewsTickerDO };

interface Env {
  NEWS_TICKER: DurableObjectNamespace;
  NEWS_QUEUE: Queue;
  TICKER_CACHE: KVNamespace;
  ESPN_API_BASE: string;
  MLB_API_BASE: string;
  NFL_API_BASE: string;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route: WebSocket connection for live ticker
      if (url.pathname === '/ws' || url.pathname === '/ticker/live') {
        const upgradeHeader = request.headers.get('Upgrade');
        if (upgradeHeader !== 'websocket') {
          return jsonResponse({ error: 'Expected WebSocket upgrade' }, 426);
        }

        const id = env.NEWS_TICKER.idFromName('global-ticker');
        const stub = env.NEWS_TICKER.get(id);
        return stub.fetch(request);
      }

      // Route: Get current ticker items (REST fallback)
      if (url.pathname === '/ticker' && request.method === 'GET') {
        const id = env.NEWS_TICKER.idFromName('global-ticker');
        const stub = env.NEWS_TICKER.get(id);
        const response = await stub.fetch(new Request('http://internal/items'));
        const data = await response.json();
        return jsonResponse(data);
      }

      // Route: Push a ticker item manually (admin endpoint)
      if (url.pathname === '/ticker/push' && request.method === 'POST') {
        const item = await request.json() as Partial<TickerItem>;

        // Validate required fields
        if (!item.headline || !item.sport || !item.type) {
          return jsonResponse({ error: 'Missing required fields: headline, sport, type' }, 400);
        }

        // Build complete item with defaults
        const tickerItem: TickerItem = {
          id: item.id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: item.type,
          sport: item.sport,
          headline: item.headline,
          subtext: item.subtext,
          priority: item.priority || 2,
          timestamp: item.timestamp || Date.now(),
          ttl: item.ttl || 3600, // Default 1 hour
          source: item.source || 'Manual',
        };

        await env.NEWS_QUEUE.send(tickerItem);
        return jsonResponse({ success: true, id: tickerItem.id });
      }

      // Route: Trigger manual news refresh
      if (url.pathname === '/ticker/refresh' && (request.method === 'GET' || request.method === 'POST')) {
        const results = await fetchAllNews(env);
        return jsonResponse({
          success: true,
          message: 'News refresh triggered',
          itemsQueued: results.length,
        });
      }

      // Route: Health check
      if (url.pathname === '/health') {
        return jsonResponse({
          status: 'healthy',
          service: 'bsi-news-ticker',
          timestamp: new Date().toISOString(),
        });
      }

      // Route: API info
      if (url.pathname === '/' || url.pathname === '/api') {
        return jsonResponse({
          name: 'BSI News Ticker API',
          version: '1.0.0',
          endpoints: {
            websocket: '/ws',
            ticker: '/ticker',
            push: '/ticker/push (POST)',
            refresh: '/ticker/refresh',
            health: '/health',
          },
        });
      }

      return jsonResponse({ error: 'Not found' }, 404);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },

  // Queue consumer - processes incoming news items
  async queue(batch: MessageBatch<TickerItem>, env: Env): Promise<void> {
    const id = env.NEWS_TICKER.idFromName('global-ticker');
    const stub = env.NEWS_TICKER.get(id);

    for (const message of batch.messages) {
      try {
        await stub.fetch(new Request('http://internal/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.body),
        }));
        message.ack();
      } catch (e) {
        console.error('Queue processing error:', e);
        message.retry();
      }
    }
  },

  // Scheduled cron - runs every 5 minutes to fetch fresh news
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log(`[Cron] Running scheduled news fetch at ${new Date().toISOString()}`);
    await fetchAllNews(env);
  },
};

// Helper to create JSON responses with CORS
function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Fetch news from all sources and queue them
async function fetchAllNews(env: Env): Promise<TickerItem[]> {
  const allItems: TickerItem[] = [];

  const fetchers = [
    fetchMLBScores(env),
    fetchMLBNews(env),
    fetchNFLNews(env),
    fetchNBANews(env),
    fetchCollegeBaseballNews(env),
    fetchCollegeFootballNews(env),
  ];

  const results = await Promise.allSettled(fetchers);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      allItems.push(...result.value);
    }
  }

  // Queue all items
  for (const item of allItems) {
    try {
      await env.NEWS_QUEUE.send(item);
    } catch (e) {
      console.error('Failed to queue item:', e);
    }
  }

  return allItems;
}

// Fetch live MLB scores
async function fetchMLBScores(env: Env): Promise<TickerItem[]> {
  const items: TickerItem[] = [];

  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${env.MLB_API_BASE}/schedule?sportId=1&date=${today}&hydrate=linescore`);

    if (!res.ok) return items;

    const data = await res.json() as any;

    for (const date of data.dates || []) {
      for (const game of date.games || []) {
        const status = game.status?.abstractGameState;
        const detailedState = game.status?.detailedState;
        const away = game.teams?.away?.team?.teamName || game.teams?.away?.team?.name;
        const home = game.teams?.home?.team?.teamName || game.teams?.home?.team?.name;
        const awayScore = game.teams?.away?.score ?? 0;
        const homeScore = game.teams?.home?.score ?? 0;
        const inning = game.linescore?.currentInning;
        const inningState = game.linescore?.inningState;

        if (status === 'Live') {
          items.push({
            id: `mlb-live-${game.gamePk}`,
            type: 'score',
            sport: 'MLB',
            headline: `🔴 ${away} ${awayScore} - ${home} ${homeScore}`,
            subtext: inning ? `${inningState} ${inning}` : detailedState,
            priority: 1,
            timestamp: Date.now(),
            ttl: 180, // 3 min for live scores
            source: 'MLB',
          });
        } else if (status === 'Final') {
          const winner = awayScore > homeScore ? away : home;
          items.push({
            id: `mlb-final-${game.gamePk}`,
            type: 'score',
            sport: 'MLB',
            headline: `FINAL: ${away} ${awayScore} - ${home} ${homeScore}`,
            subtext: `${winner} wins`,
            priority: 2,
            timestamp: Date.now(),
            ttl: 1800, // 30 min for final scores
            source: 'MLB',
          });
        }
      }
    }
  } catch (e) {
    console.error('MLB scores fetch error:', e);
  }

  return items;
}

// Fetch MLB news headlines
async function fetchMLBNews(env: Env): Promise<TickerItem[]> {
  const items: TickerItem[] = [];

  try {
    const res = await fetch(`${env.ESPN_API_BASE}/baseball/mlb/news?limit=5`);
    if (!res.ok) return items;

    const data = await res.json() as any;

    for (const article of data.articles?.slice(0, 5) || []) {
      items.push({
        id: `espn-mlb-${article.dataSourceIdentifier || Date.now()}`,
        type: 'news',
        sport: 'MLB',
        headline: article.headline,
        subtext: article.description?.substring(0, 100),
        priority: 2,
        timestamp: Date.now(),
        ttl: 3600,
        source: 'ESPN',
      });
    }
  } catch (e) {
    console.error('MLB news fetch error:', e);
  }

  return items;
}

// Fetch NFL news
async function fetchNFLNews(env: Env): Promise<TickerItem[]> {
  const items: TickerItem[] = [];

  try {
    const res = await fetch(`${env.ESPN_API_BASE}/football/nfl/news?limit=5`);
    if (!res.ok) return items;

    const data = await res.json() as any;

    for (const article of data.articles?.slice(0, 5) || []) {
      // Check if it's breaking/important news
      const isBreaking = article.headline?.toLowerCase().includes('breaking') ||
                         article.headline?.toLowerCase().includes('trade') ||
                         article.headline?.toLowerCase().includes('injury');

      items.push({
        id: `espn-nfl-${article.dataSourceIdentifier || Date.now()}`,
        type: isBreaking ? 'alert' : 'news',
        sport: 'NFL',
        headline: article.headline,
        subtext: article.description?.substring(0, 100),
        priority: isBreaking ? 1 : 2,
        timestamp: Date.now(),
        ttl: 3600,
        source: 'ESPN',
      });
    }
  } catch (e) {
    console.error('NFL news fetch error:', e);
  }

  return items;
}

// Fetch NBA news
async function fetchNBANews(env: Env): Promise<TickerItem[]> {
  const items: TickerItem[] = [];

  try {
    const res = await fetch(`${env.ESPN_API_BASE}/basketball/nba/news?limit=3`);
    if (!res.ok) return items;

    const data = await res.json() as any;

    for (const article of data.articles?.slice(0, 3) || []) {
      items.push({
        id: `espn-nba-${article.dataSourceIdentifier || Date.now()}`,
        type: 'news',
        sport: 'NBA',
        headline: article.headline,
        subtext: article.description?.substring(0, 100),
        priority: 3,
        timestamp: Date.now(),
        ttl: 3600,
        source: 'ESPN',
      });
    }
  } catch (e) {
    console.error('NBA news fetch error:', e);
  }

  return items;
}

// Fetch College Baseball news
async function fetchCollegeBaseballNews(env: Env): Promise<TickerItem[]> {
  const items: TickerItem[] = [];

  try {
    const res = await fetch(`${env.ESPN_API_BASE}/baseball/college-baseball/news?limit=5`);
    if (!res.ok) return items;

    const data = await res.json() as any;

    for (const article of data.articles?.slice(0, 5) || []) {
      items.push({
        id: `espn-cbb-${article.dataSourceIdentifier || Date.now()}`,
        type: 'news',
        sport: 'COLLEGE_BASEBALL',
        headline: article.headline,
        subtext: article.description?.substring(0, 100),
        priority: 2,
        timestamp: Date.now(),
        ttl: 3600,
        source: 'ESPN',
      });
    }
  } catch (e) {
    console.error('College baseball news fetch error:', e);
  }

  return items;
}

// Fetch College Football news
async function fetchCollegeFootballNews(env: Env): Promise<TickerItem[]> {
  const items: TickerItem[] = [];

  try {
    const res = await fetch(`${env.ESPN_API_BASE}/football/college-football/news?limit=3`);
    if (!res.ok) return items;

    const data = await res.json() as any;

    for (const article of data.articles?.slice(0, 3) || []) {
      items.push({
        id: `espn-cfb-${article.dataSourceIdentifier || Date.now()}`,
        type: 'news',
        sport: 'CFB',
        headline: article.headline,
        subtext: article.description?.substring(0, 100),
        priority: 3,
        timestamp: Date.now(),
        ttl: 3600,
        source: 'ESPN',
      });
    }
  } catch (e) {
    console.error('College football news fetch error:', e);
  }

  return items;
}
