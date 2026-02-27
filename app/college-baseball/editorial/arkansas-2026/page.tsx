import type { Metadata } from 'next';
import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

export const metadata: Metadata = {
  title: 'Arkansas Razorbacks 2026 Season Preview | Blaze Sports Intel',
  description: 'Arkansas Razorbacks 2026 college baseball season preview. Roster breakdown, pitching staff analysis, key players, and predictions for the SEC season.',
  openGraph: {
    title: 'Arkansas Razorbacks — 2026 Season Preview | BSI',
    description: 'Full scouting report on the Arkansas Razorbacks heading into the 2026 college baseball season.',
    type: 'article',
  },
};

const data: TeamPreviewData = {
  teamName: 'Arkansas',
  teamSlug: 'arkansas',
  mascot: 'Razorbacks',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '12 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Dave Van Horn\'s program is a machine. The Hogs reload every year with elite talent and compete for SEC titles. This team has the arms to pitch deep into June and a lineup that can match anyone in the conference.',

  programStats: {
    allTimeWins: '3,022',
    winPct: '.604',
    cwsAppearances: 11,
    nationalTitles: 1,
    confTitles: 10,
    cwsWins: 20,
  },

  record2025: '46-21',
  record2025Context: 'Super Regional — pitching carried the postseason run',
  seasonStats2025: {
    teamBA: '.271',
    teamERA: '3.38',
    homeRuns: 78,
    stolenBases: 85,
    strikeouts: 542,
    opponentBA: '.228',
  },
  seasonHighlights: [
    'Reached the Super Regional behind dominant pitching',
    'Hagen Smith: 11-2, 2.05 ERA — SEC Pitcher of the Year finalist',
    'Peyton Stovall hit .312 with 15 stolen bases from the leadoff spot',
    'Team ERA of 3.38 ranked second in the SEC',
    'Won 21 SEC games — third-best in the conference',
  ],

  keyReturnees: [
    {
      name: 'Peyton Stovall',
      position: '2B',
      year: 'Jr.',
      stats: '.312/.408/.438, 6 HR, 15 SB',
      bio: 'Haughton, LA product. Elite contact hitter and table-setter. His on-base ability and baserunning instinct make him one of the most complete offensive players in the SEC.',
    },
    {
      name: 'Hagen Smith',
      position: 'LHP',
      year: 'Jr.',
      stats: '11-2, 2.05 ERA, 148 K',
      bio: 'Bullard, TX product. The best left-handed pitcher in the SEC. Three plus pitches, elite command, and a competitiveness that rises in big moments.',
    },
    {
      name: 'Jace Bohrofen',
      position: 'OF',
      year: 'Sr.',
      stats: '.285/.365/.478, 11 HR',
      bio: 'Veteran outfielder with consistent production. Power-speed combination in right field. Anchors the middle of the order.',
    },
    {
      name: 'Hudson White',
      position: 'C',
      year: 'Jr.',
      stats: '.262/.372/.418, 8 HR',
      bio: 'Strong defensive catcher who improved his bat in SEC play. Plus arm and game-calling ability. The staff trusts him.',
    },
    {
      name: 'Brady Slavens',
      position: '1B/DH',
      year: 'R-Sr.',
      stats: '.275/.362/.502, 14 HR',
      bio: 'Veteran power bat. 14 home runs with the ability to hit the ball out to any field. Provides lineup protection around the top-of-the-order hitters.',
    },
    {
      name: 'Ben Bybee',
      position: 'RHP',
      year: 'Jr.',
      stats: '3.28 ERA, 91 K, 74 IP',
      bio: 'Saturday starter with a power sinker. Gets groundballs at an elite rate and pitches deep into games.',
    },
  ],

  transferAdditions: [
    {
      name: 'Thad Ector',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Oklahoma State',
      stats: '.298/.385/.512, 13 HR',
      bio: 'Power-speed outfielder from a Big 12 program. Adds middle-of-the-order thump and defensive range.',
    },
    {
      name: 'Will McEntire',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Missouri',
      stats: '3.51 ERA, 84 K',
      bio: 'Experienced SEC arm who knows conference hitters. Adds rotation depth behind Smith and Bybee.',
    },
    {
      name: 'Gabe Swansen',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'TCU',
      stats: '.284/.368/.421',
      bio: 'Versatile infielder from a Big 12 contender. Professional approach and defensive versatility.',
    },
    {
      name: 'Max Rajcic',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Stanford',
      stats: '3.89 ERA, 76 K',
      bio: 'Sunday starter or long reliever. Fills innings and competes deep into games.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Hagen Smith is the best left-handed pitcher in the SEC. An 11-2 record with a 2.05 ERA and 148 strikeouts — his slider is the single best pitch in college baseball. Friday nights at Baum-Walker belong to him.',
    rotation:
      'Ben Bybee (3.28 ERA, 91 K) is the Saturday workhorse with a power sinker that generates groundballs at an elite rate. Will McEntire (from Missouri) fills the Sunday spot with SEC experience. Max Rajcic (from Stanford) gives Van Horn a fourth option for midweek starts or long relief.',
    depth:
      'Arkansas develops arms better than anyone in the SEC. The bullpen pieces are homegrown — hard-throwing right-handers who pound the zone and do not walk hitters. Van Horn has built a culture where pitchers compete for every inning. The depth shows in April and May when other staffs thin out.',
  },

  lineupAnalysis: {
    engine:
      'Peyton Stovall (.312, 15 SB) is the catalyst. His on-base ability from the leadoff spot creates run-scoring opportunities every inning. He takes pitches, draws walks, and once he reaches base, he is a threat to steal at any time.',
    middle:
      'Jace Bohrofen (.285, 11 HR) and Brady Slavens (.275, 14 HR) provide the power. Bohrofen drives the ball to all fields. Slavens is a pure run producer. Thad Ector (from Oklahoma State, 13 HR) adds another power-speed element to the middle of the order.',
    supportingCast:
      'Hudson White (.262, 8 HR) improved as the season progressed. Gabe Swansen (from TCU) gives Van Horn lineup flexibility. The Hogs have always been a team that manufactures runs when power is not there — that small-ball DNA is in the program.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Wright State', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'TCU', location: 'Neutral', notes: 'Arlington Classic' },
    { dates: 'Mar 7-9', opponent: 'Oklahoma', location: 'Away', notes: '' },
    { dates: 'Mar 14-16', opponent: 'Tennessee', location: 'Home', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Mississippi State', location: 'Away', notes: '' },
    { dates: 'Apr 4-6', opponent: 'South Carolina', location: 'Home', notes: '' },
    { dates: 'Apr 11-13', opponent: 'Texas A&M', location: 'Home', notes: '' },
    { dates: 'Apr 25-27', opponent: 'LSU', location: 'Away', notes: '' },
    { dates: 'May 2-4', opponent: 'Ole Miss', location: 'Home', notes: '' },
    { dates: 'May 8-10', opponent: 'Alabama', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 65 },
    { category: 'Rotation', grade: 75 },
    { category: 'Bullpen', grade: 65 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 70 },
    { category: 'Coaching', grade: 75 },
    { category: 'Schedule Difficulty', grade: 70 },
  ],

  projectionTier: 'Contender',
  projectionText:
    'Arkansas is the program that always reloads. Van Horn has built something in Fayetteville that produces competitive teams year after year regardless of who leaves. Hagen Smith is the best pitcher in the conference, Stovall is one of the best table-setters, and the portal additions fill every gap. The Hogs have the arms to pitch deep into June. If the lineup clicks, this team can get back to Omaha.',

  relatedLinks: [
    { label: 'Arkansas Team Page', href: '/college-baseball/teams/arkansas' },
  ],
};

export default function Arkansas2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
