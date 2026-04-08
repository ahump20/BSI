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
  labs: 'https://labs.blazesportsintel.com',
  arcade: 'https://arcade.blazesportsintel.com',
  dna: 'https://dna.austinhumphrey.com',
  linkedin: 'https://linkedin.com/in/ahump20',
  github: 'https://github.com/ahump20',
  x: 'https://x.com/BlazeSportsIntel',
  email: `mailto:${PRIMARY_EMAIL}`,
} as const;

export const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'bsi', label: 'BSI' },
  { id: 'projects', label: 'Work' },
  { id: 'proof', label: 'Proof' },
  { id: 'origin', label: 'Origin' },
  { id: 'covenant', label: 'Covenant' },
  { id: 'contact', label: 'Contact' },
] as const;

export const FOOTER_LINK_GROUPS = [
  {
    title: 'Navigate',
    links: [
      { label: 'BSI', href: '#bsi' },
      { label: 'Work', href: '#projects' },
      { label: 'Proof', href: '#proof' },
      { label: 'Origin', href: '#origin' },
      { label: 'Covenant', href: '#covenant' },
      { label: 'Contact', href: '#contact' },
    ] satisfies SiteLink[],
  },
  {
    title: 'BSI',
    links: [
      { label: 'BlazeSportsIntel.com', href: PLATFORM_URLS.bsi, external: true },
      { label: 'BSI Radar Lab', href: PLATFORM_URLS.labs, external: true },
      { label: 'BlazeCraft Dashboard', href: PLATFORM_URLS.blazecraft, external: true },
      { label: 'BSI Arcade', href: PLATFORM_URLS.arcade, external: true },
      { label: 'A Documented Heritage', href: PLATFORM_URLS.dna, external: true },
    ] satisfies SiteLink[],
  },
  {
    title: 'Social',
    links: [
      { label: 'LinkedIn', href: PLATFORM_URLS.linkedin, external: true },
      { label: 'GitHub', href: PLATFORM_URLS.github, external: true },
      { label: 'X / Twitter', href: PLATFORM_URLS.x, external: true },
      { label: 'Email', href: PLATFORM_URLS.email },
    ] satisfies SiteLink[],
  },
] as const;

export type ContactChannelIcon = 'email' | 'linkedin' | 'bsi' | 'github' | 'x';

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
    label: 'LinkedIn',
    value: 'linkedin.com/in/ahump20',
    href: PLATFORM_URLS.linkedin,
    icon: 'linkedin',
  },
  {
    label: 'BSI',
    value: 'BlazeSportsIntel.com',
    href: PLATFORM_URLS.bsi,
    icon: 'bsi',
  },
  {
    label: 'GitHub',
    value: 'github.com/ahump20',
    href: PLATFORM_URLS.github,
    icon: 'github',
  },
  {
    label: 'X',
    value: '@BlazeSportsIntel',
    href: PLATFORM_URLS.x,
    icon: 'x',
  },
];

export const PORTFOLIO_PROJECTS = {
  featured: [
    {
      name: 'A Documented Heritage',
      description:
        'Personal data archive with 12+ interactive D3 charts, a Three.js swing biomechanics viewer, and an ancestry globe. Cross-references 8 data sources — Spotify, 23andMe, natal chart, personality instruments, writing corpus, and more.',
      tech: ['React', 'D3.js', 'Three.js', 'TypeScript', 'Tailwind'],
      url: PLATFORM_URLS.dna,
      highlight: 'Data Viz',
      live: false,
    },
    {
      name: 'BSI Radar Lab',
      description:
        'Physics-based quality auditor for TrackMan pitch data. Six validation layers — Magnus model, SSW detection, calibration drift, physical bounds, release clustering, and fatigue tracking. All processing runs locally in the browser.',
      tech: ['React', 'Recharts', 'TypeScript', 'Vite'],
      url: PLATFORM_URLS.labs,
      highlight: 'Analytics',
      live: true,
    },
  ],
  supporting: [
    {
      name: 'BlazeCraft',
      description:
        'Warcraft 3: Frozen Throne-style system health dashboard for BSI infrastructure. Real-time monitoring with game-inspired UI and Durable Object state management.',
      tech: ['Cloudflare Pages', 'Workers', 'Durable Objects', 'Canvas2D'],
      url: PLATFORM_URLS.blazecraft,
      highlight: 'DevOps',
      live: true,
    },
    {
      name: 'Sandlot Sluggers',
      description:
        'Browser-based 3D baseball arcade with four game modes, real college baseball rosters via BSI API, and leaderboard integration.',
      tech: ['Three.js', 'JavaScript', 'Cloudflare Pages'],
      url: PLATFORM_URLS.arcade,
      highlight: 'Game',
      live: true,
    },
  ],
} as const;

