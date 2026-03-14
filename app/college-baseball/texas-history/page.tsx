import { ProgramHistoryFeature } from '@/components/editorial/ProgramHistoryFeature';
import type { ProgramHistoryData } from '@/components/editorial/types';
import { editorialMetadata, editorialJsonLdProps } from '@/lib/editorial-seo';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

const seoConfig = {
  title: 'Texas Longhorns Baseball: A Complete Program History (1885-2026)',
  description:
    'The definitive history of Texas Longhorns baseball. Six national championships, 38 CWS appearances, four coaches in 105 years. From Billy Disch to Jim Schlossnagle — the through-line that built college baseball\'s most enduring program.',
  datePublished: '2026-03-13',
  slug: '/college-baseball/texas-history',
  sport: 'College Baseball',
  ogTitle: 'Texas Longhorns Baseball: The Complete History | BSI',
};
export const metadata = editorialMetadata(seoConfig);

const data: ProgramHistoryData = {
  programName: 'Texas Longhorns Baseball',
  heroTitle: 'The Through-Line',
  heroSubtitle:
    'Six national championships. 38 College World Series appearances. Four head coaches in 105 years. The story of Texas baseball is not a collection of seasons — it is a single unbroken transmission of culture, discipline, and standard across 141 years.',
  badgeText: 'Program History',
  date: 'March 13, 2026',
  readTime: '22 min read',

  heroImage: '/images/texas-history/texas-1898-team.webp',
  heroImageAlt: '1898 University of Texas baseball team',
  heroImageCaption: '1898 University of Texas baseball team — Cactus Yearbook, Briscoe Center',

  featuredVideoId: 'Is6xa3UlTYs',
  featuredVideoTitle: 'Texas Longhorns Baseball Legacy',

  stadiumImages: [
    { src: '/images/texas-history/billy-disch-bust.webp', alt: 'Billy Disch bronze bust at UFCU Disch-Falk Field' },
    { src: '/images/texas-history/cliff-gustafson-coach.webp', alt: 'Cliff Gustafson bronze at UFCU Disch-Falk Field' },
  ],

  cultureImage: '/images/texas-history/augie-garrido-infographic.jpg',
  cultureImageAlt: 'Augie Garrido — 1,975 career wins, 2 NCAA championships, 8 CWS appearances',

  closingImage: '/images/texas-history/augie-garrido-rosenblatt.jpg',
  closingImageAlt: 'Augie Garrido at Rosenblatt Stadium during the College World Series',

  brandEvolutionImage: '/images/texas-history/texas-logo-evolution.jpg',
  brandEvolutionImageAlt: 'Texas Longhorns logo evolution — 1961 silhouette, 1966-1976 vintage Bevo, 1977 Bevo with hat, 2000 wordmark',

  // ── I. Opening Narrative ──────────────────────────────────────────
  openingNarrative: `Most college baseball programs measure themselves in seasons. Texas measures itself in eras.

The University of Texas fielded its first baseball team in 1885 — the same year Grover Cleveland took office and the Washington Monument was dedicated. Since then, the Longhorns have compiled more wins, more College World Series appearances, and a higher all-time winning percentage than any program in Division I history. Six national championship banners hang inside UFCU Disch-Falk Field. Eighty-one conference titles. The numbers are so large they stop functioning as statistics and start functioning as geology — layers of achievement compressed into something that just looks like bedrock.

But the numbers are not the story. The story is the through-line.

From 1911 to 2016, Texas had three head coaches. Three men across 105 years. Billy Disch coached Bibb Falk. Bibb Falk coached Cliff Gustafson. Each successor played for the man he replaced. Each inherited not just a program but a philosophy — that the standard is not negotiable, that fundamentals are not boring, that winning is a habit maintained through discipline rather than talent alone.

When Augie Garrido arrived in 1997, he was the first outsider in nearly a century. He brought a different vocabulary — process over outcome, mental toughness, living in the moment — but the core expectation never shifted. You play for Texas, you compete for Omaha. That is not a goal. It is a condition of employment.

Now Jim Schlossnagle runs the program. He arrived under controversy and responded with an SEC championship in Year One. The transmission continues, adapted but unbroken.

This is the full arc. Not a highlight reel. A structural history of how one program maintained its standard across three centuries, two conferences, and a sport that the rest of the country barely noticed until ESPN figured out how to monetize it.`,

  // ── Coaching Eras ──────────────────────────────────────────────────
  coachingEras: [
    {
      name: 'Billy Disch',
      years: '1911–1939',
      record: '513-180 (.740)',
      titles: 0,
      cwsAppearances: 0,
      keyPlayers: ['Bibb Falk', 'Bib Hubbard', 'Pete Layden'],
      narrative: `Billy Disch arrived at Texas in 1911 and found a program that could barely fund road trips. He left it as the most dominant force in Southwest Conference history.

Disch won 20 conference championships across 29 seasons. His teams posted a .740 winning percentage — a number that still ranks among the highest in college baseball history for a career that long. He did not have a College World Series to compete in; the first CWS was not held until 1947, eight years after his retirement. What he had was the SWC, and he owned it.

The numbers alone miss what Disch built. He established the institutional expectation that Texas baseball would be excellent, not occasionally but perpetually. He was called the "athletic conscience" of the university — a man whose standards extended beyond the diamond into how his players carried themselves, how they studied, how they represented the burnt orange.

Disch's most lasting act was not a win or a title. It was a player: Bibb Falk, who would go on to a major league career, then return to Austin and coach the program for 25 years. The through-line begins here. Disch didn't just build a program. He built a succession plan without knowing it.

The field that now holds over 7,000 fans bears his name alongside Falk's — UFCU Disch-Falk Field. Two coaches, one hyphen, one standard.`,
      pullQuote: 'He was called the athletic conscience of the university.',
      image: '/images/texas-history/billy-disch-coach.webp',
      imageAlt: 'Coach Billy Disch — Texas baseball, 1911-1939',
    },
    {
      name: 'Bibb Falk',
      years: '1940–1967',
      record: '478-176 (.731)',
      titles: 2,
      cwsAppearances: 5,
      keyPlayers: ['Tom Hamilton', 'Murray Wall', 'Pete Layden', 'Ransom Jackson', 'Jim Ehrler'],
      narrative: `Bibb Falk played for Billy Disch, then spent 12 seasons in the major leagues — eight years with the Chicago White Sox, four with the Cleveland Indians. He hit .314 for his career. He was good enough. But Austin called him home.

Falk took over in 1940 and immediately established that the Disch standard had not retired with Disch. He was crusty, demanding, and allergic to excuses. His teams won 19 Southwest Conference titles across 25 seasons. When the College World Series began in 1947, Texas was there. When it mattered most, Texas won.

The 1949 national championship — Texas's first in any sport — was Falk's masterpiece of the early years. Tom Hamilton hit three home runs in the CWS, earning Most Outstanding Player honors and announcing to the college baseball world that the Longhorns had arrived at the national level, not as guests but as landlords. Texas came back in 1950 and won it again, with Jim Ehrler throwing a complete-game shutout in the championship final.

Back-to-back titles. The first program to do it in the CWS era.

Falk's legacy is continuity. He took what Disch built and proved it could survive a generational transition. The standard was not dependent on one man — it was embedded in the program itself. And just as Disch had coached Falk, Falk was coaching the next man in line. A kid from Austin named Cliff Gustafson played shortstop for Falk in the early 1950s. He was watching. He was learning.

Pete Layden, who Falk called the "most gifted athlete" he ever coached, starred in both baseball and football. Ransom Jackson hit .435 to win the batting title. These were not specialists — they were competitors shaped by a culture that demanded excellence across every dimension.`,
      pullQuote: 'The first program to win back-to-back national championships in the CWS era.',
      image: '/images/texas-history/bibb-falk-coach.webp',
      imageAlt: 'Coach Bibb Falk — Texas baseball, 1940-1967',
    },
    {
      name: 'Cliff Gustafson',
      years: '1968–1996',
      record: '1,466-377 (.792)',
      titles: 2,
      cwsAppearances: 17,
      keyPlayers: [
        'Roger Clemens', 'Greg Swindell', 'Brooks Kieschnick', 'Burt Hooton',
        'Jim Gideon', 'Scott Bryant', 'Spike Owen', 'Calvin Schiraldi',
      ],
      narrative: `Cliff Gustafson played shortstop for Bibb Falk. When Falk retired in 1967, Gustafson took the reins. He would not let go for 29 seasons, and during that time he compiled the most dominant coaching record in college baseball history.

The numbers are almost unreasonable. A .792 winning percentage. Seventeen College World Series appearances. Twenty-two Southwest Conference championships. Two national titles. Over 1,400 wins. Gustafson did not merely sustain the standard — he elevated it into something that looked, from the outside, like a structural advantage wired into the program's DNA.

The 1975 team may be the greatest in college baseball history. They went 59-6. Jim Gideon was 17-0 on the mound. That team didn't just win the national championship — they made the rest of the country look like a different sport. Gideon's 17-0 record remains one of the most staggering individual seasons ever posted by a college pitcher. That team's .908 winning percentage has never been matched in the modern era.

Then came 1983, and a 20-year-old sophomore from Katy, Texas named Roger Clemens. Clemens threw a complete game to clinch the national championship against Alabama — a performance that announced both a title and a future. Within two years Clemens was in Boston, on his way to seven Cy Young Awards. But he won his first ring in Austin.

Greg Swindell struck out 501 batters across his Texas career — a program record that still stands. Brooks Kieschnick was the ultimate two-way player before Shohei Ohtani made the concept fashionable: National Player of the Year in 1993, starting pitcher and cleanup hitter, a force so complete that his number 23 hangs permanently in the outfield.

Burt Hooton posted a 1.14 career ERA and threw a no-hitter in the 1971 SWC tournament. Spike Owen and Calvin Schiraldi were the backbone of the 1983 title team alongside Clemens. Scott Bryant's number 25 was retired after he became one of the most productive hitters in program history.

Gustafson's era was not just about talent — it was about the relentless production of talent within a system. Players arrived good and left great. The program functioned like a refinery: raw ability in, polished excellence out, year after year after year.

He retired after the 1996 season under some controversy — pushed out, some said, by an athletics department that wanted a new direction. What they got was the last outsider the program would hire for nearly three decades.`,
      pullQuote: 'The 1975 team went 59-6. Gideon was 17-0. That is not a season. That is a statement about what a program can be when the standard is absolute.',
      image: '/images/texas-history/cliff-gustafson-dugout.webp',
      imageAlt: 'Cliff Gustafson in the dugout wearing burnt orange Texas #16 jersey',
    },
    {
      name: 'Augie Garrido',
      years: '1997–2016',
      record: '824-427-2 (.658)',
      titles: 2,
      cwsAppearances: 8,
      keyPlayers: [
        'Huston Street', 'David Maroul', 'Omar Quintanilla', 'Drew Stubbs',
        'Taylor Jungmann', 'Brandon Belt', 'Chance Ruffin',
      ],
      narrative: `Augie Garrido was not a Longhorn. He had never played for Texas, never coached under Disch or Falk or Gustafson. He came from Cal State Fullerton with three national titles already on his resume and a philosophy that sounded nothing like the old-school fundamentalism that had defined Texas baseball for 86 years.

Garrido talked about process over outcome. About living in the moment. About mental toughness as a trainable skill, not an inherited trait. In a program that had run on fundamentalism for 86 years, a philosopher-coach was a foreign object. It took two seasons for the antibodies to stop fighting and one freshman from Westlake High School to end the argument permanently.

The 2002 national championship is the single greatest closer performance in CWS history. Garrido, the program's first outsider in 86 years, won his first Texas title with the most Texas-bloodline closer imaginable. Huston Street — son of a former Longhorn football player, raised ten miles from Disch-Falk Field — saved all four games of Texas's undefeated CWS run as a freshman. Four games, four saves, in Omaha. Sports Illustrated put him on the cover. Street earned MOP honors and entered the conversation as one of the best closers the college game had ever produced.

Texas came back in 2004 and reached the CWS finals before falling to Cal State Fullerton — Garrido's former program, in a narrative twist that Hollywood would reject as too obvious. Then in 2005, Texas won it all again. The Longhorns opened the year ranked No. 1, swept No. 5 Stanford in February, and went 5-0 through Omaha. The tournament MOP was David Maroul — a senior third baseman who hit .251 in the regular season and .500 in Omaha, with two home runs and eight RBI across five games. The player no one was watching in March was the player who mattered most in June. That is the through-line in miniature: the system produces the right answer at the right moment. Texas's sixth national title, and Garrido had done what the skeptics said an outsider couldn't: he had kept the through-line alive while adding his own vocabulary to the program's language.

But the final years were painful. From 2011 to 2016, the program declined. Garrido was aging, the game was changing around him, and the recruiting pipeline that had once been self-sustaining needed more active management than the program was providing. He was removed after the 2016 season — a necessary decision handled with the grace that the man deserved.

Garrido died in 2018. Richard Linklater's 2008 documentary "Inning by Inning: A Portrait of a Coach" captures what made him singular: not the wins, but the way he thought about competition as a vehicle for self-knowledge. He brought something to Texas that the program had never had — a language for the interior life of an athlete. The standard remained. The vocabulary expanded.`,
      pullQuote: 'He brought something to Texas that the program had never had — a language for the interior life of an athlete.',
      image: '/images/texas-history/augie-garrido-portrait.webp',
      imageAlt: 'Coach Augie Garrido — Texas baseball, 1997-2016',
    },
    {
      name: 'David Pierce',
      years: '2017–2024',
      record: '297-162 (.647)',
      titles: 0,
      cwsAppearances: 3,
      keyPlayers: ['Ivan Melendez', 'Ty Madden', 'Pete Hansen', 'Cam Williams', 'Eric Kennedy'],
      narrative: `David Pierce inherited a program in transition and did what was needed: he rebuilt the infrastructure. Recruiting improved. The pitching development pipeline, which had gone stale in Garrido's final years, started producing arms again. The results followed, slowly at first, then all at once.

The 2021 College World Series run was the most emotionally charged Texas baseball moment in a generation. Ivan Melendez, who would go on to win the Golden Spikes Award the following year, was already emerging as the most dangerous bat in college baseball. Texas eliminated Tennessee 8-4, then fought Mississippi State in a semifinal that still haunts Longhorn fans — a walk-off loss that ended the season one game short of the championship round.

Melendez's 2022 season was historic: 32 home runs, a Golden Spikes Award, and a run to the CWS that proved 2021 was not a fluke. Pierce had rebuilt the program into a legitimate annual contender. The problem was that "contender" is not "champion," and at Texas the distinction matters.

Pierce was fired after the 2024 season. The program had improved under his watch — three CWS appearances, multiple SEC-caliber rosters, a Golden Spikes winner. At most programs, that resume buys you a decade. At Texas, it buys you a conversation about why you haven't won a title yet. The standard is the standard.`,
      pullQuote: 'At most programs, that resume buys you a decade. At Texas, it buys you a conversation about why you haven\'t won a title yet.',
    },
    {
      name: 'Jim Schlossnagle',
      years: '2024–Present',
      record: '60-18 (.769)*',
      titles: 0,
      cwsAppearances: 1,
      keyPlayers: ['Jared Thomas', 'Charlie Hurley', 'Lucas Gordon'],
      narrative: `Jim Schlossnagle's hiring was the most controversial moment in Texas baseball since Gustafson's departure. He left Texas A&M immediately after coaching the Aggies to the 2024 CWS finals — a move that Aggie fans viewed as betrayal and Longhorn fans viewed with skepticism. You don't poach a man from your rival and assume loyalty comes free.

Schlossnagle responded the only way that matters in Austin: he won. Texas won the SEC regular-season championship in Schlossnagle's first year, going 22-8 in the nation's toughest conference. The Longhorns finished 44-14 overall and reached the postseason as a national seed.

The 2026 season opened at 16-0 — the best start in modern program history. A .340 team batting average. A 1.36 team ERA. The roster is deep, the pitching staff is dominant, and the culture has clicked faster than anyone outside the program expected.

What Schlossnagle represents is a different kind of continuity. He is not a product of the Texas coaching tree. He is a proven winner who understood, from his first day, that the standard at Texas is not something you build toward — it is something you walk into and either meet or don't. He met it.

*Record through March 13, 2026`,
    },
  ],

  // ── Championships ─────────────────────────────────────────────────
  championships: [
    {
      year: 1949,
      record: '23-7',
      mop: 'Tom Hamilton',
      titleGameOpponent: 'Wake Forest',
      titleGameScore: '10-3',
      narrative: 'The first national championship in the history of any University of Texas sport. Tom Hamilton hit three home runs in the CWS, earning Most Outstanding Player honors and establishing Texas as a national power.',
    },
    {
      year: 1950,
      record: '27-6',
      mop: 'Jim Ehrler',
      titleGameOpponent: 'Washington State',
      titleGameScore: '3-0',
      narrative: 'Back-to-back. Jim Ehrler threw a complete-game shutout in the championship final. Texas became the first program to win consecutive CWS titles, a feat that would not be repeated for over a decade.',
    },
    {
      year: 1975,
      record: '59-6',
      mop: 'Mickey Reichenbach',
      titleGameOpponent: 'South Carolina',
      titleGameScore: '5-1',
      narrative: 'The greatest season in college baseball history by winning percentage (.908). Jim Gideon went 17-0. The Longhorns lost six games all year and made the rest of the country look like a different sport.',
      image: '/images/texas-history/texas-1975-team.webp',
      imageAlt: '1975 Texas Longhorns — 59-6, national champions',
    },
    {
      year: 1983,
      record: '66-14',
      mop: 'Calvin Schiraldi',
      titleGameOpponent: 'Alabama',
      titleGameScore: '4-3',
      narrative: 'Roger Clemens threw a complete game to clinch the title. Calvin Schiraldi earned MOP. Within two years, both would be in the major leagues. This team was a professional pitching staff moonlighting as college students.',
      image: '/images/texas-history/texas-1983-cws.jpg',
      imageAlt: '1983 Texas Longhorns CWS championship',
    },
    {
      year: 2002,
      record: '57-15',
      mop: 'Huston Street',
      titleGameOpponent: 'South Carolina',
      titleGameScore: '12-6',
      narrative: 'Huston Street saved all four CWS games as a freshman — the most dominant closer performance in CWS history. Texas went undefeated in Omaha. Garrido\'s first Texas title silenced every critic who said an outsider couldn\'t win here.',
      image: '/images/texas-history/texas-2002-tower.jpg',
      imageAlt: '2002 Texas Longhorns celebrate at the Tower',
    },
    {
      year: 2005,
      record: '56-16',
      mop: 'David Maroul',
      titleGameOpponent: 'Florida',
      titleGameScore: '6-2',
      narrative: 'Texas went 5-0 in Omaha. Maroul hit .500 across the CWS (8-for-16, 2 HR, 8 RBI) after a modest regular season — the fifth third baseman in CWS history to earn MOP. Kyle McCulloch struck out 8 in the clincher. Sixth national title. Garrido proved 2002 was a program, not a moment.',
      image: '/images/texas-history/texas-2005-tower.jpg',
      imageAlt: '2005 Texas Longhorns celebrate sixth national title at the Tower',
    },
  ],

  // ── Iconic Players ────────────────────────────────────────────────
  iconicPlayers: [
    {
      name: 'Burt Hooton',
      number: '20',
      years: '1969–1971',
      position: 'RHP',
      headline: 'The man with the 1.14 career ERA',
      stats: '35-3, 1.14 ERA, 386 K, no-hitter in 1971 SWC tournament',
      retired: true,
    },
    {
      name: 'Roger Clemens',
      number: '21',
      years: '1982–1983',
      position: 'RHP',
      headline: 'From Austin to seven Cy Youngs',
      stats: '25-7, 3.04 ERA, 241 K. CG to clinch 1983 title',
      retired: true,
      image: '/images/texas-history/roger-clemens-pitching.png',
    },
    {
      name: 'Jim Gideon',
      number: '21',
      years: '1974–1976',
      position: 'RHP',
      headline: '17-0 in the greatest season ever played',
      stats: '40+ career wins, 17-0 in 1975 championship season',
      retired: true,
    },
    {
      name: 'Brooks Kieschnick',
      number: '23',
      years: '1991–1993',
      position: 'P/OF',
      headline: 'The original two-way player',
      stats: '2x National Player of the Year. .360/.676, 43 HR, 8.07 K/9',
      retired: true,
    },
    {
      name: 'Greg Swindell',
      number: '24',
      years: '1984–1986',
      position: 'LHP',
      headline: '501 career strikeouts — the program record',
      stats: '43-8, 1.92 ERA, 501 K. 2nd overall pick, 1986 MLB Draft',
      retired: true,
    },
    {
      name: 'Scott Bryant',
      number: '25',
      years: '1993–1996',
      position: '1B/OF',
      headline: 'One of the most productive bats in program history',
      stats: '.353 career BA, 33 HR, 181 RBI. All-American',
      retired: true,
    },
    {
      name: 'Huston Street',
      number: '25',
      years: '2002–2004',
      position: 'RHP/Closer',
      headline: 'Four saves in four CWS games — as a freshman',
      stats: '2002 CWS MOP. 26 career saves. 1.58 ERA in 2002',
      retired: true,
    },
    {
      name: 'Ivan Melendez',
      years: '2020–2022',
      position: '1B/DH',
      headline: 'The Hispanic Titanic — Golden Spikes Award winner',
      stats: '.387/.508/.863, 32 HR in 2022. Golden Spikes Award',
      retired: false,
    },
    {
      name: 'Tom Hamilton',
      years: '1948–1949',
      position: 'OF',
      headline: 'Three home runs in the first CWS title',
      stats: '1949 CWS MOP. 3 HR in Omaha. Established Texas on the national stage',
      retired: false,
    },
  ],

  // ── Stadium ───────────────────────────────────────────────────────
  stadiumNarrative: `UFCU Disch-Falk Field is named for the first two coaches because naming it for one would have been an insult to the other. The hyphen tells the story: two men, one standard, one unbroken line.

The stadium seats 7,273 and regularly exceeds that for marquee SEC matchups. It sits on the east side of the UT campus, tucked between the LBJ Library and the law school, a geography that places baseball between presidential history and constitutional scholarship. Whether that proximity is accident or inevitability depends on how long you've watched this program.

The buses beyond the right-field wall are a Texas baseball signature. Parked along the road behind the outfield fence, they provide an elevated vantage point for fans who either couldn't get tickets or prefer the informality of tailgate-adjacent viewing. On a warm Friday night in April, the buses, the limestone, the burnt-orange crowd, and the Austin skyline beyond create an atmosphere that no other college baseball venue can replicate.

The field has hosted 38 NCAA Regional rounds. The home winning percentage is absurd — Texas has historically lost at Disch-Falk about as often as most programs lose at home and on the road combined. Visiting teams walk into an environment that communicates, without saying a word, that the Longhorns expect to win and that expectation is structural, not aspirational.

Three coaches are honored by name in this building. The standard they set echoes every time the public address system calls out the starting lineups and 7,000 people stand in a venue built on the foundation of 141 years of continuous excellence.`,

  // ── Culture ───────────────────────────────────────────────────────
  cultureNarrative: `The defining characteristic of Texas baseball is not talent. It is transmission.

Programs with talent win titles. Programs with culture win eras. Texas has done both, but the culture is the load-bearing wall. Talent rotates. Culture compounds.

Four head coaches in 105 years (1911–2016), each a product of the one before. That is not a coaching tree. That is a root system. Each successor grew up inside the program, absorbed its values through experience rather than orientation, and carried forward a set of non-negotiable expectations about what it means to wear the burnt orange.

The expectations are simple but absolute: compete every pitch, respect the game's fundamentals, represent the university with discipline, and treat a trip to Omaha as the baseline, not the ceiling. These are not posted on a locker room wall. They are transmitted through behavior — through thousands of practice repetitions, through the way older players carry themselves around freshmen, through the quiet understanding that this program has been winning since before your grandparents were born and intends to keep winning long after you leave.

The visible symbols — the hand sign, the burnt orange, the fight song — are props. The culture is what happens at 6:30 AM on a February Tuesday when the freshmen are watching how the seniors treat an error in practice. That behavior is not posted on a locker room wall. It is transmitted, year after year, by people who absorbed it from people who absorbed it from people who played for Disch. Good programs have hot streaks. Texas has a standard.

This is why the SEC transition, which some framed as an existential challenge, was really just a calibration. Texas didn't join the SEC to prove it could compete. Texas joined the SEC because the SEC was where the competition was. The standard demanded nothing less.`,

  // ── CWS Appearances ───────────────────────────────────────────────
  cwsAppearances: [
    1949, 1950, 1953, 1957, 1960, 1962, 1963, 1965, 1966, 1967,
    1968, 1969, 1970, 1972, 1974, 1975, 1976, 1979, 1980, 1981,
    1983, 1984, 1985, 1986, 1987, 1989, 1991, 1992, 1993, 1994,
    2000, 2002, 2003, 2004, 2005, 2009, 2021, 2022,
  ],

  // ── By the Numbers ────────────────────────────────────────────────
  programRecords: [
    { label: 'All-Time Wins', value: '3,834+', context: 'Most in D-I history' },
    { label: 'Win Percentage', value: '.724', context: 'Highest in D-I history' },
    { label: 'CWS Appearances', value: '38', context: 'Most in D-I history' },
    { label: 'CWS Wins', value: '88', context: 'Most in D-I history' },
    { label: 'National Titles', value: '6', context: '1949, 1950, 1975, 1983, 2002, 2005' },
    { label: 'Conference Titles', value: '81', context: 'SWC + Big 12 + SEC' },
    { label: 'MLB Draft Picks', value: '350+', context: 'All-time' },
    { label: 'First-Round Picks', value: '28', context: 'Including #1 overall' },
    { label: 'First Season', value: '1885', context: '141 years of baseball' },
    { label: 'Retired Numbers', value: '6', context: '#20 Hooton, #21 Clemens, #23 Kieschnick, #25 Street/Bryant, #26 Jungmann, #34' },
    { label: 'NCAA Regionals Hosted', value: '38', context: 'At Disch-Falk Field' },
    { label: 'Head Coaches (1911-2016)', value: '3', context: 'Each played for his predecessor' },
  ],

  // ── Media ─────────────────────────────────────────────────────────
  mediaEmbeds: [
    {
      type: 'youtube',
      id: 'iQv5duBabbs',
      url: 'https://www.youtube.com/embed/iQv5duBabbs',
      title: 'Texas Longhorns Baseball — The Full Story',
      placement: 'Program overview',
    },
    {
      type: 'youtube',
      id: 'm8XwcBEIzDo',
      url: 'https://www.youtube.com/embed/m8XwcBEIzDo',
      title: 'Texas Baseball Highlights',
      placement: 'Highlight reel',
    },
    {
      type: 'youtube',
      id: 'jICvEEqOtEg',
      url: 'https://www.youtube.com/embed/jICvEEqOtEg',
      title: 'Texas Longhorns — Championship Moments',
      placement: 'Championships section',
    },
    {
      type: 'instagram',
      url: 'https://www.instagram.com/p/Cm64T76OKyc/',
      title: 'Roger Clemens — Texas #21',
      placement: 'Clemens / Gustafson era',
    },
    {
      type: 'link',
      url: 'https://www.ncaa.com/video/baseball/2023-01-11/roger-clemens-pitches-1983-college-world-series-clincher',
      title: 'Roger Clemens pitches 1983 CWS clincher',
      placement: 'Gustafson era / 1983 championship',
    },
    {
      type: 'link',
      url: 'https://www.ncaa.com/video/baseball/2021-06-25/texas-defeats-mississippi-state-8-5-forces-additional-game-cws-semifinals',
      title: 'Texas defeats Mississippi State 8-5 (Melendez HR)',
      placement: 'Pierce era / 2021 CWS',
    },
    {
      type: 'link',
      url: 'https://www.ncaa.com/video/baseball/2021-06-22/texas-eliminates-tennessee-8-4-win-college-world-series',
      title: 'Texas eliminates Tennessee 8-4 in CWS',
      placement: 'Pierce era / 2021 CWS',
    },
    {
      type: 'link',
      url: 'https://www.ncaa.com/video/baseball/2022-06-19/texas-am-vs-texas-2022-mens-college-world-series-highlights',
      title: 'Texas A&M vs Texas: 2022 CWS highlights',
      placement: 'Pierce era / 2022 CWS',
    },
    {
      type: 'link',
      url: 'https://www.imdb.com/title/tt1226229/',
      title: 'Inning by Inning: A Portrait of a Coach (2008) — Linklater documentary on Garrido',
      placement: 'Garrido era reference',
    },
  ],

  // ── Closing Narrative ─────────────────────────────────────────────
  closingNarrative: `The easy story about Texas baseball is the one with the trophies. Six titles, 38 trips to Omaha, more wins than anyone. That story is true, and it is boring in its completeness. Every program history reads the same when it leads with numbers.

The harder story — the one worth telling — is about maintenance. Anyone can build something excellent. The question that separates Texas from every other program in college baseball is this: can you maintain excellence across 141 years, three centuries, two conferences, a sport that most of America ignored for the first hundred of those years, and a culture that turns over its entire roster every four seasons?

The answer, proven across every decade since the 1880s, is yes — but only if the transmission of culture is treated as seriously as the recruitment of talent. Disch built it. Falk proved it could survive one succession. Gustafson proved it could survive two. Garrido proved it could survive an outsider. Pierce proved the standard outlasts even successful coaches. Schlossnagle is proving it can survive a conference transition.

The through-line is not a metaphor. It is a structural feature of the program — as real as the limestone on campus, as durable as the burnt orange on the jerseys, and as unforgiving as a Friday night crowd at Disch-Falk that expects you to earn the right to wear it.

Texas baseball is 141 years old. It has never stopped competing. It has never stopped winning. But the more interesting question — the one no one in college athletics has satisfactorily answered — is how. Not how they recruited better, or spent more, or hired smarter. How a program maintained a non-negotiable standard across three centuries, two conferences, and a sport the country barely noticed for the first hundred of those years.

The answer is that they treated cultural transmission as infrastructure. Not motivation. Not branding. Infrastructure — as real and as load-bearing as the limestone on the campus and the concrete under UFCU Disch-Falk Field. Every program in college baseball is watching what Jim Schlossnagle does with what he inherited. Most of them are hoping for the talent. None of them have figured out how to replicate the root system.`,

  // ── Related Links ─────────────────────────────────────────────────
  relatedLinks: [
    { label: 'Texas 2026 Season Preview', href: '/college-baseball/editorial/texas-2026' },
    { label: 'College Baseball Hub', href: '/college-baseball' },
    { label: 'BSI Savant', href: '/college-baseball/savant' },
  ],
};

export default function TexasHistoryPage() {
  return (
    <>
      <ArticleJsonLd {...editorialJsonLdProps(seoConfig)} />
      <ProgramHistoryFeature data={data} />
    </>
  );
}
