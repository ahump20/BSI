import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CFBArticleClient from './CFBArticleClient';

interface PageProps {
  params: { slug: string };
}

interface ArticleMetadata {
  seoTitle?: string;
  metaDescription?: string;
  homeTeam?: string;
  awayTeam?: string;
  gameDate?: string;
  venue?: string;
}

interface ArticleData {
  slug: string;
  title: string;
  excerpt: string | null;
  bodyHtml: string;
  contentType: string;
  publishedAt: string | null;
  updatedAt: string | null;
  gameId: string | null;
  metadata: ArticleMetadata;
}

async function getArticle(slug: string): Promise<ArticleData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://blazesportsintel.com';
    const response = await fetch(`${baseUrl}/api/cfb/articles/${slug}`, {
      next: { revalidate: 600 }, // 10 minutes
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.article || null;
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);

  if (!article) {
    return {
      title: 'Article Not Found | Blaze Sports Intel',
      description: 'The requested article could not be found.',
    };
  }

  const title = article.metadata.seoTitle || article.title;
  const description =
    article.metadata.metaDescription ||
    article.excerpt ||
    `${article.contentType === 'preview' ? 'Game preview' : 'Game recap'} from Blaze Sports Intel.`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://blazesportsintel.com';
  const canonicalUrl = `${baseUrl}/cfb/articles/${article.slug}`;

  return {
    title: `${title} | Blaze Sports Intel`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'Blaze Sports Intel',
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || undefined,
      authors: ['Blaze Sports Intel'],
      section: 'College Football',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      'article:published_time': article.publishedAt || '',
      'article:modified_time': article.updatedAt || article.publishedAt || '',
      'article:section': 'College Football',
    },
  };
}

export default async function CFBArticlePage({ params }: PageProps) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  // Generate JSON-LD structured data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://blazesportsintel.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.metadata.seoTitle || article.title,
    description:
      article.metadata.metaDescription ||
      article.excerpt ||
      `${article.contentType === 'preview' ? 'Game preview' : 'Game recap'} from Blaze Sports Intel.`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Blaze Sports Intel',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Blaze Sports Intel',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icons/blaze-logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/cfb/articles/${article.slug}`,
    },
    articleSection: 'College Football',
    keywords: [
      'college football',
      'CFB',
      article.contentType === 'preview' ? 'game preview' : 'game recap',
      article.metadata.homeTeam,
      article.metadata.awayTeam,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CFBArticleClient article={article} />
    </>
  );
}
