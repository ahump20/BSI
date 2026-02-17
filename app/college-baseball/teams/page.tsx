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
  hasPage: boolean;
}

const conferences: { name: string; fullName: string; teams: TeamEntry[] }[] = [
  {
    name: 'SEC',
    fullName: 'Southeastern Conference',
    teams: [
      { name: 'Texas', slug: 'texas', hasPage: true },
      { name: 'Texas A&M', slug: 'texas-am', hasPage: true },
      { name: 'LSU', slug: 'lsu', hasPage: true },
      { name: 'Florida', slug: 'florida', hasPage: true },
      { name: 'Tennessee', slug: 'tennessee', hasPage: true },
      { name: 'Arkansas', slug: 'arkansas', hasPage: true },
      { name: 'Vanderbilt', slug: 'vanderbilt', hasPage: true },
      { name: 'Ole Miss', slug: 'ole-miss', hasPage: true },
      { name: 'Georgia', slug: 'georgia', hasPage: true },
      { name: 'Auburn', slug: 'auburn', hasPage: true },
      { name: 'Alabama', slug: 'alabama', hasPage: true },
      { name: 'Mississippi State', slug: 'mississippi-state', hasPage: true },
      { name: 'South Carolina', slug: 'south-carolina', hasPage: true },
      { name: 'Kentucky', slug: 'kentucky', hasPage: true },
      { name: 'Missouri', slug: 'missouri', hasPage: true },
      { name: 'Oklahoma', slug: 'oklahoma', hasPage: true },
    ],
  },
  {
    name: 'ACC',
    fullName: 'Atlantic Coast Conference',
    teams: [
      { name: 'Wake Forest', slug: 'wake-forest', hasPage: true },
      { name: 'Virginia', slug: 'virginia', hasPage: true },
      { name: 'Clemson', slug: 'clemson', hasPage: true },
      { name: 'North Carolina', slug: 'north-carolina', hasPage: true },
      { name: 'NC State', slug: 'nc-state', hasPage: true },
      { name: 'Duke', slug: 'duke', hasPage: true },
      { name: 'Louisville', slug: 'louisville', hasPage: true },
      { name: 'Miami', slug: 'miami', hasPage: true },
      { name: 'Florida State', slug: 'florida-state', hasPage: true },
      { name: 'Stanford', slug: 'stanford', hasPage: true },
      { name: 'Cal', slug: 'california', hasPage: true },
      { name: 'Virginia Tech', slug: 'virginia-tech', hasPage: false },
      { name: 'Georgia Tech', slug: 'georgia-tech', hasPage: false },
      { name: 'Notre Dame', slug: 'notre-dame', hasPage: false },
      { name: 'Pittsburgh', slug: 'pittsburgh', hasPage: false },
      { name: 'Boston College', slug: 'boston-college', hasPage: false },
    ],
  },
  {
    name: 'Big 12',
    fullName: 'Big 12 Conference',
    teams: [
      { name: 'TCU', slug: 'tcu', hasPage: true },
      { name: 'Texas Tech', slug: 'texas-tech', hasPage: true },
      { name: 'Oklahoma State', slug: 'oklahoma-state', hasPage: true },
      { name: 'Baylor', slug: 'baylor', hasPage: true },
      { name: 'West Virginia', slug: 'west-virginia', hasPage: true },
      { name: 'Kansas State', slug: 'kansas-state', hasPage: true },
      { name: 'Arizona', slug: 'arizona', hasPage: true },
      { name: 'Arizona State', slug: 'arizona-state', hasPage: true },
      { name: 'Kansas', slug: 'kansas', hasPage: true },
      { name: 'BYU', slug: 'byu', hasPage: true },
      { name: 'UCF', slug: 'ucf', hasPage: true },
      { name: 'Houston', slug: 'houston', hasPage: true },
      { name: 'Cincinnati', slug: 'cincinnati', hasPage: true },
      { name: 'Colorado', slug: 'colorado', hasPage: false },
      { name: 'Utah', slug: 'utah', hasPage: true },
    ],
  },
  {
    name: 'Big Ten',
    fullName: 'Big Ten Conference',
    teams: [
      { name: 'UCLA', slug: 'ucla', hasPage: true },
      { name: 'USC', slug: 'usc', hasPage: true },
      { name: 'Indiana', slug: 'indiana', hasPage: true },
      { name: 'Maryland', slug: 'maryland', hasPage: true },
      { name: 'Michigan', slug: 'michigan', hasPage: true },
      { name: 'Ohio State', slug: 'ohio-state', hasPage: true },
      { name: 'Penn State', slug: 'penn-state', hasPage: true },
      { name: 'Rutgers', slug: 'rutgers', hasPage: true },
      { name: 'Nebraska', slug: 'nebraska', hasPage: true },
      { name: 'Minnesota', slug: 'minnesota', hasPage: true },
      { name: 'Iowa', slug: 'iowa', hasPage: true },
      { name: 'Illinois', slug: 'illinois', hasPage: true },
      { name: 'Northwestern', slug: 'northwestern', hasPage: true },
      { name: 'Purdue', slug: 'purdue', hasPage: true },
      { name: 'Michigan State', slug: 'michigan-state', hasPage: true },
    ],
  },
  {
    name: 'Pac-12',
    fullName: 'Pac-12 Conference',
    teams: [
      { name: 'Oregon State', slug: 'oregon-state', hasPage: true },
      { name: 'Washington State', slug: 'washington-state', hasPage: false },
    ],
  },
];

function TeamCard({ team }: { team: TeamEntry }) {
  const meta = teamMetadata[team.slug];
  const preseason = preseason2026[team.slug];
  const logoUrl = meta ? getLogoUrl(meta.espnId) : null;

  const content = (
    <Card
      padding="md"
      variant={team.hasPage ? 'hover' : 'default'}
      className={`text-center transition-all ${team.hasPage ? 'hover:border-burnt-orange' : 'opacity-40'}`}
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
  );

  if (!team.hasPage) return <div className="block">{content}</div>;

  return (
    <Link href={`/college-baseball/teams/${team.slug}`} className="block">
      {content}
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
                  Grayed-out teams are coming soon. Full coverage expanding through the 2026 season.
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
