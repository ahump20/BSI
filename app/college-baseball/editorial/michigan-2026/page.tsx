import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Michigan Wolverines: 2026 Season Preview | Blaze Sports Intel',
  description:
    "Michigan reached the CWS finals in 2019 and has been chasing that standard ever since. Tracy Smith's third season in Ann Arbor begins with a roster that has the pitching to compete.",
  openGraph: {
    title: 'Michigan Wolverines: 2026 Season Preview',
    description:
      "Michigan reached the CWS finals in 2019 and has been chasing that standard ever since. Tracy Smith's third season in Ann Arbor begins with a roster that has the pitching to compete.",
  },
};

const data: TeamPreviewData = {
  teamName: 'Michigan',
  teamSlug: 'michigan',
  mascot: 'Wolverines',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Michigan reached the CWS finals in 2019 and has been chasing that standard ever since. Tracy Smith\'s third season in Ann Arbor begins with a roster that has the pitching to compete at the top of the Big Ten and the lineup question marks that will determine how far they go.',

  programStats: {
    allTimeWins: '2,138',
    winPct: '.573',
    cwsAppearances: 8,
    nationalTitles: 0,
    confTitles: 23,
    cwsWins: 12,
  },

  record2025: '33-23 (16-14 Big Ten)',
  record2025Context: 'Solid season, middle of the Big Ten pack',
  seasonStats2025: {
    teamBA: '.265',
    teamERA: '3.89',
    homeRuns: 58,
    stolenBases: 54,
    strikeouts: 498,
    opponentBA: '.239',
  },
  seasonHighlights: [
    'Won 33 games and reached the NCAA Tournament under Tracy Smith for the first time',
    'Pitching staff posted a 3.89 ERA — third-best in the Big Ten',
    'Clark Elliott earned First Team All-Big Ten honors and was drafted in the 4th round',
    'Won a road series at USC and took two of three from Indiana',
    'Freshman class contributed immediately — four true freshmen in the regular lineup by May',
  ],

  keyReturnees: [
    {
      name: 'Ted Burton',
      position: 'OF',
      year: 'Jr.',
      stats: '.308/.401/.489, 10 HR, 48 RBI',
      bio: 'Grosse Pointe native. Michigan\'s best returning hitter after Clark Elliott\'s departure. Gap-to-gap power with a high on-base approach.',
    },
    {
      name: 'Riley Bertram',
      position: '3B',
      year: 'Jr.',
      stats: '.289/.371/.441, 8 HR',
      bio: 'Traverse City product. Line-drive hitter who defends the hot corner well. Consistent presence in the middle of the order.',
    },
    {
      name: 'Connor O\'Halloran',
      position: 'LHP',
      year: 'Sr.',
      stats: '8-3, 3.12 ERA, 106 K in 92.1 IP',
      bio: 'Ann Arbor native. Michigan\'s Friday night ace with a three-pitch mix headlined by a plus changeup. Pitched his best in the biggest games — 2.41 ERA in Big Ten play.',
    },
    {
      name: 'Chase Allen',
      position: 'RHP',
      year: 'Jr.',
      stats: '6-4, 3.67 ERA, 81 K in 76 IP',
      bio: 'Kalamazoo product. Power arm with a mid-90s fastball and a developing slider. Saturday starter who has the stuff to be an ace on most staffs.',
    },
    {
      name: 'Evan Hill',
      position: 'RHP',
      year: 'Jr.',
      stats: '2.31 ERA, 8 SV, 51 K in 39 IP',
      bio: 'Grand Rapids native. High-leverage closer with an 80-grade slider. One of the best ninth-inning arms in the country.',
    },
    {
      name: 'Nolan Schanuel',
      position: '1B',
      year: 'So.',
      stats: '.271/.368/.412, 6 HR',
      bio: 'Plymouth product. Patient left-handed bat who led the team in walks as a freshman. Projects as a high-OBP, middle-of-the-order hitter.',
    },
  ],

  transferAdditions: [
    {
      name: 'Gavin Kilen',
      position: 'SS',
      year: 'Jr.',
      fromSchool: 'Mississippi State',
      stats: '.296/.379/.452, 8 HR, 16 SB',
      bio: 'SEC shortstop who fills Michigan\'s biggest roster hole. Speed, defense, and an advanced offensive profile. Immediate starter.',
    },
    {
      name: 'Tyler Locklear',
      position: 'INF/DH',
      year: 'R-Sr.',
      fromSchool: 'Virginia Tech',
      stats: '.291/.398/.521, 15 HR',
      bio: 'ACC power bat who adds the 20-homer threat Michigan has lacked. Can play first base or DH. Brings postseason experience from VT\'s 2023 Omaha run.',
    },
    {
      name: 'Sam Petersen',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Nebraska',
      stats: '3.94 ERA, 62 K in 54.2 IP',
      bio: 'Big Ten arm who knows the league\'s hitters. Sunday starter or multi-inning reliever. Fills the rotation\'s third spot.',
    },
    {
      name: 'Aidan Nagle',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Boston College',
      stats: '.281/.359/.418, 5 HR, 21 SB',
      bio: 'ACC outfielder with speed and defensive range. Can play all three outfield positions. Leadoff candidate.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Connor O\'Halloran (3.12 ERA, 106 K) and Evan Hill (2.31 ERA, 8 saves) are one of the best ace-closer combinations in the Big Ten. O\'Halloran was dominant in conference play — a 2.41 ERA against Big Ten opponents — and Hill\'s slider is an 80-grade pitch that right-handed hitters simply cannot touch. When you can start and finish games at this level, you can compete with anyone.',
    rotation:
      'O\'Halloran on Fridays, Chase Allen (3.67 ERA, 81 K) on Saturdays, and Sam Petersen (from Nebraska) on Sundays. Allen has the raw stuff to be a Friday-caliber arm — his fastball sits 94-96 — but his command needs to tighten for Michigan to sweep series. Petersen provides Big Ten familiarity and a competitive floor on Sundays.',
    depth:
      'Hill closes. The middle-relief question is the one that will define Michigan\'s ceiling. The returning bullpen arms were inconsistent in 2025, and the portal did not directly address the bridge innings. Tracy Smith will need internal development — one or two of the young arms need to emerge as reliable seventh- and eighth-inning options. If they do, this is a top-four Big Ten pitching staff.',
  },

  lineupAnalysis: {
    engine:
      'Ted Burton (.308/.401/.489, 10 HR) is the best returning hitter and the lineup\'s anchor. He does not chase, drives the ball to all fields, and projects as a premium-round draft pick by June. Burton in the three-hole gives Michigan a stabilizing force the rest of the lineup can feed off.',
    middle:
      'Tyler Locklear (from Virginia Tech, .291/.398/.521, 15 HR) is the portal addition that changes the lineup\'s ceiling. Michigan has not had a legitimate 20-homer threat in years. Locklear provides it. Gavin Kilen (from Mississippi State, .296/.379/.452, 8 HR, 16 SB) fills shortstop and adds an SEC-caliber bat to the middle of the order.',
    supportingCast:
      'Riley Bertram (.289/.371/.441, 8 HR) is steady at third base. Nolan Schanuel (.271/.368/.412) projects as a high-OBP contributor. Aidan Nagle (from Boston College, 21 SB) adds speed at the top. The 2025 lineup lacked impact — Burton was the only hitter opponents feared. With Locklear and Kilen, this lineup has three legitimate threats. That changes everything.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Austin Peay', location: 'Neutral', notes: 'Season Opener — Nashville' },
    { dates: 'Feb 20-22', opponent: 'Clemson', location: 'Neutral', notes: 'MLB4 Tournament' },
    { dates: 'Mar 6-8', opponent: 'Central Michigan', location: 'Home', notes: 'Home Opener' },
    { dates: 'Mar 13-15', opponent: 'USC', location: 'Away', notes: 'Big Ten Opener' },
    { dates: 'Mar 27-29', opponent: 'Oregon', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'UCLA', location: 'Away', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Indiana', location: 'Home', notes: 'Rivalry series' },
    { dates: 'Apr 24-26', opponent: 'Iowa', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Maryland', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Illinois', location: 'Home', notes: 'Regular season finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 65 },
    { category: 'Bullpen', grade: 55 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 60 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'Michigan\'s pitching is good enough to keep them in every series. O\'Halloran is a genuine ace, Hill is an elite closer, and Allen has the raw stuff to dominate. The question is the lineup: can Locklear and Kilen integrate quickly enough to give Burton the protection he needs? The 2019 CWS finals team had a complete roster. This 2026 team has the pitching to match that standard but needs the offense to catch up. If the portal bats produce and the middle relief develops, Michigan is a super regional team. If the lineup stalls, they are an NCAA Tournament team that exits early. The floor is safe. The ceiling depends on how fast the new pieces gel.',

  relatedLinks: [
    { label: 'Michigan Team Page', href: '/college-baseball/teams/michigan' },
  ],
};

export default function Michigan2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
