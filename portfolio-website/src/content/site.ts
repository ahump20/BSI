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

export const BSI_SHOWCASE = {
  stats: [
    { value: '6', label: 'Leagues' },
    { value: '330+', label: 'D1 Programs' },
    { value: '58+', label: 'Articles' },
    { value: '558', label: 'Tests Passing' },
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
    { name: 'NCAA Basketball', note: 'Full Coverage' },
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
      title: 'AI-Powered Analysis',
      description:
        'Claude-driven editorial generation, predictive modeling, and analytical depth — AI as a force multiplier for coverage, not a gimmick.',
    },
    {
      title: 'Predictive Intelligence',
      description:
        'Machine learning models trained on historical performance, matchup dynamics, and contextual factors. Predictions grounded in real signal.',
    },
    {
      title: 'Edge-First Architecture',
      description:
        'Dozens of edge-powered specialists deliver sub-50ms response times globally. Data pipelines that fetch, transform, and cache without a traditional server.',
    },
    {
      title: 'Podcast Export',
      description:
        'NotebookLM integration transforms written analytics into audio. Coverage extends beyond readers to listeners through a second medium.',
    },
  ],
} as const;
