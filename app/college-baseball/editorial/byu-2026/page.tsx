import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BYU Cougars: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Two years into the Big 12 and the Cougars are still searching for a foothold. Trent Pratt inherited a program with no conference infrastructure in the power leagues.',
  openGraph: {
    title: 'BYU Cougars: 2026 Season Preview',
    description:
      'Two years into the Big 12 and the Cougars are still searching for a foothold. Trent Pratt inherited a program with no conference infrastructure in the power leagues.',
  },
};

const data: TeamPreviewData = {
  teamName: 'BYU',
  teamSlug: 'byu',
  mascot: 'Cougars',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Two years into the Big 12 and the Cougars are still searching for a foothold. Trent Pratt inherited a program with no conference infrastructure in the power leagues and a .500 record tells the story — BYU can compete on individual nights but cannot sustain it over a Big 12 weekend. Year 3 is about building the kind of depth that turns close losses into series wins.',

  programStats: {
    allTimeWins: '904',
    winPct: '.518',
    cwsAppearances: 0,
    nationalTitles: 0,
    confTitles: 2,
    cwsWins: 0,
  },

  record2025: '28-28 (10-20 Big 12)',
  record2025Context: '.500 overall, struggled in conference play',
  seasonStats2025: {
    teamBA: '.261',
    teamERA: '5.12',
    homeRuns: 42,
    stolenBases: 54,
    strikeouts: 389,
    opponentBA: '.278',
  },
  seasonHighlights: [
    'Split midweek series with Utah Valley and Utah Tech to stay above .500',
    'Colton Shaver hit .312 with 8 HR as the primary run producer',
    'Zach Owens posted a 3.58 ERA as the Friday starter',
    'Won a series at Kansas State in April for biggest Big 12 road moment',
    'Stole 54 bases as a team — speed remains the program identity',
  ],

  keyReturnees: [
    {
      name: 'Colton Shaver',
      position: 'OF',
      year: 'Sr.',
      stats: '.312/.385/.498, 8 HR, 42 RBI',
      bio: 'Best bat in the program. Carried the offense for stretches of 2025 and is the one hitter Big 12 pitchers circle on the scouting report.',
    },
    {
      name: 'Zach Owens',
      position: 'RHP',
      year: 'Jr.',
      stats: '5-5, 3.58 ERA, 78 K',
      bio: 'Friday night arm with a plus curveball. Competes well against top lineups — needs more run support to turn quality starts into wins.',
    },
    {
      name: 'Porter Brown',
      position: 'C',
      year: 'Jr.',
      stats: '.268/.341/.378, 4 HR',
      bio: 'Solid receiver who controls the running game. His bat improved throughout 2025 and Pratt needs that trend to continue.',
    },
    {
      name: 'Mack Bagley',
      position: 'SS',
      year: 'So.',
      stats: '.254/.332/.345, 18 SB',
      bio: 'Young shortstop with above-average speed and range. Raw with the bat but his defense keeps him in the lineup every day.',
    },
    {
      name: 'Trey Ammons',
      position: 'LHP',
      year: 'Jr.',
      stats: '3-4, 4.21 ERA, 52 K',
      bio: 'Left-handed starter who battles deep into games. Slider is his best pitch — needs to locate the fastball more consistently to handle Big 12 lineups.',
    },
  ],

  transferAdditions: [
    {
      name: 'Carter Jensen',
      position: 'INF/C',
      year: 'Jr.',
      fromSchool: 'Kansas State',
      stats: '.271/.348/.412, 5 HR',
      bio: 'Versatile bat from a Big 12 program. Can catch or play a corner. Adds immediate depth to the middle of the order.',
    },
    {
      name: 'Austin Krob',
      position: 'LHP',
      year: 'R-Sr.',
      fromSchool: 'Texas Tech',
      stats: '3.89 ERA, 48 K',
      bio: 'Experienced lefty arm from a Big 12 contender. Knows the conference hitters. Could slide into the Saturday or Sunday start.',
    },
    {
      name: 'Drew Deussen',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Cal Poly',
      stats: '2.94 ERA, 61 K',
      bio: 'Bullpen arm with a power slider. Pitched well in the Big West and now tests himself against Big 12 bats.',
    },
    {
      name: 'Jake Dukart',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Oregon State',
      stats: '.258/.342/.398, 4 HR',
      bio: 'Pac-12 outfielder who adds a left-handed bat and defensive range. Fills a gap in the outfield depth chart.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Zach Owens (5-5, 3.58 ERA, 78 K) is a legitimate Friday starter who can compete with any lineup in the conference. The issue is not the top of the rotation — it is what follows. BYU allowed a .278 opponent batting average in 2025, and that number has to shrink if the Cougars want to climb out of the Big 12 basement.',
    rotation:
      'Trey Ammons (4.21 ERA) has the stuff for a Saturday start but his command wavers under pressure. Austin Krob (from Texas Tech, 3.89 ERA) is the most impactful portal addition — a lefty who has pitched in Big 12 series and knows the tempo. The Sunday slot is an open competition that will define the weekend ceiling.',
    depth:
      'The bullpen was overworked in 2025 because starters could not go deep. Drew Deussen (from Cal Poly, 2.94 ERA) adds a legitimate late-inning option with swing-and-miss stuff. If the rotation can consistently go six innings, the bullpen math changes. If not, it is another year of high-wire relief work.',
  },

  lineupAnalysis: {
    engine:
      'Colton Shaver (.312, 8 HR) is the one hitter who can carry a game. He hits for average, drives the ball, and is the only bat in the lineup that forces opposing pitchers to pitch carefully. Everything in the BYU offense flows through what Shaver does in the middle of the order.',
    middle:
      'Carter Jensen (from Kansas State, .271, 5 HR) adds a proven Big 12 bat behind Shaver. Porter Brown (.268, 4 HR) is improving at the plate. The middle of the order has enough to compete — but it lacks the depth to survive a cold streak from any one hitter.',
    supportingCast:
      'Mack Bagley (.254, 18 SB) is a speed weapon at the top of the lineup but needs to get on base more. Jake Dukart (from Oregon State) adds a left-handed bat in the outfield. The bottom third of the order will determine whether BYU can string together enough runs to support the pitching.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Sacramento State', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Utah Valley', location: 'Home', notes: '' },
    { dates: 'Mar 6-8', opponent: 'San Diego', location: 'Away', notes: '' },
    { dates: 'Mar 13-15', opponent: 'TCU', location: 'Away', notes: 'Big 12 Opener' },
    { dates: 'Mar 27-29', opponent: 'Texas Tech', location: 'Home', notes: '' },
    { dates: 'Apr 3-5', opponent: 'UCF', location: 'Away', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Oklahoma State', location: 'Home', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Arizona', location: 'Away', notes: '' },
    { dates: 'May 1-3', opponent: 'West Virginia', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'Kansas State', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 35 },
    { category: 'Rotation', grade: 45 },
    { category: 'Bullpen', grade: 40 },
    { category: 'Defense', grade: 45 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 45 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'BYU is still in the early innings of a Big 12 build. Trent Pratt has a legitimate Friday starter in Owens, a lineup anchor in Shaver, and some useful portal additions — but the overall depth is not there yet. The Cougars will compete in individual games and steal a series here or there, but sustained success against the top half of this conference requires more pitching depth and more lineup production from the 5-through-9 hitters. The trajectory matters more than the record right now, and Pratt needs to show progress in Year 3.',

  relatedLinks: [
    { label: 'BYU Team Page', href: '/college-baseball/teams/byu' },
  ],
};

export default function BYU2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
