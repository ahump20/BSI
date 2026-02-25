import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Texas',
  teamSlug: 'texas',
  mascot: 'Longhorns',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    '3,818 wins. 38 College World Series appearances. 6 national championships. 130 years of baseball. After winning the SEC in Year One, Schlossnagle\'s Longhorns reload for an Omaha run.',

  programStats: {
    allTimeWins: '3,818',
    winPct: '.724',
    cwsAppearances: 38,
    nationalTitles: 6,
    confTitles: 81,
    cwsWins: 88,
  },

  record2025: '44-14 (22-8 SEC)',
  record2025Context: 'The year Texas proved they belong',
  seasonStats2025: {
    teamBA: '.275',
    teamERA: '3.71',
    homeRuns: 85,
    stolenBases: 79,
    strikeouts: 526,
    opponentBA: '.219',
  },
  seasonHighlights: [
    'Won the SEC outright in inaugural season (picked 8th preseason)',
    'First team to win the SEC in its inaugural season since 1933',
    'Jim Schlossnagle named SEC Coach of the Year',
    'Dylan Volantis: SEC Freshman of the Year, 11 conference saves (broke 22-year-old freshman record)',
    'Adrian Rodriguez: First Team Freshman All-America',
  ],

  keyReturnees: [
    {
      name: 'Ethan Mendoza',
      position: 'INF',
      year: 'Jr.',
      stats: '.333/.437/.476',
      bio: 'Southlake Carroll product. Best contact hitter in the SEC as a sophomore. Returns as the engine of the lineup.',
    },
    {
      name: 'Adrian Rodriguez',
      position: 'INF',
      year: 'So.',
      stats: '.313/.410/.516, 7 HR',
      bio: 'Switch-hitter from Flower Mound. First Team Freshman All-America. Slashed his way into the lineup and never slowed down.',
    },
    {
      name: 'Casey Borba',
      position: 'INF',
      year: 'Jr.',
      stats: '.278, 12 HR',
      bio: 'Orange Lutheran product. Power bat in the middle of the order. 12 home runs as a sophomore.',
    },
    {
      name: 'Jonah Williams',
      position: 'OF',
      year: 'So.',
      stats: '.327 BA (limited)',
      bio: 'Galveston native. Electric speed and bat control. Breakout candidate if he gets everyday at-bats.',
    },
    {
      name: 'Luke Harrison',
      position: 'LHP',
      year: 'Gr.',
      stats: '3.06 ERA, 72 K',
      bio: 'Friendswood product. Left-hander who pitched Texas through two SEC elimination games last spring. Commands four pitches and never gives in to contact — the kind of starter who gives the lineup time to work.',
    },
    {
      name: 'Dylan Volantis',
      position: 'LHP',
      year: 'So.',
      stats: '1.94 ERA, 74 K, 12 SV in 51 IP',
      bio: 'Thousand Oaks, CA. Most dominant reliever in college baseball. Only a sophomore. Could move into the rotation or stay as closer.',
    },
    {
      name: 'Jason Flores',
      position: 'RHP',
      year: 'So.',
      stats: '2.78 ERA',
      bio: 'Wylie product. Threw 2.78 ERA innings as a freshman in games Texas had to win. Slider tunnels off the fastball well enough to get swings in two-strike counts.',
    },
    {
      name: 'Max Grubbs',
      position: 'RHP',
      year: 'Sr.',
      stats: '2.84 ERA, 6-2',
      bio: 'Arlington native. Four-pitch right-hander who went 6-2 with a 2.84 ERA last season. Schlossnagle trusts him in any situation — start, long relief, or bridge to the closer.',
    },
  ],

  transferAdditions: [
    {
      name: 'Haiden Leffew',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Wake Forest',
      stats: '',
      bio: 'Pitched in the CWS finals for Wake Forest last June. Left-hander with a deceptive delivery who changes eye levels — exactly the arm profile Schlossnagle uses to shorten games.',
    },
    {
      name: 'Ashton Larson',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'LSU',
      stats: '',
      bio: 'Won a national title at LSU as a reserve outfielder. Plus speed who covers center and can pinch-run in tight games — the kind of roster piece that matters in May.',
    },
    {
      name: 'Thomas Burns',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Arizona State',
      stats: '3.71 ERA, 40 K in 26.2 IP',
      bio: 'Posted a 3.71 ERA with 40 K in 26.2 IP at Arizona State. Power slider gets right-handers to expand the zone — a weapon in the sixth and seventh innings.',
    },
    {
      name: 'Temo Becerra',
      position: 'INF',
      year: 'R-Sr.',
      fromSchool: 'Stanford',
      stats: '',
      bio: 'Stanford infielder who played in a College World Series. Can slot at second, third, or first — the utility piece that lets Schlossnagle rest starters without losing defensive quality.',
    },
    {
      name: 'Cody Howard',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Baylor',
      stats: '',
      bio: 'In-state transfer strengthens the pen. Knows the Big 12 hitters Texas will face in non-con.',
    },
    {
      name: 'Dariyan Pendergrass',
      position: 'OF',
      year: 'R-Sr.',
      fromSchool: 'College of Charleston',
      stats: '',
      bio: 'College of Charleston product with 70-grade speed. Defensive replacement and pinch-runner who can steal a base in the ninth when the game is tight.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Dylan Volantis is the most dominant reliever in college baseball. A 1.94 ERA with 74 strikeouts and 12 saves in 51 innings — as a freshman. His 11 SEC saves broke a conference freshman record that had stood for 22 years. Whether he stays as closer or moves into the rotation, he anchors everything.',
    rotation:
      'Luke Harrison leads the way — a veteran lefty from Friendswood with a 3.06 ERA and 72 strikeouts. Jason Flores (2.78 ERA) and Max Grubbs (2.84 ERA, 6-2) round out a rotation that can match up with anyone in the SEC. Portal additions Haiden Leffew (Wake Forest) and Thomas Burns (Arizona State) add arms that have pitched on big stages.',
    depth:
      'This is where Texas separates. Cody Howard (from Baylor) strengthens the pen. The returning arms already have SEC experience. Schlossnagle can mix and match without overextending anyone. When your worst bullpen option has a sub-3.00 ERA, you can compete in any series.',
  },

  lineupAnalysis: {
    engine:
      'Ethan Mendoza (.333/.437/.476) is the best pure contact hitter in the SEC. The Southlake Carroll product rarely chases, works deep counts, and puts the ball in play when it matters. He sets the table for everything that follows.',
    middle:
      'Adrian Rodriguez (.313/.410/.516, 7 HR) and Casey Borba (.278, 12 HR) provide the complementary thunder. Rodriguez is a switch-hitter with rare bat speed for a sophomore. Borba supplies the middle-of-the-order power. Together they give Texas on-base, slugging, and plate discipline that few lineups in the country can match.',
    supportingCast:
      'Jonah Williams (.327 in limited action) is the breakout candidate — electric speed and bat control from Galveston. Ashton Larson (from LSU) adds outfield depth and defensive range. Dariyan Pendergrass (College of Charleston) provides late-inning speed. This is not a one-line lineup.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'UC Davis', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Michigan State', location: 'Home', notes: '' },
    { dates: 'Feb 27-Mar 1', opponent: 'Bruce Bolt Classic', location: 'Neutral', notes: 'CCU, Baylor, Ohio St' },
    { dates: 'Mar 13-15', opponent: 'Ole Miss', location: 'Home', notes: 'SEC Opener' },
    { dates: 'Mar 20-22', opponent: 'Auburn', location: 'Away', notes: '' },
    { dates: 'Mar 26-28', opponent: 'Oklahoma', location: 'Home', notes: 'Red River Rivalry' },
    { dates: 'Apr 10-12', opponent: 'Texas A&M', location: 'Away', notes: 'Lone Star Rivalry' },
    { dates: 'Apr 17-19', opponent: 'Alabama', location: 'Home', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Vanderbilt', location: 'Away', notes: '' },
    { dates: 'May 8-10', opponent: 'Tennessee', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 70 },
    { category: 'Rotation', grade: 65 },
    { category: 'Bullpen', grade: 80 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 75 },
    { category: 'Schedule Difficulty', grade: 70 },
  ],

  projectionTier: 'Omaha Favorite',
  projectionText:
    'Texas has the most complete roster in college baseball. Elite pitching depth led by Volantis, a balanced lineup anchored by Mendoza and Rodriguez, portal additions from national contenders, and a coaching staff that won the SEC in Year One. The schedule is relentless, but the Longhorns did not come to the SEC to settle for the regular season. Schlossnagle came to Austin to compete for Omaha — and this roster gives him the tools to get there.',

  relatedLinks: [
    { label: 'Texas Team Page', href: '/college-baseball/teams/texas' },
  ],
};

export default function Texas2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
