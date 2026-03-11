/**
 * Team Video Registry — curated YouTube content for college baseball team pages.
 *
 * Categories:
 *   highlights  — game highlights, season compilations, top plays
 *   program     — program features, coach profiles, facility tours
 *   analytics   — sabermetrics explainers (wOBA, FIP, wRC+, etc.)
 *   interview   — player/coach interviews, press conferences
 *
 * Universal analytics explainers appear on ALL team pages.
 * Team-specific videos only appear on their team's page.
 */

export interface TeamVideo {
  youtubeId: string;
  title: string;
  category: 'highlights' | 'program' | 'analytics' | 'interview';
  description?: string;
  season?: string;
}

// ─── Universal Analytics Explainers (shown on every team page) ──────────────

const ANALYTICS_EXPLAINERS: TeamVideo[] = [
  {
    youtubeId: 'qXEj1uM_wXk',
    title: 'wOBA: The Best Offensive Stat in Baseball',
    category: 'analytics',
    description: 'How weighted on-base average captures total offensive value better than batting average or OPS.',
  },
  {
    youtubeId: '74PSMbR6ihw',
    title: 'FIP: The New ERA — Best Pitching Statistic',
    category: 'analytics',
    description: 'Fielding Independent Pitching strips out defense and luck to measure what a pitcher actually controls.',
  },
  {
    youtubeId: 'i5D9_NP2qU0',
    title: 'wRC+ Explained: Weighted Runs Created Plus',
    category: 'analytics',
    description: 'Weighted runs created plus adjusts for park factors and league context — 100 is average, higher is better.',
  },
  {
    youtubeId: 'S-pnuoPpmbI',
    title: 'Baseball Statistics Explained: OPS, WAR, FIP',
    category: 'analytics',
    description: 'A primer on the advanced stats that separate surface-level takes from real analysis.',
  },
];

// ─── Team-Specific Video Registry ───────────────────────────────────────────

