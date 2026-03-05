import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UCLA Bruins: 2026 Season Preview | Blaze Sports Intel',
  description:
    "The Bruins finished 2025 ranked No. 1 nationally and shared the Big Ten crown in the conference's first year of coast-to-coast baseball. John Savage's 18th season in Westwood begins.",
  openGraph: {
    title: 'UCLA Bruins: 2026 Season Preview',
    description:
      "The Bruins finished 2025 ranked No. 1 nationally and shared the Big Ten crown in the conference's first year of coast-to-coast baseball. John Savage's 18th season in Westwood begins.",
  },
};

const data: TeamPreviewData = {
  teamName: 'UCLA',
  teamSlug: 'ucla',
  mascot: 'Bruins',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'The Bruins finished 2025 ranked No. 1 nationally and shared the Big Ten crown in the conference\'s first year of coast-to-coast baseball. John Savage\'s 18th season in Westwood begins with a roster built to end UCLA\'s 13-year national title drought.',

  programStats: {
    allTimeWins: '2,547',
    winPct: '.604',
    cwsAppearances: 13,
    nationalTitles: 1,
    confTitles: 27,
    cwsWins: 35,
  },

  record2025: '48-18 (22-8 Big Ten)',
  record2025Context: 'No. 1 national ranking, Big Ten co-champions',
  seasonStats2025: {
    teamBA: '.291',
    teamERA: '3.28',
    homeRuns: 92,
    stolenBases: 85,
    strikeouts: 558,
    opponentBA: '.215',
  },
  seasonHighlights: [
    'Finished No. 1 in the final regular-season poll — first time since 2013 title year',
    'Won Big Ten co-championship (shared with Oregon) in the conference\'s inaugural coast-to-coast season',
    '48 wins tied the second-highest total in program history',
    'Led the Big Ten in team ERA (3.28) and opponent batting average (.215)',
    'Six players earned All-Big Ten honors, most in the conference',
  ],

  keyReturnees: [
    {
      name: 'Jake Palmer',
      position: 'OF',
      year: 'Jr.',
      stats: '.341/.432/.561, 14 HR, 58 RBI',
      bio: 'La Mirada product. Led UCLA in every triple-slash category. Pure hitter with emerging power who profiles as a top-two-rounds draft pick if he stays healthy.',
    },
    {
      name: 'Noah Jackson',
      position: 'SS',
      year: 'Jr.',
      stats: '.306/.398/.478, 9 HR, 42 RBI',
      bio: 'San Clemente native. Plus defender at shortstop with an advanced offensive approach. Hit .370 in Big Ten play.',
    },
    {
      name: 'Marcus Reyes',
      position: 'C',
      year: 'Sr.',
      stats: '.287/.381/.445, 8 HR',
      bio: 'El Paso product. Controls the running game and frames pitches at an elite level. Veteran presence behind the plate.',
    },
    {
      name: 'Thatcher Hurd',
      position: 'RHP',
      year: 'Sr.',
      stats: '9-2, 2.61 ERA, 118 K in 96.1 IP',
      bio: 'Manhattan Beach native. Friday night starter with four pitches and the ability to navigate a lineup three times. Potential first-round pick.',
    },
    {
      name: 'Jared Karros',
      position: 'LHP',
      year: 'Jr.',
      stats: '8-3, 3.14 ERA, 97 K in 86 IP',
      bio: 'Son of former Dodgers first baseman Eric Karros. Polished lefty with pinpoint command of his changeup. Saturday anchor.',
    },
    {
      name: 'Tyler Ohashi',
      position: 'RHP',
      year: 'So.',
      stats: '1.87 ERA, 14 SV, 67 K in 53 IP',
      bio: 'Torrance product. Electric closer with a mid-90s fastball and wipeout slider. Saved 14 games as a freshman — the ninth inning belongs to him.',
    },
    {
      name: 'Ryan Chen',
      position: 'INF',
      year: 'So.',
      stats: '.278/.365/.401, 5 HR',
      bio: 'Arcadia product. Switch-hitter who can play second or third. On-base machine in the bottom third of the order.',
    },
  ],

  transferAdditions: [
    {
      name: 'Austin Wells Jr.',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Vanderbilt',
      stats: '.298/.402/.501, 11 HR',
      bio: 'SEC-tested outfielder with power and on-base ability. Immediately slots into the middle of the order.',
    },
    {
      name: 'Diego Hernandez',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Arizona',
      stats: '4-1, 3.22 ERA, 78 K in 64 IP',
      bio: 'Pac-12 legacy arm who reunites with Savage\'s staff. Sunday starter or high-leverage bullpen piece.',
    },
    {
      name: 'Cole Messina',
      position: '1B',
      year: 'Jr.',
      fromSchool: 'South Carolina',
      stats: '.284/.371/.489, 13 HR',
      bio: 'Son of former USC quarterback Mark Messina. Left-handed power bat who fills the first base hole cleanly.',
    },
    {
      name: 'Brandon Liu',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Cal',
      stats: '3.58 ERA, 52 K in 47.2 IP',
      bio: 'Bay Area lefty adds depth to an already loaded bullpen. Groundball specialist who can work multiple innings.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'UCLA\'s pitching staff was the best in the Big Ten in 2025 and returns its three best arms. Thatcher Hurd (2.61 ERA, 118 K) is a legitimate Friday night ace — a four-pitch mix with the command to go deep into games. Tyler Ohashi (1.87 ERA, 14 saves) slams the door. The 1-2 punch of ace and closer gives Savage a framework that wins postseason series.',
    rotation:
      'Hurd on Fridays, Jared Karros (3.14 ERA, 97 K) on Saturdays, and either Diego Hernandez (from Arizona) or a homegrown arm on Sundays. Karros is the son of a big-leaguer and pitches like it — composed, efficient, and relentless with the changeup. Hernandez gives UCLA something it lacked in 2025: a proven arm for Sunday who has been through Pac-12 wars.',
    depth:
      'Ohashi in the ninth. Brandon Liu (from Cal) for multi-inning relief. The returning middle relievers posted a collective 3.05 ERA in 2025. This is a staff where the seventh and eighth innings are covered before you even get to the closer. Savage can shorten games to six innings and feel good about his chances.',
  },

  lineupAnalysis: {
    engine:
      'Jake Palmer (.341/.432/.561) is the best all-around hitter on the West Coast. He does not chase. He drives the ball gap-to-gap and has developed home run power without sacrificing contact. Palmer batting third gives UCLA an anchor that forces pitchers to navigate the top of the order honestly.',
    middle:
      'Noah Jackson (.306/.398/.478) and Austin Wells Jr. (from Vanderbilt, .298/.402/.501) provide the complementary production. Jackson is a premium defender who can hurt you at the plate. Wells adds SEC-caliber power to a lineup that already had plenty of on-base ability. Cole Messina (from South Carolina, .284/.371/.489, 13 HR) fills first base with a left-handed bat that can clear the fence at Jackie Robinson Stadium.',
    supportingCast:
      'Marcus Reyes (.287/.381/.445) is one of the best defensive catchers in the country who can also hit. Ryan Chen brings a switch-hitting approach and positional versatility. This lineup goes eight or nine deep with legitimate hitters — there is no easy out.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Cal State Fullerton', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'TCU', location: 'Neutral', notes: 'Round Rock Classic' },
    { dates: 'Feb 27-Mar 1', opponent: 'Stanford', location: 'Home', notes: 'Pac-12 rivalry' },
    { dates: 'Mar 13-15', opponent: 'Oregon', location: 'Home', notes: 'Big Ten Opener — title rematch' },
    { dates: 'Mar 20-22', opponent: 'USC', location: 'Away', notes: 'Crosstown rivalry' },
    { dates: 'Apr 3-5', opponent: 'Michigan', location: 'Home', notes: 'Big Ten marquee' },
    { dates: 'Apr 10-12', opponent: 'Iowa', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Maryland', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Indiana', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Oregon', location: 'Away', notes: 'Regular season finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 70 },
    { category: 'Rotation', grade: 75 },
    { category: 'Bullpen', grade: 75 },
    { category: 'Defense', grade: 65 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 70 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Omaha Favorite',
  projectionText:
    'UCLA has the pitching to beat anyone in a three-game series and the lineup depth to survive the Big Ten gauntlet. Hurd and Ohashi are the kind of 1-9 combination that wins regionals. Palmer is a legitimate Player of the Year candidate. The portal additions — Wells, Messina, Hernandez — filled specific holes rather than adding bodies for the sake of adding bodies. Savage has been building toward this for 18 years in Westwood. The 2013 title feels like a long time ago. This roster is designed to shorten the wait.',

  relatedLinks: [
    { label: 'UCLA Team Page', href: '/college-baseball/teams/ucla' },
  ],
};

export default function UCLA2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
