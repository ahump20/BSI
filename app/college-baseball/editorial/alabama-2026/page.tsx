import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Alabama',
  teamSlug: 'alabama',
  mascot: 'Crimson Tide',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '10 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Rob Vaughn has Alabama trending upward. The Tide are finally becoming a factor in SEC baseball with improved pitching, a solid lineup, and the kind of recruiting momentum that suggests this is just the beginning.',

  programStats: {
    allTimeWins: '2,685',
    winPct: '.561',
    cwsAppearances: 5,
    nationalTitles: 0,
    confTitles: 5,
    cwsWins: 5,
  },

  record2025: '36-23',
  record2025Context: 'Regional — first postseason appearance since 2021',
  seasonStats2025: {
    teamBA: '.265',
    teamERA: '3.92',
    homeRuns: 58,
    stolenBases: 64,
    strikeouts: 484,
    opponentBA: '.242',
  },
  seasonHighlights: [
    'First Regional appearance since 2021 — a milestone under Vaughn',
    'Grayson Hitt: 8-3, 2.95 ERA — breakout season on the mound',
    'Gage Miller hit .292 with 8 HR and played elite defense at shortstop',
    'Drew Williamson provided lineup balance with .278 and 10 HR from third base',
    'Won 18 SEC games — the most in a decade for the program',
  ],

  keyReturnees: [
    {
      name: 'Gage Miller',
      position: 'SS',
      year: 'Jr.',
      stats: '.292/.375/.432, 8 HR',
      bio: 'The anchor. Elite defensive shortstop with a bat that keeps improving. Plays the game the right way and leads by example.',
    },
    {
      name: 'Grayson Hitt',
      position: 'RHP',
      year: 'Jr.',
      stats: '8-3, 2.95 ERA, 94 K',
      bio: 'The ace. Breakout season with mid-90s velocity and a sharp slider. Competes on Fridays against the SEC\'s best lineups.',
    },
    {
      name: 'Drew Williamson',
      position: '3B',
      year: 'Sr.',
      stats: '.278/.358/.468, 10 HR',
      bio: 'Power bat at the hot corner. Provides the middle-of-the-order production Alabama needs to compete in weekend series.',
    },
    {
      name: 'Andrew Pinckney',
      position: 'OF',
      year: 'Jr.',
      stats: '.268/.348/.398, 5 HR, 18 SB',
      bio: 'Athletic outfielder with speed and developing power. Could be a breakout candidate with everyday at-bats.',
    },
    {
      name: 'Jake Leger',
      position: 'LHP',
      year: 'So.',
      stats: '3.65 ERA, 62 K, 51 IP',
      bio: 'Young left-hander with improving stuff. Projects as a Saturday starter with continued development.',
    },
  ],

  transferAdditions: [
    {
      name: 'Mitchell Parker',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Kentucky',
      stats: '3.28 ERA, 74 K',
      bio: 'SEC-experienced left-hander. Adds rotation depth and a proven arm against conference competition.',
    },
    {
      name: 'Davis Diaz',
      position: 'INF',
      year: 'R-Sr.',
      fromSchool: 'Florida',
      stats: '.282/.365/.418, 6 HR',
      bio: 'Veteran infielder from a national contender. Adds a professional at-bat to the lineup.',
    },
    {
      name: 'Collin Burns',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Auburn',
      stats: '3.45 ERA, 58 K',
      bio: 'In-state transfer who adds bullpen depth. Knows SEC hitters from the other side of the Iron Bowl.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Grayson Hitt (8-3, 2.95 ERA, 94 K) is the kind of Friday arm that changes a program. Mid-90s heat with a sharp slider. He gives Alabama a chance to win the opening game of any series — and in the SEC, that baseline unlocks everything else.',
    rotation:
      'Jake Leger (3.65 ERA) is developing into a Saturday starter. Mitchell Parker (from Kentucky, 3.28 ERA) adds SEC experience on Sundays. The rotation has improved every year under Vaughn — and this is the deepest group he has had.',
    depth:
      'Collin Burns (from Auburn) strengthens the bullpen. The returning relievers showed growth in the Regional run. Alabama will not overpower anyone from the pen — but they throw enough strikes and compete hard enough to hold leads.',
  },

  lineupAnalysis: {
    engine:
      'Gage Miller (.292, 8 HR) sets the tone. His bat has improved each year, and his defense at shortstop is among the best in the SEC. He plays the kind of steady, complete baseball that Vaughn\'s program is built on.',
    middle:
      'Drew Williamson (.278, 10 HR) provides the power. Davis Diaz (from Florida, .282, 6 HR) adds a veteran bat with SEC pedigree. The middle of the order is not elite — but it is competent, and competent is an upgrade.',
    supportingCast:
      'Andrew Pinckney (.268, 18 SB) provides speed at the top of the order. The lineup is still developing — Alabama is a year or two away from matching the SEC\'s top offenses. For now, the goal is to score enough behind quality pitching.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Samford', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Troy', location: 'Away', notes: '' },
    { dates: 'Mar 7-9', opponent: 'Auburn', location: 'Away', notes: 'Iron Bowl' },
    { dates: 'Mar 14-16', opponent: 'Texas A&M', location: 'Home', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Kentucky', location: 'Home', notes: '' },
    { dates: 'Apr 4-6', opponent: 'Ole Miss', location: 'Away', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Texas', location: 'Away', notes: '' },
    { dates: 'Apr 25-27', opponent: 'Oklahoma', location: 'Away', notes: '' },
    { dates: 'May 2-4', opponent: 'Auburn', location: 'Home', notes: 'Iron Bowl' },
    { dates: 'May 8-10', opponent: 'Arkansas', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 50 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 50 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 60 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Alabama is trending upward but not yet at the level of the SEC\'s upper half. Hitt gives them a legitimate ace. Miller gives them a legitimate shortstop. The program is better than it was two years ago in every measurable way. The question is whether better is enough — the SEC does not grade on a curve. The Tide need another year of development and another strong portal cycle to be a consistent threat. But the foundation is real.',

  relatedLinks: [
    { label: 'Alabama Team Page', href: '/college-baseball/teams/alabama' },
  ],
};

export default function Alabama2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
