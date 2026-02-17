import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Utah Utes: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Utah relaunched its baseball program in 2024 after a 15-year hiatus. Two seasons in, the Utes are exactly where you would expect — overmatched in conference play, competitive in flashes.',
  openGraph: {
    title: 'Utah Utes: 2026 Season Preview',
    description:
      'Utah relaunched its baseball program in 2024 after a 15-year hiatus. Two seasons in, the Utes are exactly where you would expect — overmatched in conference play, competitive in flashes.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Utah',
  teamSlug: 'utah',
  mascot: 'Utes',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Utah relaunched its baseball program in 2024 after a 15-year hiatus. Two seasons in, the Utes are exactly where you would expect — overmatched in conference play, competitive in flashes, and building the infrastructure a program needs before it can build a roster. Gary Henderson\'s job is not to win the Big 12. It is to make Utah a place college baseball players want to come.',

  programStats: {
    allTimeWins: '312',
    winPct: '.412',
    cwsAppearances: 0,
    nationalTitles: 0,
    confTitles: 0,
    cwsWins: 0,
  },

  record2025: '22-33 (6-24 Big 12)',
  record2025Context: 'Tough Year 2 — learning the Big 12 the hard way',
  seasonStats2025: {
    teamBA: '.242',
    teamERA: '5.84',
    homeRuns: 32,
    stolenBases: 38,
    strikeouts: 352,
    opponentBA: '.292',
  },
  seasonHighlights: [
    'Won 6 Big 12 conference games — doubled the Year 1 total of 3',
    'Landon Frei hit .298 with 7 HR as the breakout offensive performer',
    'Took a game from Texas Tech in Lubbock in mid-April',
    'Chad Callahan posted a 3.94 ERA as the Friday starter — best on staff by a full run',
    'Team drew 148 walks — improved plate discipline from Year 1',
  ],

  keyReturnees: [
    {
      name: 'Landon Frei',
      position: '1B/DH',
      year: 'Jr.',
      stats: '.298/.372/.468, 7 HR, 34 RBI',
      bio: 'Local product from Orem who has become the face of Utah baseball. Hit .298 in the Big 12 as a sophomore — the one bat in the lineup that commands respect. He is the foundation the program is being built around.',
    },
    {
      name: 'Chad Callahan',
      position: 'RHP',
      year: 'Jr.',
      stats: '4-8, 3.94 ERA, 64 K',
      bio: 'Friday starter with a heavy sinker and improving slider. His ERA was a full run better than the team average in 2025. Competes hard and gives Utah a chance every time he takes the mound.',
    },
    {
      name: 'Maddux Meier',
      position: 'OF',
      year: 'So.',
      stats: '.252/.328/.348, 3 HR, 12 SB',
      bio: 'Athletic freshman who showed he could handle Big 12 speed. Needs to get stronger but the tools are real — speed, defensive range, and a developing bat.',
    },
    {
      name: 'Bryson Harper',
      position: 'SS',
      year: 'So.',
      stats: '.238/.312/.322, 2 HR',
      bio: 'Young shortstop still finding his way offensively. His defense is ahead of his bat — strong arm, good range, reliable hands. The offense will come if he stays healthy.',
    },
    {
      name: 'Kai Alveraz',
      position: 'LHP',
      year: 'Jr.',
      stats: '2-6, 4.72 ERA, 48 K',
      bio: 'Left-handed starter with a deceptive delivery. Competed well in spots but could not sustain it over full starts. A bullpen move might unlock his best stuff.',
    },
  ],

  transferAdditions: [
    {
      name: 'Dylan Delvecchio',
      position: 'C',
      year: 'Jr.',
      fromSchool: 'Arizona',
      stats: '.254/.338/.388, 4 HR',
      bio: 'Pac-12 catcher with strong defensive skills and a mature approach at the plate. Immediately upgrades the battery and brings experience from a winning program.',
    },
    {
      name: 'Tanner Propst',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'BYU',
      stats: '3.68 ERA, 52 K',
      bio: 'In-state rival transfer who knows the Big 12 landscape. Experienced arm who can start on Saturday or anchor the bullpen.',
    },
    {
      name: 'Kade Kern',
      position: 'OF',
      year: 'R-Sr.',
      fromSchool: 'Ohio State',
      stats: '.272/.348/.418, 6 HR',
      bio: 'Big Ten outfielder with a mature approach and gap power. Adds a veteran bat to a young lineup that desperately needs experience.',
    },
    {
      name: 'Marco Navarro',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'UNLV',
      stats: '.281/.352/.402, 5 HR',
      bio: 'Mountain West infielder with solid contact skills and defensive versatility. Can play second or third and adds depth to a thin roster.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Chad Callahan (4-8, 3.94 ERA, 64 K) is a Friday starter who competes above his roster. His heavy sinker generates ground balls and his slider is improving. The 4-8 record reflects run support, not his performance — Callahan was the one starter who consistently kept Utah in games. The question is not whether he can pitch in the Big 12. It is whether anyone behind him can.',
    rotation:
      'Kai Alveraz (4.72 ERA) has stuff but could not sustain it over starts. Henderson may move him to the bullpen and use Tanner Propst (from BYU, 3.68 ERA) as the Saturday starter. The Sunday spot is an open competition between returning sophomores and incoming freshmen. This is a rotation still being assembled.',
    depth:
      'The bullpen allowed a .292 opponent batting average in 2025 — that number has to shrink. Propst can start or relieve. Alveraz may be more effective in short bursts. But the honest assessment is that Utah does not yet have the bullpen depth to compete in extended Big 12 series. The margin for error is almost zero.',
  },

  lineupAnalysis: {
    engine:
      'Landon Frei (.298, 7 HR) is the one bat. He is the only hitter in the Utah lineup who consistently puts up competitive at-bats against Big 12 pitching. His plate discipline and ability to drive the ball are the foundation. Everything the offense does in 2026 starts with whether Frei takes another step forward.',
    middle:
      'Kade Kern (from Ohio State, .272, 6 HR) adds a veteran bat behind Frei. Dylan Delvecchio (from Arizona, .254, 4 HR) gives the catching position more offensive production than 2025. The middle of the order is deeper — three hitters who have seen quality pitching instead of one.',
    supportingCast:
      'Maddux Meier (.252, 12 SB) is the speed element. Marco Navarro (from UNLV, .281) adds contact depth. Bryson Harper (.238) needs to improve his on-base ability at short. The bottom of the lineup will feature young players who are learning Big 12 baseball in real time — some will break through, some will not.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Sacramento State', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Utah Valley', location: 'Home', notes: '' },
    { dates: 'Mar 6-8', opponent: 'BYU', location: 'Away', notes: 'Holy War' },
    { dates: 'Mar 13-15', opponent: 'Kansas', location: 'Home', notes: 'Big 12 Opener' },
    { dates: 'Mar 27-29', opponent: 'West Virginia', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Cincinnati', location: 'Home', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Arizona State', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Kansas State', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Baylor', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Oklahoma State', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 30 },
    { category: 'Rotation', grade: 35 },
    { category: 'Bullpen', grade: 30 },
    { category: 'Defense', grade: 35 },
    { category: 'Speed/Baserunning', grade: 40 },
    { category: 'Coaching', grade: 45 },
    { category: 'Schedule Difficulty', grade: 70 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'Utah is not competing for a Big 12 title or a postseason berth — and that is not the point. Two years after relaunching the program, Henderson has a Friday starter who can compete, a lineup anchor in Frei, and useful portal additions that bring experience from power conferences. The win total should improve from 22. The conference wins should climb above 6. But the real measure of 2026 is whether Utah looks like a program that is going somewhere — whether recruits and portal targets watch this team and see a place worth committing to. That is the job right now.',

  relatedLinks: [
    { label: 'Utah Team Page', href: '/college-baseball/teams/utah' },
  ],
};

export default function Utah2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
