import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NCAA Transfer Portal Tracker | Blaze Sports Intel',
  description:
    'Real-time tracking of every D1 college baseball and football transfer portal entry. Live updates, stats, and commitment intel.',
  openGraph: {
    title: 'NCAA Transfer Portal Tracker | BSI',
    description:
      'Real-time college baseball and football transfer portal intelligence. Updated continuously.',
    type: 'website',
  },
};

export default function TransferPortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
