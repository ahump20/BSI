import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Houston Cougars: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Sixteen years. Six CWS appearances in program history but none under Todd Whitting. The Big 12 move has been unkind to a program that dominated the AAC.',
  openGraph: {
    title: 'Houston Cougars: 2026 Season Preview',
    description:
      'Sixteen years. Six CWS appearances in program history but none under Todd Whitting. The Big 12 move has been unkind to a program that dominated the AAC.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Houston',
  teamSlug: 'houston',
  mascot: 'Cougars',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Sixteen years. Six CWS appearances in program history but none under Todd Whitting. The Big 12 move has been unkind to a program that dominated the AAC, and with Whitting\'s contract winding down, 2026 is a season with stakes beyond the diamond. Houston has the talent to be a bubble team — whether they have the margin to break through is the question.',

  programStats: {
    allTimeWins: '1,823',
    winPct: '.561',
    cwsAppearances: 6,
    nationalTitles: 0,
    confTitles: 14,
    cwsWins: 10,
  },

  record2025: '32-26 (14-16 Big 12)',
  record2025Context: 'Competitive but not enough — missed postseason',
  seasonStats2025: {
    teamBA: '.268',
    teamERA: '4.54',
    homeRuns: 62,
    stolenBases: 58,
    strikeouts: 465,
    opponentBA: '.261',
  },
  seasonHighlights: [
    'Ian Mejia hit .321 with 14 HR — named All-Big 12 Second Team',
    'Anthony Avalos posted a 3.18 ERA with 94 strikeouts as the Friday ace',
    'Won series at TCU in April for the signature Big 12 road win',
    'Team slugged .421 — best in program history under Whitting',
    'Stole 58 bases while cutting caught-stealing rate to 18%',
  ],

  keyReturnees: [
    {
      name: 'Ian Mejia',
      position: 'SS',
      year: 'Jr.',
      stats: '.321/.398/.542, 14 HR, 52 RBI',
      bio: 'The best position player in the program. Plus bat speed, power to all fields, and shortstop defense that grades out above average. A potential top-5-round draft pick who needs to lead this team to the postseason.',
    },
    {
      name: 'Anthony Avalos',
      position: 'LHP',
      year: 'Sr.',
      stats: '8-4, 3.18 ERA, 94 K',
      bio: 'Houston\'s ace and the pitcher who gives them a chance every Friday. Four-pitch lefty who competes deep into games. Needs to be elite, not just good, for Houston to break through.',
    },
    {
      name: 'Jaime Perez',
      position: 'OF',
      year: 'Sr.',
      stats: '.288/.362/.438, 7 HR, 22 SB',
      bio: 'Athletic outfielder who does a little of everything. Runs, hits for average, and plays above-average defense in center. The table-setter Whitting needs at the top of the lineup.',
    },
    {
      name: 'Rece Ritchey',
      position: 'C',
      year: 'Jr.',
      stats: '.261/.342/.398, 6 HR',
      bio: 'Improved significantly behind the plate in 2025. Threw out 34% of base stealers and his bat is trending up. The staff trusts him.',
    },
    {
      name: 'Derek Dobyns',
      position: 'RHP',
      year: 'Jr.',
      stats: '4-3, 3.87 ERA, 68 K',
      bio: 'Power righty with a mid-90s fastball. Saturday starter who misses bats but occasionally gets hurt by walks. The ceiling is high if the command tightens.',
    },
    {
      name: 'Lael Lockhart III',
      position: 'LHP',
      year: 'Jr.',
      stats: '2.92 ERA, 4 SV, 37 K in 34 IP',
      bio: 'Left-handed reliever with elite swing-and-miss stuff. The closer by committee in 2025 — could lock down the ninth in 2026 with a bigger role.',
    },
  ],

  transferAdditions: [
    {
      name: 'Nolan Schubart',
      position: 'OF/1B',
      year: 'Jr.',
      fromSchool: 'Michigan',
      stats: '.298/.378/.512, 11 HR',
      bio: 'Big Ten slugger with plus power who mashed in the Midwest. Houston\'s biggest portal win — adds a right-handed power bat to the middle of the order.',
    },
    {
      name: 'Cody Spence',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Dallas Baptist',
      stats: '3.24 ERA, 78 K',
      bio: 'DFW product who thrived in the WAC. Power fastball/slider combination gives Whitting a Sunday starter or high-leverage bullpen arm.',
    },
    {
      name: 'Eric Hammond',
      position: '2B',
      year: 'Jr.',
      fromSchool: 'Rice',
      stats: '.274/.358/.382, 4 HR',
      bio: 'Cross-town transfer who knows the Houston baseball landscape. Smart hitter with strong defensive instincts at second base.',
    },
    {
      name: 'Miguel Saldana',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Sam Houston',
      stats: '2.88 ERA, 54 K in 50 IP',
      bio: 'In-state reliever with a heavy sinker. Ground-ball pitcher who keeps the ball in the park. Adds critical bullpen depth.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Anthony Avalos (8-4, 3.18 ERA, 94 K) is a legitimate Friday ace — a four-pitch lefty who competes deep into games and limits damage. He is the reason Houston can win any series opener. The question is whether the arms behind him can hold serve on Saturday and Sunday, because in 2025 too many winnable series slipped away in games two and three.',
    rotation:
      'Derek Dobyns (3.87 ERA, 68 K) has mid-90s stuff and misses bats. When his command is on, he looks like a Big 12 Saturday arm. When it wavers, he walks himself into trouble. Cody Spence (from Dallas Baptist, 3.24 ERA) competes for the Sunday spot with some returning sophomores. The rotation is viable — it just needs consistency from the two and three slots.',
    depth:
      'Lael Lockhart III (2.92 ERA, 4 SV) is the bullpen anchor. Miguel Saldana (from Sam Houston, 2.88 ERA) adds a ground-ball machine in the middle innings. The pen was average in 2025 and needs to be above average for Houston to make a push. Lockhart stepping into a full-time closer role would help structure the late innings.',
  },

  lineupAnalysis: {
    engine:
      'Ian Mejia (.321, 14 HR, 52 RBI) is the best player on the team and one of the best shortstops in the Big 12. His combination of bat speed, power, and contact is rare — he hit .321 in Big 12 play, not just against midweek opponents. Everything in this lineup revolves around what Mejia does.',
    middle:
      'Nolan Schubart (from Michigan, .298, 11 HR) gives Mejia protection he did not have in 2025. Rece Ritchey (.261, 6 HR) provides catching production that is trending up. The middle of the order is deeper than last year — three hitters who can leave the yard instead of one.',
    supportingCast:
      'Jaime Perez (.288, 22 SB) sets the table with speed and on-base ability. Eric Hammond (from Rice, .274) adds a smart bat at second base. The lineup should score more runs than 2025 — the question is whether the improvement is enough to push them from bubble to lock.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Lamar', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'LSU', location: 'Neutral', notes: 'Shriners Classic' },
    { dates: 'Mar 6-8', opponent: 'Rice', location: 'Away', notes: 'Silver Glove Series' },
    { dates: 'Mar 13-15', opponent: 'Arizona State', location: 'Home', notes: 'Big 12 Opener' },
    { dates: 'Mar 27-29', opponent: 'Oklahoma State', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Cincinnati', location: 'Away', notes: '' },
    { dates: 'Apr 17-19', opponent: 'TCU', location: 'Home', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Texas Tech', location: 'Away', notes: '' },
    { dates: 'May 1-3', opponent: 'Kansas', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'UCF', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 50 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 50 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Houston has the pieces to be a postseason team — Mejia is a star, Avalos is a Friday ace, and the portal class addresses real needs. The problem is margin. In 2025 the Cougars went 14-16 in Big 12 play and missed the tournament. They need to flip three or four of those conference losses into wins. Whitting is coaching for his job, which can be galvanizing or suffocating depending on how the early season goes. If the roster comes together, Houston is a regional team. If the inconsistency returns, it is another year of what-ifs for a program that has not been to Omaha since 1967.',

  relatedLinks: [
    { label: 'Houston Team Page', href: '/college-baseball/teams/houston' },
  ],
};

export default function Houston2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
