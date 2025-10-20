import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_SCOREBOARD_URL =
  process.env.NCAAB_BASEBALL_SCOREBOARD_URL ??
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';

export interface ScoreboardTeamRecord {
  summary: string | null;
  wins: number | null;
  losses: number | null;
}

export interface ScoreboardTeamGameStats {
  runs: number | null;
  hits: number | null;
  errors: number | null;
}

export interface ScoreboardTeamSeasonSnapshot {
  wins: number | null;
  losses: number | null;
  gamesPlayed: number | null;
  runsFor: number | null;
  runsAgainst: number | null;
}

export interface ScoreboardTeam {
  id: string;
  uid: string | null;
  slug: string | null;
  name: string;
  shortName: string | null;
  abbreviation: string | null;
  logo: string | null;
  rank: number | null;
  score: number;
  record: ScoreboardTeamRecord;
  game: ScoreboardTeamGameStats;
  season: ScoreboardTeamSeasonSnapshot;
}

export interface ScoreboardGameStatus {
  type: string | null;
  state: string | null;
  detail: string | null;
  shortDetail: string | null;
  completed: boolean;
}

export interface ScoreboardGame {
  id: string;
  uid: string | null;
  date: string | null;
  startTime: string | null;
  status: ScoreboardGameStatus;
  venue: {
    name: string | null;
    city: string | null;
    state: string | null;
  };
  broadcasts: string[];
  links: Array<{ href: string; text: string }>;
  teams: {
    home: ScoreboardTeam;
    away: ScoreboardTeam;
  };
}

export interface ScoreboardResponse {
  games: ScoreboardGame[];
  fetchedAt: string;
  source: 'espn' | 'highlightly' | 'mock';
}

export interface FetchScoreboardOptions {
  signal?: AbortSignal;
}

export class ScoreboardFetchError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ScoreboardFetchError';
    this.status = status;
  }
}

interface RawScoreboard {
  events?: Array<Record<string, unknown>>;
}

