import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';

type SportSlug = 'mlb' | 'college-baseball' | 'college-football' | 'nfl' | 'nba';

const sportConfig: Record<
  SportSlug,
  { name: string; description: string; primaryHref: string; secondaryHref: string }
> = {
  mlb: {
    name: 'MLB',
    description: 'Live scores, standings, and predictive analytics for Major League Baseball.',
    primaryHref: '/mlb',
    secondaryHref: '/games',
  },
  'college-baseball': {
    name: 'NCAA Baseball',
    description: 'College baseball intelligence with teams, rankings, and recruiting signals.',
    primaryHref: '/college-baseball',
    secondaryHref: '/transfer-portal',
  },
  'college-football': {
    name: 'NCAA Football',
    description: 'FBS coverage with analytics, standings, and recruiting intelligence.',
    primaryHref: '/cfb',
    secondaryHref: '/transfer-portal',
  },
  nfl: {
    name: 'NFL',
    description: 'Pro football analytics with real-time game intelligence.',
    primaryHref: '/nfl',
    secondaryHref: '/scores',
  },
  nba: {
    name: 'NBA',
    description: 'Pro basketball performance intelligence and live scoring.',
    primaryHref: '/nba',
    secondaryHref: '/scores',
  },
};

export function generateStaticParams(): Array<{ sport: SportSlug }> {
  return Object.keys(sportConfig).map((sport) => ({ sport: sport as SportSlug }));
}

export function generateMetadata({ params }: { params: { sport: SportSlug } }): Metadata {
  const sport = sportConfig[params.sport];
  if (!sport) {
    return {
      title: 'Sports | Blaze Sports Intel',
      description: 'Multi-sport intelligence for professional and college coverage.',
    };
  }
  return {
    title: `${sport.name} | Blaze Sports Intel`,
    description: sport.description,
    openGraph: {
      title: `${sport.name} | Blaze Sports Intel`,
      description: sport.description,
      url: `https://blazesportsintel.com/sports/${params.sport}`,
      type: 'website',
    },
  };
}

export default function SportDetailPage({ params }: { params: { sport: SportSlug } }) {
  const sport = sportConfig[params.sport];
  if (!sport) {
    notFound();
  }

  return (
    <>
      <main id="main-content">
        <Section padding="lg">
          <Container>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
              {sport.name} Intelligence
            </h1>
            <p className="text-text-secondary max-w-2xl mb-8">{sport.description}</p>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Primary Coverage</h2>
                <p className="text-sm text-text-secondary">
                  Jump directly to the main coverage hub for this sport.
                </p>
                <Link href={sport.primaryHref} className="text-blaze-ember font-semibold">
                  Open {sport.name} Hub
                </Link>
              </Card>
              <Card className="p-6 flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">Related Intelligence</h2>
                <p className="text-sm text-text-secondary">
                  Track connected insights such as live scores, analytics, and portal movement.
                </p>
                <Link href={sport.secondaryHref} className="text-blaze-ember font-semibold">
                  View Related Coverage
                </Link>
              </Card>
            </div>
            <div className="mt-8">
              <Link href="/sports" className="text-sm text-text-secondary">
                Back to all sports
              </Link>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
