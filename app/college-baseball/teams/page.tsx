import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { getTeamBySlug } from '@/lib/college-baseball/team-registry';

export const metadata: Metadata = {
  title: 'College Baseball Teams | Blaze Sports Intel',
  description:
    'Browse all D1 college baseball teams by conference. Complete team profiles, rosters, and analytics.',
  openGraph: {
    title: 'College Baseball Teams | Blaze Sports Intel',
    description: 'Browse all D1 college baseball teams by conference.',
  },
};

const conferences = [
  {
    name: 'SEC',
    fullName: 'Southeastern Conference',
    teams: [
      { name: 'Texas A&M', slug: 'texas-am' },
      { name: 'LSU', slug: 'lsu' },
      { name: 'Florida', slug: 'florida' },
      { name: 'Tennessee', slug: 'tennessee' },
      { name: 'Vanderbilt', slug: 'vanderbilt' },
      { name: 'Arkansas', slug: 'arkansas' },
      { name: 'Ole Miss', slug: 'ole-miss' },
      { name: 'Mississippi State', slug: 'mississippi-state' },
      { name: 'Georgia', slug: 'georgia' },
      { name: 'South Carolina', slug: 'south-carolina' },
      { name: 'Missouri', slug: 'missouri' },
      { name: 'Kentucky', slug: 'kentucky' },
      { name: 'Auburn', slug: 'auburn' },
      { name: 'Alabama', slug: 'alabama' },
      { name: 'Texas', slug: 'texas' },
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
      { name: 'Virginia Tech', slug: 'virginia-tech' },
      { name: 'Georgia Tech', slug: 'georgia-tech' },
      { name: 'Notre Dame', slug: 'notre-dame' },
      { name: 'Pittsburgh', slug: 'pittsburgh' },
      { name: 'Boston College', slug: 'boston-college' },
    ],
  },
  {
    name: 'Big 12',
    fullName: 'Big 12 Conference',
    teams: [
      { name: 'TCU', slug: 'tcu' },
      { name: 'Texas Tech', slug: 'texas-tech' },
      { name: 'Oklahoma State', slug: 'oklahoma-state' },
      { name: 'Kansas State', slug: 'kansas-state' },
      { name: 'West Virginia', slug: 'west-virginia' },
      { name: 'Baylor', slug: 'baylor' },
      { name: 'Kansas', slug: 'kansas' },
      { name: 'BYU', slug: 'byu' },
      { name: 'UCF', slug: 'ucf' },
      { name: 'Houston', slug: 'houston' },
      { name: 'Cincinnati', slug: 'cincinnati' },
      { name: 'Arizona', slug: 'arizona' },
      { name: 'Arizona State', slug: 'arizona-state' },
      { name: 'Colorado', slug: 'colorado' },
      { name: 'Utah', slug: 'utah' },
    ],
  },
  {
    name: 'Pac-12',
    fullName: 'Pac-12 Conference',
    teams: [
      { name: 'Oregon State', slug: 'oregon-state' },
      { name: 'Stanford', slug: 'stanford' },
      { name: 'UCLA', slug: 'ucla' },
      { name: 'USC', slug: 'usc' },
      { name: 'Cal', slug: 'california' },
      { name: 'Washington', slug: 'washington' },
      { name: 'Oregon', slug: 'oregon' },
      { name: 'Washington State', slug: 'washington-state' },
    ],
  },
  {
    name: 'Big Ten',
    fullName: 'Big Ten Conference',
    teams: [
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
    ],
  },
];

export default function TeamsPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            <ScrollReveal direction="up">
              <div className="text-center mb-12">
                <Badge variant="primary" className="mb-4">
                  66 Power 5 Programs
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
                  College Baseball <span className="text-gradient-blaze">Teams</span>
                </h1>
                <p className="text-text-secondary max-w-2xl mx-auto">
                  Browse teams by conference. Each team page includes roster, schedule, stats, and
                  analytics.
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
                      {conference.teams.map((team) => {
                        const teamData = getTeamBySlug(team.slug);
                        return (
                          <Link
                            key={team.slug}
                            href={'/college-baseball/teams/' + team.slug}
                            className="block group"
                          >
                            <Card
                              padding="md"
                              variant="hover"
                              className="text-center transition-all"
                              style={{
                                borderColor: teamData
                                  ? undefined
                                  : undefined,
                              }}
                            >
                              {teamData && (
                                <div
                                  className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity"
                                  style={{
                                    background: `${teamData.colors.primary}20`,
                                    border: `2px solid ${teamData.colors.primary}40`,
                                  }}
                                >
                                  <span
                                    className="text-[10px] font-bold font-display"
                                    style={{ color: teamData.colors.primary }}
                                  >
                                    {teamData.abbreviation.slice(0, 3)}
                                  </span>
                                </div>
                              )}
                              <span className="text-white font-medium text-sm">{team.name}</span>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal direction="up" delay={300}>
              <div className="mt-16 text-center">
                <p className="text-text-tertiary text-sm mb-4">
                  Every Power 5 program, rendered in team colors. Click any team for its scouting report.
                </p>
                <Link
                  href="/college-baseball"
                  className="text-burnt-orange hover:text-ember transition-colors"
                >
                  Back to College Baseball
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
