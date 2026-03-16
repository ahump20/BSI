'use client';

/**
 * SocialIntelTeamPanel — per-team social intelligence panel.
 *
 * Shows on team detail pages:
 *   - Summary row: injury count, transfer count, recruiting count, sentiment gauge
 *   - Signal list: latest 10 classified posts mentioning this team
 *
 * Data source: GET /api/college-baseball/social-intel/team/:teamId
 */

import { useState, useEffect } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface TeamSummary {
  team_slug: string;
  summary_date: string;
  injury_count: number;
  transfer_count: number;
  recruiting_count: number;
  sentiment_score: number | null;
  top_signals: string[];
}

interface TeamIntelResponse {
  team_slug: string;
  signals: SocialSignal[];
  summary: TeamSummary | null;
  meta: { source: string; fetched_at: string; timezone: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SIGNAL_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  injury_lineup:  { label: 'Injury',   color: 'text-[var(--bsi-danger)]',    bg: 'bg-[var(--bsi-danger)]/10',    border: 'border-[var(--bsi-danger)]/25' },
  transfer_portal:{ label: 'Portal',   color: 'text-[var(--bsi-warning)]',  bg: 'bg-[var(--bsi-warning)]/10',  border: 'border-[var(--bsi-warning)]/25' },
  recruiting:     { label: 'Recruit',  color: 'text-[var(--heritage-columbia-blue)]', bg: 'bg-[var(--heritage-columbia-blue)]/10', border: 'border-[var(--heritage-columbia-blue)]/25' },
  sentiment:      { label: 'Sentiment',color: 'text-[var(--bsi-success)]',bg: 'bg-[var(--bsi-success)]/10',border: 'border-[var(--bsi-success)]/25' },
  general:        { label: 'General',  color: 'text-text-muted', bg: 'bg-surface',       border: 'border-border' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ─── Sentiment Gauge ─────────────────────────────────────────────────────────

function SentimentGauge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted">—</span>
      </div>
    );
  }

  // Normalize -1..1 to 0..100
  const pct = Math.round(((score + 1) / 2) * 100);
  const isPositive = score >= 0.1;
  const isNegative = score <= -0.1;

  const barColor = isPositive
    ? 'bg-[var(--bsi-success)]'
    : isNegative
    ? 'bg-[var(--bsi-danger)]'
    : 'bg-[var(--bsi-dust)]';

  const label = isPositive ? 'Positive' : isNegative ? 'Negative' : 'Neutral';
  const textColor = isPositive ? 'text-[var(--bsi-success)]' : isNegative ? 'text-[var(--bsi-danger)]' : 'text-text-muted';

