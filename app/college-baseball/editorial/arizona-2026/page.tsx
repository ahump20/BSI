import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arizona Wildcats: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Four national titles. Nineteen trips to Omaha. The richest baseball tradition of any school now playing in the Big 12. Chip Hale enters Year 3 with a program still finding its footing.',
  openGraph: {
    title: 'Arizona Wildcats: 2026 Season Preview',
    description:
      'Four national titles. Nineteen trips to Omaha. The richest baseball tradition of any school now playing in the Big 12. Chip Hale enters Year 3 with a program still finding its footing.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Arizona',
  teamSlug: 'arizona',
  mascot: 'Wildcats',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Four national titles. Nineteen trips to Omaha. The richest baseball tradition of any school now playing in the Big 12. Chip Hale enters Year 3 with a program still finding its footing in a new conference — but the talent base in Tucson has always been too deep to stay quiet for long.',

  programStats: {
    allTimeWins: '2,741',
    winPct: '.612',
    cwsAppearances: 19,
    nationalTitles: 4,
    confTitles: 29,
    cwsWins: 85,
  },

  record2025: '35-24 (14-16 Big 12)',
  record2025Context: 'Below .500 in conference play for the second straight year in the Big 12 — the talent is there, the results haven\'t matched',
  seasonStats2025: {
    teamBA: '.276',
    teamERA: '4.67',
    homeRuns: 68,
    stolenBases: 71,
    strikeouts: 462,
    opponentBA: '.263',
  },
  seasonHighlights: [
    'Won 8 of final 12 regular season games to close the year strong',
    'Daniel Susac named preseason All-Big 12 before departing for the draft',
    'Pitching staff improved opponent BA by 15 points from 2024',
    'Hosted and won a midweek series against in-state rival Arizona State',
  ],

  keyReturnees: [
    {
      name: 'Garen Minjares',
      position: 'OF',
      year: 'Jr.',
      stats: '.312/.398/.487, 9 HR, 46 RBI',
      bio: 'Tucson native who emerged as the lineup\'s most consistent bat. Left-handed hitter with plus bat speed and the ability to drive the ball to all fields. The local kid carrying the program forward.',
    },
    {
      name: 'Kade Donoho',
      position: '2B',
      year: 'Sr.',
      stats: '.289/.371/.401, 5 HR, 38 RBI',
      bio: 'Contact-oriented middle infielder with a disciplined approach. Rarely strikes out. The kind of hitter who keeps rallies alive and wears out opposing pitchers with seven-pitch at-bats.',
    },
    {
      name: 'Ryan Campos',
      position: 'SS',
      year: 'Jr.',
      stats: '.268/.342/.412, 7 HR',
      bio: 'Athletic shortstop with above-average range and arm strength. The bat took a step forward in 2025, and a continued offensive improvement would make him a complete player.',
    },
    {
      name: 'Anthony Susac',
      position: 'RHP',
      year: 'Jr.',
      stats: '6-5, 4.21 ERA, 84 K in 79.1 IP',
      bio: 'Younger brother of former Arizona catcher Andrew Susac. Power arm with a fastball that sits 93-95. The raw stuff is plus — the command needs one more step to match it.',
    },
    {
      name: 'Camden Vasquez',
      position: 'LHP',
      year: 'So.',
      stats: '4-3, 3.78 ERA, 68 K in 61.2 IP',
      bio: 'Left-handed starter who pitched beyond his years as a freshman. Changeup is his best pitch — keeps hitters off-balance with velocity variations. Projects as a front-of-the-rotation arm.',
    },
    {
      name: 'J.J. Granados',
      position: 'RHP',
      year: 'Jr.',
      stats: '3.12 ERA, 5 SV, 38 K in 31.2 IP',
      bio: 'Late-inning arm with a heavy sinker and a sharp slider. Closed out games effectively when given the opportunity. High-leverage reliever who thrives in pressure.',
    },
  ],

  transferAdditions: [
    {
      name: 'Josh Rivera',
      position: '3B',
      year: 'Jr.',
      fromSchool: 'Florida',
      stats: '.282/.362/.478, 11 HR, 47 RBI',
      bio: 'SEC-tested power bat who adds immediate lineup impact. Physical third baseman who can turn on fastballs and adjust to off-speed. Fills a critical need in the middle of the order.',
    },
    {
      name: 'Max Rajcic',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'USC',
      stats: '4.08 ERA, 76 K in 72.2 IP',
      bio: 'Former USC ace who brings West Coast pedigree and big-game experience. Command pitcher who works both sides of the plate. Immediately slots into the weekend rotation.',
    },
    {
      name: 'Cole Carrigg',
      position: 'OF/SS',
      year: 'Jr.',
      fromSchool: 'San Diego State',
      stats: '.304/.381/.445, 6 HR, 39 SB',
      bio: 'Elite speed and defensive versatility. 39 stolen bases in 2025 — a weapon on the bases that changes how opposing pitchers work. Can play center field or shortstop.',
    },
    {
      name: 'Tanner Propst',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Georgia Tech',
      stats: '3.45 ERA, 61 K in 54.2 IP',
      bio: 'ACC arm with swing-and-miss stuff. Fastball-curve combination that generates whiffs. Adds depth to a rotation that needed a third reliable weekend arm.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'The 4.67 ERA tells the story of 2025 — Arizona had the arms but not the consistency. Anthony Susac has front-of-the-rotation stuff, and Camden Vasquez showed flashes as a freshman lefty. The portal brought Max Rajcic (USC) and Tanner Propst (Georgia Tech) to add depth that was sorely missing.',
    rotation:
      'Susac leads the way with 93-95 heat and a developing slider. Rajcic slots in behind him as a veteran command pitcher who can eat innings. Vasquez gives Hale a left-handed option on the weekend. If Susac takes the command step forward — and there\'s reason to believe the offseason work will show — this rotation goes from average to dangerous.',
    depth:
      'J.J. Granados (3.12 ERA, 5 saves) anchors the bullpen with a heavy sinker and a sharp slider. Propst can pitch in relief if the rotation is settled. The pen was Arizona\'s quiet strength in 2025, and it returns largely intact. Getting to the seventh with a lead should be enough.',
  },

  lineupAnalysis: {
    engine:
      'Garen Minjares (.312, 9 HR) is the engine. The Tucson native has been the lineup\'s most dependable bat for two years. His left-handed swing generates natural loft, and he uses the whole field. When Minjares gets on, the lineup rolls.',
    middle:
      'Josh Rivera (.282, 11 HR from Florida) and Kade Donoho (.289) form a complementary middle. Rivera brings SEC power. Donoho brings discipline and contact. Together they protect Minjares and make the 3-4-5 a gauntlet for opposing pitchers.',
    supportingCast:
      'Cole Carrigg (39 stolen bases at San Diego State) is a game-changer at the top of the order. His speed puts immediate pressure on pitchers and catchers. Ryan Campos provides solid shortstop production. The lineup is deeper and more balanced than anything Arizona has put on the field since joining the Big 12.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Xavier', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Grand Canyon', location: 'Home', notes: 'In-State Rivalry' },
    { dates: 'Feb 27-Mar 1', opponent: 'Tony Gwynn Classic', location: 'Neutral', notes: 'San Diego — vs. Oregon, USD' },
    { dates: 'Mar 13-15', opponent: 'Arizona State', location: 'Away', notes: 'Big 12 / Territorial Cup' },
    { dates: 'Mar 20-22', opponent: 'Baylor', location: 'Home', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Oklahoma State', location: 'Home', notes: '' },
    { dates: 'Apr 10-12', opponent: 'UCF', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Kansas', location: 'Away', notes: '' },
    { dates: 'May 1-3', opponent: 'TCU', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'BYU', location: 'Away', notes: 'Regular Season Finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 60 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 60 },
    { category: 'Defense', grade: 55 },
    { category: 'Speed/Baserunning', grade: 65 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 60 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'Arizona\'s brand and talent pipeline haven\'t faded — the results just haven\'t caught up yet. The portal brought in an SEC bat (Rivera), a Pac-12 legacy arm (Rajcic), and elite speed (Carrigg). Susac and Vasquez give the rotation upside. The question is whether Chip Hale can put it together in Year 3, because the window is open: the Big 12 is deep but not dominant, and a 40-win season would likely earn Arizona a Regional bid. Four national titles say this program knows what it takes. The 2026 roster might be the one that reminds people.',

  relatedLinks: [
    { label: 'Arizona Team Page', href: '/college-baseball/teams/arizona' },
  ],
};

export default function Arizona2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
