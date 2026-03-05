import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Texas Week 1 Recap: 27 Runs, Volantis Dominates | Blaze Sports Intel',
  description:
    'Texas swept UC Davis 27-7 to open the 2026 season. Dylan Volantis earned SEC Freshman Pitcher of the Week. Riojas, Harrison, and Robbins showed what the portal-loaded lineup can do. Full box scores and analysis.',
  openGraph: {
    title: 'Texas Week 1 Recap: Opening Weekend Sweep | Blaze Sports Intel',
    description:
      'The Longhorns scored 27 runs in three games. Volantis allowed one hit in his Sunday start. Michigan State comes to Austin next.',
    type: 'article',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
