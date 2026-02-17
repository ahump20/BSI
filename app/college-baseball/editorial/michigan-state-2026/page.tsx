import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Michigan State Spartans: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Jake Boss Jr. is in his fifteenth year in East Lansing, and the question is no longer whether he can keep Michigan State competitive — it is whether he can push the Spartans past the line.',
  openGraph: {
    title: 'Michigan State Spartans: 2026 Season Preview',
    description:
      'Jake Boss Jr. is in his fifteenth year in East Lansing, and the question is no longer whether he can keep Michigan State competitive — it is whether he can push the Spartans past the line.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Michigan State',
  teamSlug: 'michigan-state',
  mascot: 'Spartans',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Jake Boss Jr. is in his fifteenth year in East Lansing, and the question is no longer whether he can keep Michigan State competitive — it is whether he can push the Spartans past the line that separates respectable from relevant. A 28-27 season in 2025 was the program in miniature: tough, functional, never quite enough. The talent is there to break through. The margin is razor-thin.',

  programStats: {
    allTimeWins: '1,512',
    winPct: '.498',
    cwsAppearances: 3,
    nationalTitles: 0,
    confTitles: 3,
    cwsWins: 2,
  },

  record2025: '28-27 (13-17 Big Ten)',
  record2025Context: 'Below .500 in conference play despite a competitive overall record',
  seasonStats2025: {
    teamBA: '.261',
    teamERA: '4.68',
    homeRuns: 42,
    stolenBases: 55,
    strikeouts: 398,
    opponentBA: '.267',
  },
  seasonHighlights: [
    'Won 28 games despite a brutal Big Ten schedule — 13 conference wins showed fight',
    'Zach Iverson hit .312 with 8 HR as the lineup anchor',
    'Ryan Szczepaniak posted a 3.41 ERA as the Friday starter, the staff\'s most reliable arm',
    'Stole 55 bases — Boss\'s aggressive baserunning philosophy remains a program staple',
    'Swept Indiana in a midseason series that represented the season\'s high-water mark',
  ],

  keyReturnees: [
    {
      name: 'Zach Iverson',
      position: 'OF',
      year: 'Sr.',
      stats: '.312/.395/.478, 8 HR, 42 RBI',
      bio: 'The best bat in the Spartan lineup. A patient hitter with plus power who covers ground in center field. His ability to set the table and drive in runs makes him the offensive engine.',
    },
    {
      name: 'Ryan Szczepaniak',
      position: 'RHP',
      year: 'Jr.',
      stats: '6-5, 3.41 ERA, 78 K',
      bio: 'Friday starter who commands a four-pitch mix. Competed in every Big Ten start and showed he can handle the front of a rotation. A full offseason of strength work should add velocity.',
    },
    {
      name: 'Trent Farquhar',
      position: 'C',
      year: 'Jr.',
      stats: '.274/.355/.398, 5 HR',
      bio: 'Athletic catcher with a strong arm and developing bat. Controls the running game and handles a young pitching staff with maturity beyond his years.',
    },
    {
      name: 'Jack Frank',
      position: '3B',
      year: 'So.',
      stats: '.258/.332/.412, 6 HR',
      bio: 'Physical corner infielder who showed raw power as a freshman. The swing has length, but when he connects, the ball carries. A breakout candidate.',
    },
    {
      name: 'Derek Hahn',
      position: 'LHP',
      year: 'Jr.',
      stats: '3.88 ERA, 52 K, 58 IP',
      bio: 'Left-handed reliever with a devastating slider. Moved into high-leverage spots midseason and thrived. Could push into the rotation or serve as the closer.',
    },
  ],

  transferAdditions: [
    {
      name: 'Cole Harberts',
      position: 'SS',
      year: 'Jr.',
      fromSchool: 'Iowa',
      stats: '.278/.362/.425, 5 HR, 18 SB',
      bio: 'Athletic shortstop with Big Ten experience. Adds speed and defensive range to the middle infield. His stolen base numbers will fit Boss\'s aggressive style.',
    },
    {
      name: 'Brady Marcum',
      position: 'RHP',
      year: 'R-Sr.',
      fromSchool: 'Kent State',
      stats: '5-3, 3.28 ERA, 85 K',
      bio: 'Strike-throwing right-hander with MAC Pitcher of the Year buzz. Pitches to contact with a heavy sinker and sharp slider. Slots into the weekend rotation immediately.',
    },
    {
      name: 'Myles Austin',
      position: 'OF/DH',
      year: 'Jr.',
      fromSchool: 'Central Michigan',
      stats: '.295/.375/.505, 12 HR',
      bio: 'Power bat from the MAC who crushed in-state pitching. The jump to Big Ten arms is the question, but the bat speed and raw power translate.',
    },
    {
      name: 'Gavin Weiss',
      position: 'LHP',
      year: 'So.',
      fromSchool: 'Indiana',
      stats: '3.62 ERA, 38 K, 32 IP',
      bio: 'Young lefty looking for more innings after a limited role. Has a clean delivery and a changeup that neutralizes right-handed hitters.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Ryan Szczepaniak (6-5, 3.41 ERA) is the Friday anchor, and his ability to pitch deep into games saves a bullpen that cannot afford to be exposed early. He does not overpower hitters — he outcompetes them. Pitch-to-pitch, he is one of the most reliable arms in the Big Ten.',
    rotation:
      'Brady Marcum (from Iowa, 3.28 ERA) adds a veteran Saturday starter with Big Ten experience and a ground-ball approach. Derek Hahn (3.88 ERA) is the leading Sunday candidate, though Boss may keep him in a high-leverage relief role. Gavin Weiss (from Indiana) provides left-handed depth that the staff lacked in 2025.',
    depth:
      'The bullpen was the weak link in 2025 — a 5.12 ERA in relief appearances tells the story. If Hahn stays in the pen, he becomes the closer. The Spartans need two or three freshmen arms to develop quickly, because the margin for error in late innings is non-existent.',
  },

  lineupAnalysis: {
    engine:
      'Zach Iverson (.312, 8 HR) is the one hitter opposing pitchers game-plan for. He draws walks, drives the ball gap-to-gap, and plays premium defense. The lineup goes as Iverson goes — and that has been both the strength and the limitation.',
    middle:
      'Myles Austin (from CMU, .295, 12 HR) adds the power bat the middle of the order has lacked. Jack Frank (.258, 6 HR) showed enough as a freshman to suggest he can hit third or fourth. Trent Farquhar (.274, 5 HR) provides a steady bat behind them. The 3-4-5 has more thump than any Boss lineup in recent memory.',
    supportingCast:
      'Cole Harberts (from Iowa, .278, 18 SB) brings speed and on-base ability to the top of the order. The bottom third needs at least one more contributor to emerge from the freshmen class. Michigan State cannot afford dead spots in the lineup if it wants to compete for a .500 Big Ten record.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Eastern Michigan', location: 'Neutral', notes: 'Season Opener — played in mid-Michigan tournament' },
    { dates: 'Feb 27-Mar 1', opponent: 'Dallas Baptist', location: 'Away', notes: 'Early-season road test against quality pitching' },
    { dates: 'Mar 7-9', opponent: 'Gonzaga', location: 'Home', notes: 'Non-conference showcase at McLane Stadium' },
    { dates: 'Mar 20-22', opponent: 'Maryland', location: 'Home', notes: 'Big Ten Opener' },
    { dates: 'Apr 3-5', opponent: 'Indiana', location: 'Away', notes: 'Rival series — swept them in 2025' },
    { dates: 'Apr 10-12', opponent: 'Michigan', location: 'Home', notes: 'In-state rivalry, East Lansing atmosphere' },
    { dates: 'Apr 24-26', opponent: 'Rutgers', location: 'Away', notes: 'Road conference series' },
    { dates: 'May 1-3', opponent: 'Iowa', location: 'Home', notes: 'Late-season positioning series' },
    { dates: 'May 8-10', opponent: 'Minnesota', location: 'Away', notes: 'Road trip to Minneapolis' },
    { dates: 'May 15-17', opponent: 'Penn State', location: 'Home', notes: 'Senior weekend and potential bubble clincher' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 45 },
    { category: 'Rotation', grade: 50 },
    { category: 'Bullpen', grade: 40 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 55 },
    { category: 'Coaching', grade: 55 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Michigan State has been stuck in the space between 25 and 32 wins for the better part of Boss\'s tenure, and the 2026 roster has the pieces to push past that ceiling — if the bullpen holds. Szczepaniak and Marcum give the rotation two legitimate weekend arms. Iverson is a lineup anchor, and Austin adds the power bat the middle of the order has needed. The question is depth: can the Spartans survive the attrition of a 56-game schedule without the pitching falling apart in April? If Hahn develops into a shutdown closer and two freshmen arms emerge, this team can play its way onto the NCAA Tournament bubble. If not, it will be another season of moral victories and near-misses — the kind Boss has navigated for fourteen years.',

  relatedLinks: [
    { label: 'Michigan State Team Page', href: '/college-baseball/teams/michigan-state' },
  ],
};

export default function MichiganState2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
