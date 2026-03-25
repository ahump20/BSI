import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Comparison | College Baseball | Blaze Sports Intel',
  description:
    'Head-to-head comparison of D1 college baseball teams — advanced metrics, record, conference strength, and roster composition side by side.',
  openGraph: {
    title: 'Team Comparison | College Baseball | Blaze Sports Intel',
    description: 'Compare any two D1 college baseball programs head-to-head.',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
