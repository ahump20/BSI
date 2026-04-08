'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { withAlpha } from '@/lib/utils/color';
import { getReadApiUrl } from '@/lib/utils/public-api';

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
  nba: '#FF6B35', // token: --bsi-accent
  ncaa: '#BF5700', // token: --bsi-primary
  'college-baseball': '#BF5700', // token: --bsi-primary
};

export function TrendingIntelFeed() {
  const [articles, setArticles] = useState<FlatArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchIntel(signal?: AbortSignal) {
      try {
        const res = await fetch(getReadApiUrl('/api/intel/news?sport=all'), { signal });
        if (!res.ok) throw new Error('Intel fetch failed');
        const raw = await res.json();
        if (cancelled) return;
        setError(false);

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
        setLastFetched(new Date());
      } catch (err) {
        if ((err as Error).name !== 'AbortError' && !cancelled) setError(true);
      } finally {
        setLoading(false);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetchIntel(controller.signal).finally(() => clearTimeout(timeout));

    const interval = setInterval(() => {
      fetchIntel(AbortSignal.timeout(8000));
    }, 120_000);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="heritage-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="font-display text-lg uppercase tracking-wide"
          style={{ color: 'var(--bsi-bone)' }}
        >
          Trending Intel
        </h3>
        <Link
          href="/intel"
          className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors"
          style={{ color: 'var(--heritage-columbia-blue)' }}
        >
          All Intel
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] lg:max-h-[500px]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5 animate-pulse">
              <div className="h-3 rounded-sm w-16" style={{ backgroundColor: 'var(--surface-press-box)' }} />
              <div className="h-4 rounded-sm w-full" style={{ backgroundColor: 'var(--surface-press-box)' }} />
            </div>
          ))
        ) : error ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--bsi-dust)' }}>Intel feed temporarily unavailable.</p>
        ) : articles.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--bsi-dust)' }}>No intel available right now.</p>
        ) : (
          articles.map((article, i) => {
            const color = SPORT_COLORS[article.sport] || '#BF5700'; // token: --bsi-primary
            const timeDiff = Date.now() - new Date(article.published).getTime();
            const isRecent = timeDiff < 3_600_000; // less than 1 hour
            const inner = (
              <div
                className="group/item py-2 last:border-0"
                style={{ borderBottom: '1px solid var(--border-vintage)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="heritage-stamp"
                    style={{ padding: '1px 6px', fontSize: '9px', backgroundColor: withAlpha(color, 0.12), color, borderColor: withAlpha(color, 0.3) }}
                  >
                    {article.sport}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{
                      color: isRecent ? 'var(--bsi-primary)' : 'var(--bsi-dust)',
                      fontFamily: 'var(--bsi-font-data)',
                      fontWeight: isRecent ? 600 : 400,
                    }}
                  >
                    {relativeTime(article.published)}
                  </span>
                </div>
                <p
                  className="text-sm leading-snug line-clamp-1 transition-colors"
                  style={{ color: 'var(--bsi-bone)' }}
                >
                  {article.headline}
                </p>
                {article.description && (
                  <p
                    className="text-xs mt-0.5 line-clamp-1 hidden lg:block"
                    style={{ color: 'var(--bsi-dust)' }}
                  >
                    {article.description}
                  </p>
                )}
              </div>
            );

            const stableKey = `${article.url || article.headline || 'item'}-${i}`;
            return article.url ? (
              <a key={stableKey} href={article.url} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <div key={stableKey}>{inner}</div>
            );
          })
        )}
      </div>

      {!loading && articles.length > 0 && lastFetched && (
        <p className="text-[10px] mt-2" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
          Source: ESPN News · Updated {lastFetched.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })} CT
        </p>
      )}
    </div>
  );
}
