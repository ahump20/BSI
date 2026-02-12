export type ScheduleStatus = 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';

export interface ScheduleMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: 'America/Chicago';
}

export interface ScheduleGame {
  id: string;
  date: string;
  time: string;
  status: ScheduleStatus;
  inning?: number;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  venue: string;
  tv?: string;
  situation?: string;
}

export interface NormalizedSchedulePayload {
  games: ScheduleGame[];
  totalCount: number;
  meta: ScheduleMeta;
}

export type PowerConference = 'All P4' | 'SEC' | 'ACC' | 'Big 12' | 'Big Ten';

const P4_ALIASES: Record<Exclude<PowerConference, 'All P4'>, string[]> = {
  SEC: [
    'Texas',
    'Texas A&M',
    'LSU',
    'Florida',
    'Tennessee',
    'Vanderbilt',
    'Arkansas',
    'Ole Miss',
    'Mississippi State',
    'Georgia',
    'South Carolina',
    'Missouri',
    'Kentucky',
    'Auburn',
    'Alabama',
    'Oklahoma',
  ],
  ACC: [
    'Wake Forest',
    'Virginia',
    'Clemson',
    'North Carolina',
    'NC State',
    'Duke',
    'Louisville',
    'Miami',
    'Florida State',
    'Virginia Tech',
    'Georgia Tech',
    'Notre Dame',
    'Pittsburgh',
    'Boston College',
  ],
  'Big 12': [
    'TCU',
    'Texas Tech',
    'Oklahoma State',
    'Kansas State',
    'West Virginia',
    'Baylor',
    'Kansas',
    'BYU',
    'UCF',
    'Houston',
    'Cincinnati',
    'Arizona',
    'Arizona State',
    'Colorado',
    'Utah',
  ],
  'Big Ten': [
    'Indiana',
    'Maryland',
    'Michigan',
    'Ohio State',
    'Penn State',
    'Rutgers',
    'Nebraska',
    'Minnesota',
    'Iowa',
    'Illinois',
    'Northwestern',
    'Purdue',
    'Michigan State',
    'UCLA',
    'USC',
    'Washington',
    'Oregon',
  ],
};

function normalizeTeamText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveConference(teamName: string): string {
  const normalizedName = normalizeTeamText(teamName);
  for (const [conference, aliases] of Object.entries(P4_ALIASES)) {
    const match = aliases.some((alias) => normalizedName.includes(normalizeTeamText(alias)));
    if (match) return conference;
  }
  return '';
}

function normalizeStatus(rawStatus: unknown): ScheduleStatus {
  const status = (rawStatus || {}) as Record<string, unknown>;
  const type = String(status.type || '').toLowerCase();
  const state = String(status.state || '').toLowerCase();
  const detail = String(status.detail || '').toLowerCase();

  if (type.includes('canceled') || detail.includes('canceled')) return 'canceled';
  if (type.includes('postponed') || detail.includes('postponed')) return 'postponed';
  if (state === 'in' || type.includes('in_progress') || detail.includes('top') || detail.includes('bot')) return 'live';
  if (state === 'post' || type.includes('final') || detail.includes('final')) return 'final';
  return 'scheduled';
}

function parseRecord(rawRecord: unknown): { wins: number; losses: number } {
  const fallback = { wins: 0, losses: 0 };
  if (!rawRecord || typeof rawRecord !== 'string') return fallback;
  const match = rawRecord.match(/(\d+)-(\d+)/);
  if (!match) return fallback;
  return {
    wins: Number(match[1]),
    losses: Number(match[2]),
  };
}

function inferDisplayTime(date: string, status: ScheduleStatus, detail?: string): string {
  if (status === 'final') return 'Final';
  if (status === 'postponed') return 'Postponed';
  if (status === 'canceled') return 'Canceled';
  if (status === 'live' && detail) return detail;

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return detail || 'TBD';
  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  });
}

