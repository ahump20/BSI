import type { Metadata } from 'next';
import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

export const metadata: Metadata = {
  title: 'Oklahoma Sooners 2026 Season Preview | Blaze Sports Intel',
  description: 'Oklahoma Sooners 2026 college baseball season preview. Roster breakdown, pitching staff analysis, key players, and predictions for the SEC season.',
  openGraph: {
    title: 'Oklahoma Sooners — 2026 Season Preview | BSI',
    description: 'Full scouting report on the Oklahoma Sooners heading into the 2026 college baseball season.',
    type: 'article',
  },
};

const data: TeamPreviewData = {
  teamName: 'Oklahoma',
  teamSlug: 'oklahoma',
  mascot: 'Sooners',
  badgeText: 'SEC Debut Preview',
  date: 'February 13, 2026',
  readTime: '11 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'The Sooners enter the SEC. Skip Johnson has built a 40-win program with elite pitching and enough offense to compete. The jump from the Big 12 to the best conference in college baseball will test every part of the roster — and the schedule offers no grace period.',

  programStats: {
    allTimeWins: '2,987',
    winPct: '.601',
    cwsAppearances: 10,
    nationalTitles: 2,
    confTitles: 14,
    cwsWins: 18,
  },

  record2025: '40-21',
  record2025Context: 'Regional — strong finish to the Big 12 era',
  seasonStats2025: {
    teamBA: '.272',
    teamERA: '3.65',
    homeRuns: 71,
    stolenBases: 68,
    strikeouts: 508,
    opponentBA: '.235',
  },
  seasonHighlights: [
    'Won 40 games in the final Big 12 season',
    'Cade Horton: 9-2, 2.78 ERA with 118 strikeouts — Big 12 Pitcher of the Year',
    'Dakota Harris hit .318 with 22 stolen bases from center field',
    'Jackson Nicklaus provided middle-of-the-order power with 14 HR',
    'Hosted a Regional for the first time since 2022',
  ],

  keyReturnees: [
    {
      name: 'Cade Horton',
      position: 'RHP',
      year: 'Jr.',
      stats: '9-2, 2.78 ERA, 118 K',
      bio: 'Big 12 Pitcher of the Year. Mid-90s fastball with a devastating slider. The ace Oklahoma needs to compete in the SEC from day one.',
    },
    {
      name: 'Dakota Harris',
      position: 'OF',
      year: 'Jr.',
      stats: '.318/.402/.435, 5 HR, 22 SB',
      bio: 'Elite speed and defensive range in center field. Sets the table at the top of the lineup with a professional approach.',
    },
    {
      name: 'Jackson Nicklaus',
      position: '1B',
      year: 'Jr.',
      stats: '.282/.368/.498, 14 HR',
      bio: 'Power bat at first base. Drives the ball to all fields and provides the lineup anchor Oklahoma needs.',
    },
    {
      name: 'Anthony Mackenzie',
      position: 'SS',
      year: 'Sr.',
      stats: '.275/.352/.398, 6 HR',
      bio: 'Steady shortstop with improving offense. His defensive consistency anchors the infield.',
    },
    {
      name: 'Luke Savage',
      position: 'LHP',
      year: 'Jr.',
      stats: '3.42 ERA, 82 K, 65 IP',
      bio: 'Left-handed starter with improving command. Saturday arm who has the stuff to match up against SEC lineups.',
    },
  ],

  transferAdditions: [
    {
      name: 'Cayden Wallace',
      position: '3B',
      year: 'R-Sr.',
      fromSchool: 'Arkansas',
      stats: '.289/.371/.478, 10 HR',
      bio: 'SEC-experienced bat from Fayetteville. Knows the conference and adds immediate lineup depth.',
    },
    {
      name: 'Ryan Cusick',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Wake Forest',
      stats: '3.12 ERA, 72 K',
      bio: 'Power arm from the CWS runner-up. Adds bullpen depth with SEC-caliber velocity.',
    },
    {
      name: 'Brett Squires',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'Texas Tech',
      stats: '.278/.362/.412, 6 HR',
      bio: 'Versatile infielder from a Big 12 contender. Adds defensive flexibility and a reliable bat.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Cade Horton (9-2, 2.78 ERA, 118 K) is the ace. Big 12 Pitcher of the Year with mid-90s stuff and a wipeout slider. The question is not whether he can pitch in the SEC — it is whether the arms behind him can hold the line against the deepest lineups in the country.',
    rotation:
      'Luke Savage (3.42 ERA) has the stuff for a Saturday start but needs to prove it against SEC bats. The Sunday spot is a competition — Ryan Cusick (from Wake Forest, 3.12 ERA) could push into the rotation or lock down the late innings. Johnson needs two of the three to deliver consistently.',
    depth:
      'The bullpen was the strength of the Big 12 run. The returning relievers throw strikes and avoid walks. Cusick adds a power arm from a CWS-caliber program. The depth should hold — but the margin for error in the SEC is razor-thin.',
  },

  lineupAnalysis: {
    engine:
      'Dakota Harris (.318, 22 SB) is the tone-setter. His speed at the top of the lineup puts immediate pressure on SEC pitchers, and his .402 on-base percentage means he gets there often. He is the kind of catalyst who turns singles into doubles and walks into scoring threats.',
    middle:
      'Jackson Nicklaus (.282, 14 HR) provides the power. Cayden Wallace (from Arkansas, .289, 10 HR) adds SEC-experienced production at third base. Together they give Oklahoma a middle of the order that can compete — though it lacks the depth of the SEC elite.',
    supportingCast:
      'Anthony Mackenzie (.275, 6 HR) is steady at short. Brett Squires (from Texas Tech) adds contact depth. The lineup will need to manufacture runs — the SEC will not let Oklahoma slug its way through conference play. Small ball, speed, and discipline will define how they compete.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Central Michigan', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Dallas Baptist', location: 'Neutral', notes: '' },
    { dates: 'Mar 7-9', opponent: 'Arkansas', location: 'Home', notes: '' },
    { dates: 'Mar 14-16', opponent: 'Auburn', location: 'Away', notes: 'SEC Debut' },
    { dates: 'Mar 26-28', opponent: 'Texas', location: 'Away', notes: 'Red River Rivalry' },
    { dates: 'Apr 4-6', opponent: 'Mississippi State', location: 'Home', notes: '' },
    { dates: 'Apr 18-20', opponent: 'South Carolina', location: 'Away', notes: '' },
    { dates: 'Apr 25-27', opponent: 'Alabama', location: 'Home', notes: '' },
    { dates: 'May 2-4', opponent: 'Missouri', location: 'Away', notes: '' },
    { dates: 'May 9-11', opponent: 'Ole Miss', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 60 },
    { category: 'Bullpen', grade: 55 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 65 },
    { category: 'Coaching', grade: 65 },
    { category: 'Schedule Difficulty', grade: 75 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'Oklahoma enters the SEC with a proven ace, a legitimate leadoff hitter, and the kind of pitching depth that kept them competitive in the Big 12. The jump to the SEC is real — the lineups are deeper, the arms are better, and the margin for error disappears. But Skip Johnson has built 40-win programs before, and the portal additions bring SEC experience. The Sooners are not here to survive the transition. They are here to compete.',

  relatedLinks: [
    { label: 'Oklahoma Team Page', href: '/college-baseball/teams/oklahoma' },
  ],
};

export default function Oklahoma2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
