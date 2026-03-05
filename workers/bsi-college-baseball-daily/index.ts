/**
 * BSI College Baseball Daily — Pipeline Worker
 *
 * Assembles daily digest bundles: pregame slate + prior-night recaps +
 * AI-generated matchup takes (Claude API) + paste-ready Claude Code prompt.
 *
 * Two cron triggers:
 *   11:00 UTC → 5 AM CT (morning: pregame + last night recap)
 *   05:00 UTC → 11 PM CT (evening: today's results recap)
 *
 * Data flow:
 *   KV cache (bsi-cbb-ingest) → ESPN fallback → normalize → Claude API takes
 *   → assemble bundle → KV + R2 storage
 *
 * Deploy: wrangler deploy --config workers/bsi-college-baseball-daily/wrangler.toml
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Env {
  KV: KVNamespace;
  DIGEST_BUCKET: R2Bucket;
  RAPIDAPI_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

type Edition = 'morning' | 'evening';

interface DailyBundle {
  run_date_local: string;
  timezone: string;
  lookback_date_local: string;
  edition: Edition;
  generated_at: string;
  data_quality_notes: Record<string, string>;
  sources_used: SourceEntry[];
  upcoming_games: GameSlateEntry[];
  prior_night_results: PriorNightResult[];
  standings_snapshot: ConferenceStanding[];
  rankings: RankingEntry[];
  site_rendering_constraints: typeof BRAND_CONFIG;
  claude_code_prompt: string;
  meta: { source: string; fetched_at: string; timezone: string };
}

interface SourceEntry {
  url: string;
  source_type: string;
  used_for: string[];
  status: number;
  duration_ms: number;
}

interface GameSlateEntry {
  game_key: string;
  start_time_local: string | null;
  venue: string | null;
  broadcast: string | null;
  away: TeamSlateEntry;
  home: TeamSlateEntry;
  betting_odds: { available: false; reason: string };
  matchup_take: string | null;
  data_quality_flags: string[];
}

interface TeamSlateEntry {
  team: string;
  record: string | null;
  rank: string | null;
  probable_pitcher: { player: string | null; hand: string | null };
}

interface PriorNightResult {
  game_key: string;
  final: { away: string; home: string; score_away: number; score_home: number };
  rhe: { away: RHE; home: RHE } | null;
  key_events_verified: string[];
  recap_take: string | null;
}

interface RHE { r: number; h: number; e: number }

interface ConferenceStanding {
  conference: string;
  teams: Array<{ team: string; wins: number; losses: number; conf_record: string | null }>;
}

interface RankingEntry {
  rank: number;
  team: string;
  record: string | null;
}

// Raw game shape — handles both Highlightly and ESPN formats from KV
interface RawGame {
  id?: string | number;
  homeTeam?: { name?: string; score?: number | string };
  awayTeam?: { name?: string; score?: number | string };
  homeScore?: number | string;
  awayScore?: number | string;
  status?: { type?: string };
  startTime?: string;
  venue?: { name?: string } | string;
  // ESPN format
  name?: string;
  date?: string;
  competitions?: Array<{
    venue?: { fullName?: string };
    competitors?: Array<{
      homeAway?: string;
      team?: { displayName?: string; abbreviation?: string };
      score?: string;
      records?: Array<{ summary?: string }>;
    }>;
    status?: { type?: { name?: string; completed?: boolean } };
    broadcasts?: Array<{ names?: string[] }>;
  }>;
}

// Normalized game — uniform shape regardless of source
interface NormalizedGame {
  id: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number | null;
  homeScore: number | null;
  awayRecord: string | null;
  homeRecord: string | null;
  status: 'scheduled' | 'in_progress' | 'final' | 'unknown';
  startTime: string | null;
  venue: string | null;
  broadcast: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const TZ = 'America/Chicago';
const ESPN_BASE = 'https://site.api.espn.com';
const SPORT_PATH = 'baseball/college-baseball';
const HIGHLIGHTLY_HOST = 'mlb-college-baseball-api.p.rapidapi.com';
const HIGHLIGHTLY_BASE = `https://${HIGHLIGHTLY_HOST}`;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CONFERENCES = ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'];

const BUNDLE_TTL = 86_400; // 24 hours
const FETCH_TIMEOUT = 12_000;
const MAX_MATCHUP_TAKES = 15;
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

const BRAND_CONFIG = {
  brand_colors: { burnt_orange: '#BF5700', charcoal: '#1A1A1A', midnight: '#0D0D0D', ember_accent_only: '#FF6B35' },
  fonts: { headings: 'Oswald', body: 'Cormorant Garamond' },
} as const;

// System prompt that defines the BSI editorial voice for matchup takes.
const BSI_MATCHUP_SYSTEM_PROMPT = `You are the BSI college baseball analyst. Your voice is calm, direct, and fundamentals-first — like a veteran pitching coach who sees the game through mechanics and matchups, not hype.

Rules:
- Use only the stats and facts provided. Never invent numbers.
- Cite specific numbers when available: ERA, record, run differential, margin.
- One tactical teaching point per matchup (e.g., first-pitch strike rate, bullpen leverage, defensive efficiency).
- Keep each take to 2-3 sentences. Precise, not wordy.
- Frame the matchup as a process question: "What will determine this game?"
- If data is limited (opening weekend, etc.), say so honestly — no speculation.
- Tone: steady teaching cadence. Season-as-story. No exclamation marks.`;

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

function isBaseballSeason(): boolean {
  const month = new Date().getMonth() + 1;
  return month >= 2 && month <= 6;
}

function getEdition(cronExpression: string): Edition {
  return cronExpression.includes('11') ? 'morning' : 'evening';
}

function todayCT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

function yesterdayCT(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

function nowCT(): string {
  return new Date().toLocaleString('en-US', { timeZone: TZ });
}

function dateToEspn(ymd: string): string {
  return ymd.replace(/-/g, '');
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function safeFetch<T>(
  url: string,
  headers?: Record<string, string>,
): Promise<{ ok: boolean; data?: T; status: number; error?: string; duration_ms: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BSI-Daily-Pipeline/1.0', ...headers },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const duration_ms = Date.now() - start;
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}`, duration_ms };
    return { ok: true, data: (await res.json()) as T, status: res.status, duration_ms };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'Fetch failed', duration_ms: Date.now() - start };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Layer — KV reads (reuses bsi-cbb-ingest cache, zero subrequests)
// ═══════════════════════════════════════════════════════════════════════════

async function readGamesFromKV(date: string, env: Env): Promise<RawGame[]> {
  // Try date-specific key first, then today's key
  for (const key of [`cb:scores:${date}`, 'cb:scores:today']) {
    const raw = await env.KV.get(key, 'text');
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const games = (parsed.data ?? parsed.events ?? []) as RawGame[];
      if (games.length > 0) return games;
    } catch { /* try next key */ }
  }
  return [];
}

