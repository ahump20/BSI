'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Footer } from '@/components/layout-ds/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialSignal {
  platform: 'reddit' | 'twitter';
  post_id: string;
  post_url: string | null;
  post_text: string;
  author: string | null;
  posted_at: string;
  signal_type: 'injury_lineup' | 'transfer_portal' | 'recruiting' | 'sentiment' | 'general';
  confidence: number;
  team_mentioned: string | null;
  player_mentioned: string | null;
  summary: string | null;
  raw_entities: { teams: string[]; players: string[] };
}

interface FeedResponse {
  signals: SocialSignal[];
  meta: { source: string; fetched_at: string; timezone: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGNAL_CONFIG = {
  injury_lineup:   { label: 'Injury',    short: 'INJ', color: '#ef4444', bg: 'bg-red-500/10',    border: 'border-red-500/25',    text: 'text-red-400' },
  transfer_portal: { label: 'Portal',    short: 'PRT', color: '#f59e0b', bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  text: 'text-amber-400' },
  recruiting:      { label: 'Recruiting',short: 'REC', color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/25', text: 'text-purple-400' },
  sentiment:       { label: 'Sentiment', short: 'SNT', color: '#10b981', bg: 'bg-emerald-500/10',border: 'border-emerald-500/25',text: 'text-emerald-400' },
  general:         { label: 'General',   short: 'GEN', color: '#6b7280', bg: 'bg-zinc-500/10',   border: 'border-zinc-500/25',   text: 'text-zinc-400' },
} as const;

const FILTER_TABS = [
  { id: 'all',             label: 'All Signals' },
  { id: 'injury_lineup',   label: 'Injury & Lineup' },
  { id: 'transfer_portal', label: 'Transfer Portal' },
  { id: 'recruiting',      label: 'Recruiting' },
  { id: 'sentiment',       label: 'Sentiment' },
] as const;

type FilterId = typeof FILTER_TABS[number]['id'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Chicago',
    });
  } catch {
    return '';
  }
}

// ─── Distribution Bar ─────────────────────────────────────────────────────────

