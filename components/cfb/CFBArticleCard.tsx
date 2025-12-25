'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface CFBArticleCardProps {
  slug: string;
  title: string;
  excerpt: string | null;
  contentType: 'preview' | 'recap';
  publishedAt: string | null;
  gameId?: string | null;
  className?: string;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  });
}

export function CFBArticleCard({
  slug,
  title,
  excerpt,
  contentType,
  publishedAt,
  className = '',
}: CFBArticleCardProps) {
  const isPreview = contentType === 'preview';

  return (
    <Link href={`/cfb/articles/${slug}`} className={`block ${className}`}>
      <Card
        variant="default"
        padding="md"
        className="h-full transition-all duration-200 hover:border-burnt-orange/50 hover:shadow-lg hover:shadow-burnt-orange/10 group"
      >
        <div className="flex flex-col h-full">
          {/* Badge and Date */}
          <div className="flex items-center justify-between mb-3">
            <Badge variant={isPreview ? 'primary' : 'success'}>
              {isPreview ? 'Preview' : 'Recap'}
            </Badge>
            {publishedAt && (
              <span className="text-xs text-text-tertiary">
                {formatDate(publishedAt)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-burnt-orange transition-colors">
            {title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-sm text-text-tertiary mb-4 line-clamp-3 flex-grow">
              {excerpt}
            </p>
          )}

          {/* CTA */}
          <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between">
            <span className="text-sm font-medium text-burnt-orange group-hover:underline">
              {isPreview ? 'Read Full Preview' : 'Read Full Recap'}
            </span>
            <svg
              className="w-4 h-4 text-burnt-orange transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default CFBArticleCard;
