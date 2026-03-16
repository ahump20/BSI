interface SportHubJsonLdProps {
  sport: string;
  url: string;
  description: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

/**
 * WebPage + BreadcrumbList JSON-LD for sport hub pages.
 * Improves search result appearance with structured navigation.
 */
export function SportHubJsonLd({ sport, url, description, breadcrumbs }: SportHubJsonLdProps) {
  const fullUrl = `https://blazesportsintel.com${url}`;

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      name: `${sport} | Blaze Sports Intel`,
      url: fullUrl,
      description,
      isPartOf: { '@type': 'WebSite', name: 'Blaze Sports Intel', url: 'https://blazesportsintel.com' },
      publisher: {
        '@type': 'Organization',
        name: 'Blaze Sports Intel',
        url: 'https://blazesportsintel.com',
        logo: 'https://blazesportsintel.com/images/brand/bsi-mascot-shield.png',
      },
    },
  ];

  if (breadcrumbs && breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.name,
        item: `https://blazesportsintel.com${crumb.url}`,
      })),
    });
  }

  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />;
}
