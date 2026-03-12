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

export function normalizeDataMeta(
  meta?: DataMetaLike | null,
  options: NormalizeOptions = {},
): NormalizedDataMeta | null {
  if (!meta && !options.source && !options.lastUpdated && !options.sources?.length) {
    return null;
  }

  const sources = (meta?.sources ?? options.sources ?? []).filter(
    (value): value is string => Boolean(value?.trim()),
  );
  const source = meta?.dataSource ?? meta?.source ?? sources[0] ?? options.source ?? '';
  const lastUpdated = meta?.lastUpdated ?? meta?.fetched_at ?? options.lastUpdated ?? null;
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
  meta?: DataMetaLike | NormalizedDataMeta | null,
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

