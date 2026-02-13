import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Vanderbilt',
  teamSlug: 'vanderbilt',
  mascot: 'Commodores',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '12 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Tim Corbin always reloads. Enrique Bradfield Jr. is electric, the pitching staff is underrated, and Vanderbilt has too much talent in the pipeline to stay down for long. The Commodores are a dark-horse Omaha threat.',

  programStats: {
    allTimeWins: '2,487',
    winPct: '.547',
    cwsAppearances: 5,
    nationalTitles: 2,
    confTitles: 5,
    cwsWins: 15,
  },

  record2025: '43-21',
  record2025Context: 'Regional — Corbin\'s program always bounces back',
  seasonStats2025: {
    teamBA: '.274',
    teamERA: '3.72',
    homeRuns: 72,
    stolenBases: 98,
    strikeouts: 512,
    opponentBA: '.232',
  },
  seasonHighlights: [
    '98 stolen bases — most in the SEC and second nationally',
    'Enrique Bradfield Jr.: .328, 42 stolen bases, elite center field defense',
    'Carter Young hit .295 with 10 HR from the shortstop spot',
    'Christian Little: 8-4, 3.25 ERA as the Friday starter',
    'Won 20 SEC games behind an elite team speed game',
  ],

  keyReturnees: [
    {
      name: 'Enrique Bradfield Jr.',
      position: 'OF',
      year: 'Sr.',
      stats: '.328/.412/.445, 3 HR, 42 SB',
      bio: 'The fastest player in college baseball. 42 stolen bases as a junior — and he was caught only three times. His defense in center field is Gold Glove caliber. Electric in every phase of the game.',
    },
    {
      name: 'Carter Young',
      position: 'SS',
      year: 'Sr.',
      stats: '.295/.378/.468, 10 HR',
      bio: 'Veteran shortstop with steadily improving offense. Solid defender who anchors the infield. His bat has developed real power over four years.',
    },
    {
      name: 'Christian Little',
      position: 'RHP',
      year: 'Jr.',
      stats: '8-4, 3.25 ERA, 98 K',
      bio: 'Friday starter with three plus pitches. Commands the zone and competes in big moments. The kind of pitcher Corbin builds programs around.',
    },
    {
      name: 'Parker Noland',
      position: '3B',
      year: 'R-Sr.',
      stats: '.268/.362/.412, 8 HR',
      bio: 'Veteran corner infielder who provides lineup protection. Has improved his bat every year in Nashville. Steady defender.',
    },
    {
      name: 'Devin Futrell',
      position: 'LHP',
      year: 'Jr.',
      stats: '3.45 ERA, 82 K, 68 IP',
      bio: 'Left-handed starter with deception and command. Mixes four pitches and keeps hitters off balance. Key rotation piece.',
    },
    {
      name: 'Jack Bulger',
      position: 'C',
      year: 'Sr.',
      stats: '.255/.348/.378, 5 HR',
      bio: 'Elite defensive catcher. His game-calling and arm strength are among the best in the conference. A staff favorite.',
    },
  ],

  transferAdditions: [
    {
      name: 'Jackson Ferris',
      position: 'LHP',
      year: 'So.',
      fromSchool: 'Illinois',
      stats: '3.08 ERA, 91 K',
      bio: 'Power lefty with plus velocity. Adds another high-ceiling arm to the pitching staff.',
    },
    {
      name: 'Cutter Coffey',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Kentucky',
      stats: '.289/.371/.445, 7 HR',
      bio: 'SEC-experienced outfielder who adds depth and production. Knows the conference hitters and pitchers.',
    },
    {
      name: 'Liam Hicks',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Oklahoma',
      stats: '3.38 ERA, 68 K',
      bio: 'Strike-throwing right-hander. Adds rotation depth behind Little and Futrell.',
    },
    {
      name: 'Ryan Bruno',
      position: '1B',
      year: 'R-Sr.',
      fromSchool: 'Michigan',
      stats: '.302/.398/.512, 12 HR',
      bio: 'Left-handed power bat. Fills the first base void with a veteran presence and proven pop.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Christian Little (8-4, 3.25 ERA, 98 K) is the ace. Three plus pitches, elite command, and the competitiveness that Corbin demands. He gives Vanderbilt a chance to win every Friday night — and in the SEC, that baseline is everything.',
    rotation:
      'Devin Futrell (3.45 ERA, 82 K) brings left-handed deception on Saturdays. Jackson Ferris (from Illinois, 3.08 ERA) adds power from the left side with plus velocity. Liam Hicks (from Oklahoma) fills the Sunday spot or provides long-relief depth. Corbin has four starters he trusts — rare in the SEC.',
    depth:
      'Vanderbilt develops bullpen arms through the program. The returning relievers pitched big innings in SEC weekend series. Corbin does not chase closers — he builds them. The depth may not have marquee names, but the collective ERA is what matters. This staff will compete.',
  },

  lineupAnalysis: {
    engine:
      'Enrique Bradfield Jr. (.328, 42 SB) changes games before he swings the bat. The fastest player in college baseball is also one of the best pure hitters in the conference. He gets on base at a .412 clip, then puts immediate pressure on the defense. He makes average pitchers uncomfortable.',
    middle:
      'Carter Young (.295, 10 HR) and Parker Noland (.268, 8 HR) provide the lineup backbone. Ryan Bruno (from Michigan, .302, 12 HR) adds left-handed power at first base. The middle of the order is not explosive — but it is consistent, and consistency wins series.',
    supportingCast:
      'Cutter Coffey (from Kentucky) adds SEC-experienced depth in the outfield. Jack Bulger (.255) will not hurt you at the plate, and his defense is elite behind the dish. This lineup wins with speed, contact, and pressure — not with the long ball. That is by design.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Lipscomb', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Oregon State', location: 'Neutral', notes: '' },
    { dates: 'Mar 7-9', opponent: 'Louisville', location: 'Away', notes: '' },
    { dates: 'Mar 13-15', opponent: 'Florida', location: 'Away', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Tennessee', location: 'Away', notes: 'In-state Rivalry' },
    { dates: 'Apr 4-6', opponent: 'Kentucky', location: 'Home', notes: '' },
    { dates: 'Apr 18-20', opponent: 'Texas A&M', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Texas', location: 'Home', notes: '' },
    { dates: 'May 2-4', opponent: 'South Carolina', location: 'Away', notes: '' },
    { dates: 'May 9-11', opponent: 'Georgia', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 60 },
    { category: 'Rotation', grade: 65 },
    { category: 'Bullpen', grade: 60 },
    { category: 'Defense', grade: 65 },
    { category: 'Speed/Baserunning', grade: 80 },
    { category: 'Coaching', grade: 75 },
    { category: 'Schedule Difficulty', grade: 70 },
  ],

  projectionTier: 'Contender',
  projectionText:
    'Vanderbilt is the program you never count out. Corbin has been to five College World Series and won two national titles. Bradfield Jr. is the most electrifying player in the conference. Little anchors the pitching staff. The portal added quality at every position of need. The Commodores will not overpower you — they will out-execute you, out-run you, and out-prepare you. That has always been enough in Nashville.',

  relatedLinks: [
    { label: 'Vanderbilt Team Page', href: '/college-baseball/teams/vanderbilt' },
  ],
};

export default function Vanderbilt2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
