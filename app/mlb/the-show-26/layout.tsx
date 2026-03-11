import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MLB The Show 26 | Blaze Sports Intel',
  description:
    'Blaze Sports Intel MLB The Show 26 companion surface for Diamond Dynasty market tracking, team building, card detail, and collection-aware roster planning.',
};

export default function MLBTheShow26Layout({ children }: { children: React.ReactNode }) {
  return children;
}
