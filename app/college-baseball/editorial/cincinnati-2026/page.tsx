import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cincinnati Bearcats: 2026 Season Preview | Blaze Sports Intel',
  description:
    'The Bearcats were an AAC force for a decade. Two years into the Big 12, they are learning a different kind of baseball — deeper rotations, thicker lineups, and no easy weekends.',
  openGraph: {
    title: 'Cincinnati Bearcats: 2026 Season Preview',
    description:
      'The Bearcats were an AAC force for a decade. Two years into the Big 12, they are learning a different kind of baseball — deeper rotations, thicker lineups, and no easy weekends.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Cincinnati',
  teamSlug: 'cincinnati',
  mascot: 'Bearcats',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'The Bearcats were an AAC force for a decade. Two years into the Big 12, they are learning a different kind of baseball — deeper rotations, thicker lineups, and no easy weekends. Ty Neal is building, not rebuilding, but the timeline demands patience that the record does not always reflect.',

  programStats: {
    allTimeWins: '1,512',
    winPct: '.524',
    cwsAppearances: 2,
    nationalTitles: 0,
    confTitles: 8,
    cwsWins: 2,
  },

  record2025: '25-30 (10-20 Big 12)',
  record2025Context: 'Below .500 — Big 12 grind exposed pitching depth',
  seasonStats2025: {
    teamBA: '.255',
    teamERA: '5.38',
    homeRuns: 48,
    stolenBases: 41,
    strikeouts: 402,
    opponentBA: '.284',
  },
  seasonHighlights: [
    'Victor Gonzalez led the team with 10 HR and 38 RBI',
    'Bradyn Boes posted a 3.72 ERA as Friday starter with 82 strikeouts',
    'Swept a midweek series against Wright State and Miami (OH)',
    'Won a Big 12 road series at Kansas in early April',
    'Team defense improved to .971 fielding percentage — best in five years',
  ],

  keyReturnees: [
    {
      name: 'Victor Gonzalez',
      position: '3B',
      year: 'Sr.',
      stats: '.289/.368/.492, 10 HR, 38 RBI',
      bio: 'Miami native with power to all fields. The one middle-of-the-order bat who consistently punishes mistakes. Needs to carry a heavier load in 2026.',
    },
    {
      name: 'Bradyn Boes',
      position: 'RHP',
      year: 'Jr.',
      stats: '6-6, 3.72 ERA, 82 K',
      bio: 'The ace. Competes with a four-pitch mix and goes deep into starts. His ability to limit damage keeps Cincinnati in games they have no business being in.',
    },
    {
      name: 'Cam Collier',
      position: 'SS',
      year: 'Jr.',
      stats: '.262/.338/.365, 3 HR, 14 SB',
      bio: 'Shortstop with quick hands and reliable range. The offense is developing — he sprays the ball and uses his speed on the bases.',
    },
    {
      name: 'Tommy & Timmy Knipper',
      position: 'OF/INF',
      year: 'So.',
      stats: '.248/.312/.341 (combined)',
      bio: 'Twin brothers who both cracked the lineup as freshmen. Athletic, competitive, and represent the program\'s recruiting trajectory.',
    },
    {
      name: 'Jaylen Davis',
      position: 'LHP',
      year: 'Jr.',
      stats: '3-5, 4.45 ERA, 58 K',
      bio: 'Left-handed Saturday starter with a sharp slider. Walks too many hitters but the stuff plays in the Big 12 when he commands it.',
    },
  ],

  transferAdditions: [
    {
      name: 'Luke Napolitano',
      position: 'C',
      year: 'Jr.',
      fromSchool: 'Vanderbilt',
      stats: '.241/.328/.378, 4 HR',
      bio: 'SEC-experienced catcher who knows how to handle a pitching staff. His game-calling will elevate the entire rotation.',
    },
    {
      name: 'Tyler Sanchez',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'East Carolina',
      stats: '3.41 ERA, 67 K',
      bio: 'AAC pitcher who thrived at ECU. Adds immediate bullpen credibility with a mid-90s fastball and late-breaking slider.',
    },
    {
      name: 'Mason Auer',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Virginia Tech',
      stats: '.272/.354/.428, 6 HR',
      bio: 'Left-handed bat with gap power and plus defensive range. Fills a critical outfield need.',
    },
    {
      name: 'Noah Cameron',
      position: '1B/DH',
      year: 'R-Sr.',
      fromSchool: 'Kent State',
      stats: '.301/.388/.512, 12 HR',
      bio: 'MAC power bat who mashed in the mid-major ranks. The jump to Big 12 pitching is real, but the raw power is legitimate.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Bradyn Boes (6-6, 3.72 ERA, 82 K) is a legitimate Big 12 Friday starter. The stuff plays — four pitches, competes deep into games, and limits damage. But the 5.38 team ERA tells the real story: everything behind Boes was exposed in 2025. Cincinnati needs at least two of their portal arms to deliver league-average innings.',
    rotation:
      'Jaylen Davis (4.45 ERA) has the stuff for a Saturday start but walks too many. The Sunday spot is open — could be a portal arm or a breakout sophomore. Tyler Sanchez (from East Carolina, 3.41 ERA) may push for a rotation spot over a bullpen role. Neal needs answers here by March.',
    depth:
      'The bullpen was Cincinnati\'s Achilles heel in 2025 — too many short starts, too many high-leverage innings with low-leverage arms. Sanchez helps. If the rotation can consistently go six innings, the bullpen math improves. If not, the Bearcats are looking at another season of grinding close games with a thin pen.',
  },

  lineupAnalysis: {
    engine:
      'Victor Gonzalez (.289, 10 HR) is the one bat that can change a game. He drives the ball to all fields with above-average exit velocity, and Big 12 pitchers know it — he sees fewer fastballs than anyone in the Cincinnati lineup. His plate discipline is what separates him.',
    middle:
      'Noah Cameron (from Kent State, .301, 12 HR) adds a power bat but has to prove he can hit Big 12 breaking stuff. Luke Napolitano (from Vanderbilt) brings SEC at-bats and a catcher\'s intelligence to the order. The middle of the lineup is improved — the question is whether it is improved enough.',
    supportingCast:
      'Cam Collier (.262, 14 SB) needs to get on base more to unlock his speed. Mason Auer (from Virginia Tech, .272, 6 HR) adds a left-handed bat with some pop. The Knipper twins are athletic wildcards. The bottom of the order has to be more productive than 2025 — too many automatic outs killed rallies.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Eastern Kentucky', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Illinois', location: 'Neutral', notes: 'Round Rock Classic' },
    { dates: 'Mar 6-8', opponent: 'Dayton', location: 'Home', notes: '' },
    { dates: 'Mar 13-15', opponent: 'Kansas', location: 'Home', notes: 'Big 12 Opener' },
    { dates: 'Mar 27-29', opponent: 'UCF', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Houston', location: 'Home', notes: '' },
    { dates: 'Apr 17-19', opponent: 'West Virginia', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Oklahoma State', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Arizona State', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'BYU', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 40 },
    { category: 'Rotation', grade: 45 },
    { category: 'Bullpen', grade: 35 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 40 },
    { category: 'Coaching', grade: 45 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'Cincinnati is not far from being competitive in the Big 12 — they have a real Friday starter in Boes, a run producer in Gonzalez, and useful portal additions. But the gap between the Bearcats and the top half of the conference is still real, especially in pitching depth and offensive consistency. Ty Neal is recruiting well and the program infrastructure is improving. This is a team that could steal two or three conference series and play spoiler, but a postseason run requires a leap in bullpen production that has not happened yet.',

  relatedLinks: [
    { label: 'Cincinnati Team Page', href: '/college-baseball/teams/cincinnati' },
  ],
};

export default function Cincinnati2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