async function fetchEspnScoreboard(date: string, sourceTrail: SourceEntry[]): Promise<RawGame[]> {
  const url = `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/scoreboard?dates=${dateToEspn(date)}&limit=200`;
  const result = await safeFetch<{ events?: RawGame[] }>(url);
  sourceTrail.push({ url, source_type: 'espn_scoreboard', used_for: ['schedule', 'scores'], status: result.status, duration_ms: result.duration_ms });
  return result.ok && result.data?.events ? result.data.events : [];
}

async function readRankingsFromKV(env: Env): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const raw = await env.KV.get('cb:rankings', 'text');
  if (!raw) return map;

  try {
    const parsed = JSON.parse(raw);

    // Highlightly format: { data: [{ rank, team: { name } }] }
    const hlEntries = parsed.data ?? [];
    for (const entry of hlEntries) {
      if (entry.rank && entry.team?.name) {
        map.set(entry.team.name, Number(entry.rank));
      }
    }

    // ESPN rankings format: [{ ranks: [{ current, team: { location } }] }]
    const espnEntries = parsed.rankings ?? (Array.isArray(parsed) ? parsed : []);
    for (const poll of espnEntries) {
      if (!poll.ranks) continue;
      for (const r of poll.ranks) {
        if (r.current && r.team?.location) {
          map.set(r.team.location, Number(r.current));
        }
      }
    }
  } catch { /* non-fatal */ }
  return map;
}

