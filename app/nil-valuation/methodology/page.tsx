'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NIL Valuation', href: '/nil-valuation' },
];

export default function NILMethodologyPage() {
  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/nil-valuation" className="text-text-tertiary hover:text-burnt-orange transition-colors">
                NIL Valuation
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Methodology</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">Transparency</Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                Our Methodology
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                How we calculate Fair Market NIL Value (FMNV) and convert performance metrics to dollar values.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Methodology Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="max-w-4xl mx-auto space-y-8">
              {/* FMNV Section */}
              <ScrollReveal>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Fair Market NIL Value (FMNV)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-text-secondary">
                      FMNV represents the estimated market value of an athlete's NIL rights based on multiple factors. Our model considers:
                    </p>
                    <ul className="space-y-3 text-text-secondary">
                      <li className="flex items-start gap-3">
                        <span className="text-burnt-orange font-bold">1.</span>
                        <div>
                          <strong className="text-white">On-Field Performance</strong> — Statistical production, awards, and projected draft position contribute to base value.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-burnt-orange font-bold">2.</span>
                        <div>
                          <strong className="text-white">Social Following</strong> — Combined reach across platforms with engagement rate adjustments.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-burnt-orange font-bold">3.</span>
                        <div>
                          <strong className="text-white">Market Size</strong> — School market, conference visibility, and regional brand affinity.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-burnt-orange font-bold">4.</span>
                        <div>
                          <strong className="text-white">Sport Premium</strong> — Football and basketball command higher valuations due to media exposure.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-burnt-orange font-bold">5.</span>
                        <div>
                          <strong className="text-white">Comparable Deals</strong> — Actual NIL deals for similar athletes inform market pricing.
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* WAR Section */}
              <ScrollReveal delay={100}>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      WAR-to-NIL Conversion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-text-secondary">
                      For baseball athletes, we convert Wins Above Replacement (WAR) to NIL value using MLB market rates as a benchmark:
                    </p>
                    <div className="bg-graphite rounded-lg p-4 font-mono text-sm">
                      <p className="text-burnt-orange mb-2">// Base calculation</p>
                      <p className="text-white">NIL Value = WAR × $/WAR × College Discount Factor</p>
                      <p className="text-text-tertiary mt-4">// 2025 MLB market: ~$8M per WAR</p>
                      <p className="text-text-tertiary">// College discount: 0.5-2% of MLB value</p>
                    </div>
                    <p className="text-text-secondary">
                      This gives a performance-based floor that we then adjust using the social and market factors from FMNV.
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Data Sources */}
              <ScrollReveal delay={200}>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      Data Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary mb-4">
                      Our valuations rely on publicly available data from trusted sources:
                    </p>
                    <ul className="grid gap-3 md:grid-cols-2 text-text-secondary">
                      <li className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        NCAA Statistics
                      </li>
                      <li className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        MLB Stats API
                      </li>
                      <li className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Social Media APIs
                      </li>
                      <li className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Public NIL Deal Reports
                      </li>
                      <li className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Market Research Data
                      </li>
                      <li className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Draft Projection Models
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Disclaimer */}
              <ScrollReveal delay={300}>
                <Card variant="default" padding="lg" className="border-warning/30 bg-warning/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-warning">
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Important Disclaimer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary">
                      Our valuations are <strong className="text-white">estimates for informational purposes only</strong>. Actual NIL values depend on negotiation, specific deal terms, and market conditions at the time of agreement. We do not guarantee accuracy and recommend consulting with NIL professionals before making financial decisions.
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
