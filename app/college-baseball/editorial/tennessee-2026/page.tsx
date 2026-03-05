import type { Metadata } from 'next';
import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

export const metadata: Metadata = {
  title: 'Tennessee Volunteers 2026 Season Preview | Blaze Sports Intel',
  description: 'Tennessee Volunteers 2026 college baseball season preview. Roster breakdown, pitching staff analysis, key players, and predictions for the SEC season.',
  openGraph: {
    title: 'Tennessee Volunteers — 2026 Season Preview | BSI',
    description: 'Full scouting report on the Tennessee Volunteers heading into the 2026 college baseball season.',
    type: 'article',
  },
};

const data: TeamPreviewData = {
  teamName: 'Tennessee',
  teamSlug: 'tennessee',
  mascot: 'Volunteers',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '12 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Tony Vitello has built Tennessee into a legitimate power. The Vols bring back a potent lineup and one of the SEC\'s best arms in Drew Beam. After a 45-win season and Regional final, the gap between Tennessee and the SEC\'s elite has closed.',

  programStats: {
    allTimeWins: '2,654',
    winPct: '.576',
    cwsAppearances: 6,
    nationalTitles: 0,
    confTitles: 5,
    cwsWins: 8,
  },

  record2025: '45-23',
  record2025Context: 'Regional Final — lineup carried the load',
  seasonStats2025: {
    teamBA: '.286',
    teamERA: '3.98',
    homeRuns: 94,
    stolenBases: 71,
    strikeouts: 489,
    opponentBA: '.241',
  },
  seasonHighlights: [
    '45 wins — third consecutive 40-win season under Vitello',
    'Christian Moore: .341, 21 HR — Golden Spikes finalist',
    'Drew Beam: 9-3, 2.89 ERA with 121 strikeouts',
    'Blake Burke hit .308 with 17 home runs from the first base spot',
    'Set a school record for home runs (94) in a single season',
  ],

  keyReturnees: [
    {
      name: 'Christian Moore',
      position: '2B',
      year: 'Jr.',
      stats: '.341/.425/.612, 21 HR, 67 RBI',
      bio: 'Golden Spikes finalist. The best pure hitter in the SEC not named White or Grahovac. Plus power from the second base spot — a rare combination.',
    },
    {
      name: 'Drew Beam',
      position: 'RHP',
      year: 'Jr.',
      stats: '9-3, 2.89 ERA, 121 K',
      bio: 'The ace. Mid-90s fastball with a wipeout curve. Competes at an elite level on Fridays and has the stuff to be a first-round pick.',
    },
    {
      name: 'Blake Burke',
      position: '1B',
      year: 'Jr.',
      stats: '.308/.395/.558, 17 HR',
      bio: 'Left-handed power bat at first base. Drives the ball to all fields and has improved his plate discipline each year.',
    },
    {
      name: 'Dylan Dreiling',
      position: 'OF',
      year: 'Jr.',
      stats: '.275/.362/.445, 10 HR, 22 SB',
      bio: 'Five-tool outfielder who impacts the game in every phase. Speed, defense, and a bat that has developed real pop.',
    },
    {
      name: 'AJ Russell',
      position: 'RHP',
      year: 'So.',
      stats: '3.42 ERA, 78 K, 55 IP',
      bio: 'Power arm with mid-90s heat. Electric stuff from the bullpen — could push for a weekend rotation spot as a sophomore.',
    },
    {
      name: 'Kavares Tears',
      position: 'OF',
      year: 'Sr.',
      stats: '.268/.342/.398, 6 HR, 18 SB',
      bio: 'Veteran center fielder with elite speed and range. Defensive impact and baserunning instinct change games.',
    },
  ],

  transferAdditions: [
    {
      name: 'Jacob Wilson',
      position: 'SS',
      year: 'Jr.',
      fromSchool: 'Grand Canyon',
      stats: '.352/.428/.578, 14 HR',
      bio: 'First-round draft talent from outside the Power Five. Dynamic offensive player who adds another elite bat to the lineup.',
    },
    {
      name: 'Owen Murphy',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Georgia Tech',
      stats: '3.18 ERA, 96 K',
      bio: 'Power arm with plus stuff. Immediately slots into the weekend rotation behind Beam.',
    },
    {
      name: 'Connor Walsh',
      position: 'LHP',
      year: 'R-Sr.',
      fromSchool: 'Virginia',
      stats: '2.95 ERA, 6 SV',
      bio: 'Experienced left-handed reliever with ACC postseason experience. Gives Vitello a second closer option.',
    },
    {
      name: 'Zach Neto',
      position: 'INF',
      year: 'R-Sr.',
      fromSchool: 'Campbell',
      stats: '.315/.394/.489, 8 HR',
      bio: 'Contact-oriented infielder who can play multiple positions. Adds veteran depth to the infield mix.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Drew Beam (9-3, 2.89 ERA, 121 K) is one of the best right-handers in the SEC. His mid-90s fastball and wipeout curve make him a first-round caliber Friday starter. When Beam pitches, Tennessee can beat anyone in the country.',
    rotation:
      'Owen Murphy (from Georgia Tech, 3.18 ERA) gives Vitello a legitimate Saturday arm with power stuff. AJ Russell (3.42 ERA) has the velocity to close or start — his role depends on the Sunday competition. The rotation has the kind of swing-and-miss ability that plays in postseason baseball.',
    depth:
      'Connor Walsh (from Virginia, 2.95 ERA, 6 SV) solves the bullpen. The Vols needed a left-handed closer option, and Walsh provides exactly that. The returning arms bring SEC experience. Vitello does not overuse his bullpen — he trusts his starters to pitch deep. That discipline pays off in May.',
  },

  lineupAnalysis: {
    engine:
      'Christian Moore (.341, 21 HR) is a force of nature from the second base spot. Golden Spikes finalist. He can carry the lineup for weeks at a time and has the kind of bat speed that makes average pitches into home runs. He sets the tone for everything Tennessee does offensively.',
    middle:
      'Blake Burke (.308, 17 HR) gives Tennessee left-handed power in the middle of the order. Jacob Wilson (from Grand Canyon, .352, 14 HR) is a first-round talent who raises the ceiling of the entire lineup. Together with Moore, Tennessee has a 3-4-5 that can match anyone in the SEC.',
    supportingCast:
      'Dylan Dreiling (.275, 10 HR, 22 SB) does everything. Speed, power, defense. Kavares Tears (.268, 18 SB) brings elite speed and defensive range in center. Zach Neto (from Campbell) adds contact depth. The lineup has no easy outs and multiple ways to manufacture runs.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Western Michigan', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Texas Tech', location: 'Neutral', notes: 'Round Rock' },
    { dates: 'Mar 7-9', opponent: 'Georgia Tech', location: 'Away', notes: '' },
    { dates: 'Mar 14-16', opponent: 'Arkansas', location: 'Away', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Vanderbilt', location: 'Home', notes: 'In-state Rivalry' },
    { dates: 'Apr 3-5', opponent: 'Florida', location: 'Away', notes: '' },
    { dates: 'Apr 18-20', opponent: 'Ole Miss', location: 'Home', notes: '' },
    { dates: 'Apr 25-27', opponent: 'LSU', location: 'Home', notes: '' },
    { dates: 'May 2-4', opponent: 'Georgia', location: 'Away', notes: '' },
    { dates: 'May 8-10', opponent: 'Texas', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 75 },
    { category: 'Rotation', grade: 65 },
    { category: 'Bullpen', grade: 60 },
    { category: 'Defense', grade: 60 },
    { category: 'Speed/Baserunning', grade: 65 },
    { category: 'Coaching', grade: 70 },
    { category: 'Schedule Difficulty', grade: 70 },
  ],

  projectionTier: 'Contender',
  projectionText:
    'Tennessee has the lineup to compete with anyone in the SEC. Moore, Burke, and Wilson give Vitello a 3-4-5 that rivals the best in the country. The question is depth behind Beam on the mound — if Murphy and Russell deliver, the Vols have an Omaha ceiling. If not, they are still a Regional host with postseason upside. The talent is there. This is the year Tennessee proves it can finish.',

  relatedLinks: [
    { label: 'Tennessee Team Page', href: '/college-baseball/teams/tennessee' },
  ],
};

export default function Tennessee2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
