import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maryland Terrapins: 2026 Season Preview | Blaze Sports Intel',
  description:
    "Maryland went 27-29 in 2025 and finished 12-18 in Big Ten play. But Matt Swope's third year in College Park brings his first full recruiting class, a targeted portal haul.",
  openGraph: {
    title: 'Maryland Terrapins: 2026 Season Preview',
    description:
      "Maryland went 27-29 in 2025 and finished 12-18 in Big Ten play. But Matt Swope's third year in College Park brings his first full recruiting class, a targeted portal haul.",
  },
};

const data: TeamPreviewData = {
  teamName: 'Maryland',
  teamSlug: 'maryland',
  mascot: 'Terrapins',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Maryland went 27-29 in 2025 and finished 12-18 in Big Ten play. The record is what it is. But Matt Swope\'s third year in College Park brings his first full recruiting class, a targeted portal haul, and the beginning of what he hopes will be a foundation rather than another transition year.',

  programStats: {
    allTimeWins: '1,218',
    winPct: '.487',
    cwsAppearances: 2,
    nationalTitles: 0,
    confTitles: 4,
    cwsWins: 2,
  },

  record2025: '27-29 (12-18 Big Ten)',
  record2025Context: 'Below .500 overall and in Big Ten play',
  seasonStats2025: {
    teamBA: '.252',
    teamERA: '4.72',
    homeRuns: 44,
    stolenBases: 51,
    strikeouts: 412,
    opponentBA: '.271',
  },
  seasonHighlights: [
    'Won three Big Ten series despite finishing 12-18 — showed flashes of competitiveness',
    'Swept Maryland-Eastern Shore and took two of three from Penn State in non-conference play',
    'Freshman pitcher Kevin Dunn posted a 3.14 ERA in 14 appearances — immediate bullpen impact',
    'Matt Shaw earned All-Big Ten honorable mention after a .291 average with 8 home runs',
    'Improved defensive efficiency from 2024 — 22 fewer errors than the previous season',
  ],

  keyReturnees: [
    {
      name: 'Matt Shaw',
      position: 'INF',
      year: 'Jr.',
      stats: '.291/.374/.462, 8 HR, 38 RBI',
      bio: 'Bethesda product. Maryland\'s best position player and the face of Swope\'s rebuild. Smooth defender at third with emerging power.',
    },
    {
      name: 'Troy Schreffler',
      position: 'OF',
      year: 'Sr.',
      stats: '.274/.351/.418, 6 HR, 12 SB',
      bio: 'Baltimore native. Four-year starter with experience and leadership. Not flashy, but consistent and reliable in every phase.',
    },
    {
      name: 'Isaiah Adams',
      position: 'OF',
      year: 'So.',
      stats: '.268/.342/.389, 4 HR, 16 SB',
      bio: 'Silver Spring product. Electric speed with a developing bat. 16 stolen bases as a freshman — the baserunning dimension Maryland has never had.',
    },
    {
      name: 'Kevin Dunn',
      position: 'LHP',
      year: 'So.',
      stats: '3.14 ERA, 38 K in 28.2 IP',
      bio: 'Annapolis product. Best freshman arm on the staff in 2025. Left-handed with command and composure beyond his years. Could move into the rotation.',
    },
    {
      name: 'Jason Savacool',
      position: 'RHP',
      year: 'Sr.',
      stats: '5-6, 4.31 ERA, 74 K in 75.1 IP',
      bio: 'Frederick native. Veteran Friday arm who has had moments of brilliance. Needs to limit the big inning — ERA jumps to 5.20 in the fourth and fifth innings.',
    },
    {
      name: 'Nick Dean',
      position: 'RHP',
      year: 'Jr.',
      stats: '4-3, 4.48 ERA, 61 K in 58.1 IP',
      bio: 'College Park product. Saturday arm with power stuff and inconsistent command. When he commands the fastball, he is a different pitcher.',
    },
  ],

  transferAdditions: [
    {
      name: 'Jayson Jones',
      position: 'C',
      year: 'Jr.',
      fromSchool: 'Virginia',
      stats: '.278/.362/.421, 5 HR',
      bio: 'ACC catcher who upgrades the position immediately. Strong arm and game-calling ability that Maryland desperately needed.',
    },
    {
      name: 'Camden Proctor',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'James Madison',
      stats: '.294/.378/.445, 7 HR',
      bio: 'Sun Belt standout who adds a bat to the middle of the lineup. Can play shortstop or second base.',
    },
    {
      name: 'Tyler Blash',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Coastal Carolina',
      stats: '3.71 ERA, 62 K in 55.2 IP',
      bio: 'Experienced arm from a winning program. Sunday starter candidate who has pitched in the Sun Belt tournament. Adds stability to the back of the rotation.',
    },
    {
      name: 'Marcus Randolph',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'George Mason',
      stats: '2.89 ERA, 7 SV, 42 K in 37.1 IP',
      bio: 'Local arm who adds the closer Maryland lacked in 2025. Seven saves with a sub-3.00 ERA — fills the biggest hole on the pitching staff.',
    },
    {
      name: 'Chris Givin',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Old Dominion',
      stats: '.287/.364/.434, 5 HR, 14 SB',
      bio: 'Conference USA outfielder with speed and defensive range. Can play center field and bat leadoff.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Maryland\'s pitching was the primary problem in 2025 — a 4.72 ERA and a .271 opponent batting average are not competitive in the Big Ten. The additions of Marcus Randolph (closer from George Mason) and Tyler Blash (Sunday starter from Coastal Carolina) directly address the two biggest gaps. Kevin Dunn\'s emergence (3.14 ERA as a freshman) gives Swope a left-handed weapon he can use in the rotation or bullpen.',
    rotation:
      'Jason Savacool (4.31 ERA) remains the Friday starter by default — he has the experience, but the big-inning problem must be solved. Nick Dean (4.48 ERA) on Saturdays brings power stuff with inconsistent execution. Tyler Blash (from Coastal Carolina) on Sundays provides stability. If Kevin Dunn moves into the rotation, it could push Savacool or Dean to the bullpen and upgrade the overall staff.',
    depth:
      'Marcus Randolph closes — the first defined closer Maryland has had under Swope. That alone is a structural upgrade. The middle-relief corps is where the real risk lives. The 2025 pen was leaky between the fifth and eighth innings, and outside of Dunn, none of the returning arms were reliable bridges. Swope needs internal development here. One or two of the young arms stepping up would change the pitching staff\'s ceiling.',
  },

  lineupAnalysis: {
    engine:
      'Matt Shaw (.291/.374/.462, 8 HR) is the engine and the recruiting pitch. He stayed when he could have transferred. That loyalty matters, and Swope needs Shaw\'s bat — and his presence — to anchor a lineup that was too easy to pitch through in 2025.',
    middle:
      'Camden Proctor (from James Madison, .294/.378/.445, 7 HR) adds a bat that can slot behind Shaw and provide protection. Troy Schreffler (.274/.351/.418) is the veteran presence who steadies the middle of the order. The lineup needs Shaw and Proctor to carry the on-base load while the power develops elsewhere.',
    supportingCast:
      'Isaiah Adams (.268/.342/.389, 16 SB) is the speed element at the top of the order. Chris Givin (from Old Dominion, .287/.364/.434, 14 SB) adds another speed-contact outfielder. Jayson Jones (from Virginia) upgrades catching. Maryland\'s lineup is deeper than 2025 but still lacks the power bat who can change a game with one swing. That is the ceiling limiter.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Towson', location: 'Neutral', notes: 'Season Opener — Myrtle Beach' },
    { dates: 'Feb 20-22', opponent: 'Liberty', location: 'Neutral', notes: 'Caravelle Resort Tournament' },
    { dates: 'Mar 3-4', opponent: 'Navy', location: 'Home', notes: 'Home Opener' },
    { dates: 'Mar 13-15', opponent: 'Illinois', location: 'Home', notes: 'Big Ten Opener' },
    { dates: 'Mar 27-29', opponent: 'Michigan', location: 'Home', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Iowa', location: 'Away', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Illinois', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'UCLA', location: 'Away', notes: 'Toughest road trip of the year' },
    { dates: 'May 1-3', opponent: 'Indiana', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'Iowa', location: 'Home', notes: 'Regular season finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 40 },
    { category: 'Rotation', grade: 40 },
    { category: 'Bullpen', grade: 40 },
    { category: 'Defense', grade: 45 },
    { category: 'Speed/Baserunning', grade: 50 },
    { category: 'Coaching', grade: 45 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'Maryland is in Year 3 of a rebuild, and Year 3 is when you start to see whether the foundation is real. The 2025 record was not good enough, and Swope knows it. The portal additions — Randolph at closer, Jones at catcher, Proctor in the lineup — address specific weaknesses rather than adding talent for the sake of it. Shaw staying gives the program credibility with recruits. The 2026 season is not about making the NCAA Tournament — it is about winning 15+ Big Ten games, developing the young pitching, and establishing an identity that recruits believe in. If Maryland can get to 33 wins and compete in every Big Ten series, Swope will have done his job. The trajectory matters more than the destination this year.',

  relatedLinks: [
    { label: 'Maryland Team Page', href: '/college-baseball/teams/maryland' },
  ],
};

export default function Maryland2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
