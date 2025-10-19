export type PortalClass = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';

export type NilTier = 'Diamond' | 'Platinum' | 'Gold' | 'Silver';

export type PortalStatus = 'ENTERED' | 'COMMITTED';

export interface PortalGeoLocation {
  lat: number;
  lon: number;
  market: string;
  state: string;
}

export interface PortalMovement {
  id: string;
  athlete: string;
  position: string;
  fromTeam: string;
  fromConference: string;
  toTeam?: string;
  toConference?: string;
  class: PortalClass;
  status: PortalStatus;
  updatedAt: string;
  nilTier: NilTier;
  nilRange: [number, number];
  movementScore: number;
  geo: PortalGeoLocation;
}

export interface PortalHeatmapPoint {
  id: string;
  lat: number;
  lon: number;
  volume: number;
  conference: string;
  class: PortalClass | 'Mixed';
  nilTier: NilTier | 'Composite';
  label: string;
}

export interface PortalActivitySnapshot {
  generatedAt: string;
  source: string;
  datasetVersion: string;
  ttlSeconds: number;
  movements: PortalMovement[];
  heatmap: PortalHeatmapPoint[];
  filters: {
    conferences: string[];
    classes: PortalClass[];
    nilTiers: NilTier[];
  };
}

export interface PortalTopMover {
  athlete: string;
  fromTeam: string;
  toTeam?: string;
  conference: string;
  class: PortalClass;
  position: string;
  nilTier: NilTier;
  nilRange: [number, number];
  movementScore: number;
  updatedAt: string;
}

export interface PortalConferenceSummary {
  conference: string;
  entries: number;
  commitments: number;
  netDelta: number;
  headline: string;
}

export interface PortalActivitySummary {
  totalEntries: number;
  totalCommitments: number;
  netMovementScore: number;
  topMovers: PortalTopMover[];
  conferences: PortalConferenceSummary[];
  lastRefresh: string;
}

export interface PortalActivityResponse {
  meta: {
    generatedAt: string;
    source: string;
    datasetVersion: string;
    cacheTTL: number;
  };
  filters: {
    available: PortalActivitySnapshot['filters'];
    applied: {
      conferences: string[];
      classes: PortalClass[];
      nilTiers: NilTier[];
    };
    lastUpdated: string;
  };
  data: {
    entries: PortalMovement[];
    commitments: PortalMovement[];
    heatmap: PortalHeatmapPoint[];
    summary: PortalActivitySummary;
  };
}

export interface PortalActivitySelectors {
  conferences?: string[];
  classes?: PortalClass[];
  nilTiers?: NilTier[];
  topMoversLimit?: number;
}
