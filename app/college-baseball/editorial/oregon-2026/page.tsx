import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oregon Ducks: 2026 Season Preview | Blaze Sports Intel',
  description:
    "Oregon shared the Big Ten title in 2025, won 42 games, and established themselves as a legitimate national power under Mark Wasikowski. The Ducks enter 2026 with a deep roster.",
  openGraph: {
    title: 'Oregon Ducks: 2026 Season Preview',
    description:
      "Oregon shared the Big Ten title in 2025, won 42 games, and established themselves as a legitimate national power under Mark Wasikowski. The Ducks enter 2026 with a deep roster.",
  },
};

const data: TeamPreviewData = {
  teamName: 'Oregon',
  teamSlug: 'oregon',
  mascot: 'Ducks',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Oregon shared the Big Ten title in 2025, won 42 games, and established themselves as a legitimate national power under Mark Wasikowski. The Ducks enter 2026 with a deep roster, a loaded rotation, and the belief that comes from a conference championship.',

  programStats: {
    allTimeWins: '1,912',
    winPct: '.548',
    cwsAppearances: 4,
    nationalTitles: 0,
    confTitles: 5,
    cwsWins: 6,
  },

  record2025: '42-16 (22-8 Big Ten)',
  record2025Context: 'Big Ten co-champions, program-best conference record',
  seasonStats2025: {
    teamBA: '.282',
    teamERA: '3.52',
    homeRuns: 78,
    stolenBases: 97,
    strikeouts: 521,
    opponentBA: '.228',
  },
  seasonHighlights: [
    'Won Big Ten co-championship (shared with UCLA) — first conference title since 2015 Pac-12 crown',
    '42 wins tied second-highest total in program history',
    'Led the Big Ten in stolen bases (97) — fastest team in the league',
    'Three pitchers earned All-Big Ten honors',
    'Hosted a regional for the second consecutive year',
  ],

  keyReturnees: [
    {
      name: 'Bryce Boettcher',
      position: 'C/DH',
      year: 'Sr.',
      stats: '.321/.411/.534, 16 HR, 62 RBI',
      bio: 'Lake Oswego product. Oregon\'s best power hitter and emotional leader. Drafted but returned for a shot at Omaha. Can catch or DH.',
    },
    {
      name: 'Jacob Walsh',
      position: 'OF',
      year: 'Jr.',
      stats: '.308/.395/.467, 8 HR, 34 SB',
      bio: 'Chandler, AZ product. Elite speed with a compact swing. 34 stolen bases made him the Big Ten\'s most dangerous baserunner.',
    },
    {
      name: 'Colby Shade',
      position: 'SS',
      year: 'Sr.',
      stats: '.289/.378/.445, 10 HR',
      bio: 'Dallas native. Two-way threat at shortstop with rangey defense and sneaky pop. Quietly one of the best players in the Big Ten.',
    },
    {
      name: 'RJ Gordon',
      position: 'LHP',
      year: 'Jr.',
      stats: '10-2, 2.89 ERA, 108 K in 93.1 IP',
      bio: 'Portland product. Friday night ace with a devastating curveball. Double-digit wins and a sub-3.00 ERA against a Big Ten schedule that included UCLA twice.',
    },
    {
      name: 'Matt Dallas',
      position: 'RHP',
      year: 'Sr.',
      stats: '7-3, 3.41 ERA, 89 K in 79 IP',
      bio: 'Grants Pass native. Veteran right-hander who commands four pitches. Dependable Saturday starter who rarely beats himself.',
    },
    {
      name: 'Kenyon Yovan',
      position: 'RHP',
      year: 'Jr.',
      stats: '2.12 ERA, 11 SV, 58 K in 46.2 IP',
      bio: 'Corvallis product — yes, from the other side of the state rivalry. Electric arm with a plus slider. 11 saves as the closer.',
    },
  ],

  transferAdditions: [
    {
      name: 'Mason Neville',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'Oregon State',
      stats: '.291/.367/.448, 7 HR',
      bio: 'In-state transfer from the rival Beavers. Versatile infielder who can play second or third. Knows the Pac-12/Big Ten crossover culture.',
    },
    {
      name: 'Tyler Flores',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Arizona State',
      stats: '3.67 ERA, 71 K in 58.2 IP',
      bio: 'Desert arm who adds rotation depth. Could slot in as the Sunday starter or serve as a long-relief bridge.',
    },
    {
      name: 'Jaylen Thompson',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'San Diego',
      stats: '.314/.398/.487, 9 HR',
      bio: 'West Coast Conference Player of the Year candidate. Left-handed bat with power and a plus arm in right field.',
    },
    {
      name: 'Danny Serretti',
      position: 'INF',
      year: 'Gr.',
      fromSchool: 'North Carolina',
      stats: '.276/.358/.401',
      bio: 'ACC veteran who adds experience and defensive versatility. Has played in Omaha. Knows what the moment feels like.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'RJ Gordon is a legitimate ace — 10-2 with a 2.89 ERA and 108 strikeouts against a conference schedule that included UCLA, USC, and Michigan. His curveball is the best breaking ball in the Big Ten. With Kenyon Yovan (2.12 ERA, 11 saves) slamming the door, Oregon can shorten games the way championship teams do.',
    rotation:
      'Gordon on Fridays, Matt Dallas (3.41 ERA, 89 K) on Saturdays, and Tyler Flores (from Arizona State) as the leading Sunday candidate. Dallas is the kind of steady, four-pitch arm who keeps Oregon in every game he starts. Flores gives Wasikowski a proven arm who has pitched in high-pressure Pac-12 environments.',
    depth:
      'Yovan in the ninth is an automatic save. The middle relief corps returns three arms with sub-3.50 ERAs. Oregon does not need to ride its starters deep — they have enough bullpen depth to go to the pen in the sixth inning and still feel confident. That depth is what separated the Ducks from the rest of the Big Ten in 2025.',
  },

  lineupAnalysis: {
    engine:
      'Bryce Boettcher (.321/.411/.534, 16 HR) is the engine and the identity. He returned when he could have signed professionally. That decision reverberates through the dugout. Boettcher is a middle-of-the-order force who can change a game with one swing.',
    middle:
      'Colby Shade (.289/.378/.445, 10 HR) and Jacob Walsh (.308/.395/.467, 8 HR, 34 SB) give Oregon a shortstop-outfielder combination that can beat you multiple ways — power, speed, on-base. Walsh\'s 34 stolen bases put constant pressure on opposing pitchers and catchers.',
    supportingCast:
      'Jaylen Thompson (from San Diego, .314/.398/.487) adds a left-handed power bat to the outfield mix. Mason Neville (from Oregon State) provides infield depth. Danny Serretti (from North Carolina) brings Omaha experience. This lineup can manufacture runs when the bats go cold and slug when it is hot.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Gonzaga', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Long Beach State', location: 'Away', notes: '' },
    { dates: 'Mar 6-8', opponent: 'Oregon State', location: 'Home', notes: 'Civil War rivalry' },
    { dates: 'Mar 13-15', opponent: 'UCLA', location: 'Away', notes: 'Big Ten Opener — title rematch' },
    { dates: 'Mar 27-29', opponent: 'Michigan', location: 'Home', notes: 'Big Ten marquee' },
    { dates: 'Apr 3-5', opponent: 'USC', location: 'Away', notes: 'West Coast Big Ten showdown' },
    { dates: 'Apr 17-19', opponent: 'Iowa', location: 'Home', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Indiana', location: 'Away', notes: '' },
    { dates: 'May 8-10', opponent: 'Illinois', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'UCLA', location: 'Home', notes: 'Regular season finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 65 },
    { category: 'Rotation', grade: 70 },
    { category: 'Bullpen', grade: 65 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 70 },
    { category: 'Coaching', grade: 60 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Contender',
  projectionText:
    'Oregon proved in 2025 that the co-championship was not a fluke — they were the best team in the Big Ten for stretches of the season and matched UCLA step for step. The Ducks return their ace, their closer, and their best hitter. Boettcher coming back when he could have gone pro is the kind of decision that changes a program\'s ceiling. The question is whether the rotation beyond Gordon and Dallas can hold, and whether the portal bats integrate quickly enough. If both answers are yes, Oregon is an Omaha team. If one breaks down, they are a super regional team. Either way, they are a legitimate threat.',

  relatedLinks: [
    { label: 'Oregon Team Page', href: '/college-baseball/teams/oregon' },
  ],
};

export default function Oregon2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
