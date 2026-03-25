import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editorial Feed | Blaze Sports Intel',
  description:
    'Original editorial coverage across college baseball, MLB, NFL, NBA, and college football — analysis the mainstream misses.',
  openGraph: {
    title: 'Editorial Feed | Blaze Sports Intel',
    description: 'Original editorial coverage across five sports.',
    type: 'website',
    url: 'https://blazesportsintel.com/blog-post-feed',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Editorial Feed | Blaze Sports Intel',
    description: 'Original editorial coverage across five sports.',
  },
};

export default function BlogPostFeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
