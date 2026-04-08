import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { PerformanceIndexClient } from './PerformanceIndexClient';

export const metadata: Metadata = {
  title: 'NIL Performance Index Calculator | Blaze Sports Intel',
  description:
    'Calculate any college baseball player\'s NIL index using live advanced stats. FMNV methodology: Performance (40%) + Exposure (30%) + Market (30%).',
};

export default function PerformanceIndexPage() {
  return (
    <>
      <div className="min-h-screen bg-background-primary text-text-primary">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nil-valuation"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NIL Valuation
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">Performance Index</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <div className="max-w-3xl">
              <Badge variant="primary" className="mb-4">BSI Estimate</Badge>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-text-primary mb-4">
                NIL Performance Index
              </h1>
              <p className="text-text-secondary max-w-2xl mb-2">
                Select a college baseball player to calculate their estimated NIL index.
                Uses live advanced stats from BSI Savant with the FMNV methodology.
              </p>
              <p className="text-xs text-text-muted">
                Performance (40%) + Exposure (30%) + Market (30%) ={' '}
                <Link href="/nil-valuation/methodology" className="text-burnt-orange hover:underline">
                  Full methodology
                </Link>
              </p>
            </div>
          </Container>
        </Section>

        {/* Calculator — client component */}
        <PerformanceIndexClient />
      </div>
    </>
  );
}
