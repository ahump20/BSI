import type { Metadata } from 'next';
import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

export const metadata: Metadata = {
  title: 'LSU Tigers 2026 Season Preview | Blaze Sports Intel',
  description: 'LSU Tigers 2026 college baseball season preview. Roster breakdown, pitching staff analysis, key players, and predictions for the SEC season.',
  openGraph: {
    title: 'LSU Tigers — 2026 Season Preview | BSI',
    description: 'Full scouting report on the LSU Tigers heading into the 2026 college baseball season.',
    type: 'article',
  },
};

const data: TeamPreviewData = {
  teamName: 'LSU',
  teamSlug: 'lsu',
  mascot: 'Tigers',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '14 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Defending national champions. 7 titles, 20 College World Series appearances, and a tradition that demands excellence. Jay Johnson lost key pieces but reloaded through the portal and the pipeline. The banner hangs in Alex Box — now they chase another one.',

  programStats: {
    allTimeWins: '3,654',
    winPct: '.672',
    cwsAppearances: 20,
    nationalTitles: 7,
    confTitles: 18,
    cwsWins: 57,
  },

  record2025: '52-17',
  record2025Context: 'National Champions — seventh title in program history',
  seasonStats2025: {
    teamBA: '.283',
    teamERA: '3.55',
    homeRuns: 102,
    stolenBases: 74,
    strikeouts: 548,
    opponentBA: '.225',
  },
  seasonHighlights: [
    'Won the 2025 national championship — seventh in program history',
    'Tommy White: .338, 24 HR, 78 RBI — CWS Most Outstanding Player',
    'Paul Skenes drafted #1 overall, then returned for the title run',
    'Set a program record with 102 home runs in a season',
    'Tre\' Morgan: .321 average, Gold Glove-caliber defense at first base',
  ],

  keyReturnees: [
    {
      name: 'Tommy White',
      position: '3B',
      year: 'Sr.',
      stats: '.338/.432/.634, 24 HR, 78 RBI',
      bio: 'CWS Most Outstanding Player. The Big Bat from St. Pete. Returns to Baton Rouge chasing a second ring and a top-5 draft selection.',
    },
    {
      name: 'Tre\' Morgan',
      position: '1B',
      year: 'Sr.',
      stats: '.321/.408/.478, 8 HR',
      bio: 'Gold Glove-caliber first baseman from New Orleans. Pure hitter with gap power who anchors the left side of the lineup.',
    },
    {
      name: 'Griffin Herring',
      position: 'RHP',
      year: 'Jr.',
      stats: '2.72 ERA, 89 K, 62 IP',
      bio: 'Emerged as the closer in the postseason. Power arm with a devastating slider. Converted every save opportunity in Omaha.',
    },
    {
      name: 'Thatcher Hurd',
      position: 'RHP',
      year: 'Jr.',
      stats: '3.48 ERA, 102 K, 88 IP',
      bio: 'Strike-throwing right-hander who carved up SEC lineups. Commands four pitches and competes in every at-bat.',
    },
    {
      name: 'Jared Jones',
      position: 'OF',
      year: 'Jr.',
      stats: '.296/.378/.451, 9 HR, 28 SB',
      bio: 'Five-tool outfielder with game-changing speed. Covers center field and provides top-of-the-order spark.',
    },
    {
      name: 'Hayden Travinski',
      position: 'C',
      year: 'R-Sr.',
      stats: '.268/.358/.438, 11 HR',
      bio: 'Veteran backstop who handled the championship pitching staff. Calls a great game and provides middle-of-the-order power.',
    },
  ],

  transferAdditions: [
    {
      name: 'Cade Doughty',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'Texas A&M',
      stats: '.295/.370/.465, 10 HR',
      bio: 'Louisiana native comes home. Versatile infielder with pop who adds depth at second base and shortstop.',
    },
    {
      name: 'Rhett Lowder',
      position: 'LHP',
      year: 'R-Sr.',
      fromSchool: 'Wake Forest',
      stats: '2.85 ERA, 118 K',
      bio: 'Experienced left-hander from the CWS runner-up. Immediately slots into the weekend rotation behind Hurd.',
    },
    {
      name: 'Nathan Martorella',
      position: '1B/DH',
      year: 'R-Sr.',
      fromSchool: 'Cal',
      stats: '.311/.405/.524, 14 HR',
      bio: 'Elite left-handed bat who can DH or spell Morgan at first. Professional approach at the plate.',
    },
    {
      name: 'Mason Neville',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Ole Miss',
      stats: '3.12 ERA, 72 K',
      bio: 'SEC-tested arm from Oxford. Adds bullpen depth with mid-90s velocity.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Griffin Herring converted every save opportunity in Omaha. The closer with the devastating slider returns as the lockdown ninth-inning arm in the SEC. When the game reaches the eighth, opposing lineups know they have two innings to score — or it is over.',
    rotation:
      'Thatcher Hurd (3.48 ERA, 102 K) takes the Friday ball. He commands four pitches and competes in every at-bat. Rhett Lowder (from Wake Forest, 2.85 ERA) gives Jay Johnson a proven Saturday starter with CWS finals experience. The Sunday spot is open — but with the arms in this program, it will not stay open long.',
    depth:
      'Mason Neville (from Ole Miss) adds SEC-tested bullpen depth. The returning relievers carried a combined 3.20 ERA in postseason play. Johnson has built the deepest bullpen in the conference — the kind of depth that lets you match up in elimination games. That depth won a national title last June.',
  },

  lineupAnalysis: {
    engine:
      'Tommy White (.338, 24 HR, 78 RBI) is the most dangerous hitter in college baseball. The CWS Most Outstanding Player has a 70 raw power grade and an approach that gets better in big moments. He drives everything hard, hits to all fields, and makes pitchers pay for mistakes.',
    middle:
      'Tre\' Morgan (.321, 8 HR) gives LSU a second elite bat from the left side. Jared Jones (.296, 9 HR, 28 SB) provides speed-power combination at the top of the order. Hayden Travinski (.268, 11 HR) has pop from the catcher spot. Nathan Martorella (from Cal, .311, 14 HR) adds left-handed depth off the bench or at DH.',
    supportingCast:
      'Cade Doughty (from Texas A&M) fills the infield void. Jones covers center with elite range and can steal a base any time he reaches. The bottom of the order at LSU is better than the top of most SEC lineups. This is not a team that relies on one swing — it is a lineup that wears pitchers down over nine innings.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Western Carolina', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Wichita State', location: 'Neutral', notes: 'Round Rock Classic' },
    { dates: 'Mar 7-9', opponent: 'Tulane', location: 'Away', notes: 'In-state Rivalry' },
    { dates: 'Mar 14-16', opponent: 'South Carolina', location: 'Home', notes: 'SEC Opener' },
    { dates: 'Mar 27-29', opponent: 'Florida', location: 'Home', notes: '' },
    { dates: 'Apr 4-6', opponent: 'Texas A&M', location: 'Away', notes: '' },
    { dates: 'Apr 11-13', opponent: 'Ole Miss', location: 'Home', notes: '' },
    { dates: 'Apr 25-27', opponent: 'Tennessee', location: 'Away', notes: '' },
    { dates: 'May 2-4', opponent: 'Arkansas', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'Alabama', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 75 },
    { category: 'Rotation', grade: 70 },
    { category: 'Bullpen', grade: 75 },
    { category: 'Defense', grade: 65 },
    { category: 'Speed/Baserunning', grade: 65 },
    { category: 'Coaching', grade: 75 },
    { category: 'Schedule Difficulty', grade: 70 },
  ],

  projectionTier: 'Omaha Favorite',
  projectionText:
    'Defending national champions. Tommy White is the best hitter, Griffin Herring is the best closer, and Jay Johnson knows how to manage a roster through June. LSU lost key pieces — that is what happens when you win a title — but the portal replenished with SEC-tested arms and bats. The ceiling is another championship weekend. The floor is still a Regional host. In Baton Rouge, that floor is just the starting point.',

  relatedLinks: [
    { label: 'LSU Team Page', href: '/college-baseball/teams/lsu' },
  ],
};

export default function LSU2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
