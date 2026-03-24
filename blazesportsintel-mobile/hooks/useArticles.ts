import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@shared/api/client';
import type { Article } from '@shared/types/articles';

export function useArticles(sport: string) {
  return useQuery({
    queryKey: ['articles', sport],
    queryFn: async () => {
      const articles = await apiGet<Article[]>('/api/blog-post-feed');
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
