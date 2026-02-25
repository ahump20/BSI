import type { MetadataRoute } from 'next';
export const dynamic = "force-static";

const BASE = 'https://blazesportsintel.com';

type Freq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

interface SitemapEntry {
  path: string;
  changeFrequency: Freq;
  priority: number;
}

// --- Static routes by priority tier ---

const flagship: SitemapEntry[] = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/college-baseball', changeFrequency: 'daily', priority: 0.9 },
  { path: '/college-baseball/scores', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/college-baseball/standings', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/college-baseball/rankings', changeFrequency: 'daily', priority: 0.9 },
  { path: '/college-baseball/games', changeFrequency: 'daily', priority: 0.9 },
  { path: '/college-baseball/players', changeFrequency: 'daily', priority: 0.9 },
  { path: '/college-baseball/news', changeFrequency: 'daily', priority: 0.9 },
  { path: '/college-baseball/teams', changeFrequency: 'daily', priority: 0.9 },
  { path: '/college-baseball/transfer-portal', changeFrequency: 'daily', priority: 0.9 },
  { path: '/college-baseball/conferences', changeFrequency: 'daily', priority: 0.8 },
  { path: '/college-baseball/compare', changeFrequency: 'daily', priority: 0.7 },
  { path: '/college-baseball/savant', changeFrequency: 'daily', priority: 0.9 },
  { path: '/college-baseball/savant/park-factors', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/college-baseball/savant/conference-index', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/college-baseball/preseason', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/college-baseball/preseason/power-25', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/college-baseball/preseason/sec-preview', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/college-baseball/preseason/lone-star-rivalry', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/scores', changeFrequency: 'hourly', priority: 0.9 },
];

