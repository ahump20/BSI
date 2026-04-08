/**
 * Search Index Population — populates D1 FTS5 search index.
 *
 * Full rebuild: clears the FTS5 table and inserts all known entities
 * (teams, pages, articles, conferences, pro teams). Runs once per day.
 */

import type { Env } from '../../shared/types';
import { kvGet } from '../../shared/helpers';
import { teamMetadata } from '../../../lib/data/team-metadata';

/** Static pages to index for search. */
const INDEXED_PAGES = [
  { name: 'MLB Baseball', url: '/mlb', sport: 'mlb' },
  { name: 'NFL Football', url: '/nfl', sport: 'nfl' },
  { name: 'NBA Basketball', url: '/nba', sport: 'nba' },
  { name: 'College Football', url: '/cfb', sport: 'cfb' },
  { name: 'College Baseball', url: '/college-baseball', sport: 'ncaa' },
  { name: 'Scores', url: '/scores', sport: '' },
  { name: 'Dashboard', url: '/dashboard', sport: '' },
  { name: 'Arcade Games', url: '/arcade', sport: '' },
  { name: 'Data Sources', url: '/data-sources', sport: '' },
  { name: 'Pricing', url: '/pricing', sport: '' },
  { name: 'About BSI', url: '/about', sport: '' },
  { name: 'College Baseball Rankings', url: '/college-baseball/rankings', sport: 'ncaa' },
  { name: 'College Baseball Standings', url: '/college-baseball/standings', sport: 'ncaa' },
  { name: 'College Baseball Scores', url: '/college-baseball/scores', sport: 'ncaa' },
  { name: 'Transfer Portal', url: '/college-baseball/transfer-portal', sport: 'ncaa' },
];

/**
 * Populate D1 FTS5 search index. Runs once per day.
 * Full rebuild: clears the FTS5 table and inserts all known entities.
 */
export async function populateSearchIndex(env: Env): Promise<void> {
  if (!env.DB) return; // D1 not bound — skip silently

  // Clear existing FTS5 content for full rebuild
  await env.DB.prepare('DELETE FROM search_index').run();
  await env.DB.prepare('DELETE FROM search_index_meta').run();

  const rows: Array<{ name: string; type: string; sport: string; url: string }> = [];

  // College baseball teams from teamMetadata
  for (const [slug, meta] of Object.entries(teamMetadata)) {
    rows.push({
      name: `${meta.name} ${meta.abbreviation} ${meta.shortName}`,
      type: 'team',
      sport: 'College Baseball',
      url: `/college-baseball/teams/${slug}`,
    });
  }

  // Static pages
  for (const page of INDEXED_PAGES) {
    rows.push({ name: page.name, type: 'page', sport: page.sport, url: page.url });
  }

  // Articles from KV (if available)
  try {
    const newsCached = await kvGet<{ articles?: Array<{ id: string; title: string; url?: string }> }>(env.KV, 'cb:news');
    if (newsCached?.articles) {
      for (const article of newsCached.articles) {
        rows.push({
          name: article.title,
          type: 'article',
          sport: 'College Baseball',
          url: article.url || '/college-baseball/news',
        });
      }
    }
  } catch {
    // Non-fatal — articles are supplementary
  }

  // Editorial articles from D1
  try {
    const { results: editorials } = await env.DB.prepare(
      'SELECT slug, title, category FROM editorials ORDER BY date DESC LIMIT 100'
    ).all<{ slug: string; title: string; category: string }>();
    if (editorials) {
      for (const ed of editorials) {
        rows.push({
          name: ed.title,
          type: 'article',
          sport: 'College Baseball',
          url: `/college-baseball/editorial/${ed.slug}`,
        });
      }
    }
  } catch {
    // editorials table may not exist yet
  }

  // Conferences
  const conferences = ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12', 'Sun Belt', 'AAC', 'Big East', 'Big West', 'C-USA', 'Mountain West'];
  for (const conf of conferences) {
    const slug = conf.toLowerCase().replace(/\s+/g, '-');
    rows.push({
      name: `${conf} Conference Baseball`,
      type: 'page',
      sport: 'College Baseball',
      url: `/college-baseball/conferences/${slug}`,
    });
  }

  // Pro teams (MLB, NFL, NBA)
  const proTeams: Array<{ name: string; sport: string; slug: string }> = [
    { name: 'New York Yankees', sport: 'MLB', slug: 'nyy' },
    { name: 'Los Angeles Dodgers', sport: 'MLB', slug: 'lad' },
    { name: 'Houston Astros', sport: 'MLB', slug: 'hou' },
    { name: 'Texas Rangers', sport: 'MLB', slug: 'tex' },
    { name: 'St. Louis Cardinals', sport: 'MLB', slug: 'stl' },
    { name: 'Kansas City Chiefs', sport: 'NFL', slug: 'chiefs' },
    { name: 'Dallas Cowboys', sport: 'NFL', slug: 'cowboys' },
    { name: 'San Francisco 49ers', sport: 'NFL', slug: '49ers' },
    { name: 'Boston Celtics', sport: 'NBA', slug: 'bos' },
    { name: 'Los Angeles Lakers', sport: 'NBA', slug: 'lal' },
  ];
  for (const team of proTeams) {
    rows.push({
      name: team.name,
      type: 'team',
      sport: team.sport,
      url: `/${team.sport.toLowerCase()}/teams/${team.slug}`,
    });
  }

  // Batch insert in chunks of 50 (D1 batch limit considerations)
  const CHUNK_SIZE = 50;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const stmts = chunk.map((row) =>
      env.DB.prepare('INSERT INTO search_index (name, type, sport, url) VALUES (?, ?, ?, ?)')
        .bind(row.name, row.type, row.sport, row.url)
    );
    await env.DB.batch(stmts);
  }

  // Write meta for tracking
  const metaStmts = rows.map((row) =>
    env.DB.prepare("INSERT OR REPLACE INTO search_index_meta (url, updated_at) VALUES (?, datetime('now'))")
      .bind(row.url)
  );
  for (let i = 0; i < metaStmts.length; i += CHUNK_SIZE) {
    await env.DB.batch(metaStmts.slice(i, i + CHUNK_SIZE));
  }
}
