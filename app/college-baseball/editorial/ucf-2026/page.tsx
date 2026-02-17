import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UCF Knights: 2026 Season Preview | Blaze Sports Intel',
  description:
    'UCF was the AAC\'s most consistent baseball program for the better part of a decade. Two years into the Big 12, Greg Lovelady has the Knights competitive.',
  openGraph: {
    title: 'UCF Knights: 2026 Season Preview',
    description:
      'UCF was the AAC\'s most consistent baseball program for the better part of a decade. Two years into the Big 12, Greg Lovelady has the Knights competitive.',
  },
};

const data: TeamPreviewData = {
  teamName: 'UCF',
  teamSlug: 'ucf',
  mascot: 'Knights',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'UCF was the AAC\'s most consistent baseball program for the better part of a decade. Two years into the Big 12, Greg Lovelady has the Knights competitive — 34 wins, a .500-adjacent conference record, and enough talent to push toward the postseason bubble. The recruiting pipeline from Florida\'s talent-rich high schools gives UCF an edge most Big 12 newcomers do not have.',

  programStats: {
    allTimeWins: '1,218',
    winPct: '.538',
    cwsAppearances: 1,
    nationalTitles: 0,
    confTitles: 5,
    cwsWins: 0,
  },

  record2025: '34-25 (14-16 Big 12)',
  record2025Context: 'Competitive in the Big 12 but missed the tournament',
  seasonStats2025: {
    teamBA: '.271',
    teamERA: '4.32',
    homeRuns: 58,
    stolenBases: 72,
    strikeouts: 448,
    opponentBA: '.258',
  },
  seasonHighlights: [
    'Drew Faurot hit .328 with 12 HR — named All-Big 12 Second Team',
    'Stole 72 bases as a team — most in program history',
    'Won a series at Arizona State in late March for signature Big 12 road win',
    'Jake Marshman posted a 3.08 ERA with 88 strikeouts as Friday ace',
    'Went 20-9 in non-conference play with wins over Florida, Miami, and USF',
  ],

  keyReturnees: [
    {
      name: 'Drew Faurot',
      position: 'OF',
      year: 'Sr.',
      stats: '.328/.408/.548, 12 HR, 48 RBI, 16 SB',
      bio: 'Five-tool player from the Orlando pipeline. Does everything — hits for average, hits for power, runs, and plays plus defense in center. The best player on the roster and a potential day-two draft pick.',
    },
    {
      name: 'Jake Marshman',
      position: 'RHP',
      year: 'Jr.',
      stats: '7-5, 3.08 ERA, 88 K',
      bio: 'The ace. Power fastball with a nasty slider that generates swings and misses at an elite rate. Competes deep into games and owns the Friday night slot.',
    },
    {
      name: 'Ben McCabe',
      position: 'C',
      year: 'Jr.',
      stats: '.278/.358/.412, 6 HR',
      bio: 'Strong receiver with an improving bat. Threw out 30% of base stealers and his game-calling matured significantly in Big 12 play.',
    },
    {
      name: 'Jaylen Harding',
      position: 'SS',
      year: 'Jr.',
      stats: '.268/.342/.382, 4 HR, 24 SB',
      bio: 'Electric speed at short. His defense improved throughout 2025 and his stolen-base ability puts constant pressure on opposing batteries.',
    },
    {
      name: 'Andrew Ciencin',
      position: 'LHP',
      year: 'Sr.',
      stats: '5-4, 3.78 ERA, 62 K',
      bio: 'Veteran lefty Saturday starter with command and craft. Does not overpower hitters but sequences his pitches well and limits damage.',
    },
    {
      name: 'Gabe Rub',
      position: 'RHP',
      year: 'Jr.',
      stats: '2.54 ERA, 6 SV, 42 K in 39 IP',
      bio: 'Closer with a plus slider. High-leverage arm who thrives under pressure. The late-inning anchor.',
    },
  ],

  transferAdditions: [
    {
      name: 'Chase Hardman',
      position: '3B',
      year: 'Jr.',
      fromSchool: 'Florida',
      stats: '.265/.348/.438, 8 HR',
      bio: 'SEC bat from Gainesville. Physical third baseman with plus raw power. Could be the cleanup hitter Lovelady has been looking for.',
    },
    {
      name: 'Tyler Grauer',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'USF',
      stats: '3.32 ERA, 74 K',
      bio: 'In-state arm who dominated the AAC at South Florida. Power fastball/changeup combination. Competes for the Sunday start or a high-leverage bullpen role.',
    },
    {
      name: 'Braden Ostrander',
      position: 'OF/DH',
      year: 'Jr.',
      fromSchool: 'Tennessee',
      stats: '.258/.342/.418, 5 HR',
      bio: 'SEC-experienced outfielder with left-handed pop. Knows what Big 12-caliber at-bats look like after two years in Knoxville.',
    },
    {
      name: 'Luis Torres',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Miami (FL)',
      stats: '3.18 ERA, 52 K in 48 IP',
      bio: 'Bullpen depth from the Hurricanes. Mid-90s arm with a power slider. Adds to an already solid relief corps.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Jake Marshman (7-5, 3.08 ERA, 88 K) is a Big 12 ace. His fastball/slider combination generates swings and misses at an elite rate, and he competes deep into games with an intensity that rubs off on the staff. When Marshman pitches, UCF can beat anyone in the conference. The challenge is building the same certainty on Saturday and Sunday.',
    rotation:
      'Andrew Ciencin (3.78 ERA) is a savvy lefty Saturday starter who wins with sequencing and command. Tyler Grauer (from USF, 3.32 ERA) competes for the Sunday start with a power fastball/changeup that played well in the AAC. The rotation is solid through three spots — the depth behind them is the question.',
    depth:
      'Gabe Rub (2.54 ERA, 6 SV) is the closer and the bullpen anchor. Luis Torres (from Miami, 3.18 ERA) adds a power arm in the middle innings. The pen was a strength in 2025 and should be again. If the starters can consistently go six, the bridge to Rub is manageable. This is a staff that can hold a lead.',
  },

  lineupAnalysis: {
    engine:
      'Drew Faurot (.328, 12 HR, 16 SB) is a five-tool player. He hits for average, drives the ball, steals bases, and plays elite center field defense. He is the one player in the UCF lineup who changes the game just by being in it — pitchers cannot ignore him and cannot neutralize him.',
    middle:
      'Chase Hardman (from Florida, .265, 8 HR) adds SEC power to the middle of the order. Ben McCabe (.278, 6 HR) is a catching bat that produces. The cleanup spot has more protection than last year, which should benefit Faurot and everyone around him.',
    supportingCast:
      'Jaylen Harding (.268, 24 SB) is the speed weapon at short — when he gets on base, he forces defensive attention that opens up gaps for the hitters behind him. Braden Ostrander (from Tennessee) adds a left-handed bat. UCF stole 72 bases in 2025 and the speed game should be even more potent with portal additions in the lineup.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Bethune-Cookman', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Florida', location: 'Away', notes: '' },
    { dates: 'Mar 6-8', opponent: 'Miami (FL)', location: 'Home', notes: '' },
    { dates: 'Mar 13-15', opponent: 'Baylor', location: 'Away', notes: 'Big 12 Opener' },
    { dates: 'Mar 27-29', opponent: 'Cincinnati', location: 'Home', notes: '' },
    { dates: 'Apr 3-5', opponent: 'BYU', location: 'Home', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Texas Tech', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Kansas', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Oklahoma State', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Houston', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 55 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 65 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 60 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'UCF is the Big 12 newcomer best positioned to break through. Faurot is a star, Marshman is a Friday ace, and the portal class brings SEC experience to a roster that already won 34 games. The non-conference schedule — Florida, Miami — gives them opportunities to build a tournament resume early. Lovelady has built a program that recruits well in Florida and competes at the Big 12 level. If the back of the rotation holds and the lineup depth produces, UCF is a regional team. This is the year the Knights have the roster to make it happen.',

  relatedLinks: [
    { label: 'UCF Team Page', href: '/college-baseball/teams/ucf' },
  ],
};

export default function UCF2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
