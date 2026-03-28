'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import { getSeasonPhase } from '@/lib/season';
import type { RankingsResponse } from '@/lib/types/rankings';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegionalsPage() {
  const season = getSeasonPhase('ncaa');
  const isPostseason = season.phase === 'postseason';

  const { data, loading, lastUpdated } =
    useSportData<RankingsResponse>('/api/college-baseball/rankings', {
      refreshInterval: isPostseason ? 60_000 : 300_000,
    });

  const projectedHosts = data?.rankings?.slice(0, 16) || [];
  const hasData = projectedHosts.length > 0;

  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <Breadcrumb
              items={[
                { label: 'College Baseball', href: '/college-baseball' },
                { label: 'Tournament HQ', href: '/college-baseball/tournament' },
                { label: 'Regionals' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <div className="max-w-3xl mb-8">
              <Badge variant="warning" className="mb-4">
                {isPostseason ? 'Selection Pending' : 'Projections — Coming May 2026'}
              </Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-[var(--bsi-bone)] mb-4">
                Regional Brackets
              </h1>
              <p className="text-[rgba(196,184,165,0.5)] text-lg leading-relaxed">
                16 regionals, 4 teams each. Bracket projections start mid-season and lock on
                Selection Monday. Each regional gets a matchup breakdown and host analysis.
              </p>
            </div>

            {/* Projected 16 National Seeds */}
            {(hasData || loading) && (
              <section className="mb-12">
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-[var(--bsi-bone)] mb-4">
                  Projected Regional Hosts
                </h2>
                <p className="text-sm text-[rgba(196,184,165,0.35)] mb-6">
                  The NCAA selects 16 national seeds to host regionals. Based on current rankings —
                  these shift weekly as the season unfolds.
                </p>

                {loading && !hasData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="h-16 bg-[var(--surface-press-box)] rounded-sm animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {projectedHosts.map((team, i) => (
                      <div
                        key={team.name || i}
                        className="bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm p-4 flex items-start gap-3"
                      >
                        <span className="text-lg font-display font-bold text-[#C9A227] w-8 shrink-0">
                          #{team.rank || i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--bsi-bone)] font-medium truncate">
                            {team.name || team.team}
                          </p>
                          <p className="text-[10px] text-[rgba(196,184,165,0.35)]">
                            {team.conference}{team.record ? ` · ${team.record}` : ''}
                          </p>
                          <p className="text-[10px] text-[rgba(196,184,165,0.35)] mt-1">
                            Regional {i + 1} Host
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {lastUpdated && (
                  <p className="mt-4 text-[10px] text-[rgba(196,184,165,0.35)]">
                    Rankings updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </section>
            )}

            {/* How It Works */}
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-[var(--bsi-bone)] mb-4">
                How Regionals Work
              </h2>
              <div className="bg-[var(--surface-press-box)] border border-[var(--border-vintage)] rounded-sm p-5 space-y-3">
                {[
                  { label: 'Selection Monday', detail: 'The NCAA announces the 64-team field, 16 national seeds, and regional bracket assignments in late May.' },
                  { label: 'Format', detail: 'Each regional is double-elimination with 4 teams. Win three games to advance to super regionals.' },
                  { label: 'Hosting', detail: 'The top 16 national seeds host regionals at their home ballparks. Home-field advantage is significant — hosts win at a ~70% clip historically.' },
                  { label: 'Super Regionals', detail: 'The 16 regional winners are paired into 8 best-of-three super regionals. Win the super to punch a ticket to Omaha.' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] mt-0.5 shrink-0 w-32">
                      {item.label}
                    </span>
                    <p className="text-sm text-[rgba(196,184,165,0.5)] leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Empty state for bracket data */}
            <div className="bg-[var(--surface-press-box)] border border-dashed border-[var(--border-vintage)] rounded-sm p-8 text-center mb-8">
              <p className="text-sm text-[rgba(196,184,165,0.35)] mb-2">
                Bracket data populates on Selection Monday (late May / early June).
              </p>
              <p className="text-xs text-[rgba(196,184,165,0.35)]">
                Once brackets are announced, this page will show full bracket views, matchup previews,
                and results tracking for all 16 regionals.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[rgba(196,184,165,0.35)]">
              <Link href="/college-baseball/tournament" className="hover:text-[var(--bsi-dust)] transition-colors">
                &#8592; Tournament HQ
              </Link>
              <Link href="/college-baseball/tournament/cws" className="hover:text-[var(--bsi-dust)] transition-colors">
                College World Series &#8594;
              </Link>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
