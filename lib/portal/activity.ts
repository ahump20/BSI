import {
  type NilTier,
  type PortalActivityResponse,
  type PortalActivitySelectors,
  type PortalActivitySnapshot,
  type PortalClass,
  type PortalConferenceSummary,
  type PortalHeatmapPoint,
  type PortalMovement,
  type PortalTopMover
} from './types';

const BASE_SNAPSHOT: PortalActivitySnapshot = {
  generatedAt: '2025-10-19T23:45:00Z',
  source: 'Highlightly Transfer Feed',
  datasetVersion: '2025.10.19-nightly',
  ttlSeconds: 900,
  movements: [
    {
      id: 'mov-sec-001',
      athlete: 'Logan Pierce',
      position: 'INF',
      fromTeam: 'LSU',
      fromConference: 'SEC',
      toTeam: 'Arkansas',
      toConference: 'SEC',
      class: 'Sophomore',
      status: 'COMMITTED',
      updatedAt: '2025-10-19T01:24:00Z',
      nilTier: 'Diamond',
      nilRange: [450_000, 610_000],
      movementScore: 92,
      geo: { lat: 30.450746, lon: -91.154551, market: 'Baton Rouge, LA', state: 'LA' }
    },
    {
      id: 'mov-sec-002',
      athlete: 'Ethan McCoy',
      position: 'RHP',
      fromTeam: 'Mississippi State',
      fromConference: 'SEC',
      toTeam: 'Oklahoma',
      toConference: 'SEC',
      class: 'Junior',
      status: 'COMMITTED',
      updatedAt: '2025-10-18T19:18:00Z',
      nilTier: 'Platinum',
      nilRange: [325_000, 410_000],
      movementScore: 84,
      geo: { lat: 33.4504, lon: -88.8184, market: 'Starkville, MS', state: 'MS' }
    },
    {
      id: 'mov-acc-001',
      athlete: 'Jaxon Cole',
      position: 'OF',
      fromTeam: 'Wake Forest',
      fromConference: 'ACC',
      toTeam: 'Tennessee',
      toConference: 'SEC',
      class: 'Junior',
      status: 'COMMITTED',
      updatedAt: '2025-10-19T15:02:00Z',
      nilTier: 'Gold',
      nilRange: [210_000, 260_000],
      movementScore: 77,
      geo: { lat: 36.0999, lon: -80.2442, market: 'Winston-Salem, NC', state: 'NC' }
    },
    {
      id: 'mov-acc-002',
      athlete: 'Mateo Rodriguez',
      position: 'C',
      fromTeam: 'Miami',
      fromConference: 'ACC',
      class: 'Sophomore',
      status: 'ENTERED',
      updatedAt: '2025-10-19T11:42:00Z',
      nilTier: 'Gold',
      nilRange: [185_000, 235_000],
      movementScore: 63,
      geo: { lat: 25.7216, lon: -80.2793, market: 'Coral Gables, FL', state: 'FL' }
    },
    {
      id: 'mov-big12-001',
      athlete: 'Caleb Dorsey',
      position: 'LHP',
      fromTeam: 'TCU',
      fromConference: 'Big 12',
      class: 'Senior',
      status: 'ENTERED',
      updatedAt: '2025-10-18T22:17:00Z',
      nilTier: 'Silver',
      nilRange: [120_000, 155_000],
      movementScore: 52,
      geo: { lat: 32.709, lon: -97.368, market: 'Fort Worth, TX', state: 'TX' }
    },
    {
      id: 'mov-sec-003',
      athlete: 'Noah Bennett',
      position: 'SS',
      fromTeam: 'South Carolina',
      fromConference: 'SEC',
      class: 'Freshman',
      status: 'ENTERED',
      updatedAt: '2025-10-19T05:38:00Z',
      nilTier: 'Platinum',
      nilRange: [260_000, 320_000],
      movementScore: 58,
      geo: { lat: 33.995, lon: -81.026, market: 'Columbia, SC', state: 'SC' }
    },
    {
      id: 'mov-pac12-001',
      athlete: 'Ryder West',
      position: '2B',
      fromTeam: 'Oregon State',
      fromConference: 'Pac-12',
      toTeam: 'LSU',
      toConference: 'SEC',
      class: 'Graduate',
      status: 'COMMITTED',
      updatedAt: '2025-10-18T16:31:00Z',
      nilTier: 'Diamond',
      nilRange: [380_000, 450_000],
      movementScore: 88,
      geo: { lat: 44.562, lon: -123.277, market: 'Corvallis, OR', state: 'OR' }
    },
    {
      id: 'mov-big10-001',
      athlete: 'Griffin Hayes',
      position: 'RHP',
      fromTeam: 'Indiana',
      fromConference: 'Big Ten',
      class: 'Junior',
      status: 'ENTERED',
      updatedAt: '2025-10-18T13:09:00Z',
      nilTier: 'Gold',
      nilRange: [175_000, 220_000],
      movementScore: 57,
      geo: { lat: 39.1653, lon: -86.5264, market: 'Bloomington, IN', state: 'IN' }
    }
  ],
  heatmap: [
    {
      id: 'hm-sec-lsu',
      lat: 30.450746,
      lon: -91.154551,
      volume: 11,
      conference: 'SEC',
      class: 'Sophomore',
      nilTier: 'Diamond',
      label: 'Baton Rouge Activity Hub'
    },
    {
      id: 'hm-sec-oxford',
      lat: 34.3665,
      lon: -89.5192,
      volume: 8,
      conference: 'SEC',
      class: 'Junior',
      nilTier: 'Platinum',
      label: 'Oxford Transfer Corridor'
    },
    {
      id: 'hm-acc-miami',
      lat: 25.7617,
      lon: -80.1918,
      volume: 6,
      conference: 'ACC',
      class: 'Sophomore',
      nilTier: 'Gold',
      label: 'South Florida NIL Cluster'
    },
    {
      id: 'hm-big12-dfw',
      lat: 32.7767,
      lon: -96.797,
      volume: 5,
      conference: 'Big 12',
      class: 'Mixed',
      nilTier: 'Composite',
      label: 'DFW Recruiting Spine'
    },
    {
      id: 'hm-pac12-portland',
      lat: 45.5152,
      lon: -122.6784,
      volume: 3,
      conference: 'Pac-12',
      class: 'Graduate',
      nilTier: 'Diamond',
      label: 'Pacific Northwest Pipeline'
    }
  ],
  filters: {
    conferences: ['SEC', 'ACC', 'Big 12', 'Pac-12', 'Big Ten'],
    classes: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'],
    nilTiers: ['Diamond', 'Platinum', 'Gold', 'Silver']
  }
};

