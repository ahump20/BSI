'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Decision {
  topic: string;
  decision: string;
  rationale: string;
}

interface FeedItem {
  feed: string;
  headline: string;
  detail?: string;
}

interface KPI {
  label: string;
  value: string | number;
  change?: string;
}

interface WeeklyBriefData {
  week: string;
  date: string;
  decisions?: Decision[];
  feeds?: FeedItem[];
  iceScores?: Array<{ topic: string; impact: number; confidence: number; ease: number; total: number }>;
  kpis?: KPI[];
}

interface WeeklyBriefResponse {
  brief: WeeklyBriefData | null;
  status?: string;
  message?: string;
  framework?: { sections: string[]; publishSchedule: string };
  meta?: { source: string; fetched_at: string };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeeklyBriefClient() {
  const { data, loading, error, retry, lastUpdated } =
    useSportData<WeeklyBriefResponse>('/api/intel/weekly-brief');

  const brief = data?.brief as WeeklyBriefData | null;
  const hasBrief = brief && (brief.decisions?.length || brief.feeds?.length);

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-white/10">
          <Container>
            <Breadcrumb
              items={[
                { label: 'Intel', href: '/intel' },
                { label: 'Weekly Brief' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="narrow">
            <Badge variant={hasBrief ? 'success' : 'warning'} className="mb-4">
              {hasBrief ? `Week of ${brief!.date}` : 'Framework — Populating Weekly'}
            </Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-4">
              Weekly Intel Brief
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-12">
              BSI&#39;s editorial operating system, published weekly. What decisions were made,
              what content was prioritized, and why. Transparency about how BSI decides what to
              cover and what to skip.
            </p>

            {loading && (
              <div className="space-y-4 animate-pulse mb-8">
                <div className="h-6 bg-white/[0.06] rounded w-1/3" />
                <div className="h-32 bg-white/[0.04] rounded-xl" />
                <div className="h-6 bg-white/[0.06] rounded w-1/4" />
                <div className="h-24 bg-white/[0.04] rounded-xl" />
              </div>
            )}

            {error && (
              <div className="mb-8 text-xs text-white/30 flex items-center gap-3">
                <span>Could not load weekly brief</span>
                <button onClick={retry} className="text-[#BF5700] hover:text-[#FF6B35] transition-colors">
                  Retry
                </button>
              </div>
            )}

            {/* Live brief content */}
            {hasBrief && (
              <div className="space-y-8">
                {/* Decision Register */}
                {brief!.decisions && brief!.decisions.length > 0 && (
                  <section>
                    <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                      Decision Register
                    </h2>
                    <div className="space-y-3">
                      {brief!.decisions.map((d, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                          <p className="text-sm text-white/70 font-medium mb-1">{d.topic}</p>
                          <p className="text-sm text-[#BF5700] mb-2">{d.decision}</p>
                          <p className="text-xs text-white/30">{d.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Five Feeds */}
                {brief!.feeds && brief!.feeds.length > 0 && (
                  <section>
                    <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                      Five Feeds
                    </h2>
                    <div className="space-y-3">
                      {brief!.feeds.map((f, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#BF5700]">{f.feed}</span>
                          <p className="text-sm text-white/60 mt-1">{f.headline}</p>
                          {f.detail && <p className="text-xs text-white/30 mt-1">{f.detail}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* KPIs */}
                {brief!.kpis && brief!.kpis.length > 0 && (
                  <section>
                    <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                      KPIs
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {brief!.kpis.map((kpi) => (
                        <div key={kpi.label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-white/50">{kpi.label}</span>
                          <p className="text-lg font-display text-white mt-1">{kpi.value}</p>
                          {kpi.change && <p className="text-[10px] text-white/25 mt-0.5">{kpi.change}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {lastUpdated && (
                  <p className="text-[10px] text-white/15">
                    Fetched {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}

            {/* Framework sections (shown when no brief is published) */}
            {!hasBrief && !loading && (
              <div className="space-y-8">
                <section>
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                    Decision Register
                  </h2>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                    <p className="text-sm text-white/40 leading-relaxed mb-3">
                      10–15 editorial decisions per week, documented with rationale. What got covered,
                      what got cut, and why.
                    </p>
                    <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-lg p-4 text-center">
                      <p className="text-xs text-white/25">
                        {data?.message || 'First decision register publishes Week 2 of the 2026 season.'}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                    Five Feeds
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Competition', description: 'Game results, standings shifts, conference races' },
                      { name: 'Social', description: 'Fan conversation, trending topics, narrative shifts' },
                      { name: 'Academic', description: 'New research, methodology updates, metric evolution' },
                      { name: 'Product/UX', description: 'Site performance, user behavior, feature adoption' },
                      { name: 'Editorial Performance', description: 'Traffic, engagement, conversion, retention metrics' },
                    ].map((feed) => (
                      <div
                        key={feed.name}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-[#BF5700]">
                          {feed.name}
                        </span>
                        <p className="text-xs text-white/40 mt-1">{feed.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                    ICE Scoring
                  </h2>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                    <p className="text-sm text-white/40 leading-relaxed mb-3">
                      Content prioritization using Impact, Confidence, and Ease scores. Each piece of
                      potential content gets scored 1–10 on each dimension. Highest composite score
                      gets published first.
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: 'Impact', description: 'How much does this matter to BSI\'s audience?' },
                        { label: 'Confidence', description: 'How confident are we in the analysis?' },
                        { label: 'Ease', description: 'How quickly can we produce it at quality?' },
                      ].map((dim) => (
                        <div key={dim.label} className="bg-white/[0.02] rounded-lg p-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-white/50">{dim.label}</span>
                          <p className="text-[10px] text-white/25 mt-1">{dim.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white mb-4">
                    KPIs
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Pro Trials', description: 'New pro tier signups' },
                      { label: 'Conversion', description: 'Visitor \u2192 subscriber rate' },
                      { label: 'Returning Users', description: 'Weekly active readers' },
                      { label: 'Model Views', description: 'Methodology page traffic' },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/50">{kpi.label}</span>
                        <p className="text-[10px] text-white/25 mt-1">{kpi.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            <div className="mt-12 flex flex-wrap gap-4 text-sm text-white/30">
              <Link href="/intel" className="hover:text-white/60 transition-colors">
                &#8592; Intel Dashboard
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
