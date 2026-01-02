'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import {
  Trophy,
  Users,
  TrendingUp,
  MapPin,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Conferences', href: '/college-baseball/conferences' },
];

// Conference data with full team rosters
const conferenceData: Record<
  string,
  {
    id: string;
    name: string;
    fullName: string;
    description: string;
    region: string;
    storylines: string[];
    teams: Array<{
      name: string;
      mascot: string;
      rank: number | null;
      previousRank: number | null;
      keyPlayer?: string;
      previewNote?: string;
    }>;
  }
> = {
  sec: {
    id: 'sec',
    name: 'SEC',
    fullName: 'Southeastern Conference',
    description:
      'The deepest conference in college baseball just got deeper. Texas and Texas A&M joined for 2024-25, bringing Omaha pedigree and a historic rivalry to the SEC schedule. LSU, Tennessee, and Vanderbilt remain annual threats, while Arkansas and Ole Miss reload with top recruiting classes.',
    region: 'South',
    storylines: [
      'Texas enters as preseason #1 after a loaded transfer portal haul and returning ace Lucas Gordon',
      'Texas A&M (#2) brings back most of its CWS roster plus elite freshmen',
      'The Lone Star rivalry comes to SEC play—three games in College Station, three in Austin',
      'Tennessee rebuilding pitching staff after losing 4 arms to the draft',
      "LSU's three-peat hopes rest on whether the offense can match 2023-24 production",
    ],
    teams: [
      {
        name: 'Texas',
        mascot: 'Longhorns',
        rank: 1,
        previousRank: null,
        keyPlayer: 'Lucas Gordon, RHP',
        previewNote: 'Preseason #1 with elite pitching depth and portal additions',
      },
      {
        name: 'Texas A&M',
        mascot: 'Aggies',
        rank: 2,
        previousRank: null,
        keyPlayer: 'Gavin Grahovac, C',
        previewNote: 'CWS experience plus top-5 recruiting class',
      },
      {
        name: 'Tennessee',
        mascot: 'Volunteers',
        rank: 10,
        previousRank: null,
        keyPlayer: 'Christian Moore, 2B',
        previewNote: 'Rebuilding rotation but lineup remains dangerous',
      },
      {
        name: 'LSU',
        mascot: 'Tigers',
        rank: 14,
        previousRank: null,
        keyPlayer: 'Tommy White, 1B',
        previewNote: 'Offense-first approach with new pitching staff',
      },
      {
        name: 'Vanderbilt',
        mascot: 'Commodores',
        rank: null,
        previousRank: null,
        previewNote: 'Tim Corbin reloads with elite pitching prospects',
      },
      {
        name: 'Arkansas',
        mascot: 'Razorbacks',
        rank: null,
        previousRank: null,
        previewNote: 'Dave Van Horn always contends—watch for second-half surge',
      },
      {
        name: 'Ole Miss',
        mascot: 'Rebels',
        rank: null,
        previousRank: null,
        previewNote: 'Young roster with upside',
      },
      {
        name: 'Florida',
        mascot: 'Gators',
        rank: null,
        previousRank: null,
        previewNote: "Kevin O'Sullivan in rebuild mode after departures",
      },
      {
        name: 'Georgia',
        mascot: 'Bulldogs',
        rank: null,
        previousRank: null,
        previewNote: 'Competitive in SEC East',
      },
      {
        name: 'South Carolina',
        mascot: 'Gamecocks',
        rank: null,
        previousRank: null,
        previewNote: 'Monte Lee building toward contention',
      },
      {
        name: 'Kentucky',
        mascot: 'Wildcats',
        rank: null,
        previousRank: null,
        previewNote: 'Improving program under Nick Mingione',
      },
      {
        name: 'Auburn',
        mascot: 'Tigers',
        rank: null,
        previousRank: null,
        previewNote: 'Sonny DiChiara era begins in earnest',
      },
      {
        name: 'Missouri',
        mascot: 'Tigers',
        rank: null,
        previousRank: null,
        previewNote: 'Building toward SEC competitiveness',
      },
      {
        name: 'Mississippi State',
        mascot: 'Bulldogs',
        rank: null,
        previousRank: null,
        previewNote: 'Chris Lemonis looking to bounce back',
      },
      {
        name: 'Alabama',
        mascot: 'Crimson Tide',
        rank: null,
        previousRank: null,
        previewNote: 'Rob Vaughn building the program',
      },
      {
        name: 'Oklahoma',
        mascot: 'Sooners',
        rank: null,
        previousRank: null,
        previewNote: 'First year in SEC—adjustment season expected',
      },
    ],
  },
  acc: {
    id: 'acc',
    name: 'ACC',
    fullName: 'Atlantic Coast Conference',
    description:
      'Expansion transformed the ACC into the deepest conference in the country by sheer numbers. Stanford, Cal, and SMU joined Wake Forest, Florida State, and North Carolina—the league now features 15 ranked teams in the preseason Top 25. The ACC Tournament in Charlotte will be a bloodbath.',
    region: 'East Coast (expanded)',
    storylines: [
      'Stanford (#3) joins as immediate title favorite with returning All-Americans',
      'Florida State (#4) returns to form under Link Jarrett after disappointing 2024',
      'NC State (#5) riding momentum from CWS run with experienced roster',
      "Wake Forest proves last year's success wasn't a fluke",
      'Cal and SMU add West Coast and Texas recruiting pipelines to ACC',
    ],
    teams: [
      {
        name: 'Stanford',
        mascot: 'Cardinal',
        rank: 3,
        previousRank: null,
        keyPlayer: 'Braden Montgomery, OF',
        previewNote: 'Elite two-way player leads loaded roster',
      },
      {
        name: 'Florida State',
        mascot: 'Seminoles',
        rank: 4,
        previousRank: null,
        keyPlayer: 'James Tibbs III, OF',
        previewNote: 'Back to contender status with veteran core',
      },
      {
        name: 'NC State',
        mascot: 'Wolfpack',
        rank: 5,
        previousRank: null,
        keyPlayer: 'Sam Highfill, LHP',
        previewNote: 'CWS experience makes them dangerous',
      },
      {
        name: 'Clemson',
        mascot: 'Tigers',
        rank: 6,
        previousRank: null,
        previewNote: 'Monte Lee has Tigers back in the hunt',
      },
      {
        name: 'North Carolina',
        mascot: 'Tar Heels',
        rank: 7,
        previousRank: null,
        previewNote: 'Scott Forbes builds another contender',
      },
      {
        name: 'Virginia',
        mascot: 'Cavaliers',
        rank: 8,
        previousRank: null,
        keyPlayer: 'Ethan Anderson, SS',
        previewNote: "O'Connor's program keeps rolling",
      },
      {
        name: 'Louisville',
        mascot: 'Cardinals',
        rank: 9,
        previousRank: null,
        previewNote: 'Dan McDonnell always fields a contender',
      },
      {
        name: 'Wake Forest',
        mascot: 'Demon Deacons',
        rank: 11,
        previousRank: null,
        previewNote: 'Breakout season was no fluke',
      },
      {
        name: 'Miami',
        mascot: 'Hurricanes',
        rank: 17,
        previousRank: null,
        previewNote: 'The U is back in the baseball conversation',
      },
      {
        name: 'Virginia Tech',
        mascot: 'Hokies',
        rank: 19,
        previousRank: null,
        previewNote: 'John Szefc has Hokies on the rise',
      },
      {
        name: 'Georgia Tech',
        mascot: 'Yellow Jackets',
        rank: 20,
        previousRank: null,
        previewNote: 'Danny Hall gets them in the conversation',
      },
      {
        name: 'Notre Dame',
        mascot: 'Fighting Irish',
        rank: 21,
        previousRank: null,
        previewNote: 'Link Jarrett II leads Irish into ACC',
      },
      {
        name: 'Cal',
        mascot: 'Golden Bears',
        rank: 22,
        previousRank: null,
        previewNote: 'Mike Neu brings West Coast talent to ACC',
      },
      {
        name: 'SMU',
        mascot: 'Mustangs',
        rank: 23,
        previousRank: null,
        previewNote: 'Texas talent pipeline now feeds ACC',
      },
      {
        name: 'Duke',
        mascot: 'Blue Devils',
        rank: 24,
        previousRank: null,
        previewNote: 'Chris Pollard has Duke relevant again',
      },
      {
        name: 'Pittsburgh',
        mascot: 'Panthers',
        rank: null,
        previousRank: null,
        previewNote: 'Mike Bell building in Pittsburgh',
      },
      {
        name: 'Boston College',
        mascot: 'Eagles',
        rank: null,
        previousRank: null,
        previewNote: 'Working toward ACC competitiveness',
      },
      {
        name: 'Syracuse',
        mascot: 'Orange',
        rank: null,
        previousRank: null,
        previewNote: 'Building program in cold weather',
      },
    ],
  },
  'big-12': {
    id: 'big-12',
    name: 'Big 12',
    fullName: 'Big 12 Conference',
    description:
      'The Big 12 absorbed UCF, Houston, BYU, and others during realignment, creating a 16-team league with legitimate depth. Oklahoma State leads the way, but Baylor, TCU, and the new additions make this a grind every weekend. Pitching depth defines contenders here.',
    region: 'Central',
    storylines: [
      'Oklahoma State (#12) returns most of its pitching staff for a title run',
      'Baylor (#18) looks to build on momentum under Mitch Thompson',
      'Houston brings AAC dominance to Big 12 competition',
      'TCU reloading after Gary Patterson era winds down',
      'West Virginia becomes the sleeper pick with experienced roster',
    ],
    teams: [
      {
        name: 'Oklahoma State',
        mascot: 'Cowboys',
        rank: 12,
        previousRank: null,
        keyPlayer: 'Aidan Meola, RHP',
        previewNote: 'Deep rotation makes them Big 12 favorites',
      },
      {
        name: 'Baylor',
        mascot: 'Bears',
        rank: 18,
        previousRank: null,
        previewNote: 'Mitch Thompson builds contender in Waco',
      },
      {
        name: 'UCF',
        mascot: 'Knights',
        rank: 25,
        previousRank: null,
        previewNote: 'Greg Lovelady brings winning culture from AAC',
      },
      {
        name: 'Houston',
        mascot: 'Cougars',
        rank: null,
        previousRank: null,
        previewNote: 'Todd Whitting adjusts to Big 12 competition',
      },
      {
        name: 'West Virginia',
        mascot: 'Mountaineers',
        rank: null,
        previousRank: null,
        previewNote: 'Randy Mazey has underrated roster',
      },
      {
        name: 'BYU',
        mascot: 'Cougars',
        rank: null,
        previousRank: null,
        previewNote: 'First year in power conference—learning curve expected',
      },
      {
        name: 'TCU',
        mascot: 'Horned Frogs',
        rank: null,
        previousRank: null,
        previewNote: 'Kirk Saarloos in rebuild after CWS core departed',
      },
      {
        name: 'Kansas State',
        mascot: 'Wildcats',
        rank: null,
        previousRank: null,
        previewNote: 'Building toward contention',
      },
      {
        name: 'Texas Tech',
        mascot: 'Red Raiders',
        rank: null,
        previousRank: null,
        previewNote: 'Tim Tadlock reloads after draft losses',
      },
      {
        name: 'Kansas',
        mascot: 'Jayhawks',
        rank: null,
        previousRank: null,
        previewNote: 'Working to stay competitive in Big 12',
      },
      {
        name: 'Cincinnati',
        mascot: 'Bearcats',
        rank: null,
        previousRank: null,
        previewNote: 'Scott Googins adjusts to Big 12 level',
      },
      {
        name: 'Arizona',
        mascot: 'Wildcats',
        rank: null,
        previousRank: null,
        previewNote: 'Chip Hale brings Pac-12 experience',
      },
      {
        name: 'Arizona State',
        mascot: 'Sun Devils',
        rank: null,
        previousRank: null,
        previewNote: 'Willie Bloomquist building in Tempe',
      },
      {
        name: 'Colorado',
        mascot: 'Buffaloes',
        rank: null,
        previousRank: null,
        previewNote: 'Adjusting to Big 12 baseball',
      },
      {
        name: 'Utah',
        mascot: 'Utes',
        rank: null,
        previousRank: null,
        previewNote: 'New to power conference baseball',
      },
      {
        name: 'Iowa State',
        mascot: 'Cyclones',
        rank: null,
        previousRank: null,
        previewNote: 'Working to establish Big 12 presence',
      },
    ],
  },
  'big-ten': {
    id: 'big-ten',
    name: 'Big Ten',
    fullName: 'Big Ten Conference',
    description:
      'The Big Ten became a true power conference for baseball when USC and UCLA joined in 2024. Neither cracked the preseason Top 25, but both bring recruiting advantages and Pac-12 traditions. Michigan and Indiana remain the established powers, with Maryland and Nebraska rising.',
    region: 'Midwest (expanded)',
    storylines: [
      'USC and UCLA bring West Coast talent and traditions to Big Ten',
      'Michigan looks to reclaim Big Ten supremacy after rebuilding',
      'Indiana remains a threat with consistent program culture',
      "Nebraska's development under Will Bolt continues",
      'Maryland emerging as dark horse with quality pitching',
    ],
    teams: [
      {
        name: 'USC',
        mascot: 'Trojans',
        rank: null,
        previousRank: null,
        previewNote: 'First year in Big Ten—transition season',
      },
      {
        name: 'UCLA',
        mascot: 'Bruins',
        rank: null,
        previousRank: null,
        previewNote: 'John Savage adjusts to Big Ten travel',
      },
      {
        name: 'Michigan',
        mascot: 'Wolverines',
        rank: null,
        previousRank: null,
        previewNote: 'Erik Bakich returns program to prominence',
      },
      {
        name: 'Indiana',
        mascot: 'Hoosiers',
        rank: null,
        previousRank: null,
        previewNote: 'Jeff Mercer has built a consistent winner',
      },
      {
        name: 'Maryland',
        mascot: 'Terrapins',
        rank: null,
        previousRank: null,
        previewNote: 'Matt Swope developing pitching depth',
      },
      {
        name: 'Nebraska',
        mascot: 'Cornhuskers',
        rank: null,
        previousRank: null,
        previewNote: 'Will Bolt builds toward contention',
      },
      {
        name: 'Illinois',
        mascot: 'Fighting Illini',
        rank: null,
        previousRank: null,
        previewNote: 'Dan Hartleb works to stay competitive',
      },
      {
        name: 'Ohio State',
        mascot: 'Buckeyes',
        rank: null,
        previousRank: null,
        previewNote: 'Bill Mosiello in first years at helm',
      },
      {
        name: 'Rutgers',
        mascot: 'Scarlet Knights',
        rank: null,
        previousRank: null,
        previewNote: 'Steve Owens building in New Jersey',
      },
      {
        name: 'Penn State',
        mascot: 'Nittany Lions',
        rank: null,
        previousRank: null,
        previewNote: 'Rob Cooper develops program',
      },
      {
        name: 'Purdue',
        mascot: 'Boilermakers',
        rank: null,
        previousRank: null,
        previewNote: 'Greg Goff working toward competitiveness',
      },
      {
        name: 'Northwestern',
        mascot: 'Wildcats',
        rank: null,
        previousRank: null,
        previewNote: 'Jim Foster builds academic-athletic balance',
      },
      {
        name: 'Minnesota',
        mascot: 'Golden Gophers',
        rank: null,
        previousRank: null,
        previewNote: 'John Anderson in his final seasons',
      },
      {
        name: 'Iowa',
        mascot: 'Hawkeyes',
        rank: null,
        previousRank: null,
        previewNote: 'Rick Heller builds consistently',
      },
      {
        name: 'Michigan State',
        mascot: 'Spartans',
        rank: null,
        previousRank: null,
        previewNote: 'Jake Boss Jr. developing program',
      },
      {
        name: 'Wisconsin',
        mascot: 'Badgers',
        rank: null,
        previousRank: null,
        previewNote: 'Working to establish Big Ten presence',
      },
      {
        name: 'Oregon',
        mascot: 'Ducks',
        rank: null,
        previousRank: null,
        previewNote: 'Mark Wasikowski adjusts to Big Ten',
      },
      {
        name: 'Washington',
        mascot: 'Huskies',
        rank: null,
        previousRank: null,
        previewNote: 'New to Big Ten baseball',
      },
    ],
  },
  'pac-12': {
    id: 'pac-12',
    name: 'Pac-12',
    fullName: 'Pacific-12 Conference',
    description:
      'The Pac-12 is rebuilding after losing its biggest programs to the Big Ten and Big 12. Oregon State and Washington State remain as anchors, joined by four new members. The conference will need time to establish its new identity in college baseball.',
    region: 'West',
    storylines: [
      'Oregon State returns as the flagship program after Stanford, USC, UCLA departures',
      'Washington State brings competitive culture to reduced conference',
      'New members (San Diego State, Fresno State, etc.) provide regional competition',
      'Conference identity in flux as realignment settles',
      'Regional recruiting becomes crucial for remaining programs',
    ],
    teams: [
      {
        name: 'Oregon State',
        mascot: 'Beavers',
        rank: null,
        previousRank: null,
        previewNote: 'Mitch Canham leads conference flagship',
      },
      {
        name: 'Washington State',
        mascot: 'Cougars',
        rank: null,
        previousRank: null,
        previewNote: 'Brian Green maintains competitiveness',
      },
      {
        name: 'San Diego State',
        mascot: 'Aztecs',
        rank: null,
        previousRank: null,
        previewNote: 'New to Pac-12, brings Mountain West success',
      },
      {
        name: 'Fresno State',
        mascot: 'Bulldogs',
        rank: null,
        previousRank: null,
        previewNote: 'Ryan Overland joins new conference',
      },
    ],
  },
};

