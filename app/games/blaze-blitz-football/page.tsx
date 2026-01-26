import { Metadata } from 'next';
import { GameProductPage } from '@/components/games/GameProductPage';

export const metadata: Metadata = {
  title: 'Blaze Blitz Football | BSI Arcade',
  description:
    '7-on-7 arcade football action. Run, juke, and score touchdowns in 90 seconds. Play free in your browser.',
  openGraph: {
    title: 'Blaze Blitz Football | BSI Arcade',
    description: '7-on-7 arcade football. Run, juke, score touchdowns. Play free now.',
    url: 'https://blazesportsintel.com/games/blaze-blitz-football',
    type: 'website',
  },
  alternates: {
    canonical: 'https://blazesportsintel.com/games/blaze-blitz-football',
  },
};

export default function BlazeBlitzFootballPage() {
  return (
    <GameProductPage
      id="blaze-blitz-football"
      title="Blaze Blitz Football"
      tagline="Run, juke, score. 90 seconds of pure football."
      description="7-on-7 arcade football action. Run, juke, and score touchdowns before time runs out. Use your turbo wisely. A fast-paced 90-second football experience you can play anywhere."
      icon="🏈"
      isLive={true}
      playUrl="./play"
      features={[
        '90-second arcade sessions',
        '7-on-7 football action',
        'Run, juke, and score touchdowns',
        'Turbo boost for breakaway plays',
        'Touch controls for mobile',
        'Leaderboard competition',
        'Instant browser play',
        'No downloads or accounts needed',
      ]}
    />
  );
}
