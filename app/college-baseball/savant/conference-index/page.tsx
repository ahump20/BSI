'use client';

import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { ConferenceStrengthChart } from '@/components/analytics/ConferenceStrengthChart';

interface ConferenceRow {
  conference: string;
  strength_index: number;
  avg_era: number;
  avg_ops: number;
  avg_woba: number;
  is_power: number;
}

export default function ConferenceIndexPage() {
  const { data, loading, error, retry } = useSportData<{ data: ConferenceRow[] }>(
    '/api/savant/conference-strength'
  );

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container size="wide">
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link href="/" className="text-text-muted hover:text-[#BF5700] transition-colors">
                  Home
                </Link>
                <span className="text-text-muted">/</span>
                <Link href="/college-baseball" className="text-text-muted hover:text-[#BF5700] transition-colors">
                  College Baseball
                </Link>
                <span className="text-text-muted">/</span>
                <Link href="/college-baseball/savant" className="text-text-muted hover:text-[#BF5700] transition-colors">
                  Savant
                </Link>
                <span className="text-text-muted">/</span>
                <span className="text-text-secondary">Conference Index</span>
              </nav>
            </ScrollReveal>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="accent" size="sm">CONFERENCE ANALYTICS</Badge>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wider text-text-primary">
                  Conference <span className="text-[#BF5700]">Strength Index</span>
                </h1>
                <p className="text-text-tertiary mt-3 max-w-2xl text-base leading-relaxed">
                  Composite ranking of conference competitiveness. Weighs inter-conference
                  record, RPI, collective offense (OPS, wOBA), and pitching (ERA). Updated
                  weekly as the sample size grows.
                </p>
              </div>
            </ScrollReveal>

            {/* Index */}
            <ScrollReveal direction="up" delay={100}>
              {loading ? (
                <ChartSkeleton />
              ) : error ? (
                <Card padding="lg" className="text-center">
                  <p className="text-error mb-4">{error}</p>
                  <button
                    onClick={retry}
                    className="px-5 py-2 bg-[#BF5700]/20 text-[#BF5700] rounded-lg text-sm font-medium hover:bg-[#BF5700]/30 transition-colors"
                  >
                    Try again
                  </button>
                </Card>
              ) : (
                <ConferenceStrengthChart data={data?.data ?? []} isPro={false} />
              )}
            </ScrollReveal>

            {/* Methodology note */}
            <ScrollReveal direction="up" delay={150}>
              <Card padding="md" className="mt-8">
                <h3 className="font-display text-sm uppercase tracking-wider text-text-primary mb-2">
                  Methodology
                </h3>
                <p className="text-[11px] text-text-muted leading-relaxed max-w-3xl">
                  The Conference Strength Index is a 0-100 composite. Inter-conference win
                  percentage contributes 30%, average RPI 25%, collective OPS and wOBA 25%,
                  and collective ERA 20%. The index stabilizes after approximately 4 weeks
                  of conference play. Early-season values should be treated as provisional.
                </p>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}

function ChartSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle">
        <div className="h-5 w-48 bg-surface-medium rounded animate-pulse" />
      </div>
      <div className="px-5 py-4 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-4 bg-surface-light rounded animate-pulse" />
            <div className="h-4 w-20 bg-surface-medium rounded animate-pulse" />
            <div className="flex-1 h-[10px] bg-surface-light rounded-full animate-pulse" />
            <div className="h-4 w-8 bg-surface-light rounded animate-pulse" />
          </div>
        ))}
      </div>
    </Card>
  );
}
