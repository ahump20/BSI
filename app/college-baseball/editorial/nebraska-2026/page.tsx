import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nebraska Cornhuskers: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Will Bolt came home to rebuild Nebraska baseball, and after six years the foundation is visible — if not yet the finished product. The Huskers went .500 in Big Ten play in 2025.',
  openGraph: {
    title: 'Nebraska Cornhuskers: 2026 Season Preview',
    description:
      'Will Bolt came home to rebuild Nebraska baseball, and after six years the foundation is visible — if not yet the finished product. The Huskers went .500 in Big Ten play in 2025.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Nebraska',
  teamSlug: 'nebraska',
  mascot: 'Cornhuskers',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Will Bolt came home to rebuild Nebraska baseball, and after six years the foundation is visible — if not yet the finished product. The Huskers went .500 in Big Ten play in 2025, a mark that felt like both progress and a ceiling. Haymarket Park fills, the fan base believes, and the program that made three straight CWS trips from 2001 to 2005 is searching for the next gear. Bolt needs 2026 to be the year the needle moves.',

  programStats: {
    allTimeWins: '2,118',
    winPct: '.528',
    cwsAppearances: 3,
    nationalTitles: 0,
    confTitles: 10,
    cwsWins: 3,
  },

  record2025: '33-29 (15-15 Big Ten)',
  record2025Context: 'Exactly .500 in conference — competitive but unable to separate from the pack',
  seasonStats2025: {
    teamBA: '.268',
    teamERA: '4.42',
    homeRuns: 52,
    stolenBases: 58,
    strikeouts: 425,
    opponentBA: '.262',
  },
  seasonHighlights: [
    'Won 33 games and stayed in the NCAA Tournament conversation until the final weekend',
    'Case Sanderson hit .305 with 11 HR — a legitimate middle-of-the-order bat',
    'Kyle Kasowski led the staff with a 3.22 ERA and 82 strikeouts as the Friday starter',
    'Hit 52 home runs as a team — the most in a Nebraska season since 2019',
    'Haymarket Park averaged over 5,000 fans per game — one of the best atmospheres in the Big Ten',
  ],

  keyReturnees: [
    {
      name: 'Case Sanderson',
      position: '3B',
      year: 'Sr.',
      stats: '.305/.392/.515, 11 HR, 52 RBI',
      bio: 'The lineup\'s best hitter and a run producer who thrives with runners in scoring position. Plus arm at third base. A .305 average with power makes him one of the Big Ten\'s best returning bats.',
    },
    {
      name: 'Kyle Kasowski',
      position: 'RHP',
      year: 'Jr.',
      stats: '7-5, 3.22 ERA, 82 K',
      bio: 'Frontline Friday starter with a fastball that sits 92-94 and a plus slider. Pitched deep into games consistently and showed the competitiveness Bolt demands from his ace.',
    },
    {
      name: 'Rhett Stokes',
      position: 'OF',
      year: 'Jr.',
      stats: '.278/.358/.445, 8 HR, 22 SB',
      bio: 'Five-tool center fielder with speed and emerging power. His combination of stolen bases and home runs makes him one of the most dynamic players in the conference.',
    },
    {
      name: 'Garrett Anglim',
      position: 'C',
      year: 'Jr.',
      stats: '.262/.345/.402, 5 HR',
      bio: 'Strong defensive catcher who controls the running game and handles the pitching staff well. The bat is steady — not spectacular — but the defense makes him everyday.',
    },
    {
      name: 'Tyler Stone',
      position: 'RHP',
      year: 'So.',
      stats: '4.15 ERA, 55 K, 61 IP',
      bio: 'Hard-throwing sophomore who pitched in big spots as a freshman. The fastball touches 95 and the slider is developing. If the command sharpens, he is a weekend starter.',
    },
  ],

  transferAdditions: [
    {
      name: 'Kade McIntyre',
      position: 'SS',
      year: 'Jr.',
      fromSchool: 'Wichita State',
      stats: '.288/.368/.432, 6 HR, 20 SB',
      bio: 'Athletic shortstop who does everything well. AAC-tested with range, arm strength, and a contact-oriented approach at the plate. Fills the biggest hole in the lineup.',
    },
    {
      name: 'Davis Martin',
      position: 'LHP',
      year: 'R-Sr.',
      fromSchool: 'Oklahoma State',
      stats: '5-4, 3.55 ERA, 72 K',
      bio: 'Veteran left-hander with Big 12 experience. Commands a four-pitch mix and knows how to navigate a lineup twice. The Saturday starter Nebraska has been searching for.',
    },
    {
      name: 'Trey Goodrich',
      position: 'OF/DH',
      year: 'Jr.',
      fromSchool: 'Missouri',
      stats: '.275/.352/.468, 9 HR',
      bio: 'Power bat from the SEC who adds lineup depth. Physical hitter with raw power to all fields. Can play a corner outfield spot or DH.',
    },
    {
      name: 'Brock Wills',
      position: 'RHP',
      year: 'So.',
      fromSchool: 'Arkansas',
      stats: '3.72 ERA, 38 K, 29 IP',
      bio: 'Hard-throwing reliever from an elite program who wants more innings. Fastball sits 94-96 with a power slider. Immediate bullpen upgrade.',
    },
    {
      name: 'Cam Erickson',
      position: '2B',
      year: 'Jr.',
      fromSchool: 'Oregon State',
      stats: '.265/.355/.385, 4 HR',
      bio: 'Pac-12 veteran with defensive versatility and a professional approach at the plate. Can play second or short and makes every routine play.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Kyle Kasowski (7-5, 3.22 ERA) is the ace, and he pitches like it — deep into games, big strikeout numbers, and a willingness to attack hitters when the game is on the line. He is the best returning Friday starter in the Big Ten and the arm the entire staff follows.',
    rotation:
      'Davis Martin (from Oklahoma State, 3.55 ERA) adds the left-handed Saturday presence Bolt has needed. Tyler Stone (4.15 ERA) has the stuff to pitch on Sundays — the 95-mph fastball and developing slider make him a high-upside arm. If Stone takes the leap, Nebraska has a complete weekend rotation for the first time under Bolt.',
    depth:
      'Brock Wills (from Arkansas, 3.72 ERA, 94-96 mph) transforms the bullpen. He gives Bolt a late-inning weapon who has pitched in the SEC. The rest of the pen needs to develop around him, but one elite reliever changes the calculus of close games — and Nebraska played a lot of close games in 2025.',
  },

  lineupAnalysis: {
    engine:
      'Case Sanderson (.305, 11 HR) is the best returning bat in the Big Ten. He is a run producer who elevates with runners in scoring position and a defender who makes the plays at third. Every lineup card starts with Sanderson in the three-hole.',
    middle:
      'Rhett Stokes (.278, 8 HR, 22 SB) adds the five-tool dynamic that makes lineups hard to pitch to. Trey Goodrich (from Missouri, .275, 9 HR) gives the four or five spot legitimate power. The middle of the order has depth and variety — power, speed, and contact.',
    supportingCast:
      'Kade McIntyre (from Wichita State, .288, 20 SB) is the table-setter at the top. Cam Erickson (from Oregon State, .265) adds a professional bat. Garrett Anglim (.262) provides stability behind the plate. The lineup has eight contributors — a luxury Nebraska has not had in several years.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Sam Houston', location: 'Neutral', notes: 'Season Opener at Round Rock Classic' },
    { dates: 'Feb 21-23', opponent: 'Arkansas', location: 'Away', notes: 'Early-season test at Baum-Walker Stadium' },
    { dates: 'Mar 6-8', opponent: 'UC Irvine', location: 'Home', notes: 'Non-conference at Haymarket Park' },
    { dates: 'Mar 20-22', opponent: 'Iowa', location: 'Home', notes: 'Big Ten Opener — rivalry series' },
    { dates: 'Apr 3-5', opponent: 'Maryland', location: 'Away', notes: 'Conference road test' },
    { dates: 'Apr 10-12', opponent: 'Indiana', location: 'Home', notes: 'Mid-April positioning series' },
    { dates: 'Apr 17-19', opponent: 'Minnesota', location: 'Home', notes: 'Border rivalry under the lights' },
    { dates: 'May 1-3', opponent: 'Michigan', location: 'Away', notes: 'Road series at Ray Fisher Stadium' },
    { dates: 'May 8-10', opponent: 'Purdue', location: 'Home', notes: 'Late-season bubble weekend' },
    { dates: 'May 15-17', opponent: 'Illinois', location: 'Away', notes: 'Season finale with potential postseason implications' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 50 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Nebraska has the pieces to get off the .500 line in 2026. Kasowski is a frontline Friday starter. Sanderson is a lineup anchor. The portal brought in the kind of experienced, position-specific help — a shortstop, a Saturday starter, a power reliever — that addresses specific weaknesses rather than adding depth for depth\'s sake. Haymarket Park is one of the best home environments in the conference, and Bolt\'s teams play hard. The projection is 34-to-37 wins and a realistic shot at an NCAA Regional — but only if Stone develops into a Sunday starter and Wills gives the bullpen a legitimate late-inning presence. The margin between bubble and in is two or three games, and Nebraska has been on the wrong side of that margin for too long.',

  relatedLinks: [
    { label: 'Nebraska Team Page', href: '/college-baseball/teams/nebraska' },
  ],
};

export default function Nebraska2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