const editorial: SitemapEntry[] = [
  { path: '/college-baseball/editorial', changeFrequency: 'daily', priority: 0.9 },
  // Conference previews
  { path: '/college-baseball/editorial/big-12', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/college-baseball/editorial/big-ten', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/college-baseball/editorial/sec', changeFrequency: 'weekly', priority: 0.8 },
  // Opening weekend recaps
  { path: '/college-baseball/editorial/national-opening-weekend', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/college-baseball/editorial/acc-opening-weekend', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/college-baseball/editorial/big-12-opening-weekend', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/college-baseball/editorial/sec-opening-weekend', changeFrequency: 'monthly', priority: 0.8 },
  // Draft profiles
  { path: '/college-baseball/editorial/roch-cholowsky-2026-draft-profile', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/college-baseball/editorial/dylan-volantis-2026-draft-profile', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/college-baseball/editorial/jackson-flora-2026-draft-profile', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/college-baseball/editorial/tyce-armstrong-2026-draft-profile', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/college-baseball/editorial/liam-peterson-2026-draft-profile', changeFrequency: 'monthly', priority: 0.8 },
  // Analysis
  { path: '/college-baseball/editorial/what-two-weekends-told-us', changeFrequency: 'monthly', priority: 0.8 },
  // Weekly features
  { path: '/college-baseball/editorial/week-1-preview', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/college-baseball/editorial/week-1-recap', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/college-baseball/editorial/weekend-2-recap', changeFrequency: 'monthly', priority: 0.8 },
  // Game features
  { path: '/college-baseball/editorial/texas-uc-davis-opener-2026', changeFrequency: 'monthly', priority: 0.7 },
  // 2026 team previews (SEC)
  { path: '/college-baseball/editorial/alabama-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/arkansas-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/auburn-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/florida-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/georgia-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/kentucky-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/lsu-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/mississippi-state-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/missouri-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/oklahoma-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/ole-miss-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/south-carolina-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/tennessee-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/texas-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/texas-am-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/vanderbilt-2026', changeFrequency: 'monthly', priority: 0.7 },
  // 2026 team previews (Big 12)
  { path: '/college-baseball/editorial/arizona-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/arizona-state-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/baylor-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/byu-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/cincinnati-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/houston-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/kansas-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/kansas-state-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/oklahoma-state-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/tcu-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/texas-tech-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/ucf-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/west-virginia-2026', changeFrequency: 'monthly', priority: 0.7 },
  // 2026 team previews (Big Ten)
  { path: '/college-baseball/editorial/illinois-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/indiana-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/iowa-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/maryland-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/michigan-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/michigan-state-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/minnesota-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/nebraska-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/northwestern-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/ohio-state-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/oregon-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/penn-state-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/purdue-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/rutgers-2026', changeFrequency: 'monthly', priority: 0.7 },
  // 2026 team previews (Pac-12 / Other)
  { path: '/college-baseball/editorial/ucla-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/usc-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/utah-2026', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/college-baseball/editorial/washington-2026', changeFrequency: 'monthly', priority: 0.7 },
];

const proSports: SitemapEntry[] = [
  // MLB
  { path: '/mlb', changeFrequency: 'daily', priority: 0.7 },
  { path: '/mlb/spring-training', changeFrequency: 'daily', priority: 0.7 },
  { path: '/mlb/spring-training/scores', changeFrequency: 'hourly', priority: 0.7 },
  { path: '/mlb/spring-training/standings', changeFrequency: 'daily', priority: 0.7 },
  { path: '/mlb/scores', changeFrequency: 'hourly', priority: 0.7 },
  { path: '/mlb/standings', changeFrequency: 'daily', priority: 0.7 },
  { path: '/mlb/games', changeFrequency: 'daily', priority: 0.7 },
  { path: '/mlb/news', changeFrequency: 'daily', priority: 0.6 },
  { path: '/mlb/players', changeFrequency: 'daily', priority: 0.6 },
  { path: '/mlb/teams', changeFrequency: 'daily', priority: 0.6 },
  { path: '/mlb/stats', changeFrequency: 'daily', priority: 0.6 },
  { path: '/mlb/abs', changeFrequency: 'daily', priority: 0.5 },
  // NFL
  { path: '/nfl', changeFrequency: 'daily', priority: 0.7 },
  { path: '/nfl/scores', changeFrequency: 'hourly', priority: 0.7 },
  { path: '/nfl/standings', changeFrequency: 'daily', priority: 0.7 },
  { path: '/nfl/games', changeFrequency: 'daily', priority: 0.7 },
  { path: '/nfl/news', changeFrequency: 'daily', priority: 0.6 },
  { path: '/nfl/players', changeFrequency: 'daily', priority: 0.6 },
  { path: '/nfl/teams', changeFrequency: 'daily', priority: 0.6 },
  // NBA
  { path: '/nba', changeFrequency: 'daily', priority: 0.7 },
  { path: '/nba/scores', changeFrequency: 'hourly', priority: 0.7 },
  { path: '/nba/standings', changeFrequency: 'daily', priority: 0.7 },
  { path: '/nba/games', changeFrequency: 'daily', priority: 0.7 },
  { path: '/nba/news', changeFrequency: 'daily', priority: 0.6 },
  { path: '/nba/players', changeFrequency: 'daily', priority: 0.6 },
  { path: '/nba/teams', changeFrequency: 'daily', priority: 0.6 },
  // CFB
  { path: '/cfb', changeFrequency: 'daily', priority: 0.7 },
  { path: '/cfb/scores', changeFrequency: 'hourly', priority: 0.7 },
  { path: '/cfb/standings', changeFrequency: 'daily', priority: 0.7 },
  { path: '/cfb/articles', changeFrequency: 'daily', priority: 0.6 },
  { path: '/cfb/transfer-portal', changeFrequency: 'daily', priority: 0.7 },
  { path: '/cfb/teams', changeFrequency: 'daily', priority: 0.6 },
];

const features: SitemapEntry[] = [
  { path: '/dashboard', changeFrequency: 'daily', priority: 0.7 },
  { path: '/intel', changeFrequency: 'daily', priority: 0.7 },
  { path: '/nil-valuation', changeFrequency: 'daily', priority: 0.7 },
  { path: '/nil-valuation/methodology', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/nil-valuation/tools', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/fanbase', changeFrequency: 'daily', priority: 0.6 },
  { path: '/fanbase/compare', changeFrequency: 'daily', priority: 0.6 },
  { path: '/analytics', changeFrequency: 'daily', priority: 0.6 },
  { path: '/transfer-portal', changeFrequency: 'daily', priority: 0.7 },
  { path: '/vision-ai', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/search', changeFrequency: 'daily', priority: 0.5 },
];

const arcade: SitemapEntry[] = [
  { path: '/arcade', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/arcade/games', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/arcade/games/sandlot-sluggers', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/arcade/games/hotdog-dash', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/arcade/games/blitz', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/arcade/games/downtown-doggies', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/arcade/games/leadership-capital', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/arcade/wc3-dashboard', changeFrequency: 'monthly', priority: 0.3 },
];

const marketing: SitemapEntry[] = [
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/coverage', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const all = [
    ...flagship,
    ...editorial,
    ...proSports,
    ...features,
    ...arcade,
    ...marketing,
  ];

  return all.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
