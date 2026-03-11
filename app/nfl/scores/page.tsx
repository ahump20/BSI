import type { Metadata } from 'next';
import NFLGamesPage from '../games/page';

export const metadata: Metadata = {
  title: 'NFL Scores | Blaze Sports Intel',
  description: 'Live NFL scores, game results, and weekly matchups on Blaze Sports Intel.',
  openGraph: {
    title: 'NFL Scores | Blaze Sports Intel',
    description: 'Live NFL scores, game results, and weekly matchups.',
  },
};

export default function NFLScoresPage() {
  return <NFLGamesPage />;
}
