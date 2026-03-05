import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oklahoma State Cowboys: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Twenty-one trips to Omaha. Zero national titles. Josh Holliday enters Year 12 knowing what the Cowboys are capable of — and knowing what it takes to get over the hump.',
  openGraph: {
    title: 'Oklahoma State Cowboys: 2026 Season Preview',
    description:
      'Twenty-one trips to Omaha. Zero national titles. Josh Holliday enters Year 12 knowing what the Cowboys are capable of — and knowing what it takes to get over the hump.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Oklahoma State',
  teamSlug: 'oklahoma-state',
  mascot: 'Cowboys',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Twenty-one trips to Omaha. Zero national titles. Josh Holliday enters Year 12 knowing what the Cowboys are capable of — and knowing what it takes to get over the hump. With a power-heavy lineup and a bullpen built for short games, Oklahoma State is a dark horse the Big 12 can\'t afford to overlook.',

  programStats: {
    allTimeWins: '2,217',
    winPct: '.591',
    cwsAppearances: 21,
    nationalTitles: 0,
    confTitles: 8,
    cwsWins: 32,
  },

  record2025: '38-22 (16-14 Big 12)',
  record2025Context: 'Made the NCAA Tournament, fell in the Regional — solid but short of the program\'s ceiling',
  seasonStats2025: {
    teamBA: '.271',
    teamERA: '4.48',
    homeRuns: 74,
    stolenBases: 55,
    strikeouts: 489,
    opponentBA: '.258',
  },
  seasonHighlights: [
    'Made the NCAA Tournament as a 2-seed in the Stillwater Regional',
    'Nolan McLean hit 18 HR and logged 60+ innings on the mound as a true dual-threat',
    'Bullpen ranked in the top 25 nationally in late-inning ERA',
    'Won a midweek series against Oklahoma for the first time since 2019',
  ],

  keyReturnees: [
    {
      name: 'Nolan McLean',
      position: 'UTL/RHP',
      year: 'Sr.',
      stats: '.287/.381/.561, 18 HR, 58 RBI / 4.02 ERA, 71 K in 62.2 IP',
      bio: 'The most fascinating two-way player in college baseball. 6\'4" with plus raw power and a fastball that touches 97. There is no comparable comp in the Big 12. He hits in the middle of the order and pitches in high-leverage spots — sometimes in the same game.',
    },
    {
      name: 'Carson Benge',
      position: 'OF',
      year: 'Jr.',
      stats: '.298/.382/.467, 10 HR, 44 RBI',
      bio: 'Tulsa native with a sweet left-handed swing. Consistent producer who handles the 2-hole with discipline. Above-average outfield defender with reliable instincts.',
    },
    {
      name: 'Aidan Meola',
      position: 'C',
      year: 'Jr.',
      stats: '.261/.352/.421, 7 HR',
      bio: 'Defensive-first catcher with a cannon arm. Threw out 38% of base stealers. The offense took a step forward in 2025, and another jump would make him an all-conference candidate.',
    },
    {
      name: 'Juaron Watts-Brown',
      position: 'RHP',
      year: 'Sr.',
      stats: '7-4, 3.78 ERA, 89 K in 83.1 IP',
      bio: 'Friday night starter with nasty secondary stuff. The curveball is his out pitch — hitters batted .198 against it. Veteran who has been through Big 12 wars.',
    },
    {
      name: 'Gabe Scobie',
      position: 'RHP',
      year: 'Jr.',
      stats: '2.94 ERA, 7 SV, 42 K in 33.2 IP',
      bio: 'Closer who thrives under pressure. Fastball-slider combination that overpowers hitters in the ninth. One of the better back-end arms in the conference.',
    },
  ],

  transferAdditions: [
    {
      name: 'Brady Neal',
      position: 'C/DH',
      year: 'Jr.',
      fromSchool: 'Florida',
      stats: '.275/.358/.449, 8 HR',
      bio: 'Former five-star recruit who never fully broke out in Gainesville. Raw talent is undeniable. If Holliday unlocks it, the Cowboys have a middle-of-the-order force. Can catch or DH.',
    },
    {
      name: 'Austin Keeney',
      position: '3B',
      year: 'Jr.',
      fromSchool: 'West Virginia',
      stats: '.291/.369/.502, 14 HR, 52 RBI',
      bio: 'Power-hitting third baseman who mashed in Morgantown. Adds another 14-homer bat to a lineup that already hits for power. Physical hitter who can turn on velocity.',
    },
    {
      name: 'Blake Mayfield',
      position: 'LHP',
      year: 'R-Sr.',
      fromSchool: 'Arkansas',
      stats: '3.62 ERA, 58 K in 52.1 IP',
      bio: 'SEC-experienced lefty who adds a different look to the rotation. Command pitcher who changes speeds and locates. Immediate impact as a weekend starter.',
    },
    {
      name: 'Drew Dowd',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Creighton',
      stats: '3.34 ERA, 74 K in 64.2 IP',
      bio: 'Big East workhorse who pitched deep into games consistently. Sinking fastball with a developing changeup. Can eat innings and keep the bullpen fresh.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'The Cowboys\' pitching identity starts with Nolan McLean — but it doesn\'t end with him. Juaron Watts-Brown is a legitimate Friday night ace, and the additions from the portal give Holliday options he didn\'t have last year. The question is whether the rotation can be consistent enough to keep Oklahoma State in weekend series.',
    rotation:
      'Watts-Brown (3.78 ERA, 89 K) leads the way. Blake Mayfield (from Arkansas) slots in as the Saturday starter, bringing SEC innings and left-handed balance. Drew Dowd (from Creighton) or McLean compete for the Sunday role, depending on how Holliday deploys McLean\'s arm. The rotation has more depth than 2025 — which is what the Cowboys needed.',
    depth:
      'Gabe Scobie (2.94 ERA, 7 saves) is one of the best closers in the Big 12. The late-inning formula is clear: get to the seventh with a lead, and Scobie finishes it. McLean can pitch high-leverage relief when he\'s not starting. The pen was already a strength — the portal arms let Holliday protect it by shortening games through the rotation.',
  },

  lineupAnalysis: {
    engine:
      'Nolan McLean is the engine. A .287 hitter with 18 home runs who also pitches — that kind of production from a dual-threat player is nearly impossible to replace and impossible to game-plan against. When he\'s in the lineup, the entire order hits differently.',
    middle:
      'Carson Benge (.298, 10 HR) and Austin Keeney (.291, 14 HR from West Virginia) give the Cowboys a middle of the order that can slug with anyone. Brady Neal (from Florida) adds another power bat if he finds his swing in Stillwater. This is a lineup that can post crooked numbers in any inning.',
    supportingCast:
      'Aidan Meola provides defensive stability and enough offense to avoid being a black hole. The bottom of the order has more athleticism than 2025. If Oklahoma State\'s 7-8-9 hitters can get on base at a .330+ clip, this lineup has the upside to be top-three in the Big 12.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Michigan', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Cal Poly', location: 'Home', notes: '' },
    { dates: 'Feb 27-Mar 1', opponent: 'Round Rock Classic', location: 'Neutral', notes: 'vs. Stanford, LSU' },
    { dates: 'Mar 13-15', opponent: 'Kansas State', location: 'Away', notes: 'Big 12 Opener' },
    { dates: 'Mar 20-22', opponent: 'TCU', location: 'Home', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Arizona', location: 'Away', notes: '' },
    { dates: 'Apr 10-12', opponent: 'Baylor', location: 'Home', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Texas Tech', location: 'Away', notes: '' },
    { dates: 'May 1-3', opponent: 'Kansas', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'BYU', location: 'Home', notes: 'Regular Season Finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 65 },
    { category: 'Rotation', grade: 60 },
    { category: 'Bullpen', grade: 65 },
    { category: 'Defense', grade: 55 },
    { category: 'Speed/Baserunning', grade: 50 },
    { category: 'Coaching', grade: 65 },
    { category: 'Schedule Difficulty', grade: 60 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'Oklahoma State is built to beat you in short games — get to the seventh with a lead and hand it to Scobie. The lineup has legitimate power with McLean, Benge, and portal addition Keeney. The rotation is deeper than last year. What keeps the Cowboys in the dark horse tier instead of the contender tier is consistency: 16-14 in conference play suggests they can beat anyone on a given weekend but haven\'t yet proven they can sustain it over the full Big 12 schedule. If Holliday solves that, this team has Regional host upside.',

  relatedLinks: [
    { label: 'Oklahoma State Team Page', href: '/college-baseball/teams/oklahoma-state' },
  ],
};

export default function OklahomaState2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
