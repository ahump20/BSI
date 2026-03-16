import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Podcast | BSI',
  description:
    'The Blaze Sports Intel podcast — college baseball analysis, MLB coverage, and sports analytics discussions.',
  openGraph: {
    title: 'Podcast | BSI',
    description: 'Sports analytics podcast from Blaze Sports Intel.',
  },
};

export default function PodcastLayout({ children }: { children: React.ReactNode }) {
  return children;
}
