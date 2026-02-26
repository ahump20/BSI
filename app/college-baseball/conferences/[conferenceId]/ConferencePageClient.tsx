'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { preseason2026 } from '@/lib/data/preseason-2026';
import {
  Trophy,
  Users,
  TrendingUp,
  MapPin,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';
import { withAlpha } from '@/lib/utils/color';

// Conference data with full team rosters
const conferenceData: Record<
  string,
  {
    id: string;
    name: string;
    fullName: string;
    description: string;
    region: string;
    storylines: string[];
    teams: Array<{
      name: string;
      mascot: string;
      slug?: string;
      rank: number | null;
      previousRank: number | null;
      keyPlayer?: string;
      previewNote?: string;
    }>;
  }
> = {
  sec: {
    id: 'sec',
    name: 'SEC',
    fullName: 'Southeastern Conference',
    description:
      'The deepest conference in college baseball just got deeper. Texas and Texas A&M joined for 2024-25, bringing Omaha pedigree and a historic rivalry to the SEC schedule. LSU, Tennessee, and Vanderbilt remain annual threats, while Arkansas and Ole Miss reload with top recruiting classes.',
    region: 'South',
    storylines: [
      'Texas enters as preseason #1 after a loaded transfer portal haul and returning ace Lucas Gordon',
      'Texas A&M (#2) brings back most of its CWS roster plus elite freshmen',
      'The Lone Star rivalry comes to SEC play—three games in College Station, three in Austin',
      'Tennessee rebuilding pitching staff after losing 4 arms to the draft',
      "LSU's three-peat hopes rest on whether the offense can match 2023-24 production",
    ],
    teams: [
      {
        name: 'Texas',
        mascot: 'Longhorns',
        slug: 'texas',
        rank: 1,
        previousRank: null,
        keyPlayer: 'Lucas Gordon, RHP',
        previewNote: 'Preseason #1 with elite pitching depth and portal additions',
      },
      {
        name: 'Texas A&M',
        mascot: 'Aggies',
        slug: 'texas-am',
        rank: 2,
        previousRank: null,
        keyPlayer: 'Gavin Grahovac, C',
        previewNote: 'CWS experience plus top-5 recruiting class',
      },
      {
        name: 'Tennessee',
        mascot: 'Volunteers',
        slug: 'tennessee',
        rank: 10,
        previousRank: null,
        keyPlayer: 'Christian Moore, 2B',
        previewNote: 'Rebuilding rotation but lineup remains dangerous',
      },
      {
        name: 'LSU',
        mascot: 'Tigers',
        slug: 'lsu',
        rank: 14,
        previousRank: null,
        keyPlayer: 'Tommy White, 1B',
        previewNote: 'Offense-first approach with new pitching staff',
      },
      {
        name: 'Vanderbilt',
        mascot: 'Commodores',
        slug: 'vanderbilt',
        rank: null,
        previousRank: null,
        previewNote: 'Tim Corbin reloads with elite pitching prospects',
      },
      {
        name: 'Arkansas',
        mascot: 'Razorbacks',
        slug: 'arkansas',
        rank: null,
        previousRank: null,
        previewNote: 'Dave Van Horn always contends—watch for second-half surge',
      },
      {
        name: 'Ole Miss',
        mascot: 'Rebels',
        slug: 'ole-miss',
        rank: null,
        previousRank: null,
        previewNote: 'Young roster with upside',
      },
      {
        name: 'Florida',
        mascot: 'Gators',
        slug: 'florida',
        rank: null,
        previousRank: null,
        previewNote: "Kevin O'Sullivan in rebuild mode after departures",
      },
      {
        name: 'Georgia',
        mascot: 'Bulldogs',
        slug: 'georgia',
        rank: null,
        previousRank: null,
        previewNote: 'Competitive in SEC East',
      },
      {
        name: 'South Carolina',
        mascot: 'Gamecocks',
        slug: 'south-carolina',
        rank: null,
        previousRank: null,
        previewNote: 'Monte Lee building toward contention',
      },
      {
        name: 'Kentucky',
        mascot: 'Wildcats',
        slug: 'kentucky',
        rank: null,
        previousRank: null,
        previewNote: 'Improving program under Nick Mingione',
      },
      {
        name: 'Auburn',
        mascot: 'Tigers',
        slug: 'auburn',
        rank: null,
        previousRank: null,
        previewNote: 'Sonny DiChiara era begins in earnest',
      },
      {
        name: 'Missouri',
        mascot: 'Tigers',
        slug: 'missouri',
        rank: null,
        previousRank: null,
        previewNote: 'Building toward SEC competitiveness',
      },
      {
        name: 'Mississippi State',
        mascot: 'Bulldogs',
        slug: 'mississippi-state',
        rank: null,
        previousRank: null,
        previewNote: 'Chris Lemonis looking to bounce back',
      },
      {
        name: 'Alabama',
        mascot: 'Crimson Tide',
        slug: 'alabama',
        rank: null,
        previousRank: null,
        previewNote: 'Rob Vaughn building the program',
      },
      {
        name: 'Oklahoma',
        mascot: 'Sooners',
        slug: 'oklahoma',
        rank: null,
        previousRank: null,
        previewNote: 'First year in SEC—adjustment season expected',
      },
    ],
  },
  acc: {
    id: 'acc',
    name: 'ACC',
    fullName: 'Atlantic Coast Conference',
    description:
      'Expansion transformed the ACC into the deepest conference in the country by sheer numbers. Stanford, Cal, and SMU joined Wake Forest, Florida State, and North Carolina—the league now features 15 ranked teams in the preseason Top 25. The ACC Tournament in Charlotte will be a bloodbath.',
    region: 'East Coast (expanded)',
    storylines: [
      'Stanford (#3) joins as immediate title favorite with returning All-Americans',
      'Florida State (#4) returns to form under Link Jarrett after disappointing 2024',
      'NC State (#5) riding momentum from CWS run with experienced roster',
      "Wake Forest proves last year's success wasn't a fluke",
      'Cal and SMU add West Coast and Texas recruiting pipelines to ACC',
    ],
    teams: [
      {
        name: 'Stanford',
        mascot: 'Cardinal',
        slug: 'stanford',
        rank: 3,
        previousRank: null,
        keyPlayer: 'Braden Montgomery, OF',
        previewNote: 'Elite two-way player leads loaded roster',
      },
      {
        name: 'Florida State',
        mascot: 'Seminoles',
        slug: 'florida-state',
        rank: 4,
        previousRank: null,
        keyPlayer: 'James Tibbs III, OF',
        previewNote: 'Back to contender status with veteran core',
      },
      {
        name: 'NC State',
        mascot: 'Wolfpack',
        slug: 'nc-state',
        rank: 5,
        previousRank: null,
        keyPlayer: 'Sam Highfill, LHP',
        previewNote: 'CWS experience makes them dangerous',
      },
      {
        name: 'Clemson',
        mascot: 'Tigers',
        slug: 'clemson',
        rank: 6,
        previousRank: null,
        previewNote: 'Monte Lee has Tigers back in the hunt',
      },
      {
        name: 'North Carolina',
        mascot: 'Tar Heels',
        slug: 'north-carolina',
        rank: 7,
        previousRank: null,
        previewNote: 'Scott Forbes builds another contender',
      },
      {
        name: 'Virginia',
        mascot: 'Cavaliers',
        slug: 'virginia',
        rank: 8,
        previousRank: null,
        keyPlayer: 'Ethan Anderson, SS',
        previewNote: "O'Connor's program keeps rolling",
      },
      {
        name: 'Louisville',
        mascot: 'Cardinals',
        slug: 'louisville',
        rank: 9,
        previousRank: null,
        previewNote: 'Dan McDonnell always fields a contender',
      },
      {
        name: 'Wake Forest',
        mascot: 'Demon Deacons',
        slug: 'wake-forest',
        rank: 11,
        previousRank: null,
        previewNote: 'Breakout season was no fluke',
      },
      {
        name: 'Miami',
        mascot: 'Hurricanes',
        slug: 'miami',
        rank: 17,
        previousRank: null,
        previewNote: 'The U is back in the baseball conversation',
      },
      {
        name: 'Virginia Tech',
        mascot: 'Hokies',
        slug: 'virginia-tech',
        rank: 19,
        previousRank: null,
        previewNote: 'John Szefc has Hokies on the rise',
      },
      {
        name: 'Georgia Tech',
        mascot: 'Yellow Jackets',
        slug: 'georgia-tech',
        rank: 20,
        previousRank: null,
        previewNote: 'Danny Hall gets them in the conversation',
      },
      {
        name: 'Notre Dame',
        mascot: 'Fighting Irish',
        slug: 'notre-dame',
        rank: 21,
        previousRank: null,
        previewNote: 'Link Jarrett II leads Irish into ACC',
      },
      {
        name: 'Cal',
        mascot: 'Golden Bears',
        slug: 'california',
        rank: 22,
        previousRank: null,
        previewNote: 'Mike Neu brings West Coast talent to ACC',
      },
      {
        name: 'SMU',
        mascot: 'Mustangs',
        slug: 'smu',
        rank: 23,
        previousRank: null,
        previewNote: 'Texas talent pipeline now feeds ACC',
      },
      {
        name: 'Duke',
        mascot: 'Blue Devils',
        slug: 'duke',
        rank: 24,
        previousRank: null,
        previewNote: 'Chris Pollard has Duke relevant again',
      },
      {
        name: 'Pittsburgh',
        mascot: 'Panthers',
        slug: 'pittsburgh',
        rank: null,
        previousRank: null,
        previewNote: 'Mike Bell building in Pittsburgh',
      },
      {
        name: 'Boston College',
        mascot: 'Eagles',
        slug: 'boston-college',
        rank: null,
        previousRank: null,
        previewNote: 'Working toward ACC competitiveness',
      },
      {
        name: 'Syracuse',
        mascot: 'Orange',
        slug: 'syracuse',
        rank: null,
        previousRank: null,
        previewNote: 'Building program in cold weather',
      },
    ],
  },
  'big-12': {
    id: 'big-12',
    name: 'Big 12',
    fullName: 'Big 12 Conference',
    description:
      'The Big 12 absorbed UCF, Houston, BYU, and others during realignment, creating a 16-team league with legitimate depth. Oklahoma State leads the way, but Baylor, TCU, and the new additions make this a grind every weekend. Pitching depth defines contenders here.',
    region: 'Central',
    storylines: [
      'Oklahoma State (#12) returns most of its pitching staff for a title run',
      'Baylor (#18) looks to build on momentum under Mitch Thompson',
      'Houston brings AAC dominance to Big 12 competition',
      'TCU reloading after Gary Patterson era winds down',
      'West Virginia becomes the sleeper pick with experienced roster',
    ],
    teams: [
      {
        name: 'Oklahoma State',
        mascot: 'Cowboys',
        slug: 'oklahoma-state',
        rank: 12,
        previousRank: null,
        keyPlayer: 'Aidan Meola, RHP',
        previewNote: 'Deep rotation makes them Big 12 favorites',
      },
      {
        name: 'Baylor',
        mascot: 'Bears',
        slug: 'baylor',
        rank: 18,
        previousRank: null,
        previewNote: 'Mitch Thompson builds contender in Waco',
      },
      {
        name: 'UCF',
        mascot: 'Knights',
        slug: 'ucf',
        rank: 25,
        previousRank: null,
        previewNote: 'Greg Lovelady brings winning culture from AAC',
      },
      {
        name: 'Houston',
        mascot: 'Cougars',
        slug: 'houston',
        rank: null,
        previousRank: null,
        previewNote: 'Todd Whitting adjusts to Big 12 competition',
      },
      {
        name: 'West Virginia',
        mascot: 'Mountaineers',
        slug: 'west-virginia',
        rank: null,
        previousRank: null,
        previewNote: 'Randy Mazey has underrated roster',
      },
      {
        name: 'BYU',
        mascot: 'Cougars',
        slug: 'byu',
        rank: null,
        previousRank: null,
        previewNote: 'First year in power conference—learning curve expected',
      },
      {
        name: 'TCU',
        mascot: 'Horned Frogs',
        slug: 'tcu',
        rank: null,
        previousRank: null,
        previewNote: 'Kirk Saarloos in rebuild after CWS core departed',
      },
      {
        name: 'Kansas State',
        mascot: 'Wildcats',
        slug: 'kansas-state',
        rank: null,
        previousRank: null,
        previewNote: 'Building toward contention',
      },
      {
        name: 'Texas Tech',
        mascot: 'Red Raiders',
        slug: 'texas-tech',
        rank: null,
        previousRank: null,
        previewNote: 'Tim Tadlock reloads after draft losses',
      },
      {
        name: 'Kansas',
        mascot: 'Jayhawks',
        slug: 'kansas',
        rank: null,
        previousRank: null,
        previewNote: 'Working to stay competitive in Big 12',
      },
      {
        name: 'Cincinnati',
        mascot: 'Bearcats',
        slug: 'cincinnati',
        rank: null,
        previousRank: null,
        previewNote: 'Scott Googins adjusts to Big 12 level',
      },
      {
        name: 'Arizona',
        mascot: 'Wildcats',
        slug: 'arizona',
        rank: null,
        previousRank: null,
        previewNote: 'Chip Hale brings Pac-12 experience',
      },
      {
        name: 'Arizona State',
        mascot: 'Sun Devils',
        slug: 'arizona-state',
        rank: null,
        previousRank: null,
        previewNote: 'Willie Bloomquist building in Tempe',
      },
      {
        name: 'Colorado',
        mascot: 'Buffaloes',
        slug: 'colorado',
        rank: null,
        previousRank: null,
        previewNote: 'Adjusting to Big 12 baseball',
      },
      {
        name: 'Utah',
        mascot: 'Utes',
        slug: 'utah',
        rank: null,
        previousRank: null,
        previewNote: 'New to power conference baseball',
      },
      {
        name: 'Iowa State',
        mascot: 'Cyclones',
        slug: 'iowa-state',
        rank: null,
        previousRank: null,
        previewNote: 'Working to establish Big 12 presence',
      },
    ],
  },
  'big-ten': {
    id: 'big-ten',
    name: 'Big Ten',
    fullName: 'Big Ten Conference',
    description:
      'The Big Ten became a true power conference for baseball when USC and UCLA joined in 2024. Neither cracked the preseason Top 25, but both bring recruiting advantages and Pac-12 traditions. Michigan and Indiana remain the established powers, with Maryland and Nebraska rising.',
    region: 'Midwest (expanded)',
    storylines: [
      'USC and UCLA bring West Coast talent and traditions to Big Ten',
      'Michigan looks to reclaim Big Ten supremacy after rebuilding',
      'Indiana remains a threat with consistent program culture',
      "Nebraska's development under Will Bolt continues",
      'Maryland emerging as dark horse with quality pitching',
    ],
    teams: [
      {
        name: 'USC',
        mascot: 'Trojans',
        slug: 'usc',
        rank: null,
        previousRank: null,
        previewNote: 'First year in Big Ten—transition season',
      },
      {
        name: 'UCLA',
        mascot: 'Bruins',
        slug: 'ucla',
        rank: null,
        previousRank: null,
        previewNote: 'John Savage adjusts to Big Ten travel',
      },
      {
        name: 'Michigan',
        mascot: 'Wolverines',
        slug: 'michigan',
        rank: null,
        previousRank: null,
        previewNote: 'Erik Bakich returns program to prominence',
      },
      {
        name: 'Indiana',
        mascot: 'Hoosiers',
        slug: 'indiana',
        rank: null,
        previousRank: null,
        previewNote: 'Jeff Mercer has built a consistent winner',
      },
      {
        name: 'Maryland',
        mascot: 'Terrapins',
        slug: 'maryland',
        rank: null,
        previousRank: null,
        previewNote: 'Matt Swope developing pitching depth',
      },
      {
        name: 'Nebraska',
        mascot: 'Cornhuskers',
        slug: 'nebraska',
        rank: null,
        previousRank: null,
        previewNote: 'Will Bolt builds toward contention',
      },
      {
        name: 'Illinois',
        mascot: 'Fighting Illini',
        slug: 'illinois',
        rank: null,
        previousRank: null,
        previewNote: 'Dan Hartleb works to stay competitive',
      },
      {
        name: 'Ohio State',
        mascot: 'Buckeyes',
        slug: 'ohio-state',
        rank: null,
        previousRank: null,
        previewNote: 'Bill Mosiello in first years at helm',
      },
      {
        name: 'Rutgers',
        mascot: 'Scarlet Knights',
        slug: 'rutgers',
        rank: null,
        previousRank: null,
        previewNote: 'Steve Owens building in New Jersey',
      },
      {
        name: 'Penn State',
        mascot: 'Nittany Lions',
        slug: 'penn-state',
        rank: null,
        previousRank: null,
        previewNote: 'Rob Cooper develops program',
      },
      {
        name: 'Purdue',
        mascot: 'Boilermakers',
        slug: 'purdue',
        rank: null,
        previousRank: null,
        previewNote: 'Greg Goff working toward competitiveness',
      },
      {
        name: 'Northwestern',
        mascot: 'Wildcats',
        slug: 'northwestern',
        rank: null,
        previousRank: null,
        previewNote: 'Jim Foster builds academic-athletic balance',
      },
      {
        name: 'Minnesota',
        mascot: 'Golden Gophers',
        slug: 'minnesota',
        rank: null,
        previousRank: null,
        previewNote: 'John Anderson in his final seasons',
      },
      {
        name: 'Iowa',
        mascot: 'Hawkeyes',
        slug: 'iowa',
        rank: null,
        previousRank: null,
        previewNote: 'Rick Heller builds consistently',
      },
      {
        name: 'Michigan State',
        mascot: 'Spartans',
        slug: 'michigan-state',
        rank: null,
        previousRank: null,
        previewNote: 'Jake Boss Jr. developing program',
      },
      {
        name: 'Wisconsin',
        mascot: 'Badgers',
        slug: 'wisconsin',
        rank: null,
        previousRank: null,
        previewNote: 'Working to establish Big Ten presence',
      },
      {
        name: 'Oregon',
        mascot: 'Ducks',
        slug: 'oregon',
        rank: null,
        previousRank: null,
        previewNote: 'Mark Wasikowski adjusts to Big Ten',
      },
      {
        name: 'Washington',
        mascot: 'Huskies',
        slug: 'washington',
        rank: null,
        previousRank: null,
        previewNote: 'New to Big Ten baseball',
      },
    ],
  },
  'big-east': {
    id: 'big-east',
    name: 'Big East',
    fullName: 'Big East Conference',
    description:
      "The Big East has quietly become one of the best mid-major conferences in college baseball. UConn leads the way after reaching back-to-back regionals, while Creighton, Xavier, and St. John's round out a competitive top tier. The conference produces MLB draft picks annually and regularly earns 2-3 NCAA Tournament bids.",
    region: 'Northeast / Midwest',
    storylines: [
      'UConn (#16) returns as the class of the conference with a veteran pitching staff',
      'Creighton looking to build on 2025 momentum under Ed Servais',
      'Xavier makes the jump after strong second half last season',
      "St. John's brings recruiting firepower from the New York metro area",
      'Villanova working to establish consistent competitiveness',
    ],
    teams: [
      {
        name: 'UConn',
        mascot: 'Huskies',
        slug: 'uconn',
        rank: 16,
        previousRank: null,
        keyPlayer: 'Jarrett Palensky, OF',
        previewNote: 'Back-to-back regional appearances, veteran rotation',
      },
      {
        name: 'Creighton',
        mascot: 'Bluejays',
        slug: 'creighton',
        rank: null,
        previousRank: null,
        previewNote: 'Ed Servais has program trending up',
      },
      {
        name: 'Xavier',
        mascot: 'Musketeers',
        slug: 'xavier',
        rank: null,
        previousRank: null,
        previewNote: 'Strong pitching development program',
      },
      {
        name: "St. John's",
        mascot: 'Red Storm',
        slug: 'st-johns',
        rank: null,
        previousRank: null,
        previewNote: 'NYC metro recruiting advantage',
      },
      {
        name: 'Villanova',
        mascot: 'Wildcats',
        slug: 'villanova',
        rank: null,
        previousRank: null,
        previewNote: 'Building toward Big East competitiveness',
      },
      {
        name: 'Seton Hall',
        mascot: 'Pirates',
        slug: 'seton-hall',
        rank: null,
        previousRank: null,
        previewNote: 'Northeast recruiting presence',
      },
      {
        name: 'Georgetown',
        mascot: 'Hoyas',
        slug: 'georgetown',
        rank: null,
        previousRank: null,
        previewNote: 'Working to improve in Big East',
      },
      {
        name: 'Butler',
        mascot: 'Bulldogs',
        slug: 'butler',
        rank: null,
        previousRank: null,
        previewNote: 'Developing program under Dave Schrage',
      },
    ],
  },
  aac: {
    id: 'aac',
    name: 'AAC',
    fullName: 'American Athletic Conference',
    description:
      'The AAC lost Houston and UCF to the Big 12 but remains dangerous in college baseball. Tulane and East Carolina are perennial NCAA Tournament teams, while Memphis and Wichita State add depth. The conference plays aggressive schedules and consistently punches above its weight in postseason play.',
    region: 'South / Midwest',
    storylines: [
      'Tulane (#15) remains the flagship with elite pitching and Omaha pedigree',
      'East Carolina (#13) looking to return to form after coaching transition',
      "Memphis builds program with Austin Humphrey's hometown connection",
      'Wichita State brings strong regional recruiting in the Great Plains',
      'South Florida emerges as dark horse with improving roster',
    ],
    teams: [
      {
        name: 'East Carolina',
        mascot: 'Pirates',
        slug: 'east-carolina',
        rank: 13,
        previousRank: null,
        keyPlayer: 'Jacob Starling, C',
        previewNote: 'Cliff Godwin has ECU in the hunt annually',
      },
      {
        name: 'Tulane',
        mascot: 'Green Wave',
        slug: 'tulane',
        rank: 15,
        previousRank: null,
        keyPlayer: 'Bennett Lee, OF',
        previewNote: 'Travis Jewett builds on CWS success',
      },
      {
        name: 'Memphis',
        mascot: 'Tigers',
        slug: 'memphis',
        rank: null,
        previousRank: null,
        previewNote: 'Daron Schoenrock developing talent in the Bluff City',
      },
      {
        name: 'Wichita State',
        mascot: 'Shockers',
        slug: 'wichita-state',
        rank: null,
        previousRank: null,
        previewNote: 'Eric Wedge brings MLB experience to Wichita',
      },
      {
        name: 'South Florida',
        mascot: 'Bulls',
        slug: 'south-florida',
        rank: null,
        previousRank: null,
        previewNote: 'Billy Mohl builds in Tampa Bay area',
      },
      {
        name: 'Charlotte',
        mascot: '49ers',
        slug: 'charlotte',
        rank: null,
        previousRank: null,
        previewNote: 'Robert Woodard develops program',
      },
      {
        name: 'Tulsa',
        mascot: 'Golden Hurricane',
        rank: null,
        previousRank: null,
        previewNote: 'Working toward AAC competitiveness',
      },
      {
        name: 'Rice',
        mascot: 'Owls',
        slug: 'rice',
        rank: null,
        previousRank: null,
        previewNote: 'Jose Cruz Jr. rebuilding storied program',
      },
      {
        name: 'UTSA',
        mascot: 'Roadrunners',
        slug: 'utsa',
        rank: null,
        previousRank: null,
        previewNote: 'Building in San Antonio market',
      },
      {
        name: 'North Texas',
        mascot: 'Mean Green',
        rank: null,
        previousRank: null,
        previewNote: 'Developing program in DFW area',
      },
    ],
  },
  'sun-belt': {
    id: 'sun-belt',
    name: 'Sun Belt',
    fullName: 'Sun Belt Conference',
    description:
      "The Sun Belt has become a legitimate power conference for baseball. Coastal Carolina's 2016 national championship proved the league could compete at the highest level. Louisiana, South Alabama, and App State field consistently competitive programs with strong regional recruiting pipelines.",
    region: 'South',
    storylines: [
      'Louisiana leads the way with Gary Guidry building a perennial contender',
      'Coastal Carolina looks to recapture championship magic',
      'South Alabama emerges as dark horse with experienced roster',
      'App State brings competitive culture from football success',
      'Southern Miss provides strong Mississippi recruiting presence',
    ],
    teams: [
      {
        name: 'Louisiana',
        mascot: "Ragin' Cajuns",
        slug: 'louisiana',
        rank: null,
        previousRank: null,
        keyPlayer: 'Ben Bedrencuk, RHP',
        previewNote: 'Gary Guidry keeps Cajuns in the hunt',
      },
      {
        name: 'Coastal Carolina',
        mascot: 'Chanticleers',
        slug: 'coastal-carolina',
        rank: null,
        previousRank: null,
        previewNote: '2016 champs remain competitive',
      },
      {
        name: 'South Alabama',
        mascot: 'Jaguars',
        slug: 'south-alabama',
        rank: null,
        previousRank: null,
        previewNote: 'Mark Calvi develops Gulf Coast talent',
      },
      {
        name: 'Southern Miss',
        mascot: 'Golden Eagles',
        slug: 'southern-miss',
        rank: null,
        previousRank: null,
        previewNote: 'Scott Berry builds strong program',
      },
      {
        name: 'App State',
        mascot: 'Mountaineers',
        slug: 'app-state',
        rank: null,
        previousRank: null,
        previewNote: 'Kermit Smith brings winning culture',
      },
      {
        name: 'Georgia Southern',
        mascot: 'Eagles',
        slug: 'georgia-southern',
        rank: null,
        previousRank: null,
        previewNote: 'Building in Southeast Georgia',
      },
      {
        name: 'Texas State',
        mascot: 'Bobcats',
        slug: 'texas-state',
        rank: null,
        previousRank: null,
        previewNote: 'Steven Trout develops Texas talent',
      },
      {
        name: 'Arkansas State',
        mascot: 'Red Wolves',
        slug: 'arkansas-state',
        rank: null,
        previousRank: null,
        previewNote: 'Working toward Sun Belt contention',
      },
      {
        name: 'Troy',
        mascot: 'Trojans',
        slug: 'troy',
        rank: null,
        previousRank: null,
        previewNote: 'Mark Smartt builds Alabama program',
      },
      {
        name: 'Georgia State',
        mascot: 'Panthers',
        slug: 'georgia-state',
        rank: null,
        previousRank: null,
        previewNote: 'Atlanta metro recruiting advantage',
      },
    ],
  },
  'mountain-west': {
    id: 'mountain-west',
    name: 'Mountain West',
    fullName: 'Mountain West Conference',
    description:
      'The Mountain West lost San Diego State and Fresno State in realignment but retains competitive programs. Nevada, San Jose State, and UNLV lead the conference. Regional recruiting in California and the Southwest provides a solid talent base, though the conference fights for NCAA Tournament bids.',
    region: 'West',
    storylines: [
      'Nevada looks to emerge as conference leader after departures',
      'San Jose State benefits from Bay Area recruiting',
      'UNLV brings strong Vegas recruiting presence',
      'Air Force offers unique military academy baseball experience',
      'Conference adjusts after losing marquee programs in realignment',
    ],
    teams: [
      {
        name: 'Nevada',
        mascot: 'Wolf Pack',
        slug: 'nevada',
        rank: null,
        previousRank: null,
        previewNote: 'T.J. Bruce builds in Reno',
      },
      {
        name: 'San Jose State',
        mascot: 'Spartans',
        slug: 'san-jose-state',
        rank: null,
        previousRank: null,
        previewNote: 'Bay Area recruiting advantage',
      },
      {
        name: 'UNLV',
        mascot: 'Rebels',
        slug: 'unlv',
        rank: null,
        previousRank: null,
        previewNote: 'Vegas market builds program',
      },
      {
        name: 'Air Force',
        mascot: 'Falcons',
        slug: 'air-force',
        rank: null,
        previousRank: null,
        previewNote: 'Military academy baseball tradition',
      },
      {
        name: 'New Mexico',
        mascot: 'Lobos',
        slug: 'new-mexico',
        rank: null,
        previousRank: null,
        previewNote: 'Building in Albuquerque',
      },
      {
        name: 'Utah State',
        mascot: 'Aggies',
        rank: null,
        previousRank: null,
        previewNote: 'Working toward MWC competitiveness',
      },
    ],
  },
  'c-usa': {
    id: 'c-usa',
    name: 'C-USA',
    fullName: 'Conference USA',
    description:
      'Conference USA has been reshaped by realignment but maintains competitive baseball. Middle Tennessee and Louisiana Tech lead the way, with strong regional recruiting in the South and Midwest. The conference regularly produces NCAA Tournament teams and MLB draft picks.',
    region: 'South / Midwest',
    storylines: [
      'Middle Tennessee returns as conference favorite under Jim McGuire',
      'Louisiana Tech builds on strong 2025 showing',
      'FIU benefits from South Florida recruiting',
      'Conference identity stabilizes after realignment',
      'Liberty brings competitive culture from Big South days',
    ],
    teams: [
      {
        name: 'Middle Tennessee',
        mascot: 'Blue Raiders',
        slug: 'middle-tennessee',
        rank: null,
        previousRank: null,
        previewNote: 'Jim McGuire builds consistent contender',
      },
      {
        name: 'Louisiana Tech',
        mascot: 'Bulldogs',
        slug: 'louisiana-tech',
        rank: null,
        previousRank: null,
        previewNote: 'Lane Burroughs develops Louisiana talent',
      },
      {
        name: 'FIU',
        mascot: 'Panthers',
        slug: 'fiu',
        rank: null,
        previousRank: null,
        previewNote: 'South Florida recruiting pipeline',
      },
      {
        name: 'Liberty',
        mascot: 'Flames',
        slug: 'liberty',
        rank: null,
        previousRank: null,
        previewNote: 'Scott Jackson builds competitive program',
      },
      {
        name: 'Jacksonville State',
        mascot: 'Gamecocks',
        slug: 'jax-state',
        rank: null,
        previousRank: null,
        previewNote: 'Alabama recruiting presence',
      },
      {
        name: 'New Mexico State',
        mascot: 'Aggies',
        slug: 'new-mexico-state',
        rank: null,
        previousRank: null,
        previewNote: 'Mike Kirby builds in Las Cruces',
      },
      {
        name: 'Sam Houston',
        mascot: 'Bearkats',
        slug: 'sam-houston',
        rank: null,
        previousRank: null,
        previewNote: 'Jay Sirianni develops Texas talent',
      },
      {
        name: 'UTEP',
        mascot: 'Miners',
        rank: null,
        previousRank: null,
        previewNote: 'Building program in El Paso',
      },
    ],
  },
  'a-10': {
    id: 'a-10',
    name: 'A-10',
    fullName: 'Atlantic 10 Conference',
    description:
      'The Atlantic 10 is a strong northeastern mid-major conference. VCU leads the way with consistent NCAA Tournament appearances, while Davidson and George Mason provide competitive depth. The conference benefits from strong academics and solid regional recruiting.',
    region: 'Northeast / Mid-Atlantic',
    storylines: [
      'VCU remains the class of the conference under Shawn Stiffler',
      'Davidson brings strong academics and competitive baseball',
      'George Mason emerges as dark horse in the A-10',
      'Conference builds reputation as solid northeastern league',
      'Regional recruiting competes with Big East and Colonial',
    ],
    teams: [
      {
        name: 'VCU',
        mascot: 'Rams',
        slug: 'vcu',
        rank: null,
        previousRank: null,
        keyPlayer: 'Tyler Locklear, 3B',
        previewNote: 'Shawn Stiffler builds consistent winner',
      },
      {
        name: 'Davidson',
        mascot: 'Wildcats',
        slug: 'davidson',
        rank: null,
        previousRank: null,
        previewNote: 'Rucker Taylor develops talent in North Carolina',
      },
      {
        name: 'George Mason',
        mascot: 'Patriots',
        slug: 'george-mason',
        rank: null,
        previousRank: null,
        previewNote: 'Bill Brown builds in Northern Virginia',
      },
      {
        name: 'Saint Louis',
        mascot: 'Billikens',
        slug: 'saint-louis',
        rank: null,
        previousRank: null,
        previewNote: 'Darin Hendrickson develops Midwest talent',
      },
      {
        name: 'Dayton',
        mascot: 'Flyers',
        slug: 'dayton',
        rank: null,
        previousRank: null,
        previewNote: 'Building program in Ohio',
      },
      {
        name: 'Rhode Island',
        mascot: 'Rams',
        slug: 'rhode-island',
        rank: null,
        previousRank: null,
        previewNote: 'Northeast recruiting presence',
      },
      {
        name: 'George Washington',
        mascot: 'Revolutionaries',
        slug: 'george-washington',
        rank: null,
        previousRank: null,
        previewNote: 'D.C. area recruiting advantage',
      },
      {
        name: 'La Salle',
        mascot: 'Explorers',
        slug: 'la-salle',
        rank: null,
        previousRank: null,
        previewNote: 'Philadelphia metro recruiting',
      },
    ],
  },
  colonial: {
    id: 'colonial',
    name: 'Colonial',
    fullName: 'Colonial Athletic Association',
    description:
      'The CAA has become a legitimate mid-major baseball conference. UNC Wilmington and Northeastern lead the way with strong regional recruiting. The conference regularly produces NCAA Tournament teams and has sent multiple players to the MLB Draft in recent years.',
    region: 'East Coast',
    storylines: [
      'UNC Wilmington leads the way with Randy Hood at the helm',
      'Northeastern benefits from New England recruiting',
      'Charleston looks to build on recent success',
      'Conference identity strengthens as baseball power',
      'East Coast location provides recruiting advantages',
    ],
    teams: [
      {
        name: 'UNC Wilmington',
        mascot: 'Seahawks',
        slug: 'unc-wilmington',
        rank: null,
        previousRank: null,
        previewNote: 'Randy Hood builds consistent contender',
      },
      {
        name: 'Northeastern',
        mascot: 'Huskies',
        slug: 'northeastern',
        rank: null,
        previousRank: null,
        previewNote: 'Mike Glavine develops New England talent',
      },
      {
        name: 'Charleston',
        mascot: 'Cougars',
        slug: 'charleston',
        rank: null,
        previousRank: null,
        previewNote: 'Building in South Carolina',
      },
      {
        name: 'Elon',
        mascot: 'Phoenix',
        slug: 'elon',
        rank: null,
        previousRank: null,
        previewNote: 'Mike Kennedy builds program',
      },
      {
        name: 'Hofstra',
        mascot: 'Pride',
        slug: 'hofstra',
        rank: null,
        previousRank: null,
        previewNote: 'Long Island recruiting presence',
      },
      {
        name: 'William & Mary',
        mascot: 'Tribe',
        slug: 'william-mary',
        rank: null,
        previousRank: null,
        previewNote: 'Academic excellence and baseball',
      },
      {
        name: 'Delaware',
        mascot: 'Blue Hens',
        slug: 'delaware',
        rank: null,
        previousRank: null,
        previewNote: 'Mid-Atlantic recruiting presence',
      },
      {
        name: 'Towson',
        mascot: 'Tigers',
        slug: 'towson',
        rank: null,
        previousRank: null,
        previewNote: 'Building in Baltimore area',
      },
    ],
  },
  'missouri-valley': {
    id: 'missouri-valley',
    name: 'Missouri Valley',
    fullName: 'Missouri Valley Conference',
    description:
      "The Missouri Valley Conference is one of the best mid-major baseball leagues in the country. Dallas Baptist has become a national power, reaching multiple super regionals. Indiana State and Illinois State provide competitive depth, while DBU's Texas location gives it a recruiting edge.",
    region: 'Midwest / Texas',
    storylines: [
      'Dallas Baptist continues as the conference flagship and national power',
      'Indiana State looks to challenge DBU for conference supremacy',
      'Illinois State benefits from Illinois recruiting',
      'Conference regularly earns multiple NCAA Tournament bids',
      "DBU's Texas location provides significant recruiting advantage",
    ],
    teams: [
      {
        name: 'Dallas Baptist',
        mascot: 'Patriots',
        slug: 'dallas-baptist',
        rank: null,
        previousRank: null,
        keyPlayer: 'Multiple draft prospects',
        previewNote: 'Dan Heefner has DBU as perennial contender',
      },
      {
        name: 'Indiana State',
        mascot: 'Sycamores',
        slug: 'indiana-state',
        rank: null,
        previousRank: null,
        previewNote: 'Mitch Hannahs builds Midwest powerhouse',
      },
      {
        name: 'Illinois State',
        mascot: 'Redbirds',
        slug: 'illinois-state',
        rank: null,
        previousRank: null,
        previewNote: 'Steve Holm develops Illinois talent',
      },
      {
        name: 'Southern Illinois',
        mascot: 'Salukis',
        slug: 'southern-illinois',
        rank: null,
        previousRank: null,
        previewNote: 'Building competitive program',
      },
      {
        name: 'Evansville',
        mascot: 'Purple Aces',
        slug: 'evansville',
        rank: null,
        previousRank: null,
        previewNote: 'Indiana recruiting presence',
      },
      {
        name: 'Missouri State',
        mascot: 'Bears',
        slug: 'missouri-state',
        rank: null,
        previousRank: null,
        previewNote: 'Keith Guttin builds consistent contender',
      },
      {
        name: 'Valparaiso',
        mascot: 'Beacons',
        slug: 'valparaiso',
        rank: null,
        previousRank: null,
        previewNote: 'Working toward MVC competitiveness',
      },
      {
        name: 'Bradley',
        mascot: 'Braves',
        slug: 'bradley',
        rank: null,
        previousRank: null,
        previewNote: 'Illinois recruiting presence',
      },
    ],
  },
  wcc: {
    id: 'wcc',
    name: 'WCC',
    fullName: 'West Coast Conference',
    description:
      'The West Coast Conference features strong academic institutions with competitive baseball programs. Gonzaga leads the way with consistent NCAA Tournament appearances, while Pepperdine and San Diego benefit from Southern California recruiting. The conference provides a bridge between West Coast baseball and national competition.',
    region: 'West Coast',
    storylines: [
      'Gonzaga continues as WCC flagship under Mark Machtolf',
      'Pepperdine benefits from Malibu location and SoCal recruiting',
      'San Diego rebuilds after coaching transition',
      'Conference competes for at-large NCAA Tournament bids',
      'Strong academics attract quality student-athletes',
    ],
    teams: [
      {
        name: 'Gonzaga',
        mascot: 'Bulldogs',
        slug: 'gonzaga',
        rank: null,
        previousRank: null,
        previewNote: 'Mark Machtolf builds consistent contender',
      },
      {
        name: 'Pepperdine',
        mascot: 'Waves',
        slug: 'pepperdine',
        rank: null,
        previousRank: null,
        previewNote: 'SoCal recruiting in Malibu',
      },
      {
        name: 'San Diego',
        mascot: 'Toreros',
        slug: 'san-diego',
        rank: null,
        previousRank: null,
        previewNote: 'Building in beautiful San Diego',
      },
      {
        name: 'Santa Clara',
        mascot: 'Broncos',
        slug: 'santa-clara',
        rank: null,
        previousRank: null,
        previewNote: 'Bay Area recruiting presence',
      },
      {
        name: 'San Francisco',
        mascot: 'Dons',
        slug: 'san-francisco',
        rank: null,
        previousRank: null,
        previewNote: 'Building in San Francisco',
      },
      {
        name: 'Loyola Marymount',
        mascot: 'Lions',
        slug: 'loyola-marymount',
        rank: null,
        previousRank: null,
        previewNote: 'Los Angeles recruiting pipeline',
      },
      {
        name: 'Pacific',
        mascot: 'Tigers',
        slug: 'pacific',
        rank: null,
        previousRank: null,
        previewNote: 'Central California recruiting',
      },
      {
        name: 'Portland',
        mascot: 'Pilots',
        slug: 'portland',
        rank: null,
        previousRank: null,
        previewNote: 'Pacific Northwest presence',
      },
    ],
  },
  'big-west': {
    id: 'big-west',
    name: 'Big West',
    fullName: 'Big West Conference',
    description:
      "The Big West is California's premier mid-major baseball conference. Cal State Fullerton's four national championships anchor the conference's legacy, while Long Beach State and UC Irvine provide consistent competition. California's deep talent pool ensures the conference remains nationally competitive.",
    region: 'California',
    storylines: [
      'Cal State Fullerton rebuilds storied program under Jason Dietrich',
      'Long Beach State benefits from Southern California talent',
      'UC Irvine provides Orange County recruiting base',
      'Conference looks to regain national prominence',
      'California recruiting pipeline remains strong',
    ],
    teams: [
      {
        name: 'Cal State Fullerton',
        mascot: 'Titans',
        slug: 'cal-state-fullerton',
        rank: null,
        previousRank: null,
        previewNote: 'Jason Dietrich rebuilds 4-time national champs',
      },
      {
        name: 'Long Beach State',
        mascot: 'Beach',
        slug: 'long-beach-state',
        rank: null,
        previousRank: null,
        previewNote: 'SoCal recruiting powerhouse',
      },
      {
        name: 'UC Irvine',
        mascot: 'Anteaters',
        slug: 'uc-irvine',
        rank: null,
        previousRank: null,
        previewNote: 'Ben Orloff builds in Orange County',
      },
      {
        name: 'UC Santa Barbara',
        mascot: 'Gauchos',
        slug: 'uc-santa-barbara',
        rank: null,
        previousRank: null,
        previewNote: 'Andrew Checketts develops talent',
      },
      {
        name: 'Cal Poly',
        mascot: 'Mustangs',
        slug: 'cal-poly',
        rank: null,
        previousRank: null,
        previewNote: 'Central Coast recruiting base',
      },
      {
        name: 'Cal State Northridge',
        mascot: 'Matadors',
        slug: 'cal-state-northridge',
        rank: null,
        previousRank: null,
        previewNote: 'LA Valley recruiting presence',
      },
      {
        name: 'UC Riverside',
        mascot: 'Highlanders',
        slug: 'uc-riverside',
        rank: null,
        previousRank: null,
        previewNote: 'Inland Empire recruiting',
      },
      {
        name: 'Hawaii',
        mascot: 'Rainbow Warriors',
        slug: 'hawaii',
        rank: null,
        previousRank: null,
        previewNote: 'Island baseball tradition',
      },
    ],
  },
  southland: {
    id: 'southland',
    name: 'Southland',
    fullName: 'Southland Conference',
    description:
      "The Southland Conference represents Texas and Louisiana's mid-major baseball scene. McNeese State and Southeastern Louisiana lead the way with strong regional recruiting. The conference produces quality players annually and competes for NCAA Tournament bids in a baseball-rich region.",
    region: 'Texas / Louisiana',
    storylines: [
      'McNeese State leads the way in Louisiana baseball',
      'Southeastern Louisiana benefits from Baton Rouge metro',
      'Texas A&M-Corpus Christi builds in South Texas',
      'Conference battles for NCAA Tournament relevance',
      'Baseball-rich region provides quality recruiting',
    ],
    teams: [
      {
        name: 'McNeese State',
        mascot: 'Cowboys',
        slug: 'mcneese',
        rank: null,
        previousRank: null,
        previewNote: 'Justin Hill builds in Lake Charles',
      },
      {
        name: 'Southeastern Louisiana',
        mascot: 'Lions',
        slug: 'se-louisiana',
        rank: null,
        previousRank: null,
        previewNote: 'Louisiana recruiting pipeline',
      },
      {
        name: 'Texas A&M-Corpus Christi',
        mascot: 'Islanders',
        slug: 'tamu-corpus-christi',
        rank: null,
        previousRank: null,
        previewNote: 'South Texas recruiting base',
      },
      {
        name: 'Lamar',
        mascot: 'Cardinals',
        slug: 'lamar',
        rank: null,
        previousRank: null,
        previewNote: 'Southeast Texas presence',
      },
      {
        name: 'Nicholls',
        mascot: 'Colonels',
        slug: 'nicholls',
        rank: null,
        previousRank: null,
        previewNote: 'Louisiana bayou baseball',
      },
      {
        name: 'Northwestern State',
        mascot: 'Demons',
        slug: 'northwestern-state',
        rank: null,
        previousRank: null,
        previewNote: 'Building in Natchitoches',
      },
      {
        name: 'Houston Christian',
        mascot: 'Huskies',
        slug: 'houston-christian',
        rank: null,
        previousRank: null,
        previewNote: 'Houston metro recruiting',
      },
      {
        name: 'Incarnate Word',
        mascot: 'Cardinals',
        slug: 'incarnate-word',
        rank: null,
        previousRank: null,
        previewNote: 'San Antonio presence',
      },
    ],
  },
};

function RankChange({ current, previous }: { current: number | null; previous: number | null }) {
  if (!current) return null;
  if (!previous) return <span className="text-text-tertiary text-sm">NEW</span>;

  const change = previous - current;
  if (change > 0) {
    return (
      <span className="flex items-center text-success text-sm">
        <ChevronUp className="w-4 h-4" />
        {change}
      </span>
    );
  } else if (change < 0) {
    return (
      <span className="flex items-center text-error text-sm">
        <ChevronDown className="w-4 h-4" />
        {Math.abs(change)}
      </span>
    );
  }
  return <Minus className="w-4 h-4 text-text-tertiary" />;
}

// ─── Auto-generated conference data from teamMetadata ──────────────────────────
// For conferences without hand-written editorial content, derive a hub page
// directly from the team entries in teamMetadata.
const conferenceSlugMap: Record<string, { name: string; fullName: string; region: string; description: string }> = {
  asun: {
    name: 'ASUN', fullName: 'ASUN Conference', region: 'Southeast',
    description: 'The ASUN has emerged as a competitive mid-major conference with strong Florida and Southeast recruiting. Jacksonville, Stetson, and Kennesaw State lead the way with regular NCAA Tournament appearances.',
  },
  'america-east': {
    name: 'America East', fullName: 'America East Conference', region: 'Northeast',
    description: 'The America East features northeastern programs competing in cold-weather markets. Bryant and Stony Brook lead the conference with strong regional recruiting and improving facilities.',
  },
  'big-south': {
    name: 'Big South', fullName: 'Big South Conference', region: 'Southeast',
    description: 'The Big South produces competitive baseball from the Carolinas and Virginia. Campbell and Winthrop have built consistent programs that challenge for NCAA Tournament bids annually.',
  },
  horizon: {
    name: 'Horizon', fullName: 'Horizon League', region: 'Midwest',
    description: 'The Horizon League brings competitive baseball from the Midwest and Great Lakes region. Wright State and Northern Kentucky have emerged as conference contenders with strong player development.',
  },
  'patriot-league': {
    name: 'Patriot League', fullName: 'Patriot League', region: 'Northeast',
    description: 'The Patriot League combines academic excellence with competitive baseball. Army, Navy, and Bucknell anchor the conference with unique institutional identities and disciplined programs.',
  },
  southern: {
    name: 'Southern', fullName: 'Southern Conference', region: 'Southeast',
    description: 'The Southern Conference features programs from the Appalachian region and Southeast. Samford and ETSU have built competitive programs with strong pitching development and regional recruiting.',
  },
  summit: {
    name: 'Summit', fullName: 'Summit League', region: 'Midwest',
    description: 'The Summit League represents Great Plains and Upper Midwest baseball. Oral Roberts and North Dakota State lead the way with programs that consistently compete for conference titles and at-large bids.',
  },
  wac: {
    name: 'WAC', fullName: 'Western Athletic Conference', region: 'West',
    description: 'The WAC spans the western United States with programs from Texas to California. Grand Canyon and Sacramento State anchor the conference with strong recruiting in baseball-rich regions.',
  },
  independent: {
    name: 'Independent', fullName: 'Independent', region: 'West',
    description: 'Oregon State competes as an independent after the Pac-12 dissolved its baseball conference in realignment. The Beavers schedule non-conference opponents nationally while maintaining their Corvallis identity and recruiting base.',
  },
};

function getAutoConferenceTeams(conferenceId: string) {
  const conf = conferenceSlugMap[conferenceId];
  if (!conf) return null;

  const teams = Object.entries(teamMetadata)
    .filter(([, meta]) => meta.conference === conf.name)
    .map(([slug, meta]) => ({
      slug,
      name: meta.shortName,
      fullName: meta.name,
      mascot: meta.mascot,
      espnId: meta.espnId,
      logoId: meta.logoId,
      colors: meta.colors,
      city: meta.location.city,
      state: meta.location.state,
      stadium: meta.location.stadium,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (teams.length === 0) return null;
  return { ...conf, id: conferenceId, teams };
}

/** Build slug → rank lookup from preseason data (Top 25 only). */
const preseasonRanks: Record<string, number> = {};
for (const [slug, data] of Object.entries(preseason2026)) {
  if (data.rank <= 25) preseasonRanks[slug] = data.rank;
}

/** Sync conference team ranks with preseason2026 data source. */
function syncRanks(teams: typeof conferenceData[string]['teams']) {
  return teams.map((team) => {
    if (!team.slug) return team;
    const liveRank = preseasonRanks[team.slug] ?? null;
    return { ...team, rank: liveRank };
  });
}

interface ConferencePageClientProps {
  conferenceId: string;
}

export default function ConferencePageClient({ conferenceId }: ConferencePageClientProps) {
  const raw = conferenceData[conferenceId];
  const conference = raw ? { ...raw, teams: syncRanks(raw.teams) } : null;

  // Auto-generated hub for conferences without editorial content
  if (!conference) {
    const auto = getAutoConferenceTeams(conferenceId);
    if (!auto) {
      return (
        <>
          <main id="main-content">
            <Section padding="lg" className="pt-24">
              <Container>
                <div className="text-center py-20">
                  <h1 className="font-display text-3xl font-bold text-text-primary mb-4">
                    Conference Not Found
                  </h1>
                  <p className="text-text-secondary mb-6">
                    The conference you&apos;re looking for doesn&apos;t exist.
                  </p>
                  <Link
                    href="/college-baseball/conferences"
                    className="text-burnt-orange hover:underline"
                  >
                    ← Back to Conferences
                  </Link>
                </div>
              </Container>
            </Section>
          </main>
          <Footer />
        </>
      );
    }

    return (
      <>
        <main id="main-content">
          <Section padding="lg" className="pt-24">
            <Container>
              {/* Breadcrumb */}
              <ScrollReveal direction="up">
                <Link
                  href="/college-baseball/conferences"
                  className="inline-flex items-center gap-2 text-text-tertiary hover:text-burnt-orange transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  All Conferences
                </Link>

                <div className="mb-8">
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-text-primary">
                    {auto.fullName}
                  </h1>
                  <p className="text-text-secondary mt-2 max-w-3xl">
                    {auto.description}
                  </p>
                  <p className="text-text-tertiary mt-2 text-sm">
                    {auto.teams.length} {auto.teams.length === 1 ? 'team' : 'teams'} &middot; {auto.region}
                  </p>
                </div>
              </ScrollReveal>

              {/* Quick Stats */}
              <ScrollReveal direction="up" delay={100}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                  <Card padding="md" className="text-center">
                    <Users className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold text-text-primary">
                      {auto.teams.length}
                    </div>
                    <div className="text-text-tertiary text-sm">{auto.teams.length === 1 ? 'Team' : 'Teams'}</div>
                  </Card>
                  <Card padding="md" className="text-center">
                    <MapPin className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold text-text-primary">
                      {auto.region}
                    </div>
                    <div className="text-text-tertiary text-sm">Region</div>
                  </Card>
                  <Card padding="md" className="text-center col-span-2 md:col-span-1">
                    <Trophy className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold text-text-primary">D1</div>
                    <div className="text-text-tertiary text-sm">Division</div>
                  </Card>
                </div>
              </ScrollReveal>

              {/* Team Grid */}
              <ScrollReveal direction="up" delay={200}>
                <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                  Conference Teams
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {auto.teams.map((team) => {
                    const logoUrl = getLogoUrl(team.espnId, team.logoId);
                    const rank = preseasonRanks[team.slug];
                    return (
                      <Link key={team.slug} href={`/college-baseball/teams/${team.slug}`}>
                        <Card
                          padding="md"
                          className="hover:border-burnt-orange/50 transition-all group"
                          style={{ borderLeftWidth: '3px', borderLeftColor: withAlpha(team.colors.primary, 0.38) }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                              style={{ backgroundColor: withAlpha(team.colors.primary, 0.12) }}
                            >
                              <img
                                src={logoUrl}
                                alt=""
                                className="w-10 h-10 object-contain"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-display text-lg font-bold text-text-primary group-hover:text-burnt-orange transition-colors truncate">
                                  {team.fullName}
                                </h3>
                                {rank && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white bg-burnt-orange shrink-0">
                                    #{rank}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {team.city}, {team.state}
                                </span>
                              </div>
                              <p className="text-xs text-text-tertiary mt-0.5">{team.stadium}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </ScrollReveal>

              {/* Attribution */}
              <div className="mt-10 text-center text-xs text-text-tertiary">
                <p>Team data sourced from ESPN.</p>
                <p className="mt-1" suppressHydrationWarning>
                  Last updated:{' '}
                  {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
                </p>
              </div>
            </Container>
          </Section>
        </main>
        <Footer />
      </>
    );
  }

  const rankedTeams = conference.teams.filter((t) => t.rank !== null);
  const unrankedTeams = conference.teams.filter((t) => t.rank === null);

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            {/* Breadcrumb */}
            <ScrollReveal direction="up">
              <Link
                href="/college-baseball/conferences"
                className="inline-flex items-center gap-2 text-text-tertiary hover:text-burnt-orange transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                All Conferences
              </Link>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-text-primary">
                    {conference.fullName}
                  </h1>
                  <Badge variant="primary">{rankedTeams.length} Ranked</Badge>
                </div>
                <p className="text-text-secondary max-w-3xl">{conference.description}</p>
              </div>
            </ScrollReveal>

            {/* Quick Stats */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <Card padding="md" className="text-center">
                  <Trophy className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-text-primary">
                    {rankedTeams.length}
                  </div>
                  <div className="text-text-tertiary text-sm">Ranked Teams</div>
                </Card>
                <Card padding="md" className="text-center">
                  <Users className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-text-primary">
                    {conference.teams.length}
                  </div>
                  <div className="text-text-tertiary text-sm">Total Teams</div>
                </Card>
                <Card padding="md" className="text-center">
                  <TrendingUp className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-text-primary">
                    {rankedTeams[0]?.name || '—'}
                  </div>
                  <div className="text-text-tertiary text-sm">
                    Top Team {rankedTeams[0]?.rank ? `(#${rankedTeams[0].rank})` : ''}
                  </div>
                </Card>
                <Card padding="md" className="text-center">
                  <MapPin className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-text-primary">
                    {conference.region}
                  </div>
                  <div className="text-text-tertiary text-sm">Region</div>
                </Card>
              </div>
            </ScrollReveal>

            {/* Preseason Storylines */}
            <ScrollReveal direction="up" delay={150}>
              <Card padding="lg" className="mb-10">
                <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                  2026 Preseason Storylines
                </h2>
                <ul className="space-y-3">
                  {conference.storylines.map((storyline, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-burnt-orange font-bold shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-text-secondary">{storyline}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </ScrollReveal>

            {/* Ranked Teams */}
            {rankedTeams.length > 0 && (
              <ScrollReveal direction="up" delay={200}>
                <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                  Ranked Teams ({rankedTeams.length})
                </h2>
                <div className="grid gap-4 mb-10">
                  {rankedTeams
                    .sort((a, b) => (a.rank || 99) - (b.rank || 99))
                    .map((team) => {
                      const meta = team.slug ? teamMetadata[team.slug] : null;
                      const logoUrl = meta ? getLogoUrl(meta.espnId, meta.logoId) : null;

                      const card = (
                        <Card
                          key={team.name}
                          padding="md"
                          className={`transition-all ${team.slug ? 'hover:border-burnt-orange/50' : ''}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-burnt-orange/20 flex items-center justify-center overflow-hidden">
                                {logoUrl ? (
                                  <img src={logoUrl} alt="" className="w-9 h-9 object-contain" loading="lazy" />
                                ) : (
                                  <span className="font-display text-xl font-bold text-burnt-orange">
                                    #{team.rank}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-display text-lg font-bold text-text-primary">
                                    {team.name} {team.mascot}
                                  </h3>
                                  {logoUrl && (
                                    <span className="font-display text-sm font-bold text-burnt-orange">
                                      #{team.rank}
                                    </span>
                                  )}
                                  <RankChange current={team.rank} previous={team.previousRank} />
                                </div>
                                {team.keyPlayer && (
                                  <p className="text-burnt-orange text-sm">{team.keyPlayer}</p>
                                )}
                              </div>
                            </div>
                            {team.previewNote && (
                              <p className="text-text-secondary text-sm md:text-right md:max-w-md">
                                {team.previewNote}
                              </p>
                            )}
                          </div>
                        </Card>
                      );

                      if (team.slug) {
                        return (
                          <Link key={team.name} href={`/college-baseball/teams/${team.slug}`}>
                            {card}
                          </Link>
                        );
                      }
                      return <div key={team.name}>{card}</div>;
                    })}
                </div>
              </ScrollReveal>
            )}

            {/* Other Teams */}
            {unrankedTeams.length > 0 && (
              <ScrollReveal direction="up" delay={250}>
                <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                  Other Conference Teams ({unrankedTeams.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {unrankedTeams.map((team) => {
                    const meta = team.slug ? teamMetadata[team.slug] : null;
                    const logoUrl = meta ? getLogoUrl(meta.espnId, meta.logoId) : null;

                    const card = (
                      <Card
                        key={team.name}
                        padding="md"
                        className={team.slug ? 'hover:border-burnt-orange/50 transition-all' : ''}
                      >
                        <div className="flex items-center gap-3">
                          {logoUrl && (
                            <img src={logoUrl} alt="" className="w-8 h-8 object-contain shrink-0" loading="lazy" />
                          )}
                          <div>
                            <h3 className="font-display text-lg font-bold text-text-primary">
                              {team.name} {team.mascot}
                            </h3>
                            {team.previewNote && (
                              <p className="text-text-secondary text-sm mt-1">{team.previewNote}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );

                    if (team.slug) {
                      return (
                        <Link key={team.name} href={`/college-baseball/teams/${team.slug}`}>
                          {card}
                        </Link>
                      );
                    }
                    return <div key={team.name}>{card}</div>;
                  })}
                </div>
              </ScrollReveal>
            )}

            {/* Data Attribution */}
            <div className="mt-10 text-center text-xs text-text-tertiary">
              <p>Rankings data sourced from D1Baseball preseason poll (2026).</p>
              <p className="mt-1" suppressHydrationWarning>
                Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}{' '}
                CT
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
