import type { Metadata } from 'next';
import NFLGamesPage from '../games/page';

export const metadata: Metadata = {
  title: 'NFL Scores | Blaze Sports Intel',
  description: 'Live NFL scores, game results, and weekly matchups on Blaze Sports Intel.',
  openGraph: {
    title: 'NFL Scores | Blaze Sports Intel',
    description: 'Live NFL scores, game results, and weekly matchups.',
    images: [{ url: '/images/og-nfl.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Scores | Blaze Sports Intel',
    description: 'Live NFL scores, game results, and weekly matchups.',
    images: ['/images/og-nfl.png'],
  },
};

export default function NFLScoresPage() {
  return <NFLGamesPage />;
}
