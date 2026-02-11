'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import type {
  IntelGame,
  IntelMode,
  IntelSignal,
  IntelSport,
  GameStatus,
  StandingsTeam,
  CommandPaletteItem,
  NewsItem,
} from './types';
import { ESPN_NEWS_MAP, SPORT_API_MAP } from './types';
import { SIGNAL_TYPES_BY_MODE } from './sample-data';

// ─── Clock ──────────────────────────────────────────────────────────────────

export function useChicagoClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'America/Chicago',
  });
  const date = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'America/Chicago',
  });
  return { time, date, now };
}

// ─── Pinned Briefing ────────────────────────────────────────────────────────

const PIN_KEY = 'bsi-intel-pinned';

export function usePinnedBriefing() {
  const [pinned, setPinned] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(PIN_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch { return new Set(); }
  });

  const toggle = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(PIN_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const isPinned = useCallback((id: string) => pinned.has(id), [pinned]);

  return { pinned, toggle, isPinned };
}

// ─── API Fetching ───────────────────────────────────────────────────────────

function sportApiBase(sport: Exclude<IntelSport, 'all'>): string {
  return SPORT_API_MAP[sport];
}

function scoresEndpoint(sport: Exclude<IntelSport, 'all'>): string {
  if (sport === 'ncaabsb') return `${sportApiBase(sport)}/schedule`;
  const base = sportApiBase(sport);
  return sport === 'nba' || sport === 'cbb' ? `${base}/scoreboard` : `${base}/scores`;
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── Normalize ESPN Data → IntelGame ────────────────────────────────────────

function parseStatus(status: unknown): { gameStatus: GameStatus; detail?: string } {
  if (typeof status === 'string') {
    const low = status.toLowerCase();
    if (
      low === 'live' ||
      low.includes('in progress') ||
      low.includes('in ') ||
      low.includes('inning') ||
      low.includes('q')
    ) {
      return { gameStatus: 'live', detail: status };
    }
    if (low.includes('final') || low.includes('complete')) return { gameStatus: 'final', detail: status };
    return { gameStatus: 'scheduled', detail: status };
  }
  if (typeof status === 'object' && status) {
    const s = status as Record<string, unknown>;
    const type = s.type as Record<string, unknown> | undefined;
    const state = type?.state as string | undefined;
    const desc =
      (s.detailedState as string) ||
      (type?.detail as string) ||
      (type?.shortDetail as string) ||
      (type?.description as string) ||
      'Scheduled';
    if (state === 'in' || s.isLive === true) return { gameStatus: 'live', detail: desc };
    if (state === 'post' || s.isFinal === true) return { gameStatus: 'final', detail: desc };
    return { gameStatus: 'scheduled', detail: desc };
  }
  return { gameStatus: 'scheduled' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dig(obj: any, ...paths: string[]): unknown {
  for (const p of paths) {
    const v = p.split('.').reduce((o, k) => o?.[k], obj);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function parseRecordSummary(record?: string): { wins: number; losses: number } | null {
  if (!record) return null;
  const m = record.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  const wins = Number(m[1]);
  const losses = Number(m[2]);
  if (!Number.isFinite(wins) || !Number.isFinite(losses)) return null;
  return { wins, losses };
}

function extractRecordSummary(raw: Record<string, unknown>): string {
  const direct = dig(raw, 'record', 'team.record');
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  if (typeof direct === 'object' && direct !== null) {
    const directObj = direct as Record<string, unknown>;
    if (typeof directObj.summary === 'string' && directObj.summary.trim()) return directObj.summary.trim();
    const wins = asNumber(directObj.wins);
    const losses = asNumber(directObj.losses);
    if (wins !== undefined && losses !== undefined) return `${wins}-${losses}`;
  }

  const overallRecord = asObject(dig(raw, 'overallRecord', 'team.overallRecord'));
  if (overallRecord) {
    const wins = asNumber(dig(overallRecord, 'wins', 'w'));
    const losses = asNumber(dig(overallRecord, 'losses', 'l'));
    if (wins !== undefined && losses !== undefined) return `${wins}-${losses}`;
  }

  const records = asArray(dig(raw, 'records', 'team.records'));
  const normalized = records
    .map((r) => asObject(r))
    .filter((r): r is Record<string, unknown> => r !== null);

  if (normalized.length === 0) return '';

  const overall =
    normalized.find((r) => String(r.name || '').toLowerCase() === 'overall') ||
    normalized.find((r) => String(r.type || '').toLowerCase() === 'total') ||
    normalized[0];

  const summary = String(overall.summary || '').trim();
  return summary;
}

function normalizeTeam(raw: Record<string, unknown>, fallbackName: string): IntelGame['home'] {
  const team = asObject(raw.team) ?? {};

  const displayName =
    String(
      dig(
        raw,
        'displayName',
        'name',
        'shortName',
        'team.displayName',
        'team.name',
        'team.shortName',
        'team.shortDisplayName',
        'abbreviation',
      ) || fallbackName,
    ).trim();

  const abbreviation = String(
    dig(raw, 'abbreviation', 'shortName', 'team.abbreviation', 'team.shortName') || '',
  )
    .trim()
    .toUpperCase();
  const score = asNumber(dig(raw, 'score', 'team.score')) ?? 0;
  const logo = String(dig(raw, 'team.logo', 'logo', 'team.logos.0.href', 'logos.0.href') || '').trim();

  const rankCandidate = asNumber(
    dig(
      raw,
      'curatedRank.current',
      'team.curatedRank.current',
      'curatedRank',
      'team.curatedRank',
      'rank',
      'team.rank',
      'seed',
      'team.seed',
    ),
  );

  return {
    name: displayName || fallbackName,
    abbreviation,
    score,
    logo: logo || undefined,
    rank: rankCandidate && rankCandidate > 0 ? rankCandidate : undefined,
    record: extractRecordSummary(raw) || undefined,
  };
}

function homeEdgeBySport(sport: Exclude<IntelSport, 'all'>): number {
  switch (sport) {
    case 'nba':
    case 'cbb':
      return 0.04;
    case 'ncaabsb':
      return 0.035;
    case 'ncaafb':
      return 0.045;
    case 'nfl':
      return 0.03;
    case 'mlb':
    default:
      return 0.025;
  }
}

function estimatePregameWinProbability(
  sport: Exclude<IntelSport, 'all'>,
  homeRecord?: string,
  awayRecord?: string,
): { home: number; away: number } {
  const parsedHome = parseRecordSummary(homeRecord);
  const parsedAway = parseRecordSummary(awayRecord);

  const homePct = parsedHome ? parsedHome.wins / Math.max(parsedHome.wins + parsedHome.losses, 1) : 0.5;
  const awayPct = parsedAway ? parsedAway.wins / Math.max(parsedAway.wins + parsedAway.losses, 1) : 0.5;
  const hfa = homeEdgeBySport(sport);

  const rawHomeProb = 0.5 + (homePct - awayPct) * 0.9 + hfa;
  const clamped = Math.min(0.88, Math.max(0.12, rawHomeProb));
  const home = Math.round(clamped * 100);
  return { home, away: 100 - home };
}

function normalizeToIntelGames(sport: Exclude<IntelSport, 'all'>, data: Record<string, unknown>): IntelGame[] {
  const raw = asArray(dig(data, 'games', 'data', 'scoreboard.games', 'scoreboard.events', 'events', 'data.games'))
    .map((g) => asObject(g))
    .filter((g): g is Record<string, unknown> => g !== null);

  return raw.map((g, i) => {
    const teams = asObject(g.teams) as Record<string, Record<string, unknown>> | null;
    const competition = asObject(asArray(g.competitions)[0]) ?? {};
    const competitors = asArray(competition.competitors)
      .map((c) => asObject(c))
      .filter((c): c is Record<string, unknown> => c !== null);

    const awayFromComp = competitors.find((c) => String(c.homeAway || '').toLowerCase() === 'away');
    const homeFromComp = competitors.find((c) => String(c.homeAway || '').toLowerCase() === 'home');

    const awayRaw =
      teams?.away ||
      asObject(g.awayTeam) ||
      awayFromComp ||
      competitors[1] ||
      {};
    const homeRaw =
      teams?.home ||
      asObject(g.homeTeam) ||
      homeFromComp ||
      competitors[0] ||
      {};

    const away = normalizeTeam(awayRaw, 'Away');
    const home = normalizeTeam(homeRaw, 'Home');
    const { gameStatus, detail } = parseStatus(g.status || competition.status);
    const headline = String(
      dig(g, 'competitions.0.notes.0.headline', 'notes.0.headline', 'headline', 'shortDetail', 'situation') || '',
    ).trim();
    const venue = String(
      dig(g, 'venue', 'competitions.0.venue.fullName', 'competitions.0.venue.address.city') || '',
    ).trim();
    const startTime = String(
      dig(g, 'startTime', 'time', 'startDate', 'date', 'competitions.0.date') || '',
    ).trim();
    const isPregameNoScore = gameStatus === 'scheduled' && away.score === 0 && home.score === 0;

    return {
      id: String(g.id ?? i),
      sport,
      away,
      home,
      status: gameStatus,
      statusDetail: detail,
      headline: headline || undefined,
      venue: venue || undefined,
      startTime: startTime || undefined,
      tier: 'standard' as const,
      signalCount: 0,
      winProbability: isPregameNoScore
        ? estimatePregameWinProbability(sport, home.record, away.record)
        : undefined,
    };
  });
}

function normalizeStandings(data: Record<string, unknown>): StandingsTeam[] {
  const normalized: StandingsTeam[] = [];

  const directList = asArray(dig(data, 'standings', 'teams', 'entries', 'data'));
  const rootArray = Array.isArray(data) ? data : [];
  const blocks = directList.length > 0
    ? directList
    : asArray(dig(data, 'standings.children', 'children')).length > 0
      ? asArray(dig(data, 'standings.children', 'children'))
      : rootArray;

  function parseEntry(entryRaw: unknown, conference?: string, division?: string) {
    const entry = asObject(entryRaw);
    if (!entry) return;

    const team = asObject(entry.team) ?? entry;
    const teamName = String(
      dig(team, 'displayName', 'name', 'shortDisplayName', 'location') ||
      dig(entry, 'teamName', 'name') ||
      '',
    ).trim();

    if (!teamName) return;

    const abbreviation = String(dig(team, 'abbreviation', 'abbrev', 'shortName') || '').trim().toUpperCase() || undefined;
    const logo = String(dig(team, 'logo', 'logos.0.href') || '').trim() || undefined;
    const rankValue = asNumber(dig(entry, 'curatedRank.current', 'team.curatedRank.current', 'seed'));

    const stats = asArray(entry.stats)
      .map((s) => asObject(s))
      .filter((s): s is Record<string, unknown> => s !== null);

    const getStat = (...keys: string[]) =>
      stats.find((s) => keys.includes(String(s.name || '').toLowerCase()) || keys.includes(String(s.abbreviation || '').toLowerCase()));
    const statNumber = (...keys: string[]) => {
      const stat = getStat(...keys);
      return asNumber(stat?.value ?? stat?.displayValue);
    };
    const statDisplay = (...keys: string[]) => {
      const stat = getStat(...keys);
      const value = stat?.displayValue ?? stat?.summary;
      return typeof value === 'string' ? value : '';
    };

    const summary = statDisplay('overall', 'record');
    const parsedSummary = parseRecordSummary(summary);
    const overallRecord = asObject(dig(entry, 'overallRecord'));
    const overallWins = asNumber(dig(overallRecord ?? {}, 'wins', 'w'));
    const overallLosses = asNumber(dig(overallRecord ?? {}, 'losses', 'l'));
    const wins = statNumber('wins', 'w') ?? parsedSummary?.wins ?? overallWins ?? asNumber(entry.wins) ?? 0;
    const losses =
      statNumber('losses', 'l') ?? parsedSummary?.losses ?? overallLosses ?? asNumber(entry.losses) ?? 0;
    const winPct = statNumber('winpercent', 'winpercentage', 'winpct', 'pct') ?? asNumber(entry.winPct);
    const netRating = statNumber('netrating', 'netrtg', 'pointdifferential', 'pointdiff') ?? asNumber(entry.netRating);
    const explicitConference =
      String(dig(entry, 'conference', 'team.conference', 'conferenceRecord.conference') || '').trim() || undefined;
    const explicitDivision = String(dig(entry, 'division', 'team.division') || '').trim() || undefined;

    normalized.push({
      teamName,
      abbreviation,
      logo,
      rank: rankValue && rankValue > 0 ? rankValue : undefined,
      wins,
      losses,
      winPct: winPct ?? (wins + losses > 0 ? wins / (wins + losses) : undefined),
      netRating: netRating ?? undefined,
      conference: explicitConference ?? conference,
      division: explicitDivision ?? division,
    });
  }

  for (const blockRaw of blocks) {
    const block = asObject(blockRaw);
    if (!block) continue;

    // Already normalized row shape
    if (typeof block.teamName === 'string' && (typeof block.wins === 'number' || typeof block.losses === 'number')) {
      normalized.push({
        teamName: block.teamName as string,
        abbreviation: typeof block.abbreviation === 'string' ? block.abbreviation : undefined,
        logo: typeof block.logo === 'string' ? block.logo : undefined,
        rank: asNumber(block.rank),
        wins: asNumber(block.wins) ?? 0,
        losses: asNumber(block.losses) ?? 0,
        winPct: asNumber(block.winPct),
        netRating: asNumber(block.netRating),
        conference: typeof block.conference === 'string' ? block.conference : undefined,
        division: typeof block.division === 'string' ? block.division : undefined,
      });
      continue;
    }

    const conference = String(block.name || block.abbreviation || '').trim() || undefined;
    const entries = asArray(dig(block, 'standings.entries', 'entries'));

    if (entries.length > 0) {
      for (const entry of entries) parseEntry(entry, conference);
      continue;
    }

    // Some payloads place a single entry at this level
    parseEntry(block, conference);
  }

  return normalized
    .filter((t) => t.teamName && Number.isFinite(t.wins) && Number.isFinite(t.losses))
    .slice(0, 20);
}

function normalizeNews(
  payloads: Array<{ sport: Exclude<IntelSport, 'all'>; data: Record<string, unknown> }>,
): NewsItem[] {
  const allArticles = payloads.flatMap(({ sport, data }) => {
    const nestedItems = asArray(dig(data, 'articles', 'news'));
    const items = (nestedItems.length > 0 ? nestedItems : asArray(data))
      .map((a) => asObject(a))
      .filter((a): a is Record<string, unknown> => a !== null);
    return items.map((a, i) => {
      const images = asArray(a.images).map((img) => asObject(img)).filter((img): img is Record<string, unknown> => img !== null);
      const headline = String(a.headline || a.title || '').trim();
      const description = String(a.description || a.summary || '').trim();
      const published = String(a.published || a.publishedAt || a.lastModified || '');
      const link = String(dig(a, 'links.web.href', 'links.mobile.href', 'link', 'url') || '#').trim();
      const image = String(
        dig(a, 'image', 'images.0.url', 'images.0.href') ||
        (images[0] ? images[0].url || images[0].href || '' : ''),
      ).trim();
      return {
        id: `${sport}-${String(a.id ?? i)}`,
        headline,
        description,
        link,
        image: image || undefined,
        published: published || undefined,
      };
    });
  });

  return allArticles
    .filter((a) => a.headline && a.link)
    .sort((a, b) => {
      const ta = a.published ? Date.parse(a.published) : 0;
      const tb = b.published ? Date.parse(b.published) : 0;
      return tb - ta;
    })
    .slice(0, 16);
}

// ─── Assign Game Tiers ──────────────────────────────────────────────────────

function assignTiers(games: IntelGame[]): IntelGame[] {
  if (games.length === 0) return games;

  // Live games get priority. Then finals. Then scheduled.
  const sorted = [...games].sort((a, b) => {
    const order: Record<GameStatus, number> = { live: 0, final: 1, scheduled: 2 };
    return order[a.status] - order[b.status];
  });

  return sorted.map((g, i) => ({
    ...g,
    tier: i === 0 ? 'hero' : i <= 3 ? 'marquee' : 'standard',
  }));
}

// ─── Signal Generation ──────────────────────────────────────────────────────

function generateSignals(
  games: IntelGame[],
  standings: StandingsTeam[],
  mode: IntelMode,
): IntelSignal[] {
  const signals: IntelSignal[] = [];
  const types = SIGNAL_TYPES_BY_MODE[mode];
  let idx = 0;

  for (const game of games) {
    const diff = Math.abs(game.home.score - game.away.score);
    const leader = game.home.score >= game.away.score ? game.home : game.away;
    const trailer = game.home.score >= game.away.score ? game.away : game.home;

    // Live game, close score → clutch time
    if (game.status === 'live' && diff <= 5) {
      signals.push({
        id: `sig-clutch-${game.id}`,
        text: `${leader.abbreviation || leader.name} leads ${trailer.abbreviation || trailer.name} by ${diff}. Clutch time.`,
        sport: game.sport,
        priority: 'high',
        type: types[idx % types.length],
        modes: ['coach', 'fan'],
        gameId: game.id,
        teamTags: [leader.abbreviation, trailer.abbreviation].filter(Boolean),
        timestamp: 'Live',
      });
      idx++;
    }

    // Blowout
    if (game.status === 'live' && diff >= 20) {
      signals.push({
        id: `sig-blowout-${game.id}`,
        text: `${leader.abbreviation || leader.name} up ${diff} over ${trailer.abbreviation || trailer.name}. Blowout territory.`,
        sport: game.sport,
        priority: 'medium',
        type: 'RECAP',
        modes: ['coach', 'fan'],
        gameId: game.id,
        teamTags: [leader.abbreviation, trailer.abbreviation].filter(Boolean),
        timestamp: 'Live',
      });
      idx++;
    }

    // Final game with narrow margin
    if (game.status === 'final' && diff <= 3) {
      signals.push({
        id: `sig-nail-${game.id}`,
        text: `${leader.abbreviation || leader.name} edged ${trailer.abbreviation || trailer.name} ${leader.score}-${trailer.score}. Nail-biter.`,
        sport: game.sport,
        priority: 'medium',
        type: 'RECAP',
        modes: ['coach', 'fan', 'scout'],
        gameId: game.id,
        teamTags: [leader.abbreviation, trailer.abbreviation].filter(Boolean),
        timestamp: 'Final',
      });
      idx++;
    }
  }

  // Standings-based signals
  for (const team of standings.slice(0, 3)) {
    const pct = team.winPct ?? (team.wins / Math.max(team.wins + team.losses, 1));
    if (pct > 0.65) {
      signals.push({
        id: `sig-standing-${team.teamName}`,
        text: `${team.teamName}: ${team.wins}-${team.losses} (.${Math.round(pct * 1000)}). Top of the standings.`,
        sport: games[0]?.sport ?? 'nba',
        priority: 'low',
        type: 'TREND',
        modes: ['fan', 'scout'],
        teamTags: [team.abbreviation || team.teamName.split(' ').pop() || ''],
        timestamp: 'Season',
      });
    }
  }

  // Filter by mode
  return signals
    .filter((s) => s.modes.includes(mode))
    .sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    });
}

// ─── Main Hook ──────────────────────────────────────────────────────────────

const ACTIVE_SPORTS: Exclude<IntelSport, 'all'>[] = ['nfl', 'nba', 'mlb', 'ncaafb', 'cbb', 'ncaabsb'];

interface ScoreQueryView {
  sport: Exclude<IntelSport, 'all'>;
  data?: Record<string, unknown>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

export function useIntelDashboard(sport: IntelSport, mode: IntelMode, teamLens: string | null) {
  const sportsToFetch: Exclude<IntelSport, 'all'>[] = sport === 'all' ? ACTIVE_SPORTS : [sport];

  // Fetch scores with stable hook ordering for all supported sports.
  const scoreQueryResults = useQueries({
    queries: ACTIVE_SPORTS.map((s) => ({
      queryKey: ['intel-scores', s],
      queryFn: () => fetchJson<Record<string, unknown>>(scoresEndpoint(s)),
      refetchInterval: 30_000,
      enabled: sport === 'all' || sport === s,
    })),
  });

  const scoreQueries = useMemo<ScoreQueryView[]>(
    () =>
      sportsToFetch.map((s) => {
        const index = ACTIVE_SPORTS.indexOf(s);
        const query = scoreQueryResults[index];
        return {
          sport: s,
          data: query?.data as Record<string, unknown> | undefined,
          isLoading: query?.isLoading ?? false,
          isFetching: query?.isFetching ?? false,
          isError: query?.isError ?? false,
        };
      }),
    [sportsToFetch, scoreQueryResults],
  );

  // Fetch standings for the primary sport (or NBA by default)
  const standingsSport = sport === 'all' ? 'nba' : sport;
  const standingsQuery = useQuery({
    queryKey: ['intel-standings', standingsSport],
    queryFn: () => fetchJson<Record<string, unknown>>(`${sportApiBase(standingsSport)}/standings`),
    refetchInterval: 60_000,
  });

  // Normalize games across all fetched sports
  const games = useMemo(() => {
    const allGames: IntelGame[] = [];
    for (const q of scoreQueries) {
      if (q.data) {
        allGames.push(...normalizeToIntelGames(q.sport, q.data));
      }
    }
    // Apply team lens
    const filtered = teamLens
      ? allGames.filter((g) =>
          g.home.abbreviation === teamLens ||
          g.away.abbreviation === teamLens ||
          g.home.name.includes(teamLens) ||
          g.away.name.includes(teamLens))
      : allGames;
    return assignTiers(filtered);
  }, [scoreQueries, teamLens]);

  // Extract standings
  const standings = useMemo<StandingsTeam[]>(() => {
    if (!standingsQuery.data) return [];
    return normalizeStandings(standingsQuery.data).slice(0, 15);
  }, [standingsQuery.data]);

  // Derive all unique teams for team lens picker
  const allTeams = useMemo(() => {
    const set = new Set<string>();
    for (const g of games) {
      if (g.home.abbreviation) set.add(g.home.abbreviation);
      if (g.away.abbreviation) set.add(g.away.abbreviation);
    }
    return [...set].sort();
  }, [games]);

  // Generate signals
  const signals = useMemo(
    () => generateSignals(games, standings, mode),
    [games, standings, mode],
  );

  const prioritySignals = useMemo(
    () => signals.filter((s) => s.priority === 'high').slice(0, 6),
    [signals],
  );

  // Enrich games with signal counts
  const enrichedGames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of signals) {
      if (s.gameId) counts.set(s.gameId, (counts.get(s.gameId) ?? 0) + 1);
    }
    return games.map((g) => ({ ...g, signalCount: counts.get(g.id) ?? 0 }));
  }, [games, signals]);

  // Fetch news for selected sport(s)
  const newsSports: Exclude<IntelSport, 'all'>[] = sport === 'all' ? ACTIVE_SPORTS : [sport];
  const newsQuery = useQuery({
    queryKey: ['intel-news', sport],
    queryFn: async () => Promise.all(
      newsSports.map(async (s) => {
        try {
          const data = await fetchJson<Record<string, unknown>>(ESPN_NEWS_MAP[s]);
          return { sport: s, data };
        } catch {
          return { sport: s, data: { articles: [] } as Record<string, unknown> };
        }
      }),
    ),
    refetchInterval: 120_000,
    retry: 1,
  });

  const news = useMemo<NewsItem[]>(() => {
    if (!newsQuery.data) return [];
    return normalizeNews(newsQuery.data);
  }, [newsQuery.data]);

  const isLoading = scoreQueries.some((q) => q.isLoading || q.isFetching);
  const isError = scoreQueries.length > 0 && scoreQueries.every((q) => q.isError);

  const hero = useMemo(() => enrichedGames.find((g) => g.tier === 'hero'), [enrichedGames]);
  const marquee = useMemo(() => enrichedGames.filter((g) => g.tier === 'marquee'), [enrichedGames]);
  const standard = useMemo(() => enrichedGames.filter((g) => g.tier === 'standard'), [enrichedGames]);

  return {
    games: enrichedGames,
    hero,
    marquee,
    standard,
    signals,
    prioritySignals,
    standings,
    allTeams,
    news,
    newsLoading: newsQuery.isLoading,
    isLoading,
    isError,
  };
}

// ─── Search / Command Palette ────────────────────────────────────────────

export function useIntelSearch(
  games: IntelGame[],
  signals: IntelSignal[],
  allTeams: string[],
  query: string,
) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { filteredGames: games, filteredSignals: signals, paletteItems: [] };

    const filteredGames = games.filter(
      (g) =>
        g.home.name.toLowerCase().includes(q) ||
        g.away.name.toLowerCase().includes(q) ||
        g.home.abbreviation.toLowerCase().includes(q) ||
        g.away.abbreviation.toLowerCase().includes(q),
    );

    const filteredSignals = signals.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        (s.teamTags ?? []).some((t) => t.toLowerCase().includes(q)),
    );

    const matchedTeams = allTeams.filter((t) => t.toLowerCase().includes(q));

    const paletteItems: CommandPaletteItem[] = [
      ...filteredGames.map((g): CommandPaletteItem => ({
        id: g.id,
        label: `${g.away.abbreviation} @ ${g.home.abbreviation}`,
        type: 'game',
        sport: g.sport,
        data: g,
      })),
      ...filteredSignals.slice(0, 8).map((s): CommandPaletteItem => ({
        id: s.id,
        label: s.text.slice(0, 80),
        type: 'signal',
        sport: s.sport,
        data: s,
      })),
      ...matchedTeams.map((t): CommandPaletteItem => ({
        id: `team-${t}`,
        label: t,
        type: 'team',
        data: t,
      })),
    ];

    return { filteredGames, filteredSignals, paletteItems };
  }, [games, signals, allTeams, query]);
}
