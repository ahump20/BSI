'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DigestPerformer {
  name: string;
  position: string;
  highlight: string;
  stat: string;
}

interface DigestSeries {
  opponent: string;
  dates: string;
  location: string;
  preview: string;
}

interface DigestResponse {
  weekLabel: string;
  record: { wins: number; losses: number; weekWins: number; weekLosses: number };
  ranking: { current: number | null; previous: number | null; movement: number };
  standoutPerformers: DigestPerformer[];
  upcomingSeries: DigestSeries[];
  weekSummary: string;
  meta?: { source?: string; fetched_at?: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasDigestClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || '251';
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const { data, loading, error } = useSportData<DigestResponse>(
    '/api/college-baseball/texas-intelligence/digest',
    { timeout: 12000 },
  );

  const record = data?.record;
  const ranking = data?.ranking;

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">College Baseball</Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/texas-intelligence" className="text-text-muted hover:text-burnt-orange transition-colors">Texas Intel</Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Weekly Digest</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden bg-[var(--surface-scoreboard)]">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-4">
                <img src={logoUrl} alt="Texas" className="w-12 h-12 object-contain" loading="eager" />
                <div>
                  <span className="heritage-stamp text-[10px]">Weekly Digest</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    {data?.weekLabel ?? 'Intel Digest'}
                  </h1>
                  <p className="text-text-secondary text-sm mt-2 max-w-xl">
                    This week in Texas Longhorns baseball — record, standout performers, and the series ahead.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Loading */}
        {loading && (
          <Section padding="lg">
            <Container>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-surface-light rounded-sm animate-pulse" />
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Error */}
        {error && !loading && (
          <Section padding="lg">
            <Container>
              <Card padding="lg" className="text-center">
                <p className="text-text-muted text-sm">Weekly digest data is not available right now. Check back soon.</p>
              </Card>
            </Container>
          </Section>
        )}

        {/* Content */}
        {!loading && data && (
          <>
            {/* Dashboard Strip */}
            <Section padding="md" className="bg-[var(--surface-dugout)] border-y border-border">
              <Container>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center py-2">
                    <div className="font-mono text-2xl font-bold text-text-primary">
                      {record ? `${record.wins}-${record.losses}` : '—'}
                    </div>
                    <div className="text-text-muted text-xs mt-1 uppercase tracking-wider">Overall</div>
                  </div>
                  <div className="text-center py-2">
                    <div className="font-mono text-2xl font-bold" style={{ color: ACCENT }}>
                      {record ? `${record.weekWins}-${record.weekLosses}` : '—'}
                    </div>
                    <div className="text-text-muted text-xs mt-1 uppercase tracking-wider">This Week</div>
                  </div>
                  <div className="text-center py-2">
                    <div className="font-mono text-2xl font-bold text-text-primary">
                      {ranking?.current ? `#${ranking.current}` : '—'}
                    </div>
                    <div className="text-text-muted text-xs mt-1 uppercase tracking-wider">National Rank</div>
                  </div>
                  <div className="text-center py-2">
                    <div className="font-mono text-2xl font-bold" style={{
                      color: ranking?.movement && ranking.movement > 0 ? '#22c55e'
                        : ranking?.movement && ranking.movement < 0 ? '#ef4444'
                        : undefined,
                    }}>
                      {ranking?.movement ? (ranking.movement > 0 ? `+${ranking.movement}` : String(ranking.movement)) : '—'}
                    </div>
                    <div className="text-text-muted text-xs mt-1 uppercase tracking-wider">Movement</div>
                  </div>
                </div>
              </Container>
            </Section>

            {/* Week Summary */}
            {data.weekSummary && (
              <Section padding="lg" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <Card variant="default" padding="lg" className="border-t-2 border-burnt-orange">
                      <CardHeader>
                        <CardTitle>Week in Review</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-text-secondary text-sm leading-relaxed" style={{ fontFamily: 'var(--font-body, "Cormorant Garamond", serif)' }}>
                          {data.weekSummary}
                        </p>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                </Container>
              </Section>
            )}

            {/* Standout Performers */}
            {data.standoutPerformers && data.standoutPerformers.length > 0 && (
              <Section padding="lg" background="charcoal" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-4 text-text-primary">
                      Standout Performers
                    </h2>
                  </ScrollReveal>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.standoutPerformers.map((perf) => (
                      <ScrollReveal key={perf.name} direction="up">
                        <Card variant="default" padding="md">
                          <CardContent>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-text-primary font-medium text-sm">{perf.name}</div>
                                <div className="text-text-muted text-xs">{perf.position}</div>
                              </div>
                              <Badge variant="accent" size="sm">{perf.stat}</Badge>
                            </div>
                            <p className="text-text-secondary text-xs leading-relaxed">{perf.highlight}</p>
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    ))}
                  </div>
                </Container>
              </Section>
            )}

            {/* Upcoming Series */}
            {data.upcomingSeries && data.upcomingSeries.length > 0 && (
              <Section padding="lg" borderTop>
                <Container>
                  <ScrollReveal direction="up">
                    <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-4 text-text-primary">
                      Series Ahead
                    </h2>
                  </ScrollReveal>
                  <div className="space-y-3">
                    {data.upcomingSeries.map((series) => (
                      <ScrollReveal key={series.opponent} direction="up">
                        <Card variant="default" padding="md">
                          <CardContent>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-text-primary">
                                vs {series.opponent}
                              </h3>
                              <span className="text-text-muted text-xs font-mono">{series.dates}</span>
                            </div>
                            <div className="text-text-muted text-xs mb-2">{series.location}</div>
                            <p className="text-text-secondary text-xs leading-relaxed">{series.preview}</p>
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    ))}
                  </div>
                </Container>
              </Section>
            )}
          </>
        )}

        {/* Attribution */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="BSI Intelligence"
                timestamp={
                  data?.meta?.fetched_at
                    ? new Date(data.meta.fetched_at).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      }) + ' CT'
                    : 'Live'
                }
              />
              <Link
                href="/college-baseball/texas-intelligence"
                className="text-sm text-burnt-orange hover:text-ember transition-colors"
              >
                &larr; Back to Hub
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
