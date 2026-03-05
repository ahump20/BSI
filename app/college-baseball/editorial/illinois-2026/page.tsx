import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Illinois Fighting Illini: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Dan Hartleb has kept Illinois competitive for 17 years — a feat that requires equal parts stubbornness and development. The Illini went 30-24 with a 14-16 Big Ten record in 2025.',
  openGraph: {
    title: 'Illinois Fighting Illini: 2026 Season Preview',
    description:
      'Dan Hartleb has kept Illinois competitive for 17 years — a feat that requires equal parts stubbornness and development. The Illini went 30-24 with a 14-16 Big Ten record in 2025.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Illinois',
  teamSlug: 'illinois',
  mascot: 'Fighting Illini',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Dan Hartleb has kept Illinois competitive for 17 years — a feat that requires equal parts stubbornness and development. The Illini went 30-24 with a 14-16 Big Ten record in 2025, and the 2026 roster needs the portal additions and returning core to push Illinois back above .500 in conference play.',

  programStats: {
    allTimeWins: '2,112',
    winPct: '.538',
    cwsAppearances: 5,
    nationalTitles: 0,
    confTitles: 12,
    cwsWins: 7,
  },

  record2025: '30-24 (14-16 Big Ten)',
  record2025Context: 'Below .500 in Big Ten play — first time in three years',
  seasonStats2025: {
    teamBA: '.261',
    teamERA: '4.38',
    homeRuns: 55,
    stolenBases: 58,
    strikeouts: 438,
    opponentBA: '.261',
  },
  seasonHighlights: [
    'Won 30 games despite a below-.500 conference record — non-conference strength was the difference',
    'Defeated Oregon in a midweek game — one of the Ducks\' few losses on the season',
    'Cam McDonald earned All-Big Ten honors with a .314 average and 11 home runs',
    'Pitching staff posted the fourth-most strikeouts in the Big Ten (438)',
    'Advanced to the Big Ten Tournament semifinals before losing to UCLA',
  ],

  keyReturnees: [
    {
      name: 'Cam McDonald',
      position: 'OF',
      year: 'Sr.',
      stats: '.314/.401/.508, 11 HR, 47 RBI',
      bio: 'Naperville product. Illinois\' best hitter and the offensive anchor. Does not chase and drives the ball with authority when he gets a pitch to hit.',
    },
    {
      name: 'Brody Harding',
      position: 'SS',
      year: 'Jr.',
      stats: '.281/.358/.402, 5 HR, 14 SB',
      bio: 'Champaign native. Athletic shortstop with range and improving offensive numbers. Hits the ball harder than his average suggests — due for a breakout.',
    },
    {
      name: 'Drake Westcott',
      position: '1B/DH',
      year: 'Sr.',
      stats: '.269/.349/.468, 13 HR',
      bio: 'Peoria product. Illinois\' power bat. 13 home runs led the team in 2025. Needs to raise the batting average but the raw power is real.',
    },
    {
      name: 'Nathan Stahl',
      position: 'LHP',
      year: 'Jr.',
      stats: '6-5, 3.72 ERA, 84 K in 77.1 IP',
      bio: 'Decatur product. Friday starter with a mature approach beyond his years. Pounds the zone with a fastball-changeup combination and rarely walks hitters.',
    },
    {
      name: 'Jack Wenninger',
      position: 'RHP',
      year: 'Sr.',
      stats: '5-4, 4.21 ERA, 71 K in 68.2 IP',
      bio: 'Bloomington native. Veteran Saturday arm who has seen everything the Big Ten can throw at him. Experience is the weapon — he competes in every outing.',
    },
    {
      name: 'Joey Gerber',
      position: 'RHP',
      year: 'Jr.',
      stats: '3.18 ERA, 6 SV, 41 K in 34 IP',
      bio: 'Springfield product. Closer with a lively fastball and a competitive edge. Six saves in eight chances — he has earned the ninth inning.',
    },
  ],

  transferAdditions: [
    {
      name: 'Marcus Brown',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'Missouri',
      stats: '.278/.361/.432, 7 HR',
      bio: 'SEC infielder who adds power and versatility. Can play second base or third base. Gives Hartleb lineup flexibility he lacked in 2025.',
    },
    {
      name: 'Ty Johnson',
      position: 'OF',
      year: 'R-Sr.',
      fromSchool: 'Oklahoma State',
      stats: '.292/.378/.448, 6 HR, 17 SB',
      bio: 'Big 12 outfielder with speed and on-base ability. Immediately upgrades the top of the lineup.',
    },
    {
      name: 'Ryan Webb',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Wichita State',
      stats: '3.64 ERA, 68 K in 59.1 IP',
      bio: 'Sunday starter candidate with a three-pitch mix and the ability to eat innings. Fills a hole that plagued Illinois in 2025.',
    },
    {
      name: 'Dominic Hamel',
      position: 'LHP',
      year: 'R-Sr.',
      fromSchool: 'Dallas Baptist',
      stats: '3.48 ERA, 52 K in 46.2 IP',
      bio: 'Experienced left-handed reliever who adds bullpen depth. Can work multiple innings and neutralize lefties.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Nathan Stahl (3.72 ERA, 84 K) is a genuine Friday starter who does not beat himself — 1.8 walks per nine innings tells you everything about his approach. Joey Gerber (3.18 ERA, 6 saves) in the ninth gives Illinois a defined back end. The Stahl-to-Gerber pipeline is the foundation. The question is what happens in between.',
    rotation:
      'Stahl on Fridays, Jack Wenninger (4.21 ERA, 71 K) on Saturdays, and Ryan Webb (from Wichita State) on Sundays. Wenninger is a veteran who competes but gave up too many runs in Big Ten play to be a true conference-caliber Saturday arm. Webb fills the Sunday hole that Illinois tried three different starters for in 2025 — stability alone would be an upgrade.',
    depth:
      'Gerber closes. Dominic Hamel (from Dallas Baptist) adds the left-handed relief depth Illinois lacked. The middle-relief corps was the weakness in 2025 — a 4.85 ERA in the sixth through eighth innings cost Illinois at least four conference games. If Hamel and the returning arms can get that number under 4.00, the Illini compete for a tournament bid. If not, it is the same story as 2025.',
  },

  lineupAnalysis: {
    engine:
      'Cam McDonald (.314/.401/.508, 11 HR) carries the lineup. He is the most disciplined hitter in Champaign in a decade — does not expand the zone, punishes mistakes, and can drive the ball out of the park when he gets his pitch. McDonald in the three-hole forces pitchers to be honest with the entire lineup.',
    middle:
      'Drake Westcott (.269/.349/.468, 13 HR) provides the raw power. 13 home runs are real — the .269 average is what holds him back from being an All-Big Ten player. If he raises it to .285, Illinois has a 1-2 punch in the middle of the order. Marcus Brown (from Missouri, .278/.361/.432, 7 HR) adds depth behind them.',
    supportingCast:
      'Ty Johnson (from Oklahoma State, .292/.378/.448, 17 SB) upgrades the top of the order immediately. Brody Harding (.281/.358/.402, 14 SB) provides speed and defense at shortstop. The bottom third needs development — Illinois was too easy to pitch through in 2025 once you got past McDonald and Westcott. The portal additions help, but the six through nine holes are still a question.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Southern Illinois', location: 'Neutral', notes: 'Season Opener — Marion, IL' },
    { dates: 'Feb 20-22', opponent: 'Dallas Baptist', location: 'Neutral', notes: 'Shriners Classic — Houston' },
    { dates: 'Mar 6-8', opponent: 'Illinois State', location: 'Home', notes: 'I-55 rivalry' },
    { dates: 'Mar 13-15', opponent: 'Iowa', location: 'Away', notes: 'Big Ten Opener' },
    { dates: 'Mar 27-29', opponent: 'Washington', location: 'Home', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Indiana', location: 'Away', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Maryland', location: 'Home', notes: '' },
    { dates: 'Apr 24-26', opponent: 'USC', location: 'Away', notes: '' },
    { dates: 'May 8-10', opponent: 'Oregon', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Michigan', location: 'Away', notes: 'Regular season finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 45 },
    { category: 'Rotation', grade: 50 },
    { category: 'Bullpen', grade: 45 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Illinois is the program that is always in the conversation but rarely the loudest voice. Hartleb has kept the Illini relevant for 17 years — that longevity deserves respect even when the results are average. The 2026 roster has enough talent to compete for an NCAA Tournament bid, but the margin is thin. McDonald is a genuine All-Big Ten player, Stahl can win a Friday game against anyone, and the portal additions fill real holes. The risk is the middle of the roster — the sixth through ninth hitters, the bridge relievers, the depth arms. If those pieces produce at a Big Ten level, Illinois is a tournament team. If they are average, the Illini are the team that finishes 15-15 in conference play and watches the tournament from home. Hartleb has navigated that thin margin before. He will need to again.',

  relatedLinks: [
    { label: 'Illinois Team Page', href: '/college-baseball/teams/illinois' },
  ],
};

export default function Illinois2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
