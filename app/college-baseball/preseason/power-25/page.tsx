'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Users,
  MapPin,
  ChevronRight,
} from 'lucide-react';

interface RankedTeam {
  rank: number;
  name: string;
  mascot: string;
  conference: string;
  lastRank: number | null;
  record2025: string;
  postseason2025: string;
  keyPlayers: string[];
  outlook: string;
  tier: 'elite' | 'contender' | 'sleeper' | 'bubble';
  isTexas: boolean;
}

const power25: RankedTeam[] = [
  {
    rank: 1,
    name: 'Texas',
    mascot: 'Longhorns',
    conference: 'SEC',
    lastRank: 3,
    record2025: '48-22',
    postseason2025: 'Regional Final',
    keyPlayers: ['Jared Thomas (RHP)', 'Lucas Gordon (SS)', 'Trey Faltine III (CF)'],
    outlook:
      'The deepest pitching staff in college baseball. Three projected first-round picks anchor a rotation that dominated the Big 12. Add a lineup returning its entire middle infield and the swagger of a six-time national champion, and you have the team to beat.',
    tier: 'elite',
    isTexas: true,
  },
  {
    rank: 2,
    name: 'Texas A&M',
    mascot: 'Aggies',
    conference: 'SEC',
    lastRank: 5,
    record2025: '53-15',
    postseason2025: 'College World Series',
    keyPlayers: ['Ryan Prager (LHP)', 'Kaeden Kent (3B)', 'Braden Montgomery (OF)'],
    outlook:
      'The Aggies return the core of a team that won 53 games and reached Omaha. Jim Schlossnagle has built something special in College Station—elite defense, contact-oriented hitting, and a knack for developing arms. The Lone Star Rivalry just got real.',
    tier: 'elite',
    isTexas: true,
  },
  {
    rank: 3,
    name: 'Florida',
    mascot: 'Gators',
    conference: 'SEC',
    lastRank: 7,
    record2025: '47-23',
    postseason2025: 'Super Regional',
    keyPlayers: ['Jac Caglianone (1B/LHP)', 'Cade Kurland (2B)', 'Brandon Sproat (RHP)'],
    outlook:
      "Jac Caglianone is the best two-way player in college baseball history. Full stop. If he stays healthy and focused, the Gators have a legitimate Omaha ceiling. Kevin O'Sullivan knows how to peak in June.",
    tier: 'elite',
    isTexas: false,
  },
  {
    rank: 4,
    name: 'Wake Forest',
    mascot: 'Demon Deacons',
    conference: 'ACC',
    lastRank: 2,
    record2025: '54-11',
    postseason2025: 'College World Series Final',
    keyPlayers: ['Pierce Bennett (SS)', 'Brock Wilken (3B)', 'Josh Hartle (LHP)'],
    outlook:
      'One game away from a national title. The Demon Deacons ran roughshod over the ACC and very nearly won it all. They reload rather than rebuild, with enough returning talent to make another run.',
    tier: 'elite',
    isTexas: false,
  },
  {
    rank: 5,
    name: 'LSU',
    mascot: 'Tigers',
    conference: 'SEC',
    lastRank: 1,
    record2025: '52-17',
    postseason2025: 'National Champions',
    keyPlayers: ['Tommy White (3B)', 'Paul Skenes (RHP)', "Tre' Morgan (1B)"],
    outlook:
      "The defending national champions lost some key pieces but Paul Skenes returns after his MLB dalliance was resolved. Tommy White continues to mash. This is still LSU—they'll be in the conversation come May.",
    tier: 'elite',
    isTexas: false,
  },
  {
    rank: 6,
    name: 'Virginia',
    mascot: 'Cavaliers',
    conference: 'ACC',
    lastRank: 4,
    record2025: '50-14',
    postseason2025: 'College World Series',
    keyPlayers: ["Griff O'Ferrall (SS)", 'Jake Gelof (3B)', 'Connelly Early (RHP)'],
    outlook:
      "Brian O'Connor continues to produce at an elite level. The Cavaliers are a model of consistency, returning a balanced roster that can beat you with pitching or offense. ACC championship favorites.",
    tier: 'contender',
    isTexas: false,
  },
  {
    rank: 7,
    name: 'Arkansas',
    mascot: 'Razorbacks',
    conference: 'SEC',
    lastRank: 8,
    record2025: '46-21',
    postseason2025: 'Super Regional',
    keyPlayers: ['Peyton Stovall (2B)', 'Hagen Smith (LHP)', 'Jace Bohrofen (OF)'],
    outlook:
      "Dave Van Horn's program is a machine. The Hogs reload every year with elite talent and compete for SEC titles. This team has the arms to pitch deep into June.",
    tier: 'contender',
    isTexas: false,
  },
  {
    rank: 8,
    name: 'Tennessee',
    mascot: 'Volunteers',
    conference: 'SEC',
    lastRank: 9,
    record2025: '45-23',
    postseason2025: 'Regional Final',
    keyPlayers: ['Christian Moore (2B)', 'Drew Beam (RHP)', 'Blake Burke (1B)'],
    outlook:
      "Tony Vitello has built Tennessee into a legitimate power. The Vols bring back a potent lineup and one of the SEC's best arms in Drew Beam. Rocky Top will be rocking.",
    tier: 'contender',
    isTexas: false,
  },
  {
    rank: 9,
    name: 'Stanford',
    mascot: 'Cardinal',
    conference: 'ACC',
    lastRank: 12,
    record2025: '41-19',
    postseason2025: 'Super Regional',
    keyPlayers: ['Braden Montgomery (OF)', 'Drew Dowd (RHP)', 'Adam Crampton (C)'],
    outlook:
      "The Cardinal join the ACC and bring West Coast firepower. David Esquer's squad has legitimate Omaha aspirations. The cross-country travel will be interesting, but Stanford has the talent to compete.",
    tier: 'contender',
    isTexas: false,
  },
  {
    rank: 10,
    name: 'Oregon State',
    mascot: 'Beavers',
    conference: 'Pac-12',
    lastRank: 6,
    record2025: '49-18',
    postseason2025: 'College World Series',
    keyPlayers: ['Travis Bazzana (2B)', 'Jacob Kmatz (RHP)', 'Jabin Trosky (OF)'],
    outlook:
      'Mitch Canham has rebuilt the Beavers into a national power. Travis Bazzana is a potential #1 overall pick. The Pac-12 is weakened, which should mean a conference title and top-8 seed.',
    tier: 'contender',
    isTexas: false,
  },
  {
    rank: 11,
    name: 'Vanderbilt',
    mascot: 'Commodores',
    conference: 'SEC',
    lastRank: 14,
    record2025: '43-21',
    postseason2025: 'Regional',
    keyPlayers: ['Enrique Bradfield Jr. (OF)', 'Carter Young (SS)', 'Christian Little (RHP)'],
    outlook:
      'Tim Corbin always reloads. The Commodores have too much talent in the pipeline to stay down for long. Enrique Bradfield Jr. is electric and the pitching staff is underrated.',
    tier: 'contender',
    isTexas: false,
  },
  {
    rank: 12,
    name: 'TCU',
    mascot: 'Horned Frogs',
    conference: 'Big 12',
    lastRank: 10,
    record2025: '44-20',
    postseason2025: 'Super Regional',
    keyPlayers: ['Brayden Taylor (3B)', 'Austin Krob (LHP)', 'Tommy Sacco (SS)'],
    outlook:
      'Kirk Saarloos has built a monster in Fort Worth. The Horned Frogs slug with the best of them and have the pitching to match. Big 12 favorites with Texas gone.',
    tier: 'contender',
    isTexas: true,
  },
  {
    rank: 13,
    name: 'Clemson',
    mascot: 'Tigers',
    conference: 'ACC',
    lastRank: 15,
    record2025: '42-19',
    postseason2025: 'Regional',
    keyPlayers: ['Cam Cannarella (OF)', 'Aidan Knaak (RHP)', 'Blake Wright (C)'],
    outlook:
      'Erik Bakich continues to elevate the program. The Tigers have the pieces to make noise in a loaded ACC, with excellent pitching depth and a balanced lineup.',
    tier: 'sleeper',
    isTexas: false,
  },
  {
    rank: 14,
    name: 'North Carolina',
    mascot: 'Tar Heels',
    conference: 'ACC',
    lastRank: 11,
    record2025: '45-18',
    postseason2025: 'Super Regional',
    keyPlayers: ['Vance Honeycutt (OF)', 'Luke Stevenson (RHP)', 'Casey Cook (3B)'],
    outlook:
      "Scott Forbes has the Heels trending upward. Vance Honeycutt is a game-changer in center field with plus power. This could be Chapel Hill's year.",
    tier: 'sleeper',
    isTexas: false,
  },
  {
    rank: 15,
    name: 'Kentucky',
    mascot: 'Wildcats',
    conference: 'SEC',
    lastRank: 18,
    record2025: '40-22',
    postseason2025: 'Regional',
    keyPlayers: ['Ryan Waldschmidt (1B)', 'Travis Smith (RHP)', 'Devin Burkes (SS)'],
    outlook:
      "Nick Mingione has built something real in Lexington. The Wildcats have consistent depth and play sound fundamental baseball. Don't sleep on the Cats.",
    tier: 'sleeper',
    isTexas: false,
  },
  {
    rank: 16,
    name: 'Georgia',
    mascot: 'Bulldogs',
    conference: 'SEC',
    lastRank: 20,
    record2025: '39-23',
    postseason2025: 'Regional',
    keyPlayers: ['Charlie Condon (OF)', 'Kolby Branch (RHP)', 'Corey Collins (3B)'],
    outlook:
      'Charlie Condon is a legitimate superstar—the best pure hitter in college baseball. If the pitching catches up, Georgia could surprise.',
    tier: 'sleeper',
    isTexas: false,
  },
  {
    rank: 17,
    name: 'Oklahoma',
    mascot: 'Sooners',
    conference: 'SEC',
    lastRank: 17,
    record2025: '40-21',
    postseason2025: 'Regional',
    keyPlayers: ['Dakota Harris (OF)', 'Cade Horton (RHP)', 'Jackson Nicklaus (1B)'],
    outlook:
      'Skip Johnson guides the Sooners into their SEC debut. OU has the arms to compete in the best conference in the country. A dark horse for the Tournament.',
    tier: 'sleeper',
    isTexas: false,
  },
  {
    rank: 18,
    name: 'South Carolina',
    mascot: 'Gamecocks',
    conference: 'SEC',
    lastRank: 22,
    record2025: '38-22',
    postseason2025: 'Regional',
    keyPlayers: ['Ethan Petry (1B)', 'Will Sanders (RHP)', 'Carson Hornung (OF)'],
    outlook:
      'Monte Lee has the Gamecocks back in the conversation. The pitching staff has real depth and the lineup is improving. A sleeper pick for Omaha.',
    tier: 'sleeper',
    isTexas: false,
  },
  {
    rank: 19,
    name: 'Florida State',
    mascot: 'Seminoles',
    conference: 'ACC',
    lastRank: 13,
    record2025: '43-19',
    postseason2025: 'Super Regional',
    keyPlayers: ['James Tibbs III (OF)', 'Brennan Oxford (RHP)', 'Daniel Cantu (SS)'],
    outlook:
      'Link Jarrett continues to build in Tallahassee. The Noles have elite athleticism and enough pitching to make a run in the ACC.',
    tier: 'sleeper',
    isTexas: false,
  },
  {
    rank: 20,
    name: 'Ole Miss',
    mascot: 'Rebels',
    conference: 'SEC',
    lastRank: 16,
    record2025: '42-23',
    postseason2025: 'Regional',
    keyPlayers: ['Jackson Kimbrell (OF)', 'Jack Dougherty (RHP)', 'Kemp Alderman (1B)'],
    outlook:
      'Mike Bianco has been here before. The Rebels have the bats to compete with anyone and pitch well enough to stay in games. A veteran team with postseason experience.',
    tier: 'sleeper',
    isTexas: false,
  },
  {
    rank: 21,
    name: 'NC State',
    mascot: 'Wolfpack',
    conference: 'ACC',
    lastRank: 25,
    record2025: '38-21',
    postseason2025: 'Regional',
    keyPlayers: ['Noah Soles (SS)', 'Logan Whitaker (LHP)', 'Matt Heavner (C)'],
    outlook:
      "Elliott Avent's program continues to churn out competitive teams. The Wolfpack are scrappy and well-coached, capable of upsetting anyone in a short series.",
    tier: 'bubble',
    isTexas: false,
  },
  {
    rank: 22,
    name: 'Alabama',
    mascot: 'Crimson Tide',
    conference: 'SEC',
    lastRank: null,
    record2025: '36-23',
    postseason2025: 'Regional',
    keyPlayers: ['Gage Miller (SS)', 'Grayson Hitt (RHP)', 'Drew Williamson (3B)'],
    outlook:
      'Rob Vaughn has Alabama trending upward. The Tide are finally becoming a factor in SEC baseball, with improved pitching and a solid lineup.',
    tier: 'bubble',
    isTexas: false,
  },
  {
    rank: 23,
    name: 'Dallas Baptist',
    mascot: 'Patriots',
    conference: 'WAC',
    lastRank: null,
    record2025: '44-17',
    postseason2025: 'Regional Final',
    keyPlayers: ['Chandler Arnold (2B)', 'Tristan Stevens (RHP)', 'Blayne Jones (OF)'],
    outlook:
      'Dan Heefner continues to do more with less. DBU is the best mid-major in the country and plays an elite non-conference schedule. National seed potential.',
    tier: 'bubble',
    isTexas: true,
  },
  {
    rank: 24,
    name: 'Cal',
    mascot: 'Golden Bears',
    conference: 'ACC',
    lastRank: null,
    record2025: '37-21',
    postseason2025: 'Regional',
    keyPlayers: ['Nathan Manning (1B)', 'Myles Patton (RHP)', 'Tanner Brubaker (3B)'],
    outlook:
      "Mike Neu's Bears join the ACC with something to prove. The West Coast is producing talent, and Cal has enough pieces to be competitive in their new conference.",
    tier: 'bubble',
    isTexas: false,
  },
  {
    rank: 25,
    name: 'Arizona',
    mascot: 'Wildcats',
    conference: 'Big 12',
    lastRank: 19,
    record2025: '41-22',
    postseason2025: 'Regional',
    keyPlayers: ['Daniel Susac (C)', 'Dawson Netz (RHP)', 'Garen Caulfield (OF)'],
    outlook:
      "Chip Hale's squad joins the Big 12 with plenty of talent. Daniel Susac is one of the best catchers in the country. The Wildcats could be a factor in a wide-open conference.",
    tier: 'bubble',
    isTexas: false,
  },
];

