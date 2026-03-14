import type { DataMeta } from '@/lib/types/data-meta';

export interface DataMetaLike extends Partial<DataMeta> {
  source?: string;
  fetched_at?: string;
}

export interface NormalizedDataMeta {
  source: string;
  sources: string[];
  lastUpdated: string | null;
  timezone: string;
  degraded: boolean;
}

interface NormalizeOptions {
  source?: string;
  sources?: string[];
  lastUpdated?: string | null;
  timezone?: string;
  degraded?: boolean;
}

const DEFAULT_TIMEZONE = 'America/Chicago';

type AnyDataMeta = DataMetaLike | NormalizedDataMeta;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function hasAnyOption(o: NormalizeOptions): boolean {
  return !!(o.source || o.sources?.length || o.lastUpdated != null || o.timezone !== undefined || o.degraded !== undefined);
}

export function normalizeDataMeta(
  meta?: AnyDataMeta | null,
  options: NormalizeOptions = {},
): NormalizedDataMeta | null {
  if (!meta && !hasAnyOption(options)) {
    return null;
  }

  const sources = (meta?.sources ?? options.sources ?? []).filter(
    (value): value is string => Boolean(value?.trim()),
  );
  const canonicalSource = meta && 'dataSource' in meta ? getStringValue(meta.dataSource) : null;
  const legacyLastUpdated = meta && 'fetched_at' in meta ? getStringValue(meta.fetched_at) : null;
  const source = canonicalSource ?? meta?.source ?? sources[0] ?? options.source ?? '';
  const lastUpdated = meta?.lastUpdated ?? legacyLastUpdated ?? options.lastUpdated ?? null;
  const timezone = meta?.timezone ?? options.timezone ?? DEFAULT_TIMEZONE;
  const degraded = Boolean(meta?.degraded ?? options.degraded);

  return {
    source,
    sources: sources.length ? sources : source ? [source] : [],
    lastUpdated,
    timezone,
    degraded,
  };
}

export function getDataSourceLabel(
  meta?: AnyDataMeta | null,
  fallbackSource: string = 'Blaze Sports Intel',
): string {
  if (!meta) return fallbackSource;

  if ('source' in meta && meta.source) return meta.source;
  if ('dataSource' in meta && meta.dataSource) return meta.dataSource;
  if ('sources' in meta && Array.isArray(meta.sources) && meta.sources.length > 0) {
    return meta.sources.join(' + ');
  }

  return fallbackSource;
}

export function extractDataMeta(
  payload: unknown,
  options: NormalizeOptions = {},
): NormalizedDataMeta | null {
  if (!isRecord(payload)) {
    return normalizeDataMeta(undefined, options);
  }

  const meta = isRecord(payload.meta) ? (payload.meta as DataMetaLike) : null;

  return normalizeDataMeta(meta, {
    source: getStringValue(payload.dataSource) ?? getStringValue(payload.source) ?? options.source,
    sources: getStringArray(payload.sources) ?? options.sources,
    lastUpdated:
      getStringValue(payload.lastUpdated) ??
      getStringValue(payload.fetched_at) ??
      getStringValue(payload.timestamp) ??
      getStringValue(payload.cacheTime) ??
      options.lastUpdated,
    timezone: getStringValue(payload.timezone) ?? options.timezone,
    degraded: typeof payload.degraded === 'boolean' ? payload.degraded : options.degraded,
  });
}

export function toDataMeta(meta?: AnyDataMeta | null): DataMeta | null {
  const normalized = normalizeDataMeta(meta);
  if (!normalized) return null;

  const lastUpdated = normalized.lastUpdated ?? '';

  return {
    dataSource: normalized.source,
    source: normalized.source,
    lastUpdated,
    fetched_at: lastUpdated,
    timezone: normalized.timezone,
    degraded: normalized.degraded,
    sources: normalized.sources,
  };
}
