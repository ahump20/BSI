import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Northwestern Wildcats: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Northwestern plays baseball the way it does everything — meticulously, with a plan, and against the grain of programs that have more of everything. Ben Greenspan is in year three.',
  openGraph: {
    title: 'Northwestern Wildcats: 2026 Season Preview',
    description:
      'Northwestern plays baseball the way it does everything — meticulously, with a plan, and against the grain of programs that have more of everything. Ben Greenspan is in year three.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Northwestern',
  teamSlug: 'northwestern',
  mascot: 'Wildcats',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Northwestern plays baseball the way it does everything — meticulously, with a plan, and against the grain of programs that have more of everything. Ben Greenspan is in year three, building a culture rooted in pitch design, analytics, and player development in a market where the Cubs and White Sox draft prospects out of high school. The Wildcats went 25-27 in 2025, a record that does not capture how competitive they were in Big Ten play. Evanston is not a baseball factory. It does not need to be.',

  programStats: {
    allTimeWins: '1,218',
    winPct: '.445',
    cwsAppearances: 1,
    nationalTitles: 0,
    confTitles: 2,
    cwsWins: 0,
  },

  record2025: '25-27 (13-17 Big Ten)',
  record2025Context: 'Below .500 overall but won 13 conference games — competitive in most series',
  seasonStats2025: {
    teamBA: '.255',
    teamERA: '4.55',
    homeRuns: 38,
    stolenBases: 65,
    strikeouts: 410,
    opponentBA: '.265',
  },
  seasonHighlights: [
    'Won 13 Big Ten games — matching the program\'s best conference total in four years',
    'Ethan O\'Donnell hit .302 with 5 HR and 28 SB as the catalyst',
    'Sean Sullivan posted a 3.38 ERA as the ace — one of the Big Ten\'s best Friday starters',
    'Led the Big Ten in stolen bases (65) with an aggressive, analytics-driven baserunning approach',
    'Beat Michigan State and Purdue in conference series — signature wins for a program rebuilding',
  ],

  keyReturnees: [
    {
      name: 'Ethan O\'Donnell',
      position: 'OF',
      year: 'Sr.',
      stats: '.302/.398/.425, 5 HR, 28 SB',
      bio: 'The igniter. Elite speed, elite on-base skills, and a bat-to-ball ability that makes him nearly impossible to sit down. O\'Donnell sets the tone every game and is the program\'s best offensive player in a decade.',
    },
    {
      name: 'Sean Sullivan',
      position: 'LHP',
      year: 'Jr.',
      stats: '5-6, 3.38 ERA, 75 K',
      bio: 'Friday ace with a deceptive delivery and three above-average pitches. His changeup is the equalizer — it makes the fastball play faster and keeps hitters off-balance. Won-loss record is misleading; he pitched well enough to win nearly every start.',
    },
    {
      name: 'Anthony Calarco',
      position: 'SS',
      year: 'Jr.',
      stats: '.268/.352/.382, 4 HR, 15 SB',
      bio: 'Switch-hitting shortstop with defensive range and a mature approach at the plate. Makes the routine plays and occasionally makes the spectacular one. The offensive game is still growing.',
    },
    {
      name: 'Nick Paciorek',
      position: '1B',
      year: 'Jr.',
      stats: '.275/.358/.455, 8 HR',
      bio: 'The power bat in the lineup. Paciorek has the loft in his swing to hit 12-plus home runs if he gets more consistent at-bats. His first-base defense is solid, and the bat has progressed each year.',
    },
    {
      name: 'Ryan Hogan',
      position: 'RHP',
      year: 'So.',
      stats: '4.12 ERA, 48 K, 55 IP',
      bio: 'Young right-hander who showed flashes of dominance as a freshman. His slider is a legitimate putaway pitch. The challenge is going deeper into games — he fatigued in the back half of the season.',
    },
  ],

  transferAdditions: [
    {
      name: 'Jake Wahlstrom',
      position: 'C',
      year: 'R-Sr.',
      fromSchool: 'Michigan',
      stats: '.258/.342/.395, 5 HR',
      bio: 'Experienced Big Ten catcher who brings leadership and defensive stability. His familiarity with conference hitters and pitchers is an underrated asset.',
    },
    {
      name: 'Daniel Vicario',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Evansville',
      stats: '4-3, 3.45 ERA, 65 K',
      bio: 'Missouri Valley arm with strikeout stuff and a competitive edge. Slots into the weekend rotation and gives Greenspan a high-spin fastball and tight breaking ball.',
    },
    {
      name: 'Luke Hammond',
      position: 'OF/DH',
      year: 'Jr.',
      fromSchool: 'Indiana State',
      stats: '.292/.378/.482, 10 HR',
      bio: 'Run producer from the Missouri Valley who brings the power bat Northwestern has lacked in the middle of the order. Physical hitter with plus raw power.',
    },
    {
      name: 'Brett Szymanski',
      position: 'LHP',
      year: 'So.',
      fromSchool: 'Illinois',
      stats: '3.78 ERA, 35 K, 31 IP',
      bio: 'Left-handed reliever with Big Ten experience. His slider-changeup combination gives Greenspan a weapon against both sides of the plate in late innings.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Sean Sullivan (5-6, 3.38 ERA) is the staff\'s identity — a left-hander who outpitches his stuff with deception, sequencing, and a changeup that might be the best in the Big Ten. He does not overpower anyone. He outthinks them. That is Northwestern baseball in one pitcher.',
    rotation:
      'Daniel Vicario (from Evansville, 3.45 ERA) adds a Saturday arm with strikeout ability. Ryan Hogan (4.12 ERA) has the slider to pitch on Sundays but needs to build stamina. The rotation is thin after the top two — Greenspan will need creative bullpen management to cover seven-game weeks.',
    depth:
      'Brett Szymanski (from Illinois, 3.78 ERA) is the best bullpen addition. The relief corps was inconsistent in 2025, and Northwestern cannot afford blown leads with a lineup that does not score in bunches. The bullpen will determine whether 25 wins becomes 30.',
  },

  lineupAnalysis: {
    engine:
      'Ethan O\'Donnell (.302, 28 SB) is the engine, the igniter, and the identity. He gets on base, steals bases, and scores runs. The lineup is built around his ability to create chaos on the basepaths. When O\'Donnell reaches, Northwestern scores. When he does not, the lineup stalls.',
    middle:
      'Nick Paciorek (.275, 8 HR) provides the power from the middle of the order. Luke Hammond (from Indiana State, .292, 10 HR) adds a legitimate run producer. Together they give Northwestern a 3-4 combination that can drive in runs without relying exclusively on speed and manufacturing.',
    supportingCast:
      'Anthony Calarco (.268, 15 SB) adds versatility from both sides of the plate. Jake Wahlstrom (from Michigan, .258) brings a veteran presence behind the plate. The bottom of the order needs to improve its on-base percentage — in 2025, the 7-8-9 hitters combined for a .295 OBP, which is not sustainable.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Lipscomb', location: 'Neutral', notes: 'Season Opener at Nashville tournament' },
    { dates: 'Feb 27-Mar 1', opponent: 'Houston', location: 'Away', notes: 'Non-conference road test against Big 12 pitching' },
    { dates: 'Mar 7-9', opponent: 'UIC', location: 'Home', notes: 'Chicago rivalry at Rocky Miller Park' },
    { dates: 'Mar 20-22', opponent: 'Ohio State', location: 'Home', notes: 'Big Ten Opener' },
    { dates: 'Apr 3-5', opponent: 'Michigan State', location: 'Away', notes: 'Road conference series' },
    { dates: 'Apr 10-12', opponent: 'Purdue', location: 'Home', notes: 'Mid-April conference series' },
    { dates: 'Apr 17-19', opponent: 'Indiana', location: 'Away', notes: 'Road series in Bloomington' },
    { dates: 'May 1-3', opponent: 'Illinois', location: 'Home', notes: 'In-state rivalry series' },
    { dates: 'May 8-10', opponent: 'Rutgers', location: 'Away', notes: 'East Coast road trip' },
    { dates: 'May 15-17', opponent: 'Maryland', location: 'Home', notes: 'Senior weekend and season finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 40 },
    { category: 'Rotation', grade: 50 },
    { category: 'Bullpen', grade: 40 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 50 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'Northwestern is not going to outrecruit anyone in the Big Ten. Greenspan knows this and has built accordingly — a pitching lab that develops arms, a baserunning philosophy that creates pressure, and a portal strategy that targets specific needs rather than chasing stars. Sullivan is a legitimate ace. O\'Donnell is one of the most dynamic players in the conference. But the roster is thin, the bullpen is a question, and the lineup lacks the depth to sustain runs against the Big Ten\'s best pitching. This is a 26-to-29-win team that will steal a series or two from programs with more talent and lose a series or two they should not. That is the Northwestern model — competitive, smart, and always playing the game within the game.',

  relatedLinks: [
    { label: 'Northwestern Team Page', href: '/college-baseball/teams/northwestern' },
  ],
};

export default function Northwestern2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