export async function fetchNcaaBaseballScoreboard(
  options: FetchScoreboardOptions = {}
): Promise<ScoreboardResponse> {
  const { signal } = options;

  const fixturePath = process.env.BSI_SCOREBOARD_FIXTURE_PATH;
  if (fixturePath) {
    const absoluteFixturePath = path.isAbsolute(fixturePath)
      ? fixturePath
      : path.resolve(process.cwd(), fixturePath);

    const fileContents = await readFile(absoluteFixturePath, 'utf-8');
    const parsed = JSON.parse(fileContents) as RawScoreboard;
    return normalizeScoreboard(parsed, 'mock');
  }

  const scoreboardUrl = DEFAULT_SCOREBOARD_URL;

  let response: Response;
  try {
    response = await fetch(scoreboardUrl, {
      signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'DiamondInsights/1.0 (+https://blazesportsintel.com)'
      }
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw error;
    }
    throw new ScoreboardFetchError('Unable to reach scoreboard provider');
  }

  if (!response.ok) {
    throw new ScoreboardFetchError(
      `Scoreboard request failed: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const payload = (await response.json()) as RawScoreboard;
  const provider: ScoreboardResponse['source'] =
    scoreboardUrl.includes('highlightly') ? 'highlightly' : 'espn';

  return normalizeScoreboard(payload, provider);
}

function normalizeScoreboard(
  raw: RawScoreboard,
  source: ScoreboardResponse['source']
): ScoreboardResponse {
  const events = Array.isArray(raw.events) ? raw.events : [];

  const games: ScoreboardGame[] = events
    .map((event) => normalizeEvent(event))
    .filter((game): game is ScoreboardGame => Boolean(game));

  games.sort((a, b) => {
    const timeA = a.startTime ? Date.parse(a.startTime) : 0;
    const timeB = b.startTime ? Date.parse(b.startTime) : 0;
    return timeA - timeB;
  });

  return {
    games,
    fetchedAt: new Date().toISOString(),
    source,
  };
}

function normalizeEvent(event: Record<string, unknown>): ScoreboardGame | null {
  const competitions = Array.isArray(event.competitions)
    ? (event.competitions as Array<Record<string, unknown>>)
    : [];
  const competition = competitions[0];
  if (!competition) {
    return null;
  }

  const competitors = Array.isArray(competition.competitors)
    ? (competition.competitors as Array<Record<string, unknown>>)
    : [];

  const homeRaw = competitors.find((team) => team.homeAway === 'home');
  const awayRaw = competitors.find((team) => team.homeAway === 'away');

  if (!homeRaw || !awayRaw) {
    return null;
  }

  const homeTeam = normalizeTeam(homeRaw);
  const awayTeam = normalizeTeam(awayRaw);

  homeTeam.season.runsAgainst = awayTeam.score;
  awayTeam.season.runsAgainst = homeTeam.score;

  const statusRaw = (competition.status ?? {}) as Record<string, unknown>;
  const statusType = (statusRaw.type ?? {}) as Record<string, unknown>;

  const venueRaw = (competition.venue ?? {}) as Record<string, unknown>;
  const addressRaw = (venueRaw.address ?? {}) as Record<string, unknown>;

  const broadcastsRaw = Array.isArray(competition.broadcasts)
    ? (competition.broadcasts as Array<Record<string, unknown>>)
    : [];
  const broadcastSet = new Set<string>();
  for (const broadcast of broadcastsRaw) {
    const names = Array.isArray(broadcast.names)
      ? (broadcast.names as string[])
      : [];
    for (const name of names) {
      const normalized = typeof name === 'string' ? name.trim() : '';
      if (normalized) {
        broadcastSet.add(normalized);
      }
    }
  }
  const broadcasts = Array.from(broadcastSet);

  const linksRaw = Array.isArray(event.links)
    ? (event.links as Array<Record<string, unknown>>)
    : [];
  const seenLinks = new Set<string>();
  const links = linksRaw
    .map((link) => {
      const href = typeof link.href === 'string' ? link.href : null;
      if (!href) {
        return null;
      }

      const textCandidate =
        typeof link.text === 'string'
          ? link.text
          : typeof link.shortText === 'string'
            ? link.shortText
            : Array.isArray(link.rel)
              ? (link.rel.find((entry) => typeof entry === 'string') as string | undefined)
              : undefined;

      if (seenLinks.has(href)) {
        return null;
      }
      seenLinks.add(href);

      return {
        href,
        text: (textCandidate ?? 'View').trim() || 'View',
      };
    })
    .filter((link): link is { href: string; text: string } => Boolean(link));

  return {
    id: typeof competition.id === 'string' ? competition.id : String(event.id ?? ''),
    uid:
      typeof competition.uid === 'string'
        ? competition.uid
        : typeof event.uid === 'string'
          ? event.uid
          : null,
    date: typeof event.date === 'string' ? event.date : null,
    startTime: typeof competition.date === 'string' ? competition.date : null,
    status: {
      type: typeof statusType.name === 'string' ? statusType.name : null,
      state: typeof statusType.state === 'string' ? statusType.state : null,
      detail: typeof statusType.detail === 'string' ? statusType.detail : null,
      shortDetail:
        typeof statusType.shortDetail === 'string' ? statusType.shortDetail : null,
      completed: Boolean(statusType.completed),
    },
    venue: {
      name: typeof venueRaw.fullName === 'string' ? venueRaw.fullName : null,
      city: typeof addressRaw.city === 'string' ? addressRaw.city : null,
      state:
        typeof addressRaw.state === 'string'
          ? addressRaw.state
          : typeof addressRaw.stateShort === 'string'
            ? addressRaw.stateShort
            : null,
    },
    broadcasts,
    links,
    teams: {
      home: homeTeam,
      away: awayTeam,
    },
  };
}

function normalizeTeam(raw: Record<string, unknown>): ScoreboardTeam {
  const teamRaw = (raw.team ?? {}) as Record<string, unknown>;
  const logosRaw = Array.isArray(teamRaw.logos)
    ? (teamRaw.logos as Array<Record<string, unknown>>)
    : [];

  const recordsRaw = Array.isArray(raw.records)
    ? (raw.records as Array<Record<string, unknown>>)
    : [];
  const primaryRecord = findPrimaryRecord(recordsRaw);

  const statisticsRaw = Array.isArray(raw.statistics)
    ? (raw.statistics as Array<Record<string, unknown>>)
    : [];
  const gameStats = extractGameStats(statisticsRaw);

  const score = safeNumber(raw.score) ?? 0;

  const seasonSnapshot: ScoreboardTeamSeasonSnapshot = {
    wins: primaryRecord?.wins ?? null,
    losses: primaryRecord?.losses ?? null,
    gamesPlayed:
      primaryRecord?.wins != null && primaryRecord?.losses != null
        ? primaryRecord.wins + primaryRecord.losses
        : null,
    runsFor: gameStats.runs,
    runsAgainst: null,
  };

  const fallbackName =
    typeof teamRaw.name === 'string'
      ? teamRaw.name
      : typeof raw.displayName === 'string'
        ? (raw.displayName as string)
        : 'Unknown Team';

  return {
    id:
      typeof teamRaw.id === 'string'
        ? teamRaw.id
        : typeof raw.id === 'string'
          ? (raw.id as string)
          : 'unknown',
    uid:
      typeof raw.uid === 'string'
        ? (raw.uid as string)
        : typeof teamRaw.uid === 'string'
          ? teamRaw.uid
          : null,
    slug: typeof teamRaw.slug === 'string' ? teamRaw.slug : null,
    name: typeof teamRaw.displayName === 'string' ? teamRaw.displayName : fallbackName,
    shortName:
      typeof teamRaw.shortDisplayName === 'string'
        ? teamRaw.shortDisplayName
        : typeof teamRaw.abbreviation === 'string'
          ? teamRaw.abbreviation
          : null,
    abbreviation: typeof teamRaw.abbreviation === 'string' ? teamRaw.abbreviation : null,
    logo: extractLogo(logosRaw),
    rank: extractRank(raw),
    score,
    record: {
      summary: primaryRecord?.summary ?? null,
      wins: primaryRecord?.wins ?? null,
      losses: primaryRecord?.losses ?? null,
    },
    game: gameStats,
    season: seasonSnapshot,
  };
}

function extractLogo(logos: Array<Record<string, unknown>>): string | null {
  if (!logos.length) {
    return null;
  }
  const primary = logos.find((logo) => typeof logo.href === 'string');
  return (primary?.href as string | undefined) ?? null;
}

function extractRank(raw: Record<string, unknown>): number | null {
  const curatedRank = (raw.curatedRank ?? {}) as Record<string, unknown>;
  const currentRank = safeNumber(curatedRank.current);
  if (currentRank != null) {
    return currentRank;
  }
  const rank = safeNumber(raw.rank);
  return rank;
}

function findPrimaryRecord(records: Array<Record<string, unknown>>):
  | { summary: string | null; wins: number | null; losses: number | null }
  | null {
  if (!records.length) {
    return null;
  }
  const preferred = records.find((record) => record.type === 'total' || record.name === 'overall') ?? records[0];
  const summary = typeof preferred.summary === 'string' ? preferred.summary : null;
  const winsLosses = parseRecordSummary(summary);
  return {
    summary,
    wins: winsLosses.wins,
    losses: winsLosses.losses,
  };
}

function parseRecordSummary(summary: string | null): { wins: number | null; losses: number | null } {
  if (!summary) {
    return { wins: null, losses: null };
  }
  const match = summary.match(/^(\d+)[-–](\d+)(?:[-–](\d+))?/);
  if (!match) {
    return { wins: null, losses: null };
  }
  const wins = Number.parseInt(match[1] ?? '', 10);
  const losses = Number.parseInt(match[2] ?? '', 10);
  return {
    wins: Number.isFinite(wins) ? wins : null,
    losses: Number.isFinite(losses) ? losses : null,
  };
}

function extractGameStats(stats: Array<Record<string, unknown>>): ScoreboardTeamGameStats {
  const statMap = new Map<string, number>();

  for (const stat of stats) {
    const name = typeof stat.name === 'string' ? stat.name.toLowerCase() : null;
    if (!name) {
      continue;
    }
    const value = safeNumber(stat.value ?? stat.displayValue);
    if (value != null) {
      statMap.set(name, value);
    }
  }

  return {
    runs: statMap.get('runs') ?? null,
    hits: statMap.get('hits') ?? null,
    errors: statMap.get('errors') ?? null,
  };
}

function safeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
