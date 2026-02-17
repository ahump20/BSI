/**
 * Shared data source definitions — used by /data-sources and /models/data-quality.
 * Extracted from app/data-sources/page.tsx for reuse.
 */

export interface ProviderRow {
  name: string;
  url: string;
  role: string;
  sports: string[];
  refresh: string;
  notes?: string;
}

export const PROVIDERS: ProviderRow[] = [
  {
    name: 'Highlightly Pro',
    url: 'https://highlightly.net',
    role: 'Primary pipeline — scores, rankings, team stats, player profiles',
    sports: ['College Baseball', 'College Football'],
    refresh: 'Live scores every 30s; standings/rankings every 30 min',
    notes: 'Canonical source. All new integrations wire here first.',
  },
  {
    name: 'SportsDataIO',
    url: 'https://sportsdata.io',
    role: 'Scores, standings, rosters, player statistics, schedules',
    sports: ['MLB', 'NFL', 'NBA', 'CFB', 'CBB'],
    refresh: 'Live scores every 30–60s; rosters daily',
    notes: 'Primary for all professional leagues. Authenticated via Ocp-Apim-Subscription-Key header.',
  },
  {
    name: 'ESPN Site API',
    url: 'https://site.api.espn.com',
    role: 'Scores, rankings, and schedules for college baseball',
    sports: ['College Baseball'],
    refresh: 'Live scores every 60s; rankings weekly',
    notes:
      'Fallback source. ESPN dates labeled UTC are actually ET — BSI normalizes to America/Chicago. No API key required.',
  },
];

export interface StorageTier {
  layer: string;
  purpose: string;
  ttls: string;
}

export const STORAGE_TIERS: StorageTier[] = [
  {
    layer: 'KV (Cloudflare)',
    purpose: 'Hot cache for scores, standings, rankings',
    ttls: 'Scores: 60s | Standings: 30 min | Rankings: 30 min | Teams/Players: 24h',
  },
  {
    layer: 'D1 (Cloudflare)',
    purpose: 'Structured relational data — game records, player stats, editorial metadata',
    ttls: 'Persistent — no TTL, data written by ingest workers',
  },
  {
    layer: 'R2 (Cloudflare)',
    purpose: 'Static assets, media, archives, embeddings',
    ttls: 'Permanent storage with lifecycle rules for archival',
  },
];

export interface SeasonalCaveat {
  sport: string;
  caveat: string;
}

export const SEASONAL_CAVEATS: SeasonalCaveat[] = [
  {
    sport: 'MLB',
    caveat:
      'Spring Training (Feb 15 – Mar 25): limited SportsDataIO coverage; some games unavailable until first pitch. Finalization delays of 5–10 minutes are expected.',
  },
  {
    sport: 'College Baseball',
    caveat:
      'Preseason (Feb 14 – Feb 20): opening weekend coverage may be patchy until conferences begin full play. Rankings update weekly during the regular season.',
  },
  {
    sport: 'NFL',
    caveat:
      'Off-season (Feb – Aug): no live scores. Preseason games begin in August with limited statistical depth.',
  },
  {
    sport: 'NBA',
    caveat:
      'Off-season (Jun – Oct): no live scores. Summer League coverage is not included.',
  },
];
