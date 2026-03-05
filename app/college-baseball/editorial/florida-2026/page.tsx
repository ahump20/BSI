import type { Metadata } from 'next';
import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

export const metadata: Metadata = {
  title: 'Florida Gators 2026 Season Preview | Blaze Sports Intel',
  description: 'Florida Gators 2026 college baseball season preview. Roster breakdown, pitching staff analysis, key players, and predictions for the SEC season.',
  openGraph: {
    title: 'Florida Gators — 2026 Season Preview | BSI',
    description: 'Full scouting report on the Florida Gators heading into the 2026 college baseball season.',
    type: 'article',
  },
};

const data: TeamPreviewData = {
  teamName: 'Florida',
  teamSlug: 'florida',
  mascot: 'Gators',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '13 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Jac Caglianone is the best two-way player in college baseball. Kevin O\'Sullivan knows how to peak in June. The Gators are built to make another Omaha run — if the pitching holds.',

  programStats: {
    allTimeWins: '3,148',
    winPct: '.651',
    cwsAppearances: 13,
    nationalTitles: 2,
    confTitles: 24,
    cwsWins: 26,
  },

  record2025: '47-23',
  record2025Context: 'Super Regional — one series from Omaha',
  seasonStats2025: {
    teamBA: '.281',
    teamERA: '3.89',
    homeRuns: 91,
    stolenBases: 68,
    strikeouts: 498,
    opponentBA: '.234',
  },
  seasonHighlights: [
    'Reached the Super Regional for the fourth straight year',
    'Jac Caglianone: .324/.428/.621, 18 HR — also made 12 starts on the mound',
    'Cade Kurland hit .308 with 11 HR from the two-hole',
    'Won 23 SEC games for the first time since 2018',
    'Brandon Sproat returned from injury to post a 3.45 ERA in conference play',
  ],

  keyReturnees: [
    {
      name: 'Jac Caglianone',
      position: '1B/LHP',
      year: 'Sr.',
      stats: '.324/.428/.621, 18 HR | 3.28 ERA, 78 K (mound)',
      bio: 'The best two-way player in college baseball. Hits with elite power, pitches with mid-90s heat. A generational talent returning for one more shot at Omaha.',
    },
    {
      name: 'Cade Kurland',
      position: '2B',
      year: 'Jr.',
      stats: '.308/.395/.487, 11 HR',
      bio: 'Table-setter with pop. Consistently puts the ball in play and hits for extra bases. Mature approach from the left side.',
    },
    {
      name: 'Brandon Sproat',
      position: 'RHP',
      year: 'R-Sr.',
      stats: '3.45 ERA, 112 K, 89 IP',
      bio: 'Returned from injury and dominated SEC lineups. Mid-90s fastball with a wipeout slider. Friday night presence.',
    },
    {
      name: 'Colby Shelton',
      position: '3B',
      year: 'Jr.',
      stats: '.289/.371/.464, 9 HR',
      bio: 'Hot-corner defender with a quick bat. Improved his plate discipline in SEC play and became a middle-of-the-order threat.',
    },
    {
      name: 'Ty Evans',
      position: 'OF',
      year: 'Jr.',
      stats: '.274/.358/.392, 34 SB',
      bio: 'Elite speed that changes games. Disruptive on the bases and covers center field like few in the conference.',
    },
    {
      name: 'Pierce Coppola',
      position: 'LHP',
      year: 'So.',
      stats: '2.91 ERA, 68 K, 52 IP',
      bio: 'Young lefty who pitched beyond his years. Electric stuff from the left side with improving command. Key bullpen piece moving toward the rotation.',
    },
  ],

  transferAdditions: [
    {
      name: 'Bryce Eldridge',
      position: 'OF/1B',
      year: 'Fr.',
      fromSchool: 'Top recruit',
      stats: 'No. 2 overall recruit',
      bio: 'Five-star prospect who chose Gainesville over pro ball. Elite raw power and physicality. Could start Day One.',
    },
    {
      name: 'Drew Gilbert',
      position: 'OF',
      year: 'R-Sr.',
      fromSchool: 'Tennessee',
      stats: '.311/.398/.501, 8 HR',
      bio: 'Veteran outfielder with SEC experience and postseason poise. Adds another proven bat to the lineup.',
    },
    {
      name: 'Kevin Kopps',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Arkansas',
      stats: '2.58 ERA, 9 SV',
      bio: 'Experienced closer with elite command. Gives O\'Sullivan a proven ninth-inning option.',
    },
    {
      name: 'Marcus Johnson',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Vanderbilt',
      stats: '3.41 ERA, 78 K',
      bio: 'Power arm with mid-90s velocity. Adds rotation depth behind Sproat and Caglianone.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Brandon Sproat is the anchor — a mid-90s right-hander who dominated SEC play after returning from injury. When he is healthy, he is one of the five best pitchers in the conference. The question is keeping him there through June.',
    rotation:
      'Jac Caglianone gives Florida something nobody else has: a first baseman who can also start on the mound. His 3.28 ERA with 78 strikeouts came while carrying the lineup offensively. Marcus Johnson (from Vanderbilt) adds a power arm to the middle of the rotation. Pierce Coppola could push for a weekend spot.',
    depth:
      'Kevin Kopps (from Arkansas) solves the bullpen. An experienced closer with elite command gives O\'Sullivan the ninth-inning certainty he lacked last year. Coppola\'s electric left-handed stuff provides high-leverage depth. The staff has more arms than innings — exactly the problem you want.',
  },

  lineupAnalysis: {
    engine:
      'Jac Caglianone (.324, 18 HR) is the most feared hitter in college baseball. Left-handed power, advanced approach, and the kind of presence at the plate that forces pitchers to pitch around him. Every opposing game plan starts with how to handle Cag.',
    middle:
      'Cade Kurland (.308, 11 HR) and Colby Shelton (.289, 9 HR) give Florida quality bats around Caglianone. Bryce Eldridge — the No. 2 overall recruit who chose Gainesville — could be an immediate impact player with elite raw power. Drew Gilbert (from Tennessee) adds veteran SEC production.',
    supportingCast:
      'Ty Evans (.274, 34 SB) changes games with speed alone. He gets on, he creates chaos on the bases, and he covers center field. The bottom of the order has enough depth to turn the lineup over with a runner on. This offense has multiple ways to beat you.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Michigan', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Miami', location: 'Away', notes: 'Rivalry' },
    { dates: 'Mar 6-8', opponent: 'Florida State', location: 'Home', notes: 'In-state Rivalry' },
    { dates: 'Mar 13-15', opponent: 'Vanderbilt', location: 'Home', notes: 'SEC Opener' },
    { dates: 'Mar 27-29', opponent: 'LSU', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Tennessee', location: 'Home', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Georgia', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Arkansas', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Texas A&M', location: 'Home', notes: '' },
    { dates: 'May 8-10', opponent: 'South Carolina', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 75 },
    { category: 'Rotation', grade: 65 },
    { category: 'Bullpen', grade: 70 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 70 },
    { category: 'Coaching', grade: 75 },
    { category: 'Schedule Difficulty', grade: 70 },
  ],

  projectionTier: 'Omaha Favorite',
  projectionText:
    'Florida has the best individual player in college baseball in Jac Caglianone. If Sproat stays healthy and the portal additions integrate quickly, the Gators have a legitimate Omaha ceiling. O\'Sullivan has been to this point before — he knows how to peak in June. The depth behind the top-line talent is the question, but when your floor is a Super Regional, the math favors a deep run.',

  relatedLinks: [
    { label: 'Florida Team Page', href: '/college-baseball/teams/florida' },
  ],
};

export default function Florida2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
