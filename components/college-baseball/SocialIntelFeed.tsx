'use client';

/**
 * SocialIntelFeed — college baseball social intelligence hub component.
 *
 * Displays classified social signals (Reddit + Twitter) in a tabbed feed.
 * Tabs: All | Injury & Lineup | Transfer Portal | Recruiting | Sentiment
 *
 * Data source: GET /api/college-baseball/social-intel (KV-cached, 15 min TTL)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

type SignalType = 'all' | 'injury_lineup' | 'transfer_portal' | 'recruiting' | 'sentiment' | 'general';

interface SocialSignal {
  platform: 'reddit' | 'twitter';
  post_id: string;
  post_url: string | null;
  post_text: string;
  author: string | null;
  posted_at: string;
  signal_type: string;
  confidence: number;
  team_mentioned: string | null;
  player_mentioned: string | null;
  summary: string | null;
  raw_entities: { teams: string[]; players: string[] };
}

interface FeedResponse {
  signals: SocialSignal[];
  total: number;
  generated_at: string;
  meta: { source: string; fetched_at: string; timezone: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SIGNAL_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  injury_lineup: {
    label: 'Injury / Lineup',
    color: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error/25',
    dot: 'bg-error',
  },
  transfer_portal: {
    label: 'Transfer Portal',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/25',
    dot: 'bg-warning',
  },
  recruiting: {
    label: 'Recruiting',
    color: 'text-heritage-columbia',
    bg: 'bg-heritage-columbia/10',
    border: 'border-heritage-columbia/25',
    dot: 'bg-heritage-columbia',
  },
  sentiment: {
    label: 'Sentiment',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/25',
    dot: 'bg-success',
  },
  general: {
    label: 'General',
    color: 'text-text-muted',
    bg: 'bg-surface',
    border: 'border-border',
    dot: 'bg-bsi-dust',
  },
};

const PLATFORM_CONFIG = {
  reddit: {
    label: 'Reddit',
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/25',
    icon: (
      <svg viewBox="0 0 20 20" className="w-3 h-3 fill-current" aria-hidden>
        <circle cx="10" cy="10" r="10" className="fill-orange-500" />
        <path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.07 2.13.45a1 1 0 1 0 1-.97 1 1 0 0 0-.92.63l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .64-1.26zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.64a3.57 3.57 0 0 1-2.85.77 3.57 3.57 0 0 1-2.85-.77.27.27 0 0 1 .38-.38 3.07 3.07 0 0 0 2.47.62 3.07 3.07 0 0 0 2.47-.62.27.27 0 1 1 .38.38zm-.19-1.64a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
      </svg>
    ),
  },
  twitter: {
    label: 'X / Twitter',
    bg: 'bg-heritage-columbia/15',
    text: 'text-heritage-columbia',
    border: 'border-heritage-columbia/25',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
};

const TABS: { id: SignalType; label: string; shortLabel: string }[] = [
  { id: 'all', label: 'All Signals', shortLabel: 'All' },
  { id: 'injury_lineup', label: 'Injury / Lineup', shortLabel: 'Injury' },
  { id: 'transfer_portal', label: 'Transfer Portal', shortLabel: 'Portal' },
  { id: 'recruiting', label: 'Recruiting', shortLabel: 'Recruit' },
  { id: 'sentiment', label: 'Sentiment', shortLabel: 'Sentiment' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function confidenceLabel(c: number): string {
  if (c >= 0.8) return 'High';
  if (c >= 0.55) return 'Med';
  return 'Low';
}

function slugToDisplay(slug: string | null): string | null {
  if (!slug) return null;
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: SocialSignal }) {
  const config = SIGNAL_CONFIG[signal.signal_type] ?? SIGNAL_CONFIG.general;
  const platform = PLATFORM_CONFIG[signal.platform];
  const confidence = signal.confidence ?? 0;
  const isHighConfidence = confidence >= 0.75;

  const inner = (
    <div
      className={`
        group relative rounded-sm border p-4 transition-all duration-200
        bg-surface-press-box border-border
        hover:border-bsi-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30
        ${signal.post_url ? 'cursor-pointer' : ''}
      `}
    >
      {/* Left accent bar — signal type color */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${config.dot} opacity-70`} />

      <div className="pl-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center flex-wrap gap-1.5 min-w-0">
            {/* Platform badge */}
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                border ${platform.bg} ${platform.text} ${platform.border}
              `}
            >
              {platform.icon}
              {platform.label}
            </span>

            {/* Signal type badge */}
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                border ${config.bg} ${config.color} ${config.border}
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
              {config.label}
            </span>

            {/* Team tag */}
            {signal.team_mentioned && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-bsi-primary/15 text-burnt-orange border border-bsi-primary/25">
                {slugToDisplay(signal.team_mentioned)}
              </span>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-text-muted flex-shrink-0 mt-0.5">
            {relativeTime(signal.posted_at)}
          </span>
        </div>

        {/* Summary — primary display text */}
        {signal.summary ? (
          <p className="text-sm text-text-primary leading-snug font-medium mb-1.5 group-hover:text-burnt-orange transition-colors">
            {signal.summary}
          </p>
        ) : (
          <p className="text-sm text-text-secondary leading-snug mb-1.5 line-clamp-2">
            {signal.post_text.slice(0, 140)}
          </p>
        )}

        {/* Footer row: author + player + confidence */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2 text-[11px] text-text-muted min-w-0">
            {signal.author && (
              <span className="truncate">
                @{signal.author}
              </span>
            )}
            {signal.player_mentioned && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-burnt-orange/80">{signal.player_mentioned}</span>
              </>
            )}
          </div>

          {/* Confidence pill — only show when notable */}
          {isHighConfidence && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-semibold uppercase tracking-widest bg-success/10 text-success border border-success/20 flex-shrink-0">
              {confidenceLabel(confidence)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (signal.post_url) {
    return (
      <a
        href={signal.post_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-bsi-primary rounded-sm"
        aria-label={signal.summary ?? signal.post_text.slice(0, 80)}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm text-text-muted">No {label.toLowerCase()} signals in the last 30 minutes</p>
    </div>
  );
}

function TabButton({
  id,
  label,
  shortLabel,
  isActive,
  count,
  onClick,
}: {
  id: string;
  label: string;
  shortLabel: string;
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  const config = id !== 'all' ? (SIGNAL_CONFIG[id] ?? null) : null;

  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={`
        relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm whitespace-nowrap
        border-b-2 transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-bsi-primary
        ${isActive
          ? 'border-bsi-primary text-text-primary font-semibold'
          : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border font-medium'
        }
      `}
    >
      {config && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot} ${isActive ? 'opacity-100' : 'opacity-50'}`} />
      )}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
      {count > 0 && (
        <span
          className={`
            inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold
            ${isActive
              ? 'bg-bsi-primary text-white'
              : 'bg-surface-light text-text-muted'
            }
          `}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SocialIntelFeed() {
  const [activeTab, setActiveTab] = useState<SignalType>('all');
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    setLoading(true);
    setError(false);

    fetch('/api/college-baseball/social-intel', { signal: controller.signal })
      .then(r => r.ok ? r.json() as Promise<FeedResponse> : Promise.reject(r.status))
      .then(d => { if (!controller.signal.aborted) { setData(d); setLoading(false); } })
      .catch((err) => { if ((err as Error).name !== 'AbortError' && !controller.signal.aborted) { setError(true); setLoading(false); } })
      .finally(() => clearTimeout(timeout));

    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  const countFor = useCallback((type: SignalType) => {
    if (!data) return 0;
    if (type === 'all') return data.signals.length;
    return data.signals.filter(s => s.signal_type === type).length;
  }, [data]);

  const visibleSignals = useMemo(() => data
    ? (activeTab === 'all' ? data.signals : data.signals.filter(s => s.signal_type === activeTab))
    : [], [data, activeTab]);

  return (
    <div className="rounded-sm border border-border bg-[#0D0D0D] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-0">
        <div className="flex items-center gap-2.5">
          <h2 className="font-['Oswald'] text-base uppercase tracking-wider text-text-primary">
            Social Intelligence
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <span className="text-[10px] text-text-muted">
              {data.signals.length} signals{data.signals.length > 0
                ? ` · latest ${relativeTime(data.signals[0].posted_at)}`
                : ''}
            </span>
          )}
          {/* Platform legend */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              Reddit
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-heritage-columbia" />
              X
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        role="tablist"
        className="flex border-b border-border overflow-x-auto px-2 mt-3 scrollbar-none"
        aria-label="Social signal type filter"
      >
        {TABS.map(tab => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            shortLabel={tab.shortLabel}
            isActive={activeTab === tab.id}
            count={countFor(tab.id)}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Feed body */}
      <div className="p-4" role="tabpanel" aria-label={`${activeTab} signals`}>
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-sm bg-surface animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-text-muted mb-4">Social signals are refreshing. Check back during game days for live intel.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: 'Latest Articles', href: '/college-baseball/editorial' },
                { label: 'Live Scores', href: '/college-baseball/scores' },
                { label: 'Transfer Portal', href: '/college-baseball/transfer-portal' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-xs font-medium bg-surface border border-border rounded-sm text-text-secondary hover:text-burnt-orange hover:border-bsi-primary/30 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && visibleSignals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted mb-1">
              No {(TABS.find(t => t.id === activeTab)?.label ?? 'signal').toLowerCase()} signals right now
            </p>
            <p className="text-xs text-text-muted opacity-60">Signals update throughout game days with injury reports, portal news, and recruiting intel</p>
          </div>
        )}

        {!loading && !error && visibleSignals.length > 0 && (
          <div className="space-y-2.5">
            {visibleSignals.map(signal => (
              <SignalCard key={`${signal.platform}-${signal.post_id}`} signal={signal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
