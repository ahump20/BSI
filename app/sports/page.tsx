import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';

const sports = [
  {
    slug: 'mlb',
    name: 'MLB',
    description: 'Live scores, standings, and predictive analytics for Major League Baseball.',
    href: '/mlb',
  },
  {
    slug: 'college-baseball',
    name: 'NCAA Baseball',
    description: 'College baseball coverage with rankings, teams, and recruiting intelligence.',
    href: '/college-baseball',
  },
  {
    slug: 'college-football',
    name: 'NCAA Football',
    description: 'FBS coverage with scores, analytics, and transfer portal intelligence.',
    href: '/cfb',
  },
  {
    slug: 'nfl',
    name: 'NFL',
    description: 'Pro football coverage with advanced analytics and live scoring.',
    href: '/nfl',
  },
  {
    slug: 'nba',
    name: 'NBA',
    description: 'Pro basketball intelligence with performance insights and live updates.',
    href: '/nba',
  },
];

export const metadata: Metadata = {
  title: 'Sports | Blaze Sports Intel',
  description: 'Multi-sport intelligence covering MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
  openGraph: {
    title: 'Sports | Blaze Sports Intel',
    description:
      'Multi-sport intelligence covering MLB, NCAA Baseball, NCAA Football, NFL, and NBA.',
    url: 'https://blazesportsintel.com/sports',
    type: 'website',
  },
};

export default function SportsIndexPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg">
          <Container>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
              Sports Coverage
            </h1>
            <p className="text-text-secondary max-w-2xl mb-10">
              Navigate Blaze Sports Intel coverage by sport, prioritized for MLB, NCAA Baseball,
              NCAA Football, NFL, and NBA.
            </p>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sports.map((sport) => (
                <Card key={sport.slug} className="p-6 flex flex-col gap-3">
                  <h2 className="text-xl font-semibold text-white">{sport.name}</h2>
                  <p className="text-sm text-text-secondary">{sport.description}</p>
                  <Link href={sport.href} className="text-blaze-ember font-semibold">
                    Open {sport.name}
                  </Link>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
