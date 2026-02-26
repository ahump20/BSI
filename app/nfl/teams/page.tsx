'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  division: string;
  conference: string;
}

const nflTeams: Team[] = [
  // AFC East
  {
    id: 'buf',
    name: 'Bills',
    city: 'Buffalo',
    abbreviation: 'BUF',
    division: 'East',
    conference: 'AFC',
  },
  {
    id: 'mia',
    name: 'Dolphins',
    city: 'Miami',
    abbreviation: 'MIA',
    division: 'East',
    conference: 'AFC',
  },
  {
    id: 'ne',
    name: 'Patriots',
    city: 'New England',
    abbreviation: 'NE',
    division: 'East',
    conference: 'AFC',
  },
  {
    id: 'nyj',
    name: 'Jets',
    city: 'New York',
    abbreviation: 'NYJ',
    division: 'East',
    conference: 'AFC',
  },
  // AFC North
  {
    id: 'bal',
    name: 'Ravens',
    city: 'Baltimore',
    abbreviation: 'BAL',
    division: 'North',
    conference: 'AFC',
  },
  {
    id: 'cin',
    name: 'Bengals',
    city: 'Cincinnati',
    abbreviation: 'CIN',
    division: 'North',
    conference: 'AFC',
  },
  {
    id: 'cle',
    name: 'Browns',
    city: 'Cleveland',
    abbreviation: 'CLE',
    division: 'North',
    conference: 'AFC',
  },
  {
    id: 'pit',
    name: 'Steelers',
    city: 'Pittsburgh',
    abbreviation: 'PIT',
    division: 'North',
    conference: 'AFC',
  },
  // AFC South
  {
    id: 'hou',
    name: 'Texans',
    city: 'Houston',
    abbreviation: 'HOU',
    division: 'South',
    conference: 'AFC',
  },
  {
    id: 'ind',
    name: 'Colts',
    city: 'Indianapolis',
    abbreviation: 'IND',
    division: 'South',
    conference: 'AFC',
  },
  {
    id: 'jax',
    name: 'Jaguars',
    city: 'Jacksonville',
    abbreviation: 'JAX',
    division: 'South',
    conference: 'AFC',
  },
  {
    id: 'ten',
    name: 'Titans',
    city: 'Tennessee',
    abbreviation: 'TEN',
    division: 'South',
    conference: 'AFC',
  },
  // AFC West
  {
    id: 'den',
    name: 'Broncos',
    city: 'Denver',
    abbreviation: 'DEN',
    division: 'West',
    conference: 'AFC',
  },
  {
    id: 'kc',
    name: 'Chiefs',
    city: 'Kansas City',
    abbreviation: 'KC',
    division: 'West',
    conference: 'AFC',
  },
  {
    id: 'lv',
    name: 'Raiders',
    city: 'Las Vegas',
    abbreviation: 'LV',
    division: 'West',
    conference: 'AFC',
  },
  {
    id: 'lac',
    name: 'Chargers',
    city: 'Los Angeles',
    abbreviation: 'LAC',
    division: 'West',
    conference: 'AFC',
  },
  // NFC East
  {
    id: 'dal',
    name: 'Cowboys',
    city: 'Dallas',
    abbreviation: 'DAL',
    division: 'East',
    conference: 'NFC',
  },
  {
    id: 'nyg',
    name: 'Giants',
    city: 'New York',
    abbreviation: 'NYG',
    division: 'East',
    conference: 'NFC',
  },
  {
    id: 'phi',
    name: 'Eagles',
    city: 'Philadelphia',
    abbreviation: 'PHI',
    division: 'East',
    conference: 'NFC',
  },
  {
    id: 'was',
    name: 'Commanders',
    city: 'Washington',
    abbreviation: 'WAS',
    division: 'East',
    conference: 'NFC',
  },
  // NFC North
  {
    id: 'chi',
    name: 'Bears',
    city: 'Chicago',
    abbreviation: 'CHI',
    division: 'North',
    conference: 'NFC',
  },
  {
    id: 'det',
    name: 'Lions',
    city: 'Detroit',
    abbreviation: 'DET',
    division: 'North',
    conference: 'NFC',
  },
  {
    id: 'gb',
    name: 'Packers',
    city: 'Green Bay',
    abbreviation: 'GB',
    division: 'North',
    conference: 'NFC',
  },
  {
    id: 'min',
    name: 'Vikings',
    city: 'Minnesota',
    abbreviation: 'MIN',
    division: 'North',
    conference: 'NFC',
  },
  // NFC South
  {
    id: 'atl',
    name: 'Falcons',
    city: 'Atlanta',
    abbreviation: 'ATL',
    division: 'South',
    conference: 'NFC',
  },
  {
    id: 'car',
    name: 'Panthers',
    city: 'Carolina',
    abbreviation: 'CAR',
    division: 'South',
    conference: 'NFC',
  },
  {
    id: 'no',
    name: 'Saints',
    city: 'New Orleans',
    abbreviation: 'NO',
    division: 'South',
    conference: 'NFC',
  },
  {
    id: 'tb',
    name: 'Buccaneers',
    city: 'Tampa Bay',
    abbreviation: 'TB',
    division: 'South',
    conference: 'NFC',
  },
  // NFC West
  {
    id: 'ari',
    name: 'Cardinals',
    city: 'Arizona',
    abbreviation: 'ARI',
    division: 'West',
    conference: 'NFC',
  },
  {
    id: 'lar',
    name: 'Rams',
    city: 'Los Angeles',
    abbreviation: 'LAR',
    division: 'West',
    conference: 'NFC',
  },
  {
    id: 'sf',
    name: '49ers',
    city: 'San Francisco',
    abbreviation: 'SF',
    division: 'West',
    conference: 'NFC',
  },
  {
    id: 'sea',
    name: 'Seahawks',
    city: 'Seattle',
    abbreviation: 'SEA',
    division: 'West',
    conference: 'NFC',
  },
];

