import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Mississippi State',
  teamSlug: 'mississippi-state',
  mascot: 'Bulldogs',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '10 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Chris Lemonis won a national title in 2021 and has spent the last two years rebuilding. The Bulldogs have pieces — a veteran pitching staff, a developing lineup, and the kind of program DNA that produces competitive teams. Dudy Noble is still one of the loudest stadiums in the country.',

  programStats: {
    allTimeWins: '2,724',
    winPct: '.571',
    cwsAppearances: 12,
    nationalTitles: 1,
    confTitles: 5,
    cwsWins: 18,
  },

  record2025: '33-25',
  record2025Context: 'Missed postseason — rebuilding after key departures',
  seasonStats2025: {
    teamBA: '.260',
    teamERA: '4.05',
    homeRuns: 52,
    stolenBases: 58,
    strikeouts: 468,
    opponentBA: '.248',
  },
  seasonHighlights: [
    'Won 15 SEC games despite significant roster turnover',
    'Cade Smith emerged as a reliable bullpen arm (2.85 ERA, 8 SV)',
    'Kellum Clark hit .278 with 10 HR — the lineup\'s most consistent bat',
    'The pitching staff improved steadily throughout conference play',
    'Dudy Noble Field continued to provide one of the best home-field advantages in baseball',
  ],

  keyReturnees: [
    {
      name: 'Kellum Clark',
      position: '1B',
      year: 'Jr.',
      stats: '.278/.362/.478, 10 HR',
      bio: 'The lineup anchor. Power bat from first base with a mature approach. Has the tools to be a middle-of-the-order force.',
    },
    {
      name: 'Cade Smith',
      position: 'RHP',
      year: 'Jr.',
      stats: '2.85 ERA, 8 SV, 54 K',
      bio: 'The closer. Power arm with a nasty slider. Shut down SEC lineups in the ninth inning and gives the Bulldogs late-game certainty.',
    },
    {
      name: 'Hunter Hines',
      position: '3B',
      year: 'Jr.',
      stats: '.265/.348/.412, 6 HR',
      bio: 'Hot-corner defender with developing pop. Steady hand in the infield who can drive the ball when he gets his pitch.',
    },
    {
      name: 'Slate Alford',
      position: 'RHP',
      year: 'Sr.',
      stats: '3.68 ERA, 72 K, 65 IP',
      bio: 'Veteran starter who grinds deep into games. Commands the zone and trusts his defense. Reliable Friday presence.',
    },
    {
      name: 'RJ Yeager',
      position: 'OF',
      year: 'So.',
      stats: '.258/.338/.382, 4 HR, 12 SB',
      bio: 'Athletic outfielder with speed and a developing bat. Could break out with everyday at-bats.',
    },
  ],

  transferAdditions: [
    {
      name: 'Brooks Lee',
      position: 'SS',
      year: 'R-Sr.',
      fromSchool: 'Cal Poly',
      stats: '.318/.412/.498, 11 HR',
      bio: 'Elite bat from a strong mid-major. Adds the shortstop production Mississippi State has been missing.',
    },
    {
      name: 'Hurston Waldrep',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Southern Miss',
      stats: '3.05 ERA, 88 K',
      bio: 'In-state arm with plus stuff. Adds rotation depth behind Alford.',
    },
    {
      name: 'Jonathan Embry',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Louisville',
      stats: '.282/.365/.438, 7 HR',
      bio: 'Outfield depth from an ACC program. Adds a veteran bat to a developing lineup.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Cade Smith (2.85 ERA, 8 SV) is a lockdown closer. His slider is unhittable in the ninth, and his composure in high-leverage situations is beyond his years. He gives the Bulldogs certainty from the seventh inning forward.',
    rotation:
      'Slate Alford (3.68 ERA) takes the Friday ball as the veteran presence. Hurston Waldrep (from Southern Miss, 3.05 ERA) fills the Saturday spot with in-state pride and plus stuff. The rotation is not elite — but it is competent enough to keep games close.',
    depth:
      'The bullpen behind Smith is the development project. Lemonis has built relievers before — the 2021 title team had a dominant pen. The young arms need innings to develop, and the SEC schedule will provide them. The question is whether they develop fast enough.',
  },

  lineupAnalysis: {
    engine:
      'Kellum Clark (.278, 10 HR) is the bat the Bulldogs build around. Power from first base with a mature approach. If he takes the next step — and the talent says he can — he becomes one of the better offensive players in the SEC.',
    middle:
      'Brooks Lee (from Cal Poly, .318, 11 HR) is the biggest addition. Elite bat, great approach, and the kind of shortstop production that changes a lineup. Hunter Hines (.265, 6 HR) provides hot-corner depth. The middle of the order improved significantly with the portal.',
    supportingCast:
      'RJ Yeager (.258, 12 SB) provides speed. Jonathan Embry (from Louisville, .282, 7 HR) adds outfield production. The lineup is still thin by SEC standards — but it is better, and at Dudy Noble, the crowd makes up for what the roster lacks.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Alcorn State', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Southern Miss', location: 'Away', notes: 'In-state Rivalry' },
    { dates: 'Mar 7-9', opponent: 'Tulane', location: 'Home', notes: '' },
    { dates: 'Mar 14-16', opponent: 'Missouri', location: 'Away', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Arkansas', location: 'Home', notes: '' },
    { dates: 'Apr 4-6', opponent: 'Oklahoma', location: 'Away', notes: '' },
    { dates: 'Apr 18-20', opponent: 'Auburn', location: 'Home', notes: '' },
    { dates: 'Apr 25-27', opponent: 'South Carolina', location: 'Home', notes: '' },
    { dates: 'May 2-4', opponent: 'Kentucky', location: 'Away', notes: '' },
    { dates: 'May 9-11', opponent: 'Ole Miss', location: 'Away', notes: 'Governor\'s Cup' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 50 },
    { category: 'Rotation', grade: 50 },
    { category: 'Bullpen', grade: 55 },
    { category: 'Defense', grade: 55 },
    { category: 'Speed/Baserunning', grade: 50 },
    { category: 'Coaching', grade: 65 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Mississippi State is in the middle of a rebuild, and Lemonis has navigated this before. Clark and Lee give the lineup a foundation. Smith gives the bullpen a closer. The program DNA is there — a national title is only five years old. The question is whether the pieces around the core develop fast enough to push for a postseason bid in the SEC. Dudy Noble helps. The coaching helps. The roster needs another year — but do not count out a team that knows what winning looks like.',

  relatedLinks: [
    { label: 'Mississippi State Team Page', href: '/college-baseball/teams/mississippi-state' },
  ],
};

export default function MississippiState2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
