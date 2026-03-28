import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Footer } from '@/components/layout-ds/Footer';
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
      <div className="min-h-screen bg-[var(--surface-scoreboard)] text-[var(--bsi-bone)]">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nil-valuation"
                className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                NIL Valuation
              </Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <span className="text-[var(--bsi-bone)] font-medium">Performance Index</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <div className="max-w-3xl">
              <Badge variant="primary" className="mb-4">BSI Estimate</Badge>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-[var(--bsi-bone)] mb-4">
                NIL Performance Index
              </h1>
              <p className="text-[var(--bsi-dust)] max-w-2xl mb-2">
                Select a college baseball player to calculate their estimated NIL index.
                Uses live advanced stats from BSI Savant with the FMNV methodology.
              </p>
              <p className="text-xs text-[rgba(196,184,165,0.35)]">
                Performance (40%) + Exposure (30%) + Market (30%) ={' '}
                <Link href="/nil-valuation/methodology" className="text-[var(--bsi-primary)] hover:underline">
                  Full methodology
                </Link>
              </p>
            </div>
          </Container>
        </Section>

        {/* Calculator — client component */}
        <PerformanceIndexClient />
      </div>
      <Footer />
    </>
  );
}
