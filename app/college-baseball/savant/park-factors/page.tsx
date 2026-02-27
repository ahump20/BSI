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
import { ParkFactorTable } from '@/components/analytics/ParkFactorTable';

interface ParkFactorRow {
  team: string;
  venue_name: string | null;
  conference: string | null;
  runs_factor: number;
  hits_factor?: number;
  hr_factor?: number;
  sample_games: number;
}

export default function ParkFactorsPage() {
  const { data, loading, error, retry } = useSportData<{ data: ParkFactorRow[] }>(
    '/api/savant/park-factors'
  );

  const isPro = useMemo(() => {
    const firstRow = data?.data?.[0];
    return firstRow ? (firstRow as Record<string, unknown>)._tier_gated !== true : false;
  }, [data]);

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container size="wide">
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <nav className="flex items-center gap-2 text-sm mb-6">
                <Link href="/" className="text-text-muted hover:text-burnt-orange transition-colors">
                  Home
                </Link>
                <span className="text-text-muted">/</span>
                <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                  College Baseball
                </Link>
                <span className="text-text-muted">/</span>
                <Link href="/college-baseball/savant" className="text-text-muted hover:text-burnt-orange transition-colors">
                  Savant
                </Link>
                <span className="text-text-muted">/</span>
                <span className="text-text-secondary">Park Factors</span>
              </nav>
            </ScrollReveal>

            {/* Hero */}
            <ScrollReveal direction="up" delay={50}>
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="accent" size="sm">VENUE ANALYTICS</Badge>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-wider text-text-primary">
                  Park <span className="text-burnt-orange">Factors</span>
                </h1>
                <p className="text-text-tertiary mt-3 max-w-2xl text-base leading-relaxed">
                  How venues inflate or suppress offense. A runs factor above 1.000 means
                  the park produces more runs than average; below 1.000 means fewer. Computed
                  from home/away run differentials across all games played at each venue.
                </p>
              </div>
            </ScrollReveal>

            {/* Methodology */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
                <Card padding="md">
                  <span className="text-xs text-burnt-orange font-display uppercase tracking-widest block mb-1">
                    Hitter-Friendly
                  </span>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Runs factor &ge; 1.050. Thin air, short fences, or dry climate conditions
                    that boost offensive production.
                  </p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-text-muted font-display uppercase tracking-widest block mb-1">
                    Neutral
                  </span>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Runs factor between 0.950 and 1.050. No significant offensive skew
                    in either direction.
                  </p>
                </Card>
                <Card padding="md">
                  <span className="text-xs text-[#5b9bd5] font-display uppercase tracking-widest block mb-1">
                    Pitcher-Friendly
                  </span>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Runs factor &le; 0.950. Dense air, deep outfields, or marine climate
                    that suppresses offense.
                  </p>
                </Card>
              </div>
            </ScrollReveal>

            {/* Table */}
            <ScrollReveal direction="up" delay={150}>
              {loading ? (
                <TableSkeleton />
              ) : error ? (
                <Card padding="lg" className="text-center">
                  <p className="text-error mb-4">{error}</p>
                  <button
                    onClick={retry}
                    className="px-5 py-2 bg-burnt-orange/20 text-burnt-orange rounded-lg text-sm font-medium hover:bg-burnt-orange/30 transition-colors"
                  >
                    Try again
                  </button>
                </Card>
              ) : (
                <ParkFactorTable data={data?.data ?? []} isPro={isPro} />
              )}
            </ScrollReveal>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}

function TableSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle">
        <div className="h-5 w-32 bg-surface-medium rounded animate-pulse" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-5 py-3 flex items-center gap-4 border-b border-border-subtle">
          <div className="h-4 w-32 bg-surface-medium rounded animate-pulse" />
          <div className="h-4 w-24 bg-surface-light rounded animate-pulse hidden sm:block" />
          <div className="h-4 w-16 bg-surface-light rounded animate-pulse ml-auto" />
        </div>
      ))}
    </Card>
  );
}
