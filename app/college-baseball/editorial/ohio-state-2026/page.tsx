import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ohio State Buckeyes: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Thirteen wins. Thirty-seven losses. The 2025 Ohio State baseball season was historically bad. Justin Haire was hired to fix it. Year two of the rebuild begins with an aggressive portal approach.',
  openGraph: {
    title: 'Ohio State Buckeyes: 2026 Season Preview',
    description:
      'Thirteen wins. Thirty-seven losses. The 2025 Ohio State baseball season was historically bad. Justin Haire was hired to fix it. Year two of the rebuild begins with an aggressive portal approach.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Ohio State',
  teamSlug: 'ohio-state',
  mascot: 'Buckeyes',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Thirteen wins. Thirty-seven losses. Five conference wins out of thirty. The 2025 Ohio State baseball season was historically bad — the worst in modern program history and the kind of year that forces an institution to confront what went wrong at every level. Justin Haire was hired to fix it. Year two of the rebuild begins with a gutted roster, an aggressive portal approach, and a simple mandate: make this program respectable again. The bar is low. That is both the opportunity and the indictment.',

  programStats: {
    allTimeWins: '2,412',
    winPct: '.535',
    cwsAppearances: 3,
    nationalTitles: 0,
    confTitles: 9,
    cwsWins: 2,
  },

  record2025: '13-37 (5-25 Big Ten)',
  record2025Context: 'Historically bad — the worst season in modern Ohio State baseball history',
  seasonStats2025: {
    teamBA: '.228',
    teamERA: '6.15',
    homeRuns: 28,
    stolenBases: 32,
    strikeouts: 312,
    opponentBA: '.298',
  },
  seasonHighlights: [
    'Justin Haire hired after the 2024 season — inherited a roster decimated by transfers and attrition',
    'Marcus Ernst hit .285 as the lone offensive bright spot in an otherwise empty lineup',
    'Gavin Bruni posted a 3.82 ERA in 48 innings — the only pitcher with a sub-4.00 mark',
    'Won a midseason series against Rutgers that provided a rare moment of momentum',
    'Freshman class gained experience through a brutal baptism by fire — 15 players made 20-plus starts',
  ],

  keyReturnees: [
    {
      name: 'Marcus Ernst',
      position: '2B',
      year: 'R-Sr.',
      stats: '.285/.362/.385, 3 HR, 12 SB',
      bio: 'The veteran who stayed. Ernst was one of the few players to post a respectable line in 2025, and his decision to return says something about his belief in Haire\'s vision. Contact-oriented hitter with defensive reliability at second base.',
    },
    {
      name: 'Gavin Bruni',
      position: 'RHP',
      year: 'Jr.',
      stats: '2-6, 3.82 ERA, 52 K, 48 IP',
      bio: 'The best arm on a bad pitching staff. Bruni competed in every start and showed the kind of stuff — low-90s fastball, sharp breaking ball — that can anchor a rotation. The won-loss record is meaningless given the team behind him.',
    },
    {
      name: 'Cole Andrews',
      position: 'OF',
      year: 'So.',
      stats: '.248/.318/.365, 4 HR',
      bio: 'Young outfielder who was thrown into the fire as a freshman and showed glimpses. Athletic with raw tools — the bat needs to catch up to the speed and defense, but the ceiling is there.',
    },
    {
      name: 'Jake Oleszczuk',
      position: 'RHP',
      year: 'So.',
      stats: '4.55 ERA, 38 K, 42 IP',
      bio: 'Hard-throwing freshman who showed flashes between inconsistent outings. His fastball sits 92-94 with riding life. The command needs work, but the raw stuff is intriguing.',
    },
  ],

  transferAdditions: [
    {
      name: 'Tanner Jacobson',
      position: 'SS',
      year: 'Jr.',
      fromSchool: 'Ball State',
      stats: '.298/.375/.452, 8 HR, 18 SB',
      bio: 'MAC standout with a well-rounded game. Provides the shortstop presence Ohio State completely lacked in 2025. Athletic defender with a bat that plays at both ends of the lineup.',
    },
    {
      name: 'Drew Dyer',
      position: 'C',
      year: 'R-Sr.',
      fromSchool: 'Kentucky',
      stats: '.262/.348/.415, 6 HR',
      bio: 'SEC-tested catcher who brings the kind of experience a rebuilding pitching staff needs. Strong arm, commands the zone, and provides leadership behind the plate that was absent in 2025.',
    },
    {
      name: 'Vince Sigilli',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Pittsburgh',
      stats: '5-5, 3.68 ERA, 72 K',
      bio: 'Left-handed starter with ACC experience and a pitch mix built to neutralize right-handed lineups. His changeup is a swing-and-miss pitch. Immediately becomes the best arm on the staff alongside Bruni.',
    },
    {
      name: 'Bryce Bonner',
      position: 'OF/DH',
      year: 'Jr.',
      fromSchool: 'West Virginia',
      stats: '.282/.365/.478, 10 HR',
      bio: 'Power bat from the Big 12 who fills the middle of the order. Physical hitter who can drive the ball to all fields. Adds the run-producing threat Ohio State desperately lacked.',
    },
    {
      name: 'Eli Rosenberg',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'George Mason',
      stats: '3.42 ERA, 68 K, 58 IP',
      bio: 'High-spin right-hander with a fastball-curveball combination that generates swings and misses. Colonial Athletic Association Pitcher of the Year candidate who brings a new level of competitiveness.',
    },
    {
      name: 'Kolton Schaller',
      position: '1B',
      year: 'R-Sr.',
      fromSchool: 'Cincinnati',
      stats: '.278/.368/.465, 9 HR',
      bio: 'Veteran first baseman from the crosstown rival. Provides stability at a position that was a revolving door. His walk rate and power make him a table-setting run producer.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Gavin Bruni (2-6, 3.82 ERA) was the only pitcher on the 2025 staff with a sub-4.00 ERA — and he earned it by competing against lineups that were teeing off on everyone else. He is the Friday starter and the staff\'s identity: a pitcher who will not give in regardless of the score.',
    rotation:
      'Vince Sigilli (from Pittsburgh, 3.68 ERA) gives Haire a legitimate Saturday starter with Power Five experience. Eli Rosenberg (from George Mason, 3.42 ERA) adds a strikeout arm for Sundays. The weekend rotation is dramatically improved — from arguably the worst in the Big Ten to functional in one offseason.',
    depth:
      'The bullpen was a disaster in 2025 — an 8.12 ERA in relief tells the story. Jake Oleszczuk (4.55 ERA) has the arm to pitch in high-leverage spots if the command develops. Haire needs to identify two or three reliable middle-relief options from the portal additions and freshmen. The pen cannot be worse than it was — the question is how much better.',
  },

  lineupAnalysis: {
    engine:
      'Marcus Ernst (.285, 12 SB) is the table-setter and the one returning hitter opponents respect. His decision to stay was the first win of the rebuild. He draws walks, puts the ball in play, and sets the tempo.',
    middle:
      'Bryce Bonner (from West Virginia, .282, 10 HR) and Kolton Schaller (from Cincinnati, .278, 9 HR) add the power Ohio State completely lacked in 2025. The Buckeyes hit 28 home runs as a team last year — Bonner and Schaller should combine for 18-plus by themselves. The middle of the order has a pulse.',
    supportingCast:
      'Tanner Jacobson (from Ball State, .298, 8 HR, 18 SB) is the most well-rounded position player addition. Drew Dyer (from Kentucky, .262) steadies things behind the plate. Cole Andrews (.248) needs a breakout. The lineup is significantly better — whether it is good enough to compete in the Big Ten remains to be seen.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Youngstown State', location: 'Neutral', notes: 'Season Opener at neutral-site tournament' },
    { dates: 'Feb 27-Mar 1', opponent: 'Coastal Carolina', location: 'Away', notes: 'Non-conference road test' },
    { dates: 'Mar 7-9', opponent: 'Wright State', location: 'Home', notes: 'Home opener at Bill Davis Stadium' },
    { dates: 'Mar 20-22', opponent: 'Northwestern', location: 'Away', notes: 'Big Ten Opener' },
    { dates: 'Apr 3-5', opponent: 'Rutgers', location: 'Home', notes: 'Winnable conference series' },
    { dates: 'Apr 10-12', opponent: 'Penn State', location: 'Away', notes: 'Road conference series' },
    { dates: 'Apr 17-19', opponent: 'Maryland', location: 'Home', notes: 'Mid-April conference series' },
    { dates: 'May 1-3', opponent: 'Michigan', location: 'Away', notes: 'Road series against a ranked opponent' },
    { dates: 'May 8-10', opponent: 'Indiana', location: 'Home', notes: 'In-state rivalry with postseason implications' },
    { dates: 'May 15-17', opponent: 'Minnesota', location: 'Home', notes: 'Season finale and Senior Day' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 40 },
    { category: 'Rotation', grade: 45 },
    { category: 'Bullpen', grade: 35 },
    { category: 'Defense', grade: 40 },
    { category: 'Speed/Baserunning', grade: 40 },
    { category: 'Coaching', grade: 50 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'The 2026 Ohio State roster bears almost no resemblance to the 13-37 team that cratered in 2025, and that is entirely the point. Haire gutted the roster, went aggressive in the portal, and brought in experienced players at the positions that mattered most — shortstop, catcher, left-handed pitcher, power bat. The Buckeyes will not contend for a Big Ten title. They probably will not make the NCAA Tournament. But they should win 25-to-30 games, compete in conference series, and establish that the program is no longer in free fall. For a program with 2,400 all-time wins and three CWS appearances, respectability is the floor. Haire\'s job in year two is to build it back to that level. Year three is when the conversation changes.',

  relatedLinks: [
    { label: 'Ohio State Team Page', href: '/college-baseball/teams/ohio-state' },
  ],
};

export default function OhioState2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
