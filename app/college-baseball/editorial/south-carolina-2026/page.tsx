import type { Metadata } from 'next';
import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

export const metadata: Metadata = {
  title: 'South Carolina Gamecocks 2026 Season Preview | Blaze Sports Intel',
  description: 'South Carolina Gamecocks 2026 college baseball season preview. Roster breakdown, pitching staff analysis, key players, and predictions for the SEC season.',
  openGraph: {
    title: 'South Carolina Gamecocks — 2026 Season Preview | BSI',
    description: 'Full scouting report on the South Carolina Gamecocks heading into the 2026 college baseball season.',
    type: 'article',
  },
};

const data: TeamPreviewData = {
  teamName: 'South Carolina',
  teamSlug: 'south-carolina',
  mascot: 'Gamecocks',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '11 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Monte Lee has the Gamecocks back in the conversation. A pitching staff with real depth, a lineup that is improving, and the kind of culture that produces competitive teams year after year. Founders Park is not an easy place to play in March.',

  programStats: {
    allTimeWins: '2,915',
    winPct: '.593',
    cwsAppearances: 11,
    nationalTitles: 2,
    confTitles: 7,
    cwsWins: 26,
  },

  record2025: '38-22',
  record2025Context: 'Regional — pitching staff carried the season',
  seasonStats2025: {
    teamBA: '.264',
    teamERA: '3.68',
    homeRuns: 62,
    stolenBases: 75,
    strikeouts: 521,
    opponentBA: '.237',
  },
  seasonHighlights: [
    'Reached the Regional behind a pitching staff that ranked fifth in SEC ERA',
    'Will Sanders: 9-4, 2.85 ERA — emerged as a legitimate Friday starter',
    'Ethan Petry hit .298 with 11 HR as the lineup anchor at first base',
    '75 stolen bases showed the speed that Lee has been building in the program',
    'Carson Hornung (.285, 8 HR) provided veteran offensive production from the outfield',
  ],

  keyReturnees: [
    {
      name: 'Ethan Petry',
      position: '1B',
      year: 'Jr.',
      stats: '.298/.388/.495, 11 HR',
      bio: 'The lineup anchor. Consistent production from first base with a mature plate approach. Drives the ball to all fields and provides run production.',
    },
    {
      name: 'Will Sanders',
      position: 'RHP',
      year: 'Jr.',
      stats: '9-4, 2.85 ERA, 108 K',
      bio: 'The ace. Emerged as one of the SEC\'s best Friday starters. Commands four pitches, competes in every at-bat, and thrives under pressure.',
    },
    {
      name: 'Carson Hornung',
      position: 'OF',
      year: 'Sr.',
      stats: '.285/.368/.445, 8 HR',
      bio: 'Veteran corner outfielder with consistent production. Provides lineup depth and veteran leadership in the clubhouse.',
    },
    {
      name: 'Michael Braswell',
      position: 'SS',
      year: 'Jr.',
      stats: '.262/.342/.378, 4 HR, 14 SB',
      bio: 'Athletic shortstop with developing power. His speed and defense impact the game beyond the stat line.',
    },
    {
      name: 'James Hicks',
      position: 'LHP',
      year: 'So.',
      stats: '3.58 ERA, 72 K, 55 IP',
      bio: 'Young left-hander with improving command. Has the stuff to be a Saturday starter — needs to limit free passes.',
    },
  ],

  transferAdditions: [
    {
      name: 'Tyler Casner',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'NC State',
      stats: '3.22 ERA, 78 K',
      bio: 'ACC-tested right-hander. Adds immediate rotation depth behind Sanders.',
    },
    {
      name: 'Jack Thompson',
      position: 'OF',
      year: 'R-Sr.',
      fromSchool: 'Georgia Tech',
      stats: '.298/.385/.468, 9 HR',
      bio: 'Power outfielder from an ACC program. Adds middle-of-the-order production and defensive range.',
    },
    {
      name: 'Cole Barr',
      position: '3B',
      year: 'R-Sr.',
      fromSchool: 'Indiana',
      stats: '.284/.365/.445, 8 HR',
      bio: 'Veteran corner infielder. Adds a reliable bat and defensive stability at third base.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Will Sanders (9-4, 2.85 ERA, 108 K) is the real deal. He commands four pitches, competes in every at-bat, and thrives under pressure. The SEC\'s most improved pitcher from 2025 returns as one of the conference\'s best Friday arms.',
    rotation:
      'James Hicks (3.58 ERA) takes the Saturday ball with improving left-handed stuff. Tyler Casner (from NC State, 3.22 ERA) fills the Sunday spot with ACC-proven depth. The rotation has three arms that can compete in weekend series — that is the baseline in the SEC.',
    depth:
      'The bullpen is where South Carolina surprises teams. Lee develops relievers through the program, and the returning arms pitched big innings during the Regional run. The staff collectively pitches to contact and lets the defense work. It is not flashy, but it is effective.',
  },

  lineupAnalysis: {
    engine:
      'Ethan Petry (.298, 11 HR) is the steady hand. He does not chase, drives the ball to all fields, and provides the kind of consistent run production that lets the pitching staff play with a lead. He is the player South Carolina builds the order around.',
    middle:
      'Carson Hornung (.285, 8 HR) and Jack Thompson (from Georgia Tech, .298, 9 HR) give the Gamecocks two veteran outfield bats with pop. Cole Barr (from Indiana, .284, 8 HR) adds production at the hot corner. The middle of the order has improved — and it needed to.',
    supportingCast:
      'Michael Braswell (.262, 14 SB) provides speed and defense from the shortstop spot. The bottom of the order is lean but disciplined. South Carolina will not outscore anyone — but they will manufacture enough runs behind quality pitching to stay in every game.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Liberty', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Coastal Carolina', location: 'Neutral', notes: '' },
    { dates: 'Mar 7-9', opponent: 'Clemson', location: 'Home', notes: 'In-state Rivalry' },
    { dates: 'Mar 14-16', opponent: 'LSU', location: 'Away', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Auburn', location: 'Home', notes: '' },
    { dates: 'Apr 4-6', opponent: 'Arkansas', location: 'Away', notes: '' },
    { dates: 'Apr 18-20', opponent: 'Oklahoma', location: 'Home', notes: '' },
    { dates: 'Apr 25-27', opponent: 'Mississippi State', location: 'Away', notes: '' },
    { dates: 'May 2-4', opponent: 'Vanderbilt', location: 'Home', notes: '' },
    { dates: 'May 8-10', opponent: 'Florida', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 60 },
    { category: 'Bullpen', grade: 55 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 60 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'South Carolina has the pitching to stay in games and the lineup improvement to steal a few series they should not win. Sanders is a legitimate ace. Petry anchors the offense. The portal addressed the biggest needs. Lee has built something — it is just not quite at the level of the SEC\'s elite. But Founders Park is difficult to play in, the schedule provides opportunities, and this is a program with two national titles. Write off the Gamecocks at your own risk.',

  relatedLinks: [
    { label: 'South Carolina Team Page', href: '/college-baseball/teams/south-carolina' },
  ],
};

export default function SouthCarolina2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
