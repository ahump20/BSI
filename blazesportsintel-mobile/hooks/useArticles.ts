import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@shared/api/client';
import type { Article } from '@shared/types/articles';

type ArticlesEnvelope = { posts?: Article[] } | Article[];

function normalizeArticles(payload: ArticlesEnvelope): Article[] {
  if (Array.isArray(payload)) return payload;
  const envelope = payload as { posts?: Article[] };
  return Array.isArray(envelope.posts) ? envelope.posts : [];
}

export function useArticles(sport: string) {
  return useQuery({
    queryKey: ['articles', sport],
    queryFn: async () => {
      const payload = await apiGet<ArticlesEnvelope>('/api/blog-post-feed');
      const articles = normalizeArticles(payload);
      return sport === 'all' ? articles : articles.filter((article) => article.sport === sport);
    },
    staleTime: 300_000
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => apiGet<Article>(`/api/blog-post-feed/${slug}`),
    staleTime: 1_800_000,
    enabled: slug.length > 0
  });
}
