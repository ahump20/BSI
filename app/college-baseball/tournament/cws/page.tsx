'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import type { RankingsResponse } from '@/lib/types/rankings';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CWSPage() {
  const { data, loading, lastUpdated } =
    useSportData<RankingsResponse>('/api/college-baseball/rankings', {
      refreshInterval: 300_000,
    });

  // Top 8 national seeds are the projected super regional hosts — the eventual CWS field
  const projectedSeeds = data?.rankings?.slice(0, 8) || [];
  const hasData = projectedSeeds.length > 0;

  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb
              items={[
                { label: 'College Baseball', href: '/college-baseball' },
                { label: 'Tournament HQ', href: '/college-baseball/tournament' },
                { label: 'College World Series' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C9A227]/5 via-transparent to-burnt-orange/5 pointer-events-none" />
          <Container>
            <div className="max-w-3xl mb-8">
              <Badge variant="warning" className="mb-4">Coming June 2026</Badge>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wide text-text-primary mb-4">
                College World{' '}
                <span className="bg-gradient-to-r from-[#C9A227] to-burnt-orange bg-clip-text text-transparent">
                  Series
                </span>
              </h1>
              <p className="text-text-tertiary text-lg leading-relaxed">
                The road to Omaha. Super regional matchups, CWS bracket, game briefs, and
                championship series coverage. Eight teams. Double elimination. One champion.
              </p>
            </div>

            {/* Projected Top 8 National Seeds */}
            {(hasData || loading) && (
              <section className="mb-12">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-4">
                  Projected Top 8 Seeds
                </h2>
                <p className="text-sm text-text-muted mb-6">
                  The top 8 national seeds host super regionals and have the clearest path to Omaha.
                  Based on current rankings.
                </p>

                {loading && !hasData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-20 bg-surface-light rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {projectedSeeds.map((team, i) => (
                      <div
                        key={team.name || i}
                        className="bg-surface-light border border-[#C9A227]/20 rounded-xl p-4 text-center"
                      >
                        <span className="text-2xl font-display font-bold text-[#C9A227] block mb-1">
                          #{team.rank || i + 1}
                        </span>
                        <p className="text-sm text-text-primary font-medium truncate">
                          {team.name || team.team}
                        </p>
                        <p className="text-[10px] text-text-muted mt-1">
                          {team.conference}{team.record ? ` · ${team.record}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {lastUpdated && (
                  <p className="mt-4 text-[10px] text-text-muted">
                    Rankings updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </section>
            )}

            {/* CWS Format */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-text-primary mb-4">
                How the CWS Works
              </h2>
              <div className="bg-surface-light border border-border-subtle rounded-xl p-5 space-y-3">
                {[
                  { label: 'Super Regionals', detail: '8 best-of-three series. Win your super regional to earn one of 8 CWS berths.' },
                  { label: 'CWS Bracket', detail: '8 teams in Omaha, split into two 4-team double-elimination brackets. Winners of each bracket meet in the Finals.' },
                  { label: 'Championship', detail: 'Best-of-three finals. The last team standing wins the national championship.' },
                  { label: 'Venue', detail: 'Charles Schwab Field, Omaha, Nebraska. The CWS has been in Omaha since 1950 — 76 consecutive years.' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] mt-0.5 shrink-0 w-32">
                      {item.label}
                    </span>
                    <p className="text-sm text-text-tertiary leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* CWS data placeholder */}
            <div className="bg-surface-light border border-dashed border-border rounded-xl p-8 text-center mb-8">
              <p className="text-sm text-text-muted mb-2">
                CWS bracket and game data populates when super regionals are set (mid-June).
              </p>
              <p className="text-xs text-text-muted">
                Live game briefs, bracket tracking, and championship series coverage
                will publish in real time once the CWS begins.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              <Link href="/college-baseball/tournament" className="hover:text-text-secondary transition-colors">
                &#8592; Tournament HQ
              </Link>
              <Link href="/college-baseball/tournament/bubble" className="hover:text-text-secondary transition-colors">
                Bubble Watch
              </Link>
              <Link href="/college-baseball/tournament/regionals" className="hover:text-text-secondary transition-colors">
                Regionals
              </Link>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
