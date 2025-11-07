import rankingsData from '../../data/college-baseball/rankings/d1baseball-top25.json';

interface RankingEntry {
  rank: number;
  team: string;
  conference: string;
  record: string;
  previousRank?: number;
  movement?: string;
}

interface RankingsPayload {
  poll: string;
  season: number;
  lastUpdated: string;
  timezone?: string;
  source?: string;
  dataFreshness?: string;
  dataStatus?: string;
  rankings: RankingEntry[];
}

type Env = Record<string, never>;

const data = rankingsData as RankingsPayload;

function formatCentralTimeTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

function renderMovement(entry: RankingEntry): { label: string; direction: 'up' | 'down' | 'steady'; } {
  const raw = entry.movement?.trim();
  if (!raw || raw === '0' || raw === '—' || raw === '-') {
    return { label: '—', direction: 'steady' };
  }

  const numeric = Number.parseInt(raw, 10);
  if (Number.isNaN(numeric) || numeric === 0) {
    return { label: '—', direction: 'steady' };
  }

  if (numeric > 0) {
    return { label: `▲ ${numeric}`, direction: 'up' };
  }

  return { label: `▼ ${Math.abs(numeric)}`, direction: 'down' };
}

function buildSummaryCards(entries: RankingEntry[]): string {
  const secTeams = entries.filter((team) => team.conference.toUpperCase() === 'SEC').length;
  const accTeams = entries.filter((team) => team.conference.toUpperCase() === 'ACC').length;
  const topFive = entries
    .filter((team) => team.rank <= 5)
    .map((team) => team.team)
    .join(', ');

  return `
    <section class="metrics">
      <div class="metric-card">
        <span class="metric-label">SEC Teams</span>
        <span class="metric-value">${secTeams}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">ACC Teams</span>
        <span class="metric-value">${accTeams}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Top 5</span>
        <span class="metric-value">${topFive}</span>
      </div>
    </section>
  `;
}

