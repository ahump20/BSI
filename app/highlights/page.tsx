import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Highlights | Blaze Sports Intel',
  description:
    'Curated game highlights and performance moments across MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
  openGraph: {
    title: 'Highlights | Blaze Sports Intel',
    description:
      'Curated game highlights and performance moments across MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
    url: 'https://blazesportsintel.com/highlights',
    type: 'website',
  },
};

export default function HighlightsPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg">
          <Container>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
              Highlights Hub
            </h1>
            <p className="text-text-secondary max-w-2xl mb-8">
              Access key moments from live games and performance analysis across the sports we track
              in production.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Live Games</h2>
                <p className="text-sm text-text-secondary">
                  Jump into the live games console for real-time scoring and momentum shifts.
                </p>
                <Link href="/games" className="text-blaze-ember font-semibold">
                  View Live Games
                </Link>
              </Card>
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Team Performance</h2>
                <p className="text-sm text-text-secondary">
                  Review team and player performance dashboards across coverage sports.
                </p>
                <Link href="/teams" className="text-blaze-ember font-semibold">
                  Explore Team Intelligence
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
