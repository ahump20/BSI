import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@shared/api/client';
import type { Article } from '@shared/types/articles';

function normalizeArticle(value: unknown): Article {
  const item = (value ?? {}) as Record<string, unknown>;
  return {
    slug: String(item.slug ?? ''),
    title: String(item.title ?? 'Untitled'),
    sport: typeof item.sport === 'string' ? item.sport : null,
    excerpt: typeof item.excerpt === 'string' ? item.excerpt : null,
    publishedAt: String(item.publishedAt ?? item.date ?? new Date().toISOString()),
    heroImage: typeof item.heroImage === 'string' ? item.heroImage : typeof item.hero_image === 'string' ? item.hero_image : null,
    body: typeof item.body === 'string' ? item.body : undefined,
    raw: item
  };
}

function extractArticles(payload: unknown): Article[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeArticle).filter((article) => article.slug.length > 0);
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data.map(normalizeArticle).filter((article) => article.slug.length > 0);
    }
  }

  return [];
}

export function useArticles(sport: string) {
  return useQuery({
    queryKey: ['articles', sport],
    queryFn: async () => {
      const payload = await apiGet<unknown>('/api/blog-post-feed');
      const articles = extractArticles(payload);
      return sport === 'all' ? articles : articles.filter((article) => article.sport === sport);
    },
    staleTime: 300_000
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: async () => normalizeArticle(await apiGet<unknown>(`/api/blog-post-feed/${slug}`)),
    staleTime: 1_800_000,
    enabled: slug.length > 0
  });
}
