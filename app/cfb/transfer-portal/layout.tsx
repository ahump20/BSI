import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Football Transfer Portal Tracker | Blaze Sports Intel',
  description:
    'Real-time tracking of every FBS college football player in the transfer portal. Star ratings, commitment intel, and live updates.',
  openGraph: {
    title: 'College Football Transfer Portal | BSI',
    description: 'Every FBS football transfer portal entry with recruiting ratings.',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
