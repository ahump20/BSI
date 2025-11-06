// workers/baseball-rankings/index.ts
/**
 * NCAA Men's Baseball Top 25 Rankings Worker
 *
 * This Cloudflare Worker serves a server-rendered HTML page displaying
 * the D1Baseball Top 25 rankings. Data is cached in KV for 12 hours
 * to minimize reads from the source JSON file.
 *
 * @see https://blazesportsintel.com/baseball/rankings
 */

export interface Env {
  BSI_KV: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
}

interface Ranking {
  rank: number;
  team: string;
  conference: string;
  record: string;
  previousRank: number | string;
}

interface RankingsData {
  lastUpdated: string;
  source: string;
  season: string;
  rankings: Ranking[];
}

const KV_KEY = 'baseball-rankings';
const CACHE_TTL_SECONDS = 43200; // 12 hours

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    let cacheStatus = 'unknown';
    let dataSource = 'unknown';
    let success = true;

    try {
      // Get rankings data from KV or fallback source
      const data = await getRankingsData(env);

      // Track cache status and data source from result
      cacheStatus = data.source.includes('KV cache') ? 'hit' : 'miss';
      dataSource = data.source.includes('Live') ? 'live_scrape' : 'fallback';

      // Render HTML page
      const html = renderPage(data);

      const responseTime = Date.now() - startTime;

      // Track analytics
      if (env.ANALYTICS) {
        ctx.waitUntil(
          env.ANALYTICS.writeDataPoint({
            blobs: ['rankings_view', cacheStatus, dataSource],
            doubles: [responseTime],
            indexes: ['baseball-rankings'],
          })
        );
      }

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600', // Cache in browser for 1 hour
          'X-Cache-Status': cacheStatus,
          'X-Data-Source': dataSource,
          'X-Response-Time': `${responseTime}ms`,
        },
      });
    } catch (error) {
      success = false;
      const responseTime = Date.now() - startTime;

      console.error('Error fetching rankings:', error);

      // Track error in analytics
      if (env.ANALYTICS) {
        ctx.waitUntil(
          env.ANALYTICS.writeDataPoint({
            blobs: ['rankings_error', error instanceof Error ? error.message : 'unknown'],
            doubles: [responseTime],
            indexes: ['baseball-rankings'],
          })
        );
      }

      return new Response('Error loading rankings. Please try again later.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};

/**
 * Get rankings data from KV cache or fetch from D1Baseball
 */
async function getRankingsData(env: Env): Promise<RankingsData> {
  try {
    // Try to get from KV first
    const cachedText = await env.BSI_KV.get(KV_KEY);

    if (cachedText) {
      console.log('Serving rankings from KV cache');
      return JSON.parse(cachedText) as RankingsData;
    }

    console.log('KV cache miss, fetching live rankings from D1Baseball');

    // Fetch live rankings from D1Baseball
    const data = await fetchLiveD1BaseballRankings();

    // Try to store in KV with TTL, but don't fail if KV limit exceeded
    try {
      await env.BSI_KV.put(KV_KEY, JSON.stringify(data), {
        expirationTtl: CACHE_TTL_SECONDS,
      });
    } catch (kvError) {
      console.warn('KV write failed (possibly limit exceeded), returning data without caching:', kvError);
      // Continue anyway - we still have the data
    }

    return data;
  } catch (error) {
    console.error('Error in getRankingsData:', error);
    // Return fallback data with error info for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ...getFallbackData(),
      source: `D1Baseball Top 25 Rankings (Fallback) - Error: ${errorMessage}`
    };
  }
}

/**
 * Fetch and parse live rankings from D1Baseball website
 */
async function fetchLiveD1BaseballRankings(): Promise<RankingsData> {
  const response = await fetch('https://d1baseball.com/rankings/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://d1baseball.com/'
    }
  });

  if (!response.ok) {
    throw new Error(`D1Baseball fetch failed with status ${response.status}`);
  }

  const html = await response.text();

  // Parse the HTML to extract rankings
  const rankings: Ranking[] = [];

  // Match D1Baseball's actual table structure:
  // <td>1</td><td class="team"><a><img...>LSU<span...</span></a></td>
  // Pattern uses [\s\S] to match across newlines (. doesn't match newlines by default)
  const rankingPattern = /<td[^>]*>(\d+)<\/td>\s*<td[^>]*class="team"[^>]*>[\s\S]*?<img[^>]*>\s*(.*?)\s*<span/gi;

  let match;
  while ((match = rankingPattern.exec(html)) !== null) {
    const rank = parseInt(match[1]);
    const teamName = match[2].trim();

    if (rank >= 1 && rank <= 25 && teamName) {
      // Map team names to conferences (static mapping for now)
      const conference = getTeamConference(teamName);

      rankings.push({
        rank,
        team: teamName,
        conference,
        record: '0-0', // Preseason - no games played yet
        previousRank: rank // No historical data available yet
      });
    }
  }

  if (rankings.length === 0) {
    throw new Error('Failed to parse rankings from D1Baseball website - no teams found');
  }

  // Sort by rank to ensure correct order
  rankings.sort((a, b) => a.rank - b.rank);

  return {
    lastUpdated: new Date().toISOString(),
    source: 'D1Baseball Top 25 Rankings (Live)',
    season: '2025 Season',
    rankings: rankings.slice(0, 25)
  };
}

