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

/* ── Navigation ── */

export const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'proof', label: 'Proof' },
  { id: 'platform', label: 'Platform' },
  { id: 'origin', label: 'Origin' },
  { id: 'career', label: 'Career' },
  { id: 'contact', label: 'Contact' },
] as const;

export const FOOTER_LINK_GROUPS = [
  {
    title: 'Navigate',
    links: [
      { label: 'Work', href: '#work' },
      { label: 'Proof', href: '#proof' },
      { label: 'Platform', href: '#platform' },
      { label: 'Origin', href: '#origin' },
      { label: 'Career', href: '#career' },
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

/* ── Contact ── */

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

/* ── Projects (flat flagship grid) ── */

export type Project = {
  name: string;
  category: string;
  outcome: string;
  href: string;
  techs: string[];
  state: 'live' | 'building';
};

export const PORTFOLIO_PROJECTS: Project[] = [
  {
    name: 'Blaze Sports Intel',
    category: 'Analytics Platform',
    outcome: 'Six leagues, solo-built, live in production.',
    href: PLATFORM_URLS.bsi,
    techs: ['Cloudflare Workers', 'Next.js', 'D1'],
    state: 'live',
  },
  {
    name: 'BSI Radar Lab',
    category: 'Pitch Analytics',
    outcome: 'Physics-based TrackMan quality auditor — six validation layers, all client-side.',
    href: PLATFORM_URLS.labs,
    techs: ['React', 'Recharts', 'TypeScript'],
    state: 'live',
  },
  {
    name: 'BlazeCraft',
    category: 'System Health',
    outcome: 'Game-inspired infrastructure dashboard with real-time Durable Object monitoring.',
    href: PLATFORM_URLS.blazecraft,
    techs: ['Workers', 'Durable Objects', 'Canvas2D'],
    state: 'live',
  },
  {
    name: 'Sandlot Sluggers',
    category: 'Browser Game',
    outcome: '3D baseball arcade with real college rosters via BSI API and leaderboard integration.',
    href: PLATFORM_URLS.arcade,
    techs: ['Three.js', 'JavaScript', 'Workers'],
    state: 'live',
  },
  {
    name: 'A Documented Heritage',
    category: 'Personal Archive',
    outcome: '12+ D3 visualizations cross-referencing 8 data sources into an interactive self-portrait.',
    href: PLATFORM_URLS.dna,
    techs: ['D3.js', 'Three.js', 'React'],
    state: 'building',
  },
];

/* ── BSI Platform (lean evidence section) ── */

export const BSI_PLATFORM = {
  stats: [
    { value: '6', label: 'Leagues' },
    { value: '330+', label: 'D1 Programs' },
    { value: '58+', label: 'Articles' },
  ],
  leagues: [
    { name: 'College Baseball', note: 'Flagship' },
    { name: 'MLB', note: 'Full Coverage' },
    { name: 'NFL', note: 'Full Coverage' },
    { name: 'NCAA Football', note: 'Full Coverage' },
    { name: 'NBA', note: 'Full Coverage' },
    { name: 'NCAA Basketball', note: 'Full Coverage' },
  ],
  techStackSentence:
    'Built on Cloudflare Workers, D1, KV, R2, Hono, Next.js, React, and TypeScript.',
} as const;

/* ── Origin sidebar ── */

export const ORIGIN_FACTS = [
  { label: 'Born', value: 'August 17, 1995' },
  { label: 'Birth Soil', value: 'West Columbia, TX' },
  { label: 'Named After', value: 'Austin, Texas' },
];

export const ORIGIN_MOMENTS = [
  {
    title: 'The soil came first',
    text: 'Austin was born in Memphis on August 17, 1995, but his parents brought Texas soil from West Columbia and placed it beneath his mother before he was born. The doctor told the family, "You know you ain\'t the first to do this, but they\'ve ALL been from Texas." The next day the El Campo Leader-News ran the headline "Tennessee Birth Will Be on Texas Soil." Not a gesture for a story later — a family continuation.',
  },
  {
    title: 'Sports culture was native, not added',
    text: 'Ricky Williams, UT season tickets, youth baseball, Friday night lights, and the Forty Acres all formed the same worldview: Texas was never only geography. It was a standard for how to show up.',
  },
  {
    title: 'BSI came out of lived history',
    text: 'Blaze Sports Intel was named from Bartlett Blaze, Austin\'s dachshund, whose name traces back to his first youth baseball team. The brand was not invented in a vacuum. It was remembered into form.',
  },
];

/* ── Career ── */

export const CAREER_ENTRIES = [
  {
    title: 'Founder & Builder',
    company: 'Blaze Sports Intel',
    location: 'San Antonio, TX',
    period: '2023 – Present',
    accent: 'burnt-orange',
    description:
      'Production-grade sports analytics platform covering six leagues — dozens of specialized systems, multiple databases, 58+ editorial deep-dives. Full architecture designed, deployed, and maintained solo.',
  },
  {
    title: 'Advertising Account Executive',
    company: 'Spectrum Reach',
    location: 'Austin / San Antonio, TX',
    period: 'Nov 2022 – Dec 2025',
    accent: 'spectrum-blue',
    description:
      'Advertising strategy across Austin and San Antonio — two of the fastest-growing markets in Texas — spanning linear TV, OTT/CTV, streaming, and digital. Turned raw campaign data into revenue decisions for local and regional businesses.',
  },
  {
    title: 'Financial Representative',
    company: 'Northwestern Mutual',
    location: 'Austin, TX',
    period: 'Dec 2020 – Aug 2022',
    accent: 'nw-navy',
    description:
      'Top-5 nationally ranked intern program to full-time. Only person in the office daily during COVID. Nearly tripled the referral production of every other advisor. "Power of 10" Award — top 10% national performance.',
  },
];

export const EDUCATION_LINE =
  'Full Sail M.S. (2026) · UT Austin B.A. (2020) · McCombs AI/ML Certificate (in progress) · ATO Rush Captain, UT Austin';
