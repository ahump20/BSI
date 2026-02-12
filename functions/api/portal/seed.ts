/**
 * Transfer Portal Data Seeder
 *
 * Populates D1 with realistic transfer portal entries for both sports.
 * POST /api/portal/seed — requires ?confirm=yes to execute.
 * Produces 120+ baseball entries and 120+ football entries.
 *
 * Authorization: Requires X-Admin-Secret header matching ADMIN_SECRET environment variable.
 * Set via: wrangler secret put ADMIN_SECRET
 */

interface Env {
  GAME_DB: D1Database;
  KV: KVNamespace;
  SPORTS_DATA: R2Bucket;
  ADMIN_SECRET?: string;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

// Deterministic player generation pools
const FIRST_NAMES = [
  'Jake',
  'Marcus',
  'Tyler',
  'Chris',
  'Brandon',
  'Ryan',
  'Austin',
  'Derek',
  'Mason',
  'David',
  'Jordan',
  'Cameron',
  'Anthony',
  'Jaylen',
  'Darius',
  'Caleb',
  'Ethan',
  'Noah',
  'Hunter',
  'Logan',
  'Cole',
  'Bryce',
  'Dylan',
  'Luke',
  'Gavin',
  'Tanner',
  'Jalen',
  'Kaden',
  'Carson',
  'Blake',
  'Tristan',
  'Nolan',
  'Owen',
  'Landon',
  'Colton',
  'Cooper',
  'Brayden',
  'Ryder',
  'Jackson',
  'Levi',
  'Wyatt',
  'Grayson',
  'Jace',
  'Sawyer',
  'Easton',
  'Weston',
  'Harrison',
  'Emmett',
  'Brooks',
  'Micah',
  'Cruz',
  'Zander',
  'Kai',
  'Finn',
  'Beckett',
  'Rowan',
  'Nash',
  'Rhett',
  'Knox',
  'Cade',
];

const LAST_NAMES = [
  'Wilson',
  'Johnson',
  'Roberts',
  'Martinez',
  'Lee',
  'Thompson',
  'Garcia',
  'Miller',
  'Williams',
  'Clark',
  'Mitchell',
  'Davis',
  'Henderson',
  'Thomas',
  'Brown',
  'Jackson',
  'Carter',
  'Anderson',
  'Taylor',
  'Moore',
  'White',
  'Harris',
  'Allen',
  'Young',
  'King',
  'Wright',
  'Hill',
  'Scott',
  'Adams',
  'Baker',
  'Nelson',
  'Gonzalez',
  'Rivera',
  'Collins',
  'Murphy',
  'Stewart',
  'Cox',
  'Howard',
  'Ward',
  'Torres',
  'Peterson',
  'Gray',
  'James',
  'Watson',
  'Brooks',
  'Kelly',
  'Sanders',
  'Price',
  'Bennett',
  'Wood',
  'Ross',
  'Morgan',
  'Cooper',
  'Reed',
  'Bailey',
  'Bell',
  'Gomez',
  'Murray',
  'Freeman',
  'Owens',
];

const SCHOOLS = [
  { name: 'Texas', conference: 'SEC' },
  { name: 'Texas A&M', conference: 'SEC' },
  { name: 'LSU', conference: 'SEC' },
  { name: 'Florida', conference: 'SEC' },
  { name: 'Georgia', conference: 'SEC' },
  { name: 'Alabama', conference: 'SEC' },
  { name: 'Tennessee', conference: 'SEC' },
  { name: 'Arkansas', conference: 'SEC' },
  { name: 'Vanderbilt', conference: 'SEC' },
  { name: 'Ole Miss', conference: 'SEC' },
  { name: 'Mississippi State', conference: 'SEC' },
  { name: 'Auburn', conference: 'SEC' },
  { name: 'Missouri', conference: 'SEC' },
  { name: 'South Carolina', conference: 'SEC' },
  { name: 'Kentucky', conference: 'SEC' },
  { name: 'Oklahoma', conference: 'SEC' },
  { name: 'Ohio State', conference: 'Big Ten' },
  { name: 'Michigan', conference: 'Big Ten' },
  { name: 'Penn State', conference: 'Big Ten' },
  { name: 'Wisconsin', conference: 'Big Ten' },
  { name: 'Minnesota', conference: 'Big Ten' },
  { name: 'Oregon', conference: 'Big Ten' },
  { name: 'USC', conference: 'Big Ten' },
  { name: 'UCLA', conference: 'Big Ten' },
  { name: 'Washington', conference: 'Big Ten' },
  { name: 'Nebraska', conference: 'Big Ten' },
  { name: 'Miami', conference: 'ACC' },
  { name: 'Clemson', conference: 'ACC' },
  { name: 'Florida State', conference: 'ACC' },
  { name: 'Virginia', conference: 'ACC' },
  { name: 'North Carolina', conference: 'ACC' },
  { name: 'Wake Forest', conference: 'ACC' },
  { name: 'Duke', conference: 'ACC' },
  { name: 'Louisville', conference: 'ACC' },
  { name: 'Virginia Tech', conference: 'ACC' },
  { name: 'NC State', conference: 'ACC' },
  { name: 'Stanford', conference: 'ACC' },
  { name: 'TCU', conference: 'Big 12' },
  { name: 'Baylor', conference: 'Big 12' },
  { name: 'Texas Tech', conference: 'Big 12' },
  { name: 'Oklahoma State', conference: 'Big 12' },
  { name: 'Kansas State', conference: 'Big 12' },
  { name: 'West Virginia', conference: 'Big 12' },
  { name: 'UCF', conference: 'Big 12' },
  { name: 'BYU', conference: 'Big 12' },
  { name: 'Cincinnati', conference: 'Big 12' },
  { name: 'Houston', conference: 'Big 12' },
  { name: 'Arizona', conference: 'Big 12' },
  { name: 'Arizona State', conference: 'Big 12' },
  { name: 'Colorado', conference: 'Big 12' },
  { name: 'Oregon State', conference: 'Pac-12' },
  { name: 'Washington State', conference: 'Pac-12' },
  { name: 'San Diego State', conference: 'MWC' },
  { name: 'Fresno State', conference: 'MWC' },
  { name: 'East Carolina', conference: 'AAC' },
  { name: 'Memphis', conference: 'AAC' },
  { name: 'Tulane', conference: 'AAC' },
  { name: 'Coastal Carolina', conference: 'Sun Belt' },
  { name: 'Louisiana', conference: 'Sun Belt' },
  { name: 'Dallas Baptist', conference: 'C-USA' },
];

const BB_POSITIONS = ['RHP', 'LHP', 'C', '1B', '2B', 'SS', '3B', 'OF', 'DH', 'UTL'];
const FB_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'EDGE', 'LB', 'CB', 'S', 'K'];
const CLASS_YEARS = ['Fr', 'So', 'Jr', 'Sr', 'Gr'] as const;
const STATUSES = ['in_portal', 'committed', 'withdrawn', 'signed'] as const;

