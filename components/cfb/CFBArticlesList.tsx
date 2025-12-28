'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CFBArticleCard, type CFBArticleCardProps } from './CFBArticleCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export interface CFBArticlesListProps {
  type: 'preview' | 'recap';
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

interface ArticleData {
  slug: string;
  title: string;
  excerpt: string | null;
  contentType: 'preview' | 'recap';
  publishedAt: string | null;
  gameId: string | null;
}

interface ApiResponse {
  articles: ArticleData[];
  total: number;
}

export function CFBArticlesList({
  type,
  limit = 6,
  showViewAll = true,
  className = '',
}: CFBArticlesListProps) {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        setError(null);

        const endpoint = type === 'preview' ? '/api/cfb/previews' : '/api/cfb/recaps';
        const response = await fetch(`${endpoint}?limit=${limit}`);

        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        const data: ApiResponse = await response.json();
        setArticles(data.articles || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('CFB Articles fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [type, limit]);

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
          <div key={i} className="space-y-4 p-4 bg-charcoal rounded-lg">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-text-tertiary mb-4">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-text-tertiary">
          No {type === 'preview' ? 'upcoming previews' : 'recent recaps'} available yet.
        </p>
        <p className="text-sm text-text-muted mt-2">
          Check back closer to game day.
        </p>
      </div>
    );
  }

  const viewAllPath = type === 'preview' ? '/cfb/previews' : '/cfb/recaps';

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <CFBArticleCard
            key={article.slug}
            slug={article.slug}
            title={article.title}
            excerpt={article.excerpt}
            contentType={article.contentType}
            publishedAt={article.publishedAt}
            gameId={article.gameId}
          />
        ))}
      </div>

      {showViewAll && total > limit && (
        <div className="mt-8 text-center">
          <Link href={viewAllPath}>
            <Button variant="secondary">
              View All {type === 'preview' ? 'Previews' : 'Recaps'} ({total})
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default CFBArticlesList;
