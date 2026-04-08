import * as SQLite from 'expo-sqlite';
import type { Article } from '@shared/types/articles';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('bsi_articles.db');
  }
  return db;
}

interface OfflineArticleRow {
  slug: string;
  title: string;
  body: string;
  sport: string | null;
  hero_image_url: string | null;
  cached_at: number;
}

export async function initOfflineArticles(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
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

export async function saveOfflineArticle(article: Article): Promise<void> {
  if (!article.body) {
    return;
  }

  const database = await getDb();
  await database.runAsync(
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

function rowToArticle(row: OfflineArticleRow): Article {
  return {
    slug: row.slug,
    title: row.title,
    body: row.body,
    sport: row.sport,
    excerpt: null,
    publishedAt: new Date(row.cached_at * 1000).toISOString(),
    heroImage: row.hero_image_url
  };
}

export async function getOfflineArticle(slug: string): Promise<Article | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<OfflineArticleRow>(
    'SELECT slug, title, body, sport, hero_image_url, cached_at FROM articles_cache WHERE slug = ?',
    [slug]
  );

  return row ? rowToArticle(row) : null;
}

export async function getAllOfflineArticles(): Promise<Article[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<OfflineArticleRow>(
    'SELECT slug, title, body, sport, hero_image_url, cached_at FROM articles_cache ORDER BY cached_at DESC'
  );
  return rows.map(rowToArticle);
}

export async function isOfflineArticleSaved(slug: string): Promise<boolean> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM articles_cache WHERE slug = ?',
    [slug]
  );
  return Boolean(row && row.count > 0);
}
