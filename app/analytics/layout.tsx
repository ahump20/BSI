import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Analytics | Blaze Sports Intel',
  description:
    'The tools scouts and front offices use, open to every fan \u2014 win probability, Pythagorean expectations, player comparisons, and predictive models for MLB, NFL, and NCAA.',
  alternates: {
    canonical: '/analytics',
  },
  openGraph: {
    title: 'Analytics | Blaze Sports Intel',
    description: 'The tools scouts use, open to everyone \u2014 MLB, NFL, and NCAA analytics.',
    images: ogImage(),
  },
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
