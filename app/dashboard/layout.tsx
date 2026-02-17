import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Dashboard | BSI',
  description: 'Real-time sports analytics dashboard with live scores and standings.',
  openGraph: { title: 'Dashboard | BSI', description: 'Real-time sports analytics dashboard with live scores and standings.' },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div data-sport="dashboard">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://blazesportsintel.com/' },
          { '@type': 'ListItem', position: 2, name: 'Dashboard' },
        ],
      }} />
      {children}
    </div>
  );
}
