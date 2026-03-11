/**
 * JSON-LD Structured Data Generators
 *
 * Reusable functions that produce schema.org JSON-LD objects for SEO.
 * Import into page metadata to enable rich results in Google Search.
 *
 * Usage in a Next.js page:
 *   import { sportHubJsonLd } from '@/lib/seo/structured-data';
 *   export const metadata = { other: { 'script:ld+json': JSON.stringify(sportHubJsonLd({ ... })) } };
 */

const BASE_URL = 'https://blazesportsintel.com';

// ─────────────────────────────────────────────────────────
// SportsOrganization — sport hub pages
// ─────────────────────────────────────────────────────────

interface SportHubParams {
  sport: string;
  name: string;
  path: string;
  description: string;
}

export function sportHubJsonLd({ sport, name, path, description }: SportHubParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: `${BASE_URL}${path}`,
    about: {
      '@type': 'Thing',
      name: sport,
    },
    publisher: publisherJsonLd(),
  };
}

// ─────────────────────────────────────────────────────────
// SportsEvent — game detail pages
// ─────────────────────────────────────────────────────────

interface SportsEventParams {
  sport: string;
  gameId: string;
  name?: string;
  description?: string;
  path: string;
  startDate?: string;
  location?: string;
  homeTeam?: string;
  awayTeam?: string;
}

export function sportsEventJsonLd({
  sport,
  gameId,
  name,
  description,
  path,
  startDate,
  location,
  homeTeam,
  awayTeam,
}: SportsEventParams) {
  const event: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: name || `${sport} Game`,
    description: description || `${sport} game detail — box score, play-by-play, team stats, and recap on Blaze Sports Intel.`,
    url: `${BASE_URL}${path}`,
    sport,
  };

  if (startDate) event.startDate = startDate;
  if (location) {
    event.location = {
      '@type': 'Place',
      name: location,
    };
  }
  if (homeTeam) {
    event.homeTeam = { '@type': 'SportsTeam', name: homeTeam };
  }
  if (awayTeam) {
    event.awayTeam = { '@type': 'SportsTeam', name: awayTeam };
  }

  return event;
}

// ─────────────────────────────────────────────────────────
// SportsTeam — team pages
// ─────────────────────────────────────────────────────────

interface SportsTeamParams {
  name: string;
  sport: string;
  conference?: string;
  path: string;
  logoUrl?: string;
}

export function sportsTeamJsonLd({ name, sport, conference, path, logoUrl }: SportsTeamParams) {
  const team: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name,
    sport,
    url: `${BASE_URL}${path}`,
  };

  if (conference) {
    team.memberOf = {
      '@type': 'SportsOrganization',
      name: conference,
    };
  }

  if (logoUrl) {
    team.logo = logoUrl;
  }

  return team;
}

// ─────────────────────────────────────────────────────────
// Article — editorial pages
// ─────────────────────────────────────────────────────────

interface ArticleParams {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}

export function articleJsonLd({
  headline,
  description,
  path,
  datePublished,
  dateModified,
  author,
  image,
}: ArticleParams) {
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url: `${BASE_URL}${path}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author || 'Austin Humphrey',
    },
    publisher: publisherJsonLd(),
  };

  if (image) {
    article.image = image;
  }

  return article;
}

// ─────────────────────────────────────────────────────────
// Publisher — BSI organization (shared)
// ─────────────────────────────────────────────────────────

export function publisherJsonLd() {
  return {
    '@type': 'Organization',
    name: 'Blaze Sports Intel',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/images/brand/bsi-icon.png`,
    },
  };
}

// ─────────────────────────────────────────────────────────
// Website — homepage
// ─────────────────────────────────────────────────────────

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Blaze Sports Intel',
    alternateName: 'BSI',
    url: BASE_URL,
    description:
      'Live scores, editorial, and advanced analytics across college baseball, MLB, NFL, NBA, and college football — with park-adjusted sabermetrics at the core.',
    publisher: publisherJsonLd(),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
