import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Texas Tech Red Raiders: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Twenty wins and thirty-three losses is not Tim Tadlock baseball. The architect of Texas Tech\'s rise from regional afterthought to CWS Finals program had his worst season in 13 years.',
  openGraph: {
    title: 'Texas Tech Red Raiders: 2026 Season Preview',
    description:
      'Twenty wins and thirty-three losses is not Tim Tadlock baseball. The architect of Texas Tech\'s rise from regional afterthought to CWS Finals program had his worst season in 13 years.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Texas Tech',
  teamSlug: 'texas-tech',
  mascot: 'Red Raiders',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Twenty wins and thirty-three losses is not Tim Tadlock baseball. The architect of Texas Tech\'s rise from regional afterthought to CWS Finals program had his worst season in 13 years — and the rebuild starts now. Young arms, portal additions, and a program that refuses to accept mediocrity.',

  programStats: {
    allTimeWins: '1,821',
    winPct: '.539',
    cwsAppearances: 6,
    nationalTitles: 0,
    confTitles: 5,
    cwsWins: 10,
  },

  record2025: '20-33 (8-22 Big 12)',
  record2025Context: 'Worst season of the Tadlock era — heavy roster losses, young pitching staff, and a brutal Big 12 schedule exposed the depth issues',
  seasonStats2025: {
    teamBA: '.248',
    teamERA: '5.62',
    homeRuns: 48,
    stolenBases: 42,
    strikeouts: 389,
    opponentBA: '.287',
  },
  seasonHighlights: [
    'True freshman Zane Petty emerged as a future rotation anchor (3.78 ERA in limited starts)',
    'Won a late-season series against West Virginia to show signs of life',
    'Recruited the #18 incoming class nationally via high school and portal',
    'Program announced facility upgrades to Dan Law Field at Rip Griffin Park',
  ],

  keyReturnees: [
    {
      name: 'Zane Petty',
      position: 'RHP',
      year: 'So.',
      stats: '3-4, 3.78 ERA, 61 K in 57.1 IP',
      bio: 'The silver lining of a brutal season. True freshman who pitched with poise beyond his age. Fastball sits 92-94 with a developing slider. The foundation of the rebuild — if Petty takes the sophomore jump, the rotation has a legitimate ace.',
    },
    {
      name: 'Kevin Bazzell',
      position: '2B',
      year: 'Jr.',
      stats: '.271/.348/.389, 5 HR, 28 RBI',
      bio: 'Gritty infielder who played through the losing and never stopped competing. Contact-first approach with improving power. The kind of player who sets the tone in the dugout when things aren\'t going well.',
    },
    {
      name: 'Gavin Kash',
      position: 'C/1B',
      year: 'So.',
      stats: '.259/.332/.401, 6 HR, 31 RBI',
      bio: 'Physical freshman who showed flashes of the power that made him a top recruit. 6\'2" with raw strength. The swing has holes, but the bat speed is real. A full offseason in the weight room should produce a significant jump.',
    },
    {
      name: 'Owen Washburn',
      position: 'LHP',
      year: 'So.',
      stats: '2-5, 4.89 ERA, 52 K in 51.2 IP',
      bio: 'Left-handed starter who took his lumps as a freshman but showed a devastating changeup. The strikeout numbers suggest the stuff is there — the walks (28 in 51 innings) need to come down for the ERA to follow.',
    },
    {
      name: 'Trendan Paige',
      position: 'OF',
      year: 'Jr.',
      stats: '.256/.331/.378, 4 HR, 18 SB',
      bio: 'Speed-first outfielder who provides defensive range in center and stolen base ability. The bat is a work in progress, but the legs and the glove play at a high level.',
    },
  ],

  transferAdditions: [
    {
      name: 'Jett Williams',
      position: 'SS',
      year: 'Jr.',
      fromSchool: 'Mississippi State',
      stats: '.284/.371/.441, 8 HR, 38 RBI',
      bio: 'SEC shortstop with the bat and glove to immediately upgrade the lineup. Former top recruit who played in the SEC gauntlet for two years. Brings a winning pedigree to a program that needs it.',
    },
    {
      name: 'Logan Britt',
      position: 'OF/DH',
      year: 'R-Sr.',
      fromSchool: 'NC State',
      stats: '.302/.389/.498, 13 HR, 51 RBI',
      bio: 'ACC power bat who immediately becomes the middle-of-the-order threat Texas Tech lacked in 2025. Physical hitter who drives the ball with authority. Veteran presence in a young lineup.',
    },
    {
      name: 'Ty Southisene',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'UC Irvine',
      stats: '6-3, 3.54 ERA, 81 K in 71.1 IP',
      bio: 'West Coast arm who dominated the Big West. Mid-90s fastball with a plus curve. Slots into the weekend rotation immediately and gives Tadlock a reliable innings-eater.',
    },
    {
      name: 'Cam Cauley',
      position: '3B',
      year: 'Jr.',
      fromSchool: 'Florida State',
      stats: '.268/.348/.432, 9 HR, 37 RBI',
      bio: 'ACC infielder who brings power from the left side and defensive competency at third. Fills a lineup hole and provides corner infield depth.',
    },
    {
      name: 'Maddux Houghton',
      position: 'RHP',
      year: 'So.',
      fromSchool: 'Texas A&M',
      stats: '3.91 ERA, 48 K in 41.1 IP',
      bio: 'Young arm who pitched in the SEC but is looking for a larger role. Fastball-slider combination with projection. Could be a weekend starter or high-leverage reliever.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'The 5.62 ERA was the core problem in 2025. You cannot win in the Big 12 when you\'re getting outscored regularly. Tadlock\'s answer: a sophomore ace in Zane Petty, portal arms from the Big West and SEC, and a full year of development for Owen Washburn. The stuff was never the issue — the experience was.',
    rotation:
      'Petty (3.78 ERA as a freshman) leads the way. Ty Southisene (3.54 ERA at UC Irvine) slots in behind him with mid-90s velocity and strikeout ability. Washburn or Maddux Houghton (from Texas A&M) compete for the Sunday start. The rotation is younger than you\'d like, but the arms are better than anything Tech ran out in 2025.',
    depth:
      'The bullpen was the weakest unit last year, and Tadlock spent the portal cycle adding arms who can shorten games. Houghton can pitch in relief if he doesn\'t start. The closer role is open — which is both a concern and an opportunity for someone to claim it. Improvement from 5.62 is the floor, not the ceiling.',
  },

  lineupAnalysis: {
    engine:
      'Logan Britt (.302, 13 HR from NC State) is the offensive centerpiece Texas Tech didn\'t have in 2025. A veteran bat who can anchor the middle of the order and protect the younger hitters around him. His presence alone changes the lineup\'s identity.',
    middle:
      'Jett Williams (.284, 8 HR from Mississippi State) upgrades shortstop immediately. Gavin Kash (6 HR as a freshman) has the raw power to be a 15-homer threat with development. Cam Cauley (.268, 9 HR from Florida State) adds another portal bat at third. The middle of the order went from thin to legitimate.',
    supportingCast:
      'Kevin Bazzell (.271) brings grit and consistency. Trendan Paige brings speed and defense. The bottom of the lineup is still developing, but the top half has more talent than anything Tech assembled in the 2025 disaster. Improvement is guaranteed — the question is how much.',
  },

  scheduleHighlights: [
    { dates: 'Feb 13-15', opponent: 'Abilene Christian', location: 'Home', notes: 'Season Opener' },
    { dates: 'Feb 20-22', opponent: 'New Mexico', location: 'Home', notes: '' },
    { dates: 'Feb 27-Mar 1', opponent: 'State Farm College Classic', location: 'Neutral', notes: 'Round Rock — vs. Indiana, Stanford' },
    { dates: 'Mar 13-15', opponent: 'TCU', location: 'Away', notes: 'Big 12 Opener' },
    { dates: 'Mar 20-22', opponent: 'BYU', location: 'Home', notes: '' },
    { dates: 'Apr 3-5', opponent: 'Baylor', location: 'Away', notes: '' },
    { dates: 'Apr 10-12', opponent: 'Houston', location: 'Home', notes: '' },
    { dates: 'Apr 24-26', opponent: 'Oklahoma State', location: 'Home', notes: '' },
    { dates: 'May 1-3', opponent: 'Kansas State', location: 'Away', notes: '' },
    { dates: 'May 15-17', opponent: 'Arizona State', location: 'Home', notes: 'Regular Season Finale' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 50 },
    { category: 'Rotation', grade: 45 },
    { category: 'Bullpen', grade: 40 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 50 },
    { category: 'Coaching', grade: 65 },
    { category: 'Schedule Difficulty', grade: 65 },
  ],

  projectionTier: 'Rebuilding',
  projectionText:
    'This is a rebuilding year, and there\'s no point pretending otherwise. Twenty wins and thirty-three losses was an aberration for Tadlock — not the new normal. The portal brought in legitimate talent: Britt gives the lineup an anchor, Williams upgrades shortstop, and Southisene gives the rotation a reliable arm. The coaching grade stays high because Tadlock has rebuilt before — he took Texas Tech to the CWS Finals in 2019 after a down stretch. The timeline for this rebuild is 2026 as the investment year, 2027 as the payoff. Thirty-five wins and an NCAA Tournament bid would be a successful season. Anything more is gravy.',

  relatedLinks: [
    { label: 'Texas Tech Team Page', href: '/college-baseball/teams/texas-tech' },
  ],
};

export default function TexasTech2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
