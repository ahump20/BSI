import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rutgers Scarlet Knights: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Steve Owens has spent eight years building Rutgers baseball into something no one in the Big Ten saw coming — a Northeast program that recruits the Jersey Shore, Long Island, and New England pipeline.',
  openGraph: {
    title: 'Rutgers Scarlet Knights: 2026 Season Preview',
    description:
      'Steve Owens has spent eight years building Rutgers baseball into something no one in the Big Ten saw coming — a Northeast program that recruits the Jersey Shore, Long Island, and New England pipeline.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Rutgers',
  teamSlug: 'rutgers',
  mascot: 'Scarlet Knights',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Steve Owens has spent eight years building Rutgers baseball into something no one in the Big Ten saw coming — a Northeast program that recruits the Jersey Shore, Long Island, and New England pipeline and competes against programs with warm weather and bigger budgets. A 29-28 record in 2025 is not eye-catching until you consider where this program was when Owens arrived. The Scarlet Knights are stable, tough, and exactly what a mid-tier Big Ten team needs to be. The question for 2026 is whether stable becomes dangerous.',

  programStats: {
    allTimeWins: '1,218',
    winPct: '.455',
    cwsAppearances: 1,
    nationalTitles: 0,
    confTitles: 2,
    cwsWins: 0,
  },

  record2025: '29-28 (15-15 Big Ten)',
  record2025Context: 'Just above .500 with a .500 conference record — competitive and steady',
  seasonStats2025: {
    teamBA: '.265',
    teamERA: '4.38',
    homeRuns: 44,
    stolenBases: 58,
    strikeouts: 420,
    opponentBA: '.260',
  },
  seasonHighlights: [
    'Went 15-15 in Big Ten play — second consecutive .500-or-better conference record under Owens',
    'Nick Cimillo hit .305 with 9 HR as the most dangerous bat in the lineup',
    'Jared DeSantis posted a 3.28 ERA in 78 innings — a true Friday arm performance',
    'Stole 58 bases as a team, reflecting Owens\'s aggressive baserunning philosophy',
    'Won a road series at Penn State — a statement for a program that travels as well as any in the Big Ten',
  ],

  keyReturnees: [
    {
      name: 'Nick Cimillo',
      position: '1B',
      year: 'Sr.',
      stats: '.305/.392/.502, 9 HR, 48 RBI',
      bio: 'The best bat in the Rutgers lineup and a run producer who excels with runners in scoring position. Cimillo has refined his swing year over year — the contact rate improved every season while the power emerged. A potential all-conference selection.',
    },
    {
      name: 'Jared DeSantis',
      position: 'RHP',
      year: 'Jr.',
      stats: '6-5, 3.28 ERA, 72 K, 78 IP',
      bio: 'Friday ace who competes with a fastball-curveball combination and an attitude that sets the tone for the entire staff. DeSantis does not overpower hitters — he outwills them. His ability to pitch deep saves a bullpen that gets used heavily.',
    },
    {
      name: 'Ryan Lasko',
      position: 'OF',
      year: 'Sr.',
      stats: '.278/.362/.425, 6 HR, 22 SB',
      bio: 'Athletic outfielder with a combination of speed and gap power. Lasko is the prototypical Rutgers player under Owens — blue-collar, versatile, and productive without flash.',
    },
    {
      name: 'Chris Brito',
      position: 'SS',
      year: 'Jr.',
      stats: '.262/.338/.375, 3 HR, 18 SB',
      bio: 'Defensive anchor at shortstop with quick hands and range. His speed on the bases is a weapon, and the bat improved steadily through the second half of the season. A full offseason in the cage should yield offensive results.',
    },
    {
      name: 'Tony Santa Maria',
      position: 'RHP',
      year: 'So.',
      stats: '4.18 ERA, 48 K, 52 IP',
      bio: 'Young right-hander who was pressed into the weekend rotation as a freshman and competed. The fastball sits 90-93 with a slider that showed improvement as the season progressed. The development curve is pointed up.',
    },
  ],

  transferAdditions: [
    {
      name: 'Danny Frontera',
      position: 'C',
      year: 'R-Sr.',
      fromSchool: 'Connecticut',
      stats: '.272/.355/.432, 7 HR',
      bio: 'Big East catcher from the Northeast pipeline who brings experience and a bat that plays in the middle of the order. His ability to manage a pitching staff and throw out runners gives the defense a stabilizer.',
    },
    {
      name: 'Marco DiLeo',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'St. John\'s',
      stats: '4-4, 3.58 ERA, 65 K',
      bio: 'New York-area left-hander with a deceptive delivery and a changeup that neutralizes right-handed hitters. Big East experience translates directly. Slots into the Saturday rotation and gives Owens the left-handed starter he has wanted.',
    },
    {
      name: 'Anthony Volpe Jr.',
      position: '2B',
      year: 'Jr.',
      fromSchool: 'Fordham',
      stats: '.288/.368/.405, 4 HR, 16 SB',
      bio: 'New Jersey product returning to the state. Athletic middle infielder with quick hands and a contact-first approach. Adds another speed threat to an already aggressive lineup.',
    },
    {
      name: 'Brendan Casey',
      position: 'RHP',
      year: 'So.',
      fromSchool: 'Wake Forest',
      stats: '3.72 ERA, 40 K, 34 IP',
      bio: 'Hard-throwing ACC reliever who wants a defined role. Fastball sits 93-95 with a power slider. Gives the bullpen the high-leverage weapon it lacked in late innings.',
    },
    {
      name: 'Michael Schwartz',
      position: 'OF/DH',
      year: 'Jr.',
      fromSchool: 'Hofstra',
      stats: '.298/.385/.478, 8 HR',
      bio: 'Colonial Athletic Association run producer who brings a professional approach. Can play left field or DH. Adds lineup depth and a bat that drives the ball to all fields.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Jared DeSantis (6-5, 3.28 ERA) is the identity of this pitching staff — a competitor who grinds through lineups and keeps Rutgers in every game. He is not the most talented arm in the Big Ten, but he might be the toughest. Owens builds his teams around pitchers like DeSantis, and the staff follows his lead.',
    rotation:
      'Marco DiLeo (from St. John\'s, 3.58 ERA) fills the Saturday hole with a left-hander who knows Northeast baseball. Tony Santa Maria (4.18 ERA) showed enough as a freshman to earn the Sunday role. The rotation has three legitimate starters — a luxury Rutgers has not always had. The key is health and innings management through the cold early weeks.',
    depth:
      'Brendan Casey (from Wake Forest, 3.72 ERA, 93-95 mph) transforms the back end of the bullpen. He gives Owens a late-inning weapon who can lock down seventh-through-ninth-inning leads. The middle relief needs to develop from the young arms, but Casey changes the math on close games — and Rutgers plays a lot of close games.',
  },

  lineupAnalysis: {
    engine:
      'Nick Cimillo (.305, 9 HR) is the best hitter in the lineup and one of the most improved players in the Big Ten over the last three years. He drives the ball to all fields with power and takes professional at-bats. Everything starts with Cimillo in the three-hole.',
    middle:
      'Danny Frontera (from UConn, .272, 7 HR) adds a second power bat that allows Owens to build around the 3-4-5 instead of hoping Cimillo carries the load alone. Michael Schwartz (from Hofstra, .298, 8 HR) provides another run-producing bat. The middle of the order has more depth than any Owens lineup to date.',
    supportingCast:
      'Ryan Lasko (.278, 22 SB) and Chris Brito (.262, 18 SB) add speed and on-base ability. Anthony Volpe Jr. (from Fordham, .288, 16 SB) gives the top of the order another contact-speed weapon. The lineup\'s identity is clear: get on base, run, and let Cimillo drive you in. It is not sexy. It wins games.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Fairfield', location: 'Neutral', notes: 'Season Opener at Myrtle Beach invitational' },
    { dates: 'Feb 27-Mar 1', opponent: 'NC State', location: 'Away', notes: 'Non-conference ACC road test' },
    { dates: 'Mar 7-9', opponent: 'Seton Hall', location: 'Home', notes: 'New Jersey rivalry at Bainton Field' },
    { dates: 'Mar 20-22', opponent: 'Iowa', location: 'Home', notes: 'Big Ten Opener' },
    { dates: 'Apr 3-5', opponent: 'Ohio State', location: 'Away', notes: 'Road conference series' },
    { dates: 'Apr 10-12', opponent: 'Maryland', location: 'Home', notes: 'East Coast Big Ten rivalry' },
    { dates: 'Apr 24-26', opponent: 'Michigan State', location: 'Home', notes: 'Home conference series' },
    { dates: 'May 1-3', opponent: 'Penn State', location: 'Away', notes: 'Road trip to Medlar Field' },
    { dates: 'May 8-10', opponent: 'Northwestern', location: 'Home', notes: 'Late-season home series' },
    { dates: 'May 15-17', opponent: 'Indiana', location: 'Away', notes: 'Season finale in Bloomington' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 50 },
    { category: 'Rotation', grade: 50 },
    { category: 'Bullpen', grade: 50 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 50 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Rutgers is the Big Ten program nobody talks about and nobody wants to play. Owens has built a culture that maximizes every roster spot, recruits the Northeast pipeline that other Big Ten schools ignore, and plays a brand of baseball — aggressive, contact-heavy, relentless on the bases — that is difficult to prepare for in a three-game series. The 2026 roster is the deepest Owens has had. DeSantis anchors the rotation. Cimillo anchors the lineup. The portal additions are targeted and conference-ready. The projection is 31-to-34 wins with a legitimate shot at finishing above .500 in the Big Ten for the third consecutive year. An NCAA Regional bid would require everything to break right — a hot April, health in the rotation, and Cimillo playing at an all-conference level. It is not likely, but it is not impossible, and that is a sentence you could not write about Rutgers baseball eight years ago.',

  relatedLinks: [
    { label: 'Rutgers Team Page', href: '/college-baseball/teams/rutgers' },
  ],
};

export default function Rutgers2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
