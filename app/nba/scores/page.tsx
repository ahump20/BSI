import type { Metadata } from 'next';
import NBAGamesPage from '../games/page';

export const metadata: Metadata = {
  title: 'NBA Scores | Blaze Sports Intel',
  description: 'Live NBA scores, game results, and standings on Blaze Sports Intel.',
  openGraph: {
    title: 'NBA Scores | Blaze Sports Intel',
    description: 'Live NBA scores, game results, and standings.',
  },
};

export default function NBAScoresPage() {
  return <NBAGamesPage />;
}
