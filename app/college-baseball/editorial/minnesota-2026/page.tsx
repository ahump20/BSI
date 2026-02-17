import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Minnesota Golden Gophers: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Three national titles. Zero since 1964. Minnesota is a program that once stood at the summit of college baseball and has spent six decades trying to find its way back.',
  openGraph: {
    title: 'Minnesota Golden Gophers: 2026 Season Preview',
    description:
      'Three national titles. Zero since 1964. Minnesota is a program that once stood at the summit of college baseball and has spent six decades trying to find its way back.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Minnesota',
  teamSlug: 'minnesota',
  mascot: 'Golden Gophers',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Three national titles. Zero since 1964. Minnesota is a program that once stood at the summit of college baseball — Dick Siebert\'s dynasty won it all in 1956, 1960, and 1964 — and has spent six decades trying to find its way back. Ty McDevitt is in year three of a rebuild that asks whether a cold-weather program in the modern transfer portal era can recapture even a fraction of that legacy. The answer is not yet clear, but the foundation is being poured.',

  programStats: {
    allTimeWins: '2,215',
    winPct: '.512',
    cwsAppearances: 3,
    nationalTitles: 3,
    confTitles: 18,
    cwsWins: 9,
  },

  record2025: '24-28 (10-20 Big Ten)',
  record2025Context: 'A down year in a rebuilding cycle under a young coaching staff',
  seasonStats2025: {
    teamBA: '.248',
    teamERA: '5.12',
    homeRuns: 35,
    stolenBases: 48,
    strikeouts: 365,
    opponentBA: '.275',
  },
  seasonHighlights: [
    'Won 10 Big Ten games in a difficult transition year — kept competing despite the record',
    'Brooks Lester hit .298 with 6 HR as the lineup\'s most consistent bat',
    'Sam Ireland posted a 3.65 ERA as the Friday starter, showing frontline potential',
    'Beat Michigan in a statement series win that showed the program\'s upside',
    'Freshman class showed promise — five players earned at least 20 starts',
  ],

  keyReturnees: [
    {
      name: 'Brooks Lester',
      position: 'OF',
      year: 'Sr.',
      stats: '.298/.378/.445, 6 HR, 38 RBI',
      bio: 'The lineup\'s steadiest hitter. Patient approach, gap-to-gap power, and the kind of veteran presence a young team needs. Lester does not chase and rarely expands the zone.',
    },
    {
      name: 'Sam Ireland',
      position: 'RHP',
      year: 'Jr.',
      stats: '4-7, 3.65 ERA, 68 K',
      bio: 'Friday starter with a four-seam fastball that sits 91-93 and a curveball that can be plus. The record does not reflect the quality of his outings — run support was scarce.',
    },
    {
      name: 'Charlie Rudd',
      position: '2B',
      year: 'So.',
      stats: '.265/.342/.365, 3 HR, 22 SB',
      bio: 'Quick-twitch middle infielder with elite speed. His stolen base numbers led the team as a freshman. The bat is still developing, but the athleticism is evident on every play.',
    },
    {
      name: 'Jake Duer',
      position: 'RHP',
      year: 'So.',
      stats: '4.22 ERA, 45 K, 53 IP',
      bio: 'Sophomore arm with a power sinker and developing breaking ball. Pitched in multiple roles — starter, long relief — and showed he could handle innings. The consistency needs to come.',
    },
    {
      name: 'Aaron Grinstead',
      position: '1B',
      year: 'Jr.',
      stats: '.252/.338/.425, 7 HR',
      bio: 'Physical first baseman with the most raw power on the roster. Swing-and-miss concerns limit the average, but when he connects, the ball leaves. A refining year could unlock a 15-homer season.',
    },
  ],

  transferAdditions: [
    {
      name: 'Nolan Becker',
      position: 'SS',
      year: 'Jr.',
      fromSchool: 'Iowa',
      stats: '.272/.348/.395, 4 HR, 15 SB',
      bio: 'Defensive-first shortstop who brings Big Ten experience and a reliable glove. His on-base ability from the left side adds lineup balance.',
    },
    {
      name: 'Parker Mullenbach',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Nebraska',
      stats: '3.85 ERA, 58 K, 62 IP',
      bio: 'Minnesota native coming home. Left-handed starter with a changeup that neutralizes right-handed lineups. Fills a critical rotation void.',
    },
    {
      name: 'Drew Berkland',
      position: 'OF/DH',
      year: 'R-Sr.',
      fromSchool: 'North Dakota State',
      stats: '.315/.402/.512, 11 HR',
      bio: 'Summit League Player of the Year candidate with legitimate power. The conference jump is real, but the bat speed and approach suggest he can handle Big Ten pitching.',
    },
    {
      name: 'Ty Saunders',
      position: 'RHP',
      year: 'So.',
      fromSchool: 'Creighton',
      stats: '3.48 ERA, 42 K, 36 IP',
      bio: 'Young arm with a lively fastball and sharp slider. Left Creighton looking for a bigger role and should get it immediately in Minnesota\'s thin bullpen.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Sam Ireland (4-7, 3.65 ERA) is the Friday arm and the staff\'s identity. He has the stuff to pitch in the top half of the Big Ten rotation — the challenge is a team that cannot afford to waste his good starts with a lack of run support. Every Ireland outing matters because the margin is zero.',
    rotation:
      'Parker Mullenbach (from Nebraska, 3.85 ERA) gives McDevitt a left-handed Saturday starter he did not have in 2025. Jake Duer (4.22 ERA) is the Sunday option, though his role may fluctuate between starting and long relief depending on how the freshmen develop. The rotation is functional but not deep.',
    depth:
      'The bullpen was the Achilles heel in 2025 — a 5.85 ERA in relief tells the story. Ty Saunders (from Creighton, 3.48 ERA) adds a high-leverage arm. But Minnesota needs at least two more reliable relievers to emerge from the young arms. McDevitt is building a pitching culture, and the returns will come slowly.',
  },

  lineupAnalysis: {
    engine:
      'Brooks Lester (.298, 6 HR) is the table-setter and the one hitter who consistently produces quality at-bats. His plate discipline sets the tone for a lineup that too often chased in 2025.',
    middle:
      'Aaron Grinstead (.252, 7 HR) has the power to anchor the middle of the order if the contact rate improves. Drew Berkland (from NDSU, .315, 11 HR) is the highest-upside addition — a power bat who can legitimize the 4-hole. The middle of the lineup has more potential than it did a year ago.',
    supportingCast:
      'Charlie Rudd (.265, 22 SB) adds speed at the top or bottom of the order. Nolan Becker (from Iowa, .272, 15 SB) gives McDevitt another on-base threat. The lineup will not overwhelm anyone, but it should manufacture more runs than the 2025 version — which posted a team .248 average that was among the worst in the Big Ten.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Wichita State', location: 'Neutral', notes: 'Season Opener in round-robin tournament' },
    { dates: 'Feb 27-Mar 1', opponent: 'UC Santa Barbara', location: 'Away', notes: 'West Coast road swing' },
    { dates: 'Mar 7-9', opponent: 'Dallas Baptist', location: 'Neutral', notes: 'Mid-major test at neutral site' },
    { dates: 'Mar 20-22', opponent: 'Purdue', location: 'Home', notes: 'Big Ten Opener at Siebert Field' },
    { dates: 'Apr 3-5', opponent: 'Michigan', location: 'Away', notes: 'Road series at Ray Fisher Stadium' },
    { dates: 'Apr 10-12', opponent: 'Iowa', location: 'Home', notes: 'Border rivalry series' },
    { dates: 'Apr 17-19', opponent: 'Nebraska', location: 'Away', notes: 'Road trip to Lincoln' },
    { dates: 'May 1-3', opponent: 'Penn State', location: 'Home', notes: 'Late-season home series' },
    { dates: 'May 8-10', opponent: 'Michigan State', location: 'Home', notes: 'Home series with bubble implications' },
    { dates: 'May 15-17', opponent: 'Ohio State', location: 'Away', notes: 'Season finale in Columbus' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 40 },
    { category: 'Rotation', grade: 45 },
    { category: 'Bullpen', grade: 35 },
    { category: 'Defense', grade: 45 },
    { category: 'Speed/Baserunning', grade: 50 },
    { category: 'Coaching', grade: 50 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'Minnesota is a program with a Hall of Fame past and a present that demands patience. McDevitt is in year three, and the trajectory is visible even if the wins are not. Ireland gives the Gophers a legitimate Friday starter. Lester provides a veteran bat. The portal additions — Mullenbach, Berkland, Becker — add the kind of experience the roster lacked. But the bullpen is thin, the lineup has holes, and the Big Ten does not grade on a curve. This is a 27-to-30-win team that will be competitive in more series than the record suggests. The rebuild is not a one-year fix — it is a three-to-four-year arc, and McDevitt is in the middle of it.',

  relatedLinks: [
    { label: 'Minnesota Team Page', href: '/college-baseball/teams/minnesota' },
  ],
};

export default function Minnesota2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