const TEAM_SPECIFIC_VIDEOS: Record<string, TeamVideo[]> = {

  // ── Texas Longhorns ─────────────────────────────────────────────────────
  texas: [
    {
      youtubeId: 'rpg61Qy9160',
      title: 'South Carolina Upstate vs #3 Texas | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Longhorns open the 2026 campaign ranked #3 in the country.',
      season: '2026',
    },
    {
      youtubeId: 'm3f2SZe362s',
      title: '#3 Texas vs Ohio State | Bruce Bolt College Classic',
      category: 'highlights',
      description: 'Texas takes on Ohio State in the Bruce Bolt College Classic showcase.',
      season: '2026',
    },
    {
      youtubeId: 'xn6nxAAo4o8',
      title: '#9 Coastal Carolina vs #3 Texas | Bruce Bolt College Classic',
      category: 'highlights',
      description: 'Two top-10 programs collide in an early-season showdown.',
      season: '2026',
    },
    {
      youtubeId: '7zpMycajk1o',
      title: 'Michigan State vs #3 Texas | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Spartans visit Austin to face a loaded Longhorns lineup.',
      season: '2026',
    },
    {
      youtubeId: 'blR7P8JsYvk',
      title: 'Texas A&M vs #1 Texas | 2025 College Baseball Highlights',
      category: 'highlights',
      description: 'SEC rivalry game — Texas A&M pushes the #1 Longhorns in a three-game series.',
      season: '2025',
    },
    {
      youtubeId: '6Pld_mmXUiI',
      title: '#8 Tennessee vs #1 Texas | SEC Tournament Quarterfinal',
      category: 'highlights',
      description: 'The Longhorns take on Tennessee in the SEC Tournament — a preview of what Omaha could look like.',
      season: '2025',
    },
    {
      youtubeId: '2YgiKTNR37o',
      title: 'Texas Baseball & David Pierce React to Making the CWS',
      category: 'program',
      description: 'Coach David Pierce and the Longhorns react to punching their ticket to Omaha in 2022.',
    },
    {
      youtubeId: 'xhPsNE_GeS0',
      title: 'UFCU Disch-Falk Field: Aerial Game Day View',
      category: 'program',
      description: 'A drone\'s-eye view of one of college baseball\'s most iconic venues in Austin, Texas.',
    },
    {
      youtubeId: 'Q0-hnLbEAj4',
      title: '2026 Texas Baseball Alumni Game Highlights',
      category: 'program',
      description: 'Former Longhorns return to Disch-Falk for the annual alumni game.',
      season: '2026',
    },
    {
      youtubeId: 'KuDXd5-Qwkc',
      title: 'Tristan Stevens Returns to Disch-Falk | Alumni Game',
      category: 'interview',
      description: 'Former Longhorn ace Tristan Stevens returns to Austin for the alumni game.',
    },
    {
      youtubeId: 'VIvhNFyWf40',
      title: 'Why Omaha Is the Home of the College World Series',
      category: 'program',
      description: 'ESPN explores why the College World Series belongs in Omaha — and nowhere else.',
    },
  ],

  // ── LSU Tigers ──────────────────────────────────────────────────────────
  lsu: [
    {
      youtubeId: '1zUACBUuVgw',
      title: 'Sacramento State vs #2 LSU | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Tigers open as the #2 team in the country at Alex Box Stadium.',
      season: '2026',
    },
    {
      youtubeId: 'bai4al2Qww0',
      title: '#2 LSU vs Louisiana | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'LSU faces in-state rival Louisiana in a midweek showdown.',
      season: '2026',
    },
    {
      youtubeId: 'x_QP1ttIIUo',
      title: '#2 LSU vs Indiana | Jax College Classic',
      category: 'highlights',
      description: 'The Tigers take on Indiana in the Jacksonville College Classic.',
      season: '2026',
    },
    {
      youtubeId: 'U_v14gpPkDs',
      title: 'Notre Dame vs #2 LSU | Jax College Classic',
      category: 'highlights',
      description: 'A marquee non-conference matchup between two powerhouse programs.',
      season: '2026',
    },
    {
      youtubeId: 'd-A8wcpCcMw',
      title: 'Inside the LSU Tigers\' Iconic Baseball Facility',
      category: 'program',
      description: 'A walkthrough of Alex Box Stadium — one of the loudest, most iconic venues in college baseball.',
    },
    {
      youtubeId: 'Mk-5rr-TuTU',
      title: 'LSU Facility Tour with Tommy White',
      category: 'program',
      description: 'A behind-the-scenes look at LSU\'s baseball facilities with star infielder Tommy White.',
    },
    {
      youtubeId: 'OQf1GPjaYB0',
      title: 'Friday Night in Alex Box Stadium',
      category: 'program',
      description: 'What Friday night baseball looks like in Baton Rouge — the best atmosphere in the sport.',
    },
    {
      youtubeId: '0DGkIhl0r3E',
      title: 'LSU Baseball Hero on 2023 National Title',
      category: 'interview',
      description: 'An LSU player reflects on the 2023 championship run and what it meant for the program.',
    },
    {
      youtubeId: 'YjUhT50SJYI',
      title: 'Interview with LSU Baseball Coach Jay Johnson',
      category: 'interview',
      description: 'Head coach Jay Johnson discusses the state of LSU baseball and the road ahead.',
    },
  ],

  // ── Tennessee Volunteers ────────────────────────────────────────────────
  tennessee: [
    {
      youtubeId: 'wy_Th9MJ5qI',
      title: 'Nicholls vs #14 Tennessee | Opening Day 2026',
      category: 'highlights',
      description: 'The Volunteers open the 2026 season at Lindsey Nelson Stadium.',
      season: '2026',
    },
    {
      youtubeId: 'IIpJPwNeAmI',
      title: '#1 UCLA vs #20 Tennessee | Amegy Bank College Baseball Series',
      category: 'highlights',
      description: 'A top-20 showdown as the Vols take on the #1 Bruins in a neutral-site classic.',
      season: '2026',
    },
    {
      youtubeId: 'VpunmpDLJ_M',
      title: 'Kent State vs #13 Tennessee | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'An exciting early-season home game at Lindsey Nelson.',
      season: '2026',
    },
    {
      youtubeId: 'yeNC3yaAQAc',
      title: 'Wright State vs #19 Tennessee | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Volunteers push through a competitive non-conference contest.',
      season: '2026',
    },
    {
      youtubeId: 'hhmweZL08jI',
      title: 'Texas A&M vs Tennessee | 2024 CWS Championship',
      category: 'highlights',
      description: 'Tennessee wins its first College World Series — the championship game from Omaha.',
      season: '2024',
    },
    {
      youtubeId: '1qEWQAtPP1k',
      title: 'Wake Forest vs #14 Tennessee | Winner to Super Regionals',
      category: 'highlights',
      description: 'An elimination-game thriller that sent the Vols to supers in 2025.',
      season: '2025',
    },
  ],

  // ── Vanderbilt Commodores ───────────────────────────────────────────────
  vanderbilt: [
    {
      youtubeId: 'V9n1llA7PCc',
      title: 'Vanderbilt vs TCU | Shriners Children\'s College Showdown',
      category: 'highlights',
      description: 'The Commodores face TCU in one of the premier early-season showcases.',
      season: '2026',
    },
    {
      youtubeId: 'SeD-GbTaHCI',
      title: 'Vanderbilt vs Oregon | Las Vegas College Baseball Classic',
      category: 'highlights',
      description: 'A cross-conference matchup in Las Vegas between two perennial contenders.',
      season: '2026',
    },
    {
      youtubeId: 'rmjJZtO7Blw',
      title: 'Arizona vs Vanderbilt | Las Vegas College Baseball Classic',
      category: 'highlights',
      description: 'The Wildcats take on Vanderbilt in the Las Vegas Classic.',
      season: '2026',
    },
    {
      youtubeId: 'vPc6lfKhIhM',
      title: 'North Dakota State vs Vanderbilt | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Commodores open at home in Nashville.',
      season: '2026',
    },
    {
      youtubeId: 'k6pcdWMosWs',
      title: 'Troy vs Vanderbilt | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'A non-conference tune-up at Hawkins Field.',
      season: '2026',
    },
  ],

  // ── Ole Miss Rebels ─────────────────────────────────────────────────────
  'ole-miss': [
    {
      youtubeId: 'M4aO827V5J8',
      title: '#25 Ole Miss vs Ohio State | Bruce Bolt College Classic',
      category: 'highlights',
      description: 'The Rebels face Ohio State in one of the first marquee matchups of 2026.',
      season: '2026',
    },
    {
      youtubeId: 'rwCcU3jwy-4',
      title: 'Baylor vs #25 Ole Miss | Bruce Bolt College Classic',
      category: 'highlights',
      description: 'An exciting cross-conference clash in the Bruce Bolt Classic.',
      season: '2026',
    },
    {
      youtubeId: 'NojoxcehgX4',
      title: 'Ole Miss vs Nevada | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Rebels take on Nevada in an early-season series.',
      season: '2026',
    },
    {
      youtubeId: 'jvdWc3W8s1g',
      title: 'Ole Miss vs Missouri State | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'A midweek non-conference game at Swayze Field.',
      season: '2026',
    },
    {
      youtubeId: 'W6uB7eBBSp0',
      title: 'Ole Miss vs North Alabama | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Rebels stay sharp with a home midweek contest.',
      season: '2026',
    },
  ],

  // ── Florida Gators ──────────────────────────────────────────────────────
  florida: [
    {
      youtubeId: 'Y4sUmvMW_38',
      title: '#10 Florida vs #17 Miami | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Sunshine State rivalry delivers — Gators and Hurricanes in a top-20 showdown.',
      season: '2026',
    },
    {
      youtubeId: 'LVp_7PbBuXY',
      title: '#10 Florida vs #17 Miami | Game 1 | 2026 Highlights',
      category: 'highlights',
      description: 'Game 1 of the Florida-Miami series — one of the best rivalries in college baseball.',
      season: '2026',
    },
    {
      youtubeId: 'DBlY-bQYvmc',
      title: 'High Point vs #9 Florida | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Gators open at Florida Ballpark in Gainesville.',
      season: '2026',
    },
    {
      youtubeId: 'wRIct9-Prx8',
      title: 'Florida A&M vs #9 Florida | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'An in-state non-conference matchup at Florida Ballpark.',
      season: '2026',
    },
    {
      youtubeId: 'N_BsSIZ3hKE',
      title: 'UAB vs #13 Florida | Game 3 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Gators close out a weekend series at home.',
      season: '2026',
    },
  ],

  // ── Arkansas Razorbacks ─────────────────────────────────────────────────
  arkansas: [
    {
      youtubeId: '_z1bt-Mtc3o',
      title: 'TCU vs Arkansas | Shriners Children\'s College Showdown',
      category: 'highlights',
      description: 'The Razorbacks face TCU in the premier opening-weekend showcase in Houston.',
      season: '2026',
    },
    {
      youtubeId: 'zSBqWB8eriU',
      title: 'Arkansas State vs #6 Arkansas | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'An in-state rivalry game at Baum-Walker Stadium in Fayetteville.',
      season: '2026',
    },
    {
      youtubeId: '4dEakY-9Y_4',
      title: 'Xavier vs #8 Arkansas | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Razorbacks host Xavier in a non-conference weekend series.',
      season: '2026',
    },
    {
      youtubeId: 'D2gGTMCM96k',
      title: 'Xavier vs #8 Arkansas (Cycle Alert!) | Game 2',
      category: 'highlights',
      description: 'A Razorback hitter flirts with the cycle in a dominant offensive performance.',
      season: '2026',
    },
    {
      youtubeId: 'xFtWVWB_xuY',
      title: 'UT Arlington vs #6 Arkansas | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'Arkansas rolls at Baum-Walker in a midweek contest.',
      season: '2026',
    },
  ],

  // ── Texas A&M Aggies ────────────────────────────────────────────────────
  'texas-am': [
    {
      youtubeId: '8dvDQmtUE5I',
      title: 'Penn vs #24 Texas A&M | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Aggies open the 2026 season at Blue Bell Park in College Station.',
      season: '2026',
    },
    {
      youtubeId: 'Pfola5YDX4M',
      title: 'Tennessee Tech vs #25 Texas A&M | Game 2',
      category: 'highlights',
      description: 'The Aggies battle Tennessee Tech in a competitive weekend series.',
      season: '2026',
    },
    {
      youtubeId: 'CudhZxcpOc4',
      title: 'Tennessee Tech vs #25 Texas A&M | Game 3',
      category: 'highlights',
      description: 'Texas A&M closes out the series at Blue Bell Park.',
      season: '2026',
    },
    {
      youtubeId: 'hhmweZL08jI',
      title: 'Texas A&M vs Tennessee | 2024 CWS Championship',
      category: 'highlights',
      description: 'The Aggies\' run to the College World Series championship game in 2024.',
      season: '2024',
    },
  ],

  // ── Oregon State Beavers ────────────────────────────────────────────────
  'oregon-state': [
    {
      youtubeId: '4MUaXNHcTtU',
      title: '#18 Oregon State vs Oregon | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Civil War rivalry on the diamond — Beavers vs. Ducks.',
      season: '2026',
    },
    {
      youtubeId: 'RAbZWmxaVqY',
      title: '#11 Oregon State vs Baylor | Round Rock Classic',
      category: 'highlights',
      description: 'The Beavers face Baylor in the Round Rock Classic in Texas.',
      season: '2026',
    },
    {
      youtubeId: 'CiWs_iPZ9x4',
      title: '#20 Southern Miss vs #11 Oregon State | Round Rock Classic',
      category: 'highlights',
      description: 'Two ranked programs collide in a neutral-site showcase.',
      season: '2026',
    },
    {
      youtubeId: 'hkM8PCCkGFE',
      title: '#19 Oregon State vs Iowa | Frisco College Classic',
      category: 'highlights',
      description: 'The Beavers take on the Hawkeyes in the Frisco Classic.',
      season: '2026',
    },
    {
      youtubeId: 'Cnt9EAN1tFo',
      title: 'Houston vs #19 Oregon State | Frisco College Classic',
      category: 'highlights',
      description: 'Oregon State faces Houston in the Frisco College Baseball Classic.',
      season: '2026',
    },
  ],

  // ── Wake Forest Demon Deacons ───────────────────────────────────────────
  'wake-forest': [
    {
      youtubeId: 'c_BhlhINmQ8',
      title: '#15 Wake Forest vs App State | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Demon Deacons take on in-state rival Appalachian State.',
      season: '2026',
    },
    {
      youtubeId: 'DzINEkBy75I',
      title: 'High Point vs #22 Wake Forest | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'A wild game at David F. Couch Ballpark in Winston-Salem.',
      season: '2026',
    },
    {
      youtubeId: 'ce3f_THjFPo',
      title: 'Stanford vs #15 Wake Forest | 2026 Baseball Highlights',
      category: 'highlights',
      description: 'The Cardinal visit Winston-Salem to face the ranked Demon Deacons.',
      season: '2026',
    },
    {
      youtubeId: 'lPGWzGY5aD4',
      title: 'Wake Forest vs #16 East Carolina | 2024 Regionals',
      category: 'highlights',
      description: 'An elimination-game thriller in the 2024 NCAA Regional.',
      season: '2024',
    },
  ],

  // ── UCLA Bruins ─────────────────────────────────────────────────────────
  ucla: [
    {
      youtubeId: '8SON730t_VI',
      title: '#1 UCLA vs Ohio State | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The top-ranked Bruins take on Ohio State in a marquee non-conference matchup.',
      season: '2026',
    },
    {
      youtubeId: 'y8iaQhNr4F4',
      title: 'Cal State Fullerton vs #1 UCLA | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'A Southern California rivalry — the Titans visit Jackie Robinson Stadium.',
      season: '2026',
    },
    {
      youtubeId: '0LnI1XEXRXM',
      title: 'UCSD vs #1 UCLA | Game 3 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'A wild game between the Bruins and the Tritons.',
      season: '2026',
    },
    {
      youtubeId: 'IIpJPwNeAmI',
      title: '#1 UCLA vs #20 Tennessee | Amegy Bank College Baseball Series',
      category: 'highlights',
      description: 'The #1 Bruins face the Volunteers in a premier neutral-site showcase.',
      season: '2026',
    },
    {
      youtubeId: '8oE6jaErVH4',
      title: 'San Diego State vs #1 UCLA | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Aztecs test the top-ranked Bruins in Los Angeles.',
      season: '2026',
    },
  ],

  // ── Florida State Seminoles ─────────────────────────────────────────────
  'florida-state': [
    {
      youtubeId: 'zQxlHOCGe6w',
      title: 'Mercer vs #20 Florida State | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Seminoles host Mercer at Dick Howser Stadium in Tallahassee.',
      season: '2026',
    },
    {
      youtubeId: 'gdV6wANptxE',
      title: 'Jacksonville vs #20 Florida State | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'A wild non-conference game at Dick Howser Stadium.',
      season: '2026',
    },
    {
      youtubeId: '3ltssQIyN7E',
      title: 'Northern Kentucky vs #20 Florida State | 2026 Baseball Highlights',
      category: 'highlights',
      description: 'The Seminoles face Northern Kentucky in an early-season home series.',
      season: '2026',
    },
    {
      youtubeId: 'zTe3xtZ9y1c',
      title: '#16 Florida State vs Jacksonville | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'FSU takes on Jacksonville in a midweek contest.',
      season: '2026',
    },
    {
      youtubeId: 'PHI2PvxdAtI',
      title: 'Citadel vs #21 Florida State | 2026 Baseball Highlights',
      category: 'highlights',
      description: 'The Seminoles host the Citadel in a competitive non-conference game.',
      season: '2026',
    },
  ],

  // ── Clemson Tigers ──────────────────────────────────────────────────────
  clemson: [
    {
      youtubeId: '8JQnVBcHxh0',
      title: 'South Carolina vs #15 Clemson | Rubber Match | 2026 Highlights',
      category: 'highlights',
      description: 'The Palmetto State rivalry — Gamecocks and Tigers decide the series.',
      season: '2026',
    },
    {
      youtubeId: 'vYTcm06AcDM',
      title: '#15 Clemson vs South Carolina | Game 1 | 2026 Highlights',
      category: 'highlights',
      description: 'Game 1 of the biggest rivalry in South Carolina baseball.',
      season: '2026',
    },
    {
      youtubeId: 'F168tlbDURw',
      title: 'Army vs #19 Clemson | Opening Day 2026',
      category: 'highlights',
      description: 'The Tigers open the 2026 season at Doug Kingsmore Stadium.',
      season: '2026',
    },
    {
      youtubeId: 'oqFb8lg50TU',
      title: '#14 Clemson vs Michigan State | 2026 Baseball Highlights',
      category: 'highlights',
      description: 'Clemson faces the Spartans in a non-conference matchup.',
      season: '2026',
    },
    {
      youtubeId: '2ARUEJz1mHc',
      title: '#6 Clemson vs Florida | 2024 College Baseball Highlights',
      category: 'highlights',
      description: 'A must-watch game featuring multiple ejections — pure chaos in Gainesville.',
      season: '2024',
    },
  ],

  // ── TCU Horned Frogs ────────────────────────────────────────────────────
  tcu: [
    {
      youtubeId: 'wXbBldCOFng',
      title: '#7 TCU vs #1 UCLA | Game 3 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'Two top-10 programs collide in a premier early-season series.',
      season: '2026',
    },
    {
      youtubeId: 'g9bDG8fj3lM',
      title: '#7 TCU vs #1 UCLA | Game 2 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Horned Frogs take on the #1 Bruins at Jackie Robinson Stadium.',
      season: '2026',
    },
    {
      youtubeId: 'eo4y4JU8FI0',
      title: 'Oklahoma vs TCU | Shriners Children\'s College Showdown',
      category: 'highlights',
      description: 'The Big 12 rivals meet in the Shriners showcase in Houston.',
      season: '2026',
    },
    {
      youtubeId: 'AGRxUcUDgqo',
      title: 'Tulane vs #17 TCU | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Green Wave visit Fort Worth to face the ranked Horned Frogs.',
      season: '2026',
    },
    {
      youtubeId: '5bb9t1GmreU',
      title: 'Abilene Christian vs TCU | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'A local non-conference matchup at Lupton Stadium.',
      season: '2026',
    },
  ],

  // ── Virginia Cavaliers ──────────────────────────────────────────────────
  virginia: [
    {
      youtubeId: 'jw_Lh8NCXbY',
      title: 'Virginia vs #8 North Carolina | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Cavaliers face the Tar Heels in an ACC rivalry game.',
      season: '2026',
    },
    {
      youtubeId: 'NQdjm7GmZjs',
      title: 'VCU vs Virginia | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'An in-state matchup at Disharoon Park in Charlottesville.',
      season: '2026',
    },
    {
      youtubeId: 'R_78jd15qGo',
      title: 'Miami vs Virginia | 2025 College Baseball Highlights',
      category: 'highlights',
      description: 'The Cavaliers host Miami in an ACC showdown under the lights.',
      season: '2025',
    },
  ],

  // ── Stanford Cardinal ───────────────────────────────────────────────────
  stanford: [
    {
      youtubeId: '88lGDKwSmfY',
      title: 'Stanford vs Cal State Fullerton | Game 2 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Cardinal take on Cal State Fullerton in a non-conference series at Sunken Diamond.',
      season: '2026',
    },
    {
      youtubeId: 'bD_kGqd3s-E',
      title: 'Stanford vs Cal State Fullerton | Game 1 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'Stanford opens the series against the Titans at home.',
      season: '2026',
    },
    {
      youtubeId: 'ce3f_THjFPo',
      title: 'Stanford vs #15 Wake Forest | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Cardinal face a ranked Wake Forest squad in an ACC showdown.',
      season: '2026',
    },
    {
      youtubeId: '81pegHoUigA',
      title: 'Stanford Cardinal 2026 Baseball Team Preview',
      category: 'program',
      description: 'A deep dive into the 2026 Stanford roster, pitching staff, and expectations.',
      season: '2026',
    },
  ],

  // ── Miami Hurricanes ──────────────────────────────────────────────────
  miami: [
    {
      youtubeId: 'ixz7cauQSKw',
      title: 'Boston College vs #24 Miami | Game 1 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Hurricanes host Boston College in an ACC weekend series at Mark Light Field.',
      season: '2026',
    },
    {
      youtubeId: 'K0LTbJ8aiFQ',
      title: '#17 Miami vs FAU | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'A South Florida showdown — the ranked Hurricanes face FAU.',
      season: '2026',
    },
    {
      youtubeId: 'Z4weSeIVBXI',
      title: 'Boston College vs #24 Miami | Game 2 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The ACC series continues under the lights in Coral Gables.',
      season: '2026',
    },
    {
      youtubeId: 'LVp_7PbBuXY',
      title: '#10 Florida vs #17 Miami | Game 1 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Gators visit Coral Gables for a top-20 in-state clash.',
      season: '2026',
    },
    {
      youtubeId: 'Y4sUmvMW_38',
      title: '#10 Florida vs #17 Miami | Game 2 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The second game of a marquee Florida vs Miami series.',
      season: '2026',
    },
  ],

  // ── Georgia Bulldogs ──────────────────────────────────────────────────
  georgia: [
    {
      youtubeId: 'j2W49IsS9Dg',
      title: 'Queens vs #11 Georgia | Game 2 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Bulldogs host Queens at Foley Field in Athens.',
      season: '2026',
    },
    {
      youtubeId: 'm9p7pKhxnrQ',
      title: 'Western Carolina vs #11 Georgia | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Catamounts visit Athens for a midweek non-conference game.',
      season: '2026',
    },
    {
      youtubeId: 'CL1gMwf1cXA',
      title: 'SC Upstate vs #14 Georgia | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The ranked Bulldogs host SC Upstate at Foley Field.',
      season: '2026',
    },
  ],

  // ── South Carolina Gamecocks ──────────────────────────────────────────
  'south-carolina': [
    {
      youtubeId: 'zjmY9HX-2kg',
      title: 'Northern Kentucky vs South Carolina | Opening Day | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The Gamecocks open the 2026 campaign at Founders Park in Columbia.',
      season: '2026',
    },
    {
      youtubeId: '8JQnVBcHxh0',
      title: 'South Carolina vs #15 Clemson | Rubber Match | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'The rubber match of the rivalry series — the Palmetto State bragging rights on the line.',
      season: '2026',
    },
    {
      youtubeId: 'vYTcm06AcDM',
      title: '#15 Clemson vs South Carolina | Game 1 | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'Game 1 of the Clemson-South Carolina rivalry series.',
      season: '2026',
    },
    {
      youtubeId: 'O094gvb-MHs',
      title: 'Clemson vs South Carolina | Rivalry Game | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'Another chapter in one of college baseball\'s fiercest in-state rivalries.',
      season: '2026',
    },
  ],

  // ── NC State Wolfpack ─────────────────────────────────────────────────
  'nc-state': [
    {
      youtubeId: 'oUoWlEwpl9k',
      title: '#16 Coastal Carolina vs #13 NC State | 2026 College Baseball Highlights',
      category: 'highlights',
      description: 'Two ranked programs meet in a non-conference matchup at Doak Field.',
      season: '2026',
    },
    {
      youtubeId: 'vU9z0V3XlII',
      title: '#5 Clemson vs #4 NC State | ACC Tournament Quarterfinal | 2025 Highlights',
      category: 'highlights',
      description: 'A thrilling ACC Tournament quarterfinal between two top-5 programs.',
      season: '2025',
    },
    {
      youtubeId: 'g_0-NWG9eUw',
      title: 'NC State Head Coach Elliott Avent Previews 2026 Wolfpack Baseball',
      category: 'interview',
      description: 'Coach Avent breaks down the 2026 roster, pitching staff, and ACC expectations.',
      season: '2026',
    },
  ],
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get all videos for a team — team-specific + universal analytics explainers.
 * Returns empty array if no team-specific videos exist (analytics explainers
 * still show for teams with at least one team-specific video).
 */
export function getTeamVideos(teamId: string): TeamVideo[] {
  const teamVideos = TEAM_SPECIFIC_VIDEOS[teamId.toLowerCase()];
  if (!teamVideos || teamVideos.length === 0) return [];
  return [...teamVideos, ...ANALYTICS_EXPLAINERS];
}

/**
 * Check if a team has any curated video content.
 */
export function hasTeamVideos(teamId: string): boolean {
  const videos = TEAM_SPECIFIC_VIDEOS[teamId.toLowerCase()];
  return !!videos && videos.length > 0;
}
