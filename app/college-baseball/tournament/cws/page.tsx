import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'College World Series',
  description: 'CWS bracket, super regional matchups, and championship series coverage.',
};

export default function CWSPage() {
  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb
              items={[
                { label: 'College Baseball', href: '/college-baseball' },
                { label: 'Tournament HQ', href: '/college-baseball/tournament' },
                { label: 'College World Series' },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container size="narrow">
            <Badge variant="warning" className="mb-4">Coming June 2026</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mb-4">
              College World Series
            </h1>
            <p className="text-text-tertiary text-lg leading-relaxed mb-8">
              The road to Omaha. Super regional matchups, CWS bracket, game briefs, and
              championship series coverage. Eight teams. Double elimination. One champion.
            </p>

            <div className="bg-surface-light border border-dashed border-border rounded-xl p-8 text-center">
              <p className="text-sm text-text-muted mb-2">
                CWS data populates when super regionals are set (mid-June).
              </p>
              <p className="text-xs text-text-muted">
                Live game briefs and bracket tracking will publish in real time once the CWS begins.
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
