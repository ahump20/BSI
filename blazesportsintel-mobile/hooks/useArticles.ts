import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@shared/api/client';
import type { Article } from '@shared/types/articles';

// Blog post feed returns { posts: Article[], total: number, page: number, limit: number }
interface BlogFeedEnvelope {
  posts?: unknown;
  data?: unknown;
  [key: string]: unknown;
}

async function fetchArticles(sport: string): Promise<Article[]> {
  const envelope = await apiGet<BlogFeedEnvelope>('/api/blog-post-feed');
  const payload = envelope?.posts ?? envelope?.data ?? envelope;
  const all: Article[] = Array.isArray(payload) ? (payload as Article[]) : [];
  return sport === 'all' ? all : all.filter((article) => article.sport === sport);
}

export function useArticles(sport: string) {
  return useQuery({
    queryKey: ['articles', sport],
    queryFn: () => fetchArticles(sport),
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
