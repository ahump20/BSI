'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { useSportData } from '@/lib/hooks/useSportData';
import { getLogoUrl } from '@/lib/data/team-metadata';

// ─── Types ─────────────────────────────────────────────────────────────────

interface TeamSabermetrics {
  batting: { wrc_plus: number; woba: number };
  pitching: { fip: number };
  meta?: { fetched_at?: string };
}

interface TeamInfo {
  team: {
    record?: string;
    streak?: { type: string; length: number };
  };
  meta?: { fetched_at?: string };
}

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * Compact teaser card for a featured program's analytics.
 * Shows live-computed headline stats and links to the intelligence page.
 */
export function FeaturedProgramCard() {
  const { data, loading } = useSportData<TeamSabermetrics>(
    '/api/college-baseball/teams/126/sabermetrics',
    { timeout: 8000 },
  );
  const { data: teamInfo } = useSportData<TeamInfo>(
    '/api/college-baseball/teams/texas',
    { timeout: 8000 },
  );

  const streak = teamInfo?.team?.streak;
  const logoUrl = getLogoUrl('126', '251', '/images/teams/texas/logo-primary.png');

  return (
    <Card variant="default" padding="lg" className="relative overflow-hidden">
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-[var(--surface-press-box)] flex items-center justify-center overflow-hidden">
            <img
              src={logoUrl}
              alt="Texas Longhorns"
              className="w-10 h-10 object-contain"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="heritage-stamp text-[10px]">Program Intelligence</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
                Texas Longhorns
              </h3>
              {streak && streak.length >= 2 && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold ${
                  streak.type === 'W' || streak.type === 'win'
                    ? 'bg-[var(--bsi-success)]/10 text-[var(--bsi-success)]'
                    : 'bg-[var(--bsi-danger)]/10 text-[var(--bsi-danger)]'
                }`}>
                  <span aria-hidden="true">{streak.type === 'W' || streak.type === 'win' ? '\u25B2' : '\u25BC'}</span>
                  {(streak.type === 'W' || streak.type === 'win') ? 'W' : 'L'}{streak.length}
                </span>
              )}
            </div>

            {/* Stats row */}
            {loading ? (
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-16 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
                ))}
              </div>
            ) : data ? (
              <div className="flex gap-6 mb-4">
                <div>
                  <div className="font-mono text-xl font-bold text-[var(--bsi-primary)]">
                    {Math.round(data.batting.wrc_plus)}
                  </div>
                  <div className="text-[rgba(196,184,165,0.35)] text-[10px]">wRC+</div>
                </div>
                {data.pitching.fip > 0 && (
                <div>
                  <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">
                    {data.pitching.fip.toFixed(2)}
                  </div>
                  <div className="text-[rgba(196,184,165,0.35)] text-[10px]">Team FIP</div>
                </div>
                )}
                <div>
                  <div className="font-mono text-xl font-bold text-[var(--bsi-bone)]">
                    {data.batting.woba.toFixed(3)}
                  </div>
                  <div className="text-[rgba(196,184,165,0.35)] text-[10px]">wOBA</div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-[rgba(196,184,165,0.35)] text-xs">6 CWS titles · 38 CWS appearances · UFCU Disch-Falk Field</p>
              </div>
            )}

            {/* CTA */}
            <Link
              href="/college-baseball/texas-intelligence"
              className="inline-flex items-center gap-1 text-sm text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors font-semibold"
            >
              View Full Intel
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