function RankChange({ current, previous }: { current: number | null; previous: number | null }) {
  if (!current) return null;
  if (!previous) return <span className="text-text-tertiary text-sm">NEW</span>;

  const change = previous - current;
  if (change > 0) {
    return (
      <span className="flex items-center text-green-500 text-sm">
        <ChevronUp className="w-4 h-4" />
        {change}
      </span>
    );
  } else if (change < 0) {
    return (
      <span className="flex items-center text-red-500 text-sm">
        <ChevronDown className="w-4 h-4" />
        {Math.abs(change)}
      </span>
    );
  }
  return <Minus className="w-4 h-4 text-text-tertiary" />;
}

interface ConferenceDetailClientProps {
  conferenceId: string;
}

export default function ConferenceDetailClient({ conferenceId }: ConferenceDetailClientProps) {
  const conference = conferenceData[conferenceId];

  if (!conference) {
    return (
      <>
        <Navbar items={navItems} />
        <main id="main-content">
          <Section padding="lg" className="pt-24">
            <Container>
              <div className="text-center py-20">
                <h1 className="font-display text-3xl font-bold text-white mb-4">
                  Conference Not Found
                </h1>
                <p className="text-text-secondary mb-6">
                  The conference you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link
                  href="/college-baseball/conferences"
                  className="text-burnt-orange hover:underline"
                >
                  &larr; Back to Conferences
                </Link>
              </div>
            </Container>
          </Section>
        </main>
        <Footer />
      </>
    );
  }

  const rankedTeams = conference.teams.filter((t) => t.rank !== null);
  const unrankedTeams = conference.teams.filter((t) => t.rank === null);

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <Link
                href="/college-baseball/conferences"
                className="inline-flex items-center gap-2 text-text-tertiary hover:text-burnt-orange transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                All Conferences
              </Link>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-white">
                    {conference.fullName}
                  </h1>
                  <Badge variant="primary">{rankedTeams.length} Ranked</Badge>
                </div>
                <p className="text-text-secondary max-w-3xl">{conference.description}</p>
              </div>
            </ScrollReveal>

            {/* Quick Stats */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <Card padding="md" className="text-center">
                  <Trophy className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">
                    {rankedTeams.length}
                  </div>
                  <div className="text-text-tertiary text-sm">Ranked Teams</div>
                </Card>
                <Card padding="md" className="text-center">
                  <Users className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">
                    {conference.teams.length}
                  </div>
                  <div className="text-text-tertiary text-sm">Total Teams</div>
                </Card>
                <Card padding="md" className="text-center">
                  <TrendingUp className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">
                    {rankedTeams[0]?.name || '—'}
                  </div>
                  <div className="text-text-tertiary text-sm">
                    Top Team {rankedTeams[0]?.rank ? `(#${rankedTeams[0].rank})` : ''}
                  </div>
                </Card>
                <Card padding="md" className="text-center">
                  <MapPin className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">
                    {conference.region}
                  </div>
                  <div className="text-text-tertiary text-sm">Region</div>
                </Card>
              </div>
            </ScrollReveal>

            {/* Preseason Storylines */}
            <ScrollReveal direction="up" delay={150}>
              <Card padding="lg" className="mb-10">
                <h2 className="font-display text-xl font-bold text-white mb-4">
                  2026 Preseason Storylines
                </h2>
                <ul className="space-y-3">
                  {conference.storylines.map((storyline, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-burnt-orange font-bold shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-text-secondary">{storyline}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </ScrollReveal>

            {/* Ranked Teams */}
            {rankedTeams.length > 0 && (
              <ScrollReveal direction="up" delay={200}>
                <h2 className="font-display text-xl font-bold text-white mb-4">
                  Ranked Teams ({rankedTeams.length})
                </h2>
                <div className="grid gap-4 mb-10">
                  {rankedTeams
                    .sort((a, b) => (a.rank || 99) - (b.rank || 99))
                    .map((team) => (
                      <Card
                        key={team.name}
                        padding="md"
                        className="hover:border-burnt-orange/50 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-burnt-orange/20 flex items-center justify-center">
                              <span className="font-display text-xl font-bold text-burnt-orange">
                                #{team.rank}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-display text-lg font-bold text-white">
                                  {team.name} {team.mascot}
                                </h3>
                                <RankChange current={team.rank} previous={team.previousRank} />
                              </div>
                              {team.keyPlayer && (
                                <p className="text-burnt-orange text-sm">{team.keyPlayer}</p>
                              )}
                            </div>
                          </div>
                          {team.previewNote && (
                            <p className="text-text-secondary text-sm md:text-right md:max-w-md">
                              {team.previewNote}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              </ScrollReveal>
            )}

            {/* Other Teams */}
            {unrankedTeams.length > 0 && (
              <ScrollReveal direction="up" delay={250}>
                <h2 className="font-display text-xl font-bold text-white mb-4">
                  Other Conference Teams ({unrankedTeams.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {unrankedTeams.map((team) => (
                    <Card key={team.name} padding="md">
                      <div>
                        <h3 className="font-display text-lg font-bold text-white">
                          {team.name} {team.mascot}
                        </h3>
                        {team.previewNote && (
                          <p className="text-text-secondary text-sm mt-1">{team.previewNote}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* Data Attribution */}
            <div className="mt-10 text-center text-xs text-text-tertiary">
              <p>Rankings data sourced from D1Baseball preseason poll (2026).</p>
              <p className="mt-1">
                Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}{' '}
                CT
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
