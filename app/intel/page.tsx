import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Intel | Blaze Sports Intel',
  description: 'Unified intelligence across MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
  openGraph: {
    title: 'Intel | Blaze Sports Intel',
    description: 'Unified intelligence across MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
    url: 'https://blazesportsintel.com/intel',
    type: 'website',
  },
};

export default function IntelPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg">
          <Container>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
              Intelligence Center
            </h1>
            <p className="text-text-secondary max-w-2xl mb-10">
              Centralized intelligence across the leagues Blaze Sports Intel tracks in production.
              Use the coverage hubs below to access live scores, analytics, and recruiting insight.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Pro Coverage</h2>
                <p className="text-sm text-text-secondary">
                  MLB, NFL, and NBA insights with live updates and predictive analytics.
                </p>
                <Link href="/sports/mlb" className="text-blaze-ember font-semibold">
                  Open Pro Intelligence
                </Link>
              </Card>
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">College Coverage</h2>
                <p className="text-sm text-text-secondary">
                  NCAA Baseball and NCAA Football intelligence with recruiting and portal signals.
                </p>
                <Link href="/sports/college-baseball" className="text-blaze-ember font-semibold">
                  Open College Intelligence
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
