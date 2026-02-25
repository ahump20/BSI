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

interface ModelCard {
  title: string;
  slug: string;
  description: string;
  status: 'live' | 'development' | 'planned';
  version: string;
  tags: string[];
}

interface ModelHealthResponse {
  weeks: Array<{
    week: string;
    accuracy: number;
    sport: string;
    recordedAt: string;
  }>;
  lastUpdated: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Static fallback — used until API responds
// ---------------------------------------------------------------------------

const MODELS: ModelCard[] = [
  {
    title: 'HAV-F Player Evaluation',
    slug: 'havf',
    description:
      'Composite player evaluation metric — Hitting, At-Bat Quality, Velocity, Fielding. Percentile-based scoring against the full college baseball cohort.',
    status: 'live',
    version: 'v1.0',
    tags: ['College Baseball', 'Scouting'],
  },
  {
    title: 'Win Probability',
    slug: 'win-probability',
    description:
      'Real-time win probability estimates based on game state, score differential, inning/quarter, and historical leverage data.',
    status: 'development',
    version: 'v0.1',
    tags: ['Baseball', 'Football'],
  },
  {
    title: 'Monte Carlo Simulation',
    slug: 'monte-carlo',
    description:
      'Season outcome projections using thousands of simulated seasons. Conference standings, tournament probability, CWS odds.',
    status: 'development',
    version: 'v0.1',
    tags: ['Baseball', 'All Sports'],
  },
  {
    title: 'Data Quality & Sources',
    slug: 'data-quality',
    description:
      'How BSI validates data across 3+ providers before serving it. API response times, freshness guarantees, cross-reference methodology.',
    status: 'live',
    version: 'v1.0',
    tags: ['Infrastructure', 'All Sports'],
  },
];

const statusStyles: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' }> = {
  live: { label: 'Live', variant: 'success' },
  development: { label: 'In Development', variant: 'warning' },
  planned: { label: 'Planned', variant: 'secondary' },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ModelsHubPage() {
  const { data: health, loading, error, lastUpdated, retry } =
    useSportData<ModelHealthResponse>('/api/model-health', { refreshInterval: 300_000 });

  // Derive live status from health data when available
  const hasHealthData = health && health.weeks && health.weeks.length > 0;
  const latestAccuracy = hasHealthData
    ? health.weeks[0]
    : null;

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Models' }]} />
          </Container>
        </Section>

        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#BF5700]/8 via-transparent to-white/[0.02] pointer-events-none" />
          <Container>
            <div className="max-w-3xl">
              <Badge variant="primary" className="mb-4">Methodology</Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-4 text-white">
                Models &{' '}
                <span className="bg-gradient-to-r from-[#BF5700] to-[#FDB913] bg-clip-text text-transparent">
                  Methodology
                </span>
              </h1>
              <p className="text-white/50 text-lg leading-relaxed">
                Every BSI model documents its inputs, assumptions, validation approach, and failure
                modes. No black boxes. If you can&#39;t see how it works, you shouldn&#39;t trust it.
              </p>
            </div>
          </Container>
        </Section>

        {/* Live health status bar */}
        {hasHealthData && (
          <Section padding="sm" className="border-b border-white/[0.06]">
            <Container>
              <div className="flex items-center gap-4 text-xs text-white/30">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>
                  Latest accuracy: <span className="text-white/60 font-mono">{(latestAccuracy!.accuracy * 100).toFixed(1)}%</span>
                  {' '}({latestAccuracy!.sport} — week {latestAccuracy!.week})
                </span>
                {lastUpdated && (
                  <span className="ml-auto">
                    Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </Container>
          </Section>
        )}

        {loading && !hasHealthData && (
          <Section padding="sm" className="border-b border-white/[0.06]">
            <Container>
              <div className="flex items-center gap-3 text-xs text-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                <span>Loading model health data...</span>
              </div>
            </Container>
          </Section>
        )}

        {error && !hasHealthData && (
          <Section padding="sm" className="border-b border-white/[0.06]">
            <Container>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-red-400/60">Model health unavailable</span>
                <button onClick={retry} className="text-[#BF5700] hover:text-[#FF6B35] transition-colors">
                  Retry
                </button>
              </div>
            </Container>
          </Section>
        )}

        <Section padding="lg" borderTop>
          <Container>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MODELS.map((model) => {
                const status = statusStyles[model.status];
                return (
                  <Link key={model.slug} href={`/models/${model.slug}`} className="block group">
                    <Card variant="default" padding="lg" className="h-full hover:border-[#BF5700]/40 hover:bg-white/[0.06] transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                        <span className="text-[10px] font-mono text-white/20">{model.version}</span>
                      </div>
                      <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white group-hover:text-[#BF5700] transition-colors mb-2">
                        {model.title}
                      </h2>
                      <p className="text-sm text-white/40 leading-relaxed mb-4">
                        {model.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {model.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/25 bg-white/[0.03] rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Container>
        </Section>

        <Section padding="md" borderTop>
          <Container>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white mb-4">
                Why Document This?
              </h2>
              <div className="text-sm text-white/50 leading-relaxed space-y-3 max-w-2xl">
                <p>
                  Most sports analytics platforms market model outputs — win probability numbers,
                  projection percentages — without explaining what feeds them. That makes the numbers
                  unfalsifiable. You can&#39;t evaluate a prediction you can&#39;t inspect.
                </p>
                <p>
                  BSI documents inputs, assumptions, and failure modes because that&#39;s what
                  makes analytics trustworthy. A model that admits where it breaks is more useful
                  than one that pretends it doesn&#39;t.
                </p>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
