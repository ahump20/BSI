'use client';

import Link from 'next/link';
import { useMemo } from 'react';
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
  const { data, loading, error, retry } = useSportData<{ data: ConferenceRow[]; total?: number }>(
    '/api/savant/conference-strength'
  );

  const isPro = useMemo(() => {
    const firstRow = data?.data?.[0];
    return firstRow ? (firstRow as unknown as Record<string, unknown>)._tier_gated !== true : false;
  }, [data]);

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] text-bsi-bone">
        <Section padding="lg" className="pt-6">
          <Container size="wide">
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link href="/" className="text-bsi-dust/50 hover:text-[var(--bsi-primary)] transition-colors">
                  Home
                </Link>
                <span className="text-bsi-dust/50">/</span>
                <Link href="/college-baseball" className="text-bsi-dust/50 hover:text-[var(--bsi-primary)] transition-colors">
                  College Baseball
                </Link>
                <span className="text-bsi-dust/50">/</span>
                <Link href="/college-baseball/savant" className="text-bsi-dust/50 hover:text-[var(--bsi-primary)] transition-colors">
                  Savant
                </Link>
                <span className="text-bsi-dust/50">/</span>
                <span className="text-bsi-dust">Conference Index</span>
              </nav>
            </ScrollReveal>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="accent" size="sm">CONFERENCE ANALYTICS</Badge>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wider text-bsi-bone">
                  Conference <span className="text-[var(--bsi-primary)]">Strength Index</span>
                </h1>
                <p className="text-bsi-dust mt-3 max-w-2xl text-base leading-relaxed">
                  Composite ranking of conference competitiveness. Weighs inter-conference
                  record, RPI, collective offense (OPS, wOBA), and pitching (ERA). Recomputed
                  daily at 6 AM CT.
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
                    className="px-5 py-2 bg-[var(--bsi-primary)]/20 text-[var(--bsi-primary)] rounded-sm text-sm font-medium hover:bg-[var(--bsi-primary)]/30 transition-colors"
                  >
                    Try again
                  </button>
                </Card>
              ) : (
                <ConferenceStrengthChart data={data?.data ?? []} isPro={isPro} total={data?.total} />
              )}
            </ScrollReveal>

            {/* Methodology note */}
            <ScrollReveal direction="up" delay={150}>
              <Card padding="md" className="mt-8">
                <h3 className="font-display text-sm uppercase tracking-wider text-bsi-bone mb-2">
                  Methodology
                </h3>
                <p className="text-[11px] text-bsi-dust/50 leading-relaxed max-w-3xl">
                  The Conference Strength Index is a 0-100 composite. Inter-conference win
                  percentage contributes 40%, RPI 30%, collective wOBA 15%,
                  and collective ERA 15%. RPI is placeholder (0.500) until sufficient
                  opponent data accumulates — rankings are currently driven by inter-conference
                  record and team offensive/pitching stats. Early-season values should be
                  treated as provisional, particularly for conferences with thin ESPN coverage.
                </p>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}

function ChartSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgba(140,98,57,0.3)]">
        <div className="h-5 w-48 bg-[#161616] rounded-sm animate-pulse" />
      </div>
      <div className="px-5 py-4 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-4 bg-[#111111] rounded-sm animate-pulse" />
            <div className="h-4 w-20 bg-[#161616] rounded-sm animate-pulse" />
            <div className="flex-1 h-[10px] bg-[#111111] rounded-full animate-pulse" />
            <div className="h-4 w-8 bg-[#111111] rounded-sm animate-pulse" />
          </div>
        ))}
      </div>
    </Card>
  );
}
