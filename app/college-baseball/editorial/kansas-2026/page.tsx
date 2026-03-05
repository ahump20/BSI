import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kansas Jayhawks: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Forty-two wins. An NCAA Regional host. Big 12 Coach of the Year. Kansas baseball went from afterthought to force in a single season, and Dan Fitzgerald is just getting started.',
  openGraph: {
    title: 'Kansas Jayhawks: 2026 Season Preview',
    description:
      'Forty-two wins. An NCAA Regional host. Big 12 Coach of the Year. Kansas baseball went from afterthought to force in a single season, and Dan Fitzgerald is just getting started.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Kansas',
  teamSlug: 'kansas',
  mascot: 'Jayhawks',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Forty-two wins. An NCAA Regional host. Big 12 Coach of the Year. Kansas baseball went from afterthought to force in a single season, and Dan Fitzgerald is just getting started. The question isn\'t whether 2025 was real — it\'s whether 2026 can be even better.',

  programStats: {
    allTimeWins: '1,412',
    winPct: '.482',
    cwsAppearances: 2,
    nationalTitles: 0,
    confTitles: 2,
    cwsWins: 1,
  },

  record2025: '42-18 (18-12 Big 12)',
  record2025Context: 'Program-record wins, first Regional host since 2014, Dan Fitzgerald named Big 12 Coach of the Year',
  seasonStats2025: {
    teamBA: '.294',
    teamERA: '3.89',
    homeRuns: 82,
    stolenBases: 88,
    strikeouts: 517,
    opponentBA: '.237',
  },
  seasonHighlights: [
    '42 wins — the most in program history',
    'Hosted an NCAA Regional in Lawrence for the first time since 2014',
    'Dan Fitzgerald named Big 12 Coach of the Year',
    'Led the Big 12 in stolen bases (88) and on-base percentage (.378)',
  ],

  keyReturnees: [
    {
      name: 'Janson Reeder',
      position: 'OF',
      year: 'Sr.',
      stats: '.328/.421/.531, 14 HR, 58 RBI, 22 SB',
      bio: 'The heart of the breakout. Five-tool center fielder who does everything well and nothing poorly. Hit for average, hit for power, ran the bases, played elite defense. First Team All-Big 12 who returns as the program\'s best player since 2014.',
    },
    {
      name: 'Colby Kempf',
      position: '2B',
      year: 'Jr.',
      stats: '.301/.392/.438, 7 HR, 42 RBI',
      bio: 'Table-setter at the top of the lineup. Patient hitter who draws walks and makes pitchers work. Deceptively quick on the bases. The catalyst who sets the tone for Reeder and the middle of the order.',
    },
    {
      name: 'Jack Thompson',
      position: '1B',
      year: 'Sr.',
      stats: '.288/.361/.512, 16 HR, 62 RBI',
      bio: 'Power-first first baseman who led the team in home runs and RBI. Left-handed hitter with natural loft who takes advantage of friendly dimensions. When Thompson gets hot, he carries the offense for weeks.',
    },
    {
      name: 'Dylan Ditzenberger',
      position: 'C',
      year: 'Jr.',
      stats: '.267/.348/.401, 6 HR',
      bio: 'Defensive anchor behind the plate who improved offensively throughout 2025. Game-caller who earned the trust of the pitching staff. Arm strength keeps the running game in check.',
    },
    {
      name: 'Daniel Hegarty',
      position: 'RHP',
      year: 'Sr.',
      stats: '9-3, 3.21 ERA, 102 K in 89.2 IP',
      bio: 'The ace who anchored the staff during the breakout year. Power sinker-slider combination that generates ground balls and strikeouts. 102 strikeouts in under 90 innings is elite-level dominance.',
    },
    {
      name: 'Luke Sinnard',
      position: 'LHP',
      year: 'Jr.',
      stats: '7-2, 3.58 ERA, 78 K in 72.2 IP',
      bio: 'Left-handed complement to Hegarty. Changes speeds and locates with advanced feel. The 1-2 punch of Hegarty and Sinnard gave Kansas a legitimate weekend rotation for the first time in program history.',
    },
    {
      name: 'Tyler Wulfert',
      position: 'RHP',
      year: 'So.',
      stats: '2.64 ERA, 8 SV, 46 K in 37.2 IP',
      bio: 'Freshman closer who was fearless in the ninth. Fastball sits 94 with late life. Earned 8 saves including 3 in Big 12 play. The sophomore version should be even more dominant.',
    },
  ],

  transferAdditions: [
    {
      name: 'Parker Noland',
      position: '3B/UTL',
      year: 'R-Sr.',
      fromSchool: 'Vanderbilt',
      stats: '.274/.361/.449, 10 HR, 41 RBI',
      bio: 'SEC veteran with postseason experience from Nashville. Can play third base or DH. Adds a proven bat and a steadying presence to a young clubhouse riding the momentum of a breakout year.',
    },
    {
      name: 'Ben Kudrna',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Kansas State',
      stats: '4.12 ERA, 68 K in 63.1 IP',
      bio: 'In-state transfer who knows the Big 12 and knows the rivalry. Former high school star from Olathe. Adds rotation depth and a mid-90s fastball with a plus curveball.',
    },
    {
      name: 'Caden Monke',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Missouri',
      stats: '3.44 ERA, 54 K in 47.1 IP',
      bio: 'Border War recruit. Left-handed reliever with a deceptive delivery and a changeup that neutralizes right-handed hitters. Deepens a bullpen that was already strong.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'The 2025 staff was the engine of the breakout — a 3.89 ERA and a .237 opponent batting average from a Kansas program that historically couldn\'t keep the ball in the park. Daniel Hegarty is a bonafide ace. Luke Sinnard is a legitimate Saturday starter. Tyler Wulfert closes games as a sophomore.',
    rotation:
      'Hegarty (3.21 ERA, 102 K) is one of the best pitchers in the Big 12. His sinker-slider combination generates ground balls and whiffs at an elite rate. Sinnard (3.58 ERA, 78 K) provides left-handed balance and pitchability. Ben Kudrna (from Kansas State) competes for the Sunday role with his mid-90s fastball. Three deep — which is all you need when your bullpen is this good.',
    depth:
      'Wulfert (2.64 ERA, 8 saves) was lights-out as a freshman closer. Caden Monke (from Missouri) adds a left-handed bullpen arm. The late innings belong to Kansas. The formula is straightforward: get quality starts from the rotation, hand it to the pen, and let Wulfert close it. That formula won 42 games in 2025.',
  },

  lineupAnalysis: {
    engine:
      'Janson Reeder (.328, 14 HR, 22 SB) is a five-tool player on a program that historically hasn\'t produced them. He does everything: hits for average, hits for power, steals bases, plays elite defense in center. Reeder is the reason Kansas baseball is relevant, and he\'s the reason it will stay relevant in 2026.',
    middle:
      'Jack Thompson (.288, 16 HR, 62 RBI) provides the lineup\'s power core. Parker Noland (.274, 10 HR from Vanderbilt) adds SEC-tested depth in the middle. Thompson-Noland behind Reeder means opposing pitchers can\'t pitch around anyone — there\'s always another threat.',
    supportingCast:
      'Colby Kempf (.301, 42 RBI) sets the table at the top. Dylan Ditzenberger provides stability behind the plate. The lineup stole 88 bases in 2025 — the most in the Big 12 — and the speed returns. This team pressures you on the bases, at the plate, and on the mound. It\'s relentless.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Northern Illinois', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Iowa', location: 'Home', notes: '' },
    { dates: 'Feb 27-Mar 1', opponent: 'Kleberg Bank Classic', location: 'Neutral', notes: 'Corpus Christi — vs. Texas A&M-CC' },
    { dates: 'Mar 13-15', opponent: 'Houston', location: 'Away', notes: 'Big 12 Opener' },
    { dates: 'Mar 20-22', opponent: 'West Virginia', location: 'Home', notes: '' },
    { dates: 'Apr 3-5', opponent: 'TCU', location: 'Away', notes: '' },
    { dates: 'Apr 10-12', opponent: 'Kansas State', location: 'Home', notes: 'Sunflower Showdown' },
    { dates: 'Apr 24-26', opponent: 'Arizona', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Oklahoma State', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Cincinnati', location: 'Home', notes: 'Regular Season Finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 65 },
    { category: 'Rotation', grade: 65 },
    { category: 'Bullpen', grade: 65 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 70 },
    { category: 'Coaching', grade: 70 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'The breakout was real. Forty-two wins, an NCAA Regional host, and the Big 12 Coach of the Year — none of that was a fluke. Fitzgerald returns the core of the lineup (Reeder, Thompson, Kempf), the top of the rotation (Hegarty, Sinnard), and the closer (Wulfert). The portal brought in proven bats and arms from the SEC, Big 12, and border rivalry. Kansas won\'t sneak up on anyone in 2026 — and that\'s the test. Can they win when every opponent circles the series? If Reeder plays like a first-round pick and Hegarty pitches like an ace, the answer is yes. This is a Regional host contender again.',

  relatedLinks: [
    { label: 'Kansas Team Page', href: '/college-baseball/teams/kansas' },
  ],
};

export default function Kansas2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
