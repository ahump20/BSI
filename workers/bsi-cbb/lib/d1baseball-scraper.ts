/**
 * D1Baseball Roster Scraper
 * Fills the college baseball roster gap that ESPN doesn't serve.
 *
 * D1Baseball.com has comprehensive roster pages but no public API.
 * This scraper extracts player data from team roster pages and
 * normalizes it to BSI's internal schema.
 *
 * Rate limiting: 30 requests/minute (be respectful to D1Baseball)
 * Cache TTL: 24 hours (rosters don't change often)
 */

import { z } from 'zod';

// =============================================================================
// TYPES
// =============================================================================

export interface D1BaseballPlayer {
  name: string;
  jerseyNumber: string | null;
  position: string | null;
  bats: string | null;
  throws: string | null;
  classYear: string | null;
  height: string | null;
  weight: number | null;
  hometown: string | null;
  highSchool: string | null;
  previousSchool: string | null;
  profileUrl: string | null;
}

export interface D1BaseballRoster {
  teamName: string;
  teamSlug: string;
  season: number;
  players: D1BaseballPlayer[];
  scrapedAt: string;
  source: 'd1baseball';
}

export interface TeamSlugMapping {
  bsiTeamId: string;
  teamName: string;
  d1baseballSlug: string;
  espnId?: string;
  ncaaId?: string;
}

// Schema for parsing scraped data
export const D1PlayerSchema = z.object({
  name: z.string(),
  jerseyNumber: z.string().nullable(),
  position: z.string().nullable(),
  bats: z.string().nullable(),
  throws: z.string().nullable(),
  classYear: z.string().nullable(),
  height: z.string().nullable(),
  weight: z.number().nullable(),
  hometown: z.string().nullable(),
  highSchool: z.string().nullable(),
  previousSchool: z.string().nullable(),
  profileUrl: z.string().nullable(),
});

// =============================================================================
// SLUG MAPPINGS - Map BSI team IDs to D1Baseball URL slugs
// =============================================================================

// =============================================================================
// SLUG MAPPINGS - Map BSI team IDs to D1Baseball URL slugs
// =============================================================================