async function readStandingsFromKV(env: Env): Promise<ConferenceStanding[]> {
  const standings: ConferenceStanding[] = [];

  for (const conf of CONFERENCES) {
    const raw = await env.KV.get(`cb:standings:raw:${conf}`, 'text');
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const teams: ConferenceStanding['teams'] = [];
      const entries = parsed.data ?? (Array.isArray(parsed) ? parsed : []);

      for (const entry of entries) {
        // Highlightly format
        if (entry.team?.name) {
          teams.push({
            team: entry.team.name,
            wins: Number(entry.wins ?? entry.overallWins ?? 0),
            losses: Number(entry.losses ?? entry.overallLosses ?? 0),
            conf_record: entry.conferenceRecord ?? null,
          });
        }
        // ESPN format: { standings: { entries: [...] } }
        if (entry.standings?.entries) {
          for (const se of entry.standings.entries) {
            const w = se.stats?.find((s: { name: string; value: number }) => s.name === 'wins');
            const l = se.stats?.find((s: { name: string; value: number }) => s.name === 'losses');
            teams.push({
              team: se.team?.displayName ?? se.team?.location ?? '',
              wins: Number(w?.value ?? 0),
              losses: Number(l?.value ?? 0),
              conf_record: null,
            });
          }
        }
      }

      if (teams.length > 0) {
        standings.push({ conference: conf, teams: teams.slice(0, 15) });
      }
    } catch { /* non-fatal */ }
  }

  return standings;
}

// ═══════════════════════════════════════════════════════════════════════════
// Game Normalization — uniform shape from Highlightly or ESPN
// ═══════════════════════════════════════════════════════════════════════════

