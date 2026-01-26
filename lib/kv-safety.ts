/**
 * BSI KV Safety Layer
 * Wraps KV data with metadata for HTTP status reconstruction on read.
 */

import type { LifecycleState } from './api-contract';
import type { DatasetStatus } from './semantic-validation';

/** HTTP status codes used for KV safety metadata */
export type SafeHTTPStatus = 200 | 202 | 204 | 422 | 503;

/** Metadata stored with KV entries for HTTP reconstruction */
export interface KVSafetyMetadata {
  httpStatusAtWrite: SafeHTTPStatus;
  lifecycleState: LifecycleState;
  recordCount: number;
  ingestedAt: string;
  validationStatus: DatasetStatus;
  datasetId: string;
  expectedMinCount: number;
  /** Version number for commit boundary tracking */
  version?: number;
  /** Whether this data is from Last Known Good fallback */
  isLKG?: boolean;
  /** Reason for serving LKG if applicable */
  lkgReason?: string | null;
  /** Schema version at time of write (semver) */
  schemaVersion?: string;
  /** Schema hash for quick mismatch detection */
  schemaHash?: string;
  /** Timestamp when commit was finalized */
  committedAt?: string;
}

/** KV data wrapped with safety metadata */
export interface KVSafeData<T> {
  data: T[];
  meta: KVSafetyMetadata;
}

/** Legacy cached data format (before safety layer) */
export interface LegacyCachedData<T> {
  data: T[];
  cachedAt: string;
  source?: string;
}

/** Type guard: Check if value has KVSafetyMetadata wrapper */
export function hasKVSafetyMetadata<T>(value: unknown): value is KVSafeData<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (!Array.isArray(obj.data)) {
    return false;
  }

  if (typeof obj.meta !== 'object' || obj.meta === null) {
    return false;
  }

  const meta = obj.meta as Record<string, unknown>;

  return (
    typeof meta.httpStatusAtWrite === 'number' &&
    typeof meta.lifecycleState === 'string' &&
    typeof meta.recordCount === 'number' &&
    typeof meta.ingestedAt === 'string' &&
    typeof meta.validationStatus === 'string' &&
    typeof meta.datasetId === 'string' &&
    typeof meta.expectedMinCount === 'number'
  );
}

/** Type guard: Check if value is legacy cached data format */
export function isLegacyCachedData<T>(value: unknown): value is LegacyCachedData<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return Array.isArray(obj.data) && typeof obj.cachedAt === 'string' && !('meta' in obj);
}

/** Create safety metadata for KV write */
export function createKVSafetyMetadata(params: {
  httpStatusAtWrite: SafeHTTPStatus;
  lifecycleState: LifecycleState;
  recordCount: number;
  validationStatus: DatasetStatus;
  datasetId: string;
  expectedMinCount: number;
}): KVSafetyMetadata {
  return {
    httpStatusAtWrite: params.httpStatusAtWrite,
    lifecycleState: params.lifecycleState,
    recordCount: params.recordCount,
    ingestedAt: new Date().toISOString(),
    validationStatus: params.validationStatus,
    datasetId: params.datasetId,
    expectedMinCount: params.expectedMinCount,
  };
}

/** Wrap data with safety metadata for KV storage */
export function wrapWithSafetyMetadata<T>(data: T[], meta: KVSafetyMetadata): KVSafeData<T> {
  return { data, meta };
}

/** Parse KV value, handling both new and legacy formats */
export function parseKVValue<T>(
  raw: string | null
): { data: T[]; meta: KVSafetyMetadata | null; isLegacy: boolean } | null {
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (hasKVSafetyMetadata<T>(parsed)) {
    return {
      data: parsed.data,
      meta: parsed.meta,
      isLegacy: false,
    };
  }

  if (isLegacyCachedData<T>(parsed)) {
    return {
      data: parsed.data,
      meta: null,
      isLegacy: true,
    };
  }

  // Try raw array format
  if (Array.isArray(parsed)) {
    return {
      data: parsed as T[],
      meta: null,
      isLegacy: true,
    };
  }

  return null;
}

/** Calculate time since ingestion in seconds */
export function getAgeSeconds(meta: KVSafetyMetadata): number {
  const ingestedAt = new Date(meta.ingestedAt).getTime();
  return Math.floor((Date.now() - ingestedAt) / 1000);
}

/** Check if KV entry is stale based on max age */
export function isStale(meta: KVSafetyMetadata, maxAgeSeconds: number): boolean {
  return getAgeSeconds(meta) > maxAgeSeconds;
}
