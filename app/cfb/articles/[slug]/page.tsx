import type { Metadata } from 'next';
import { CFBArticleClient } from './CFBArticleClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${title} | CFB | Blaze Sports Intel`,
    description: `College football article: ${title}. AI-powered game previews and recaps from Blaze Sports Intel.`,
    openGraph: {
      title: `${title} | CFB | Blaze Sports Intel`,
      description: `College football article: ${title}. AI-powered game previews and recaps from Blaze Sports Intel.`,
      type: 'article',
    },
  };
}

export function generateStaticParams() {
  // Static export - return empty array for dynamic routes
  return [];
}

export default async function CFBArticlePage({ params }: PageProps) {
  const { slug } = await params;
  return <CFBArticleClient slug={slug} />;
}
