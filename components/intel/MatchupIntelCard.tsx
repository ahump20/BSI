'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TeamStats {
  batting: { wrcPlus: number; obp: number; slg: number };
  pitching: { fip: number; eraMinus: number; kPct: number; bbPct: number };
}

interface Props {
  homeTeam: string;
  awayTeam: string;
  gameId?: string;
  gameTime?: string;
  sport: string;
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  apiKey?: string;
}

interface MatchupCard {
  keyEdge: string;
  offense: {
    home: { teamName: string; wrcPlus: number; obp: number; slg: number };
    away: { teamName: string; wrcPlus: number; obp: number; slg: number };
  };
  pitching: {
    home: { teamName: string; fip: number; eraMinus: number; kPct: number; bbPct: number };
    away: { teamName: string; fip: number; eraMinus: number; kPct: number; bbPct: number };
  };
  prediction: {
    favoriteTeam: string;
    winProbability: number;
    predictedTotal: number;
  };
  fullAnalysis: string;
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({
  label,
  home,
  away,
}: {
  label: string;
  home: string | number;
  away: string | number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-background-tertiary last:border-0">
      <span className="text-[rgba(196,184,165,0.5)] text-xs">{label}</span>
      <span className="font-mono text-xs text-[var(--bsi-bone)] text-right">{home}</span>
      <span className="font-mono text-xs text-[var(--bsi-bone)] text-right">{away}</span>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function MatchupIntelCard({
  homeTeam,
  awayTeam,
  gameId,
  gameTime,
  sport,
  homeStats,
  awayStats,
  apiKey,
}: Props) {
  const [card, setCard] = useState<MatchupCard | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error' | 'upgrade'>('idle');
  const [expanded, setExpanded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const key =
      apiKey ??
      (typeof window !== 'undefined' ? localStorage.getItem('bsi-api-key') : null);

    if (!key) {
      setStatus('upgrade');
      return;
    }

    setStatus('loading');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch('/api/intelligence/v1/matchup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BSI-Key': key,
      },
      body: JSON.stringify({
        homeTeam,
        awayTeam,
        gameId,
        gameTime,
        sport,
        homeStats,
        awayStats,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        const data: MatchupCard = await res.json();
        setCard(data);
        setStatus('loaded');
      })
      .catch((err) => { if ((err as Error).name !== 'AbortError') setStatus('error'); })
      .finally(() => clearTimeout(timeout));

    return () => { controller.abort(); clearTimeout(timeout); };
  }, [homeTeam, awayTeam, gameId, sport, retryCount]);

  // ─── Loading skeleton ───────────────────────────────────────────────────────

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-press-box)] overflow-hidden animate-pulse">
        <div className="flex items-center justify-between px-4 py-3 border-b border-background-tertiary">
          <div className="h-3 w-40 bg-[var(--surface-dugout)] rounded-sm" />
          <div className="h-4 w-8 bg-[var(--surface-dugout)] rounded-full" />
        </div>
        <div className="p-4 space-y-3">
          <div className="h-3 w-64 bg-[var(--surface-dugout)] rounded-sm" />
          <div className="h-[200px] bg-[var(--surface-dugout)] rounded-sm" />
        </div>
      </div>
    );
  }

  // ─── Upgrade prompt ─────────────────────────────────────────────────────────

  if (status === 'upgrade') {
    return (
      <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-press-box)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-background-tertiary">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--bsi-primary)]" />
            <span className="font-display text-xs font-semibold uppercase tracking-widest text-[var(--bsi-dust)]">
              Matchup Intelligence
            </span>
          </div>
          <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--bsi-primary)]/10 text-[var(--bsi-primary)] border border-[var(--bsi-primary)]/30">
            PRO
          </span>
        </div>
        <div className="px-4 py-8 text-center space-y-3">
          <p className="text-[var(--bsi-dust)] text-sm">
            Matchup Intelligence is a Pro feature.
          </p>
          <p className="text-[rgba(196,184,165,0.5)] text-xs">
            Advanced sabermetrics, AI-powered matchup breakdowns, and win probability.
          </p>
          <Link
            href="/pricing"
            className="inline-block mt-2 px-4 py-2 rounded-sm text-xs font-display font-bold uppercase tracking-wider text-white bg-[var(--bsi-primary)] hover:bg-ember transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────

  if (status === 'error') {
    return (
      <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-press-box)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-background-tertiary">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--bsi-primary)]" />
            <span className="font-display text-xs font-semibold uppercase tracking-widest text-[var(--bsi-dust)]">
              Matchup Intelligence
            </span>
          </div>
          <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--bsi-primary)]/10 text-[var(--bsi-primary)] border border-[var(--bsi-primary)]/30">
            PRO
          </span>
        </div>
        <div className="px-4 py-6 flex items-center justify-between">
          <p className="text-[rgba(196,184,165,0.5)] text-sm">Unable to load matchup analysis.</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="text-xs text-[var(--bsi-primary)] font-semibold hover:text-[var(--bsi-primary)] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Loaded card ────────────────────────────────────────────────────────────

  if (!card) return null;

  const homeName = card.offense.home.teamName;
  const awayName = card.offense.away.teamName;

  return (
    <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-press-box)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-background-tertiary">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--bsi-primary)]" />
          <span className="font-display text-xs font-semibold uppercase tracking-widest text-[var(--bsi-dust)]">
            Matchup Intelligence
          </span>
        </div>
        <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--bsi-primary)]/10 text-[var(--bsi-primary)] border border-[var(--bsi-primary)]/30">
          PRO
        </span>
      </div>

      <div className="px-4 pt-3 pb-1">
        {/* Subheader */}
        {gameTime && (
          <p className="text-[var(--bsi-dust)] text-xs mb-3">
            {awayTeam} vs. {homeTeam} · {gameTime}
          </p>
        )}

        {/* Key Edge */}
        <p className="text-[var(--bsi-primary)] font-semibold text-sm mb-4">
          <span className="font-display uppercase tracking-wide text-[10px] text-[rgba(196,184,165,0.5)] mr-2">
            Key Edge
          </span>
          {card.keyEdge}
        </p>

        {/* Offense section */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2 mb-1">
            <span className="font-display text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.5)]">
              Offense
            </span>
            <span className="font-display text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.5)] text-right truncate">
              {homeName}
            </span>
            <span className="font-display text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.5)] text-right truncate">
              {awayName}
            </span>
          </div>
          <StatRow
            label="wRC+"
            home={card.offense.home.wrcPlus}
            away={card.offense.away.wrcPlus}
          />
          <StatRow
            label="OBP"
            home={card.offense.home.obp.toFixed(3)}
            away={card.offense.away.obp.toFixed(3)}
          />
          <StatRow
            label="SLG"
            home={card.offense.home.slg.toFixed(3)}
            away={card.offense.away.slg.toFixed(3)}
          />
        </div>

        {/* Pitching section */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2 mb-1">
            <span className="font-display text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.5)]">
              Pitching
            </span>
            <span className="font-display text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.5)] text-right truncate">
              {homeName}
            </span>
            <span className="font-display text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.5)] text-right truncate">
              {awayName}
            </span>
          </div>
          <StatRow
            label="FIP"
            home={card.pitching.home.fip.toFixed(2)}
            away={card.pitching.away.fip.toFixed(2)}
          />
          <StatRow
            label="ERA-"
            home={card.pitching.home.eraMinus}
            away={card.pitching.away.eraMinus}
          />
          <StatRow
            label="K%"
            home={`${card.pitching.home.kPct}%`}
            away={`${card.pitching.away.kPct}%`}
          />
          <StatRow
            label="BB%"
            home={`${card.pitching.home.bbPct}%`}
            away={`${card.pitching.away.bbPct}%`}
          />
        </div>

        {/* Prediction */}
        <div className="py-2 border-t border-background-tertiary">
          <span className="font-display text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.5)] block mb-1">
            Prediction
          </span>
          <p className="text-[var(--bsi-dust)] text-xs">
            <span className="text-[var(--bsi-bone)] font-semibold">{card.prediction.favoriteTeam}</span>
            {' '}win{' '}
            <span className="font-mono text-[var(--bsi-bone)]">{card.prediction.winProbability}%</span>
            {' '}·{' '}
            Total{' '}
            <span className="font-mono text-[var(--bsi-bone)]">{card.prediction.predictedTotal}</span>
            {' '}runs
          </p>
        </div>
      </div>

      {/* Full Analysis toggle */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-dust)] transition-colors flex items-center gap-1"
          aria-expanded={expanded}
        >
          Full Analysis
          <span
            className={`inline-block transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>

        {expanded && (
          <div className="border-t border-background-tertiary pt-4 mt-3">
            <p className="font-body text-[var(--bsi-dust)] text-sm leading-relaxed">
              {card.fullAnalysis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