// Priority teams (Texas schools + major conferences)
export const TEAM_SLUG_MAPPINGS: TeamSlugMapping[] = [
  // Big 12
  { bsiTeamId: 'big12-texas', teamName: 'Texas Longhorns', d1baseballSlug: 'texas', espnId: '251' },
  {
    bsiTeamId: 'big12-texas-tech',
    teamName: 'Texas Tech Red Raiders',
    d1baseballSlug: 'texas-tech',
    espnId: '2641',
  },
  { bsiTeamId: 'big12-tcu', teamName: 'TCU Horned Frogs', d1baseballSlug: 'tcu', espnId: '2628' },
  { bsiTeamId: 'big12-baylor', teamName: 'Baylor Bears', d1baseballSlug: 'baylor', espnId: '239' },
  {
    bsiTeamId: 'big12-oklahoma',
    teamName: 'Oklahoma Sooners',
    d1baseballSlug: 'oklahoma',
    espnId: '201',
  },
  {
    bsiTeamId: 'big12-oklahoma-state',
    teamName: 'Oklahoma State Cowboys',
    d1baseballSlug: 'oklahoma-state',
    espnId: '197',
  },
  {
    bsiTeamId: 'big12-kansas-state',
    teamName: 'Kansas State Wildcats',
    d1baseballSlug: 'kansas-state',
    espnId: '2306',
  },
  {
    bsiTeamId: 'big12-west-virginia',
    teamName: 'West Virginia Mountaineers',
    d1baseballSlug: 'west-virginia',
    espnId: '277',
  },
  { bsiTeamId: 'big12-ucf', teamName: 'UCF Knights', d1baseballSlug: 'ucf', espnId: '2116' },
  { bsiTeamId: 'big12-byu', teamName: 'BYU Cougars', d1baseballSlug: 'byu', espnId: '252' },
  {
    bsiTeamId: 'big12-cincinnati',
    teamName: 'Cincinnati Bearcats',
    d1baseballSlug: 'cincinnati',
    espnId: '2132',
  },
  {
    bsiTeamId: 'big12-houston',
    teamName: 'Houston Cougars',
    d1baseballSlug: 'houston',
    espnId: '248',
  },
  {
    bsiTeamId: 'big12-kansas',
    teamName: 'Kansas Jayhawks',
    d1baseballSlug: 'kansas',
    espnId: '2305',
  },
  {
    bsiTeamId: 'big12-arizona',
    teamName: 'Arizona Wildcats',
    d1baseballSlug: 'arizona',
    espnId: '12',
  },
  {
    bsiTeamId: 'big12-arizona-state',
    teamName: 'Arizona State Sun Devils',
    d1baseballSlug: 'arizona-state',
    espnId: '9',
  },
  {
    bsiTeamId: 'big12-colorado',
    teamName: 'Colorado Buffaloes',
    d1baseballSlug: 'colorado',
    espnId: '38',
  },
  { bsiTeamId: 'big12-utah', teamName: 'Utah Utes', d1baseballSlug: 'utah', espnId: '254' },

  // SEC
  {
    bsiTeamId: 'sec-texas-am',
    teamName: 'Texas A&M Aggies',
    d1baseballSlug: 'texas-am',
    espnId: '245',
  },
  { bsiTeamId: 'sec-lsu', teamName: 'LSU Tigers', d1baseballSlug: 'lsu', espnId: '99' },
  {
    bsiTeamId: 'sec-arkansas',
    teamName: 'Arkansas Razorbacks',
    d1baseballSlug: 'arkansas',
    espnId: '8',
  },
  {
    bsiTeamId: 'sec-ole-miss',
    teamName: 'Ole Miss Rebels',
    d1baseballSlug: 'ole-miss',
    espnId: '145',
  },
  {
    bsiTeamId: 'sec-mississippi-state',
    teamName: 'Mississippi State Bulldogs',
    d1baseballSlug: 'mississippi-state',
    espnId: '344',
  },
  {
    bsiTeamId: 'sec-tennessee',
    teamName: 'Tennessee Volunteers',
    d1baseballSlug: 'tennessee',
    espnId: '2633',
  },
  {
    bsiTeamId: 'sec-vanderbilt',
    teamName: 'Vanderbilt Commodores',
    d1baseballSlug: 'vanderbilt',
    espnId: '238',
  },
  { bsiTeamId: 'sec-florida', teamName: 'Florida Gators', d1baseballSlug: 'florida', espnId: '57' },
  {
    bsiTeamId: 'sec-georgia',
    teamName: 'Georgia Bulldogs',
    d1baseballSlug: 'georgia',
    espnId: '61',
  },
  {
    bsiTeamId: 'sec-south-carolina',
    teamName: 'South Carolina Gamecocks',
    d1baseballSlug: 'south-carolina',
    espnId: '2579',
  },
  { bsiTeamId: 'sec-auburn', teamName: 'Auburn Tigers', d1baseballSlug: 'auburn', espnId: '2' },
  {
    bsiTeamId: 'sec-alabama',
    teamName: 'Alabama Crimson Tide',
    d1baseballSlug: 'alabama',
    espnId: '333',
  },
  {
    bsiTeamId: 'sec-kentucky',
    teamName: 'Kentucky Wildcats',
    d1baseballSlug: 'kentucky',
    espnId: '96',
  },
  {
    bsiTeamId: 'sec-missouri',
    teamName: 'Missouri Tigers',
    d1baseballSlug: 'missouri',
    espnId: '142',
  },

  // ACC
  {
    bsiTeamId: 'acc-clemson',
    teamName: 'Clemson Tigers',
    d1baseballSlug: 'clemson',
    espnId: '228',
  },
  {
    bsiTeamId: 'acc-florida-state',
    teamName: 'Florida State Seminoles',
    d1baseballSlug: 'florida-state',
    espnId: '52',
  },
  {
    bsiTeamId: 'acc-miami',
    teamName: 'Miami Hurricanes',
    d1baseballSlug: 'miami-fl',
    espnId: '2390',
  },
  {
    bsiTeamId: 'acc-north-carolina',
    teamName: 'North Carolina Tar Heels',
    d1baseballSlug: 'north-carolina',
    espnId: '153',
  },
  {
    bsiTeamId: 'acc-nc-state',
    teamName: 'NC State Wolfpack',
    d1baseballSlug: 'nc-state',
    espnId: '152',
  },
  { bsiTeamId: 'acc-duke', teamName: 'Duke Blue Devils', d1baseballSlug: 'duke', espnId: '150' },
  {
    bsiTeamId: 'acc-wake-forest',
    teamName: 'Wake Forest Demon Deacons',
    d1baseballSlug: 'wake-forest',
    espnId: '154',
  },
  {
    bsiTeamId: 'acc-virginia',
    teamName: 'Virginia Cavaliers',
    d1baseballSlug: 'virginia',
    espnId: '258',
  },
  {
    bsiTeamId: 'acc-virginia-tech',
    teamName: 'Virginia Tech Hokies',
    d1baseballSlug: 'virginia-tech',
    espnId: '259',
  },
  {
    bsiTeamId: 'acc-louisville',
    teamName: 'Louisville Cardinals',
    d1baseballSlug: 'louisville',
    espnId: '97',
  },
  {
    bsiTeamId: 'acc-notre-dame',
    teamName: 'Notre Dame Fighting Irish',
    d1baseballSlug: 'notre-dame',
    espnId: '87',
  },
  {
    bsiTeamId: 'acc-pitt',
    teamName: 'Pittsburgh Panthers',
    d1baseballSlug: 'pittsburgh',
    espnId: '221',
  },
  {
    bsiTeamId: 'acc-georgia-tech',
    teamName: 'Georgia Tech Yellow Jackets',
    d1baseballSlug: 'georgia-tech',
    espnId: '59',
  },
  {
    bsiTeamId: 'acc-stanford',
    teamName: 'Stanford Cardinal',
    d1baseballSlug: 'stanford',
    espnId: '24',
  },
  {
    bsiTeamId: 'acc-cal',
    teamName: 'California Golden Bears',
    d1baseballSlug: 'cal',
    espnId: '25',
  },

  // Big Ten (new additions)
  {
    bsiTeamId: 'bigten-oregon-state',
    teamName: 'Oregon State Beavers',
    d1baseballSlug: 'oregon-state',
    espnId: '204',
  },
  {
    bsiTeamId: 'bigten-oregon',
    teamName: 'Oregon Ducks',
    d1baseballSlug: 'oregon',
    espnId: '2483',
  },
  { bsiTeamId: 'bigten-ucla', teamName: 'UCLA Bruins', d1baseballSlug: 'ucla', espnId: '26' },
  { bsiTeamId: 'bigten-usc', teamName: 'USC Trojans', d1baseballSlug: 'usc', espnId: '30' },
  {
    bsiTeamId: 'bigten-washington',
    teamName: 'Washington Huskies',
    d1baseballSlug: 'washington',
    espnId: '264',
  },

  // Texas Regional Powers (AAC/Conference USA/Sun Belt)
  { bsiTeamId: 'aac-rice', teamName: 'Rice Owls', d1baseballSlug: 'rice', espnId: '242' },
  {
    bsiTeamId: 'wac-dallas-baptist',
    teamName: 'Dallas Baptist Patriots',
    d1baseballSlug: 'dallas-baptist',
    espnId: '2166',
  },
  {
    bsiTeamId: 'cusa-sam-houston',
    teamName: 'Sam Houston Bearkats',
    d1baseballSlug: 'sam-houston',
    espnId: '2534',
  },
  { bsiTeamId: 'aac-utsa', teamName: 'UTSA Roadrunners', d1baseballSlug: 'utsa', espnId: '2636' },
  {
    bsiTeamId: 'sunbelt-texas-state',
    teamName: 'Texas State Bobcats',
    d1baseballSlug: 'texas-state',
    espnId: '326',
  },
  {
    bsiTeamId: 'wac-ut-arlington',
    teamName: 'UT Arlington Mavericks',
    d1baseballSlug: 'ut-arlington',
    espnId: '250',
  },
  {
    bsiTeamId: 'wac-ut-rio-grande-valley',
    teamName: 'UTRGV Vaqueros',
    d1baseballSlug: 'ut-rio-grande-valley',
    espnId: '292',
  },
];
// =============================================================================
// RATE LIMITING
// =============================================================================

