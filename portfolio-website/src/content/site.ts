type SiteLink = {
  label: string;
  href: string;
  external?: boolean;
};

export const SITE_TAGLINE = 'Born to Blaze the Path Beaten Less';
export const SITE_LOCATION = 'San Antonio, Texas';
export const RESUME_PATH = '/Austin_Humphrey_Resume.pdf';
export const PRIMARY_EMAIL = 'Austin@BlazeSportsIntel.com';

export const PLATFORM_URLS = {
  bsi: 'https://blazesportsintel.com',
  blazecraft: 'https://blazecraft.app',
  arcade: 'https://arcade.blazesportsintel.com',
  dna: 'https://dna.austinhumphrey.com',
  linkedin: 'https://linkedin.com/in/ahump20',
  github: 'https://github.com/ahump20',
  email: `mailto:${PRIMARY_EMAIL}`,
} as const;

// ─── Hero ───────────────────────────────────────────

export const HERO_CONTENT = {
  thesis:
    'The coverage most people consume is built for the markets that already get attention. I build the alternative — real analytics, real editorial, real product — for every program and athlete that gets left out.',
  name: 'Austin Humphrey',
  cta: { label: 'See the Work', href: '#work' },
} as const;

// ─── Navigation ─────────────────────────────────────

export const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'proof', label: 'Proof' },
  { id: 'origin', label: 'Origin' },
  { id: 'contact', label: 'Contact' },
] as const;

// ─── Work (merged Work + Platform) ──────────────────

export type Project = {
  name: string;
  category: string;
  outcome: string;
  href: string;
  state?: 'live' | 'building';
};

export const FLAGSHIP = {
  name: 'Blaze Sports Intel',
  href: PLATFORM_URLS.bsi,
  thesis:
    'I built BSI because the work I wanted to read did not exist. The gap between genuine interest in the game and real access to useful coverage is still wide — especially once you move past the prestige-market defaults.',
  stats: [
    { value: '6', label: 'Leagues' },
    { value: '330+', label: 'D1 Programs' },
    { value: '58+', label: 'Editorial Pieces' },
  ],
  capabilities: [
    'Live scores, standings, and rankings across college baseball, MLB, NFL, NCAA football, NBA, and college basketball.',
    'Advanced sabermetrics — wOBA, FIP, wRC+, park factors — recomputed every six hours from primary data.',
    'Original editorial that does analytical work, not recap language.',
  ],
  tech: 'Cloudflare Workers, D1, KV, R2, Next.js, React, TypeScript — all organized around speed, signal, and maintainability.',
} as const;

export const SUPPORTING_PROJECTS: Project[] = [
  {
    name: 'BlazeCraft',
    category: 'System Health',
    outcome: 'Warcraft-inspired infrastructure dashboard. Live BSI system status at a glance.',
    href: PLATFORM_URLS.blazecraft,
    state: 'live',
  },
  {
    name: 'Sandlot Sluggers',
    category: 'Browser Game',
    outcome: '3D baseball arcade wired to real college rosters via BSI API.',
    href: PLATFORM_URLS.arcade,
    state: 'live',
  },
  {
    name: 'A Documented Heritage',
    category: 'Personal Archive',
    outcome: 'Interactive self-portrait built from charts, motion, and cross-referenced personal data.',
    href: PLATFORM_URLS.dna,
    state: 'building',
  },
];

// ─── Proof (editorial + speaking) ───────────────────

export type ProofPiece = {
  title: string;
  pullQuote: string;
  tag: string;
  href: string;
  readTime: string;
};

export const PROOF_PIECES: ProofPiece[] = [
  {
    title: 'Big 12 Conference Baseball Preview 2026',
    pullQuote:
      'A full-field read on every program in the league — rotation shape, lineup depth, transfer impact — written before the easy narratives set in.',
    tag: 'Conference Preview',
    href: 'https://blazesportsintel.com/college-baseball/editorial/big-12',
    readTime: '18 min read',
  },
  {
    title: 'SEC Conference Baseball Preview 2026',
    pullQuote:
      'Sixteen programs, one conference, and a real attempt to explain where the leverage lives instead of reciting brand names.',
    tag: 'Conference Preview',
    href: 'https://blazesportsintel.com/college-baseball/editorial/sec',
    readTime: '22 min read',
  },
  {
    title: 'Texas Longhorns: Week 1 in Review',
    pullQuote:
      'A team-level breakdown connecting the eye test, the pitching shape, and the postseason implications — without hiding behind recap language.',
    tag: 'Team Analysis',
    href: 'https://blazesportsintel.com/blog-post-feed/texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026',
    readTime: '7 min read',
  },
];

