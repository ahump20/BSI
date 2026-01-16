'use client';

/**
 * Data Transparency Components
 *
 * Comprehensive data attribution system for Blaze Sports Intel.
 * Every data view must cite its source with timestamp per BSI policy.
 *
 * Components:
 * - DataSourceBadge: Inline source attribution
 * - DataFreshnessIndicator: Visual data age indicator
 * - DataSourcePanel: Expandable detailed source info
 * - CitationFooter: Page-level attribution footer
 *
 * Last Updated: 2025-01-07
 */

import { useState } from 'react';
import { Info, Clock, Database, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface DataSource {
  /** Primary source name (e.g., "MLB Stats API", "ESPN") */
  name: string;
  /** Optional source URL */
  url?: string;
  /** ISO timestamp when data was fetched */
  fetchedAt: string;
  /** Optional description of what data comes from this source */
  description?: string;
}

export interface DataMeta {
  sources: DataSource[];
  lastUpdated: string;
  refreshInterval?: number; // seconds
  timezone?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate data age and return appropriate status
 */
function getDataFreshness(fetchedAt: string): {
  status: 'fresh' | 'stale' | 'old';
  label: string;
  minutes: number;
} {
  const now = new Date();
  const fetched = new Date(fetchedAt);
  const minutes = Math.floor((now.getTime() - fetched.getTime()) / 60000);

  if (minutes < 5) {
    return { status: 'fresh', label: 'Just updated', minutes };
  } else if (minutes < 30) {
    return { status: 'fresh', label: `${minutes}m ago`, minutes };
  } else if (minutes < 60) {
    return { status: 'stale', label: `${minutes}m ago`, minutes };
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return { status: 'stale', label: `${hours}h ago`, minutes };
  } else {
    const days = Math.floor(minutes / 1440);
    return { status: 'old', label: `${days}d ago`, minutes };
  }
}

/**
 * Format timestamp in Central Time
 */
function formatTimestamp(isoString: string, format: 'full' | 'time' | 'date' = 'full'): string {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Chicago',
  };

  if (format === 'date' || format === 'full') {
    options.month = 'short';
    options.day = 'numeric';
    options.year = 'numeric';
  }

  if (format === 'time' || format === 'full') {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }

  return date.toLocaleString('en-US', options);
}

// ============================================================================
// DataFreshnessIndicator
// ============================================================================

interface DataFreshnessIndicatorProps {
  fetchedAt: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Visual indicator of data freshness with colored dot
 */
export function DataFreshnessIndicator({
  fetchedAt,
  showLabel = true,
  size = 'sm',
  className = '',
}: DataFreshnessIndicatorProps) {
  const { status, label } = getDataFreshness(fetchedAt);

  const colors = {
    fresh: 'bg-success',
    stale: 'bg-warning',
    old: 'bg-error',
  };

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`${dotSize} ${colors[status]} rounded-full ${status === 'fresh' ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {showLabel && <span className={`${textSize} text-text-tertiary`}>{label}</span>}
    </span>
  );
}

// ============================================================================
// DataSourceBadgeInline
// ============================================================================

interface DataSourceBadgeInlineProps {
  source: string;
  url?: string;
  fetchedAt?: string;
  showFreshness?: boolean;
  className?: string;
}

/**
 * Inline badge showing data source with optional link and freshness
 */
export function DataSourceBadgeInline({
  source,
  url,
  fetchedAt,
  showFreshness = true,
  className = '',
}: DataSourceBadgeInlineProps) {
  const content = (
    <span className={`inline-flex items-center gap-1.5 text-xs text-text-tertiary ${className}`}>
      <Database className="w-3 h-3" aria-hidden="true" />
      <span>{source}</span>
      {url && <ExternalLink className="w-3 h-3" aria-hidden="true" />}
      {fetchedAt && showFreshness && (
        <>
          <span className="text-text-tertiary/50">•</span>
          <DataFreshnessIndicator fetchedAt={fetchedAt} size="sm" />
        </>
      )}
    </span>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-burnt-orange transition-colors"
        aria-label={`View source: ${source}`}
      >
        {content}
      </a>
    );
  }

  return content;
}

// ============================================================================
// DataSourcePanel
// ============================================================================

interface DataSourcePanelProps {
  sources: DataSource[];
  lastUpdated: string;
  refreshInterval?: number;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Expandable panel showing detailed data source information
 */
export function DataSourcePanel({
  sources,
  lastUpdated,
  refreshInterval,
  defaultExpanded = false,
  className = '',
}: DataSourcePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { status: _status } = getDataFreshness(lastUpdated);

  return (
    <div className={`border border-border-subtle rounded-lg overflow-hidden ${className}`}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-charcoal/50 hover:bg-charcoal transition-colors text-left"
        aria-expanded={isExpanded}
        aria-controls="data-source-details"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
          <span className="text-sm text-text-secondary">Data Sources</span>
          <DataFreshnessIndicator fetchedAt={lastUpdated} size="sm" />
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div id="data-source-details" className="p-4 bg-charcoal/30 space-y-4">
          {/* Update Info */}
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              Last updated: {formatTimestamp(lastUpdated)}
            </span>
            {refreshInterval && (
              <span className="text-text-tertiary/70">
                Refreshes every{' '}
                {refreshInterval < 60
                  ? `${refreshInterval}s`
                  : `${Math.floor(refreshInterval / 60)}m`}
              </span>
            )}
          </div>

          {/* Sources List */}
          <div className="space-y-3">
            {sources.map((source, index) => (
              <div
                key={index}
                className="flex items-start gap-3 pl-2 border-l-2 border-border-subtle"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-white hover:text-burnt-orange transition-colors flex items-center gap-1"
                      >
                        {source.name}
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-white">{source.name}</span>
                    )}
                    <DataFreshnessIndicator fetchedAt={source.fetchedAt} showLabel={false} />
                  </div>
                  {source.description && (
                    <p className="text-xs text-text-tertiary mt-0.5">{source.description}</p>
                  )}
                  <p className="text-xs text-text-tertiary/70 mt-0.5">
                    Fetched: {formatTimestamp(source.fetchedAt, 'time')} CT
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Methodology Note */}
          <p className="text-xs text-text-tertiary/70 pt-2 border-t border-border-subtle">
            BSI verifies data from multiple sources. Statistics updated per official league
            schedules.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Enhanced CitationFooter
// ============================================================================

interface CitationFooterProps {
  /** Primary data source */
  source: string;
  /** ISO timestamp when data was fetched */
  fetchedAt: string;
  /** Additional sources (optional) */
  additionalSources?: string[];
  /** Source URL (optional) */
  sourceUrl?: string;
  /** Show freshness indicator */
  showFreshness?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Page-level citation footer with source attribution
 */
export function CitationFooter({
  source,
  fetchedAt,
  additionalSources,
  sourceUrl,
  showFreshness = true,
  className = '',
}: CitationFooterProps) {
  const dateStr = formatTimestamp(fetchedAt, 'date');
  const timeStr = formatTimestamp(fetchedAt, 'time');

  const allSources = additionalSources ? [source, ...additionalSources].join(', ') : source;

  return (
    <footer
      className={`p-4 text-center border-t border-border-subtle ${className}`.trim()}
      role="contentinfo"
      aria-label="Data source attribution"
    >
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {showFreshness && <DataFreshnessIndicator fetchedAt={fetchedAt} />}
        <span className="text-[11px] text-text-tertiary">
          Data:{' '}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-burnt-orange transition-colors"
            >
              {allSources}
            </a>
          ) : (
            <span className="text-text-secondary">{allSources}</span>
          )}
        </span>
        <span className="text-[11px] text-text-tertiary/50">|</span>
        <span className="text-[11px] text-text-tertiary">
          {dateStr} {timeStr} CT
        </span>
      </div>
    </footer>
  );
}

// ============================================================================
// DataDisclaimer
// ============================================================================

interface DataDisclaimerProps {
  className?: string;
}

/**
 * Standard data disclaimer for analytics pages
 */
export function DataDisclaimer({ className = '' }: DataDisclaimerProps) {
  return (
    <p className={`text-xs text-text-tertiary/70 text-center ${className}`}>
      Statistics compiled from official league sources. Projections and analytics are for
      informational purposes only. Past performance does not guarantee future results.
    </p>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default CitationFooter;
