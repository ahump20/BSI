import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@shared/api/client';
import type { Article } from '@shared/types/articles';

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
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
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
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
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
}

export function useArticles(sport: string) {
  return useQuery({
    queryKey: ['articles', sport],
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    queryFn: () => fetchArticles(sport),
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    queryFn: async () => {
      const payload = await apiGet<unknown>('/api/blog-post-feed');
      const articles = extractArticles(payload);
      return sport === 'all' ? articles : articles.filter((article) => article.sport === sport);
    },
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    staleTime: 300_000
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    queryFn: () => apiGet<Article>(`/api/blog-post-feed/${slug}`),
=======
    queryFn: async () => normalizeArticle(await apiGet<unknown>(`/api/blog-post-feed/${slug}`)),
>>>>>>> theirs
=======
    queryFn: async () => normalizeArticle(await apiGet<unknown>(`/api/blog-post-feed/${slug}`)),
>>>>>>> theirs
=======
    queryFn: async () => normalizeArticle(await apiGet<unknown>(`/api/blog-post-feed/${slug}`)),
>>>>>>> theirs
    staleTime: 1_800_000,
    enabled: slug.length > 0
  });
}
