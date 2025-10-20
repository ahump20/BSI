import { getCachedJSON, setCachedJSON } from '@/lib/cache/redis';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const ARTICLES_CACHE_PREFIX = 'api:v1:articles';

export type ArticleTier = 'free' | 'pro';
export type ArticleType = 'recap' | 'preview' | 'feature' | 'breaking' | string;

export interface ArticlesQueryParams {
  limit?: number;
  offset?: number;
  type?: ArticleType;
  tier?: ArticleTier;
  publishedAfter?: string;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  type: ArticleType;
  tier: ArticleTier;
  heroImageUrl?: string | null;
  publishedAt: Date;
  updatedAt?: Date | null;
  sourceUrl?: string | null;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  author?: string | null;
  tags: string[];
}

export interface ArticlesResponse {
  articles: ArticleSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  type: string;
  tier: string;
  heroImageUrl?: string | null;
  publishedAt: Date;
  updatedAt?: Date | null;
  sourceUrl?: string | null;
};

type ArticleDetailRow = ArticleRow & {
  content: string | null;
  author?: string | null;
  tags?: string[] | string | null;
};

function mapRowToSummary(row: ArticleRow): ArticleSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    type: row.type,
    tier: (row.tier as ArticleTier) ?? 'free',
    heroImageUrl: row.heroImageUrl ?? undefined,
    publishedAt: new Date(row.publishedAt),
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    sourceUrl: row.sourceUrl ?? undefined,
  };
}

function normaliseTags(tags?: string[] | string | null): string[] {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.filter((tag) => Boolean(tag)).map((tag) => tag.trim());
  }

  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export async function getArticles(params: ArticlesQueryParams = {}): Promise<ArticlesResponse> {
  const { limit = 12, offset = 0, type, tier, publishedAfter } = params;
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const cacheKey = `${ARTICLES_CACHE_PREFIX}:list:${type ?? 'all'}:${tier ?? 'all'}:${
    publishedAfter ?? 'any'
  }:${safeLimit}:${offset}`;
  const cached = await getCachedJSON<ArticlesResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const filters: Prisma.Sql[] = [];
  if (type) {
    filters.push(Prisma.sql`type = ${type}`);
  }
  if (tier) {
    filters.push(Prisma.sql`tier = ${tier}`);
  }
  if (publishedAfter) {
    const parsedDate = new Date(publishedAfter);
    if (!Number.isNaN(parsedDate.getTime())) {
      filters.push(Prisma.sql`published_at >= ${parsedDate.toISOString()}`);
    }
  }

  const whereClause = filters.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(filters, Prisma.sql` AND `)}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw<ArticleRow[]>(Prisma.sql`
    SELECT
      id,
      slug,
      title,
      summary,
      type,
      tier,
      hero_image_url as "heroImageUrl",
      published_at as "publishedAt",
      updated_at as "updatedAt",
      source_url as "sourceUrl"
    FROM articles
    ${whereClause}
    ORDER BY published_at DESC
    LIMIT ${safeLimit}
    OFFSET ${offset}
  `);

  const totalResult = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint as count
    FROM articles
    ${whereClause}
  `);

  const total = Number(totalResult[0]?.count ?? 0);
  const articles = rows.map(mapRowToSummary);

  const response: ArticlesResponse = {
    articles,
    pagination: {
      total,
      limit: safeLimit,
      offset,
      hasMore: offset + safeLimit < total,
    },
  };

  await setCachedJSON(cacheKey, response, 300);

  return response;
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  const cacheKey = `${ARTICLES_CACHE_PREFIX}:detail:${slug}`;
  const cached = await getCachedJSON<ArticleDetail>(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await prisma.$queryRaw<ArticleDetailRow[]>(Prisma.sql`
    SELECT
      id,
      slug,
      title,
      summary,
      type,
      tier,
      hero_image_url as "heroImageUrl",
      published_at as "publishedAt",
      updated_at as "updatedAt",
      source_url as "sourceUrl",
      content,
      author_name as "author",
      tags
    FROM articles
    WHERE slug = ${slug}
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const detail: ArticleDetail = {
    ...mapRowToSummary(row),
    content: row.content ?? '',
    author: row.author ?? undefined,
    tags: normaliseTags(row.tags),
  };

  await setCachedJSON(cacheKey, detail, 900);

  return detail;
}
