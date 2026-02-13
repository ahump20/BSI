import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Ole Miss',
  teamSlug: 'ole-miss',
  mascot: 'Rebels',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '11 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Mike Bianco has been here before. The Rebels have the bats to compete with anyone and pitch well enough to stay in games. Swayze Field is one of the best atmospheres in college baseball — and the 2026 Rebels intend to give it something to cheer about.',

  programStats: {
    allTimeWins: '2,612',
    winPct: '.576',
    cwsAppearances: 7,
    nationalTitles: 1,
    confTitles: 4,
    cwsWins: 12,
  },

  record2025: '42-23',
  record2025Context: 'Regional — defending 2022 national champions still in the mix',
  seasonStats2025: {
    teamBA: '.278',
    teamERA: '3.82',
    homeRuns: 82,
    stolenBases: 58,
    strikeouts: 492,
    opponentBA: '.238',
  },
  seasonHighlights: [
    '42 wins showed the Rebels remain competitive in the SEC upper half',
    'Jackson Kimbrell: .312, 9 HR, elite defense in center field',
    'Jack Dougherty: 7-4, 3.15 ERA as the Friday starter',
    'Kemp Alderman powered 15 HR from the first base spot',
    'Swayze Field continued to be one of the toughest venues in college baseball',
  ],

  keyReturnees: [
    {
      name: 'Jackson Kimbrell',
      position: 'OF',
      year: 'Jr.',
      stats: '.312/.398/.462, 9 HR',
      bio: 'Five-tool center fielder. Elite range, plus arm, and a bat that has developed real pop. Does everything well and impacts games in every phase.',
    },
    {
      name: 'Kemp Alderman',
      position: '1B',
      year: 'Jr.',
      stats: '.268/.358/.512, 15 HR',
      bio: 'Raw power that jumps off the bat. 15 home runs with the kind of exit velocity that projects to 20+. Needs to improve his contact rate.',
    },
    {
      name: 'Jack Dougherty',
      position: 'RHP',
      year: 'Jr.',
      stats: '7-4, 3.15 ERA, 88 K',
      bio: 'The ace. Commands three pitches and competes on Friday nights against elite lineups. Has the poise of a veteran despite being a junior.',
    },
    {
      name: 'Cael Baker',
      position: 'OF',
      year: 'Sr.',
      stats: '.278/.362/.412, 6 HR',
      bio: 'Veteran outfielder with a contact-first approach. Provides lineup balance and defensive stability in left field.',
    },
    {
      name: 'Aaron Sabato',
      position: 'DH',
      year: 'R-Sr.',
      stats: '.255/.368/.478, 12 HR',
      bio: 'Pure power from the DH spot. Walks at a high rate and punishes mistakes. The kind of bat that changes innings.',
    },
  ],

  transferAdditions: [
    {
      name: 'Blake Rambusch',
      position: 'INF',
      year: 'R-Sr.',
      fromSchool: 'Clemson',
      stats: '.302/.382/.458, 8 HR',
      bio: 'ACC-tested infielder with a professional approach. Fills the middle infield void with production and versatility.',
    },
    {
      name: 'Trey Dombroski',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Virginia Tech',
      stats: '3.32 ERA, 82 K',
      bio: 'Left-handed starter who slots into the weekend rotation. Adds pitching depth the Rebels needed.',
    },
    {
      name: 'Mitch Jebb',
      position: 'OF',
      year: 'R-Sr.',
      fromSchool: 'Michigan State',
      stats: '.295/.378/.445, 7 HR',
      bio: 'Veteran outfielder with Big Ten experience. Adds another experienced bat and defensive depth.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Jack Dougherty (7-4, 3.15 ERA, 88 K) is a proven Friday arm. He commands three pitches, competes against elite lineups, and has the poise to pitch deep into games. When Dougherty is on, Ole Miss can beat anyone in the SEC.',
    rotation:
      'Trey Dombroski (from Virginia Tech, 3.32 ERA) fills the Saturday spot with a left-handed presence. The Sunday starter is the biggest question — Bianco needs a young arm to step up. The rotation has a strong front two with a question mark behind them.',
    depth:
      'The bullpen needs development. Ole Miss lost key relief arms and is rebuilding the back end. If the late-inning pieces come together, this is a Regional host. If they do not, the Rebels will be fighting for an at-large bid.',
  },

  lineupAnalysis: {
    engine:
      'Jackson Kimbrell (.312, 9 HR) is the catalyst. A five-tool center fielder who does everything well — hits, runs, fields, throws, and makes adjustments. He sets the tone at the top of the lineup and provides the consistency the Rebels need.',
    middle:
      'Kemp Alderman (.268, 15 HR) is the power bat. If he improves his contact rate, 20+ home runs are within reach. Aaron Sabato (.255, 12 HR) adds DH power. Blake Rambusch (from Clemson, .302, 8 HR) fills the middle infield. The lineup has thump.',
    supportingCast:
      'Cael Baker (.278, 6 HR) and Mitch Jebb (from Michigan State, .295, 7 HR) give the outfield depth. The bottom of the order has veteran bats who can grind at-bats and keep innings alive. Swayze Field helps — the atmosphere lifts this lineup.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Jacksonville State', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'UCF', location: 'Neutral', notes: '' },
    { dates: 'Mar 7-9', opponent: 'Southern Miss', location: 'Away', notes: 'Rivalry' },
    { dates: 'Mar 13-15', opponent: 'Texas', location: 'Away', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Mississippi State', location: 'Home', notes: 'Governor\'s Cup' },
    { dates: 'Apr 4-6', opponent: 'Alabama', location: 'Home', notes: '' },
    { dates: 'Apr 11-13', opponent: 'LSU', location: 'Away', notes: '' },
    { dates: 'Apr 18-20', opponent: 'Tennessee', location: 'Away', notes: '' },
    { dates: 'Apr 25-27', opponent: 'Georgia', location: 'Home', notes: '' },
    { dates: 'May 9-11', opponent: 'Oklahoma', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 60 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 50 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 65 },
    { category: 'Schedule Difficulty', grade: 70 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Ole Miss has the bats and the atmosphere to win series at home. Dougherty anchors the pitching. Kimbrell and Alderman give the lineup top-end talent. The question is depth — both on the mound and in the bullpen. Bianco has navigated tighter margins than this before, and Swayze Field remains one of college baseball\'s great advantages. The Rebels are a bubble team with a ceiling higher than their ranking suggests.',

  relatedLinks: [
    { label: 'Ole Miss Team Page', href: '/college-baseball/teams/ole-miss' },
  ],
};

export default function OleMiss2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
