import { SECTeamPreviewTemplate } from '@/components/editorial/SECTeamPreviewTemplate';
import type { TeamPreviewData } from '@/components/editorial/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Penn State Nittany Lions: 2026 Season Preview | Blaze Sports Intel',
  description:
    'Mike Gambino spent a decade building Boston College into a competitive ACC program, and now he is applying the same blueprint to Penn State — a school with every resource imaginable.',
  openGraph: {
    title: 'Penn State Nittany Lions: 2026 Season Preview',
    description:
      'Mike Gambino spent a decade building Boston College into a competitive ACC program, and now he is applying the same blueprint to Penn State — a school with every resource imaginable.',
  },
};

const data: TeamPreviewData = {
  teamName: 'Penn State',
  teamSlug: 'penn-state',
  mascot: 'Nittany Lions',
  badgeText: 'Season Preview',
  date: 'February 13, 2026',
  readTime: '15 min read',
  heroTitle: '2026 Season Preview',
  heroSubtitle:
    'Mike Gambino spent a decade building Boston College into a competitive ACC program, and now he is applying the same blueprint to Penn State — a school with every resource imaginable and a baseball program that has never reached Omaha. The Nittany Lions went 33-23 in Gambino\'s first year, and the 2026 question is whether that was a one-year bump or the beginning of something real. The East Coast recruiting pipeline is open. The Big Ten does not know what to do with it yet.',

  programStats: {
    allTimeWins: '1,215',
    winPct: '.462',
    cwsAppearances: 0,
    nationalTitles: 0,
    confTitles: 3,
    cwsWins: 0,
  },

  record2025: '33-23 (15-15 Big Ten)',
  record2025Context: 'Strong first year under Gambino — .500 in Big Ten with 33 overall wins',
  seasonStats2025: {
    teamBA: '.272',
    teamERA: '4.18',
    homeRuns: 48,
    stolenBases: 52,
    strikeouts: 438,
    opponentBA: '.255',
  },
  seasonHighlights: [
    'Won 33 games in Gambino\'s first season — the most since 2019',
    'Jay Harry hit .315 with 10 HR as the breakout bat of the Big Ten season',
    'Matt Mikulski posted a 3.08 ERA and struck out 88 in 82 innings — an ace-level season',
    'Beat Michigan in a Friday night game that announced Penn State as a legitimate Big Ten program',
    'Went 15-15 in Big Ten play — the first .500-or-better conference mark in five years',
  ],

  keyReturnees: [
    {
      name: 'Jay Harry',
      position: 'OF',
      year: 'Jr.',
      stats: '.315/.405/.518, 10 HR, 48 RBI',
      bio: 'The breakout hitter of 2025. Harry combines a short, compact swing with plus raw power. He drove the ball to all fields and showed a patience at the plate that belies his age. If he repeats this production, he is an all-conference candidate.',
    },
    {
      name: 'Matt Mikulski',
      position: 'LHP',
      year: 'Jr.',
      stats: '7-4, 3.08 ERA, 88 K, 82 IP',
      bio: 'Friday ace with a fastball that sits 91-93 and a slider that misses barrels consistently. Mikulski was the best pitcher on the staff from day one and pitched like an established ace. His poise under pressure is what stood out.',
    },
    {
      name: 'Kyle Hannon',
      position: 'SS',
      year: 'Sr.',
      stats: '.278/.355/.402, 5 HR, 15 SB',
      bio: 'Experienced shortstop who does everything at a solid level. Reliable defender with a strong arm. His bat is contact-oriented with enough pop to keep pitchers honest. The on-base machine at the top of the order.',
    },
    {
      name: 'Danny Pyne',
      position: 'C',
      year: 'Jr.',
      stats: '.258/.342/.418, 6 HR',
      bio: 'Defensive-first catcher with a cannon arm. Controls the running game and handles a pitching staff with intelligence. The bat showed improvement — six home runs suggest the power is still developing.',
    },
    {
      name: 'Tyler Shingledecker',
      position: 'RHP',
      year: 'So.',
      stats: '4.08 ERA, 55 K, 57 IP',
      bio: 'Sophomore right-hander who was the third starter in 2025 and showed he can handle the role. Physical pitcher with a fastball that touches 94 and a developing changeup. The upside is significant.',
    },
    {
      name: 'Luke Glackin',
      position: '3B',
      year: 'Jr.',
      stats: '.265/.348/.432, 7 HR',
      bio: 'Corner infielder with gap power. Glackin can drive the ball into the corners and plays solid defense at the hot corner. A consistent two-strike approach would elevate his game.',
    },
  ],

  transferAdditions: [
    {
      name: 'Ryan Ford',
      position: 'OF/DH',
      year: 'R-Sr.',
      fromSchool: 'Vanderbilt',
      stats: '.268/.358/.465, 9 HR',
      bio: 'SEC-tested power bat who adds lineup depth Gambino could not get from the high school ranks in one cycle. Physical hitter with opposite-field power. His SEC experience legitimizes the middle of the order.',
    },
    {
      name: 'Chris Castillo',
      position: 'RHP',
      year: 'Jr.',
      fromSchool: 'Seton Hall',
      stats: '5-3, 3.35 ERA, 78 K',
      bio: 'East Coast arm from Gambino\'s recruiting wheelhouse. Big East Pitcher of the Year candidate with a four-pitch mix. Slots into the Saturday rotation and gives Penn State two quality weekend starters.',
    },
    {
      name: 'Jake Petersen',
      position: '2B',
      year: 'Jr.',
      fromSchool: 'UConn',
      stats: '.282/.365/.412, 5 HR, 12 SB',
      bio: 'Athletic middle infielder with Big East experience. Petersen adds speed and defensive versatility. His ability to play second or short provides depth across the middle.',
    },
    {
      name: 'Dominic Telesca',
      position: 'LHP',
      year: 'So.',
      fromSchool: 'NC State',
      stats: '3.62 ERA, 42 K, 35 IP',
      bio: 'Young left-hander from the ACC who wants a larger role. His slider generates ground balls, and the command is ahead of his age. Bullpen weapon with starting upside.',
    },
  ],

  pitchingAnalysis: {
    headline:
      'Matt Mikulski (7-4, 3.08 ERA, 88 K) is the clear ace and one of the Big Ten\'s best returning pitchers. His ability to pitch deep into games — he averaged 5.8 innings per start — saves the bullpen and sets the tone. Every Friday is a winnable game with Mikulski on the mound.',
    rotation:
      'Chris Castillo (from Seton Hall, 3.35 ERA) gives Gambino a Saturday starter with the pitch mix and poise to match Mikulski\'s intensity. Tyler Shingledecker (4.08 ERA) has the stuff to anchor Sundays — if the changeup develops, he is a potential draft prospect. The weekend rotation is legitimate.',
    depth:
      'Dominic Telesca (from NC State, 3.62 ERA) adds a left-handed option in the bullpen or as a spot starter. The relief corps was solid in 2025 — a 3.85 ERA — but needs to maintain that level. Gambino\'s staff development track record from Boston College suggests the pitching will improve, not regress.',
  },

  lineupAnalysis: {
    engine:
      'Jay Harry (.315, 10 HR) is the best returning bat in the lineup and one of the Big Ten\'s premier hitters. He drove the ball consistently in 2025 and showed the ability to carry an offense through cold stretches. The lineup is built around his bat in the three-hole.',
    middle:
      'Ryan Ford (from Vanderbilt, .268, 9 HR) adds SEC power to the middle. Luke Glackin (.265, 7 HR) provides gap power from the five-hole. The 3-4-5 can hit for power and average — a combination Gambino prioritizes in lineup construction.',
    supportingCast:
      'Kyle Hannon (.278, 15 SB) sets the table at the top. Jake Petersen (from UConn, .282, 12 SB) adds speed and on-base ability. Danny Pyne (.258, 6 HR) steadies the bottom third. The lineup has seven hitters who can produce — depth that most Big Ten programs lack.',
  },

  scheduleHighlights: [
    { dates: 'Feb 14-16', opponent: 'James Madison', location: 'Neutral', notes: 'Season Opener at Myrtle Beach tournament' },
    { dates: 'Feb 27-Mar 1', opponent: 'East Carolina', location: 'Away', notes: 'Road test at Clark-LeClair Stadium' },
    { dates: 'Mar 7-9', opponent: 'Georgetown', location: 'Home', notes: 'Home opener at Medlar Field' },
    { dates: 'Mar 20-22', opponent: 'Michigan', location: 'Home', notes: 'Big Ten Opener — marquee home series' },
    { dates: 'Apr 3-5', opponent: 'Maryland', location: 'Away', notes: 'East Coast conference rivalry' },
    { dates: 'Apr 10-12', opponent: 'Ohio State', location: 'Home', notes: 'Conference series at Medlar Field' },
    { dates: 'Apr 17-19', opponent: 'Indiana', location: 'Away', notes: 'Road series in Bloomington' },
    { dates: 'May 1-3', opponent: 'Rutgers', location: 'Home', notes: 'Northeast rivalry with Big Ten implications' },
    { dates: 'May 8-10', opponent: 'Nebraska', location: 'Away', notes: 'Road trip to Haymarket Park' },
    { dates: 'May 15-17', opponent: 'Michigan State', location: 'Away', notes: 'Season finale in East Lansing' },
  ],

  scoutingGrades: [
    { category: 'Lineup Depth', grade: 55 },
    { category: 'Rotation', grade: 55 },
    { category: 'Bullpen', grade: 50 },
    { category: 'Defense', grade: 50 },
    { category: 'Speed/Baserunning', grade: 50 },
    { category: 'Coaching', grade: 60 },
    { category: 'Schedule Difficulty', grade: 55 },
  ],

  projectionTier: 'Bubble',
  projectionText:
    'Penn State is the most interesting program in the Big Ten right now. Gambino\'s first year produced 33 wins and a .500 conference record, and the 2026 roster is better at nearly every position. Mikulski is a frontline ace. Harry is a breakout star. The portal brought in an SEC bat, a Big East pitcher, and a left-handed reliever from the ACC. The East Coast pipeline Gambino established at Boston College is already producing — Penn State signed one of the best recruiting classes in program history. The projection is 34-to-38 wins and a legitimate NCAA Regional bid. If the rotation stays healthy and Harry repeats his 2025 production, this team could be a Regional host. For a program that has never been to Omaha, that would be a seismic shift.',

  relatedLinks: [
    { label: 'Penn State Team Page', href: '/college-baseball/teams/penn-state' },
  ],
};

export default function PennState2026Page() {
  return <SECTeamPreviewTemplate data={data} />;
}
