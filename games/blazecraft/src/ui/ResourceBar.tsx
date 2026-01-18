/**
 * ResourceBar - Displays current resources with trends
 *
 * Shows: Intel, Influence, Momentum with up/down indicators
 * Also displays analyst availability count
 */

import React from 'react';
import type { Resources, ResourceType } from '@core/ResourceSystem';
import { getResourceTrend, ResourceEvent } from '@core/ResourceSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ResourceBarProps {
  resources: Resources;
  history: ResourceEvent[];
  analystCount: { idle: number; total: number };
  onResourceClick?: (resource: ResourceType) => void;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem 1rem',
    background: '#1A1A1A',
    borderBottom: '1px solid #333',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.75rem',
    background: '#0D0D0D',
    borderRadius: '4px',
    border: '1px solid #333',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  resourceItemHover: {
    borderColor: '#555',
    background: '#1A1A1A',
  },
  resourceIcon: {
    fontSize: '1rem',
    width: '20px',
    textAlign: 'center' as const,
  },
  resourceValue: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#F5F5DC',
    minWidth: '45px',
  },
  resourceLabel: {
    fontSize: '0.65rem',
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  trendUp: {
    color: '#2ECC71',
    fontSize: '0.7rem',
    marginLeft: '0.25rem',
  },
  trendDown: {
    color: '#E74C3C',
    fontSize: '0.7rem',
    marginLeft: '0.25rem',
  },
  trendStable: {
    color: '#888',
    fontSize: '0.7rem',
    marginLeft: '0.25rem',
  },
  divider: {
    width: '1px',
    height: '24px',
    background: '#333',
    margin: '0 0.5rem',
  },
  analystSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.75rem',
    background: '#0D0D0D',
    borderRadius: '4px',
    border: '1px solid #333',
    marginLeft: 'auto',
  },
  analystIcon: {
    fontSize: '0.9rem',
  },
  analystText: {
    fontSize: '0.75rem',
    color: '#888',
  },
  analystCount: {
    fontWeight: 600,
    color: '#F5F5DC',
  },
};

// ─────────────────────────────────────────────────────────────
// Resource Config
// ─────────────────────────────────────────────────────────────

const RESOURCE_CONFIG: Record<ResourceType, {
  icon: string;
  label: string;
  color: string;
}> = {
  intel: {
    icon: '🔍',
    label: 'Intel',
    color: '#3498DB',
  },
  influence: {
    icon: '⭐',
    label: 'Influence',
    color: '#9B59B6',
  },
  momentum: {
    icon: '⚡',
    label: 'Momentum',
    color: '#E67E22',
  },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function ResourceBar({
  resources,
  history,
  analystCount,
  onResourceClick,
}: ResourceBarProps): React.ReactElement {
  const [hoveredResource, setHoveredResource] = React.useState<ResourceType | null>(null);

  const resourceTypes: ResourceType[] = ['intel', 'influence', 'momentum'];

  function getTrendIndicator(resource: ResourceType): React.ReactNode {
    const trend = getResourceTrend(history, resource);
    switch (trend) {
      case 'up':
        return <span style={styles.trendUp}>▲</span>;
      case 'down':
        return <span style={styles.trendDown}>▼</span>;
      default:
        return <span style={styles.trendStable}>→</span>;
    }
  }

  return (
    <div id="resource-bar" style={styles.container}>
      {resourceTypes.map((type) => {
        const config = RESOURCE_CONFIG[type];
        const isHovered = hoveredResource === type;

        return (
          <div
            key={type}
            style={{
              ...styles.resourceItem,
              ...(isHovered ? styles.resourceItemHover : {}),
              borderColor: isHovered ? config.color : '#333',
            }}
            onClick={() => onResourceClick?.(type)}
            onMouseEnter={() => setHoveredResource(type)}
            onMouseLeave={() => setHoveredResource(null)}
          >
            <span style={styles.resourceIcon}>{config.icon}</span>
            <div>
              <div style={styles.resourceValue}>
                {resources[type].toLocaleString()}
                {getTrendIndicator(type)}
              </div>
              <div style={{ ...styles.resourceLabel, color: config.color }}>
                {config.label}
              </div>
            </div>
          </div>
        );
      })}

      <div style={styles.divider} />

      <div style={styles.analystSection}>
        <span style={styles.analystIcon}>👤</span>
        <span style={styles.analystText}>
          Analysts:{' '}
          <span style={styles.analystCount}>
            {analystCount.idle}/{analystCount.total}
          </span>{' '}
          idle
        </span>
      </div>
    </div>
  );
}

export default ResourceBar;
