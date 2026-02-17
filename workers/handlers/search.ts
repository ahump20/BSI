import type { Env } from '../shared/types';
import { json, kvGet, kvPut } from '../shared/helpers';
import { teamMetadata } from '../../lib/data/team-metadata';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  type: 'team' | 'player' | 'article' | 'game' | 'page';
  id: string;
  name: string;
  url: string;
  sport?: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeSearchTerm(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function computeScore(name: string, query: string): number {
  const lower = name.toLowerCase();
  if (lower === query) return 100;
  if (lower.startsWith(query)) return 90;
  const idx = lower.indexOf(query);
  if (idx !== -1) return 80 - idx;
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(query)) return 70;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Static Pro-Team Index
// ---------------------------------------------------------------------------

const PRO_TEAMS: Array<{ name: string; abv: string; sport: 'mlb' | 'nfl' | 'nba'; slug: string }> = [
  { name: 'Arizona Diamondbacks', abv: 'ARI', sport: 'mlb', slug: 'ari' },
  { name: 'Atlanta Braves', abv: 'ATL', sport: 'mlb', slug: 'atl' },
  { name: 'Baltimore Orioles', abv: 'BAL', sport: 'mlb', slug: 'bal' },
  { name: 'Boston Red Sox', abv: 'BOS', sport: 'mlb', slug: 'bos' },
  { name: 'Chicago Cubs', abv: 'CHC', sport: 'mlb', slug: 'chc' },
  { name: 'Chicago White Sox', abv: 'CWS', sport: 'mlb', slug: 'cws' },
  { name: 'Cincinnati Reds', abv: 'CIN', sport: 'mlb', slug: 'cin' },
  { name: 'Cleveland Guardians', abv: 'CLE', sport: 'mlb', slug: 'cle' },
  { name: 'Colorado Rockies', abv: 'COL', sport: 'mlb', slug: 'col' },
  { name: 'Detroit Tigers', abv: 'DET', sport: 'mlb', slug: 'det' },
  { name: 'Houston Astros', abv: 'HOU', sport: 'mlb', slug: 'hou' },
  { name: 'Kansas City Royals', abv: 'KC', sport: 'mlb', slug: 'kc' },
  { name: 'Los Angeles Angels', abv: 'LAA', sport: 'mlb', slug: 'laa' },
  { name: 'Los Angeles Dodgers', abv: 'LAD', sport: 'mlb', slug: 'lad' },
  { name: 'Miami Marlins', abv: 'MIA', sport: 'mlb', slug: 'mia' },
  { name: 'Milwaukee Brewers', abv: 'MIL', sport: 'mlb', slug: 'mil' },
  { name: 'Minnesota Twins', abv: 'MIN', sport: 'mlb', slug: 'min' },
  { name: 'New York Mets', abv: 'NYM', sport: 'mlb', slug: 'nym' },
  { name: 'New York Yankees', abv: 'NYY', sport: 'mlb', slug: 'nyy' },
  { name: 'Oakland Athletics', abv: 'OAK', sport: 'mlb', slug: 'oak' },
  { name: 'Philadelphia Phillies', abv: 'PHI', sport: 'mlb', slug: 'phi' },
  { name: 'Pittsburgh Pirates', abv: 'PIT', sport: 'mlb', slug: 'pit' },
  { name: 'San Diego Padres', abv: 'SD', sport: 'mlb', slug: 'sd' },
  { name: 'San Francisco Giants', abv: 'SF', sport: 'mlb', slug: 'sf' },
  { name: 'Seattle Mariners', abv: 'SEA', sport: 'mlb', slug: 'sea' },
  { name: 'St. Louis Cardinals', abv: 'STL', sport: 'mlb', slug: 'stl' },
  { name: 'Tampa Bay Rays', abv: 'TB', sport: 'mlb', slug: 'tb' },
  { name: 'Texas Rangers', abv: 'TEX', sport: 'mlb', slug: 'tex' },
  { name: 'Toronto Blue Jays', abv: 'TOR', sport: 'mlb', slug: 'tor' },
  { name: 'Washington Nationals', abv: 'WSH', sport: 'mlb', slug: 'wsh' },
  { name: 'Arizona Cardinals', abv: 'ARI', sport: 'nfl', slug: 'cardinals' },
  { name: 'Atlanta Falcons', abv: 'ATL', sport: 'nfl', slug: 'falcons' },
  { name: 'Baltimore Ravens', abv: 'BAL', sport: 'nfl', slug: 'ravens' },
  { name: 'Buffalo Bills', abv: 'BUF', sport: 'nfl', slug: 'bills' },
  { name: 'Carolina Panthers', abv: 'CAR', sport: 'nfl', slug: 'panthers' },
  { name: 'Chicago Bears', abv: 'CHI', sport: 'nfl', slug: 'bears' },
  { name: 'Cincinnati Bengals', abv: 'CIN', sport: 'nfl', slug: 'bengals' },
  { name: 'Cleveland Browns', abv: 'CLE', sport: 'nfl', slug: 'browns' },
  { name: 'Dallas Cowboys', abv: 'DAL', sport: 'nfl', slug: 'cowboys' },
  { name: 'Denver Broncos', abv: 'DEN', sport: 'nfl', slug: 'broncos' },
  { name: 'Detroit Lions', abv: 'DET', sport: 'nfl', slug: 'lions' },
  { name: 'Green Bay Packers', abv: 'GB', sport: 'nfl', slug: 'packers' },
  { name: 'Houston Texans', abv: 'HOU', sport: 'nfl', slug: 'texans' },
  { name: 'Indianapolis Colts', abv: 'IND', sport: 'nfl', slug: 'colts' },
  { name: 'Jacksonville Jaguars', abv: 'JAX', sport: 'nfl', slug: 'jaguars' },
  { name: 'Kansas City Chiefs', abv: 'KC', sport: 'nfl', slug: 'chiefs' },
  { name: 'Las Vegas Raiders', abv: 'LV', sport: 'nfl', slug: 'raiders' },
  { name: 'Los Angeles Chargers', abv: 'LAC', sport: 'nfl', slug: 'chargers' },
  { name: 'Los Angeles Rams', abv: 'LAR', sport: 'nfl', slug: 'rams' },
  { name: 'Miami Dolphins', abv: 'MIA', sport: 'nfl', slug: 'dolphins' },
  { name: 'Minnesota Vikings', abv: 'MIN', sport: 'nfl', slug: 'vikings' },
  { name: 'New England Patriots', abv: 'NE', sport: 'nfl', slug: 'patriots' },
  { name: 'New Orleans Saints', abv: 'NO', sport: 'nfl', slug: 'saints' },
  { name: 'New York Giants', abv: 'NYG', sport: 'nfl', slug: 'giants' },
  { name: 'New York Jets', abv: 'NYJ', sport: 'nfl', slug: 'jets' },
  { name: 'Philadelphia Eagles', abv: 'PHI', sport: 'nfl', slug: 'eagles' },
  { name: 'Pittsburgh Steelers', abv: 'PIT', sport: 'nfl', slug: 'steelers' },
  { name: 'San Francisco 49ers', abv: 'SF', sport: 'nfl', slug: '49ers' },
  { name: 'Seattle Seahawks', abv: 'SEA', sport: 'nfl', slug: 'seahawks' },
  { name: 'Tampa Bay Buccaneers', abv: 'TB', sport: 'nfl', slug: 'buccaneers' },
  { name: 'Tennessee Titans', abv: 'TEN', sport: 'nfl', slug: 'titans' },
  { name: 'Washington Commanders', abv: 'WAS', sport: 'nfl', slug: 'commanders' },
  { name: 'Atlanta Hawks', abv: 'ATL', sport: 'nba', slug: 'atl' },
  { name: 'Boston Celtics', abv: 'BOS', sport: 'nba', slug: 'bos' },
  { name: 'Brooklyn Nets', abv: 'BKN', sport: 'nba', slug: 'bkn' },
  { name: 'Charlotte Hornets', abv: 'CHA', sport: 'nba', slug: 'cha' },
  { name: 'Chicago Bulls', abv: 'CHI', sport: 'nba', slug: 'chi' },
  { name: 'Cleveland Cavaliers', abv: 'CLE', sport: 'nba', slug: 'cle' },
  { name: 'Dallas Mavericks', abv: 'DAL', sport: 'nba', slug: 'dal' },
  { name: 'Denver Nuggets', abv: 'DEN', sport: 'nba', slug: 'den' },
  { name: 'Detroit Pistons', abv: 'DET', sport: 'nba', slug: 'det' },
  { name: 'Golden State Warriors', abv: 'GS', sport: 'nba', slug: 'gs' },
  { name: 'Houston Rockets', abv: 'HOU', sport: 'nba', slug: 'hou' },
  { name: 'Indiana Pacers', abv: 'IND', sport: 'nba', slug: 'ind' },
  { name: 'LA Clippers', abv: 'LAC', sport: 'nba', slug: 'lac' },
  { name: 'Los Angeles Lakers', abv: 'LAL', sport: 'nba', slug: 'lal' },
  { name: 'Memphis Grizzlies', abv: 'MEM', sport: 'nba', slug: 'mem' },
  { name: 'Miami Heat', abv: 'MIA', sport: 'nba', slug: 'mia' },
  { name: 'Milwaukee Bucks', abv: 'MIL', sport: 'nba', slug: 'mil' },
  { name: 'Minnesota Timberwolves', abv: 'MIN', sport: 'nba', slug: 'min' },
  { name: 'New Orleans Pelicans', abv: 'NOP', sport: 'nba', slug: 'nop' },
  { name: 'New York Knicks', abv: 'NYK', sport: 'nba', slug: 'nyk' },
  { name: 'Oklahoma City Thunder', abv: 'OKC', sport: 'nba', slug: 'okc' },
  { name: 'Orlando Magic', abv: 'ORL', sport: 'nba', slug: 'orl' },
  { name: 'Philadelphia 76ers', abv: 'PHI', sport: 'nba', slug: 'phi' },
  { name: 'Phoenix Suns', abv: 'PHX', sport: 'nba', slug: 'phx' },
  { name: 'Portland Trail Blazers', abv: 'POR', sport: 'nba', slug: 'por' },
  { name: 'Sacramento Kings', abv: 'SAC', sport: 'nba', slug: 'sac' },
  { name: 'San Antonio Spurs', abv: 'SA', sport: 'nba', slug: 'sa' },
  { name: 'Toronto Raptors', abv: 'TOR', sport: 'nba', slug: 'tor' },
  { name: 'Utah Jazz', abv: 'UTA', sport: 'nba', slug: 'uta' },
  { name: 'Washington Wizards', abv: 'WAS', sport: 'nba', slug: 'was' },
];

const SPORT_PAGES = [
  { name: 'MLB Baseball', url: '/mlb' },
  { name: 'NFL Football', url: '/nfl' },
  { name: 'NBA Basketball', url: '/nba' },
  { name: 'College Football', url: '/cfb' },
  { name: 'College Baseball', url: '/college-baseball' },
  { name: 'Arcade Games', url: '/arcade' },
  { name: 'Dashboard', url: '/dashboard' },
];

// ---------------------------------------------------------------------------
// College Baseball Search Index
// ---------------------------------------------------------------------------

async function searchCollegeBaseballIndex(
  normalized: string,
  env: Env,
  limit: number,
): Promise<SearchResult[]> {
  const cacheKey = `search:cbb:${normalized}`;
  const cached = await kvGet<SearchResult[]>(env.KV, cacheKey);
  if (cached) return cached;

  const results: SearchResult[] = [];

  // Teams from teamMetadata
  for (const [slug, meta] of Object.entries(teamMetadata)) {
    const score = Math.max(
      computeScore(meta.name, normalized),
      computeScore(meta.shortName, normalized),
      computeScore(meta.abbreviation, normalized),
    );
    if (score > 0) {
      results.push({
        type: 'team',
        id: slug,
        name: meta.name,
        url: `/college-baseball/teams/${slug}`,
        sport: 'College Baseball',
        score,
      });
    }
  }

  // Teams from KV cache
  if (results.length < limit) {
    try {
      const teamList = await env.KV.list({ prefix: 'cb:team:', limit: 50 });
      for (const key of teamList.keys) {
        const data = await kvGet<{ team: { name: string; id: number } }>(env.KV, key.name);
        if (!data?.team?.name) continue;
        const score = computeScore(data.team.name, normalized);
        if (score > 0) {
          const exists = results.some(
            (r) => r.type === 'team' && r.name.toLowerCase() === data.team.name.toLowerCase(),
          );
          if (!exists) {
            results.push({
              type: 'team',
              id: String(data.team.id),
              name: data.team.name,
              url: `/college-baseball/teams/${data.team.id}`,
              sport: 'College Baseball',
              score,
            });
          }
        }
        if (results.length >= limit) break;
      }
    } catch {
      // Non-fatal
    }
  }

  // Players from KV
  if (results.length < limit) {
    try {
      const playerList = await env.KV.list({ prefix: 'cb:players:list:', limit: 10 });
      for (const key of playerList.keys) {
        const roster = await kvGet<Array<Record<string, unknown>>>(env.KV, key.name);
        if (!Array.isArray(roster)) continue;
        for (const p of roster) {
          const pName = (p.displayName || p.fullName || p.name || '') as string;
          if (!pName) continue;
          const score = computeScore(pName, normalized);
          if (score > 0) {
            results.push({
              type: 'player',
              id: String(p.id || ''),
              name: pName,
              url: `/college-baseball/players/${p.id}`,
              sport: 'College Baseball',
              score,
            });
          }
          if (results.length >= limit) break;
        }
        if (results.length >= limit) break;
      }
    } catch {
      // Non-fatal
    }
  }

  // Articles from KV
  if (results.length < limit) {
    try {
      const newsCached = await kvGet<{ articles?: Array<{ id: string; title: string; url?: string }> }>(env.KV, 'cb:news');
      if (newsCached?.articles) {
        for (const article of newsCached.articles) {
          const score = computeScore(article.title, normalized);
          if (score > 0) {
            results.push({
              type: 'article',
              id: article.id,
              name: article.title,
              url: article.url || '/college-baseball/news',
              sport: 'College Baseball',
              score,
            });
          }
          if (results.length >= limit) break;
        }
      }
    } catch {
      // Non-fatal
    }
  }

  results.sort((a, b) => b.score - a.score);
  const capped = results.slice(0, limit);

  await kvPut(env.KV, cacheKey, capped, 300);
  return capped;
}

// ---------------------------------------------------------------------------
// D1 FTS5 Search
// ---------------------------------------------------------------------------

/**
 * Query D1 FTS5 search index. Returns ranked results or null if D1 is
 * unavailable or the FTS5 table doesn't exist yet.
 */
async function searchD1FTS5(
  query: string,
  sport: string,
  env: Env,
  limit: number,
): Promise<SearchResult[] | null> {
  if (!env.DB) return null;

  try {
    // FTS5 MATCH query — quote the query to handle multi-word input
    // Using bm25() for relevance ranking (built into FTS5)
    const ftsQuery = query.replace(/"/g, '""'); // escape double quotes
    const sportFilter = sport !== 'all' ? ` AND sport = ?` : '';

    const sql = sport !== 'all'
      ? `SELECT name, type, sport, url, rank FROM search_index WHERE search_index MATCH ? ${sportFilter} ORDER BY rank LIMIT ?`
      : `SELECT name, type, sport, url, rank FROM search_index WHERE search_index MATCH ? ORDER BY rank LIMIT ?`;

    const stmt = sport !== 'all'
      ? env.DB.prepare(sql).bind(`"${ftsQuery}"`, sport, limit)
      : env.DB.prepare(sql).bind(`"${ftsQuery}"`, limit);

    const { results: rows } = await stmt.all<{
      name: string;
      type: string;
      sport: string;
      url: string;
      rank: number;
    }>();

    if (!rows || rows.length === 0) return null;

    return rows.map((row, i) => ({
      type: row.type as SearchResult['type'],
      id: row.url,
      name: row.name.split(' ').slice(0, -1).join(' ') || row.name, // trim appended abbreviation
      url: row.url,
      sport: row.sport,
      score: 100 - i, // normalize rank to descending score
    }));
  } catch {
    // FTS5 table may not exist yet — fall through to static search
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main Search Handler
// ---------------------------------------------------------------------------

export async function handleSearch(url: URL, env: Env): Promise<Response> {
  const query = url.searchParams.get('q')?.trim();
  if (!query || query.length < 2) {
    return json({ results: [], message: 'Query must be at least 2 characters' }, 400);
  }

  const sport = url.searchParams.get('sport') || 'all';
  const normalized = normalizeSearchTerm(query);
  const now = new Date().toISOString();

  // Try D1 FTS5 first — ranked full-text search
  const ftsResults = await searchD1FTS5(normalized, sport, env, 20);
  if (ftsResults && ftsResults.length > 0) {
    // Merge FTS5 results with pro-team static matches for completeness
    const combined: SearchResult[] = [...ftsResults];

    // Always include pro-team static matches (FTS5 may not index them yet)
    if (sport === 'all' || sport !== 'college-baseball') {
      for (const team of PRO_TEAMS) {
        if (sport !== 'all' && team.sport !== sport) continue;
        const score = Math.max(
          computeScore(team.name, normalized),
          team.abv.toLowerCase() === normalized ? 95 : 0,
        );
        if (score > 0) {
          const teamUrl = `/${team.sport}/teams/${team.slug}`;
          if (!combined.some((r) => r.url === teamUrl)) {
            combined.push({
              type: 'team',
              id: team.slug,
              name: team.name,
              url: teamUrl,
              sport: team.sport.toUpperCase(),
              score,
            });
          }
        }
      }
    }

    const sorted = combined.sort((a, b) => b.score - a.score).slice(0, 20);
    return json({
      results: sorted,
      query,
      meta: { source: 'bsi-search-fts5', fetched_at: now, timezone: 'America/Chicago' },
    });
  }

  // Fallback: static search (existing behavior)
  const results: SearchResult[] = [];

  // College Baseball — enhanced KV-backed index
  if (sport === 'all' || sport === 'college-baseball') {
    const cbbResults = await searchCollegeBaseballIndex(normalized, env, 20);
    results.push(...cbbResults);
  }

  // Pro teams — instant static match
  if (sport === 'all' || sport !== 'college-baseball') {
    for (const team of PRO_TEAMS) {
      if (sport !== 'all' && team.sport !== sport) continue;
      const score = Math.max(
        computeScore(team.name, normalized),
        team.abv.toLowerCase() === normalized ? 95 : 0,
      );
      if (score > 0) {
        results.push({
          type: 'team',
          id: team.slug,
          name: team.name,
          url: `/${team.sport}/teams/${team.slug}`,
          sport: team.sport.toUpperCase(),
          score,
        });
      }
      if (results.length >= 30) break;
    }
  }

  // Sport pages
  if (sport === 'all') {
    for (const page of SPORT_PAGES) {
      const score = computeScore(page.name, normalized);
      if (score > 0) {
        results.push({ type: 'page', id: page.url, name: page.name, url: page.url, score });
      }
    }
  }

  // Deduplicate by url
  const seen = new Map<string, SearchResult>();
  for (const r of results) {
    const existing = seen.get(r.url);
    if (!existing || r.score > existing.score) {
      seen.set(r.url, r);
    }
  }

  const sorted = Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return json({
    results: sorted,
    query,
    meta: { source: 'bsi-search', fetched_at: now, timezone: 'America/Chicago' },
  });
}
