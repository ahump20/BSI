import { CFBArticleClient } from './CFBArticleClient';

// For static export: only pre-render params from generateStaticParams
export const dynamicParams = false;

export function generateStaticParams() {
  // Pre-generate sample article pages for static export
  return [
    { slug: 'texas-longhorns-preview' },
    { slug: 'sec-championship-preview' },
    { slug: 'college-football-playoff-preview' },
  ];
}

export default function CFBArticlePage() {
  return <CFBArticleClient />;
}
