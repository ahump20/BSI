import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Texas',
  teamSlug: 'texas',
  mascot: 'Longhorns',
  badgeText: 'Season Preview \u00b7 Updated Feb 26',
  date: 'February 26, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    '8-0 to start 2026. .340 team BA, 1.36 ERA. 3,818 all-time wins, 38 CWS appearances, 6 national championships. After winning the SEC in Year One, Schlossnagle\'s Longhorns aren\'t reloading — they\'re accelerating.',

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
      stats: '.448/.526/.793, 3 HR, 10 RBI',
      bio: 'Southlake Carroll product hitting cleanup. Jumped from .333 as a sophomore to .448 through 8 games with a .345 ISO — the biggest development on the roster. Second-Team All-Region returning as the engine of the lineup.',
    },
    {
      name: 'Jaxon Pack Jr.',
      position: 'OF',
      year: 'Fr.',
      stats: '.435/.567/.696, 1 HR, 6 BB',
      bio: 'Left-handed freshman from Millikan HS (Long Beach). 2024 PG All-American. The .567 OBP as a true freshman is the number — he controls the strike zone like a junior. Already starting in the outfield.',
    },
    {
      name: 'Kash Tinney',
      position: 'C',
      year: 'Jr.',
      stats: '.304/.529/.739, 3 HR, 11 BB / 9 K',
      bio: 'Notre Dame transfer. NCBWA Division 5 Preseason Player of the Year, multiple All-America teams. The 11 BB to 9 K ratio from the catcher spot is elite discipline plus power. Gives Texas a legitimate middle-of-the-order threat behind the plate.',
    },
    {
      name: 'Adrian Rodriguez',
      position: 'INF',
      year: 'So.',
      stats: '.294/.333/.500, 5 2B, 1 3B',
      bio: 'Switch-hitter from Flower Mound. First Team Freshman All-America last spring. Early 2026 numbers show gap-to-gap power (5 doubles, 1 triple) rather than the home run pop of 2025. Still only a sophomore.',
    },
    {
      name: 'Casey Borba',
      position: 'INF',
      year: 'Jr.',
      stats: '.241/.324/.379, 1 HR',
      bio: 'Orange Lutheran product. Slower start than his 12-HR sophomore campaign. The power profile is still there — the approach will come as conference play approaches.',
    },
    {
      name: 'Luke Harrison',
      position: 'LHP',
      year: 'Gr.',
      stats: '1.86 ERA, 9.2 IP, 8 K, 1-0',
      bio: 'Friendswood product. Veteran left-hander settling into the weekend rotation. 1.86 ERA through early starts. Commands four pitches and pitched Texas through two SEC elimination games last spring.',
    },
    {
      name: 'Dylan Volantis',
      position: 'LHP',
      year: 'So.',
      stats: '0.00 ERA, 14 IP, 17 K, 2 BB, 2-0',
      bio: 'Moved from closer to starter and has been untouchable. 0.00 ERA with 10.93 K/9 through 14 innings. SEC Freshman of the Year last spring (1.94 ERA, 12 saves). The stuff plays anywhere in the rotation.',
    },
    {
      name: 'Jason Flores',
      position: 'RHP',
      year: 'So.',
      stats: '10.12 ERA, 2.2 IP',
      bio: 'Wylie product. Rough early-season outing — 10.12 ERA in limited innings. The 2.78 ERA stuff from last spring is still there. Small sample; Schlossnagle will give him runway.',
    },
    {
      name: 'Max Grubbs',
      position: 'RHP',
      year: 'Sr.',
      stats: '1.80 ERA, 5 IP, 4 K, 1-0',
      bio: 'Arlington native. Four-pitch right-hander cruising at 1.80 ERA through early action. Went 6-2 with a 2.84 ERA last season. Schlossnagle trusts him in any situation — start, long relief, or bridge.',
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
      stats: '2.45 ERA, 3.2 IP, 9 K',
      bio: 'Nine strikeouts in 3.2 innings — the ASU transfer brought his power slider to Austin and it\'s working. 2.45 ERA in early bullpen appearances. A weapon in the sixth and seventh innings.',
    },
    {
      name: 'Temo Becerra',
      position: 'INF',
      year: 'R-Sr.',
      fromSchool: 'Stanford',
      stats: '.308/.455/.423, 22 assists at SS',
      bio: 'Stanford transfer hitting .308 with a .455 OBP through 8 games. The 22 assists at shortstop show the range and arm. CWS experience. Exactly the utility piece that lets Schlossnagle rest starters without losing defensive quality.',
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
      'Dylan Volantis moved from closer to starter — and it\'s been the best pitching decision of the early season. 0.00 ERA in 14 innings with 17 strikeouts and 2 walks. The question of whether he stays as closer or moves to the rotation has been answered. Staff-wide: 1.36 ERA, 0.909 WHIP, 11.32 K/9, zero home runs allowed in 66 innings.',
    rotation:
      'Volantis (0.00 ERA, 14 IP, 17 K) anchors the front of the rotation. Luke Harrison (1.86 ERA, 9.2 IP) provides the veteran lefty presence. Ty Cozart (1.12 ERA, 8 IP, 12 K as a freshman) and Max Grubbs (1.80 ERA, 5 IP, 1-0) round out a rotation that hasn\'t allowed a home run through 8 games. Flores (10.12 ERA in 2.2 IP) had a rough early outing but the stuff is still there.',
    depth:
      'Charlie Riojas (1.64 ERA, 19 K in 11 IP — 15.55 K/9, K/BB of 9.5) is the most dominant reliever on the staff by rate stats. Thomas Burns (ASU transfer — 9 K in 3.2 IP) is already producing. Cody Howard (from Baylor) strengthens the pen further. The zero home runs allowed stat is elite but comes against non-SEC lineups — the real test is March.',
  },

  lineupAnalysis: {
    engine:
      'Ethan Mendoza (.448/.526/.793) has jumped from good to dominant. The Southlake Carroll product leads the team with a .345 ISO and 3 HR through 8 games. But the lineup depth is the real story — Texas is hitting .340 as a team with a 1.025 OPS. The BB/K ratio of 0.98 (50 walks to 51 strikeouts) means this lineup almost never gives away at-bats.',
    middle:
      'Jaxon Pack Jr. (.435/.567/.696) is the freshman revelation — L/L hitter from Long Beach with a .567 OBP that belies his class year. Kash Tinney (.304/.529/.739, 3 HR) adds power from the catcher spot with an 11 BB/9 K ratio. Cameron Robbins (.419/.486/.871, 3 HR, .452 ISO) is the power leader. Rodriguez (.294, 5 2B) provides gap-to-gap doubles. The lineup is 1-through-8 deep.',
    supportingCast:
      'Temo Becerra (.308/.455/.423) brings CWS experience from Stanford with 22 assists at shortstop in 8 games. Borba (.241) is working through a slow start. The stolen base game is efficient — 14-17 (82.4%). No dead spots in the order.',
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
    { category: 'Lineup Depth', grade: 80 },
    { category: 'Rotation', grade: 75 },
    { category: 'Bullpen', grade: 80 },
    { category: 'Defense', grade: 65 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 80 },
    { category: 'Schedule Difficulty', grade: 70 },
  ],

  projectionTier: 'Omaha Favorite',
  projectionText:
    'Eight games in, the preseason case has only gotten stronger. Texas is hitting .340 with a 1.36 ERA and a +57 run differential. Volantis moved to the rotation and hasn\'t allowed a run. The lineup is deep enough that the 7-8-9 hitters are producing. The caveat: UC Davis, Lamar, Michigan State, and UTRGV are not SEC opponents. Ole Miss at home March 13-15 will answer the questions that matter. But the process — the plate discipline, the pitching depth, the coaching infrastructure — is what makes this team an Omaha favorite, not the early results.',

  relatedLinks: [
    { label: 'Texas Team Page', href: '/college-baseball/teams/texas' },
  ],
};

export default function Texas2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
