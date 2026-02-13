import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Texas A&M',
  teamSlug: 'texas-am',
  mascot: 'Aggies',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '14 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Unanimous preseason #1. Jim Schlossnagle assembled the most talented roster in college baseball — deep pitching, explosive lineup, elite defense. The Aggies came within two wins of a national title last June. This year, they want to finish the job.',

  programStats: {
    allTimeWins: '3,412',
    winPct: '.618',
    cwsAppearances: 9,
    nationalTitles: 0,
    confTitles: 14,
    cwsWins: 15,
  },

  record2025: '53-15',
  record2025Context: 'College World Series — two wins from a title',
  seasonStats2025: {
    teamBA: '.289',
    teamERA: '3.42',
    homeRuns: 98,
    stolenBases: 92,
    strikeouts: 561,
    opponentBA: '.221',
  },
  seasonHighlights: [
    '53 wins — most in a single season in program history',
    'Reached the College World Series for the first time since 2022',
    'Gavin Grahovac named SEC Player of the Year (.335, 21 HR, 72 RBI)',
    'Justin Lamkin: 12-1, 2.18 ERA — emerged as an elite Friday starter',
    'Set a school record with 92 stolen bases as a team',
  ],

  keyReturnees: [
    {
      name: 'Gavin Grahovac',
      position: 'C',
      year: 'Jr.',
      stats: '.335/.421/.598, 21 HR, 72 RBI',
      bio: 'SEC Player of the Year. Best catcher in college baseball. Elite bat, plus arm, and the kind of presence behind the plate that anchors a pitching staff.',
    },
    {
      name: 'Kaeden Kent',
      position: 'SS',
      year: 'So.',
      stats: '.318/.402/.512, 12 HR, 58 RBI',
      bio: 'Future first-round pick. Five-tool shortstop who plays with a maturity beyond his years. The engine of the Aggie defense.',
    },
    {
      name: 'Justin Lamkin',
      position: 'LHP',
      year: 'Jr.',
      stats: '12-1, 2.18 ERA, 145 K',
      bio: 'Elite left-hander who dominated SEC lineups. Attacks the zone with three plus pitches and never gives in. Friday night ace.',
    },
    {
      name: 'Shane Sdao',
      position: 'RHP',
      year: 'Jr.',
      stats: '8-3, 3.15 ERA, 98 K',
      bio: 'Reliable Saturday starter. Pounds the zone with a heavy sinker and put-away slider. Eats innings.',
    },
    {
      name: 'Ryan Prager',
      position: 'LHP',
      year: 'Sr.',
      stats: '7-2, 3.38 ERA, 89 K',
      bio: 'Veteran lefty with postseason experience. Mixes four pitches and commands the zone. Sunday weapon.',
    },
    {
      name: 'Ted Burton',
      position: 'OF',
      year: 'Jr.',
      stats: '.298/.389/.467, 9 HR',
      bio: 'Plus defender in center with enough bat to hit in the middle of the order. Elite closing speed and instincts.',
    },
    {
      name: 'Caden Sorrell',
      position: '1B',
      year: 'So.',
      stats: '.285/.371/.502, 14 HR',
      bio: 'Left-handed power from the cleanup spot. Raw power grades 70. Improved his approach at the plate last spring.',
    },
    {
      name: 'Braden Montgomery',
      position: 'OF',
      year: 'Jr.',
      stats: '.276/.365/.445, 8 HR',
      bio: 'Electric athlete with game-changing speed. Plus defender who handles both corners and center. Impact at the top of the order.',
    },
  ],

  transferAdditions: [
    {
      name: 'Jace LaViolette',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'LSU',
      stats: '.291/.378/.489, 11 HR',
      bio: 'Massive portal win. Power-speed combination from the defending national champions. Adds a middle-of-the-order bat with SEC pedigree.',
    },
    {
      name: 'Chris Cortez',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Tennessee',
      stats: '3.25 ERA, 8 SV',
      bio: 'High-leverage reliever with a 97-mph fastball. Adds SEC-tested bullpen depth behind the elite rotation.',
    },
    {
      name: 'Hayden Murphy',
      position: 'INF',
      year: 'R-Sr.',
      fromSchool: 'Oklahoma State',
      stats: '.302/.375/.441',
      bio: 'Versatile infielder who can play three positions. Contact-oriented approach with gap power.',
    },
    {
      name: 'Tyler Rando',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Florida',
      stats: '3.62 ERA, 67 K',
      bio: 'Swing-and-miss stuff from a power arm. Adds rotation depth behind the established top three.',
    },
    {
      name: 'Andrew Dutkanych',
      position: 'LHP',
      year: 'So.',
      fromSchool: 'Virginia Tech',
      stats: '2.89 ERA, 72 K',
      bio: 'Young lefty with deception and command. Projects as a midweek starter or high-leverage reliever.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Justin Lamkin is the best left-handed pitcher in college baseball. A 12-1 record with a 2.18 ERA and 145 strikeouts — as a sophomore. He attacks the zone with three plus pitches and never gives in. Friday nights belong to him, and every lineup in the SEC knows it.',
    rotation:
      'Behind Lamkin, Shane Sdao (8-3, 3.15 ERA) gives Texas A&M a legitimate 1-2 punch. Ryan Prager (7-2, 3.38 ERA) adds veteran lefty depth on Sundays. Portal addition Tyler Rando (from Florida, 3.62 ERA) gives Schlossnagle a fourth starter with SEC experience. This is the deepest rotation in the conference.',
    depth:
      'Chris Cortez (from Tennessee, 97 mph) locks down the late innings. Andrew Dutkanych (from Virginia Tech) adds a second left-handed reliever. The returning bullpen already posted the lowest opponent batting average in the SEC. Schlossnagle never has to ride one arm — and that is the difference in a 56-game season.',
  },

  lineupAnalysis: {
    engine:
      'Gavin Grahovac (.335, 21 HR, 72 RBI) is the best offensive player in college baseball and the best catcher in the draft class. SEC Player of the Year. He anchors the middle of the order and controls the game from behind the plate. Every at-bat is a battle.',
    middle:
      'Kaeden Kent (.318, 12 HR) and Caden Sorrell (.285, 14 HR) flank Grahovac in the lineup. Kent is a five-tool shortstop with first-round talent. Sorrell provides left-handed thump from the cleanup spot. Jace LaViolette (from LSU) adds another power-speed threat. This is the deepest 3-4-5 in the country.',
    supportingCast:
      'Ted Burton (.298, 9 HR) is an elite defensive centerfielder with a rising bat. Braden Montgomery brings speed and versatility at the top of the order. Hayden Murphy (from Oklahoma State) gives Schlossnagle lineup flexibility and a professional approach. There is no easy out from one through nine.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Oregon', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Houston', location: 'Neutral', notes: 'Minute Maid Classic' },
    { dates: 'Mar 6-8', opponent: 'TCU', location: 'Away', notes: '' },
    { dates: 'Mar 14-16', opponent: 'Alabama', location: 'Away', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Texas', location: 'Home', notes: 'Lone Star Rivalry' },
    { dates: 'Apr 4-6', opponent: 'LSU', location: 'Home', notes: '' },
    { dates: 'Apr 11-13', opponent: 'Arkansas', location: 'Away', notes: '' },
    { dates: 'Apr 18-20', opponent: 'Vanderbilt', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Florida', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Ole Miss', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 80 },
    { category: 'Rotation', grade: 75 },
    { category: 'Bullpen', grade: 70 },
    { category: 'Defense', grade: 75 },
    { category: 'Speed/Baserunning', grade: 70 },
    { category: 'Coaching', grade: 80 },
    { category: 'Schedule Difficulty', grade: 75 },
  ],

  projectionTier: 'Omaha Favorite',
  projectionText:
    'Texas A&M has the most complete roster in the SEC and perhaps the country. Grahovac is the best player, Lamkin is the best pitcher, and Schlossnagle is the best coach in the conference. The 53-win foundation from 2025 returns almost entirely intact, fortified by elite portal additions from LSU, Tennessee, and Florida. The Aggies do not need everything to break right — they just need to stay healthy. This is the year College Station has been building toward.',

  relatedLinks: [
    { label: 'Texas A&M Team Page', href: '/college-baseball/teams/texas-am' },
  ],
};

export default function TexasAM2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