const tierColors = {
  elite: 'border-burnt-orange/50 bg-burnt-orange/10',
  contender: 'border-gold/50 bg-gold/10',
  sleeper: 'border-blue-500/50 bg-blue-500/10',
  bubble: 'border-border-strong bg-surface-light',
};

// Reserved for future tier display feature
const _tierLabels = {
  elite: 'Omaha Favorite',
  contender: 'Contender',
  sleeper: 'Dark Horse',
  bubble: 'Bubble',
};

const conferenceBreakdown = [
  { conference: 'SEC', count: 12, note: 'Most in Top 25' },
  { conference: 'ACC', count: 7, note: 'Includes Stanford, Cal' },
  { conference: 'Big 12', count: 2, note: 'TCU leads post-realignment' },
  { conference: 'Pac-12', count: 1, note: 'Oregon State the lone rep' },
  { conference: 'WAC', count: 1, note: 'DBU represents mid-majors' },
];

export default function Power25Page() {
  const texasTeams = power25.filter((t) => t.isTexas);
  const eliteTeams = power25.filter((t) => t.tier === 'elite');
  const lastUpdated = 'February 2026';

  const getRankChange = (team: RankedTeam) => {
    if (team.lastRank === null) return { icon: Star, color: 'text-gold', label: 'New' };
    const change = team.lastRank - team.rank;
    if (change > 0) return { icon: TrendingUp, color: 'text-success', label: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: 'text-error', label: `${change}` };
    return { icon: Minus, color: 'text-text-tertiary', label: '—' };
  };

  return (
    <>
      <main id="main-content">
        {/* Hero */}
        <Section padding="none" className="relative">
          <div className="bg-gradient-to-br from-burnt-orange via-[#8B4513] to-charcoal relative overflow-hidden">
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_black_100%)] opacity-70" />
            <Container className="relative z-10 py-16 md:py-24">
              <ScrollReveal direction="up">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="primary">Rankings</Badge>
                  <span className="text-text-secondary text-sm">15 min read</span>
                </div>

                <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-display text-text-primary mb-4 max-w-4xl">
                  2026 Preseason <span className="text-burnt-orange">Power 25</span>
                </h1>

                <p className="text-text-secondary text-xl md:text-2xl font-medium mb-6 max-w-3xl">
                  Breaking Down Every Ranked Team
                </p>

                <p className="text-text-secondary max-w-2xl text-lg leading-relaxed">
                  Conference realignment has reshuffled college baseball. The SEC now boasts 12
                  ranked teams. Texas and Texas A&M enter as #1 and #2. Here&apos;s our
                  comprehensive breakdown of every team in the preseason poll—tier by tier.
                </p>
              </ScrollReveal>
            </Container>
          </div>
        </Section>

        {/* Key Numbers */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card padding="md" className="text-center">
                  <div className="font-display text-3xl font-bold text-burnt-orange">
                    {texasTeams.length}
                  </div>
                  <div className="text-text-tertiary text-sm">Texas Teams Ranked</div>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="font-display text-3xl font-bold text-burnt-orange">
                    {eliteTeams.length}
                  </div>
                  <div className="text-text-tertiary text-sm">Omaha Favorites</div>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="font-display text-3xl font-bold text-burnt-orange">12</div>
                  <div className="text-text-tertiary text-sm">SEC Teams in Top 25</div>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="font-display text-3xl font-bold text-burnt-orange">3</div>
                  <div className="text-text-tertiary text-sm">Conference Newcomers</div>
                </Card>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Conference Breakdown */}
        <Section padding="sm">
          <Container>
            <ScrollReveal direction="up" delay={150}>
              <h2 className="font-display text-xl font-bold uppercase tracking-display text-text-primary mb-4">
                <Users className="w-5 h-5 inline mr-2 text-burnt-orange" />
                Conference Distribution
              </h2>
              <div className="flex flex-wrap gap-3">
                {conferenceBreakdown.map((conf) => (
                  <Card key={conf.conference} padding="sm" className="flex items-center gap-2">
                    <span className="text-text-primary font-bold">{conf.conference}</span>
                    <Badge variant={conf.conference === 'SEC' ? 'primary' : 'secondary'}>
                      {conf.count}
                    </Badge>
                    <span className="text-text-tertiary text-xs hidden sm:inline">{conf.note}</span>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tier: Elite */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={200}>
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-burnt-orange" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-text-primary">
                  Tier 1: Omaha Favorites
                </h2>
                <Badge variant="primary">{eliteTeams.length} Teams</Badge>
              </div>

              <div className="space-y-4">
                {eliteTeams.map((team) => {
                  const change = getRankChange(team);
                  return (
                    <Card
                      key={team.rank}
                      padding="lg"
                      className={`${tierColors.elite} ${team.isTexas ? 'ring-1 ring-burnt-orange/30' : ''}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex items-center gap-4">
                          <div className="font-display text-4xl font-bold text-burnt-orange w-12">
                            #{team.rank}
                          </div>
                          <div className="flex items-center gap-1">
                            <change.icon className={`w-4 h-4 ${change.color}`} />
                            <span className={`text-sm ${change.color}`}>{change.label}</span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-display text-xl font-bold text-text-primary uppercase">
                              {team.name} {team.mascot}
                            </h3>
                            <Badge variant="secondary">{team.conference}</Badge>
                            {team.isTexas && (
                              <span title="Texas">
                                <MapPin className="w-4 h-4 text-burnt-orange" />
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-text-tertiary mb-3">
                            <span>2025: {team.record2025}</span>
                            <span>{team.postseason2025}</span>
                          </div>

                          <p className="text-text-secondary text-sm leading-relaxed mb-3">
                            {team.outlook}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {team.keyPlayers.map((player) => (
                              <span
                                key={player}
                                className="text-xs bg-surface-light px-2 py-1 rounded text-text-tertiary"
                              >
                                {player}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tier: Contenders */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={250}>
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-gold" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-text-primary">
                  Tier 2: Contenders
                </h2>
                <Badge variant="secondary">
                  {power25.filter((t) => t.tier === 'contender').length} Teams
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {power25
                  .filter((t) => t.tier === 'contender')
                  .map((team) => {
                    const change = getRankChange(team);
                    return (
                      <Card
                        key={team.rank}
                        padding="md"
                        className={`${tierColors.contender} ${team.isTexas ? 'ring-1 ring-burnt-orange/30' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="font-display text-2xl font-bold text-gold w-10">
                            #{team.rank}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-display text-lg font-bold text-text-primary uppercase">
                                {team.name}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {team.conference}
                              </Badge>
                              {team.isTexas && <MapPin className="w-3 h-3 text-burnt-orange" />}
                            </div>
                            <div className="text-xs text-text-tertiary mb-2">
                              {team.record2025} · {team.postseason2025}
                            </div>
                            <p className="text-text-secondary text-sm leading-relaxed">
                              {team.outlook}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <change.icon className={`w-3 h-3 ${change.color}`} />
                            <span className={`text-xs ${change.color}`}>{change.label}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tier: Sleepers */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={300}>
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-text-primary">
                  Tier 3: Dark Horses
                </h2>
                <Badge variant="secondary">
                  {power25.filter((t) => t.tier === 'sleeper').length} Teams
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {power25
                  .filter((t) => t.tier === 'sleeper')
                  .map((team) => (
                    <Card key={team.rank} padding="sm" className={tierColors.sleeper}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-lg font-bold text-blue-500">
                          #{team.rank}
                        </span>
                        <span className="font-bold text-text-primary text-sm">{team.name}</span>
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {team.conference} · {team.record2025}
                      </div>
                    </Card>
                  ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tier: Bubble */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={350}>
              <div className="flex items-center gap-3 mb-6">
                <Minus className="w-6 h-6 text-text-tertiary" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-text-primary">
                  Tier 4: Bubble
                </h2>
                <Badge variant="secondary">
                  {power25.filter((t) => t.tier === 'bubble').length} Teams
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {power25
                  .filter((t) => t.tier === 'bubble')
                  .map((team) => (
                    <Card
                      key={team.rank}
                      padding="sm"
                      className={`${tierColors.bubble} ${team.isTexas ? 'ring-1 ring-burnt-orange/30' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-text-tertiary">
                          #{team.rank}
                        </span>
                        <span className="font-bold text-text-primary text-sm">{team.name}</span>
                        {team.isTexas && <MapPin className="w-3 h-3 text-burnt-orange" />}
                      </div>
                      <div className="text-xs text-text-tertiary">{team.conference}</div>
                    </Card>
                  ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Texas Focus CTA */}
        <Section padding="lg">
          <Container>
            <ScrollReveal direction="up" delay={400}>
              <Card padding="lg" className="text-center border-burnt-orange/30">
                <h2 className="font-display text-2xl font-bold uppercase tracking-display text-text-primary mb-4">
                  Texas Takes the SEC
                </h2>
                <p className="text-text-secondary mb-6 max-w-xl mx-auto">
                  For the first time ever, Texas and Texas A&M enter the same conference as the top
                  two teams in the nation. The Lone Star Rivalry just entered a new era.
                </p>
                <Link
                  href="/college-baseball/preseason/lone-star-rivalry"
                  className="inline-flex items-center px-6 py-3 bg-burnt-orange text-white font-medium rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Read: The Lone Star Rivalry Enters the SEC
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Link>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Attribution */}
        <Section padding="sm" className="pb-16">
          <Container>
            <div className="text-center text-xs text-text-tertiary">
              <p>
                Rankings based on D1Baseball 2026 Preseason Poll. Season records and postseason
                results from 2025 NCAA statistics. Tier assignments reflect Blaze Sports Intel
                analysis.
              </p>
              <p className="mt-1">Last updated: {lastUpdated} CT</p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