const RATE_LIMIT_KEY = 'd1baseball_ratelimit';
const MAX_REQUESTS_PER_MINUTE = 30;

async function checkRateLimit(kv: KVNamespace): Promise<boolean> {
  const now = new Date();
  const windowKey = `${RATE_LIMIT_KEY}:${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;

  const count = parseInt((await kv.get(windowKey)) || '0', 10);
  if (count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  await kv.put(windowKey, (count + 1).toString(), { expirationTtl: 120 });
  return true;
}

// =============================================================================
// HTML PARSING
// =============================================================================

/**
 * Parse D1Baseball lineup/stats page HTML to extract player data.
 * D1Baseball no longer has traditional roster pages, so we extract
 * player data from lineup and stats page player links.
 *
 * Player links format: /player/{id}/{name-slug}/
 */
function parseRosterHtml(html: string, _teamSlug: string): D1BaseballPlayer[] {
  const players: D1BaseballPlayer[] = [];
  const seenIds = new Set<string>();

  // Extract player links: /player/{id}/{name-slug}/
  const playerLinkRegex = /player\/([a-z0-9]+)\/([a-z0-9-]+)\//gi;
  let match;

  while ((match = playerLinkRegex.exec(html)) !== null) {
    const playerId = match[1] ?? '';
    const nameSlug = match[2] ?? '';

    // Skip if we've already seen this player
    if (seenIds.has(playerId) || !nameSlug) {
      continue;
    }
    seenIds.add(playerId);

    // Convert name-slug to proper name (e.g., "adrian-rodriguez" -> "Adrian Rodriguez")
    const name = nameSlug
      .split('-')
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    // Try to find position context near this player mention
    const position = findPlayerPosition(html, nameSlug);

    players.push({
      name,
      jerseyNumber: null, // Not available in links
      position,
      bats: null,
      throws: null,
      classYear: null,
      height: null,
      weight: null,
      hometown: null,
      highSchool: null,
      previousSchool: null,
      profileUrl: `https://d1baseball.com/player/${playerId}/${nameSlug}/`,
    });
  }

  return players;
}

