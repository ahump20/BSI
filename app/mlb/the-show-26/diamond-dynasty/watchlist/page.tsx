import type { Metadata } from 'next';
import { DiamondDynastyWatchlistClient } from '@/components/mlb-the-show/DiamondDynastyWatchlistClient';

export const metadata: Metadata = {
  title: 'Diamond Dynasty Watchlist | MLB The Show 26 | Blaze Sports Intel',
  description:
    'Local-first Diamond Dynasty watchlist for tracking the cards you care about, backed by the same market-aware card detail API used across the feature.',
};

export default function DiamondDynastyWatchlistPage() {
  return <DiamondDynastyWatchlistClient />;
}
