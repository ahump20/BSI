import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Purdue Boilermakers: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Purdue won 31 games in 2025 and went 11-19 in Big Ten play. That disconnect is the program in a sentence: competitive enough outside the conference, unable to sustain it against Big Ten pitching.',
  openGraph: {
    title: 'Purdue Boilermakers: 2026 Season Preview',
    description:
      'Purdue won 31 games in 2025 and went 11-19 in Big Ten play. That disconnect is the program in a sentence: competitive enough outside the conference, unable to sustain it against Big Ten pitching.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Purdue',
  teamSlug: 'purdue',
  mascot: 'Boilermakers',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Purdue won 31 games in 2025 and went 11-19 in Big Ten play. That disconnect is the program in a sentence: competitive enough to beat everyone outside the conference, unable to sustain it against Big Ten pitching. Greg Goff is in year five, and the foundation is built — Alexander Field fills, the recruiting pipeline is stable, and the culture is real. What is missing is the conference breakthrough that separates a good program from a relevant one.',

  programStats: {
    allTimeWins: '1,625',
    winPct: '.488',
    cwsAppearances: 2,
    nationalTitles: 0,
    confTitles: 5,
    cwsWins: 1,
  },

  record2025: '31-23 (11-19 Big Ten)',
  record2025Context: '31 wins but an 11-19 Big Ten record — dominant outside conference, struggled within it',
  seasonStats2025: {
    teamBA: '.272',
    teamERA: '4.52',
    homeRuns: 55,
    stolenBases: 45,
    strikeouts: 415,
    opponentBA: '.268',
  },
  seasonHighlights: [
    'Hit 55 home runs — the most in a Purdue season in program history',
    'Ben Nisle hit .308 with 14 HR, earning All-Big Ten honors',
    'Jackson Smeltz posted a 3.15 ERA as the Friday starter — a true ace performance',
    'Won 20 games before conference play started, building early momentum',
    'Beat Indiana twice in the season series — a rivalry win that mattered to the program',
  ],

  keyReturnees: [
    {
      name: 'Ben Nisle',
      position: '3B',
      year: 'Sr.',
      stats: '.308/.398/.545, 14 HR, 55 RBI',
      bio: 'All-Big Ten performer and the lineup\'s most dangerous bat. Nisle has the power to go deep to any field and the plate discipline to draw walks. He is the one hitter in the lineup that pitchers must game-plan for, and he thrives in that role.',
    },
    {
      name: 'Jackson Smeltz',
      position: 'RHP',
      year: 'Jr.',
      stats: '8-4, 3.15 ERA, 85 K, 88 IP',
      bio: 'Frontline Friday starter with a power fastball that sits 92-95 and a wipeout slider. Smeltz pitched deep into games, averaged six innings per start, and showed the competitiveness of a future professional. The ace of the Big Ten conversations should include his name.',
    },
    {
      name: 'Josh Thompson',
      position: 'OF',
      year: 'Jr.',
      stats: '.282/.362/.442, 8 HR, 18 SB',
      bio: 'Dynamic center fielder with a combination of speed and power that creates matchup problems. Thompson steals bases, plays elite defense, and provides the lineup with a top-of-the-order catalyst.',
    },
    {
      name: 'Marcus Tobeck',
      position: 'C',
      year: 'Sr.',
      stats: '.255/.338/.405, 6 HR',
      bio: 'Veteran catcher who controls the running game and manages the pitching staff. His defensive value exceeds his offensive numbers — the arm is plus and the game-calling is advanced.',
    },
    {
      name: 'Ryan Hare',
      position: 'LHP',
      year: 'So.',
      stats: '4.32 ERA, 48 K, 52 IP',
      bio: 'Young lefty who showed flashes in his freshman season. The changeup is a legitimate weapon, and the command improved as the season progressed. A candidate to pitch his way into the weekend rotation.',
    },
  ],

  transferAdditions: [
    {
      name: 'Chase Cryer',
      position: 'SS',
      year: 'Jr.',
      fromSchool: 'Texas State',
      stats: '.295/.378/.445, 7 HR, 22 SB',
      bio: 'Sun Belt standout who brings five-tool ability to the Big Ten. Cryer can hit, run, throw, field, and hit for power. He fills a shortstop void and adds an element the lineup has not had.',
    },
    {
      name: 'Sam McWilliams',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Auburn',
      stats: '4-3, 3.52 ERA, 62 K',
      bio: 'SEC-tested right-hander who adds credibility to the weekend rotation. McWilliams has a sinker-slider combination that produces ground balls. He has pitched in Hoover. He knows what pressure looks like.',
    },
    {
      name: 'Tyler Washington',
      position: '1B/DH',
      year: 'Jr.',
      fromSchool: 'Southern Illinois',
      stats: '.305/.395/.525, 13 HR',
      bio: 'Missouri Valley Conference power bat who crushed pitching at every level. The question is whether the power translates to Big Ten arms. The bat speed says yes.',
    },
    {
      name: 'Jack Filley',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Illinois',
      stats: '3.75 ERA, 55 K, 48 IP',
      bio: 'Left-handed reliever with Big Ten experience. Filley knows the conference hitters and brings a competitive edge in late innings. His slider is his putaway pitch.',
    },
    {
      name: 'Brett Carmody',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Virginia Tech',
      stats: '.268/.352/.415, 6 HR',
      bio: 'ACC outfielder with gap power and a strong arm. Adds depth and experience to an outfield that already has Thompson. A corner bat who can drive in runs from the six or seven hole.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Jackson Smeltz (8-4, 3.15 ERA, 85 K) is one of the two or three best Friday starters in the Big Ten. His fastball-slider combination generates swings and misses, and he pitches with the intensity of someone who knows that every run matters. When Smeltz pitches, Purdue wins. The issue is what happens when he does not.',
    rotation:
      'Sam McWilliams (from Auburn, 3.52 ERA) adds an SEC arm for Saturdays — the first time in Goff\'s tenure that Purdue has a Power Five-experienced Saturday starter. Ryan Hare (4.32 ERA) is the Sunday option with the most upside, though the lefty will need to prove he can go five-plus innings consistently. The rotation has real depth for the first time.',
    depth:
      'Jack Filley (from Illinois, 3.75 ERA) is the bullpen\'s anchor — a left-hander who knows Big Ten hitters. The pen was exposed in 2025, particularly in conference play where the ERA ballooned over 5.50. Goff needs three reliable relievers to complement Filley, and the freshmen class includes two arms with the stuff to contribute immediately.',
  },

  lineupAnalysis: {
    engine:
      'Ben Nisle (.308, 14 HR) is the lineup\'s engine and identity. He is the one hitter who can change a game with one swing, and opposing pitching staffs will build their game plans around avoiding him in big spots. Nisle in the three-hole is the foundation.',
    middle:
      'Tyler Washington (from SIU, .305, 13 HR) adds a second power threat that takes pressure off Nisle. Together they give the 3-4 combination the thump that was lacking when Nisle was the only threat. Marcus Tobeck (.255, 6 HR) steadies the five-hole with veteran at-bats.',
    supportingCast:
      'Josh Thompson (.282, 8 HR, 18 SB) sets the table with speed and on-base ability. Chase Cryer (from Texas State, .295, 22 SB) adds another dynamic athlete. Brett Carmody (from Virginia Tech, .268, 6 HR) provides a professional bat in the bottom third. The lineup is eight deep — the best Goff has had.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Belmont', location: 'Neutral', notes: 'Season Opener at Nashville round-robin' },
    { dates: 'Feb 27-Mar 1', opponent: 'TCU', location: 'Away', notes: 'Non-conference road test in Fort Worth' },
    { dates: 'Mar 7-9', opponent: 'Indiana State', location: 'Home', notes: 'In-state non-conference at Alexander Field' },
    { dates: 'Mar 20-22', opponent: 'Minnesota', location: 'Away', notes: 'Big Ten Opener in Minneapolis' },
    { dates: 'Apr 3-5', opponent: 'Illinois', location: 'Home', notes: 'Conference home series' },
    { dates: 'Apr 10-12', opponent: 'Northwestern', location: 'Away', notes: 'Road trip to Evanston' },
    { dates: 'Apr 17-19', opponent: 'Indiana', location: 'Home', notes: 'In-state rivalry — biggest home series of the year' },
    { dates: 'May 1-3', opponent: 'Michigan', location: 'Away', notes: 'Road series against Big Ten contender' },
    { dates: 'May 8-10', opponent: 'Nebraska', location: 'Away', notes: 'Late-season road test at Haymarket Park' },
    { dates: 'May 15-17', opponent: 'Iowa', location: 'Home', notes: 'Season finale with potential bubble implications' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 45 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Purdue\'s 2025 issue was not talent — it was conference execution. The Boilermakers hit 55 home runs and won 31 games but went 11-19 in Big Ten play, a split that suggests the pitching depth was not there when it mattered. The 2026 roster addresses that directly: McWilliams gives the rotation an SEC Saturday arm, Filley anchors the bullpen, and the lineup adds Cryer and Washington to a group already featuring Nisle and Thompson. The projection is 33-to-36 wins and a genuine shot at flipping the conference record above .500. If Smeltz pitches like an ace, Nisle drives in 55-plus runs, and the bullpen holds leads, Purdue can play its way into an NCAA Regional conversation for the first time under Goff. The pieces are there. The conference execution has to follow.',

  relatedLinks: [
    { label: 'Purdue Team Page', href: '/college-baseball/teams/purdue' },
  ],
};

export default function Purdue2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
