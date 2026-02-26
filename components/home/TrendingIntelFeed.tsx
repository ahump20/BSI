'use client';

import { useState, useEffect } from 'react';

interface Article {
  headline: string;
  description?: string;
  published: string;
  links?: { web?: { href?: string } };
}

interface IntelResult {
  sport: string;
  articles: Article[];
}

interface FlatArticle {
  sport: string;
  headline: string;
  description?: string;
  published: string;
  url?: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const SPORT_COLORS: Record<string, string> = {
  mlb: '#C41E3A',
  nfl: '#013369',
  nba: '#FF6B35',
  ncaa: '#BF5700',
  'college-baseball': '#BF5700',
};

export function TrendingIntelFeed() {
  const [articles, setArticles] = useState<FlatArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchIntel() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/intel/news?sport=all`);
        if (!res.ok) throw new Error('Intel fetch failed');
        const raw = await res.json();
        if (cancelled) return;
        setError(false);

        // API returns array of { sport, data: { articles } } or { results: [...] }
        const entries: IntelResult[] = Array.isArray(raw)
          ? raw.map((r: { sport: string; data?: { articles?: Article[] }; articles?: Article[] }) => ({
              sport: r.sport,
              articles: r.data?.articles || r.articles || [],
            }))
          : (raw as { results?: IntelResult[] }).results || [];

        const flat: FlatArticle[] = entries.flatMap((r) =>
          r.articles.map((a) => ({
            sport: r.sport,
            headline: a.headline,
            description: a.description,
            published: a.published,
            url: a.links?.web?.href,
          }))
        );

        flat.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
        setArticles(flat.slice(0, 8));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchIntel();
    const interval = setInterval(fetchIntel, 120_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="glass-default rounded-2xl p-6 h-full flex flex-col hover:shadow-glow-sm transition-shadow duration-300">
      <h3 className="font-display text-lg text-text-primary uppercase tracking-wide mb-4">
        Trending Intel
      </h3>

      <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] lg:max-h-[500px]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5 animate-pulse">
              <div className="h-3 bg-surface-light rounded w-16" />
              <div className="h-4 bg-surface-light rounded w-full" />
            </div>
          ))
        ) : error ? (
          <p className="text-sm text-text-muted py-4 text-center">Intel feed temporarily unavailable.</p>
        ) : articles.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No intel available right now.</p>
        ) : (
          articles.map((article, i) => {
            const color = SPORT_COLORS[article.sport] || '#BF5700';
            const inner = (
              <div className="group/item py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded tracking-wider"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {article.sport}
                  </span>
                  <span className="text-[10px] text-white/30">{relativeTime(article.published)}</span>
                </div>
                <p className="text-sm text-white/80 leading-snug line-clamp-1 group-hover/item:text-white transition-colors">
                  {article.headline}
                </p>
                {article.description && (
                  <p className="text-xs text-white/30 mt-0.5 line-clamp-1 hidden lg:block">
                    {article.description}
                  </p>
                )}
              </div>
            );

            return article.url ? (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <div key={i}>{inner}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