function cloneSnapshot(snapshot: PortalActivitySnapshot): PortalActivitySnapshot {
  return {
    ...snapshot,
    movements: snapshot.movements.map((movement) => ({
      ...movement,
      nilRange: [...movement.nilRange] as [number, number],
      geo: { ...movement.geo }
    })),
    heatmap: snapshot.heatmap.map((point) => ({ ...point })),
    filters: {
      conferences: [...snapshot.filters.conferences],
      classes: [...snapshot.filters.classes],
      nilTiers: [...snapshot.filters.nilTiers]
    }
  };
}

function normalizeFilterValues(values?: string[] | null): string[] | undefined {
  if (!values) {
    return undefined;
  }

  const compact = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return compact.length > 0 ? compact : undefined;
}

function matchesSelectors(
  movement: PortalMovement,
  selectors: PortalActivitySelectors
): boolean {
  const { conferences, classes, nilTiers } = selectors;

  if (conferences && conferences.length > 0 && !conferences.includes(movement.fromConference) && !conferences.includes(movement.toConference ?? movement.fromConference)) {
    return false;
  }

  if (classes && classes.length > 0 && !classes.includes(movement.class)) {
    return false;
  }

  if (nilTiers && nilTiers.length > 0 && !nilTiers.includes(movement.nilTier)) {
    return false;
  }

  return true;
}

function summarizeConferences(
  movements: PortalMovement[]
): PortalConferenceSummary[] {
  const grouped = new Map<string, { entries: number; commitments: number; score: number }>();

  for (const movement of movements) {
    const key = movement.toConference ?? movement.fromConference;
    if (!grouped.has(key)) {
      grouped.set(key, { entries: 0, commitments: 0, score: 0 });
    }

    const bucket = grouped.get(key)!;
    if (movement.status === 'ENTERED') {
      bucket.entries += 1;
      bucket.score -= movement.movementScore * 0.5;
    } else {
      bucket.commitments += 1;
      bucket.score += movement.movementScore;
    }
  }

  return Array.from(grouped.entries())
    .map(([conference, bucket]) => ({
      conference,
      entries: bucket.entries,
      commitments: bucket.commitments,
      netDelta: Number(bucket.score.toFixed(1)),
      headline: bucket.commitments >= bucket.entries
        ? `${conference} programs are net positive in portal commitments.`
        : `${conference} is leaking talent – commitments lag entries.`
    }))
    .sort((a, b) => b.netDelta - a.netDelta);
}

function buildTopMovers(commitments: PortalMovement[], limit: number): PortalTopMover[] {
  return commitments
    .slice()
    .sort((a, b) => b.movementScore - a.movementScore)
    .slice(0, limit)
    .map((commitment) => ({
      athlete: commitment.athlete,
      fromTeam: commitment.fromTeam,
      toTeam: commitment.toTeam,
      conference: commitment.toConference ?? commitment.fromConference,
      class: commitment.class,
      position: commitment.position,
      nilTier: commitment.nilTier,
      nilRange: [...commitment.nilRange] as [number, number],
      movementScore: commitment.movementScore,
      updatedAt: commitment.updatedAt
    }));
}

