'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tier = 'Omaha Favorite' | 'Contender' | 'Dark Horse';

const tierStyles: Record<Tier, string> = {
  'Omaha Favorite': 'bg-[#C9A227]/20 text-[#C9A227] border-[#C9A227]/30',
  Contender: 'bg-[#BF5700]/20 text-[#FF6B35] border-[#BF5700]/30',
  'Dark Horse': 'bg-surface-medium text-text-secondary border-border-strong',
};

interface DossierSummary {
  slug: string;
  name: string;
  mascot: string;
  conference: string;
  record: string;
  tier: Tier;
}

interface RankingsTeam {
  rank?: number;
  name?: string;
  team?: string;
  conference?: string;
  record?: string;
  wins?: number;
  losses?: number;
}

interface RankingsResponse {
  rankings: RankingsTeam[];
  meta?: { source: string; fetched_at: string };
}

// ---------------------------------------------------------------------------
// Static fallback
// ---------------------------------------------------------------------------

const SEED_DOSSIERS: DossierSummary[] = [
  { slug: 'texas-2026', name: 'Texas', mascot: 'Longhorns', conference: 'SEC', record: '44-14', tier: 'Omaha Favorite' },
  { slug: 'tcu-2026', name: 'TCU', mascot: 'Horned Frogs', conference: 'Big 12', record: '44-20', tier: 'Contender' },
  { slug: 'ucla-2026', name: 'UCLA', mascot: 'Bruins', conference: 'Big Ten', record: '48-18', tier: 'Omaha Favorite' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assignTier(rank: number | undefined): Tier {
  if (!rank) return 'Dark Horse';
  if (rank <= 8) return 'Omaha Favorite';
  if (rank <= 25) return 'Contender';
  return 'Dark Horse';
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-2026';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamDossiersIndexPage() {
  const { data, loading, error, lastUpdated, retry } =
    useSportData<RankingsResponse>('/api/college-baseball/rankings');

  // Transform rankings into dossier summaries
  const liveDossiers: DossierSummary[] = data?.rankings
    ?.slice(0, 25)
    ?.map((team) => {
      const name = team.name || team.team || 'Unknown';
      const record = team.record || (team.wins != null && team.losses != null ? `${team.wins}-${team.losses}` : '');
      return {
        slug: toSlug(name),
        name,
        mascot: '',
        conference: team.conference || '',
        record,
        tier: assignTier(team.rank),
      };
    }) || [];

  const dossiers = liveDossiers.length > 0 ? liveDossiers : SEED_DOSSIERS;

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb
              items={[
                { label: 'Intel', href: '/intel' },
                { label: 'Team Dossiers' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <div className="max-w-3xl mb-8">
              <Badge variant="primary" className="mb-4">Scouting</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mb-3">
                Team Dossiers
              </h1>
              <p className="text-text-tertiary text-lg leading-relaxed">
                Structured scouting reports — identity, game plan, key players, schedule difficulty,
                and BSI projection tier. One per team, updated as the season unfolds.
              </p>
            </div>

            {loading && liveDossiers.length === 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-surface-light border border-border-subtle rounded-xl p-4 animate-pulse">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-border-subtle rounded w-1/3" />
                      <div className="h-4 bg-surface-light rounded w-1/4" />
                    </div>
                    <div className="h-3 bg-surface-light rounded w-1/2 mt-3" />
                  </div>
                ))}
              </div>
            )}

            {error && liveDossiers.length === 0 && (
              <div className="mb-4 text-xs text-text-muted flex items-center gap-3">
                <span>Could not load live rankings</span>
                <button onClick={retry} className="text-burnt-orange hover:text-ember transition-colors">
                  Retry
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dossiers.map((dossier) => {
                const style = tierStyles[dossier.tier] || tierStyles['Dark Horse'];
                return (
                  <Link key={dossier.slug} href={`/intel/team-dossiers/${dossier.slug}`} className="block group">
                    <Card variant="default" padding="md" className="h-full hover:border-[#BF5700]/30 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h2 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                            {dossier.name}
                          </h2>
                          {dossier.mascot && <p className="text-text-muted text-xs">{dossier.mascot}</p>}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${style}`}>
                          {dossier.tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                        {dossier.conference && <span>{dossier.conference}</span>}
                        {dossier.record && <span className="font-mono">{dossier.record}</span>}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 bg-surface-light border border-dashed border-border rounded-xl p-6 text-center">
              <p className="text-sm text-text-muted">
                {liveDossiers.length > 0
                  ? `Showing top 25 from live rankings. Full dossier set building through the 2026 season.`
                  : 'Full 47-team dossier set building through the 2026 season.'}{' '}
                See{' '}
                <Link href="/college-baseball/editorial" className="text-burnt-orange hover:text-ember transition-colors">
                  editorial previews
                </Link>{' '}
                for all team coverage.
              </p>
            </div>

            {lastUpdated && (
              <p className="mt-4 text-[10px] text-text-muted">
                Rankings updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
