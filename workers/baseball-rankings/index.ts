/**
 * Baseball Rankings Worker
 *
 * Fetches the latest Top 25 rankings JSON, renders an HTML table, and
 * responds to requests for `/baseball/rankings`.
 */

const DEFAULT_RANKINGS_SOURCE =
  'https://raw.githubusercontent.com/BlazeSportsIntel/BSI/main/data/college-baseball/rankings/d1baseball-top25.json';

interface RankingsEnv {
  RANKINGS_CACHE?: KVNamespace;
  BASEBALL_RANKINGS_SOURCE_URL?: string;
  BASEBALL_RANKINGS_CACHE_TTL?: string;
}

interface RankingsPayload {
  poll?: string;
  season?: number;
  lastUpdated?: string;
  rankings: RankingEntry[];
}

interface RankingEntry {
  rank: number;
  team: string;
  record: string;
}

const CACHE_KEY = 'baseball-rankings:html:v1';

export default {
  async fetch(request: Request, env: RankingsEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== '/baseball/rankings') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      const html = await getRankingsHtml(env);
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch (error) {
      console.error('[BaseballRankingsWorker] Failed to render rankings:', error);

      if (env.RANKINGS_CACHE) {
        const fallback = await env.RANKINGS_CACHE.get(CACHE_KEY);
        if (fallback) {
          return new Response(fallback, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=60',
              'Warning': '199 - Served from stale cache due to upstream error',
            },
          });
        }
      }

      return new Response('Unable to load baseball rankings.', { status: 502 });
    }
  },
};

async function getRankingsHtml(env: RankingsEnv): Promise<string> {
  if (env.RANKINGS_CACHE) {
    const cached = await env.RANKINGS_CACHE.get(CACHE_KEY);
    if (cached) {
      return cached;
    }
  }

  const payload = await fetchRankings(env);
  const html = renderRankingsPage(payload);

  if (env.RANKINGS_CACHE) {
    const ttl = parseTtl(env.BASEBALL_RANKINGS_CACHE_TTL);
    await env.RANKINGS_CACHE.put(CACHE_KEY, html, {
      expirationTtl: ttl,
    });
  }

  return html;
}

async function fetchRankings(env: RankingsEnv): Promise<RankingsPayload> {
  const sourceUrl = env.BASEBALL_RANKINGS_SOURCE_URL || DEFAULT_RANKINGS_SOURCE;
  const response = await fetch(sourceUrl, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Rankings source returned ${response.status}`);
  }

  const data = (await response.json()) as RankingsPayload;

  if (!data || !Array.isArray(data.rankings)) {
    throw new Error('Rankings source payload is invalid.');
  }

  return {
    ...data,
    rankings: data.rankings
      .filter((entry) => typeof entry.rank === 'number' && entry.team && entry.record)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 25)
      .map((entry) => ({
        rank: entry.rank,
        team: entry.team,
        record: entry.record,
      })),
  };
}

function renderRankingsPage(payload: RankingsPayload): string {
  const title = payload.poll ? `${payload.poll} Top 25` : 'College Baseball Top 25 Rankings';
  const updated = formatTimestamp(payload.lastUpdated);
  const rows = payload.rankings
    .map(
      (entry) => `
          <tr>
            <td>${escapeHtml(entry.rank.toString())}</td>
            <td>${escapeHtml(entry.team)}</td>
            <td>${escapeHtml(entry.record)}</td>
          </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | Blaze Sports Intel</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: #04060d;
        color: #f7f9fc;
      }
      body {
        margin: 0;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        background: linear-gradient(180deg, rgba(6, 11, 25, 0.94) 0%, rgba(12, 18, 38, 0.98) 100%);
      }
      header {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      h1 {
        margin: 0;
        font-size: clamp(1.75rem, 3vw, 2.5rem);
        letter-spacing: 0.02em;
      }
      .meta {
        font-size: 0.95rem;
        color: rgba(247, 249, 252, 0.72);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: rgba(9, 13, 29, 0.9);
        border: 1px solid rgba(80, 115, 255, 0.24);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 18px 42px rgba(5, 12, 31, 0.45);
      }
      thead {
        background: linear-gradient(90deg, rgba(67, 132, 255, 0.32) 0%, rgba(120, 82, 255, 0.32) 100%);
      }
      th, td {
        padding: 14px 18px;
        text-align: left;
      }
      th {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: rgba(247, 249, 252, 0.82);
      }
      tbody tr:nth-child(even) {
        background: rgba(255, 255, 255, 0.02);
      }
      tbody tr:hover {
        background: rgba(67, 132, 255, 0.15);
        transition: background 0.2s ease;
      }
      @media (max-width: 640px) {
        body {
          padding: 16px;
        }
        th, td {
          padding: 12px 14px;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(title)}</h1>
      ${updated ? `<p class="meta">Last updated ${escapeHtml(updated)}</p>` : ''}
      <p class="meta">Data sourced from Blaze Sports Intel verified polling archives.</p>
    </header>
    <table aria-label="Top 25 college baseball rankings">
      <thead>
        <tr>
          <th scope="col">Rank</th>
          <th scope="col">Team</th>
          <th scope="col">Record / Context</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTimestamp(timestamp?: string): string | undefined {
  if (!timestamp) {
    return undefined;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.valueOf())) {
    return undefined;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Chicago',
  }).format(date);
}

function parseTtl(ttl?: string): number {
  const fallback = 6 * 60 * 60; // 6 hours
  if (!ttl) {
    return fallback;
  }

  const parsed = Number(ttl);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}
