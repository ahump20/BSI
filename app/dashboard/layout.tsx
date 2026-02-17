import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | BSI',
  description: 'Real-time sports analytics dashboard with live scores and standings.',
  openGraph: { title: 'Dashboard | BSI', description: 'Real-time sports analytics dashboard with live scores and standings.' },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div data-sport="dashboard">{children}</div>;
}
