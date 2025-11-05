import rankingsData from '../../data/college-baseball/rankings/rpi-top25.json';

interface RankingEntry {
  rank: number;
  team: string;
  conference: string;
  record?: string;
  confRecord?: string;
  previousRank?: number;
  movement?: string;
  rpi?: number;
  sos?: number;
  sosRank?: number;
}

interface RankingsPayload {
  poll: string;
  season: number;
  lastUpdated: string;
  timezone?: string;
  source?: string;
  dataStatus?: string;
  dataFreshness?: string;
  rankings: RankingEntry[];
}

const NCAA_RANKINGS = rankingsData as RankingsPayload;

interface ColumnFlags {
  hasRecord: boolean;
  hasConfRecord: boolean;
  hasPrevRank: boolean;
  hasMovement: boolean;
  hasRpi: boolean;
  hasSosRank: boolean;
  hasSosValue: boolean;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'GET' } });
    }

    try {
      const html = renderRankingsPage(NCAA_RANKINGS);
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=900',
          'Vary': 'Accept-Encoding'
        }
      });
    } catch (error) {
      console.error('[baseball-rankings] Failed to render rankings page:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

function renderRankingsPage(payload: RankingsPayload): string {
  const { poll, season, lastUpdated, timezone, source, dataStatus, dataFreshness, rankings } = payload;

  if (!Array.isArray(rankings) || rankings.length === 0) {
    throw new Error('No rankings data available');
  }

  const formattedUpdated = formatLastUpdated(lastUpdated, timezone);
  const columnFlags = deriveColumnFlags(rankings);
  const tableHeaders = buildTableHeaders(columnFlags);
  const tableRows = rankings.map((entry) => buildTableRow(entry, columnFlags)).join('');

  const safePoll = escapeHtml(poll || 'NCAA Top 25 Rankings');
  const safeSourceLabel = source ? escapeHtml(extractHostname(source)) : '';
  const sourceLink = source
    ? `<a class="source-link" href="${escapeAttribute(source)}" target="_blank" rel="noopener noreferrer">${safeSourceLabel}</a>`
    : '';

  const statusBlurb = dataStatus ? `<p class="status-blurb">${escapeHtml(dataStatus)}</p>` : '';
  const freshnessBlurb = dataFreshness ? `<p class="freshness-blurb">${escapeHtml(dataFreshness)}</p>` : '';
  const metaRow = sourceLink ? `<div class="meta-row">${sourceLink}</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safePoll} · Blaze Sports Intel</title>
    <style>
      :root {
        color-scheme: dark;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: radial-gradient(circle at 20% 20%, rgba(17, 37, 71, 0.85), #05070d 55%);
        color: #e2e8f0;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        padding: 32px 16px;
      }

      .sr-only {
        border: 0;
        clip: rect(0 0 0 0);
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
        white-space: nowrap;
      }

      main {
        width: min(1080px, 100%);
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      header.page-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .kicker {
        font-size: 0.75rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(148, 163, 184, 0.85);
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 2.6rem);
        font-weight: 700;
        color: #f97316;
      }

      .season-label {
        font-size: 1rem;
        color: rgba(226, 232, 240, 0.9);
      }

      .updated {
        font-size: 0.95rem;
        color: rgba(148, 163, 184, 0.9);
      }

      .updated strong {
        color: #f1f5f9;
        font-weight: 600;
      }

      .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        font-size: 0.9rem;
        color: rgba(148, 163, 184, 0.95);
      }

      .source-link {
        color: #60a5fa;
        text-decoration: none;
      }

      .source-link:hover,
      .source-link:focus {
        text-decoration: underline;
      }

      .table-card {
        border-radius: 18px;
        background: linear-gradient(145deg, rgba(13, 25, 43, 0.88), rgba(9, 17, 31, 0.88));
        border: 1px solid rgba(148, 163, 184, 0.16);
        box-shadow: 0 30px 60px rgba(2, 6, 23, 0.55);
        overflow: hidden;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 640px;
      }

      thead {
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
      }

      th {
        padding: 16px;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: rgba(148, 163, 184, 0.95);
        text-align: left;
        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
      }

      th.col-rank {
        width: 72px;
      }

      tbody tr {
        border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        transition: background-color 0.18s ease;
      }

      tbody tr:last-of-type {
        border-bottom: none;
      }

      tbody tr:hover {
        background: rgba(30, 41, 59, 0.55);
      }

      td {
        padding: 16px;
        font-size: 0.95rem;
        vertical-align: middle;
      }

      .rank-cell {
        font-weight: 700;
        color: #f97316;
        font-size: 1.05rem;
      }

      .team-cell {
        font-weight: 600;
        color: #f8fafc;
      }

      .team-meta {
        font-size: 0.85rem;
        color: rgba(148, 163, 184, 0.95);
        margin-top: 4px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .badge {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        background: rgba(99, 102, 241, 0.18);
        color: rgba(165, 180, 252, 0.95);
      }

      .metric {
        font-variant-numeric: tabular-nums;
      }

      .status-blurb,
      .freshness-blurb {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(148, 163, 184, 0.9);
      }

      .status-blurb + .freshness-blurb {
        margin-top: 4px;
      }

      footer.page-footer {
        font-size: 0.8rem;
        color: rgba(148, 163, 184, 0.75);
        line-height: 1.5;
      }

      @media (max-width: 768px) {
        body {
          padding: 24px 12px;
        }

        table {
          min-width: 560px;
        }

        th,
        td {
          padding: 12px 14px;
        }

        .team-meta {
          gap: 8px;
        }
      }

      @media (max-width: 520px) {
        h1 {
          font-size: 1.75rem;
        }

        table {
          min-width: 520px;
        }

        .meta-row {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="page-header">
        <span class="kicker">Blaze Sports Intel · NCAA Baseball</span>
        <h1>${safePoll}</h1>
        <p class="season-label">Division I • ${season}</p>
        <p class="updated"><strong>Last Updated</strong> · ${formattedUpdated}</p>
        ${metaRow}
        ${statusBlurb}
        ${freshnessBlurb}
      </header>
      <section class="table-card" aria-labelledby="rankings-table-title">
        <div class="table-wrapper">
          <table>
            <caption id="rankings-table-title" class="sr-only">${safePoll} standings for the ${season} season</caption>
            <thead>
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </section>
      <footer class="page-footer">
        <p>© ${new Date().getFullYear()} Blaze Sports Intel. Data rights belong to their respective owners.</p>
      </footer>
    </main>
  </body>
</html>`;
}

function buildTableHeaders(flags: ColumnFlags): string {
  const headers: string[] = [
    '<th scope="col" class="col-rank">Rank</th>',
    '<th scope="col" class="col-team">Team</th>'
  ];

  if (flags.hasRecord) {
    headers.push('<th scope="col" class="col-record">Record</th>');
  }

  if (flags.hasConfRecord) {
    headers.push('<th scope="col" class="col-conf">Conf</th>');
  }

  headers.push('<th scope="col" class="col-conference">Conference</th>');

  if (flags.hasRpi) {
    headers.push('<th scope="col" class="col-rpi">RPI</th>');
  }

  if (flags.hasSosRank) {
    headers.push('<th scope="col" class="col-sos">SOS Rank</th>');
  }

  if (flags.hasPrevRank) {
    headers.push('<th scope="col" class="col-previous">Prev</th>');
  }

  if (flags.hasMovement) {
    headers.push('<th scope="col" class="col-movement">Trend</th>');
  }

  return headers.join('');
}

function buildTableRow(entry: RankingEntry, flags: ColumnFlags): string {
  const recordCell = flags.hasRecord ? `<td>${escapeHtml(entry.record ?? '—')}</td>` : '';
  const confRecordCell = flags.hasConfRecord ? `<td>${escapeHtml(entry.confRecord ?? '—')}</td>` : '';
  const prevCell = flags.hasPrevRank ? `<td>${entry.previousRank ?? '—'}</td>` : '';
  const movementCell = flags.hasMovement ? `<td>${escapeHtml(entry.movement ?? '—')}</td>` : '';
  const rpiCell = flags.hasRpi ? `<td class="metric">${typeof entry.rpi === 'number' ? entry.rpi.toFixed(4) : '—'}</td>` : '';
  const sosCell = flags.hasSosRank ? `<td class="metric">${typeof entry.sosRank === 'number' ? entry.sosRank : '—'}</td>` : '';

  const metaSegments: string[] = [];
  if (flags.hasSosValue && typeof entry.sos === 'number') {
    metaSegments.push(`<span class="badge">SOS: ${entry.sos.toFixed(4)}</span>`);
  }

  const metaRow = metaSegments.length > 0 ? `<div class="team-meta">${metaSegments.join('')}</div>` : '';

  return `
    <tr>
      <td class="rank-cell">${entry.rank}</td>
      <td class="team-cell">
        ${escapeHtml(entry.team)}
        ${metaRow}
      </td>
      ${recordCell}
      ${confRecordCell}
      <td>${escapeHtml(entry.conference)}</td>
      ${rpiCell}
      ${sosCell}
      ${prevCell}
      ${movementCell}
    </tr>
  `;
}

function deriveColumnFlags(rankings: RankingEntry[]): ColumnFlags {
  return {
    hasRecord: rankings.some((entry) => Boolean(entry.record)),
    hasConfRecord: rankings.some((entry) => Boolean(entry.confRecord)),
    hasPrevRank: rankings.some((entry) => typeof entry.previousRank === 'number'),
    hasMovement: rankings.some((entry) => typeof entry.movement === 'string' && entry.movement.trim().length > 0),
    hasRpi: rankings.some((entry) => typeof entry.rpi === 'number'),
    hasSosRank: rankings.some((entry) => typeof entry.sosRank === 'number'),
    hasSosValue: rankings.some((entry) => typeof entry.sos === 'number')
  };
}

function formatLastUpdated(dateValue: string, timezone?: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(dateValue);
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone ?? 'UTC',
      timeZoneName: 'short'
    });
    return formatter.format(date).replace(' at ', ' · ');
  } catch (error) {
    console.warn('[baseball-rankings] Failed to format date', error);
    return escapeHtml(date.toISOString());
  }
}

function extractHostname(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case '\'':
        return '&#39;';
      default:
        return char;
    }
  });
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
