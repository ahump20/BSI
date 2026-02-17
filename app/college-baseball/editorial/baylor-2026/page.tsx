import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baylor Bears: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Thirty wins and twenty-seven losses tells the story of a team that couldn\'t find consistency. Mitch Thompson enters Year 4 needing the pitching to match the potential.',
  openGraph: {
    title: 'Baylor Bears: 2026 Season Preview',
    description:
      'Thirty wins and twenty-seven losses tells the story of a team that couldn\'t find consistency. Mitch Thompson enters Year 4 needing the pitching to match the potential.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Baylor',
  teamSlug: 'baylor',
  mascot: 'Bears',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Thirty wins and twenty-seven losses tells the story of a team that couldn\'t find consistency. Flashes of legitimate talent — a midweek gem, a series win against a ranked opponent — followed by stretches that kept the Bears on the wrong side of the NCAA Tournament bubble. Mitch Thompson enters Year 4 needing the pitching to match the potential.',

  programStats: {
    allTimeWins: '1,641',
    winPct: '.537',
    cwsAppearances: 5,
    nationalTitles: 0,
    confTitles: 6,
    cwsWins: 8,
  },

  record2025: '30-27 (12-18 Big 12)',
  record2025Context: 'Below .500 in conference play — flashes of talent but unable to sustain success across the full Big 12 gauntlet',
  seasonStats2025: {
    teamBA: '.263',
    teamERA: '4.78',
    homeRuns: 57,
    stolenBases: 59,
    strikeouts: 471,
    opponentBA: '.271',
  },
  seasonHighlights: [
    'Won a midseason series against #15 Oklahoma State on the road',
    'Tyler Thomas named Second Team All-Big 12 for pitching',
    'Outscored opponents in the first three innings but surrendered leads in the middle innings',
    'Drew 20,000+ fans to Baylor Ballpark for the TCU series — program-record attendance',
  ],

  keyReturnees: [
    {
      name: 'Tyler Thomas',
      position: 'LHP',
      year: 'Sr.',
      stats: '6-6, 3.64 ERA, 94 K in 84.1 IP',
      bio: 'The ace. Left-handed with a fastball that sits 91-93 and a slider that sweeps across the zone. Second Team All-Big 12 as a junior. When Thomas pitches, Baylor competes with anyone in the conference. The problem was the other six days of the week.',
    },
    {
      name: 'Kolby Branch',
      position: 'SS',
      year: 'Jr.',
      stats: '.291/.368/.442, 8 HR, 41 RBI',
      bio: 'Best all-around position player on the roster. Athletic shortstop who covers ground and has enough bat to hit in the 3-hole. Led the team in hits and doubles. The kind of player you build around.',
    },
    {
      name: 'Chase Sanguinetti',
      position: 'OF',
      year: 'Sr.',
      stats: '.278/.352/.401, 5 HR, 32 RBI, 16 SB',
      bio: 'Speed-first outfielder who creates havoc on the bases. Sixteen stolen bases provide a dimension Baylor needs. Bat is line-drive oriented — not much power, but he puts the ball in play and makes things happen.',
    },
    {
      name: 'Bennett Hostetler',
      position: 'C',
      year: 'Jr.',
      stats: '.254/.338/.388, 6 HR',
      bio: 'Physical catcher with developing offensive skills. Threw out 31% of base stealers. The bat improved month over month in 2025 — a full offseason of development could push him toward all-conference consideration.',
    },
    {
      name: 'Blake Helton',
      position: 'RHP',
      year: 'Jr.',
      stats: '4-5, 4.31 ERA, 68 K in 62.2 IP',
      bio: 'Number two starter with a mid-90s fastball and a hard curveball. The stuff is Friday-night caliber — the consistency has been Saturday-caliber. If Helton harnesses the command, the rotation gets significantly deeper.',
    },
    {
      name: 'Mason Green',
      position: 'RHP',
      year: 'So.',
      stats: '3.42 ERA, 3 SV, 41 K in 34.1 IP',
      bio: 'Freshman reliever who earned the closer role down the stretch. Power arm with a 95-mph fastball and a slider that dives out of the zone. Limited innings as a freshman — a bigger role awaits.',
    },
  ],

  transferAdditions: [
    {
      name: 'Blake Wright',
      position: '1B/DH',
      year: 'R-Sr.',
      fromSchool: 'Mississippi State',
      stats: '.293/.381/.512, 14 HR, 56 RBI',
      bio: 'SEC power bat who immediately upgrades the middle of the order. Physical first baseman who punishes mistakes. Baylor\'s lineup was missing a cleanup hitter — Wright is exactly that.',
    },
    {
      name: 'Will Dion',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Duke',
      stats: '3.78 ERA, 71 K in 66.2 IP',
      bio: 'ACC arm with a four-pitch mix and advanced command. Not a power pitcher — a pitchability pitcher who changes speeds and locates. Slides into the Sunday rotation role and gives Thompson three legitimate weekend arms.',
    },
    {
      name: 'Travis Chestnut',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Texas State',
      stats: '.312/.391/.467, 7 HR, 24 SB',
      bio: 'Speed-power combination from the Sun Belt. Joins Sanguinetti to give Baylor two outfielders who can steal bases and hit in the gaps. Knows Texas baseball.',
    },
    {
      name: 'Carson Rudd',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Oklahoma',
      stats: '3.12 ERA, 48 K in 40.1 IP',
      bio: 'Left-handed reliever from the Big 12 who deepens the bullpen. Knows the conference hitters. Changeup-heavy approach that neutralizes right-handed lineups.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Tyler Thomas is a legitimate ace — 3.64 ERA, 94 strikeouts, Second Team All-Big 12. When he pitches, Baylor plays like a ranked team. The challenge is building a rotation and bullpen around him that doesn\'t give back what Thomas earns. The 4.78 team ERA was the anchor that sank 2025.',
    rotation:
      'Thomas leads the way on Friday. Blake Helton (4.31 ERA, mid-90s stuff) slots in on Saturday — the talent is there, the consistency needs to arrive. Will Dion (3.78 ERA from Duke) gives Thompson a legitimate third starter with command and a four-pitch mix. If Helton delivers on his potential, this is a top-half Big 12 rotation. If not, it\'s Thomas and a question mark.',
    depth:
      'Mason Green (3.42 ERA, 95 mph) is a weapon out of the bullpen. Carson Rudd (from Oklahoma) adds a left-handed option. The late innings are in better shape than 2025. The middle innings — the fifth and sixth — are where Baylor bled runs last year. Deepening the pen by one or two reliable arms was the offseason priority, and the portal addressed it.',
  },

  lineupAnalysis: {
    engine:
      'Kolby Branch (.291, 8 HR, 41 RBI) is the engine. He\'s the best position player on the roster, plays a premium position, and has the bat to hit anywhere in the lineup. If Branch takes a power step as a junior, he\'s an all-conference player.',
    middle:
      'Blake Wright (.293, 14 HR from Mississippi State) is the missing piece. Baylor\'s lineup didn\'t have a legitimate cleanup hitter in 2025 — Wright is exactly that. SEC power, veteran approach, physical presence. Branch-Wright as the 3-4 combination gives the Bears a middle that opposing pitchers have to respect.',
    supportingCast:
      'Chase Sanguinetti (16 SB) and Travis Chestnut (24 SB from Texas State) give Baylor two speedsters in the outfield. Bennett Hostetler provides stability behind the plate. The lineup is better than 2025 — deeper, more athletic, and with a genuine power threat in the cleanup spot for the first time in Thompson\'s tenure.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Oral Roberts', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Wichita State', location: 'Home', notes: '' },
    { dates: 'Feb 27-Mar 1', opponent: 'Shriners Classic', location: 'Neutral', notes: 'Houston — vs. Rice, Sam Houston' },
    { dates: 'Mar 13-15', opponent: 'Kansas State', location: 'Home', notes: 'Big 12 Opener' },
    { dates: 'Mar 20-22', opponent: 'Arizona', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Texas Tech', location: 'Home', notes: '' },
    { dates: 'Apr 10-12', opponent: 'Oklahoma State', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'UCF', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Houston', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'TCU', location: 'Away', notes: 'Regular Season Finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 55 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 50 },
    { category: 'Schedule Difficulty', grade: 60 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Baylor is the definition of a bubble team. Tyler Thomas gives them a Friday ace who can beat anyone. Blake Wright from the portal gives them a cleanup hitter they didn\'t have. The speed in the outfield is real. But the margin for error in the Big 12 is razor-thin, and 12-18 in conference play means the Bears were on the wrong side of too many close games. If Helton takes the step, if the bullpen holds leads, if the middle innings stop leaking runs — that\'s a lot of ifs. Thompson is building something, but 2026 is the year the program needs to prove it can compete for an NCAA bid, not just hope for one.',

  relatedLinks: [
    { label: 'Baylor Team Page', href: '/college-baseball/teams/baylor' },
  ],
};

export default function Baylor2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
