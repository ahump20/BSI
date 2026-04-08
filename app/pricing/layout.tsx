import { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Pricing | Blaze Sports Intel',
  description:
    'Simple, transparent pricing. Free for live scores and editorial. Pro at $12/month for park-adjusted sabermetrics.',
  openGraph: {
    title: 'Pricing | Blaze Sports Intel',
    description: 'Simple, transparent pricing for sports intelligence.',
   images: ogImage() },
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
