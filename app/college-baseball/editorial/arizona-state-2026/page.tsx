import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arizona State Sun Devils: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Five national titles. The winningest program now in the Big 12. Willie Bloomquist brings a former big leaguer\'s intensity to a program that owns the most CWS hardware in the conference.',
  openGraph: {
    title: 'Arizona State Sun Devils: 2026 Season Preview',
    description:
      'Five national titles. The winningest program now in the Big 12. Willie Bloomquist brings a former big leaguer\'s intensity to a program that owns the most CWS hardware in the conference.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Arizona State',
  teamSlug: 'arizona-state',
  mascot: 'Sun Devils',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Five national titles. The winningest program now in the Big 12. Willie Bloomquist brings a former big leaguer\'s intensity to a program that owns the most CWS hardware in the conference — and in Year 3, the Sun Devils are done rebuilding.',

  programStats: {
    allTimeWins: '2,831',
    winPct: '.618',
    cwsAppearances: 22,
    nationalTitles: 5,
    confTitles: 24,
    cwsWins: 61,
  },

  record2025: '36-22 (15-15 Big 12)',
  record2025Context: 'Exactly .500 in conference play — competitive in every series but unable to separate from the pack',
  seasonStats2025: {
    teamBA: '.268',
    teamERA: '4.39',
    homeRuns: 71,
    stolenBases: 68,
    strikeouts: 498,
    opponentBA: '.254',
  },
  seasonHighlights: [
    'Won 7 of 10 Big 12 series against sub-.500 conference teams',
    'Swept Kansas State in a key late-season conference series',
    'Joe Lampe named Second Team All-Big 12 outfielder',
    'Staff struck out 498 hitters — program\'s highest total since 2018',
  ],

  keyReturnees: [
    {
      name: 'Joe Lampe',
      position: 'OF',
      year: 'Sr.',
      stats: '.311/.401/.502, 12 HR, 51 RBI',
      bio: 'The best returning bat in the Big 12 not named Brayden Taylor. Elite bat-to-ball skills with enough power to keep pitchers honest. Second Team All-Big 12 who should be First Team in 2026. Runs well enough to play center and hit at the top or middle of the order.',
    },
    {
      name: 'Ethan Long',
      position: '1B/DH',
      year: 'Jr.',
      stats: '.278/.358/.501, 15 HR, 53 RBI',
      bio: 'Power-first first baseman with legitimate 70-grade raw power on the 20-80 scale. Led the team in home runs and RBI. When he gets into a fastball, it leaves the yard in a hurry.',
    },
    {
      name: 'Ryan Mares',
      position: 'SS',
      year: 'Jr.',
      stats: '.274/.352/.389, 4 HR, 32 RBI',
      bio: 'Quick-twitch athlete who plays a premium position with above-average range. The bat is developing — a jump in power would make him a complete shortstop. Smart baserunner who picks his spots.',
    },
    {
      name: 'Jacob Aguayo',
      position: 'RHP',
      year: 'Jr.',
      stats: '7-5, 3.92 ERA, 91 K in 82.2 IP',
      bio: 'Friday night starter with mid-90s heat and a developing breaking ball. 91 strikeouts suggest the stuff plays — the 3.92 ERA suggests the command has room to tighten. High ceiling arm who could be one adjustment away from dominance.',
    },
    {
      name: 'Brock Peery',
      position: 'LHP',
      year: 'So.',
      stats: '5-3, 3.68 ERA, 72 K in 63.2 IP',
      bio: 'Left-handed starter who competed immediately as a freshman. Pitchability over velocity — changes speeds effectively and locates the fastball to both sides. The sophomore jump could make him a Saturday anchor.',
    },
    {
      name: 'Jaden Parsons',
      position: 'RHP',
      year: 'Jr.',
      stats: '2.78 ERA, 6 SV, 44 K in 35.2 IP',
      bio: 'Late-inning weapon with a power slider that generates swings and misses. Closer who saved 6 games down the stretch. Fearless competitor on the mound.',
    },
  ],

  transferAdditions: [
    {
      name: 'Travis Sthele',
      position: 'C',
      year: 'R-Sr.',
      fromSchool: 'Oregon State',
      stats: '.271/.362/.438, 9 HR',
      bio: 'Veteran catcher from the Pac-12 bloodline who brings defensive stability and pop behind the plate. Elite game-caller who handles pitching staffs. Fills a critical position of need.',
    },
    {
      name: 'Conor Davis',
      position: '3B',
      year: 'R-Sr.',
      fromSchool: 'Auburn',
      stats: '.289/.368/.491, 13 HR, 49 RBI',
      bio: 'SEC power bat who slots into the heart of the order. Physical hitter who drives the ball to the pull side with authority. Brings postseason experience from the SEC.',
    },
    {
      name: 'Tyler Gentry',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Alabama',
      stats: '3.71 ERA, 64 K in 58.1 IP',
      bio: 'Pitched in the SEC West against the best lineups in college baseball. Power fastball with a cutter that neutralizes right-handed hitters. Immediate rotation or high-leverage relief option.',
    },
    {
      name: 'Wyatt Olds',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Oklahoma',
      stats: '.296/.378/.441, 7 HR, 18 SB',
      bio: 'Speed-power combination from the conference rival. Knows Big 12 pitching. Adds depth to an outfield that needed it and provides stolen base ability from the leadoff spot.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Jacob Aguayo has the raw stuff to be a Big 12 ace. Mid-90s with 91 strikeouts in 82 innings — the strikeout rate says the arsenal works. The 3.92 ERA says the execution needs sharpening. If Bloomquist and pitching coach Jason Kelly can tighten Aguayo\'s command, the rotation becomes dangerous.',
    rotation:
      'Aguayo leads the way. Brock Peery provides left-handed balance on Saturday — his freshman year was quietly impressive, and the sophomore jump could be significant. Tyler Gentry (from Alabama) gives Arizona State an SEC-tested arm for Sunday. Three different looks across the weekend rotation: power righty, crafty lefty, cutter-heavy righty.',
    depth:
      'Jaden Parsons (2.78 ERA, 6 saves) closes games with a power slider that hitters can\'t seem to square up. The seventh and eighth innings need sorting, but Parsons at the back takes pressure off everything in front of him. If the rotation goes 6+ innings regularly, this bullpen is more than capable.',
  },

  lineupAnalysis: {
    engine:
      'Joe Lampe (.311, 12 HR) is the lineup\'s heartbeat. He can hit at the top for on-base production or in the 3-hole for run production — Bloomquist has flexibility because Lampe does everything well. Second Team All-Big 12 last year was an understatement of what he meant to this offense.',
    middle:
      'Ethan Long (15 HR, 53 RBI) and Conor Davis (.289, 13 HR from Auburn) form a power tandem in the middle. When Lampe gets on, Long and Davis drive him in. That 3-4-5 of Lampe-Long-Davis is as physically imposing as any in the Big 12.',
    supportingCast:
      'Wyatt Olds (18 stolen bases from Oklahoma) adds speed and Big 12 familiarity at the top. Travis Sthele (from Oregon State) provides a veteran backstop who contributes offensively. Ryan Mares is a smart hitter developing power. The lineup is deeper and more balanced than 2025, with clear roles from 1 through 9.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'San Diego', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Long Beach State', location: 'Home', notes: '' },
    { dates: 'Feb 27-Mar 1', opponent: 'Frisco Classic', location: 'Neutral', notes: 'Frisco, TX — vs. Arkansas, Duke' },
    { dates: 'Mar 13-15', opponent: 'Arizona', location: 'Home', notes: 'Big 12 / Territorial Cup' },
    { dates: 'Mar 20-22', opponent: 'UCF', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Kansas State', location: 'Home', notes: '' },
    { dates: 'Apr 10-12', opponent: 'TCU', location: 'Home', notes: '' },
    { dates: 'Apr 24-26', opponent: 'West Virginia', location: 'Away', notes: '' },
    { dates: 'May 1-3', opponent: 'Oklahoma State', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'Texas Tech', location: 'Away', notes: 'Regular Season Finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 65 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 60 },
    { category: 'Defense', grade: 55 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 60 },
    { category: 'Schedule Difficulty', grade: 60 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'Arizona State has more national titles than any program in the Big 12. That history doesn\'t win games — but the roster Bloomquist assembled might. Joe Lampe is a legitimate All-American candidate. The portal brought SEC power (Davis), Pac-12 defense (Sthele), Big 12 speed (Olds), and SEC pitching (Gentry). The question is the rotation: if Aguayo takes the command step and Peery makes the sophomore jump, this team can make a run. Fifteen-and-fifteen in conference play was 2025. The ceiling in 2026 is a Regional host.',

  relatedLinks: [
    { label: 'Arizona State Team Page', href: '/college-baseball/teams/arizona-state' },
  ],
};

export default function ArizonaState2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
