import TeamReadoutClient from './TeamReadoutClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  // Reuse same team list as parent — every team with a detail page gets a readout
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
    // D1 MCWS Contenders
    'vcu', 'east-carolina', 'fau', 'rice', 'tulane', 'wichita-state',
    'jacksonville', 'jax-state', 'kennesaw-state', 'stetson', 'maine',
    'creighton', 'uconn', 'xavier', 'winthrop',
    'cal-state-fullerton', 'long-beach-state', 'uc-santa-barbara',
    'campbell', 'northeastern', 'stony-brook',
    'liberty', 'louisiana-tech', 'sam-houston',
    'wright-state', 'evansville', 'indiana-state',
    'air-force', 'new-mexico', 'army', 'navy', 'mercer',
    'mcneese', 'se-louisiana', 'oral-roberts',
    'coastal-carolina', 'louisiana', 'old-dominion', 'south-alabama', 'southern-miss', 'troy',
    'grand-canyon', 'sfa', 'dallas-baptist',
    'gonzaga', 'pepperdine', 'san-diego', 'santa-clara',
    // Conference expansion
    'charlotte', 'memphis', 'south-florida', 'uab', 'utsa',
    'austin-peay', 'bellarmine', 'eastern-kentucky', 'lipscomb',
    'north-alabama', 'north-florida', 'queens', 'west-georgia',
    'butler', 'georgetown', 'seton-hall', 'st-johns', 'villanova',
    'cal-poly', 'cal-state-bakersfield', 'cal-state-northridge', 'hawaii',
    'uc-davis', 'uc-irvine', 'uc-riverside', 'uc-san-diego',
    'charleston', 'elon', 'hofstra', 'monmouth', 'nc-at',
    'towson', 'unc-wilmington', 'william-mary',
    'delaware', 'fiu', 'middle-tennessee', 'missouri-state',
    'new-mexico-state', 'western-kentucky',
    'app-state', 'arkansas-state', 'georgia-southern', 'georgia-state',
    'james-madison', 'marshall', 'texas-state', 'ul-monroe',
    'davidson', 'dayton', 'fordham', 'george-mason', 'george-washington',
    'la-salle', 'rhode-island', 'richmond', 'saint-josephs', 'saint-louis',
    'st-bonaventure',
    'binghamton', 'bryant', 'njit', 'ualbany', 'umass-lowell', 'umbc',
    'charleston-southern', 'gardner-webb', 'high-point', 'longwood',
    'presbyterian', 'radford', 'unc-asheville', 'usc-upstate',
    'milwaukee', 'northern-kentucky', 'oakland', 'youngstown-state',
    'belmont', 'bradley', 'illinois-state', 'murray-state',
    'southern-illinois', 'uic', 'valparaiso',
    'nevada', 'san-jose-state', 'unlv',
    'bucknell', 'holy-cross', 'lafayette', 'lehigh',
    'citadel', 'etsu', 'samford', 'unc-greensboro',
    'vmi', 'western-carolina', 'wofford',
    'houston-christian', 'incarnate-word', 'lamar', 'new-orleans',
    'nicholls', 'northwestern-state', 'tamu-corpus-christi', 'utrgv',
    'north-dakota-state', 'northern-colorado', 'omaha',
    'south-dakota-state', 'st-thomas',
    'abilene-christian', 'cal-baptist', 'sacramento-state',
    'tarleton-state', 'ut-arlington', 'utah-tech', 'utah-valley',
    'loyola-marymount', 'pacific', 'portland', 'saint-marys',
    'san-francisco', 'seattle-u',
  ];

  return teams.map((teamId) => ({ teamId }));
}

export default async function TeamReadoutPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamReadoutClient teamId={teamId} />;
}
