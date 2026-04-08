import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visual Analytics | College Baseball Savant | BSI',
  description:
    'Interactive visualizations for college baseball analytics — plate discipline scatter, conference heatmaps, ERA vs FIP gaps, power vs contact charts, and more.',
  alternates: { canonical: '/college-baseball/savant/visuals' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
