import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iowa Hawkeyes: 2026 Season Preview | Blaze Sports Intel',
  description:
    "Iowa quietly posted a 21-8 conference record in 2025 — one of the best marks in the Big Ten — and Rick Heller's program enters Year 13 with a roster that can challenge anyone.",
  openGraph: {
    title: 'Iowa Hawkeyes: 2026 Season Preview',
    description:
      "Iowa quietly posted a 21-8 conference record in 2025 — one of the best marks in the Big Ten — and Rick Heller's program enters Year 13 with a roster that can challenge anyone.",
  },
};

const data: TeamPreviewData = {
  teamName: 'Iowa',
  teamSlug: 'iowa',
  mascot: 'Hawkeyes',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Iowa quietly posted a 21-8 conference record in 2025 — one of the best marks in the Big Ten — and Rick Heller\'s program enters Year 13 with a roster that can challenge anyone in league play. The Hawkeyes are the definition of a team nobody wants to face in a regional.',

  programStats: {
    allTimeWins: '1,714',
    winPct: '.507',
    cwsAppearances: 3,
    nationalTitles: 0,
    confTitles: 5,
    cwsWins: 4,
  },

  record2025: '33-22-1 (21-8 Big Ten)',
  record2025Context: '21 Big Ten wins — third-best in the conference',
  seasonStats2025: {
    teamBA: '.271',
    teamERA: '4.18',
    homeRuns: 64,
    stolenBases: 72,
    strikeouts: 467,
    opponentBA: '.248',
  },
  seasonHighlights: [
    '21 Big Ten wins — trailed only UCLA and Oregon in conference play',
    'Won 8 of 10 conference series, including road sweeps at Maryland and Illinois',
    'Led the Big Ten in sacrifice bunts and hit-and-run execution — classic Heller baseball',
    'Three players earned All-Big Ten honors',
    'Advanced to NCAA Tournament for the fourth time in five years',
  ],

  keyReturnees: [
    {
      name: 'Keaton Anthony',
      position: 'OF',
      year: 'Jr.',
      stats: '.312/.401/.521, 13 HR, 52 RBI',
      bio: 'Cedar Rapids native. Iowa\'s best hitter and the emotional pulse of the lineup. Power-speed combination that is rare for a cold-weather program.',
    },
    {
      name: 'Sam Hojnar',
      position: '2B',
      year: 'Sr.',
      stats: '.298/.378/.434, 7 HR, 22 SB',
      bio: 'Iowa City product. Heller guys — does everything right. Hits, runs, fields, competes. The most complete player on the roster.',
    },
    {
      name: 'Kyle Huckstorf',
      position: 'C',
      year: 'Sr.',
      stats: '.275/.359/.418, 6 HR',
      bio: 'Ankeny product. Veteran catcher who controls the running game and calls an elite game. Pitching staff trusts him completely.',
    },
    {
      name: 'Brody Brecht',
      position: 'RHP',
      year: 'Sr.',
      stats: '7-4, 3.67 ERA, 104 K in 88.1 IP',
      bio: 'Former Iowa football receiver who committed fully to baseball. Mid-90s fastball with a plus slider. Electric stuff that overwhelms hitters when he commands the zone.',
    },
    {
      name: 'Cade Moss',
      position: 'LHP',
      year: 'Jr.',
      stats: '6-3, 3.89 ERA, 78 K in 74 IP',
      bio: 'Waukee product. Crafty lefty who pitches to contact and gets groundballs. Perfect complement to Brecht\'s power approach.',
    },
    {
      name: 'Ty Langenberg',
      position: 'RHP',
      year: 'Sr.',
      stats: '2.54 ERA, 9 SV, 48 K in 39 IP',
      bio: 'Le Mars native. Closer with nasty late-breaking stuff. Heller trusts him in every save situation.',
    },
  ],

  transferAdditions: [
    {
      name: 'Nate Willison',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'Nebraska',
      stats: '.283/.361/.432, 8 HR',
      bio: 'Intra-conference transfer who adds power to the infield. Knows the Big Ten arms Iowa will face all spring.',
    },
    {
      name: 'Ryan Ure',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Dallas Baptist',
      stats: '3.42 ERA, 67 K in 57.2 IP',
      bio: 'Experienced arm from a program that develops pitchers. Sunday starter candidate or high-leverage reliever.',
    },
    {
      name: 'Jake Duer',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Kent State',
      stats: '.305/.389/.467, 6 HR, 19 SB',
      bio: 'MAC standout who adds speed and on-base ability to the outfield. Can lead off or slot into the two-hole.',
    },
    {
      name: 'Miguel Rosario',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Miami (FL)',
      stats: '3.81 ERA, 54 K in 44.2 IP',
      bio: 'ACC arm who adds bullpen depth. Left-handed reliever who can neutralize the left side of opposing lineups.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Brody Brecht is the most physically gifted pitcher in the Big Ten. A former wide receiver with mid-90s heat and a slider that disappears. When he commands both pitches, he is unhittable. The question is whether he can do it consistently for 100+ innings. If yes, Iowa has a legitimate ace. Ty Langenberg (2.54 ERA, 9 saves) in the ninth gives Heller a defined back end.',
    rotation:
      'Brecht on Fridays, Cade Moss (3.89 ERA) on Saturdays, and Ryan Ure (from Dallas Baptist) as the Sunday candidate. Moss is the yin to Brecht\'s yang — groundballs, command, efficiency. Ure has the experience to handle a Sunday role. The rotation is not elite, but it is deep enough to compete in every weekend series.',
    depth:
      'Langenberg closes. Miguel Rosario (from Miami) gives Heller a left-handed option in the middle innings. The existing bullpen arms posted a collective 3.85 ERA in Big Ten play. Iowa does not need dominant relievers — they need reliable ones who keep the game close until the seventh. That is what this pen is built to do.',
  },

  lineupAnalysis: {
    engine:
      'Keaton Anthony (.312/.401/.521, 13 HR) is the best bat in Iowa City in over a decade. He drives the ball to all fields, has learned to lay off sliders down and away, and provides genuine 20-home-run power. Anthony in the three-hole forces pitchers to engage with the top of Iowa\'s order.',
    middle:
      'Sam Hojnar (.298/.378/.434, 7 HR, 22 SB) and Kyle Huckstorf (.275/.359/.418) provide the on-base and plate discipline that make Iowa\'s lineup work. Hojnar is a classic Heller player — does everything, gives nothing away. Huckstorf is the veteran catcher who pitchers trust and opposing runners fear.',
    supportingCast:
      'Jake Duer (from Kent State, .305/.389/.467, 19 SB) adds speed at the top of the order. Nate Willison (from Nebraska, 8 HR) brings power off the bench or in the lineup. Iowa will not overpower anyone, but they will not give away at-bats either. Every spot in this lineup makes you work.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Ball State', location: 'Neutral', notes: 'Season Opener — Clearwater, FL' },
    { dates: 'Feb 20-22', opponent: 'Coastal Carolina', location: 'Neutral', notes: 'Round Robin — Myrtle Beach' },
    { dates: 'Mar 6-8', opponent: 'Missouri', location: 'Away', notes: '' },
    { dates: 'Mar 13-15', opponent: 'Illinois', location: 'Home', notes: 'Big Ten Opener' },
    { dates: 'Mar 27-29', opponent: 'Oregon', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Indiana', location: 'Home', notes: '' },
    { dates: 'Apr 10-12', opponent: 'UCLA', location: 'Home', notes: 'Biggest home series of the year' },
    { dates: 'Apr 24-26', opponent: 'Michigan', location: 'Away', notes: '' },
    { dates: 'May 1-3', opponent: 'USC', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'Maryland', location: 'Away', notes: 'Regular season finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 60 },
    { category: 'Bullpen', grade: 55 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 65 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'Iowa won 21 Big Ten games in 2025 and nobody outside the Midwest blinked. That is the Hawkeyes\' superpower and their ceiling — they are very good and chronically overlooked. Rick Heller has built a program that competes in every conference series, advances to regionals consistently, and plays fundamentally sound baseball. The question is whether Brecht can become a true ace and whether the lineup has enough thump beyond Anthony to win a regional. If Brecht puts it together, Iowa is a super regional team. If not, they are a dangerous 2-seed that nobody wants to draw. Either outcome is a credit to what Heller has built in Iowa City.',

  relatedLinks: [
    { label: 'Iowa Team Page', href: '/college-baseball/teams/iowa' },
  ],
};

export default function Iowa2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
