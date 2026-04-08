import type { Metadata } from 'next';
import TeamDetailClient from './TeamDetailClient';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * Derive static params from the canonical teamMetadata registry.
 * Adding a team there automatically generates its page at build time.
 */
export async function generateStaticParams() {
  return Object.keys(teamMetadata).map((teamId) => ({ teamId }));
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
  const logoUrl = getLogoUrl(team.espnId, team.logoId);

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
