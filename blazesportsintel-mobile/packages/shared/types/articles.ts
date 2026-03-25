export interface Article {
  slug: string;
  title: string;
  sport: string | null;
  excerpt: string | null;
  publishedAt: string;
  heroImage: string | null;
  body?: string;
  raw?: unknown;
}
