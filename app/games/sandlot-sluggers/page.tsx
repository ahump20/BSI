import { Metadata } from 'next';
import { GameProductPage } from '@/components/games/GameProductPage';

export const metadata: Metadata = {
  title: 'Sandlot Sluggers | BSI Arcade',
  description:
    'A 60-second batting challenge. Time your swings, rack up hits, and chase home runs. Play free in your browser.',
  openGraph: {
    title: 'Sandlot Sluggers | BSI Arcade',
    description: '60-second batting challenge. Simple to play, hard to master. Play free now.',
    url: 'https://blazesportsintel.com/games/sandlot-sluggers',
    type: 'website',
  },
  alternates: {
    canonical: 'https://blazesportsintel.com/games/sandlot-sluggers',
  },
};

export default function SandlotSluggersPage() {
  return (
    <GameProductPage
      id="sandlot-sluggers"
      title="Sandlot Sluggers"
      tagline="60 seconds. Infinite home runs."
      description="A 60-second batting challenge that's simple to play but hard to master. Time your swings perfectly, rack up hits, and chase home runs. Watch the ball soar over the backyard fence."
      icon="⚾"
      isLive={true}
      playUrl="/games/sandlot-sluggers/play"
      features={[
        '60-second batting challenges',
        'Simple timing-based gameplay',
        'Chase home runs and high scores',
        'Mobile-ready touch controls',
        'Leaderboard competition',
        'Instant play in your browser',
        'No downloads required',
        'Share your best scores',
      ]}
    />
  );
}