export const SPEAKING_REEL = {
  title: 'Talking Sports: The Analytical Lens',
  summary:
    'The same thinking in spoken form — direct, unscripted, clear enough to hold up without a graphic package carrying the argument.',
  videoSrc: '/assets/austin-speaking-sports.mp4',
} as const;

// ─── Origin ─────────────────────────────────────────

export const ORIGIN_FACTS = [
  { label: 'Born', value: 'August 17, 1995' },
  { label: 'Birth Soil', value: 'West Columbia, TX' },
  { label: 'Named After', value: 'Austin, Texas' },
];

export type OriginPhoto = {
  src: string;
  srcSet: string;
  alt: string;
  wide?: boolean;
};

export type DocumentaryChapter = {
  id: string;
  label: string;
  narrative?: string;
  photos: OriginPhoto[];
};

export const ORIGIN_CHAPTERS: DocumentaryChapter[] = [
  {
    id: 'roots',
    label: 'The Soil',
    narrative:
      'Austin was born in Memphis, but his parents brought Texas soil from West Columbia and placed it beneath his mother before he was born. The point was never symbolism for later. It was continuity in real time.',
    photos: [
      {
        src: '/assets/texas-soil.jpg',
        srcSet: '/assets/optimized/texas-soil-640w.webp 640w, /assets/optimized/texas-soil-1024w.webp 1024w',
        alt: 'West Columbia soil — the family tradition that grounded everything before it started',
      },
      {
        src: '/assets/birth-article.jpg',
        srcSet: '/assets/optimized/birth-article-640w.webp 640w, /assets/optimized/birth-article-1024w.webp 1024w',
        alt: 'The article that documented the beginning',
      },
    ],
  },
  {
    id: 'identity',
    label: 'Identity',
    narrative:
      'Ricky Williams, UT season tickets, youth baseball, Friday night lights, and the Forty Acres all belonged to the same world. Texas was not scenery. It was the standard.',
    photos: [
      {
        src: '/assets/young-austin-longhorns.jpg',
        srcSet: '/assets/optimized/young-austin-longhorns-640w.webp 640w, /assets/optimized/young-austin-longhorns-1024w.webp 1024w',
        alt: 'Longhorn identity arrived early and never needed a sales pitch',
        wide: true,
      },
    ],
  },
  {
    id: 'athlete',
    label: 'The Athlete',
    narrative:
      'The competitive instinct was never theoretical. It came from real fields, real opponents, real stakes — the kind where you learn what effort actually costs before anyone tells you what it is worth.',
    photos: [
      {
        src: '/assets/football-uniform.jpg',
        srcSet: '/assets/optimized/football-uniform-640w.webp 640w, /assets/optimized/football-uniform-1024w.webp 1024w',
        alt: 'Game day uniform — the part where effort and identity merged',
      },
      {
        src: '/assets/running-vs-tivy.jpg',
        srcSet: '/assets/optimized/running-vs-tivy-640w.webp 640w, /assets/optimized/running-vs-tivy-1024w.webp 1024w',
        alt: 'Running against Tivy — the scoreboard never told the full story',
      },
    ],
  },
  {
    id: 'family',
    label: 'The Roots',
    narrative:
      'Sports was never a solo pursuit. It was handed down — from fathers to sons, from bleachers to backyard, from shared seasons to shared language.',
    photos: [
      {
        src: '/assets/baseball-with-father.jpg',
        srcSet: '/assets/optimized/baseball-with-father-640w.webp 640w, /assets/optimized/baseball-with-father-1024w.webp 1024w',
        alt: 'Baseball with Dad — the first coach and the longest mentor',
        wide: true,
      },
      {
        src: '/assets/chargers-with-dad.jpg',
        srcSet: '/assets/optimized/chargers-with-dad-640w.webp 640w, /assets/optimized/chargers-with-dad-1024w.webp 1024w',
        alt: "Chargers game — some traditions don't need an explanation",
      },
      {
        src: '/assets/ballpark-kids.jpg',
        srcSet: '/assets/optimized/ballpark-kids-640w.webp 640w, /assets/optimized/ballpark-kids-1024w.webp 1024w',
        alt: 'The ballpark — where the next generation learns the same language',
      },
    ],
  },
  {
    id: 'transition',
    label: 'The Transition',
    photos: [
      {
        src: '/assets/last-game-silhouette.jpg',
        srcSet: '/assets/optimized/last-game-silhouette-640w.webp 640w, /assets/optimized/last-game-silhouette-1024w.webp 1024w',
        alt: 'Friday night lights stayed part of the operating system long after the jersey came off',
        wide: true,
      },
    ],
  },
  {
    id: 'milestones',
    label: 'The Thread',
    narrative:
      'Blaze Sports Intel did not come from a naming exercise. It came from a dog named Blaze, a youth baseball team, and a long memory for how sports identity actually takes shape.',
    photos: [
      {
        src: '/assets/nana-graduation.jpg',
        srcSet: '/assets/optimized/nana-graduation-640w.webp 640w, /assets/optimized/nana-graduation-1024w.webp 1024w',
        alt: 'Graduation with Nana — the milestone that earned its weight',
      },
      {
        src: '/assets/blaze-dog.jpg',
        srcSet: '/assets/optimized/blaze-dog-640w.webp 640w, /assets/optimized/blaze-dog-1024w.webp 1024w',
        alt: 'Blaze — the dog who named the brand before the brand existed',
      },
    ],
  },
  {
    id: 'community',
    label: 'The People',
    photos: [
      {
        src: '/assets/friendsgiving.jpg',
        srcSet: '/assets/optimized/friendsgiving-640w.webp 640w, /assets/optimized/friendsgiving-1024w.webp 1024w',
        alt: 'Friendsgiving — the table that proves the network is real',
      },
      {
        src: '/assets/titans-halloween.jpg',
        srcSet: '/assets/optimized/titans-halloween-640w.webp 640w, /assets/optimized/titans-halloween-1024w.webp 1024w',
        alt: 'Titans Halloween — the group that never took itself too seriously',
      },
    ],
  },
  {
    id: 'document',
    label: 'Full Circle',
    photos: [
      {
        src: '/assets/birth-certificate.jpg',
        srcSet: '/assets/optimized/birth-certificate-640w.webp 640w, /assets/optimized/birth-certificate-1024w.webp 1024w',
        alt: 'The birth certificate — proof that this story has a starting document',
        wide: true,
      },
    ],
  },
];

