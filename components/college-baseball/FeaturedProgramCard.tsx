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

  const logoUrl = getLogoUrl('126', '251', '/images/teams/texas/logo-primary.png');

  return (
    <Card variant="default" padding="lg" className="relative overflow-hidden">
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-surface-light flex items-center justify-center overflow-hidden">
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
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary mb-3">
              Texas Longhorns
            </h3>

            {/* Stats row */}
            {loading ? (
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-16 bg-surface-light rounded animate-pulse" />
                ))}
              </div>
            ) : data ? (
              <div className="flex gap-6 mb-4">
                <div>
                  <div className="font-mono text-xl font-bold text-burnt-orange">
                    {Math.round(data.batting.wrc_plus)}
                  </div>
                  <div className="text-text-muted text-[10px]">wRC+</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-text-primary">
                    {data.pitching.fip.toFixed(2)}
                  </div>
                  <div className="text-text-muted text-[10px]">Team FIP</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-text-primary">
                    {data.batting.woba.toFixed(3)}
                  </div>
                  <div className="text-text-muted text-[10px]">wOBA</div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-text-muted text-xs">6 CWS titles · 38 CWS appearances · UFCU Disch-Falk Field</p>
              </div>
            )}

            {/* CTA */}
            <Link
              href="/college-baseball/teams/texas/intelligence"
              className="inline-flex items-center gap-1 text-sm text-burnt-orange hover:text-ember transition-colors font-semibold"
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
