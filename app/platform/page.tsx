'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const colors = {
  burntOrange: '#BF5700',
  texasSoil: '#8B4513',
  ember: '#FF6B35',
  charcoal: '#1A1A1A',
  midnight: '#0D0D0D',
  cream: '#FAF8F5',
  gold: '#C9A227',
};

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'MLB', href: '/mlb' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'NFL', href: '/nfl' },
  { label: 'NBA', href: '/nba' },
  { label: 'Coverage', href: '/coverage' },
  { label: 'About', href: '/about' },
];

type PlatformPillar = {
  title: string;
  description: string;
  details: string[];
};

type SourceCitation = {
  label: string;
  url: string;
  confidence: number;
};

const pillars: PlatformPillar[] = [
  {
    title: 'Why Workers powers blazesportsintel.com',
    description: 'Dynamic routing, authentication, and real-time data calls require edge logic.',
    details: [
      'Route-level control for API namespaces and app surfaces.',
      'Authentication and session state managed at the edge.',
      'Low-latency personalization for sign-in state and sports tickers.',
      'Storage integrations (D1, KV, R2) for real-time and historical data.',
    ],
  },
  {
    title: 'Where Pages fits',
    description: 'Static content benefits from Git-based deploys and aggressive edge caching.',
    details: [
      'Marketing pages or documentation with minimal server-side logic.',
      'Static assets that can be cached globally without user-specific content.',
      'Subdomains or subpaths that link back into the main app surface.',
    ],
  },
  {
    title: 'Hybrid strategy',
    description: 'Keep the core app on Workers and layer static content where it excels.',
    details: [
      'Workers handle the apex domain and authenticated experiences.',
      'Pages can host static hubs (press, docs, brand assets) if needed.',
      'Unified routing ensures a consistent customer journey.',
    ],
  },
];

const routes = [
  { path: '/baseball/rankings', reason: 'Live rankings updates and dynamic filtering.' },
  { path: '/games/blitz/*', reason: 'Real-time game pipelines and interactive UI.' },
  { path: '/api/ops/*', reason: 'Operational APIs for app telemetry and data workflows.' },
  { path: '/scores', reason: 'Live scoreboards with personalized signals.' },
];

const sources: SourceCitation[] = [
  {
    label: 'Cloudflare Workers Overview',
    url: 'https://developers.cloudflare.com/workers/',
    confidence: 0.93,
  },
  {
    label: 'Cloudflare Pages Overview',
    url: 'https://developers.cloudflare.com/pages/',
    confidence: 0.91,
  },
  {
    label: 'Cloudflare Routing & APIs',
    url: 'https://developers.cloudflare.com/workers/runtime-apis/',
    confidence: 0.9,
  },
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-midnight text-cream">
      <Navbar items={navItems} />

      <Section className="pt-32 pb-16 bg-gradient-to-b from-charcoal to-midnight">
        <Container>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="primary" className="mb-4">Cloud Platform</Badge>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <span style={{ color: colors.burntOrange }}>Workers-First</span> Infrastructure
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Blaze Sports Intel runs on Cloudflare Workers to support dynamic routing, authentication,
                real-time sports data, and API orchestration. Static content can be layered with Pages
                where it accelerates delivery without compromising app logic.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Section className="py-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <ScrollReveal key={pillar.title}>
                <Card className="bg-charcoal border border-white/10 h-full">
                  <CardHeader>
                    <CardTitle className="text-xl" style={{ color: colors.burntOrange }}>
                      {pillar.title}
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-2">{pillar.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-gray-300">
                      {pillar.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.gold }} />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-16 bg-charcoal/60 border-y border-white/10">
        <Container>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="secondary">Active Routes</Badge>
                <span className="text-sm text-gray-400">Workers-aligned routing patterns</span>
              </div>
              <div className="grid gap-4">
                {routes.map((route) => (
                  <div
                    key={route.path}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-white/10 rounded-lg p-4 bg-midnight"
                  >
                    <span className="font-mono text-sm" style={{ color: colors.ember }}>{route.path}</span>
                    <span className="text-sm text-gray-300">{route.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Section className="py-16">
        <Container>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">Sources</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: colors.texasSoil }}>
                Platform references
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {sources.map((source) => (
                  <Card key={source.url} className="bg-charcoal border border-white/10">
                    <CardContent className="pt-6">
                      <p className="text-sm font-semibold text-cream mb-2">{source.label}</p>
                      <p className="text-xs text-gray-400 mb-3">Confidence: {(source.confidence * 100).toFixed(0)}%</p>
                      <Link
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#BF5700] hover:text-[#FF6B35] transition-colors"
                      >
                        View reference
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Footer />
    </main>
  );
}
