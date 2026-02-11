'use client';

import { Newspaper } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { IntelSport, NewsItem } from '@/lib/intel/types';
import { SPORT_LABELS } from '@/lib/intel/types';

interface NewsFeedProps {
  articles: NewsItem[];
  isLoading?: boolean;
  sport?: IntelSport;
}

export function NewsFeed({ articles, isLoading, sport = 'all' }: NewsFeedProps) {
  const formatPublished = (value: string) => {
    const ts = Date.parse(value);
    if (!Number.isFinite(ts)) return '';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="intel-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="intel-section-label">
          <Newspaper className="h-4 w-4" style={{ color: 'var(--bsi-intel-accent, var(--bsi-ember, #FF6B35))' }} />
          News Feed
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]" style={{ fontFamily: 'var(--intel-mono)' }}>
            {SPORT_LABELS[sport]}
          </Badge>
          <Badge variant="outline" className="text-[10px]" style={{ fontFamily: 'var(--intel-mono)' }}>
            {isLoading ? '...' : articles.length}
          </Badge>
        </div>
      </div>

      <hr className="intel-rule mx-4 mt-3" />

      <div className="px-4 pb-4 pt-3">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse"
                style={{ background: 'var(--intel-bg-elevated)', borderRadius: '2px' }}
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--intel-text-caption)' }}>No recent news.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {articles.slice(0, 9).map((a) => (
              <a
                key={a.id}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden transition-all hover:bg-[var(--intel-bg-elevated)]"
                style={{
                  border: '1px solid var(--intel-border-rule)',
                  borderRadius: '2px',
                  background: 'var(--intel-bg-panel)',
                }}
              >
                {a.image ? (
                  <img
                    src={a.image}
                    alt=""
                    className="h-28 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-28 w-full" style={{ background: 'var(--intel-bg-elevated)' }} />
                )}
                <div className="p-3">
                  <div
                    className="intel-narrative text-[0.8rem] leading-snug line-clamp-3 group-hover:text-white/90"
                    style={{ fontStyle: 'normal', color: 'var(--intel-text-headline)' }}
                  >
                    {a.headline}
                  </div>
                  {a.description && (
                    <div className="mt-1 line-clamp-2 text-[0.65rem]" style={{ fontFamily: 'var(--intel-mono)', color: 'var(--intel-text-caption)' }}>
                      {a.description}
                    </div>
                  )}
                  {a.published && (
                    <div className="intel-caption mt-2">
                      {formatPublished(a.published)}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