/**
 * Try to find position context for a player from surrounding HTML.
 */
function findPlayerPosition(html: string, nameSlug: string): string | null {
  // Look for position headers (C, 1B, 2B, SS, 3B, LF, CF, RF, DH, P)
  const positionHeaders = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH', 'P', 'RHP', 'LHP'];

  // Find the player mention and look at surrounding context
  const playerIndex = html.indexOf(nameSlug);
  if (playerIndex === -1) return null;

  // Look for position in a ~200 char window before the player name
  const contextBefore = html.slice(Math.max(0, playerIndex - 200), playerIndex);

  // Check for position table headers or position mentions
  for (const pos of positionHeaders) {
    // Look for the position as a table header or standalone
    const posRegex = new RegExp(`>\\s*${pos}\\s*<`, 'i');
    if (posRegex.test(contextBefore)) {
      return pos;
    }
  }

  return null;
}
/**
 * Parse player profile page to extract detailed biographical data.
 * D1Baseball 2025 profile pages use simpler text format:
 * - "2B Sophomore" - position and class year
 * - "HT/WT: 5'10", 185" - height and weight
 * - "BAT/THRW: R/R" - bats and throws
 *
 * NOTE: Hometown and high school are NOT available on profile pages.
 * That data is only in D1Baseball's bulk JSON API.
 */