/**
 * Map team names to their conferences
 * This is a static mapping - in future versions, fetch from NCAA API
 */
function getTeamConference(teamName: string): string {
  const conferenceMap: Record<string, string> = {
    'LSU': 'SEC',
    'Coastal Carolina': 'Sun Belt',
    'Arkansas': 'SEC',
    'Oregon State': 'Pac-12',
    'UCLA': 'Pac-12',
    'Wake Forest': 'ACC',
    'Florida': 'SEC',
    'Tennessee': 'SEC',
    'Texas': 'SEC',
    'Texas A&M': 'SEC',
    'Ole Miss': 'SEC',
    'Mississippi State': 'SEC',
    'Vanderbilt': 'SEC',
    'Kentucky': 'SEC',
    'Auburn': 'SEC',
    'Georgia': 'SEC',
    'Alabama': 'SEC',
    'South Carolina': 'SEC',
    'Missouri': 'SEC',
    'Clemson': 'ACC',
    'Louisville': 'ACC',
    'NC State': 'ACC',
    'Duke': 'ACC',
    'Virginia': 'ACC',
    'Miami': 'ACC',
    'Florida State': 'ACC',
    'Georgia Tech': 'ACC',
    'Stanford': 'Pac-12',
    'Arizona': 'Pac-12',
    'Arizona State': 'Pac-12',
    'Oklahoma': 'SEC',
    'Oklahoma State': 'Big 12',
    'TCU': 'Big 12',
    'Texas Tech': 'Big 12',
    'West Virginia': 'Big 12',
    'Baylor': 'Big 12'
  };

  return conferenceMap[teamName] || 'N/A';
}

/**
 * Fallback data when KV and source are unavailable
 */
function getFallbackData(): RankingsData {
  return {
    lastUpdated: new Date().toISOString(),
    source: "D1Baseball Top 25 Rankings (Fallback)",
    season: "2025 Preseason",
    rankings: []
  };
}

/**
 * Render the HTML page
 */
