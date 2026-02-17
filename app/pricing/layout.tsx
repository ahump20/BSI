import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Pricing | Blaze Sports Intel',
  description:
    'Choose Free, Pro ($29/mo), or Enterprise ($199/mo) for real-time sports analytics, API access, and custom dashboards.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
