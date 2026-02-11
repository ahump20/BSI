'use client';

import { Newspaper } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
    <Card variant="default" padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle size="sm" className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" style={{ color: 'var(--bsi-intel-accent, var(--bsi-ember, #FF6B35))' }} />
            News Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono">
              {SPORT_LABELS[sport]}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              {isLoading ? '...' : articles.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/30">No recent news.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {articles.slice(0, 9).map((a) => (
              <a
                key={a.id}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                {a.image ? (
                  <img
                    src={a.image}
                    alt=""
                    className="h-28 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-28 w-full bg-white/[0.04]" />
                )}
                <div className="p-3">
                  <div className="font-mono text-[12px] leading-snug text-white/80 line-clamp-3 group-hover:text-white">
                    {a.headline}
                  </div>
                  {a.description && (
                    <div className="mt-1 font-mono text-[10px] text-white/40 line-clamp-2">
                      {a.description}
                    </div>
                  )}
                  {a.published && (
                    <div className="mt-2 font-mono text-[10px] text-white/35">
                      {formatPublished(a.published)}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
