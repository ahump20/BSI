import type { Metadata } from 'next';
import TeamDetailClient from './TeamDetailClient';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

// Generate static params for static export
export async function generateStaticParams() {
  // Return common team IDs for static generation
  // Additional teams will be handled client-side via the teams API
  const teams = [
    // SEC
    'texas', 'texas-am', 'lsu', 'florida', 'tennessee', 'arkansas',
    'vanderbilt', 'ole-miss', 'georgia', 'auburn', 'alabama',
    'mississippi-state', 'south-carolina', 'kentucky', 'missouri', 'oklahoma',
    // ACC
    'wake-forest', 'virginia', 'clemson', 'north-carolina', 'nc-state',
    'duke', 'louisville', 'miami', 'florida-state', 'stanford', 'california',
    // Big 12
    'tcu', 'texas-tech', 'oklahoma-state', 'baylor', 'west-virginia',
    'kansas-state', 'arizona', 'arizona-state', 'kansas', 'byu', 'ucf',
    'houston', 'cincinnati', 'utah',
    // Big Ten
    'ucla', 'usc', 'indiana', 'maryland', 'michigan', 'ohio-state',
    'penn-state', 'rutgers', 'nebraska', 'minnesota', 'iowa', 'illinois',
    'northwestern', 'purdue', 'michigan-state',
    // Pac-12
    'oregon-state',
    // Other ranked
    'oregon', 'washington',
  ];

  return teams.map((teamId) => ({ teamId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  const team = teamMetadata[teamId];

  if (!team) {
    return {
      title: 'Team Detail | College Baseball | Blaze Sports Intel',
      description: 'College baseball team profile, roster, schedule, and analytics on Blaze Sports Intel.',
    };
  }

  const title = `${team.name} Baseball | ${team.conference} | Blaze Sports Intel`;
  const description = `${team.name} college baseball profile — ${team.conference} standings, roster, schedule, and analytics at ${team.location.stadium} in ${team.location.city}, ${team.location.state}.`;
  const logoUrl = getLogoUrl(team.espnId);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: logoUrl, width: 500, height: 500, alt: `${team.name} logo` }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [logoUrl],
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SportsTeam',
        name: team.name,
        sport: 'Baseball',
        memberOf: {
          '@type': 'SportsOrganization',
          name: team.conference,
        },
        location: {
          '@type': 'Place',
          name: team.location.stadium,
          address: {
            '@type': 'PostalAddress',
            addressLocality: team.location.city,
            addressRegion: team.location.state,
          },
        },
        logo: logoUrl,
      }),
    },
  };
}

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { teamId } = await params;
  return <TeamDetailClient teamId={teamId} />;
}
