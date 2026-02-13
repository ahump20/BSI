import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Auburn',
  teamSlug: 'auburn',
  mascot: 'Tigers',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '10 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Butch Thompson has a young roster with elite upside. Auburn\'s pitching development pipeline produced arms last year that nobody saw coming. The Tigers are not a finished product — but the pieces are there for a program that could surge into contention.',

  programStats: {
    allTimeWins: '2,478',
    winPct: '.556',
    cwsAppearances: 6,
    nationalTitles: 0,
    confTitles: 3,
    cwsWins: 8,
  },

  record2025: '32-26',
  record2025Context: 'Missed the postseason — but the young arms showed promise',
  seasonStats2025: {
    teamBA: '.258',
    teamERA: '4.18',
    homeRuns: 55,
    stolenBases: 68,
    strikeouts: 462,
    opponentBA: '.252',
  },
  seasonHighlights: [
    'Won 14 SEC games despite a young roster',
    'Trace Bright emerged as a legitimate Friday starter (3.42 ERA, 82 K)',
    'Bobby Peirce hit .298 with 8 HR as a sophomore',
    'The pitching staff improved its ERA by half a run from 2024',
    'Three freshmen contributed meaningful innings on the mound',
  ],

  keyReturnees: [
    {
      name: 'Bobby Peirce',
      position: 'INF',
      year: 'Jr.',
      stats: '.298/.378/.458, 8 HR',
      bio: 'The lineup anchor. Improving power from the middle infield with the kind of bat speed that suggests a breakout is coming.',
    },
    {
      name: 'Trace Bright',
      position: 'RHP',
      year: 'Jr.',
      stats: '6-5, 3.42 ERA, 82 K',
      bio: 'Emerged as a legitimate Friday starter. Commands three pitches and competes against SEC-caliber lineups.',
    },
    {
      name: 'Cole Foster',
      position: 'SS',
      year: 'Jr.',
      stats: '.272/.352/.388, 4 HR',
      bio: 'Athletic shortstop with range and arm strength. The bat is still developing but the defense is already SEC-caliber.',
    },
    {
      name: 'Cam Hill',
      position: 'OF',
      year: 'Sr.',
      stats: '.265/.342/.405, 6 HR, 15 SB',
      bio: 'Speed-and-defense outfielder who provides the athleticism Auburn needs in center field.',
    },
    {
      name: 'John Armstrong',
      position: 'RHP',
      year: 'So.',
      stats: '3.75 ERA, 58 K, 48 IP',
      bio: 'Young arm with power stuff. Pitched beyond his years as a freshman and projects as a Saturday starter.',
    },
  ],

  transferAdditions: [
    {
      name: 'Tommy Troy',
      position: 'INF',
      year: 'R-Sr.',
      fromSchool: 'Stanford',
      stats: '.288/.378/.452, 9 HR',
      bio: 'Experienced infielder from a premier program. Adds a proven bat and leadership to a young roster.',
    },
    {
      name: 'Gage Jump',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Michigan',
      stats: '3.18 ERA, 78 K',
      bio: 'Left-handed starter with improving command. Adds rotation depth that Auburn lacked last season.',
    },
    {
      name: 'Tyler Mack',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'South Carolina',
      stats: '.275/.355/.412, 5 HR',
      bio: 'SEC-experienced outfielder who adds lineup depth and defensive versatility.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Trace Bright (6-5, 3.42 ERA) is the Friday man. He commands three pitches and competed against SEC lineups as a sophomore. The step from good to ace is the one Thompson needs him to take.',
    rotation:
      'John Armstrong (3.75 ERA) has the stuff for Saturdays with a power arm that projects. Gage Jump (from Michigan, 3.18 ERA) fills the Sunday spot with left-handed depth. Three competent weekend starters — that is a step forward for this program.',
    depth:
      'Auburn develops bullpen arms through the program. The returning relievers gained SEC experience last season, and the results improved as the year went on. The pen is young — but young arms with good coaching get better in a hurry.',
  },

  lineupAnalysis: {
    engine:
      'Bobby Peirce (.298, 8 HR) is the bat that makes this lineup go. His bat speed is elite for a middle infielder, and the power is developing. A breakout season from Peirce turns this from a middling SEC offense into a competitive one.',
    middle:
      'Tommy Troy (from Stanford, .288, 9 HR) adds a veteran presence Auburn lacked. Cole Foster (.272) continues to develop at short. The middle of the order is improved but still lacks the kind of consistent run production the SEC elite have.',
    supportingCast:
      'Cam Hill (.265, 15 SB) provides speed and defense. Tyler Mack (from South Carolina) adds SEC depth. The lineup needs one more bat to emerge from the returning players — if it does, Auburn pushes for a postseason spot.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Presbyterian', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'UAB', location: 'Away', notes: '' },
    { dates: 'Mar 7-9', opponent: 'Alabama', location: 'Home', notes: 'Iron Bowl' },
    { dates: 'Mar 14-16', opponent: 'Oklahoma', location: 'Home', notes: 'SEC Opener' },
    { dates: 'Mar 20-22', opponent: 'Texas', location: 'Home', notes: '' },
    { dates: 'Mar 28-30', opponent: 'South Carolina', location: 'Away', notes: '' },
    { dates: 'Apr 4-6', opponent: 'Georgia', location: 'Home', notes: '' },
    { dates: 'Apr 18-20', opponent: 'Mississippi State', location: 'Away', notes: '' },
    { dates: 'May 2-4', opponent: 'Alabama', location: 'Away', notes: 'Iron Bowl' },
    { dates: 'May 9-11', opponent: 'Missouri', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 50 },
    { category: 'Rotation', grade: 50 },
    { category: 'Bullpen', grade: 45 },
    { category: 'Defense', grade: 55 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 60 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Auburn is not there yet — but the trajectory is clear. Thompson has young arms developing, Peirce has the bat to be a star, and the portal additions address the biggest gaps. The SEC schedule will be unforgiving, but if the young pitching takes the next step and the lineup finds another bat, the Tigers could push for a postseason bid. This is a program building toward something. The question is whether 2026 is the year it arrives.',

  relatedLinks: [
    { label: 'Auburn Team Page', href: '/college-baseball/teams/auburn' },
  ],
};

export default function Auburn2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
