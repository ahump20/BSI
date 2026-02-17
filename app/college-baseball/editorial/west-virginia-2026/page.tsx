import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'West Virginia Mountaineers: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Randy Mazey has been at West Virginia for 14 years. He has built a program that is always competitive, occasionally dangerous, and never quite able to break through.',
  openGraph: {
    title: 'West Virginia Mountaineers: 2026 Season Preview',
    description:
      'Randy Mazey has been at West Virginia for 14 years. He has built a program that is always competitive, occasionally dangerous, and never quite able to break through.',
  },
};

const data: TeamPreviewData = {
  teamName: 'West Virginia',
  teamSlug: 'west-virginia',
  mascot: 'Mountaineers',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Randy Mazey has been at West Virginia for 14 years. He has built a program that is always competitive, occasionally dangerous, and never quite able to break through the ceiling that geography and conference strength impose. The Mountaineers play hard, recruit well in the mid-Atlantic, and make programs uncomfortable. A postseason push in 2026 requires turning close into definitive.',

  programStats: {
    allTimeWins: '1,412',
    winPct: '.502',
    cwsAppearances: 0,
    nationalTitles: 0,
    confTitles: 4,
    cwsWins: 0,
  },

  record2025: '29-27 (12-18 Big 12)',
  record2025Context: 'Competitive but unable to string together conference series wins',
  seasonStats2025: {
    teamBA: '.264',
    teamERA: '4.68',
    homeRuns: 52,
    stolenBases: 48,
    strikeouts: 434,
    opponentBA: '.268',
  },
  seasonHighlights: [
    'JJ Wetherholt\'s younger brother Grant Wetherholt hit .312 as a freshman',
    'Ben Hampton posted a 3.28 ERA with 76 strikeouts as Friday starter',
    'Swept Kansas at home in mid-April Big 12 series',
    'Took a game from Oklahoma State in Stillwater',
    'Team defense posted .972 fielding percentage — second-best in Big 12',
  ],

  keyReturnees: [
    {
      name: 'Grant Wetherholt',
      position: '2B',
      year: 'So.',
      stats: '.312/.398/.452, 6 HR, 14 SB',
      bio: 'The name carries weight in Morgantown. JJ\'s younger brother showed immediately that the talent is real — .312 as a freshman in the Big 12 with plus defense at second base. The most exciting young bat in the program.',
    },
    {
      name: 'Ben Hampton',
      position: 'RHP',
      year: 'Jr.',
      stats: '6-5, 3.28 ERA, 76 K',
      bio: 'The Friday ace. Mid-90s fastball with a sharp slider that generates chase. Competes deep into games with a bulldog mentality. The one arm on the staff who can match up with any Big 12 lineup.',
    },
    {
      name: 'Caleb McGowan',
      position: 'OF',
      year: 'Sr.',
      stats: '.284/.358/.432, 8 HR, 12 SB',
      bio: 'Athletic outfielder with a complete game — power, speed, and defensive range. Provides the middle-of-the-order production the Mountaineers need.',
    },
    {
      name: 'Tevin Tucker',
      position: 'SS',
      year: 'Jr.',
      stats: '.258/.332/.368, 4 HR, 16 SB',
      bio: 'Shortstop with speed and range who makes the routine plays and some highlight-reel ones. The bat is still developing but his defense and baserunning keep him in the lineup.',
    },
    {
      name: 'Blaine Traxel',
      position: 'RHP',
      year: 'Sr.',
      stats: '4-4, 4.12 ERA, 62 K',
      bio: 'Saturday starter with a heavy sinker and plus changeup. Generates ground balls and keeps the defense engaged. Needs to be more efficient to go deeper into starts.',
    },
    {
      name: 'Aidan Major',
      position: 'LHP',
      year: 'Jr.',
      stats: '2.68 ERA, 5 SV, 38 K in 37 IP',
      bio: 'Left-handed closer with a deceptive delivery and a swing-and-miss slider. High-leverage arm who thrives in the ninth inning.',
    },
  ],

  transferAdditions: [
    {
      name: 'Trey Yesavage',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'East Carolina',
      stats: '3.52 ERA, 68 K',
      bio: 'AAC arm with power stuff and postseason experience. Could slide into the Sunday rotation spot or set up for Major in the pen.',
    },
    {
      name: 'Braden Montgomery',
      position: 'OF/DH',
      year: 'R-Sr.',
      fromSchool: 'Texas A&M',
      stats: '.258/.348/.442, 9 HR',
      bio: 'SEC-experienced bat with legitimate power. Injury limited his time in College Station but the raw ability is undeniable. A healthy Montgomery changes the lineup ceiling.',
    },
    {
      name: 'AJ Causey',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'Virginia',
      stats: '.274/.352/.398, 5 HR',
      bio: 'ACC infielder with a polished approach at the plate. Can play third or first and adds lineup depth from the left side.',
    },
    {
      name: 'Tyler Hurst',
      position: 'C',
      year: 'Jr.',
      fromSchool: 'Liberty',
      stats: '.262/.338/.408, 6 HR',
      bio: 'Experienced catcher who threw out 32% of base stealers. His defensive leadership and catching bat upgrade the battery.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Ben Hampton (6-5, 3.28 ERA, 76 K) is a Big 12 Friday arm. Mid-90s, sharp slider, competes deep into games. When Hampton pitches, West Virginia can beat anyone in the conference. The issue has never been the Friday starter — it has been the Saturday, Sunday, and bullpen pieces around him.',
    rotation:
      'Blaine Traxel (4.12 ERA) is a reliable Saturday arm with a ground-ball approach. Trey Yesavage (from East Carolina, 3.52 ERA) competes for the Sunday start with power stuff. The rotation is deeper than 2025 — three arms who can compete in Big 12 series instead of two.',
    depth:
      'Aidan Major (2.68 ERA, 5 SV) is the closer and the bullpen anchor. His left-handed slider is unhittable when he commands it. The middle innings are the concern — if starters can consistently go six, Major and a bridge arm can handle the rest. The depth is improved but still thin by Big 12 standards.',
  },

  lineupAnalysis: {
    engine:
      'Grant Wetherholt (.312, 6 HR, 14 SB) is the engine. As a freshman he showed the same competitive fire his brother brought to Morgantown — he hits, he runs, he competes. His sophomore year should be a breakout. If Wetherholt takes the next step, the entire lineup elevation changes.',
    middle:
      'Braden Montgomery (from Texas A&M, .258, 9 HR) adds SEC power to the middle of the order — when healthy. Caleb McGowan (.284, 8 HR) provides steady production. The three-four-five is improved, but Montgomery\'s health is the wildcard that determines whether this is a good lineup or a dangerous one.',
    supportingCast:
      'Tevin Tucker (.258, 16 SB) is the speed element at short. AJ Causey (from Virginia, .274) adds a left-handed bat. Tyler Hurst (from Liberty, .262, 6 HR) gives the catching position more pop. The lineup is deeper than 2025 and more versatile — Mazey can construct it multiple ways.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Youngstown State', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Coastal Carolina', location: 'Neutral', notes: '' },
    { dates: 'Mar 6-8', opponent: 'Marshall', location: 'Home', notes: 'In-State Rivalry' },
    { dates: 'Mar 13-15', opponent: 'Kansas State', location: 'Away', notes: 'Big 12 Opener' },
    { dates: 'Mar 27-29', opponent: 'Utah', location: 'Home', notes: '' },
    { dates: 'Apr 3-5', opponent: 'TCU', location: 'Away', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Cincinnati', location: 'Home', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Arizona', location: 'Away', notes: '' },
    { dates: 'May 1-3', opponent: 'BYU', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Oklahoma State', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 50 },
    { category: 'Rotation', grade: 50 },
    { category: 'Bullpen', grade: 50 },
    { category: 'Defense', grade: 55 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'West Virginia has the pieces for a postseason push — a Friday ace in Hampton, a breakout sophomore in Wetherholt, a closer in Major, and portal additions that bring power-conference experience. The question Mazey has to answer in Year 14 is whether the program has the depth to sustain a Big 12 weekend. If Montgomery stays healthy and Wetherholt takes the sophomore leap, this lineup is dangerous. If the back of the rotation holds, the Mountaineers can push into the upper half of the Big 12 and make a case for a regional. The talent is there. The consistency has to follow.',

  relatedLinks: [
    { label: 'West Virginia Team Page', href: '/college-baseball/teams/west-virginia' },
  ],
};

export default function WestVirginia2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
