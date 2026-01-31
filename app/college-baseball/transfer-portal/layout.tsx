import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Baseball Transfer Portal Tracker | Blaze Sports Intel',
  description:
    'Real-time tracking of every D1 college baseball player in the transfer portal. Stats, commitments, and source-verified updates.',
  openGraph: {
    title: 'College Baseball Transfer Portal | BSI',
    description: 'Every D1 baseball transfer portal entry, updated continuously.',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