export const ORIGIN_MOMENTS = [
  {
    title: 'The soil came first',
    text:
      'Austin was born in Memphis, but his parents brought Texas soil from West Columbia and placed it beneath his mother before he was born. The point was never symbolism for later. It was continuity in real time.',
  },
  {
    title: 'Sports culture was native, not added',
    text:
      'Ricky Williams, UT season tickets, youth baseball, Friday night lights, and the Forty Acres all belonged to the same world. Texas was not scenery. It was the standard.',
  },
  {
    title: 'The product came out of lived fit',
    text:
      'Blaze Sports Intel did not come from a naming exercise. It came from a dog named Blaze, a youth baseball team, and a long memory for how sports identity actually takes shape.',
  },
];

export const ORIGIN_CLOSER = "It's not where you're from. It's how you show up.";

// ─── Contact (simplified) ───────────────────────────

export type ContactChannelIcon = 'email' | 'linkedin' | 'bsi' | 'github';

export const CONTACT_CHANNELS: Array<{
  label: string;
  value: string;
  href: string;
  icon: ContactChannelIcon;
}> = [
  {
    label: 'Email',
    value: PRIMARY_EMAIL,
    href: PLATFORM_URLS.email,
    icon: 'email',
  },
  {
    label: 'BSI',
    value: 'BlazeSportsIntel.com',
    href: PLATFORM_URLS.bsi,
    icon: 'bsi',
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/ahump20',
    href: PLATFORM_URLS.linkedin,
    icon: 'linkedin',
  },
  {
    label: 'GitHub',
    value: 'github.com/ahump20',
    href: PLATFORM_URLS.github,
    icon: 'github',
  },
];

// ─── Credentials (replaces standalone Career section) ─

export const CREDENTIALS =
  'Full Sail M.S. in Sports Management (2026) · UT Austin B.A. in International Relations & Global Studies (2020) · Spectrum Reach · Northwestern Mutual';

// ─── Footer ─────────────────────────────────────────

export const FOOTER_LINK_GROUPS = [
  {
    title: 'Explore',
    links: [
      { label: 'Work', href: '#work' },
      { label: 'Proof', href: '#proof' },
      { label: 'Origin', href: '#origin' },
      { label: 'Contact', href: '#contact' },
    ] satisfies SiteLink[],
  },
  {
    title: 'Build',
    links: [
      { label: 'Blaze Sports Intel', href: PLATFORM_URLS.bsi, external: true },
      { label: 'BlazeCraft', href: PLATFORM_URLS.blazecraft, external: true },
      { label: 'Sandlot Sluggers', href: PLATFORM_URLS.arcade, external: true },
    ] satisfies SiteLink[],
  },
  {
    title: 'Connect',
    links: [
      { label: 'Email', href: PLATFORM_URLS.email },
      { label: 'LinkedIn', href: PLATFORM_URLS.linkedin, external: true },
      { label: 'GitHub', href: PLATFORM_URLS.github, external: true },
    ] satisfies SiteLink[],
  },
] as const;
