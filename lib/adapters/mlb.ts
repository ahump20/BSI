export interface PythagoreanViewModel {
  expectedWins: number | null;
  winPercentage: string | null;
  runsScored: number | null;
  runsAllowed: number | null;
}

export interface TeamCardViewModel {
  name: string;
  division: string;
  venue: string;
  analytics: PythagoreanViewModel | null;
  dataSource: string;
  lastUpdated: string | null;
}

export interface StandingsRow {
  rank: number;
  name: string;
  wins: number;
  losses: number;
  pct: string;
}

export interface StandingsViewModel {
  divisionName: string;
  rows: StandingsRow[];
  lastUpdated: string | null;
}

function toPythagoreanViewModel(data: unknown): PythagoreanViewModel | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const record = data as Partial<PythagoreanViewModel>;

  const expectedWins = typeof record.expectedWins === 'number' ? record.expectedWins : null;
  const winPercentage = typeof record.winPercentage === 'string' ? record.winPercentage : null;
  const runsScored = typeof record.runsScored === 'number' ? record.runsScored : null;
  const runsAllowed = typeof record.runsAllowed === 'number' ? record.runsAllowed : null;

  if (
    expectedWins === null &&
    winPercentage === null &&
    runsScored === null &&
    runsAllowed === null
  ) {
    return null;
  }

  return { expectedWins, winPercentage, runsScored, runsAllowed };
}

export function toTeamCardView(data: unknown): TeamCardViewModel {
  const source = (data as { team?: unknown; analytics?: unknown }) ?? {};
  const team = (source.team as { name?: unknown; division?: unknown; venue?: unknown }) ?? {};
  const division = (team.division as { name?: unknown }) ?? {};
  const venue = (team.venue as { name?: unknown }) ?? {};
  const analytics =
    (source.analytics as { pythagorean?: unknown; dataSource?: unknown; lastUpdated?: unknown }) ??
    {};

  return {
    name: typeof team.name === 'string' ? team.name : 'St. Louis Cardinals',
    division: typeof division.name === 'string' ? division.name : 'NL Central',
    venue: typeof venue.name === 'string' ? venue.name : 'Busch Stadium',
    analytics: toPythagoreanViewModel(analytics.pythagorean),
    dataSource: typeof analytics.dataSource === 'string' ? analytics.dataSource : 'MLB Stats API',
    lastUpdated: typeof analytics.lastUpdated === 'string' ? analytics.lastUpdated : null,
  };
}

function normalizePercentage(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return value.toFixed(3);
  }

  return 'N/A';
}

export function toStandingsView(data: unknown): StandingsViewModel {
  const nationalLeague = Array.isArray((data as { nationalLeague?: unknown }).nationalLeague)
    ? (data as { nationalLeague: unknown[] }).nationalLeague
    : [];

  const centralRecord = nationalLeague.find((record) => {
    if (!record || typeof record !== 'object') {
      return false;
    }

    const division = (record as { division?: unknown }).division as { name?: unknown };
    return typeof division?.name === 'string' && division.name.toLowerCase().includes('central');
  }) as { teamRecords?: unknown; division?: { name?: unknown } } | undefined;

  const rows = Array.isArray(centralRecord?.teamRecords)
    ? centralRecord.teamRecords
        .slice(0, 5)
        .map((entry) => {
          if (!entry || typeof entry !== 'object') {
            return null;
          }

          const teamRecord = entry as {
            team?: { name?: unknown };
            wins?: unknown;
            losses?: unknown;
            winningPercentage?: unknown;
            divisionRank?: unknown;
          };

          const team = teamRecord.team ?? {};

          const rank = Number(teamRecord.divisionRank);
          const wins = Number(teamRecord.wins);
          const losses = Number(teamRecord.losses);

          if (!Number.isFinite(rank) || !Number.isFinite(wins) || !Number.isFinite(losses)) {
            return null;
          }

          return {
            rank,
            name: typeof team?.name === 'string' ? team.name : 'Unknown Team',
            wins,
            losses,
            pct: normalizePercentage(teamRecord.winningPercentage),
          };
        })
        .filter((row): row is StandingsRow => row !== null)
    : [];

  return {
    divisionName:
      typeof centralRecord?.division?.name === 'string'
        ? centralRecord.division.name
        : 'NL Central',
    rows,
    lastUpdated:
      typeof (data as { lastUpdated?: unknown }).lastUpdated === 'string'
        ? (data as { lastUpdated: string }).lastUpdated
        : null,
  };
}
