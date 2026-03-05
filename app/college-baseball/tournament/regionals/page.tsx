import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Regional Brackets',
  description: 'NCAA baseball regional bracket projections, host bids, and matchup analysis.',
};

export default function RegionalsPage() {
  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb
              items={[
                { label: 'College Baseball', href: '/college-baseball' },
                { label: 'Tournament HQ', href: '/college-baseball/tournament' },
                { label: 'Regionals' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="narrow">
            <Badge variant="warning" className="mb-4">Coming May 2026</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mb-4">
              Regional Brackets
            </h1>
            <p className="text-text-tertiary text-lg leading-relaxed mb-8">
              16 regionals, 4 teams each. Bracket projections start mid-season and lock on
              Selection Monday. Each regional gets a matchup breakdown and host analysis.
            </p>

            <div className="bg-surface-light border border-dashed border-border rounded-xl p-8 text-center">
              <p className="text-sm text-text-muted mb-2">
                Regional bracket data populates on Selection Monday (late May / early June).
              </p>
              <p className="text-xs text-text-muted">
                Pre-selection projections will appear here as the season progresses.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-text-muted">
              <Link href="/college-baseball/tournament" className="hover:text-text-secondary transition-colors">
                &#8592; Tournament HQ
              </Link>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
