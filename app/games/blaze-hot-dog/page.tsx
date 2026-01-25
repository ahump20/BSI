import { Metadata } from 'next';
import { GameProductPage } from '@/components/games/GameProductPage';

export const metadata: Metadata = {
  title: 'Blaze Hot Dog | BSI Arcade',
  description:
    'Classic hot dog vendor arcade game. Serve fans at the stadium before the seventh inning stretch. Coming soon from BSI Arcade.',
  openGraph: {
    title: 'Blaze Hot Dog | BSI Arcade',
    description: 'Classic stadium vendor arcade action. Coming soon.',
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
      title="Blaze Hot Dog"
      tagline="Hot dogs here! Get your hot dogs!"
      description="Navigate the crowded stadium aisles as a hot dog vendor trying to serve as many fans as possible before the seventh inning stretch. Dodge spilled sodas, avoid blocking views during big plays, and master the art of making change while walking stairs backwards."
      icon="🌭"
      features={[
        'Classic arcade gameplay with modern polish',
        'Multiple stadium venues to unlock',
        'Power-ups: Speed Boost, Extra Inventory, Double Tips',
        'Challenge modes: Time Attack, No-Drop, VIP Section',
        'Day and night game atmospheres',
        'Leaderboards and daily challenges',
        'Unlockable vendor gear and hot dog varieties',
        'Authentic ballpark sounds and crowd reactions',
      ]}
    />
  );
}
