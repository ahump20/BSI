import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Blaze Sports Intel',
  description: 'Simple, transparent pricing. Pro at $29/month or Enterprise at $199/month. Start with a 14-day free trial.',
  openGraph: {
    title: 'Pricing | Blaze Sports Intel',
    description: 'Simple, transparent pricing for sports intelligence.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
