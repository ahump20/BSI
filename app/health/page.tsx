import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'System Health | Blaze Sports Intel',
  description: 'Operational health and service status for Blaze Sports Intel.',
  openGraph: {
    title: 'System Health | Blaze Sports Intel',
    description: 'Operational health and service status for Blaze Sports Intel.',
    url: 'https://blazesportsintel.com/health',
    type: 'website',
  },
};

export default function HealthPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg">
          <Container>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
              System Health
            </h1>
            <p className="text-text-secondary max-w-2xl mb-8">
              Review operational health across Blaze Sports Intel services and data providers.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">API Health</h2>
                <p className="text-sm text-text-secondary">
                  JSON health checks for live service dependencies and Cloudflare bindings.
                </p>
                <Link href="/api/health" className="text-blaze-ember font-semibold">
                  Open /api/health
                </Link>
              </Card>
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Platform Status</h2>
                <p className="text-sm text-text-secondary">
                  View the operational status dashboard for the production platform.
                </p>
                <Link href="/status" className="text-blaze-ember font-semibold">
                  Open Status Page
                </Link>
              </Card>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
