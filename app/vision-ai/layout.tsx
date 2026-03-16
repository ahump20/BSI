import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vision AI & Tracking Technology | BSI',
  description:
    'How sports use tracking technology — TrackMan, Hawk-Eye, Statcast, Next Gen Stats, and computer vision across MLB, NFL, NBA, and college athletics.',
  openGraph: {
    title: 'Vision AI & Tracking Technology | BSI',
    description: 'The tracking technology landscape across professional and college sports.',
  },
};

export default function VisionAILayout({ children }: { children: React.ReactNode }) {
  return children;
}
