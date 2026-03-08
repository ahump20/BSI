import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

const BASE = 'https://blazesportsintel.com';

interface EditorialSeoConfig {
  /** Page title (will be suffixed with " | Blaze Sports Intel") */
  title: string;
  /** Meta description — ideally 150-160 chars, keywords front-loaded */
  description: string;
  /** Publication date in YYYY-MM-DD format */
  datePublished: string;
  /** URL path relative to root (e.g. "/college-baseball/editorial/texas-2026") */
  slug: string;
  /** OG image path relative to root (e.g. "/images/og/cbb-texas-2026.png") */
  image?: string;
  /** Sport name for Article.about (e.g. "College Baseball") */
  sport?: string;
  /** Optional shorter OG title */
  ogTitle?: string;
  /** Optional shorter OG description */
  ogDescription?: string;
}

/**
 * Generates a complete Next.js Metadata export for an editorial page.
 * Ensures canonical URL, OG tags, Twitter Card, and consistent formatting.
 */
export function editorialMetadata(config: EditorialSeoConfig): Metadata {
  const fullTitle = config.title.includes('Blaze Sports Intel')
    ? config.title
    : `${config.title} | Blaze Sports Intel`;

  return {
    title: fullTitle,
    description: config.description,
    openGraph: {
      title: config.ogTitle || config.title,
      description: config.ogDescription || config.description,
      type: 'article',
      url: `${BASE}${config.slug}`,
      siteName: 'Blaze Sports Intel',
      ...(config.image && { images: ogImage(config.image) }),
    },
    twitter: {
      card: 'summary_large_image',
      title: config.ogTitle || config.title,
      description: config.ogDescription || config.description,
      ...(config.image && { images: [config.image] }),
    },
    alternates: {
      canonical: config.slug,
    },
  };
}

/**
 * Returns props for the ArticleJsonLd component given an editorial config.
 */
export function editorialJsonLdProps(config: EditorialSeoConfig) {
  return {
    headline: config.title.replace(/ \| Blaze Sports Intel$/, ''),
    description: config.description,
    datePublished: config.datePublished,
    url: config.slug,
    ...(config.image && { image: config.image }),
    ...(config.sport && { sport: config.sport }),
  };
}
