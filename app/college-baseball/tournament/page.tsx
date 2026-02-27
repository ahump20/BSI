'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import { getSeasonPhase } from '@/lib/season';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RankingsTeam {
  rank?: number;
  name?: string;
  team?: string;
  conference?: string;
  record?: string;
}

interface RankingsResponse {
  rankings: RankingsTeam[];
  meta?: { source: string; fetched_at: string };
}

interface TournamentSection {
  title: string;
  href: string;
  description: string;
  status: string;
  opensAt: string;
}

// ---------------------------------------------------------------------------
// Static sections
// ---------------------------------------------------------------------------

const SECTIONS: TournamentSection[] = [
  {
    title: 'Bubble Watch',
    href: '/college-baseball/tournament/bubble',
    description: 'Track which teams are in, out, and on the bubble for the NCAA tournament field of 64.',
    status: 'Coming May 2026',
    opensAt: 'Populates when conference tournaments begin',
  },
  {
    title: 'Regional Brackets',
    href: '/college-baseball/tournament/regionals',
    description: '16 regionals, 4 teams each. Bracket projections, host bids, and matchup analysis.',
    status: 'Coming May 2026',
    opensAt: 'Populates on Selection Monday',
  },
  {
    title: 'College World Series',
    href: '/college-baseball/tournament/cws',
    description: 'The road to Omaha — super regional matchups, CWS bracket, and championship series.',
    status: 'Coming June 2026',
    opensAt: 'Populates when super regionals are set',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TournamentHubPage() {
  const season = getSeasonPhase('ncaa');
  const isTournamentSeason = season.phase === 'postseason';
  const isRegularSeason = season.phase === 'regular' || season.phase === 'preseason';

  // Fetch rankings for early tournament preview content
  const { data, loading, lastUpdated } =
    useSportData<RankingsResponse>('/api/college-baseball/rankings', {
      refreshInterval: isTournamentSeason ? 60_000 : 300_000,
    });

  const topTeams = data?.rankings?.slice(0, 16) || [];
  const hasRankings = topTeams.length > 0;

  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb
              items={[
                { label: 'College Baseball', href: '/college-baseball' },
                { label: 'Tournament HQ' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C9A227]/5 via-transparent to-burnt-orange/5 pointer-events-none" />
          <Container>
            <div className="max-w-3xl mb-8">
              <Badge variant="warning" className="mb-4">
                {isTournamentSeason ? 'Tournament Active' : 'Season Framework'}
              </Badge>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wide text-text-primary mb-4">
                Tournament{' '}
                <span className="bg-gradient-to-r from-[#C9A227] to-burnt-orange bg-clip-text text-transparent">
                  HQ
                </span>
              </h1>
              <p className="text-text-tertiary text-lg leading-relaxed">
                College baseball postseason tracking — from bubble watch through the College World
                Series. Data populates as the tournament picture takes shape through May and June.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {SECTIONS.map((section) => (
                <Link key={section.href} href={section.href} className="block group">
                  <Card variant="default" padding="lg" className="h-full hover:border-[#C9A227]/30 transition-all">
                    <Badge variant="secondary" size="sm" className="mb-3">{section.status}</Badge>
                    <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary group-hover:text-[#C9A227] transition-colors mb-2">
                      {section.title}
                    </h2>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                      {section.description}
                    </p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">
                      {section.opensAt}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>

        {/* Projected Regional Hosts — shows top 16 from rankings */}
        {(hasRankings || loading) && isRegularSeason && (
          <Section padding="lg" borderTop>
            <Container>
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text-primary mb-6">
                Projected Regional Hosts
              </h2>
              <p className="text-sm text-text-muted mb-4">
                Based on current rankings. The NCAA selects 16 national seeds as regional hosts.
              </p>
              {loading && !hasRankings ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="h-14 bg-surface-light rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {topTeams.map((team, i) => (
                    <div
                      key={team.name || i}
                      className="bg-surface-light border border-border-subtle rounded-lg p-3 flex items-center gap-3"
                    >
                      <span className="text-xs font-mono text-[#C9A227] w-6 shrink-0">#{team.rank || i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-text-secondary font-medium truncate">{team.name || team.team}</p>
                        <p className="text-[10px] text-text-muted">{team.conference} {team.record ? `\u00B7 ${team.record}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {lastUpdated && (
                <p className="mt-4 text-[10px] text-text-muted">
                  Rankings updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </Container>
          </Section>
        )}

        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              <Link href="/college-baseball" className="hover:text-text-secondary transition-colors">
                &#8592; College Baseball
              </Link>
              <Link href="/college-baseball/editorial" className="hover:text-text-secondary transition-colors">
                Editorial Hub
              </Link>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
