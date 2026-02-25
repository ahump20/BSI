import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { preseason2026 } from '@/lib/data/preseason-2026';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

export const metadata: Metadata = {
  title: 'College Baseball Teams | Blaze Sports Intel',
  description:
    'Browse all D1 college baseball teams by conference. Complete team profiles, rosters, and analytics.',
  openGraph: {
    title: 'College Baseball Teams | Blaze Sports Intel',
    description: 'Browse all D1 college baseball teams by conference.',
  },
};

interface TeamEntry {
  name: string;
  slug: string;
}

const conferences: { name: string; fullName: string; teams: TeamEntry[] }[] = [
  {
    name: 'SEC',
    fullName: 'Southeastern Conference',
    teams: [
      { name: 'Texas', slug: 'texas' },
      { name: 'Texas A&M', slug: 'texas-am' },
      { name: 'LSU', slug: 'lsu' },
      { name: 'Florida', slug: 'florida' },
      { name: 'Tennessee', slug: 'tennessee' },
      { name: 'Arkansas', slug: 'arkansas' },
      { name: 'Vanderbilt', slug: 'vanderbilt' },
      { name: 'Ole Miss', slug: 'ole-miss' },
      { name: 'Georgia', slug: 'georgia' },
      { name: 'Auburn', slug: 'auburn' },
      { name: 'Alabama', slug: 'alabama' },
      { name: 'Mississippi State', slug: 'mississippi-state' },
      { name: 'South Carolina', slug: 'south-carolina' },
      { name: 'Kentucky', slug: 'kentucky' },
      { name: 'Missouri', slug: 'missouri' },
      { name: 'Oklahoma', slug: 'oklahoma' },
    ],
  },
  {
    name: 'ACC',
    fullName: 'Atlantic Coast Conference',
    teams: [
      { name: 'Wake Forest', slug: 'wake-forest' },
      { name: 'Virginia', slug: 'virginia' },
      { name: 'Clemson', slug: 'clemson' },
      { name: 'North Carolina', slug: 'north-carolina' },
      { name: 'NC State', slug: 'nc-state' },
      { name: 'Duke', slug: 'duke' },
      { name: 'Louisville', slug: 'louisville' },
      { name: 'Miami', slug: 'miami' },
      { name: 'Florida State', slug: 'florida-state' },
      { name: 'Stanford', slug: 'stanford' },
      { name: 'Cal', slug: 'california' },
      { name: 'Virginia Tech', slug: 'virginia-tech' },
      { name: 'Georgia Tech', slug: 'georgia-tech' },
      { name: 'Notre Dame', slug: 'notre-dame' },
      { name: 'Pittsburgh', slug: 'pittsburgh' },
      { name: 'Boston College', slug: 'boston-college' },
      { name: 'Syracuse', slug: 'syracuse' },
      { name: 'SMU', slug: 'smu' },
    ],
  },
  {
    name: 'Big 12',
    fullName: 'Big 12 Conference',
    teams: [
      { name: 'TCU', slug: 'tcu' },
      { name: 'Texas Tech', slug: 'texas-tech' },
      { name: 'Oklahoma State', slug: 'oklahoma-state' },
      { name: 'Baylor', slug: 'baylor' },
      { name: 'West Virginia', slug: 'west-virginia' },
      { name: 'Kansas State', slug: 'kansas-state' },
      { name: 'Arizona', slug: 'arizona' },
      { name: 'Arizona State', slug: 'arizona-state' },
      { name: 'Kansas', slug: 'kansas' },
      { name: 'BYU', slug: 'byu' },
      { name: 'UCF', slug: 'ucf' },
      { name: 'Houston', slug: 'houston' },
      { name: 'Cincinnati', slug: 'cincinnati' },
      { name: 'Colorado', slug: 'colorado' },
      { name: 'Utah', slug: 'utah' },
      { name: 'Iowa State', slug: 'iowa-state' },
    ],
  },
  {
    name: 'Big Ten',
    fullName: 'Big Ten Conference',
    teams: [
      { name: 'UCLA', slug: 'ucla' },
      { name: 'USC', slug: 'usc' },
      { name: 'Indiana', slug: 'indiana' },
      { name: 'Maryland', slug: 'maryland' },
      { name: 'Michigan', slug: 'michigan' },
      { name: 'Ohio State', slug: 'ohio-state' },
      { name: 'Penn State', slug: 'penn-state' },
      { name: 'Rutgers', slug: 'rutgers' },
      { name: 'Nebraska', slug: 'nebraska' },
      { name: 'Minnesota', slug: 'minnesota' },
      { name: 'Iowa', slug: 'iowa' },
      { name: 'Illinois', slug: 'illinois' },
      { name: 'Northwestern', slug: 'northwestern' },
      { name: 'Purdue', slug: 'purdue' },
      { name: 'Michigan State', slug: 'michigan-state' },
      { name: 'Wisconsin', slug: 'wisconsin' },
      { name: 'Oregon', slug: 'oregon' },
      { name: 'Washington', slug: 'washington' },
    ],
  },
  {
    name: 'Pac-12',
    fullName: 'Pac-12 Conference',
    teams: [
      { name: 'Oregon State', slug: 'oregon-state' },
      { name: 'Washington State', slug: 'washington-state' },
      { name: 'San Diego State', slug: 'san-diego-state' },
      { name: 'Fresno State', slug: 'fresno-state' },
    ],
  },
];

function TeamCard({ team }: { team: TeamEntry }) {
  const meta = teamMetadata[team.slug];
  const preseason = preseason2026[team.slug];
  const logoUrl = meta ? getLogoUrl(meta.espnId, meta.logoId) : null;

  return (
    <Link href={`/college-baseball/teams/${team.slug}`} className="block">
      <Card
        padding="md"
        variant="hover"
        className="text-center transition-all hover:border-burnt-orange"
      >
        <div className="flex flex-col items-center gap-2">
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className="w-8 h-8 object-contain"
              loading="lazy"
            />
          )}
          <span className="text-white font-medium text-sm">{team.name}</span>
          {preseason && (
            <Badge variant="primary" size="sm">#{preseason.rank}</Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default function TeamsPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            <ScrollReveal direction="up">
              <div className="text-center mb-12">
                <Badge variant="primary" className="mb-4">
                  2026 Preseason
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
                  College Baseball <span className="text-gradient-blaze">Teams</span>
                </h1>
                <p className="text-text-secondary max-w-2xl mx-auto">
                  Browse teams by conference. Ranked teams include preseason scouting intel,
                  key players, and editorial previews.
                </p>
              </div>
            </ScrollReveal>

            <div className="space-y-12">
              {conferences.map((conference, confIndex) => (
                <ScrollReveal key={conference.name} direction="up" delay={confIndex * 50}>
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="font-display text-2xl font-bold text-burnt-orange">
                        {conference.name}
                      </h2>
                      <span className="text-text-tertiary text-sm">{conference.fullName}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {conference.teams.map((team) => (
                        <TeamCard key={team.slug} team={team} />
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal direction="up" delay={300}>
              <div className="mt-16 text-center">
                <p className="text-text-tertiary text-sm">
                  All Power 5 and Pac-12 team profiles are live. Mid-major coverage expanding through the 2026 season.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
