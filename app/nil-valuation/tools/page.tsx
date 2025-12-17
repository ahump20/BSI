'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NIL Valuation', href: '/nil-valuation' },
];

const tools = [
  {
    title: 'FMNV Calculator',
    description: 'Fair Market NIL Value calculator using our proprietary model. Input player stats, social following, and market factors to get an estimated valuation.',
    status: 'Live',
    statusVariant: 'success' as const,
    href: '/nil-valuation',
  },
  {
    title: 'WAR-to-NIL Converter',
    description: 'Convert Wins Above Replacement metrics to NIL dollar values. See how on-field performance translates to market value.',
    status: 'Live',
    statusVariant: 'success' as const,
    href: '/nil-valuation',
  },
  {
    title: 'Comparable Analysis',
    description: 'Find similar players and their NIL valuations. Compare across sports, conferences, and market sizes.',
    status: 'Coming Soon',
    statusVariant: 'warning' as const,
    href: '#',
  },
  {
    title: 'Market Trend Tracker',
    description: 'Track NIL market trends by sport, position, and region. See where the money is flowing.',
    status: 'Coming Soon',
    statusVariant: 'warning' as const,
    href: '#',
  },
  {
    title: 'Brand Match Finder',
    description: 'Match athletes with potential brand partners based on audience alignment and market fit.',
    status: 'Coming Soon',
    statusVariant: 'warning' as const,
    href: '#',
  },
  {
    title: 'Deal Analyzer',
    description: 'Analyze proposed NIL deals to determine fair value and identify red flags.',
    status: 'Coming Soon',
    statusVariant: 'warning' as const,
    href: '#',
  },
];

export default function NILToolsPage() {
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
              <span className="text-white font-medium">Tools</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">NIL Intelligence</Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                NIL Valuation Tools
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                Calculators, analyzers, and market intelligence tools to help athletes, agents, and programs make informed NIL decisions.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tools Grid */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, index) => (
                <ScrollReveal key={tool.title} delay={index * 100}>
                  <Card variant="default" padding="lg" className="h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle size="sm">{tool.title}</CardTitle>
                        <Badge variant={tool.statusVariant}>{tool.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-text-secondary text-sm mb-6 flex-1">{tool.description}</p>
                      {tool.status === 'Live' ? (
                        <Link href={tool.href}>
                          <Button variant="primary" size="sm" className="w-full">
                            Launch Tool
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="secondary" size="sm" className="w-full" disabled>
                          Coming Soon
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            {/* CTA */}
            <ScrollReveal delay={400}>
              <Card variant="default" padding="lg" className="mt-12 text-center">
                <h3 className="font-display text-xl font-bold text-white mb-4">
                  Need a Custom Analysis?
                </h3>
                <p className="text-text-secondary mb-6 max-w-xl mx-auto">
                  Our enterprise tier includes custom valuation reports, market analysis, and direct consultation with our NIL experts.
                </p>
                <Link href="/nil-valuation">
                  <Button variant="primary">View Enterprise Options</Button>
                </Link>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