function parsePlayerProfileHtml(html: string): Partial<D1BaseballPlayer> {
  const details: Partial<D1BaseballPlayer> = {};

  // Decode common HTML entities
  const decode = (s: string): string => {
    return s
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;/g, "'")
      .replace(/&#34;/g, '"')
      .replace(/&#8226;/g, '•');
  };

  const decodedHtml = decode(html);

  // Extract Height/Weight: "HT/WT: 5'10", 185" or "HT/WT: 6'2", 215"
  const htWtPatterns = [
    /HT\/WT:\s*([456]'[\d"]+)[,\s]*(\d+)/i,
    /HT\/WT:<\/span>\s*(?:<span[^>]*>)?([456]'[\d"]+)[,\s]*(\d+)/i,
    /([456]'[\d"]+)[,\s]+(\d{2,3})\s*(?:lbs?)?/i,
  ];
  for (const pattern of htWtPatterns) {
    const match = decodedHtml.match(pattern);
    if (match && match[1] && match[2]) {
      details.height = match[1];
      details.weight = parseInt(match[2], 10);
      break;
    }
  }

  // Extract Bats/Throws: "BAT/THRW: R/R" or "B/T: L/R"
  const batThrowPatterns = [
    /BAT\/THRW:\s*([LRS])\/([LR])/i,
    /B\/T:\s*([LRS])\/([LR])/i,
    />([LRS])\/([LR])</,
  ];
  for (const pattern of batThrowPatterns) {
    const match = decodedHtml.match(pattern);
    if (match && match[1] && match[2]) {
      details.bats = match[1].toUpperCase();
      details.throws = match[2].toUpperCase();
      break;
    }
  }

  // Extract Class Year: "Freshman", "Sophomore", "Junior", "Senior", "Graduate"
  // Also matches abbreviated: "Fr.", "So.", "Jr.", "Sr."
  const classPatterns = [
    /\b(Freshman|Sophomore|Junior|Senior|Graduate)\b/i,
    /\b(Fr\.|So\.|Jr\.|Sr\.|Gr\.)\b/i,
  ];
  for (const pattern of classPatterns) {
    const match = decodedHtml.match(pattern);
    if (match && match[1]) {
      const yearMap: Record<string, string> = {
        freshman: 'Fr.',
        sophomore: 'So.',
        junior: 'Jr.',
        senior: 'Sr.',
        graduate: 'Gr.',
        'fr.': 'Fr.',
        'so.': 'So.',
        'jr.': 'Jr.',
        'sr.': 'Sr.',
        'gr.': 'Gr.',
      };
      const matched = match[1].toLowerCase();
      details.classYear = yearMap[matched] || match[1];
      break;
    }
  }

  // Extract Position: Look for baseball positions
  // Common positions: C, 1B, 2B, 3B, SS, LF, CF, RF, DH, P, RHP, LHP, OF, IF, UT
  const posPatterns = [
    /\b(C|1B|2B|3B|SS|LF|CF|RF|DH|RHP|LHP|OF|IF|UT)\s+(?:Freshman|Sophomore|Junior|Senior|Graduate|Fr\.|So\.|Jr\.|Sr\.)/i,
    /Position:\s*([A-Z]{1,3})/i,
    /<td[^>]*>\s*(C|1B|2B|3B|SS|LF|CF|RF|DH|P|RHP|LHP|OF|IF|UT)\s*<\/td>/i,
  ];
  for (const pattern of posPatterns) {
    const match = decodedHtml.match(pattern);
    if (match && match[1]) {
      details.position = match[1].toUpperCase();
      break;
    }
  }

  // NOTE: Hometown and high school are NOT extracted from profile pages
  // D1Baseball does not show this info on individual player pages.
  // This data would need to come from their bulk JSON API if needed.

  // Extract Previous School (transfers) - may still be visible on some pages
  const transferPatterns = [
    /(?:via|from|transfer(?:red)?\s+from)\s+([A-Za-z\s&\-]+?)(?:\s*[,<]|\s+to\s+)/i,
    /Previous:\s*([A-Za-z\s&\-]+)/i,
  ];
  for (const pattern of transferPatterns) {
    const match = decodedHtml.match(pattern);
    if (match && match[1]?.trim()) {
      // Filter out JavaScript keywords that might match
      const school = match[1].trim();
      if (!school.match(/^(window|document|function|return|var|let|const|if|else)/i)) {
        details.previousSchool = school;
        break;
      }
    }
  }

  return details;
}

// =============================================================================
// D1BASEBALL SCRAPER CLASS
// =============================================================================

export class D1BaseballScraper {
  private kv: KVNamespace;
  private baseUrl = 'https://d1baseball.com';

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /**
   * Get roster for a team by D1Baseball slug.
   * Uses KV cache with 24-hour TTL.
   */
  async getRosterBySlug(teamSlug: string, season?: number): Promise<D1BaseballRoster | null> {
    const currentSeason = season || new Date().getFullYear();
    const cacheKey = `d1bb:roster:${teamSlug}:${currentSeason}`;

    // Check cache first
    const cached = await this.kv.get(cacheKey, 'json');
    if (cached) {
      return cached as D1BaseballRoster;
    }

    // Check rate limit
    const canProceed = await checkRateLimit(this.kv);
    if (!canProceed) {
      console.error(`D1Baseball rate limit exceeded for ${teamSlug}`);
      return null;
    }

    try {
      const url = `${this.baseUrl}/team/${teamSlug}/lineup/`;
      const response = await fetch(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent':
            'BlazeSportsIntel/2.0 (https://blazesportsintel.com; college baseball analytics)',
        },
      });

      if (!response.ok) {
        console.error(`D1Baseball fetch failed: ${response.status} for ${teamSlug}`);
        return null;
      }

      const html = await response.text();
      const players = parseRosterHtml(html, teamSlug);

      // Extract team name from page
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const teamName =
        (titleMatch?.[1] ?? '')
          .replace(/\s*Roster.*$/i, '')
          .replace(/\s*\|.*$/, '')
          .replace(/&#?[a-z0-9]+;/gi, ' ')
          .replace(/D1Baseball$/i, '')
          .replace(/\s+/g, ' ')
          .trim() || teamSlug.replace(/-/g, ' ');

      const roster: D1BaseballRoster = {
        teamName,
        teamSlug,
        season: currentSeason,
        players,
        scrapedAt: new Date().toISOString(),
        source: 'd1baseball',
      };

      // Cache for 24 hours
      await this.kv.put(cacheKey, JSON.stringify(roster), { expirationTtl: 86400 });

      return roster;
    } catch (error) {
      console.error(`D1Baseball scrape error for ${teamSlug}:`, error);
      return null;
    }
  }

  /**
   * Get roster for a team by BSI team ID.
   * Looks up the D1Baseball slug from mappings.
   */
  async getRosterByTeamId(bsiTeamId: string, season?: number): Promise<D1BaseballRoster | null> {
    const mapping = TEAM_SLUG_MAPPINGS.find(
      (m) => m.bsiTeamId === bsiTeamId || m.d1baseballSlug === bsiTeamId
    );

    if (!mapping) {
      console.warn(`No D1Baseball mapping found for team: ${bsiTeamId}`);
      return null;
    }

    return this.getRosterBySlug(mapping.d1baseballSlug, season);
  }

  /**
   * Get all available team slug mappings.
   */
  getTeamMappings(): TeamSlugMapping[] {
    return TEAM_SLUG_MAPPINGS;
  }

  /**
   * Find team mapping by various identifiers.
   */
  findTeamMapping(identifier: string): TeamSlugMapping | undefined {
    const id = identifier.toLowerCase();
    return TEAM_SLUG_MAPPINGS.find(
      (m) =>
        m.bsiTeamId === id ||
        m.d1baseballSlug === id ||
        m.espnId === identifier ||
        m.teamName.toLowerCase().includes(id)
    );
  }

  /**
   * Sync roster data to D1 database.
   * Returns count of players synced.
   */
  async syncRosterToDatabase(
    db: D1Database,
    bsiTeamId: string,
    roster: D1BaseballRoster
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    for (const player of roster.players) {
      try {
        // Generate a stable ID from team + name + jersey
        const playerId = `${bsiTeamId}-${player.name.toLowerCase().replace(/\s+/g, '-')}-${player.jerseyNumber || '0'}`;

        await db
          .prepare(
            `INSERT OR REPLACE INTO college_baseball_players
             (id, team_id, name, jersey_number, position, class_year,
              height, weight, bats, throws, hometown, high_school,
              is_transfer, transfer_from, is_active, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
          )
          .bind(
            playerId,
            bsiTeamId,
            player.name,
            player.jerseyNumber,
            player.position,
            player.classYear,
            player.height,
            player.weight,
            player.bats,
            player.throws,
            player.hometown,
            player.highSchool,
            player.previousSchool ? 1 : 0,
            player.previousSchool
          )
          .run();

        // Add entity source mapping for D1Baseball
        await db
          .prepare(
            `INSERT OR REPLACE INTO entity_sources
             (entity_type, entity_id, source, source_id, source_url, confidence, created_at)
             VALUES ('player', ?, 'd1baseball', ?, ?, 0.9, datetime('now'))`
          )
          .bind(
            playerId,
            player.profileUrl?.split('/').pop() || player.name.toLowerCase().replace(/\s+/g, '-'),
            player.profileUrl
          )
          .run();

        synced++;
      } catch (error) {
        console.error(`Failed to sync player ${player.name}:`, error);
        errors++;
      }
    }

    return { synced, errors };
  }

  /**
   * Fetch detailed player data from individual profile page.
   * Rate limited to be respectful to D1Baseball servers.
   */
  async fetchPlayerDetails(profileUrl: string): Promise<Partial<D1BaseballPlayer>> {
    // Check rate limit before each profile fetch
    const canProceed = await checkRateLimit(this.kv);
    if (!canProceed) {
      console.warn(`Rate limit hit while fetching player profile: ${profileUrl}`);
      return {};
    }

    try {
      const response = await fetch(profileUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent':
            'BlazeSportsIntel/2.0 (https://blazesportsintel.com; college baseball analytics)',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch player profile: ${response.status} for ${profileUrl}`);
        return {};
      }

      const html = await response.text();
      return parsePlayerProfileHtml(html);
    } catch (error) {
      console.error(`Error fetching player profile ${profileUrl}:`, error);
      return {};
    }
  }

  /**
   * Enrich a roster with detailed player data from profile pages.
   * This makes N additional requests (one per player).
   * Use sparingly and cache results.
   */
  async enrichRosterWithDetails(roster: D1BaseballRoster): Promise<D1BaseballRoster> {
    const enrichedPlayers: D1BaseballPlayer[] = [];

    for (const player of roster.players) {
      if (player.profileUrl) {
        // Small delay between requests to be respectful
        await new Promise((resolve) => setTimeout(resolve, 100));

        const details = await this.fetchPlayerDetails(player.profileUrl);
        enrichedPlayers.push({
          ...player,
          position: details.position || player.position,
          classYear: details.classYear || player.classYear,
          height: details.height || player.height,
          weight: details.weight ?? player.weight,
          bats: details.bats || player.bats,
          throws: details.throws || player.throws,
          hometown: details.hometown || player.hometown,
          highSchool: details.highSchool || player.highSchool,
          previousSchool: details.previousSchool || player.previousSchool,
        });
      } else {
        enrichedPlayers.push(player);
      }
    }

    return {
      ...roster,
      players: enrichedPlayers,
    };
  }

  /**
   * Get roster for a team by D1Baseball slug WITH full player details.
   * Uses KV cache with 24-hour TTL.
   * This is slower than getRosterBySlug but returns complete data.
   */
  async getFullRosterBySlug(teamSlug: string, season?: number): Promise<D1BaseballRoster | null> {
    const currentSeason = season || new Date().getFullYear();
    const cacheKey = `d1bb:roster:full:${teamSlug}:${currentSeason}`;

    // Check cache first (full roster with details)
    const cached = await this.kv.get(cacheKey, 'json');
    if (cached) {
      return cached as D1BaseballRoster;
    }

    // Get basic roster first
    const basicRoster = await this.getRosterBySlug(teamSlug, season);
    if (!basicRoster) {
      return null;
    }

    // Enrich with player details
    const fullRoster = await this.enrichRosterWithDetails(basicRoster);

    // Cache the full roster for 24 hours
    await this.kv.put(cacheKey, JSON.stringify(fullRoster), { expirationTtl: 86400 });

    return fullRoster;
  }

  /**
   * Get full roster for a team by BSI team ID.
   */
  async getFullRosterByTeamId(
    bsiTeamId: string,
    season?: number
  ): Promise<D1BaseballRoster | null> {
    const mapping = TEAM_SLUG_MAPPINGS.find(
      (m) => m.bsiTeamId === bsiTeamId || m.d1baseballSlug === bsiTeamId
    );

    if (!mapping) {
      console.warn(`No D1Baseball mapping found for team: ${bsiTeamId}`);
      return null;
    }

    return this.getFullRosterBySlug(mapping.d1baseballSlug, season);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createD1BaseballScraper(kv: KVNamespace): D1BaseballScraper {
  return new D1BaseballScraper(kv);
}