function renderPage(data: RankingsData): string {
  const lastUpdatedDate = new Date(data.lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="NCAA Men's Baseball Top 25 rankings from D1Baseball. Stay updated on the best college baseball teams in the nation.">
  <title>NCAA Baseball Top 25 Rankings | Blaze Sports Intel</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #f5f5f5;
      line-height: 1.6;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #ff6b00;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #ff6b00;
      margin-bottom: 12px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    .subtitle {
      font-size: 1.1rem;
      color: #b0b0b0;
      margin-bottom: 8px;
    }

    .last-updated {
      font-size: 0.9rem;
      color: #888;
      font-style: italic;
    }

    .source-badge {
      display: inline-block;
      background: rgba(255, 107, 0, 0.2);
      color: #ff6b00;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-top: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }

    thead {
      background: rgba(255, 107, 0, 0.15);
    }

    th {
      padding: 16px 12px;
      text-align: left;
      font-weight: 600;
      color: #ff6b00;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #ff6b00;
    }

    th:first-child {
      text-align: center;
      width: 80px;
    }

    th:last-child {
      text-align: center;
      width: 100px;
    }

    tbody tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      transition: background 0.2s ease;
    }

    tbody tr:hover {
      background: rgba(255, 107, 0, 0.1);
    }

    tbody tr:nth-child(odd) {
      background: rgba(255, 255, 255, 0.02);
    }

    td {
      padding: 14px 12px;
      font-size: 1rem;
    }

    td:first-child {
      text-align: center;
      font-weight: 700;
      color: #ff6b00;
      font-size: 1.2rem;
    }

    .team-name {
      font-weight: 600;
      color: #fff;
    }

    .conference {
      color: #999;
      font-size: 0.85rem;
      display: block;
      margin-top: 2px;
    }

    .record {
      text-align: center;
      font-weight: 500;
      color: #b0b0b0;
    }

    .rank-change {
      display: inline-block;
      margin-left: 8px;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 8px;
      font-weight: 600;
    }

    .rank-up {
      background: rgba(40, 167, 69, 0.2);
      color: #28a745;
    }

    .rank-down {
      background: rgba(220, 53, 69, 0.2);
      color: #dc3545;
    }

    .rank-same {
      color: #888;
    }

    footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #888;
      font-size: 0.9rem;
    }

    .footer-actions {
      margin-bottom: 24px;
    }

    .action-btn {
      display: inline-block;
      background: linear-gradient(135deg, #ff6b00 0%, #d65900 100%);
      color: #fff;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 107, 0, 0.4);
      background: linear-gradient(135deg, #ff8533 0%, #ff6b00 100%);
    }

    .footer-links {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .footer-links p {
      margin: 8px 0;
    }

    .footer-links a {
      color: #ff6b00;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .footer-links a:hover {
      color: #ff8533;
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .container {
        padding: 20px;
      }

      h1 {
        font-size: 1.8rem;
      }

      th, td {
        padding: 10px 8px;
        font-size: 0.9rem;
      }

      th:first-child,
      td:first-child {
        width: 50px;
      }

      .conference {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>⚾ NCAA Baseball Top 25</h1>
      <p class="subtitle">${data.season}</p>
      <p class="last-updated">Last Updated: ${lastUpdatedDate}</p>
      <span class="source-badge">${data.source}</span>
    </header>

    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team</th>
          <th>Record</th>
        </tr>
      </thead>
      <tbody>
        ${data.rankings.map(team => {
          const rankChange = getRankChange(team.rank, team.previousRank);
          return `
            <tr>
              <td>${team.rank}${rankChange}</td>
              <td>
                <span class="team-name">${team.team}</span>
                <span class="conference">${team.conference}</span>
              </td>
              <td class="record">${team.record}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <footer>
      <div class="footer-actions">
        <a href="/college-baseball/games?ranked=true" class="action-btn">
          ⚾ View Live Games - Top 25 Teams
        </a>
      </div>
      <div class="footer-links">
        <p>Data sourced from ${data.source}</p>
        <p><a href="https://blazesportsintel.com">← Back to Blaze Sports Intel</a></p>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Calculate rank change indicator
 */
function getRankChange(currentRank: number, previousRank: number | string): string {
  if (previousRank === 'NR') {
    return '<span class="rank-change rank-up">NEW</span>';
  }

  const prev = typeof previousRank === 'number' ? previousRank : currentRank;
  const change = prev - currentRank;

  if (change > 0) {
    return `<span class="rank-change rank-up">↑${change}</span>`;
  } else if (change < 0) {
    return `<span class="rank-change rank-down">↓${Math.abs(change)}</span>`;
  } else {
    return '<span class="rank-change rank-same">—</span>';
  }
}
