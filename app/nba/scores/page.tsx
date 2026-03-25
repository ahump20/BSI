import type { Metadata } from 'next';
import NBAGamesPage from '../games/page';

export const metadata: Metadata = {
  title: 'NBA Scores | Blaze Sports Intel',
  description: 'Live NBA scores, game results, and standings on Blaze Sports Intel.',
  openGraph: {
    title: 'NBA Scores | Blaze Sports Intel',
    description: 'Live NBA scores, game results, and standings.',
    images: [{ url: '/images/og-nba.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NBA Scores | Blaze Sports Intel',
    description: 'Live NBA scores, game results, and standings.',
    images: ['/images/og-nba.png'],
  },
};

export default function NBAScoresPage() {
  return <NBAGamesPage />;
}
