import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'College Football | Blaze Sports Intel',
  description:
    'NCAA Division I FBS college football coverage with conference standings, scores, rankings, and analytics.',
  openGraph: {
    title: 'College Football | Blaze Sports Intel',
    description: 'NCAA Division I FBS football coverage with standings and analytics.',
    url: 'https://blazesportsintel.com/college-football',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Football | Blaze Sports Intel',
    description: 'NCAA Division I FBS football coverage with standings and analytics.',
  },
};

export default function CollegeFootballAliasPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="relative overflow-hidden">
          <Container center>
            <Badge variant="primary" className="mb-4">
              College Football Hub
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-center uppercase tracking-display mb-4">
              NCAA <span className="text-gradient-blaze">Football</span> Coverage
            </h1>
            <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8">
              For the full college football experience, visit the primary NCAA football hub with
              standings, analytics, and recruiting intelligence.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/cfb">
                <Button variant="primary" size="lg">
                  Open CFB Hub
                </Button>
              </Link>
              <Link href="/sports">
                <Button variant="secondary" size="lg">
                  Explore All Sports
                </Button>
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
