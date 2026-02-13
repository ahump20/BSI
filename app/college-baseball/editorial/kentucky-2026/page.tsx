import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';

const data: TeamPreviewData = {
  teamName: 'Kentucky',
  teamSlug: 'kentucky',
  mascot: 'Wildcats',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '11 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Nick Mingione has built something real in Lexington. Consistent depth, sound fundamental baseball, and a pitching staff that competes every weekend. Don\'t sleep on the Cats.',

  programStats: {
    allTimeWins: '2,145',
    winPct: '.532',
    cwsAppearances: 4,
    nationalTitles: 0,
    confTitles: 3,
    cwsWins: 5,
  },

  record2025: '40-22',
  record2025Context: 'Regional — built on pitching and defense',
  seasonStats2025: {
    teamBA: '.268',
    teamERA: '3.58',
    homeRuns: 65,
    stolenBases: 72,
    strikeouts: 518,
    opponentBA: '.233',
  },
  seasonHighlights: [
    'Fourth Regional appearance in five years under Mingione',
    'Travis Smith: 10-3, 2.42 ERA — the SEC\'s most overlooked ace',
    'Ryan Waldschmidt hit .305 with 12 HR and played Gold Glove defense at first',
    'Team ERA of 3.58 ranked fourth in the conference',
    'Devin Burkes emerged as one of the best defensive shortstops in the SEC',
  ],

  keyReturnees: [
    {
      name: 'Ryan Waldschmidt',
      position: '1B',
      year: 'Sr.',
      stats: '.305/.392/.498, 12 HR',
      bio: 'The anchor. Consistent offensive production paired with Gold Glove-caliber defense. One of the most complete first basemen in the conference.',
    },
    {
      name: 'Travis Smith',
      position: 'RHP',
      year: 'Jr.',
      stats: '10-3, 2.42 ERA, 112 K',
      bio: 'The most underrated pitcher in the SEC. Pounds the zone with a sinker-slider combination that generates swings-and-misses and groundballs. Friday night weapon.',
    },
    {
      name: 'Devin Burkes',
      position: 'SS',
      year: 'Jr.',
      stats: '.272/.358/.389, 5 HR',
      bio: 'Elite defensive shortstop. His range and arm make the infield work. The bat continues to improve — he hit .300 in SEC play.',
    },
    {
      name: 'Nolan McCarthy',
      position: 'OF',
      year: 'Jr.',
      stats: '.281/.365/.425, 7 HR, 16 SB',
      bio: 'Speed-and-contact outfielder who sets the table from the leadoff spot. Plus center field defender with improving power.',
    },
    {
      name: 'Mason Moore',
      position: 'RHP',
      year: 'So.',
      stats: '3.52 ERA, 76 K, 59 IP',
      bio: 'Emerged as a reliable Saturday starter. Power arm with a heavy fastball. Projects to be a first-round talent by 2027.',
    },
  ],

  transferAdditions: [
    {
      name: 'Drew Swift',
      position: '2B',
      year: 'R-Sr.',
      fromSchool: 'Arizona State',
      stats: '.294/.378/.418, 6 HR',
      bio: 'Veteran infielder with Pac-12 experience. Contact-oriented approach and solid defense.',
    },
    {
      name: 'Tanner Witt',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Texas',
      stats: '3.68 ERA, 54 K',
      bio: 'Former five-star recruit with elite stuff. Adds SEC-proven depth behind Smith and Moore.',
    },
    {
      name: 'James Hicks',
      position: 'OF',
      year: 'Jr.',
      fromSchool: 'Ole Miss',
      stats: '.278/.358/.445, 8 HR',
      bio: 'Power outfielder from Oxford. Adds middle-of-the-order production to a lineup that needs it.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Travis Smith (10-3, 2.42 ERA) is the most underrated pitcher in the SEC. His sinker-slider combination gets swings-and-misses and generates groundballs at an elite rate. He pounds the zone and never gives in. Friday nights in Lexington belong to him.',
    rotation:
      'Mason Moore (3.52 ERA, 76 K) takes the Saturday ball with a heavy fastball that projects as first-round stuff by 2027. Tanner Witt (from Texas, 3.68 ERA) adds a third arm with elite ceiling. Three quality weekend starters is the foundation of a postseason team.',
    depth:
      'Mingione builds his bullpen through development. The relievers are not household names, but they fill innings and throw strikes. The staff collectively walks fewer hitters than almost anyone in the SEC. Control baseball — that is the Kentucky identity.',
  },

  lineupAnalysis: {
    engine:
      'Ryan Waldschmidt (.305, 12 HR) is the anchor of the lineup. Consistent, professional, and rarely beats himself. He does not chase, drives the ball to all fields, and plays Gold Glove defense. He is the kind of player college coaches dream about building a lineup around.',
    middle:
      'James Hicks (from Ole Miss, 8 HR) adds the power Kentucky lacked in the middle of the order. Devin Burkes (.272) continues to improve and provides lineup depth with defensive upside. The order is not explosive, but it is disciplined.',
    supportingCast:
      'Nolan McCarthy (.281, 16 SB) gives Kentucky speed at the top of the order. Drew Swift (from Arizona State) adds a veteran bat at second base. The lineup manufactures runs through contact and baserunning — not power. That plays in the SEC when the pitching holds.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'Ball State', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 21-23', opponent: 'Cincinnati', location: 'Neutral', notes: '' },
    { dates: 'Mar 7-9', opponent: 'Louisville', location: 'Away', notes: 'Rivalry' },
    { dates: 'Mar 14-16', opponent: 'Georgia', location: 'Home', notes: 'SEC Opener' },
    { dates: 'Mar 28-30', opponent: 'Alabama', location: 'Away', notes: '' },
    { dates: 'Apr 4-6', opponent: 'Vanderbilt', location: 'Away', notes: '' },
    { dates: 'Apr 18-20', opponent: 'Missouri', location: 'Home', notes: '' },
    { dates: 'Apr 25-27', opponent: 'Tennessee', location: 'Away', notes: '' },
    { dates: 'May 2-4', opponent: 'Mississippi State', location: 'Home', notes: '' },
    { dates: 'May 9-11', opponent: 'South Carolina', location: 'Away', notes: '' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 65 },
    { category: 'Bullpen', grade: 55 },
    { category: 'Defense', grade: 65 },
    { category: 'Speed/Baserunning', grade: 60 },
    { category: 'Coaching', grade: 65 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Dark Horse',
  projectionText:
    'Kentucky is the team nobody wants to see in a Regional. Mingione has built a program that competes every year through pitching, defense, and disciplined at-bats. Smith is an ace who can carry a series. Waldschmidt is a rock in the lineup. The portal additions address the power gap. The Cats will not win the SEC — but they will make the Tournament, and once you are in, anything can happen.',

  relatedLinks: [
    { label: 'Kentucky Team Page', href: '/college-baseball/teams/kentucky' },
  ],
};

export default function Kentucky2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
