import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Stories | Blaze Sports Intel',
  description:
    'Feature stories and analysis across MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
  openGraph: {
    title: 'Stories | Blaze Sports Intel',
    description:
      'Feature stories and analysis across MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
    url: 'https://blazesportsintel.com/stories',
    type: 'website',
  },
};

export default function StoriesPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg">
          <Container>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
              Stories & Analysis
            </h1>
            <p className="text-text-secondary max-w-2xl mb-8">
              Long-form analysis, recruiting intelligence, and performance breakdowns across Blaze
              Sports Intel coverage.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Blaze Sports Intel Blog</h2>
                <p className="text-sm text-text-secondary">
                  Read published insights and analytics write-ups from the BSI team.
                </p>
                <Link href="/blog" className="text-blaze-ember font-semibold">
                  Open Blog
                </Link>
              </Card>
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Recruiting Intelligence</h2>
                <p className="text-sm text-text-secondary">
                  Track movement and scouting signals across the transfer portal.
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