export default function NFLTeamsPage() {
  // Group teams by conference and division
  const teamsByDivision: Record<string, Team[]> = {};
  nflTeams.forEach((team) => {
    const key = `${team.conference} ${team.division}`;
    if (!teamsByDivision[key]) teamsByDivision[key] = [];
    teamsByDivision[key].push(team);
  });

  const divisionOrder = [
    'AFC East',
    'AFC North',
    'AFC South',
    'AFC West',
    'NFC East',
    'NFC North',
    'NFC South',
    'NFC West',
  ];

  const TeamCard = ({ team }: { team: Team }) => (
    <Card
      variant="default"
      padding="md"
      className="h-full transition-all hover:border-burnt-orange group"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-background-secondary rounded-lg flex items-center justify-center text-xl font-bold text-burnt-orange group-hover:bg-burnt-orange/10 transition-colors">
          {team.abbreviation}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary group-hover:text-burnt-orange transition-colors truncate">
            {team.city} {team.name}
          </p>
          <p className="text-xs text-text-tertiary">
            {team.conference} {team.division}
          </p>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nfl"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NFL
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">Teams</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                32 Teams
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                NFL Teams
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                All 32 NFL teams across 8 divisions. Titans, Cowboys, Chiefs—every franchise, no
                network filter.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Teams Grid */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {divisionOrder.map((division) => {
              const teams = teamsByDivision[division];
              if (!teams?.length) return null;

              return (
                <div key={division} className="mb-8">
                  <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-burnt-orange"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <ellipse cx="12" cy="12" rx="9" ry="5" />
                      <path d="M12 7v10M7 12h10" />
                    </svg>
                    {division}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {teams.map((team) => (
                      <ScrollReveal key={team.id}>
                        <TeamCard team={team} />
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              );
            })}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