function filterHeatmap(
  points: PortalHeatmapPoint[],
  selectors: PortalActivitySelectors
): PortalHeatmapPoint[] {
  const { conferences, classes, nilTiers } = selectors;
  return points.filter((point) => {
    if (conferences && conferences.length > 0 && !conferences.includes(point.conference)) {
      return false;
    }
    if (classes && classes.length > 0 && point.class !== 'Mixed' && !classes.includes(point.class)) {
      return false;
    }
    if (nilTiers && nilTiers.length > 0 && point.nilTier !== 'Composite' && !nilTiers.includes(point.nilTier as NilTier)) {
      return false;
    }
    return true;
  });
}

export function getPortalActivitySnapshot(): PortalActivitySnapshot {
  return cloneSnapshot(BASE_SNAPSHOT);
}

export function buildPortalActivityResponse(
  snapshot: PortalActivitySnapshot,
  selectors: PortalActivitySelectors = {}
): PortalActivityResponse {
  const normalizedSelectors: PortalActivitySelectors = {
    conferences: normalizeFilterValues(selectors.conferences)?.map((value) => value.trim()),
    classes: selectors.classes,
    nilTiers: selectors.nilTiers,
    topMoversLimit: selectors.topMoversLimit ?? 5
  };

  const filteredMovements = snapshot.movements.filter((movement) => matchesSelectors(movement, normalizedSelectors));
  const entries = filteredMovements.filter((movement) => movement.status === 'ENTERED');
  const commitments = filteredMovements.filter((movement) => movement.status === 'COMMITTED');

  const summary = {
    totalEntries: entries.length,
    totalCommitments: commitments.length,
    netMovementScore: Number(
      (
        commitments.reduce((score, movement) => score + movement.movementScore, 0) -
        entries.reduce((score, movement) => score + movement.movementScore * 0.5, 0)
      ).toFixed(1)
    ),
    topMovers: buildTopMovers(commitments, normalizedSelectors.topMoversLimit ?? 5),
    conferences: summarizeConferences(filteredMovements),
    lastRefresh: snapshot.generatedAt
  } satisfies PortalActivityResponse['data']['summary'];

  return {
    meta: {
      generatedAt: snapshot.generatedAt,
      source: snapshot.source,
      datasetVersion: snapshot.datasetVersion,
      cacheTTL: snapshot.ttlSeconds
    },
    filters: {
      available: {
        conferences: [...snapshot.filters.conferences],
        classes: [...snapshot.filters.classes],
        nilTiers: [...snapshot.filters.nilTiers]
      },
      applied: {
        conferences: normalizedSelectors.conferences ?? [],
        classes: normalizedSelectors.classes ?? [],
        nilTiers: normalizedSelectors.nilTiers ?? []
      },
      lastUpdated: snapshot.generatedAt
    },
    data: {
      entries,
      commitments,
      heatmap: filterHeatmap(snapshot.heatmap, normalizedSelectors),
      summary
    }
  };
}

export function normalizePortalFeedPayload(payload: unknown): PortalActivitySnapshot {
  if (!payload || typeof payload !== 'object') {
    return getPortalActivitySnapshot();
  }

  const candidate = payload as Partial<PortalActivitySnapshot> & { movements?: PortalMovement[] };
  if (!Array.isArray(candidate.movements)) {
    return getPortalActivitySnapshot();
  }

  const generatedAt = typeof candidate.generatedAt === 'string' ? candidate.generatedAt : new Date().toISOString();
  const source = typeof candidate.source === 'string' ? candidate.source : BASE_SNAPSHOT.source;
  const datasetVersion = typeof candidate.datasetVersion === 'string' ? candidate.datasetVersion : `${generatedAt}-external`;
  const ttlSeconds = typeof candidate.ttlSeconds === 'number' ? candidate.ttlSeconds : BASE_SNAPSHOT.ttlSeconds;

  const filters = {
    conferences: Array.isArray(candidate.filters?.conferences) && candidate.filters?.conferences.length
      ? candidate.filters.conferences.map(String)
      : BASE_SNAPSHOT.filters.conferences,
    classes: Array.isArray(candidate.filters?.classes) && candidate.filters?.classes.length
      ? (candidate.filters.classes as PortalClass[])
      : BASE_SNAPSHOT.filters.classes,
    nilTiers: Array.isArray(candidate.filters?.nilTiers) && candidate.filters?.nilTiers.length
      ? (candidate.filters.nilTiers as NilTier[])
      : BASE_SNAPSHOT.filters.nilTiers
  };

  const heatmap = Array.isArray(candidate.heatmap) && candidate.heatmap.length > 0
    ? candidate.heatmap
    : BASE_SNAPSHOT.heatmap;

  return {
    generatedAt,
    source,
    datasetVersion,
    ttlSeconds,
    movements: candidate.movements as PortalMovement[],
    heatmap: heatmap as PortalHeatmapPoint[],
    filters
  };
}
