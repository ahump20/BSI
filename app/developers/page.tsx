import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Developer Portal | Blaze Sports Intel',
  description:
    'Access the BSI API for sports data, predictions, and analytics. Documentation, OpenAPI spec, and getting started guides.',
  openGraph: {
    title: 'Developer Portal | Blaze Sports Intel',
    description: 'BSI API documentation and developer resources.',
    url: 'https://blazesportsintel.com/developers',
    type: 'website',
  },
  alternates: {
    canonical: 'https://blazesportsintel.com/developers',
  },
};

const apiCategories = [
  {
    title: 'Live Scores',
    description: 'Real-time scores for MLB, NFL, NBA, and college sports.',
    endpoints: ['/api/scores', '/api/games/{id}'],
    icon: '⚡',
  },
  {
    title: 'Health & Status',
    description: 'Service health checks and system status.',
    endpoints: ['/api/healthz', '/api/health/{service}'],
    icon: '💚',
  },
  {
    title: 'Transfer Portal',
    description: 'College athlete transfer data and tracking.',
    endpoints: ['/api/portal/entries', '/api/portal/players'],
    icon: '🔄',
  },
  {
    title: 'Analytics',
    description: 'Advanced statistics and predictions.',
    endpoints: ['/api/analytics', '/api/predictions'],
    icon: '📊',
  },
];

const quickLinks = [
  {
    title: 'API Reference',
    description: 'Full interactive documentation with Swagger UI',
    href: '/developers/docs',
    icon: '📖',
  },
  {
    title: 'OpenAPI Spec',
    description: 'Download the raw OpenAPI 3.0 specification',
    href: '/openapi.json',
    icon: '📄',
    external: true,
  },
  {
    title: 'Legacy Docs',
    description: 'Previous API documentation (deprecated)',
    href: '/docs/api.html',
    icon: '📚',
    external: true,
  },
];

export default function DevelopersPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <Badge variant="primary" className="mb-4">
              API
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
              Developer <span className="text-gradient-blaze">Portal</span>
            </h1>
            <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8">
              Build on top of Blaze Sports Intel. Access real-time sports data, analytics, and
              predictions through our REST API.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/developers/docs">
                <span className="inline-block px-6 py-3 bg-burnt-orange text-white font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors">
                  View API Docs
                </span>
              </Link>
              <a
                href="/openapi.json"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-graphite text-white font-semibold rounded-lg border border-border-subtle hover:bg-white/10 transition-colors"
              >
                Download OpenAPI Spec
              </a>
            </div>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container>
            <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-8">
              Quick Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {quickLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="block group"
                >
                  <Card padding="lg" className="h-full transition-transform hover:scale-[1.02]">
                    <div className="text-3xl mb-3">{link.icon}</div>
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-burnt-orange transition-colors mb-1">
                      {link.title}
                    </h3>
                    <p className="text-text-tertiary text-sm">{link.description}</p>
                  </Card>
                </Link>
              ))}
            </div>

            <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-8">
              API Categories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {apiCategories.map((category) => (
                <Card key={category.title} padding="lg">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{category.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-bold text-white mb-1">
                        {category.title}
                      </h3>
                      <p className="text-text-tertiary text-sm mb-3">{category.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {category.endpoints.map((endpoint) => (
                          <code
                            key={endpoint}
                            className="text-xs bg-graphite px-2 py-1 rounded text-burnt-orange font-mono"
                          >
                            {endpoint}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-6">
                Getting Started
              </h2>

              <div className="space-y-6">
                <div className="bg-graphite rounded-lg p-6 border border-border-subtle">
                  <h3 className="font-semibold text-white mb-3">1. Check API Status</h3>
                  <code className="block bg-midnight p-4 rounded text-sm font-mono text-text-secondary overflow-x-auto">
                    curl https://blazesportsintel.com/api/healthz
                  </code>
                </div>

                <div className="bg-graphite rounded-lg p-6 border border-border-subtle">
                  <h3 className="font-semibold text-white mb-3">2. Fetch Live Scores</h3>
                  <code className="block bg-midnight p-4 rounded text-sm font-mono text-text-secondary overflow-x-auto">
                    curl https://blazesportsintel.com/api/scores?sport=mlb
                  </code>
                </div>

                <div className="bg-graphite rounded-lg p-6 border border-border-subtle">
                  <h3 className="font-semibold text-white mb-3">3. Browse Full Documentation</h3>
                  <p className="text-text-tertiary mb-3">
                    Explore all endpoints with the interactive Swagger UI documentation.
                  </p>
                  <Link href="/developers/docs" className="text-burnt-orange hover:underline">
                    Open API Reference &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-6">
                Rate Limits & Authentication
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card padding="lg">
                  <h3 className="font-semibold text-white mb-3">Public Endpoints</h3>
                  <ul className="space-y-2 text-text-tertiary text-sm">
                    <li>• 100 requests/minute</li>
                    <li>• No authentication required</li>
                    <li>• Cached responses (60s TTL)</li>
                  </ul>
                </Card>

                <Card padding="lg">
                  <h3 className="font-semibold text-white mb-3">Pro API Access</h3>
                  <ul className="space-y-2 text-text-tertiary text-sm">
                    <li>• 1000 requests/minute</li>
                    <li>• API key authentication</li>
                    <li>• Real-time data (7s refresh)</li>
                  </ul>
                  <Link
                    href="/pricing"
                    className="mt-4 inline-block text-burnt-orange text-sm hover:underline"
                  >
                    Upgrade to Pro &rarr;
                  </Link>
                </Card>
              </div>
            </div>
          </Container>
        </Section>

        <Section padding="lg">
          <Container center>
            <div className="max-w-xl mx-auto text-center">
              <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-4">
                Need Help?
              </h2>
              <p className="text-text-secondary mb-6">
                Questions about the API? Integration issues? Reach out directly.
              </p>
              <a
                href="mailto:api@blazesportsintel.com"
                className="text-burnt-orange hover:text-ember transition-colors font-semibold"
              >
                api@blazesportsintel.com
              </a>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