  return (
    <div className="flex items-center gap-2" title={`Sentiment score: ${score.toFixed(2)}`}>
      {/* Track */}
      <div className="relative h-1.5 w-16 bg-surface-light rounded-full overflow-hidden">
        {/* Fill — from center */}
        <div
          className={`absolute top-0 h-full ${barColor} rounded-full transition-all duration-700`}
          style={
            isPositive
              ? { left: '50%', width: `${(pct - 50)}%` }
              : isNegative
              ? { left: `${pct}%`, width: `${50 - pct}%` }
              : { left: '48%', width: '4%' }
          }
        />
        {/* Center marker */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border-strong -translate-x-px" />
      </div>
      <span className={`text-[11px] font-medium ${textColor}`}>{label}</span>
    </div>
  );
}

// ─── Summary Row ─────────────────────────────────────────────────────────────

function SummaryRow({ summary }: { summary: TeamSummary }) {
  const stats = [
    { label: 'Injuries', count: summary.injury_count, color: 'text-[var(--bsi-danger)]', activeBg: 'bg-[var(--bsi-danger)]/10' },
    { label: 'Portal',   count: summary.transfer_count, color: 'text-[var(--bsi-warning)]', activeBg: 'bg-[var(--bsi-warning)]/10' },
    { label: 'Recruiting', count: summary.recruiting_count, color: 'text-[var(--heritage-columbia-blue)]', activeBg: 'bg-[var(--heritage-columbia-blue)]/10' },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#0D0D0D] gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        {stats.map(({ label, count, color, activeBg }) => (
          <div
            key={label}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm ${count > 0 ? activeBg : 'bg-surface'}`}
          >
            <span className={`text-sm font-semibold tabular-nums ${count > 0 ? color : 'text-text-muted'}`}>
              {count}
            </span>
            <span className="text-[11px] text-text-muted">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-muted">Buzz</span>
        <SentimentGauge score={summary.sentiment_score} />
      </div>
    </div>
  );
}

// ─── Signal Row ──────────────────────────────────────────────────────────────

function SignalRow({ signal }: { signal: SocialSignal }) {
  const badge = SIGNAL_BADGE[signal.signal_type] ?? SIGNAL_BADGE.general;
  const isPlatformReddit = signal.platform === 'reddit';

  const inner = (
    <div className="group flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-surface/50 transition-colors duration-150">
      {/* Platform dot */}
      <span
        className={`
          mt-1 flex-shrink-0 w-2 h-2 rounded-full
          ${isPlatformReddit ? 'bg-orange-400' : 'bg-[var(--heritage-columbia-blue)]'}
        `}
        title={isPlatformReddit ? 'Reddit' : 'X / Twitter'}
      />

      <div className="min-w-0 flex-1">
        {/* Signal text */}
        <p className="text-sm text-text-secondary leading-snug group-hover:text-text-primary transition-colors line-clamp-2">
          {signal.summary ?? signal.post_text.slice(0, 120)}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className={`
              inline-flex items-center px-1.5 py-px rounded-sm text-[9px] font-semibold uppercase tracking-wide
              border ${badge.bg} ${badge.color} ${badge.border}
            `}
          >
            {badge.label}
          </span>

          {signal.player_mentioned && (
            <span className="text-[11px] text-[#BF5700]/70">{signal.player_mentioned}</span>
          )}

          {signal.author && (
            <span className="text-[11px] text-text-muted opacity-60">@{signal.author}</span>
          )}

          <span className="text-[11px] text-text-muted opacity-50 ml-auto">
            {relativeTime(signal.posted_at)} ago
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

// ─── Main Component ──────────────────────────────────────────────────────────

interface SocialIntelTeamPanelProps {
  teamId: string;
}

export function SocialIntelTeamPanel({ teamId }: SocialIntelTeamPanelProps) {
  const [data, setData] = useState<TeamIntelResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch(`/api/college-baseball/social-intel/team/${encodeURIComponent(teamId)}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() as Promise<TeamIntelResponse> : Promise.reject(r.status))
      .then(d => { if (!controller.signal.aborted) { setData(d); setLoading(false); } })
      .catch((err) => { if ((err as Error).name !== 'AbortError' && !controller.signal.aborted) setLoading(false); })
      .finally(() => clearTimeout(timeout));

    return () => { controller.abort(); clearTimeout(timeout); };
  }, [teamId]);

  // Don't render if empty after load
  if (!loading && (!data || data.signals.length === 0)) return null;

  return (
    <div className="rounded-sm border border-border overflow-hidden bg-[#111111]">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BF5700] opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#BF5700]" />
          </span>
          <span className="font-['Oswald'] text-sm uppercase tracking-wider text-text-primary">
            Social Signals
          </span>
        </div>
        {data && (
          <span className="text-[10px] text-text-muted">
            {data.signals.length} signal{data.signals.length !== 1 ? 's' : ''} · {data.meta.fetched_at ? relativeTime(data.meta.fetched_at) + ' ago' : 'recent'}
          </span>
        )}
      </div>

      {/* Summary stats */}
      {data?.summary && <SummaryRow summary={data.summary} />}

      {/* Signal list */}
      {loading ? (
        <div className="p-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-sm bg-surface animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : (
        <div>
          {(data?.signals ?? []).slice(0, 10).map(signal => (
            <SignalRow key={`${signal.platform}-${signal.post_id}`} signal={signal} />
          ))}
        </div>
      )}
    </div>
  );
}
