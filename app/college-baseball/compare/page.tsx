import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { preseason2026, getTierLabel } from '@/lib/data/preseason-2026';
import { teamMetadata } from '@/lib/data/team-metadata';

export const metadata: Metadata = {
  title: 'Compare Teams — BSI Head-to-Head | College Baseball',
  description: 'Pick two Power 25 teams and compare rankings, records, key players, and BSI tier ratings side by side.',
  openGraph: {
    title: 'Compare Teams — BSI Head-to-Head',
    description: 'Pick your rivalry. Compare any two Power 25 teams head-to-head.',
  },
};

const featuredRivalries: { teams: [string, string]; label: string }[] = [
  { teams: ['texas', 'texas-am'], label: 'Lone Star Showdown' },
  { teams: ['lsu', 'florida'], label: 'SEC Heavyweights' },
  { teams: ['wake-forest', 'virginia'], label: 'ACC Favorites' },
  { teams: ['clemson', 'north-carolina'], label: 'Tobacco Road' },
  { teams: ['tcu', 'oklahoma-state'], label: 'Big 12 Battle' },
  { teams: ['oregon-state', 'ucla'], label: 'West Coast' },
  { teams: ['tennessee', 'arkansas'], label: 'SEC Slugfest' },
  { teams: ['stanford', 'california'], label: 'Bay Area Rivals' },
];
function teamDisplayName(slug: string): string {
  const meta = teamMetadata[slug];
  if (meta) return meta.name;
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function CompareHubPage() {
  const teams = Object.entries(preseason2026).sort((a, b) => a[1].rank - b[1].rank);

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Compare Teams</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/10 via-transparent to-ember/5 pointer-events-none" />
          <Container center>
            <Badge variant="primary" className="mb-4">Head-to-Head</Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4">
              Pick Your <span className="text-gradient-blaze">Rivalry</span>
            </h1>
            <p className="text-text-tertiary text-center max-w-xl mx-auto">
              Compare any two Power 25 teams head-to-head. Rankings, records, key players, and BSI tier ratings — all in one sharable card.
            </p>
          </Container>
        </Section>

        {/* Featured Rivalries */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary mb-6">
              Featured Rivalries
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {featuredRivalries.map(({ teams: [a, b], label }) => {
                const teamA = preseason2026[a];
                const teamB = preseason2026[b];
                if (!teamA || !teamB) return null;
                return (
                  <Link key={`${a}-${b}`} href={`/college-baseball/compare/${a}/${b}`}>
                    <Card variant="hover" padding="md" className="h-full text-center">
                      <div className="text-xs text-burnt-orange uppercase tracking-wider mb-2">{label}</div>
                      <div className="font-display text-lg font-bold text-text-primary uppercase">
                        #{teamA.rank} {teamDisplayName(a)}
                      </div>
                      <div className="text-text-muted text-sm my-1">vs</div>
                      <div className="font-display text-lg font-bold text-text-primary uppercase">
                        #{teamB.rank} {teamDisplayName(b)}
                      </div>
                      <div className="mt-3 flex justify-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{teamA.conference}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{teamB.conference}</Badge>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Full Power 25 Grid */}
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary mb-2">
              Power 25 Teams
            </h2>
            <p className="text-text-muted text-sm mb-6">Pick any team to see available matchups</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {teams.map(([slug, data], i) => {
                // Pick a different team as opponent — next in rankings, wrapping to first
                const opponent = teams[(i + 1) % teams.length][0];
                return (
                <Link key={slug} href={`/college-baseball/compare/${slug}/${opponent}`}>
                  <Card variant="hover" padding="sm" className="text-center">
                    <div className="font-display text-sm font-bold text-burnt-orange">#{data.rank}</div>
                    <div className="font-display text-sm font-bold text-text-primary uppercase mt-0.5 truncate">
                      {teamDisplayName(slug)}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">{data.conference} · {getTierLabel(data.tier)}</div>
                  </Card>
                </Link>
                );
              })}
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
