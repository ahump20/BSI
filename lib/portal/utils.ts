/**
 * Transfer Portal Utilities
 *
 * Helper functions for portal data manipulation, formatting, and filtering.
 */

import type { PortalEntry, PortalSport, PortalStatus, PortalStats } from './types';

/**
 * Format a timestamp as relative time ("Updated 30s ago", "Updated 5m ago")
 */
export function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format portal entry date for display
 */
export function formatPortalDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });
}

/**
 * Calculate days in portal
 */
export function getDaysInPortal(portalDate: string): number {
  const entered = new Date(portalDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - entered.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get status display label
 */
export function getStatusLabel(status: PortalStatus): string {
  const labels: Record<PortalStatus, string> = {
    in_portal: 'In Portal',
    committed: 'Committed',
    withdrawn: 'Withdrawn',
    signed: 'Signed',
  };
  return labels[status];
}

/**
 * Get status color class
 */
export function getStatusColor(status: PortalStatus): string {
  const colors: Record<PortalStatus, string> = {
    in_portal: 'text-warning bg-warning/20 border-warning/30',
    committed: 'text-success bg-success/20 border-success/30',
    withdrawn: 'text-error bg-error/20 border-error/30',
    signed: 'text-burnt-orange bg-burnt-orange/20 border-burnt-orange/30',
  };
  return colors[status];
}

/**
 * Calculate engagement level
 */
export function getEngagementLevel(score?: number): 'hot' | 'warm' | 'cold' | 'none' {
  if (!score) return 'none';
  if (score >= 85) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

/**
 * Get engagement badge text
 */
export function getEngagementBadge(score?: number): string | null {
  const level = getEngagementLevel(score);
  if (level === 'hot') return '🔥 Hot';
  if (level === 'warm') return '📈 Trending';
  return null;
}

/**
 * Format baseball stat for display
 */
export function formatBaseballStat(
  value: number | undefined,
  type: 'avg' | 'era' | 'ip' | 'count'
): string {
  if (value === undefined) return '—';
  switch (type) {
    case 'avg':
      return value.toFixed(3).replace(/^0/, '');
    case 'era':
      return value.toFixed(2);
    case 'ip':
      return value.toFixed(1);
    default:
      return String(value);
  }
}

/**
 * Compute portal statistics from entries
 */
export function computePortalStats(entries: PortalEntry[]): PortalStats {
  const stats: PortalStats = {
    total: entries.length,
    in_portal: 0,
    committed: 0,
    withdrawn: 0,
    signed: 0,
    by_conference: {},
    by_position: {},
    trending_up: [],
    recent_commits: [],
  };

  for (const entry of entries) {
    // Count by status
    stats[entry.status]++;

    // Count by conference
    stats.by_conference[entry.conference] = (stats.by_conference[entry.conference] || 0) + 1;

    // Count by position (simplified)
    const posGroup = entry.position.includes('P') ? 'Pitcher' : entry.position;
    stats.by_position[posGroup] = (stats.by_position[posGroup] || 0) + 1;
  }

  // Get trending (high engagement, still in portal)
  stats.trending_up = entries
    .filter((e) => e.status === 'in_portal' && (e.engagement_score || 0) >= 75)
    .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
    .slice(0, 5);

  // Get recent commits
  stats.recent_commits = entries
    .filter((e) => e.status === 'committed')
    .sort(
      (a, b) =>
        new Date(b.commitment_date || b.portal_date).getTime() -
        new Date(a.commitment_date || a.portal_date).getTime()
    )
    .slice(0, 5);

  return stats;
}

/**
 * Filter entries based on criteria
 */
export function filterEntries(
  entries: PortalEntry[],
  filters: {
    position?: string;
    conference?: string;
    status?: PortalStatus;
    search?: string;
    minStars?: number;
    verified?: boolean;
  }
): PortalEntry[] {
  return entries.filter((entry) => {
    if (filters.position && !entry.position.includes(filters.position)) return false;
    if (filters.conference && entry.conference !== filters.conference) return false;
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.minStars && (entry.stars || 0) < filters.minStars) return false;
    if (filters.verified !== undefined && entry.verified !== filters.verified) return false;
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const searchable = [
        entry.player_name,
        entry.school_from,
        entry.school_to,
        entry.position,
        entry.conference,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
}

/**
 * Get current portal window for a sport
 */
export function getCurrentPortalWindow(
  sport: PortalSport
): { name: string; start: string; end: string; active: boolean } | null {
  const windows =
    sport === 'baseball'
      ? [
          { name: 'Winter Window', start: '2025-12-09', end: '2026-01-15' },
          { name: 'Spring Window', start: '2025-05-01', end: '2025-05-15' },
          { name: 'Main Window', start: '2025-06-02', end: '2025-08-01' },
        ]
      : [
          { name: 'Winter Window', start: '2025-12-09', end: '2026-01-15' },
          { name: 'Spring Window', start: '2026-04-16', end: '2026-04-30' },
        ];

  const now = new Date();

  for (const window of windows) {
    const start = new Date(window.start);
    const end = new Date(window.end);

    if (now >= start && now <= end) {
      return { ...window, active: true };
    }
  }

  // Return next upcoming window
  const upcoming = windows
    .filter((w) => new Date(w.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];

  if (upcoming) {
    return { ...upcoming, active: false };
  }

  return null;
}

/**
 * Sort entries by specified field
 */
export function sortEntries(
  entries: PortalEntry[],
  sortBy: 'date' | 'engagement' | 'stars' | 'name',
  order: 'asc' | 'desc' = 'desc'
): PortalEntry[] {
  const sorted = [...entries].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.portal_date).getTime() - new Date(b.portal_date).getTime();
        break;
      case 'engagement':
        comparison = (a.engagement_score || 0) - (b.engagement_score || 0);
        break;
      case 'stars':
        comparison = (a.stars || 0) - (b.stars || 0);
        break;
      case 'name':
        comparison = a.player_name.localeCompare(b.player_name);
        break;
    }
    return order === 'desc' ? -comparison : comparison;
  });
  return sorted;
}
