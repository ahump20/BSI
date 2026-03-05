/**
 * Metadata returned by BSI API endpoints alongside data payloads.
 *
 * Some APIs use `source`/`fetched_at` (ESPN-style), others use
 * `dataSource`/`lastUpdated` (SportsDataIO-style). Both are accepted.
 */
export interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
  /** ESPN-style field aliases (backward compat) */
  source?: string;
  fetched_at?: string;
  /** Indicates data source is partially unavailable */
  degraded?: boolean;
  /** Multiple data sources contributing to this response */
  sources?: string[];
  /** Allow additional API-specific fields */
  [key: string]: unknown;
}
