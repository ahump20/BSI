import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { Footer } from '@/components/layout-ds/Footer';
import type { Metadata } from 'next';
import { NILDashboardClient } from './NILDashboardClient';

export const metadata: Metadata = {
  title: 'NIL Market Intelligence | Blaze Sports Intel',
  description:
    'Research-backed NIL market data: $2.26B market size, sport distribution, gender equity, and collective growth. Sourced from peer-reviewed research and verified industry reports.',
};

export default function NILValuationPage() {
  return (
    <>
      <div className="min-h-screen bg-background-primary text-text-primary">
        {/* Hero */}
        <Section className="pt-6 pb-12 relative overflow-hidden">
          <HeroGlow />
          <Container>
            <div className="max-w-4xl mx-auto text-center">
              <span className="section-label">BSI Research</span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display mb-6 text-text-primary">
                NIL Market Intelligence
              </h1>
              <p className="text-burnt-orange font-serif italic text-lg leading-relaxed mb-4 max-w-2xl mx-auto">
                Real data from the $2.26 billion NIL marketplace. Every figure sourced from
                peer-reviewed research and verified industry reports.
              </p>
              <p className="text-text-muted text-sm max-w-xl mx-auto mb-8">
                Based on{' '}
                <Link href="/research/nil-analysis" className="text-burnt-orange hover:underline">
                  &ldquo;The $1 Billion Experiment&rdquo;
                </Link>
                {' '}— BSI Research Division, March 2026.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/nil-valuation/performance-index">
                  <Button size="lg" className="bg-burnt-orange">
                    Calculate a Player&apos;s NIL Index
                  </Button>
                </Link>
                <Link href="/nil-valuation/methodology">
                  <Button variant="outline" size="lg">
                    View Methodology
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </Section>

        {/* Key Metrics Bar */}
        <div className="bg-background-secondary border-y border-border py-8">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-mono font-bold text-burnt-orange">
                  $2.26B
                </div>
                <p className="text-text-tertiary mt-1 text-sm">Year 4 Market (Verified)</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-mono font-bold text-burnt-orange">
                  200+
                </div>
                <p className="text-text-tertiary mt-1 text-sm">Active Collectives</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-mono font-bold text-burnt-orange">
                  44.5%
                </div>
                <p className="text-text-tertiary mt-1 text-sm">Football Share</p>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-mono font-bold text-burnt-orange">
                  43%
                </div>
                <p className="text-text-tertiary mt-1 text-sm">Women&apos;s Deal Share</p>
              </div>
            </div>
          </Container>
        </div>

        {/* Charts Section — client component */}
        <NILDashboardClient />

        {/* FMNV Methodology Preview */}
        <Section className="py-16 bg-background-secondary">
          <Container>
            <div className="max-w-3xl mx-auto">
              <Card className="border-l-4 border-l-burnt-orange">
                <CardContent className="p-8">
                  <Badge variant="secondary" className="mb-4">
                    Methodology
                  </Badge>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-display text-text-primary mb-4">
                    Fair Market NIL Value (FMNV)
                  </h2>
                  <p className="text-text-tertiary mb-6">
                    BSI&apos;s FMNV model combines on-field performance data from our Savant compute
                    pipeline with exposure and market factors to estimate what an athlete&apos;s NIL
                    is worth. Every input is sourced from live data — no fabricated metrics.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-background-primary rounded-lg">
                      <div className="text-xl font-bold text-text-primary">40%</div>
                      <div className="text-xs text-text-muted">Performance</div>
                      <div className="text-[10px] text-text-muted/50 mt-1">wOBA, wRC+, FIP</div>
                    </div>
                    <div className="text-center p-4 bg-background-primary rounded-lg">
                      <div className="text-xl font-bold text-text-primary">30%</div>
                      <div className="text-xs text-text-muted">Exposure</div>
                      <div className="text-[10px] text-text-muted/50 mt-1">Conference, Social</div>
                    </div>
                    <div className="text-center p-4 bg-background-primary rounded-lg">
                      <div className="text-xl font-bold text-text-primary">30%</div>
                      <div className="text-xs text-text-muted">Market</div>
                      <div className="text-[10px] text-text-muted/50 mt-1">Metro, Program</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/nil-valuation/methodology" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Read Full Methodology
                      </Button>
                    </Link>
                    <Link href="/nil-valuation/performance-index" className="flex-1">
                      <Button className="w-full bg-burnt-orange">
                        Try the Calculator
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Container>
        </Section>

        {/* Tools Grid */}
        <Section className="py-16">
          <Container>
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display text-text-primary mb-4">
                NIL Intelligence Tools
              </h2>
              <p className="text-text-tertiary max-w-2xl mx-auto">
                Move beyond guesswork. Data-driven tools for athletes, agents, and programs.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <Badge variant="success" className="mb-3 w-fit">Live</Badge>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Performance Index
                  </h3>
                  <p className="text-text-tertiary text-sm mb-4 flex-1">
                    Calculate any college baseball player&apos;s NIL index using live advanced
                    stats from BSI Savant.
                  </p>
                  <Link href="/nil-valuation/performance-index">
                    <Button variant="outline" className="w-full">
                      Launch Calculator
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <Badge variant="success" className="mb-3 w-fit">Live</Badge>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Full Methodology
                  </h3>
                  <p className="text-text-tertiary text-sm mb-4 flex-1">
                    How FMNV works: the weights, the inputs, the limitations.
                    Full transparency on every calculation.
                  </p>
                  <Link href="/nil-valuation/methodology">
                    <Button variant="outline" className="w-full">
                      Read Methodology
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <Badge variant="success" className="mb-3 w-fit">Live</Badge>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    All NIL Tools
                  </h3>
                  <p className="text-text-tertiary text-sm mb-4 flex-1">
                    Full catalog of NIL calculators, analyzers, and market intelligence
                    tools — live and in development.
                  </p>
                  <Link href="/nil-valuation/tools">
                    <Button variant="outline" className="w-full">
                      View All Tools
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </Container>
        </Section>

        {/* Research Attribution */}
        <Section className="py-12 bg-background-secondary border-t border-border">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-xs text-text-muted/50 font-mono uppercase tracking-wider mb-3">
                Data Sources
              </p>
              <p className="text-sm text-text-tertiary leading-relaxed">
                All market data sourced from Opendorse NIL reports (2022-2025), SponsorUnited
                partnership data, 247Sports collective tracking, and peer-reviewed academic
                research. Player performance metrics from BSI Savant compute pipeline.
                Full citations in{' '}
                <Link href="/research/nil-analysis" className="text-burnt-orange hover:underline">
                  the research paper
                </Link>.
              </p>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