export function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function shiftIsoDate(isoDate: string, offsetDays: number): string {
  const base = new Date(`${isoDate}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return toIsoDate(base);
}

export function formatDatePill(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function normalizeSchedulePayload(
  payload: unknown,
  headers?: Headers,
): NormalizedSchedulePayload {
  const raw = (payload || {}) as Record<string, unknown>;
  const gamesRaw = Array.isArray(raw.data)
    ? raw.data
    : Array.isArray(raw.games)
      ? raw.games
      : [];

  const games: ScheduleGame[] = gamesRaw.map((entry, index) => {
    const g = (entry || {}) as Record<string, unknown>;
    const statusNode = (g.status || {}) as Record<string, unknown>;
    const homeTeam = (g.homeTeam || {}) as Record<string, unknown>;
    const awayTeam = (g.awayTeam || {}) as Record<string, unknown>;
    const homeName = String(homeTeam.name || 'Home');
    const awayName = String(awayTeam.name || 'Away');
    const status = normalizeStatus(statusNode);

    const homeRecord = parseRecord(homeTeam.record);
    const awayRecord = parseRecord(awayTeam.record);

    return {
      id: String(g.id || `game-${index}`),
      date: String(g.date || ''),
      time: inferDisplayTime(String(g.date || ''), status, String(statusNode.detail || '')),
      status,
      inning: typeof statusNode.period === 'number' ? statusNode.period : undefined,
      homeTeam: {
        id: String(homeTeam.id || ''),
        name: homeName,
        shortName: String(homeTeam.abbreviation || homeTeam.shortName || homeName.slice(0, 3)),
        conference: resolveConference(homeName),
        score: typeof g.homeScore === 'number' ? (g.homeScore as number) : null,
        record: homeRecord,
      },
      awayTeam: {
        id: String(awayTeam.id || ''),
        name: awayName,
        shortName: String(awayTeam.abbreviation || awayTeam.shortName || awayName.slice(0, 3)),
        conference: resolveConference(awayName),
        score: typeof g.awayScore === 'number' ? (g.awayScore as number) : null,
        record: awayRecord,
      },
      venue:
        typeof g.venue === 'string'
          ? g.venue
          : String(((g.venue as Record<string, unknown>)?.fullName as string) || 'TBD'),
      tv: String(((g.broadcast as Record<string, unknown>)?.network as string) || ''),
      situation: String(statusNode.detail || ''),
    };
  });

  const bodyMeta = (raw.meta || {}) as Record<string, unknown>;
  const meta: ScheduleMeta = {
    dataSource: String(
      bodyMeta.dataSource || headers?.get('x-data-source') || 'NCAA/ESPN',
    ),
    lastUpdated: String(
      bodyMeta.lastUpdated || headers?.get('x-last-updated') || new Date().toISOString(),
    ),
    timezone: 'America/Chicago',
  };

  return {
    games,
    totalCount:
      typeof raw.totalCount === 'number'
        ? (raw.totalCount as number)
        : games.length,
    meta,
  };
}

export function filterGamesByConference(
  games: ScheduleGame[],
  conference: PowerConference,
): ScheduleGame[] {
  if (conference === 'All P4') {
    return games.filter(
      (game) => Boolean(game.homeTeam.conference) || Boolean(game.awayTeam.conference),
    );
  }

  return games.filter(
    (game) =>
      game.homeTeam.conference === conference || game.awayTeam.conference === conference,
  );
}

export function groupGamesByStatus(games: ScheduleGame[]): {
  live: ScheduleGame[];
  upcoming: ScheduleGame[];
  final: ScheduleGame[];
} {
  return {
    live: games.filter((g) => g.status === 'live'),
    upcoming: games.filter((g) => g.status === 'scheduled'),
    final: games.filter((g) => g.status === 'final'),
  };
}

export async function findNextGameDate(params: {
  startDate: string;
  maxDays?: number;
  loadGamesForDate: (isoDate: string) => Promise<ScheduleGame[]>;
}): Promise<string> {
  const { startDate, loadGamesForDate, maxDays = 7 } = params;
  for (let dayOffset = 0; dayOffset <= maxDays; dayOffset += 1) {
    const date = shiftIsoDate(startDate, dayOffset);
    const games = await loadGamesForDate(date);
    if (games.length > 0) return date;
  }
  return startDate;
}