function normalizeGame(raw: RawGame): NormalizedGame {
  // ESPN format: has competitions array
  if (raw.competitions?.length) {
    const comp = raw.competitions[0];
    const home = comp.competitors?.find(c => c.homeAway === 'home');
    const away = comp.competitors?.find(c => c.homeAway === 'away');
    const statusName = comp.status?.type?.name ?? '';

    let status: NormalizedGame['status'] = 'unknown';
    if (statusName.includes('FINAL') || comp.status?.type?.completed) status = 'final';
    else if (statusName.includes('IN_PROGRESS')) status = 'in_progress';
    else if (statusName.includes('SCHEDULED') || statusName.includes('PRE')) status = 'scheduled';

    return {
      id: String(raw.id ?? ''),
      awayTeam: away?.team?.displayName ?? '',
      homeTeam: home?.team?.displayName ?? '',
      awayScore: away?.score != null ? Number(away.score) : null,
      homeScore: home?.score != null ? Number(home.score) : null,
      awayRecord: away?.records?.[0]?.summary ?? null,
      homeRecord: home?.records?.[0]?.summary ?? null,
      status,
      startTime: raw.date ?? null,
      venue: comp.venue?.fullName ?? null,
      broadcast: comp.broadcasts?.[0]?.names?.[0] ?? null,
    };
  }

  // Highlightly format
  const statusType = (raw.status?.type ?? '').toLowerCase();
  let status: NormalizedGame['status'] = 'unknown';
  if (statusType === 'finished' || statusType === 'final') status = 'final';
  else if (statusType === 'inprogress' || statusType === 'live') status = 'in_progress';
  else if (statusType === 'scheduled' || statusType === 'notstarted') status = 'scheduled';

  return {
    id: String(raw.id ?? ''),
    awayTeam: raw.awayTeam?.name ?? '',
    homeTeam: raw.homeTeam?.name ?? '',
    awayScore: raw.awayScore != null ? Number(raw.awayScore) : (raw.awayTeam?.score != null ? Number(raw.awayTeam.score) : null),
    homeScore: raw.homeScore != null ? Number(raw.homeScore) : (raw.homeTeam?.score != null ? Number(raw.homeTeam.score) : null),
    awayRecord: null,
    homeRecord: null,
    status,
    startTime: raw.startTime ?? null,
    venue: typeof raw.venue === 'string' ? raw.venue : raw.venue?.name ?? null,
    broadcast: null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Notable Game Detection
// ═══════════════════════════════════════════════════════════════════════════

function getRank(teamName: string, rankMap: Map<string, number>): string | null {
  if (rankMap.has(teamName)) return String(rankMap.get(teamName));
  // Fuzzy: check containment (e.g., "Texas Longhorns" vs "Texas")
  for (const [ranked, rank] of rankMap) {
    if (teamName.includes(ranked) || ranked.includes(teamName)) return String(rank);
  }
  return null;
}

function isNotableGame(game: NormalizedGame, rankMap: Map<string, number>): boolean {
  return getRank(game.awayTeam, rankMap) !== null || getRank(game.homeTeam, rankMap) !== null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Claude API — Matchup Takes (batched, one call for all notable games)
// ═══════════════════════════════════════════════════════════════════════════

async function generateMatchupTakes(
  games: NormalizedGame[],
  edition: Edition,
  rankMap: Map<string, number>,
  env: Env,
  sourceTrail: SourceEntry[],
): Promise<Map<string, string>> {
  const takes = new Map<string, string>();
  const notable = games.filter(g => isNotableGame(g, rankMap)).slice(0, MAX_MATCHUP_TAKES);

  if (notable.length === 0) return takes;

  // If no API key, use stat-driven templates
  if (!env.ANTHROPIC_API_KEY) {
    for (const g of notable) takes.set(g.id, buildTemplateTake(g, edition, rankMap));
    return takes;
  }

  const userPrompt = buildBatchPrompt(notable, edition, rankMap);
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000); // 30s for AI call
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: BSI_MATCHUP_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    sourceTrail.push({
      url: ANTHROPIC_API_URL,
      source_type: 'claude_api',
      used_for: ['matchup_takes'],
      status: res.status,
      duration_ms: Date.now() - start,
    });

    if (!res.ok) throw new Error(`Claude API ${res.status}`);

    const data = await res.json() as { content: Array<{ text: string }> };
    const responseText = data.content?.[0]?.text ?? '';
    parseBatchResponse(responseText, notable, takes);
  } catch {
    // Graceful fallback — templates instead of AI takes
    for (const g of notable) {
      if (!takes.has(g.id)) takes.set(g.id, buildTemplateTake(g, edition, rankMap));
    }
  }

  return takes;
}

function buildBatchPrompt(games: NormalizedGame[], edition: Edition, rankMap: Map<string, number>): string {
  const header = edition === 'morning'
    ? 'Generate pregame matchup takes for these college baseball games. For each, identify the key strategic question and one teaching point.'
    : 'Generate postgame recap takes for these college baseball results. For each, identify what decided the game and one teaching point.';

  const lines = games.map((g, i) => {
    const awayRank = getRank(g.awayTeam, rankMap);
    const homeRank = getRank(g.homeTeam, rankMap);
    const away = awayRank ? `#${awayRank} ${g.awayTeam}` : g.awayTeam;
    const home = homeRank ? `#${homeRank} ${g.homeTeam}` : g.homeTeam;

    if (edition === 'morning') {
      return `${i + 1}. ${away}${g.awayRecord ? ` (${g.awayRecord})` : ''} at ${home}${g.homeRecord ? ` (${g.homeRecord})` : ''} — ${g.venue ?? 'TBD'}, ${g.startTime ?? 'TBD'}`;
    }
    return `${i + 1}. ${away} ${g.awayScore ?? '?'}, ${home} ${g.homeScore ?? '?'} (Final)${g.venue ? ` — ${g.venue}` : ''}`;
  });

  return `${header}\n\nRespond with a numbered list matching the game numbers. Each take: 2-3 sentences.\n\n${lines.join('\n')}`;
}

function parseBatchResponse(text: string, games: NormalizedGame[], takes: Map<string, string>): void {
  const segments = text.split(/\n(?=\d+\.)/);
  for (const segment of segments) {
    const match = segment.match(/^(\d+)\.\s*([\s\S]+)/);
    if (!match) continue;
    const idx = parseInt(match[1], 10) - 1;
    if (idx >= 0 && idx < games.length) {
      takes.set(games[idx].id, match[2].trim());
    }
  }
}

function buildTemplateTake(game: NormalizedGame, edition: Edition, rankMap: Map<string, number>): string {
  const awayRank = getRank(game.awayTeam, rankMap);
  const homeRank = getRank(game.homeTeam, rankMap);
  const away = awayRank ? `#${awayRank} ${game.awayTeam}` : game.awayTeam;
  const home = homeRank ? `#${homeRank} ${game.homeTeam}` : game.homeTeam;

  if (edition === 'evening' && game.awayScore != null && game.homeScore != null) {
    const winner = game.homeScore > game.awayScore ? home : away;
    const margin = Math.abs(game.homeScore - game.awayScore);
    return `${winner} wins${margin <= 2 ? ' in a tight one' : ''}, ${game.awayScore}-${game.homeScore}.`;
  }

  return `${away}${game.awayRecord ? ` (${game.awayRecord})` : ''} at ${home}${game.homeRecord ? ` (${game.homeRecord})` : ''}.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Bundle Assembly
// ═══════════════════════════════════════════════════════════════════════════

function assembleBundle(
  edition: Edition,
  runDate: string,
  lookbackDate: string,
  upcomingGames: NormalizedGame[],
  priorNightGames: NormalizedGame[],
  rankMap: Map<string, number>,
  standings: ConferenceStanding[],
  takes: Map<string, string>,
  sourceTrail: SourceEntry[],
  qualityNotes: Record<string, string>,
): DailyBundle {
  const upcoming: GameSlateEntry[] = upcomingGames.map(g => ({
    game_key: `${runDate}-${slugify(g.awayTeam)}-${slugify(g.homeTeam)}`,
    start_time_local: g.startTime,
    venue: g.venue,
    broadcast: g.broadcast,
    away: {
      team: g.awayTeam,
      record: g.awayRecord,
      rank: getRank(g.awayTeam, rankMap),
      probable_pitcher: { player: null, hand: null },
    },
    home: {
      team: g.homeTeam,
      record: g.homeRecord,
      rank: getRank(g.homeTeam, rankMap),
      probable_pitcher: { player: null, hand: null },
    },
    betting_odds: { available: false as const, reason: 'College baseball odds not yet integrated' },
    matchup_take: takes.get(g.id) ?? null,
    data_quality_flags: buildQualityFlags(g),
  }));

  const results: PriorNightResult[] = priorNightGames
    .filter(g => g.status === 'final')
    .map(g => ({
      game_key: `${lookbackDate}-${slugify(g.awayTeam)}-${slugify(g.homeTeam)}`,
      final: {
        away: g.awayTeam,
        home: g.homeTeam,
        score_away: g.awayScore ?? 0,
        score_home: g.homeScore ?? 0,
      },
      rhe: null,
      key_events_verified: [],
      recap_take: takes.get(g.id) ?? null,
    }));

  const rankingsArray: RankingEntry[] = Array.from(rankMap.entries())
    .sort(([, a], [, b]) => a - b)
    .map(([team, rank]) => ({ rank, team, record: null }));

  const generated_at = new Date().toISOString();

  const prompt = generateClaudeCodePrompt(
    edition, runDate, lookbackDate, upcoming, results, rankingsArray, standings, sourceTrail,
  );

  return {
    run_date_local: runDate,
    timezone: TZ,
    lookback_date_local: lookbackDate,
    edition,
    generated_at,
    data_quality_notes: qualityNotes,
    sources_used: sourceTrail,
    upcoming_games: upcoming,
    prior_night_results: results,
    standings_snapshot: standings,
    rankings: rankingsArray,
    site_rendering_constraints: BRAND_CONFIG,
    claude_code_prompt: prompt,
    meta: { source: 'bsi-college-baseball-daily', fetched_at: generated_at, timezone: TZ },
  };
}

function buildQualityFlags(game: NormalizedGame): string[] {
  const flags: string[] = [];
  if (!game.venue) flags.push('venue_unknown');
  if (!game.broadcast) flags.push('broadcast_unknown');
  if (!game.startTime) flags.push('start_time_unknown');
  flags.push('probable_pitcher_unknown', 'lineups_not_posted', 'odds_missing');
  return flags;
}

// ═══════════════════════════════════════════════════════════════════════════
// Claude Code Prompt Generation — paste-ready context document
// ═══════════════════════════════════════════════════════════════════════════

function generateClaudeCodePrompt(
  edition: Edition,
  runDate: string,
  lookbackDate: string,
  upcoming: GameSlateEntry[],
  results: PriorNightResult[],
  rankings: RankingEntry[],
  standings: ConferenceStanding[],
  sourceTrail: SourceEntry[],
): string {
  const out: string[] = [];
  const label = edition === 'morning' ? 'Morning Pregame + Recap' : 'Evening Recap';

  out.push(`# BSI College Baseball Daily — ${label}`);
  out.push(`**Date:** ${runDate} | **Generated:** ${nowCT()} CT`);
  out.push('');
  out.push('> All data below is verified from API sources. Do not web search for scores, stats, or standings.');
  out.push('> Fields marked null are genuinely unavailable — do not fill them with guesses.');
  out.push('');

  // — Today's Slate —
  if (upcoming.length > 0) {
    const notable = upcoming.filter(g => g.away.rank || g.home.rank);
    const other = upcoming.filter(g => !g.away.rank && !g.home.rank);

    out.push(`## Today's Slate (${upcoming.length} games)`);
    out.push('');

    if (notable.length > 0) {
      out.push('### Featured (Ranked Matchups)');
      for (const g of notable) {
        const away = g.away.rank ? `#${g.away.rank} ${g.away.team}` : g.away.team;
        const home = g.home.rank ? `#${g.home.rank} ${g.home.team}` : g.home.team;
        out.push(`- **${away}** at **${home}** — ${g.start_time_local ?? 'TBD'} CT, ${g.venue ?? 'TBD'}${g.broadcast ? ` (${g.broadcast})` : ''}`);
        if (g.matchup_take) out.push(`  > ${g.matchup_take}`);
      }
      out.push('');
    }

    if (other.length > 0) {
      out.push(`### Full Slate (${other.length} additional games)`);
      for (const g of other) {
        out.push(`- ${g.away.team} at ${g.home.team} — ${g.start_time_local ?? 'TBD'} CT${g.venue ? `, ${g.venue}` : ''}${g.broadcast ? ` (${g.broadcast})` : ''}`);
      }
      out.push('');
    }
  }

  // — Prior Night Results —
  if (results.length > 0) {
    out.push(`## Last Night's Results (${lookbackDate})`);
    out.push('');
    for (const g of results) {
      const ws = Math.max(g.final.score_home, g.final.score_away);
      const ls = Math.min(g.final.score_home, g.final.score_away);
      const winner = g.final.score_home > g.final.score_away ? g.final.home : g.final.away;
      const loser = g.final.score_home > g.final.score_away ? g.final.away : g.final.home;
      out.push(`- **${winner} ${ws}, ${loser} ${ls}**`);
      if (g.recap_take) out.push(`  > ${g.recap_take}`);
    }
    out.push('');
  }

  // — Rankings —
  if (rankings.length > 0) {
    out.push('## Top 25 Rankings');
    out.push('');
    for (const r of rankings.slice(0, 25)) {
      out.push(`${r.rank}. ${r.team}${r.record ? ` (${r.record})` : ''}`);
    }
    out.push('');
  }

  // — Standings —
  if (standings.length > 0) {
    out.push('## Conference Standings Snapshot');
    out.push('');
    for (const conf of standings) {
      out.push(`### ${conf.conference}`);
      for (const t of conf.teams.slice(0, 5)) {
        out.push(`- ${t.team}: ${t.wins}-${t.losses}${t.conf_record ? ` (${t.conf_record})` : ''}`);
      }
      out.push('');
    }
  }

  // — Source Trail —
  out.push('## Source Trail');
  out.push('');
  for (const s of sourceTrail) {
    out.push(`- \\[${s.source_type}\\] ${s.url} — HTTP ${s.status}, ${s.duration_ms}ms → ${s.used_for.join(', ')}`);
  }
  out.push('');

  // — BSI Codebase Context —
  out.push('## BSI Codebase Context');
  out.push('');
  out.push('- KV keys: `cb:daily:morning:{date}`, `cb:daily:evening:{date}`, `cb:daily:latest`');
  out.push('- API route: `/api/college-baseball/daily?edition=morning|evening&date=YYYY-MM-DD`');
  out.push('- Worker: `workers/bsi-college-baseball-daily/index.ts`');
  out.push('- Main router: `workers/index.ts` → `handleCollegeBaseballDaily()`');
  out.push('- Frontend: `app/college-baseball/daily/page.tsx` (future)');
  out.push('');

  return out.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// Storage — KV for serving, R2 for archiving
// ═══════════════════════════════════════════════════════════════════════════

async function storeBundle(bundle: DailyBundle, env: Env): Promise<void> {
  const { edition, run_date_local: date } = bundle;
  const json = JSON.stringify(bundle);

  await Promise.all([
    env.KV.put(`cb:daily:${edition}:${date}`, json, { expirationTtl: BUNDLE_TTL }),
    env.KV.put('cb:daily:latest', json, { expirationTtl: BUNDLE_TTL }),
    env.KV.put('cb:daily:last-run', JSON.stringify({
      edition,
      date,
      generated_at: bundle.generated_at,
      upcoming_count: bundle.upcoming_games.length,
      results_count: bundle.prior_night_results.length,
      takes_generated: bundle.upcoming_games.filter(g => g.matchup_take).length,
    }), { expirationTtl: BUNDLE_TTL }),
  ]);

  // R2: permanent archive — markdown prompt + full JSON
  await Promise.all([
    env.DIGEST_BUCKET.put(`daily-digest/${date}-${edition}.md`, bundle.claude_code_prompt, {
      httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
      customMetadata: { edition, date, generated_at: bundle.generated_at },
    }),
    env.DIGEST_BUCKET.put(`daily-digest/${date}-${edition}.json`, json, {
      httpMetadata: { contentType: 'application/json; charset=utf-8' },
      customMetadata: { edition, date, generated_at: bundle.generated_at },
    }),
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Orchestration
// ═══════════════════════════════════════════════════════════════════════════

async function runPipeline(edition: Edition, env: Env): Promise<DailyBundle> {
  const runDate = todayCT();
  const lookbackDate = yesterdayCT();
  const sourceTrail: SourceEntry[] = [];
  const qualityNotes: Record<string, string> = {};

  if (!isBaseballSeason()) qualityNotes.season = 'off-season — data may be sparse';

  // Gather today's games (KV first, ESPN fallback)
  let todayRaw = await readGamesFromKV(runDate, env);
  if (todayRaw.length === 0) {
    todayRaw = await fetchEspnScoreboard(runDate, sourceTrail);
    qualityNotes.today_source = 'espn_direct (KV miss)';
  } else {
    qualityNotes.today_source = 'kv_cache';
  }

  // Gather yesterday's games for recap
  let yesterdayRaw = await readGamesFromKV(lookbackDate, env);
  if (yesterdayRaw.length === 0) {
    yesterdayRaw = await fetchEspnScoreboard(lookbackDate, sourceTrail);
    qualityNotes.yesterday_source = 'espn_direct (KV miss)';
  } else {
    qualityNotes.yesterday_source = 'kv_cache';
  }

  // Rankings + standings from KV
  const rankMap = await readRankingsFromKV(env);
  const standings = await readStandingsFromKV(env);
  if (rankMap.size === 0) qualityNotes.rankings = 'unavailable';
  if (standings.length === 0) qualityNotes.standings = 'unavailable';

  // Normalize
  const todayGames = todayRaw.map(normalizeGame).filter(g => g.awayTeam && g.homeTeam);
  const yesterdayGames = yesterdayRaw.map(normalizeGame).filter(g => g.awayTeam && g.homeTeam);

  // Split by edition: morning gets pregame + recap, evening gets today's finals
  const gamesForTakes = edition === 'morning'
    ? [...todayGames, ...yesterdayGames.filter(g => g.status === 'final')]
    : [...todayGames.filter(g => g.status === 'final')];

  // Claude API matchup takes
  const takes = await generateMatchupTakes(gamesForTakes, edition, rankMap, env, sourceTrail);

  // Assemble
  const upcomingGames = edition === 'morning'
    ? todayGames.filter(g => g.status !== 'final')
    : [];
  const priorNightGames = edition === 'morning' ? yesterdayGames : todayGames;

  const bundle = assembleBundle(
    edition, runDate, lookbackDate,
    upcomingGames, priorNightGames,
    rankMap, standings, takes, sourceTrail, qualityNotes,
  );

  await storeBundle(bundle, env);
  return bundle;
}

// ═══════════════════════════════════════════════════════════════════════════
// Worker Entry
// ═══════════════════════════════════════════════════════════════════════════

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const edition = getEdition(event.cron ?? '');
    ctx.waitUntil(
      runPipeline(edition, env).catch(err => {
        console.error(`Daily pipeline failed (${edition}):`, err);
      }),
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const jsonHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    };

    // POST /trigger or GET / — run pipeline manually
    if (url.pathname === '/' || url.pathname === '/trigger') {
      const edition = (url.searchParams.get('edition') as Edition) ?? 'morning';
      try {
        const bundle = await runPipeline(edition, env);
        return new Response(JSON.stringify(bundle), { headers: jsonHeaders });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err instanceof Error ? err.message : 'Pipeline failed' }),
          { status: 500, headers: jsonHeaders },
        );
      }
    }

    // GET /status — last run info
    if (url.pathname === '/status') {
      const lastRun = await env.KV.get('cb:daily:last-run', 'text');
      return new Response(JSON.stringify({
        ok: true,
        season: isBaseballSeason(),
        last_run: lastRun ? JSON.parse(lastRun) : null,
        now_ct: nowCT(),
      }), { headers: jsonHeaders });
    }

    // GET /bundle?date=YYYY-MM-DD&edition=morning — retrieve stored bundle
    if (url.pathname === '/bundle') {
      const date = url.searchParams.get('date') ?? todayCT();
      const edition = url.searchParams.get('edition') ?? 'latest';
      const kvKey = edition === 'latest' ? 'cb:daily:latest' : `cb:daily:${edition}:${date}`;
      const raw = await env.KV.get(kvKey, 'text');
      if (!raw) {
        const fallback = await env.KV.get('cb:daily:latest', 'text');
        if (fallback) return new Response(fallback, { headers: jsonHeaders });
        return new Response(JSON.stringify({ error: 'No bundle found' }), { status: 404, headers: jsonHeaders });
      }
      return new Response(raw, { headers: jsonHeaders });
    }

    // GET /prompt?date=YYYY-MM-DD&edition=morning — Claude Code prompt from R2
    if (url.pathname === '/prompt') {
      const date = url.searchParams.get('date') ?? todayCT();
      const edition = url.searchParams.get('edition') ?? 'morning';
      const obj = await env.DIGEST_BUCKET.get(`daily-digest/${date}-${edition}.md`);
      if (!obj) {
        return new Response(JSON.stringify({ error: 'Prompt not found' }), { status: 404, headers: jsonHeaders });
      }
      return new Response(obj.body, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Not found', routes: ['/', '/status', '/bundle', '/prompt'] }),
      { status: 404, headers: jsonHeaders },
    );
  },
};
