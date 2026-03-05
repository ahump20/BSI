import type { Metadata } from 'next';
import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

export const metadata: Metadata = {
  title: 'Missouri Tigers 2026 Season Preview | Blaze Sports Intel',
  description: 'Missouri Tigers 2026 college baseball season preview. Roster breakdown, pitching staff analysis, key players, and predictions for the SEC season.',
  openGraph: {
    title: 'Missouri Tigers — 2026 Season Preview | BSI',
    description: 'Full scouting report on the Missouri Tigers heading into the 2026 college baseball season.',
    type: 'article',
  },
};

const data: TeamPreviewData = {
  teamName: 'Missouri',
  teamSlug: 'missouri',
  mascot: 'Tigers',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '10 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Kerrick Jackson is building. Missouri has been the SEC\'s project program since joining the conference, but the pieces are starting to fall into place. A young pitching staff, portal additions with pedigree, and a coaching staff with a vision for what this program can become.',

  programStats: {
    allTimeWins: '2,354',
    winPct: '.545',
    cwsAppearances: 3,
    nationalTitles: 0,
    confTitles: 4,
    cwsWins: 2,
  },

  record2025: '28-29',
  record2025Context: 'Sub-.500 but competitive in conference play',
  seasonStats2025: {
    teamBA: '.255',
    teamERA: '4.35',
    homeRuns: 48,
    stolenBases: 62,
    strikeouts: 442,
    opponentBA: '.258',
  },
  seasonHighlights: [
    'Won 12 SEC games — an improvement from the previous two seasons',
    'Ross Lovich hit .289 with 7 HR as the most consistent bat in the lineup',
    'Luke Sinnard: 3.52 ERA as the Friday starter — a breakout season',
    'Stole 62 bases as a team — a program emphasis under Jackson',
    'Competitive in multiple SEC series despite the overall record',
  ],

  keyReturnees: [
    {
      name: 'Ross Lovich',
      position: 'OF',
      year: 'Jr.',
      stats: '.289/.368/.432, 7 HR',
      bio: 'The lineup\'s best hitter. Contact-first approach with developing power. Covers center field with range and instinct.',
    },
    {
      name: 'Luke Sinnard',
      position: 'RHP',
      year: 'Jr.',
      stats: '5-6, 3.52 ERA, 72 K',
      bio: 'Friday starter who broke out in SEC play. Commands a sinker-slider combination and competes in every start.',
    },
    {
      name: 'Trevor Austin',
      position: 'INF',
      year: 'So.',
      stats: '.262/.335/.378, 4 HR',
      bio: 'Young infielder with a bat that is still developing. Showed flashes of power and plate discipline.',
    },
    {
      name: 'Marcus Allen',
      position: 'RHP',
      year: 'So.',
      stats: '3.78 ERA, 48 K, 42 IP',
      bio: 'Sophomore arm with a live fastball. Pitched in high-leverage spots as a freshman and showed he belongs.',
    },
  ],

  transferAdditions: [
    {
      name: 'Hayden Thomas',
      position: '1B',
      year: 'R-Sr.',
      fromSchool: 'TCU',
      stats: '.295/.378/.482, 10 HR',
      bio: 'Big 12-tested first baseman with power. Adds the middle-of-the-order production Missouri has lacked.',
    },
    {
      name: 'Rece Hinds',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'LSU',
      stats: '.258/.342/.445, 8 HR',
      bio: 'Power-tooled infielder from the defending national champions. Raw talent looking for a consistent role.',
    },
    {
      name: 'Dawson Merryman',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Texas Tech',
      stats: '3.42 ERA, 62 K',
      bio: 'Left-handed starter with Big 12 experience. Fills a rotation hole with a quality arm.',
    },
    {
      name: 'Marco Castillo',
      position: 'C',
      year: 'R-Sr.',
      fromSchool: 'Florida State',
      stats: '.268/.352/.412, 6 HR',
      bio: 'Veteran catcher from an ACC program. Adds defensive stability and a veteran bat behind the plate.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Luke Sinnard (5-6, 3.52 ERA) is the Friday arm — and his development is the barometer for this program. He broke out in SEC play and showed he can compete against ranked lineups. If he takes another step, the pitching staff follows.',
    rotation:
      'Dawson Merryman (from Texas Tech, 3.42 ERA) adds a left-handed presence on Saturdays. Marcus Allen (3.78 ERA) has the live arm to pitch on Sundays or in high-leverage relief. The rotation is thin but has upside — and in a rebuilding year, upside is what matters.',
    depth:
      'The bullpen is the project. Missouri needs its young arms to develop through SEC competition. Jackson is building the kind of pitching culture that produces arms long-term — the results may not show in 2026, but the process is right.',
  },

  lineupAnalysis: {
    engine:
      'Ross Lovich (.289, 7 HR) is the one consistent bat. His contact-first approach and center field defense make him the player Missouri builds around. He needs help — and the portal provides it.',
    middle:
      'Hayden Thomas (from TCU, .295, 10 HR) is the biggest addition. He gives Missouri the first base power it has not had. Rece Hinds (from LSU, 8 HR) adds raw power from the infield. The middle of the order is better — whether it is good enough for the SEC remains to be seen.',
    supportingCast:
      'Trevor Austin (.262, 4 HR) needs a breakout season. Marco Castillo (from Florida State, .268, 6 HR) adds a veteran bat behind the plate. The lineup is a work in progress — Jackson knows it and is building for a breakthrough that may come in 2027.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'SIU Edwardsville', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Kansas', location: 'Away', notes: '' },
    { dates: 'Mar 7-9', opponent: 'Oral Roberts', location: 'Home', notes: '' },
    { dates: 'Mar 14-16', opponent: 'Mississippi State', location: 'Home', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Georgia', location: 'Away', notes: '' },
    { dates: 'Apr 4-6', opponent: 'Tennessee', location: 'Home', notes: '' },
    { dates: 'Apr 18-20', opponent: 'Kentucky', location: 'Away', notes: '' },
    { dates: 'Apr 25-27', opponent: 'Florida', location: 'Home', notes: '' },
    { dates: 'May 2-4', opponent: 'Oklahoma', location: 'Home', notes: '' },
    { dates: 'May 9-11', opponent: 'Auburn', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 45 },
    { category: 'Rotation', grade: 45 },
    { category: 'Bullpen', grade: 40 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'Missouri is a building program in the toughest conference in the country. Jackson is doing the work — portal additions with SEC and Power Five pedigree, player development in the pitching lab, and a culture that demands competitiveness even in losing seasons. The 2026 Mizzou team will not make the postseason, but it will be more competitive than the record suggests. The portal additions raise the floor. Sinnard anchors the staff. Lovich anchors the lineup. The program is headed somewhere — it just is not there yet.',

  relatedLinks: [
    { label: 'Missouri Team Page', href: '/college-baseball/teams/missouri' },
  ],
};

export default function Missouri2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
