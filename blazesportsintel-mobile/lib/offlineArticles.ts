import * as SQLite from 'expo-sqlite';
import type { Article } from '@shared/types/articles';

const db = SQLite.openDatabaseSync('bsi_articles.db');

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
interface OfflineArticleRow {
  slug: string;
  title: string;
  body: string;
  sport: string | null;
  hero_image_url: string | null;
  cached_at: number;
}

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
export function initOfflineArticles(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS articles_cache (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      sport TEXT,
      hero_image_url TEXT,
      cached_at INTEGER NOT NULL
    );
    DELETE FROM articles_cache WHERE cached_at < strftime('%s','now','-30 day');
  `);
}

export function saveOfflineArticle(article: Article): void {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  if (!article.body) return;
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  if (!article.body) {
    return;
  }

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  db.runSync(
    `INSERT INTO articles_cache (slug, title, body, sport, hero_image_url, cached_at)
     VALUES (?, ?, ?, ?, ?, strftime('%s','now'))
     ON CONFLICT(slug) DO UPDATE SET
      title=excluded.title,
      body=excluded.body,
      sport=excluded.sport,
      hero_image_url=excluded.hero_image_url,
      cached_at=excluded.cached_at`,
    [article.slug, article.title, article.body, article.sport ?? null, article.heroImage ?? null]
  );
}

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
export function getOfflineArticle(slug: string): Article | null {
  const row = db.getFirstSync<{
    slug: string;
    title: string;
    body: string;
    sport: string | null;
    hero_image_url: string | null;
  }>('SELECT slug, title, body, sport, hero_image_url FROM articles_cache WHERE slug = ?', [slug]);

  if (!row) {
    return null;
  }

=======
function rowToArticle(row: OfflineArticleRow): Article {
>>>>>>> theirs
=======
function rowToArticle(row: OfflineArticleRow): Article {
>>>>>>> theirs
=======
function rowToArticle(row: OfflineArticleRow): Article {
>>>>>>> theirs
  return {
    slug: row.slug,
    title: row.title,
    body: row.body,
    sport: row.sport,
    excerpt: null,
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    publishedAt: new Date().toISOString(),
    heroImage: row.hero_image_url
  };
}
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    publishedAt: new Date(row.cached_at * 1000).toISOString(),
    heroImage: row.hero_image_url
  };
}

export function getOfflineArticle(slug: string): Article | null {
  const row = db.getFirstSync<OfflineArticleRow>(
    'SELECT slug, title, body, sport, hero_image_url, cached_at FROM articles_cache WHERE slug = ?',
    [slug]
  );

  return row ? rowToArticle(row) : null;
}

export function getAllOfflineArticles(): Article[] {
  const rows = db.getAllSync<OfflineArticleRow>(
    'SELECT slug, title, body, sport, hero_image_url, cached_at FROM articles_cache ORDER BY cached_at DESC'
  );
  return rows.map(rowToArticle);
}

export function isOfflineArticleSaved(slug: string): boolean {
  const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM articles_cache WHERE slug = ?', [slug]);
  return Boolean(row && row.count > 0);
}
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
