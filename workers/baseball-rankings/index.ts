/**
 * Baseball Rankings Worker
 *
 * Serves a lightweight HTML snapshot of the latest D1Baseball Top 25 rankings.
 * Designed for Cloudflare Workers routing bound to `/baseball/rankings`.
 */

interface Env {
  /**
   * Optional override for the rankings JSON endpoint.
   * Defaults to the Blaze Sports Intel GitHub raw dataset.
   */
  BASEBALL_RANKINGS_URL?: string;
}

interface RankingEntry {
  rank: number;
  team: string;
  record: string;
}

interface RankingsPayload {
  poll: string;
  season?: number;
  lastUpdated?: string;
  timezone?: string;
  rankings: RankingEntry[];
}

const DEFAULT_RANKINGS_URL =
  'https://raw.githubusercontent.com/BlazeSportsIntel/BSI/main/data/college-baseball/rankings/d1baseball-top25.json';

const TIMEZONE = 'America/Chicago';

/**
 * Fetch handler exported for Cloudflare routing bindings.
 */
export const fetch = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);

  if (url.pathname !== '/baseball/rankings') {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const rankings = await loadRankings(env);
    const html = renderHtml(rankings);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('[BaseballRankingsWorker] Failed to load rankings', error);

    return new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Rankings Unavailable</title></head><body><main style="font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 48px; max-width: 640px; margin: auto; text-align: center; color: #0b132b;"><h1 style="font-size: 2rem; margin-bottom: 0.75rem;">Baseball Rankings Unavailable</h1><p style="margin-bottom: 1.5rem; color: #4b5563;">We could not retrieve the latest rankings right now. Please try again shortly.</p><pre style="background: #f3f4f6; border-radius: 12px; padding: 16px; font-size: 0.75rem; color: #6b7280; overflow-x: auto;">${
        error instanceof Error ? error.message : 'Unexpected error'
      }</pre></main></body></html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      }
    );
  }
};

export default { fetch };

async function loadRankings(env: Env): Promise<RankingsPayload> {
  const endpoint = env.BASEBALL_RANKINGS_URL ?? DEFAULT_RANKINGS_URL;
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 600, cacheEverything: true },
  });

  if (!response.ok) {
    throw new Error(`Rankings fetch failed with status ${response.status}`);
  }

  const payload = (await response.json()) as RankingsPayload;

  if (!payload || !Array.isArray(payload.rankings)) {
    throw new Error('Rankings payload malformed');
  }

  return payload;
}

function renderHtml(payload: RankingsPayload): string {
  const {
    poll,
    season,
    rankings,
    lastUpdated,
    timezone = TIMEZONE,
  } = payload;

  const formattedTimestamp = lastUpdated
    ? formatTimestamp(lastUpdated, timezone)
    : 'Unavailable';

  const title = `${poll ?? 'NCAA Top 25'}${season ? ` – ${season}` : ''}`;

  const rows = rankings
    .map((entry) => {
      const { rank, team, record } = entry;
      return `<tr>
        <td>${rank}</td>
        <td>${escapeHtml(team)}</td>
        <td>${escapeHtml(record)}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | Blaze Sports Intel</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        background: #0b132b;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #f8fafc;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 32px 16px;
      }
      .container {
        width: min(960px, 100%);
        background: rgba(11, 19, 43, 0.82);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        box-shadow: 0 24px 60px rgba(9, 12, 27, 0.45);
        padding: 32px;
        backdrop-filter: blur(12px);
      }
      header {
        border-bottom: 1px solid rgba(148, 163, 184, 0.25);
        padding-bottom: 20px;
        margin-bottom: 24px;
      }
      h1 {
        font-size: clamp(2rem, 3vw, 2.5rem);
        margin: 0;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
      .meta {
        margin-top: 8px;
        font-size: 0.95rem;
        color: rgba(226, 232, 240, 0.85);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        overflow: hidden;
        border-radius: 16px;
        background: rgba(15, 23, 42, 0.75);
      }
      thead {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.35));
      }
      th,
      td {
        padding: clamp(12px, 2vw, 18px);
        text-align: left;
      }
      th {
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.12em;
        color: rgba(226, 232, 240, 0.9);
      }
      tbody tr:nth-child(even) {
        background: rgba(100, 116, 139, 0.1);
      }
      tbody tr:nth-child(odd) {
        background: rgba(148, 163, 184, 0.05);
      }
      tbody tr:hover {
        background: rgba(56, 189, 248, 0.12);
      }
      td:first-child {
        font-weight: 700;
        width: 12%;
        color: rgba(96, 165, 250, 0.95);
      }
      td:nth-child(2) {
        font-weight: 600;
        font-size: clamp(1rem, 2.5vw, 1.125rem);
      }
      footer {
        margin-top: 24px;
        font-size: 0.85rem;
        color: rgba(148, 163, 184, 0.9);
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;
        align-items: center;
        justify-content: space-between;
      }
      @media (max-width: 640px) {
        .container {
          padding: 24px 20px;
        }
        table,
        thead,
        tbody,
        th,
        td,
        tr {
          display: block;
        }
        thead tr {
          display: none;
        }
        tbody tr {
          margin-bottom: 16px;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.85);
        }
        td {
          padding: 12px 16px;
          position: relative;
        }
        td:first-child {
          border-bottom: 1px solid rgba(148, 163, 184, 0.3);
          color: rgba(96, 165, 250, 1);
        }
        td:nth-child(2),
        td:nth-child(3) {
          font-size: 0.95rem;
        }
        td:nth-child(3) {
          color: rgba(226, 232, 240, 0.85);
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">Updated ${escapeHtml(formattedTimestamp)}</p>
      </header>
      <main>
        <table role="table" aria-label="${escapeHtml(title)} standings">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Team</th>
              <th scope="col">Record / Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </main>
      <footer>
        <span>Source: D1Baseball Top 25</span>
        <span>Timezone: ${escapeHtml(timezone)}</span>
      </footer>
    </div>
  </body>
</html>`;
}

function formatTimestamp(timestamp: string, timezone: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || TIMEZONE,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
