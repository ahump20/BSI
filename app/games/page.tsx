import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'BSI Arcade - Games | Blaze Sports Intel',
  description:
    'Play sports games from BSI. Football, baseball, and more coming soon. Get notified when new games launch.',
  openGraph: {
    title: 'BSI Arcade - Games | Blaze Sports Intel',
    description: 'Sports games from Blaze Sports Intel. Coming soon.',
    url: 'https://blazesportsintel.com/games',
    type: 'website',
  },
  alternates: {
    canonical: 'https://blazesportsintel.com/games',
  },
};

const games = [
  {
    id: 'blaze-blitz-football',
    title: 'Blaze Blitz Football',
    description:
      'Fast-paced football action with real-time play calling. Build your roster, call the plays, dominate the field.',
    status: 'Coming Soon',
    image: '/images/games/football-placeholder.svg',
  },
  {
    id: 'blaze-hot-dog',
    title: 'Blaze Hot Dog',
    description:
      'Classic hot dog vendor arcade game. Serve fans at the stadium before the seventh inning stretch.',
    status: 'Coming Soon',
    image: '/images/games/hotdog-placeholder.svg',
  },
  {
    id: 'sandlot-sluggers',
    title: 'Sandlot Sluggers',
    description:
      'Backyard baseball with neighborhood rules. Home run derby, strikeout challenges, and summer memories.',
    status: 'Coming Soon',
    image: '/images/games/baseball-placeholder.svg',
  },
];

export default function GamesPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <Badge variant="primary" className="mb-4">
              BSI Arcade
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-center mb-4">
              <span className="text-gradient-blaze">Games</span>
            </h1>
            <p className="text-text-secondary text-center max-w-2xl mx-auto">
              Sports games built by fans, for fans. Sign up to get notified when we launch.
            </p>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {games.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`} className="block group">
                  <Card
                    padding="none"
                    className="h-full overflow-hidden transition-transform hover:scale-[1.02]"
                  >
                    <div className="aspect-video bg-graphite flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal to-transparent" />
                      <span className="text-6xl">
                        {game.id.includes('football') && '🏈'}
                        {game.id.includes('hot-dog') && '🌭'}
                        {game.id.includes('sluggers') && '⚾'}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="font-display text-xl font-bold text-white group-hover:text-burnt-orange transition-colors">
                          {game.title}
                        </h2>
                        <Badge variant="secondary" size="sm">
                          {game.status}
                        </Badge>
                      </div>
                      <p className="text-text-tertiary text-sm">{game.description}</p>
                      <div className="mt-4 text-burnt-orange text-sm font-semibold group-hover:underline">
                        Learn more &rarr;
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>

        <Section padding="lg">
          <Container center>
            <div className="max-w-xl mx-auto text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-display mb-4">
                More Games Coming
              </h2>
              <p className="text-text-secondary mb-6">
                We're building more sports games. Basketball, hockey, and more on the roadmap.
              </p>
              <Link
                href="/blaze-vision"
                className="text-burnt-orange hover:text-ember transition-colors font-semibold"
              >
                Check out Blaze Vision for AI coaching &rarr;
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
