import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kansas State Wildcats: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Pete Hughes came to Manhattan to build something that has rarely existed here — a competitive Big 12 baseball program. Three years in, the foundation is visible.',
  openGraph: {
    title: 'Kansas State Wildcats: 2026 Season Preview',
    description:
      'Pete Hughes came to Manhattan to build something that has rarely existed here — a competitive Big 12 baseball program. Three years in, the foundation is visible.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Kansas State',
  teamSlug: 'kansas-state',
  mascot: 'Wildcats',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Pete Hughes came to Manhattan to build something that has rarely existed here — a competitive Big 12 baseball program. Three years in, the foundation is visible: better athletes, portal imports who can play, and a culture that competes harder than the record suggests. Year 4 is where the vision has to start producing wins.',

  programStats: {
    allTimeWins: '1,318',
    winPct: '.478',
    cwsAppearances: 1,
    nationalTitles: 0,
    confTitles: 2,
    cwsWins: 0,
  },

  record2025: '26-29 (11-19 Big 12)',
  record2025Context: 'Below .500 but showed flashes in conference play',
  seasonStats2025: {
    teamBA: '.258',
    teamERA: '4.89',
    homeRuns: 44,
    stolenBases: 62,
    strikeouts: 418,
    opponentBA: '.274',
  },
  seasonHighlights: [
    'Nick Goodwin hit .308 with 9 HR and 18 stolen bases — team MVP',
    'Took a series from West Virginia at home in late April',
    'Owen Dew posted a 3.42 ERA with 71 strikeouts as the Friday starter',
    'Team stole 62 bases — most in program history under Hughes',
    'Won 8 of final 12 non-conference games to finish the season strong',
  ],

  keyReturnees: [
    {
      name: 'Nick Goodwin',
      position: 'OF',
      year: 'Sr.',
      stats: '.308/.392/.478, 9 HR, 18 SB',
      bio: 'The complete player in the lineup. Hits for average, runs, hits for power, and plays a plus center field. If Kansas State has a draftable bat, it is Goodwin.',
    },
    {
      name: 'Owen Dew',
      position: 'RHP',
      year: 'Jr.',
      stats: '5-6, 3.42 ERA, 71 K',
      bio: 'Legitimate Friday starter with a plus changeup. Competes well against Big 12 lineups and goes deep into games. The staff anchor.',
    },
    {
      name: 'Roberto Perez',
      position: 'INF',
      year: 'Jr.',
      stats: '.275/.348/.398, 5 HR',
      bio: 'Versatile infielder who can play second or third. Good bat-to-ball skills and improving power. A steady presence in the middle of the order.',
    },
    {
      name: 'Cash Rugely',
      position: 'C',
      year: 'Sr.',
      stats: '.242/.328/.368, 4 HR',
      bio: 'Experienced catcher who controls the running game and manages the pitching staff. His leadership behind the plate is more valuable than his stat line.',
    },
    {
      name: 'Dylan Phillips',
      position: 'LHP',
      year: 'So.',
      stats: '3-4, 4.28 ERA, 48 K',
      bio: 'Young lefty with a live arm who showed flashes as a freshman. The upside is real — he just needs to sustain it over a full Big 12 weekend.',
    },
  ],

  transferAdditions: [
    {
      name: 'Cade McGee',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Wichita State',
      stats: '3.54 ERA, 72 K',
      bio: 'In-state arm who dominated the AAC. Power fastball with a sharp slider. Gives Hughes a proven starter or late-inning weapon immediately.',
    },
    {
      name: 'Garrett Guillemette',
      position: '1B/DH',
      year: 'Jr.',
      fromSchool: 'Oregon',
      stats: '.285/.372/.488, 10 HR',
      bio: 'Pac-12 power bat with plus raw power. Adds the middle-of-the-order thump Kansas State has lacked. Has to prove it against Big 12 arms.',
    },
    {
      name: 'Jake Hunnicutt',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Dallas Baptist',
      stats: '.268/.348/.412, 6 HR, 12 SB',
      bio: 'Athletic outfielder with a combination of speed and pop. Fills an outfield spot and adds depth to the lineup.',
    },
    {
      name: 'Marcus Olivarez',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Texas State',
      stats: '2.78 ERA, 58 K in 55 IP',
      bio: 'Bullpen arm with a heavy sinker and plus command. The kind of ground-ball pitcher who shortens games in the late innings.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Owen Dew (5-6, 3.42 ERA, 71 K) is the Friday anchor and the one pitcher in the rotation who consistently gives Kansas State a chance to win. His changeup is his best pitch — it keeps Big 12 hitters off balance and generates weak contact. The issue is not the ace. The issue is everything else.',
    rotation:
      'Dylan Phillips (4.28 ERA) showed flashes as a freshman lefty and has the arm for a Saturday start. Cade McGee (from Wichita State, 3.54 ERA) pushes for the Saturday or Sunday slot with a power arm that translated well in the AAC. Hughes needs two of three to be league-average or better behind Dew.',
    depth:
      'The bullpen was stretched thin in 2025 because starters could not consistently go deep. Marcus Olivarez (from Texas State, 2.78 ERA) is the key addition — a ground-ball pitcher who can shorten games. If the starters average six innings and Olivarez handles the seventh and eighth, the bullpen math works. That is a big if.',
  },

  lineupAnalysis: {
    engine:
      'Nick Goodwin (.308, 9 HR, 18 SB) is the heartbeat of the lineup. He does everything — hits for average, runs, drives the ball, and plays an elite center field. He is the one player on this roster who would start for any team in the Big 12, and the offense lives and dies with his production.',
    middle:
      'Garrett Guillemette (from Oregon, .285, 10 HR) is the biggest lineup addition. His power gives Goodwin lineup protection that did not exist in 2025. Roberto Perez (.275, 5 HR) adds steady production. The middle of the order has improved — it is no longer a one-man show.',
    supportingCast:
      'Cash Rugely (.242) is steady behind the plate but the bat is limited. Jake Hunnicutt (from Dallas Baptist, .268, 12 SB) adds speed and contact in the outfield. The bottom of the lineup needs to be more productive — too many easy innings for Big 12 pitchers in 2025.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Northern Illinois', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'New Mexico', location: 'Home', notes: '' },
    { dates: 'Mar 6-8', opponent: 'Wichita State', location: 'Away', notes: 'Sunflower Showdown' },
    { dates: 'Mar 13-15', opponent: 'West Virginia', location: 'Home', notes: 'Big 12 Opener' },
    { dates: 'Mar 27-29', opponent: 'Kansas', location: 'Away', notes: 'Dillons Sunflower Showdown' },
    { dates: 'Apr 3-5', opponent: 'Oklahoma State', location: 'Home', notes: '' },
    { dates: 'Apr 17-19', opponent: 'Arizona', location: 'Away', notes: '' },
    { dates: 'Apr 24-26', opponent: 'BYU', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'TCU', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Houston', location: 'Home', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 40 },
    { category: 'Rotation', grade: 45 },
    { category: 'Bullpen', grade: 40 },
    { category: 'Defense', grade: 45 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 50 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'Kansas State is in a better position than the record suggests. Pete Hughes has built a roster with a real Friday starter, a legitimate leadoff/center-field bat, and portal additions that address specific weaknesses. But the Big 12 is deep, and the margin between 11-19 and 15-15 in conference play requires pitching depth that is still developing. The Wildcats will compete harder than teams expect — Goodwin can carry games, Dew can win Fridays, and the portal class adds texture. A .500 conference record would be a breakthrough. Getting there requires the back of the rotation and the bottom of the lineup to produce.',

  relatedLinks: [
    { label: 'Kansas State Team Page', href: '/college-baseball/teams/kansas-state' },
  ],
};

export default function KansasState2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
