export interface PreseasonTeamData {
  rank: number;
  tier: 'elite' | 'contender' | 'sleeper' | 'bubble';
  record2025: string;
  postseason2025: string;
  keyPlayers: string[];
  outlook: string;
  conference: string;
  editorialLink?: string;
}

const tierLabels: Record<PreseasonTeamData['tier'], string> = {
  elite: 'Omaha Favorite',
  contender: 'Contender',
  sleeper: 'Dark Horse',
  bubble: 'Bubble',
};

export function getTierLabel(tier: PreseasonTeamData['tier']): string {
  return tierLabels[tier];
}

/**
 * BSI 2026 Preseason Rankings — Top 25 + Select Bubble Teams
 * Keyed by teamId slug matching generateStaticParams.
 * Source: D1Baseball preseason poll + BSI Week 1 updated rankings.
 * Updated: February 12, 2026.
 * 
 * Note: Includes teams ranked 1-29 (sequential). Teams ranked 26-29 are bubble teams
 * with dedicated editorial coverage and are marked tier: 'bubble'.
 */
export const preseason2026: Record<string, PreseasonTeamData> = {
  texas: {
    rank: 1,
    tier: 'elite',
    record2025: '44-14 (22-8 SEC)',
    postseason2025: 'SEC Champion',
    keyPlayers: ['Ethan Mendoza (.333)', 'Dylan Volantis (1.94 ERA)', 'Adrian Rodriguez (.313)', 'Luke Harrison (3.06 ERA)'],
    outlook:
      'The deepest pitching staff in college baseball. Won the SEC in their inaugural season — picked 8th. Schlossnagle reloads with portal arms from Wake Forest, LSU, and Arizona State. The team to beat.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/texas-2026',
  },
  'texas-am': {
    rank: 2,
    tier: 'elite',
    record2025: '53-15',
    postseason2025: 'College World Series',
    keyPlayers: ['Ryan Prager (LHP)', 'Kaeden Kent (3B)', 'Braden Montgomery (OF)'],
    outlook:
      'The Aggies return the core of a 53-win team that reached Omaha. Elite defense, contact-oriented hitting, and a knack for developing arms.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/texas-am-2026',
  },
  florida: {
    rank: 3,
    tier: 'elite',
    record2025: '47-23',
    postseason2025: 'Super Regional',
    keyPlayers: ['Jac Caglianone (1B/LHP)', 'Cade Kurland (2B)', 'Brandon Sproat (RHP)'],
    outlook:
      "Jac Caglianone is the best two-way player in college baseball. If he stays healthy, the Gators have a legitimate Omaha ceiling. O'Sullivan knows how to peak in June.",
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/florida-2026',
  },
  'wake-forest': {
    rank: 4,
    tier: 'elite',
    record2025: '54-11',
    postseason2025: 'CWS Final',
    keyPlayers: ['Pierce Bennett (SS)', 'Brock Wilken (3B)', 'Josh Hartle (LHP)'],
    outlook:
      'One game from a national title. The Demon Deacons ran roughshod over the ACC and reload with enough returning talent to make another run.',
    conference: 'ACC',
    editorialLink: '/college-baseball/editorial/acc-opening-weekend',
  },
  lsu: {
    rank: 5,
    tier: 'elite',
    record2025: '52-17',
    postseason2025: 'National Champions',
    keyPlayers: ['Tommy White (3B)', 'Paul Skenes (RHP)', "Tre' Morgan (1B)"],
    outlook:
      "Defending national champions lost key pieces but Skenes returns. Tommy White continues to mash. This is still LSU — they'll be in the conversation come May.",
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/lsu-2026',
  },
  virginia: {
    rank: 6,
    tier: 'contender',
    record2025: '50-14',
    postseason2025: 'College World Series',
    keyPlayers: ["Griff O'Ferrall (SS)", 'Jake Gelof (3B)', 'Connelly Early (RHP)'],
    outlook:
      "O'Connor's consistency machine. The Cavaliers return a balanced roster that can beat you with pitching or offense. ACC championship favorites.",
    conference: 'ACC',
    editorialLink: '/college-baseball/editorial/acc-opening-weekend',
  },
  arkansas: {
    rank: 7,
    tier: 'contender',
    record2025: '46-21',
    postseason2025: 'Super Regional',
    keyPlayers: ['Peyton Stovall (2B)', 'Hagen Smith (LHP)', 'Jace Bohrofen (OF)'],
    outlook:
      "Van Horn's program is a machine. The Hogs reload every year with elite talent and compete for SEC titles. This team has the arms to pitch deep into June.",
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/arkansas-2026',
  },
  tennessee: {
    rank: 8,
    tier: 'contender',
    record2025: '45-23',
    postseason2025: 'Regional Final',
    keyPlayers: ['Christian Moore (2B)', 'Drew Beam (RHP)', 'Blake Burke (1B)'],
    outlook:
      "Vitello has built Tennessee into a legitimate power. The Vols bring back a potent lineup and one of the SEC's best arms in Drew Beam.",
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/tennessee-2026',
  },
  stanford: {
    rank: 9,
    tier: 'contender',
    record2025: '41-19',
    postseason2025: 'Super Regional',
    keyPlayers: ['Braden Montgomery (OF)', 'Drew Dowd (RHP)', 'Adam Crampton (C)'],
    outlook:
      "The Cardinal join the ACC and bring West Coast firepower. Esquer's squad has legitimate Omaha aspirations. Cross-country travel will test them.",
    conference: 'ACC',
    editorialLink: '/college-baseball/editorial/acc-opening-weekend',
  },
  'oregon-state': {
    rank: 10,
    tier: 'contender',
    record2025: '49-18',
    postseason2025: 'College World Series',
    keyPlayers: ['Travis Bazzana (2B)', 'Jacob Kmatz (RHP)', 'Jabin Trosky (OF)'],
    outlook:
      'Travis Bazzana is a potential #1 overall pick. The Pac-12 is weakened, which should mean a conference title and top-8 national seed.',
    conference: 'Pac-12',
    editorialLink: '/college-baseball/editorial/national-opening-weekend',
  },
  vanderbilt: {
    rank: 11,
    tier: 'contender',
    record2025: '43-21',
    postseason2025: 'Regional',
    keyPlayers: ['Enrique Bradfield Jr. (OF)', 'Carter Young (SS)', 'Christian Little (RHP)'],
    outlook:
      'Corbin always reloads. Bradfield Jr. is electric and the pitching staff is underrated. Vanderbilt has too much talent in the pipeline.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/vanderbilt-2026',
  },
  tcu: {
    rank: 12,
    tier: 'contender',
    record2025: '44-20',
    postseason2025: 'Super Regional',
    keyPlayers: ['Brayden Taylor (3B)', 'Austin Krob (LHP)', 'Tommy Sacco (SS)'],
    outlook:
      'Big 12 favorites with Texas gone. Saarloos has built a monster in Fort Worth — the Horned Frogs slug with the best and have the pitching to match.',
    conference: 'Big 12',
    editorialLink: '/college-baseball/editorial/big-12-opening-weekend',
  },
  clemson: {
    rank: 13,
    tier: 'sleeper',
    record2025: '42-19',
    postseason2025: 'Regional',
    keyPlayers: ['Cam Cannarella (OF)', 'Aidan Knaak (RHP)', 'Blake Wright (C)'],
    outlook:
      'Bakich continues to elevate the program. Excellent pitching depth and a balanced lineup make the Tigers a threat in the ACC.',
    conference: 'ACC',
    editorialLink: '/college-baseball/editorial/acc-opening-weekend',
  },
  'north-carolina': {
    rank: 14,
    tier: 'sleeper',
    record2025: '45-18',
    postseason2025: 'Super Regional',
    keyPlayers: ['Vance Honeycutt (OF)', 'Luke Stevenson (RHP)', 'Casey Cook (3B)'],
    outlook:
      "Forbes has the Heels trending upward. Honeycutt is a game-changer in center field with plus power. This could be Chapel Hill's year.",
    conference: 'ACC',
    editorialLink: '/college-baseball/editorial/acc-opening-weekend',
  },
  kentucky: {
    rank: 15,
    tier: 'sleeper',
    record2025: '40-22',
    postseason2025: 'Regional',
    keyPlayers: ['Ryan Waldschmidt (1B)', 'Travis Smith (RHP)', 'Devin Burkes (SS)'],
    outlook:
      "Mingione has built something real in Lexington. Consistent depth and sound fundamental baseball. Don't sleep on the Cats.",
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/kentucky-2026',
  },
  georgia: {
    rank: 16,
    tier: 'sleeper',
    record2025: '39-23',
    postseason2025: 'Regional',
    keyPlayers: ['Charlie Condon (OF)', 'Kolby Branch (RHP)', 'Corey Collins (3B)'],
    outlook:
      'Charlie Condon is the best pure hitter in college baseball. If the pitching catches up, Georgia could surprise.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/georgia-2026',
  },
  oklahoma: {
    rank: 17,
    tier: 'sleeper',
    record2025: '40-21',
    postseason2025: 'Regional',
    keyPlayers: ['Dakota Harris (OF)', 'Cade Horton (RHP)', 'Jackson Nicklaus (1B)'],
    outlook:
      'SEC debut. Skip Johnson has the arms to compete in the best conference in the country. A dark horse for the Tournament.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/oklahoma-2026',
  },
  'south-carolina': {
    rank: 18,
    tier: 'sleeper',
    record2025: '38-22',
    postseason2025: 'Regional',
    keyPlayers: ['Ethan Petry (1B)', 'Will Sanders (RHP)', 'Carson Hornung (OF)'],
    outlook:
      'Monte Lee has the Gamecocks back in the conversation. Pitching staff has real depth and the lineup is improving.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/south-carolina-2026',
  },
  'florida-state': {
    rank: 19,
    tier: 'sleeper',
    record2025: '43-19',
    postseason2025: 'Super Regional',
    keyPlayers: ['James Tibbs III (OF)', 'Brennan Oxford (RHP)', 'Daniel Cantu (SS)'],
    outlook:
      'Jarrett continues to build in Tallahassee. Elite athleticism and enough pitching to make a run in the ACC.',
    conference: 'ACC',
    editorialLink: '/college-baseball/editorial/acc-opening-weekend',
  },
  'nc-state': {
    rank: 20,
    tier: 'bubble',
    record2025: '38-21',
    postseason2025: 'Regional',
    keyPlayers: ['Noah Soles (SS)', 'Logan Whitaker (LHP)', 'Matt Heavner (C)'],
    outlook:
      "Avent's program continues to churn out competitive teams. The Wolfpack are scrappy and well-coached, capable of upsetting anyone in a short series.",
    conference: 'ACC',
    editorialLink: '/college-baseball/editorial/acc-opening-weekend',
  },
  alabama: {
    rank: 21,
    tier: 'bubble',
    record2025: '36-23',
    postseason2025: 'Regional',
    keyPlayers: ['Gage Miller (SS)', 'Grayson Hitt (RHP)', 'Drew Williamson (3B)'],
    outlook:
      'Vaughn has Alabama trending upward. The Tide are finally becoming a factor in SEC baseball with improved pitching and a solid lineup.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/alabama-2026',
  },
  ucla: {
    rank: 22,
    tier: 'bubble',
    record2025: '37-21',
    postseason2025: 'Regional',
    keyPlayers: ['Carson Yates (SS)', 'Thatcher Hurd (RHP)', 'Ethan Anderson (3B)'],
    outlook:
      'Bruins adjust to Big Ten life. West Coast talent meets Midwest travel. Enough pieces to be competitive in the new conference.',
    conference: 'Big Ten',
    editorialLink: '/college-baseball/editorial/national-opening-weekend',
  },
  california: {
    rank: 23,
    tier: 'bubble',
    record2025: '37-21',
    postseason2025: 'Regional',
    keyPlayers: ['Nathan Manning (1B)'],
    outlook:
      "ACC debut alongside Stanford. Neu's Bears have something to prove in their new conference.",
    conference: 'ACC',
    editorialLink: '/college-baseball/editorial/acc-opening-weekend',
  },
  // Evansville and Dallas Baptist are mid-majors without team detail pages — included for completeness
  // but editorialLink routes to the national preview
  'ole-miss': {
    rank: 24,
    tier: 'bubble',
    record2025: '42-23',
    postseason2025: 'Regional',
    keyPlayers: ['Jackson Kimbrell (OF)', 'Jack Dougherty (RHP)', 'Kemp Alderman (1B)'],
    outlook:
      'Bianco has been here before. The Rebels have the bats to compete with anyone and pitch well enough to stay in games.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/ole-miss-2026',
  },
  'oklahoma-state': {
    rank: 25,
    tier: 'bubble',
    record2025: '41-22',
    postseason2025: 'Regional',
    keyPlayers: ['Nolan Schubart (OF)', 'Justin Campbell (RHP)', 'Aidan Meola (C)'],
    outlook:
      'Cowboys load up for a Big 12 run. Pitching depth is improved and the lineup has pop.',
    conference: 'Big 12',
    editorialLink: '/college-baseball/editorial/big-12-opening-weekend',
  },
  arizona: {
    rank: 26,
    tier: 'bubble',
    record2025: '41-22',
    postseason2025: 'Regional',
    keyPlayers: ['Daniel Susac (C)', 'Dawson Netz (RHP)', 'Garen Caulfield (OF)'],
    outlook:
      "Hale's squad joins the Big 12 with plenty of talent. Susac is one of the best catchers in the country.",
    conference: 'Big 12',
    editorialLink: '/college-baseball/editorial/big-12-opening-weekend',
  },
  auburn: {
    rank: 27,
    tier: 'bubble',
    record2025: '32-26',
    postseason2025: 'None',
    keyPlayers: ['Bobby Peirce (INF)', 'Trace Bright (RHP)', 'Cole Foster (SS)'],
    outlook:
      'Butch Thompson has a young roster with upside. The pitching development pipeline produced arms nobody saw coming. The Tigers are building toward something.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/auburn-2026',
  },
  'mississippi-state': {
    rank: 28,
    tier: 'bubble',
    record2025: '33-25',
    postseason2025: 'None',
    keyPlayers: ['Kellum Clark (1B)', 'Cade Smith (RHP)', 'Slate Alford (RHP)'],
    outlook:
      'Lemonis won a national title in 2021 and has spent two years rebuilding. The pieces are starting to fall into place. Dudy Noble is still one of the loudest stadiums in the country.',
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/mississippi-state-2026',
  },
  missouri: {
    rank: 29,
    tier: 'bubble',
    record2025: '28-29',
    postseason2025: 'None',
    keyPlayers: ['Ross Lovich (OF)', 'Luke Sinnard (RHP)'],
    outlook:
      "Kerrick Jackson is building. The portal brought pedigree, and the young pitching staff is developing. Missouri is a year away — but the foundation is being laid.",
    conference: 'SEC',
    editorialLink: '/college-baseball/editorial/missouri-2026',
  },
};
