import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Players | Blaze Sports Intel',
  description: 'Player intelligence across MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
  openGraph: {
    title: 'Players | Blaze Sports Intel',
    description: 'Player intelligence across MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
    url: 'https://blazesportsintel.com/players',
    type: 'website',
  },
};

export default function PlayersPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg">
          <Container>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
              Player Intelligence
            </h1>
            <p className="text-text-secondary max-w-2xl mb-8">
              Player profiles, projections, and recruiting insight across the sports we cover in
              production.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Player Search</h2>
                <p className="text-sm text-text-secondary">
                  Use the search console to locate players, teams, and stats across sports.
                </p>
                <Link href="/search" className="text-blaze-ember font-semibold">
                  Open Player Search
                </Link>
              </Card>
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Transfer Portal</h2>
                <p className="text-sm text-text-secondary">
                  Track athlete movement and verified portal intelligence.
                </p>
                <Link href="/transfer-portal" className="text-blaze-ember font-semibold">
                  View Transfer Portal
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
