import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Georgia',
  teamSlug: 'georgia',
  mascot: 'Bulldogs',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '11 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Charlie Condon is the best pure hitter in college baseball. If the pitching catches up to the offense, Georgia could surprise. Wes Johnson has the talent — the question is whether Athens becomes a destination program.',

  programStats: {
    allTimeWins: '2,868',
    winPct: '.582',
    cwsAppearances: 5,
    nationalTitles: 0,
    confTitles: 8,
    cwsWins: 6,
  },

  record2025: '39-23',
  record2025Context: 'Regional — the offense carried a .281 team average',
  seasonStats2025: {
    teamBA: '.281',
    teamERA: '4.12',
    homeRuns: 88,
    stolenBases: 62,
    strikeouts: 475,
    opponentBA: '.248',
  },
  seasonHighlights: [
    'Charlie Condon: .388, 28 HR, 68 RBI — led the nation in batting average',
    'Corey Collins hit .284 with 13 HR from the hot corner',
    'Reached the Regional for the second consecutive year',
    'Set a program record for home runs (88) in a single season',
    'Kolby Branch emerged as the bullpen closer with 8 saves',
  ],

  keyReturnees: [
    {
      name: 'Charlie Condon',
      position: 'OF/3B',
      year: 'Jr.',
      stats: '.388/.498/.742, 28 HR, 68 RBI',
      bio: 'The best pure hitter in college baseball. Led the nation in batting average and was a finalist for every major award. Generational bat with elite raw power and contact skills.',
    },
    {
      name: 'Corey Collins',
      position: '3B',
      year: 'Jr.',
      stats: '.284/.368/.478, 13 HR',
      bio: 'Power bat at the hot corner. Provides lineup protection behind Condon and drives the ball with authority. Solid defender who has improved his range.',
    },
    {
      name: 'Kolby Branch',
      position: 'RHP',
      year: 'Jr.',
      stats: '2.68 ERA, 8 SV, 58 K',
      bio: 'Closer with a power arm. Converted 8 of 9 save opportunities and dominated the ninth inning. Returns as one of the best relievers in the SEC.',
    },
    {
      name: 'Connor Tate',
      position: 'OF',
      year: 'Sr.',
      stats: '.275/.362/.418, 7 HR',
      bio: 'Veteran outfielder with a mature approach. Contact-first hitter who plays solid defense and anchors the outfield.',
    },
    {
      name: 'Liam Sullivan',
      position: 'LHP',
      year: 'Jr.',
      stats: '3.85 ERA, 88 K, 72 IP',
      bio: 'Left-handed starter with improving command. Has the stuff to be a weekend arm — needs to limit walks to take the next step.',
    },
  ],

  transferAdditions: [
    {
      name: 'Carson Whisenhunt',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'East Carolina',
      stats: '2.78 ERA, 102 K',
      bio: 'Elite left-hander from a strong program. Immediately slots into the Friday rotation and could be the ace Georgia needs.',
    },
    {
      name: 'Dalton Rushing',
      position: 'C',
      year: 'R-Sr.',
      fromSchool: 'Louisville',
      stats: '.295/.402/.518, 12 HR',
      bio: 'Veteran catcher with power. Adds an experienced bat and defensive presence behind the plate.',
    },
    {
      name: 'Jett Williams',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'Mississippi State',
      stats: '.282/.365/.412, 5 HR',
      bio: 'Versatile infielder who can play short or second. Adds SEC-experienced depth to the middle infield.',
    },
    {
      name: 'Max Wagner',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Clemson',
      stats: '3.48 ERA, 71 K',
      bio: 'Experienced right-hander who adds rotation depth. Knows how to compete in ACC weekend series.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Carson Whisenhunt (from East Carolina, 2.78 ERA, 102 K) could be the ace Georgia has been missing. A power lefty with elite stuff and the ability to pitch deep into games. If he lives up to his ceiling, the entire staff transforms.',
    rotation:
      'Liam Sullivan (3.85 ERA, 88 K) has the stuff but needs to limit walks. Max Wagner (from Clemson, 3.48 ERA) adds a veteran right-hander with Power Five experience. The rotation has arms — the question is whether they can pitch consistently in SEC weekend series.',
    depth:
      'Kolby Branch (2.68 ERA, 8 SV) is a lockdown closer. His power arm and ninth-inning poise give Georgia certainty in the late innings. The bullpen beyond Branch needs to develop — if it does, the pitching goes from a question mark to a strength.',
  },

  lineupAnalysis: {
    engine:
      'Charlie Condon (.388, 28 HR) is the most dangerous hitter in college baseball. A .498 on-base percentage with 28 home runs — from a player who also led the nation in average. He can carry a team for a month. He is the reason Georgia is in this conversation.',
    middle:
      'Corey Collins (.284, 13 HR) and Dalton Rushing (from Louisville, .295, 12 HR) give Georgia a legitimate 3-4-5 around Condon. Both have power and approach. The lineup is not dependent on one bat — though Condon makes it look that way.',
    supportingCast:
      'Connor Tate (.275, 7 HR) provides veteran stability. Jett Williams (from Mississippi State) adds infield flexibility. The bottom of the order needs to improve — but if Condon continues at this level, the lineup produces enough.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Georgia Southern', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Clemson', location: 'Neutral', notes: '' },
    { dates: 'Mar 7-9', opponent: 'Georgia Tech', location: 'Away', notes: 'In-state Rivalry' },
    { dates: 'Mar 14-16', opponent: 'Kentucky', location: 'Away', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Missouri', location: 'Home', notes: '' },
    { dates: 'Apr 4-6', opponent: 'Auburn', location: 'Away', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Florida', location: 'Home', notes: '' },
    { dates: 'Apr 25-27', opponent: 'Ole Miss', location: 'Away', notes: '' },
    { dates: 'May 2-4', opponent: 'Tennessee', location: 'Home', notes: '' },
    { dates: 'May 9-11', opponent: 'Vanderbilt', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 70 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 60 },
    { category: 'Defense', grade: 55 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 60 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'Georgia\'s ceiling is defined by Charlie Condon — the best bat in college baseball. If the pitching catches up, this team could host a Regional and make a run. Whisenhunt is the key addition. Branch is a proven closer. The lineup around Condon has more depth than people realize. The floor is a bubble team. The ceiling is Omaha. It depends entirely on what the arms do behind the best hitter in the country.',

  relatedLinks: [
    { label: 'Georgia Team Page', href: '/college-baseball/teams/georgia' },
  ],
};

export default function Georgia2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
