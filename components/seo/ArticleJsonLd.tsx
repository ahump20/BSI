import { JsonLd } from '@/components/JsonLd';

interface ArticleJsonLdProps {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  image?: string;
  sport?: string;
}

const BASE = 'https://blazesportsintel.com';

/**
 * Renders Article JSON-LD structured data for editorial pages.
 * All props are developer-authored — no user input interpolated.
 */
export function ArticleJsonLd({
  headline,
  description,
  datePublished,
  dateModified,
  url,
  image,
  sport,
}: ArticleJsonLdProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    datePublished,
    ...(dateModified && { dateModified }),
    url: url.startsWith('http') ? url : `${BASE}${url}`,
    author: {
      '@type': 'Person',
      name: 'Austin Humphrey',
      url: 'https://austinhumphrey.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Blaze Sports Intel',
      url: BASE,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE}/images/bsi-logo.png`,
      },
    },
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image.startsWith('http') ? image : `${BASE}${image}`,
      },
    }),
    ...(sport && {
      about: {
        '@type': 'Thing',
        name: sport,
      },
    }),
  };

  return <JsonLd data={data} />;
}
