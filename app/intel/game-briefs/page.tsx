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

interface BriefSummary {
  slug: string;
  headline: string;
  sport: string;
  date: string;
  readTime: string;
  teams: string;
  score: string;
}

interface EditorialItem {
  slug: string;
  title: string;
  sport?: string;
  date?: string;
  type?: string;
  description?: string;
}

interface EditorialListResponse {
  editorials: EditorialItem[];
  meta?: { source: string; fetched_at: string };
}

// ---------------------------------------------------------------------------
// Static fallback
// ---------------------------------------------------------------------------

const SEED_BRIEFS: BriefSummary[] = [
  {
    slug: 'texas-uc-davis-opener-2026',
    headline: 'Texas 13, UC Davis 2: Volantis Sets the Tone',
    sport: 'College Baseball',
    date: 'February 14, 2026',
    readTime: '6 min',
    teams: 'Texas vs. UC Davis',
    score: '13-2',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GameBriefsIndexPage() {
  const { data, loading, error, lastUpdated, retry } =
    useSportData<EditorialListResponse>('/api/college-baseball/editorial/list');

  // Transform editorial list into brief summaries if available
  const liveBriefs: BriefSummary[] = data?.editorials
    ?.filter((e) => e.type === 'game-brief' || e.slug?.includes('opener') || e.slug?.includes('recap'))
    ?.map((e) => ({
      slug: e.slug,
      headline: e.title || e.slug,
      sport: e.sport || 'College Baseball',
      date: e.date || '',
      readTime: '5 min',
      teams: '',
      score: '',
    })) || [];

  // Use live data if available, otherwise seed briefs
  const briefs = liveBriefs.length > 0 ? liveBriefs : SEED_BRIEFS;

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <Breadcrumb
              items={[
                { label: 'Intel', href: '/intel' },
                { label: 'Game Briefs' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <div className="max-w-3xl mb-8">
              <Badge variant="primary" className="mb-4">Analysis</Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-3">
                Game Briefs
              </h1>
              <p className="text-white/50 text-lg leading-relaxed">
                Post-game analysis with leverage moments, deciding stats, and win probability context.
                Each brief covers what happened, why it happened, and what it means going forward.
              </p>
            </div>

            {loading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-white/[0.06] rounded w-1/3 mb-3" />
                    <div className="h-5 bg-white/[0.06] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mb-4 text-xs text-white/30 flex items-center gap-3">
                <span>Could not load latest briefs</span>
                <button onClick={retry} className="text-[#BF5700] hover:text-[#FF6B35] transition-colors">
                  Retry
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefs.map((brief) => (
                <Link key={brief.slug} href={`/intel/game-briefs/${brief.slug}`} className="block group">
                  <Card variant="default" padding="md" className="h-full hover:border-[#BF5700]/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" size="sm">{brief.sport}</Badge>
                      {brief.readTime && <span className="text-white/20 text-xs">{brief.readTime}</span>}
                    </div>
                    <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide group-hover:text-[#BF5700] transition-colors mb-1.5">
                      {brief.headline}
                    </h2>
                    {brief.teams && (
                      <p className="text-white/30 text-xs">{brief.teams}{brief.score ? ` \u00B7 ${brief.score}` : ''}</p>
                    )}
                    {brief.date && <p className="text-white/20 text-[10px] mt-3">{brief.date}</p>}
                  </Card>
                </Link>
              ))}
            </div>

            {briefs.length <= 1 && (
              <div className="mt-8 bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-6 text-center">
                <p className="text-sm text-white/30">
                  More game briefs publishing as the 2026 season progresses.
                </p>
              </div>
            )}

            {lastUpdated && (
              <p className="mt-4 text-[10px] text-white/15">
                Last checked {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