function DistributionBar({ signals }: { signals: SocialSignal[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      injury_lineup: 0,
      transfer_portal: 0,
      recruiting: 0,
      sentiment: 0,
      general: 0,
    };
    for (const s of signals) map[s.signal_type] = (map[s.signal_type] ?? 0) + 1;
    return map;
  }, [signals]);

  const total = signals.length;
  if (total === 0) return null;

  const segments = Object.entries(SIGNAL_CONFIG).map(([type, cfg]) => ({
    type,
    cfg,
    count: counts[type] ?? 0,
    pct: ((counts[type] ?? 0) / total) * 100,
  })).filter(s => s.count > 0);

  return (
    <div className="mb-8">
      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px bg-[#0D0D0D]">
        {segments.map(({ type, cfg, pct }) => (
          <div
            key={type}
            className="h-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: cfg.color }}
            title={`${cfg.label}: ${counts[type]}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
        {segments.map(({ type, cfg, count, pct }) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              {cfg.short}
            </span>
            <span className="font-mono text-[10px] text-text-muted opacity-60">
              {count} · {pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Signal Row ───────────────────────────────────────────────────────────────

function SignalRow({ signal, index }: { signal: SocialSignal; index: number }) {
  const cfg = SIGNAL_CONFIG[signal.signal_type] ?? SIGNAL_CONFIG.general;
  const isReddit = signal.platform === 'reddit';

  const inner = (
    <div
      className="group relative flex gap-4 px-5 py-4 border-b border-border/40 last:border-0 hover:bg-white/[0.02] transition-colors duration-150"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Left accent + index */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
        <div className="w-px flex-1 min-h-[2rem]" style={{ backgroundColor: `${cfg.color}40` }} />
        <span className="font-mono text-[9px] text-text-muted opacity-40 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-0.5">
        {/* Signal text */}
        <p className="text-sm text-text-secondary leading-snug group-hover:text-text-primary transition-colors line-clamp-2 mb-2">
          {signal.summary ?? signal.post_text.slice(0, 140)}
        </p>

        {/* Meta strip */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type badge */}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-px rounded text-[9px] font-semibold uppercase tracking-wide border ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
            {cfg.short}
          </span>

          {/* Platform */}
          <span className={`font-mono text-[10px] uppercase tracking-wider ${isReddit ? 'text-orange-400/60' : 'text-sky-400/60'}`}>
            {isReddit ? 'r/' : 'X'}
          </span>

          {/* Team */}
          {signal.team_mentioned && (
            <span className="text-[11px] text-[#BF5700]/70 font-medium truncate max-w-[12ch]">
              {signal.team_mentioned}
            </span>
          )}

          {/* Player */}
          {signal.player_mentioned && (
            <span className="text-[11px] text-text-muted opacity-70 truncate max-w-[14ch]">
              {signal.player_mentioned}
            </span>
          )}

          {/* Confidence pill — high only */}
          {signal.confidence >= 0.75 && (
            <span className="px-1.5 py-px rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono uppercase tracking-wide">
              HIGH
            </span>
          )}

          {/* Time */}
          <span className="ml-auto font-mono text-[10px] text-text-muted opacity-40 tabular-nums">
            {formatTimestamp(signal.posted_at)} CT
          </span>
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
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#BF5700]"
        aria-label={signal.summary ?? signal.post_text.slice(0, 80)}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-0">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-5 py-4 border-b border-border/40 last:border-0"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="w-px bg-zinc-800 animate-pulse min-h-[2.5rem]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 rounded bg-zinc-800 animate-pulse w-4/5" style={{ animationDelay: `${i * 50 + 80}ms` }} />
            <div className="h-3.5 rounded bg-zinc-800 animate-pulse w-2/3" style={{ animationDelay: `${i * 50 + 120}ms` }} />
            <div className="flex gap-2 mt-1">
              <div className="h-3 w-8 rounded bg-zinc-800 animate-pulse" />
              <div className="h-3 w-6 rounded bg-zinc-800 animate-pulse" />
              <div className="h-3 w-20 rounded bg-zinc-800 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SocialIntelPageClient() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/college-baseball/social-intel')
      .then(r => (r.ok ? r.json() as Promise<FeedResponse> : Promise.reject(r.status)))
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const allSignals = data?.signals ?? [];

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return allSignals;
    return allSignals.filter(s => s.signal_type === activeFilter);
  }, [allSignals, activeFilter]);

  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { all: allSignals.length };
    for (const s of allSignals) {
      map[s.signal_type] = (map[s.signal_type] ?? 0) + 1;
    }
    return map;
  }, [allSignals]);

  const lastUpdated = data?.meta?.fetched_at ? relativeTime(data.meta.fetched_at) : null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-text-primary">
      {/* Back nav */}
      <div className="border-b border-border/50 bg-[#111111]">
        <Container>
          <div className="flex items-center gap-3 py-3">
            <Link
              href="/college-baseball"
              className="font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-burnt-orange transition-colors"
            >
              ← College Baseball
            </Link>
            <span className="text-border-strong">·</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted opacity-50">
              Social Intelligence
            </span>
          </div>
        </Container>
      </div>

      {/* Header */}
      <div className="border-b border-border bg-[#111111]">
        <Container>
          <div className="py-8 md:py-10">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  {/* Live pulse */}
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BF5700] opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#BF5700]" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#BF5700]/70">
                    Live · Updated every 30 min
                  </span>
                </div>
                <h1 className="font-['Oswald'] text-3xl md:text-4xl uppercase tracking-wide text-text-primary leading-none">
                  Social Intelligence
                </h1>
                <p className="mt-2 text-sm text-text-muted max-w-xl leading-relaxed">
                  Real-time signals from Reddit and Twitter — injuries, transfers, recruiting, and sentiment across D1 college baseball. Classified by AI, updated continuously.
                </p>
              </div>

              {/* Signal count */}
              {!loading && allSignals.length > 0 && (
                <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="font-mono text-3xl tabular-nums text-text-primary">
                    {allSignals.length}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    signals
                  </span>
                  {lastUpdated && (
                    <span className="font-mono text-[10px] text-text-muted opacity-50">
                      {lastUpdated}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Distribution bar — signature element */}
            {!loading && <DistributionBar signals={allSignals} />}

            {/* Platform legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Reddit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">X / Twitter</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Filter tabs */}
      <div className="sticky top-0 z-10 border-b border-border bg-[#0D0D0D]/95 backdrop-blur-sm">
        <Container>
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {FILTER_TABS.map(tab => {
              const count = tabCounts[tab.id] ?? 0;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-4 py-3 font-mono text-[11px] uppercase tracking-wider whitespace-nowrap
                    border-b-2 transition-colors duration-150
                    ${isActive
                      ? 'border-[#BF5700] text-[#BF5700]'
                      : 'border-transparent text-text-muted hover:text-text-secondary'}
                  `}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`
                      px-1.5 py-0.5 rounded text-[9px] tabular-nums font-mono
                      ${isActive ? 'bg-[#BF5700]/15 text-[#BF5700]' : 'bg-surface text-text-muted'}
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      {/* Signal feed */}
      <Container>
        <div className="py-6">
          {loading ? (
            <div className="rounded-xl border border-border overflow-hidden bg-[#111111]">
              <Skeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted mb-2">
                No signals
              </span>
              <p className="text-sm text-text-muted opacity-60 max-w-xs">
                {allSignals.length === 0
                  ? 'The pipeline is warming up. Signals populate every 30 minutes.'
                  : 'No signals match this filter.'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-[#111111]">
              {/* Feed header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-[#0D0D0D]/60">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  {filtered.length} signal{filtered.length !== 1 ? 's' : ''}
                  {activeFilter !== 'all' && ` · ${SIGNAL_CONFIG[activeFilter as keyof typeof SIGNAL_CONFIG]?.label ?? activeFilter}`}
                </span>
                {data?.meta?.source && (
                  <span className="font-mono text-[10px] text-text-muted opacity-40">
                    {data.meta.source}
                  </span>
                )}
              </div>

              {/* Rows */}
              <div>
                {filtered.map((signal, i) => (
                  <SignalRow
                    key={`${signal.platform}-${signal.post_id}`}
                    signal={signal}
                    index={i}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>

      <Footer />
    </div>
  );
}
