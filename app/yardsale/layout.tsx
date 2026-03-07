import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YardSale | Softball Marketplace | Blaze Sports Intel',
  description:
    'YardSale is the softball marketplace built for players and families. Find certified gear listings, verified sellers, and safe checkout in one place.',
  openGraph: {
    title: 'YardSale | Softball Marketplace | Blaze Sports Intel',
    description:
      'Buy and sell softball gear with verified seller profiles, smart filters, and buyer protection.',
  },
};

export default function YardSaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
