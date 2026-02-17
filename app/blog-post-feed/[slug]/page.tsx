import BlogPostClient from './BlogPostClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [
    { slug: 'texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026' },
    { slug: 'cardinals-strategic-intelligence-2025' },
    { slug: 'texas-longhorns-sec-revenue-transformation' },
    { slug: 'championship-leadership-nick-saban' },
    { slug: 'augie-garrido-legacy-of-leadership' },
    { slug: 'nil-revolution-college-athletics' },
  ];
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogPostClient slug={params.slug} />;
}
