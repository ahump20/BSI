import type { SimulationResults, SimulationTeamInput } from '../../lib/simulation';

export interface SimulationRequestBody {
  homeTeam: SimulationTeamInput;
  awayTeam: SimulationTeamInput;
  sport: string;
  date: string;
  iterations?: number;
  useParallel?: boolean;
  correlation?: number;
}

export interface SimulationResponsePayload {
  results: Omit<SimulationResults, 'outcomes' | 'rawCounts'>;
  confidence: {
    pointEstimate: number;
    lowerBound: number;
    upperBound: number;
    standardError: number;
  };
  timestamp: string;
  source: string;
  methodology: string;
  citations: string[];
}

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  SIMULATOR?: DurableObjectNamespace;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results: T[] }>;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

export interface DurableObjectId {}

export interface DurableObjectStub {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