function buildRankingsTable(entries: RankingEntry[]): string {
  const rows = entries
    .map((entry) => {
      const movement = renderMovement(entry);
      const previous = entry.previousRank ?? '—';

      return `
        <tr>
          <td class="rank">${entry.rank}</td>
          <td class="team">
            <span class="team-name">${entry.team}</span>
            <span class="conference">${entry.conference}</span>
          </td>
          <td class="record">${entry.record}</td>
          <td class="previous">${previous}</td>
          <td class="movement ${movement.direction}">${movement.label}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <section aria-labelledby="rankings-heading" class="table-wrapper">
      <div class="table-header">
        <h2 id="rankings-heading">${data.poll} &mdash; Top 25</h2>
        <p class="table-subtitle">Final ${data.season} rankings sourced from D1Baseball.</p>
      </div>
      <div class="table-container" role="region" aria-live="polite" aria-describedby="rankings-caption">
        <table>
          <caption id="rankings-caption">Complete Top 25 with conference context, movement, and records.</caption>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Program</th>
              <th scope="col">Season Resume</th>
              <th scope="col">Prev.</th>
              <th scope="col">Movement</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function buildPage(entries: RankingEntry[]): string {
  const lastUpdated = formatCentralTimeTimestamp(data.lastUpdated);
  const freshness = data.dataFreshness ?? '';
  const status = data.dataStatus ?? '';
  const timezone = data.timezone ?? 'America/Chicago';

  const head = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${data.poll} &mdash; Blaze Sports Intel</title>
        <meta name="description" content="College baseball Top 25 rankings with conference context, movement, and postseason notes." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>
          :root {
            color-scheme: light dark;
            --bg: #05080f;
            --card-bg: rgba(255, 255, 255, 0.04);
            --text: #f7f9fc;
            --muted: rgba(247, 249, 252, 0.65);
            --accent: #ff7a18;
            --accent-soft: rgba(255, 122, 24, 0.12);
            --border: rgba(255, 255, 255, 0.08);
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: radial-gradient(circle at top left, rgba(255, 122, 24, 0.18), transparent 50%), var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            justify-content: center;
          }

          main {
            width: min(960px, 100%);
            padding: clamp(1.5rem, 2vw + 1rem, 3rem) clamp(1rem, 4vw, 2.75rem) 4rem;
          }

          header.hero {
            display: grid;
            gap: 1rem;
            margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
          }

          header.hero .eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.3rem;
            color: var(--muted);
            font-size: 0.75rem;
          }

          header.hero h1 {
            font-size: clamp(1.75rem, 2.8vw, 2.75rem);
            margin: 0;
          }

          header.hero p.subtitle {
            margin: 0;
            color: var(--muted);
            font-size: clamp(1rem, 2.5vw, 1.15rem);
            line-height: 1.6;
          }

          .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-top: 0.5rem;
          }

          .meta .pill {
            border-radius: 999px;
            padding: 0.45rem 1rem;
            background: var(--card-bg);
            border: 1px solid var(--border);
            font-size: 0.9rem;
          }

          .meta .pill strong {
            color: var(--text);
          }

          section.metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin-bottom: clamp(1.5rem, 4vw, 2.75rem);
          }

          .metric-card {
            padding: 1rem 1.25rem;
            border-radius: 16px;
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.06), rgba(5, 8, 15, 0.65));
            border: 1px solid var(--border);
            display: grid;
            gap: 0.35rem;
          }

          .metric-label {
            color: var(--muted);
            font-size: 0.8rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .metric-value {
            font-size: clamp(1.2rem, 2vw, 1.6rem);
            font-weight: 700;
          }

          .table-wrapper {
            background: rgba(5, 8, 15, 0.65);
            border-radius: 20px;
            padding: clamp(1.25rem, 2vw, 2rem);
            border: 1px solid var(--border);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
          }

          .table-header {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            margin-bottom: 1.5rem;
          }

          .table-header h2 {
            margin: 0;
            font-size: clamp(1.25rem, 2.5vw, 1.75rem);
          }

          .table-header .table-subtitle {
            margin: 0;
            color: var(--muted);
            font-size: 0.95rem;
          }

          .table-container {
            overflow-x: auto;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            min-width: 600px;
          }

          caption {
            text-align: left;
            color: var(--muted);
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
          }

          thead th {
            text-align: left;
            font-weight: 600;
            font-size: 0.85rem;
            color: var(--muted);
            padding-bottom: 0.75rem;
            border-bottom: 1px solid var(--border);
          }

          tbody tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }

          tbody tr:last-of-type {
            border-bottom: none;
          }

          tbody td {
            padding: 0.9rem 0;
            font-size: 0.95rem;
            vertical-align: top;
          }

          td.rank {
            width: 4ch;
            font-weight: 600;
          }

          td.team {
            display: grid;
            gap: 0.3rem;
          }

          td.team .conference {
            font-size: 0.8rem;
            color: var(--muted);
            letter-spacing: 0.02em;
          }

          td.record {
            max-width: 240px;
          }

          td.previous {
            width: 6ch;
          }

          td.movement {
            width: 8ch;
            font-weight: 600;
          }

          td.movement.up {
            color: #3fcf8e;
          }

          td.movement.down {
            color: #ff6b6b;
          }

          td.movement.steady {
            color: var(--muted);
          }

          footer.page-footer {
            margin-top: clamp(2rem, 5vw, 3rem);
            color: var(--muted);
            font-size: 0.85rem;
            display: grid;
            gap: 0.5rem;
          }

          footer.page-footer a {
            color: var(--text);
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
          }

          @media (prefers-color-scheme: light) {
            :root {
              --bg: #f1f5ff;
              --card-bg: rgba(255, 255, 255, 0.75);
              --text: #091125;
              --muted: rgba(9, 17, 37, 0.7);
              --accent-soft: rgba(255, 122, 24, 0.1);
              --border: rgba(9, 17, 37, 0.08);
            }

            body {
              background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(241, 245, 255, 0.95));
            }

            .table-wrapper {
              background: rgba(255, 255, 255, 0.9);
            }

            tbody tr {
              border-bottom: 1px solid rgba(9, 17, 37, 0.08);
            }

            .metric-card {
              background: rgba(255, 255, 255, 0.95);
            }

            footer.page-footer a {
              color: #0d1e46;
            }
          }

          @media (max-width: 600px) {
            header.hero {
              gap: 0.75rem;
            }

            .meta {
              flex-direction: column;
              gap: 0.75rem;
            }

            table {
              min-width: unset;
            }

            tbody td {
              padding: 0.75rem 0;
              font-size: 0.9rem;
            }

            td.team {
              gap: 0.15rem;
            }

            .table-wrapper {
              padding: 1rem;
            }
          }
        </style>
      </head>
      <body>
        <main>
          <header class="hero">
            <span class="eyebrow">Blaze Sports Intel &bull; College Baseball</span>
            <h1>${data.poll} &mdash; ${data.season}</h1>
            <p class="subtitle">Data-driven Top 25 built for analysts and diehard fans. Track postseason resumes, conference strength, and momentum heading into Omaha.</p>
            <div class="meta">
              <span class="pill"><strong>Last Updated:</strong> ${lastUpdated}</span>
              <span class="pill"><strong>Timezone:</strong> ${timezone}</span>
              ${freshness ? `<span class="pill"><strong>Data Freshness:</strong> ${freshness}</span>` : ''}
              ${status ? `<span class="pill"><strong>Status:</strong> ${status}</span>` : ''}
            </div>
          </header>
          ${buildSummaryCards(entries)}
          ${buildRankingsTable(entries)}
          <footer class="page-footer">
            <span>Source: <a href="${data.source ?? 'https://d1baseball.com/rankings/'}" target="_blank" rel="noopener noreferrer">D1Baseball</a></span>
            <span>Built for the BlazeSportsIntel.com College Baseball hub. Edge-rendered via Cloudflare Workers for instant global delivery.</span>
          </footer>
        </main>
      </body>
    </html>
  `;

  return head;
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'baseball-rankings',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    if (url.pathname !== '/' && url.pathname !== '') {
      return new Response('Not Found', {
        status: 404,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
        },
      });
    }

    const html = buildPage(data.rankings.slice(0, 25));

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    });
  },
};
