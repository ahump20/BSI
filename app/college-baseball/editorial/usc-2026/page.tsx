import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'USC Trojans: 2026 Season Preview | Blaze Sports Intel',
  description:
    "Twelve national titles. The most in college baseball history. USC's 2025 season — 37-23 in their first Big Ten campaign — showed that Andy Stankiewicz's rebuild has accelerated.",
  openGraph: {
    title: 'USC Trojans: 2026 Season Preview',
    description:
      "Twelve national titles. The most in college baseball history. USC's 2025 season — 37-23 in their first Big Ten campaign — showed that Andy Stankiewicz's rebuild has accelerated.",
  },
};

const data: TeamPreviewData = {
  teamName: 'USC',
  teamSlug: 'usc',
  mascot: 'Trojans',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Twelve national titles. The most in college baseball history. USC\'s 2025 season — 37-23 in their first Big Ten campaign — showed that Andy Stankiewicz\'s rebuild has accelerated faster than anyone projected. Now the Trojans chase the standard their history demands.',

  programStats: {
    allTimeWins: '3,041',
    winPct: '.614',
    cwsAppearances: 23,
    nationalTitles: 12,
    confTitles: 34,
    cwsWins: 93,
  },

  record2025: '37-23 (18-12 Big Ten)',
  record2025Context: 'Solid debut Big Ten campaign, returned to NCAA Tournament',
  seasonStats2025: {
    teamBA: '.276',
    teamERA: '4.02',
    homeRuns: 71,
    stolenBases: 63,
    strikeouts: 489,
    opponentBA: '.241',
  },
  seasonHighlights: [
    'Returned to the NCAA Tournament for the first time since 2022',
    '37 wins — highest total under Stankiewicz and a significant step forward for the program',
    'Went 18-12 in Big Ten play, finishing fourth in the conference standings',
    'Beat UCLA twice in the crosstown rivalry, including a walk-off in the regular season finale',
    'Three players drafted in the top 10 rounds of the 2025 MLB Draft',
  ],

  keyReturnees: [
    {
      name: 'Rhylan Thomas',
      position: 'OF',
      year: 'Jr.',
      stats: '.318/.412/.531, 14 HR, 55 RBI',
      bio: 'Long Beach product. USC\'s best hitter and the face of the program\'s resurgence. Plus defender in center with premium bat speed and growing power.',
    },
    {
      name: 'Blake Cyr',
      position: 'INF',
      year: 'Sr.',
      stats: '.295/.381/.458, 10 HR',
      bio: 'Santa Clarita native. Third baseman with a strong arm and consistent contact. Anchors the left side of the infield.',
    },
    {
      name: 'Jagger Haynes',
      position: 'LHP',
      year: 'Jr.',
      stats: '8-4, 3.34 ERA, 101 K in 89 IP',
      bio: 'Simi Valley product. Friday night starter with a plus changeup that neutralizes right-handed hitters. USC\'s most important returning arm.',
    },
    {
      name: 'Ben Thoits',
      position: 'RHP',
      year: 'Jr.',
      stats: '5-3, 3.78 ERA, 82 K in 71.1 IP',
      bio: 'Walnut Creek product. Saturday arm with a four-pitch mix and the ability to pitch deep into games. Consistently keeps USC competitive.',
    },
    {
      name: 'Alonzo Tredwell',
      position: 'RHP',
      year: 'So.',
      stats: '2.41 ERA, 10 SV, 54 K in 41 IP',
      bio: 'Inglewood product. Electric closer with a high-90s fastball and a cutter that breaks bats. Freshman All-America candidate in 2025.',
    },
    {
      name: 'Colin Winn',
      position: 'C',
      year: 'Sr.',
      stats: '.261/.349/.394, 5 HR',
      bio: 'Pasadena product. Defensive catcher with a strong arm and game-calling intelligence. Veteran presence behind the plate.',
    },
  ],

  transferAdditions: [
    {
      name: 'Chase Davis',
      position: 'OF/1B',
      year: 'R-Sr.',
      fromSchool: 'Arizona',
      stats: '.301/.412/.548, 18 HR',
      bio: 'Two-time Pac-12 Player of the Year candidate who adds elite power to the middle of the order. The biggest portal addition in the Big Ten.',
    },
    {
      name: 'Tommy Troy',
      position: 'SS',
      year: 'R-Sr.',
      fromSchool: 'Stanford',
      stats: '.279/.371/.441, 9 HR',
      bio: 'Stanford captain who adds defensive excellence and leadership at shortstop. Pac-12 pedigree through and through.',
    },
    {
      name: 'Landon Marceaux',
      position: 'RHP',
      year: 'Gr.',
      fromSchool: 'LSU',
      stats: '3.91 ERA, 64 K in 55.1 IP',
      bio: 'Former LSU ace who spent time in the minors and returned to college. Adds SEC experience and veteran poise to the rotation.',
    },
    {
      name: 'Derek Curiel',
      position: 'LHP',
      year: 'Jr.',
      fromSchool: 'Cal State Fullerton',
      stats: '3.48 ERA, 71 K in 62 IP',
      bio: 'Lefty reliever with command and deception. Strengthens a bullpen that needed left-handed depth.',
    },
    {
      name: 'Kade Kern',
      position: 'OF',
      year: 'R-Sr.',
      fromSchool: 'Ohio State',
      stats: '.288/.362/.445, 11 HR',
      bio: 'Big Ten veteran who knows the league\'s pitching. Right-handed outfield bat who provides lineup balance and veteran presence.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Jagger Haynes (3.34 ERA, 101 K) is a legitimate Friday night ace with a changeup that is among the best in college baseball. Alonzo Tredwell (2.41 ERA, 10 saves) closes games with high-90s heat. The Haynes-to-Tredwell pipeline — ace to closer — gives USC a formula that can win postseason series.',
    rotation:
      'Haynes on Fridays, Ben Thoits (3.78 ERA, 82 K) on Saturdays, and Landon Marceaux (from LSU) as the Sunday starter. Marceaux is the addition that transforms this rotation — a former SEC ace who has been to Omaha and pitched in professional ball. His experience fills the gap that cost USC in 2025 when the back end of the rotation faltered in the regional.',
    depth:
      'Tredwell in the ninth. Derek Curiel (from Cal State Fullerton) adds left-handed depth that the 2025 bullpen badly needed. USC\'s middle-relief corps returns three arms who pitched well in Big Ten play. The pen is deeper and more balanced than 2025, and Stankiewicz can use it aggressively without burning starters.',
  },

  lineupAnalysis: {
    engine:
      'Rhylan Thomas (.318/.412/.531, 14 HR) is the catalyst. He is the best athlete on the field every time USC plays, and his combination of speed, contact, and growing power makes him a projected first-round pick. Thomas sets the tone from the leadoff or three-hole.',
    middle:
      'Chase Davis (from Arizona, .301/.412/.548, 18 HR) changes everything. He is the power bat USC has not had since the peak years. Davis and Thomas together give the Trojans a 1-2 offensive combination that can match anyone in the Big Ten. Blake Cyr (.295/.381/.458, 10 HR) rounds out the heart of the order with consistency.',
    supportingCast:
      'Tommy Troy (from Stanford) stabilizes shortstop and adds a professional-caliber glove. Kade Kern (from Ohio State, 11 HR) provides a right-handed outfield bat and Big Ten experience. Colin Winn (.261/.349/.394) catches and calls the game. This lineup has more depth than any Stankiewicz team to date.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Cal Poly', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'Texas', location: 'Neutral', notes: 'Karbach Round Rock Classic' },
    { dates: 'Mar 6-8', opponent: 'Pepperdine', location: 'Away', notes: '' },
    { dates: 'Mar 13-15', opponent: 'Michigan', location: 'Home', notes: 'Big Ten Opener' },
    { dates: 'Mar 20-22', opponent: 'UCLA', location: 'Home', notes: 'Crosstown rivalry' },
    { dates: 'Apr 3-5', opponent: 'Oregon', location: 'Home', notes: 'West Coast Big Ten showdown' },
    { dates: 'Apr 17-19', opponent: 'Washington', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Iowa', location: 'Away', notes: '' },
    { dates: 'May 1-3', opponent: 'Illinois', location: 'Home', notes: '' },
    { dates: 'May 15-17', opponent: 'UCLA', location: 'Away', notes: 'Crosstown finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 70 },
    { category: 'Rotation', grade: 65 },
    { category: 'Bullpen', grade: 60 },
    { category: 'Defense', grade: 65 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 60 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Contender',
  projectionText:
    'USC\'s portal class changed the math. Chase Davis, Tommy Troy, Landon Marceaux, and Kade Kern are not fringe additions — they are program-altering pieces who slot into the starting lineup and rotation immediately. The 12 national titles cast a long shadow, and Stankiewicz is closer to the standard than the record suggests. Haynes and Tredwell give USC an ace-closer combination that can win a regional. Davis and Thomas give them an offensive ceiling that can win a super regional. Whether the middle innings and the Sunday rotation hold up will determine if the Trojans make noise in June. The talent is there. The history is there. Year 3 is the year the results need to follow.',

  relatedLinks: [
    { label: 'USC Team Page', href: '/college-baseball/teams/usc' },
  ],
};

export default function USC2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