export const PROJECT_SCREENSHOTS: Record<string, string> = {
  bsi: '/assets/bsi-homepage.png',
  sluggers: '/assets/bsi-arcade.png',
  blazecraft: '/assets/bsi-blazecraft.png',
};

export const ORIGIN_PHOTOS = [
  {
    src: '/assets/optimized/running-vs-tivy-1024w.webp',
    fallback: '/assets/running-vs-tivy.jpg',
    alt: 'Austin running a corner route against Tivy High School',
    caption: 'Friday nights under the lights — Chargers #20',
    dominant: true as const,
  },
  {
    src: '/assets/optimized/young-austin-longhorns-1024w.webp',
    fallback: '/assets/young-austin-longhorns.jpg',
    alt: 'Young Austin in a Longhorns jersey at DKR Stadium',
    caption: 'Before the Forty Acres were mine',
    dominant: false as const,
  },
  {
    src: '/assets/optimized/baseball-with-father-1024w.webp',
    fallback: '/assets/baseball-with-father.jpg',
    alt: 'Austin and his father at a baseball game',
    caption: 'Where the instinct started',
    dominant: false as const,
  },
] as const;

export const ORIGIN_TEXT = `Born in Memphis. Raised on Texas soil from West Columbia — birthplace of the Republic. Grew up on Friday night lights, box scores at the breakfast table, and the belief that the places the spotlight skips are where the best stories live.

Played football through high school. Studied at the Forty Acres. Sold advertising at Spectrum Reach — learned what happens when data meets a sales floor. Built BSI because the gap between what fans care about and what media covers is not a complaint. It is a product.`;

export const COVENANT_TEXT = `I build things that run in production and serve people mainstream coverage ignores. Sports analytics for 330 college programs. A 3D baseball arcade. An infrastructure dashboard styled after Warcraft III. All of it live, all of it one person.

The coverage gap between what fans care about and what media covers is the product. Not the problem. The product.`;

export const PROOF_STATS = [
  { value: 18, label: 'Workers', suffix: '' },
  { value: 12, label: 'Databases', suffix: '' },
  { value: 45, label: 'KV Stores', suffix: '' },
  { value: 40, label: 'API Routes', suffix: '+' },
  { value: 662, label: 'Tests Passing', suffix: '' },
  { value: 15, label: 'Second Updates', suffix: 's' },
] as const;

export const BSI_SHOWCASE = {
  stats: [
    { value: '5', label: 'Sports' },
    { value: '330+', label: 'D1 Programs' },
    { value: '80+', label: 'Articles' },
    { value: '662', label: 'Tests Passing' },
  ],
  architecture: [
    { label: 'External APIs', sub: 'Highlightly · SportsDataIO · ESPN' },
    { label: 'Workers', sub: 'Dozens of edge-powered specialists' },
    { label: 'Storage', sub: 'D1 · KV · R2' },
    { label: 'UI', sub: 'Next.js static export' },
  ],
  leagues: [
    { name: 'College Baseball', note: 'Flagship' },
    { name: 'MLB', note: 'Full Coverage' },
    { name: 'NFL', note: 'Full Coverage' },
    { name: 'NCAA Football', note: 'Full Coverage' },
    { name: 'NBA', note: 'Full Coverage' },
  ],
  techStack: [
    'Cloudflare Workers',
    'D1',
    'KV',
    'R2',
    'Hono',
    'Next.js',
    'React',
    'TypeScript',
    'Claude API',
    'SportsDataIO',
    'Highlightly',
    'Vitest',
    'Playwright',
  ],
  capabilities: [
    {
      title: 'BSI Savant',
      description:
        'Park-adjusted sabermetrics for all 330 D1 baseball programs. wOBA, wRC+, FIP, expected stats, scouting grades — computed daily from real game data, free for everyone.',
    },
    {
      title: 'Live Scores + Weekly Pulse',
      description:
        'Real-time scores across six leagues via WebSocket. Weekly metric snapshots track which players and conferences are trending up or down.',
    },
    {
      title: 'AI-Powered Editorial',
      description:
        'Claude-driven analysis, scouting reports, and 80+ editorial pieces. AI as a force multiplier for coverage depth, not a gimmick.',
    },
    {
      title: 'Edge-First Architecture',
      description:
        '18 Cloudflare Workers, Durable Objects, and D1 databases deliver sub-50ms response times globally. Zero traditional servers.',
    },
  ],
} as const;
