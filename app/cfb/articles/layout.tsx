import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Articles | College Football | BSI',
  description:
    'College football analysis, previews, and long-form coverage from Blaze Sports Intel.',
};

export default function CFBArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