const SOURCES_BB = [
  { name: 'd1baseball.com', url: 'https://d1baseball.com/transfer-portal', confidence: 0.95 },
  { name: 'ncaa.com', url: 'https://ncaa.com/transfer-portal', confidence: 1.0 },
  { name: 'baseballamerica.com', url: 'https://baseballamerica.com/transfer', confidence: 0.9 },
  { name: 'perfectgame.org', url: 'https://perfectgame.org/portal', confidence: 0.85 },
];

const SOURCES_FB = [
  { name: 'on3.com', url: 'https://on3.com/transfer-portal', confidence: 0.92 },
  { name: '247sports.com', url: 'https://247sports.com/transfer-portal', confidence: 0.93 },
  { name: 'ncaa.com', url: 'https://ncaa.com/transfer-portal', confidence: 1.0 },
  { name: 'rivals.com', url: 'https://rivals.com/transfer-portal', confidence: 0.88 },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return (): number => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function generateDate(rand: () => number, start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + rand() * (e - s)).toISOString();
}

function generateBaseballStats(position: string, rand: () => number): string {
  const isPitcher = position.includes('P') || position === 'LHP' || position === 'RHP';
  if (isPitcher) {
    return JSON.stringify({
      era: +(2.0 + rand() * 4.0).toFixed(2),
      wins: Math.floor(rand() * 12),
      losses: Math.floor(rand() * 8),
      strikeouts: Math.floor(40 + rand() * 80),
      innings: +(40 + rand() * 60).toFixed(1),
      whip: +(0.9 + rand() * 0.8).toFixed(2),
    });
  }
  return JSON.stringify({
    avg: +(0.22 + rand() * 0.13).toFixed(3),
    hr: Math.floor(rand() * 25),
    rbi: Math.floor(15 + rand() * 55),
    sb: Math.floor(rand() * 30),
  });
}

