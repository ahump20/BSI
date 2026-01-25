import { Metadata } from 'next';
import { GameProductPage } from '@/components/games/GameProductPage';

export const metadata: Metadata = {
  title: 'Blaze Blitz Football | BSI Arcade',
  description:
    'Fast-paced football action with real-time play calling. Build your roster, call the plays, dominate the field. Coming soon from BSI Arcade.',
  openGraph: {
    title: 'Blaze Blitz Football | BSI Arcade',
    description: 'Fast-paced football action with real-time play calling. Coming soon.',
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
      tagline="Call the plays. Control the clock. Win the game."
      description="Blaze Blitz Football brings the intensity of Friday nights to your screen. Build your roster from a pool of recruits, call plays in real-time, and outcoach your opponents. Whether you're running a two-minute drill or grinding out a fourth-quarter drive, every decision matters."
      icon="🏈"
      features={[
        'Real-time play calling with audibles',
        'Roster building and player development',
        'Multiple game modes: Season, Rivalry, Quick Play',
        'Dynamic weather and field conditions',
        'Formation editor and custom playbooks',
        'Online multiplayer matchups',
        'Career stats and leaderboards',
        'Authentic football strategy depth',
      ]}
    />
  );
}
