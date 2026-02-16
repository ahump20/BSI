import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YardSale — The Slow Pitch Softball Marketplace | Blaze Sports Intel',
  description:
    'Buy, sell, and trade slow pitch softball gear with players who know the game. Filter by certification stamp, verified sellers, buyer protection, and instant drop alerts.',
  openGraph: {
    title: 'YardSale — The Slow Pitch Softball Marketplace',
    description:
      'Buy, sell, and trade slow pitch softball gear with players who know the game. Filter by certification stamp, verified sellers, buyer protection, and instant drop alerts.',
  },
};

export default function YardSaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