function generateFootballStats(position: string, rand: () => number): string {
  switch (position) {
    case 'QB':
      return JSON.stringify({
        pass_yards: Math.floor(1500 + rand() * 2500),
        pass_td: Math.floor(8 + rand() * 25),
        rush_yards: Math.floor(rand() * 600),
        rush_td: Math.floor(rand() * 8),
      });
    case 'RB':
      return JSON.stringify({
        rush_yards: Math.floor(400 + rand() * 1200),
        rush_td: Math.floor(3 + rand() * 15),
        rec_yards: Math.floor(rand() * 400),
        rec_td: Math.floor(rand() * 4),
      });
    case 'WR':
    case 'TE':
      return JSON.stringify({
        rec_yards: Math.floor(200 + rand() * 1000),
        rec_td: Math.floor(rand() * 12),
      });
    case 'DL':
    case 'EDGE':
    case 'LB':
      return JSON.stringify({
        tackles: Math.floor(20 + rand() * 80),
        sacks: +(rand() * 12).toFixed(1),
      });
    case 'CB':
    case 'S':
      return JSON.stringify({
        tackles: Math.floor(25 + rand() * 60),
        interceptions: Math.floor(rand() * 7),
      });
    default:
      return JSON.stringify({});
  }
}

function generateEntries(
  sport: 'baseball' | 'football',
  count: number,
  seed: number
): Array<Record<string, unknown>> {
  const rand = seededRandom(seed);
  const positions = sport === 'baseball' ? BB_POSITIONS : FB_POSITIONS;
  const sources = sport === 'baseball' ? SOURCES_BB : SOURCES_FB;
  const entries: Array<Record<string, unknown>> = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let playerName: string;
    do {
      playerName = `${pick(FIRST_NAMES, rand)} ${pick(LAST_NAMES, rand)}`;
    } while (usedNames.has(playerName));
    usedNames.add(playerName);

    const fromSchool = pick(SCHOOLS, rand);
    const position = pick(positions, rand);
    const status = pick(STATUSES, rand);
    const source = pick(sources, rand);
    const classYear = pick(CLASS_YEARS, rand);

    // Committed/signed players get a destination
    let toTeam: string | null = null;
    let toConference: string | null = null;
    let commitDate: string | null = null;
    if (status === 'committed' || status === 'signed') {
      let dest;
      do {
        dest = pick(SCHOOLS, rand);
      } while (dest.name === fromSchool.name);
      toTeam = dest.name;
      toConference = dest.conference;
    }

    const portalDate = generateDate(rand, '2025-12-09', '2026-01-15');
    if ((status === 'committed' || status === 'signed') && toTeam) {
      commitDate = generateDate(rand, portalDate, '2026-01-15');
    }

    const eventTimestamp = commitDate || portalDate;
    const statsJson =
      sport === 'baseball'
        ? generateBaseballStats(position, rand)
        : generateFootballStats(position, rand);

    const prefix = sport === 'baseball' ? 'bb' : 'cfb';
    const id = `${prefix}-2025-${String(i + 1).padStart(3, '0')}`;

    entries.push({
      id,
      player_name: playerName,
      sport,
      position,
      class_year: classYear,
      from_team: fromSchool.name,
      to_team: toTeam,
      from_conference: fromSchool.conference,
      to_conference: toConference,
      status,
      event_timestamp: eventTimestamp,
      portal_date: portalDate,
      commitment_date: commitDate,
      stats_json: statsJson,
      engagement_score: Math.floor(30 + rand() * 70),
      stars: sport === 'football' ? Math.floor(2 + rand() * 4) : null,
      overall_rank: sport === 'football' ? Math.floor(1 + rand() * 200) : null,
      source_url: source.url,
      source_id: `${source.name}:${id}`,
      source_name: source.name,
      is_partial: rand() < 0.05 ? 1 : 0,
      needs_review: rand() < 0.03 ? 1 : 0,
      source_confidence: source.confidence,
      verified: rand() > 0.1 ? 1 : 0,
      raw_snapshot_key: null,
      last_verified_at: new Date().toISOString(),
      created_at: portalDate,
      updated_at: new Date().toISOString(),
    });
  }

  return entries;
}

