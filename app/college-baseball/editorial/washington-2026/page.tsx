import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Washington Huskies: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Washington went 29-28 overall in 2025 but was far more competitive in Big Ten play (17-13) than the overall record suggests. Eddie Smith is building something in Seattle.',
  openGraph: {
    title: 'Washington Huskies: 2026 Season Preview',
    description:
      'Washington went 29-28 overall in 2025 but was far more competitive in Big Ten play (17-13) than the overall record suggests. Eddie Smith is building something in Seattle.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Washington',
  teamSlug: 'washington',
  mascot: 'Huskies',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Washington went 29-28 overall in 2025 but was far more competitive in Big Ten play (17-13) than the overall record suggests. Eddie Smith is building something in Seattle — Year 4 is when the foundation has to start showing cracks or holding weight.',

  programStats: {
    allTimeWins: '1,623',
    winPct: '.518',
    cwsAppearances: 4,
    nationalTitles: 0,
    confTitles: 3,
    cwsWins: 5,
  },

  record2025: '29-28 (17-13 Big Ten)',
  record2025Context: '.500 overall, but competitive in Big Ten play',
  seasonStats2025: {
    teamBA: '.259',
    teamERA: '4.48',
    homeRuns: 52,
    stolenBases: 68,
    strikeouts: 441,
    opponentBA: '.258',
  },
  seasonHighlights: [
    'Went 17-13 in Big Ten play despite a .500 overall record — the conference schedule was the strength',
    'Won 5 of 10 Big Ten weekend series, including a road series win at Indiana',
    'Defeated UCLA in a midweek game — one of only four teams to beat the Bruins in 2025',
    'Two players earned All-Big Ten honorable mention',
    'Freshman class showed significant promise — three true freshmen saw regular action',
  ],

  keyReturnees: [
    {
      name: 'Collin Blazier',
      position: 'OF',
      year: 'Sr.',
      stats: '.301/.387/.462, 9 HR, 44 RBI',
      bio: 'Kirkland native. Washington\'s best hitter and the emotional leader of the team. Has improved every year — batting average up 30 points from freshman year.',
    },
    {
      name: 'Jack Findlay',
      position: 'SS',
      year: 'Jr.',
      stats: '.278/.361/.398, 5 HR, 18 SB',
      bio: 'Bellevue product. Athletic shortstop with range and arm strength. Developing into a legitimate two-way player at the position.',
    },
    {
      name: 'Ryan Kim',
      position: '1B',
      year: 'So.',
      stats: '.267/.348/.445, 8 HR',
      bio: 'Federal Way product. Left-handed power bat who showed glimpses of 20-homer potential as a freshman. Needs to cut down on strikeouts.',
    },
    {
      name: 'Tyler Macon',
      position: 'RHP',
      year: 'Sr.',
      stats: '6-5, 3.84 ERA, 87 K in 82 IP',
      bio: 'Tacoma product. Friday night starter with a sinker-slider combination that generates groundballs. Best in Big Ten play when the stage was biggest.',
    },
    {
      name: 'Jake Ness',
      position: 'LHP',
      year: 'Jr.',
      stats: '5-4, 4.12 ERA, 68 K in 67.2 IP',
      bio: 'Portland product. Lefty with a deep pitch mix and improving command. Saturday arm with upside to be a Friday guy.',
    },
    {
      name: 'Cole Davidson',
      position: 'RHP',
      year: 'Jr.',
      stats: '2.78 ERA, 7 SV, 42 K in 35.2 IP',
      bio: 'Spokane native. Closer with a plus fastball and the composure to pitch in tight games. Seven saves in seven chances in Big Ten play.',
    },
  ],

  transferAdditions: [
    {
      name: 'Max Galvin',
      position: 'C',
      year: 'Jr.',
      fromSchool: 'UC Irvine',
      stats: '.289/.371/.423, 6 HR',
      bio: 'Big West standout who adds a much-needed catching upgrade. Strong defensive catcher with a solid bat.',
    },
    {
      name: 'Trey Dominguez',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'San Jose State',
      stats: '.307/.392/.478, 7 HR, 24 SB',
      bio: 'Speed and contact from the Mountain West. Can lead off and play any outfield position. Fills the gap left by Washington\'s departed center fielder.',
    },
    {
      name: 'Colton Bowman',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Oregon State',
      stats: '4.21 ERA, 59 K in 53.2 IP',
      bio: 'Pac-12/Big Ten veteran who adds Sunday starter depth or long-relief capability. Knows the West Coast arms race.',
    },
    {
      name: 'Luis Herrera',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'UNLV',
      stats: '.283/.354/.418, 6 HR',
      bio: 'Mountain West infielder who adds bench depth and defensive versatility. Can play second base or third base.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Tyler Macon (3.84 ERA, 87 K) is a reliable Friday arm who is at his best when he gets ahead in counts and lets his sinker work. Cole Davidson (2.78 ERA, 7 saves) in the ninth is as steady as it gets — seven saves in seven chances during Big Ten play. The front and back of the pitching staff are set. The question is whether the middle holds.',
    rotation:
      'Macon on Fridays, Jake Ness (4.12 ERA, 68 K) on Saturdays, and Colton Bowman (from Oregon State) as the likely Sunday starter. Ness has upside — his changeup is his best pitch and it is improving. Bowman provides veteran depth that Washington lacked in 2025 when Sunday games were often the series-decider they lost.',
    depth:
      'Davidson closes. The middle innings are where Washington needs to improve. The 2025 bullpen was inconsistent between the sixth and eighth innings, and the portal did not directly address it. Smith will need internal development from his younger arms to bridge the gap. If one of the freshman arms takes a step forward, the pen is adequate. If not, the Huskies will leave too many games on the table.',
  },

  lineupAnalysis: {
    engine:
      'Collin Blazier (.301/.387/.462, 9 HR) is the anchor. He has gotten better every year, and his junior season was the best version — patient at the plate, damage on contact, leadership in the dugout. Blazier as the three-hole hitter gives Washington a foundation to build around.',
    middle:
      'Ryan Kim (.267/.348/.445, 8 HR) is the power bat with the highest ceiling. If he cuts his strikeout rate by 15%, he is a 15-homer guy with the ability to change games. Jack Findlay (.278/.361/.398, 18 SB) provides speed and defense in the middle of the diamond. Kim and Findlay represent the upside — and the risk.',
    supportingCast:
      'Trey Dominguez (from San Jose State, .307/.392/.478, 24 SB) is exactly what Washington needed — a table-setter at the top of the order who can run. Max Galvin (from UC Irvine) upgrades the catching position. Luis Herrera adds infield depth. This lineup is deeper than 2025 but still needs Kim\'s power to develop for Washington to consistently score enough runs against the top of the Big Ten.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Seattle U', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'San Diego', location: 'Away', notes: '' },
    { dates: 'Mar 6-8', opponent: 'Oregon State', location: 'Home', notes: 'Northwest rivalry' },
    { dates: 'Mar 13-15', opponent: 'Indiana', location: 'Home', notes: 'Big Ten Opener' },
    { dates: 'Mar 27-29', opponent: 'Illinois', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Michigan', location: 'Home', notes: '' },
    { dates: 'Apr 17-19', opponent: 'USC', location: 'Home', notes: 'West Coast Big Ten showdown' },
    { dates: 'Apr 24-26', opponent: 'Oregon', location: 'Away', notes: 'Northwest Big Ten rivalry' },
    { dates: 'May 1-3', opponent: 'UCLA', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'Iowa', location: 'Away', notes: 'Regular season finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 45 },
    { category: 'Rotation', grade: 50 },
    { category: 'Bullpen', grade: 50 },
    { category: 'Defense', grade: 55 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Washington is the classic bubble team — good enough to beat anyone on a given weekend, inconsistent enough to lose series they should win. The 17-13 Big Ten record was genuine, not a mirage. Blazier is a legitimate All-Big Ten player and Davidson gives them a back-end arm they can trust. The question is run production: can Kim develop the power, can Dominguez set the table, and can the bottom of the order avoid easy outs? Eddie Smith has the culture going in the right direction. Year 4 is when bubble teams either break through to the tournament or settle into the middle of the pack. Washington has the pitching to stay in games. Whether they have the bats to finish them will define the season.',

  relatedLinks: [
    { label: 'Washington Team Page', href: '/college-baseball/teams/washington' },
  ],
};

export default function Washington2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
