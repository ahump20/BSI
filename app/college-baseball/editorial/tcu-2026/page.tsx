import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TCU Horned Frogs: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Big 12 regular season champions in 2025, a CWS appearance in 2023, and an ace-led rotation that makes the Horned Frogs the conference\'s team to beat.',
  openGraph: {
    title: 'TCU Horned Frogs: 2026 Season Preview',
    description:
      'Big 12 regular season champions in 2025, a CWS appearance in 2023, and an ace-led rotation that makes the Horned Frogs the conference\'s team to beat.',
  },
};

const data: TeamPreviewData = {
  teamName: 'TCU',
  teamSlug: 'tcu',
  mascot: 'Horned Frogs',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Big 12 regular season champions in 2025, a CWS appearance in 2023, and an ace-led rotation that makes the Horned Frogs the conference\'s team to beat. Kirk Saarloos has built something that doesn\'t flinch under pressure — and this year\'s roster might be his deepest yet.',

  programStats: {
    allTimeWins: '1,832',
    winPct: '.586',
    cwsAppearances: 6,
    nationalTitles: 0,
    confTitles: 5,
    cwsWins: 12,
  },

  record2025: '44-20 (20-10 Big 12)',
  record2025Context: 'Big 12 regular season champions, ranked #9 nationally, Super Regional appearance',
  seasonStats2025: {
    teamBA: '.289',
    teamERA: '4.12',
    homeRuns: 98,
    stolenBases: 62,
    strikeouts: 541,
    opponentBA: '.241',
  },
  seasonHighlights: [
    'Won the Big 12 regular season title outright at 20-10',
    'Brayden Taylor named First Team All-American (22 HR, 71 RBI)',
    'Hosted an NCAA Regional and won — fell in the Super Regional',
    'Chase Hampton anchored the rotation with a sub-3.00 ERA through conference play',
  ],

  keyReturnees: [
    {
      name: 'Brayden Taylor',
      position: '3B',
      year: 'Sr.',
      stats: '.321/.412/.601, 22 HR, 71 RBI',
      bio: 'The best hitter in the Big 12. First Team All-American who carried TCU through the conference gauntlet. Rare combination of plate discipline and raw power from the left side. Draft-eligible and playing with something to prove after the Super Regional exit.',
    },
    {
      name: 'Tommy Sacco',
      position: 'SS',
      year: 'Jr.',
      stats: '.301/.378/.468, 11 HR, 48 RBI',
      bio: 'Plus defender who emerged as a legitimate middle-of-the-order bat. 11 home runs from the shortstop position is uncommon production. Quiet leader who makes the routine play and occasionally launches one into the gap.',
    },
    {
      name: 'Chase Hampton',
      position: 'RHP',
      year: 'Jr.',
      stats: '8-3, 2.87 ERA, 112 K in 94 IP',
      bio: 'Power arm with a fastball that sits 94-96 and a wipeout slider. Led the staff in innings, strikeouts, and wins. The ace who makes Friday nights a near-guaranteed win.',
    },
    {
      name: 'Karson Bowen',
      position: 'C',
      year: 'Sr.',
      stats: '.274/.361/.432, 8 HR',
      bio: 'Veteran catcher who handles a talented pitching staff and contributes offensively. Strong arm behind the plate and a calming presence for young pitchers in high-leverage situations.',
    },
    {
      name: 'Luke Savage',
      position: 'LHP',
      year: 'So.',
      stats: '5-2, 3.54 ERA, 78 K in 68.2 IP',
      bio: 'Emerged as a reliable Saturday starter. Left-handed with advanced command for his age. Projects to take another step forward with a full offseason in the program.',
    },
    {
      name: 'Kole Klecker',
      position: 'RHP',
      year: 'Jr.',
      stats: '3.21 ERA, 4 SV, 48 K in 39.1 IP',
      bio: 'High-leverage reliever who handled late innings. Fastball-slider combination that generates whiffs. Can close or pitch the seventh and eighth.',
    },
  ],

  transferAdditions: [
    {
      name: 'Ty Johnson',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Dallas Baptist',
      stats: '.308/.402/.489, 9 HR',
      bio: 'DFW native who stays local. Contact-oriented hitter with gap power who fills an outfield spot vacated by departures. Knows the Big 12 environment.',
    },
    {
      name: 'Colton Ledbetter',
      position: 'OF/1B',
      year: 'R-Sr.',
      fromSchool: 'Mississippi State',
      stats: '.285/.371/.462, 12 HR',
      bio: 'SEC-tested bat who adds lineup depth and positional flexibility. Can play corner outfield or first base. Brings postseason experience from Starkville.',
    },
    {
      name: 'Reed Osborne',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Vanderbilt',
      stats: '3.89 ERA, 52 K in 41.2 IP',
      bio: 'Pitched in the SEC. Mid-rotation arm who can eat innings and keep TCU in games on the weekends. Fastball command is his calling card.',
    },
    {
      name: 'Marcus Davila',
      position: 'LHP',
      year: 'So.',
      fromSchool: 'Texas State',
      stats: '2.91 ERA, 67 K in 55.2 IP',
      bio: 'Sun Belt Pitcher of the Year candidate who moves up in class. Deceptive delivery from the left side with three pitches he can throw for strikes.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Chase Hampton is a Friday night ace in every sense — 94-96 with a wipeout slider, 112 strikeouts in 94 innings, and a 2.87 ERA through the Big 12 gauntlet. When he toes the rubber, TCU expects to win. The rest of the staff is built around that foundation.',
    rotation:
      'Luke Savage slots in behind Hampton as the Saturday starter, bringing left-handed balance and advanced command. Reed Osborne (from Vanderbilt) or Marcus Davila (from Texas State) compete for the Sunday role. Davila\'s 2.91 ERA and strikeout numbers in the Sun Belt suggest he can handle the jump. Saarloos has options — which is exactly what you want entering Big 12 play.',
    depth:
      'Kole Klecker anchors the bullpen with a 3.21 ERA and swing-and-miss stuff in the late innings. The pen was a strength in 2025, and the additions from the portal give Saarloos more arms to deploy without wearing anyone down. In a conference that punishes thin pitching, depth is TCU\'s insurance policy.',
  },

  lineupAnalysis: {
    engine:
      'Brayden Taylor is the engine, the identity, and the cleanup hitter all at once. A .321 average with 22 home runs and 71 RBI as a junior — in the Big 12, not against mid-week cupcakes. He makes pitchers uncomfortable from the first pitch of the at-bat.',
    middle:
      'Tommy Sacco (.301, 11 HR) gives TCU a legitimate second threat. When teams pitch around Taylor, Sacco punishes the mistake. Karson Bowen provides the veteran presence behind the plate and enough pop (8 HR) to keep opposing pitchers honest throughout the lineup.',
    supportingCast:
      'Ty Johnson (.308 at Dallas Baptist) and Colton Ledbetter (.285 with 12 HR at Mississippi State) plug the outfield gaps left by departures. The bottom third of this lineup is deeper than most Big 12 teams\' top third. TCU can run 1 through 9 without a free out.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Gonzaga', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Cal State Fullerton', location: 'Home', notes: '' },
    { dates: 'Feb 27-Mar 1', opponent: 'Shriners Classic', location: 'Neutral', notes: 'Houston — vs. LSU, UCLA' },
    { dates: 'Mar 13-15', opponent: 'Texas Tech', location: 'Home', notes: 'Big 12 Opener' },
    { dates: 'Mar 20-22', opponent: 'Oklahoma State', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Kansas', location: 'Home', notes: '' },
    { dates: 'Apr 10-12', opponent: 'Arizona State', location: 'Away', notes: '' },
    { dates: 'Apr 17-19', opponent: 'West Virginia', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Arizona', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Baylor', location: 'Home', notes: 'Regular Season Finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 70 },
    { category: 'Rotation', grade: 70 },
    { category: 'Bullpen', grade: 65 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 70 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Contender',
  projectionText:
    'TCU is the Big 12 frontrunner until someone proves otherwise. Brayden Taylor is the conference\'s best hitter. Chase Hampton is the conference\'s best pitcher. Saarloos has built a roster with SEC-caliber depth through the portal and a returning core that won 44 games and a conference title. The Super Regional exit stings, but the pieces that made 2025 special are still here — and the pieces that were missing got added. This is a team built for Omaha.',

  relatedLinks: [
    { label: 'TCU Team Page', href: '/college-baseball/teams/tcu' },
  ],
};

export default function TCU2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
