import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Indiana Hoosiers: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Jeff Mercer has turned Indiana into a program that expects to compete for NCAA Tournament bids, not hope for them. The Hoosiers went 32-24 in 2025 with a 16-14 Big Ten mark.',
  openGraph: {
    title: 'Indiana Hoosiers: 2026 Season Preview',
    description:
      'Jeff Mercer has turned Indiana into a program that expects to compete for NCAA Tournament bids, not hope for them. The Hoosiers went 32-24 in 2025 with a 16-14 Big Ten mark.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Indiana',
  teamSlug: 'indiana',
  mascot: 'Hoosiers',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Jeff Mercer has turned Indiana into a program that expects to compete for NCAA Tournament bids, not hope for them. The Hoosiers went 32-24 in 2025 with a 16-14 Big Ten mark, and Year 8 of the Mercer era begins with enough returning talent to push for a top-four conference finish.',

  programStats: {
    allTimeWins: '1,518',
    winPct: '.498',
    cwsAppearances: 5,
    nationalTitles: 0,
    confTitles: 5,
    cwsWins: 4,
  },

  record2025: '32-24 (16-14 Big Ten)',
  record2025Context: 'NCAA Tournament bid, competitive in Big Ten play',
  seasonStats2025: {
    teamBA: '.268',
    teamERA: '4.21',
    homeRuns: 61,
    stolenBases: 78,
    strikeouts: 452,
    opponentBA: '.252',
  },
  seasonHighlights: [
    'Made the NCAA Tournament for the fourth time in six years under Mercer',
    'Won a road series at Michigan and took two of three at Maryland',
    'Led the Big Ten in stolen bases among traditional conference members (78)',
    'Brock Tibbitts earned Second Team All-Big Ten honors — .321 average with 12 home runs',
    'Pitching staff held opponents to a .252 batting average, fifth-best in the Big Ten',
  ],

  keyReturnees: [
    {
      name: 'Brock Tibbitts',
      position: 'INF',
      year: 'Sr.',
      stats: '.321/.412/.518, 12 HR, 51 RBI',
      bio: 'Crown Point native. Indiana\'s best hitter and the Big Ten\'s most underrated offensive player. Switch-hitter with power from both sides.',
    },
    {
      name: 'Devin Taylor',
      position: 'OF',
      year: 'Jr.',
      stats: '.295/.381/.446, 7 HR, 28 SB',
      bio: 'Indianapolis product. Dynamic outfielder who combines speed and contact. 28 stolen bases led the team in 2025.',
    },
    {
      name: 'Tyler Cerny',
      position: 'C',
      year: 'Sr.',
      stats: '.258/.342/.389, 5 HR',
      bio: 'Fort Wayne product. Veteran catcher with a strong arm and pitch-framing skills. Controls the running game at an above-average rate.',
    },
    {
      name: 'Brayden Risedorph',
      position: 'RHP',
      year: 'Jr.',
      stats: '7-4, 3.54 ERA, 89 K in 81.1 IP',
      bio: 'Fishers product. Friday night arm with a fastball that sits 92-94 and a sharp slider. Pitched 81 innings as a sophomore — staff workhorse.',
    },
    {
      name: 'Luke Sinnard',
      position: 'LHP',
      year: 'Jr.',
      stats: '5-3, 3.89 ERA, 72 K in 69.1 IP',
      bio: 'Columbus, IN product. Crafty left-hander who mixes four pitches and pitches backward. Smart pitcher who can navigate a lineup multiple times.',
    },
    {
      name: 'Reese Sharp',
      position: 'RHP',
      year: 'Sr.',
      stats: '2.67 ERA, 9 SV, 45 K in 37 IP',
      bio: 'Terre Haute native. Veteran closer who has saved games in three consecutive seasons. Fastball-slider combination that is at its best in the ninth.',
    },
  ],

  transferAdditions: [
    {
      name: 'Cam Cratic',
      position: 'INF',
      year: 'Jr.',
      fromSchool: 'Georgia Tech',
      stats: '.284/.374/.461, 9 HR',
      bio: 'ACC infielder with offensive versatility. Can play second base or shortstop. Adds middle-infield depth and a bat that can play in the top six.',
    },
    {
      name: 'Drew Bowser',
      position: 'OF',
      year: 'R-Sr.',
      fromSchool: 'Vanderbilt',
      stats: '.271/.358/.421, 6 HR',
      bio: 'SEC outfielder who adds experience and defensive reliability. Has played in high-pressure SEC environments. Veteran presence.',
    },
    {
      name: 'Jake Rucker',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Purdue',
      stats: '3.78 ERA, 58 K in 52.1 IP',
      bio: 'In-state transfer from the rival Boilermakers. Knows the Big Ten hitters. Sunday starter candidate or high-leverage reliever.',
    },
    {
      name: 'Noah Murdock',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'West Virginia',
      stats: '3.91 ERA, 47 K in 43.2 IP',
      bio: 'Left-handed reliever who adds depth to the bullpen. Can work multiple innings and neutralize left-handed hitters.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Brayden Risedorph (3.54 ERA, 89 K) and Reese Sharp (2.67 ERA, 9 saves) give Indiana a defined beginning and end to every game. Risedorph is a workhorse who can go seven innings, and Sharp is a proven closer who has saved games at every level of Big Ten play. That combination — starter who eats innings and closer who does not crack — is what wins conference series.',
    rotation:
      'Risedorph on Fridays, Luke Sinnard (3.89 ERA, 72 K) on Saturdays, and Jake Rucker (from Purdue) as the Sunday candidate. Sinnard is the kind of lefty who makes hitters uncomfortable — changes speeds, pitches backward, never gives in. Rucker adds in-state familiarity and a competitive arm for Sundays.',
    depth:
      'Sharp closes. Noah Murdock (from West Virginia) adds left-handed depth to a pen that was right-handed heavy in 2025. The returning middle-relief arms posted a collective 4.10 ERA — adequate but not dominant. Indiana needs one or two of the younger arms to take a step forward in the bridge innings for this to be a true postseason bullpen.',
  },

  lineupAnalysis: {
    engine:
      'Brock Tibbitts (.321/.412/.518, 12 HR) is the engine and the identity. He switch-hits with power from both sides of the plate, rarely gives away at-bats, and has improved every year at Indiana. Tibbitts is the kind of hitter who makes the entire lineup better because pitchers cannot pitch around him without consequences.',
    middle:
      'Devin Taylor (.295/.381/.446, 7 HR, 28 SB) and Cam Cratic (from Georgia Tech, .284/.374/.461, 9 HR) form the complementary core. Taylor is a speed-contact combination that puts constant pressure on the defense. Cratic adds the middle-infield bat Indiana needed — a player who can slot into the five or six hole and produce consistently.',
    supportingCast:
      'Drew Bowser (from Vanderbilt) adds SEC experience in the outfield. Tyler Cerny (.258/.342/.389) catches and leads the pitching staff. The bottom third is where Indiana needs development — if the young bats produce, the lineup goes seven deep. If not, Tibbitts and Taylor carry too much of the burden.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'East Tennessee State', location: 'Neutral', notes: 'Season Opener — Charlotte, NC' },
    { dates: 'Feb 20-22', opponent: 'VCU', location: 'Neutral', notes: 'Diamond 9 Tournament' },
    { dates: 'Mar 6-8', opponent: 'Purdue', location: 'Home', notes: 'In-state rivalry' },
    { dates: 'Mar 13-15', opponent: 'Washington', location: 'Away', notes: 'Big Ten Opener' },
    { dates: 'Mar 27-29', opponent: 'Iowa', location: 'Away', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Illinois', location: 'Home', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Michigan', location: 'Away', notes: 'Rivalry series' },
    { dates: 'Apr 24-26', opponent: 'Oregon', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'UCLA', location: 'Home', notes: 'Biggest home series of the year' },
    { dates: 'May 15-17', opponent: 'USC', location: 'Away', notes: 'Regular season finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 50 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 55 },
    { category: 'Defense', grade: 55 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 60 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Indiana under Mercer has become a program that consistently puts itself in position to make the NCAA Tournament. The Hoosiers are not going to overpower anyone, but they play clean baseball, run the bases well, and pitch competitively in every series. Tibbitts is a legitimate All-American candidate, and Risedorph gives them a starter who can go toe-to-toe with anyone on a Friday night. The question is depth — can the lineup produce beyond Tibbitts and Taylor, and can the middle relief hold? If both answers are yes, Indiana is a tournament team. If one breaks down, they are on the wrong side of the bubble. Mercer has earned the benefit of the doubt. His teams find a way to be in the conversation every May.',

  relatedLinks: [
    { label: 'Indiana Team Page', href: '/college-baseball/teams/indiana' },
  ],
};

export default function Indiana2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
