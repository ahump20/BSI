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
    // SEC (16)
    'texas', 'texas-am', 'lsu', 'florida', 'tennessee', 'arkansas',
    'vanderbilt', 'ole-miss', 'georgia', 'auburn', 'alabama',
    'mississippi-state', 'south-carolina', 'kentucky', 'missouri', 'oklahoma',
    // ACC (18)
    'wake-forest', 'virginia', 'clemson', 'north-carolina', 'nc-state',
    'duke', 'louisville', 'miami', 'florida-state', 'stanford', 'california',
    'virginia-tech', 'georgia-tech', 'notre-dame', 'pittsburgh',
    'boston-college', 'syracuse', 'smu',
    // Big 12 (16)
    'tcu', 'texas-tech', 'oklahoma-state', 'baylor', 'west-virginia',
    'kansas-state', 'arizona', 'arizona-state', 'kansas', 'byu', 'ucf',
    'houston', 'cincinnati', 'colorado', 'utah', 'iowa-state',
    // Big Ten (18)
    'ucla', 'usc', 'indiana', 'maryland', 'michigan', 'ohio-state',
    'penn-state', 'rutgers', 'nebraska', 'minnesota', 'iowa', 'illinois',
    'northwestern', 'purdue', 'michigan-state', 'wisconsin',
    'oregon', 'washington',
    // Pac-12 (4)
    'oregon-state', 'washington-state', 'san-diego-state', 'fresno-state',
    // ─── D1 MCWS Contenders ───
    // A-10
    'vcu',
    // AAC
    'east-carolina', 'fau', 'rice', 'tulane', 'wichita-state',
    // ASUN
    'jacksonville', 'jax-state', 'kennesaw-state', 'stetson',
    // America East
    'maine',
    // Big East
    'creighton', 'uconn', 'xavier',
    // Big South
    'winthrop',
    // Big West
    'cal-state-fullerton', 'long-beach-state', 'uc-santa-barbara',
    // CAA
    'campbell', 'northeastern', 'stony-brook',
    // CUSA
    'liberty', 'louisiana-tech', 'sam-houston',
    // Horizon
    'wright-state',
    // Missouri Valley
    'evansville', 'indiana-state',
    // Mountain West
    'air-force', 'new-mexico',
    // Patriot League
    'army', 'navy',
    // Southern
    'mercer',
    // Southland
    'mcneese', 'se-louisiana',
    // Summit
    'oral-roberts',
    // Sun Belt
    'coastal-carolina', 'louisiana', 'old-dominion', 'south-alabama', 'southern-miss', 'troy',
    // WAC
    'grand-canyon', 'sfa', 'dallas-baptist',
    // WCC
    'gonzaga', 'pepperdine', 'san-diego', 'santa-clara',
    // ─── Conference Expansion (full rosters) ───
    // AAC (expansion)
    'charlotte', 'memphis', 'south-florida', 'uab', 'utsa',
    // ASUN (expansion)
    'austin-peay', 'bellarmine', 'eastern-kentucky', 'lipscomb',
    'north-alabama', 'north-florida', 'queens', 'west-georgia',
    // Big East (expansion)
    'butler', 'georgetown', 'seton-hall', 'st-johns', 'villanova',
    // Big West (expansion)
    'cal-poly', 'cal-state-bakersfield', 'cal-state-northridge', 'hawaii',
    'uc-davis', 'uc-irvine', 'uc-riverside', 'uc-san-diego',
    // CAA (expansion)
    'charleston', 'elon', 'hofstra', 'monmouth', 'nc-at',
    'towson', 'unc-wilmington', 'william-mary',
    // C-USA (expansion)
    'delaware', 'fiu', 'middle-tennessee', 'missouri-state',
    'new-mexico-state', 'western-kentucky',
    // Sun Belt (expansion)
    'app-state', 'arkansas-state', 'georgia-southern', 'georgia-state',
    'james-madison', 'marshall', 'texas-state', 'ul-monroe',
    // ─── Full D1 Conference Expansion ───
    // A-10
    'davidson', 'dayton', 'fordham', 'george-mason', 'george-washington',
    'la-salle', 'rhode-island', 'richmond', 'saint-josephs', 'saint-louis',
    'st-bonaventure',
    // America East
    'binghamton', 'bryant', 'njit', 'ualbany', 'umass-lowell', 'umbc',
    // Big South
    'charleston-southern', 'gardner-webb', 'high-point', 'longwood',
    'presbyterian', 'radford', 'unc-asheville', 'usc-upstate',
    // Horizon
    'milwaukee', 'northern-kentucky', 'oakland', 'youngstown-state',
    // Missouri Valley
    'belmont', 'bradley', 'illinois-state', 'murray-state',
    'southern-illinois', 'uic', 'valparaiso',
    // Mountain West (expansion)
    'nevada', 'san-jose-state', 'unlv',
    // Patriot League
    'bucknell', 'holy-cross', 'lafayette', 'lehigh',
    // Southern
    'citadel', 'etsu', 'samford', 'unc-greensboro',
    'vmi', 'western-carolina', 'wofford',
    // Southland (expansion)
    'houston-christian', 'incarnate-word', 'lamar', 'new-orleans',
    'nicholls', 'northwestern-state', 'tamu-corpus-christi', 'utrgv',
    // Summit
    'north-dakota-state', 'northern-colorado', 'omaha',
    'south-dakota-state', 'st-thomas',
    // WAC (expansion)
    'abilene-christian', 'cal-baptist', 'sacramento-state',
    'tarleton-state', 'ut-arlington', 'utah-tech', 'utah-valley',
    // WCC (expansion)
    'loyola-marymount', 'pacific', 'portland', 'saint-marys',
    'san-francisco', 'seattle-u',
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