function generateChangelog(
  entries: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const changes: Array<Record<string, unknown>> = [];
  let idx = 0;

  for (const entry of entries) {
    // Every entry gets an "entered" event
    changes.push({
      id: `cl-${String(++idx).padStart(4, '0')}`,
      portal_entry_id: entry.id,
      change_type: 'entered',
      description: `${entry.player_name} entered the transfer portal from ${entry.from_team}`,
      old_value: null,
      new_value: entry.from_team as string,
      event_timestamp: entry.portal_date as string,
      created_at: entry.portal_date as string,
    });

    // Committed/signed entries get a second event
    if ((entry.status === 'committed' || entry.status === 'signed') && entry.to_team) {
      changes.push({
        id: `cl-${String(++idx).padStart(4, '0')}`,
        portal_entry_id: entry.id,
        change_type: entry.status as string,
        description: `${entry.player_name} ${entry.status} to ${entry.to_team}`,
        old_value: null,
        new_value: entry.to_team as string,
        event_timestamp: (entry.commitment_date as string) || (entry.event_timestamp as string),
        created_at: (entry.commitment_date as string) || (entry.event_timestamp as string),
      });
    }

    if (entry.status === 'withdrawn') {
      changes.push({
        id: `cl-${String(++idx).padStart(4, '0')}`,
        portal_entry_id: entry.id,
        change_type: 'withdrawn',
        description: `${entry.player_name} withdrew from the transfer portal`,
        old_value: 'in_portal',
        new_value: 'withdrawn',
        event_timestamp: entry.event_timestamp as string,
        created_at: entry.event_timestamp as string,
      });
    }
  }

  return changes;
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Returns true if strings are equal, false otherwise
 * Maintains constant time even for null/undefined and length mismatches
 */
function constantTimeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  // Reject null/undefined/empty strings explicitly (invalid secrets)
  if (a == null || b == null || a === '' || b === '') {
    // Still perform dummy comparison to maintain constant time
    const dummy = (a ?? '') + (b ?? '');
    let _ = 0;
    for (let i = 0; i < dummy.length; i++) {
      _ |= dummy.charCodeAt(i);
    }
    return false;
  }
  
  // Both strings are now guaranteed to be non-null, non-undefined, non-empty
  const maxLen = Math.max(a.length, b.length);
  let result = a.length ^ b.length; // Include length difference in result
  
  for (let i = 0; i < maxLen; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    result |= charA ^ charB;
  }
  
  return result === 0;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), {
      status: 405,
      headers: HEADERS,
    });
  }

  // Authorization check - require X-Admin-Secret header
  const adminSecret = request.headers.get('X-Admin-Secret');
  
  // Return generic 401 to avoid leaking configuration state
  // Use constant-time comparison for all cases to prevent timing attacks
  if (!constantTimeCompare(adminSecret, env.ADMIN_SECRET)) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid or missing authorization credentials',
      }),
      {
        status: 401,
        headers: HEADERS,
      }
    );
  }

  const url = new URL(request.url);
  if (url.searchParams.get('confirm') !== 'yes') {
    return new Response(JSON.stringify({ error: 'Pass ?confirm=yes to execute seed' }), {
      status: 400,
      headers: HEADERS,
    });
  }

  try {
    const db = env.GAME_DB;

    // Clear existing data
    await db.exec('DELETE FROM transfer_portal_changelog');
    await db.exec('DELETE FROM transfer_portal');

    // Generate entries
    const bbEntries = generateEntries('baseball', 130, 42);
    const fbEntries = generateEntries('football', 125, 99);
    const allEntries = [...bbEntries, ...fbEntries];

    // Batch insert entries (D1 supports batching)
    const entryStmt = db.prepare(`
      INSERT INTO transfer_portal (
        id, player_name, sport, position, class_year,
        from_team, to_team, from_conference, to_conference,
        status, event_timestamp, portal_date, commitment_date,
        stats_json, engagement_score, stars, overall_rank,
        source_url, source_id, source_name,
        is_partial, needs_review, source_confidence, verified,
        raw_snapshot_key, last_verified_at, created_at, updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5,
        ?6, ?7, ?8, ?9,
        ?10, ?11, ?12, ?13,
        ?14, ?15, ?16, ?17,
        ?18, ?19, ?20,
        ?21, ?22, ?23, ?24,
        ?25, ?26, ?27, ?28
      )
    `);

    // D1 batch limit is 100 statements per batch
    const BATCH_SIZE = 50;
    for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
      const batch = allEntries
        .slice(i, i + BATCH_SIZE)
        .map((e) =>
          entryStmt.bind(
            e.id,
            e.player_name,
            e.sport,
            e.position,
            e.class_year,
            e.from_team,
            e.to_team,
            e.from_conference,
            e.to_conference,
            e.status,
            e.event_timestamp,
            e.portal_date,
            e.commitment_date,
            e.stats_json,
            e.engagement_score,
            e.stars,
            e.overall_rank,
            e.source_url,
            e.source_id,
            e.source_name,
            e.is_partial,
            e.needs_review,
            e.source_confidence,
            e.verified,
            e.raw_snapshot_key,
            e.last_verified_at,
            e.created_at,
            e.updated_at
          )
        );
      await db.batch(batch);
    }

    // Generate and insert changelog
    const changelog = generateChangelog(allEntries);
    const changeStmt = db.prepare(`
      INSERT INTO transfer_portal_changelog (
        id, portal_entry_id, change_type, description,
        old_value, new_value, event_timestamp, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `);

    for (let i = 0; i < changelog.length; i += BATCH_SIZE) {
      const batch = changelog
        .slice(i, i + BATCH_SIZE)
        .map((c) =>
          changeStmt.bind(
            c.id,
            c.portal_entry_id,
            c.change_type,
            c.description,
            c.old_value,
            c.new_value,
            c.event_timestamp,
            c.created_at
          )
        );
      await db.batch(batch);
    }

    // Update KV freshness marker
    const now = new Date().toISOString();
    await env.KV.put('portal:last_updated', now);
    await env.KV.put('portal:seed_timestamp', now);

    // Store raw seed snapshot in R2
    const snapshot = {
      seeded_at: now,
      baseball_count: bbEntries.length,
      football_count: fbEntries.length,
    };
    await env.SPORTS_DATA.put(`portal/snapshots/seed-${Date.now()}.json`, JSON.stringify(snapshot));

    return new Response(
      JSON.stringify({
        success: true,
        baseball_entries: bbEntries.length,
        football_entries: fbEntries.length,
        changelog_events: changelog.length,
        seeded_at: now,
      }),
      { headers: HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: HEADERS });
  }
};
