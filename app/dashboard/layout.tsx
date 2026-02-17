import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Dashboard | Blaze Sports Intel',
  description: 'Real-time MLB, NFL, NBA, and NCAA analytics with live scores, standings, and source-attributed updates.',
  alternates: { canonical: '/dashboard' },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
