import { Metadata } from 'next';
import { GameProductPage } from '@/components/games/GameProductPage';

export const metadata: Metadata = {
  title: 'Blaze Hot Dog Dash | BSI Arcade',
  description:
    'Help Blaze the dachshund catch falling hot dogs! A fun 45-second arcade game. Play free in your browser.',
  openGraph: {
    title: 'Blaze Hot Dog Dash | BSI Arcade',
    description: 'Help Blaze catch hot dogs and get chonkier! Play free now.',
    url: 'https://blazesportsintel.com/games/blaze-hot-dog',
    type: 'website',
  },
  alternates: {
    canonical: 'https://blazesportsintel.com/games/blaze-hot-dog',
  },
};

export default function BlazeHotDogPage() {
  return (
    <GameProductPage
      id="blaze-hot-dog"
      title="Blaze Hot Dog Dash"
      tagline="Help Blaze catch falling hot dogs!"
      description="Help Blaze the dachshund catch falling hot dogs! Watch her get progressively chonkier as you rack up points. Golden hot dogs are worth 5 pts. Power-ups included. A fun 45-second arcade experience."
      icon="🌭"
      isLive={true}
      playUrl="/games/blaze-hot-dog/play"
      features={[
        '45-second arcade sessions',
        'Touch and keyboard controls',
        'Progressive chonk levels for Blaze',
        'Golden hot dogs worth 5 points',
        'Power-ups for extra time and points',
        'Mobile-friendly touch controls',
        'Instant play - no downloads',
        'Share your high scores',
      ]}
    />
  );
}
